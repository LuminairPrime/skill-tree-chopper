"use strict";
/**
 * Unit tests for source-parser.ts
 *
 * These tests verify the URL parsing logic - they don't make network requests
 * or clone repositories. They ensure that given a URL string, the parser
 * correctly extracts type, url, ref (branch), and subpath.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const os_1 = require("os");
const source_parser_ts_1 = require("../src/source-parser.ts");
const isWindows = (0, os_1.platform)() === 'win32';
(0, vitest_1.describe)('parseSource', () => {
    (0, vitest_1.describe)('GitHub URL tests', () => {
        (0, vitest_1.it)('GitHub URL - basic repo', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub URL - with .git suffix', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
        });
        (0, vitest_1.it)('GitHub URL - with .git suffix and #branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo.git#feature/install');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature/install');
        });
        (0, vitest_1.it)('GitHub blob URL anchor is not treated as a ref', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/blob/main/README.md#L10');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub URL - tree with branch only', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/feature-branch');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature-branch');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub URL - tree with branch and path', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/main/skills/my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('main');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
        // Note: Branch names with slashes (e.g., feature/my-feature) are ambiguous.
        // The parser treats the first segment as branch and rest as path.
        // This matches GitHub's URL structure behavior.
        (0, vitest_1.it)('GitHub URL - tree with slash in path (ambiguous branch)', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/feature/my-feature');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature');
            (0, vitest_1.expect)(result.subpath).toBe('my-feature');
        });
    });
    (0, vitest_1.describe)('GitLab URL tests', () => {
        (0, vitest_1.it)('GitLab URL - basic repo', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
        });
        (0, vitest_1.it)('GitLab URL - tree with branch only', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo/-/tree/develop');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('develop');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitLab URL - tree with branch and path', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo/-/tree/main/src/skills');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('main');
            (0, vitest_1.expect)(result.subpath).toBe('src/skills');
        });
        (0, vitest_1.it)('GitLab URL - with .git suffix', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo.git');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/owner/repo.git');
        });
        (0, vitest_1.it)('GitLab URL - subgroup (2 levels)', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/group/subgroup/repo');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/group/subgroup/repo.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
        });
        (0, vitest_1.it)('GitLab URL - subgroup (3 levels)', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/coresofthq/ai/agent-skills');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/coresofthq/ai/agent-skills.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
        });
        (0, vitest_1.it)('GitLab URL - deep subgroup with .git suffix', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/org/team/project/repo.git');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/org/team/project/repo.git');
        });
        (0, vitest_1.it)('GitLab URL - subgroup with tree/branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/group/subgroup/repo/-/tree/main');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/group/subgroup/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('main');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitLab URL - subgroup with tree/branch/path', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/group/subgroup/repo/-/tree/main/path/to/skill');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/group/subgroup/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('main');
            (0, vitest_1.expect)(result.subpath).toBe('path/to/skill');
        });
        (0, vitest_1.it)('GitLab URL - trailing slash', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://gitlab.com/group/subgroup/repo/');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/group/subgroup/repo.git');
        });
    });
    (0, vitest_1.describe)('GitHub shorthand tests', () => {
        (0, vitest_1.it)('GitHub shorthand - owner/repo', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBeUndefined();
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo/path', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo/skills/my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo/ trailing slash', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo/');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo@skill (skill filter syntax)', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo@my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.skillFilter).toBe('my-skill');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo@skill with hyphenated skill name', () => {
            const result = (0, source_parser_ts_1.parseSource)('vercel-labs/agent-skills@find-skills');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/vercel-labs/agent-skills.git');
            (0, vitest_1.expect)(result.skillFilter).toBe('find-skills');
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo#branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo#my-branch');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('my-branch');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo/path#branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo/skills/my-skill#feature/skills');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature/skills');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
        (0, vitest_1.it)('GitHub shorthand - owner/repo#branch@skill', () => {
            const result = (0, source_parser_ts_1.parseSource)('owner/repo#my-branch@my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('my-branch');
            (0, vitest_1.expect)(result.skillFilter).toBe('my-skill');
        });
    });
    (0, vitest_1.describe)('Local path tests', () => {
        (0, vitest_1.it)('Local path - relative with ./', () => {
            const result = (0, source_parser_ts_1.parseSource)('./my-skills');
            (0, vitest_1.expect)(result.type).toBe('local');
            (0, vitest_1.expect)(result.localPath).toContain('my-skills');
        });
        (0, vitest_1.it)('Local path - relative with ../', () => {
            const result = (0, source_parser_ts_1.parseSource)('../other-skills');
            (0, vitest_1.expect)(result.type).toBe('local');
            (0, vitest_1.expect)(result.localPath).toContain('other-skills');
        });
        (0, vitest_1.it)('Local path - current directory', () => {
            const result = (0, source_parser_ts_1.parseSource)('.');
            (0, vitest_1.expect)(result.type).toBe('local');
            (0, vitest_1.expect)(result.localPath).toBeTruthy();
        });
        (0, vitest_1.it)('Local path - absolute path', () => {
            // Use platform-specific absolute path
            const testPath = isWindows ? 'C:\\Users\\test\\skills' : '/home/user/skills';
            const result = (0, source_parser_ts_1.parseSource)(testPath);
            (0, vitest_1.expect)(result.type).toBe('local');
            (0, vitest_1.expect)(result.localPath).toBe(testPath);
        });
    });
    (0, vitest_1.describe)('Git URL fallback tests', () => {
        (0, vitest_1.it)('Git URL - SSH format', () => {
            const result = (0, source_parser_ts_1.parseSource)('git@github.com:owner/repo.git');
            (0, vitest_1.expect)(result.type).toBe('git');
            (0, vitest_1.expect)(result.url).toBe('git@github.com:owner/repo.git');
        });
        (0, vitest_1.it)('Git URL - SSH format with #branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('git@github.com:owner/repo.git#feature/install');
            (0, vitest_1.expect)(result.type).toBe('git');
            (0, vitest_1.expect)(result.url).toBe('git@github.com:owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature/install');
        });
        (0, vitest_1.it)('Git URL - custom host', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://git.example.com/owner/repo.git');
            (0, vitest_1.expect)(result.type).toBe('git');
            (0, vitest_1.expect)(result.url).toBe('https://git.example.com/owner/repo.git');
        });
        (0, vitest_1.it)('Git URL - https format with #branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('https://git.example.com/owner/repo.git#release-2026');
            (0, vitest_1.expect)(result.type).toBe('git');
            (0, vitest_1.expect)(result.url).toBe('https://git.example.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('release-2026');
        });
    });
});
(0, vitest_1.describe)('getOwnerRepo', () => {
    (0, vitest_1.it)('getOwnerRepo - GitHub URL', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitHub URL with .git', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo.git');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitHub URL with tree/branch/path', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://github.com/owner/repo/tree/main/skills/my-skill');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitHub shorthand', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('owner/repo');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitHub shorthand with subpath', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('owner/repo/skills/my-skill');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab URL', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab URL with tree', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://gitlab.com/owner/repo/-/tree/main/skills');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab URL with subgroup', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://gitlab.com/coresofthq/ai/agent-skills');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('coresofthq/ai/agent-skills');
    });
    (0, vitest_1.it)('getOwnerRepo - local path returns null', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('./my-skills');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBeNull();
    });
    (0, vitest_1.it)('getOwnerRepo - absolute local path returns null', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('/home/user/skills');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBeNull();
    });
    (0, vitest_1.it)('getOwnerRepo - custom git host extracts owner/repo', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://git.example.com/owner/repo.git');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH format extracts owner/repo', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('git@github.com:owner/repo.git');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - private GitLab instance extracts owner/repo', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://gitlab.company.com/team/repo');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('team/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - self-hosted git with .git suffix', () => {
        const parsed = (0, source_parser_ts_1.parseSource)('https://git.internal.io/myteam/skills.git');
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('myteam/skills');
    });
    (0, vitest_1.it)('getOwnerRepo - URL with query string', () => {
        const parsed = { type: 'git', url: 'https://git.example.com/owner/repo?ref=main' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - URL with fragment', () => {
        const parsed = { type: 'git', url: 'https://git.example.com/owner/repo#readme' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - URL with .git and query string', () => {
        const parsed = { type: 'git', url: 'https://git.example.com/owner/repo.git?ref=main' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab subgroup (2 levels)', () => {
        const parsed = { type: 'git', url: 'https://gitlab.com/group/subgroup/repo' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('group/subgroup/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab subgroup (3 levels)', () => {
        const parsed = { type: 'git', url: 'https://gitlab.com/org/team/project/repo.git' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('org/team/project/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - GitLab subgroup with query string', () => {
        const parsed = { type: 'git', url: 'https://gitlab.com/group/subgroup/repo?ref=main' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('group/subgroup/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - self-hosted GitLab with subgroups', () => {
        const parsed = {
            type: 'git',
            url: 'https://gitlab.company.com/division/team/repo.git',
        };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('division/team/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL (GitHub)', () => {
        const parsed = { type: 'git', url: 'git@github.com:owner/repo.git' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL (GitLab)', () => {
        const parsed = { type: 'git', url: 'git@gitlab.com:owner/repo.git' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL with subgroups (GitLab)', () => {
        const parsed = {
            type: 'git',
            url: 'git@gitlab.com:group/subgroup/project/repo.git',
        };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('group/subgroup/project/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL without .git suffix', () => {
        const parsed = { type: 'git', url: 'git@github.com:owner/repo' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('owner/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL (custom host)', () => {
        const parsed = { type: 'git', url: 'git@git.company.com:org/team/repo.git' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBe('org/team/repo');
    });
    (0, vitest_1.it)('getOwnerRepo - SSH URL without path (returns null)', () => {
        const parsed = { type: 'git', url: 'git@github.com:repo.git' };
        (0, vitest_1.expect)((0, source_parser_ts_1.getOwnerRepo)(parsed)).toBeNull();
    });
});
(0, vitest_1.describe)('Source aliases', () => {
    (0, vitest_1.it)('resolves coinbase/agentWallet to coinbase/agentic-wallet-skills', () => {
        const result = (0, source_parser_ts_1.parseSource)('coinbase/agentWallet');
        (0, vitest_1.expect)(result.type).toBe('github');
        (0, vitest_1.expect)(result.url).toBe('https://github.com/coinbase/agentic-wallet-skills.git');
    });
});
(0, vitest_1.describe)('Prefix shorthand tests', () => {
    (0, vitest_1.describe)('github: prefix', () => {
        (0, vitest_1.it)('github:owner/repo - basic', () => {
            const result = (0, source_parser_ts_1.parseSource)('github:owner/repo');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.subpath).toBeUndefined();
        });
        (0, vitest_1.it)('github:owner/repo/subpath', () => {
            const result = (0, source_parser_ts_1.parseSource)('github:owner/repo/skills/my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.subpath).toBe('skills/my-skill');
        });
        (0, vitest_1.it)('github:owner/repo@skill-name', () => {
            const result = (0, source_parser_ts_1.parseSource)('github:owner/repo@my-skill');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.skillFilter).toBe('my-skill');
        });
        (0, vitest_1.it)('github:googleworkspace/cli', () => {
            const result = (0, source_parser_ts_1.parseSource)('github:googleworkspace/cli');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/googleworkspace/cli.git');
        });
        (0, vitest_1.it)('github:owner/repo#branch', () => {
            const result = (0, source_parser_ts_1.parseSource)('github:owner/repo#feature/install');
            (0, vitest_1.expect)(result.type).toBe('github');
            (0, vitest_1.expect)(result.url).toBe('https://github.com/owner/repo.git');
            (0, vitest_1.expect)(result.ref).toBe('feature/install');
        });
    });
    (0, vitest_1.describe)('gitlab: prefix', () => {
        (0, vitest_1.it)('gitlab:owner/repo - basic', () => {
            const result = (0, source_parser_ts_1.parseSource)('gitlab:owner/repo');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/owner/repo.git');
        });
        (0, vitest_1.it)('gitlab:group/subgroup/repo', () => {
            const result = (0, source_parser_ts_1.parseSource)('gitlab:group/subgroup/repo');
            (0, vitest_1.expect)(result.type).toBe('gitlab');
            (0, vitest_1.expect)(result.url).toBe('https://gitlab.com/group/subgroup/repo.git');
        });
    });
});
//# sourceMappingURL=source-parser.test.js.map