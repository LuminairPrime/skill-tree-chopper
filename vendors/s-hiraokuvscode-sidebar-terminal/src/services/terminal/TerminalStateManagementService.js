'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalStateManagementService = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
const common_1 = require('../../utils/common');
const TerminalNumberManager_1 = require('../../utils/TerminalNumberManager');
const SystemConstants_1 = require('../../constants/SystemConstants');
const common_2 = require('../../utils/common');
/**
 * Service responsible for terminal state management
 *
 * This service extracts state management logic from TerminalManager to improve:
 * - Single Responsibility: Focus only on terminal state tracking
 * - Testability: Isolated state management logic
 * - Maintainability: Clear separation of state concerns
 * - Reusability: Can be used by other terminal-related components
 */
class TerminalStateManagementService {
  constructor() {
    this._terminals = new Map();
    // Event emitters for state changes
    this._stateUpdateEmitter = new vscode.EventEmitter();
    this._terminalRemovedEmitter = new vscode.EventEmitter();
    this._terminalAddedEmitter = new vscode.EventEmitter();
    // Track terminals being killed to prevent race conditions
    this._terminalBeingKilled = new Set();
    this.onStateUpdate = this._stateUpdateEmitter.event;
    this.onTerminalRemoved = this._terminalRemovedEmitter.event;
    this.onTerminalAdded = this._terminalAddedEmitter.event;
    const config = (0, common_1.getTerminalConfig)();
    this._activeTerminalManager = new common_2.ActiveTerminalManager();
    this._terminalNumberManager = new TerminalNumberManager_1.TerminalNumberManager(
      config.maxTerminals
    );
    (0, logger_1.terminal)('📊 [StateManager] Terminal state management service initialized');
  }
  /**
   * Add a terminal to the state
   */
  addTerminal(terminal) {
    try {
      this._terminals.set(terminal.id, terminal);
      (0, logger_1.terminal)(
        `➕ [StateManager] Terminal added to state: ${terminal.id} (${terminal.name})`
      );
      // Emit events
      this._terminalAddedEmitter.fire(terminal);
      this._notifyStateUpdate();
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error adding terminal to state:`, error);
      throw error;
    }
  }
  /**
   * Remove a terminal from the state
   */
  removeTerminal(terminalId) {
    try {
      const terminal = this._terminals.get(terminalId);
      if (!terminal) {
        (0, logger_1.terminal)(
          `⚠️ [StateManager] Attempted to remove non-existent terminal: ${terminalId}`
        );
        return;
      }
      this._terminals.delete(terminalId);
      this._terminalBeingKilled.delete(terminalId); // Clean up killing tracker
      // Terminal number release handled externally
      if (terminal.number) {
        (0, logger_1.terminal)(
          `🔢 [StateManager] Terminal number ${terminal.number} marked for release for ${terminalId}`
        );
      }
      // Clear active terminal if this was the active one
      if (this._activeTerminalManager.getActive() === terminalId) {
        this._activeTerminalManager.clearActive();
        (0, logger_1.terminal)(`🔄 [StateManager] Cleared active terminal: ${terminalId}`);
      }
      (0, logger_1.terminal)(`🗑️ [StateManager] Terminal removed from state: ${terminalId}`);
      // Emit events
      this._terminalRemovedEmitter.fire(terminalId);
      this._notifyStateUpdate();
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error removing terminal from state:`, error);
      throw error;
    }
  }
  /**
   * Get a terminal by ID
   */
  getTerminal(terminalId) {
    return this._terminals.get(terminalId);
  }
  /**
   * Get all terminals
   */
  getTerminals() {
    return Array.from(this._terminals.values());
  }
  /**
   * Get terminals map (read-only)
   */
  getTerminalsMap() {
    return this._terminals;
  }
  /**
   * Check if a terminal exists
   */
  hasTerminal(terminalId) {
    return this._terminals.has(terminalId);
  }
  /**
   * Get terminal count
   */
  getTerminalCount() {
    return this._terminals.size;
  }
  /**
   * Check if has active terminal
   */
  hasActiveTerminal() {
    return this._activeTerminalManager.hasActive();
  }
  /**
   * Get active terminal ID
   */
  getActiveTerminalId() {
    return this._activeTerminalManager.getActive();
  }
  /**
   * Get active terminal instance
   */
  getActiveTerminal() {
    const activeId = this._activeTerminalManager.getActive();
    return activeId ? this._terminals.get(activeId) : undefined;
  }
  /**
   * Set active terminal
   */
  setActiveTerminal(terminalId) {
    try {
      const terminal = this._terminals.get(terminalId);
      if (!terminal) {
        (0, logger_1.terminal)(
          `⚠️ [StateManager] Cannot set non-existent terminal as active: ${terminalId}`
        );
        return false;
      }
      // Deactivate all terminals
      this._deactivateAllTerminals();
      // Set new active terminal
      terminal.isActive = true;
      this._activeTerminalManager.setActive(terminalId);
      (0, logger_1.terminal)(
        `✅ [StateManager] Set active terminal: ${terminalId} (${terminal.name})`
      );
      this._notifyStateUpdate();
      return true;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error setting active terminal:`, error);
      return false;
    }
  }
  /**
   * Clear active terminal
   */
  clearActiveTerminal() {
    try {
      this._deactivateAllTerminals();
      this._activeTerminalManager.clearActive();
      (0, logger_1.terminal)(`🔄 [StateManager] Active terminal cleared`);
      this._notifyStateUpdate();
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error clearing active terminal:`, error);
    }
  }
  /**
   * Mark terminal as being killed (race condition prevention)
   */
  markTerminalAsBeingKilled(terminalId) {
    this._terminalBeingKilled.add(terminalId);
    (0, logger_1.terminal)(`⚠️ [StateManager] Terminal marked as being killed: ${terminalId}`);
  }
  /**
   * Check if terminal is being killed
   */
  isTerminalBeingKilled(terminalId) {
    return this._terminalBeingKilled.has(terminalId);
  }
  /**
   * Get next available terminal number
   */
  getNextTerminalNumber() {
    const availableSlots = this._terminalNumberManager.getAvailableSlots(this._terminals);
    return availableSlots.length > 0 ? availableSlots[0] : null;
  }
  /**
   * Release a terminal number (handled externally)
   */
  releaseTerminalNumber(number) {
    (0, logger_1.terminal)(
      `🔢 [StateManager] Terminal number ${number} release requested (handled externally)`
    );
  }
  /**
   * Get available terminal slots
   */
  getAvailableSlots() {
    return this._terminalNumberManager.getAvailableSlots(this._terminals);
  }
  /**
   * Get current terminal state
   */
  getCurrentState() {
    try {
      const terminals = Array.from(this._terminals.values()).map((terminal) => ({
        id: terminal.id,
        name: terminal.name,
        isActive: terminal.isActive,
      }));
      const state = {
        terminals,
        activeTerminalId: this._activeTerminalManager.getActive() || null,
        maxTerminals: (0, common_1.getTerminalConfig)().maxTerminals,
        availableSlots: this.getAvailableSlots(),
      };
      return state;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error getting current state:`, error);
      // Return safe fallback state
      return {
        terminals: [],
        activeTerminalId: null,
        maxTerminals: (0, common_1.getTerminalConfig)().maxTerminals,
        availableSlots: [],
      };
    }
  }
  /**
   * Get state statistics for debugging
   */
  getStateStatistics() {
    return {
      terminalCount: this._terminals.size,
      activeTerminalId: this._activeTerminalManager.getActive() || null,
      terminalsBeingKilled: this._terminalBeingKilled.size,
      availableSlots: this._terminalNumberManager.getAvailableSlots(this._terminals),
      usedNumbers: [], // Would need external tracking
      maxTerminals: SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT,
    };
  }
  /**
   * Select next available terminal as active (used after deletion)
   */
  selectNextActiveTerminal() {
    try {
      if (this._terminals.size === 0) {
        (0, logger_1.terminal)(`🔄 [StateManager] No terminals available to set as active`);
        return null;
      }
      const remaining = Array.from(this._terminals.values())[0];
      if (remaining) {
        this.setActiveTerminal(remaining.id);
        return remaining.id;
      }
      return null;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error selecting next active terminal:`, error);
      return null;
    }
  }
  /**
   * Validate terminal deletion (business logic)
   */
  validateDeletion(terminalId) {
    try {
      if (!this.hasTerminal(terminalId)) {
        return { canDelete: false, reason: 'Terminal not found' };
      }
      // Must keep at least 1 terminal open
      if (this._terminals.size <= 1) {
        return { canDelete: false, reason: 'Must keep at least 1 terminal open' };
      }
      return { canDelete: true };
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error validating deletion:`, error);
      return { canDelete: false, reason: `Validation failed: ${String(error)}` };
    }
  }
  /**
   * Deactivate all terminals
   */
  _deactivateAllTerminals() {
    for (const terminal of this._terminals.values()) {
      terminal.isActive = false;
    }
  }
  /**
   * Notify state update to listeners
   */
  _notifyStateUpdate() {
    try {
      const state = this.getCurrentState();
      this._stateUpdateEmitter.fire(state);
      (0, logger_1.terminal)(`📡 [StateManager] State update notification sent`);
    } catch (error) {
      (0, logger_1.terminal)(`❌ [StateManager] Error notifying state update:`, error);
    }
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    (0, logger_1.terminal)('🧹 [StateManager] Disposing terminal state management service');
    try {
      // Clear all state
      this._terminals.clear();
      this._terminalBeingKilled.clear();
      this._activeTerminalManager.clearActive();
      // Dispose event emitters
      this._stateUpdateEmitter.dispose();
      this._terminalRemovedEmitter.dispose();
      this._terminalAddedEmitter.dispose();
      (0, logger_1.terminal)('✅ [StateManager] Terminal state management service disposed');
    } catch (error) {
      (0, logger_1.terminal)(
        '❌ [StateManager] Error disposing terminal state management service:',
        error
      );
    }
  }
}
exports.TerminalStateManagementService = TerminalStateManagementService;
//# sourceMappingURL=TerminalStateManagementService.js.map
