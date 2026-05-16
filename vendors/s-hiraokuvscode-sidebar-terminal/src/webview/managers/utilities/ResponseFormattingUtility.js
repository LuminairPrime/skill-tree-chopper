"use strict";
/**
 * Response Formatting Utility
 *
 * Provides common response formatting functions for message handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFormattingUtility = void 0;
/**
 * Response Formatting Utility
 *
 * Centralized response message construction
 */
class ResponseFormattingUtility {
    /**
     * Create success response message
     */
    static createSuccessResponse(command, data, metadata) {
        return {
            command,
            success: true,
            ...data,
            ...(metadata?.requestId && { requestId: metadata.requestId }),
            ...(metadata?.messageId && { messageId: metadata.messageId }),
            timestamp: metadata?.timestamp || Date.now(),
        };
    }
    /**
     * Create error response message
     */
    static createErrorResponse(command, error, metadata) {
        const errorMessage = error instanceof Error ? error.message : error;
        return {
            command,
            success: false,
            error: errorMessage,
            ...(metadata?.requestId && { requestId: metadata.requestId }),
            ...(metadata?.messageId && { messageId: metadata.messageId }),
            timestamp: metadata?.timestamp || Date.now(),
        };
    }
    /**
     * Send response message to extension
     */
    static sendResponse(coordinator, response) {
        coordinator.postMessageToExtension(response);
    }
    /**
     * Create and send success response
     */
    static sendSuccessResponse(coordinator, command, data, metadata) {
        const response = this.createSuccessResponse(command, data, metadata);
        this.sendResponse(coordinator, response);
    }
    /**
     * Create and send error response
     */
    static sendErrorResponse(coordinator, command, error, metadata) {
        const response = this.createErrorResponse(command, error, metadata);
        this.sendResponse(coordinator, response);
    }
    /**
     * Create scrollback extracted response
     */
    static createScrollbackExtractedResponse(terminalId, scrollbackContent, metadata) {
        return this.createSuccessResponse('scrollbackExtracted', {
            terminalId,
            scrollbackContent,
        }, metadata);
    }
    /**
     * Create scrollback restored response
     */
    static createScrollbackRestoredResponse(terminalId, restoredLines, metadata) {
        return this.createSuccessResponse('scrollbackRestored', {
            terminalId,
            restoredLines,
        }, metadata);
    }
    /**
     * Create terminal serialization response
     */
    static createSerializationResponse(serializationData, metadata, error) {
        if (error) {
            return this.createErrorResponse('terminalSerializationResponse', error, metadata);
        }
        return this.createSuccessResponse('terminalSerializationResponse', {
            serializationData,
        }, metadata);
    }
    /**
     * Create terminal restoration response
     */
    static createRestorationResponse(restoredCount, totalCount, metadata, error) {
        if (error) {
            return {
                command: 'terminalSerializationRestoreResponse',
                success: false,
                restoredCount: 0,
                totalCount,
                error,
                ...(metadata?.requestId && { requestId: metadata.requestId }),
                ...(metadata?.messageId && { messageId: metadata.messageId }),
                timestamp: metadata?.timestamp || Date.now(),
            };
        }
        return this.createSuccessResponse('terminalSerializationRestoreResponse', {
            restoredCount,
            totalCount,
        }, metadata);
    }
}
exports.ResponseFormattingUtility = ResponseFormattingUtility;
//# sourceMappingURL=ResponseFormattingUtility.js.map