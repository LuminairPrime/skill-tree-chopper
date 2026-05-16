"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitCloneError = void 0;
exports.cloneRepo = cloneRepo;
exports.cleanupTempDir = cleanupTempDir;
const simple_git_1 = require("simple-git");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const os_1 = require("os");
const DEFAULT_CLONE_TIMEOUT_MS = 300000; // 5 minutes
const CLONE_TIMEOUT_MS = (() => {
    const raw = process.env.SKILLS_CLONE_TIMEOUT_MS;
    if (!raw)
        return DEFAULT_CLONE_TIMEOUT_MS;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CLONE_TIMEOUT_MS;
})();
class GitCloneError extends Error {
    constructor(message, url, isTimeout = false, isAuthError = false) {
        super(message);
        this.name = 'GitCloneError';
        this.url = url;
        this.isTimeout = isTimeout;
        this.isAuthError = isAuthError;
    }
}
exports.GitCloneError = GitCloneError;
async function cloneRepo(url, ref) {
    const tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'skills-'));
    const git = (0, simple_git_1.default)({
        timeout: { block: CLONE_TIMEOUT_MS },
        env: {
            ...process.env,
            GIT_TERMINAL_PROMPT: '0',
            // When git-lfs IS installed, tell it not to download LFS content
            // during checkout. See #952 for context and empirical impact.
            GIT_LFS_SKIP_SMUDGE: '1',
        },
        // When git-lfs is NOT installed, GIT_LFS_SKIP_SMUDGE has no effect —
        // git sees `filter=lfs` in .gitattributes, tries to run
        // `git-lfs filter-process`, and aborts the checkout with:
        //   git-lfs filter-process: git-lfs: command not found
        //   fatal: the remote end hung up unexpectedly
        //   warning: Clone succeeded, but checkout failed.
        // Overriding filter.lfs.* at the command level disables the filter
        // entirely for this clone, so checkout succeeds regardless of whether
        // git-lfs is installed. LFS-tracked files are left as ~130-byte
        // pointer files, which the skills installer doesn't read anyway
        // (skills are plain text — HTML/MD/JSON — never LFS-tracked).
        //
        // Reported downstream: heygen-com/hyperframes#407.
        config: [
            'filter.lfs.required=false',
            'filter.lfs.smudge=',
            'filter.lfs.clean=',
            'filter.lfs.process=',
        ],
    });
    const cloneOptions = ref ? ['--depth', '1', '--branch', ref] : ['--depth', '1'];
    try {
        await git.clone(url, tempDir, cloneOptions);
        return tempDir;
    }
    catch (error) {
        // Clean up temp dir on failure
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true }).catch(() => { });
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('block timeout') || errorMessage.includes('timed out');
        const isAuthError = errorMessage.includes('Authentication failed') ||
            errorMessage.includes('could not read Username') ||
            errorMessage.includes('Permission denied') ||
            errorMessage.includes('Repository not found');
        if (isTimeout) {
            const seconds = Math.round(CLONE_TIMEOUT_MS / 1000);
            throw new GitCloneError(`Clone timed out after ${seconds}s. Common causes:\n` +
                `  - Large repository: raise the timeout with SKILLS_CLONE_TIMEOUT_MS=600000 (10m)\n` +
                `  - Slow network: retry, or clone manually and pass the local path to 'skills add'\n` +
                `  - Private repo without credentials: ensure auth is configured\n` +
                `      - For SSH: ssh-add -l (to check loaded keys)\n` +
                `      - For HTTPS: gh auth status (if using GitHub CLI)`, url, true, false);
        }
        if (isAuthError) {
            throw new GitCloneError(`Authentication failed for ${url}.\n` +
                `  - For private repos, ensure you have access\n` +
                `  - For SSH: Check your keys with 'ssh -T git@github.com'\n` +
                `  - For HTTPS: Run 'gh auth login' or configure git credentials`, url, false, true);
        }
        throw new GitCloneError(`Failed to clone ${url}: ${errorMessage}`, url, false, false);
    }
}
async function cleanupTempDir(dir) {
    // Validate that the directory path is within tmpdir to prevent deletion of arbitrary paths
    const normalizedDir = (0, path_1.normalize)((0, path_1.resolve)(dir));
    const normalizedTmpDir = (0, path_1.normalize)((0, path_1.resolve)((0, os_1.tmpdir)()));
    if (!normalizedDir.startsWith(normalizedTmpDir + path_1.sep) && normalizedDir !== normalizedTmpDir) {
        throw new Error('Attempted to clean up directory outside of temp directory');
    }
    await (0, promises_1.rm)(dir, { recursive: true, force: true });
}
//# sourceMappingURL=git.js.map