"use strict";
/**
 * Type Guards and Type Safety Utilities
 *
 * This module provides type guards and utility functions to replace `any` types
 * with proper type checking throughout the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebviewMessage = isWebviewMessage;
exports.hasTerminalId = hasTerminalId;
exports.hasResizeParams = hasResizeParams;
exports.hasSettings = hasSettings;
exports.hasInputData = hasInputData;
exports.isNonNullObject = isNonNullObject;
exports.hasProperty = hasProperty;
exports.isSplitDirection = isSplitDirection;
exports.hasDirection = hasDirection;
exports.isBoolean = isBoolean;
exports.hasForceReconnect = hasForceReconnect;
// ===== Type Guard Functions =====
/**
 * Type guard for WebviewMessage
 */
function isWebviewMessage(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.command === 'string');
}
/**
 * Type guard for WebviewMessage with terminalId
 */
function hasTerminalId(msg) {
    return typeof msg.terminalId === 'string' && msg.terminalId.length > 0;
}
/**
 * Type guard for WebviewMessage with resize parameters
 */
function hasResizeParams(msg) {
    return (typeof msg.cols === 'number' && typeof msg.rows === 'number' && msg.cols > 0 && msg.rows > 0);
}
/**
 * Type guard for WebviewMessage with settings
 */
function hasSettings(msg) {
    return msg.settings !== undefined && typeof msg.settings === 'object' && msg.settings !== null;
}
/**
 * Type guard for WebviewMessage with input data
 */
function hasInputData(msg) {
    return typeof msg.data === 'string' && msg.data.length > 0;
}
// ===== Runtime Type Checkers =====
/**
 * Checks if value is a non-null object
 */
function isNonNullObject(value) {
    return typeof value === 'object' && value !== null;
}
/**
 * Checks if value has a specific property with type
 */
function hasProperty(obj, key, typeCheck) {
    return isNonNullObject(obj) && key in obj && typeCheck(obj[key]);
}
/**
 * Type guard for split direction
 */
function isSplitDirection(value) {
    return value === 'horizontal' || value === 'vertical';
}
/**
 * Type guard for WebviewMessage with direction
 */
function hasDirection(msg) {
    return hasProperty(msg, 'direction', isSplitDirection);
}
/**
 * Type guard for boolean values
 */
function isBoolean(value) {
    return typeof value === 'boolean';
}
/**
 * Type guard for WebviewMessage with force reconnect
 */
function hasForceReconnect(msg) {
    return hasProperty(msg, 'forceReconnect', isBoolean);
}
//# sourceMappingURL=type-guards.js.map