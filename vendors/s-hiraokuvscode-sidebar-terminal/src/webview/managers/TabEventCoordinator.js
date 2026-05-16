"use strict";
/**
 * TabEventCoordinator
 *
 * Handles tab event coordination logic extracted from TerminalTabManager.
 * Responsible for: tab click, close, rename, reorder, new tab, mode toggle,
 * and display mode transition handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabEventCoordinator = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Coordinates tab events with the terminal system and display mode management.
 */
class TabEventCoordinator {
    constructor(deps) {
        this.deps = deps;
        this.pendingTimeouts = new Set();
        this.activeTabIdGetter = null;
        /**
         * TerminalTabEvents implementation
         */
        this.onTabClick = (tabId) => {
            (0, logger_1.webview)(`🗂️ Tab clicked: ${tabId}`);
            const coordinator = this.deps.getCoordinator();
            if (coordinator) {
                coordinator.setActiveTerminalId(tabId);
                this.handleFullscreenModeSwitch(tabId);
            }
            this.deps.setActiveTab(tabId);
        };
        this.onTabClose = (tabId) => {
            (0, logger_1.webview)(`🗂️ Tab close requested: ${tabId}`);
            if (this.deps.hasPendingDeletion(tabId)) {
                (0, logger_1.webview)(`⏭️ [TAB-CLOSE] Deletion already in progress, skipping: ${tabId}`);
                return;
            }
            if (this.deps.getTabCount() <= 1) {
                console.warn('⚠️ Cannot close the last terminal tab');
                this.showNotification('Cannot close the last terminal');
                return;
            }
            this.deps.addPendingDeletion(tabId);
            (0, logger_1.webview)(`🗂️ [TAB-CLOSE] Marked as pending deletion: ${tabId}`);
            this.handleDisplayModeAfterClose(tabId);
            this.closeTerminalSafely(tabId);
        };
        this.onTabRename = (tabId, newName) => {
            (0, logger_1.webview)(`🗂️ Tab rename: ${tabId} -> ${newName}`);
            const coordinator = this.deps.getCoordinator();
            coordinator?.postMessageToExtension({
                command: 'renameTerminal',
                terminalId: tabId,
                newName: newName,
            });
        };
        this.onTabReorder = (fromIndex, toIndex, nextOrder) => {
            (0, logger_1.webview)(`🗂️ Tab reorder: ${fromIndex} -> ${toIndex}`, nextOrder);
            if (!Array.isArray(nextOrder) || nextOrder.length === 0) {
                return;
            }
            const currentOrder = this.deps.getTabOrder();
            const normalizedOrder = nextOrder.filter((id) => this.deps.hasTab(id));
            const remaining = currentOrder.filter((id) => !normalizedOrder.includes(id));
            const finalOrder = [...normalizedOrder, ...remaining];
            if (finalOrder.length === 0) {
                return;
            }
            if (finalOrder.length === currentOrder.length &&
                finalOrder.every((id, index) => currentOrder[index] === id)) {
                return;
            }
            this.deps.setTabOrder(finalOrder);
            this.deps.rebuildTabsInOrder();
            const coordinator = this.deps.getCoordinator();
            if (coordinator) {
                const managers = coordinator.getManagers();
                if (managers.terminalContainer) {
                    managers.terminalContainer.reorderContainers(finalOrder);
                }
                this.refreshSplitModeIfActive();
            }
            if (coordinator && typeof coordinator.postMessageToExtension === 'function') {
                coordinator.postMessageToExtension({
                    command: 'reorderTerminals',
                    order: [...finalOrder],
                });
            }
        };
        this.onNewTab = () => {
            (0, logger_1.webview)('🗂️ New tab requested');
            const coordinator = this.deps.getCoordinator();
            if (!coordinator) {
                return;
            }
            const currentMode = this.getCurrentMode();
            const currentTerminalCount = this.deps.getTabCount();
            const newTerminalId = this.generateTerminalId();
            const terminalName = `Terminal ${currentTerminalCount + 1}`;
            (0, logger_1.webview)(`📊 Current state: mode=${currentMode}, terminals=${currentTerminalCount}`);
            if (currentMode === 'fullscreen' && currentTerminalCount > 0) {
                (0, logger_1.webview)(`🔀 Fullscreen → Split: Showing ${currentTerminalCount} existing terminals first`);
                const displayManager = this.getDisplayManager();
                if (displayManager) {
                    displayManager.showAllTerminalsSplit();
                    this.scheduleTimeout(() => {
                        (0, logger_1.webview)(`➕ Adding new terminal (${currentTerminalCount + 1}/${currentTerminalCount + 1}): ${newTerminalId}`);
                        coordinator.createTerminal(newTerminalId, terminalName);
                    }, 250);
                }
            }
            else {
                (0, logger_1.webview)(`➕ Adding new terminal directly: ${newTerminalId}`);
                coordinator.createTerminal(newTerminalId, terminalName);
            }
        };
        this.onModeToggle = () => {
            (0, logger_1.webview)('🖥️ Mode toggle requested');
            const coordinator = this.deps.getCoordinator();
            if (coordinator) {
                const displayManager = coordinator.getDisplayModeManager?.();
                if (displayManager) {
                    const currentMode = displayManager.getCurrentMode();
                    const activeTabId = this.activeTabIdGetter?.() ?? null;
                    if (currentMode === 'fullscreen' && this.deps.getTabCount() > 1) {
                        (0, logger_1.webview)('🔀 Fullscreen -> Split mode');
                        displayManager.toggleSplitMode();
                    }
                    else if (activeTabId) {
                        (0, logger_1.webview)(`🔍 Switching to fullscreen mode for: ${activeTabId}`);
                        displayManager.showTerminalFullscreen(activeTabId);
                    }
                }
            }
        };
    }
    /**
     * Set a getter for the active tab ID (used by onModeToggle)
     */
    setActiveTabIdGetter(getter) {
        this.activeTabIdGetter = getter;
    }
    /**
     * Schedule a timeout and track it for cleanup
     */
    scheduleTimeout(callback, delay) {
        const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(timeoutId);
            callback();
        }, delay);
        this.pendingTimeouts.add(timeoutId);
        return timeoutId;
    }
    /**
     * Handle terminal creation event - set active tab and refresh split if needed
     */
    handleTerminalCreated(terminalId) {
        this.scheduleTimeout(() => {
            this.deps.setActiveTab(terminalId);
            const currentMode = this.getCurrentMode();
            if (currentMode === 'split') {
                (0, logger_1.webview)(`🔄 Refreshing split layout`);
                this.refreshSplitModeIfActive();
            }
        }, 100);
    }
    // --- Private helpers ---
    getDisplayManager() {
        return this.deps.getCoordinator()?.getDisplayModeManager?.();
    }
    getCurrentMode() {
        return this.getDisplayManager()?.getCurrentMode() ?? null;
    }
    handleFullscreenModeSwitch(terminalId) {
        const displayManager = this.getDisplayManager();
        if (displayManager && displayManager.getCurrentMode() === 'fullscreen') {
            displayManager.showTerminalFullscreen(terminalId);
        }
    }
    handleDisplayModeAfterClose(tabId) {
        const displayManager = this.getDisplayManager();
        const currentMode = this.getCurrentMode();
        const remainingCount = this.deps.getTabCount() - 1;
        if (!displayManager) {
            return;
        }
        if (currentMode === 'fullscreen') {
            this.handleFullscreenModeAfterClose(tabId, remainingCount, displayManager);
        }
        else if (currentMode === 'split') {
            this.handleSplitModeAfterClose(remainingCount, displayManager);
        }
    }
    handleFullscreenModeAfterClose(closedTabId, _remainingCount, displayManager) {
        if (!displayManager) {
            return;
        }
        const tabOrder = this.deps.getTabOrder();
        const remainingTerminalId = tabOrder.find((id) => id !== closedTabId);
        if (remainingTerminalId) {
            this.scheduleTimeout(() => displayManager.showTerminalFullscreen(remainingTerminalId), 50);
        }
        else {
            displayManager.setDisplayMode('normal');
        }
    }
    handleSplitModeAfterClose(remainingCount, displayManager) {
        if (!displayManager) {
            return;
        }
        if (remainingCount === 1) {
            this.scheduleTimeout(() => displayManager.setDisplayMode('normal'), 50);
        }
        else {
            this.scheduleTimeout(() => displayManager.showAllTerminalsSplit(), 50);
        }
    }
    closeTerminalSafely(tabId) {
        const coordinator = this.deps.getCoordinator();
        if (!coordinator) {
            return;
        }
        if ('deleteTerminalSafely' in coordinator) {
            coordinator.deleteTerminalSafely(tabId);
        }
        else {
            coordinator.closeTerminal(tabId);
        }
    }
    showNotification(message) {
        const coordinator = this.deps.getCoordinator();
        if (coordinator) {
            const managers = coordinator.getManagers();
            if (managers.notification) {
                managers.notification.showWarning(message);
            }
        }
    }
    refreshSplitModeIfActive() {
        const displayManager = this.getDisplayManager();
        if (displayManager && displayManager.getCurrentMode() === 'split') {
            this.scheduleTimeout(() => displayManager.showAllTerminalsSplit(), 50);
        }
    }
    generateTerminalId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `terminal-${timestamp}-${random}`;
    }
    /**
     * Cleanup
     */
    dispose() {
        this.pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this.pendingTimeouts.clear();
        this.activeTabIdGetter = null;
    }
}
exports.TabEventCoordinator = TabEventCoordinator;
//# sourceMappingURL=TabEventCoordinator.js.map