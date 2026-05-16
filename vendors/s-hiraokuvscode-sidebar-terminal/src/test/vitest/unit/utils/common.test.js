"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("../../../../utils/common");
// Mock vscode
vi.mock('vscode', () => ({
    workspace: {
        workspaceFolders: [],
    },
    window: {
        activeTextEditor: undefined,
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
    },
}));
(0, vitest_1.describe)('Common Utils', () => {
    (0, vitest_1.describe)('safeProcessCwd', () => {
        (0, vitest_1.it)('should return process.cwd() if valid', () => {
            const cwd = (0, common_1.safeProcessCwd)();
            (0, vitest_1.expect)(cwd).toBeDefined();
            (0, vitest_1.expect)(cwd).not.toBe('/');
        });
        (0, vitest_1.it)('should return fallback if process.cwd() is root', () => {
            const spy = vi.spyOn(process, 'cwd').mockReturnValue('/');
            const fallback = '/tmp/fallback';
            (0, vitest_1.expect)((0, common_1.safeProcessCwd)(fallback)).toBe(fallback);
            spy.mockRestore();
        });
    });
    (0, vitest_1.describe)('ID & Nonce Generation', () => {
        (0, vitest_1.it)('should generate unique terminal IDs', () => {
            const id1 = (0, common_1.generateTerminalId)();
            const id2 = (0, common_1.generateTerminalId)();
            (0, vitest_1.expect)(id1).toContain('terminal-');
            (0, vitest_1.expect)(id1).not.toBe(id2);
        });
        (0, vitest_1.it)('should generate nonces of correct length', () => {
            const nonce = (0, common_1.generateNonce)();
            (0, vitest_1.expect)(nonce.length).toBe(32); // Default length in constants
        });
    });
    (0, vitest_1.describe)('Safe Helpers', () => {
        (0, vitest_1.it)('should get first item safely', () => {
            (0, vitest_1.expect)((0, common_1.getFirstItem)([1, 2, 3])).toBe(1);
            (0, vitest_1.expect)((0, common_1.getFirstItem)([])).toBeUndefined();
            (0, vitest_1.expect)((0, common_1.getFirstItem)(null)).toBeUndefined();
        });
        (0, vitest_1.it)('should get first value from Map safely', () => {
            const map = new Map([
                ['key1', 'val1'],
                ['key2', 'val2'],
            ]);
            (0, vitest_1.expect)((0, common_1.getFirstValue)(map)).toBe('val1');
            (0, vitest_1.expect)((0, common_1.getFirstValue)(new Map())).toBeUndefined();
        });
        (0, vitest_1.it)('should stringify objects safely', () => {
            const obj = { a: 1 };
            (0, vitest_1.expect)((0, common_1.safeStringify)(obj)).toBe('{"a":1}');
            // Handle circular reference
            const circular = { a: 1 };
            circular.self = circular;
            (0, vitest_1.expect)((0, common_1.safeStringify)(circular)).toContain('[object Object]');
        });
    });
    (0, vitest_1.describe)('ActiveTerminalManager', () => {
        (0, vitest_1.it)('should manage active terminal state', () => {
            const mgr = new common_1.ActiveTerminalManager();
            (0, vitest_1.expect)(mgr.hasActive()).toBe(false);
            mgr.setActive('t1');
            (0, vitest_1.expect)(mgr.getActive()).toBe('t1');
            (0, vitest_1.expect)(mgr.hasActive()).toBe(true);
            (0, vitest_1.expect)(mgr.isActive('t1')).toBe(true);
            (0, vitest_1.expect)(mgr.isActive('t2')).toBe(false);
            mgr.clearActive();
            (0, vitest_1.expect)(mgr.hasActive()).toBe(false);
        });
    });
    (0, vitest_1.describe)('normalizeTerminalInfo', () => {
        (0, vitest_1.it)('should pick only required fields', () => {
            const raw = { id: '1', name: 'term', isActive: true, extra: 'junk' };
            const normalized = (0, common_1.normalizeTerminalInfo)(raw);
            (0, vitest_1.expect)(normalized).toEqual({ id: '1', name: 'term', isActive: true });
            (0, vitest_1.expect)(normalized.extra).toBeUndefined();
        });
    });
});
//# sourceMappingURL=common.test.js.map