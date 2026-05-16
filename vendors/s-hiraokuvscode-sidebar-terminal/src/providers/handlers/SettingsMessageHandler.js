"use strict";
/**
 * SettingsMessageHandler
 *
 * Settings-related message handling extracted from SecondaryTerminalProvider.
 * Handles getSettings, updateSettings messages and configuration change detection.
 *
 * Delegates to SettingsSyncService for actual settings retrieval/update,
 * and handles WebView message sending for settings synchronization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsMessageHandler = void 0;
const type_guards_1 = require("../../types/type-guards");
const logger_1 = require("../../utils/logger");
class SettingsMessageHandler {
    constructor(deps) {
        this.deps = deps;
    }
    /**
     * Handle getSettings request from WebView.
     * Sends both general settings and font settings to the WebView.
     */
    async handleGetSettings() {
        const settingsService = this.deps.getSettingsService();
        const settings = settingsService.getCurrentSettings();
        const fontSettings = settingsService.getCurrentFontSettings();
        (0, logger_1.provider)(`📤 [SETTINGS] _handleGetSettings sending (theme: ${settings.theme})`);
        await this.deps.sendMessage({
            command: 'settingsResponse',
            settings,
        });
        await this.deps.sendMessage({
            command: 'fontSettingsUpdate',
            fontSettings,
        });
    }
    /**
     * Handle updateSettings request from WebView.
     * Validates the message and delegates to SettingsSyncService.
     */
    async handleUpdateSettings(message) {
        if (!(0, type_guards_1.hasSettings)(message)) {
            (0, logger_1.provider)('⚠️ [PROVIDER] Update settings message missing settings');
            return;
        }
        (0, logger_1.provider)('⚙️ [PROVIDER] Updating settings from WebView');
        const settingsService = this.deps.getSettingsService();
        await settingsService.updateSettings(message.settings);
    }
    /**
     * Check if a configuration change event affects WebView settings.
     */
    isSettingsChangeAffectingWebView(event) {
        return (event.affectsConfiguration('secondaryTerminal.activeBorderMode') ||
            event.affectsConfiguration('secondaryTerminal.theme') ||
            event.affectsConfiguration('secondaryTerminal.cursorBlink') ||
            event.affectsConfiguration('secondaryTerminal.enableCliAgentIntegration') ||
            event.affectsConfiguration('secondaryTerminal.enableTerminalHeaderEnhancements') ||
            event.affectsConfiguration('secondaryTerminal.dynamicSplitDirection') ||
            event.affectsConfiguration('secondaryTerminal.panelLocation') ||
            event.affectsConfiguration('editor.multiCursorModifier') ||
            event.affectsConfiguration('terminal.integrated.altClickMovesCursor') ||
            event.affectsConfiguration('secondaryTerminal.altClickMovesCursor'));
    }
    /**
     * Check if a configuration change event affects font settings.
     */
    isFontSettingsChange(event) {
        return (event.affectsConfiguration('secondaryTerminal.fontFamily') ||
            event.affectsConfiguration('secondaryTerminal.fontSize') ||
            event.affectsConfiguration('secondaryTerminal.fontWeight') ||
            event.affectsConfiguration('secondaryTerminal.fontWeightBold') ||
            event.affectsConfiguration('secondaryTerminal.lineHeight') ||
            event.affectsConfiguration('secondaryTerminal.letterSpacing') ||
            event.affectsConfiguration('terminal.integrated.fontSize') ||
            event.affectsConfiguration('terminal.integrated.fontFamily') ||
            event.affectsConfiguration('terminal.integrated.fontWeight') ||
            event.affectsConfiguration('terminal.integrated.fontWeightBold') ||
            event.affectsConfiguration('terminal.integrated.lineHeight') ||
            event.affectsConfiguration('terminal.integrated.letterSpacing') ||
            event.affectsConfiguration('editor.fontSize') ||
            event.affectsConfiguration('editor.fontFamily'));
    }
    /**
     * Send updated settings to WebView (triggered by configuration change).
     */
    async sendSettingsUpdateToWebView() {
        const settingsService = this.deps.getSettingsService();
        const settings = settingsService.getCurrentSettings();
        (0, logger_1.provider)(`📤 [PROVIDER] Sending settings update to WebView: activeBorderMode=${settings.activeBorderMode}`);
        await this.deps.sendMessage({
            command: 'settingsResponse',
            settings,
        });
    }
    /**
     * Send updated font settings to WebView (triggered by configuration change).
     */
    async sendFontSettingsUpdateToWebView() {
        const settingsService = this.deps.getSettingsService();
        const fontSettings = settingsService.getCurrentFontSettings();
        (0, logger_1.provider)('📤 [PROVIDER] Sending font settings update to WebView');
        await this.deps.sendMessage({
            command: 'fontSettingsUpdate',
            fontSettings,
        });
    }
}
exports.SettingsMessageHandler = SettingsMessageHandler;
//# sourceMappingURL=SettingsMessageHandler.js.map