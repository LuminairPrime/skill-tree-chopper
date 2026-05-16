"use strict";
/**
 * Serialization Message Handler
 *
 * Handles terminal state serialization and restoration
 *
 * Uses registry-based dispatch pattern instead of switch-case
 * for better maintainability and extensibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializationMessageHandler = void 0;
// ============================================================================
// Constants
// ============================================================================
/**
 * Configuration constants for serialization operations
 */
const SerializationConfig = {
    /** Default number of scrollback lines to serialize */
    DEFAULT_SCROLLBACK_LINES: 1000,
};
/**
 * Serialization Message Handler
 *
 * Responsibilities:
 * - Serialize terminal content and state
 * - Restore serialized terminal content
 * - Handle terminal restore information
 * - Save all terminal sessions
 */
class SerializationMessageHandler {
    constructor(logger) {
        this.logger = logger;
        this.cachedTerminalRestoreInfo = null;
        this.handlers = this.buildHandlerRegistry();
    }
    /**
     * Build handler registry - replaces switch-case pattern
     */
    buildHandlerRegistry() {
        const registry = new Map();
        registry.set('serializeTerminal', (msg, coord) => this.handleSerializeTerminal(msg, coord));
        registry.set('restoreSerializedContent', (msg, coord) => this.handleRestoreSerializedContent(msg, coord));
        registry.set('requestTerminalSerialization', (msg, coord) => this.handleRequestTerminalSerialization(msg, coord));
        registry.set('restoreTerminalSerialization', (msg, coord) => this.handleRestoreTerminalSerialization(msg, coord));
        registry.set('terminalRestoreInfo', (msg, coord) => this.handleTerminalRestoreInfo(msg, coord));
        registry.set('saveAllTerminalSessions', (msg, coord) => this.handleSaveAllTerminalSessions(msg, coord));
        return registry;
    }
    /**
     * Handle serialization related messages using registry dispatch
     */
    async handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        const handler = this.handlers.get(command);
        if (handler) {
            await handler(msg, coordinator);
        }
        else {
            this.logger.warn(`Unknown serialization command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Handle serialize terminal request (single terminal)
     */
    handleSerializeTerminal(msg, coordinator) {
        this.logger.info('Terminal serialization requested (single terminal)');
        const terminalIds = [];
        if (typeof msg.terminalId === 'string' && msg.terminalId.trim().length > 0) {
            terminalIds.push(msg.terminalId);
        }
        const additionalIds = msg.terminalIds;
        if (Array.isArray(additionalIds)) {
            additionalIds
                .filter((id) => typeof id === 'string' && id.trim().length > 0)
                .forEach((id) => terminalIds.push(id));
        }
        if (terminalIds.length === 0) {
            this.logger.warn('No terminalId provided for serialization request');
            coordinator.postMessageToExtension({
                command: 'terminalSerializationResponse',
                serializationData: {},
                error: 'missing-terminal-id',
                terminalId: msg.terminalId,
                requestId: msg.requestId,
                messageId: msg.messageId,
                timestamp: Date.now(),
            });
            return;
        }
        this.handleRequestTerminalSerialization({
            ...msg,
            terminalIds,
        }, coordinator);
    }
    /**
     * Handle restore serialized content request
     */
    handleRestoreSerializedContent(msg, coordinator) {
        this.logger.info('Restore serialized content requested');
        const terminalId = typeof msg.terminalId === 'string' ? msg.terminalId : undefined;
        const serializedContent = msg.serializedContent;
        const scrollbackData = Array.isArray(msg.scrollbackData)
            ? msg.scrollbackData.filter((line) => typeof line === 'string')
            : undefined;
        const sessionRestoreMessage = typeof msg.sessionRestoreMessage === 'string'
            ? msg.sessionRestoreMessage
            : typeof msg.resumeMessage === 'string'
                ? msg.resumeMessage
                : undefined;
        const isActive = Boolean(msg.isActive);
        const requestId = msg.requestId;
        const messageId = msg.messageId;
        if (!terminalId) {
            this.logger.error('Restore serialized content request missing terminalId');
            coordinator.postMessageToExtension({
                command: 'terminalSerializationRestoreResponse',
                restoredCount: 0,
                totalCount: 0,
                error: 'missing-terminal-id',
                requestId,
                messageId,
                timestamp: Date.now(),
            });
            return;
        }
        const persistenceManager = coordinator.persistenceManager;
        const restoreSessionFn = 'restoreSession' in coordinator && typeof coordinator.restoreSession === 'function'
            ? coordinator.restoreSession
            : undefined;
        void (async () => {
            let restored = false;
            let errorMessage;
            try {
                if (persistenceManager &&
                    typeof serializedContent === 'string' &&
                    serializedContent.length > 0) {
                    restored = Boolean(persistenceManager.restoreTerminalContent(terminalId, serializedContent));
                }
                if (!restored && scrollbackData && scrollbackData.length > 0 && restoreSessionFn) {
                    restored = await restoreSessionFn({
                        terminalId,
                        terminalName: typeof msg.terminalName === 'string'
                            ? msg.terminalName
                            : `Terminal ${terminalId}`,
                        scrollbackData,
                        sessionRestoreMessage,
                    });
                }
                if (restored && isActive) {
                    coordinator.setActiveTerminalId(terminalId);
                }
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to restore serialized content for ${terminalId}:`, error);
            }
            finally {
                coordinator.postMessageToExtension({
                    command: 'terminalSerializationRestoreResponse',
                    restoredCount: restored ? 1 : 0,
                    totalCount: 1,
                    success: restored,
                    error: errorMessage,
                    terminalId,
                    requestId,
                    messageId,
                    timestamp: Date.now(),
                });
            }
        })();
    }
    /**
     * Handle terminal restore info message
     */
    handleTerminalRestoreInfo(msg, _coordinator) {
        this.logger.info('Terminal restore info received');
        const terminals = Array.isArray(msg.terminals)
            ? msg.terminals
            : [];
        const activeTerminalId = typeof msg.activeTerminalId === 'string'
            ? msg.activeTerminalId
            : null;
        const config = msg.config;
        this.cachedTerminalRestoreInfo = {
            terminals,
            activeTerminalId,
            config,
            timestamp: Date.now(),
        };
        this.logger.info(`Cached terminal restore info for ${terminals.length} terminals`);
    }
    /**
     * Handle save all terminal sessions request
     */
    handleSaveAllTerminalSessions(msg, coordinator) {
        this.logger.info('Save all terminal sessions requested');
        const persistenceManager = coordinator.persistenceManager;
        const requestId = msg.requestId;
        const messageId = msg.messageId;
        if (!persistenceManager) {
            this.logger.error('StandardTerminalPersistenceManager not available for save request');
            coordinator.postMessageToExtension({
                command: 'saveAllTerminalSessionsResponse',
                success: false,
                error: 'persistence-manager-unavailable',
                requestId,
                messageId,
                timestamp: Date.now(),
            });
            return;
        }
        try {
            const terminalIds = typeof persistenceManager.getAvailableTerminals === 'function'
                ? persistenceManager.getAvailableTerminals()
                : [];
            terminalIds.forEach((terminalId) => {
                try {
                    persistenceManager.saveTerminalContent(terminalId);
                }
                catch (saveError) {
                    this.logger.error(`Failed to save session for terminal ${terminalId}:`, saveError);
                }
            });
            coordinator.postMessageToExtension({
                command: 'saveAllTerminalSessionsResponse',
                success: true,
                savedTerminals: terminalIds.length,
                requestId,
                messageId,
                timestamp: Date.now(),
            });
            const notificationManager = coordinator.getManagers()?.notification;
            if (notificationManager) {
                notificationManager.showNotificationInTerminal(terminalIds.length > 0
                    ? `Saved ${terminalIds.length} terminal session${terminalIds.length === 1 ? '' : 's'}`
                    : 'No terminals available to save', terminalIds.length > 0 ? 'success' : 'info');
            }
        }
        catch (error) {
            this.logger.error('Failed to save terminal sessions', error);
            coordinator.postMessageToExtension({
                command: 'saveAllTerminalSessionsResponse',
                success: false,
                error: error instanceof Error ? error.message : String(error),
                requestId,
                messageId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle request terminal serialization
     */
    handleRequestTerminalSerialization(msg, coordinator) {
        this.logger.info('Request terminal serialization');
        try {
            const terminalIds = Array.isArray(msg.terminalIds)
                ? msg.terminalIds
                : [];
            const scrollbackLines = msg.scrollbackLines || SerializationConfig.DEFAULT_SCROLLBACK_LINES;
            const serializationData = {};
            const requestId = msg.requestId;
            const messageId = msg.messageId;
            if (terminalIds.length === 0) {
                coordinator.postMessageToExtension({
                    command: 'terminalSerializationResponse',
                    serializationData: {},
                    error: 'no-terminal-ids',
                    requestId,
                    messageId,
                    timestamp: Date.now(),
                });
                return;
            }
            // Extract serialized content from each terminal using SerializeAddon
            terminalIds.forEach((terminalId) => {
                try {
                    // Get terminal instance
                    const terminalInstance = coordinator.getTerminalInstance(terminalId);
                    if (!terminalInstance) {
                        this.logger.warn(`Terminal ${terminalId} not found for serialization`);
                        return;
                    }
                    // Get SerializeAddon for color-preserving serialization
                    const serializeAddon = coordinator.getSerializeAddon(terminalId);
                    let serializedContent = '';
                    if (serializeAddon) {
                        // Use SerializeAddon for color preservation
                        this.logger.info(`Using SerializeAddon for terminal ${terminalId} serialization`);
                        const fullContent = serializeAddon.serialize();
                        const lines = fullContent.split('\n');
                        const startIndex = Math.max(0, lines.length - scrollbackLines);
                        serializedContent = lines.slice(startIndex).join('\n');
                    }
                    else {
                        // Fallback: Extract plain text from buffer
                        this.logger.warn(`SerializeAddon not available for terminal ${terminalId}, using plain text`);
                        const buffer = terminalInstance.terminal.buffer.active;
                        const lines = [];
                        const startLine = Math.max(0, buffer.length - scrollbackLines);
                        for (let i = startLine; i < buffer.length; i++) {
                            const line = buffer.getLine(i);
                            if (line) {
                                lines.push(line.translateToString());
                            }
                        }
                        serializedContent = lines.join('\n');
                    }
                    if (serializedContent.length > 0) {
                        serializationData[terminalId] = serializedContent;
                        this.logger.info(`Serialized terminal ${terminalId}: ${serializedContent.length} chars (${serializedContent.split('\n').length} lines)`);
                    }
                    else {
                        this.logger.warn(`No serialized content for terminal ${terminalId}`);
                    }
                }
                catch (terminalError) {
                    this.logger.error(`Error serializing terminal ${terminalId}:`, terminalError);
                }
            });
            // Send serialized data back to Extension
            coordinator.postMessageToExtension({
                command: 'terminalSerializationResponse',
                serializationData: serializationData,
                requestId,
                messageId,
                timestamp: Date.now(),
            });
            this.logger.info(`Terminal serialization completed for ${Object.keys(serializationData).length}/${terminalIds.length} terminals`);
        }
        catch (error) {
            this.logger.error('Error during terminal serialization:', error);
            // Send error response to Extension
            coordinator.postMessageToExtension({
                command: 'terminalSerializationResponse',
                serializationData: {},
                error: error instanceof Error ? error.message : String(error),
                requestId: msg.requestId,
                messageId: msg.messageId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Handle restore terminal serialization
     */
    handleRestoreTerminalSerialization(msg, coordinator) {
        this.logger.info('[RESTORE-DEBUG] === Restore terminal serialization START ===');
        try {
            const terminalData = msg.terminalData || [];
            this.logger.info(`[RESTORE-DEBUG] Received ${terminalData.length} terminals to restore`);
            let restoredCount = 0;
            // Restore serialized content to each terminal
            terminalData.forEach((terminal, index) => {
                const { id, serializedContent, isActive } = terminal;
                this.logger.info(`[RESTORE-DEBUG] Processing terminal ${index + 1}/${terminalData.length}: ${id}`);
                this.logger.info(`[RESTORE-DEBUG] Has serializedContent: ${!!(serializedContent && serializedContent.length > 0)}, length: ${serializedContent?.length || 0}`);
                if (serializedContent && serializedContent.length > 0) {
                    try {
                        // Get terminal instance
                        this.logger.info(`[RESTORE-DEBUG] Getting terminal instance for ${id}...`);
                        const terminalInstance = coordinator.getTerminalInstance(id);
                        if (!terminalInstance) {
                            this.logger.warn(`[RESTORE-DEBUG] Terminal ${id} not found for restoration`);
                            return;
                        }
                        this.logger.info(`[RESTORE-DEBUG] Terminal instance found for ${id}`);
                        // Convert serialized string to ScrollbackLine array
                        const scrollbackLines = serializedContent.split('\n').map((line) => ({
                            content: line,
                            type: 'output',
                            timestamp: Date.now(),
                        }));
                        this.logger.info(`[RESTORE-DEBUG] Created ${scrollbackLines.length} scrollback lines for terminal ${id}`);
                        // Restore scrollback with ANSI colors preserved
                        this.logger.info(`[RESTORE-DEBUG] Writing ${scrollbackLines.length} lines to terminal ${id}...`);
                        scrollbackLines.forEach((line) => {
                            terminalInstance.terminal.writeln(line.content);
                        });
                        this.logger.info(`[RESTORE-DEBUG] Finished writing to terminal ${id}`);
                        // Set as active if needed
                        if (isActive) {
                            coordinator.setActiveTerminalId(id);
                            this.logger.info(`[RESTORE-DEBUG] Set terminal ${id} as active`);
                        }
                        restoredCount++;
                        this.logger.info(`[RESTORE-DEBUG] Restored terminal ${id}: ${scrollbackLines.length} lines with ANSI colors`);
                    }
                    catch (restoreError) {
                        this.logger.error(`[RESTORE-DEBUG] Error restoring terminal ${id}:`, restoreError);
                    }
                }
                else {
                    this.logger.info(`[RESTORE-DEBUG] No serialized content for terminal ${id}`);
                }
            });
            // Send restoration completion response
            coordinator.postMessageToExtension({
                command: 'terminalSerializationRestoreResponse',
                restoredCount: restoredCount,
                totalCount: terminalData.length,
                requestId: msg.requestId,
                messageId: msg.messageId,
                timestamp: Date.now(),
            });
            this.logger.info(`Terminal serialization restoration completed: ${restoredCount}/${terminalData.length} terminals`);
        }
        catch (error) {
            this.logger.error('Error during terminal serialization restoration:', error);
            // Send error response to Extension
            coordinator.postMessageToExtension({
                command: 'terminalSerializationRestoreResponse',
                restoredCount: 0,
                totalCount: 0,
                error: error instanceof Error ? error.message : String(error),
                requestId: msg.requestId,
                messageId: msg.messageId,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Get cached terminal restore info
     */
    getCachedTerminalRestoreInfo() {
        return this.cachedTerminalRestoreInfo;
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.cachedTerminalRestoreInfo = null;
        this.handlers.clear();
    }
}
exports.SerializationMessageHandler = SerializationMessageHandler;
//# sourceMappingURL=SerializationMessageHandler.js.map