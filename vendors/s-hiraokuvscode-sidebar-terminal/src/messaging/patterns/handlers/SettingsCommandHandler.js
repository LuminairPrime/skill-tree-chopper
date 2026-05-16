"use strict";
/**
 * Settings Command Handler
 *
 * Handles settings and configuration commands.
 * Consolidates logic from:
 * - ConsolidatedMessageManager (settings cases)
 * - SettingsAndConfigMessageHandler
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsCommandHandler = void 0;
const IMessageHandler_1 = require("../core/IMessageHandler");
/**
 * Handler for settings-related commands
 */
class SettingsCommandHandler extends IMessageHandler_1.BaseCommandHandler {
    constructor() {
        super('SettingsCommandHandler', ['fontSettingsUpdate', 'settingsResponse', 'openSettings', 'versionInfo', 'stateUpdate'], 50 // Normal priority for settings operations
        );
    }
    async handle(message, context) {
        const { command } = message;
        const coordinator = context.coordinator;
        if (!coordinator) {
            throw new Error('Coordinator not available for settings operations');
        }
        this.log(context, 'info', `Processing settings command: ${command}`);
        switch (command) {
            case 'fontSettingsUpdate':
                await this.handleFontSettingsUpdate(message, coordinator, context);
                break;
            case 'settingsResponse':
                await this.handleSettingsResponse(message, coordinator, context);
                break;
            case 'openSettings':
                await this.handleOpenSettings(coordinator, context);
                break;
            case 'versionInfo':
                await this.handleVersionInfo(message, context);
                break;
            case 'stateUpdate':
                await this.handleStateUpdate(message, coordinator, context);
                break;
            default:
                this.log(context, 'warn', `Unknown settings command: ${command}`);
        }
    }
    /**
     * Handle font settings update
     *
     * 🔧 FIX: Extension sends fontSettings as an object, not individual properties
     * Message format: { command: 'fontSettingsUpdate', fontSettings: { fontSize, fontFamily, ... } }
     */
    async handleFontSettingsUpdate(message, coordinator, context) {
        // 🔧 FIX: Extract fontSettings object from message
        const fontSettings = message.fontSettings || {};
        const { fontSize, fontFamily, fontWeight, fontWeightBold, lineHeight, letterSpacing } = fontSettings;
        this.log(context, 'info', 'Updating font settings', {
            fontSize,
            fontFamily,
            fontWeight,
            lineHeight,
            letterSpacing,
        });
        // 🔧 FIX: Also update ConfigManager's font settings cache
        const managers = coordinator.getManagers?.();
        const configManager = managers?.config;
        if (configManager) {
            // Update ConfigManager's internal cache so getCurrentFontSettings() returns correct values
            configManager.applyFontSettings?.(fontSettings, coordinator.getAllTerminals?.() || new Map());
        }
        // Apply font settings to all terminals
        const terminals = coordinator.getAllTerminals?.() || [];
        for (const terminal of terminals) {
            if (terminal.terminal) {
                const options = {};
                if (fontSize !== undefined) {
                    options.fontSize = fontSize;
                }
                if (fontFamily !== undefined) {
                    options.fontFamily = fontFamily;
                }
                if (fontWeight !== undefined) {
                    options.fontWeight = fontWeight;
                }
                if (fontWeightBold !== undefined) {
                    options.fontWeightBold = fontWeightBold;
                }
                if (lineHeight !== undefined) {
                    options.lineHeight = lineHeight;
                }
                if (letterSpacing !== undefined) {
                    options.letterSpacing = letterSpacing;
                }
                terminal.terminal.options = {
                    ...terminal.terminal.options,
                    ...options,
                };
                this.log(context, 'debug', `Applied font settings to terminal: ${terminal.id}`, {
                    fontFamily: options.fontFamily,
                    fontSize: options.fontSize,
                });
            }
        }
    }
    /**
     * Handle settings response from extension
     */
    async handleSettingsResponse(message, coordinator, context) {
        const { settings } = message;
        this.log(context, 'debug', 'Received settings response', settings);
        // Apply settings to webview state
        if (typeof coordinator.applySettings === 'function') {
            coordinator.applySettings(settings);
        }
    }
    /**
     * Handle open settings command
     */
    async handleOpenSettings(coordinator, context) {
        this.log(context, 'info', 'Opening settings');
        // Request to open VS Code settings
        if (context.postMessage) {
            await context.postMessage({
                command: 'openSettings',
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle version info update
     */
    async handleVersionInfo(message, context) {
        const { version, buildDate } = message;
        this.log(context, 'debug', 'Version info received', {
            version,
            buildDate,
        });
        // Update UI with version information
        // This could be stored in coordinator state
    }
    /**
     * Handle state update
     */
    async handleStateUpdate(message, coordinator, context) {
        const { state } = message;
        this.log(context, 'debug', 'State update received', state);
        // Update webview state
        if (typeof coordinator.updateState === 'function') {
            coordinator.updateState(state);
        }
    }
}
exports.SettingsCommandHandler = SettingsCommandHandler;
//# sourceMappingURL=SettingsCommandHandler.js.map