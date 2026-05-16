"use strict";
/**
 * DebugCoordinator
 *
 * Debug and diagnostics methods extracted from LightweightTerminalWebviewManager.
 * Handles debug panel, diagnostics export, and manager stats aggregation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugCoordinator = void 0;
const logger_1 = require("../../utils/logger");
class DebugCoordinator {
    constructor(deps) {
        this.deps = deps;
    }
    /**
     * Update debug display with current state information
     */
    updateDebugDisplay(state, operation) {
        if (operation) {
            (0, logger_1.webview)(`🔍 [DEBUG] Display update triggered by: ${operation}`);
        }
        this.deps.debugPanelManager.updateDisplay(state, operation);
    }
    /**
     * Toggle debug panel visibility
     */
    toggleDebugPanel(currentState) {
        this.deps.debugPanelManager.toggle(currentState);
        if (this.deps.debugPanelManager.isActive() && !currentState) {
            this.deps.requestLatestState();
        }
    }
    /**
     * Export system diagnostics for troubleshooting
     */
    exportSystemDiagnostics(maxTerminals) {
        const diagnostics = this.deps.debugPanelManager.exportDiagnostics(this.deps.getSystemStatus(), maxTerminals);
        (0, logger_1.webview)('🔧 [DIAGNOSTICS] System diagnostics exported:', diagnostics);
        return diagnostics;
    }
    /**
     * Get aggregated manager statistics
     */
    getManagerStats() {
        return {
            terminals: this.deps.getTerminalStats(),
            cliAgents: this.deps.getAgentStats(),
            events: this.deps.getEventStats(),
            api: this.deps.getApiDiagnostics(),
        };
    }
    /**
     * Show terminal limit reached message
     */
    showTerminalLimitMessage(current, max) {
        const message = `Terminal limit reached (${current}/${max}). Delete a terminal to create new ones.`;
        this.deps.showWarning(message);
    }
}
exports.DebugCoordinator = DebugCoordinator;
//# sourceMappingURL=DebugCoordinator.js.map