"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalInitializationStateMachine = exports.TerminalInitializationState = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Terminal initialization states.
 * Ordered to allow numeric comparison for state progression.
 */
var TerminalInitializationState;
(function (TerminalInitializationState) {
    TerminalInitializationState[TerminalInitializationState["Idle"] = 0] = "Idle";
    TerminalInitializationState[TerminalInitializationState["ViewPending"] = 1] = "ViewPending";
    TerminalInitializationState[TerminalInitializationState["ViewReady"] = 2] = "ViewReady";
    TerminalInitializationState[TerminalInitializationState["PtySpawned"] = 3] = "PtySpawned";
    TerminalInitializationState[TerminalInitializationState["ShellInitializing"] = 4] = "ShellInitializing";
    TerminalInitializationState[TerminalInitializationState["ShellInitialized"] = 5] = "ShellInitialized";
    TerminalInitializationState[TerminalInitializationState["OutputStreaming"] = 6] = "OutputStreaming";
    TerminalInitializationState[TerminalInitializationState["PromptReady"] = 7] = "PromptReady";
    TerminalInitializationState[TerminalInitializationState["Failed"] = 8] = "Failed";
})(TerminalInitializationState || (exports.TerminalInitializationState = TerminalInitializationState = {}));
const STATE_NAMES = {
    [TerminalInitializationState.Idle]: 'Idle',
    [TerminalInitializationState.ViewPending]: 'ViewPending',
    [TerminalInitializationState.ViewReady]: 'ViewReady',
    [TerminalInitializationState.PtySpawned]: 'PtySpawned',
    [TerminalInitializationState.ShellInitializing]: 'ShellInitializing',
    [TerminalInitializationState.ShellInitialized]: 'ShellInitialized',
    [TerminalInitializationState.OutputStreaming]: 'OutputStreaming',
    [TerminalInitializationState.PromptReady]: 'PromptReady',
    [TerminalInitializationState.Failed]: 'Failed',
};
/**
 * Tracks per-terminal initialization state transitions with logging.
 */
class TerminalInitializationStateMachine {
    constructor() {
        this.stateMap = new Map();
    }
    reset(terminalId) {
        if (this.stateMap.delete(terminalId)) {
            (0, logger_1.provider)(`🧹 [INIT-STATE] Reset state for terminal ${terminalId}`);
        }
    }
    getState(terminalId) {
        return this.stateMap.get(terminalId)?.state ?? TerminalInitializationState.Idle;
    }
    isOutputAllowed(terminalId) {
        const state = this.getState(terminalId);
        return state >= TerminalInitializationState.OutputStreaming;
    }
    incrementRetry(terminalId) {
        const current = this.stateMap.get(terminalId);
        if (!current) {
            this.stateMap.set(terminalId, {
                state: TerminalInitializationState.Idle,
                updatedAt: Date.now(),
                retryCount: 1,
            });
            return 1;
        }
        current.retryCount += 1;
        current.updatedAt = Date.now();
        (0, logger_1.provider)(`🔁 [INIT-STATE] Retry #${current.retryCount} for ${terminalId} (state=${STATE_NAMES[current.state]})`);
        return current.retryCount;
    }
    markViewPending(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.ViewPending, context);
    }
    markViewReady(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.ViewReady, context);
    }
    markPtySpawned(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.PtySpawned, context);
    }
    markShellInitializing(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.ShellInitializing, context);
    }
    markShellInitialized(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.ShellInitialized, context);
    }
    markOutputStreaming(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.OutputStreaming, context);
    }
    markPromptReady(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.PromptReady, context);
    }
    markFailed(terminalId, context) {
        this.transition(terminalId, TerminalInitializationState.Failed, context, true);
    }
    transition(terminalId, nextState, context, allowRegression = false) {
        const snapshot = this.stateMap.get(terminalId);
        const currentState = snapshot?.state ?? TerminalInitializationState.Idle;
        if (!allowRegression && nextState < currentState) {
            (0, logger_1.provider)(`⚠️ [INIT-STATE] Ignoring regression for ${terminalId}: ${STATE_NAMES[currentState]} -> ${STATE_NAMES[nextState]}`);
            return;
        }
        this.stateMap.set(terminalId, {
            state: nextState,
            updatedAt: Date.now(),
            retryCount: snapshot?.retryCount ?? 0,
        });
        (0, logger_1.provider)(`📡 [INIT-STATE] ${terminalId}: ${STATE_NAMES[currentState]} -> ${STATE_NAMES[nextState]}${context ? ` (${context})` : ''}`);
    }
}
exports.TerminalInitializationStateMachine = TerminalInitializationStateMachine;
//# sourceMappingURL=TerminalInitializationStateMachine.js.map