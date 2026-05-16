"use strict";
/**
 * Comprehensive test suite for UIController service
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const UIController_1 = require("../../../../../src/webview/services/UIController");
(0, vitest_1.describe)('UIController Service', () => {
    let uiController;
    let mockConfig;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        // Setup JSDOM environment
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
        });
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.HTMLButtonElement = dom.window.HTMLButtonElement;
        global.CustomEvent = dom.window.CustomEvent;
        // Setup DOM environment
        document.body.innerHTML = `
      <div id="terminal-tabs-container"></div>
      <div id="terminal-count-display"></div>
      <div id="system-status-indicator"></div>
      <button id="create-terminal-button"></button>
      <button id="split-terminal-button"></button>
      <div id="notification-container"></div>
      <div id="debug-panel" style="display: none;"></div>
      <button id="debug-toggle-button"></button>
      <div id="cli-agent-status"></div>
      <div id="terminal-area"></div>
    `;
        mockConfig = {
            enableDebugPanel: true,
            enableNotifications: true,
            enableCliAgentStatus: true,
            defaultTheme: {
                '--terminal-background': '#1e1e1e',
                '--terminal-foreground': '#d4d4d4',
            },
            animationDuration: 300,
        };
        uiController = new UIController_1.UIController(mockConfig);
    });
    (0, vitest_1.afterEach)(() => {
        uiController.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize with required UI elements', async () => {
            await uiController.initialize();
            const requiredElements = [
                'terminal-tabs-container',
                'terminal-count-display',
                'system-status-indicator',
                'create-terminal-button',
                'split-terminal-button',
                'notification-container',
            ];
            for (const elementId of requiredElements) {
                const element = document.getElementById(elementId);
                (0, vitest_1.expect)(element).toBeTruthy();
            }
        });
        (0, vitest_1.it)('should create missing elements during initialization', async () => {
            // Remove some elements
            document.getElementById('terminal-tabs-container')?.remove();
            document.getElementById('notification-container')?.remove();
            await uiController.initialize();
            // Should recreate them
            (0, vitest_1.expect)(document.getElementById('terminal-tabs-container')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('notification-container')).toBeTruthy();
        });
        (0, vitest_1.it)('should setup debug panel when enabled', async () => {
            await uiController.initialize();
            const debugPanel = document.getElementById('debug-panel');
            const debugToggle = document.getElementById('debug-toggle-button');
            (0, vitest_1.expect)(debugPanel).toBeTruthy();
            (0, vitest_1.expect)(debugToggle).toBeTruthy();
        });
        (0, vitest_1.it)('should setup CLI agent status when enabled', async () => {
            await uiController.initialize();
            const cliAgentStatus = document.getElementById('cli-agent-status');
            (0, vitest_1.expect)(cliAgentStatus).toBeTruthy();
        });
        (0, vitest_1.it)('should use factory defaults correctly', () => {
            const defaultController = UIController_1.UIControllerFactory.createDefault();
            (0, vitest_1.expect)(defaultController).toBeInstanceOf(UIController_1.UIController);
            defaultController.dispose();
        });
        (0, vitest_1.it)('should use custom configuration', () => {
            const customConfig = {
                enableDebugPanel: false,
                enableNotifications: false,
                enableCliAgentStatus: false,
                defaultTheme: { '--background': '#000' },
                animationDuration: 500,
            };
            const customController = UIController_1.UIControllerFactory.create(customConfig);
            (0, vitest_1.expect)(customController).toBeInstanceOf(UIController_1.UIController);
            customController.dispose();
        });
    });
    (0, vitest_1.describe)('Terminal Tabs Management', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should update terminal tabs display', () => {
            const terminalInfos = [
                { id: 'terminal-1', number: 1, isActive: true },
                { id: 'terminal-2', number: 2, isActive: false },
                { id: 'terminal-3', number: 3, isActive: false },
            ];
            uiController.updateTerminalTabs(terminalInfos);
            const tabsContainer = document.getElementById('terminal-tabs-container');
            (0, vitest_1.expect)(tabsContainer?.children.length).toBe(3);
            const tabs = tabsContainer?.querySelectorAll('.terminal-tab');
            (0, vitest_1.expect)(tabs).toBeTruthy();
            if (tabs) {
                (0, vitest_1.expect)(tabs[0]?.getAttribute('data-terminal-id')).toBe('terminal-1');
                (0, vitest_1.expect)(tabs[1]?.getAttribute('data-terminal-id')).toBe('terminal-2');
                (0, vitest_1.expect)(tabs[2]?.getAttribute('data-terminal-id')).toBe('terminal-3');
            }
        });
        (0, vitest_1.it)('should show active terminal correctly', () => {
            const terminalInfos = [
                { id: 'terminal-1', number: 1, isActive: false },
                { id: 'terminal-2', number: 2, isActive: true },
            ];
            uiController.updateTerminalTabs(terminalInfos);
            const activeTab = document.querySelector('.terminal-tab.active');
            (0, vitest_1.expect)(activeTab?.getAttribute('data-terminal-id')).toBe('terminal-2');
        });
        (0, vitest_1.it)('should handle empty terminal list', () => {
            uiController.updateTerminalTabs([]);
            const tabsContainer = document.getElementById('terminal-tabs-container');
            (0, vitest_1.expect)(tabsContainer?.children.length).toBe(0);
        });
        (0, vitest_1.it)('should emit events when tabs are clicked', () => {
            const eventSpy = vitest_1.vi.spyOn(document, 'dispatchEvent');
            const terminalInfos = [{ id: 'terminal-1', number: 1, isActive: true }];
            uiController.updateTerminalTabs(terminalInfos);
            const tab = document.querySelector('.terminal-tab');
            tab.click();
            (0, vitest_1.expect)(eventSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should emit close events when close button clicked', () => {
            const eventSpy = vitest_1.vi.spyOn(document, 'dispatchEvent');
            const terminalInfos = [{ id: 'terminal-1', number: 1, isActive: true }];
            uiController.updateTerminalTabs(terminalInfos);
            const closeButton = document.querySelector('.tab-close');
            closeButton.click();
            (0, vitest_1.expect)(eventSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update active terminal indicator when terminalId is undefined', () => {
            const terminalInfos = [{ id: 'terminal-1', number: 1, isActive: true }];
            uiController.updateTerminalTabs(terminalInfos);
            uiController.updateActiveTerminalIndicator(undefined);
            const activeTab = document.querySelector('.terminal-tab.active');
            (0, vitest_1.expect)(activeTab).toBeFalsy();
        });
    });
    (0, vitest_1.describe)('System Status Management', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should update system status indicator', () => {
            uiController.updateSystemStatus('BUSY');
            const indicator = document.getElementById('system-status-indicator');
            (0, vitest_1.expect)(indicator?.textContent).toBe('BUSY');
            (0, vitest_1.expect)(indicator?.className).toContain('status-busy');
        });
        (0, vitest_1.it)('should handle different status types', () => {
            const statuses = ['READY', 'BUSY', 'ERROR'];
            for (const status of statuses) {
                uiController.updateSystemStatus(status);
                const indicator = document.getElementById('system-status-indicator');
                (0, vitest_1.expect)(indicator?.textContent).toBe(status);
                (0, vitest_1.expect)(indicator?.className).toContain(`status-${status.toLowerCase()}`);
            }
        });
        (0, vitest_1.it)('should update terminal count display', () => {
            uiController.updateTerminalCountDisplay(3, 5);
            const display = document.getElementById('terminal-count-display');
            (0, vitest_1.expect)(display?.textContent).toBe('3/5');
            (0, vitest_1.expect)(display?.className).toContain('terminal-count-normal');
        });
        (0, vitest_1.it)('should show full state when at capacity', () => {
            uiController.updateTerminalCountDisplay(5, 5);
            const display = document.getElementById('terminal-count-display');
            (0, vitest_1.expect)(display?.textContent).toBe('5/5');
            (0, vitest_1.expect)(display?.className).toContain('terminal-count-full');
        });
    });
    (0, vitest_1.describe)('Terminal Container Management', () => {
        let mockContainer;
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
            mockContainer = document.createElement('div');
            mockContainer.id = 'terminal-container-test';
            mockContainer.className = 'terminal-container';
            mockContainer.style.display = 'none';
        });
        (0, vitest_1.it)('should show terminal container', () => {
            uiController.showTerminalContainer('test', mockContainer);
            (0, vitest_1.expect)(mockContainer.style.display).toBe('block');
            const terminalArea = document.getElementById('terminal-area');
            (0, vitest_1.expect)(terminalArea?.contains(mockContainer)).toBe(true);
        });
        (0, vitest_1.it)('should hide other containers when showing one', () => {
            // Create additional containers
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.style.display = 'block';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.style.display = 'block';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            uiController.showTerminalContainer('test', mockContainer);
            (0, vitest_1.expect)(container1.style.display).toBe('none');
            (0, vitest_1.expect)(container2.style.display).toBe('none');
            (0, vitest_1.expect)(mockContainer.style.display).toBe('block');
        });
        (0, vitest_1.it)('should hide terminal container', () => {
            mockContainer.style.display = 'block';
            document.body.appendChild(mockContainer);
            uiController.hideTerminalContainer('test');
            const container = document.getElementById('terminal-container-test');
            (0, vitest_1.expect)(container?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should highlight active terminal', () => {
            mockContainer.id = 'terminal-container-active-test';
            document.body.appendChild(mockContainer);
            uiController.highlightActiveTerminal('active-test');
            (0, vitest_1.expect)(mockContainer.classList.contains('active-terminal')).toBe(true);
        });
        (0, vitest_1.it)('should handle terminal container not in terminal area', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            uiController.showTerminalContainer('test-3', container);
            const terminalArea = document.getElementById('terminal-area');
            (0, vitest_1.expect)(terminalArea?.contains(container)).toBe(true);
        });
        (0, vitest_1.it)('should handle missing terminal area gracefully', () => {
            document.getElementById('terminal-area')?.remove();
            const container = document.createElement('div');
            container.className = 'terminal-container';
            uiController.showTerminalContainer('test-4', container);
            // Should not throw
        });
    });
    (0, vitest_1.describe)('Control Elements', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should enable/disable create button', () => {
            const button = document.getElementById('create-terminal-button');
            uiController.setCreateButtonEnabled(false);
            (0, vitest_1.expect)(button.disabled).toBe(true);
            (0, vitest_1.expect)(button.className).toContain('button-disabled');
            uiController.setCreateButtonEnabled(true);
            (0, vitest_1.expect)(button.disabled).toBe(false);
            (0, vitest_1.expect)(button.className).toContain('button-enabled');
        });
        (0, vitest_1.it)('should show/hide split button', () => {
            const button = document.getElementById('split-terminal-button');
            uiController.updateSplitButtonVisibility(false);
            (0, vitest_1.expect)(button?.style.display).toBe('none');
            uiController.updateSplitButtonVisibility(true);
            (0, vitest_1.expect)(button?.style.display).toBe('block');
        });
        (0, vitest_1.it)('should show terminal limit message', () => {
            uiController.showTerminalLimitMessage(5, 5);
            const notification = document.querySelector('.notification');
            (0, vitest_1.expect)(notification).toBeTruthy();
            (0, vitest_1.expect)(notification?.textContent).toContain('Terminal limit reached');
            (0, vitest_1.expect)(notification?.textContent).toContain('5/5');
        });
        (0, vitest_1.it)('should clear terminal limit message', () => {
            uiController.showTerminalLimitMessage(5, 5);
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeTruthy();
            uiController.clearTerminalLimitMessage();
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
        });
    });
    (0, vitest_1.describe)('Debug Panel', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should toggle debug panel visibility', () => {
            const debugPanel = document.getElementById('debug-panel');
            uiController.toggleDebugPanel();
            (0, vitest_1.expect)(debugPanel?.style.display).toBe('block');
            uiController.toggleDebugPanel();
            (0, vitest_1.expect)(debugPanel?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should update debug info', () => {
            const debugInfo = {
                systemStatus: 'READY',
                activeTerminal: 'terminal-1',
                terminalCount: 3,
                availableSlots: 2,
                uptime: '5 minutes',
                performanceMetrics: {
                    memoryUsage: 50,
                    cpuUsage: 25,
                    renderFrames: 60,
                    averageResponseTime: 10,
                    bufferSize: 1024,
                },
                pendingOperations: ['create-terminal', 'delete-terminal'],
            };
            uiController.updateDebugInfo(debugInfo);
            const debugPanel = document.getElementById('debug-panel');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('READY');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('terminal-1');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('3');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('2');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('5 minutes');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('create-terminal');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('delete-terminal');
        });
        (0, vitest_1.it)('should handle empty pending operations', () => {
            const debugInfo = {
                systemStatus: 'READY',
                activeTerminal: undefined,
                terminalCount: 0,
                availableSlots: 5,
                uptime: '0 seconds',
                performanceMetrics: {
                    memoryUsage: 30,
                    cpuUsage: 15,
                    renderFrames: 60,
                    averageResponseTime: 8,
                    bufferSize: 512,
                },
                pendingOperations: [],
            };
            uiController.updateDebugInfo(debugInfo);
            const debugPanel = document.getElementById('debug-panel');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('None');
            (0, vitest_1.expect)(debugPanel?.innerHTML).toContain('0');
        });
        (0, vitest_1.it)('should export system diagnostics', () => {
            const createElementSpy = vitest_1.vi.spyOn(document, 'createElement');
            const clickSpy = vitest_1.vi.fn();
            // Mock the created anchor element
            createElementSpy.mockImplementation((tagName) => {
                if (tagName === 'a') {
                    return {
                        href: '',
                        download: '',
                        click: clickSpy,
                    };
                }
                return dom.window.document.createElement(tagName);
            });
            global.URL = {
                createObjectURL: vitest_1.vi.fn().mockReturnValue('blob:url'),
                revokeObjectURL: vitest_1.vi.fn(),
            };
            global.Blob = vitest_1.vi.fn().mockImplementation(function () {
                return {};
            });
            uiController.exportSystemDiagnostics();
            (0, vitest_1.expect)(clickSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not show debug panel when disabled', async () => {
            const disabledController = new UIController_1.UIController({
                ...mockConfig,
                enableDebugPanel: false,
            });
            await disabledController.initialize();
            disabledController.toggleDebugPanel();
            const debugPanel = document.getElementById('debug-panel');
            (0, vitest_1.expect)(debugPanel?.style.display).not.toBe('block');
            disabledController.dispose();
        });
    });
    (0, vitest_1.describe)('Notifications', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should show notification', () => {
            uiController.showNotification({
                type: 'info',
                message: 'Test notification',
                duration: 5000,
            });
            const notification = document.querySelector('.notification');
            (0, vitest_1.expect)(notification).toBeTruthy();
            (0, vitest_1.expect)(notification?.className).toContain('notification-info');
            (0, vitest_1.expect)(notification?.textContent).toContain('Test notification');
        });
        (0, vitest_1.it)('should show different notification types', () => {
            const types = ['info', 'warning', 'error', 'success'];
            for (const type of types) {
                uiController.showNotification({
                    type,
                    message: `${type} message`,
                    duration: 1000,
                });
                const notification = document.querySelector(`.notification-${type}`);
                (0, vitest_1.expect)(notification).toBeTruthy();
                (0, vitest_1.expect)(notification?.textContent).toContain(`${type} message`);
            }
        });
        (0, vitest_1.it)('should auto-remove notification after duration', async () => {
            vitest_1.vi.useFakeTimers();
            uiController.showNotification({
                type: 'info',
                message: 'Auto-remove test',
                duration: 50,
            });
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeTruthy();
            await vitest_1.vi.advanceTimersByTimeAsync(100);
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should show notification with action buttons', () => {
            const actionSpy = vitest_1.vi.fn();
            uiController.showNotification({
                type: 'info',
                message: 'Test with actions',
                actions: [
                    { label: 'Action 1', action: actionSpy },
                    { label: 'Action 2', action: () => { } },
                ],
            });
            const actions = document.querySelectorAll('.notification-action');
            (0, vitest_1.expect)(actions.length).toBe(2);
            (0, vitest_1.expect)(actions[0]?.textContent).toBe('Action 1');
            actions[0].click();
            (0, vitest_1.expect)(actionSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should close notification when close button clicked', () => {
            uiController.showNotification({
                type: 'info',
                message: 'Closeable notification',
            });
            const closeButton = document.querySelector('.notification-close');
            (0, vitest_1.expect)(closeButton).toBeTruthy();
            closeButton.click();
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
        });
        (0, vitest_1.it)('should clear all notifications', () => {
            uiController.showNotification({
                type: 'info',
                message: 'Notification 1',
            });
            uiController.showNotification({
                type: 'warning',
                message: 'Notification 2',
            });
            (0, vitest_1.expect)(document.querySelectorAll('.notification').length).toBe(2);
            uiController.clearNotifications();
            (0, vitest_1.expect)(document.querySelectorAll('.notification').length).toBe(0);
        });
        (0, vitest_1.it)('should handle notification removal when already removed from DOM', () => {
            uiController.showNotification({ type: 'info', message: 'test' });
            const notification = document.querySelector('.notification');
            notification.remove(); // Manually remove from DOM
            uiController.clearNotifications(); // Should not throw
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
        });
        (0, vitest_1.it)('should not show notifications when disabled', () => {
            const disabledController = new UIController_1.UIController({
                ...mockConfig,
                enableNotifications: false,
            });
            disabledController.showNotification({
                type: 'info',
                message: 'Should not show',
            });
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
            disabledController.dispose();
        });
    });
    (0, vitest_1.describe)('Settings and Theme', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should open settings', () => {
            const eventSpy = vitest_1.vi.spyOn(document, 'dispatchEvent');
            uiController.openSettings();
            (0, vitest_1.expect)(eventSpy).toHaveBeenCalled();
            // @ts-expect-error - test mock type
            const event = eventSpy.mock.calls[0][0];
            (0, vitest_1.expect)(event.type).toBe('settings-open-requested');
        });
        (0, vitest_1.it)('should update theme', () => {
            const theme = {
                '--terminal-background': '#000000',
                '--terminal-foreground': '#ffffff',
                '--custom-property': '#ff0000',
            };
            uiController.updateTheme(theme);
            const root = document.documentElement;
            (0, vitest_1.expect)(root.style.getPropertyValue('--terminal-background')).toBe('#000000');
            (0, vitest_1.expect)(root.style.getPropertyValue('--terminal-foreground')).toBe('#ffffff');
            (0, vitest_1.expect)(root.style.getPropertyValue('--custom-property')).toBe('#ff0000');
        });
        (0, vitest_1.it)('should update font settings', () => {
            uiController.updateFontSettings('Monaco', 16);
            const root = document.documentElement;
            (0, vitest_1.expect)(root.style.getPropertyValue('--terminal-font-family')).toBe('Monaco');
            (0, vitest_1.expect)(root.style.getPropertyValue('--terminal-font-size')).toBe('16px');
        });
    });
    (0, vitest_1.describe)('CLI Agent Status', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should update CLI agent status', () => {
            uiController.updateCliAgentStatus(true, 'Claude Code');
            const status = document.getElementById('cli-agent-status');
            (0, vitest_1.expect)(status?.textContent).toBe('Claude Code Connected');
            (0, vitest_1.expect)(status?.className).toContain('connected');
        });
        (0, vitest_1.it)('should update CLI agent status without agent type', () => {
            uiController.updateCliAgentStatus(true);
            const status = document.getElementById('cli-agent-status');
            (0, vitest_1.expect)(status?.textContent).toBe('CLI Agent Connected');
        });
        (0, vitest_1.it)('should show disconnected status', () => {
            uiController.updateCliAgentStatus(false);
            const status = document.getElementById('cli-agent-status');
            (0, vitest_1.expect)(status?.textContent).toBe('CLI Agent Disconnected');
            (0, vitest_1.expect)(status?.className).toContain('disconnected');
        });
        (0, vitest_1.it)('should show/hide CLI agent indicator', () => {
            const indicator = document.getElementById('cli-agent-status');
            uiController.showCliAgentIndicator(false);
            (0, vitest_1.expect)(indicator?.style.display).toBe('none');
            uiController.showCliAgentIndicator(true);
            (0, vitest_1.expect)(indicator?.style.display).toBe('block');
        });
    });
    (0, vitest_1.describe)('Layout Management', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should update split layout', () => {
            const terminalArea = document.getElementById('terminal-area');
            uiController.updateSplitLayout('horizontal');
            (0, vitest_1.expect)(terminalArea?.className).toContain('layout-horizontal');
            uiController.updateSplitLayout('vertical');
            (0, vitest_1.expect)(terminalArea?.className).toContain('layout-vertical');
            uiController.updateSplitLayout('grid');
            (0, vitest_1.expect)(terminalArea?.className).toContain('layout-grid');
        });
        (0, vitest_1.it)('should resize terminal containers', () => {
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1._terminal = { resize: vitest_1.vi.fn() };
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2._terminal = { resize: vitest_1.vi.fn() };
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            uiController.resizeTerminalContainers(80, 24);
            (0, vitest_1.expect)(container1._terminal.resize).toHaveBeenCalledWith(80, 24);
            (0, vitest_1.expect)(container2._terminal.resize).toHaveBeenCalledWith(80, 24);
        });
        (0, vitest_1.it)('should handle containers without terminal instance during resize', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            document.body.appendChild(container);
            uiController.resizeTerminalContainers(80, 24);
            // Should not throw
        });
    });
    (0, vitest_1.describe)('Loading States', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should show loading state', () => {
            uiController.showLoadingState('Loading terminals...');
            const loadingOverlay = document.querySelector('.loading-overlay');
            (0, vitest_1.expect)(loadingOverlay).toBeTruthy();
            (0, vitest_1.expect)(loadingOverlay?.textContent).toContain('Loading terminals...');
        });
        (0, vitest_1.it)('should hide loading state', () => {
            uiController.showLoadingState('Loading...');
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeTruthy();
            uiController.hideLoadingState();
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeFalsy();
        });
        (0, vitest_1.it)('should replace existing loading state', () => {
            uiController.showLoadingState('Loading 1...');
            uiController.showLoadingState('Loading 2...');
            const loadingOverlays = document.querySelectorAll('.loading-overlay');
            (0, vitest_1.expect)(loadingOverlays.length).toBe(1);
            (0, vitest_1.expect)(loadingOverlays[0]?.textContent).toContain('Loading 2...');
        });
    });
    (0, vitest_1.describe)('Resource Management', () => {
        (0, vitest_1.it)('should dispose cleanly', async () => {
            await uiController.initialize();
            uiController.showNotification({
                type: 'info',
                message: 'Test notification',
            });
            uiController.showLoadingState('Loading...');
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeTruthy();
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeTruthy();
            uiController.dispose();
            (0, vitest_1.expect)(document.querySelector('.notification')).toBeFalsy();
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeFalsy();
        });
        (0, vitest_1.it)('should handle disposal when already disposed', () => {
            uiController.dispose();
            uiController.dispose(); // Should not throw
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should handle missing DOM elements gracefully', () => {
            document.getElementById('terminal-tabs-container')?.remove();
            // Should not throw
            uiController.updateTerminalTabs([{ id: 'terminal-1', number: 1, isActive: true }]);
        });
        (0, vitest_1.it)('should handle invalid configuration gracefully', () => {
            const invalidConfig = {
                enableDebugPanel: 'invalid',
                animationDuration: 'not-a-number',
            };
            const controller = new UIController_1.UIController(invalidConfig);
            (0, vitest_1.expect)(controller).toBeInstanceOf(UIController_1.UIController);
            controller.dispose();
        });
    });
});
//# sourceMappingURL=UIController.test.js.map