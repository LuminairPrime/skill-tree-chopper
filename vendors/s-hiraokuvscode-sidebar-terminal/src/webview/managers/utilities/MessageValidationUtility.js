"use strict";
/**
 * Message Validation Utility
 *
 * Provides common validation functions for message handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidationUtility = void 0;
/**
 * Message Validation Utility
 *
 * Centralized validation logic for message handlers
 */
class MessageValidationUtility {
    /**
     * Validate and extract terminal ID from message
     * @returns Terminal ID if valid, null otherwise
     */
    static validateTerminalId(msg) {
        const terminalId = msg.terminalId;
        if (!terminalId) {
            return null;
        }
        if (typeof terminalId !== 'string' || terminalId.trim() === '') {
            return null;
        }
        return terminalId;
    }
    /**
     * Validate terminal exists and return its instance
     * @returns Terminal instance if found, null otherwise
     */
    static validateTerminalInstance(terminalId, coordinator) {
        const terminal = coordinator.getTerminalInstance(terminalId);
        if (!terminal) {
            return null;
        }
        return terminal;
    }
    /**
     * Extract request metadata from message
     */
    static extractRequestMetadata(msg) {
        return {
            requestId: msg.requestId,
            messageId: msg.messageId,
            timestamp: Date.now(),
        };
    }
    /**
     * Validate terminal ID and get instance (combined operation)
     * @returns Object with terminalId and instance, or null if validation fails
     */
    static validateAndGetTerminal(msg, coordinator) {
        const terminalId = this.validateTerminalId(msg);
        if (!terminalId) {
            return null;
        }
        const instance = this.validateTerminalInstance(terminalId, coordinator);
        if (!instance) {
            return null;
        }
        return { terminalId, instance };
    }
    /**
     * Validate array field in message
     */
    static validateArray(msg, fieldName, itemValidator) {
        const field = msg[fieldName];
        if (!Array.isArray(field)) {
            return null;
        }
        if (itemValidator) {
            return field.filter(itemValidator);
        }
        return field;
    }
    /**
     * Validate string field in message
     */
    static validateString(msg, fieldName, required = true) {
        const field = msg[fieldName];
        if (required && !field) {
            return null;
        }
        if (field && typeof field !== 'string') {
            return null;
        }
        return field || null;
    }
    /**
     * Validate number field in message
     */
    static validateNumber(msg, fieldName, required = true) {
        const field = msg[fieldName];
        if (required && field === undefined) {
            return null;
        }
        if (field !== undefined && typeof field !== 'number') {
            return null;
        }
        return field || null;
    }
    /**
     * Validate boolean field in message
     */
    static validateBoolean(msg, fieldName, defaultValue = false) {
        const field = msg[fieldName];
        if (field === undefined) {
            return defaultValue;
        }
        return Boolean(field);
    }
}
exports.MessageValidationUtility = MessageValidationUtility;
//# sourceMappingURL=MessageValidationUtility.js.map