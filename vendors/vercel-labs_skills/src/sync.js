"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSync = runSync;
exports.parseSyncOptions = parseSyncOptions;
const p = require("@clack/prompts");
const picocolors_1 = require("picocolors");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const skills_ts_1 = require("./skills.ts");
const installer_ts_1 = require("./installer.ts");
const agents_ts_1 = require("./agents.ts");
const search_multiselect_ts_1 = require("./prompts/search-multiselect.ts");
const local_lock_ts_1 = require("./local-lock.ts");
const telemetry_ts_1 = require("./telemetry.ts");
const isCancelled = (value) => typeof value === 'symbol';
/**
 * Shortens a path for display: replaces homedir with ~ and cwd with .
 */
function shortenPath(fullPath, cwd) {
    const home = (0, os_1.homedir)();
    if (fullPath === home || fullPath.startsWith(home + path_1.sep)) {
        return '~' + fullPath.slice(home.length);
    }
    if (fullPath === cwd || fullPath.startsWith(cwd + path_1.sep)) {
        return '.' + fullPath.slice(cwd.length);
    }
    return fullPath;
}
/**
 * Crawl node_modules for SKILL.md files.
 * Searches both top-level packages and scoped packages (@org/pkg).
 * Returns discovered skills with their source package name.
 */
async function discoverNodeModuleSkills(cwd) {
    const nodeModulesDir = (0, path_1.join)(cwd, 'node_modules');
    const skills = [];
    let topNames;
    try {
        topNames = await (0, promises_1.readdir)(nodeModulesDir);
    }
    catch {
        return skills;
    }
    const processPackageDir = async (pkgDir, packageName) => {
        // Check for SKILL.md at package root
        const rootSkill = await (0, skills_ts_1.parseSkillMd)((0, path_1.join)(pkgDir, 'SKILL.md'));
        if (rootSkill) {
            skills.push({ ...rootSkill, packageName });
            return;
        }
        // Check common skill locations within the package
        const searchDirs = [pkgDir, (0, path_1.join)(pkgDir, 'skills'), (0, path_1.join)(pkgDir, '.agents', 'skills')];
        for (const searchDir of searchDirs) {
            try {
                const entries = await (0, promises_1.readdir)(searchDir);
                for (const name of entries) {
                    const skillDir = (0, path_1.join)(searchDir, name);
                    try {
                        const s = await (0, promises_1.stat)(skillDir);
                        if (!s.isDirectory())
                            continue;
                    }
                    catch {
                        continue;
                    }
                    const skill = await (0, skills_ts_1.parseSkillMd)((0, path_1.join)(skillDir, 'SKILL.md'));
                    if (skill) {
                        skills.push({ ...skill, packageName });
                    }
                }
            }
            catch {
                // Directory doesn't exist
            }
        }
    };
    await Promise.all(topNames.map(async (name) => {
        if (name.startsWith('.'))
            return;
        const fullPath = (0, path_1.join)(nodeModulesDir, name);
        try {
            const s = await (0, promises_1.stat)(fullPath);
            if (!s.isDirectory())
                return;
        }
        catch {
            return;
        }
        if (name.startsWith('@')) {
            // Scoped package: read @org/* entries
            try {
                const scopeNames = await (0, promises_1.readdir)(fullPath);
                await Promise.all(scopeNames.map(async (scopedName) => {
                    const scopedPath = (0, path_1.join)(fullPath, scopedName);
                    try {
                        const s = await (0, promises_1.stat)(scopedPath);
                        if (!s.isDirectory())
                            return;
                    }
                    catch {
                        return;
                    }
                    await processPackageDir(scopedPath, `${name}/${scopedName}`);
                }));
            }
            catch {
                // Scope directory not readable
            }
        }
        else {
            await processPackageDir(fullPath, name);
        }
    }));
    return skills;
}
async function runSync(args, options = {}) {
    const cwd = process.cwd();
    console.log();
    p.intro(picocolors_1.default.bgCyan(picocolors_1.default.black(' skills experimental_sync ')));
    const spinner = p.spinner();
    // 1. Discover skills from node_modules
    spinner.start('Scanning node_modules for skills...');
    const discoveredSkills = await discoverNodeModuleSkills(cwd);
    if (discoveredSkills.length === 0) {
        spinner.stop(picocolors_1.default.yellow('No skills found'));
        p.outro(picocolors_1.default.dim('No SKILL.md files found in node_modules.'));
        return;
    }
    spinner.stop(`Found ${picocolors_1.default.green(String(discoveredSkills.length))} skill${discoveredSkills.length > 1 ? 's' : ''} in node_modules`);
    // Show discovered skills
    for (const skill of discoveredSkills) {
        p.log.info(`${picocolors_1.default.cyan(skill.name)} ${picocolors_1.default.dim(`from ${skill.packageName}`)}`);
        if (skill.description) {
            p.log.message(picocolors_1.default.dim(`  ${skill.description}`));
        }
    }
    // 2. Check which skills are already up-to-date via local lock
    const localLock = await (0, local_lock_ts_1.readLocalLock)(cwd);
    const toInstall = [];
    const upToDate = [];
    if (options.force) {
        toInstall.push(...discoveredSkills);
        p.log.info(picocolors_1.default.dim('Force mode: reinstalling all skills'));
    }
    else {
        for (const skill of discoveredSkills) {
            const existingEntry = localLock.skills[skill.name];
            if (existingEntry) {
                // Compute current hash and compare
                const currentHash = await (0, local_lock_ts_1.computeSkillFolderHash)(skill.path);
                if (currentHash === existingEntry.computedHash) {
                    upToDate.push(skill.name);
                    continue;
                }
            }
            toInstall.push(skill);
        }
        if (upToDate.length > 0) {
            p.log.info(picocolors_1.default.dim(`${upToDate.length} skill${upToDate.length !== 1 ? 's' : ''} already up to date`));
        }
        if (toInstall.length === 0) {
            console.log();
            p.outro(picocolors_1.default.green('All skills are up to date.'));
            return;
        }
    }
    p.log.info(`${toInstall.length} skill${toInstall.length !== 1 ? 's' : ''} to install/update`);
    // 3. Select agents
    let targetAgents;
    const validAgents = Object.keys(agents_ts_1.agents);
    const universalAgents = (0, agents_ts_1.getUniversalAgents)();
    if (options.agent?.includes('*')) {
        targetAgents = validAgents;
        p.log.info(`Installing to all ${targetAgents.length} agents`);
    }
    else if (options.agent && options.agent.length > 0) {
        const invalidAgents = options.agent.filter((a) => !validAgents.includes(a));
        if (invalidAgents.length > 0) {
            p.log.error(`Invalid agents: ${invalidAgents.join(', ')}`);
            p.log.info(`Valid agents: ${validAgents.join(', ')}`);
            process.exit(1);
        }
        targetAgents = options.agent;
    }
    else {
        spinner.start('Loading agents...');
        const installedAgents = await (0, agents_ts_1.detectInstalledAgents)();
        const totalAgents = Object.keys(agents_ts_1.agents).length;
        spinner.stop(`${totalAgents} agents`);
        if (installedAgents.length === 0) {
            if (options.yes) {
                targetAgents = universalAgents;
                p.log.info('Installing to universal agents');
            }
            else {
                const otherAgents = (0, agents_ts_1.getNonUniversalAgents)();
                const otherChoices = otherAgents.map((a) => ({
                    value: a,
                    label: agents_ts_1.agents[a].displayName,
                    hint: agents_ts_1.agents[a].skillsDir,
                }));
                const selected = await (0, search_multiselect_ts_1.searchMultiselect)({
                    message: 'Which agents do you want to install to?',
                    items: otherChoices,
                    initialSelected: [],
                    lockedSection: {
                        title: 'Universal (.agents/skills)',
                        items: universalAgents.map((a) => ({
                            value: a,
                            label: agents_ts_1.agents[a].displayName,
                        })),
                    },
                });
                if (isCancelled(selected)) {
                    p.cancel('Sync cancelled');
                    process.exit(0);
                }
                targetAgents = selected;
            }
        }
        else if (installedAgents.length === 1 || options.yes) {
            // Ensure universal agents are included
            targetAgents = [...installedAgents];
            for (const ua of universalAgents) {
                if (!targetAgents.includes(ua)) {
                    targetAgents.push(ua);
                }
            }
        }
        else {
            const otherAgents = (0, agents_ts_1.getNonUniversalAgents)().filter((a) => installedAgents.includes(a));
            const otherChoices = otherAgents.map((a) => ({
                value: a,
                label: agents_ts_1.agents[a].displayName,
                hint: agents_ts_1.agents[a].skillsDir,
            }));
            const selected = await (0, search_multiselect_ts_1.searchMultiselect)({
                message: 'Which agents do you want to install to?',
                items: otherChoices,
                initialSelected: installedAgents.filter((a) => !universalAgents.includes(a)),
                lockedSection: {
                    title: 'Universal (.agents/skills)',
                    items: universalAgents.map((a) => ({
                        value: a,
                        label: agents_ts_1.agents[a].displayName,
                    })),
                },
            });
            if (isCancelled(selected)) {
                p.cancel('Sync cancelled');
                process.exit(0);
            }
            targetAgents = selected;
        }
    }
    // 4. Build summary
    const summaryLines = [];
    for (const skill of toInstall) {
        const canonicalPath = (0, installer_ts_1.getCanonicalPath)(skill.name, { global: false });
        const shortCanonical = shortenPath(canonicalPath, cwd);
        summaryLines.push(`${picocolors_1.default.cyan(skill.name)} ${picocolors_1.default.dim(`← ${skill.packageName}`)}`);
        summaryLines.push(`  ${picocolors_1.default.dim(shortCanonical)}`);
    }
    console.log();
    p.note(summaryLines.join('\n'), 'Sync Summary');
    if (!options.yes) {
        const confirmed = await p.confirm({ message: 'Proceed with sync?' });
        if (p.isCancel(confirmed) || !confirmed) {
            p.cancel('Sync cancelled');
            process.exit(0);
        }
    }
    // 5. Install skills (always project-scoped, always symlink)
    spinner.start('Syncing skills...');
    const results = [];
    for (const skill of toInstall) {
        for (const agent of targetAgents) {
            const result = await (0, installer_ts_1.installSkillForAgent)(skill, agent, {
                global: false,
                cwd,
                mode: 'symlink',
            });
            results.push({
                skill: skill.name,
                packageName: skill.packageName,
                agent: agents_ts_1.agents[agent].displayName,
                success: result.success,
                path: result.path,
                canonicalPath: result.canonicalPath,
                error: result.error,
            });
        }
    }
    spinner.stop('Sync complete');
    // 6. Update local lock file
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const successfulSkillNames = new Set(successful.map((r) => r.skill));
    for (const skill of toInstall) {
        if (successfulSkillNames.has(skill.name)) {
            try {
                const computedHash = await (0, local_lock_ts_1.computeSkillFolderHash)(skill.path);
                await (0, local_lock_ts_1.addSkillToLocalLock)(skill.name, {
                    source: skill.packageName,
                    sourceType: 'node_modules',
                    computedHash,
                }, cwd);
            }
            catch {
                // Don't fail sync if lock file update fails
            }
        }
    }
    // 7. Display results
    console.log();
    if (successful.length > 0) {
        const bySkill = new Map();
        for (const r of successful) {
            const skillResults = bySkill.get(r.skill) || [];
            skillResults.push(r);
            bySkill.set(r.skill, skillResults);
        }
        const resultLines = [];
        for (const [skillName, skillResults] of bySkill) {
            const firstResult = skillResults[0];
            const pkg = toInstall.find((s) => s.name === skillName)?.packageName;
            if (firstResult.canonicalPath) {
                const shortPath = shortenPath(firstResult.canonicalPath, cwd);
                resultLines.push(`${picocolors_1.default.green('✓')} ${skillName} ${picocolors_1.default.dim(`← ${pkg}`)}`);
                resultLines.push(`  ${picocolors_1.default.dim(shortPath)}`);
            }
            else {
                resultLines.push(`${picocolors_1.default.green('✓')} ${skillName} ${picocolors_1.default.dim(`← ${pkg}`)}`);
            }
        }
        const skillCount = bySkill.size;
        const title = picocolors_1.default.green(`Synced ${skillCount} skill${skillCount !== 1 ? 's' : ''}`);
        p.note(resultLines.join('\n'), title);
    }
    if (failed.length > 0) {
        console.log();
        p.log.error(picocolors_1.default.red(`Failed to install ${failed.length}`));
        for (const r of failed) {
            p.log.message(`  ${picocolors_1.default.red('✗')} ${r.skill} → ${r.agent}: ${picocolors_1.default.dim(r.error)}`);
        }
    }
    // Track telemetry
    (0, telemetry_ts_1.track)({
        event: 'experimental_sync',
        skillCount: String(toInstall.length),
        successCount: String(successfulSkillNames.size),
        agents: targetAgents.join(','),
    });
    console.log();
    p.outro(picocolors_1.default.green('Done!') + picocolors_1.default.dim('  Review skills before use; they run with full agent permissions.'));
}
function parseSyncOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-y' || arg === '--yes') {
            options.yes = true;
        }
        else if (arg === '-f' || arg === '--force') {
            options.force = true;
        }
        else if (arg === '-a' || arg === '--agent') {
            options.agent = options.agent || [];
            i++;
            let nextArg = args[i];
            while (i < args.length && nextArg && !nextArg.startsWith('-')) {
                options.agent.push(nextArg);
                i++;
                nextArg = args[i];
            }
            i--;
        }
    }
    return { options };
}
//# sourceMappingURL=sync.js.map