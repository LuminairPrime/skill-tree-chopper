"use strict";
/**
 * Session Command Handler
 *
 * Handles session management commands (save, restore, clear).
 * Consolidates logic from:
 * - ConsolidatedMessageManager (session cases)
 * - SessionMessageController
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCommandHandler = void 0;
const IMessageHandler_1 = require("../core/IMessageHandler");
/**
 * Handler for session-related commands
 */
class SessionCommandHandler extends IMessageHandler_1.BaseCommandHandler {
    constructor() {
        super('SessionCommandHandler', [
            'sessionRestore',
            'sessionRestoreStarted',
            'sessionRestoreProgress',
            'sessionRestoreCompleted',
            'sessionRestoreError',
            'sessionRestoreSkipped',
            'sessionSaved',
            'sessionSaveError',
            'sessionCleared',
            'sessionRestored',
            'terminalRestoreError',
        ], 60 // Medium-high priority for session operations
        );
    }
    async handle(message, context) {
        const { command } = message;
        this.log(context, 'info', `Processing session command: ${command}`);
        switch (command) {
            case 'sessionRestore':
                await this.handleSessionRestore(message, context);
                break;
            case 'sessionRestoreStarted':
                this.handleSessionRestoreStarted(message, context);
                break;
            case 'sessionRestoreProgress':
                this.handleSessionRestoreProgress(message, context);
                break;
            case 'sessionRestoreCompleted':
                this.handleSessionRestoreCompleted(message, context);
                break;
            case 'sessionRestoreError':
                this.handleSessionRestoreError(message, context);
                break;
            case 'sessionRestoreSkipped':
                this.handleSessionRestoreSkipped(message, context);
                break;
            case 'sessionSaved':
                this.handleSessionSaved(message, context);
                break;
            case 'sessionSaveError':
                this.handleSessionSaveError(message, context);
                break;
            case 'sessionCleared':
                this.handleSessionCleared(context);
                break;
            case 'sessionRestored':
                this.handleSessionRestored(message, context);
                break;
            case 'terminalRestoreError':
                await this.handleTerminalRestoreError(message, context);
                break;
            default:
                this.log(context, 'warn', `Unknown session command: ${command}`);
        }
    }
    /**
     * Handle session restore command
     */
    async handleSessionRestore(message, context) {
        const coordinator = context.coordinator;
        if (!coordinator) {
            throw new Error('Coordinator not available for session restore');
        }
        this.log(context, 'info', 'Starting session restore');
        const { terminals, activeTerminalId, config } = message;
        this.validateRequired(message, ['terminals']);
        // Delegate to coordinator's session restoration logic
        if (typeof coordinator.restoreSession === 'function') {
            await coordinator.restoreSession({
                terminals,
                activeTerminalId,
                config,
            });
        }
        else {
            this.log(context, 'warn', 'Session restore not implemented in coordinator');
        }
    }
    /**
     * Handle session restore started event
     */
    handleSessionRestoreStarted(message, context) {
        this.log(context, 'info', 'Session restore started');
        // Update UI or state to show restoration in progress
    }
    /**
     * Handle session restore progress event
     */
    handleSessionRestoreProgress(message, context) {
        const { progress, total } = message;
        this.log(context, 'debug', `Session restore progress: ${progress}/${total}`);
        // Update UI with progress
    }
    /**
     * Handle session restore completed event
     */
    handleSessionRestoreCompleted(message, context) {
        const { restoredCount } = message;
        this.log(context, 'info', `Session restore completed: ${restoredCount} terminals restored`);
        // Update UI to show completion
    }
    /**
     * Handle session restore error event
     */
    handleSessionRestoreError(message, context) {
        const { error } = message;
        this.log(context, 'error', 'Session restore failed', error);
        // Show error notification
    }
    /**
     * Handle session restore skipped event
     */
    handleSessionRestoreSkipped(message, context) {
        const { reason } = message;
        this.log(context, 'info', `Session restore skipped: ${reason || 'unknown reason'}`);
    }
    /**
     * Handle session saved event
     */
    handleSessionSaved(message, context) {
        const { terminalCount } = message;
        this.log(context, 'info', `Session saved: ${terminalCount || 'unknown'} terminals`);
    }
    /**
     * Handle session save error event
     */
    handleSessionSaveError(message, context) {
        const { error } = message;
        this.log(context, 'error', 'Session save failed', error);
    }
    /**
     * Handle session cleared event
     */
    handleSessionCleared(context) {
        this.log(context, 'info', 'Session cleared');
    }
    /**
     * Handle session restored event
     */
    handleSessionRestored(message, context) {
        const { terminals } = message;
        this.log(context, 'info', `Session restored with ${terminals?.length || 0} terminals`);
    }
    /**
     * Handle terminal restore error
     */
    async handleTerminalRestoreError(message, context) {
        const { terminalId, error } = message;
        this.log(context, 'error', `Terminal restore error for ${terminalId}`, error);
    }
}
exports.SessionCommandHandler = SessionCommandHandler;
//# sourceMappingURL=SessionCommandHandler.js.map