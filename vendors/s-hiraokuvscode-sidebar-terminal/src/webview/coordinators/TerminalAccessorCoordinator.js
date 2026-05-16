"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalAccessorCoordinator = void 0;
class TerminalAccessorCoordinator {
    constructor(deps) {
        this.deps = deps;
    }
    getTerminalInstance(terminalId) {
        return this.deps.getTerminalInstance(terminalId);
    }
    getSerializeAddon(terminalId) {
        return this.deps.getTerminalInstance(terminalId)?.serializeAddon;
    }
    getAllTerminalInstances() {
        return this.deps.getAllTerminalInstances();
    }
    getAllTerminalContainers() {
        return this.deps.getAllTerminalContainers();
    }
    getTerminalElement(terminalId) {
        return this.deps.getTerminalElement(terminalId);
    }
    getManagers() {
        return this.deps.managers;
    }
    getMessageManager() {
        return this.deps.managers.message;
    }
    getTerminalContainerManager() {
        return this.deps.managers.terminalContainer;
    }
    getDisplayModeManager() {
        return this.deps.managers.displayMode;
    }
    getSplitManager() {
        return this.deps.splitManager;
    }
    getTerminal() {
        const activeId = this.deps.getActiveTerminalId();
        if (!activeId) {
            return null;
        }
        return this.deps.getTerminalInstance(activeId)?.terminal ?? null;
    }
    getFitAddon() {
        const activeId = this.deps.getActiveTerminalId();
        if (!activeId) {
            return null;
        }
        return this.deps.getTerminalInstance(activeId)?.fitAddon ?? null;
    }
    getTerminalContainer() {
        const activeId = this.deps.getActiveTerminalId();
        if (!activeId) {
            return null;
        }
        return this.deps.getTerminalInstance(activeId)?.container ?? null;
    }
    getActiveTerminalIdValue() {
        return this.deps.getActiveTerminalId();
    }
}
exports.TerminalAccessorCoordinator = TerminalAccessorCoordinator;
//# sourceMappingURL=TerminalAccessorCoordinator.js.map