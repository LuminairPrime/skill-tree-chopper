"use strict";
/**
 * Communication Layer - Message Protocol
 *
 * Defines the message protocol for communication between Extension and WebView layers.
 * This layer provides clear separation of concerns following Clean Architecture principles.
 *
 * @see Issue #223 - Phase 1: Communication Layer Definition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagePriority = void 0;
/**
 * Message priority levels for queue processing
 */
var MessagePriority;
(function (MessagePriority) {
    MessagePriority["HIGH"] = "high";
    MessagePriority["NORMAL"] = "normal";
    MessagePriority["LOW"] = "low";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
//# sourceMappingURL=MessageProtocol.js.map