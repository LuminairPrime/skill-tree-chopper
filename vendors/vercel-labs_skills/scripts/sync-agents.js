#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const agents_ts_1 = require("../src/agents.ts");
const ROOT = (0, path_1.join)(import.meta.dirname, '..');
const README_PATH = (0, path_1.join)(ROOT, 'README.md');
const PACKAGE_PATH = (0, path_1.join)(ROOT, 'package.json');
function generateAgentList() {
    const agentList = Object.values(agents_ts_1.agents);
    const count = agentList.length;
    return `Supports **OpenCode**, **Claude Code**, **Codex**, **Cursor**, and [${count - 4} more](#supported-agents).`;
}
function generateAgentNames() {
    return 'Target specific agents (e.g., `claude-code`, `codex`). See [Supported Agents](#supported-agents)';
}
function generateAvailableAgentsTable() {
    // Group agents by their paths
    const pathGroups = new Map();
    for (const [key, a] of Object.entries(agents_ts_1.agents)) {
        const pathKey = `${a.skillsDir}|${a.globalSkillsDir}`;
        if (!pathGroups.has(pathKey)) {
            pathGroups.set(pathKey, {
                keys: [],
                displayNames: [],
                skillsDir: a.skillsDir,
                globalSkillsDir: a.globalSkillsDir,
            });
        }
        const group = pathGroups.get(pathKey);
        group.keys.push(key);
        group.displayNames.push(a.displayName);
    }
    const rows = Array.from(pathGroups.values()).map((group) => {
        const globalPath = group.globalSkillsDir
            ? `\`${group.globalSkillsDir.replace((0, os_1.homedir)(), '~')}/\``
            : 'N/A (project-only)';
        const names = group.displayNames.join(', ');
        const keys = group.keys.map((k) => `\`${k}\``).join(', ');
        return `| ${names} | ${keys} | \`${group.skillsDir}/\` | ${globalPath} |`;
    });
    return [
        '| Agent | `--agent` | Project Path | Global Path |',
        '|-------|-----------|--------------|-------------|',
        ...rows,
    ].join('\n');
}
function generateSkillDiscoveryPaths() {
    const standardPaths = [
        '- Root directory (if it contains `SKILL.md`)',
        '- `skills/`',
        '- `skills/.curated/`',
        '- `skills/.experimental/`',
        '- `skills/.system/`',
    ];
    const agentPaths = [...new Set(Object.values(agents_ts_1.agents).map((a) => a.skillsDir))]
        .filter((p) => p !== 'skills') // Filter out the standard `skills/` path
        .map((p) => `- \`${p}/\``);
    return [...standardPaths, ...agentPaths].join('\n');
}
function generateKeywords() {
    const baseKeywords = ['cli', 'agent-skills', 'skills', 'ai-agents'];
    const agentKeywords = Object.keys(agents_ts_1.agents);
    return [...baseKeywords, ...agentKeywords];
}
function replaceSection(content, marker, replacement, inline = false) {
    const regex = new RegExp(`(<!-- ${marker}:start -->)[\\s\\S]*?(<!-- ${marker}:end -->)`, 'g');
    if (inline) {
        return content.replace(regex, `$1${replacement}$2`);
    }
    return content.replace(regex, `$1\n${replacement}\n$2`);
}
function main() {
    let readme = (0, fs_1.readFileSync)(README_PATH, 'utf-8');
    readme = replaceSection(readme, 'agent-list', generateAgentList());
    readme = replaceSection(readme, 'agent-names', generateAgentNames(), true);
    readme = replaceSection(readme, 'supported-agents', generateAvailableAgentsTable());
    readme = replaceSection(readme, 'skill-discovery', generateSkillDiscoveryPaths());
    (0, fs_1.writeFileSync)(README_PATH, readme);
    console.log('README.md updated');
    const pkg = JSON.parse((0, fs_1.readFileSync)(PACKAGE_PATH, 'utf-8'));
    pkg.keywords = generateKeywords();
    (0, fs_1.writeFileSync)(PACKAGE_PATH, JSON.stringify(pkg, null, 2) + '\n');
    console.log('package.json updated');
}
main();
//# sourceMappingURL=sync-agents.js.map