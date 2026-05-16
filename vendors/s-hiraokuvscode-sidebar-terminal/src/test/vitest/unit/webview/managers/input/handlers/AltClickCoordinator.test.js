"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const AltClickCoordinator_1 = require("../../../../../../../webview/managers/input/handlers/AltClickCoordinator");
// Mock logger
vitest_1.vi.mock('../../../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('AltClickCoordinator', () => {
    let dom;
    let coordinator;
    let deps;
    let mockEventRegistry;
    let mockStateManager;
    let mockNotificationManager;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('navigator', dom.window.navigator);
        mockEventRegistry = {
            register: vitest_1.vi.fn(),
            unregister: vitest_1.vi.fn(),
        };
        mockStateManager = {
            updateAltClickState: vitest_1.vi.fn(),
        };
        mockNotificationManager = {
            showAltClickFeedback: vitest_1.vi.fn(),
        };
        deps = {
            logger: vitest_1.vi.fn(),
            eventRegistry: mockEventRegistry,
            stateManager: mockStateManager,
        };
        coordinator = new AltClickCoordinator_1.AltClickCoordinator(deps);
    });
    (0, vitest_1.afterEach)(() => {
        coordinator.dispose();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('isVSCodeAltClickEnabled', () => {
        (0, vitest_1.it)('should return true when altClickMovesCursor is true and multiCursorModifier is alt', () => {
            (0, vitest_1.expect)(coordinator.isVSCodeAltClickEnabled({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            })).toBe(true);
        });
        (0, vitest_1.it)('should return false when altClickMovesCursor is false', () => {
            (0, vitest_1.expect)(coordinator.isVSCodeAltClickEnabled({ altClickMovesCursor: false })).toBe(false);
        });
        (0, vitest_1.it)('should return false when multiCursorModifier is not alt', () => {
            (0, vitest_1.expect)(coordinator.isVSCodeAltClickEnabled({
                altClickMovesCursor: true,
                multiCursorModifier: 'ctrlCmd',
            })).toBe(false);
        });
        (0, vitest_1.it)('should return false when altClickMovesCursor is undefined', () => {
            (0, vitest_1.expect)(coordinator.isVSCodeAltClickEnabled({})).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateAltClickSettings', () => {
        (0, vitest_1.it)('should update state when settings change to enabled', () => {
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            (0, vitest_1.expect)(coordinator.getAltClickState().isVSCodeAltClickEnabled).toBe(true);
        });
        (0, vitest_1.it)('should update state when settings change to disabled', () => {
            // Enable first
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            // Then disable
            coordinator.updateAltClickSettings({ altClickMovesCursor: false });
            (0, vitest_1.expect)(coordinator.getAltClickState().isVSCodeAltClickEnabled).toBe(false);
        });
        (0, vitest_1.it)('should call stateManager.updateAltClickState on change', () => {
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            (0, vitest_1.expect)(mockStateManager.updateAltClickState).toHaveBeenCalledWith({
                isVSCodeAltClickEnabled: true,
            });
        });
        (0, vitest_1.it)('should not call stateManager when value does not change', () => {
            // Both start as disabled (false), update to disabled again
            coordinator.updateAltClickSettings({ altClickMovesCursor: false });
            (0, vitest_1.expect)(mockStateManager.updateAltClickState).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getAltClickState', () => {
        (0, vitest_1.it)('should return default state initially', () => {
            const state = coordinator.getAltClickState();
            (0, vitest_1.expect)(state.isVSCodeAltClickEnabled).toBe(false);
            (0, vitest_1.expect)(state.isAltKeyPressed).toBe(false);
        });
        (0, vitest_1.it)('should return a copy of the state', () => {
            const state1 = coordinator.getAltClickState();
            const state2 = coordinator.getAltClickState();
            (0, vitest_1.expect)(state1).toEqual(state2);
            (0, vitest_1.expect)(state1).not.toBe(state2);
        });
    });
    (0, vitest_1.describe)('setupAltKeyVisualFeedback', () => {
        (0, vitest_1.it)('should register keydown and keyup event handlers', () => {
            coordinator.setupAltKeyVisualFeedback();
            (0, vitest_1.expect)(mockEventRegistry.register).toHaveBeenCalledWith('alt-key-down', document, 'keydown', vitest_1.expect.any(Function));
            (0, vitest_1.expect)(mockEventRegistry.register).toHaveBeenCalledWith('alt-key-up', document, 'keyup', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should update isAltKeyPressed on keydown with alt', () => {
            coordinator.setupAltKeyVisualFeedback();
            // Get the registered keydown handler
            const keydownCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-down');
            const keydownHandler = keydownCall[3];
            keydownHandler({ altKey: true });
            (0, vitest_1.expect)(coordinator.getAltClickState().isAltKeyPressed).toBe(true);
        });
        (0, vitest_1.it)('should reset isAltKeyPressed on keyup without alt', () => {
            coordinator.setupAltKeyVisualFeedback();
            const keydownCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-down');
            const keyupCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-up');
            // Press alt
            keydownCall[3]({ altKey: true });
            (0, vitest_1.expect)(coordinator.getAltClickState().isAltKeyPressed).toBe(true);
            // Release alt
            keyupCall[3]({ altKey: false });
            (0, vitest_1.expect)(coordinator.getAltClickState().isAltKeyPressed).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateTerminalCursors', () => {
        (0, vitest_1.it)('should set cursor to default when alt is pressed and alt-click enabled', () => {
            const terminal = dom.window.document.createElement('div');
            terminal.className = 'xterm';
            const container = dom.window.document.createElement('div');
            container.className = 'terminal-container';
            container.appendChild(terminal);
            dom.window.document.body.appendChild(container);
            // Enable alt-click and press alt
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            coordinator.setupAltKeyVisualFeedback();
            const keydownCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-down');
            keydownCall[3]({ altKey: true });
            (0, vitest_1.expect)(terminal.style.cursor).toBe('default');
        });
        (0, vitest_1.it)('should clear cursor when alt is not pressed', () => {
            const terminal = dom.window.document.createElement('div');
            terminal.className = 'xterm';
            const container = dom.window.document.createElement('div');
            container.className = 'terminal-container';
            container.appendChild(terminal);
            dom.window.document.body.appendChild(container);
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            coordinator.setupAltKeyVisualFeedback();
            // Press and release
            const keydownCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-down');
            const keyupCall = mockEventRegistry.register.mock.calls.find((call) => call[0] === 'alt-key-up');
            keydownCall[3]({ altKey: true });
            keyupCall[3]({ altKey: false });
            (0, vitest_1.expect)(terminal.style.cursor).toBe('');
        });
    });
    (0, vitest_1.describe)('handleAltClick', () => {
        (0, vitest_1.it)('should show feedback when alt-click is enabled and notification manager set', () => {
            coordinator.setNotificationManager(mockNotificationManager);
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            const result = coordinator.handleAltClick(100, 200, 'terminal-1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockNotificationManager.showAltClickFeedback).toHaveBeenCalledWith(100, 200);
        });
        (0, vitest_1.it)('should return false when alt-click is not enabled', () => {
            const result = coordinator.handleAltClick(100, 200, 'terminal-1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should work without notification manager', () => {
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            const result = coordinator.handleAltClick(100, 200, 'terminal-1');
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('setNotificationManager', () => {
        (0, vitest_1.it)('should store the notification manager', () => {
            coordinator.setNotificationManager(mockNotificationManager);
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            coordinator.handleAltClick(50, 60, 'terminal-1');
            (0, vitest_1.expect)(mockNotificationManager.showAltClickFeedback).toHaveBeenCalledWith(50, 60);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should reset alt-click state', () => {
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            (0, vitest_1.expect)(coordinator.getAltClickState().isVSCodeAltClickEnabled).toBe(true);
            coordinator.dispose();
            (0, vitest_1.expect)(coordinator.getAltClickState().isVSCodeAltClickEnabled).toBe(false);
            (0, vitest_1.expect)(coordinator.getAltClickState().isAltKeyPressed).toBe(false);
        });
        (0, vitest_1.it)('should clear notification manager reference', () => {
            coordinator.setNotificationManager(mockNotificationManager);
            coordinator.dispose();
            // After dispose, alt-click handling should not use notification manager
            coordinator.updateAltClickSettings({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            coordinator.handleAltClick(100, 200, 'terminal-1');
            (0, vitest_1.expect)(mockNotificationManager.showAltClickFeedback).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=AltClickCoordinator.test.js.map