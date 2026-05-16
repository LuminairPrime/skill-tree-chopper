"use strict";
/**
 * Session Restore Manager
 *
 * Handles terminal session restoration logic, extracted from LightweightTerminalWebviewManager
 * for better separation of concerns and testability.
 *
 * Responsibilities:
 * - Track restored terminals to prevent duplicate restoration
 * - Coordinate scrollback data restoration
 * - Manage restoration state flags
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRestoreManager = void 0;
const logger_1 = require("../../utils/logger");
const TerminalCreationService_1 = require("../services/TerminalCreationService");
const webview_1 = require("../constants/webview");
/**
 * Manages terminal session restoration with deduplication
 */
class SessionRestoreManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.processedScrollbackRequests = new Set();
        this._isRestoringSession = false;
        (0, logger_1.webview)('[SESSION-RESTORE] SessionRestoreManager initialized');
    }
    /**
     * Check if session restore is in progress
     */
    isRestoringSession() {
        return this._isRestoringSession;
    }
    /**
     * Set session restore flag
     */
    setRestoringSession(isRestoring) {
        this._isRestoringSession = isRestoring;
        (0, logger_1.webview)(`[SESSION-RESTORE] isRestoringSession set to: ${isRestoring}`);
    }
    /**
     * Check if terminal has already been restored
     */
    isTerminalRestored(terminalId) {
        return (this.processedScrollbackRequests.has(terminalId) ||
            TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId));
    }
    /**
     * Restore terminal session from Extension data
     *
     * This method checks for duplicate restoration attempts using
     * TerminalCreationService.isTerminalRestoring() to prevent
     * overwriting previously restored scrollback data.
     */
    async restoreSession(sessionData) {
        const { terminalId, terminalName, scrollbackData, sessionRestoreMessage } = sessionData;
        (0, logger_1.webview)(`[RESTORATION] Starting session restore for terminal: ${terminalId}`);
        // Check if terminal is already being restored or was recently restored
        if (this.isTerminalRestored(terminalId)) {
            (0, logger_1.webview)(`[RESTORATION] Terminal ${terminalId} is already being restored or processed, skipping`);
            return {
                success: true,
                terminalId,
                linesRestored: 0,
                reason: 'already_restored',
            };
        }
        // Mark terminal as restoring (blocks auto-save)
        TerminalCreationService_1.TerminalCreationService.markTerminalRestoring(terminalId);
        try {
            // 1. Create terminal if it doesn't exist
            let terminalInstance = this.callbacks.getTerminalInstance(terminalId);
            if (!terminalInstance) {
                (0, logger_1.webview)(`[RESTORATION] Creating terminal for restore: ${terminalId}`);
                const xtermInstance = await this.callbacks.createTerminal(terminalId, terminalName);
                if (!xtermInstance) {
                    (0, logger_1.webview)(`[RESTORATION] Failed to create terminal for restore: ${terminalId}`);
                    this.markRestoreComplete(terminalId);
                    return {
                        success: false,
                        terminalId,
                        linesRestored: 0,
                        reason: 'terminal_creation_failed',
                    };
                }
                // Wait for terminal to be fully created
                await new Promise((resolve) => setTimeout(resolve, webview_1.SESSION_RESTORE_CONSTANTS.TERMINAL_CREATION_WAIT_MS));
                terminalInstance = this.callbacks.getTerminalInstance(terminalId);
            }
            if (!terminalInstance?.terminal) {
                (0, logger_1.webview)(`[RESTORATION] Terminal instance not available for restore: ${terminalId}`);
                this.markRestoreComplete(terminalId);
                return {
                    success: false,
                    terminalId,
                    linesRestored: 0,
                    reason: 'terminal_not_available',
                };
            }
            const terminal = terminalInstance.terminal;
            let linesRestored = 0;
            // 2. Clear existing content (only if we're actually restoring data)
            if (scrollbackData && scrollbackData.length > 0) {
                terminal.clear();
            }
            // 3. Restore session restore message if available
            if (sessionRestoreMessage) {
                terminal.writeln(sessionRestoreMessage);
                (0, logger_1.webview)(`[RESTORATION] Restored session message for terminal: ${terminalId}`);
            }
            // 4. Restore scrollback data if available
            if (scrollbackData && scrollbackData.length > 0) {
                (0, logger_1.webview)(`[RESTORATION] Restoring ${scrollbackData.length} lines of scrollback for terminal: ${terminalId}`);
                // Write each line to restore scrollback history
                for (const line of scrollbackData) {
                    if (line.trim()) {
                        terminal.writeln(line);
                        linesRestored++;
                    }
                }
                (0, logger_1.webview)(`[RESTORATION] Scrollback restored for terminal: ${terminalId} (${linesRestored} lines)`);
            }
            // Mark as processed to prevent duplicate restoration
            this.processedScrollbackRequests.add(terminalId);
            this.markRestoreComplete(terminalId);
            // 5. Focus terminal if it's the active one
            if (this.callbacks.getActiveTerminalId() === terminalId) {
                terminal.focus();
            }
            (0, logger_1.webview)(`[RESTORATION] Session restore completed for terminal: ${terminalId}`);
            return {
                success: true,
                terminalId,
                linesRestored,
            };
        }
        catch (error) {
            (0, logger_1.webview)(`[RESTORATION] Error during session restore:`, error);
            // Even on error, mark as restored to prevent infinite retries
            this.markRestoreComplete(terminalId);
            return {
                success: false,
                terminalId,
                linesRestored: 0,
                reason: error instanceof Error ? error.message : 'unknown_error',
            };
        }
    }
    /**
     * Mark restoration as complete
     */
    markRestoreComplete(terminalId) {
        TerminalCreationService_1.TerminalCreationService.markTerminalRestored(terminalId);
    }
    /**
     * Clear restoration state for a terminal (used when terminal is deleted)
     */
    clearRestorationState(terminalId) {
        this.processedScrollbackRequests.delete(terminalId);
        TerminalCreationService_1.TerminalCreationService.clearTerminalRestorationState(terminalId);
        (0, logger_1.webview)(`[SESSION-RESTORE] Cleared restoration state for terminal: ${terminalId}`);
    }
    /**
     * Dispose and clear all state
     */
    dispose() {
        this.processedScrollbackRequests.clear();
        TerminalCreationService_1.TerminalCreationService.clearAllRestorationState();
        this._isRestoringSession = false;
        (0, logger_1.webview)('[SESSION-RESTORE] SessionRestoreManager disposed');
    }
}
exports.SessionRestoreManager = SessionRestoreManager;
//# sourceMappingURL=SessionRestoreManager.js.map