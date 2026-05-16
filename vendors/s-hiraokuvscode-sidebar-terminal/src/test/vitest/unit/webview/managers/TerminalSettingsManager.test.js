"use strict";
/**
 * TerminalSettingsManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalSettingsManager_1 = require("../../../../../webview/managers/TerminalSettingsManager");
const ConfigManager_1 = require("../../../../../webview/managers/ConfigManager");
// Mock generic logger
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
// Mock FontSettingsService
vi.mock('../../../../../webview/services/FontSettingsService', () => ({
    FontSettingsService: class {
        constructor() {
            this.setApplicator = vi.fn();
            this.getCurrentSettings = vi.fn().mockReturnValue({ fontSize: 14 });
            this.updateSettings = vi.fn();
        }
    },
}));
(0, vitest_1.describe)('TerminalSettingsManager', () => {
    let manager;
    let mockUIManager;
    let mockConfigManager;
    let mockCallbacks;
    beforeEach(() => {
        mockUIManager = {
            setActiveBorderMode: vi.fn(),
            setTerminalHeaderEnhancementsEnabled: vi.fn(),
            updateTerminalBorders: vi.fn(),
            updateSplitTerminalBorders: vi.fn(),
            applyAllVisualSettings: vi.fn(),
        };
        mockConfigManager = {
            applySettings: vi.fn(),
            getCurrentSettings: vi.fn().mockReturnValue({}),
            setFontSettingsService: vi.fn(),
        };
        // Simulate instance of ConfigManager for type check
        Object.setPrototypeOf(mockConfigManager, ConfigManager_1.ConfigManager.prototype);
        mockCallbacks = {
            getAllTerminalInstances: vi.fn().mockReturnValue(new Map()),
            getAllTerminalContainers: vi.fn().mockReturnValue(new Map()),
            getActiveTerminalId: vi.fn().mockReturnValue('t1'),
        };
        manager = new TerminalSettingsManager_1.TerminalSettingsManager(mockUIManager, mockConfigManager, mockCallbacks);
    });
    afterEach(() => {
        manager.dispose();
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', () => {
            // Construction should trigger setApplicator and setFontSettingsService
            // FontSettingsService is instantiated in constructor, so we check if mock method called
            // We can't easily access the private instance, but we can assume it works if no error
            // Since we mocked FontSettingsService constructor via vi.mock return class
            // But we can't inspect the instance created inside manager easily without spyOn constructor
            // However, mockConfigManager.setFontSettingsService call is verifiable
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(mockConfigManager.setFontSettingsService).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Settings Application', () => {
        (0, vitest_1.it)('should apply settings to UI and Config managers', () => {
            const settings = {
                theme: 'dark',
                activeBorderMode: 'always',
            };
            manager.applySettings(settings);
            (0, vitest_1.expect)(mockUIManager.setActiveBorderMode).toHaveBeenCalledWith('always');
            (0, vitest_1.expect)(mockConfigManager.applySettings).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update borders for active terminal', () => {
            const container = document.createElement('div');
            mockCallbacks.getAllTerminalContainers.mockReturnValue(new Map([['t1', container]]));
            manager.applySettings({});
            (0, vitest_1.expect)(mockUIManager.updateTerminalBorders).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should apply visual settings to all terminals', () => {
            const mockTerminal = { options: {} };
            mockCallbacks.getAllTerminalInstances.mockReturnValue(new Map([['t1', { terminal: mockTerminal }]]));
            manager.applySettings({});
            (0, vitest_1.expect)(mockUIManager.applyAllVisualSettings).toHaveBeenCalledWith(mockTerminal, vitest_1.expect.anything());
        });
    });
    (0, vitest_1.describe)('Font Settings', () => {
        (0, vitest_1.it)('should apply font settings via service', () => {
            const fontSettings = { fontSize: 16 };
            const terminals = new Map();
            manager.applyFontSettings(fontSettings, terminals);
            // Access the private service if we want to be strict, but verifying no error is good start
            // Better: we can spy on the prototype method if we want to check internal call
            // Or check if log was called
        });
        (0, vitest_1.it)('should get current font settings', () => {
            const settings = manager.getCurrentFontSettings();
            (0, vitest_1.expect)(settings).toEqual({ fontSize: 14 });
        });
    });
    (0, vitest_1.describe)('State Management', () => {
        (0, vitest_1.it)('should load settings from state', () => {
            const state = {
                settings: { theme: 'light' },
                fontSettings: { fontSize: 12 },
                timestamp: 123,
            };
            manager.loadFromState(state);
            (0, vitest_1.expect)(mockUIManager.setActiveBorderMode).toHaveBeenCalled(); // via applySettings
            // applyFontSettings called too
        });
        (0, vitest_1.it)('should return state for saving', () => {
            const state = manager.getStateForSave();
            (0, vitest_1.expect)(state.settings).toBeDefined();
            (0, vitest_1.expect)(state.fontSettings).toBeDefined();
            (0, vitest_1.expect)(state.timestamp).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Defaults and Updates', () => {
        (0, vitest_1.it)('should reset to defaults', () => {
            manager.resetToDefaults();
            (0, vitest_1.expect)(mockUIManager.setActiveBorderMode).toHaveBeenCalledWith('multipleOnly'); // Default
        });
        (0, vitest_1.it)('should update single setting', () => {
            manager.updateSetting('theme', 'dark');
            (0, vitest_1.expect)(mockConfigManager.applySettings).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ theme: 'dark' }), vitest_1.expect.anything());
        });
    });
});
//# sourceMappingURL=TerminalSettingsManager.test.js.map