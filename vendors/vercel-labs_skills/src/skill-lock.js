"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillLockPath = getSkillLockPath;
exports.readSkillLock = readSkillLock;
exports.writeSkillLock = writeSkillLock;
exports.computeContentHash = computeContentHash;
exports.getGitHubToken = getGitHubToken;
exports.fetchSkillFolderHash = fetchSkillFolderHash;
exports.addSkillToLock = addSkillToLock;
exports.removeSkillFromLock = removeSkillFromLock;
exports.getSkillFromLock = getSkillFromLock;
exports.getAllLockedSkills = getAllLockedSkills;
exports.getSkillsBySource = getSkillsBySource;
exports.isPromptDismissed = isPromptDismissed;
exports.dismissPrompt = dismissPrompt;
exports.getLastSelectedAgents = getLastSelectedAgents;
exports.saveSelectedAgents = saveSelectedAgents;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const os_1 = require("os");
const crypto_1 = require("crypto");
const child_process_1 = require("child_process");
const AGENTS_DIR = '.agents';
const LOCK_FILE = '.skill-lock.json';
const CURRENT_VERSION = 3; // Bumped from 2 to 3 for folder hash support (GitHub tree SHA)
/**
 * Get the path to the global skill lock file.
 * Use $XDG_STATE_HOME/skills/.skill-lock.json if set.
 * otherwise fall back to ~/.agents/.skill-lock.json
 */
function getSkillLockPath() {
    const xdgStateHome = process.env.XDG_STATE_HOME;
    if (xdgStateHome) {
        return (0, path_1.join)(xdgStateHome, 'skills', LOCK_FILE);
    }
    return (0, path_1.join)((0, os_1.homedir)(), AGENTS_DIR, LOCK_FILE);
}
/**
 * Read the skill lock file.
 * Returns an empty lock file structure if the file doesn't exist.
 * Wipes the lock file if it's an old format (version < CURRENT_VERSION).
 */
async function readSkillLock() {
    const lockPath = getSkillLockPath();
    try {
        const content = await (0, promises_1.readFile)(lockPath, 'utf-8');
        const parsed = JSON.parse(content);
        // Validate version - wipe if old format
        if (typeof parsed.version !== 'number' || !parsed.skills) {
            return createEmptyLockFile();
        }
        // If old version, wipe and start fresh (backwards incompatible change)
        // v3 adds skillFolderHash - we want fresh installs to populate it
        if (parsed.version < CURRENT_VERSION) {
            return createEmptyLockFile();
        }
        return parsed;
    }
    catch (error) {
        // File doesn't exist or is invalid - return empty
        return createEmptyLockFile();
    }
}
/**
 * Write the skill lock file.
 * Creates the directory if it doesn't exist.
 */
async function writeSkillLock(lock) {
    const lockPath = getSkillLockPath();
    // Ensure directory exists
    await (0, promises_1.mkdir)((0, path_1.dirname)(lockPath), { recursive: true });
    // Write with pretty formatting for human readability
    const content = JSON.stringify(lock, null, 2);
    await (0, promises_1.writeFile)(lockPath, content, 'utf-8');
}
/**
 * Compute SHA-256 hash of content.
 */
function computeContentHash(content) {
    return (0, crypto_1.createHash)('sha256').update(content, 'utf-8').digest('hex');
}
/**
 * Get GitHub token from user's environment.
 * Tries in order:
 * 1. GITHUB_TOKEN environment variable
 * 2. GH_TOKEN environment variable
 * 3. gh CLI auth token (if gh is installed)
 *
 * @returns The token string or null if not available
 */
function getGitHubToken() {
    // Check environment variables first
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }
    if (process.env.GH_TOKEN) {
        return process.env.GH_TOKEN;
    }
    // Try gh CLI
    try {
        const token = (0, child_process_1.execSync)('gh auth token', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        if (token) {
            return token;
        }
    }
    catch {
        // gh not installed or not authenticated
    }
    return null;
}
/**
 * Fetch the tree SHA (folder hash) for a skill folder using GitHub's Trees API.
 * This makes ONE API call to get the entire repo tree, then extracts the SHA
 * for the specific skill folder.
 *
 * @param ownerRepo - GitHub owner/repo (e.g., "vercel-labs/agent-skills")
 * @param skillPath - Path to skill folder or SKILL.md (e.g., "skills/react-best-practices/SKILL.md")
 * @param token - Optional GitHub token for authenticated requests (higher rate limits)
 * @param ref - Optional branch/tag ref. Defaults to trying main then master.
 * @returns The tree SHA for the skill folder, or null if not found
 */
async function fetchSkillFolderHash(ownerRepo, skillPath, token, ref) {
    const { fetchRepoTree, getSkillFolderHashFromTree } = await Promise.resolve().then(() => require('./blob.ts'));
    const tree = await fetchRepoTree(ownerRepo, ref, token);
    if (!tree)
        return null;
    return getSkillFolderHashFromTree(tree, skillPath);
}
/**
 * Add or update a skill entry in the lock file.
 */
async function addSkillToLock(skillName, entry) {
    const lock = await readSkillLock();
    const now = new Date().toISOString();
    const existingEntry = lock.skills[skillName];
    lock.skills[skillName] = {
        ...entry,
        installedAt: existingEntry?.installedAt ?? now,
        updatedAt: now,
    };
    await writeSkillLock(lock);
}
/**
 * Remove a skill from the lock file.
 */
async function removeSkillFromLock(skillName) {
    const lock = await readSkillLock();
    if (!(skillName in lock.skills)) {
        return false;
    }
    delete lock.skills[skillName];
    await writeSkillLock(lock);
    return true;
}
/**
 * Get a skill entry from the lock file.
 */
async function getSkillFromLock(skillName) {
    const lock = await readSkillLock();
    return lock.skills[skillName] ?? null;
}
/**
 * Get all skills from the lock file.
 */
async function getAllLockedSkills() {
    const lock = await readSkillLock();
    return lock.skills;
}
/**
 * Get skills grouped by source for batch update operations.
 */
async function getSkillsBySource() {
    const lock = await readSkillLock();
    const bySource = new Map();
    for (const [skillName, entry] of Object.entries(lock.skills)) {
        const existing = bySource.get(entry.source);
        if (existing) {
            existing.skills.push(skillName);
        }
        else {
            bySource.set(entry.source, { skills: [skillName], entry });
        }
    }
    return bySource;
}
/**
 * Create an empty lock file structure.
 */
function createEmptyLockFile() {
    return {
        version: CURRENT_VERSION,
        skills: {},
        dismissed: {},
    };
}
/**
 * Check if a prompt has been dismissed.
 */
async function isPromptDismissed(promptKey) {
    const lock = await readSkillLock();
    return lock.dismissed?.[promptKey] === true;
}
/**
 * Mark a prompt as dismissed.
 */
async function dismissPrompt(promptKey) {
    const lock = await readSkillLock();
    if (!lock.dismissed) {
        lock.dismissed = {};
    }
    lock.dismissed[promptKey] = true;
    await writeSkillLock(lock);
}
/**
 * Get the last selected agents.
 */
async function getLastSelectedAgents() {
    const lock = await readSkillLock();
    return lock.lastSelectedAgents;
}
/**
 * Save the selected agents to the lock file.
 */
async function saveSelectedAgents(agents) {
    const lock = await readSkillLock();
    lock.lastSelectedAgents = agents;
    await writeSkillLock(lock);
}
//# sourceMappingURL=skill-lock.js.map