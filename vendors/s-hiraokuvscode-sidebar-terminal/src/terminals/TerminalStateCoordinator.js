'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalStateCoordinator = void 0;
const common_1 = require('../utils/common');
/** Manages terminal state and synchronization */
class TerminalStateCoordinator {
  constructor(
    _terminals,
    _activeTerminalManager,
    _stateUpdateEmitter,
    _terminalFocusEmitter,
    _terminalNumberManager
  ) {
    this._terminals = _terminals;
    this._activeTerminalManager = _activeTerminalManager;
    this._stateUpdateEmitter = _stateUpdateEmitter;
    this._terminalFocusEmitter = _terminalFocusEmitter;
    this._terminalNumberManager = _terminalNumberManager;
  }
  getCurrentState() {
    const terminals = Array.from(this._terminals.values()).map((terminal) => ({
      id: terminal.id,
      name: terminal.name,
      isActive: terminal.isActive,
      ...(terminal.indicatorColor ? { indicatorColor: terminal.indicatorColor } : {}),
    }));
    return {
      terminals,
      activeTerminalId: this._activeTerminalManager.getActive() || null,
      maxTerminals: (0, common_1.getTerminalConfig)().maxTerminals,
      availableSlots: this.getAvailableSlots(),
    };
  }
  getAvailableSlots() {
    return this._terminalNumberManager.getAvailableSlots(this._terminals);
  }
  notifyStateUpdate() {
    this._stateUpdateEmitter.fire(this.getCurrentState());
  }
  hasActiveTerminal() {
    return this._activeTerminalManager.hasActive();
  }
  getActiveTerminalId() {
    return this._activeTerminalManager.getActive();
  }
  setActiveTerminal(terminalId) {
    const terminal = this._terminals.get(terminalId);
    if (terminal) {
      this.deactivateAllTerminals();
      terminal.isActive = true;
      this._activeTerminalManager.setActive(terminalId);
    }
  }
  /** Focus a terminal without changing CLI Agent status */
  focusTerminal(terminalId) {
    if (this._terminals.has(terminalId)) {
      this._terminalFocusEmitter.fire(terminalId);
    }
  }
  deactivateAllTerminals() {
    for (const term of this._terminals.values()) {
      term.isActive = false;
    }
  }
  updateActiveTerminalAfterRemoval(terminalId) {
    if (this._activeTerminalManager.isActive(terminalId)) {
      const remaining = (0, common_1.getFirstValue)(this._terminals);
      if (remaining) {
        this._activeTerminalManager.setActive(remaining.id);
        remaining.isActive = true;
      } else {
        this._activeTerminalManager.clearActive();
      }
    }
  }
  reorderTerminals(order) {
    if (!Array.isArray(order) || order.length === 0) {
      return;
    }
    const existingEntries = Array.from(this._terminals.entries());
    const existingMap = new Map(existingEntries);
    const normalizedOrder = order.filter((id) => existingMap.has(id));
    const remaining = existingEntries
      .map(([id]) => id)
      .filter((id) => !normalizedOrder.includes(id));
    const finalOrder = [...normalizedOrder, ...remaining];
    if (finalOrder.length === 0) {
      return;
    }
    this._terminals.clear();
    for (const id of finalOrder) {
      const terminal = existingMap.get(id);
      if (terminal) {
        this._terminals.set(id, terminal);
      }
    }
    this.notifyStateUpdate();
  }
  updateTerminalCwd(terminalId, cwd) {
    const terminal = this._terminals.get(terminalId);
    if (terminal) {
      terminal.cwd = cwd;
    }
  }
  renameTerminal(terminalId, newName) {
    return this.updateTerminalHeader(terminalId, { newName });
  }
  updateTerminalHeader(terminalId, updates) {
    const terminal = this._terminals.get(terminalId);
    if (!terminal) {
      return false;
    }
    const hasName = typeof updates.newName === 'string' && updates.newName.trim().length > 0;
    const normalizedIndicatorColor =
      typeof updates.indicatorColor === 'string'
        ? (() => {
            const value = updates.indicatorColor.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
              return value.toUpperCase();
            }
            if (value.toLowerCase() === 'transparent') {
              return 'transparent';
            }
            return undefined;
          })()
        : undefined;
    const hasColor = typeof normalizedIndicatorColor === 'string';
    if (!hasName && !hasColor) {
      return false;
    }
    let changed = false;
    if (hasName) {
      const trimmedName = updates.newName.trim();
      if (terminal.name !== trimmedName) {
        terminal.name = trimmedName;
        changed = true;
      }
    }
    if (hasColor) {
      if (terminal.indicatorColor !== normalizedIndicatorColor) {
        terminal.indicatorColor = normalizedIndicatorColor;
        changed = true;
      }
    }
    if (changed) {
      this.notifyStateUpdate();
    }
    return true;
  }
}
exports.TerminalStateCoordinator = TerminalStateCoordinator;
//# sourceMappingURL=TerminalStateCoordinator.js.map
