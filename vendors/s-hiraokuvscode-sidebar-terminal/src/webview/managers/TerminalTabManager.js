"use strict";
/**
 * Terminal Tab Manager
 * Manages terminal tabs with VS Code-style behavior
 * - Tab creation, switching, and closing
 * - Drag & drop reordering
 * - Tab state persistence
 *
 * Event coordination is delegated to TabEventCoordinator.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalTabManager = void 0;
const TerminalTabList_1 = require("../components/TerminalTabList");
const logger_1 = require("../../utils/logger");
const arrayUtils_1 = require("../../utils/arrayUtils");
const TabEventCoordinator_1 = require("./TabEventCoordinator");
/**
 * Terminal Tab Manager
 * Coordinates terminal tabs with the main terminal system
 */
class TerminalTabManager {
    constructor() {
        this.coordinator = null;
        this.tabList = null;
        this.tabContainer = null;
        this.tabs = new Map();
        this.tabOrder = [];
        this.isEnabled = true;
        this.hideWhenSingleTab = true;
        this.isInitialized = false;
        this.currentDisplayMode = 'normal';
        // 🔧 FIX: Track tabs being deleted to prevent race conditions with syncTabs
        this.pendingDeletions = new Set();
        // 🔧 FIX: Track tabs being created to prevent duplicate additions
        this.pendingCreations = new Set();
        /**
         * TerminalTabEvents implementation - delegated to TabEventCoordinator
         */
        this.onTabClick = (tabId) => {
            this.eventCoordinator.onTabClick(tabId);
        };
        this.onTabClose = (tabId) => {
            this.eventCoordinator.onTabClose(tabId);
        };
        this.onTabRename = (tabId, newName) => {
            // Update local tab state, then delegate to coordinator for extension notification
            const tab = this.tabs.get(tabId);
            if (tab) {
                tab.name = newName;
                this.updateTab(tabId, { name: newName });
            }
            this.eventCoordinator.onTabRename(tabId, newName);
        };
        this.onTabReorder = (fromIndex, toIndex, nextOrder) => {
            this.eventCoordinator.onTabReorder(fromIndex, toIndex, nextOrder);
        };
        this.onNewTab = () => {
            this.eventCoordinator.onNewTab();
        };
        this.onModeToggle = () => {
            this.eventCoordinator.onModeToggle();
        };
        this.eventCoordinator = new TabEventCoordinator_1.TabEventCoordinator({
            getCoordinator: () => this.coordinator,
            getTabCount: () => this.tabs.size,
            getTabOrder: () => this.tabOrder,
            hasTab: (tabId) => this.tabs.has(tabId),
            setActiveTab: (tabId) => this.setActiveTab(tabId),
            setTabOrder: (order) => {
                this.tabOrder = order;
            },
            rebuildTabsInOrder: () => this.rebuildTabsInOrder(),
            hasPendingDeletion: (tabId) => this.pendingDeletions.has(tabId),
            addPendingDeletion: (tabId) => this.pendingDeletions.add(tabId),
        });
        this.eventCoordinator.setActiveTabIdGetter(() => this.getActiveTabId());
    }
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
    }
    /**
     * Initialize tab system
     */
    initialize() {
        this.ensureInitialized();
    }
    ensureInitialized() {
        if (this.isInitialized) {
            return;
        }
        this.setupTabContainer();
        if (!this.tabContainer) {
            console.warn('TerminalTabManager: Tab container not yet available');
            return;
        }
        if (!this.tabList) {
            this.tabList = new TerminalTabList_1.TerminalTabList(this.tabContainer, this);
            this.tabList.setModeIndicator(this.currentDisplayMode);
        }
        this.isInitialized = true;
        this.updateTabVisibility();
        (0, logger_1.webview)('[Tabs] Terminal Tab Manager initialized');
    }
    setupTabContainer() {
        const terminalBody = document.getElementById('terminal-body');
        if (!terminalBody) {
            console.warn('TerminalTabManager: terminal-body not found, tabs will be created later');
            return;
        }
        // Check for existing container
        const existing = document.getElementById('terminal-tabs-container');
        if (existing) {
            // 🔧 FIX: Only reuse if this is our container (check for marker attribute)
            if (existing.hasAttribute('data-tab-manager-initialized')) {
                // Already initialized by this manager, just use it
                this.tabContainer = existing;
                (0, logger_1.webview)('[Tabs] Reusing already initialized tab container');
                return;
            }
            // Container exists but wasn't initialized by us - remove it
            (0, logger_1.webview)('[Tabs] Removing orphaned tab container');
            existing.remove();
        }
        // Create new container
        const container = document.createElement('div');
        container.id = 'terminal-tabs-container';
        container.className = 'terminal-tabs-root';
        container.setAttribute('data-tab-manager-initialized', 'true');
        terminalBody.insertBefore(container, terminalBody.firstChild);
        this.tabContainer = container;
        (0, logger_1.webview)('[Tabs] Tab container created (new)');
    }
    /**
     * Tab management methods
     */
    addTab(terminalId, name, terminal) {
        this.ensureInitialized();
        if (!this.tabList) {
            return;
        }
        if (this.tabs.has(terminalId)) {
            const existing = this.tabs.get(terminalId);
            const updates = {};
            if (existing.name !== name) {
                updates.name = name;
            }
            if (terminal && existing.terminal !== terminal) {
                updates.terminal = terminal;
            }
            if (Object.keys(updates).length > 0) {
                Object.assign(existing, updates);
                this.tabList.updateTab(terminalId, updates);
            }
            (0, logger_1.webview)(`🗂️ Duplicate tab add ignored: ${terminalId}`);
            return;
        }
        const tab = {
            id: terminalId,
            name: name,
            isActive: false,
            isClosable: true,
            terminal: terminal,
            icon: 'terminal',
        };
        this.tabs.set(terminalId, tab);
        // 🔧 FIX: Only push to tabOrder if not already present (defensive)
        if (!this.tabOrder.includes(terminalId)) {
            this.tabOrder.push(terminalId);
        }
        if (this.tabList) {
            this.tabList.addTab(tab);
        }
        this.updateTabVisibility();
        (0, logger_1.webview)(`🗂️ Tab added: ${terminalId} (${name})`);
    }
    removeTab(terminalId) {
        // 🔧 FIX: Check if tab exists and log if already removed
        if (!this.tabs.has(terminalId)) {
            (0, logger_1.webview)(`🗂️ [TAB-REMOVE] Tab already removed or doesn't exist: ${terminalId}`);
            // Clear from pending deletions if it was tracked
            this.pendingDeletions.delete(terminalId);
            return;
        }
        this.ensureInitialized();
        if (!this.tabList) {
            return;
        }
        // 🔧 FIX: Mark as pending deletion before removal
        this.pendingDeletions.add(terminalId);
        (0, logger_1.webview)(`🗂️ [TAB-REMOVE] Starting removal for: ${terminalId}`);
        // 🔧 FIX: Check if this was the active tab BEFORE deleting it
        const removingTab = this.tabs.get(terminalId);
        const wasActive = removingTab?.isActive ?? false;
        // Now delete the tab
        this.tabs.delete(terminalId);
        this.tabOrder = this.tabOrder.filter((id) => id !== terminalId);
        this.tabList.removeTab(terminalId);
        // 🔧 FIX: If this was the active tab, activate another one
        if (wasActive && this.tabs.size > 0) {
            const nextTab = this.tabOrder[0] || Array.from(this.tabs.keys())[0];
            if (nextTab) {
                (0, logger_1.webview)(`🗂️ [TAB-REMOVE] Activating next tab after removal: ${nextTab}`);
                this.setActiveTab(nextTab);
                // Also notify coordinator to switch active terminal
                if (this.coordinator) {
                    this.coordinator.setActiveTerminalId(nextTab);
                }
            }
        }
        this.updateTabVisibility();
        // 🔧 FIX: Clear pending deletion after a delay to prevent race conditions
        // Extended from 300ms to 500ms to allow for async message processing
        this.eventCoordinator.scheduleTimeout(() => {
            this.pendingDeletions.delete(terminalId);
            (0, logger_1.webview)(`🗂️ [TAB-REMOVE] Deletion tracking cleared for: ${terminalId}`);
        }, 500);
        (0, logger_1.webview)(`🗂️ [TAB-REMOVE] Tab removed: ${terminalId}, remaining tabs: ${this.tabs.size}, wasActive: ${wasActive}`);
    }
    updateTab(terminalId, updates) {
        const tab = this.tabs.get(terminalId);
        if (!tab)
            return;
        Object.assign(tab, updates);
        if (this.tabList) {
            this.tabList.updateTab(terminalId, updates);
        }
    }
    setActiveTab(terminalId) {
        if (!this.tabs.has(terminalId))
            return;
        // Update tab states
        this.tabs.forEach((tab, id) => {
            tab.isActive = id === terminalId;
        });
        if (this.tabList) {
            this.tabList.setActiveTab(terminalId);
        }
        (0, logger_1.webview)(`🗂️ Active tab set: ${terminalId}`);
    }
    getActiveTabId() {
        const activeTab = Array.from(this.tabs.values()).find((tab) => tab.isActive);
        return activeTab?.id || null;
    }
    getActiveTab() {
        return Array.from(this.tabs.values()).find((tab) => tab.isActive);
    }
    getAllTabs() {
        return this.tabOrder.map((id) => this.tabs.get(id)).filter(Boolean);
    }
    updateModeIndicator(mode) {
        this.currentDisplayMode = mode;
        this.ensureInitialized();
        this.tabList?.setModeIndicator(mode);
    }
    /**
     * Set the flex direction of the tab list container
     * @param direction - 'row' for horizontal tabs, 'column' for vertical tabs
     */
    setTabListFlexDirection(direction) {
        this.ensureInitialized();
        this.tabList?.setFlexDirection(direction);
    }
    getTabCount() {
        return this.tabs.size;
    }
    /**
     * Check if a terminal ID is pending deletion
     * Used by TerminalStateDisplayManager to filter out pending deletions from state sync
     */
    hasPendingDeletion(terminalId) {
        return this.pendingDeletions.has(terminalId);
    }
    /**
     * Get all pending deletion IDs
     * Used for debugging and state verification
     */
    getPendingDeletions() {
        return new Set(this.pendingDeletions);
    }
    /**
     * Tab configuration
     */
    setTabsEnabled(enabled) {
        this.isEnabled = enabled;
        this.updateTabVisibility();
    }
    setHideWhenSingleTab(hide) {
        this.hideWhenSingleTab = hide;
        this.updateTabVisibility();
    }
    syncTabs(tabInfos) {
        (0, logger_1.webview)(`🔄 [SYNC-TABS] syncTabs called with ${tabInfos.length} tabs:`, tabInfos.map((t) => t.id));
        (0, logger_1.webview)(`🔄 [SYNC-TABS] Current tabs: ${this.tabs.size}:`, Array.from(this.tabs.keys()));
        (0, logger_1.webview)(`🔄 [SYNC-TABS] Pending deletions: ${this.pendingDeletions.size}:`, Array.from(this.pendingDeletions));
        if (tabInfos.length === 0 && this.tabs.size === 0) {
            return;
        }
        this.ensureInitialized();
        if (!this.tabList) {
            return;
        }
        const incomingIds = new Set(tabInfos.map((tab) => tab.id));
        // 🔧 FIX: Only remove tabs if incoming state has terminals
        // This prevents clearing all tabs when Extension state is stale or empty
        if (tabInfos.length > 0) {
            // Remove tabs that no longer exist
            Array.from(this.tabs.keys()).forEach((tabId) => {
                if (!incomingIds.has(tabId)) {
                    (0, logger_1.webview)(`🔄 [SYNC-TABS] Removing tab not in incoming: ${tabId}`);
                    this.removeTab(tabId);
                }
            });
        }
        else {
            (0, logger_1.webview)(`🔄 [SYNC-TABS] ⚠️ Incoming tabs empty, skipping removal to preserve existing tabs`);
        }
        // Add or update tabs
        tabInfos.forEach((info) => {
            // 🔧 FIX: Skip tabs that are pending deletion to prevent race conditions
            if (this.pendingDeletions.has(info.id)) {
                (0, logger_1.webview)(`🔄 [SYNC-TABS] ⏭️ Skipping tab pending deletion: ${info.id}`);
                return;
            }
            const existing = this.tabs.get(info.id);
            if (!existing) {
                (0, logger_1.webview)(`🔄 [SYNC-TABS] Adding new tab: ${info.id}`);
                const tab = {
                    id: info.id,
                    name: info.name,
                    isActive: info.isActive,
                    isClosable: info.isClosable ?? true,
                    icon: 'terminal',
                    terminal: undefined,
                };
                this.tabs.set(info.id, tab);
                // 🔧 FIX: Only push to tabOrder if not already present
                if (!this.tabOrder.includes(info.id)) {
                    this.tabOrder.push(info.id);
                }
                this.tabList?.addTab(tab);
            }
            else {
                const updates = {};
                if (existing.name !== info.name) {
                    updates.name = info.name;
                }
                if (existing.isActive !== info.isActive) {
                    updates.isActive = info.isActive;
                }
                Object.assign(existing, updates);
                if (Object.keys(updates).length > 0) {
                    this.tabList?.updateTab(info.id, updates);
                }
            }
        });
        // Sync tab order from Extension state
        const newTabOrder = tabInfos.map((info) => info.id);
        if (newTabOrder.length > 0 && !(0, arrayUtils_1.arraysEqual)(this.tabOrder, newTabOrder)) {
            this.tabOrder = newTabOrder;
            this.rebuildTabsInOrder();
            (0, logger_1.webview)('🔄 [TABS] Tab order synced from Extension state:', newTabOrder);
        }
        this.updateTabVisibility();
        const activeTab = tabInfos.find((tab) => tab.isActive);
        if (activeTab) {
            this.setActiveTab(activeTab.id);
        }
        else if (this.tabOrder.length > 0) {
            this.setActiveTab(this.tabOrder[0]);
        }
    }
    updateTabVisibility() {
        if (!this.tabContainer)
            return;
        const shouldShow = this.isEnabled && (this.tabs.size > 1 || !this.hideWhenSingleTab) && this.tabs.size > 0;
        this.tabContainer.style.display = shouldShow ? 'block' : 'none';
    }
    rebuildTabsInOrder() {
        if (!this.tabList)
            return;
        (0, logger_1.webview)(`🔄 [REBUILD] Rebuilding tabs in order: ${this.tabOrder.join(', ')}`);
        // 🔧 FIX: Use reorderTabs method instead of remove/add cycle
        // This prevents duplicate DOM elements from being created
        this.tabList.reorderTabs(this.tabOrder);
    }
    // arraysEqual removed - using shared utility from utils/arrayUtils.ts
    /**
     * Integration with terminal events
     */
    handleTerminalCreated(terminalId, name, terminal) {
        const previousCount = this.tabs.size;
        this.addTab(terminalId, name, terminal);
        const newCount = this.tabs.size;
        (0, logger_1.webview)(`🎯 Terminal created: ${terminalId}, terminals: ${previousCount} → ${newCount}`);
        // Delegate post-creation coordination (active tab, split refresh) to event coordinator
        this.eventCoordinator.handleTerminalCreated(terminalId);
    }
    handleTerminalClosed(terminalId) {
        this.removeTab(terminalId);
    }
    handleTerminalRenamed(terminalId, newName) {
        this.updateTab(terminalId, { name: newName });
    }
    handleTerminalActivated(terminalId) {
        this.setActiveTab(terminalId);
    }
    /**
     * State management
     */
    getState() {
        return {
            tabs: this.getAllTabs(),
            activeTabId: this.getActiveTabId(),
            tabsVisible: this.isEnabled && (this.tabs.size > 1 || !this.hideWhenSingleTab),
        };
    }
    restoreState(state) {
        // This would be called during session restoration
        (0, logger_1.webview)('🗂️ Restoring tab state:', state);
        // Clear current tabs
        this.tabs.clear();
        this.tabOrder = [];
        // Restore tabs
        state.tabs.forEach((tab) => {
            this.tabs.set(tab.id, { ...tab });
            this.tabOrder.push(tab.id);
            if (this.tabList) {
                this.tabList.addTab(tab);
            }
        });
        // Set active tab
        if (state.activeTabId) {
            this.setActiveTab(state.activeTabId);
        }
        this.updateTabVisibility();
    }
    /**
     * Update tab list theme to match terminal theme
     * Ensures tabs are consistent with secondaryTerminal.theme setting
     */
    updateTheme(theme) {
        if (this.tabList) {
            this.tabList.updateTheme(theme);
            (0, logger_1.webview)(`🎨 [TAB-MANAGER] Theme updated`);
        }
    }
    /**
     * Cleanup
     */
    dispose() {
        // Dispose event coordinator (clears its pending timeouts)
        this.eventCoordinator.dispose();
        if (this.tabList) {
            this.tabList.dispose();
            this.tabList = null;
        }
        if (this.tabContainer && this.tabContainer.parentNode) {
            this.tabContainer.parentNode.removeChild(this.tabContainer);
        }
        this.tabs.clear();
        this.tabOrder = [];
        this.pendingDeletions.clear();
        this.pendingCreations.clear();
        this.coordinator = null;
        (0, logger_1.webview)('🗂️ Terminal Tab Manager disposed');
    }
}
exports.TerminalTabManager = TerminalTabManager;
//# sourceMappingURL=TerminalTabManager.js.map