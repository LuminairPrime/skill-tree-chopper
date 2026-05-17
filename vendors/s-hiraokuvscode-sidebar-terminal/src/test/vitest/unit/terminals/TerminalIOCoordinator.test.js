'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalIOCoordinator_1 = require('../../../../terminals/TerminalIOCoordinator');
const common_1 = require('../../../../utils/common');
const CliAgentDetectionService_1 = require('../../../../services/CliAgentDetectionService');
// Helper to create a mock terminal instance
function createMockTerminal(overrides) {
  return {
    isActive: true,
    ...overrides,
  };
}
// Helper to create a mock CLI agent service
function createMockCliAgentService() {
  return {
    handleInputChunk: vitest_1.vi.fn(),
    handleOutputChunk: vitest_1.vi.fn(),
    getAgentState: vitest_1.vi.fn().mockReturnValue({ status: 'none', agentType: null }),
    dispose: vitest_1.vi.fn(),
    onDidChangeAgentState: vitest_1.vi.fn(),
  };
}
// Helper to create coordinator with common setup
function createCoordinator(terminals, activeTerminalManager, cliAgentService) {
  const atm = activeTerminalManager ?? new common_1.ActiveTerminalManager();
  const cas = cliAgentService ?? createMockCliAgentService();
  return {
    coordinator: new TerminalIOCoordinator_1.TerminalIOCoordinator(terminals, atm, cas),
    atm,
    cas,
  };
}
(0, vitest_1.describe)('TerminalIOCoordinator - PTY recovery', () => {
  (0, vitest_1.it)(
    'retries using terminal.pty when primary is undefined and first write fails',
    () => {
      const ptyWrite = vitest_1.vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('first write failed');
        })
        .mockImplementationOnce(() => undefined);
      const terminal = createMockTerminal({
        id: 'term-1',
        name: 'Test Terminal',
        pty: { write: ptyWrite },
      });
      const terminals = new Map([['term-1', terminal]]);
      const activeTerminalManager = new common_1.ActiveTerminalManager();
      activeTerminalManager.setActive('term-1');
      const mockCliAgentService = createMockCliAgentService();
      const coordinator = new TerminalIOCoordinator_1.TerminalIOCoordinator(
        terminals,
        activeTerminalManager,
        mockCliAgentService
      );
      coordinator.sendInput('ls', 'term-1');
      (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledTimes(2);
    }
  );
  (0, vitest_1.it)('clears ptyProcess when recovery succeeds via terminal.pty', () => {
    const ptyProcessWrite = vitest_1.vi.fn(() => {
      throw new Error('ptyProcess write failed');
    });
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 'term-1',
      name: 'Test Terminal',
      ptyProcess: { write: ptyProcessWrite },
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['term-1', terminal]]);
    const activeTerminalManager = new common_1.ActiveTerminalManager();
    activeTerminalManager.setActive('term-1');
    const mockCliAgentService = createMockCliAgentService();
    const coordinator = new TerminalIOCoordinator_1.TerminalIOCoordinator(
      terminals,
      activeTerminalManager,
      mockCliAgentService
    );
    coordinator.sendInput('pwd', 'term-1');
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledTimes(1);
    (0, vitest_1.expect)(terminal.ptyProcess).toBeUndefined();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - CLI agent input pipeline', () => {
  (0, vitest_1.it)(
    'does not connect on keystrokes alone but connects when Enter submits the command',
    () => {
      const ptyWrite = vitest_1.vi.fn();
      const terminal = createMockTerminal({
        id: 'term-1',
        name: 'Gemini Terminal',
        pty: { write: ptyWrite },
      });
      const terminals = new Map([['term-1', terminal]]);
      const activeTerminalManager = new common_1.ActiveTerminalManager();
      activeTerminalManager.setActive('term-1');
      const cliAgentService = new CliAgentDetectionService_1.CliAgentDetectionService();
      const coordinator = new TerminalIOCoordinator_1.TerminalIOCoordinator(
        terminals,
        activeTerminalManager,
        cliAgentService
      );
      for (const chunk of ['g', 'e', 'm', 'i', 'n', 'i']) {
        coordinator.sendInput(chunk, 'term-1');
        (0, vitest_1.expect)(cliAgentService.getAgentState('term-1')).toEqual({
          status: 'none',
          agentType: null,
        });
      }
      coordinator.sendInput('\r', 'term-1');
      (0, vitest_1.expect)(cliAgentService.getAgentState('term-1')).toEqual({
        status: 'connected',
        agentType: 'gemini',
      });
      cliAgentService.dispose();
    }
  );
});
(0, vitest_1.describe)('TerminalIOCoordinator - sendInput', () => {
  (0, vitest_1.it)('forwards data to PTY via writeToPtyWithValidation', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.sendInput('hello', 't1');
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('hello');
  });
  (0, vitest_1.it)('calls handleInputChunk on cliAgentService', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const cas = createMockCliAgentService();
    const { coordinator } = createCoordinator(terminals, undefined, cas);
    coordinator.sendInput('test-data', 't1');
    (0, vitest_1.expect)(cas.handleInputChunk).toHaveBeenCalledWith('t1', 'test-data');
  });
  (0, vitest_1.it)('attempts PTY recovery when primary write fails and recovery succeeds', () => {
    const failingWrite = vitest_1.vi.fn(() => {
      throw new Error('write error');
    });
    const recoveryWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: { write: failingWrite },
      pty: { write: recoveryWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    // Should not throw - recovery via pty succeeds
    coordinator.sendInput('data', 't1');
    (0, vitest_1.expect)(failingWrite).toHaveBeenCalledWith('data');
    (0, vitest_1.expect)(recoveryWrite).toHaveBeenCalledWith('data');
  });
  (0, vitest_1.it)('resolves terminal ID with explicit ID first', () => {
    const ptyWrite1 = vitest_1.vi.fn();
    const ptyWrite2 = vitest_1.vi.fn();
    const t1 = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite1 },
    });
    const t2 = createMockTerminal({
      id: 't2',
      name: 'T2',
      pty: { write: ptyWrite2 },
    });
    const terminals = new Map([
      ['t1', t1],
      ['t2', t2],
    ]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t2'); // active is t2
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.sendInput('data', 't1'); // explicit t1
    (0, vitest_1.expect)(ptyWrite1).toHaveBeenCalledWith('data');
    (0, vitest_1.expect)(ptyWrite2).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('falls back to active terminal when no explicit ID given', () => {
    const ptyWrite = vitest_1.vi.fn();
    const t1 = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', t1]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.sendInput('data'); // no explicit ID
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('data');
  });
  (0, vitest_1.it)('falls back to first available terminal when no active terminal', () => {
    const ptyWrite = vitest_1.vi.fn();
    const t1 = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', t1]]);
    // No active terminal set
    const { coordinator, cas } = createCoordinator(terminals);
    coordinator.sendInput('data');
    (0, vitest_1.expect)(cas.handleInputChunk).toHaveBeenCalled();
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('data');
  });
  (0, vitest_1.it)('does nothing when no terminal is found', () => {
    const terminals = new Map();
    const { coordinator, cas } = createCoordinator(terminals);
    coordinator.sendInput('data');
    (0, vitest_1.expect)(cas.handleInputChunk).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('does nothing when explicit terminal ID does not exist and no fallback', () => {
    const terminals = new Map();
    const { coordinator, cas } = createCoordinator(terminals);
    coordinator.sendInput('data', 'nonexistent');
    (0, vitest_1.expect)(cas.handleInputChunk).not.toHaveBeenCalled();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - resize', () => {
  (0, vitest_1.it)('validates dimensions and calls PTY resize', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(80, 24, 't1');
    (0, vitest_1.expect)(ptyResize).toHaveBeenCalledWith(80, 24);
  });
  (0, vitest_1.it)('handles missing terminal gracefully without throwing', () => {
    const terminals = new Map();
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('nonexistent');
    const { coordinator } = createCoordinator(terminals, atm);
    // Should not throw
    (0, vitest_1.expect)(() => coordinator.resize(80, 24, 'nonexistent')).not.toThrow();
  });
  (0, vitest_1.it)('handles no terminal ID and no active terminal gracefully', () => {
    const terminals = new Map();
    const { coordinator } = createCoordinator(terminals);
    (0, vitest_1.expect)(() => coordinator.resize(80, 24)).not.toThrow();
  });
  (0, vitest_1.it)('rejects negative dimensions', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(-1, 24, 't1');
    (0, vitest_1.expect)(ptyResize).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('rejects zero dimensions', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(0, 24, 't1');
    (0, vitest_1.expect)(ptyResize).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('rejects dimensions that are too large (cols > 500 or rows > 200)', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(501, 24, 't1');
    (0, vitest_1.expect)(ptyResize).not.toHaveBeenCalled();
    coordinator.resize(80, 201, 't1');
    (0, vitest_1.expect)(ptyResize).not.toHaveBeenCalled();
  });
  (0, vitest_1.it)('uses active terminal when no explicit ID is given', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(80, 24); // no explicit ID
    (0, vitest_1.expect)(ptyResize).toHaveBeenCalledWith(80, 24);
  });
  (0, vitest_1.it)('does not throw when PTY lacks resize method', () => {
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: vitest_1.vi.fn() }, // no resize method
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    (0, vitest_1.expect)(() => coordinator.resize(80, 24, 't1')).not.toThrow();
  });
  (0, vitest_1.it)('does not resize when ptyProcess is killed', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: { resize: ptyResize, killed: true },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    coordinator.resize(80, 24, 't1');
    (0, vitest_1.expect)(ptyResize).not.toHaveBeenCalled();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - writeToTerminal', () => {
  (0, vitest_1.it)('returns true on successful write', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const result = coordinator.writeToTerminal('t1', 'hello');
    (0, vitest_1.expect)(result).toBe(true);
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('hello');
  });
  (0, vitest_1.it)('returns false when terminal is not found', () => {
    const terminals = new Map();
    const { coordinator } = createCoordinator(terminals);
    const result = coordinator.writeToTerminal('nonexistent', 'hello');
    (0, vitest_1.expect)(result).toBe(false);
  });
  (0, vitest_1.it)('returns false when PTY has no write method', () => {
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: {}, // no write method
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const result = coordinator.writeToTerminal('t1', 'hello');
    (0, vitest_1.expect)(result).toBe(false);
  });
  (0, vitest_1.it)('returns false when no PTY instance exists', () => {
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      // no pty or ptyProcess
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const result = coordinator.writeToTerminal('t1', 'hello');
    (0, vitest_1.expect)(result).toBe(false);
  });
  (0, vitest_1.it)('returns false when write throws an exception', () => {
    const ptyWrite = vitest_1.vi.fn(() => {
      throw new Error('write error');
    });
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const result = coordinator.writeToTerminal('t1', 'hello');
    (0, vitest_1.expect)(result).toBe(false);
  });
  (0, vitest_1.it)('prefers ptyProcess over pty when both exist', () => {
    const ptyProcessWrite = vitest_1.vi.fn();
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: { write: ptyProcessWrite },
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.writeToTerminal('t1', 'hello');
    (0, vitest_1.expect)(ptyProcessWrite).toHaveBeenCalledWith('hello');
    (0, vitest_1.expect)(ptyWrite).not.toHaveBeenCalled();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - getTerminalInfo', () => {
  (0, vitest_1.it)('returns correct info including indicatorColor', () => {
    const terminal = createMockTerminal({
      id: 't1',
      name: 'My Terminal',
      isActive: true,
      indicatorColor: '#ff0000',
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const info = coordinator.getTerminalInfo('t1');
    (0, vitest_1.expect)(info).toEqual({
      id: 't1',
      name: 'My Terminal',
      isActive: true,
      indicatorColor: '#ff0000',
    });
  });
  (0, vitest_1.it)('returns info without indicatorColor when not set', () => {
    const terminal = createMockTerminal({
      id: 't1',
      name: 'My Terminal',
      isActive: false,
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    const info = coordinator.getTerminalInfo('t1');
    (0, vitest_1.expect)(info).toEqual({
      id: 't1',
      name: 'My Terminal',
      isActive: false,
    });
    (0, vitest_1.expect)(info).not.toHaveProperty('indicatorColor');
  });
  (0, vitest_1.it)('returns undefined for unknown terminal', () => {
    const terminals = new Map();
    const { coordinator } = createCoordinator(terminals);
    const info = coordinator.getTerminalInfo('nonexistent');
    (0, vitest_1.expect)(info).toBeUndefined();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - resolveTerminalId (via sendInput)', () => {
  (0, vitest_1.it)('uses explicit ID when it exists in the map', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 'explicit',
      name: 'T1',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['explicit', terminal]]);
    const { coordinator, cas } = createCoordinator(terminals);
    coordinator.sendInput('x', 'explicit');
    (0, vitest_1.expect)(cas.handleInputChunk).toHaveBeenCalledWith('explicit', 'x');
  });
  (0, vitest_1.it)('falls back to active when explicit ID not in map', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 'active-t',
      name: 'Active',
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['active-t', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('active-t');
    const { coordinator, cas } = createCoordinator(terminals, atm);
    coordinator.sendInput('x', 'nonexistent');
    (0, vitest_1.expect)(cas.handleInputChunk).toHaveBeenCalledWith('active-t', 'x');
  });
  (0, vitest_1.it)(
    'falls back to first available when both explicit and active are invalid',
    () => {
      const ptyWrite = vitest_1.vi.fn();
      const terminal = createMockTerminal({
        id: 'first',
        name: 'First',
        pty: { write: ptyWrite },
      });
      const terminals = new Map([['first', terminal]]);
      const atm = new common_1.ActiveTerminalManager();
      atm.setActive('invalid-active');
      const { coordinator, cas } = createCoordinator(terminals, atm);
      coordinator.sendInput('x', 'invalid-explicit');
      (0, vitest_1.expect)(cas.handleInputChunk).toHaveBeenCalledWith('first', 'x');
    }
  );
  (0, vitest_1.it)('returns undefined when map is empty (no input sent)', () => {
    const terminals = new Map();
    const { coordinator, cas } = createCoordinator(terminals);
    coordinator.sendInput('x');
    (0, vitest_1.expect)(cas.handleInputChunk).not.toHaveBeenCalled();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - writeToPtyWithValidation retry logic', () => {
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
  });
  (0, vitest_1.it)('schedules a retry with exponential backoff when PTY is not ready', () => {
    // Terminal starts with no PTY
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      // no pty or ptyProcess initially
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.sendInput('data', 't1');
    // After first delay (300ms * 1.5^0 = 300ms), retry should fire
    // Add a pty before the timer fires
    const ptyWrite = vitest_1.vi.fn();
    terminal.pty = { write: ptyWrite };
    vitest_1.vi.advanceTimersByTime(300);
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('data');
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.it)('gives up after MAX_PTY_RETRY_ATTEMPTS', () => {
    // Terminal will never have a PTY
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.sendInput('data', 't1');
    // Advance through all retries: 300, 450, 675ms
    vitest_1.vi.advanceTimersByTime(300); // retry 1
    vitest_1.vi.advanceTimersByTime(450); // retry 2
    vitest_1.vi.advanceTimersByTime(675); // retry 3 - should stop (MAX_PTY_RETRY_ATTEMPTS = 3)
    // No further retries should be scheduled
    const pendingTimers = vitest_1.vi.getTimerCount();
    (0, vitest_1.expect)(pendingTimers).toBe(0);
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.it)('does not write when ptyProcess is killed', () => {
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: {
        write: ptyWrite,
        killed: true,
      },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.sendInput('data', 't1');
    // writeToPtyWithValidation returns failure for killed process,
    // attemptPtyRecovery has no alternatives (pty is not set)
    // so the error is logged but ptyWrite should NOT be called
    (0, vitest_1.expect)(ptyWrite).not.toHaveBeenCalled();
    vitest_1.vi.useRealTimers();
  });
});
(0, vitest_1.describe)('TerminalIOCoordinator - attemptPtyRecovery (via sendInput)', () => {
  (0, vitest_1.it)('tries pty as alternative when ptyProcess fails', () => {
    const ptyProcessWrite = vitest_1.vi.fn(() => {
      throw new Error('ptyProcess broken');
    });
    const ptyWrite = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: { write: ptyProcessWrite },
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    coordinator.sendInput('data', 't1');
    (0, vitest_1.expect)(ptyProcessWrite).toHaveBeenCalledWith('data');
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalledWith('data');
    // ptyProcess should be cleared after successful recovery
    (0, vitest_1.expect)(terminal.ptyProcess).toBeUndefined();
  });
  (0, vitest_1.it)('returns false when both ptyProcess and pty fail (logs error)', () => {
    const ptyProcessWrite = vitest_1.vi.fn(() => {
      throw new Error('ptyProcess broken');
    });
    const ptyWrite = vitest_1.vi.fn(() => {
      throw new Error('pty also broken');
    });
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      ptyProcess: { write: ptyProcessWrite },
      pty: { write: ptyWrite },
    });
    const terminals = new Map([['t1', terminal]]);
    const { coordinator } = createCoordinator(terminals);
    // Should not throw - error is caught and logged
    (0, vitest_1.expect)(() => coordinator.sendInput('data', 't1')).not.toThrow();
    (0, vitest_1.expect)(ptyProcessWrite).toHaveBeenCalled();
    (0, vitest_1.expect)(ptyWrite).toHaveBeenCalled();
  });
  (0, vitest_1.it)(
    'returns false when only ptyProcess exists and it fails (no pty alternative)',
    () => {
      const ptyProcessWrite = vitest_1.vi.fn(() => {
        throw new Error('failed');
      });
      const terminal = createMockTerminal({
        id: 't1',
        name: 'T1',
        ptyProcess: { write: ptyProcessWrite },
        // no pty
      });
      const terminals = new Map([['t1', terminal]]);
      const { coordinator } = createCoordinator(terminals);
      // Should not throw
      (0, vitest_1.expect)(() => coordinator.sendInput('data', 't1')).not.toThrow();
    }
  );
});
(0, vitest_1.describe)('TerminalIOCoordinator - resizeTerminal', () => {
  (0, vitest_1.it)('returns true on successful resize', () => {
    const ptyResize = vitest_1.vi.fn();
    const terminal = createMockTerminal({
      id: 't1',
      name: 'T1',
      pty: { resize: ptyResize },
    });
    const terminals = new Map([['t1', terminal]]);
    const atm = new common_1.ActiveTerminalManager();
    atm.setActive('t1');
    const { coordinator } = createCoordinator(terminals, atm);
    const result = coordinator.resizeTerminal('t1', 80, 24);
    (0, vitest_1.expect)(result).toBe(true);
    (0, vitest_1.expect)(ptyResize).toHaveBeenCalledWith(80, 24);
  });
  (0, vitest_1.it)('returns true even when resize fails internally (error is caught)', () => {
    const terminals = new Map();
    const atm = new common_1.ActiveTerminalManager();
    const { coordinator } = createCoordinator(terminals, atm);
    // resizeTerminal catches errors internally and returns true
    // because resize() does not throw - it catches errors internally
    const result = coordinator.resizeTerminal('nonexistent', 80, 24);
    (0, vitest_1.expect)(result).toBe(true);
  });
});
//# sourceMappingURL=TerminalIOCoordinator.test.js.map
