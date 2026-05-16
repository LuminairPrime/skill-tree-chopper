"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackManager_1 = require("../../../../../webview/managers/ScrollbackManager");
(0, vitest_1.describe)('ScrollbackManager', () => {
    let manager;
    let mockTerminal;
    let mockSerializeAddon;
    (0, vitest_1.beforeEach)(() => {
        manager = new ScrollbackManager_1.ScrollbackManager();
        manager.initialize();
        mockSerializeAddon = {
            serialize: vitest_1.vi.fn().mockReturnValue('line1\nline2\n\n'),
        };
        mockTerminal = {
            clear: vitest_1.vi.fn(),
            writeln: vitest_1.vi.fn(),
            buffer: {
                active: {
                    baseY: 0,
                    cursorY: 1,
                    getLine: vitest_1.vi.fn().mockImplementation((i) => ({
                        translateToString: () => `text${i}`,
                        isWrapped: false,
                    })),
                },
            },
        };
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Registration', () => {
        (0, vitest_1.it)('should register and unregister terminals', () => {
            manager.registerTerminal('t1', mockTerminal, mockSerializeAddon);
            (0, vitest_1.expect)(manager.getStats().registeredTerminals).toBe(1);
            manager.unregisterTerminal('t1');
            (0, vitest_1.expect)(manager.getStats().registeredTerminals).toBe(0);
        });
    });
    (0, vitest_1.describe)('saveScrollback', () => {
        (0, vitest_1.it)('should save and process scrollback data', () => {
            manager.registerTerminal('t1', mockTerminal, mockSerializeAddon);
            // Update mock to match serialize output
            mockTerminal.buffer.active.getLine.mockImplementation((i) => {
                if (i === 0)
                    return { translateToString: () => 'line1', isWrapped: false };
                if (i === 1)
                    return { translateToString: () => 'line2', isWrapped: false };
                return null;
            });
            const result = manager.saveScrollback('t1', { trimEmptyLines: true });
            (0, vitest_1.expect)(result).not.toBeNull();
            if (result) {
                (0, vitest_1.expect)(mockSerializeAddon.serialize).toHaveBeenCalled();
                (0, vitest_1.expect)(result.content).toBe('line1\nline2');
                (0, vitest_1.expect)(result.lineCount).toBe(2);
            }
        });
        (0, vitest_1.it)('should return null for unregistered terminal', () => {
            const result = manager.saveScrollback('non-existent');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('restoreScrollback', () => {
        (0, vitest_1.it)('should restore content to terminal', () => {
            manager.registerTerminal('t1', mockTerminal, mockSerializeAddon);
            const success = manager.restoreScrollback('t1', 'row1\nrow2');
            (0, vitest_1.expect)(success).toBe(true);
            (0, vitest_1.expect)(mockTerminal.clear).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledWith('row1');
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledWith('row2');
        });
    });
    (0, vitest_1.describe)('Buffer Operations', () => {
        (0, vitest_1.it)('should reconstruct full buffer line with wrapping', () => {
            const mockBuffer = {
                getLine: vitest_1.vi.fn().mockImplementation((i) => {
                    if (i === 0)
                        return { translateToString: () => 'part1', isWrapped: false };
                    if (i === 1)
                        return { translateToString: () => 'part2', isWrapped: true };
                    return null;
                }),
            };
            const line1 = mockBuffer.getLine(1);
            const full = manager.getFullBufferLine(line1, 1, mockBuffer);
            (0, vitest_1.expect)(full).toBe('part1part2');
        });
        (0, vitest_1.it)('should iterate buffer in reverse', () => {
            const mockBuffer = {
                getLine: vitest_1.vi.fn().mockImplementation((i) => ({ id: i })),
            };
            const iterator = manager.getBufferReverseIterator(mockBuffer, 2);
            const results = Array.from(iterator);
            (0, vitest_1.expect)(results).toHaveLength(3);
            (0, vitest_1.expect)(results[0].id).toBe(2);
            (0, vitest_1.expect)(results[1].id).toBe(1);
            (0, vitest_1.expect)(results[2].id).toBe(0);
        });
    });
});
//# sourceMappingURL=ScrollbackManager.test.js.map