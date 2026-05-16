"use strict";
/**
 * FontSettingsService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const FontSettingsService_1 = require("../../../../../webview/services/FontSettingsService");
(0, vitest_1.describe)('FontSettingsService', () => {
    let service;
    let mockApplicator;
    beforeEach(() => {
        mockApplicator = {
            applyFontSettings: vi.fn(),
        };
        service = new FontSettingsService_1.FontSettingsService();
    });
    afterEach(() => {
        service.dispose();
        vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize with default settings', () => {
            const settings = service.getCurrentSettings();
            (0, vitest_1.expect)(settings.fontSize).toBeDefined();
            (0, vitest_1.expect)(settings.fontFamily).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with provided settings', () => {
            const initial = { fontSize: 20, fontFamily: 'Monaco' };
            const customService = new FontSettingsService_1.FontSettingsService(initial);
            const settings = customService.getCurrentSettings();
            (0, vitest_1.expect)(settings.fontSize).toBe(20);
            (0, vitest_1.expect)(settings.fontFamily).toBe('Monaco');
        });
    });
    (0, vitest_1.describe)('Applicator Management', () => {
        (0, vitest_1.it)('should set applicator successfully', () => {
            service.setApplicator(mockApplicator);
            // Private property, but we can test via effects
            const mockTerminal = {};
            service.applyToTerminal(mockTerminal, 'test-1');
            (0, vitest_1.expect)(mockApplicator.applyFontSettings).toHaveBeenCalledWith(mockTerminal, vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should warn when applying without applicator', () => {
            const _logSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            const mockTerminal = {};
            service.applyToTerminal(mockTerminal, 'test-1');
            (0, vitest_1.expect)(mockApplicator.applyFontSettings).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Settings Update', () => {
        (0, vitest_1.it)('should update settings and notify listeners', () => {
            const listener = vi.fn();
            service.onSettingsChange(listener);
            const newSettings = { fontSize: 16 };
            service.updateSettings(newSettings, new Map());
            (0, vitest_1.expect)(service.getCurrentSettings().fontSize).toBe(16);
            (0, vitest_1.expect)(listener).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                newSettings: vitest_1.expect.objectContaining({ fontSize: 16 }),
                previousSettings: vitest_1.expect.anything(),
            }));
        });
        (0, vitest_1.it)('should apply to all terminals when updated', () => {
            service.setApplicator(mockApplicator);
            const mockTerminal = { refresh: vi.fn(), rows: 24 };
            const mockFitAddon = { fit: vi.fn() };
            const terminals = new Map();
            terminals.set('t1', { terminal: mockTerminal, fitAddon: mockFitAddon });
            service.updateSettings({ fontSize: 18 }, terminals);
            (0, vitest_1.expect)(mockApplicator.applyFontSettings).toHaveBeenCalledWith(mockTerminal, vitest_1.expect.objectContaining({ fontSize: 18 }));
            (0, vitest_1.expect)(mockFitAddon.fit).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.refresh).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle errors in listeners gracefully', () => {
            const faultyListener = vi.fn().mockImplementation(() => {
                throw new Error('Faulty');
            });
            service.onSettingsChange(faultyListener);
            (0, vitest_1.expect)(() => service.updateSettings({ fontSize: 14 }, new Map())).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Validation and Normalization', () => {
        (0, vitest_1.it)('should clamp font size to valid range', () => {
            service.updateSettings({ fontSize: 1 }, new Map()); // Too small
            (0, vitest_1.expect)(service.getCurrentSettings().fontSize).toBe(8);
            service.updateSettings({ fontSize: 100 }, new Map()); // Too large
            (0, vitest_1.expect)(service.getCurrentSettings().fontSize).toBe(72);
        });
        (0, vitest_1.it)('should normalize font weights', () => {
            service.updateSettings({ fontWeight: 'bold' }, new Map());
            (0, vitest_1.expect)(service.getCurrentSettings().fontWeight).toBe('bold');
            service.updateSettings({ fontWeight: '900' }, new Map());
            (0, vitest_1.expect)(service.getCurrentSettings().fontWeight).toBe('900');
            service.updateSettings({ fontWeight: 'invalid' }, new Map());
            (0, vitest_1.expect)(service.getCurrentSettings().fontWeight).toBe('normal');
        });
        (0, vitest_1.it)('should validate line height and letter spacing', () => {
            service.updateSettings({ lineHeight: -1, letterSpacing: 5 }, new Map());
            // Negative lineHeight should be ignored (use default)
            (0, vitest_1.expect)(service.getCurrentSettings().lineHeight).toBeGreaterThan(0);
            (0, vitest_1.expect)(service.getCurrentSettings().letterSpacing).toBe(5);
        });
    });
    (0, vitest_1.describe)('Single Terminal Application', () => {
        (0, vitest_1.it)('should handle errors during single terminal application', () => {
            service.setApplicator({
                applyFontSettings: () => {
                    throw new Error('Failed');
                },
            });
            (0, vitest_1.expect)(() => service.applyToTerminal({}, 't1')).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Unsubscribe', () => {
        (0, vitest_1.it)('should stop notifying when unsubscribed', () => {
            const listener = vi.fn();
            const unsubscribe = service.onSettingsChange(listener);
            unsubscribe();
            service.updateSettings({ fontSize: 15 }, new Map());
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Platform Detection', () => {
        (0, vitest_1.it)('should use different defaults based on platform', async () => {
            // Test Mac
            vi.resetModules();
            vi.stubGlobal('navigator', { userAgent: 'Macintosh' });
            const modMac = await Promise.resolve().then(() => require('../../../../../webview/services/FontSettingsService'));
            const macService = new modMac.FontSettingsService();
            (0, vitest_1.expect)(macService.getCurrentSettings().fontSize).toBe(12);
            // Test Linux
            vi.resetModules();
            vi.stubGlobal('navigator', { userAgent: 'Linux' });
            const modLinux = await Promise.resolve().then(() => require('../../../../../webview/services/FontSettingsService'));
            const linuxService = new modLinux.FontSettingsService();
            (0, vitest_1.expect)(linuxService.getCurrentSettings().lineHeight).toBe(1.1);
            // Test Other (Windows)
            vi.resetModules();
            vi.stubGlobal('navigator', { userAgent: 'Windows' });
            const modWin = await Promise.resolve().then(() => require('../../../../../webview/services/FontSettingsService'));
            const winService = new modWin.FontSettingsService();
            (0, vitest_1.expect)(winService.getCurrentSettings().fontSize).toBe(14);
            (0, vitest_1.expect)(winService.getCurrentSettings().lineHeight).toBe(1.0);
        });
    });
});
//# sourceMappingURL=FontSettingsService.test.js.map