"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCommand = removeCommand;
exports.parseRemoveOptions = parseRemoveOptions;
const p = require("@clack/prompts");
const picocolors_1 = require("picocolors");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const agents_ts_1 = require("./agents.ts");
const telemetry_ts_1 = require("./telemetry.ts");
const skill_lock_ts_1 = require("./skill-lock.ts");
const installer_ts_1 = require("./installer.ts");
async function removeCommand(skillNames, options) {
    const isGlobal = options.global ?? false;
    const cwd = process.cwd();
    const spinner = p.spinner();
    spinner.start('Scanning for installed skills...');
    const skillNamesSet = new Set();
    const scanDir = async (dir) => {
        try {
            const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    skillNamesSet.add(entry.name);
                }
            }
        }
        catch (err) {
            if (err instanceof Error && err.code !== 'ENOENT') {
                p.log.warn(`Could not scan directory ${dir}: ${err.message}`);
            }
        }
    };
    if (isGlobal) {
        await scanDir((0, installer_ts_1.getCanonicalSkillsDir)(true, cwd));
        for (const agent of Object.values(agents_ts_1.agents)) {
            if (agent.globalSkillsDir !== undefined) {
                await scanDir(agent.globalSkillsDir);
            }
        }
    }
    else {
        await scanDir((0, installer_ts_1.getCanonicalSkillsDir)(false, cwd));
        for (const agent of Object.values(agents_ts_1.agents)) {
            await scanDir((0, path_1.join)(cwd, agent.skillsDir));
        }
    }
    const installedSkills = Array.from(skillNamesSet).sort();
    spinner.stop(`Found ${installedSkills.length} unique installed skill(s)`);
    if (installedSkills.length === 0) {
        p.outro(picocolors_1.default.yellow('No skills found to remove.'));
        return;
    }
    // Validate agent options BEFORE prompting for skill selection
    if (options.agent && options.agent.length > 0) {
        const validAgents = Object.keys(agents_ts_1.agents);
        const invalidAgents = options.agent.filter((a) => !validAgents.includes(a));
        if (invalidAgents.length > 0) {
            p.log.error(`Invalid agents: ${invalidAgents.join(', ')}`);
            p.log.info(`Valid agents: ${validAgents.join(', ')}`);
            process.exit(1);
        }
    }
    let selectedSkills = [];
    if (options.all) {
        selectedSkills = installedSkills;
    }
    else if (skillNames.length > 0) {
        selectedSkills = installedSkills.filter((s) => skillNames.some((name) => name.toLowerCase() === s.toLowerCase()));
        if (selectedSkills.length === 0) {
            p.log.error(`No matching skills found for: ${skillNames.join(', ')}`);
            return;
        }
    }
    else {
        const choices = installedSkills.map((s) => ({
            value: s,
            label: s,
        }));
        const selected = await p.multiselect({
            message: `Select skills to remove ${picocolors_1.default.dim('(space to toggle)')}`,
            options: choices,
            required: true,
        });
        if (p.isCancel(selected)) {
            p.cancel('Removal cancelled');
            process.exit(0);
        }
        selectedSkills = selected;
    }
    let targetAgents;
    if (options.agent && options.agent.length > 0) {
        targetAgents = options.agent;
    }
    else {
        // When removing, we should target all known agents to ensure
        // ghost symlinks are cleaned up, even if the agent is not detected.
        targetAgents = Object.keys(agents_ts_1.agents);
        spinner.stop(`Targeting ${targetAgents.length} potential agent(s)`);
    }
    if (!options.yes) {
        console.log();
        p.log.info('Skills to remove:');
        for (const skill of selectedSkills) {
            p.log.message(`  ${picocolors_1.default.red('•')} ${skill}`);
        }
        console.log();
        const confirmed = await p.confirm({
            message: `Are you sure you want to uninstall ${selectedSkills.length} skill(s)?`,
        });
        if (p.isCancel(confirmed) || !confirmed) {
            p.cancel('Removal cancelled');
            process.exit(0);
        }
    }
    spinner.start('Removing skills...');
    const results = [];
    for (const skillName of selectedSkills) {
        try {
            const canonicalPath = (0, installer_ts_1.getCanonicalPath)(skillName, { global: isGlobal, cwd });
            for (const agentKey of targetAgents) {
                const agent = agents_ts_1.agents[agentKey];
                const skillPath = (0, installer_ts_1.getInstallPath)(skillName, agentKey, { global: isGlobal, cwd });
                // Determine potential paths to cleanup. For universal agents, getInstallPath
                // now returns the canonical path, so we also need to check their 'native'
                // directory to clean up any legacy symlinks.
                const pathsToCleanup = new Set([skillPath]);
                const sanitizedName = (0, installer_ts_1.sanitizeName)(skillName);
                if (isGlobal && agent.globalSkillsDir) {
                    pathsToCleanup.add((0, path_1.join)(agent.globalSkillsDir, sanitizedName));
                }
                else {
                    pathsToCleanup.add((0, path_1.join)(cwd, agent.skillsDir, sanitizedName));
                }
                for (const pathToCleanup of pathsToCleanup) {
                    // Skip if this is the canonical path - we'll handle that after checking all agents
                    if (pathToCleanup === canonicalPath) {
                        continue;
                    }
                    try {
                        const stats = await (0, promises_1.lstat)(pathToCleanup).catch(() => null);
                        if (stats) {
                            await (0, promises_1.rm)(pathToCleanup, { recursive: true, force: true });
                        }
                    }
                    catch (err) {
                        p.log.warn(`Could not remove skill from ${agent.displayName}: ${err instanceof Error ? err.message : String(err)}`);
                    }
                }
            }
            // Only remove the canonical path if no other installed agents are using it.
            // This prevents breaking other agents when uninstalling from a specific agent (#287).
            const installedAgents = await (0, agents_ts_1.detectInstalledAgents)();
            const remainingAgents = installedAgents.filter((a) => !targetAgents.includes(a));
            let isStillUsed = false;
            for (const agentKey of remainingAgents) {
                const path = (0, installer_ts_1.getInstallPath)(skillName, agentKey, { global: isGlobal, cwd });
                const exists = await (0, promises_1.lstat)(path).catch(() => null);
                if (exists) {
                    isStillUsed = true;
                    break;
                }
            }
            if (!isStillUsed) {
                await (0, promises_1.rm)(canonicalPath, { recursive: true, force: true });
            }
            const lockEntry = isGlobal ? await (0, skill_lock_ts_1.getSkillFromLock)(skillName) : null;
            const effectiveSource = lockEntry?.source || 'local';
            const effectiveSourceType = lockEntry?.sourceType || 'local';
            if (isGlobal) {
                await (0, skill_lock_ts_1.removeSkillFromLock)(skillName);
            }
            results.push({
                skill: skillName,
                success: true,
                source: effectiveSource,
                sourceType: effectiveSourceType,
            });
        }
        catch (err) {
            results.push({
                skill: skillName,
                success: false,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
    spinner.stop('Removal process complete');
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    // Track removal (grouped by source)
    if (successful.length > 0) {
        const bySource = new Map();
        for (const r of successful) {
            const source = r.source || 'local';
            const existing = bySource.get(source) || { skills: [] };
            existing.skills.push(r.skill);
            existing.sourceType = r.sourceType;
            bySource.set(source, existing);
        }
        for (const [source, data] of bySource) {
            (0, telemetry_ts_1.track)({
                event: 'remove',
                source,
                skills: data.skills.join(','),
                agents: targetAgents.join(','),
                ...(isGlobal && { global: '1' }),
                sourceType: data.sourceType,
            });
        }
    }
    if (successful.length > 0) {
        p.log.success(picocolors_1.default.green(`Successfully removed ${successful.length} skill(s)`));
    }
    if (failed.length > 0) {
        p.log.error(picocolors_1.default.red(`Failed to remove ${failed.length} skill(s)`));
        for (const r of failed) {
            p.log.message(`  ${picocolors_1.default.red('✗')} ${r.skill}: ${r.error}`);
        }
    }
    console.log();
    p.outro(picocolors_1.default.green('Done!'));
}
/**
 * Parse command line options for the remove command.
 * Separates skill names from options flags.
 */
function parseRemoveOptions(args) {
    const options = {};
    const skills = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-g' || arg === '--global') {
            options.global = true;
        }
        else if (arg === '-y' || arg === '--yes') {
            options.yes = true;
        }
        else if (arg === '--all') {
            options.all = true;
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
            i--; // Back up one since the loop will increment
        }
        else if (arg && !arg.startsWith('-')) {
            skills.push(arg);
        }
    }
    return { skills, options };
}
//# sourceMappingURL=remove.js.map