"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInstallFromLock = runInstallFromLock;
const p = require("@clack/prompts");
const picocolors_1 = require("picocolors");
const local_lock_ts_1 = require("./local-lock.ts");
const add_ts_1 = require("./add.ts");
const sync_ts_1 = require("./sync.ts");
const agents_ts_1 = require("./agents.ts");
/**
 * Install all skills from the local skills-lock.json.
 * Groups skills by source and calls `runAdd` for each group.
 *
 * Only installs to .agents/skills/ (universal agents) -- the canonical
 * project-level location. Does not install to agent-specific directories.
 *
 * node_modules skills are handled via experimental_sync.
 */
async function runInstallFromLock(args) {
    const cwd = process.cwd();
    const lock = await (0, local_lock_ts_1.readLocalLock)(cwd);
    const skillEntries = Object.entries(lock.skills);
    if (skillEntries.length === 0) {
        p.log.warn('No project skills found in skills-lock.json');
        p.log.info(`Add project-level skills with ${picocolors_1.default.cyan('npx skills add <package>')} (without ${picocolors_1.default.cyan('-g')})`);
        return;
    }
    // Only install to .agents/skills/ (universal agents)
    const universalAgentNames = (0, agents_ts_1.getUniversalAgents)();
    // Separate node_modules skills from remote skills
    const nodeModuleSkills = [];
    const bySource = new Map();
    for (const [skillName, entry] of skillEntries) {
        if (entry.sourceType === 'node_modules') {
            nodeModuleSkills.push(skillName);
            continue;
        }
        const installSource = entry.ref ? `${entry.source}#${entry.ref}` : entry.source;
        const existing = bySource.get(installSource);
        if (existing) {
            existing.skills.push(skillName);
        }
        else {
            bySource.set(installSource, {
                sourceType: entry.sourceType,
                skills: [skillName],
            });
        }
    }
    const remoteCount = skillEntries.length - nodeModuleSkills.length;
    if (remoteCount > 0) {
        p.log.info(`Restoring ${picocolors_1.default.cyan(String(remoteCount))} skill${remoteCount !== 1 ? 's' : ''} from skills-lock.json into ${picocolors_1.default.dim('.agents/skills/')}`);
    }
    // Install remote skills grouped by source
    for (const [source, { skills }] of bySource) {
        try {
            await (0, add_ts_1.runAdd)([source], {
                skill: skills,
                agent: universalAgentNames,
                yes: true,
            });
        }
        catch (error) {
            p.log.error(`Failed to install from ${picocolors_1.default.cyan(source)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Handle node_modules skills via sync
    if (nodeModuleSkills.length > 0) {
        p.log.info(`${picocolors_1.default.cyan(String(nodeModuleSkills.length))} skill${nodeModuleSkills.length !== 1 ? 's' : ''} from node_modules`);
        try {
            const { options: syncOptions } = (0, sync_ts_1.parseSyncOptions)(args);
            await (0, sync_ts_1.runSync)(args, { ...syncOptions, yes: true, agent: universalAgentNames });
        }
        catch (error) {
            p.log.error(`Failed to sync node_modules skills: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
//# sourceMappingURL=install.js.map