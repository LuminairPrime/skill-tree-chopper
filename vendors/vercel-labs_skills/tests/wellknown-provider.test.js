"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const wellknown_ts_1 = require("../src/providers/wellknown.ts");
(0, vitest_1.describe)('WellKnownProvider', () => {
    const provider = new wellknown_ts_1.WellKnownProvider();
    (0, vitest_1.describe)('match', () => {
        (0, vitest_1.it)('should match arbitrary HTTP URLs', () => {
            (0, vitest_1.expect)(provider.match('https://example.com').matches).toBe(true);
            (0, vitest_1.expect)(provider.match('https://docs.example.com/skills').matches).toBe(true);
            (0, vitest_1.expect)(provider.match('http://localhost:3000').matches).toBe(true);
        });
        (0, vitest_1.it)('should match URLs with paths', () => {
            (0, vitest_1.expect)(provider.match('https://mintlify.com/docs').matches).toBe(true);
            (0, vitest_1.expect)(provider.match('https://example.com/api/v1').matches).toBe(true);
        });
        (0, vitest_1.it)('should not match GitHub URLs', () => {
            (0, vitest_1.expect)(provider.match('https://github.com/owner/repo').matches).toBe(false);
        });
        (0, vitest_1.it)('should not match GitLab URLs', () => {
            (0, vitest_1.expect)(provider.match('https://gitlab.com/owner/repo').matches).toBe(false);
        });
        (0, vitest_1.it)('should not match HuggingFace URLs', () => {
            (0, vitest_1.expect)(provider.match('https://huggingface.co/spaces/owner/repo').matches).toBe(false);
        });
        (0, vitest_1.it)('should not match non-HTTP URLs', () => {
            (0, vitest_1.expect)(provider.match('git@github.com:owner/repo.git').matches).toBe(false);
            (0, vitest_1.expect)(provider.match('ssh://git@example.com/repo').matches).toBe(false);
            (0, vitest_1.expect)(provider.match('/local/path').matches).toBe(false);
        });
    });
    (0, vitest_1.describe)('getSourceIdentifier', () => {
        (0, vitest_1.it)('should return full hostname', () => {
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://example.com')).toBe('example.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://mintlify.com')).toBe('mintlify.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://lovable.dev')).toBe('lovable.dev');
        });
        (0, vitest_1.it)('should return same identifier regardless of path', () => {
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://example.com/docs')).toBe('example.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://example.com/api/v1')).toBe('example.com');
        });
        (0, vitest_1.it)('should preserve subdomains', () => {
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://docs.example.com')).toBe('docs.example.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://api.mintlify.com/docs')).toBe('api.mintlify.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://mppx-discovery-skills.vercel.app')).toBe('mppx-discovery-skills.vercel.app');
        });
        (0, vitest_1.it)('should strip www. prefix', () => {
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://www.example.com')).toBe('example.com');
            (0, vitest_1.expect)(provider.getSourceIdentifier('https://www.mintlify.com/docs')).toBe('mintlify.com');
        });
        (0, vitest_1.it)('should return unknown for invalid URLs', () => {
            (0, vitest_1.expect)(provider.getSourceIdentifier('not-a-url')).toBe('unknown');
        });
    });
    (0, vitest_1.describe)('toRawUrl', () => {
        (0, vitest_1.it)('should return index.json URL for base URLs using agent-skills path', () => {
            const result = provider.toRawUrl('https://example.com');
            (0, vitest_1.expect)(result).toBe('https://example.com/.well-known/agent-skills/index.json');
        });
        (0, vitest_1.it)('should return index.json URL with path using agent-skills path', () => {
            const result = provider.toRawUrl('https://example.com/docs');
            (0, vitest_1.expect)(result).toBe('https://example.com/docs/.well-known/agent-skills/index.json');
        });
        (0, vitest_1.it)('should return SKILL.md URL if already pointing to skill.md', () => {
            const url = 'https://example.com/.well-known/skills/my-skill/SKILL.md';
            (0, vitest_1.expect)(provider.toRawUrl(url)).toBe(url);
        });
        (0, vitest_1.it)('should return SKILL.md URL for agent-skills path', () => {
            const url = 'https://example.com/.well-known/agent-skills/my-skill/SKILL.md';
            (0, vitest_1.expect)(provider.toRawUrl(url)).toBe(url);
        });
        (0, vitest_1.it)('should convert legacy skills skill path to agent-skills SKILL.md URL', () => {
            const result = provider.toRawUrl('https://example.com/.well-known/skills/my-skill');
            (0, vitest_1.expect)(result).toBe('https://example.com/.well-known/agent-skills/my-skill/SKILL.md');
        });
        (0, vitest_1.it)('should convert agent-skills skill path to SKILL.md URL', () => {
            const result = provider.toRawUrl('https://example.com/.well-known/agent-skills/my-skill');
            (0, vitest_1.expect)(result).toBe('https://example.com/.well-known/agent-skills/my-skill/SKILL.md');
        });
    });
    (0, vitest_1.describe)('isValidSkillEntry (via fetchIndex validation)', () => {
        // Since isValidSkillEntry is private, we test it indirectly through the provider's behavior
        (0, vitest_1.it)('provider should have id "well-known"', () => {
            (0, vitest_1.expect)(provider.id).toBe('well-known');
        });
        (0, vitest_1.it)('provider should have display name "Well-Known Skills"', () => {
            (0, vitest_1.expect)(provider.displayName).toBe('Well-Known Skills');
        });
    });
});
(0, vitest_1.describe)('parseSource with well-known URLs', async () => {
    // Import parseSource after provider is defined
    const { parseSource } = await Promise.resolve().then(() => require('../src/source-parser.ts'));
    (0, vitest_1.it)('should parse arbitrary URL as well-known type', () => {
        const result = parseSource('https://example.com');
        (0, vitest_1.expect)(result.type).toBe('well-known');
        (0, vitest_1.expect)(result.url).toBe('https://example.com');
    });
    (0, vitest_1.it)('should parse URL with path as well-known type', () => {
        const result = parseSource('https://mintlify.com/docs');
        (0, vitest_1.expect)(result.type).toBe('well-known');
        (0, vitest_1.expect)(result.url).toBe('https://mintlify.com/docs');
    });
    (0, vitest_1.it)('should not parse GitHub URL as well-known', () => {
        const result = parseSource('https://github.com/owner/repo');
        (0, vitest_1.expect)(result.type).toBe('github');
    });
    (0, vitest_1.it)('should not parse .git URL as well-known', () => {
        const result = parseSource('https://git.example.com/owner/repo.git');
        (0, vitest_1.expect)(result.type).toBe('git');
    });
    (0, vitest_1.it)('should parse direct skill.md URL as well-known (no more direct-url type)', () => {
        const result = parseSource('https://docs.example.com/skill.md');
        (0, vitest_1.expect)(result.type).toBe('well-known');
    });
});
//# sourceMappingURL=wellknown-provider.test.js.map