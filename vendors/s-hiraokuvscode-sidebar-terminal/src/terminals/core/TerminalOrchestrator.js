"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalOrchestrator = void 0;
const common_1 = require("../../utils/common");
const TerminalNumberManager_1 = require("../../utils/TerminalNumberManager");
/**
 * Central store/orchestrator for managing TerminalInstance lifecycle metadata.
 * Encapsulates terminal bookkeeping (map management, active tracking, number allocation)
 * so higher-level managers can focus on orchestration and side-effects.
 */
class TerminalOrchestrator {
    constructor(maxTerminals) {
        this.terminals = new Map();
        this.activeManager = new common_1.ActiveTerminalManager();
        this.maxTerminals = maxTerminals;
        this.numberManager = new TerminalNumberManager_1.TerminalNumberManager(maxTerminals);
    }
    updateMaxTerminals(maxTerminals) {
        if (maxTerminals !== this.maxTerminals) {
            this.maxTerminals = maxTerminals;
            this.numberManager = new TerminalNumberManager_1.TerminalNumberManager(maxTerminals);
        }
    }
    registerTerminal(terminal, options) {
        this.terminals.set(terminal.id, terminal);
        if (options?.setActive) {
            this.setActiveTerminal(terminal.id);
        }
    }
    hasTerminal(terminalId) {
        return this.terminals.has(terminalId);
    }
    getTerminal(terminalId) {
        return this.terminals.get(terminalId);
    }
    getTerminals() {
        return Array.from(this.terminals.values());
    }
    getTerminalIds() {
        return Array.from(this.terminals.keys());
    }
    entries() {
        return this.terminals.entries();
    }
    values() {
        return this.terminals.values();
    }
    size() {
        return this.terminals.size;
    }
    removeTerminal(terminalId) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            return undefined;
        }
        this.terminals.delete(terminalId);
        if (this.activeManager.isActive(terminalId)) {
            this.clearActiveTerminal();
        }
        return terminal;
    }
    clearTerminals() {
        this.terminals.clear();
        this.clearActiveTerminal();
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
    getTerminalNumber(terminalId) {
        return this.terminals.get(terminalId)?.number;
    }
    findByTerminalNumber(terminalNumber) {
        for (const terminal of this.terminals.values()) {
            if (terminal.number === terminalNumber) {
                return terminal;
            }
        }
        return undefined;
    }
    setActiveTerminal(terminalId) {
        for (const [id, terminal] of this.terminals.entries()) {
            terminal.isActive = id === terminalId;
        }
        this.activeManager.setActive(terminalId);
    }
    deactivateAllTerminals() {
        for (const terminal of this.terminals.values()) {
            terminal.isActive = false;
        }
        this.activeManager.clearActive();
    }
    getActiveTerminalId() {
        return this.activeManager.getActive();
    }
    hasActiveTerminal() {
        return this.activeManager.hasActive();
    }
    isActive(terminalId) {
        return this.activeManager.isActive(terminalId);
    }
    clearActiveTerminal() {
        this.activeManager.clearActive();
    }
    getFirstTerminal() {
        const iterator = this.terminals.values();
        const result = iterator.next();
        return result.done ? undefined : result.value;
    }
}
exports.TerminalOrchestrator = TerminalOrchestrator;
//# sourceMappingURL=TerminalOrchestrator.js.map