"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelemetry = initTelemetry;
exports.promptForAgents = promptForAgents;
exports.runAdd = runAdd;
exports.parseAddOptions = parseAddOptions;
const p = require("@clack/prompts");
const picocolors_1 = require("picocolors");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const source_parser_ts_1 = require("./source-parser.ts");
const sanitize_ts_1 = require("./sanitize.ts");
const search_multiselect_ts_1 = require("./prompts/search-multiselect.ts");
// Helper to check if a value is a cancel symbol (works with both clack and our custom prompts)
const isCancelled = (value) => typeof value === 'symbol';
/**
 * Check if a source identifier (owner/repo format) represents a private GitHub repo.
 * Returns true if private, false if public, null if unable to determine or not a GitHub repo.
 */
async function isSourcePrivate(source) {
    const ownerRepo = (0, source_parser_ts_1.parseOwnerRepo)(source);
    if (!ownerRepo) {
        // Not in owner/repo format, assume not private (could be other providers)
        return false;
    }
    return (0, source_parser_ts_1.isRepoPrivate)(ownerRepo.owner, ownerRepo.repo);
}
const git_ts_1 = require("./git.ts");
const skills_ts_1 = require("./skills.ts");
const installer_ts_1 = require("./installer.ts");
const agents_ts_1 = require("./agents.ts");
const telemetry_ts_1 = require("./telemetry.ts");
const index_ts_1 = require("./providers/index.ts");
const skill_lock_ts_1 = require("./skill-lock.ts");
const local_lock_ts_1 = require("./local-lock.ts");
const blob_ts_1 = require("./blob.ts");
const package_json_1 = require("../package.json");
function initTelemetry(version) {
    (0, telemetry_ts_1.setVersion)(version);
}
// ─── Security Advisory ───
function riskLabel(risk) {
    switch (risk) {
        case 'critical':
            return picocolors_1.default.red(picocolors_1.default.bold('Critical Risk'));
        case 'high':
            return picocolors_1.default.red('High Risk');
        case 'medium':
            return picocolors_1.default.yellow('Med Risk');
        case 'low':
            return picocolors_1.default.green('Low Risk');
        case 'safe':
            return picocolors_1.default.green('Safe');
        default:
            return picocolors_1.default.dim('--');
    }
}
function socketLabel(audit) {
    if (!audit)
        return picocolors_1.default.dim('--');
    const count = audit.alerts ?? 0;
    return count > 0 ? picocolors_1.default.red(`${count} alert${count !== 1 ? 's' : ''}`) : picocolors_1.default.green('0 alerts');
}
/** Pad a string to a given visible width (ignoring ANSI escape codes). */
function padEnd(str, width) {
    // Strip ANSI codes to measure visible length
    const visible = (0, sanitize_ts_1.stripTerminalEscapes)(str);
    const pad = Math.max(0, width - visible.length);
    return str + ' '.repeat(pad);
}
/**
 * Render a compact security table showing partner audit results.
 * Returns the lines to display, or empty array if no data.
 */
function buildSecurityLines(auditData, skills, source) {
    if (!auditData)
        return [];
    // Check if we have any audit data at all
    const hasAny = skills.some((s) => {
        const data = auditData[s.slug];
        return data && Object.keys(data).length > 0;
    });
    if (!hasAny)
        return [];
    // Compute column width for skill names
    const nameWidth = Math.min(Math.max(...skills.map((s) => s.displayName.length)), 36);
    // Header
    const lines = [];
    const header = padEnd('', nameWidth + 2) +
        padEnd(picocolors_1.default.dim('Gen'), 18) +
        padEnd(picocolors_1.default.dim('Socket'), 18) +
        picocolors_1.default.dim('Snyk');
    lines.push(header);
    // Rows
    for (const skill of skills) {
        const data = auditData[skill.slug];
        const name = skill.displayName.length > nameWidth
            ? skill.displayName.slice(0, nameWidth - 1) + '\u2026'
            : skill.displayName;
        const ath = data?.ath ? riskLabel(data.ath.risk) : picocolors_1.default.dim('--');
        const socket = data?.socket ? socketLabel(data.socket) : picocolors_1.default.dim('--');
        const snyk = data?.snyk ? riskLabel(data.snyk.risk) : picocolors_1.default.dim('--');
        lines.push(padEnd(picocolors_1.default.cyan(name), nameWidth + 2) + padEnd(ath, 18) + padEnd(socket, 18) + snyk);
    }
    // Footer link
    lines.push('');
    lines.push(`${picocolors_1.default.dim('Details:')} ${picocolors_1.default.dim(`https://skills.sh/${source}`)}`);
    return lines;
}
/**
 * Shortens a path for display: replaces homedir with ~ and cwd with .
 * Handles both Unix and Windows path separators.
 */
function shortenPath(fullPath, cwd) {
    const home = (0, os_1.homedir)();
    // Ensure we match complete path segments by checking for separator after the prefix
    if (fullPath === home || fullPath.startsWith(home + path_1.sep)) {
        return '~' + fullPath.slice(home.length);
    }
    if (fullPath === cwd || fullPath.startsWith(cwd + path_1.sep)) {
        return '.' + fullPath.slice(cwd.length);
    }
    return fullPath;
}
/**
 * Formats a list of items, truncating if too many
 */
function formatList(items, maxShow = 5) {
    if (items.length <= maxShow) {
        return items.join(', ');
    }
    const shown = items.slice(0, maxShow);
    const remaining = items.length - maxShow;
    return `${shown.join(', ')} +${remaining} more`;
}
/**
 * Splits agents into universal and non-universal (symlinked) groups.
 * Returns display names for each group.
 */
function splitAgentsByType(agentTypes) {
    const universal = [];
    const symlinked = [];
    for (const a of agentTypes) {
        if ((0, agents_ts_1.isUniversalAgent)(a)) {
            universal.push(agents_ts_1.agents[a].displayName);
        }
        else {
            symlinked.push(agents_ts_1.agents[a].displayName);
        }
    }
    return { universal, symlinked };
}
/**
 * Builds summary lines showing universal vs symlinked agents
 */
function buildAgentSummaryLines(targetAgents, installMode) {
    const lines = [];
    const { universal, symlinked } = splitAgentsByType(targetAgents);
    if (installMode === 'symlink') {
        if (universal.length > 0) {
            lines.push(`  ${picocolors_1.default.green('universal:')} ${formatList(universal)}`);
        }
        if (symlinked.length > 0) {
            lines.push(`  ${picocolors_1.default.dim('symlink →')} ${formatList(symlinked)}`);
        }
    }
    else {
        // Copy mode - all agents get copies
        const allNames = targetAgents.map((a) => agents_ts_1.agents[a].displayName);
        lines.push(`  ${picocolors_1.default.dim('copy →')} ${formatList(allNames)}`);
    }
    return lines;
}
/**
 * Ensures universal agents are always included in the target agents list.
 * Used when -y flag is passed or when auto-selecting agents.
 */
function ensureUniversalAgents(targetAgents) {
    const universalAgents = (0, agents_ts_1.getUniversalAgents)();
    const result = [...targetAgents];
    for (const ua of universalAgents) {
        if (!result.includes(ua)) {
            result.push(ua);
        }
    }
    return result;
}
/**
 * Builds result lines from installation results, splitting by universal vs symlinked
 */
function buildResultLines(results, targetAgents) {
    const lines = [];
    // Split target agents by type
    const { universal, symlinked: symlinkAgents } = splitAgentsByType(targetAgents);
    // For symlink results, also track which ones actually succeeded vs failed
    const successfulSymlinks = results
        .filter((r) => !r.symlinkFailed && !universal.includes(r.agent))
        .map((r) => r.agent);
    const failedSymlinks = results.filter((r) => r.symlinkFailed).map((r) => r.agent);
    if (universal.length > 0) {
        lines.push(`  ${picocolors_1.default.green('universal:')} ${formatList(universal)}`);
    }
    if (successfulSymlinks.length > 0) {
        lines.push(`  ${picocolors_1.default.dim('symlinked:')} ${formatList(successfulSymlinks)}`);
    }
    if (failedSymlinks.length > 0) {
        lines.push(`  ${picocolors_1.default.yellow('copied:')} ${formatList(failedSymlinks)}`);
    }
    return lines;
}
/**
 * Wrapper around p.multiselect that adds a hint for keyboard usage.
 * Accepts options with required labels (matching our usage pattern).
 */
function multiselect(opts) {
    return p.multiselect({
        ...opts,
        // Cast is safe: our options always have labels, which satisfies p.Option requirements
        options: opts.options,
        message: `${opts.message} ${picocolors_1.default.dim('(space to toggle)')}`,
    });
}
/**
 * Prompts the user to select agents using interactive search.
 * Pre-selects the last used agents if available.
 * Saves the selection for future use.
 */
async function promptForAgents(message, choices) {
    // Get last selected agents to pre-select
    let lastSelected;
    try {
        lastSelected = await (0, skill_lock_ts_1.getLastSelectedAgents)();
    }
    catch {
        // Silently ignore errors reading lock file
    }
    const validAgents = choices.map((c) => c.value);
    // Default agents to pre-select when no valid history exists
    const defaultAgents = ['claude-code', 'opencode', 'codex'];
    const defaultValues = defaultAgents.filter((a) => validAgents.includes(a));
    let initialValues = [];
    if (lastSelected && lastSelected.length > 0) {
        // Filter stored agents against currently valid agents
        initialValues = lastSelected.filter((a) => validAgents.includes(a));
    }
    // If no valid selection from history, use defaults
    if (initialValues.length === 0) {
        initialValues = defaultValues;
    }
    const selected = await (0, search_multiselect_ts_1.searchMultiselect)({
        message,
        items: choices,
        initialSelected: initialValues,
        required: true,
    });
    if (!isCancelled(selected)) {
        // Save selection for next time
        try {
            await (0, skill_lock_ts_1.saveSelectedAgents)(selected);
        }
        catch {
            // Silently ignore errors writing lock file
        }
    }
    return selected;
}
/**
 * Interactive agent selection using fuzzy search.
 * Shows universal agents as locked (always selected), and other agents as selectable.
 */
async function selectAgentsInteractive(options) {
    // Filter out agents that don't support global installation when --global is used
    const supportsGlobalFilter = (a) => !options.global || agents_ts_1.agents[a].globalSkillsDir;
    const universalAgents = (0, agents_ts_1.getUniversalAgents)().filter(supportsGlobalFilter);
    const otherAgents = (0, agents_ts_1.getNonUniversalAgents)().filter(supportsGlobalFilter);
    // Universal agents shown as locked section
    const universalSection = {
        title: 'Universal (.agents/skills)',
        items: universalAgents.map((a) => ({
            value: a,
            label: agents_ts_1.agents[a].displayName,
        })),
    };
    // Other agents are selectable with their skillsDir as hint
    const otherChoices = otherAgents.map((a) => ({
        value: a,
        label: agents_ts_1.agents[a].displayName,
        hint: options.global ? agents_ts_1.agents[a].globalSkillsDir : agents_ts_1.agents[a].skillsDir,
    }));
    // Get last selected agents (filter to only non-universal ones for initial selection)
    let lastSelected;
    try {
        lastSelected = await (0, skill_lock_ts_1.getLastSelectedAgents)();
    }
    catch {
        // Silently ignore errors
    }
    const initialSelected = lastSelected
        ? lastSelected.filter((a) => otherAgents.includes(a) && !universalAgents.includes(a))
        : [];
    const selected = await (0, search_multiselect_ts_1.searchMultiselect)({
        message: 'Which agents do you want to install to?',
        items: otherChoices,
        initialSelected,
        lockedSection: universalSection,
    });
    if (!isCancelled(selected)) {
        // Save selection (all agents including universal)
        try {
            await (0, skill_lock_ts_1.saveSelectedAgents)(selected);
        }
        catch {
            // Silently ignore errors
        }
    }
    return selected;
}
const version = package_json_1.default.version;
(0, telemetry_ts_1.setVersion)(version);
/**
 * Handle skills from a well-known endpoint (RFC 8615).
 * Discovers skills from /.well-known/agent-skills/index.json (preferred)
 * or /.well-known/skills/index.json (legacy fallback).
 */
async function handleWellKnownSkills(source, url, options, spinner) {
    spinner.start('Discovering skills from well-known endpoint...');
    // Fetch all skills from the well-known endpoint
    const skills = await index_ts_1.wellKnownProvider.fetchAllSkills(url);
    if (skills.length === 0) {
        spinner.stop(picocolors_1.default.red('No skills found'));
        p.outro(picocolors_1.default.red('No skills found at this URL. Make sure the server has a /.well-known/agent-skills/index.json or /.well-known/skills/index.json file.'));
        process.exit(1);
    }
    spinner.stop(`Found ${picocolors_1.default.green(skills.length)} skill${skills.length > 1 ? 's' : ''}`);
    // Log discovered skills
    for (const skill of skills) {
        p.log.info(`Skill: ${picocolors_1.default.cyan(skill.installName)}`);
        p.log.message(picocolors_1.default.dim(skill.description));
        if (skill.files.size > 1) {
            p.log.message(picocolors_1.default.dim(`  Files: ${Array.from(skill.files.keys()).join(', ')}`));
        }
    }
    if (options.list) {
        console.log();
        p.log.step(picocolors_1.default.bold('Available Skills'));
        for (const skill of skills) {
            p.log.message(`  ${picocolors_1.default.cyan(skill.installName)}`);
            p.log.message(`    ${picocolors_1.default.dim(skill.description)}`);
            if (skill.files.size > 1) {
                p.log.message(`    ${picocolors_1.default.dim(`Files: ${skill.files.size}`)}`);
            }
        }
        console.log();
        p.outro('Run without --list to install');
        process.exit(0);
    }
    // Filter skills if --skill option is provided
    let selectedSkills;
    if (options.skill?.includes('*')) {
        // --skill '*' selects all skills
        selectedSkills = skills;
        p.log.info(`Installing all ${skills.length} skills`);
    }
    else if (options.skill && options.skill.length > 0) {
        selectedSkills = skills.filter((s) => options.skill.some((name) => s.installName.toLowerCase() === name.toLowerCase() ||
            s.name.toLowerCase() === name.toLowerCase()));
        if (selectedSkills.length === 0) {
            p.log.error(`No matching skills found for: ${options.skill.join(', ')}`);
            p.log.info('Available skills:');
            for (const s of skills) {
                p.log.message(`  - ${s.installName}`);
            }
            process.exit(1);
        }
    }
    else if (skills.length === 1) {
        selectedSkills = skills;
        const firstSkill = skills[0];
        p.log.info(`Skill: ${picocolors_1.default.cyan(firstSkill.installName)}`);
    }
    else if (options.yes) {
        selectedSkills = skills;
        p.log.info(`Installing all ${skills.length} skills`);
    }
    else {
        // Prompt user to select skills
        const skillChoices = skills.map((s) => ({
            value: s,
            label: s.installName,
            hint: s.description.length > 60 ? s.description.slice(0, 57) + '...' : s.description,
        }));
        const selected = await multiselect({
            message: 'Select skills to install',
            options: skillChoices,
            required: true,
        });
        if (p.isCancel(selected)) {
            p.cancel('Installation cancelled');
            process.exit(0);
        }
        selectedSkills = selected;
    }
    // Detect agents
    let targetAgents;
    const validAgents = Object.keys(agents_ts_1.agents);
    if (options.agent?.includes('*')) {
        // --agent '*' selects all agents
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
                targetAgents = validAgents;
                p.log.info('Installing to all agents');
            }
            else {
                p.log.info('Select agents to install skills to');
                const allAgentChoices = Object.entries(agents_ts_1.agents).map(([key, config]) => ({
                    value: key,
                    label: config.displayName,
                }));
                // Use helper to prompt with search
                const selected = await promptForAgents('Which agents do you want to install to?', allAgentChoices);
                if (p.isCancel(selected)) {
                    p.cancel('Installation cancelled');
                    process.exit(0);
                }
                targetAgents = selected;
            }
        }
        else if (installedAgents.length === 1 || options.yes) {
            // Auto-select detected agents + ensure universal agents are included
            targetAgents = ensureUniversalAgents(installedAgents);
            if (installedAgents.length === 1) {
                const firstAgent = installedAgents[0];
                p.log.info(`Installing to: ${picocolors_1.default.cyan(agents_ts_1.agents[firstAgent].displayName)}`);
            }
            else {
                p.log.info(`Installing to: ${installedAgents.map((a) => picocolors_1.default.cyan(agents_ts_1.agents[a].displayName)).join(', ')}`);
            }
        }
        else {
            const selected = await selectAgentsInteractive({ global: options.global });
            if (p.isCancel(selected)) {
                p.cancel('Installation cancelled');
                process.exit(0);
            }
            targetAgents = selected;
        }
    }
    let installGlobally = options.global ?? false;
    // Check if any selected agents support global installation
    const supportsGlobal = targetAgents.some((a) => agents_ts_1.agents[a].globalSkillsDir !== undefined);
    if (options.global === undefined && !options.yes && supportsGlobal) {
        const scope = await p.select({
            message: 'Installation scope',
            options: [
                {
                    value: false,
                    label: 'Project',
                    hint: 'Install in current directory (committed with your project)',
                },
                {
                    value: true,
                    label: 'Global',
                    hint: 'Install in home directory (available across all projects)',
                },
            ],
        });
        if (p.isCancel(scope)) {
            p.cancel('Installation cancelled');
            process.exit(0);
        }
        installGlobally = scope;
    }
    // Determine install mode (symlink vs copy)
    let installMode = options.copy ? 'copy' : 'symlink';
    // Only prompt for install mode when there are multiple unique target directories.
    // When all selected agents share the same skillsDir, symlink vs copy is meaningless.
    const uniqueDirs = new Set(targetAgents.map((a) => agents_ts_1.agents[a].skillsDir));
    if (!options.copy && !options.yes && uniqueDirs.size > 1) {
        const modeChoice = await p.select({
            message: 'Installation method',
            options: [
                {
                    value: 'symlink',
                    label: 'Symlink (Recommended)',
                    hint: 'Single source of truth, easy updates',
                },
                { value: 'copy', label: 'Copy to all agents', hint: 'Independent copies for each agent' },
            ],
        });
        if (p.isCancel(modeChoice)) {
            p.cancel('Installation cancelled');
            process.exit(0);
        }
        installMode = modeChoice;
    }
    else if (uniqueDirs.size <= 1) {
        // Single target directory — default to copy (no symlink needed)
        installMode = 'copy';
    }
    const cwd = process.cwd();
    // Build installation summary
    const summaryLines = [];
    const agentNames = targetAgents.map((a) => agents_ts_1.agents[a].displayName);
    // Check if any skill will be overwritten (parallel)
    const overwriteChecks = await Promise.all(selectedSkills.flatMap((skill) => targetAgents.map(async (agent) => ({
        skillName: skill.installName,
        agent,
        installed: await (0, installer_ts_1.isSkillInstalled)(skill.installName, agent, { global: installGlobally }),
    }))));
    const overwriteStatus = new Map();
    for (const { skillName, agent, installed } of overwriteChecks) {
        if (!overwriteStatus.has(skillName)) {
            overwriteStatus.set(skillName, new Map());
        }
        overwriteStatus.get(skillName).set(agent, installed);
    }
    for (const skill of selectedSkills) {
        if (summaryLines.length > 0)
            summaryLines.push('');
        const canonicalPath = (0, installer_ts_1.getCanonicalPath)(skill.installName, { global: installGlobally });
        const shortCanonical = shortenPath(canonicalPath, cwd);
        summaryLines.push(`${picocolors_1.default.cyan(shortCanonical)}`);
        summaryLines.push(...buildAgentSummaryLines(targetAgents, installMode));
        if (skill.files.size > 1) {
            summaryLines.push(`  ${picocolors_1.default.dim('files:')} ${skill.files.size}`);
        }
        const skillOverwrites = overwriteStatus.get(skill.installName);
        const overwriteAgents = targetAgents
            .filter((a) => skillOverwrites?.get(a))
            .map((a) => agents_ts_1.agents[a].displayName);
        if (overwriteAgents.length > 0) {
            summaryLines.push(`  ${picocolors_1.default.yellow('overwrites:')} ${formatList(overwriteAgents)}`);
        }
    }
    console.log();
    p.note(summaryLines.join('\n'), 'Installation Summary');
    if (!options.yes) {
        const confirmed = await p.confirm({ message: 'Proceed with installation?' });
        if (p.isCancel(confirmed) || !confirmed) {
            p.cancel('Installation cancelled');
            process.exit(0);
        }
    }
    // Kick off privacy check early so it runs in parallel with installation
    const sourceIdentifier = index_ts_1.wellKnownProvider.getSourceIdentifier(url);
    const wellKnownPrivacyPromise = isSourcePrivate(sourceIdentifier).catch(() => null);
    spinner.start('Installing skills...');
    const results = [];
    for (const skill of selectedSkills) {
        for (const agent of targetAgents) {
            const result = await (0, installer_ts_1.installWellKnownSkillForAgent)(skill, agent, {
                global: installGlobally,
                mode: installMode,
            });
            results.push({
                skill: skill.installName,
                agent: agents_ts_1.agents[agent].displayName,
                ...result,
            });
        }
    }
    spinner.stop('Installation complete');
    console.log();
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    // Build skillFiles map: { skillName: sourceUrl }
    const skillFiles = {};
    for (const skill of selectedSkills) {
        skillFiles[skill.installName] = skill.sourceUrl;
    }
    // Privacy promise was started before installation — should be resolved by now
    const isPrivate = await wellKnownPrivacyPromise;
    if (isPrivate !== true) {
        (0, telemetry_ts_1.track)({
            event: 'install',
            source: sourceIdentifier,
            skills: selectedSkills.map((s) => s.installName).join(','),
            agents: targetAgents.join(','),
            ...(installGlobally && { global: '1' }),
            skillFiles: JSON.stringify(skillFiles),
            sourceType: 'well-known',
        });
    }
    // Add to skill lock file for update tracking (only for global installs)
    if (successful.length > 0 && installGlobally) {
        const successfulSkillNames = new Set(successful.map((r) => r.skill));
        for (const skill of selectedSkills) {
            if (successfulSkillNames.has(skill.installName)) {
                try {
                    await (0, skill_lock_ts_1.addSkillToLock)(skill.installName, {
                        source: sourceIdentifier,
                        sourceType: 'well-known',
                        sourceUrl: skill.sourceUrl,
                        skillFolderHash: '', // Well-known skills don't have a folder hash
                    });
                }
                catch {
                    // Don't fail installation if lock file update fails
                }
            }
        }
    }
    // Add to local lock file for project-scoped installs
    if (successful.length > 0 && !installGlobally) {
        const successfulSkillNames = new Set(successful.map((r) => r.skill));
        for (const skill of selectedSkills) {
            if (successfulSkillNames.has(skill.installName)) {
                try {
                    const matchingResult = successful.find((r) => r.skill === skill.installName);
                    const installDir = matchingResult?.canonicalPath || matchingResult?.path;
                    if (installDir) {
                        const computedHash = await (0, local_lock_ts_1.computeSkillFolderHash)(installDir);
                        await (0, local_lock_ts_1.addSkillToLocalLock)(skill.installName, {
                            source: sourceIdentifier,
                            sourceType: 'well-known',
                            computedHash,
                        }, cwd);
                    }
                }
                catch {
                    // Don't fail installation if lock file update fails
                }
            }
        }
    }
    if (successful.length > 0) {
        const bySkill = new Map();
        for (const r of successful) {
            const skillResults = bySkill.get(r.skill) || [];
            skillResults.push(r);
            bySkill.set(r.skill, skillResults);
        }
        const skillCount = bySkill.size;
        const symlinkFailures = successful.filter((r) => r.mode === 'symlink' && r.symlinkFailed);
        const copiedAgents = symlinkFailures.map((r) => r.agent);
        const resultLines = [];
        for (const [skillName, skillResults] of bySkill) {
            const firstResult = skillResults[0];
            if (firstResult.mode === 'copy') {
                // Copy mode: show skill name and list all agent paths
                resultLines.push(`${picocolors_1.default.green('✓')} ${skillName} ${picocolors_1.default.dim('(copied)')}`);
                for (const r of skillResults) {
                    const shortPath = shortenPath(r.path, cwd);
                    resultLines.push(`  ${picocolors_1.default.dim('→')} ${shortPath}`);
                }
            }
            else {
                // Symlink mode: show canonical path and universal/symlinked agents
                if (firstResult.canonicalPath) {
                    const shortPath = shortenPath(firstResult.canonicalPath, cwd);
                    resultLines.push(`${picocolors_1.default.green('✓')} ${shortPath}`);
                }
                else {
                    resultLines.push(`${picocolors_1.default.green('✓')} ${skillName}`);
                }
                resultLines.push(...buildResultLines(skillResults, targetAgents));
            }
        }
        const title = picocolors_1.default.green(`Installed ${skillCount} skill${skillCount !== 1 ? 's' : ''}`);
        p.note(resultLines.join('\n'), title);
        // Show symlink failure warning (only for symlink mode)
        if (symlinkFailures.length > 0) {
            p.log.warn(picocolors_1.default.yellow(`Symlinks failed for: ${formatList(copiedAgents)}`));
            p.log.message(picocolors_1.default.dim('  Files were copied instead. On Windows, enable Developer Mode for symlink support.'));
        }
    }
    if (failed.length > 0) {
        console.log();
        p.log.error(picocolors_1.default.red(`Failed to install ${failed.length}`));
        for (const r of failed) {
            p.log.message(`  ${picocolors_1.default.red('✗')} ${r.skill} → ${r.agent}: ${picocolors_1.default.dim(r.error)}`);
        }
    }
    console.log();
    p.outro(picocolors_1.default.green('Done!') + picocolors_1.default.dim('  Review skills before use; they run with full agent permissions.'));
    // Prompt for find-skills after successful install
    await promptForFindSkills(options, targetAgents);
}
async function runAdd(args, options = {}) {
    const source = args[0];
    let installTipShown = false;
    const showInstallTip = () => {
        if (installTipShown)
            return;
        p.log.message(picocolors_1.default.dim('Tip: use the --yes (-y) and --global (-g) flags to install without prompts.'));
        installTipShown = true;
    };
    if (!source) {
        console.log();
        console.log(picocolors_1.default.bgRed(picocolors_1.default.white(picocolors_1.default.bold(' ERROR '))) + ' ' + picocolors_1.default.red('Missing required argument: source'));
        console.log();
        console.log(picocolors_1.default.dim('  Usage:'));
        console.log(`    ${picocolors_1.default.cyan('npx skills add')} ${picocolors_1.default.yellow('<source>')} ${picocolors_1.default.dim('[options]')}`);
        console.log();
        console.log(picocolors_1.default.dim('  Example:'));
        console.log(`    ${picocolors_1.default.cyan('npx skills add')} ${picocolors_1.default.yellow('vercel-labs/agent-skills')}`);
        console.log();
        process.exit(1);
    }
    // --all implies --skill '*' and --agent '*' and -y
    if (options.all) {
        options.skill = ['*'];
        options.agent = ['*'];
        options.yes = true;
    }
    console.log();
    p.intro(picocolors_1.default.bgCyan(picocolors_1.default.black(' skills ')));
    if (!process.stdin.isTTY) {
        showInstallTip();
    }
    let tempDir = null;
    try {
        const spinner = p.spinner();
        spinner.start('Parsing source...');
        const parsed = (0, source_parser_ts_1.parseSource)(source);
        spinner.stop(`Source: ${parsed.type === 'local' ? parsed.localPath : parsed.url}${parsed.ref ? ` @ ${picocolors_1.default.yellow(parsed.ref)}` : ''}${parsed.subpath ? ` (${parsed.subpath})` : ''}${parsed.skillFilter ? ` ${picocolors_1.default.dim('@')}${picocolors_1.default.cyan(parsed.skillFilter)}` : ''}`);
        // Kick off the repo privacy check early so it runs in parallel with
        // cloning/discovering/installing. The result is only needed later for
        // telemetry gating — it should never block user-visible output.
        const ownerRepoRaw = (0, source_parser_ts_1.getOwnerRepo)(parsed);
        const repoPrivacyPromise = (() => {
            if (!ownerRepoRaw)
                return Promise.resolve(null);
            const ownerRepo = (0, source_parser_ts_1.parseOwnerRepo)(ownerRepoRaw);
            if (!ownerRepo)
                return Promise.resolve(null);
            return (0, source_parser_ts_1.isRepoPrivate)(ownerRepo.owner, ownerRepo.repo).catch(() => null);
        })();
        // Block openclaw sources unless explicitly opted in
        const sourceOwner = ownerRepoRaw?.split('/')[0]?.toLowerCase();
        if (sourceOwner === 'openclaw' && !options.dangerouslyAcceptOpenclawRisks) {
            console.log();
            p.log.warn(picocolors_1.default.yellow(picocolors_1.default.bold('⚠ OpenClaw skills are unverified community submissions.')));
            p.log.message(picocolors_1.default.yellow('This source contains user-submitted skills that have not been reviewed for safety or quality.'));
            p.log.message(picocolors_1.default.yellow('Skills run with full agent permissions and could be malicious.'));
            console.log();
            p.log.message(`If you understand the risks, re-run with:\n\n  ${picocolors_1.default.cyan(`npx skills add ${source} --dangerously-accept-openclaw-risks`)}\n`);
            p.outro(picocolors_1.default.red('Installation blocked'));
            process.exit(1);
        }
        // Handle well-known skills from arbitrary URLs
        if (parsed.type === 'well-known') {
            await handleWellKnownSkills(source, parsed.url, options, spinner);
            return;
        }
        // If skillFilter is present from @skill syntax (e.g., owner/repo@skill-name),
        // merge it into options.skill
        if (parsed.skillFilter) {
            options.skill = options.skill || [];
            if (!options.skill.includes(parsed.skillFilter)) {
                options.skill.push(parsed.skillFilter);
            }
        }
        // Include internal skills when a specific skill is explicitly requested
        // (via --skill or @skill syntax)
        const includeInternal = !!(options.skill && options.skill.length > 0);
        let skills;
        let blobResult = null;
        if (parsed.type === 'local') {
            // Use local path directly, no cloning needed
            spinner.start('Validating local path...');
            if (!(0, fs_1.existsSync)(parsed.localPath)) {
                spinner.stop(picocolors_1.default.red('Path not found'));
                p.outro(picocolors_1.default.red(`Local path does not exist: ${parsed.localPath}`));
                process.exit(1);
            }
            spinner.stop('Local path validated');
            spinner.start('Discovering skills...');
            skills = await (0, skills_ts_1.discoverSkills)(parsed.localPath, parsed.subpath, {
                includeInternal,
                fullDepth: options.fullDepth,
            });
        }
        else if (parsed.type === 'github' && !options.fullDepth) {
            // Try blob-based fast install for GitHub sources
            // Only enabled for allowlisted orgs; skip for --full-depth
            const BLOB_ALLOWED_OWNERS = ['vercel', 'vercel-labs', 'heygen-com'];
            const ownerRepo = (0, source_parser_ts_1.getOwnerRepo)(parsed);
            const owner = ownerRepo?.split('/')[0]?.toLowerCase();
            if (ownerRepo && owner && BLOB_ALLOWED_OWNERS.includes(owner)) {
                spinner.start('Fetching skills...');
                const token = (0, skill_lock_ts_1.getGitHubToken)();
                blobResult = await (0, blob_ts_1.tryBlobInstall)(ownerRepo, {
                    subpath: parsed.subpath,
                    skillFilter: parsed.skillFilter,
                    ref: parsed.ref,
                    token,
                    includeInternal,
                });
                if (!blobResult) {
                    spinner.stop(picocolors_1.default.dim('Falling back to clone...'));
                }
            }
            if (blobResult) {
                skills = blobResult.skills;
                spinner.stop(`Found ${picocolors_1.default.green(skills.length)} skill${skills.length > 1 ? 's' : ''}`);
            }
            else {
                // Blob failed — fall back to git clone
                spinner.start('Cloning repository...');
                tempDir = await (0, git_ts_1.cloneRepo)(parsed.url, parsed.ref);
                spinner.stop('Repository cloned');
                spinner.start('Discovering skills...');
                skills = await (0, skills_ts_1.discoverSkills)(tempDir, parsed.subpath, {
                    includeInternal,
                    fullDepth: options.fullDepth,
                });
            }
        }
        else {
            // GitLab, git URL, or --full-depth: always clone
            spinner.start('Cloning repository...');
            tempDir = await (0, git_ts_1.cloneRepo)(parsed.url, parsed.ref);
            spinner.stop('Repository cloned');
            spinner.start('Discovering skills...');
            skills = await (0, skills_ts_1.discoverSkills)(tempDir, parsed.subpath, {
                includeInternal,
                fullDepth: options.fullDepth,
            });
        }
        if (skills.length === 0) {
            spinner.stop(picocolors_1.default.red('No skills found'));
            p.outro(picocolors_1.default.red('No valid skills found. Skills require a SKILL.md with name and description.'));
            await cleanup(tempDir);
            process.exit(1);
        }
        if (!blobResult) {
            spinner.stop(`Found ${picocolors_1.default.green(skills.length)} skill${skills.length > 1 ? 's' : ''}`);
        }
        if (options.list) {
            console.log();
            p.log.step(picocolors_1.default.bold('Available Skills'));
            // Group available skills by plugin for list output
            const groupedSkills = {};
            const ungroupedSkills = [];
            for (const skill of skills) {
                if (skill.pluginName) {
                    const group = skill.pluginName;
                    if (!groupedSkills[group])
                        groupedSkills[group] = [];
                    groupedSkills[group].push(skill);
                }
                else {
                    ungroupedSkills.push(skill);
                }
            }
            // Print groups
            const sortedGroups = Object.keys(groupedSkills).sort();
            for (const group of sortedGroups) {
                // Convert kebab-case to Title Case for display header
                const title = group
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                console.log(picocolors_1.default.bold(title));
                for (const skill of groupedSkills[group]) {
                    p.log.message(`  ${picocolors_1.default.cyan((0, skills_ts_1.getSkillDisplayName)(skill))}`);
                    p.log.message(`    ${picocolors_1.default.dim(skill.description)}`);
                }
                console.log();
            }
            // Print ungrouped
            if (ungroupedSkills.length > 0) {
                if (sortedGroups.length > 0)
                    console.log(picocolors_1.default.bold('General'));
                for (const skill of ungroupedSkills) {
                    p.log.message(`  ${picocolors_1.default.cyan((0, skills_ts_1.getSkillDisplayName)(skill))}`);
                    p.log.message(`    ${picocolors_1.default.dim(skill.description)}`);
                }
            }
            console.log();
            p.outro('Use --skill <name> to install specific skills');
            await cleanup(tempDir);
            process.exit(0);
        }
        let selectedSkills;
        if (options.skill?.includes('*')) {
            // --skill '*' selects all skills
            selectedSkills = skills;
            p.log.info(`Installing all ${skills.length} skills`);
        }
        else if (options.skill && options.skill.length > 0) {
            selectedSkills = (0, skills_ts_1.filterSkills)(skills, options.skill);
            if (selectedSkills.length === 0) {
                p.log.error(`No matching skills found for: ${options.skill.join(', ')}`);
                p.log.info('Available skills:');
                for (const s of skills) {
                    p.log.message(`  - ${(0, skills_ts_1.getSkillDisplayName)(s)}`);
                }
                await cleanup(tempDir);
                process.exit(1);
            }
            p.log.info(`Selected ${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''}: ${selectedSkills.map((s) => picocolors_1.default.cyan((0, skills_ts_1.getSkillDisplayName)(s))).join(', ')}`);
        }
        else if (skills.length === 1) {
            selectedSkills = skills;
            const firstSkill = skills[0];
            p.log.info(`Skill: ${picocolors_1.default.cyan((0, skills_ts_1.getSkillDisplayName)(firstSkill))}`);
            p.log.message(picocolors_1.default.dim(firstSkill.description));
        }
        else if (options.yes) {
            selectedSkills = skills;
            p.log.info(`Installing all ${skills.length} skills`);
        }
        else {
            // Sort skills by plugin name first, then by skill name
            const sortedSkills = [...skills].sort((a, b) => {
                if (a.pluginName && !b.pluginName)
                    return -1;
                if (!a.pluginName && b.pluginName)
                    return 1;
                if (a.pluginName && b.pluginName && a.pluginName !== b.pluginName) {
                    return a.pluginName.localeCompare(b.pluginName);
                }
                return (0, skills_ts_1.getSkillDisplayName)(a).localeCompare((0, skills_ts_1.getSkillDisplayName)(b));
            });
            // Check if any skills have plugin grouping
            const hasGroups = sortedSkills.some((s) => s.pluginName);
            let selected;
            if (hasGroups) {
                // Build grouped options for groupMultiselect
                const kebabToTitle = (s) => s
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                const grouped = {};
                for (const s of sortedSkills) {
                    const groupName = s.pluginName ? kebabToTitle(s.pluginName) : 'Other';
                    if (!grouped[groupName])
                        grouped[groupName] = [];
                    grouped[groupName].push({
                        value: s,
                        label: (0, skills_ts_1.getSkillDisplayName)(s),
                        hint: s.description.length > 60 ? s.description.slice(0, 57) + '...' : s.description,
                    });
                }
                selected = await p.groupMultiselect({
                    message: `Select skills to install ${picocolors_1.default.dim('(space to toggle)')}`,
                    options: grouped,
                    required: true,
                });
            }
            else {
                const skillChoices = sortedSkills.map((s) => ({
                    value: s,
                    label: (0, skills_ts_1.getSkillDisplayName)(s),
                    hint: s.description.length > 60 ? s.description.slice(0, 57) + '...' : s.description,
                }));
                selected = await multiselect({
                    message: 'Select skills to install',
                    options: skillChoices,
                    required: true,
                });
            }
            if (p.isCancel(selected)) {
                p.cancel('Installation cancelled');
                await cleanup(tempDir);
                process.exit(0);
            }
            selectedSkills = selected;
        }
        // Kick off security audit fetch early (non-blocking) so it runs
        // in parallel with agent selection, scope, and mode prompts.
        const ownerRepoForAudit = (0, source_parser_ts_1.getOwnerRepo)(parsed);
        const auditPromise = ownerRepoForAudit
            ? (0, telemetry_ts_1.fetchAuditData)(ownerRepoForAudit, selectedSkills.map((s) => (0, skills_ts_1.getSkillDisplayName)(s)))
            : Promise.resolve(null);
        let targetAgents;
        const validAgents = Object.keys(agents_ts_1.agents);
        if (options.agent?.includes('*')) {
            // --agent '*' selects all agents
            targetAgents = validAgents;
            p.log.info(`Installing to all ${targetAgents.length} agents`);
        }
        else if (options.agent && options.agent.length > 0) {
            const invalidAgents = options.agent.filter((a) => !validAgents.includes(a));
            if (invalidAgents.length > 0) {
                p.log.error(`Invalid agents: ${invalidAgents.join(', ')}`);
                p.log.info(`Valid agents: ${validAgents.join(', ')}`);
                await cleanup(tempDir);
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
                    targetAgents = validAgents;
                    p.log.info('Installing to all agents');
                }
                else {
                    p.log.info('Select agents to install skills to');
                    const allAgentChoices = Object.entries(agents_ts_1.agents).map(([key, config]) => ({
                        value: key,
                        label: config.displayName,
                    }));
                    // Use helper to prompt with search
                    const selected = await promptForAgents('Which agents do you want to install to?', allAgentChoices);
                    if (p.isCancel(selected)) {
                        p.cancel('Installation cancelled');
                        await cleanup(tempDir);
                        process.exit(0);
                    }
                    targetAgents = selected;
                }
            }
            else if (installedAgents.length === 1 || options.yes) {
                // Auto-select detected agents + ensure universal agents are included
                targetAgents = ensureUniversalAgents(installedAgents);
                if (installedAgents.length === 1) {
                    const firstAgent = installedAgents[0];
                    p.log.info(`Installing to: ${picocolors_1.default.cyan(agents_ts_1.agents[firstAgent].displayName)}`);
                }
                else {
                    p.log.info(`Installing to: ${installedAgents.map((a) => picocolors_1.default.cyan(agents_ts_1.agents[a].displayName)).join(', ')}`);
                }
            }
            else {
                const selected = await selectAgentsInteractive({ global: options.global });
                if (p.isCancel(selected)) {
                    p.cancel('Installation cancelled');
                    await cleanup(tempDir);
                    process.exit(0);
                }
                targetAgents = selected;
            }
        }
        let installGlobally = options.global ?? false;
        // Check if any selected agents support global installation
        const supportsGlobal = targetAgents.some((a) => agents_ts_1.agents[a].globalSkillsDir !== undefined);
        if (options.global === undefined && !options.yes && supportsGlobal) {
            const scope = await p.select({
                message: 'Installation scope',
                options: [
                    {
                        value: false,
                        label: 'Project',
                        hint: 'Install in current directory (committed with your project)',
                    },
                    {
                        value: true,
                        label: 'Global',
                        hint: 'Install in home directory (available across all projects)',
                    },
                ],
            });
            if (p.isCancel(scope)) {
                p.cancel('Installation cancelled');
                await cleanup(tempDir);
                process.exit(0);
            }
            installGlobally = scope;
        }
        // Determine install mode (symlink vs copy)
        let installMode = options.copy ? 'copy' : 'symlink';
        // Only prompt for install mode when there are multiple unique target directories.
        // When all selected agents share the same skillsDir, symlink vs copy is meaningless.
        const uniqueDirs = new Set(targetAgents.map((a) => agents_ts_1.agents[a].skillsDir));
        if (!options.copy && !options.yes && uniqueDirs.size > 1) {
            const modeChoice = await p.select({
                message: 'Installation method',
                options: [
                    {
                        value: 'symlink',
                        label: 'Symlink (Recommended)',
                        hint: 'Single source of truth, easy updates',
                    },
                    { value: 'copy', label: 'Copy to all agents', hint: 'Independent copies for each agent' },
                ],
            });
            if (p.isCancel(modeChoice)) {
                p.cancel('Installation cancelled');
                await cleanup(tempDir);
                process.exit(0);
            }
            installMode = modeChoice;
        }
        else if (uniqueDirs.size <= 1) {
            // Single target directory — default to copy (no symlink needed)
            installMode = 'copy';
        }
        const cwd = process.cwd();
        // Build installation summary
        const summaryLines = [];
        const agentNames = targetAgents.map((a) => agents_ts_1.agents[a].displayName);
        // Check if any skill will be overwritten (parallel)
        const overwriteChecks = await Promise.all(selectedSkills.flatMap((skill) => targetAgents.map(async (agent) => ({
            skillName: skill.name,
            agent,
            installed: await (0, installer_ts_1.isSkillInstalled)(skill.name, agent, { global: installGlobally }),
        }))));
        const overwriteStatus = new Map();
        for (const { skillName, agent, installed } of overwriteChecks) {
            if (!overwriteStatus.has(skillName)) {
                overwriteStatus.set(skillName, new Map());
            }
            overwriteStatus.get(skillName).set(agent, installed);
        }
        // Group selected skills for summary
        const groupedSummary = {};
        const ungroupedSummary = [];
        for (const skill of selectedSkills) {
            if (skill.pluginName) {
                const group = skill.pluginName;
                if (!groupedSummary[group])
                    groupedSummary[group] = [];
                groupedSummary[group].push(skill);
            }
            else {
                ungroupedSummary.push(skill);
            }
        }
        // Helper to print summary lines for a list of skills
        const printSkillSummary = (skills) => {
            for (const skill of skills) {
                if (summaryLines.length > 0)
                    summaryLines.push('');
                const canonicalPath = (0, installer_ts_1.getCanonicalPath)(skill.name, { global: installGlobally });
                const shortCanonical = shortenPath(canonicalPath, cwd);
                summaryLines.push(`${picocolors_1.default.cyan(shortCanonical)}`);
                summaryLines.push(...buildAgentSummaryLines(targetAgents, installMode));
                const skillOverwrites = overwriteStatus.get(skill.name);
                const overwriteAgents = targetAgents
                    .filter((a) => skillOverwrites?.get(a))
                    .map((a) => agents_ts_1.agents[a].displayName);
                if (overwriteAgents.length > 0) {
                    summaryLines.push(`  ${picocolors_1.default.yellow('overwrites:')} ${formatList(overwriteAgents)}`);
                }
            }
        };
        // Build grouped summary
        const sortedGroups = Object.keys(groupedSummary).sort();
        for (const group of sortedGroups) {
            const title = group
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            summaryLines.push('');
            summaryLines.push(picocolors_1.default.bold(title));
            printSkillSummary(groupedSummary[group]);
        }
        if (ungroupedSummary.length > 0) {
            if (sortedGroups.length > 0) {
                summaryLines.push('');
                summaryLines.push(picocolors_1.default.bold('General'));
            }
            printSkillSummary(ungroupedSummary);
        }
        console.log();
        p.note(summaryLines.join('\n'), 'Installation Summary');
        // Await and display security audit results (started earlier in parallel)
        // Wrapped in try/catch so a failed audit fetch never blocks installation.
        try {
            const auditData = await auditPromise;
            if (auditData && ownerRepoForAudit) {
                const securityLines = buildSecurityLines(auditData, selectedSkills.map((s) => ({
                    slug: (0, skills_ts_1.getSkillDisplayName)(s),
                    displayName: (0, skills_ts_1.getSkillDisplayName)(s),
                })), ownerRepoForAudit);
                if (securityLines.length > 0) {
                    p.note(securityLines.join('\n'), 'Security Risk Assessments');
                }
            }
        }
        catch {
            // Silently skip — security info is advisory only
        }
        if (!options.yes) {
            const confirmed = await p.confirm({ message: 'Proceed with installation?' });
            if (p.isCancel(confirmed) || !confirmed) {
                p.cancel('Installation cancelled');
                await cleanup(tempDir);
                process.exit(0);
            }
        }
        spinner.start('Installing skills...');
        const results = [];
        for (const skill of selectedSkills) {
            for (const agent of targetAgents) {
                let result;
                if (blobResult && 'files' in skill) {
                    // Blob-based install: write files from snapshot
                    const blobSkill = skill;
                    result = await (0, installer_ts_1.installBlobSkillForAgent)({ installName: blobSkill.name, files: blobSkill.files }, agent, { global: installGlobally, mode: installMode });
                }
                else {
                    // Disk-based install: copy from cloned/local directory
                    result = await (0, installer_ts_1.installSkillForAgent)(skill, agent, {
                        global: installGlobally,
                        mode: installMode,
                    });
                }
                results.push({
                    skill: (0, skills_ts_1.getSkillDisplayName)(skill),
                    agent: agents_ts_1.agents[agent].displayName,
                    pluginName: skill.pluginName,
                    ...result,
                });
            }
        }
        spinner.stop('Installation complete');
        console.log();
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);
        // Track installation result
        // Build skillFiles map: { skillName: relative path to SKILL.md from repo root }
        const skillFiles = {};
        for (const skill of selectedSkills) {
            if (blobResult && 'repoPath' in skill) {
                // Blob-based: repoPath is already the repo-relative path (e.g., "skills/react/SKILL.md")
                skillFiles[skill.name] = skill.repoPath;
            }
            else if (tempDir && skill.path === tempDir) {
                // Skill is at root level of repo
                skillFiles[skill.name] = 'SKILL.md';
            }
            else if (tempDir && skill.path.startsWith(tempDir + path_1.sep)) {
                // Compute path relative to repo root (tempDir), not search path
                // Use forward slashes for telemetry (URL-style paths)
                skillFiles[skill.name] =
                    skill.path
                        .slice(tempDir.length + 1)
                        .split(path_1.sep)
                        .join('/') + '/SKILL.md';
            }
            else {
                // Local path - skip telemetry for local installs
                continue;
            }
        }
        // Normalize source to owner/repo format for telemetry
        const normalizedSource = (0, source_parser_ts_1.getOwnerRepo)(parsed);
        // Preserve SSH URLs in lock files instead of normalizing to owner/repo shorthand.
        // When normalizedSource is used, parseSource() later resolves it to HTTPS,
        // breaking restore for private repos that require SSH authentication.
        const isSSH = parsed.url.startsWith('git@');
        const lockSource = isSSH ? parsed.url : normalizedSource;
        // Only track if we have a valid remote source and it's not a private repo.
        // repoPrivacyPromise was started early (right after parsing) so it has
        // already been running in parallel with the entire install — no stall here.
        if (normalizedSource) {
            const ownerRepo = (0, source_parser_ts_1.parseOwnerRepo)(normalizedSource);
            if (ownerRepo) {
                const isPrivate = await repoPrivacyPromise;
                // Only send telemetry if repo is public (isPrivate === false)
                // If we can't determine (null), err on the side of caution and skip telemetry
                if (isPrivate === false) {
                    (0, telemetry_ts_1.track)({
                        event: 'install',
                        source: normalizedSource,
                        skills: selectedSkills.map((s) => s.name).join(','),
                        agents: targetAgents.join(','),
                        ...(installGlobally && { global: '1' }),
                        skillFiles: JSON.stringify(skillFiles),
                    });
                }
            }
            else {
                // If we can't parse owner/repo, still send telemetry (for non-GitHub sources)
                (0, telemetry_ts_1.track)({
                    event: 'install',
                    source: normalizedSource,
                    skills: selectedSkills.map((s) => s.name).join(','),
                    agents: targetAgents.join(','),
                    ...(installGlobally && { global: '1' }),
                    skillFiles: JSON.stringify(skillFiles),
                });
            }
        }
        // Add to skill lock file for update tracking (only for global installs)
        if (successful.length > 0 && installGlobally && normalizedSource) {
            const successfulSkillNames = new Set(successful.map((r) => r.skill));
            // For GitHub clone installs, fetch the repo tree once and reuse it
            // for all skills — avoids N sequential API calls that take ~400ms each.
            let cachedTree;
            if (parsed.type === 'github' && !blobResult) {
                const token = (0, skill_lock_ts_1.getGitHubToken)();
                cachedTree = await (0, blob_ts_1.fetchRepoTree)(normalizedSource, parsed.ref, token);
            }
            for (const skill of selectedSkills) {
                const skillDisplayName = (0, skills_ts_1.getSkillDisplayName)(skill);
                if (successfulSkillNames.has(skillDisplayName)) {
                    try {
                        let skillFolderHash = '';
                        const skillPathValue = skillFiles[skill.name];
                        if (blobResult && skillPathValue) {
                            const hash = (0, blob_ts_1.getSkillFolderHashFromTree)(blobResult.tree, skillPathValue);
                            if (hash)
                                skillFolderHash = hash;
                        }
                        else if (parsed.type === 'github' && skillPathValue && cachedTree) {
                            const hash = (0, blob_ts_1.getSkillFolderHashFromTree)(cachedTree, skillPathValue);
                            if (hash)
                                skillFolderHash = hash;
                        }
                        else if (skillPathValue && tempDir) {
                            const skillDir = (0, path_1.join)(tempDir, (0, path_1.dirname)(skillPathValue));
                            const hash = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                            if (hash)
                                skillFolderHash = hash;
                        }
                        await (0, skill_lock_ts_1.addSkillToLock)(skill.name, {
                            source: lockSource || normalizedSource,
                            sourceType: parsed.type,
                            sourceUrl: parsed.url,
                            ref: parsed.ref,
                            skillPath: skillPathValue,
                            skillFolderHash,
                            pluginName: skill.pluginName,
                        });
                    }
                    catch {
                        // Don't fail installation if lock file update fails
                    }
                }
            }
        }
        // Add to local lock file for project-scoped installs
        if (successful.length > 0 && !installGlobally) {
            const successfulSkillNames = new Set(successful.map((r) => r.skill));
            for (const skill of selectedSkills) {
                const skillDisplayName = (0, skills_ts_1.getSkillDisplayName)(skill);
                if (successfulSkillNames.has(skillDisplayName)) {
                    try {
                        // For blob skills, use the snapshot hash; for disk skills, compute from files
                        const computedHash = blobResult && 'snapshotHash' in skill
                            ? skill.snapshotHash
                            : await (0, local_lock_ts_1.computeSkillFolderHash)(skill.path);
                        const skillPathValue = skillFiles[skill.name];
                        await (0, local_lock_ts_1.addSkillToLocalLock)(skill.name, {
                            source: lockSource || parsed.url,
                            ref: parsed.ref,
                            sourceType: parsed.type,
                            ...(skillPathValue && { skillPath: skillPathValue }),
                            computedHash,
                        }, cwd);
                    }
                    catch {
                        // Don't fail installation if lock file update fails
                    }
                }
            }
        }
        if (successful.length > 0) {
            const bySkill = new Map();
            // Group results by plugin name
            const groupedResults = {};
            const ungroupedResults = [];
            for (const r of successful) {
                const skillResults = bySkill.get(r.skill) || [];
                skillResults.push(r);
                bySkill.set(r.skill, skillResults);
                // We only need to group once per skill (take the first result for that skill)
                if (skillResults.length === 1) {
                    if (r.pluginName) {
                        const group = r.pluginName;
                        if (!groupedResults[group])
                            groupedResults[group] = [];
                        // We'll store just one entry per skill here to drive the loop
                        groupedResults[group].push(r);
                    }
                    else {
                        ungroupedResults.push(r);
                    }
                }
            }
            const skillCount = bySkill.size;
            const symlinkFailures = successful.filter((r) => r.mode === 'symlink' && r.symlinkFailed);
            const copiedAgents = symlinkFailures.map((r) => r.agent);
            const resultLines = [];
            const printSkillResults = (entries) => {
                for (const entry of entries) {
                    const skillResults = bySkill.get(entry.skill) || [];
                    const firstResult = skillResults[0];
                    if (firstResult.mode === 'copy') {
                        // Copy mode: show skill name and list all agent paths
                        resultLines.push(`${picocolors_1.default.green('✓')} ${entry.skill} ${picocolors_1.default.dim('(copied)')}`);
                        for (const r of skillResults) {
                            const shortPath = shortenPath(r.path, cwd);
                            resultLines.push(`  ${picocolors_1.default.dim('→')} ${shortPath}`);
                        }
                    }
                    else {
                        // Symlink mode: show canonical path and universal/symlinked agents
                        if (firstResult.canonicalPath) {
                            const shortPath = shortenPath(firstResult.canonicalPath, cwd);
                            resultLines.push(`${picocolors_1.default.green('✓')} ${shortPath}`);
                        }
                        else {
                            resultLines.push(`${picocolors_1.default.green('✓')} ${entry.skill}`);
                        }
                        resultLines.push(...buildResultLines(skillResults, targetAgents));
                    }
                }
            };
            // Print grouped results
            const sortedResultGroups = Object.keys(groupedResults).sort();
            for (const group of sortedResultGroups) {
                const title = group
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                resultLines.push('');
                resultLines.push(picocolors_1.default.bold(title));
                printSkillResults(groupedResults[group]);
            }
            if (ungroupedResults.length > 0) {
                if (sortedResultGroups.length > 0) {
                    resultLines.push('');
                    resultLines.push(picocolors_1.default.bold('General'));
                }
                printSkillResults(ungroupedResults);
            }
            const title = picocolors_1.default.green(`Installed ${skillCount} skill${skillCount !== 1 ? 's' : ''}`);
            p.note(resultLines.join('\n'), title);
            // Show symlink failure warning (only for symlink mode)
            if (symlinkFailures.length > 0) {
                p.log.warn(picocolors_1.default.yellow(`Symlinks failed for: ${formatList(copiedAgents)}`));
                p.log.message(picocolors_1.default.dim('  Files were copied instead. On Windows, enable Developer Mode for symlink support.'));
            }
        }
        if (failed.length > 0) {
            console.log();
            p.log.error(picocolors_1.default.red(`Failed to install ${failed.length}`));
            for (const r of failed) {
                p.log.message(`  ${picocolors_1.default.red('✗')} ${r.skill} → ${r.agent}: ${picocolors_1.default.dim(r.error)}`);
            }
        }
        console.log();
        p.outro(picocolors_1.default.green('Done!') +
            picocolors_1.default.dim('  Review skills before use; they run with full agent permissions.'));
        // Prompt for find-skills after successful install
        await promptForFindSkills(options, targetAgents);
    }
    catch (error) {
        if (error instanceof git_ts_1.GitCloneError) {
            p.log.error(picocolors_1.default.red('Failed to clone repository'));
            // Print each line of the error message separately for better formatting
            for (const line of error.message.split('\n')) {
                p.log.message(picocolors_1.default.dim(line));
            }
        }
        else {
            p.log.error(error instanceof Error ? error.message : 'Unknown error occurred');
        }
        showInstallTip();
        p.outro(picocolors_1.default.red('Installation failed'));
        process.exit(1);
    }
    finally {
        await cleanup(tempDir);
    }
}
// Cleanup helper
async function cleanup(tempDir) {
    if (tempDir) {
        try {
            await (0, git_ts_1.cleanupTempDir)(tempDir);
        }
        catch {
            // Ignore cleanup errors
        }
    }
}
/**
 * Prompt user to install the find-skills skill after their first installation.
 */
async function promptForFindSkills(options, targetAgents) {
    // Skip if already dismissed or not in interactive mode
    if (!process.stdin.isTTY)
        return;
    if (options?.yes)
        return;
    try {
        const dismissed = await (0, skill_lock_ts_1.isPromptDismissed)('findSkillsPrompt');
        if (dismissed)
            return;
        // Check if find-skills is already installed
        const findSkillsInstalled = await (0, installer_ts_1.isSkillInstalled)('find-skills', 'claude-code', {
            global: true,
        });
        if (findSkillsInstalled) {
            // Mark as dismissed so we don't check again
            await (0, skill_lock_ts_1.dismissPrompt)('findSkillsPrompt');
            return;
        }
        console.log();
        p.log.message(picocolors_1.default.dim("One-time prompt - you won't be asked again if you dismiss."));
        const install = await p.confirm({
            message: `Install the ${picocolors_1.default.cyan('find-skills')} skill? It helps your agent discover and suggest skills.`,
        });
        if (p.isCancel(install)) {
            await (0, skill_lock_ts_1.dismissPrompt)('findSkillsPrompt');
            return;
        }
        if (install) {
            // Install find-skills to the same agents the user selected, excluding replit
            await (0, skill_lock_ts_1.dismissPrompt)('findSkillsPrompt');
            // Filter out replit from target agents
            const findSkillsAgents = targetAgents?.filter((a) => a !== 'replit');
            // Skip if no valid agents remain after filtering
            if (!findSkillsAgents || findSkillsAgents.length === 0) {
                return;
            }
            console.log();
            p.log.step('Installing find-skills skill...');
            try {
                // Call runAdd directly
                await runAdd(['vercel-labs/skills'], {
                    skill: ['find-skills'],
                    global: true,
                    yes: true,
                    agent: findSkillsAgents,
                });
            }
            catch {
                p.log.warn('Failed to install find-skills. You can try again with:');
                p.log.message(picocolors_1.default.dim('  npx skills add vercel-labs/skills@find-skills -g -y --all'));
            }
        }
        else {
            // User declined - dismiss the prompt
            await (0, skill_lock_ts_1.dismissPrompt)('findSkillsPrompt');
            p.log.message(picocolors_1.default.dim('You can install it later with: npx skills add vercel-labs/skills@find-skills'));
        }
    }
    catch {
        // Don't fail the main installation if prompt fails
    }
}
// Parse command line options from args array
function parseAddOptions(args) {
    const options = {};
    const source = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-g' || arg === '--global') {
            options.global = true;
        }
        else if (arg === '-y' || arg === '--yes') {
            options.yes = true;
        }
        else if (arg === '-l' || arg === '--list') {
            options.list = true;
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
        else if (arg === '-s' || arg === '--skill') {
            options.skill = options.skill || [];
            i++;
            let nextArg = args[i];
            while (i < args.length && nextArg && !nextArg.startsWith('-')) {
                options.skill.push(nextArg);
                i++;
                nextArg = args[i];
            }
            i--; // Back up one since the loop will increment
        }
        else if (arg === '--full-depth') {
            options.fullDepth = true;
        }
        else if (arg === '--copy') {
            options.copy = true;
        }
        else if (arg === '--dangerously-accept-openclaw-risks') {
            options.dangerouslyAcceptOpenclawRisks = true;
        }
        else if (arg && !arg.startsWith('-')) {
            source.push(arg);
        }
    }
    return { source, options };
}
//# sourceMappingURL=add.js.map