"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * SettingsMessageHandler Tests
 */
const vitest_1 = require("vitest");
// Mock vscode (required by logger and type-guards)
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        }),
    },
}));
const SettingsMessageHandler_1 = require("../../../../../providers/handlers/SettingsMessageHandler");
function createMockSettingsService() {
    return {
        getCurrentSettings: vitest_1.vi.fn().mockReturnValue({
            theme: 'dark',
            cursorBlink: true,
            activeBorderMode: 'multipleOnly',
        }),
        getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({
            fontSize: 14,
            fontFamily: 'monospace',
        }),
        updateSettings: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
}
function createMockDeps(settingsService) {
    const service = settingsService ?? createMockSettingsService();
    return {
        getSettingsService: vitest_1.vi.fn().mockReturnValue(service),
        sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
}
(0, vitest_1.describe)('SettingsMessageHandler', () => {
    let handler;
    let deps;
    let settingsService;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        settingsService = createMockSettingsService();
        deps = createMockDeps(settingsService);
        handler = new SettingsMessageHandler_1.SettingsMessageHandler(deps);
    });
    (0, vitest_1.describe)('handleGetSettings', () => {
        (0, vitest_1.it)('should send settingsResponse with current settings', async () => {
            await handler.handleGetSettings();
            (0, vitest_1.expect)(settingsService.getCurrentSettings).toHaveBeenCalled();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'settingsResponse',
                settings: vitest_1.expect.objectContaining({ theme: 'dark' }),
            }));
        });
        (0, vitest_1.it)('should send fontSettingsUpdate with current font settings', async () => {
            await handler.handleGetSettings();
            (0, vitest_1.expect)(settingsService.getCurrentFontSettings).toHaveBeenCalled();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'fontSettingsUpdate',
                fontSettings: vitest_1.expect.objectContaining({ fontSize: 14 }),
            }));
        });
        (0, vitest_1.it)('should send both settings and font settings messages', async () => {
            await handler.handleGetSettings();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledTimes(2);
        });
    });
    (0, vitest_1.describe)('handleUpdateSettings', () => {
        (0, vitest_1.it)('should delegate to settings service when message has settings', async () => {
            const message = {
                command: 'updateSettings',
                settings: { theme: 'light' },
            };
            await handler.handleUpdateSettings(message);
            (0, vitest_1.expect)(settingsService.updateSettings).toHaveBeenCalledWith({ theme: 'light' });
        });
        (0, vitest_1.it)('should return early when message has no settings', async () => {
            const message = {
                command: 'updateSettings',
            };
            await handler.handleUpdateSettings(message);
            (0, vitest_1.expect)(settingsService.updateSettings).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return early when settings is null', async () => {
            const message = {
                command: 'updateSettings',
                settings: null,
            };
            await handler.handleUpdateSettings(message);
            (0, vitest_1.expect)(settingsService.updateSettings).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('isSettingsChangeAffectingWebView', () => {
        function makeEvent(affectedConfig) {
            return {
                affectsConfiguration: (s) => s === affectedConfig,
            };
        }
        (0, vitest_1.it)('should return true for activeBorderMode changes', () => {
            const event = makeEvent('secondaryTerminal.activeBorderMode');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for theme changes', () => {
            const event = makeEvent('secondaryTerminal.theme');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for cursorBlink changes', () => {
            const event = makeEvent('secondaryTerminal.cursorBlink');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for editor.multiCursorModifier changes', () => {
            const event = makeEvent('editor.multiCursorModifier');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for altClickMovesCursor changes', () => {
            const event = makeEvent('terminal.integrated.altClickMovesCursor');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for dynamicSplitDirection changes', () => {
            const event = makeEvent('secondaryTerminal.dynamicSplitDirection');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(true);
        });
        (0, vitest_1.it)('should return false for unrelated configuration changes', () => {
            const event = makeEvent('some.unrelated.setting');
            (0, vitest_1.expect)(handler.isSettingsChangeAffectingWebView(event)).toBe(false);
        });
    });
    (0, vitest_1.describe)('isFontSettingsChange', () => {
        function makeEvent(affectedConfig) {
            return {
                affectsConfiguration: (s) => s === affectedConfig,
            };
        }
        (0, vitest_1.it)('should return true for secondaryTerminal.fontSize changes', () => {
            const event = makeEvent('secondaryTerminal.fontSize');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for secondaryTerminal.fontFamily changes', () => {
            const event = makeEvent('secondaryTerminal.fontFamily');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for terminal.integrated.fontSize changes', () => {
            const event = makeEvent('terminal.integrated.fontSize');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for editor.fontSize changes', () => {
            const event = makeEvent('editor.fontSize');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(true);
        });
        (0, vitest_1.it)('should return true for letterSpacing changes', () => {
            const event = makeEvent('secondaryTerminal.letterSpacing');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(true);
        });
        (0, vitest_1.it)('should return false for unrelated configuration changes', () => {
            const event = makeEvent('some.unrelated.setting');
            (0, vitest_1.expect)(handler.isFontSettingsChange(event)).toBe(false);
        });
    });
    (0, vitest_1.describe)('sendSettingsUpdateToWebView', () => {
        (0, vitest_1.it)('should send settingsResponse with current settings', async () => {
            await handler.sendSettingsUpdateToWebView();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'settingsResponse',
                settings: vitest_1.expect.objectContaining({ theme: 'dark' }),
            }));
        });
        (0, vitest_1.it)('should call getCurrentSettings from settings service', async () => {
            await handler.sendSettingsUpdateToWebView();
            (0, vitest_1.expect)(settingsService.getCurrentSettings).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('sendFontSettingsUpdateToWebView', () => {
        (0, vitest_1.it)('should send fontSettingsUpdate with current font settings', async () => {
            await handler.sendFontSettingsUpdateToWebView();
            (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'fontSettingsUpdate',
                fontSettings: vitest_1.expect.objectContaining({ fontSize: 14 }),
            }));
        });
        (0, vitest_1.it)('should call getCurrentFontSettings from settings service', async () => {
            await handler.sendFontSettingsUpdateToWebView();
            (0, vitest_1.expect)(settingsService.getCurrentFontSettings).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=SettingsMessageHandler.test.js.map