"use strict";
/**
 * Terminal Settings Manager
 *
 * Centralized management of terminal settings with clear responsibilities:
 * - Maintain current settings state
 * - Apply settings to terminals
 * - Persist and load settings from WebView state
 *
 * This manager consolidates settings logic that was previously scattered
 * across multiple locations in LightweightTerminalWebviewManager.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalSettingsManager = void 0;
const logger_1 = require("../../utils/logger");
const FontSettingsService_1 = require("../services/FontSettingsService");
const ConfigManager_1 = require("./ConfigManager");
/**
 * Default settings for terminals
 */
const DEFAULT_SETTINGS = {
    theme: 'auto',
    cursorBlink: true,
    altClickMovesCursor: true,
    multiCursorModifier: 'alt',
    activeBorderMode: 'multipleOnly',
};
/**
 * Manages terminal settings with clear separation of concerns
 */
class TerminalSettingsManager {
    constructor(uiManager, configManager, callbacks) {
        this.uiManager = uiManager;
        this.configManager = configManager;
        this.callbacks = callbacks;
        this.currentSettings = { ...DEFAULT_SETTINGS };
        this.fontSettingsService = new FontSettingsService_1.FontSettingsService();
        this.fontSettingsService.setApplicator(uiManager);
        // Connect ConfigManager to FontSettingsService for single source of truth
        // Use type narrowing to access ConfigManager-specific method
        if (this.configManager instanceof ConfigManager_1.ConfigManager) {
            this.configManager.setFontSettingsService(this.fontSettingsService);
        }
        (0, logger_1.webview)('[SETTINGS] TerminalSettingsManager initialized');
    }
    /**
     * Get current settings
     */
    getCurrentSettings() {
        return { ...this.currentSettings };
    }
    /**
     * Get current font settings
     */
    getCurrentFontSettings() {
        return this.fontSettingsService.getCurrentSettings();
    }
    /**
     * Apply settings to all terminals
     */
    applySettings(settings) {
        try {
            const activeBorderMode = settings.activeBorderMode !== undefined
                ? settings.activeBorderMode
                : (this.currentSettings.activeBorderMode ?? 'multipleOnly');
            this.currentSettings = {
                ...this.currentSettings,
                ...settings,
                activeBorderMode,
            };
            this.uiManager.setActiveBorderMode(activeBorderMode);
            this.uiManager.setTerminalHeaderEnhancementsEnabled(this.currentSettings.enableTerminalHeaderEnhancements !== false);
            const activeId = this.callbacks.getActiveTerminalId();
            if (activeId) {
                const containers = this.callbacks.getAllTerminalContainers();
                if (containers.size > 0) {
                    this.uiManager.updateTerminalBorders(activeId, containers);
                }
                else {
                    this.uiManager.updateSplitTerminalBorders(activeId);
                }
            }
            // Apply to ConfigManager for terminal-level settings
            if (this.configManager) {
                const instances = this.callbacks.getAllTerminalInstances();
                this.configManager.applySettings(this.currentSettings, instances);
                this.currentSettings = this.configManager.getCurrentSettings();
                // Apply theme and visual settings to all terminals
                instances.forEach((terminalData, terminalId) => {
                    try {
                        this.uiManager.applyAllVisualSettings(terminalData.terminal, this.currentSettings);
                        (0, logger_1.webview)(`[SETTINGS] Applied visual settings to terminal ${terminalId}`);
                    }
                    catch (error) {
                        (0, logger_1.webview)(`[SETTINGS] Error applying visual settings to terminal ${terminalId}:`, error);
                    }
                });
            }
            (0, logger_1.webview)('[SETTINGS] Settings applied:', settings);
        }
        catch (error) {
            (0, logger_1.webview)('[SETTINGS] Error applying settings:', error);
        }
    }
    /**
     * Apply font settings to all terminals
     *
     * Delegates to FontSettingsService for single source of truth management.
     */
    applyFontSettings(fontSettings, terminals) {
        try {
            this.fontSettingsService.updateSettings(fontSettings, terminals);
            (0, logger_1.webview)('[SETTINGS] Font settings applied via FontSettingsService');
        }
        catch (error) {
            (0, logger_1.webview)('[SETTINGS] Error applying font settings:', error);
        }
    }
    /**
     * Load settings from saved state
     */
    loadFromState(savedState) {
        try {
            if (savedState?.settings) {
                this.applySettings(savedState.settings);
            }
            if (savedState?.fontSettings) {
                const terminals = this.callbacks.getAllTerminalInstances();
                this.applyFontSettings(savedState.fontSettings, terminals);
            }
            (0, logger_1.webview)('[SETTINGS] Settings loaded from WebView state');
        }
        catch (error) {
            (0, logger_1.webview)('[SETTINGS] Error loading settings:', error);
        }
    }
    /**
     * Get settings state for saving
     */
    getStateForSave() {
        return {
            settings: this.currentSettings,
            fontSettings: this.fontSettingsService.getCurrentSettings(),
            timestamp: Date.now(),
        };
    }
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.currentSettings = { ...DEFAULT_SETTINGS };
        this.applySettings(this.currentSettings);
        (0, logger_1.webview)('[SETTINGS] Settings reset to defaults');
    }
    /**
     * Update a single setting
     */
    updateSetting(key, value) {
        this.applySettings({ [key]: value });
    }
    /**
     * Get FontSettingsService for direct access
     */
    getFontSettingsService() {
        return this.fontSettingsService;
    }
    /**
     * Dispose resources
     */
    dispose() {
        (0, logger_1.webview)('[SETTINGS] TerminalSettingsManager disposed');
    }
}
exports.TerminalSettingsManager = TerminalSettingsManager;
//# sourceMappingURL=TerminalSettingsManager.js.map