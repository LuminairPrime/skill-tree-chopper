"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeName = sanitizeName;
exports.getCanonicalSkillsDir = getCanonicalSkillsDir;
exports.getAgentBaseDir = getAgentBaseDir;
exports.installSkillForAgent = installSkillForAgent;
exports.isSkillInstalled = isSkillInstalled;
exports.getInstallPath = getInstallPath;
exports.getCanonicalPath = getCanonicalPath;
exports.installRemoteSkillForAgent = installRemoteSkillForAgent;
exports.installWellKnownSkillForAgent = installWellKnownSkillForAgent;
exports.installBlobSkillForAgent = installBlobSkillForAgent;
exports.listInstalledSkills = listInstalledSkills;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const agents_ts_1 = require("./agents.ts");
const constants_ts_1 = require("./constants.ts");
const skills_ts_1 = require("./skills.ts");
/**
 * Sanitizes a filename/directory name to prevent path traversal attacks
 * and ensures it follows kebab-case convention
 * @param name - The name to sanitize
 * @returns Sanitized name safe for use in file paths
 */
function sanitizeName(name) {
    const sanitized = name
        .toLowerCase()
        // Replace any sequence of characters that are NOT lowercase letters (a-z),
        // digits (0-9), dots (.), or underscores (_) with a single hyphen.
        // This converts spaces, special chars, and path traversal attempts (../) into hyphens.
        .replace(/[^a-z0-9._]+/g, '-')
        // Remove leading/trailing dots and hyphens to prevent hidden files (.) and
        // ensure clean directory names. The pattern matches:
        // - ^[.\-]+ : one or more dots or hyphens at the start
        // - [.\-]+$ : one or more dots or hyphens at the end
        .replace(/^[.\-]+|[.\-]+$/g, '');
    // Limit to 255 chars (common filesystem limit), fallback to 'unnamed-skill' if empty
    return sanitized.substring(0, 255) || 'unnamed-skill';
}
/**
 * Validates that a path is within an expected base directory
 * @param basePath - The expected base directory
 * @param targetPath - The path to validate
 * @returns true if targetPath is within basePath
 */
function isPathSafe(basePath, targetPath) {
    const normalizedBase = (0, path_1.normalize)((0, path_1.resolve)(basePath));
    const normalizedTarget = (0, path_1.normalize)((0, path_1.resolve)(targetPath));
    return normalizedTarget.startsWith(normalizedBase + path_1.sep) || normalizedTarget === normalizedBase;
}
// Dirent.isDirectory() is false for symlinks; follow and verify the target is a directory.
async function isDirEntryOrSymlinkToDir(entry, entryPath) {
    if (entry.isDirectory())
        return true;
    if (!entry.isSymbolicLink())
        return false;
    try {
        return (await (0, promises_1.stat)(entryPath)).isDirectory();
    }
    catch {
        return false;
    }
}
function getCanonicalSkillsDir(global, cwd) {
    const baseDir = global ? (0, os_1.homedir)() : cwd || process.cwd();
    return (0, path_1.join)(baseDir, constants_ts_1.AGENTS_DIR, constants_ts_1.SKILLS_SUBDIR);
}
/**
 * Gets the base directory for an agent's skills, respecting universal agents.
 * Universal agents always use the canonical directory, which prevents
 * redundant symlinks and double-listing of skills.
 */
function getAgentBaseDir(agentType, global, cwd) {
    if ((0, agents_ts_1.isUniversalAgent)(agentType)) {
        return getCanonicalSkillsDir(global, cwd);
    }
    const agent = agents_ts_1.agents[agentType];
    const baseDir = global ? (0, os_1.homedir)() : cwd || process.cwd();
    if (global) {
        if (agent.globalSkillsDir === undefined) {
            // This should be caught by callers checking support
            return (0, path_1.join)(baseDir, agent.skillsDir);
        }
        return agent.globalSkillsDir;
    }
    return (0, path_1.join)(baseDir, agent.skillsDir);
}
function resolveSymlinkTarget(linkPath, linkTarget) {
    return (0, path_1.resolve)((0, path_1.dirname)(linkPath), linkTarget);
}
/**
 * Cleans and recreates a directory for skill installation.
 *
 * This ensures:
 * 1. Renamed/deleted files from previous installs are removed
 * 2. Symlinks (including self-referential ones causing ELOOP) are handled
 *    when canonical and agent paths resolve to the same location
 */
async function cleanAndCreateDirectory(path) {
    try {
        await (0, promises_1.rm)(path, { recursive: true, force: true });
    }
    catch {
        // Ignore cleanup errors - mkdir will fail if there's a real problem
    }
    await (0, promises_1.mkdir)(path, { recursive: true });
}
/**
 * Resolve a path's parent directory through symlinks, keeping the final component.
 * This handles the case where a parent directory (e.g., ~/.claude/skills) is a symlink
 * to another location (e.g., ~/.agents/skills). In that case, computing relative paths
 * from the symlink path produces broken symlinks.
 *
 * Returns the real path of the parent + the original basename.
 * If realpath fails (parent doesn't exist), returns the original resolved path.
 */
async function resolveParentSymlinks(path) {
    const resolved = (0, path_1.resolve)(path);
    const dir = (0, path_1.dirname)(resolved);
    const base = (0, path_1.basename)(resolved);
    try {
        const realDir = await (0, promises_1.realpath)(dir);
        return (0, path_1.join)(realDir, base);
    }
    catch {
        return resolved;
    }
}
/**
 * Creates a symlink, handling cross-platform differences
 * Returns true if symlink was created, false if fallback to copy is needed
 */
async function createSymlink(target, linkPath) {
    try {
        const resolvedTarget = (0, path_1.resolve)(target);
        const resolvedLinkPath = (0, path_1.resolve)(linkPath);
        // Use realpath to handle cases where parent directories are symlinked.
        // This prevents deleting the canonical directory if the agent directory
        // is a symlink to the canonical location.
        const [realTarget, realLinkPath] = await Promise.all([
            (0, promises_1.realpath)(resolvedTarget).catch(() => resolvedTarget),
            (0, promises_1.realpath)(resolvedLinkPath).catch(() => resolvedLinkPath),
        ]);
        if (realTarget === realLinkPath) {
            return true;
        }
        // Also check with symlinks resolved in parent directories.
        // This handles cases where e.g. ~/.claude/skills is a symlink to ~/.agents/skills,
        // so ~/.claude/skills/<skill> and ~/.agents/skills/<skill> are physically the same.
        const realTargetWithParents = await resolveParentSymlinks(target);
        const realLinkPathWithParents = await resolveParentSymlinks(linkPath);
        if (realTargetWithParents === realLinkPathWithParents) {
            return true;
        }
        try {
            const stats = await (0, promises_1.lstat)(linkPath);
            if (stats.isSymbolicLink()) {
                const existingTarget = await (0, promises_1.readlink)(linkPath);
                if (resolveSymlinkTarget(linkPath, existingTarget) === resolvedTarget) {
                    return true;
                }
                await (0, promises_1.rm)(linkPath);
            }
            else {
                await (0, promises_1.rm)(linkPath, { recursive: true });
            }
        }
        catch (err) {
            // ELOOP = circular symlink, ENOENT = doesn't exist
            // For ELOOP, try to remove the broken symlink
            if (err && typeof err === 'object' && 'code' in err && err.code === 'ELOOP') {
                try {
                    await (0, promises_1.rm)(linkPath, { force: true });
                }
                catch {
                    // If we can't remove it, symlink creation will fail and trigger copy fallback
                }
            }
            // For ENOENT or other errors, continue to symlink creation
        }
        const linkDir = (0, path_1.dirname)(linkPath);
        await (0, promises_1.mkdir)(linkDir, { recursive: true });
        // Use the real (symlink-resolved) parent directory for computing the relative path.
        // This ensures the symlink target is correct even when the link's parent dir is a symlink.
        const realLinkDir = await resolveParentSymlinks(linkDir);
        const relativePath = (0, path_1.relative)(realLinkDir, target);
        const symlinkType = (0, os_1.platform)() === 'win32' ? 'junction' : undefined;
        await (0, promises_1.symlink)(relativePath, linkPath, symlinkType);
        return true;
    }
    catch {
        return false;
    }
}
async function installSkillForAgent(skill, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const isGlobal = options.global ?? false;
    const cwd = options.cwd || process.cwd();
    // Check if agent supports global installation
    if (isGlobal && agent.globalSkillsDir === undefined) {
        return {
            success: false,
            path: '',
            mode: options.mode ?? 'symlink',
            error: `${agent.displayName} does not support global skill installation`,
        };
    }
    // Sanitize skill name to prevent directory traversal
    const rawSkillName = skill.name || (0, path_1.basename)(skill.path);
    const skillName = sanitizeName(rawSkillName);
    // Canonical location: .agents/skills/<skill-name>
    const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
    const canonicalDir = (0, path_1.join)(canonicalBase, skillName);
    // Agent-specific location (for symlink)
    const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
    const agentDir = (0, path_1.join)(agentBase, skillName);
    const installMode = options.mode ?? 'symlink';
    // Validate paths
    if (!isPathSafe(canonicalBase, canonicalDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    if (!isPathSafe(agentBase, agentDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    try {
        // For copy mode, skip canonical directory and copy directly to agent location
        if (installMode === 'copy') {
            await cleanAndCreateDirectory(agentDir);
            await copyDirectory(skill.path, agentDir);
            return {
                success: true,
                path: agentDir,
                mode: 'copy',
            };
        }
        // Symlink mode: copy to canonical location and symlink to agent location
        await cleanAndCreateDirectory(canonicalDir);
        await copyDirectory(skill.path, canonicalDir);
        // For universal agents with global install, the skill is already in the canonical
        // ~/.agents/skills directory. Skip creating a symlink to the agent-specific global dir
        // (e.g. ~/.copilot/skills) to avoid duplicates.
        if (isGlobal && (0, agents_ts_1.isUniversalAgent)(agentType)) {
            return {
                success: true,
                path: canonicalDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
            };
        }
        const symlinkCreated = await createSymlink(canonicalDir, agentDir);
        if (!symlinkCreated) {
            // Symlink failed, fall back to copy
            await cleanAndCreateDirectory(agentDir);
            await copyDirectory(skill.path, agentDir);
            return {
                success: true,
                path: agentDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
                symlinkFailed: true,
            };
        }
        return {
            success: true,
            path: agentDir,
            canonicalPath: canonicalDir,
            mode: 'symlink',
        };
    }
    catch (error) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
const EXCLUDE_FILES = new Set(['metadata.json']);
const EXCLUDE_DIRS = new Set(['.git', '__pycache__', '__pypackages__']);
const isExcluded = (name, isDirectory = false) => {
    if (EXCLUDE_FILES.has(name))
        return true;
    if (isDirectory && EXCLUDE_DIRS.has(name))
        return true;
    return false;
};
async function copyDirectory(src, dest) {
    await (0, promises_1.mkdir)(dest, { recursive: true });
    const entries = await (0, promises_1.readdir)(src, { withFileTypes: true });
    // Copy files and directories in parallel
    await Promise.all(entries
        .filter((entry) => !isExcluded(entry.name, entry.isDirectory()))
        .map(async (entry) => {
        const srcPath = (0, path_1.join)(src, entry.name);
        const destPath = (0, path_1.join)(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        }
        else {
            try {
                await (0, promises_1.cp)(srcPath, destPath, {
                    // If the file is a symlink to elsewhere in a remote skill, it may not
                    // resolve correctly once it has been copied to the local location.
                    // `dereference: true` tells Node to copy the file instead of copying
                    // the symlink. `recursive: true` handles symlinks pointing to directories.
                    dereference: true,
                    recursive: true,
                });
            }
            catch (err) {
                // Skip broken symlinks (e.g., pointing to absolute paths on another machine)
                // instead of aborting the entire install.
                if (err instanceof Error &&
                    'code' in err &&
                    err.code === 'ENOENT' &&
                    entry.isSymbolicLink()) {
                    console.warn(`Skipping broken symlink: ${srcPath}`);
                }
                else {
                    throw err;
                }
            }
        }
    }));
}
async function isSkillInstalled(skillName, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const sanitized = sanitizeName(skillName);
    // Agent doesn't support global installation
    if (options.global && agent.globalSkillsDir === undefined) {
        return false;
    }
    const targetBase = options.global
        ? agent.globalSkillsDir
        : (0, path_1.join)(options.cwd || process.cwd(), agent.skillsDir);
    const skillDir = (0, path_1.join)(targetBase, sanitized);
    if (!isPathSafe(targetBase, skillDir)) {
        return false;
    }
    try {
        await (0, promises_1.access)(skillDir);
        return true;
    }
    catch {
        return false;
    }
}
function getInstallPath(skillName, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const cwd = options.cwd || process.cwd();
    const sanitized = sanitizeName(skillName);
    const targetBase = getAgentBaseDir(agentType, options.global ?? false, options.cwd);
    const installPath = (0, path_1.join)(targetBase, sanitized);
    if (!isPathSafe(targetBase, installPath)) {
        throw new Error('Invalid skill name: potential path traversal detected');
    }
    return installPath;
}
/**
 * Gets the canonical .agents/skills/<skill> path
 */
function getCanonicalPath(skillName, options = {}) {
    const sanitized = sanitizeName(skillName);
    const canonicalBase = getCanonicalSkillsDir(options.global ?? false, options.cwd);
    const canonicalPath = (0, path_1.join)(canonicalBase, sanitized);
    if (!isPathSafe(canonicalBase, canonicalPath)) {
        throw new Error('Invalid skill name: potential path traversal detected');
    }
    return canonicalPath;
}
/**
 * Install a remote skill from any host provider.
 * The skill directory name is derived from the installName field.
 * Supports symlink mode (writes to canonical location and symlinks to agent dirs)
 * or copy mode (writes directly to each agent dir).
 */
async function installRemoteSkillForAgent(skill, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const isGlobal = options.global ?? false;
    const cwd = options.cwd || process.cwd();
    const installMode = options.mode ?? 'symlink';
    // Check if agent supports global installation
    if (isGlobal && agent.globalSkillsDir === undefined) {
        return {
            success: false,
            path: '',
            mode: installMode,
            error: `${agent.displayName} does not support global skill installation`,
        };
    }
    // Use installName as the skill directory name
    const skillName = sanitizeName(skill.installName);
    // Canonical location: .agents/skills/<skill-name>
    const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
    const canonicalDir = (0, path_1.join)(canonicalBase, skillName);
    // Agent-specific location (for symlink)
    const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
    const agentDir = (0, path_1.join)(agentBase, skillName);
    // Validate paths
    if (!isPathSafe(canonicalBase, canonicalDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    if (!isPathSafe(agentBase, agentDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    try {
        // For copy mode, write directly to agent location
        if (installMode === 'copy') {
            await cleanAndCreateDirectory(agentDir);
            const skillMdPath = (0, path_1.join)(agentDir, 'SKILL.md');
            await (0, promises_1.writeFile)(skillMdPath, skill.content, 'utf-8');
            return {
                success: true,
                path: agentDir,
                mode: 'copy',
            };
        }
        // Symlink mode: write to canonical location and symlink to agent location
        await cleanAndCreateDirectory(canonicalDir);
        const skillMdPath = (0, path_1.join)(canonicalDir, 'SKILL.md');
        await (0, promises_1.writeFile)(skillMdPath, skill.content, 'utf-8');
        // For universal agents with global install, skip creating agent-specific symlink
        if (isGlobal && (0, agents_ts_1.isUniversalAgent)(agentType)) {
            return {
                success: true,
                path: canonicalDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
            };
        }
        const symlinkCreated = await createSymlink(canonicalDir, agentDir);
        if (!symlinkCreated) {
            // Symlink failed, fall back to copy
            await cleanAndCreateDirectory(agentDir);
            const agentSkillMdPath = (0, path_1.join)(agentDir, 'SKILL.md');
            await (0, promises_1.writeFile)(agentSkillMdPath, skill.content, 'utf-8');
            return {
                success: true,
                path: agentDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
                symlinkFailed: true,
            };
        }
        return {
            success: true,
            path: agentDir,
            canonicalPath: canonicalDir,
            mode: 'symlink',
        };
    }
    catch (error) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Install a well-known skill with multiple files.
 * The skill directory name is derived from the installName field.
 * All files from the skill's files map are written to the installation directory.
 * Supports symlink mode (writes to canonical location and symlinks to agent dirs)
 * or copy mode (writes directly to each agent dir).
 */
async function installWellKnownSkillForAgent(skill, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const isGlobal = options.global ?? false;
    const cwd = options.cwd || process.cwd();
    const installMode = options.mode ?? 'symlink';
    // Check if agent supports global installation
    if (isGlobal && agent.globalSkillsDir === undefined) {
        return {
            success: false,
            path: '',
            mode: installMode,
            error: `${agent.displayName} does not support global skill installation`,
        };
    }
    // Use installName as the skill directory name
    const skillName = sanitizeName(skill.installName);
    // Canonical location: .agents/skills/<skill-name>
    const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
    const canonicalDir = (0, path_1.join)(canonicalBase, skillName);
    // Agent-specific location (for symlink)
    const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
    const agentDir = (0, path_1.join)(agentBase, skillName);
    // Validate paths
    if (!isPathSafe(canonicalBase, canonicalDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    if (!isPathSafe(agentBase, agentDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    /**
     * Write all skill files to a directory (assumes directory already exists)
     */
    async function writeSkillFiles(targetDir) {
        for (const [filePath, content] of skill.files) {
            // Validate file path doesn't escape the target directory
            const fullPath = (0, path_1.join)(targetDir, filePath);
            if (!isPathSafe(targetDir, fullPath)) {
                continue; // Skip files that would escape the directory
            }
            // Create parent directories if needed
            const parentDir = (0, path_1.dirname)(fullPath);
            if (parentDir !== targetDir) {
                await (0, promises_1.mkdir)(parentDir, { recursive: true });
            }
            await (0, promises_1.writeFile)(fullPath, content, 'utf-8');
        }
    }
    try {
        // For copy mode, write directly to agent location
        if (installMode === 'copy') {
            await cleanAndCreateDirectory(agentDir);
            await writeSkillFiles(agentDir);
            return {
                success: true,
                path: agentDir,
                mode: 'copy',
            };
        }
        // Symlink mode: write to canonical location and symlink to agent location
        await cleanAndCreateDirectory(canonicalDir);
        await writeSkillFiles(canonicalDir);
        // For universal agents with global install, skip creating agent-specific symlink
        if (isGlobal && (0, agents_ts_1.isUniversalAgent)(agentType)) {
            return {
                success: true,
                path: canonicalDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
            };
        }
        const symlinkCreated = await createSymlink(canonicalDir, agentDir);
        if (!symlinkCreated) {
            // Symlink failed, fall back to copy
            await cleanAndCreateDirectory(agentDir);
            await writeSkillFiles(agentDir);
            return {
                success: true,
                path: agentDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
                symlinkFailed: true,
            };
        }
        return {
            success: true,
            path: agentDir,
            canonicalPath: canonicalDir,
            mode: 'symlink',
        };
    }
    catch (error) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Install a blob-downloaded skill (fetched from skills.sh download API).
 * Similar to installWellKnownSkillForAgent but takes the snapshot file format
 * (array of { path, contents }) instead of a Map.
 */
async function installBlobSkillForAgent(skill, agentType, options = {}) {
    const agent = agents_ts_1.agents[agentType];
    const isGlobal = options.global ?? false;
    const cwd = options.cwd || process.cwd();
    const installMode = options.mode ?? 'symlink';
    if (isGlobal && agent.globalSkillsDir === undefined) {
        return {
            success: false,
            path: '',
            mode: installMode,
            error: `${agent.displayName} does not support global skill installation`,
        };
    }
    const skillName = sanitizeName(skill.installName);
    const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
    const canonicalDir = (0, path_1.join)(canonicalBase, skillName);
    const agentBase = getAgentBaseDir(agentType, isGlobal, cwd);
    const agentDir = (0, path_1.join)(agentBase, skillName);
    if (!isPathSafe(canonicalBase, canonicalDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    if (!isPathSafe(agentBase, agentDir)) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: 'Invalid skill name: potential path traversal detected',
        };
    }
    async function writeSkillFiles(targetDir) {
        for (const file of skill.files) {
            const fullPath = (0, path_1.join)(targetDir, file.path);
            if (!isPathSafe(targetDir, fullPath))
                continue;
            const parentDir = (0, path_1.dirname)(fullPath);
            if (parentDir !== targetDir) {
                await (0, promises_1.mkdir)(parentDir, { recursive: true });
            }
            await (0, promises_1.writeFile)(fullPath, file.contents, 'utf-8');
        }
    }
    try {
        if (installMode === 'copy') {
            await cleanAndCreateDirectory(agentDir);
            await writeSkillFiles(agentDir);
            return { success: true, path: agentDir, mode: 'copy' };
        }
        // Symlink mode
        await cleanAndCreateDirectory(canonicalDir);
        await writeSkillFiles(canonicalDir);
        if (isGlobal && (0, agents_ts_1.isUniversalAgent)(agentType)) {
            return {
                success: true,
                path: canonicalDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
            };
        }
        const symlinkCreated = await createSymlink(canonicalDir, agentDir);
        if (!symlinkCreated) {
            await cleanAndCreateDirectory(agentDir);
            await writeSkillFiles(agentDir);
            return {
                success: true,
                path: agentDir,
                canonicalPath: canonicalDir,
                mode: 'symlink',
                symlinkFailed: true,
            };
        }
        return {
            success: true,
            path: agentDir,
            canonicalPath: canonicalDir,
            mode: 'symlink',
        };
    }
    catch (error) {
        return {
            success: false,
            path: agentDir,
            mode: installMode,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
/**
 * Lists all installed skills from canonical locations
 * @param options - Options for listing skills
 * @returns Array of installed skills with metadata
 */
async function listInstalledSkills(options = {}) {
    const cwd = options.cwd || process.cwd();
    // Use a Map to deduplicate skills by scope:name
    const skillsMap = new Map();
    const scopes = [];
    // Detect which agents are actually installed
    const detectedAgents = await (0, agents_ts_1.detectInstalledAgents)();
    const agentFilter = options.agentFilter;
    const agentsToCheck = agentFilter
        ? detectedAgents.filter((a) => agentFilter.includes(a))
        : detectedAgents;
    // Determine which scopes to scan
    const scopeTypes = [];
    if (options.global === undefined) {
        scopeTypes.push({ global: false }, { global: true });
    }
    else {
        scopeTypes.push({ global: options.global });
    }
    // Build list of directories to scan: canonical + each installed agent's directory
    //
    // Scanning workflow:
    //
    //   detectInstalledAgents()
    //            │
    //            ▼
    //   for each scope (project / global)
    //            │
    //            ├──▶ scan canonical dir ──▶ .agents/skills, ~/.agents/skills
    //            │
    //            ├──▶ scan each installed agent's dir ──▶ .cursor/skills, .claude/skills, ...
    //            │
    //            ▼
    //   deduplicate by skill name
    //
    // Trade-off: More readdir() calls, but most non-existent dirs fail fast.
    // Skills in agent-specific dirs skip the expensive "check all agents" loop.
    //
    for (const { global: isGlobal } of scopeTypes) {
        // Add canonical directory
        scopes.push({ global: isGlobal, path: getCanonicalSkillsDir(isGlobal, cwd) });
        // Add each installed agent's skills directory
        for (const agentType of agentsToCheck) {
            const agent = agents_ts_1.agents[agentType];
            if (isGlobal && agent.globalSkillsDir === undefined) {
                continue;
            }
            const agentDir = isGlobal ? agent.globalSkillsDir : (0, path_1.join)(cwd, agent.skillsDir);
            // Avoid duplicate paths
            if (!scopes.some((s) => s.path === agentDir && s.global === isGlobal)) {
                scopes.push({ global: isGlobal, path: agentDir, agentType });
            }
        }
        // Also scan skill directories for agents NOT in agentsToCheck, in case
        // skills were installed with `--agent <name>` but the agent is no longer
        // detected (e.g. ~/.openclaw was removed).  Only add dirs that actually
        // exist on disk to avoid unnecessary readdir errors.
        const allAgentTypes = Object.keys(agents_ts_1.agents);
        for (const agentType of allAgentTypes) {
            if (agentsToCheck.includes(agentType))
                continue;
            const agent = agents_ts_1.agents[agentType];
            if (isGlobal && agent.globalSkillsDir === undefined)
                continue;
            const agentDir = isGlobal ? agent.globalSkillsDir : (0, path_1.join)(cwd, agent.skillsDir);
            if (scopes.some((s) => s.path === agentDir && s.global === isGlobal))
                continue;
            if ((0, fs_1.existsSync)(agentDir)) {
                scopes.push({ global: isGlobal, path: agentDir, agentType });
            }
        }
    }
    for (const scope of scopes) {
        try {
            const entries = await (0, promises_1.readdir)(scope.path, { withFileTypes: true });
            for (const entry of entries) {
                const skillDir = (0, path_1.join)(scope.path, entry.name);
                if (!(await isDirEntryOrSymlinkToDir(entry, skillDir)))
                    continue;
                const skillMdPath = (0, path_1.join)(skillDir, 'SKILL.md');
                // Check if SKILL.md exists
                try {
                    await (0, promises_1.stat)(skillMdPath);
                }
                catch {
                    // SKILL.md doesn't exist, skip this directory
                    continue;
                }
                // Parse the skill
                const skill = await (0, skills_ts_1.parseSkillMd)(skillMdPath);
                if (!skill) {
                    continue;
                }
                const scopeKey = scope.global ? 'global' : 'project';
                const skillKey = `${scopeKey}:${skill.name}`;
                // If scanning an agent-specific directory, attribute directly to that agent
                if (scope.agentType) {
                    if (skillsMap.has(skillKey)) {
                        const existing = skillsMap.get(skillKey);
                        if (!existing.agents.includes(scope.agentType)) {
                            existing.agents.push(scope.agentType);
                        }
                    }
                    else {
                        skillsMap.set(skillKey, {
                            name: skill.name,
                            description: skill.description,
                            path: skillDir,
                            canonicalPath: skillDir,
                            scope: scopeKey,
                            agents: [scope.agentType],
                        });
                    }
                    continue;
                }
                // For canonical directory, check which agents have this skill
                const sanitizedSkillName = sanitizeName(skill.name);
                const installedAgents = [];
                for (const agentType of agentsToCheck) {
                    const agent = agents_ts_1.agents[agentType];
                    if (scope.global && agent.globalSkillsDir === undefined) {
                        continue;
                    }
                    const agentBase = scope.global ? agent.globalSkillsDir : (0, path_1.join)(cwd, agent.skillsDir);
                    let found = false;
                    // Try exact directory name matches
                    const possibleNames = Array.from(new Set([
                        entry.name,
                        sanitizedSkillName,
                        skill.name
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[\/\\:\0]/g, ''),
                    ]));
                    for (const possibleName of possibleNames) {
                        const agentSkillDir = (0, path_1.join)(agentBase, possibleName);
                        if (!isPathSafe(agentBase, agentSkillDir))
                            continue;
                        try {
                            await (0, promises_1.access)(agentSkillDir);
                            found = true;
                            break;
                        }
                        catch {
                            // Try next name
                        }
                    }
                    // Fallback: scan all directories and check SKILL.md files
                    // Handles cases where directory names don't match (e.g., "git-review" vs "Git Review Before Commit")
                    if (!found) {
                        try {
                            const agentEntries = await (0, promises_1.readdir)(agentBase, { withFileTypes: true });
                            for (const agentEntry of agentEntries) {
                                const candidateDir = (0, path_1.join)(agentBase, agentEntry.name);
                                if (!(await isDirEntryOrSymlinkToDir(agentEntry, candidateDir)))
                                    continue;
                                if (!isPathSafe(agentBase, candidateDir))
                                    continue;
                                try {
                                    const candidateSkillMd = (0, path_1.join)(candidateDir, 'SKILL.md');
                                    await (0, promises_1.stat)(candidateSkillMd);
                                    const candidateSkill = await (0, skills_ts_1.parseSkillMd)(candidateSkillMd);
                                    if (candidateSkill && candidateSkill.name === skill.name) {
                                        found = true;
                                        break;
                                    }
                                }
                                catch {
                                    // Not a valid skill directory
                                }
                            }
                        }
                        catch {
                            // Agent base directory doesn't exist
                        }
                    }
                    if (found) {
                        installedAgents.push(agentType);
                    }
                }
                if (skillsMap.has(skillKey)) {
                    // Merge agents
                    const existing = skillsMap.get(skillKey);
                    for (const agent of installedAgents) {
                        if (!existing.agents.includes(agent)) {
                            existing.agents.push(agent);
                        }
                    }
                }
                else {
                    skillsMap.set(skillKey, {
                        name: skill.name,
                        description: skill.description,
                        path: skillDir,
                        canonicalPath: skillDir,
                        scope: scopeKey,
                        agents: installedAgents,
                    });
                }
            }
        }
        catch {
            // Directory doesn't exist, skip
        }
    }
    return Array.from(skillsMap.values());
}
//# sourceMappingURL=installer.js.map