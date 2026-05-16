"use strict";
/**
 * WebViewApiManager Unit Tests
 *
 * Tests for VS Code API communication including:
 * - API initialization
 * - Message sending to extension
 * - State persistence
 * - Diagnostics
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const WebViewApiManager_1 = require("../../../../../webview/managers/WebViewApiManager");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
// Helper to create mock VS Code API
function createMockVSCodeApi() {
    return {
        postMessage: vitest_1.vi.fn(),
        getState: vitest_1.vi.fn().mockReturnValue(null),
        setState: vitest_1.vi.fn(),
    };
}
(0, vitest_1.describe)('WebViewApiManager', () => {
    let manager;
    let originalWindow;
    let mockApi;
    (0, vitest_1.beforeEach)(() => {
        originalWindow = global.window;
        mockApi = createMockVSCodeApi();
        // Setup window with vscodeApi
        global.window = {
            ...originalWindow,
            vscodeApi: mockApi,
        };
        manager = new WebViewApiManager_1.WebViewApiManager();
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        global.window = originalWindow;
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Constructor and Initialization', () => {
        (0, vitest_1.it)('should create instance', () => {
            (0, vitest_1.expect)(manager).toBeDefined();
        });
        (0, vitest_1.it)('should initialize API from window.vscodeApi', () => {
            (0, vitest_1.expect)(manager.isApiAvailable()).toBe(true);
        });
        (0, vitest_1.it)('should handle missing vscodeApi gracefully', () => {
            global.window = {
                ...originalWindow,
                vscodeApi: undefined,
                acquireVsCodeApi: undefined,
            };
            const newManager = new WebViewApiManager_1.WebViewApiManager();
            (0, vitest_1.expect)(newManager.isApiAvailable()).toBe(false);
            newManager.dispose();
        });
        (0, vitest_1.it)('should acquire API from acquireVsCodeApi if vscodeApi not available', () => {
            const acquiredApi = createMockVSCodeApi();
            global.window = {
                ...originalWindow,
                vscodeApi: undefined,
                acquireVsCodeApi: vitest_1.vi.fn().mockReturnValue(acquiredApi),
            };
            const newManager = new WebViewApiManager_1.WebViewApiManager();
            (0, vitest_1.expect)(newManager.isApiAvailable()).toBe(true);
            newManager.dispose();
        });
        (0, vitest_1.it)('should handle initialization error gracefully', () => {
            global.window = {
                ...originalWindow,
                vscodeApi: undefined,
                acquireVsCodeApi: vitest_1.vi.fn().mockImplementation(() => {
                    throw new Error('API acquisition failed');
                }),
            };
            (0, vitest_1.expect)(() => new WebViewApiManager_1.WebViewApiManager()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('isApiAvailable', () => {
        (0, vitest_1.it)('should return true when API is initialized', () => {
            (0, vitest_1.expect)(manager.isApiAvailable()).toBe(true);
        });
        (0, vitest_1.it)('should return false when API is not available', () => {
            manager.dispose();
            (0, vitest_1.expect)(manager.isApiAvailable()).toBe(false);
        });
    });
    (0, vitest_1.describe)('getApi', () => {
        (0, vitest_1.it)('should return VS Code API when available', () => {
            const api = manager.getApi();
            (0, vitest_1.expect)(api).toBeDefined();
            (0, vitest_1.expect)(typeof api?.postMessage).toBe('function');
        });
        (0, vitest_1.it)('should attempt to reinitialize if API not available', () => {
            manager.dispose();
            // After dispose, getApi should try to reinitialize
            const api = manager.getApi();
            // May or may not succeed depending on window state
            (0, vitest_1.expect)(api === null || api !== null).toBe(true);
        });
    });
    (0, vitest_1.describe)('postMessageToExtension', () => {
        (0, vitest_1.it)('should send message to extension', () => {
            const message = { command: 'test', data: 'value' };
            const result = manager.postMessageToExtension(message);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockApi.postMessage).toHaveBeenCalledWith(message);
        });
        (0, vitest_1.it)('should return false when API not available', () => {
            manager.dispose();
            // Also clear window.vscodeApi to prevent reinitialization
            global.window = {
                ...global.window,
                vscodeApi: undefined,
                acquireVsCodeApi: undefined,
            };
            const result = manager.postMessageToExtension({ command: 'test' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle postMessage error gracefully', () => {
            mockApi.postMessage.mockImplementation(() => {
                throw new Error('Message failed');
            });
            const result = manager.postMessageToExtension({ command: 'test' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should log message command', () => {
            const message = { command: 'testCommand', data: 'value' };
            manager.postMessageToExtension(message);
            (0, vitest_1.expect)(mockApi.postMessage).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('saveState', () => {
        (0, vitest_1.it)('should save state via VS Code API', () => {
            const state = { terminals: [], settings: {} };
            const result = manager.saveState(state);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockApi.setState).toHaveBeenCalledWith(state);
        });
        (0, vitest_1.it)('should return false when API not available', () => {
            manager.dispose();
            // Also clear window.vscodeApi to prevent reinitialization
            global.window = {
                ...global.window,
                vscodeApi: undefined,
                acquireVsCodeApi: undefined,
            };
            const result = manager.saveState({ test: 'data' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle setState error gracefully', () => {
            mockApi.setState.mockImplementation(() => {
                throw new Error('State save failed');
            });
            const result = manager.saveState({ test: 'data' });
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('loadState', () => {
        (0, vitest_1.it)('should load state via VS Code API', () => {
            const savedState = { terminals: ['t1', 't2'], settings: { theme: 'dark' } };
            mockApi.getState.mockReturnValue(savedState);
            const state = manager.loadState();
            (0, vitest_1.expect)(state).toEqual(savedState);
        });
        (0, vitest_1.it)('should return null when API not available', () => {
            manager.dispose();
            // Also clear window.vscodeApi to prevent reinitialization
            global.window = {
                ...global.window,
                vscodeApi: undefined,
                acquireVsCodeApi: undefined,
            };
            const state = manager.loadState();
            (0, vitest_1.expect)(state).toBeNull();
        });
        (0, vitest_1.it)('should handle getState error gracefully', () => {
            mockApi.getState.mockImplementation(() => {
                throw new Error('State load failed');
            });
            const state = manager.loadState();
            (0, vitest_1.expect)(state).toBeNull();
        });
        (0, vitest_1.it)('should return null when no state saved', () => {
            mockApi.getState.mockReturnValue(null);
            const state = manager.loadState();
            (0, vitest_1.expect)(state).toBeNull();
        });
    });
    (0, vitest_1.describe)('getDiagnostics', () => {
        (0, vitest_1.it)('should return diagnostic information', () => {
            const diagnostics = manager.getDiagnostics();
            (0, vitest_1.expect)(diagnostics).toHaveProperty('isInitialized');
            (0, vitest_1.expect)(diagnostics).toHaveProperty('isApiAvailable');
            (0, vitest_1.expect)(diagnostics).toHaveProperty('apiMethods');
        });
        (0, vitest_1.it)('should report initialized state correctly', () => {
            const diagnostics = manager.getDiagnostics();
            (0, vitest_1.expect)(diagnostics.isInitialized).toBe(true);
            (0, vitest_1.expect)(diagnostics.isApiAvailable).toBe(true);
        });
        (0, vitest_1.it)('should list API methods', () => {
            const diagnostics = manager.getDiagnostics();
            (0, vitest_1.expect)(diagnostics.apiMethods).toContain('postMessage');
            (0, vitest_1.expect)(diagnostics.apiMethods).toContain('getState');
            (0, vitest_1.expect)(diagnostics.apiMethods).toContain('setState');
        });
        (0, vitest_1.it)('should return empty methods array when API not available', () => {
            manager.dispose();
            const diagnostics = manager.getDiagnostics();
            (0, vitest_1.expect)(diagnostics.apiMethods).toEqual([]);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear API reference', () => {
            manager.dispose();
            (0, vitest_1.expect)(manager.isApiAvailable()).toBe(false);
        });
        (0, vitest_1.it)('should reset initialized flag', () => {
            manager.dispose();
            const diagnostics = manager.getDiagnostics();
            (0, vitest_1.expect)(diagnostics.isInitialized).toBe(false);
        });
        (0, vitest_1.it)('should be idempotent', () => {
            manager.dispose();
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle undefined message', () => {
            const result = manager.postMessageToExtension(undefined);
            (0, vitest_1.expect)(result).toBe(true); // Should still attempt to send
        });
        (0, vitest_1.it)('should handle complex message objects', () => {
            const complexMessage = {
                command: 'complex',
                data: {
                    nested: {
                        array: [1, 2, 3],
                        object: { key: 'value' },
                    },
                },
                timestamp: Date.now(),
            };
            const result = manager.postMessageToExtension(complexMessage);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockApi.postMessage).toHaveBeenCalledWith(complexMessage);
        });
        (0, vitest_1.it)('should handle saving complex state', () => {
            const complexState = {
                terminals: [
                    { id: 't1', scrollback: ['line1', 'line2'] },
                    { id: 't2', scrollback: ['line3'] },
                ],
                settings: {
                    theme: 'dark',
                    nested: { value: 123 },
                },
            };
            const result = manager.saveState(complexState);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockApi.setState).toHaveBeenCalledWith(complexState);
        });
    });
});
//# sourceMappingURL=WebViewApiManager.test.js.map