"use strict";
/**
 * Session Handler
 *
 * Handles session management messages including restoration,
 * scrollback management, and session persistence.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionHandler = void 0;
const UnifiedMessageDispatcher_1 = require("../UnifiedMessageDispatcher");
const BaseMessageHandler_1 = require("./BaseMessageHandler");
// Import session notification utilities
const NotificationUtils_1 = require("../../webview/utils/NotificationUtils");
class SessionHandler extends BaseMessageHandler_1.BaseMessageHandler {
    constructor() {
        super([
            'sessionRestore',
            'sessionRestoreStarted',
            'sessionRestoreProgress',
            'sessionRestoreCompleted',
            'sessionRestoreError',
            'sessionSaved',
            'sessionSaveError',
            'sessionCleared',
            'sessionRestoreSkipped',
            'getScrollback',
            'restoreScrollback',
            'scrollbackProgress',
            'terminalRestoreError',
        ], UnifiedMessageDispatcher_1.MessagePriority.HIGH);
    }
    async handle(message, context) {
        this.logActivity(context, `Processing session message: ${message.command}`);
        try {
            switch (message.command) {
                case 'sessionRestore':
                    await this.handleSessionRestore(message, context);
                    break;
                case 'sessionRestoreStarted':
                    await this.handleSessionRestoreStarted(message, context);
                    break;
                case 'sessionRestoreProgress':
                    await this.handleSessionRestoreProgress(message, context);
                    break;
                case 'sessionRestoreCompleted':
                    await this.handleSessionRestoreCompleted(message, context);
                    break;
                case 'sessionRestoreError':
                    await this.handleSessionRestoreError(message, context);
                    break;
                case 'sessionSaved':
                    await this.handleSessionSaved(message, context);
                    break;
                case 'sessionSaveError':
                    await this.handleSessionSaveError(message, context);
                    break;
                case 'sessionCleared':
                    await this.handleSessionCleared(message, context);
                    break;
                case 'sessionRestoreSkipped':
                    await this.handleSessionRestoreSkipped(message, context);
                    break;
                case 'getScrollback':
                    await this.handleGetScrollback(message, context);
                    break;
                case 'restoreScrollback':
                    await this.handleRestoreScrollback(message, context);
                    break;
                case 'scrollbackProgress':
                    await this.handleScrollbackProgress(message, context);
                    break;
                case 'terminalRestoreError':
                    await this.handleTerminalRestoreError(message, context);
                    break;
                default:
                    context.logger.warn(`Unhandled session command: ${message.command}`);
            }
        }
        catch (error) {
            this.handleError(context, message.command, error);
        }
    }
    /**
     * Handle session restore message from extension
     */
    async handleSessionRestore(message, context) {
        context.logger.info('Session restore message received');
        const terminalId = message.terminalId;
        const terminalName = message.terminalName;
        const config = message.config;
        const sessionRestoreMessage = message.sessionRestoreMessage;
        const sessionScrollback = message.sessionScrollback;
        if (terminalId && terminalName && config) {
            context.logger.info(`Restoring terminal session: ${terminalId} (${terminalName})`);
            try {
                // Create terminal normally, then restore scrollback
                await context.coordinator.createTerminal(terminalId, terminalName, config);
                context.logger.info(`Created terminal for session restore: ${terminalId}`);
                // Restore scrollback data after a brief delay
                if (sessionRestoreMessage || (sessionScrollback && sessionScrollback.length > 0)) {
                    setTimeout(() => {
                        if ('restoreTerminalScrollback' in context.coordinator &&
                            typeof context.coordinator.restoreTerminalScrollback === 'function') {
                            context.coordinator.restoreTerminalScrollback(terminalId, sessionRestoreMessage || '', sessionScrollback || []);
                            context.logger.info(`Restored scrollback for terminal: ${terminalId}`);
                        }
                        else {
                            context.logger.warn('restoreTerminalScrollback method not found');
                        }
                    }, 100);
                }
            }
            catch (error) {
                context.logger.error(`Failed to restore terminal session ${terminalId}: ${String(error)}`);
                // Continue with regular terminal creation as fallback
                await context.coordinator.createTerminal(terminalId, terminalName, config);
            }
        }
        else {
            context.logger.error('Invalid session restore data received');
        }
    }
    /**
     * Session restore notification handlers
     */
    async handleSessionRestoreStarted(message, context) {
        const terminalCount = message.terminalCount || 0;
        context.logger.info(`Session restore started for ${terminalCount} terminals`);
        (0, NotificationUtils_1.showSessionRestoreStarted)(terminalCount);
    }
    async handleSessionRestoreProgress(message, context) {
        const restored = message.restored || 0;
        const total = message.total || 0;
        context.logger.info(`Session restore progress: ${restored}/${total}`);
        (0, NotificationUtils_1.showSessionRestoreProgress)(restored, total);
    }
    async handleSessionRestoreCompleted(message, context) {
        const restoredCount = message.restoredCount || 0;
        const skippedCount = message.skippedCount || 0;
        context.logger.info(`Session restore completed: ${restoredCount} restored, ${skippedCount} skipped`);
        (0, NotificationUtils_1.showSessionRestoreCompleted)(restoredCount, skippedCount);
    }
    async handleSessionRestoreError(message, context) {
        const error = message.error || 'Unknown error';
        const partialSuccess = message.partialSuccess || false;
        const errorType = message.errorType || undefined;
        context.logger.error(`Session restore error: ${error} (partial: ${partialSuccess}, type: ${errorType})`);
        (0, NotificationUtils_1.showSessionRestoreError)(error, partialSuccess, errorType);
    }
    async handleSessionSaved(message, context) {
        const terminalCount = message.terminalCount || 0;
        context.logger.info(`Session saved with ${terminalCount} terminals`);
        (0, NotificationUtils_1.showSessionSaved)(terminalCount);
    }
    async handleSessionSaveError(message, context) {
        const error = message.error || 'Unknown error';
        context.logger.error(`Session save error: ${error}`);
        (0, NotificationUtils_1.showSessionSaveError)(error);
    }
    async handleSessionCleared(_message, context) {
        context.logger.info('Session cleared');
        (0, NotificationUtils_1.showSessionCleared)();
    }
    async handleSessionRestoreSkipped(message, context) {
        const reason = message.reason || 'Unknown reason';
        context.logger.info(`Session restore skipped: ${reason}`);
        (0, NotificationUtils_1.showSessionRestoreSkipped)(reason);
    }
    async handleTerminalRestoreError(message, context) {
        const terminalName = message.terminalName || 'Unknown terminal';
        const error = message.error || 'Unknown error';
        context.logger.warn(`Terminal restore error: ${terminalName} - ${error}`);
        // Use try-catch to handle potential circular dependency
        try {
            const notificationUtils = require('../../webview/utils/NotificationUtils');
            if (notificationUtils.showTerminalRestoreError) {
                notificationUtils.showTerminalRestoreError(terminalName, error);
            }
        }
        catch (importError) {
            context.logger.error('Failed to show terminal restore error notification:', importError);
        }
    }
    /**
     * Handle scrollback extraction request
     */
    async handleGetScrollback(message, context) {
        context.logger.info('Handling get scrollback message');
        const terminalId = message.terminalId;
        const maxLines = message.maxLines || 1000;
        if (!terminalId) {
            context.logger.error('No terminal ID provided for scrollback extraction');
            return;
        }
        // Get terminal instance instead of element
        const terminalInstance = context.coordinator.getTerminalInstance(terminalId);
        if (!terminalInstance) {
            context.logger.error(`Terminal instance not found for ID: ${terminalId}`);
            return;
        }
        try {
            // Extract scrollback from xterm.js
            const scrollbackContent = this.extractScrollbackFromXterm(terminalInstance.terminal, maxLines);
            // Send scrollback data back to extension
            await context.postMessage({
                command: 'scrollbackExtracted',
                terminalId,
                scrollbackContent,
                timestamp: Date.now(),
            });
            context.logger.info(`Scrollback extracted for terminal ${terminalId}: ${scrollbackContent.length} lines`);
        }
        catch (error) {
            context.logger.error(`Error extracting scrollback: ${error instanceof Error ? error.message : String(error)}`);
            await context.postMessage({
                command: 'error',
                error: `Failed to extract scrollback: ${error instanceof Error ? error.message : String(error)}`,
                terminalId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle scrollback restoration request
     */
    async handleRestoreScrollback(message, context) {
        context.logger.info('Handling restore scrollback message');
        const terminalId = message.terminalId;
        const scrollbackContent = message.scrollbackContent;
        if (!terminalId || !scrollbackContent) {
            context.logger.error('Invalid scrollback restore request');
            return;
        }
        try {
            // Get terminal instance
            const terminalInstance = context.coordinator.getTerminalInstance(terminalId);
            if (!terminalInstance) {
                throw new Error(`Terminal instance not found for ID: ${terminalId}`);
            }
            // Restore scrollback to the terminal
            this.restoreScrollbackToXterm(terminalInstance.terminal, scrollbackContent);
            // Send confirmation back to extension
            await context.postMessage({
                command: 'scrollbackRestored',
                terminalId,
                restoredLines: scrollbackContent.length,
                timestamp: Date.now(),
            });
            context.logger.info(`Scrollback restored for terminal ${terminalId}: ${scrollbackContent.length} lines`);
        }
        catch (error) {
            context.logger.error(`Error restoring scrollback: ${error instanceof Error ? error.message : String(error)}`);
            await context.postMessage({
                command: 'error',
                error: `Failed to restore scrollback: ${error instanceof Error ? error.message : String(error)}`,
                terminalId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle scrollback progress updates
     */
    async handleScrollbackProgress(message, context) {
        context.logger.info('Handling scrollback progress message');
        const progressInfo = message.scrollbackProgress;
        if (!progressInfo) {
            context.logger.error('No progress information provided');
            return;
        }
        // Show progress notification
        context.logger.info(`Scrollback progress: ${progressInfo.progress}% (${progressInfo.currentLines}/${progressInfo.totalLines})`);
    }
    /**
     * Extract scrollback content from xterm terminal (improved version)
     */
    extractScrollbackFromXterm(terminal, maxLines) {
        this.logActivity(undefined, `Extracting scrollback from xterm terminal (max ${maxLines} lines)`);
        if (!terminal) {
            throw new Error('Terminal instance not provided');
        }
        const scrollbackLines = [];
        try {
            // Get active buffer from xterm.js
            const buffer = terminal.buffer.active;
            const bufferLength = buffer.length;
            const viewportY = buffer.viewportY;
            const baseY = buffer.baseY;
            this.logActivity(undefined, `Buffer info: length=${bufferLength}, viewportY=${viewportY}, baseY=${baseY}`);
            // Calculate range to extract (include scrollback + viewport)
            const startLine = Math.max(0, bufferLength - maxLines);
            const endLine = bufferLength;
            this.logActivity(undefined, `Extracting lines ${startLine} to ${endLine} (${endLine - startLine} lines)`);
            for (let i = startLine; i < endLine; i++) {
                try {
                    const line = buffer.getLine(i);
                    if (line) {
                        const content = line.translateToString(true); // trim whitespace
                        // Include non-empty lines and preserve some empty lines for structure
                        if (content.trim() || scrollbackLines.length > 0) {
                            scrollbackLines.push({
                                content: content,
                                type: 'output',
                                timestamp: Date.now(),
                            });
                        }
                    }
                }
                catch (lineError) {
                    this.logActivity(undefined, `Error extracting line ${i}: ${String(lineError)}`);
                    continue;
                }
            }
            // Remove trailing empty lines
            while (scrollbackLines.length > 0) {
                const lastLine = scrollbackLines[scrollbackLines.length - 1];
                if (!lastLine || !lastLine.content.trim()) {
                    scrollbackLines.pop();
                }
                else {
                    break;
                }
            }
            this.logActivity(undefined, `Successfully extracted ${scrollbackLines.length} lines from terminal buffer`);
        }
        catch (error) {
            this.logActivity(undefined, `Error accessing terminal buffer: ${String(error)}`);
            throw error;
        }
        return scrollbackLines;
    }
    /**
     * Restore scrollback content to xterm terminal
     */
    restoreScrollbackToXterm(terminal, scrollbackContent) {
        this.logActivity(undefined, `Restoring ${scrollbackContent.length} lines to terminal`);
        if (!terminal) {
            throw new Error('Terminal instance not provided');
        }
        // Write each line to the terminal
        for (const line of scrollbackContent) {
            terminal.writeln(line.content);
        }
        this.logActivity(undefined, `Restored ${scrollbackContent.length} lines to terminal`);
    }
}
exports.SessionHandler = SessionHandler;
//# sourceMappingURL=SessionHandler.js.map