"use strict";
/**
 * SettingsCoordinator
 *
 * Settings management methods extracted from LightweightTerminalWebviewManager.
 * Handles settings load/save/apply, font settings, and settings panel operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsCoordinator = void 0;
const logger_1 = require("../../utils/logger");
class SettingsCoordinator {
    constructor(deps) {
        this.deps = deps;
    }
    /**
     * Apply settings to all terminals
     */
    applySettings(settings) {
        try {
            const currentSettings = this.deps.getCurrentSettings();
            const activeBorderMode = settings.activeBorderMode !== undefined
                ? settings.activeBorderMode
                : (currentSettings.activeBorderMode ?? 'multipleOnly');
            const newSettings = {
                ...currentSettings,
                ...settings,
                activeBorderMode,
            };
            this.deps.setCurrentSettings(newSettings);
            // Update ConfigManager with new settings
            if (this.deps.hasConfigManager()) {
                const instances = this.deps.getAllTerminalInstances();
                this.deps.configManagerApplySettings(newSettings, instances);
                (0, logger_1.webview)(`⚙️ [SETTINGS] ConfigManager updated with theme: ${newSettings.theme}`);
            }
            this.deps.setActiveBorderMode(activeBorderMode);
            this.deps.setTerminalHeaderEnhancementsEnabled(newSettings.enableTerminalHeaderEnhancements !== false);
            const activeId = this.deps.getActiveTerminalId();
            if (activeId) {
                const containers = this.deps.getAllTerminalContainers();
                if (containers.size > 0) {
                    this.deps.updateTerminalBorders(activeId, containers);
                }
                else {
                    this.deps.updateSplitTerminalBorders(activeId);
                }
            }
            // Apply theme and visual settings to all terminals
            const instances = this.deps.getAllTerminalInstances();
            instances.forEach((terminalData, terminalId) => {
                try {
                    this.deps.applyAllVisualSettings(terminalData.terminal, newSettings);
                    (0, logger_1.webview)(`⚙️ [SETTINGS] Applied visual settings to terminal ${terminalId}`);
                }
                catch (error) {
                    (0, logger_1.webview)(`❌ [SETTINGS] Error applying visual settings to terminal ${terminalId}:`, error);
                }
            });
            (0, logger_1.webview)('⚙️ Settings applied:', settings);
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error applying settings:', error);
        }
    }
    /**
     * Load settings from WebView state
     */
    loadSettings() {
        try {
            const savedState = this.deps.loadState();
            if (savedState?.settings) {
                this.applySettings(savedState.settings);
            }
            if (savedState?.fontSettings) {
                this.applyFontSettings(savedState.fontSettings);
            }
            (0, logger_1.webview)('📂 Settings loaded from WebView state');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error loading settings:', error);
        }
    }
    /**
     * Save settings to WebView state
     */
    saveSettings() {
        try {
            const state = {
                settings: this.deps.getCurrentSettings(),
                fontSettings: this.deps.fontSettingsGetCurrentSettings(),
                timestamp: Date.now(),
            };
            this.deps.saveState(state);
            (0, logger_1.webview)('💾 Settings saved to WebView state');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error saving settings:', error);
        }
    }
    /**
     * Apply font settings to all terminals
     */
    applyFontSettings(fontSettings) {
        try {
            const terminals = this.deps.getSplitTerminals();
            this.deps.fontSettingsUpdateSettings(fontSettings, terminals);
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error applying font settings:', error);
        }
    }
    /**
     * Get current font settings
     */
    getCurrentFontSettings() {
        return this.deps.fontSettingsGetCurrentSettings();
    }
    /**
     * Open the settings panel
     */
    openSettings() {
        try {
            if (!this.deps.hasSettingsPanel()) {
                (0, logger_1.webview)('⚙️ Settings panel not initialized');
                return;
            }
            const currentSettings = this.deps.getCurrentSettings();
            const baseSettings = this.deps.hasConfigManager()
                ? this.deps.configManagerGetCurrentSettings()
                : currentSettings;
            const panelSettings = { ...baseSettings, ...currentSettings };
            this.deps.settingsPanelSetVersionInfo(this.deps.getVersionInfo());
            this.deps.settingsPanelShow(panelSettings);
            (0, logger_1.webview)('⚙️ Opening settings panel');
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error opening settings panel:', error);
        }
    }
    /**
     * Update theme for all terminal instances
     * Called when VS Code theme changes and settings.theme is 'auto'
     */
    updateAllTerminalThemes(theme) {
        try {
            (0, logger_1.webview)(`🎨 [THEME] Updating all terminal themes`);
            const terminals = this.deps.getSplitTerminals();
            let updatedCount = 0;
            for (const [id, instance] of terminals) {
                if (instance.terminal) {
                    // Update xterm.js theme options
                    instance.terminal.options.theme = theme;
                    // Update container background color
                    if (instance.container) {
                        instance.container.style.backgroundColor = theme.background;
                    }
                    // Update xterm.js internal elements for immediate visual update
                    const terminalElement = instance.container?.querySelector('.xterm');
                    if (terminalElement) {
                        terminalElement.style.backgroundColor = theme.background;
                        // Update viewport background
                        const viewport = terminalElement.querySelector('.xterm-viewport');
                        if (viewport) {
                            viewport.style.backgroundColor = theme.background;
                        }
                        // Update screen background
                        const screen = terminalElement.querySelector('.xterm-screen');
                        if (screen) {
                            screen.style.backgroundColor = theme.background;
                        }
                    }
                    updatedCount++;
                    (0, logger_1.webview)(`🎨 [THEME] Updated theme for terminal: ${id}`);
                }
            }
            // Also update terminal-body and terminals-wrapper backgrounds
            const terminalBody = document.getElementById('terminal-body');
            if (terminalBody) {
                terminalBody.style.backgroundColor = theme.background;
            }
            const terminalsWrapper = document.getElementById('terminals-wrapper');
            if (terminalsWrapper) {
                terminalsWrapper.style.backgroundColor = theme.background;
            }
            (0, logger_1.webview)(`🎨 [THEME] Theme updated for ${updatedCount} terminals`);
        }
        catch (error) {
            (0, logger_1.webview)('❌ Error updating terminal themes:', error);
        }
    }
}
exports.SettingsCoordinator = SettingsCoordinator;
//# sourceMappingURL=SettingsCoordinator.js.map