"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalLockPath = getLocalLockPath;
exports.readLocalLock = readLocalLock;
exports.writeLocalLock = writeLocalLock;
exports.computeSkillFolderHash = computeSkillFolderHash;
exports.addSkillToLocalLock = addSkillToLocalLock;
exports.removeSkillFromLocalLock = removeSkillFromLocalLock;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const crypto_1 = require("crypto");
const LOCAL_LOCK_FILE = 'skills-lock.json';
const CURRENT_VERSION = 1;
/**
 * Get the path to the local skill lock file for a project.
 */
function getLocalLockPath(cwd) {
    return (0, path_1.join)(cwd || process.cwd(), LOCAL_LOCK_FILE);
}
/**
 * Read the local skill lock file.
 * Returns an empty lock file structure if the file doesn't exist
 * or is corrupted (e.g., merge conflict markers).
 */
async function readLocalLock(cwd) {
    const lockPath = getLocalLockPath(cwd);
    try {
        const content = await (0, promises_1.readFile)(lockPath, 'utf-8');
        const parsed = JSON.parse(content);
        if (typeof parsed.version !== 'number' || !parsed.skills) {
            return createEmptyLocalLock();
        }
        if (parsed.version < CURRENT_VERSION) {
            return createEmptyLocalLock();
        }
        return parsed;
    }
    catch {
        return createEmptyLocalLock();
    }
}
/**
 * Write the local skill lock file.
 * Skills are sorted alphabetically by name for deterministic output.
 */
async function writeLocalLock(lock, cwd) {
    const lockPath = getLocalLockPath(cwd);
    // Sort skills alphabetically for deterministic output / clean diffs
    const sortedSkills = {};
    for (const key of Object.keys(lock.skills).sort()) {
        sortedSkills[key] = lock.skills[key];
    }
    const sorted = { version: lock.version, skills: sortedSkills };
    const content = JSON.stringify(sorted, null, 2) + '\n';
    await (0, promises_1.writeFile)(lockPath, content, 'utf-8');
}
/**
 * Compute a SHA-256 hash from all files in a skill directory.
 * Reads all files recursively, sorts them by relative path for determinism,
 * and produces a single hash from their concatenated contents.
 */
async function computeSkillFolderHash(skillDir) {
    const files = [];
    await collectFiles(skillDir, skillDir, files);
    // Sort by relative path for deterministic hashing
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    const hash = (0, crypto_1.createHash)('sha256');
    for (const file of files) {
        // Include the path in the hash so renames are detected
        hash.update(file.relativePath);
        hash.update(file.content);
    }
    return hash.digest('hex');
}
async function collectFiles(baseDir, currentDir, results) {
    const entries = await (0, promises_1.readdir)(currentDir, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
        const fullPath = (0, path_1.join)(currentDir, entry.name);
        if (entry.isDirectory()) {
            // Skip .git and node_modules within skill dirs
            if (entry.name === '.git' || entry.name === 'node_modules')
                return;
            await collectFiles(baseDir, fullPath, results);
        }
        else if (entry.isFile()) {
            const content = await (0, promises_1.readFile)(fullPath);
            const relativePath = (0, path_1.relative)(baseDir, fullPath).split('\\').join('/');
            results.push({ relativePath, content });
        }
    }));
}
/**
 * Add or update a skill entry in the local lock file.
 */
async function addSkillToLocalLock(skillName, entry, cwd) {
    const lock = await readLocalLock(cwd);
    lock.skills[skillName] = entry;
    await writeLocalLock(lock, cwd);
}
/**
 * Remove a skill from the local lock file.
 */
async function removeSkillFromLocalLock(skillName, cwd) {
    const lock = await readLocalLock(cwd);
    if (!(skillName in lock.skills)) {
        return false;
    }
    delete lock.skills[skillName];
    await writeLocalLock(lock, cwd);
    return true;
}
function createEmptyLocalLock() {
    return {
        version: CURRENT_VERSION,
        skills: {},
    };
}
//# sourceMappingURL=local-lock.js.map