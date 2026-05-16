"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMessageController = void 0;
const NotificationUtils_1 = require("../../utils/NotificationUtils");
class SessionMessageController {
    constructor({ logger }) {
        this.logger = logger;
    }
    async handleSessionRestoreMessage(msg, coordinator) {
        this.logger.info('Session restore message received');
        const terminalId = msg.terminalId;
        const terminalName = msg.terminalName;
        const config = msg.config;
        const sessionRestoreMessage = msg.sessionRestoreMessage;
        const sessionScrollback = msg.sessionScrollback;
        if (!terminalId || !terminalName) {
            this.logger.error('Invalid session restore data received', { terminalId, terminalName });
            return;
        }
        this.logger.info(`Restoring terminal session: ${terminalId} (${terminalName})`);
        try {
            if (typeof coordinator.restoreSession ===
                'function') {
                const success = await coordinator.restoreSession({
                    terminalId,
                    terminalName,
                    scrollbackData: sessionScrollback,
                    sessionRestoreMessage,
                });
                if (success) {
                    this.logger.info(`✅ Successfully restored terminal session: ${terminalId}`);
                    return;
                }
                this.logger.warn(`⚠️ Session restore failed, creating regular terminal: ${terminalId}`);
            }
            await coordinator.createTerminal(terminalId, terminalName, config, undefined, 'extension');
            this.logger.info(`Created terminal for session restore: ${terminalId}`);
            if (sessionRestoreMessage || (sessionScrollback && sessionScrollback.length > 0)) {
                setTimeout(() => {
                    if ('restoreTerminalScrollback' in coordinator &&
                        typeof coordinator.restoreTerminalScrollback === 'function') {
                        coordinator.restoreTerminalScrollback(terminalId, sessionRestoreMessage || '', sessionScrollback || []);
                        this.logger.info(`Restored scrollback for terminal: ${terminalId}`);
                    }
                    else {
                        this.logger.warn('restoreTerminalScrollback method not found');
                    }
                }, 100);
            }
        }
        catch (error) {
            this.logger.error(`Failed to restore terminal session ${terminalId}: ${String(error)}`);
            try {
                await coordinator.createTerminal(terminalId, terminalName, config, undefined, 'extension');
                this.logger.info(`Created fallback terminal: ${terminalId}`);
            }
            catch (fallbackError) {
                this.logger.error(`Failed to create fallback terminal: ${String(fallbackError)}`);
            }
        }
    }
    handleSessionRestoreStartedMessage(msg) {
        const terminalCount = msg.terminalCount || 0;
        this.logger.info(`Session restore started for ${terminalCount} terminals`);
        (0, NotificationUtils_1.showSessionRestoreStarted)(terminalCount);
    }
    handleSessionRestoreProgressMessage(msg) {
        const restored = msg.restored || 0;
        const total = msg.total || 0;
        this.logger.info(`Session restore progress: ${restored}/${total}`);
        (0, NotificationUtils_1.showSessionRestoreProgress)(restored, total);
    }
    handleSessionRestoreCompletedMessage(msg) {
        const restoredCount = msg.restoredCount || 0;
        const skippedCount = msg.skippedCount || 0;
        this.logger.info(`Session restore completed: ${restoredCount} restored, ${skippedCount} skipped`);
        (0, NotificationUtils_1.showSessionRestoreCompleted)(restoredCount, skippedCount);
    }
    handleSessionRestoreErrorMessage(msg) {
        const error = msg.error || 'Unknown error';
        const partialSuccess = msg.partialSuccess || false;
        const errorType = msg.errorType || undefined;
        this.logger.error(`Session restore error: ${error} (partial: ${partialSuccess}, type: ${errorType})`);
        (0, NotificationUtils_1.showSessionRestoreError)(error, partialSuccess, errorType);
    }
    handleSessionSavedMessage(msg) {
        const terminalCount = msg.terminalCount || 0;
        this.logger.info(`Session saved with ${terminalCount} terminals`);
        (0, NotificationUtils_1.showSessionSaved)(terminalCount);
    }
    handleSessionSaveErrorMessage(msg) {
        const error = msg.error || 'Unknown error';
        this.logger.error(`Session save error: ${error}`);
        (0, NotificationUtils_1.showSessionSaveError)(error);
    }
    handleSessionClearedMessage() {
        this.logger.info('Session cleared');
        (0, NotificationUtils_1.showSessionCleared)();
    }
    handleSessionRestoredMessage(msg) {
        const success = msg.success;
        const restoredCount = msg.restoredCount || 0;
        const totalCount = msg.totalCount || 0;
        this.logger.info(`🔥 [RESTORE-DEBUG] Session restoration completed: success=${success}, restored=${restoredCount}/${totalCount}`);
        if (success) {
            this.logger.info(`✅ [RESTORE-DEBUG] Session restoration successful: ${restoredCount} terminals restored out of ${totalCount}`);
        }
        else {
            this.logger.warn(`⚠️ [RESTORE-DEBUG] Session restoration partially failed: only ${restoredCount} out of ${totalCount} terminals restored`);
        }
    }
    handleSessionRestoreSkippedMessage(msg) {
        const reason = msg.reason || 'Unknown reason';
        this.logger.info(`Session restore skipped: ${reason}`);
        (0, NotificationUtils_1.showSessionRestoreSkipped)(reason);
    }
    async handleTerminalRestoreErrorMessage(msg) {
        const terminalName = msg.terminalName || 'Unknown terminal';
        const error = msg.error || 'Unknown error';
        this.logger.warn(`Terminal restore error: ${terminalName} - ${error}`);
        const { showTerminalRestoreError } = await Promise.resolve().then(() => require('../../utils/NotificationUtils'));
        showTerminalRestoreError(terminalName, error);
    }
}
exports.SessionMessageController = SessionMessageController;
//# sourceMappingURL=SessionMessageController.js.map