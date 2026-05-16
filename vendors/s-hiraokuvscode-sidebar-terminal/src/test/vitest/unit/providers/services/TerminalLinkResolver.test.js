"use strict";
/**
 * TerminalLinkResolver Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const path = require("path");
const os = require("os");
const TerminalLinkResolver_1 = require("../../../../../providers/services/TerminalLinkResolver");
const { mockFs } = vitest_1.vi.hoisted(() => ({
    mockFs: {
        stat: vitest_1.vi.fn(),
    },
}));
// Mock fs
vitest_1.vi.mock('fs', () => ({
    default: {
        promises: mockFs,
    },
    promises: mockFs,
}));
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    Uri: {
        parse: vitest_1.vi.fn((url) => ({ toString: () => url })),
        file: vitest_1.vi.fn((path) => ({ fsPath: path, scheme: 'file' })),
    },
    env: {
        openExternal: vitest_1.vi.fn().mockResolvedValue(true),
    },
    workspace: {
        openTextDocument: vitest_1.vi.fn().mockResolvedValue({}),
        workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    },
    window: {
        showTextDocument: vitest_1.vi.fn().mockResolvedValue({
            selection: {},
            revealRange: vitest_1.vi.fn(),
        }),
    },
    Position: class {
        constructor(line, character) {
            this.line = line;
            this.character = character;
        }
    },
    Selection: class {
        constructor(anchor, active) {
            this.anchor = anchor;
            this.active = active;
        }
    },
    Range: class {
        constructor(start, end) {
            this.start = start;
            this.end = end;
        }
    },
    TextEditorRevealType: { InCenter: 1 },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
// Mock feedback
vitest_1.vi.mock('../../../../../utils/feedback', () => ({
    showError: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalLinkResolver', () => {
    let resolver;
    let mockGetTerminal;
    (0, vitest_1.beforeEach)(() => {
        mockGetTerminal = vitest_1.vi.fn();
        resolver = new TerminalLinkResolver_1.TerminalLinkResolver(mockGetTerminal);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('normalizeLinkPath', () => {
        (0, vitest_1.it)('should expand tilde to home directory', () => {
            const home = os.homedir();
            (0, vitest_1.expect)(resolver.normalizeLinkPath('~/test.txt')).toBe(path.join(home, 'test.txt'));
        });
        (0, vitest_1.it)('should normalize separators', () => {
            const result = resolver.normalizeLinkPath('a\\b\\c');
            // On Windows, path.sep is '\', on POSIX it's '/'
            // The implementation converts '\' to path.sep for cross-platform compatibility
            (0, vitest_1.expect)(result).toBe(`a${path.sep}b${path.sep}c`);
        });
    });
    (0, vitest_1.describe)('handleOpenTerminalLink', () => {
        (0, vitest_1.it)('should handle URL links', async () => {
            await resolver.handleOpenTerminalLink({
                command: 'openTerminalLink',
                linkType: 'url',
                url: 'https://github.com',
            });
            (0, vitest_1.expect)(vscode.env.openExternal).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle file links with line numbers', async () => {
            // Mock file exists
            mockFs.stat.mockResolvedValue({ isFile: () => true });
            await resolver.handleOpenTerminalLink({
                command: 'openTerminalLink',
                linkType: 'file',
                filePath: 'test.ts',
                lineNumber: 10,
                columnNumber: 5,
            });
            (0, vitest_1.expect)(vscode.workspace.openTextDocument).toHaveBeenCalled();
            (0, vitest_1.expect)(vscode.window.showTextDocument).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show error if file not found', async () => {
            mockFs.stat.mockRejectedValue({ code: 'ENOENT' });
            await resolver.handleOpenTerminalLink({
                command: 'openTerminalLink',
                linkType: 'file',
                filePath: 'missing.ts',
            });
            const { showError } = await Promise.resolve().then(() => require('../../../../../utils/feedback'));
            (0, vitest_1.expect)(showError).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Unable to locate file'));
        });
    });
    (0, vitest_1.describe)('buildPathCandidates', () => {
        (0, vitest_1.it)('should include terminal CWD if provided', () => {
            mockGetTerminal.mockReturnValue({ cwd: '/terminal/cwd' });
            const candidates = resolver.buildPathCandidates('rel.txt', 't1');
            (0, vitest_1.expect)(candidates).toContain(path.resolve('/terminal/cwd', 'rel.txt'));
        });
        (0, vitest_1.it)('should use absolute path directly', () => {
            const abs = path.resolve('/abs/path.txt');
            const candidates = resolver.buildPathCandidates(abs);
            (0, vitest_1.expect)(candidates).toEqual([abs]);
        });
    });
});
//# sourceMappingURL=TerminalLinkResolver.test.js.map