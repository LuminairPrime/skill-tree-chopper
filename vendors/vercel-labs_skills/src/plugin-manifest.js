"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginSkillPaths = getPluginSkillPaths;
exports.getPluginGroupings = getPluginGroupings;
const promises_1 = require("fs/promises");
const path_1 = require("path");
/**
 * Check if a path is contained within a base directory.
 * Prevents path traversal attacks via `..` segments or absolute paths.
 */
function isContainedIn(targetPath, basePath) {
    const normalizedBase = (0, path_1.normalize)((0, path_1.resolve)(basePath));
    const normalizedTarget = (0, path_1.normalize)((0, path_1.resolve)(targetPath));
    return normalizedTarget.startsWith(normalizedBase + path_1.sep) || normalizedTarget === normalizedBase;
}
/**
 * Validate that a relative path follows Claude Code conventions.
 * Paths must start with './' per the plugin manifest spec.
 */
function isValidRelativePath(path) {
    return path.startsWith('./');
}
/**
 * Extract skill search directories from plugin manifests.
 * Handles both marketplace.json (multi-plugin) and plugin.json (single plugin).
 * Only resolves local paths - remote sources are skipped.
 *
 * Returns directories that CONTAIN skills (to be searched for child SKILL.md files).
 * For explicit skill paths in manifests, adds the parent directory so the
 * existing discovery loop finds them.
 */
async function getPluginSkillPaths(basePath) {
    const searchDirs = [];
    // Helper: add skill paths for a plugin at a given base path
    // Only adds paths that are contained within basePath (security: prevents traversal)
    const addPluginSkillPaths = (pluginBase, skills) => {
        // Validate pluginBase itself is contained
        if (!isContainedIn(pluginBase, basePath))
            return;
        if (skills && skills.length > 0) {
            // Plugin explicitly declares skill paths - add parent dirs so existing loop finds them
            for (const skillPath of skills) {
                // Validate skill path starts with './' (per Claude Code convention)
                if (!isValidRelativePath(skillPath))
                    continue;
                const skillDir = (0, path_1.dirname)((0, path_1.join)(pluginBase, skillPath));
                if (isContainedIn(skillDir, basePath)) {
                    searchDirs.push(skillDir);
                }
            }
        }
        // Always add conventional skills/ directory for discovery
        // (deduplication happens via seenNames in discoverSkills)
        searchDirs.push((0, path_1.join)(pluginBase, 'skills'));
    };
    // Try marketplace.json (multi-plugin catalog)
    try {
        const content = await (0, promises_1.readFile)((0, path_1.join)(basePath, '.claude-plugin/marketplace.json'), 'utf-8');
        const manifest = JSON.parse(content);
        const pluginRoot = manifest.metadata?.pluginRoot;
        // Validate pluginRoot starts with './' if provided (per Claude Code convention)
        const validPluginRoot = pluginRoot === undefined || isValidRelativePath(pluginRoot);
        if (validPluginRoot) {
            for (const plugin of manifest.plugins ?? []) {
                // Skip remote sources (object with source/repo) - only handle local string paths
                if (typeof plugin.source !== 'string' && plugin.source !== undefined)
                    continue;
                // Validate source starts with './' if provided (per Claude Code convention)
                if (plugin.source !== undefined && !isValidRelativePath(plugin.source))
                    continue;
                const pluginBase = (0, path_1.join)(basePath, pluginRoot ?? '', plugin.source ?? '');
                addPluginSkillPaths(pluginBase, plugin.skills);
            }
        }
    }
    catch {
        // File doesn't exist or invalid JSON
    }
    // Try plugin.json (single plugin at root)
    try {
        const content = await (0, promises_1.readFile)((0, path_1.join)(basePath, '.claude-plugin/plugin.json'), 'utf-8');
        const manifest = JSON.parse(content);
        addPluginSkillPaths(basePath, manifest.skills);
    }
    catch {
        // File doesn't exist or invalid JSON
    }
    return searchDirs;
}
/**
 * Get a map of skill directory paths to plugin names from plugin manifests.
 * This allows grouping skills by their parent plugin.
 *
 * Returns Map<AbsolutePath, PluginName>
 */
async function getPluginGroupings(basePath) {
    const groupings = new Map();
    // Try marketplace.json (multi-plugin catalog)
    try {
        const content = await (0, promises_1.readFile)((0, path_1.join)(basePath, '.claude-plugin/marketplace.json'), 'utf-8');
        const manifest = JSON.parse(content);
        const pluginRoot = manifest.metadata?.pluginRoot;
        // Validate pluginRoot starts with './' if provided (per Claude Code convention)
        const validPluginRoot = pluginRoot === undefined || isValidRelativePath(pluginRoot);
        if (validPluginRoot) {
            for (const plugin of manifest.plugins ?? []) {
                if (!plugin.name)
                    continue;
                // Skip remote sources (object with source/repo) - only handle local string paths
                if (typeof plugin.source !== 'string' && plugin.source !== undefined)
                    continue;
                // Validate source starts with './' if provided (per Claude Code convention)
                if (plugin.source !== undefined && !isValidRelativePath(plugin.source))
                    continue;
                const pluginBase = (0, path_1.join)(basePath, pluginRoot ?? '', plugin.source ?? '');
                // Validate pluginBase itself is contained
                if (!isContainedIn(pluginBase, basePath))
                    continue;
                if (plugin.skills && plugin.skills.length > 0) {
                    for (const skillPath of plugin.skills) {
                        // Validate skill path starts with './' (per Claude Code convention)
                        if (!isValidRelativePath(skillPath))
                            continue;
                        const skillDir = (0, path_1.join)(pluginBase, skillPath);
                        if (isContainedIn(skillDir, basePath)) {
                            // Store absolute path as key for reliable matching
                            groupings.set((0, path_1.resolve)(skillDir), plugin.name);
                        }
                    }
                }
            }
        }
    }
    catch {
        // File doesn't exist or invalid JSON
    }
    // Try plugin.json (single plugin at root)
    try {
        const content = await (0, promises_1.readFile)((0, path_1.join)(basePath, '.claude-plugin/plugin.json'), 'utf-8');
        const manifest = JSON.parse(content);
        if (manifest.name && manifest.skills && manifest.skills.length > 0) {
            for (const skillPath of manifest.skills) {
                if (!isValidRelativePath(skillPath))
                    continue;
                const skillDir = (0, path_1.join)(basePath, skillPath);
                if (isContainedIn(skillDir, basePath)) {
                    groupings.set((0, path_1.resolve)(skillDir), manifest.name);
                }
            }
        }
    }
    catch {
        // File doesn't exist or invalid JSON
    }
    return groupings;
}
//# sourceMappingURL=plugin-manifest.js.map