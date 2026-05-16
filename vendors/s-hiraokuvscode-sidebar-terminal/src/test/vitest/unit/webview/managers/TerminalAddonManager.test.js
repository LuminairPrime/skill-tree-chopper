"use strict";
/**
 * TerminalAddonManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalAddonManager_1 = require("../../../../../webview/managers/TerminalAddonManager");
const AddonLoader_1 = require("../../../../../webview/utils/AddonLoader");
// Mock generic logger
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
// Mock ErrorHandler
vitest_1.vi.mock('../../../../../webview/utils/ErrorHandler', () => ({
    ErrorHandler: {
        handleOperationError: vitest_1.vi.fn(),
    },
}));
// Mock AddonLoader
vitest_1.vi.mock('../../../../../webview/utils/AddonLoader', () => ({
    AddonLoader: {
        loadAddon: vitest_1.vi.fn(),
    },
}));
// Mock xterm addons
vitest_1.vi.mock('@xterm/addon-fit', () => ({
    FitAddon: class {
        constructor() {
            this.activate = vitest_1.vi.fn();
            this.proposeDimensions = vitest_1.vi.fn().mockReturnValue({ cols: 80, rows: 24 });
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('@xterm/addon-web-links', () => ({
    WebLinksAddon: class {
        constructor() {
            this.activate = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('@xterm/addon-serialize', () => ({
    SerializeAddon: class {
        constructor() {
            this.activate = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('@xterm/addon-search', () => ({
    SearchAddon: class {
        constructor() {
            this.activate = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('@xterm/addon-unicode11', () => ({
    Unicode11Addon: class {
        constructor() {
            this.activate = vitest_1.vi.fn();
            this.dispose = vitest_1.vi.fn();
        }
    },
}));
(0, vitest_1.describe)('TerminalAddonManager', () => {
    let manager;
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        manager = new TerminalAddonManager_1.TerminalAddonManager();
        mockTerminal = {
            loadAddon: vitest_1.vi.fn(),
            unicode: { activeVersion: '6' },
            element: document.createElement('div'),
            _core: {
                _renderService: { dimensions: { css: { cell: { width: 10, height: 20 } } } },
                viewport: { scrollBarWidth: 10 },
            },
        };
        // Setup basic AddonLoader mocks
        AddonLoader_1.AddonLoader.loadAddon.mockImplementation((term, id, AddonClass) => {
            return new AddonClass();
        });
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('loadAllAddons', () => {
        (0, vitest_1.it)('should load essential addons by default', async () => {
            const addons = await manager.loadAllAddons(mockTerminal, 't1', {});
            (0, vitest_1.expect)(addons.fitAddon).toBeDefined();
            (0, vitest_1.expect)(addons.webLinksAddon).toBeDefined();
            (0, vitest_1.expect)(addons.serializeAddon).toBeDefined();
            (0, vitest_1.expect)(addons.searchAddon).toBeUndefined();
        });
        (0, vitest_1.it)('should load required addons successfully', async () => {
            const config = {};
            const addons = await manager.loadAllAddons(mockTerminal, 't1', config);
            (0, vitest_1.expect)(addons.fitAddon).toBeDefined();
            (0, vitest_1.expect)(addons.webLinksAddon).toBeDefined();
            (0, vitest_1.expect)(addons.serializeAddon).toBeDefined();
            (0, vitest_1.expect)(AddonLoader_1.AddonLoader.loadAddon).toHaveBeenCalledTimes(3); // Fit, WebLinks, Serialize
        });
        (0, vitest_1.it)('should load optional addons when enabled', async () => {
            const config = {
                enableSearchAddon: true,
                enableUnicode11: true,
            };
            const addons = await manager.loadAllAddons(mockTerminal, 't1', config);
            (0, vitest_1.expect)(addons.searchAddon).toBeDefined();
            (0, vitest_1.expect)(addons.unicode11Addon).toBeDefined();
            (0, vitest_1.expect)(AddonLoader_1.AddonLoader.loadAddon).toHaveBeenCalledTimes(5);
        });
        (0, vitest_1.it)('should configure WebLinksAddon with custom handler', async () => {
            const linkHandler = vitest_1.vi.fn();
            const config = {
                linkHandler,
                linkModifier: 'alt',
            };
            await manager.loadAllAddons(mockTerminal, 't1', config);
            (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalled();
            // AddonLoader called for Fit and Serialize (2 times)
            // WebLinksAddon instantiated directly
            (0, vitest_1.expect)(AddonLoader_1.AddonLoader.loadAddon).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should throw if required addon fails to load', async () => {
            AddonLoader_1.AddonLoader.loadAddon.mockResolvedValueOnce(null); // Fail FitAddon
            await (0, vitest_1.expect)(manager.loadAllAddons(mockTerminal, 't1', {})).rejects.toThrow('FitAddon failed to load');
        });
    });
    (0, vitest_1.describe)('disposeAddons', () => {
        (0, vitest_1.it)('should call dispose on optional addons', () => {
            const searchAddon = { dispose: vitest_1.vi.fn() };
            const unicode11Addon = { dispose: vitest_1.vi.fn() };
            const addons = {
                searchAddon,
                unicode11Addon,
                fitAddon: {}, // Essential ones usually auto-disposed by xterm
            };
            manager.disposeAddons(addons);
            (0, vitest_1.expect)(searchAddon.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(unicode11Addon.dispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should dispose optional addons after loading', async () => {
            const config = {
                enableSearchAddon: true,
                enableUnicode11: true,
            };
            const addons = await manager.loadAllAddons(mockTerminal, 't1', config);
            // Mock dispose methods
            addons.searchAddon.dispose = vitest_1.vi.fn();
            addons.unicode11Addon.dispose = vitest_1.vi.fn();
            manager.disposeAddons(addons);
            (0, vitest_1.expect)(addons.searchAddon.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(addons.unicode11Addon.dispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle undefined addons gracefully', () => {
            (0, vitest_1.expect)(() => manager.disposeAddons(undefined)).not.toThrow();
        });
        (0, vitest_1.it)('should be safe with undefined', () => {
            (0, vitest_1.expect)(() => manager.disposeAddons(undefined)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('fitAddon patching', () => {
        (0, vitest_1.it)('should patch proposeDimensions', async () => {
            const addons = await manager.loadAllAddons(mockTerminal, 't1', {});
            const fitAddon = addons.fitAddon;
            (0, vitest_1.expect)(fitAddon.proposeDimensions).toBeDefined();
            // Call patched method (should fallback to original or run custom logic)
            const dims = fitAddon.proposeDimensions();
            (0, vitest_1.expect)(dims).toBeDefined();
        });
        (0, vitest_1.it)('should patch proposeDimensions to handle scrollbar', async () => {
            const addons = await manager.loadAllAddons(mockTerminal, 't1', {});
            const fitAddon = addons.fitAddon;
            // Setup DOM for patch logic test
            const parent = document.createElement('div');
            Object.defineProperty(parent, 'clientWidth', { value: 100 });
            Object.defineProperty(parent, 'clientHeight', { value: 100 });
            // JSDOM specific: getComputedStyle mocks
            vitest_1.vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
                if (el === parent)
                    return {
                        getPropertyValue: (prop) => (prop === 'width' ? '100px' : '100px'),
                    };
                return { getPropertyValue: () => '0px' };
            });
            // Mock terminal element parent
            Object.defineProperty(mockTerminal.element, 'parentElement', { value: parent });
            // Call patched method
            const dims = fitAddon.proposeDimensions();
            (0, vitest_1.expect)(dims).toBeDefined();
            (0, vitest_1.expect)(dims.cols).toBeGreaterThan(0);
            (0, vitest_1.expect)(dims.rows).toBeGreaterThan(0);
        });
        // Comprehensive tests for proposeDimensions with safety padding removal
        (0, vitest_1.describe)('proposeDimensions with safety padding removal', () => {
            const setupProposeDimensionsTest = (parentWidth, parentHeight, cellWidth, cellHeight, scrollbarWidth = 0, paddingLeft = 0, paddingRight = 0, paddingTop = 0, paddingBottom = 0, parentPaddingLeft = 0, parentPaddingRight = 0, parentPaddingTop = 0, parentPaddingBottom = 0) => {
                const parent = document.createElement('div');
                const element = document.createElement('div');
                // Setup parent dimensions
                vitest_1.vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
                    if (el === parent) {
                        return {
                            getPropertyValue: (prop) => {
                                switch (prop) {
                                    case 'width':
                                        return `${parentWidth}px`;
                                    case 'height':
                                        return `${parentHeight}px`;
                                    case 'padding-left':
                                        return `${parentPaddingLeft}px`;
                                    case 'padding-right':
                                        return `${parentPaddingRight}px`;
                                    case 'padding-top':
                                        return `${parentPaddingTop}px`;
                                    case 'padding-bottom':
                                        return `${parentPaddingBottom}px`;
                                    default:
                                        return '0px';
                                }
                            },
                        };
                    }
                    if (el === element) {
                        return {
                            getPropertyValue: (prop) => {
                                switch (prop) {
                                    case 'padding-left':
                                        return `${paddingLeft}px`;
                                    case 'padding-right':
                                        return `${paddingRight}px`;
                                    case 'padding-top':
                                        return `${paddingTop}px`;
                                    case 'padding-bottom':
                                        return `${paddingBottom}px`;
                                    default:
                                        return '0px';
                                }
                            },
                        };
                    }
                    return { getPropertyValue: () => '0px' };
                });
                // Setup viewport with scrollbar measurement
                const viewport = document.createElement('div');
                Object.defineProperty(viewport, 'offsetWidth', { value: parentWidth - scrollbarWidth });
                Object.defineProperty(viewport, 'clientWidth', { value: parentWidth - scrollbarWidth });
                // Add viewport to element for querySelector to find
                element.appendChild(viewport);
                // Setup terminal mock with precise dimensions
                const terminalMock = {
                    loadAddon: vitest_1.vi.fn(),
                    unicode: { activeVersion: '6' },
                    element,
                    _core: {
                        _renderService: {
                            dimensions: {
                                css: { cell: { width: cellWidth, height: cellHeight } },
                            },
                        },
                        viewport: { scrollBarWidth: scrollbarWidth },
                    },
                };
                Object.defineProperty(element, 'parentElement', { value: parent });
                return { terminalMock, parent, element };
            };
            (0, vitest_1.it)('should calculate cols correctly for narrow viewport (200px) without scrollbar', async () => {
                const { terminalMock } = setupProposeDimensionsTest(200, 400, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (200 - 0) / 10 = 20 cols
                (0, vitest_1.expect)(dims.cols).toBe(20);
                (0, vitest_1.expect)(dims.rows).toBeGreaterThan(0);
            });
            (0, vitest_1.it)('should calculate cols correctly for narrow viewport (200px) with scrollbar (14px)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(200, 400, 10, 20, 14);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (200 - 14) / 10 = 18.6 → 18 cols
                (0, vitest_1.expect)(dims.cols).toBe(18);
                (0, vitest_1.expect)(dims.cols).toBeGreaterThanOrEqual(2); // Minimum cols
            });
            (0, vitest_1.it)('should calculate cols correctly for standard viewport (800px) without scrollbar', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 0) / 10 = 80 cols
                (0, vitest_1.expect)(dims.cols).toBe(80);
            });
            (0, vitest_1.it)('should calculate cols correctly for standard viewport (800px) with scrollbar (14px)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 14);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 14) / 10 = 78.6 → 78 cols
                (0, vitest_1.expect)(dims.cols).toBe(78);
            });
            (0, vitest_1.it)('should calculate cols correctly for wide viewport (1920px) without scrollbar', async () => {
                const { terminalMock } = setupProposeDimensionsTest(1920, 1080, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (1920 - 0) / 10 = 192 cols
                (0, vitest_1.expect)(dims.cols).toBe(192);
            });
            (0, vitest_1.it)('should calculate cols correctly for wide viewport (1920px) with scrollbar (14px)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(1920, 1080, 10, 20, 14);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (1920 - 14) / 10 = 190.6 → 190 cols
                (0, vitest_1.expect)(dims.cols).toBe(190);
            });
            (0, vitest_1.it)('should handle small cell width (7px - compact font)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 7, 16, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 0) / 7 = 114.28 → 114 cols
                (0, vitest_1.expect)(dims.cols).toBe(114);
                // Verify more columns are available with smaller font
                (0, vitest_1.expect)(dims.cols).toBeGreaterThan(80);
            });
            (0, vitest_1.it)('should handle medium cell width (10px - normal font)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 0) / 10 = 80 cols
                (0, vitest_1.expect)(dims.cols).toBe(80);
            });
            (0, vitest_1.it)('should handle large cell width (12px - large font)', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 12, 24, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 0) / 12 = 66.66 → 66 cols
                (0, vitest_1.expect)(dims.cols).toBe(66);
                // Verify fewer columns available with larger font
                (0, vitest_1.expect)(dims.cols).toBeLessThan(80);
            });
            (0, vitest_1.it)('should include padding in width calculation', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 0, 4, 4, 0, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 4 - 4) / 10 = 79.2 → 79 cols
                (0, vitest_1.expect)(dims.cols).toBe(79);
            });
            (0, vitest_1.it)('should handle both padding and scrollbar', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 14, 4, 4, 0, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 4 - 4 - 14) / 10 = 77.8 → 77 cols
                (0, vitest_1.expect)(dims.cols).toBe(77);
            });
            (0, vitest_1.it)('should include parent padding in width calculation', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 0, 0, 0, 0, 0, 4, 4, 0, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (800 - 4 - 4) / 10 = 79.2 → 79 cols
                (0, vitest_1.expect)(dims.cols).toBe(79);
            });
            (0, vitest_1.it)('should enforce minimum cols of 2', async () => {
                // Very small viewport that would result in < 2 cols
                const { terminalMock } = setupProposeDimensionsTest(10, 20, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: Math.max(2, Math.floor((10 - 0) / 10)) = Math.max(2, 1) = 2 cols
                (0, vitest_1.expect)(dims.cols).toBe(2);
            });
            (0, vitest_1.it)('should enforce minimum rows of 1', async () => {
                // Very small viewport that would result in < 1 row
                const { terminalMock } = setupProposeDimensionsTest(800, 10, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: Math.max(1, Math.floor((10 - 0) / 20)) = Math.max(1, 0) = 1 row
                (0, vitest_1.expect)(dims.rows).toBe(1);
            });
            (0, vitest_1.it)('should calculate rows correctly with padding', async () => {
                const { terminalMock } = setupProposeDimensionsTest(800, 400, 10, 20, 0, 0, 0, 4, 4);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (400 - 4 - 4) / 20 = 19.2 → 19 rows
                (0, vitest_1.expect)(dims.rows).toBe(19);
            });
            (0, vitest_1.it)('removal of 4px safety padding maximizes visible area', async () => {
                // Test with standard viewport
                const { terminalMock } = setupProposeDimensionsTest(800, 600, 10, 20, 0);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // With safety padding = 0, we get full width utilization
                // Expected: 800 / 10 = 80 cols
                (0, vitest_1.expect)(dims.cols).toBe(80);
                // Verify that if safety padding were 4px, we'd get fewer columns
                // (800 - 4) / 10 = 79.6 → 79 cols
                (0, vitest_1.expect)(dims.cols).toBeGreaterThan(79);
            });
            (0, vitest_1.it)('should not have regression with safety padding removal and scrollbar', async () => {
                // Realistic scenario: standard width with scrollbar
                const { terminalMock } = setupProposeDimensionsTest(1024, 768, 10, 20, 14);
                const addons = await manager.loadAllAddons(terminalMock, 't1', {});
                const dims = addons.fitAddon.proposeDimensions();
                // Expected: (1024 - 14) / 10 = 101 cols
                (0, vitest_1.expect)(dims.cols).toBe(101);
                (0, vitest_1.expect)(dims.cols).toBeGreaterThan(0);
            });
        });
    });
});
//# sourceMappingURL=TerminalAddonManager.test.js.map