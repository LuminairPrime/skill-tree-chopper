"use strict";
/**
 * TerminalStateCoordinator
 *
 * Terminal state management methods extracted from LightweightTerminalWebviewManager.
 * Handles state updates, UI synchronization, debug display, and system status queries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalStateCoordinator = void 0;
const logger_1 = require("../../utils/logger");
class TerminalStateCoordinator {
    constructor(deps) {
        this.deps = deps;
    }
    /**
     * Process incoming state update from Extension
     */
    updateState(state) {
        try {
            // Type-safe state validation
            if (!state || typeof state !== 'object') {
                (0, logger_1.webview)('\u26a0\ufe0f [STATE] Invalid state received:', state);
                return;
            }
            // Type-safe state validation and casting
            const stateObj = state;
            if (!Array.isArray(stateObj.terminals) ||
                !Array.isArray(stateObj.availableSlots) ||
                typeof stateObj.maxTerminals !== 'number') {
                (0, logger_1.webview)('\u26a0\ufe0f [STATE] Invalid state structure:', stateObj);
                return;
            }
            const terminalState = state;
            const isInitialStateSync = !this.deps.getHasProcessedInitialState();
            (0, logger_1.webview)('\ud83d\udd04 [STATE] Processing state update:', {
                terminals: terminalState.terminals.length,
                availableSlots: terminalState.availableSlots,
                maxTerminals: terminalState.maxTerminals,
                activeTerminalId: terminalState.activeTerminalId,
            });
            // Handle deletion synchronization FIRST (delegated to coordinator)
            this.deps.terminalOperationsUpdateState(terminalState);
            // 1. Update internal state cache
            this.deps.setCurrentTerminalState({
                terminals: terminalState.terminals,
                activeTerminalId: terminalState.activeTerminalId,
                maxTerminals: terminalState.maxTerminals,
                availableSlots: terminalState.availableSlots,
            });
            const currentState = this.deps.getCurrentTerminalState();
            // 2. Update UI state immediately
            this.updateUIFromState(currentState);
            // 2.5. Ensure split resizers appear on initial split display
            this.deps.ensureSplitResizersOnInitialDisplay(terminalState, isInitialStateSync);
            // 3. Update terminal creation availability
            this.updateTerminalCreationState();
            // 4. Debug visualization (if enabled)
            this.updateDebugDisplay(currentState);
            // 5. Process any pending creation requests (delegated to coordinator)
            if (this.deps.hasPendingCreations()) {
                (0, logger_1.webview)(`\ud83d\udd04 [QUEUE] State updated, processing ${this.deps.getPendingCreationsCount()} pending requests`);
                setTimeout(() => this.deps.processPendingCreationRequests(), 50);
            }
            this.deps.setHasProcessedInitialState(true);
            (0, logger_1.webview)('\u2705 [STATE] State update completed successfully');
        }
        catch (error) {
            (0, logger_1.webview)('\u274c [STATE] Error processing state update:', error);
        }
    }
    /**
     * Update UI elements based on current terminal state
     * Delegates to TerminalStateDisplayManager
     */
    updateUIFromState(state) {
        this.deps.updateFromState(state);
    }
    /**
     * Update terminal creation button state and messaging
     * Delegates to TerminalStateDisplayManager
     */
    updateTerminalCreationState() {
        const currentState = this.deps.getCurrentTerminalState();
        if (!currentState) {
            return;
        }
        this.deps.updateCreationState(currentState);
    }
    /**
     * Update debug display with current state information
     * Delegates to DebugCoordinator
     */
    updateDebugDisplay(state) {
        this.deps.debugUpdateDisplay(state, 'state-update');
    }
    /**
     * Show terminal limit reached message
     * Delegates to DebugCoordinator
     */
    showTerminalLimitMessage(current, max) {
        const currentState = this.deps.getCurrentTerminalState();
        if (currentState) {
            this.deps.updateCreationState(currentState);
        }
        else {
            this.deps.debugShowTerminalLimitMessage(current, max);
        }
    }
    /**
     * Request latest state from Extension
     */
    requestLatestState() {
        (0, logger_1.webview)('\ud83d\udce1 [STATE] Requesting latest state from Extension...');
        this.deps.postMessageToExtension({
            command: 'requestState',
            timestamp: Date.now(),
        });
    }
    /**
     * Get current cached state
     */
    getCurrentCachedState() {
        return this.deps.getCurrentTerminalState();
    }
    /**
     * Check if the system is in a safe state for operations
     */
    isSystemReady() {
        const hasCachedState = !!this.deps.getCurrentTerminalState();
        const noPendingDeletions = !this.deps.hasPendingDeletions();
        const noPendingCreations = !this.deps.hasPendingCreations();
        return hasCachedState && noPendingDeletions && noPendingCreations;
    }
    /**
     * Get system status for external monitoring
     */
    getSystemStatus() {
        return {
            ready: this.isSystemReady(),
            state: this.deps.getCurrentTerminalState(),
            pendingOperations: {
                deletions: this.deps.getPendingDeletions(),
                creations: this.deps.getPendingCreationsCount(),
            },
        };
    }
}
exports.TerminalStateCoordinator = TerminalStateCoordinator;
//# sourceMappingURL=TerminalStateCoordinator.js.map