"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldInstallInternalSkills = shouldInstallInternalSkills;
exports.parseSkillMd = parseSkillMd;
exports.isSubpathSafe = isSubpathSafe;
exports.discoverSkills = discoverSkills;
exports.getSkillDisplayName = getSkillDisplayName;
exports.filterSkills = filterSkills;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const frontmatter_ts_1 = require("./frontmatter.ts");
const sanitize_ts_1 = require("./sanitize.ts");
const plugin_manifest_ts_1 = require("./plugin-manifest.ts");
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__'];
/**
 * Check if internal skills should be installed.
 * Internal skills are hidden by default unless INSTALL_INTERNAL_SKILLS=1 is set.
 */
function shouldInstallInternalSkills() {
    const envValue = process.env.INSTALL_INTERNAL_SKILLS;
    return envValue === '1' || envValue === 'true';
}
async function hasSkillMd(dir) {
    try {
        const skillPath = (0, path_1.join)(dir, 'SKILL.md');
        const stats = await (0, promises_1.stat)(skillPath);
        return stats.isFile();
    }
    catch {
        return false;
    }
}
async function parseSkillMd(skillMdPath, options) {
    try {
        const content = await (0, promises_1.readFile)(skillMdPath, 'utf-8');
        const { data } = (0, frontmatter_ts_1.parseFrontmatter)(content);
        if (!data.name || !data.description) {
            return null;
        }
        // Ensure name and description are strings (YAML can parse numbers, booleans, etc.)
        if (typeof data.name !== 'string' || typeof data.description !== 'string') {
            return null;
        }
        // Skip internal skills unless:
        // 1. INSTALL_INTERNAL_SKILLS=1 is set, OR
        // 2. includeInternal option is true (e.g., when user explicitly requests a skill)
        const isInternal = data.metadata?.internal === true;
        if (isInternal && !shouldInstallInternalSkills() && !options?.includeInternal) {
            return null;
        }
        return {
            name: (0, sanitize_ts_1.sanitizeMetadata)(data.name),
            description: (0, sanitize_ts_1.sanitizeMetadata)(data.description),
            path: (0, path_1.dirname)(skillMdPath),
            rawContent: content,
            metadata: data.metadata,
        };
    }
    catch {
        return null;
    }
}
async function findSkillDirs(dir, depth = 0, maxDepth = 5) {
    if (depth > maxDepth)
        return [];
    try {
        const [hasSkill, entries] = await Promise.all([
            hasSkillMd(dir),
            (0, promises_1.readdir)(dir, { withFileTypes: true }).catch(() => []),
        ]);
        const currentDir = hasSkill ? [dir] : [];
        // Search subdirectories in parallel
        const subDirResults = await Promise.all(entries
            .filter((entry) => entry.isDirectory() && !SKIP_DIRS.includes(entry.name))
            .map((entry) => findSkillDirs((0, path_1.join)(dir, entry.name), depth + 1, maxDepth)));
        return [...currentDir, ...subDirResults.flat()];
    }
    catch {
        return [];
    }
}
/**
 * Validates that a resolved subpath stays within the base directory.
 * Prevents path traversal attacks where subpath contains ".." segments
 * that would escape the cloned repository directory.
 */
function isSubpathSafe(basePath, subpath) {
    const normalizedBase = (0, path_1.normalize)((0, path_1.resolve)(basePath));
    const normalizedTarget = (0, path_1.normalize)((0, path_1.resolve)((0, path_1.join)(basePath, subpath)));
    return normalizedTarget.startsWith(normalizedBase + path_1.sep) || normalizedTarget === normalizedBase;
}
async function discoverSkills(basePath, subpath, options) {
    const skills = [];
    const seenNames = new Set();
    // Validate subpath doesn't escape basePath (prevent path traversal)
    if (subpath && !isSubpathSafe(basePath, subpath)) {
        throw new Error(`Invalid subpath: "${subpath}" resolves outside the repository directory. Subpath must not contain ".." segments that escape the base path.`);
    }
    const searchPath = subpath ? (0, path_1.join)(basePath, subpath) : basePath;
    // Get plugin groupings to map skills to their parent plugin
    // We search for plugin definitions from the base search path
    const pluginGroupings = await (0, plugin_manifest_ts_1.getPluginGroupings)(searchPath);
    // Helper to assign plugin name if available
    const enhanceSkill = (skill) => {
        const resolvedPath = (0, path_1.resolve)(skill.path);
        if (pluginGroupings.has(resolvedPath)) {
            skill.pluginName = pluginGroupings.get(resolvedPath);
        }
        return skill;
    };
    // If pointing directly at a skill, add it (and return early unless fullDepth is set)
    if (await hasSkillMd(searchPath)) {
        let skill = await parseSkillMd((0, path_1.join)(searchPath, 'SKILL.md'), options);
        if (skill) {
            skill = enhanceSkill(skill);
            skills.push(skill);
            seenNames.add(skill.name);
            // Only return early if fullDepth is not set
            if (!options?.fullDepth) {
                return skills;
            }
        }
    }
    // Search common skill locations first
    const prioritySearchDirs = [
        searchPath,
        (0, path_1.join)(searchPath, 'skills'),
        (0, path_1.join)(searchPath, 'skills/.curated'),
        (0, path_1.join)(searchPath, 'skills/.experimental'),
        (0, path_1.join)(searchPath, 'skills/.system'),
        (0, path_1.join)(searchPath, '.agents/skills'),
        (0, path_1.join)(searchPath, '.claude/skills'),
        (0, path_1.join)(searchPath, '.cline/skills'),
        (0, path_1.join)(searchPath, '.codebuddy/skills'),
        (0, path_1.join)(searchPath, '.codex/skills'),
        (0, path_1.join)(searchPath, '.commandcode/skills'),
        (0, path_1.join)(searchPath, '.continue/skills'),
        (0, path_1.join)(searchPath, '.github/skills'),
        (0, path_1.join)(searchPath, '.goose/skills'),
        (0, path_1.join)(searchPath, '.iflow/skills'),
        (0, path_1.join)(searchPath, '.junie/skills'),
        (0, path_1.join)(searchPath, '.kilocode/skills'),
        (0, path_1.join)(searchPath, '.kiro/skills'),
        (0, path_1.join)(searchPath, '.mux/skills'),
        (0, path_1.join)(searchPath, '.neovate/skills'),
        (0, path_1.join)(searchPath, '.opencode/skills'),
        (0, path_1.join)(searchPath, '.openhands/skills'),
        (0, path_1.join)(searchPath, '.pi/skills'),
        (0, path_1.join)(searchPath, '.qoder/skills'),
        (0, path_1.join)(searchPath, '.roo/skills'),
        (0, path_1.join)(searchPath, '.trae/skills'),
        (0, path_1.join)(searchPath, '.windsurf/skills'),
        (0, path_1.join)(searchPath, '.zencoder/skills'),
    ];
    // Add skill paths declared in plugin manifests
    prioritySearchDirs.push(...(await (0, plugin_manifest_ts_1.getPluginSkillPaths)(searchPath)));
    for (const dir of prioritySearchDirs) {
        try {
            const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const skillDir = (0, path_1.join)(dir, entry.name);
                    if (await hasSkillMd(skillDir)) {
                        let skill = await parseSkillMd((0, path_1.join)(skillDir, 'SKILL.md'), options);
                        if (skill && !seenNames.has(skill.name)) {
                            skill = enhanceSkill(skill);
                            skills.push(skill);
                            seenNames.add(skill.name);
                        }
                    }
                }
            }
        }
        catch {
            // Directory doesn't exist
        }
    }
    // Fall back to recursive search if nothing found, or if fullDepth is set
    if (skills.length === 0 || options?.fullDepth) {
        const allSkillDirs = await findSkillDirs(searchPath);
        for (const skillDir of allSkillDirs) {
            let skill = await parseSkillMd((0, path_1.join)(skillDir, 'SKILL.md'), options);
            if (skill && !seenNames.has(skill.name)) {
                skill = enhanceSkill(skill);
                skills.push(skill);
                seenNames.add(skill.name);
            }
        }
    }
    return skills;
}
function getSkillDisplayName(skill) {
    return skill.name || (0, path_1.basename)(skill.path);
}
/**
 * Filter skills based on user input (case-insensitive direct matching).
 * Multi-word skill names must be quoted on the command line.
 */
function filterSkills(skills, inputNames) {
    const normalizedInputs = inputNames.map((n) => n.toLowerCase());
    return skills.filter((skill) => {
        const name = skill.name.toLowerCase();
        const displayName = getSkillDisplayName(skill).toLowerCase();
        return normalizedInputs.some((input) => input === name || input === displayName);
    });
}
//# sourceMappingURL=skills.js.map