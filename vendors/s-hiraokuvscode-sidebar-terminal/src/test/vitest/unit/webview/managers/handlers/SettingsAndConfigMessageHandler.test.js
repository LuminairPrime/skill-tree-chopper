"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SettingsAndConfigMessageHandler_1 = require("../../../../../../webview/managers/handlers/SettingsAndConfigMessageHandler");
(0, vitest_1.describe)('SettingsAndConfigMessageHandler', () => {
    let handler;
    let mockLogger;
    let mockCoordinator;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
        };
        mockCoordinator = {
            applyFontSettings: vitest_1.vi.fn(),
            applySettings: vitest_1.vi.fn(),
            openSettings: vitest_1.vi.fn(),
            setVersionInfo: vitest_1.vi.fn(),
            updateState: vitest_1.vi.fn(),
            emitTerminalInteractionEvent: vitest_1.vi.fn(),
            updateAllTerminalThemes: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn().mockReturnValue({ ui: { updateTheme: vitest_1.vi.fn() } }),
        };
        handler = new SettingsAndConfigMessageHandler_1.SettingsAndConfigMessageHandler(mockLogger);
    });
    (0, vitest_1.it)('should return supported commands', () => {
        const commands = handler.getSupportedCommands();
        (0, vitest_1.expect)(commands).toContain('fontSettingsUpdate');
        (0, vitest_1.expect)(commands).toContain('settingsResponse');
        (0, vitest_1.expect)(commands).toContain('openSettings');
        (0, vitest_1.expect)(commands).toContain('themeChanged');
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should handle fontSettingsUpdate', () => {
            const fontSettings = { fontFamily: 'Arial' };
            handler.handleMessage({ command: 'fontSettingsUpdate', fontSettings }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.applyFontSettings).toHaveBeenCalledWith(fontSettings);
            (0, vitest_1.expect)(mockCoordinator.emitTerminalInteractionEvent).toHaveBeenCalledWith('font-settings-update', '', fontSettings);
        });
        (0, vitest_1.it)('should handle settingsResponse', () => {
            const settings = { theme: 'dark' };
            handler.handleMessage({ command: 'settingsResponse', settings }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.applySettings).toHaveBeenCalledWith(settings);
            (0, vitest_1.expect)(mockCoordinator.emitTerminalInteractionEvent).toHaveBeenCalledWith('settings-update', '', settings);
        });
        (0, vitest_1.it)('should handle openSettings', () => {
            handler.handleMessage({ command: 'openSettings' }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.openSettings).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle versionInfo', () => {
            handler.handleMessage({ command: 'versionInfo', version: '1.0.0' }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.setVersionInfo).toHaveBeenCalledWith('1.0.0');
        });
        (0, vitest_1.it)('should handle stateUpdate', () => {
            const state = { some: 'state' };
            handler.handleMessage({ command: 'stateUpdate', state }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.updateState).toHaveBeenCalledWith(state);
        });
        (0, vitest_1.it)('should handle themeChanged', () => {
            // Mock getComputedStyle for theme colors
            const originalGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = vitest_1.vi.fn().mockReturnValue({
                getPropertyValue: vitest_1.vi.fn().mockReturnValue('#ffffff'),
            });
            handler.handleMessage({ command: 'themeChanged', theme: 'dark' }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.updateAllTerminalThemes).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoordinator.getManagers().ui.updateTheme).toHaveBeenCalled();
            window.getComputedStyle = originalGetComputedStyle;
        });
    });
});
//# sourceMappingURL=SettingsAndConfigMessageHandler.test.js.map