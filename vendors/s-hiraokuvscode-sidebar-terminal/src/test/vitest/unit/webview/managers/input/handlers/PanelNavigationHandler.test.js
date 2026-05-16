"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const PanelNavigationHandler_1 = require("../../../../../../../webview/managers/input/handlers/PanelNavigationHandler");
(0, vitest_1.describe)('PanelNavigationHandler', () => {
    let dom;
    let handler;
    let mockDeps;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        mockDeps = {
            logger: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            emitTerminalInteractionEvent: vitest_1.vi.fn(),
        };
        handler = new PanelNavigationHandler_1.PanelNavigationHandler(mockDeps);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize with panel navigation disabled', () => {
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(false);
        });
        (0, vitest_1.it)('should not handle keys when not enabled', () => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            (0, vitest_1.expect)(handler.handlePanelNavigationKey(event)).toBe(false);
        });
    });
    (0, vitest_1.describe)('setPanelNavigationEnabled', () => {
        (0, vitest_1.it)('should enable panel navigation', () => {
            handler.setPanelNavigationEnabled(true);
            // After enabling, Ctrl+P should toggle panel mode
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(true);
        });
        (0, vitest_1.it)('should disable panel navigation and exit mode', () => {
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
            handler.setPanelNavigationEnabled(false);
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(false);
        });
        (0, vitest_1.it)('should toggle panel-navigation-enabled class on body', () => {
            handler.setPanelNavigationEnabled(true);
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-enabled')).toBe(true);
            handler.setPanelNavigationEnabled(false);
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-enabled')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Toggle with Ctrl+P', () => {
        (0, vitest_1.it)('should enter panel navigation mode on Ctrl+P', () => {
            handler.setPanelNavigationEnabled(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(event, 'preventDefault');
            vitest_1.vi.spyOn(event, 'stopPropagation');
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(true);
            (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(event.stopPropagation).toHaveBeenCalled();
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(true);
        });
        (0, vitest_1.it)('should exit panel navigation mode on second Ctrl+P', () => {
            handler.setPanelNavigationEnabled(true);
            // Enter
            handler.handlePanelNavigationKey(new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }));
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(true);
            // Exit
            handler.handlePanelNavigationKey(new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                bubbles: true,
                cancelable: true,
            }));
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(false);
        });
        (0, vitest_1.it)('should not activate on Ctrl+Shift+P', () => {
            handler.setPanelNavigationEnabled(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(false);
        });
        (0, vitest_1.it)('should not activate on Ctrl+Alt+P', () => {
            handler.setPanelNavigationEnabled(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                ctrlKey: true,
                altKey: true,
                bubbles: true,
                cancelable: true,
            });
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(false);
        });
        (0, vitest_1.it)('should not activate on Cmd+P (metaKey)', () => {
            handler.setPanelNavigationEnabled(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'p',
                metaKey: true,
                bubbles: true,
                cancelable: true,
            });
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(false);
        });
    });
    (0, vitest_1.describe)('Escape to exit', () => {
        (0, vitest_1.it)('should exit panel navigation mode on Escape', () => {
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(event, 'preventDefault');
            vitest_1.vi.spyOn(event, 'stopPropagation');
            const handled = handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(handled).toBe(true);
            (0, vitest_1.expect)(handler.isPanelNavigationMode()).toBe(false);
            (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(event.stopPropagation).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Navigation keys', () => {
        (0, vitest_1.beforeEach)(() => {
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
        });
        vitest_1.it.each([
            ['h', 'switch-previous'],
            ['k', 'switch-previous'],
            ['ArrowLeft', 'switch-previous'],
            ['ArrowUp', 'switch-previous'],
            ['j', 'switch-next'],
            ['l', 'switch-next'],
            ['ArrowRight', 'switch-next'],
            ['ArrowDown', 'switch-next'],
        ])('should map %s to %s', (key, expectedType) => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(event, 'preventDefault');
            vitest_1.vi.spyOn(event, 'stopPropagation');
            handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(event.stopPropagation).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).toHaveBeenCalledWith(expectedType, 'terminal-1', undefined);
        });
        (0, vitest_1.it)('should not emit navigation event when no active terminal', () => {
            mockDeps.getActiveTerminalId = vitest_1.vi.fn().mockReturnValue(null);
            handler = new PanelNavigationHandler_1.PanelNavigationHandler(mockDeps);
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should fallback to DOM active terminal when id is null', () => {
            mockDeps.getActiveTerminalId = vitest_1.vi.fn().mockReturnValue(null);
            handler = new PanelNavigationHandler_1.PanelNavigationHandler(mockDeps);
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
            // Create a DOM element that looks like an active terminal container
            const activeContainer = dom.window.document.createElement('div');
            activeContainer.className = 'terminal-container active';
            activeContainer.setAttribute('data-terminal-id', 'terminal-dom');
            dom.window.document.body.appendChild(activeContainer);
            const event = new dom.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            });
            handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).toHaveBeenCalledWith('switch-next', 'terminal-dom', undefined);
        });
    });
    (0, vitest_1.describe)('Action keys', () => {
        (0, vitest_1.beforeEach)(() => {
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
        });
        vitest_1.it.each([
            ['r', 'create-terminal'],
            ['d', 'create-terminal'],
            ['x', 'kill-terminal'],
        ])('should handle %s key and emit %s', (key, expectedType) => {
            const event = new dom.window.KeyboardEvent('keydown', {
                key,
                bubbles: true,
                cancelable: true,
            });
            vitest_1.vi.spyOn(event, 'preventDefault');
            vitest_1.vi.spyOn(event, 'stopPropagation');
            handler.handlePanelNavigationKey(event);
            (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            (0, vitest_1.expect)(event.stopPropagation).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).toHaveBeenCalledWith(expectedType, expectedType === 'create-terminal' ? '' : 'terminal-1', undefined);
        });
    });
    (0, vitest_1.describe)('Non-navigation keys blocked', () => {
        (0, vitest_1.it)('should block non-navigation keys in panel navigation mode', () => {
            handler.setPanelNavigationEnabled(true);
            handler.setPanelNavigationMode(true);
            const nonNavKeys = ['a', 'z', '1', 'Enter', 'Tab', ' '];
            for (const key of nonNavKeys) {
                const event = new dom.window.KeyboardEvent('keydown', {
                    key,
                    bubbles: true,
                    cancelable: true,
                });
                vitest_1.vi.spyOn(event, 'preventDefault');
                const handled = handler.handlePanelNavigationKey(event);
                (0, vitest_1.expect)(handled).toBe(true);
                (0, vitest_1.expect)(event.preventDefault).toHaveBeenCalled();
            }
            (0, vitest_1.expect)(mockDeps.emitTerminalInteractionEvent).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Indicator UI', () => {
        (0, vitest_1.it)('should show indicator when mode is enabled', () => {
            handler.setPanelNavigationMode(true);
            const indicator = dom.window.document.querySelector('.panel-navigation-indicator');
            (0, vitest_1.expect)(indicator).not.toBeNull();
            (0, vitest_1.expect)(indicator?.textContent).toContain('PANEL MODE');
            (0, vitest_1.expect)(indicator?.textContent).toContain('r/d:new');
            (0, vitest_1.expect)(indicator?.textContent).toContain('x:close');
            (0, vitest_1.expect)(indicator?.style.display).toBe('block');
        });
        (0, vitest_1.it)('should hide indicator when mode is disabled', () => {
            handler.setPanelNavigationMode(true);
            handler.setPanelNavigationMode(false);
            const indicator = dom.window.document.querySelector('.panel-navigation-indicator');
            (0, vitest_1.expect)(indicator?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should toggle body class', () => {
            handler.setPanelNavigationMode(true);
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-mode')).toBe(true);
            handler.setPanelNavigationMode(false);
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-mode')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should clean up indicator on dispose', () => {
            handler.setPanelNavigationMode(true);
            (0, vitest_1.expect)(dom.window.document.querySelector('.panel-navigation-indicator')).not.toBeNull();
            handler.dispose();
            (0, vitest_1.expect)(dom.window.document.querySelector('.panel-navigation-indicator')).toBeNull();
        });
        (0, vitest_1.it)('should exit panel navigation mode on dispose', () => {
            handler.setPanelNavigationMode(true);
            handler.dispose();
            // After dispose, internal state should be reset
            // (cannot check isPanelNavigationMode after dispose, but body class should be cleared)
            (0, vitest_1.expect)(dom.window.document.body.classList.contains('panel-navigation-mode')).toBe(false);
        });
    });
});
//# sourceMappingURL=PanelNavigationHandler.test.js.map