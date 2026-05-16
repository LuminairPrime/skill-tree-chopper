"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * PanelLocationController Tests
 *
 * Tests for panel location methods extracted from LightweightTerminalWebviewManager.
 * Covers: getCurrentPanelLocation, updatePanelLocationIfNeeded, getCurrentFlexDirection,
 *         setupPanelLocationSync (event listener and initial sync)
 */
const vitest_1 = require("vitest");
const PanelLocationController_1 = require("../../../../../webview/coordinators/PanelLocationController");
function createMockDeps() {
    return {
        messageManagerUpdatePanelLocationIfNeeded: vitest_1.vi.fn().mockReturnValue(false),
        messageManagerGetCurrentPanelLocation: vitest_1.vi.fn().mockReturnValue(null),
        messageManagerGetCurrentFlexDirection: vitest_1.vi.fn().mockReturnValue(null),
        splitManagerSetPanelLocation: vitest_1.vi.fn(),
        splitManagerUpdateSplitDirection: vitest_1.vi.fn(),
        splitManagerGetTerminalCount: vitest_1.vi.fn().mockReturnValue(0),
        displayModeManagerGetCurrentMode: vitest_1.vi.fn().mockReturnValue('normal'),
        displayModeManagerShowAllTerminalsSplit: vitest_1.vi.fn(),
    };
}
(0, vitest_1.describe)('PanelLocationController', () => {
    let controller;
    let deps;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        deps = createMockDeps();
        // Mock document.getElementById
        vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(null);
    });
    (0, vitest_1.afterEach)(() => {
        if (controller) {
            controller.dispose();
        }
        vitest_1.vi.useRealTimers();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('constructor', () => {
        (0, vitest_1.it)('should create a PanelLocationController instance', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller).toBeDefined();
        });
    });
    (0, vitest_1.describe)('getCurrentPanelLocation', () => {
        (0, vitest_1.it)('should delegate to messageManager', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentPanelLocation).mockReturnValue('sidebar');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            const result = controller.getCurrentPanelLocation();
            (0, vitest_1.expect)(result).toBe('sidebar');
            (0, vitest_1.expect)(deps.messageManagerGetCurrentPanelLocation).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return panel when messageManager returns panel', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentPanelLocation).mockReturnValue('panel');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller.getCurrentPanelLocation()).toBe('panel');
        });
        (0, vitest_1.it)('should return null when messageManager returns null', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentPanelLocation).mockReturnValue(null);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller.getCurrentPanelLocation()).toBeNull();
        });
    });
    (0, vitest_1.describe)('updatePanelLocationIfNeeded', () => {
        (0, vitest_1.it)('should delegate to messageManager and return result', () => {
            vitest_1.vi.mocked(deps.messageManagerUpdatePanelLocationIfNeeded).mockReturnValue(true);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            const result = controller.updatePanelLocationIfNeeded();
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(deps.messageManagerUpdatePanelLocationIfNeeded).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return false when no update needed', () => {
            vitest_1.vi.mocked(deps.messageManagerUpdatePanelLocationIfNeeded).mockReturnValue(false);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller.updatePanelLocationIfNeeded()).toBe(false);
        });
    });
    (0, vitest_1.describe)('getCurrentFlexDirection', () => {
        (0, vitest_1.it)('should delegate to messageManager', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentFlexDirection).mockReturnValue('row');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            const result = controller.getCurrentFlexDirection();
            (0, vitest_1.expect)(result).toBe('row');
            (0, vitest_1.expect)(deps.messageManagerGetCurrentFlexDirection).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return column when messageManager returns column', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentFlexDirection).mockReturnValue('column');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller.getCurrentFlexDirection()).toBe('column');
        });
        (0, vitest_1.it)('should return null when messageManager returns null', () => {
            vitest_1.vi.mocked(deps.messageManagerGetCurrentFlexDirection).mockReturnValue(null);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(controller.getCurrentFlexDirection()).toBeNull();
        });
    });
    (0, vitest_1.describe)('setupPanelLocationSync (event handling)', () => {
        (0, vitest_1.it)('should handle panel location changed event with sidebar location', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'sidebar' },
            }));
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).toHaveBeenCalledWith('sidebar');
        });
        (0, vitest_1.it)('should handle panel location changed event with panel location', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            }));
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).toHaveBeenCalledWith('panel');
        });
        (0, vitest_1.it)('should ignore events with invalid location', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'invalid' },
            }));
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should ignore events with no location', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: {},
            }));
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show all terminals split when panel with multiple terminals and not fullscreen', () => {
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(3);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('split');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            }));
            (0, vitest_1.expect)(deps.displayModeManagerShowAllTerminalsSplit).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not show all terminals split when panel with fullscreen mode', () => {
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(3);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('fullscreen');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            }));
            (0, vitest_1.expect)(deps.displayModeManagerShowAllTerminalsSplit).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show all terminals split when sidebar in split mode', () => {
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(2);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('split');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'sidebar' },
            }));
            (0, vitest_1.expect)(deps.displayModeManagerShowAllTerminalsSplit).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update split direction when no special conditions met', () => {
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(1);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('normal');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'panel' },
            }));
            (0, vitest_1.expect)(deps.splitManagerUpdateSplitDirection).toHaveBeenCalledWith('horizontal', 'panel');
        });
        (0, vitest_1.it)('should update split direction to vertical for sidebar', () => {
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(1);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('normal');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            window.dispatchEvent(new CustomEvent('terminal-panel-location-changed', {
                detail: { location: 'sidebar' },
            }));
            (0, vitest_1.expect)(deps.splitManagerUpdateSplitDirection).toHaveBeenCalledWith('vertical', 'sidebar');
        });
    });
    (0, vitest_1.describe)('initial sync (setTimeout)', () => {
        (0, vitest_1.it)('should sync panel location from DOM after 250ms', () => {
            const mockElement = document.createElement('div');
            mockElement.classList.add('terminal-split-horizontal');
            vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            vitest_1.vi.advanceTimersByTime(250);
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).toHaveBeenCalledWith('panel');
        });
        (0, vitest_1.it)('should detect sidebar from DOM when no horizontal class', () => {
            const mockElement = document.createElement('div');
            vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            vitest_1.vi.advanceTimersByTime(250);
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).toHaveBeenCalledWith('sidebar');
        });
        (0, vitest_1.it)('should not crash when terminals-wrapper not found', () => {
            vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(null);
            controller = new PanelLocationController_1.PanelLocationController(deps);
            (0, vitest_1.expect)(() => vitest_1.vi.advanceTimersByTime(250)).not.toThrow();
            (0, vitest_1.expect)(deps.splitManagerSetPanelLocation).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should show all terminals split when panel with multiple terminals', () => {
            const mockElement = document.createElement('div');
            mockElement.classList.add('terminal-split-horizontal');
            vitest_1.vi.spyOn(document, 'getElementById').mockReturnValue(mockElement);
            vitest_1.vi.mocked(deps.splitManagerGetTerminalCount).mockReturnValue(2);
            vitest_1.vi.mocked(deps.displayModeManagerGetCurrentMode).mockReturnValue('normal');
            controller = new PanelLocationController_1.PanelLocationController(deps);
            vitest_1.vi.advanceTimersByTime(250);
            (0, vitest_1.expect)(deps.displayModeManagerShowAllTerminalsSplit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should remove event listener on dispose', () => {
            controller = new PanelLocationController_1.PanelLocationController(deps);
            const removeEventListenerSpy = vitest_1.vi.spyOn(window, 'removeEventListener');
            controller.dispose();
            (0, vitest_1.expect)(removeEventListenerSpy).toHaveBeenCalledWith('terminal-panel-location-changed', vitest_1.expect.any(Function));
        });
    });
});
//# sourceMappingURL=PanelLocationController.test.js.map