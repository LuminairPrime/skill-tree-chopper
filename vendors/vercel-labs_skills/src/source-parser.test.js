"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const source_parser_js_1 = require("./source-parser.js");
(0, vitest_1.describe)('source-parser', () => {
    (0, vitest_1.describe)('GitLab Custom Domains & Subgroups', () => {
        (0, vitest_1.it)('parses custom gitlab domain with deep subgroup paths', () => {
            const result = (0, source_parser_js_1.parseSource)('https://git.corp.com/group/subgroup/project/-/tree/main/src');
            (0, vitest_1.expect)(result).toEqual({
                type: 'gitlab',
                url: 'https://git.corp.com/group/subgroup/project.git',
                ref: 'main',
                subpath: 'src',
            });
        });
        (0, vitest_1.it)('parses gitlab tree with branch but no path', () => {
            const result = (0, source_parser_js_1.parseSource)('https://gitlab.example.com/org/repo/-/tree/v1.0');
            (0, vitest_1.expect)(result).toEqual({
                type: 'gitlab',
                url: 'https://gitlab.example.com/org/repo.git',
                ref: 'v1.0',
            });
        });
        (0, vitest_1.it)('parses custom gitlab domain with port number', () => {
            const result = (0, source_parser_js_1.parseSource)('https://git.corp.com:8443/group/repo/-/tree/main');
            (0, vitest_1.expect)(result).toMatchObject({
                type: 'gitlab',
                url: 'https://git.corp.com:8443/group/repo.git',
                ref: 'main',
            });
        });
        (0, vitest_1.it)('parses http protocol (non-ssl)', () => {
            const result = (0, source_parser_js_1.parseSource)('http://git.local/group/repo/-/tree/dev');
            (0, vitest_1.expect)(result).toMatchObject({
                type: 'gitlab',
                url: 'http://git.local/group/repo.git',
            });
        });
        (0, vitest_1.it)('parses personal project path (~user)', () => {
            const result = (0, source_parser_js_1.parseSource)('https://gitlab.com/~user/project/-/tree/main');
            (0, vitest_1.expect)(result).toMatchObject({
                type: 'gitlab',
                url: 'https://gitlab.com/~user/project.git',
            });
        });
    });
    (0, vitest_1.describe)('Simplified Git Strategy', () => {
        (0, vitest_1.it)('treats custom domains with .git as generic git', () => {
            const result = (0, source_parser_js_1.parseSource)('https://git.mycompany.com/my-group/my-repo.git');
            (0, vitest_1.expect)(result).toEqual({
                type: 'git',
                url: 'https://git.mycompany.com/my-group/my-repo.git',
            });
        });
        (0, vitest_1.it)('prevents false positives for generic URLs (falls through to well-known)', () => {
            const result = (0, source_parser_js_1.parseSource)('https://google.com/search/result');
            (0, vitest_1.expect)(result.type).toBe('well-known');
            (0, vitest_1.expect)(result.url).toBe('https://google.com/search/result');
        });
        (0, vitest_1.it)('retains official gitlab.com parsing for convenience', () => {
            const result = (0, source_parser_js_1.parseSource)('https://gitlab.com/owner/repo');
            (0, vitest_1.expect)(result).toEqual({
                type: 'gitlab',
                url: 'https://gitlab.com/owner/repo.git',
            });
        });
    });
    (0, vitest_1.describe)('Existing GitHub Support', () => {
        (0, vitest_1.it)('parses github shorthand', () => {
            const result = (0, source_parser_js_1.parseSource)('vercel-labs/agent-skills');
            (0, vitest_1.expect)(result).toEqual({
                type: 'github',
                url: 'https://github.com/vercel-labs/agent-skills.git',
                subpath: undefined,
            });
        });
        (0, vitest_1.it)('parses github full URL', () => {
            const result = (0, source_parser_js_1.parseSource)('https://github.com/owner/repo/tree/main/path');
            (0, vitest_1.expect)(result).toEqual({
                type: 'github',
                url: 'https://github.com/owner/repo.git',
                ref: 'main',
                subpath: 'path',
            });
        });
        (0, vitest_1.it)('does not treat GitHub blob anchors as refs', () => {
            const result = (0, source_parser_js_1.parseSource)('https://github.com/owner/repo/blob/main/README.md#L10');
            (0, vitest_1.expect)(result).toEqual({
                type: 'github',
                url: 'https://github.com/owner/repo.git',
            });
        });
        (0, vitest_1.it)('parses github shorthand with #branch', () => {
            const result = (0, source_parser_js_1.parseSource)('vercel-labs/agent-skills#feature/install');
            (0, vitest_1.expect)(result).toEqual({
                type: 'github',
                url: 'https://github.com/vercel-labs/agent-skills.git',
                ref: 'feature/install',
                subpath: undefined,
            });
        });
        (0, vitest_1.it)('parses github shorthand with trailing slash', () => {
            const result = (0, source_parser_js_1.parseSource)('vercel-labs/agent-skills/');
            (0, vitest_1.expect)(result).toEqual({
                type: 'github',
                url: 'https://github.com/vercel-labs/agent-skills.git',
                subpath: undefined,
            });
        });
        (0, vitest_1.it)('parses SSH git URL with #branch', () => {
            const result = (0, source_parser_js_1.parseSource)('git@github.com:owner/repo.git#feature/install');
            (0, vitest_1.expect)(result).toEqual({
                type: 'git',
                url: 'git@github.com:owner/repo.git',
                ref: 'feature/install',
            });
        });
    });
});
//# sourceMappingURL=source-parser.test.js.map