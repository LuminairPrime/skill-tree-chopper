#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const agents_ts_1 = require("../src/agents.ts");
let hasErrors = false;
function error(message) {
    console.error(message);
    hasErrors = true;
}
/**
 * Checks for duplicate `displayName` values among the agents.
 *
 * Iterates through the `agents` object, collecting all `displayName` values (case-insensitive)
 * and mapping them to their corresponding agent keys. If any `displayName` is associated with
 * more than one agent, an error is reported listing the duplicate names and their keys.
 *
 * @throws Will call the `error` function if duplicate display names are found.
 */
function checkDuplicateDisplayNames() {
    const displayNames = new Map();
    for (const [key, config] of Object.entries(agents_ts_1.agents)) {
        const name = config.displayName.toLowerCase();
        if (!displayNames.has(name)) {
            displayNames.set(name, []);
        }
        displayNames.get(name).push(key);
    }
    for (const [name, keys] of displayNames) {
        if (keys.length > 1) {
            error(`Duplicate displayName "${name}" found in agents: ${keys.join(', ')}`);
        }
    }
}
/**
 * Checks for duplicate `skillsDir` and `globalSkillsDir` values among agents.
 *
 * Iterates through the `agents` object, collecting all `skillsDir` and normalized `globalSkillsDir`
 * paths. If any directory is associated with more than one agent, an error is reported listing the
 * conflicting agents.
 *
 * @remarks
 * - The `globalSkillsDir` path is normalized by replacing the user's home directory with `~`.
 * - Errors are reported using the `error` function.
 *
 * @throws Will call `error` if duplicate directories are found.
 */
function checkDuplicateSkillsDirs() {
    const skillsDirs = new Map();
    const globalSkillsDirs = new Map();
    for (const [key, config] of Object.entries(agents_ts_1.agents)) {
        if (!skillsDirs.has(config.skillsDir)) {
            skillsDirs.set(config.skillsDir, []);
        }
        skillsDirs.get(config.skillsDir).push(key);
        const globalPath = config.globalSkillsDir?.replace((0, os_1.homedir)(), '~');
        if (globalPath) {
            if (!globalSkillsDirs.has(globalPath)) {
                globalSkillsDirs.set(globalPath, []);
            }
            globalSkillsDirs.get(globalPath).push(key);
        }
    }
    for (const [dir, keys] of skillsDirs) {
        if (keys.length > 1) {
            error(`Duplicate skillsDir "${dir}" found in agents: ${keys.join(', ')}`);
        }
    }
    for (const [dir, keys] of globalSkillsDirs) {
        if (keys.length > 1) {
            error(`Duplicate globalSkillsDir "${dir}" found in agents: ${keys.join(', ')}`);
        }
    }
}
console.log('Validating agents...\n');
checkDuplicateDisplayNames();
// It's fine to have duplicate skills dirs
// checkDuplicateSkillsDirs();
if (hasErrors) {
    console.log('\nValidation failed.');
    process.exit(1);
}
else {
    console.log('All agents valid.');
}
//# sourceMappingURL=validate-agents.js.map