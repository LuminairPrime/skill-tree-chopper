"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalInitializationCoordinator = void 0;
const logger_1 = require("../utils/logger");
class TerminalInitializationCoordinator {
    constructor(terminalManager, actions, extensionPersistenceService) {
        this.terminalManager = terminalManager;
        this.actions = actions;
        this.extensionPersistenceService = extensionPersistenceService;
    }
    async initialize() {
        try {
            (0, logger_1.terminal)('🔍 [TERMINAL-INIT] Starting coordinated terminal initialization...');
            await this.actions.initializeTerminal();
            (0, logger_1.terminal)('✅ [TERMINAL-INIT] Basic initialization completed');
            const currentCount = this.terminalManager.getTerminals().length;
            (0, logger_1.terminal)(`🔍 [TERMINAL-INIT] Current terminal count: ${currentCount}`);
            await this.restoreTerminalsIfNeeded(currentCount);
            // 🎯 OPTIMIZATION: Unified initialization complete message with verification
            // Reduced from 500ms + 1000ms (2 messages) to single 800ms message
            this.scheduleUnifiedInitializationComplete();
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [TERMINAL-INIT] Critical initialization error:', error);
            this.attemptEmergencyTerminalCreation();
        }
    }
    async restoreTerminalsIfNeeded(currentTerminalCount) {
        if (currentTerminalCount > 0) {
            this.logExistingTerminals(currentTerminalCount);
            return;
        }
        (0, logger_1.terminal)('📦 [TERMINAL-INIT] No existing terminals - attempting coordinated restoration...');
        const restorationSucceeded = await this.attemptSessionRestoration();
        if (!restorationSucceeded) {
            (0, logger_1.terminal)('🆕 [TERMINAL-INIT] No sessions found - creating default terminals');
            this.actions.ensureMinimumTerminals();
        }
        else {
            // 🎯 FIX: After restoration, notify WebView about the restored terminals
            (0, logger_1.terminal)('🎯 [TERMINAL-INIT] Restoration succeeded - notifying WebView about restored terminals');
            await this.actions.initializeTerminal();
        }
    }
    async attemptSessionRestoration() {
        let restorationSuccessful = false;
        if (this.extensionPersistenceService) {
            try {
                (0, logger_1.terminal)('🔄 [EXT-RESTORE] Attempting extension session restore...');
                const result = await this.extensionPersistenceService.restoreSession(false);
                if (result.success && result.restoredCount && result.restoredCount > 0) {
                    (0, logger_1.terminal)(`✅ [EXT-RESTORE] Successfully restored ${result.restoredCount} terminals`);
                    restorationSuccessful = true;
                }
                else {
                    (0, logger_1.terminal)('📝 [EXT-RESTORE] No extension session found');
                }
            }
            catch (error) {
                (0, logger_1.terminal)('❌ [EXT-RESTORE] Extension restore failed:', error);
            }
        }
        if (!restorationSuccessful) {
            try {
                (0, logger_1.terminal)('🔄 [WEBVIEW-RESTORE] Attempting WebView session restore...');
                const webviewRestored = await this.actions.restoreLastSession();
                if (webviewRestored) {
                    (0, logger_1.terminal)('✅ [WEBVIEW-RESTORE] WebView session restored successfully');
                    restorationSuccessful = true;
                }
                else {
                    (0, logger_1.terminal)('📝 [WEBVIEW-RESTORE] No WebView session found');
                }
            }
            catch (error) {
                (0, logger_1.terminal)('❌ [WEBVIEW-RESTORE] WebView restore failed:', error);
            }
        }
        return restorationSuccessful;
    }
    /**
     * 🎯 VS Code Pattern: Immediate initialization complete after terminals are ready
     * No artificial delays - send message as soon as state is consistent
     */
    scheduleUnifiedInitializationComplete() {
        // Small delay to ensure terminal creation messages are processed first
        setTimeout(() => {
            const terminalCount = this.terminalManager.getTerminals().length;
            (0, logger_1.terminal)(`🔍 [TERMINAL-INIT] Final terminal count: ${terminalCount}`);
            // Emergency creation if needed
            if (terminalCount === 0) {
                (0, logger_1.terminal)('⚠️ [TERMINAL-INIT] No terminals - emergency creation');
                this.actions.ensureMinimumTerminals();
                // Wait a bit for emergency terminals to be created
                setTimeout(() => {
                    const emergencyCount = this.terminalManager.getTerminals().length;
                    void this.actions.sendInitializationComplete(emergencyCount);
                }, 100);
            }
            else {
                // Normal flow - send initialization complete immediately
                void this.actions.sendInitializationComplete(terminalCount);
            }
        }, 100); // Minimal delay to ensure message ordering
    }
    // 🎯 DEPRECATED: Replaced by scheduleUnifiedInitializationComplete
    // private scheduleTerminalCountVerification(): void { }
    // private scheduleInitializationCompleteMessage(): void { }
    logExistingTerminals(currentTerminalCount) {
        (0, logger_1.terminal)(`ℹ️ [TERMINAL-INIT] Terminals already exist (${currentTerminalCount}) - no restoration needed`);
        const existingTerminals = this.terminalManager.getTerminals();
        existingTerminals.forEach((terminal, index) => {
            (0, logger_1.terminal)(`📋 [TERMINAL-INIT] Existing terminal ${index + 1}: ${terminal.name} (${terminal.id})`);
        });
    }
    attemptEmergencyTerminalCreation() {
        try {
            (0, logger_1.terminal)('🚨 [TERMINAL-INIT] Emergency terminal creation...');
            this.actions.ensureMinimumTerminals();
        }
        catch (error) {
            (0, logger_1.terminal)('💥 [TERMINAL-INIT] Emergency creation failed:', error);
        }
    }
}
exports.TerminalInitializationCoordinator = TerminalInitializationCoordinator;
//# sourceMappingURL=TerminalInitializationCoordinator.js.map