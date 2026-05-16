"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseListOptions = parseListOptions;
exports.runList = runList;
const os_1 = require("os");
const agents_ts_1 = require("./agents.ts");
const installer_ts_1 = require("./installer.ts");
const sanitize_ts_1 = require("./sanitize.ts");
const skill_lock_ts_1 = require("./skill-lock.ts");
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[38;5;102m';
const TEXT = '\x1b[38;5;145m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
/**
 * Shortens a path for display: replaces homedir with ~ and cwd with .
 */
function shortenPath(fullPath, cwd) {
    const home = (0, os_1.homedir)();
    if (fullPath.startsWith(home)) {
        return fullPath.replace(home, '~');
    }
    if (fullPath.startsWith(cwd)) {
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
function parseListOptions(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-g' || arg === '--global') {
            options.global = true;
        }
        else if (arg === '--json') {
            options.json = true;
        }
        else if (arg === '-a' || arg === '--agent') {
            options.agent = options.agent || [];
            // Collect all following arguments until next flag
            while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                options.agent.push(args[++i]);
            }
        }
    }
    return options;
}
async function runList(args) {
    const options = parseListOptions(args);
    // Default to project only (local), use -g for global
    const scope = options.global === true ? true : false;
    // Validate agent filter if provided
    let agentFilter;
    if (options.agent && options.agent.length > 0) {
        const validAgents = Object.keys(agents_ts_1.agents);
        const invalidAgents = options.agent.filter((a) => !validAgents.includes(a));
        if (invalidAgents.length > 0) {
            console.log(`${YELLOW}Invalid agents: ${invalidAgents.join(', ')}${RESET}`);
            console.log(`${DIM}Valid agents: ${validAgents.join(', ')}${RESET}`);
            process.exit(1);
        }
        agentFilter = options.agent;
    }
    const installedSkills = await (0, installer_ts_1.listInstalledSkills)({
        global: scope,
        agentFilter,
    });
    // JSON output mode: structured, no ANSI, untruncated agent lists
    if (options.json) {
        const jsonOutput = installedSkills.map((skill) => ({
            name: skill.name,
            path: skill.canonicalPath,
            scope: skill.scope,
            agents: skill.agents.map((a) => agents_ts_1.agents[a].displayName),
        }));
        console.log(JSON.stringify(jsonOutput, null, 2));
        return;
    }
    // Fetch lock entries to get plugin grouping info
    const lockedSkills = await (0, skill_lock_ts_1.getAllLockedSkills)();
    const cwd = process.cwd();
    const scopeLabel = scope ? 'Global' : 'Project';
    if (installedSkills.length === 0) {
        if (options.json) {
            console.log('[]');
            return;
        }
        console.log(`${DIM}No ${scopeLabel.toLowerCase()} skills found.${RESET}`);
        if (scope) {
            console.log(`${DIM}Try listing project skills without -g${RESET}`);
        }
        else {
            console.log(`${DIM}Try listing global skills with -g${RESET}`);
        }
        return;
    }
    function printSkill(skill, indent = false) {
        const prefix = indent ? '  ' : '';
        const shortPath = shortenPath(skill.canonicalPath, cwd);
        const agentNames = skill.agents.map((a) => agents_ts_1.agents[a].displayName);
        const agentInfo = skill.agents.length > 0 ? formatList(agentNames) : `${YELLOW}not linked${RESET}`;
        console.log(`${prefix}${CYAN}${(0, sanitize_ts_1.sanitizeMetadata)(skill.name)}${RESET} ${DIM}${shortPath}${RESET}`);
        console.log(`${prefix}  ${DIM}Agents:${RESET} ${agentInfo}`);
    }
    console.log(`${BOLD}${scopeLabel} Skills${RESET}`);
    console.log();
    // Group skills by plugin
    const groupedSkills = {};
    const ungroupedSkills = [];
    for (const skill of installedSkills) {
        const lockEntry = lockedSkills[skill.name];
        if (lockEntry?.pluginName) {
            const group = lockEntry.pluginName;
            if (!groupedSkills[group]) {
                groupedSkills[group] = [];
            }
            groupedSkills[group].push(skill);
        }
        else {
            ungroupedSkills.push(skill);
        }
    }
    const hasGroups = Object.keys(groupedSkills).length > 0;
    if (hasGroups) {
        // Print groups sorted alphabetically
        const sortedGroups = Object.keys(groupedSkills).sort();
        for (const group of sortedGroups) {
            // Convert kebab-case to Title Case for display header
            const title = group
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            console.log(`${BOLD}${title}${RESET}`);
            const skills = groupedSkills[group];
            if (skills) {
                for (const skill of skills) {
                    printSkill(skill, true);
                }
            }
            console.log();
        }
        // Print ungrouped skills if any exist
        if (ungroupedSkills.length > 0) {
            console.log(`${BOLD}General${RESET}`);
            for (const skill of ungroupedSkills) {
                printSkill(skill, true);
            }
            console.log();
        }
    }
    else {
        // No groups, print flat list as before
        for (const skill of installedSkills) {
            printSkill(skill);
        }
        console.log();
    }
}
//# sourceMappingURL=list.js.map