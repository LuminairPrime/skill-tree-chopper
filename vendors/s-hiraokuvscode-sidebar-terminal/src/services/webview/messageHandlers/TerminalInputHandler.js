"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalInputHandler = void 0;
const BaseMessageHandler_1 = require("../../../messaging/handlers/BaseMessageHandler");
const logger_1 = require("../../../utils/logger");
const constants_1 = require("../../../constants");
/**
 * Handles terminal input messages from WebView
 */
class TerminalInputHandler extends BaseMessageHandler_1.BaseMessageHandler {
    constructor() {
        super(...arguments);
        this.supportedCommands = [constants_1.TERMINAL_CONSTANTS?.COMMANDS?.INPUT || 'input'];
    }
    async handle(message, context) {
        this.logMessageHandling(message, 'TerminalInput');
        try {
            if (!this.hasInputData(message)) {
                (0, logger_1.provider)('⚠️ [TerminalInput] Invalid input data');
                return;
            }
            (0, logger_1.provider)(`⌨️ [TerminalInput] Sending input: ${message.data.length} chars to terminal: ${message.terminalId || 'active'}`);
            // Send input to terminal manager
            context.terminalManager.sendInput(message.data, message.terminalId);
            // Log successful input handling
            (0, logger_1.provider)(`✅ [TerminalInput] Successfully sent input to terminal`);
        }
        catch (error) {
            await this.handleErrorAsync(error, message, 'TerminalInput');
        }
    }
}
exports.TerminalInputHandler = TerminalInputHandler;
//# sourceMappingURL=TerminalInputHandler.js.map