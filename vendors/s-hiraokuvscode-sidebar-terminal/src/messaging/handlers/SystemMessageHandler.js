"use strict";
/**
 * System Message Handler
 *
 * Handles critical system messages including initialization,
 * settings, and state updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageHandler = void 0;
const UnifiedMessageDispatcher_1 = require("../UnifiedMessageDispatcher");
const BaseMessageHandler_1 = require("./BaseMessageHandler");
class SystemMessageHandler extends BaseMessageHandler_1.BaseMessageHandler {
    constructor() {
        super(['init', 'fontSettingsUpdate', 'settingsResponse', 'stateUpdate'], UnifiedMessageDispatcher_1.MessagePriority.CRITICAL);
    }
    async handle(message, context) {
        this.logActivity(context, `Processing system message: ${message.command}`);
        try {
            switch (message.command) {
                case 'init':
                    await this.handleInitMessage(message, context);
                    break;
                case 'fontSettingsUpdate':
                    await this.handleFontSettingsUpdate(message, context);
                    break;
                case 'settingsResponse':
                    await this.handleSettingsResponse(message, context);
                    break;
                case 'stateUpdate':
                    await this.handleStateUpdate(message, context);
                    break;
                default:
                    context.logger.warn(`Unhandled system command: ${message.command}`);
            }
        }
        catch (error) {
            this.handleError(context, message.command, error);
        }
    }
    /**
     * Handle init message from extension
     */
    async handleInitMessage(_message, context) {
        context.logger.info('Handling init message');
        try {
            // Request current settings
            await context.postMessage({
                command: 'getSettings',
                timestamp: Date.now(),
            });
            // Emit ready event
            await this.emitTerminalInteractionEvent('webview-ready', '', undefined, context);
            // Send confirmation back to extension
            await context.postMessage({
                command: 'test',
                type: 'initComplete',
                data: 'WebView processed INIT message',
                timestamp: Date.now(),
            });
            context.logger.info('INIT processing completed');
        }
        catch (error) {
            context.logger.error('Error processing INIT message', error);
        }
    }
    /**
     * Handle font settings update from extension
     */
    async handleFontSettingsUpdate(message, context) {
        const fontSettings = message.fontSettings;
        if (fontSettings) {
            context.logger.info('Font settings update received', fontSettings);
            context.coordinator.applyFontSettings(fontSettings);
            await this.emitTerminalInteractionEvent('font-settings-update', '', fontSettings, context);
        }
    }
    /**
     * Handle settings response from extension
     */
    async handleSettingsResponse(message, context) {
        const settings = message.settings;
        if (settings) {
            context.logger.info('Settings response received');
            await this.emitTerminalInteractionEvent('settings-update', '', settings, context);
        }
    }
    /**
     * Handle state update message
     */
    async handleStateUpdate(message, context) {
        const state = message.state;
        if (state) {
            context.logger.info('State update received');
            if ('updateState' in context.coordinator &&
                typeof context.coordinator.updateState === 'function') {
                context.coordinator.updateState(state);
            }
            else {
                context.logger.warn('updateState method not found on coordinator');
            }
        }
        else {
            context.logger.warn('No state data in stateUpdate message');
        }
    }
    /**
     * Emit terminal interaction event
     */
    async emitTerminalInteractionEvent(type, terminalId, data, context) {
        try {
            await context.postMessage({
                command: 'terminalInteraction',
                type,
                terminalId,
                data,
                timestamp: Date.now(),
            });
            this.logActivity(context, `Terminal interaction event sent: ${type} for ${terminalId}`);
        }
        catch (error) {
            context.logger.error('Error emitting terminal interaction event', error);
        }
    }
}
exports.SystemMessageHandler = SystemMessageHandler;
//# sourceMappingURL=SystemMessageHandler.js.map