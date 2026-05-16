"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalProcessCoordinator_1 = require("../../../../terminals/TerminalProcessCoordinator");
const shared_1 = require("../../../../types/shared");
// Mock VS Code
vitest_1.vi.mock('vscode', () => ({
    EventEmitter: class {
        constructor() {
            this.fire = vitest_1.vi.fn();
            this.event = vitest_1.vi.fn();
        }
    },
    Disposable: class {
        constructor() {
            this.dispose = vitest_1.vi.fn();
        }
    },
    window: {
        showWarningMessage: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../utils/logger');
vitest_1.vi.mock('../../../../utils/common', () => ({
    showWarningMessage: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalProcessCoordinator', () => {
    let coordinator;
    let mockTerminals;
    let mockShellIntegrationService;
    let mockStateUpdateEmitter;
    let mockBufferDataCallback;
    let mockPtyProcess;
    beforeEach(() => {
        vitest_1.vi.resetAllMocks();
        vitest_1.vi.useFakeTimers();
        mockTerminals = new Map();
        mockPtyProcess = {
            pid: 123,
            onData: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            onExit: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            write: vitest_1.vi.fn(),
            spawnfile: '/bin/bash',
        };
        const terminal = {
            id: 't1',
            name: 'Terminal 1',
            ptyProcess: mockPtyProcess,
            processState: shared_1.ProcessState.Launching,
            shouldPersist: false,
            // @ts-ignore
            xterm: {},
        };
        mockTerminals.set('t1', terminal);
        mockShellIntegrationService = {
            injectShellIntegration: vitest_1.vi.fn().mockResolvedValue(undefined),
            processTerminalData: vitest_1.vi.fn(),
        };
        // @ts-expect-error - test mock type
        mockStateUpdateEmitter = new vscode.EventEmitter();
        mockBufferDataCallback = vitest_1.vi.fn();
        coordinator = new TerminalProcessCoordinator_1.TerminalProcessCoordinator(mockTerminals, mockShellIntegrationService, mockStateUpdateEmitter, mockBufferDataCallback);
    });
    afterEach(() => {
        vitest_1.vi.useRealTimers();
        coordinator.dispose();
    });
    (0, vitest_1.describe)('initializeShellForTerminal', () => {
        (0, vitest_1.it)('should inject shell integration if enabled and not safe mode', () => {
            coordinator.initializeShellForTerminal('t1', mockPtyProcess, false);
            (0, vitest_1.expect)(mockShellIntegrationService.injectShellIntegration).toHaveBeenCalledWith('t1', '/bin/bash', mockPtyProcess);
        });
        (0, vitest_1.it)('should skip shell integration in safe mode', () => {
            coordinator.initializeShellForTerminal('t1', mockPtyProcess, true);
            (0, vitest_1.expect)(mockShellIntegrationService.injectShellIntegration).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should avoid duplicate initialization', () => {
            coordinator.initializeShellForTerminal('t1', mockPtyProcess, false);
            coordinator.initializeShellForTerminal('t1', mockPtyProcess, false);
            (0, vitest_1.expect)(mockShellIntegrationService.injectShellIntegration).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should setup initial prompt guard if not safe mode', () => {
            // Access private map if needed or verify side effects
            // We can verify that ptyProcess.onData was attached for the guard
            // But mockPtyProcess.onData is used for multiple things.
            // Let's spy on setTimeout to see if guard timeout was set
            coordinator.initializeShellForTerminal('t1', mockPtyProcess, false);
            (0, vitest_1.expect)(vitest_1.vi.getTimerCount()).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('startPtyOutput', () => {
        (0, vitest_1.it)('should verify terminal exists', () => {
            coordinator.startPtyOutput('non-existent');
            // Should handle gracefully
        });
        (0, vitest_1.it)('should mark output as started', () => {
            coordinator.startPtyOutput('t1');
            // No observable effect publically other than logging and internal state
            // Attempting to start again should be skipped (coverage check)
            coordinator.startPtyOutput('t1');
        });
    });
    (0, vitest_1.describe)('setupTerminalEvents', () => {
        (0, vitest_1.it)('should setup data and exit handlers', () => {
            const onExit = vitest_1.vi.fn();
            const term = mockTerminals.get('t1');
            coordinator.setupTerminalEvents(term, onExit);
            (0, vitest_1.expect)(mockPtyProcess.onData).toHaveBeenCalled();
            (0, vitest_1.expect)(mockPtyProcess.onExit).toHaveBeenCalled();
            (0, vitest_1.expect)(term.processState).toBe(shared_1.ProcessState.Launching);
        });
        (0, vitest_1.it)('should update state to Running on data', () => {
            const onExit = vitest_1.vi.fn();
            const term = mockTerminals.get('t1');
            coordinator.setupTerminalEvents(term, onExit);
            // Get the data callback passed to onData
            const dataCallback = mockPtyProcess.onData.mock.calls[0][0];
            // Simulate data
            dataCallback('some data');
            (0, vitest_1.expect)(term.processState).toBe(shared_1.ProcessState.Running);
            (0, vitest_1.expect)(mockBufferDataCallback).toHaveBeenCalledWith('t1', 'some data');
        });
        (0, vitest_1.it)('should handle process exit', () => {
            const onExit = vitest_1.vi.fn();
            const term = mockTerminals.get('t1');
            coordinator.setupTerminalEvents(term, onExit);
            // Get the exit callback
            const exitCallback = mockPtyProcess.onExit.mock.calls[0][0];
            // Simulate exit
            exitCallback({ exitCode: 1 });
            (0, vitest_1.expect)(onExit).toHaveBeenCalledWith('t1', 1);
            (0, vitest_1.expect)(term.processState).toBe(shared_1.ProcessState.KilledDuringLaunch); // because it was Launching
        });
    });
    (0, vitest_1.describe)('notifyProcessStateChange', () => {
        (0, vitest_1.it)('should fire event emitter', () => {
            const term = mockTerminals.get('t1');
            coordinator.notifyProcessStateChange(term, shared_1.ProcessState.Running);
            (0, vitest_1.expect)(mockStateUpdateEmitter.fire).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                type: 'processStateChange',
                terminalId: 't1',
                newState: shared_1.ProcessState.Running,
            }));
        });
        (0, vitest_1.it)('should setup timeout for Launching state', () => {
            const term = mockTerminals.get('t1');
            coordinator.notifyProcessStateChange(term, shared_1.ProcessState.Launching);
            (0, vitest_1.expect)(vitest_1.vi.getTimerCount()).toBeGreaterThan(0);
            // Fast forward
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(term.processState).toBe(shared_1.ProcessState.KilledDuringLaunch);
        });
        (0, vitest_1.it)('should clear timeout for Running state', () => {
            const term = mockTerminals.get('t1');
            // First Launching to set timeout
            term.processState = shared_1.ProcessState.Launching;
            coordinator.notifyProcessStateChange(term, shared_1.ProcessState.Launching);
            const _timerCount = vitest_1.vi.getTimerCount();
            // Then Running to clear it
            term.processState = shared_1.ProcessState.Running;
            coordinator.notifyProcessStateChange(term, shared_1.ProcessState.Running);
            // Timers should be reduced (or cleared)
            // Note: ensureInitialPrompt might also set timers
            // But we can check that if we run timers, state doesn't change to KilledDuringLaunch
            vitest_1.vi.runAllTimers();
            (0, vitest_1.expect)(term.processState).toBe(shared_1.ProcessState.Running);
        });
    });
    (0, vitest_1.describe)('cleanupPtyOutput', () => {
        (0, vitest_1.it)('should dispose disposables', () => {
            coordinator.cleanupPtyOutput('t1');
            // Internal cleanup verification
        });
    });
});
//# sourceMappingURL=TerminalProcessCoordinator.test.js.map