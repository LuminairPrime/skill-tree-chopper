"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const local_lock_ts_1 = require("../src/local-lock.ts");
(0, vitest_1.describe)('local-lock', () => {
    (0, vitest_1.describe)('getLocalLockPath', () => {
        (0, vitest_1.it)('returns skills-lock.json in given directory', () => {
            const result = (0, local_lock_ts_1.getLocalLockPath)('/some/project');
            (0, vitest_1.expect)(result).toBe((0, node_path_1.join)('/some/project', 'skills-lock.json'));
        });
        (0, vitest_1.it)('uses cwd when no directory given', () => {
            const result = (0, local_lock_ts_1.getLocalLockPath)();
            (0, vitest_1.expect)(result).toBe((0, node_path_1.join)(process.cwd(), 'skills-lock.json'));
        });
    });
    (0, vitest_1.describe)('readLocalLock', () => {
        (0, vitest_1.it)('returns empty lock when file does not exist', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock).toEqual({ version: 1, skills: {} });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('reads a valid lock file', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const content = {
                    version: 1,
                    skills: {
                        'my-skill': {
                            source: 'vercel-labs/skills',
                            sourceType: 'github',
                            computedHash: 'abc123',
                        },
                    },
                };
                await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'skills-lock.json'), JSON.stringify(content), 'utf-8');
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock.version).toBe(1);
                (0, vitest_1.expect)(lock.skills['my-skill']).toEqual({
                    source: 'vercel-labs/skills',
                    sourceType: 'github',
                    computedHash: 'abc123',
                });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('returns empty lock for corrupted JSON (merge conflict markers)', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const conflicted = `{
  "version": 1,
  "skills": {
<<<<<<< HEAD
    "skill-a": { "source": "org/repo-a", "sourceType": "github", "computedHash": "aaa" }
=======
    "skill-b": { "source": "org/repo-b", "sourceType": "github", "computedHash": "bbb" }
>>>>>>> feature-branch
  }
}`;
                await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'skills-lock.json'), conflicted, 'utf-8');
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock).toEqual({ version: 1, skills: {} });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('returns empty lock for invalid structure (missing skills key)', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'skills-lock.json'), '{"version": 1}', 'utf-8');
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock).toEqual({ version: 1, skills: {} });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
    (0, vitest_1.describe)('writeLocalLock', () => {
        (0, vitest_1.it)('writes sorted JSON with trailing newline', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.writeLocalLock)({
                    version: 1,
                    skills: {
                        'zebra-skill': {
                            source: 'org/z',
                            sourceType: 'github',
                            computedHash: 'zzz',
                        },
                        'alpha-skill': {
                            source: 'org/a',
                            sourceType: 'github',
                            computedHash: 'aaa',
                        },
                        'middle-skill': {
                            source: 'org/m',
                            sourceType: 'github',
                            computedHash: 'mmm',
                        },
                    },
                }, dir);
                const raw = await (0, promises_1.readFile)((0, node_path_1.join)(dir, 'skills-lock.json'), 'utf-8');
                (0, vitest_1.expect)(raw.endsWith('\n')).toBe(true);
                const parsed = JSON.parse(raw);
                const keys = Object.keys(parsed.skills);
                (0, vitest_1.expect)(keys).toEqual(['alpha-skill', 'middle-skill', 'zebra-skill']);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
    (0, vitest_1.describe)('addSkillToLocalLock', () => {
        (0, vitest_1.it)('adds a new skill to an empty lock', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.addSkillToLocalLock)('new-skill', { source: 'org/repo', sourceType: 'github', computedHash: 'hash123' }, dir);
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock.skills['new-skill']).toEqual({
                    source: 'org/repo',
                    sourceType: 'github',
                    computedHash: 'hash123',
                });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('updates an existing skill hash', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.addSkillToLocalLock)('my-skill', { source: 'org/repo', sourceType: 'github', computedHash: 'old-hash' }, dir);
                await (0, local_lock_ts_1.addSkillToLocalLock)('my-skill', { source: 'org/repo', sourceType: 'github', computedHash: 'new-hash' }, dir);
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock.skills['my-skill'].computedHash).toBe('new-hash');
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('preserves other skills when adding', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.addSkillToLocalLock)('skill-a', { source: 'org/a', sourceType: 'github', computedHash: 'aaa' }, dir);
                await (0, local_lock_ts_1.addSkillToLocalLock)('skill-b', { source: 'org/b', sourceType: 'github', computedHash: 'bbb' }, dir);
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(Object.keys(lock.skills)).toHaveLength(2);
                (0, vitest_1.expect)(lock.skills['skill-a'].computedHash).toBe('aaa');
                (0, vitest_1.expect)(lock.skills['skill-b'].computedHash).toBe('bbb');
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('stores optional ref when present', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.addSkillToLocalLock)('branch-skill', {
                    source: 'org/repo',
                    ref: 'feature/install',
                    sourceType: 'github',
                    computedHash: 'hash123',
                }, dir);
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock.skills['branch-skill']).toEqual({
                    source: 'org/repo',
                    ref: 'feature/install',
                    sourceType: 'github',
                    computedHash: 'hash123',
                });
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
    (0, vitest_1.describe)('removeSkillFromLocalLock', () => {
        (0, vitest_1.it)('removes an existing skill', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                await (0, local_lock_ts_1.addSkillToLocalLock)('my-skill', { source: 'org/repo', sourceType: 'github', computedHash: 'hash' }, dir);
                const removed = await (0, local_lock_ts_1.removeSkillFromLocalLock)('my-skill', dir);
                (0, vitest_1.expect)(removed).toBe(true);
                const lock = await (0, local_lock_ts_1.readLocalLock)(dir);
                (0, vitest_1.expect)(lock.skills['my-skill']).toBeUndefined();
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('returns false for non-existent skill', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const removed = await (0, local_lock_ts_1.removeSkillFromLocalLock)('no-such-skill', dir);
                (0, vitest_1.expect)(removed).toBe(false);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
    (0, vitest_1.describe)('computeSkillFolderHash', () => {
        (0, vitest_1.it)('produces a deterministic SHA-256 hash', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir = (0, node_path_1.join)(dir, 'my-skill');
                await (0, promises_1.mkdir)(skillDir, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), '---\nname: test\ndescription: test\n---\n# Test\n', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                (0, vitest_1.expect)(hash1).toBe(hash2);
                (0, vitest_1.expect)(hash1).toMatch(/^[a-f0-9]{64}$/);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('changes when file content changes', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir = (0, node_path_1.join)(dir, 'my-skill');
                await (0, promises_1.mkdir)(skillDir, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), 'version 1', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), 'version 2', 'utf-8');
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                (0, vitest_1.expect)(hash1).not.toBe(hash2);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('changes when a file is added', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir = (0, node_path_1.join)(dir, 'my-skill');
                await (0, promises_1.mkdir)(skillDir, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), 'content', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'extra.txt'), 'extra file', 'utf-8');
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                (0, vitest_1.expect)(hash1).not.toBe(hash2);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('changes when a file is renamed', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir1 = (0, node_path_1.join)(dir, 'skill-v1');
                await (0, promises_1.mkdir)(skillDir1, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir1, 'old-name.md'), 'content', 'utf-8');
                const skillDir2 = (0, node_path_1.join)(dir, 'skill-v2');
                await (0, promises_1.mkdir)(skillDir2, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir2, 'new-name.md'), 'content', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir1);
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir2);
                (0, vitest_1.expect)(hash1).not.toBe(hash2);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('includes nested files in subdirectories', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir = (0, node_path_1.join)(dir, 'my-skill');
                await (0, promises_1.mkdir)((0, node_path_1.join)(skillDir, 'sub'), { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), 'root', 'utf-8');
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'sub', 'helper.md'), 'nested', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                // Changing nested file should change hash
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'sub', 'helper.md'), 'changed', 'utf-8');
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                (0, vitest_1.expect)(hash1).not.toBe(hash2);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
        (0, vitest_1.it)('ignores .git and node_modules directories', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                const skillDir = (0, node_path_1.join)(dir, 'my-skill');
                await (0, promises_1.mkdir)(skillDir, { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'SKILL.md'), 'content', 'utf-8');
                const hash1 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                // Adding files in .git and node_modules should NOT change hash
                await (0, promises_1.mkdir)((0, node_path_1.join)(skillDir, '.git'), { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, '.git', 'HEAD'), 'ref: refs/heads/main', 'utf-8');
                await (0, promises_1.mkdir)((0, node_path_1.join)(skillDir, 'node_modules', 'foo'), { recursive: true });
                await (0, promises_1.writeFile)((0, node_path_1.join)(skillDir, 'node_modules', 'foo', 'index.js'), 'noop', 'utf-8');
                const hash2 = await (0, local_lock_ts_1.computeSkillFolderHash)(skillDir);
                (0, vitest_1.expect)(hash1).toBe(hash2);
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
    (0, vitest_1.describe)('merge conflict friendliness', () => {
        (0, vitest_1.it)('produces no-conflict output when two skills are added independently', async () => {
            const dir = await (0, promises_1.mkdtemp)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'lock-test-'));
            try {
                // Simulate branch A adding skill-a
                await (0, local_lock_ts_1.addSkillToLocalLock)('skill-a', { source: 'org/a', sourceType: 'github', computedHash: 'aaa' }, dir);
                const branchA = await (0, promises_1.readFile)((0, node_path_1.join)(dir, 'skills-lock.json'), 'utf-8');
                // Reset to empty
                await (0, promises_1.writeFile)((0, node_path_1.join)(dir, 'skills-lock.json'), '{"version":1,"skills":{}}', 'utf-8');
                // Simulate branch B adding skill-b
                await (0, local_lock_ts_1.addSkillToLocalLock)('skill-b', { source: 'org/b', sourceType: 'github', computedHash: 'bbb' }, dir);
                const branchB = await (0, promises_1.readFile)((0, node_path_1.join)(dir, 'skills-lock.json'), 'utf-8');
                // Both branches produce valid JSON with no timestamps to conflict on
                const parsedA = JSON.parse(branchA);
                const parsedB = JSON.parse(branchB);
                (0, vitest_1.expect)(parsedA.skills['skill-a']).toBeDefined();
                (0, vitest_1.expect)(parsedA.skills['skill-a'].computedHash).toBeDefined();
                (0, vitest_1.expect)(parsedB.skills['skill-b']).toBeDefined();
                (0, vitest_1.expect)(parsedB.skills['skill-b'].computedHash).toBeDefined();
                // No timestamps present
                (0, vitest_1.expect)(parsedA.skills['skill-a'].installedAt).toBeUndefined();
                (0, vitest_1.expect)(parsedA.skills['skill-a'].updatedAt).toBeUndefined();
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        });
    });
});
//# sourceMappingURL=local-lock.test.js.map