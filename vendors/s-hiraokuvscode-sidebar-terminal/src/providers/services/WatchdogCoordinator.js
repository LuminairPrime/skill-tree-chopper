"use strict";
/**
 * WatchdogCoordinator
 *
 * Terminal initialization watchdog management extracted from SecondaryTerminalProvider.
 * Tracks initialization state, handles timeouts, and manages safe mode transitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchdogCoordinator = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
const TerminalInitializationWatchdog_1 = require("./TerminalInitializationWatchdog");
class WatchdogCoordinator {
    constructor(deps, ackOptions, promptOptions) {
        this.deps = deps;
        this.ackOptions = ackOptions;
        this.promptOptions = promptOptions;
        this._pendingTerminals = new Set();
        this._safeModeTerminals = new Set();
        this._recordedMetrics = new Set();
        this._watchdogPhases = new Map();
        this._initStartTimes = new Map();
        this._safeModeNotified = new Set();
        this._watchdog = new TerminalInitializationWatchdog_1.TerminalInitializationWatchdog((terminalId, info) => this.handleTimeout(terminalId, info.attempt, info.isFinalAttempt));
    }
    /**
     * Start watchdog for a specific terminal
     */
    startForTerminal(terminalId, phase, source, overrideOptions) {
        const baseOptions = phase === 'prompt' ? this.promptOptions : this.ackOptions;
        this._watchdogPhases.set(terminalId, phase);
        this._watchdog.start(terminalId, `${phase}:${source}`, {
            ...baseOptions,
            ...overrideOptions,
        });
        (0, logger_1.provider)(`⏳ [WATCHDOG] Started for ${terminalId} (phase=${phase}, source=${source})`);
    }
    /**
     * Stop watchdog for a specific terminal
     */
    stopForTerminal(terminalId, reason) {
        this._watchdog.stop(terminalId, reason);
        this._watchdogPhases.delete(terminalId);
    }
    /**
     * Queue a terminal for watchdog start when initialization completes
     */
    addPendingTerminal(terminalId) {
        this._pendingTerminals.add(terminalId);
    }
    /**
     * Start all queued pending watchdogs
     */
    startPendingWatchdogs(isInitialized) {
        if (!isInitialized || this._pendingTerminals.size === 0) {
            return;
        }
        for (const terminalId of Array.from(this._pendingTerminals.values())) {
            this.startForTerminal(terminalId, 'ack', 'pendingQueue');
            this._pendingTerminals.delete(terminalId);
        }
    }
    /**
     * Record initialization start time for metrics
     */
    recordInitStart(terminalId) {
        this._initStartTimes.set(terminalId, Date.now());
    }
    /**
     * Mark terminal initialization as successful
     */
    markInitSuccess(terminalId) {
        this._safeModeTerminals.delete(terminalId);
        this.recordMetric('success', terminalId);
    }
    /**
     * Clear safe mode state for a terminal (e.g., on reconnect)
     */
    clearSafeMode(terminalId) {
        this._safeModeTerminals.delete(terminalId);
        this._safeModeNotified.delete(terminalId);
    }
    /**
     * Check if a terminal is in safe mode
     */
    isInSafeMode(terminalId) {
        return this._safeModeTerminals.has(terminalId);
    }
    /**
     * Get the current phase for a terminal
     */
    getPhase(terminalId) {
        return this._watchdogPhases.get(terminalId);
    }
    /**
     * Handle initialization timeout
     */
    handleTimeout(terminalId, attempt, isFinalAttempt) {
        const terminal = this.deps.getTerminal(terminalId);
        const phase = this._watchdogPhases.get(terminalId) ?? 'ack';
        if (!terminal || !terminal.ptyProcess) {
            this.stopForTerminal(terminalId, 'terminalMissing');
            return;
        }
        (0, logger_1.provider)(`⚠️ [WATCHDOG] Terminal ${terminalId} init timeout (phase=${phase}, attempt=${attempt}, final=${isFinalAttempt})`);
        if (phase === 'ack') {
            if (isFinalAttempt) {
                this.stopForTerminal(terminalId, 'ackTimeout');
                this.recordMetric('timeout', terminalId);
                void this.notifyInitializationFailure(terminalId);
            }
            return;
        }
        if (!this._safeModeTerminals.has(terminalId)) {
            this._safeModeTerminals.add(terminalId);
            (0, logger_1.provider)(`⚠️ Prompt timeout -> safe mode for ${terminalId}`);
            this.notifySafeMode(terminalId);
            try {
                this.deps.initializeShellForTerminal(terminalId, terminal.ptyProcess, true);
                this.startForTerminal(terminalId, 'prompt', 'safeModeMonitor');
                return;
            }
            catch (error) {
                (0, logger_1.provider)(`❌ [FALLBACK] Safe mode initialization failed for ${terminalId}:`, error);
            }
        }
        if (!isFinalAttempt) {
            return;
        }
        this.stopForTerminal(terminalId, 'safeModeFailed');
        this.recordMetric('timeout', terminalId);
        void this.notifyInitializationFailure(terminalId);
    }
    /**
     * Record initialization metric
     */
    recordMetric(metric, terminalId) {
        const key = `${terminalId}:${metric}`;
        if (this._recordedMetrics.has(key)) {
            return;
        }
        this._recordedMetrics.add(key);
        const startTime = this._initStartTimes.get(terminalId);
        const duration = startTime ? Date.now() - startTime : 0;
        this._initStartTimes.delete(terminalId);
        this._safeModeNotified.delete(terminalId);
        (0, logger_1.provider)(`📊 [METRIC] terminal.init.${metric} (terminal=${terminalId}, duration=${duration}ms)`);
        this.deps.telemetryService?.trackPerformance({
            operation: 'terminal.init',
            duration,
            success: metric === 'success',
            metadata: { result: metric },
        });
    }
    async notifyInitializationFailure(terminalId) {
        this.recordMetric('timeout', terminalId);
        await vscode.window.showErrorMessage('Sidebar Terminal failed to initialize its shell. Close the terminal and create a new one.');
    }
    notifySafeMode(terminalId) {
        if (this._safeModeNotified.has(terminalId)) {
            return;
        }
        this._safeModeNotified.add(terminalId);
        void vscode.window.showWarningMessage('Sidebar Terminal prompt is taking longer than expected. Retrying in safe mode...');
    }
    /**
     * Dispose all resources
     */
    dispose() {
        this._watchdog.dispose();
        this._pendingTerminals.clear();
        this._safeModeTerminals.clear();
        this._recordedMetrics.clear();
        this._watchdogPhases.clear();
        this._initStartTimes.clear();
        this._safeModeNotified.clear();
    }
}
exports.WatchdogCoordinator = WatchdogCoordinator;
//# sourceMappingURL=WatchdogCoordinator.js.map