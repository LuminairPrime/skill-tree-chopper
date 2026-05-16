"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TestSetup_1 = require("../../../../shared/TestSetup");
const UIController_1 = require("../../../../../../src/webview/services/UIController");
(0, vitest_1.describe)('UIController', () => {
    let uiController;
    let config;
    let testEnv;
    (0, vitest_1.beforeEach)(() => {
        // Use shared test environment setup
        testEnv = (0, TestSetup_1.setupCompleteTestEnvironment)();
        // Default config
        config = {
            enableDebugPanel: true,
            enableNotifications: true,
            enableCliAgentStatus: true,
            defaultTheme: {},
            animationDuration: 300,
        };
        uiController = new UIController_1.UIController(config);
    });
    (0, vitest_1.afterEach)(() => {
        uiController.dispose();
        // Clean up test environment
        if (testEnv?.dom) {
            testEnv.dom.window.close();
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create required DOM elements on initialization', async () => {
            await uiController.initialize();
            (0, vitest_1.expect)(document.getElementById('terminal-tabs-container')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('terminal-count-display')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('system-status-indicator')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('create-terminal-button')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('split-terminal-button')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('notification-container')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('debug-panel')).toBeTruthy();
            (0, vitest_1.expect)(document.getElementById('cli-agent-status')).toBeTruthy();
        });
        (0, vitest_1.it)('should not create debug panel if disabled', async () => {
            // @ts-expect-error - test mock type
            config.enableDebugPanel = false;
            uiController = new UIController_1.UIController(config);
            await uiController.initialize();
            (0, vitest_1.expect)(document.getElementById('debug-panel')).toBeFalsy();
        });
        (0, vitest_1.it)('should not create cli agent status if disabled', async () => {
            // @ts-expect-error - test mock type
            config.enableCliAgentStatus = false;
            uiController = new UIController_1.UIController(config);
            await uiController.initialize();
            (0, vitest_1.expect)(document.getElementById('cli-agent-status')).toBeFalsy();
        });
    });
    (0, vitest_1.describe)('Terminal Tabs', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should update terminal tabs', () => {
            const terminals = [
                { id: 't1', number: 1, isActive: true },
                { id: 't2', number: 2, isActive: false },
            ];
            uiController.updateTerminalTabs(terminals);
            const tabsContainer = document.getElementById('terminal-tabs-container');
            (0, vitest_1.expect)(tabsContainer?.children.length).toBe(2);
            const tab1 = tabsContainer?.children[0];
            (0, vitest_1.expect)(tab1.getAttribute('data-terminal-id')).toBe('t1');
            (0, vitest_1.expect)(tab1.classList.contains('active')).toBe(true);
            const tab2 = tabsContainer?.children[1];
            (0, vitest_1.expect)(tab2.getAttribute('data-terminal-id')).toBe('t2');
            (0, vitest_1.expect)(tab2.classList.contains('active')).toBe(false);
        });
        (0, vitest_1.it)('should emit switch request when clicking a tab', () => {
            const terminals = [{ id: 't1', number: 1, isActive: false }];
            uiController.updateTerminalTabs(terminals);
            const listener = vitest_1.vi.fn();
            document.addEventListener('terminal-switch-requested', listener);
            const tab = document.querySelector('.terminal-tab');
            tab.click();
            (0, vitest_1.expect)(listener).toHaveBeenCalled();
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(listener.mock.calls[0][0].detail).toEqual({ terminalId: 't1' });
        });
        (0, vitest_1.it)('should emit close request when clicking close button', () => {
            const terminals = [{ id: 't1', number: 1, isActive: false }];
            uiController.updateTerminalTabs(terminals);
            const listener = vitest_1.vi.fn();
            document.addEventListener('terminal-close-requested', listener);
            const closeBtn = document.querySelector('.tab-close');
            closeBtn.click();
            (0, vitest_1.expect)(listener).toHaveBeenCalled();
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(listener.mock.calls[0][0].detail).toEqual({ terminalId: 't1' });
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
            });
            const container = document.getElementById('notification-container');
            (0, vitest_1.expect)(container?.children.length).toBe(1);
            (0, vitest_1.expect)(container?.textContent).toContain('Test notification');
        });
        (0, vitest_1.it)('should remove notification on close click', () => {
            uiController.showNotification({
                type: 'info',
                message: 'Test notification',
            });
            const closeBtn = document.querySelector('.notification-close');
            closeBtn.click();
            const container = document.getElementById('notification-container');
            (0, vitest_1.expect)(container?.children.length).toBe(0);
        });
        (0, vitest_1.it)('should auto-remove notification after duration', () => {
            vitest_1.vi.useFakeTimers();
            uiController.showNotification({
                type: 'info',
                message: 'Test notification',
                duration: 1000,
            });
            const container = document.getElementById('notification-container');
            (0, vitest_1.expect)(container?.children.length).toBe(1);
            vitest_1.vi.advanceTimersByTime(1000);
            (0, vitest_1.expect)(container?.children.length).toBe(0);
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Loading State', () => {
        (0, vitest_1.beforeEach)(async () => {
            await uiController.initialize();
        });
        (0, vitest_1.it)('should show and hide loading state', () => {
            uiController.showLoadingState('Loading...');
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeTruthy();
            (0, vitest_1.expect)(document.querySelector('.loading-message')?.textContent).toBe('Loading...');
            uiController.hideLoadingState();
            (0, vitest_1.expect)(document.querySelector('.loading-overlay')).toBeFalsy();
        });
    });
});
//# sourceMappingURL=UIController.test.js.map