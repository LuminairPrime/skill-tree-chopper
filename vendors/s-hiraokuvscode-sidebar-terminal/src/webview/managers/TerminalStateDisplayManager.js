"use strict";
/**
 * Terminal State Display Manager
 *
 * Handles UI updates based on terminal state changes.
 * Extracted from LightweightTerminalWebviewManager for better separation of concerns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalStateDisplayManager = void 0;
const logger_1 = require("../../utils/logger");
class TerminalStateDisplayManager {
    constructor(uiManager, notificationManager, terminalTabManager, terminalContainerManager) {
        this.uiManager = uiManager;
        this.notificationManager = notificationManager;
        this.terminalTabManager = terminalTabManager;
        this.terminalContainerManager = terminalContainerManager;
    }
    /**
     * Update all UI elements based on terminal state
     */
    updateFromState(state) {
        try {
            // Sync terminal container order
            this.syncContainerOrder(state);
            // Update count display
            this.updateTerminalCount(state.terminals.length, state.maxTerminals);
            // Update available slots
            this.updateAvailableSlots(state.availableSlots);
            // Highlight active terminal
            if (state.activeTerminalId) {
                this.highlightActive(state.activeTerminalId);
            }
            // Sync tabs
            this.syncTabs(state);
            // Sync header colors
            this.syncHeaderIndicatorColors(state);
            (0, logger_1.webview)(`🎨 [UI] Updated: ${state.terminals.length}/${state.maxTerminals} terminals`);
        }
        catch (error) {
            (0, logger_1.webview)('❌ [UI] Error updating from state:', error);
        }
    }
    /**
     * Update terminal creation button state
     */
    updateCreationState(state) {
        const canCreate = state.availableSlots.length > 0;
        const currentCount = state.terminals.length;
        const maxCount = state.maxTerminals;
        this.setCreateButtonEnabled(canCreate);
        if (!canCreate) {
            this.showLimitMessage(currentCount, maxCount);
        }
        else {
            this.clearLimitMessage();
        }
        (0, logger_1.webview)(`🎯 [CREATION] ${canCreate ? 'ENABLED' : 'DISABLED'} (${currentCount}/${maxCount})`);
    }
    syncContainerOrder(state) {
        if (!this.terminalContainerManager)
            return;
        const terminalOrder = state.terminals.map((t) => t.id);
        if (terminalOrder.length > 0) {
            this.terminalContainerManager.reorderContainers(terminalOrder);
            (0, logger_1.webview)(`🔄 [STATE] Synced container order:`, terminalOrder);
        }
    }
    updateTerminalCount(current, max) {
        const elements = document.querySelectorAll('[data-terminal-count]');
        elements.forEach((el) => {
            el.textContent = `${current}/${max}`;
        });
    }
    updateAvailableSlots(slots) {
        const elements = document.querySelectorAll('[data-available-slots]');
        elements.forEach((el) => {
            el.textContent = slots.length > 0 ? `Available: ${slots.join(', ')}` : 'No slots available';
        });
    }
    highlightActive(terminalId) {
        // Remove previous highlighting
        document.querySelectorAll('.terminal-container.active').forEach((el) => {
            el.classList.remove('active');
        });
        // Add to current
        const container = document.querySelector(`[data-terminal-id="${terminalId}"]`);
        if (container) {
            container.classList.add('active');
        }
        this.uiManager.updateSplitTerminalBorders(terminalId);
    }
    setCreateButtonEnabled(enabled) {
        const buttons = document.querySelectorAll('[data-action="create-terminal"]');
        buttons.forEach((btn) => {
            if (btn instanceof HTMLButtonElement) {
                btn.disabled = !enabled;
                btn.title = enabled ? 'Create new terminal' : 'Maximum terminals reached';
            }
        });
    }
    showLimitMessage(current, max) {
        const message = `Terminal limit reached (${current}/${max}). Delete a terminal to create new ones.`;
        if (this.notificationManager) {
            this.notificationManager.showWarning(message);
        }
        const elements = document.querySelectorAll('[data-terminal-status]');
        elements.forEach((el) => {
            el.textContent = message;
            el.className = 'terminal-status warning';
        });
    }
    clearLimitMessage() {
        if (this.notificationManager) {
            this.notificationManager.clearWarnings();
        }
        const elements = document.querySelectorAll('[data-terminal-status]');
        elements.forEach((el) => {
            el.textContent = '';
            el.className = 'terminal-status';
        });
    }
    syncTabs(state) {
        if (!this.terminalTabManager)
            return;
        // 🔧 FIX: Filter out terminals that are pending deletion to prevent race conditions
        // This prevents deleted tabs from being re-added during state sync
        const filteredTerminals = state.terminals.filter((terminal) => !this.terminalTabManager.hasPendingDeletion(terminal.id));
        const pendingDeletions = this.terminalTabManager.getPendingDeletions();
        if (pendingDeletions.size > 0) {
            (0, logger_1.webview)(`🔄 [SYNC-TABS] Filtering ${pendingDeletions.size} pending deletions:`, Array.from(pendingDeletions));
        }
        this.terminalTabManager.syncTabs(filteredTerminals.map((terminal) => ({
            id: terminal.id,
            name: terminal.name,
            isActive: terminal.isActive,
            isClosable: filteredTerminals.length > 1,
        })));
    }
    syncHeaderIndicatorColors(state) {
        state.terminals.forEach((terminal) => {
            this.uiManager.updateTerminalHeader(terminal.id, terminal.name, terminal.indicatorColor);
        });
    }
}
exports.TerminalStateDisplayManager = TerminalStateDisplayManager;
//# sourceMappingURL=TerminalStateDisplayManager.js.map