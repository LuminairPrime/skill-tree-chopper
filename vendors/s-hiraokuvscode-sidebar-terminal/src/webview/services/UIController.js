"use strict";
/**
 * UI Controller Implementation
 * Handles all visual aspects of the terminal interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIControllerFactory = exports.UIController = void 0;
const BaseManager_1 = require("../managers/BaseManager");
/**
 * DOM Element ID Constants
 */
const ElementIds = {
    TERMINAL_TABS_CONTAINER: 'terminal-tabs-container',
    TERMINAL_COUNT_DISPLAY: 'terminal-count-display',
    SYSTEM_STATUS_INDICATOR: 'system-status-indicator',
    CREATE_TERMINAL_BUTTON: 'create-terminal-button',
    SPLIT_TERMINAL_BUTTON: 'split-terminal-button',
    NOTIFICATION_CONTAINER: 'notification-container',
    DEBUG_PANEL: 'debug-panel',
    DEBUG_TOGGLE_BUTTON: 'debug-toggle-button',
    CLI_AGENT_STATUS: 'cli-agent-status',
    TERMINAL_AREA: 'terminal-area',
    terminalContainer: (id) => `terminal-container-${id}`,
};
/**
 * CSS Class Name Constants
 */
const CssClasses = {
    // Terminal tabs
    TERMINAL_TAB: 'terminal-tab',
    ACTIVE: 'active',
    TAB_NUMBER: 'tab-number',
    TAB_CLOSE: 'tab-close',
    // Terminal count
    TERMINAL_COUNT_FULL: 'terminal-count-full',
    TERMINAL_COUNT_NORMAL: 'terminal-count-normal',
    // System status
    SYSTEM_STATUS: 'system-status',
    statusClass: (status) => `status-${status.toLowerCase()}`,
    // Container
    TERMINAL_CONTAINER: 'terminal-container',
    ACTIVE_TERMINAL: 'active-terminal',
    // Buttons
    BUTTON_ENABLED: 'button-enabled',
    BUTTON_DISABLED: 'button-disabled',
    // Debug
    DEBUG_SECTION: 'debug-section',
    // Notifications
    NOTIFICATION: 'notification',
    notificationType: (type) => `notification-${type}`,
    NOTIFICATION_CONTENT: 'notification-content',
    NOTIFICATION_MESSAGE: 'notification-message',
    NOTIFICATION_CLOSE: 'notification-close',
    NOTIFICATION_ACTIONS: 'notification-actions',
    NOTIFICATION_ACTION: 'notification-action',
    // CLI Agent
    CLI_AGENT_STATUS: 'cli-agent-status',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    // Layout
    TERMINAL_AREA: 'terminal-area',
    layoutClass: (layout) => `layout-${layout}`,
    // Loading
    LOADING_OVERLAY: 'loading-overlay',
    LOADING_CONTENT: 'loading-content',
    LOADING_SPINNER: 'loading-spinner',
    LOADING_MESSAGE: 'loading-message',
};
/**
 * Custom Event Names
 */
const EventNames = {
    TERMINAL_CLOSE_REQUESTED: 'terminal-close-requested',
    TERMINAL_SWITCH_REQUESTED: 'terminal-switch-requested',
    SETTINGS_OPEN_REQUESTED: 'settings-open-requested',
};
/**
 * CSS Custom Property Names
 */
const CssCustomProperties = {
    TERMINAL_FONT_FAMILY: '--terminal-font-family',
    TERMINAL_FONT_SIZE: '--terminal-font-size',
};
/**
 * UI Controller manages all visual elements and interactions
 */
class UIController extends BaseManager_1.BaseManager {
    constructor(config) {
        super('UIController', {
            enableLogging: true,
            enableValidation: true,
            enableErrorRecovery: true,
        });
        this.isDebugPanelVisible = false;
        this.currentNotifications = new Set();
        this.loadingElement = null;
        this.config = config;
    }
    /**
     * Public initialize method to satisfy interface
     */
    async initialize() {
        // Call the base manager initialization
        this.doInitialize();
    }
    doInitialize() {
        this.initializeUIElements();
        this.setupEventHandlers();
        this.logger('UI Controller initialized');
    }
    doDispose() {
        this.clearNotifications();
        this.hideLoadingState();
        this.currentNotifications.clear();
        this.logger('UI Controller disposed');
    }
    initializeUIElements() {
        // Ensure required UI elements exist
        this.ensureElement(ElementIds.TERMINAL_TABS_CONTAINER, 'div');
        this.ensureElement(ElementIds.TERMINAL_COUNT_DISPLAY, 'div');
        this.ensureElement(ElementIds.SYSTEM_STATUS_INDICATOR, 'div');
        this.ensureElement(ElementIds.CREATE_TERMINAL_BUTTON, 'button');
        this.ensureElement(ElementIds.SPLIT_TERMINAL_BUTTON, 'button');
        this.ensureElement(ElementIds.NOTIFICATION_CONTAINER, 'div');
        if (this.config.enableDebugPanel) {
            this.ensureElement(ElementIds.DEBUG_PANEL, 'div');
            this.ensureElement(ElementIds.DEBUG_TOGGLE_BUTTON, 'button');
        }
        if (this.config.enableCliAgentStatus) {
            this.ensureElement(ElementIds.CLI_AGENT_STATUS, 'div');
        }
    }
    ensureElement(id, tagName) {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(tagName);
            element.id = id;
            document.body.appendChild(element);
        }
        return element;
    }
    setupEventHandlers() {
        if (this.config.enableDebugPanel) {
            const debugToggle = document.getElementById(ElementIds.DEBUG_TOGGLE_BUTTON);
            if (debugToggle) {
                debugToggle.addEventListener('click', () => this.toggleDebugPanel());
            }
        }
    }
    // UI State Management
    updateTerminalTabs(terminalInfos) {
        const tabsContainer = document.getElementById(ElementIds.TERMINAL_TABS_CONTAINER);
        if (!tabsContainer)
            return;
        // Clear existing tabs
        tabsContainer.textContent = ''; // Safe: clearing content
        // Create tabs for each terminal
        for (const terminalInfo of terminalInfos) {
            const tab = this.createTerminalTab(terminalInfo);
            tabsContainer.appendChild(tab);
        }
        this.logger(`Updated terminal tabs: ${terminalInfos.length} terminals`);
    }
    createTerminalTab(terminalInfo) {
        const tab = document.createElement('div');
        tab.className = `${CssClasses.TERMINAL_TAB} ${terminalInfo.isActive ? CssClasses.ACTIVE : ''}`;
        tab.setAttribute('data-terminal-id', terminalInfo.id);
        // SECURITY: Build DOM structure safely to prevent XSS
        const numberSpan = document.createElement('span');
        numberSpan.className = CssClasses.TAB_NUMBER;
        numberSpan.textContent = String(terminalInfo.number);
        const closeSpan = document.createElement('span');
        closeSpan.className = CssClasses.TAB_CLOSE;
        closeSpan.setAttribute('data-action', 'close');
        closeSpan.textContent = '×';
        tab.appendChild(numberSpan);
        tab.appendChild(closeSpan);
        // Add click handlers
        tab.addEventListener('click', (e) => {
            const target = e.target;
            if (target.getAttribute('data-action') === 'close') {
                this.emitTerminalCloseRequest(terminalInfo.id);
            }
            else {
                this.emitTerminalSwitchRequest(terminalInfo.id);
            }
        });
        return tab;
    }
    emitTerminalCloseRequest(terminalId) {
        const event = new CustomEvent(EventNames.TERMINAL_CLOSE_REQUESTED, {
            detail: { terminalId },
        });
        document.dispatchEvent(event);
    }
    emitTerminalSwitchRequest(terminalId) {
        const event = new CustomEvent(EventNames.TERMINAL_SWITCH_REQUESTED, {
            detail: { terminalId },
        });
        document.dispatchEvent(event);
    }
    updateActiveTerminalIndicator(terminalId) {
        const tabs = document.querySelectorAll(`.${CssClasses.TERMINAL_TAB}`);
        tabs.forEach((tab) => {
            const tabElement = tab;
            const tabTerminalId = tabElement.getAttribute('data-terminal-id');
            if (tabTerminalId === terminalId) {
                tabElement.classList.add(CssClasses.ACTIVE);
            }
            else {
                tabElement.classList.remove(CssClasses.ACTIVE);
            }
        });
    }
    updateTerminalCountDisplay(count, maxCount) {
        const display = document.getElementById(ElementIds.TERMINAL_COUNT_DISPLAY);
        if (display) {
            display.textContent = `${count}/${maxCount}`;
            display.className =
                count >= maxCount ? CssClasses.TERMINAL_COUNT_FULL : CssClasses.TERMINAL_COUNT_NORMAL;
        }
    }
    updateSystemStatus(status) {
        const indicator = document.getElementById(ElementIds.SYSTEM_STATUS_INDICATOR);
        if (indicator) {
            indicator.textContent = status;
            indicator.className = `${CssClasses.SYSTEM_STATUS} ${CssClasses.statusClass(status)}`;
        }
    }
    // Terminal UI Operations
    showTerminalContainer(terminalId, container) {
        // Hide all other containers
        const allContainers = document.querySelectorAll(`.${CssClasses.TERMINAL_CONTAINER}`);
        allContainers.forEach((c) => {
            c.style.display = 'none';
        });
        // Show the specified container
        container.style.display = 'block';
        // Ensure container is in the terminal area
        const terminalArea = document.getElementById(ElementIds.TERMINAL_AREA);
        if (terminalArea && !terminalArea.contains(container)) {
            terminalArea.appendChild(container);
        }
        this.logger(`Showing terminal container: ${terminalId}`);
    }
    hideTerminalContainer(terminalId) {
        const container = document.getElementById(ElementIds.terminalContainer(terminalId));
        if (container) {
            container.style.display = 'none';
        }
    }
    highlightActiveTerminal(terminalId) {
        // Remove highlight from all containers
        const allContainers = document.querySelectorAll(`.${CssClasses.TERMINAL_CONTAINER}`);
        allContainers.forEach((c) => c.classList.remove(CssClasses.ACTIVE_TERMINAL));
        // Add highlight to active container
        const container = document.getElementById(ElementIds.terminalContainer(terminalId));
        if (container) {
            container.classList.add(CssClasses.ACTIVE_TERMINAL);
        }
    }
    // Control Elements
    setCreateButtonEnabled(enabled) {
        const button = document.getElementById(ElementIds.CREATE_TERMINAL_BUTTON);
        if (button) {
            button.disabled = !enabled;
            button.className = enabled ? CssClasses.BUTTON_ENABLED : CssClasses.BUTTON_DISABLED;
        }
    }
    updateSplitButtonVisibility(visible) {
        const button = document.getElementById(ElementIds.SPLIT_TERMINAL_BUTTON);
        if (button) {
            button.style.display = visible ? 'block' : 'none';
        }
    }
    showTerminalLimitMessage(currentCount, maxCount) {
        this.showNotification({
            type: 'warning',
            message: `Terminal limit reached (${currentCount}/${maxCount}). Close a terminal to create a new one.`,
            duration: 5000,
        });
    }
    clearTerminalLimitMessage() {
        // Remove any limit-related notifications
        this.currentNotifications.forEach((notification) => {
            if (notification.textContent?.includes('Terminal limit reached')) {
                notification.remove();
                this.currentNotifications.delete(notification);
            }
        });
    }
    // Debug Panel
    toggleDebugPanel() {
        if (!this.config.enableDebugPanel)
            return;
        const debugPanel = document.getElementById(ElementIds.DEBUG_PANEL);
        if (debugPanel) {
            this.isDebugPanelVisible = !this.isDebugPanelVisible;
            debugPanel.style.display = this.isDebugPanelVisible ? 'block' : 'none';
            this.logger(`Debug panel ${this.isDebugPanelVisible ? 'shown' : 'hidden'}`);
        }
    }
    updateDebugInfo(debugInfo) {
        if (!this.config.enableDebugPanel)
            return;
        const debugPanel = document.getElementById(ElementIds.DEBUG_PANEL);
        if (debugPanel) {
            // SECURITY: Build DOM structure safely to prevent XSS
            debugPanel.textContent = ''; // Clear existing content
            const h3 = document.createElement('h3');
            h3.textContent = 'Debug Information';
            debugPanel.appendChild(h3);
            // Build debug sections using helper
            const sections = [
                { label: 'System Status', value: debugInfo.systemStatus },
                { label: 'Active Terminal', value: debugInfo.activeTerminal || 'None' },
                { label: 'Terminal Count', value: String(debugInfo.terminalCount) },
                { label: 'Available Slots', value: String(debugInfo.availableSlots) },
                { label: 'Uptime', value: debugInfo.uptime },
            ];
            for (const section of sections) {
                debugPanel.appendChild(this.createDebugSection(section.label, section.value));
            }
            // Pending Operations (special handling for list)
            const opsSection = this.createDebugSection('Pending Operations', String(debugInfo.pendingOperations.length));
            if (debugInfo.pendingOperations.length > 0) {
                const ul = document.createElement('ul');
                for (const op of debugInfo.pendingOperations) {
                    const li = document.createElement('li');
                    li.textContent = op;
                    ul.appendChild(li);
                }
                opsSection.appendChild(ul);
            }
            debugPanel.appendChild(opsSection);
        }
    }
    /**
     * Creates a debug section element with label and value
     */
    createDebugSection(label, value) {
        const section = document.createElement('div');
        section.className = CssClasses.DEBUG_SECTION;
        const labelElement = document.createElement('strong');
        labelElement.textContent = `${label}: `;
        section.appendChild(labelElement);
        section.appendChild(document.createTextNode(value));
        return section;
    }
    exportSystemDiagnostics() {
        // Implementation for exporting diagnostics
        const diagnostics = {
            timestamp: new Date().toISOString(),
            debugPanelVisible: this.isDebugPanelVisible,
            notificationCount: this.currentNotifications.size,
            // Add more diagnostic information as needed
        };
        const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'terminal-diagnostics.json';
        a.click();
        URL.revokeObjectURL(url);
        this.logger('System diagnostics exported');
    }
    // Notifications
    showNotification(options) {
        if (!this.config.enableNotifications)
            return;
        const container = document.getElementById(ElementIds.NOTIFICATION_CONTAINER);
        if (!container)
            return;
        const notification = document.createElement('div');
        notification.className = `${CssClasses.NOTIFICATION} ${CssClasses.notificationType(options.type)}`;
        // SECURITY: Build DOM structure safely to prevent XSS
        const contentDiv = document.createElement('div');
        contentDiv.className = CssClasses.NOTIFICATION_CONTENT;
        const messageSpan = document.createElement('span');
        messageSpan.className = CssClasses.NOTIFICATION_MESSAGE;
        messageSpan.textContent = options.message; // Safe: textContent escapes HTML
        const closeButton = document.createElement('button');
        closeButton.className = CssClasses.NOTIFICATION_CLOSE;
        closeButton.textContent = '×';
        contentDiv.appendChild(messageSpan);
        contentDiv.appendChild(closeButton);
        notification.appendChild(contentDiv);
        // Add close handler
        closeButton.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        // Add action buttons if provided
        if (options.actions) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = CssClasses.NOTIFICATION_ACTIONS;
            for (const action of options.actions) {
                const button = document.createElement('button');
                button.className = CssClasses.NOTIFICATION_ACTION;
                button.textContent = action.label;
                button.addEventListener('click', () => {
                    action.action();
                    this.removeNotification(notification);
                });
                actionsContainer.appendChild(button);
            }
            notification.appendChild(actionsContainer);
        }
        container.appendChild(notification);
        this.currentNotifications.add(notification);
        // Auto-remove after duration
        if (options.duration && options.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, options.duration);
        }
    }
    removeNotification(notification) {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        this.currentNotifications.delete(notification);
    }
    clearNotifications() {
        this.currentNotifications.forEach((notification) => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.currentNotifications.clear();
    }
    // Settings UI
    openSettings() {
        const event = new CustomEvent(EventNames.SETTINGS_OPEN_REQUESTED);
        document.dispatchEvent(event);
    }
    updateTheme(theme) {
        const root = document.documentElement;
        for (const [property, value] of Object.entries(theme)) {
            root.style.setProperty(property, value);
        }
        this.logger('Theme updated');
    }
    updateFontSettings(fontFamily, fontSize) {
        const root = document.documentElement;
        root.style.setProperty(CssCustomProperties.TERMINAL_FONT_FAMILY, fontFamily);
        root.style.setProperty(CssCustomProperties.TERMINAL_FONT_SIZE, `${fontSize}px`);
        this.logger(`Font settings updated: ${fontFamily}, ${fontSize}px`);
    }
    // CLI Agent Status
    updateCliAgentStatus(isConnected, agentType) {
        if (!this.config.enableCliAgentStatus)
            return;
        const statusElement = document.getElementById(ElementIds.CLI_AGENT_STATUS);
        if (statusElement) {
            statusElement.className = `${CssClasses.CLI_AGENT_STATUS} ${isConnected ? CssClasses.CONNECTED : CssClasses.DISCONNECTED}`;
            statusElement.textContent = isConnected
                ? `${agentType || 'CLI Agent'} Connected`
                : 'CLI Agent Disconnected';
        }
    }
    showCliAgentIndicator(visible) {
        const indicator = document.getElementById(ElementIds.CLI_AGENT_STATUS);
        if (indicator) {
            indicator.style.display = visible ? 'block' : 'none';
        }
    }
    // Layout Management
    updateSplitLayout(layout) {
        const terminalArea = document.getElementById(ElementIds.TERMINAL_AREA);
        if (terminalArea) {
            terminalArea.className = `${CssClasses.TERMINAL_AREA} ${CssClasses.layoutClass(layout)}`;
        }
    }
    resizeTerminalContainers(cols, rows) {
        const containers = document.querySelectorAll(`.${CssClasses.TERMINAL_CONTAINER}`);
        containers.forEach((container) => {
            const terminal = container._terminal;
            if (terminal && terminal.resize) {
                terminal.resize(cols, rows);
            }
        });
    }
    // Loading States
    showLoadingState(message) {
        this.hideLoadingState(); // Remove any existing loading state
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = CssClasses.LOADING_OVERLAY;
        // SECURITY: Build DOM structure safely to prevent XSS
        const contentDiv = document.createElement('div');
        contentDiv.className = CssClasses.LOADING_CONTENT;
        const spinnerDiv = document.createElement('div');
        spinnerDiv.className = CssClasses.LOADING_SPINNER;
        const messageDiv = document.createElement('div');
        messageDiv.className = CssClasses.LOADING_MESSAGE;
        messageDiv.textContent = message; // Safe: textContent escapes HTML
        contentDiv.appendChild(spinnerDiv);
        contentDiv.appendChild(messageDiv);
        this.loadingElement.appendChild(contentDiv);
        document.body.appendChild(this.loadingElement);
    }
    hideLoadingState() {
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.removeChild(this.loadingElement);
            this.loadingElement = null;
        }
    }
}
exports.UIController = UIController;
/**
 * Factory for creating UI controllers
 */
class UIControllerFactory {
    static create(config) {
        return new UIController(config);
    }
    static createDefault() {
        const defaultConfig = {
            enableDebugPanel: true,
            enableNotifications: true,
            enableCliAgentStatus: true,
            defaultTheme: {
                '--terminal-background': '#1e1e1e',
                '--terminal-foreground': '#d4d4d4',
            },
            animationDuration: 300,
        };
        return new UIController(defaultConfig);
    }
}
exports.UIControllerFactory = UIControllerFactory;
//# sourceMappingURL=UIController.js.map