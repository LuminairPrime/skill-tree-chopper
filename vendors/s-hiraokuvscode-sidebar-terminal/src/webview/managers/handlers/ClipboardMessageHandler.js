"use strict";
/**
 * Clipboard Message Handler
 * Handles clipboard-related messages from the extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardMessageHandler = void 0;
class ClipboardMessageHandler {
    constructor(logger) {
        this.logger = logger;
    }
    debug(message, data) {
        this.logger.debug(message, data);
    }
    /**
     * Handle clipboard-related messages
     */
    handleMessage(msg, coordinator) {
        switch (msg.command) {
            case 'clipboardContent':
                this.handleClipboardContent(msg, coordinator);
                break;
            default:
                this.logger.warn(`Unknown clipboard command: ${msg.command}`);
        }
    }
    /**
     * Handle clipboard content paste operation
     */
    handleClipboardContent(msg, coordinator) {
        const terminalId = msg.terminalId;
        const text = msg.text;
        this.debug('[CLIPBOARD] Received clipboardContent message', {
            terminalId,
            textLength: text?.length,
        });
        if (!terminalId || text === undefined) {
            this.debug('[CLIPBOARD] Invalid clipboardContent message - missing terminalId or text');
            return;
        }
        const terminalInstance = coordinator.getTerminalInstance(terminalId);
        if (!terminalInstance) {
            this.logger.warn(`📋 [CLIPBOARD] Terminal ${terminalId} not found for paste`);
            return;
        }
        this.logger.info(`📋 [CLIPBOARD] Pasting ${text.length} characters to terminal ${terminalId}`);
        terminalInstance.terminal.paste(text);
        this.debug('[CLIPBOARD] Paste completed', { terminalId, textLength: text.length });
    }
}
exports.ClipboardMessageHandler = ClipboardMessageHandler;
//# sourceMappingURL=ClipboardMessageHandler.js.map