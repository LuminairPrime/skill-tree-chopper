"use strict";
/**
 * Settings and Config Message Handler
 *
 * Handles settings, configuration, and state updates
 *
 * Uses registry-based dispatch pattern instead of switch-case
 * for better maintainability and extensibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsAndConfigMessageHandler = void 0;
const theme_types_1 = require("../../types/theme.types");
/**
 * Settings and Config Message Handler
 *
 * Responsibilities:
 * - Font settings updates
 * - General settings configuration
 * - Version information management
 * - State updates from extension
 */
class SettingsAndConfigMessageHandler {
    constructor(logger) {
        this.logger = logger;
        this.handlers = this.buildHandlerRegistry();
    }
    /**
     * Build handler registry - replaces switch-case pattern
     */
    buildHandlerRegistry() {
        const registry = new Map();
        registry.set('fontSettingsUpdate', (msg, coord) => this.handleFontSettingsUpdate(msg, coord));
        registry.set('settingsResponse', (msg, coord) => this.handleSettingsResponse(msg, coord));
        registry.set('openSettings', (_msg, coord) => coord.openSettings());
        registry.set('versionInfo', (msg, coord) => this.handleVersionInfo(msg, coord));
        registry.set('stateUpdate', (msg, coord) => this.handleStateUpdate(msg, coord));
        registry.set('themeChanged', (msg, coord) => this.handleThemeChanged(msg, coord));
        return registry;
    }
    /**
     * Handle settings and config related messages using registry dispatch
     */
    handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        const handler = this.handlers.get(command);
        if (handler) {
            handler(msg, coordinator);
        }
        else {
            this.logger.warn(`Unknown settings/config command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Handle font settings update from extension
     */
    handleFontSettingsUpdate(msg, coordinator) {
        const fontSettings = msg.fontSettings;
        if (fontSettings) {
            coordinator.applyFontSettings(fontSettings);
            this.emitTerminalInteractionEvent('font-settings-update', '', fontSettings, coordinator);
        }
    }
    /**
     * Handle settings response from extension
     */
    handleSettingsResponse(msg, coordinator) {
        const settings = msg.settings;
        if (settings) {
            this.logger.info('Settings response received');
            if (typeof coordinator.applySettings === 'function') {
                coordinator.applySettings(settings);
            }
            this.emitTerminalInteractionEvent('settings-update', '', settings, coordinator);
        }
    }
    /**
     * Handle version info message from Extension
     */
    handleVersionInfo(msg, coordinator) {
        const version = msg.version;
        if (version &&
            typeof version === 'string' &&
            typeof coordinator.setVersionInfo === 'function') {
            coordinator.setVersionInfo(version);
            this.logger.info(`Version info received: ${version}`);
        }
    }
    /**
     * Handle state update message
     */
    handleStateUpdate(msg, coordinator) {
        const state = msg.state;
        if (state) {
            this.logger.info('State update received');
            if ('updateState' in coordinator && typeof coordinator.updateState === 'function') {
                coordinator.updateState(state);
            }
            else {
                this.logger.warn('updateState method not found on coordinator');
            }
        }
    }
    /**
     * Handle theme change message from Extension
     * This is triggered when VS Code theme changes and settings.theme is 'auto'
     */
    handleThemeChanged(msg, coordinator) {
        const themeValue = msg.theme;
        if (!themeValue) {
            this.logger.warn('themeChanged message missing theme value');
            return;
        }
        this.logger.info(`Theme changed to: ${themeValue}`);
        // Get actual VS Code theme colors from CSS variables
        const vsCodeTheme = (0, theme_types_1.getVSCodeThemeColors)(themeValue);
        // Update all terminal themes with VS Code colors
        if ('updateAllTerminalThemes' in coordinator &&
            typeof coordinator.updateAllTerminalThemes === 'function') {
            coordinator.updateAllTerminalThemes(vsCodeTheme);
        }
        // Update UI components (header, borders, tabs)
        const managers = coordinator.getManagers();
        if (managers.ui &&
            'updateTheme' in managers.ui &&
            typeof managers.ui.updateTheme === 'function') {
            managers.ui.updateTheme(vsCodeTheme);
        }
        this.emitTerminalInteractionEvent('theme-change', '', { theme: themeValue }, coordinator);
    }
    /**
     * Emit terminal interaction event
     */
    emitTerminalInteractionEvent(eventType, terminalId, data, coordinator) {
        if ('emitTerminalInteractionEvent' in coordinator &&
            typeof coordinator.emitTerminalInteractionEvent === 'function') {
            coordinator.emitTerminalInteractionEvent(eventType, terminalId, data);
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.handlers.clear();
    }
}
exports.SettingsAndConfigMessageHandler = SettingsAndConfigMessageHandler;
//# sourceMappingURL=SettingsAndConfigMessageHandler.js.map