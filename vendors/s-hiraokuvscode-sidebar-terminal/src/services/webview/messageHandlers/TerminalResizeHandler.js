"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalResizeHandler = void 0;
const BaseMessageHandler_1 = require("../../../messaging/handlers/BaseMessageHandler");
const logger_1 = require("../../../utils/logger");
const constants_1 = require("../../../constants");
/**
 * Handles terminal resize messages from WebView
 */
class TerminalResizeHandler extends BaseMessageHandler_1.BaseMessageHandler {
    constructor() {
        super(...arguments);
        this.supportedCommands = [
            constants_1.TERMINAL_CONSTANTS?.COMMANDS?.RESIZE || 'resize',
        ];
    }
    async handle(message, context) {
        this.logMessageHandling(message, 'TerminalResize');
        try {
            if (!this.hasResizeParams(message)) {
                (0, logger_1.provider)('⚠️ [TerminalResize] Invalid resize parameters');
                return;
            }
            (0, logger_1.provider)(`📏 [TerminalResize] Resizing terminal: ${message.cols}x${message.rows} (terminal: ${message.terminalId || 'active'})`);
            // Resize terminal through terminal manager
            context.terminalManager.resize(message.cols, message.rows, message.terminalId);
            // Log successful resize
            (0, logger_1.provider)(`✅ [TerminalResize] Successfully resized terminal to ${message.cols}x${message.rows}`);
        }
        catch (error) {
            await this.handleErrorAsync(error, message, 'TerminalResize');
        }
    }
}
exports.TerminalResizeHandler = TerminalResizeHandler;
//# sourceMappingURL=TerminalResizeHandler.js.map