"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
// Additional exports for test compatibility
var MessageType;
(function (MessageType) {
    MessageType["TERMINAL"] = "terminal";
    MessageType["SESSION"] = "session";
    MessageType["CONFIG"] = "config";
    MessageType["STATUS"] = "status";
    MessageType["SYSTEM"] = "system";
    // Legacy message types for backward compatibility
    MessageType["TERMINAL_OUTPUT"] = "terminalOutput";
    MessageType["TERMINAL_INPUT"] = "terminalInput";
    MessageType["CREATE_TERMINAL"] = "createTerminal";
    MessageType["TERMINAL_CREATED"] = "terminalCreated";
    MessageType["DELETE_TERMINAL"] = "deleteTerminal";
    MessageType["REQUEST_STATE"] = "requestState";
    MessageType["STATE_UPDATE"] = "stateUpdate";
    MessageType["PING"] = "ping";
    // Version negotiation message types (for tests)
    MessageType["VERSION_ANNOUNCEMENT"] = "versionAnnouncement";
    MessageType["VERSION_NEGOTIATION"] = "versionNegotiation";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=messageTypes.js.map