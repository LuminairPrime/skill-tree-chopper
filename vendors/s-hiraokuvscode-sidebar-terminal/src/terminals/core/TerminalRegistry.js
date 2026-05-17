'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalRegistry = void 0;
class TerminalRegistry {
  constructor(terminals, activeManager, numberManager) {
    this.terminals = terminals;
    this.activeManager = activeManager;
    this.numberManager = numberManager;
  }
  getAll() {
    return Array.from(this.terminals.values());
  }
  getById(terminalId) {
    return this.terminals.get(terminalId);
  }
  has(terminalId) {
    return this.terminals.has(terminalId);
  }
  set(terminal) {
    this.terminals.set(terminal.id, terminal);
  }
  delete(terminalId) {
    return this.terminals.delete(terminalId);
  }
  clear() {
    this.terminals.clear();
    this.activeManager.clearActive();
  }
  size() {
    return this.terminals.size;
  }
  entries() {
    return this.terminals.entries();
  }
  canCreate() {
    return this.numberManager.canCreate(this.terminals);
  }
  findAvailableNumber() {
    return this.numberManager.findAvailableNumber(this.terminals);
  }
  getAvailableSlots() {
    return this.numberManager.getAvailableSlots(this.terminals);
  }
  setActiveTerminal(terminalId) {
    this.activeManager.setActive(terminalId);
  }
  getActiveTerminalId() {
    return this.activeManager.getActive();
  }
  hasActiveTerminal() {
    return this.activeManager.hasActive();
  }
  deactivateAll() {
    for (const terminal of this.terminals.values()) {
      terminal.isActive = false;
    }
    this.activeManager.clearActive();
  }
  isActive(terminalId) {
    return this.activeManager.isActive(terminalId);
  }
  clearActive() {
    this.activeManager.clearActive();
  }
  getTerminalNumber(terminalId) {
    const terminal = this.terminals.get(terminalId);
    return terminal?.number;
  }
}
exports.TerminalRegistry = TerminalRegistry;
//# sourceMappingURL=TerminalRegistry.js.map
