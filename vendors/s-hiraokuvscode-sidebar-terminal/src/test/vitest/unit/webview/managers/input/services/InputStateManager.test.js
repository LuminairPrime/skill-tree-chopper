"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InputStateManager_1 = require("../../../../../../../webview/managers/input/services/InputStateManager");
(0, vitest_1.describe)('InputStateManager', () => {
    let manager;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        mockLogger = vitest_1.vi.fn();
        manager = new InputStateManager_1.InputStateManager(mockLogger);
    });
    (0, vitest_1.describe)('Initial State', () => {
        (0, vitest_1.it)('should initialize with default values', () => {
            const state = manager.getState();
            (0, vitest_1.expect)(state.ime.isActive).toBe(false);
            (0, vitest_1.expect)(state.altClick.isVSCodeAltClickEnabled).toBe(false);
            (0, vitest_1.expect)(state.keyboard.isInChordMode).toBe(false);
            (0, vitest_1.expect)(state.agent.isAgentMode).toBe(false);
        });
    });
    (0, vitest_1.describe)('State Updates', () => {
        (0, vitest_1.it)('should update IME state and notify listeners', () => {
            const listener = vitest_1.vi.fn();
            manager.addStateListener('ime', listener);
            manager.updateIMEState({ isActive: true, data: 'あ' });
            (0, vitest_1.expect)(manager.getStateSection('ime').isActive).toBe(true);
            (0, vitest_1.expect)(manager.getStateSection('ime').data).toBe('あ');
            (0, vitest_1.expect)(listener).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should notify global listeners on any change', () => {
            const globalListener = vitest_1.vi.fn();
            manager.addStateListener('*', globalListener);
            manager.updateAltClickState({ isAltKeyPressed: true });
            (0, vitest_1.expect)(globalListener).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ isAltKeyPressed: true }), vitest_1.expect.anything(), 'altClick');
        });
        (0, vitest_1.it)('should deep clone state to prevent external mutations', () => {
            const state = manager.getState();
            state.ime.isActive = true; // Attempt mutation
            (0, vitest_1.expect)(manager.getStateSection('ime').isActive).toBe(false);
        });
    });
    (0, vitest_1.describe)('Validation', () => {
        (0, vitest_1.it)('should log warning for invalid IME state (active but empty)', () => {
            manager.updateIMEState({ isActive: true, data: '', lastEvent: 'update' });
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('IME active but no composition data'));
        });
        (0, vitest_1.it)('should log error for negative offsets', () => {
            manager.updateIMEState({ startOffset: -1 });
            (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Invalid IME offset values'));
        });
    });
    (0, vitest_1.describe)('History and Critical State', () => {
        (0, vitest_1.it)('should record history of changes', () => {
            manager.updateAgentState({ isAgentMode: true });
            manager.updateAgentState({ agentType: 'claude' });
            const history = manager.getStateHistory();
            (0, vitest_1.expect)(history.length).toBeGreaterThanOrEqual(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(history[history.length - 1].stateKey).toBe('agent');
        });
        (0, vitest_1.it)('should detect critical state correctly', () => {
            (0, vitest_1.expect)(manager.hasCriticalStateActive()).toBe(false);
            manager.updateIMEState({ isActive: true });
            (0, vitest_1.expect)(manager.hasCriticalStateActive()).toBe(true);
            manager.resetAllState();
            (0, vitest_1.expect)(manager.hasCriticalStateActive()).toBe(false);
            manager.updateKeyboardState({ isInChordMode: true });
            (0, vitest_1.expect)(manager.hasCriticalStateActive()).toBe(true);
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should remove listeners', () => {
            const listener = vitest_1.vi.fn();
            manager.addStateListener('ime', listener);
            manager.removeStateListener('ime', listener);
            manager.updateIMEState({ isActive: true });
            (0, vitest_1.expect)(listener).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should reset all state', () => {
            manager.updateAltClickState({ clickCount: 5 });
            manager.resetAllState();
            (0, vitest_1.expect)(manager.getStateSection('altClick').clickCount).toBe(0);
        });
        (0, vitest_1.it)('should cleanup on dispose', () => {
            manager.addStateListener('ime', vitest_1.vi.fn());
            manager.dispose();
            // Verification of internal cleanup (listeners cleared)
            (0, vitest_1.expect)(manager.getStateHistory()).toEqual([]);
        });
    });
});
//# sourceMappingURL=InputStateManager.test.js.map