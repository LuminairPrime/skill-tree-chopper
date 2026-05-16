"use strict";
/**
 * TerminalInitializationStateMachine Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalInitializationStateMachine_1 = require("../../../../../providers/services/TerminalInitializationStateMachine");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalInitializationStateMachine', () => {
    let stateMachine;
    const terminalId = 'term-123';
    (0, vitest_1.beforeEach)(() => {
        stateMachine = new TerminalInitializationStateMachine_1.TerminalInitializationStateMachine();
    });
    (0, vitest_1.describe)('Initial State', () => {
        (0, vitest_1.it)('should return Idle state for unknown terminal', () => {
            (0, vitest_1.expect)(stateMachine.getState('unknown')).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.Idle);
        });
        (0, vitest_1.it)('should not allow output initially', () => {
            (0, vitest_1.expect)(stateMachine.isOutputAllowed(terminalId)).toBe(false);
        });
    });
    (0, vitest_1.describe)('State Transitions', () => {
        (0, vitest_1.it)('should transition through states sequentially', () => {
            stateMachine.markViewPending(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.ViewPending);
            stateMachine.markViewReady(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.ViewReady);
            stateMachine.markPtySpawned(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.PtySpawned);
        });
        (0, vitest_1.it)('should allow output after OutputStreaming state', () => {
            stateMachine.markShellInitializing(terminalId);
            (0, vitest_1.expect)(stateMachine.isOutputAllowed(terminalId)).toBe(false);
            stateMachine.markOutputStreaming(terminalId);
            (0, vitest_1.expect)(stateMachine.isOutputAllowed(terminalId)).toBe(true);
            stateMachine.markPromptReady(terminalId);
            (0, vitest_1.expect)(stateMachine.isOutputAllowed(terminalId)).toBe(true);
        });
        (0, vitest_1.it)('should ignore regressions by default', () => {
            stateMachine.markPtySpawned(terminalId);
            stateMachine.markViewReady(terminalId); // Attempt regression
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.PtySpawned);
        });
        (0, vitest_1.it)('should allow regression to Failed state', () => {
            stateMachine.markPromptReady(terminalId);
            stateMachine.markFailed(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.Failed);
        });
    });
    (0, vitest_1.describe)('Retry Handling', () => {
        (0, vitest_1.it)('should increment retry count', () => {
            (0, vitest_1.expect)(stateMachine.incrementRetry(terminalId)).toBe(1);
            (0, vitest_1.expect)(stateMachine.incrementRetry(terminalId)).toBe(2);
        });
        (0, vitest_1.it)('should preserve state while incrementing retry', () => {
            stateMachine.markPtySpawned(terminalId);
            stateMachine.incrementRetry(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.PtySpawned);
        });
    });
    (0, vitest_1.describe)('Reset Management', () => {
        (0, vitest_1.it)('should clear state on reset', () => {
            stateMachine.markPtySpawned(terminalId);
            stateMachine.reset(terminalId);
            (0, vitest_1.expect)(stateMachine.getState(terminalId)).toBe(TerminalInitializationStateMachine_1.TerminalInitializationState.Idle);
        });
    });
});
//# sourceMappingURL=TerminalInitializationStateMachine.test.js.map