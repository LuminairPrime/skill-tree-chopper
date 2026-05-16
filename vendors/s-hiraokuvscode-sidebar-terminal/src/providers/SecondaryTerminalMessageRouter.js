"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondaryTerminalMessageRouter = void 0;
/**
 * Lightweight command router for SecondaryTerminalProvider.
 * Handles registration and dispatch without exposing the underlying map.
 */
class SecondaryTerminalMessageRouter {
    constructor() {
        this.handlers = new Map();
    }
    register(command, handler) {
        if (!command) {
            return;
        }
        this.handlers.set(command, handler);
    }
    reset() {
        this.handlers.clear();
    }
    has(command) {
        return this.handlers.has(command);
    }
    getRegisteredCommands() {
        return Array.from(this.handlers.keys());
    }
    async dispatch(message) {
        const handler = this.handlers.get(message.command);
        if (!handler) {
            return false;
        }
        await handler(message);
        return true;
    }
    clear() {
        this.handlers.clear();
    }
}
exports.SecondaryTerminalMessageRouter = SecondaryTerminalMessageRouter;
//# sourceMappingURL=SecondaryTerminalMessageRouter.js.map