"use strict";
/**
 * UIManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const UIManager_1 = require("../../../../../webview/managers/UIManager");
const ResizeManager_1 = require("../../../../../webview/utils/ResizeManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../webview/utils/WebviewThemeUtils', async () => {
    const actual = await vitest_1.vi.importActual('../../../../../webview/utils/WebviewThemeUtils');
    return {
        ...actual,
        getWebviewTheme: vitest_1.vi.fn().mockReturnValue({ background: '#1e1e1e', foreground: '#d4d4d4' }),
    };
});
vitest_1.vi.mock('../../../../../webview/factories/HeaderFactory', () => ({
    HeaderFactory: {
        createTerminalHeader: vitest_1.vi.fn().mockImplementation(({ terminalId, terminalName }) => {
            const container = document.createElement('div');
            container.id = `header-${terminalId}`;
            container.className = 'terminal-header';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'terminal-name';
            nameSpan.textContent = terminalName;
            container.appendChild(nameSpan);
            return { container, nameSpan, titleSection: document.createElement('div') };
        }),
        updateTerminalName: vitest_1.vi.fn().mockImplementation((elements, name) => {
            if (elements.nameSpan)
                elements.nameSpan.textContent = name;
        }),
        insertCliAgentStatus: vitest_1.vi.fn(),
        removeCliAgentStatus: vitest_1.vi.fn(),
        setAiAgentToggleButtonVisibility: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/ResizeManager', () => ({
    ResizeManager: {
        observeResize: vitest_1.vi.fn(),
        unobserveResize: vitest_1.vi.fn(),
    },
}));
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    uiLogger: {
        info: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        lifecycle: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('UIManager', () => {
    let uiManager;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><div id="terminal-container"></div><div id="terminal-body"></div>', {
            url: 'http://localhost',
        });
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        uiManager = new UIManager_1.UIManager();
    });
    (0, vitest_1.afterEach)(() => {
        uiManager.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Theme Management', () => {
        (0, vitest_1.it)('should update theme and notify tab updater', () => {
            // @ts-expect-error - test mock type
            const theme = {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selectionBackground: '#333333',
            };
            const tabUpdater = vitest_1.vi.fn();
            uiManager.setTabThemeUpdater(tabUpdater);
            uiManager.updateTheme(theme);
            (0, vitest_1.expect)(tabUpdater).toHaveBeenCalledWith(theme);
            (0, vitest_1.expect)(uiManager.getCurrentTheme().background).toBe('#000000');
            (0, vitest_1.expect)(uiManager.getCurrentTheme().applied).toBe(true);
        });
        (0, vitest_1.it)('should apply updated theme background to root terminal containers', () => {
            // Given
            // @ts-expect-error - test mock type
            const theme = {
                background: '#003b49',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selectionBackground: '#333333',
            };
            // When
            uiManager.updateTheme(theme);
            // Then
            (0, vitest_1.expect)(document.documentElement.style.getPropertyValue('background-color')).toBe('rgb(0, 59, 73)');
            (0, vitest_1.expect)(document.body.style.getPropertyValue('background-color')).toBe('rgb(0, 59, 73)');
            (0, vitest_1.expect)(document.getElementById('terminal-body')?.style.getPropertyValue('background-color')).toBe('rgb(0, 59, 73)');
            (0, vitest_1.expect)(document.getElementById('terminal-container')?.style.getPropertyValue('background-color')).toBe('rgb(0, 59, 73)');
        });
        (0, vitest_1.it)('should apply theme to terminal instance', () => {
            const mockTerminal = {
                options: {},
                refresh: vitest_1.vi.fn(),
                rows: 24,
                element: document.createElement('div'),
            };
            uiManager.applyTerminalTheme(mockTerminal, {});
            (0, vitest_1.expect)(mockTerminal.options.theme).toBeDefined();
            (0, vitest_1.expect)(mockTerminal.refresh).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Terminal Placeholder', () => {
        (0, vitest_1.it)('should show and hide placeholder', () => {
            uiManager.showTerminalPlaceholder();
            const placeholder = document.getElementById('terminal-placeholder');
            (0, vitest_1.expect)(placeholder).toBeTruthy();
            (0, vitest_1.expect)(placeholder?.style.display).toBe('flex');
            uiManager.hideTerminalPlaceholder();
            (0, vitest_1.expect)(placeholder?.style.display).toBe('none');
        });
    });
    (0, vitest_1.describe)('Header Management', () => {
        (0, vitest_1.it)('should create and cache terminal header', () => {
            const header = uiManager.createTerminalHeader('term-1', 'Test Terminal');
            (0, vitest_1.expect)(header).toBeTruthy();
            (0, vitest_1.expect)(header.id).toBe('header-term-1');
            (0, vitest_1.expect)(uiManager.headerElementsCache.has('term-1')).toBe(true);
        });
        (0, vitest_1.it)('should update terminal header title', () => {
            uiManager.createTerminalHeader('term-1', 'Old Name');
            uiManager.updateTerminalHeader('term-1', 'New Name');
            const elements = uiManager.headerElementsCache.get('term-1');
            (0, vitest_1.expect)(elements?.nameSpan?.textContent).toBe('New Name');
        });
        (0, vitest_1.it)('should remove header from cache', () => {
            uiManager.createTerminalHeader('term-1', 'Test');
            uiManager.removeTerminalHeader('term-1');
            (0, vitest_1.expect)(uiManager.headerElementsCache.has('term-1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Loading Indicator', () => {
        (0, vitest_1.it)('should show and hide loading indicator', () => {
            const indicator = uiManager.showLoadingIndicator('Testing...');
            (0, vitest_1.expect)(document.querySelector('.loading-indicator')).toBeTruthy();
            (0, vitest_1.expect)(indicator.textContent).toContain('Testing...');
            uiManager.hideLoadingIndicator(indicator);
            (0, vitest_1.expect)(document.querySelector('.loading-indicator')).toBeFalsy();
        });
        (0, vitest_1.it)('should hide all indicators if none specified', () => {
            uiManager.showLoadingIndicator('1');
            uiManager.showLoadingIndicator('2');
            (0, vitest_1.expect)(document.querySelectorAll('.loading-indicator').length).toBe(2);
            uiManager.hideLoadingIndicator();
            (0, vitest_1.expect)(document.querySelectorAll('.loading-indicator').length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Focus Indicator', () => {
        (0, vitest_1.it)('should add focus class and remove it after timeout', async () => {
            vitest_1.vi.useFakeTimers();
            const element = document.createElement('div');
            uiManager.addFocusIndicator(element);
            (0, vitest_1.expect)(element.classList.contains('focused')).toBe(true);
            vitest_1.vi.advanceTimersByTime(300);
            (0, vitest_1.expect)(element.classList.contains('focused')).toBe(false);
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Resize Observer', () => {
        (0, vitest_1.it)('should setup resize observer', () => {
            const callback = vitest_1.vi.fn();
            const container = document.createElement('div');
            uiManager.setupResizeObserver(container, callback);
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.observeResize).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Split Separator', () => {
        (0, vitest_1.it)('should create horizontal separator', () => {
            const sep = uiManager.createSplitSeparator('horizontal');
            (0, vitest_1.expect)(sep.className).toContain('split-separator-horizontal');
            (0, vitest_1.expect)(sep.style.height).toBe('4px');
        });
        (0, vitest_1.it)('should create vertical separator', () => {
            const sep = uiManager.createSplitSeparator('vertical');
            (0, vitest_1.expect)(sep.className).toContain('split-separator-vertical');
            (0, vitest_1.expect)(sep.style.width).toBe('4px');
        });
    });
    (0, vitest_1.describe)('Disposal', () => {
        (0, vitest_1.it)('should clean up resources on dispose', () => {
            uiManager.setupResizeObserver(document.createElement('div'), () => { });
            uiManager.dispose();
            (0, vitest_1.expect)(ResizeManager_1.ResizeManager.unobserveResize).toHaveBeenCalled();
            (0, vitest_1.expect)(uiManager.headerElementsCache.size).toBe(0);
        });
        (0, vitest_1.it)('should handle dispose errors gracefully', () => {
            // Setup: create a resize observer to trigger cleanup
            uiManager.setupResizeObserver(document.createElement('div'), () => { });
            // Force an error scenario
            vitest_1.vi.mocked(ResizeManager_1.ResizeManager.unobserveResize).mockImplementationOnce(() => {
                throw new Error('Cleanup error');
            });
            // Should throw the error
            (0, vitest_1.expect)(() => uiManager.dispose()).toThrow('Cleanup error');
        });
    });
    (0, vitest_1.describe)('Border Management', () => {
        (0, vitest_1.it)('should update terminal borders', () => {
            const container1 = document.createElement('div');
            container1.dataset.terminalId = 'term-1';
            const container2 = document.createElement('div');
            container2.dataset.terminalId = 'term-2';
            const allContainers = new Map();
            allContainers.set('term-1', container1);
            allContainers.set('term-2', container2);
            // Should not throw
            uiManager.updateTerminalBorders('term-1', allContainers);
            (0, vitest_1.expect)(container1.classList.contains('active')).toBe(true);
            (0, vitest_1.expect)(container2.classList.contains('inactive')).toBe(true);
        });
        (0, vitest_1.it)('should update split terminal borders', () => {
            document.body.innerHTML = `
        <div class="terminal-container" data-terminal-id="term-1"></div>
        <div class="terminal-container" data-terminal-id="term-2"></div>
      `;
            uiManager.updateSplitTerminalBorders('term-2');
            const containers = document.querySelectorAll('.terminal-container');
            (0, vitest_1.expect)(containers[0].classList.contains('inactive')).toBe(true);
            (0, vitest_1.expect)(containers[1].classList.contains('active')).toBe(true);
        });
        (0, vitest_1.it)('should set active border mode', () => {
            // Should not throw
            uiManager.setActiveBorderMode('always');
            uiManager.setActiveBorderMode('multipleOnly');
            uiManager.setActiveBorderMode('none');
        });
        (0, vitest_1.it)('should set terminal count', () => {
            // Should not throw
            uiManager.setTerminalCount(3);
        });
        (0, vitest_1.it)('should set fullscreen mode', () => {
            // Should not throw
            uiManager.setFullscreenMode(true);
            uiManager.setFullscreenMode(false);
        });
        (0, vitest_1.it)('should update single terminal border', () => {
            const container = document.createElement('div');
            uiManager.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.classList.contains('active')).toBe(true);
            uiManager.updateSingleTerminalBorder(container, false);
            (0, vitest_1.expect)(container.classList.contains('inactive')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Visual Settings', () => {
        (0, vitest_1.it)('should apply all visual settings', () => {
            const mockTerminal = {
                options: {},
                refresh: vitest_1.vi.fn(),
                rows: 24,
                element: document.createElement('div'),
            };
            const settings = {
                theme: 'dark',
                cursor: { style: 'block', blink: true },
                cursorBlink: true,
                scrollback: 1000,
            };
            uiManager.applyAllVisualSettings(mockTerminal, settings);
            (0, vitest_1.expect)(mockTerminal.options.cursorStyle).toBe('block');
            (0, vitest_1.expect)(mockTerminal.options.cursorBlink).toBe(true);
            (0, vitest_1.expect)(mockTerminal.options.scrollback).toBe(1000);
        });
        (0, vitest_1.it)('should apply cursor blink from settings.cursorBlink', () => {
            const mockTerminal = {
                options: {},
                refresh: vitest_1.vi.fn(),
                rows: 24,
                element: document.createElement('div'),
            };
            uiManager.applyAllVisualSettings(mockTerminal, { cursorBlink: false });
            (0, vitest_1.expect)(mockTerminal.options.cursorBlink).toBe(false);
        });
        (0, vitest_1.it)('should apply font settings to terminal', () => {
            const mockTerminal = {
                options: {},
            };
            const fontSettings = {
                fontSize: 16,
                fontFamily: 'Consolas',
                fontWeight: 'normal',
                fontWeightBold: 'bold',
                lineHeight: 1.2,
                letterSpacing: 0,
            };
            uiManager.applyFontSettings(mockTerminal, fontSettings);
            (0, vitest_1.expect)(mockTerminal.options.fontSize).toBe(16);
            (0, vitest_1.expect)(mockTerminal.options.fontFamily).toBe('Consolas');
            (0, vitest_1.expect)(mockTerminal.options.fontWeight).toBe('normal');
            (0, vitest_1.expect)(mockTerminal.options.fontWeightBold).toBe('bold');
            (0, vitest_1.expect)(mockTerminal.options.lineHeight).toBe(1.2);
            (0, vitest_1.expect)(mockTerminal.options.letterSpacing).toBe(0);
        });
        (0, vitest_1.it)('should apply VS Code styling', () => {
            const container = document.createElement('div');
            uiManager.applyVSCodeStyling(container);
            (0, vitest_1.expect)(container.style.fontFamily).toContain('monospace');
            (0, vitest_1.expect)(container.style.borderRadius).toBe('4px');
            (0, vitest_1.expect)(container.style.padding).toBe('8px');
        });
        (0, vitest_1.it)('should apply custom CSS to container', () => {
            const container = document.createElement('div');
            uiManager.applyCustomCSS(container, {
                backgroundColor: '#ff0000',
                color: '#00ff00',
            });
            // JSDOM may keep hex format or convert to rgb - check both
            (0, vitest_1.expect)(['#ff0000', 'rgb(255, 0, 0)']).toContain(container.style.backgroundColor);
            (0, vitest_1.expect)(['#00ff00', 'rgb(0, 255, 0)']).toContain(container.style.color);
        });
    });
    (0, vitest_1.describe)('CLI Agent Status', () => {
        (0, vitest_1.it)('should update CLI agent status display', () => {
            // Create a header first
            uiManager.createTerminalHeader('term-1', 'Test Terminal');
            // Should not throw
            uiManager.updateCliAgentStatusDisplay('Test Terminal', 'connected', 'claude');
            uiManager.updateCliAgentStatusDisplay('Test Terminal', 'disconnected', 'copilot');
            uiManager.updateCliAgentStatusDisplay(null, 'none', null);
        });
        (0, vitest_1.it)('should update CLI agent status by terminal ID', () => {
            // Create a header first
            uiManager.createTerminalHeader('term-1', 'Test Terminal');
            // Should not throw
            uiManager.updateCliAgentStatusByTerminalId('term-1', 'connected', 'claude');
            uiManager.updateCliAgentStatusByTerminalId('term-1', 'disconnected', null);
            uiManager.updateCliAgentStatusByTerminalId('term-1', 'none', null);
        });
        (0, vitest_1.it)('should handle missing header gracefully', () => {
            // Should not throw when header doesn't exist
            uiManager.updateCliAgentStatusByTerminalId('non-existent', 'connected', 'claude');
        });
    });
    (0, vitest_1.describe)('Legacy Claude Status', () => {
        (0, vitest_1.beforeEach)(() => {
            document.body.innerHTML = `
        <div data-terminal-id="term-1">
          <div class="terminal-header">
            <span class="terminal-name">Test Terminal</span>
            <div class="terminal-status"></div>
            <div class="terminal-controls">
              <button class="close-btn">X</button>
            </div>
          </div>
        </div>
      `;
        });
        (0, vitest_1.it)('should update legacy claude status to active', () => {
            uiManager.updateLegacyClaudeStatus('term-1', true);
            const statusSpan = document.querySelector('.claude-status');
            (0, vitest_1.expect)(statusSpan).toBeTruthy();
            (0, vitest_1.expect)(statusSpan?.textContent).toBe('CLI Agent Active');
        });
        (0, vitest_1.it)('should clear legacy claude status when inactive', () => {
            // First set active
            uiManager.updateLegacyClaudeStatus('term-1', true);
            (0, vitest_1.expect)(document.querySelector('.claude-status')).toBeTruthy();
            // Then set inactive - status section is cleared
            uiManager.updateLegacyClaudeStatus('term-1', false);
            const statusSection = document.querySelector('.terminal-status');
            (0, vitest_1.expect)(statusSection?.textContent).toBe('');
        });
        (0, vitest_1.it)('should handle missing header gracefully', () => {
            document.body.innerHTML = '';
            // Should not throw
            uiManager.updateLegacyClaudeStatus('non-existent', true);
        });
        (0, vitest_1.it)('should insert status before controls container', () => {
            uiManager.updateLegacyClaudeStatus('term-1', true);
            const controls = document.querySelector('.terminal-controls');
            const status = document.querySelector('.claude-status');
            // Status should be before controls
            (0, vitest_1.expect)(status?.nextElementSibling).toBe(controls);
        });
    });
    (0, vitest_1.describe)('Notification', () => {
        (0, vitest_1.it)('should create notification element', () => {
            // @ts-expect-error - test mock type
            const notification = uiManager.createNotificationElement({
                message: 'Test message',
                type: 'info',
            });
            (0, vitest_1.expect)(notification).toBeTruthy();
            (0, vitest_1.expect)(notification.textContent).toContain('Test message');
        });
        (0, vitest_1.it)('should ensure animations are loaded', () => {
            // Should not throw
            uiManager.ensureAnimationsLoaded();
        });
    });
    (0, vitest_1.describe)('Header Utilities', () => {
        (0, vitest_1.it)('should find terminal headers', () => {
            document.body.innerHTML = `
        <div class="terminal-header">Header 1</div>
        <div class="terminal-header">Header 2</div>
        <div class="other-element">Not a header</div>
      `;
            const headers = uiManager.findTerminalHeaders();
            (0, vitest_1.expect)(headers).toHaveLength(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(headers[0].textContent).toBe('Header 1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(headers[1].textContent).toBe('Header 2');
        });
        (0, vitest_1.it)('should return empty array when no headers exist', () => {
            document.body.innerHTML = '<div>No headers here</div>';
            const headers = uiManager.findTerminalHeaders();
            (0, vitest_1.expect)(headers).toHaveLength(0);
        });
        (0, vitest_1.it)('should clear header cache', () => {
            uiManager.createTerminalHeader('term-1', 'Test');
            (0, vitest_1.expect)(uiManager.headerElementsCache.size).toBe(1);
            uiManager.clearHeaderCache();
            (0, vitest_1.expect)(uiManager.headerElementsCache.size).toBe(0);
        });
    });
    (0, vitest_1.describe)('Theme Updates', () => {
        (0, vitest_1.it)('should update theme and notify tab updater', () => {
            const tabUpdater = vitest_1.vi.fn();
            uiManager.setTabThemeUpdater(tabUpdater);
            // @ts-expect-error - test mock type
            const theme = {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff',
                selectionBackground: '#264f78',
            };
            uiManager.updateTheme(theme);
            (0, vitest_1.expect)(tabUpdater).toHaveBeenCalledWith(theme);
        });
        (0, vitest_1.it)('should update header themes when theme changes', () => {
            // Create some headers first
            uiManager.createTerminalHeader('term-1', 'Terminal 1');
            uiManager.createTerminalHeader('term-2', 'Terminal 2');
            // @ts-expect-error - test mock type
            const theme = {
                background: '#ffffff',
                foreground: '#000000',
            };
            // Should not throw
            uiManager.updateTheme(theme);
            // Headers should have been updated (background color set)
            const headers = Array.from(uiManager.headerElementsCache.values());
            (0, vitest_1.expect)(headers.length).toBe(2);
        });
    });
});
//# sourceMappingURL=UIManager.test.js.map