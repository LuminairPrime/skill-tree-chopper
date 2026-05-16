"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsSyncService = void 0;
const vscode = require("vscode");
const UnifiedConfigurationService_1 = require("../../config/UnifiedConfigurationService");
const feedback_1 = require("../../utils/feedback");
const logger_1 = require("../../utils/logger");
const SystemConstants_1 = require("../../constants/SystemConstants");
/**
 * SettingsSyncService
 *
 * Handles synchronization of terminal settings between VS Code configuration
 * and the WebView terminal. This service centralizes all settings-related operations
 * and provides a clean interface for settings management.
 *
 * Responsibilities:
 * - Retrieve current terminal settings
 * - Retrieve font settings
 * - Update settings in VS Code configuration
 * - Get Alt+Click and multi-cursor settings
 *
 * Part of Issue #214 refactoring to apply Facade pattern
 */
class SettingsSyncService {
    constructor(reinitializeTerminalCallback) {
        this._reinitializeTerminalCallback = reinitializeTerminalCallback;
        // Run migration check on construction
        this._migrateDeprecatedSettings();
    }
    /**
     * Migrate deprecated settings to new format
     * Handles: highlightActiveBorder (boolean) -> activeBorderMode (enum)
     */
    _migrateDeprecatedSettings() {
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const inspection = config.inspect('highlightActiveBorder');
        // Check if user explicitly set the old setting (not default)
        const userValue = inspection?.globalValue ?? inspection?.workspaceValue;
        if (userValue !== undefined) {
            // User had the old setting - migrate it
            const newMode = userValue === false ? 'none' : 'multipleOnly';
            // Only migrate if new setting hasn't been explicitly set
            const newInspection = config.inspect('activeBorderMode');
            const newUserValue = newInspection?.globalValue ?? newInspection?.workspaceValue;
            if (newUserValue === undefined) {
                (0, logger_1.provider)(`🔄 Migrating highlightActiveBorder=${userValue} to activeBorderMode=${newMode}`);
                config.update('activeBorderMode', newMode, vscode.ConfigurationTarget.Global).then(() => {
                    (0, logger_1.provider)(`✅ Settings migration complete`);
                }, (err) => {
                    (0, logger_1.provider)(`⚠️ Settings migration failed: ${err}`);
                });
            }
        }
    }
    /**
     * Get current terminal settings for WebView
     *
     * Returns settings that affect terminal behavior in the WebView,
     * including theme, cursor, CLI agent integration, and dynamic split direction
     */
    getCurrentSettings() {
        const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
        const settings = configService.getCompleteTerminalSettings();
        const altClickSettings = configService.getAltClickSettings();
        // Use unified service for all configuration access
        return {
            cursorBlink: settings.cursorBlink,
            theme: settings.theme || 'auto',
            // Scrollback buffer size (secondaryTerminal.scrollback setting)
            scrollback: configService.get('secondaryTerminal', 'scrollback', 2000),
            // VS Code standard settings for Alt+Click functionality
            altClickMovesCursor: altClickSettings.altClickMovesCursor,
            multiCursorModifier: altClickSettings.multiCursorModifier,
            // CLI Agent Code integration settings
            enableCliAgentIntegration: configService.isFeatureEnabled('cliAgentIntegration'),
            enableTerminalHeaderEnhancements: configService.isFeatureEnabled('terminalHeaderEnhancements'),
            activeBorderMode: configService.get('secondaryTerminal', 'activeBorderMode', 'multipleOnly'),
            // Dynamic split direction settings (Issue #148)
            dynamicSplitDirection: configService.isFeatureEnabled('dynamicSplitDirection'),
            panelLocation: configService.get('secondaryTerminal', 'panelLocation', 'auto'),
        };
    }
    /**
     * Get current font settings for WebView
     *
     * Returns font-related settings from VS Code's terminal configuration
     */
    getCurrentFontSettings() {
        const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
        return configService.getWebViewFontSettings();
    }
    /**
     * Get complete settings including shell and terminal configuration
     *
     * This method provides a more comprehensive settings object
     * including shell, font size, and other terminal-specific settings
     */
    getCompleteSettings() {
        const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
        const config = configService.getExtensionTerminalConfig();
        const webViewSettings = configService.getWebViewTerminalSettings();
        return {
            shell: config.shell || '',
            shellArgs: config.shellArgs || [],
            fontSize: config.fontSize || 14,
            fontFamily: config.fontFamily || 'monospace',
            theme: webViewSettings.theme || 'dark',
            cursor: config.cursor || {
                style: 'block',
                blink: true,
            },
            maxTerminals: config.maxTerminals || SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT,
            enableCliAgentIntegration: config.enableCliAgentIntegration || false,
            enableTerminalHeaderEnhancements: config.enableTerminalHeaderEnhancements ?? true,
            // 🆕 Issue #148: Dynamic split direction settings
            dynamicSplitDirection: webViewSettings.dynamicSplitDirection,
            panelLocation: webViewSettings.panelLocation || 'auto',
        };
    }
    /**
     * Get Alt+Click settings for restoration
     *
     * Retrieves settings that control Alt+Click behavior in the terminal
     * and multi-cursor modifier settings from the editor
     */
    getAltClickSettings() {
        const vsCodeAltClickSetting = vscode.workspace
            .getConfiguration('terminal.integrated')
            .get('altClickMovesCursor', false);
        const vsCodeMultiCursorModifier = vscode.workspace
            .getConfiguration('editor')
            .get('multiCursorModifier', 'alt');
        const extensionAltClickSetting = vscode.workspace
            .getConfiguration('secondaryTerminal')
            .get('altClickMovesCursor', vsCodeAltClickSetting);
        return {
            altClickMovesCursor: extensionAltClickSetting,
            multiCursorModifier: vsCodeMultiCursorModifier,
        };
    }
    /**
     * Update terminal settings
     *
     * Updates VS Code configuration with new settings and optionally
     * reinitializes the terminal to apply changes
     */
    async updateSettings(settings) {
        try {
            const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
            (0, logger_1.provider)('⚙️ [SETTINGS] Updating settings via UnifiedConfigurationService:', settings);
            // Update VS Code settings using unified configuration service
            if (settings.cursorBlink !== undefined) {
                await configService.update('secondaryTerminal', 'cursorBlink', settings.cursorBlink);
            }
            if (settings.theme) {
                await configService.update('secondaryTerminal', 'theme', settings.theme);
            }
            if (settings.enableCliAgentIntegration !== undefined) {
                await configService.update('secondaryTerminal', 'enableCliAgentIntegration', settings.enableCliAgentIntegration);
            }
            if (settings.enableTerminalHeaderEnhancements !== undefined) {
                await configService.update('secondaryTerminal', 'enableTerminalHeaderEnhancements', settings.enableTerminalHeaderEnhancements);
            }
            if (settings.activeBorderMode !== undefined) {
                await configService.update('secondaryTerminal', 'activeBorderMode', settings.activeBorderMode);
            }
            if (settings.dynamicSplitDirection !== undefined) {
                await configService.update('secondaryTerminal', 'dynamicSplitDirection', settings.dynamicSplitDirection);
            }
            if (settings.panelLocation !== undefined) {
                await configService.update('secondaryTerminal', 'panelLocation', settings.panelLocation);
            }
            // Note: Font settings are read directly from VS Code's terminal/editor settings
            (0, logger_1.provider)('✅ [SETTINGS] Settings updated successfully');
            (0, feedback_1.showSuccess)('Settings updated successfully');
            // Reinitialize terminal with new settings to apply changes
            if (this._reinitializeTerminalCallback) {
                await this._reinitializeTerminalCallback();
            }
        }
        catch (error) {
            (0, logger_1.provider)('❌ [SETTINGS] Failed to update settings:', error);
            (0, feedback_1.showError)(`Failed to update settings: ${String(error)}`);
        }
    }
    /**
     * Set the callback to reinitialize terminal after settings update
     */
    setReinitializeCallback(callback) {
        this._reinitializeTerminalCallback = callback;
    }
}
exports.SettingsSyncService = SettingsSyncService;
//# sourceMappingURL=SettingsSyncService.js.map