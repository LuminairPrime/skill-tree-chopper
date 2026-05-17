'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
// Mock common utility FIRST
vitest_1.vi.mock('../../../../../utils/common', () => ({
  getTerminalConfig: vitest_1.vi.fn(() => ({ maxTerminals: 5 })),
  getShellForPlatform: vitest_1.vi.fn(() => '/bin/bash'),
  getWorkingDirectory: vitest_1.vi.fn(async () => '/test/cwd'),
  generateTerminalId: vitest_1.vi.fn(() => 'term-123'),
  generateTerminalName: vitest_1.vi.fn(() => 'Terminal 1'),
  ActiveTerminalManager: class {
    constructor() {
      this.setActive = vitest_1.vi.fn();
      this.getActive = vitest_1.vi.fn();
      this.clearActive = vitest_1.vi.fn();
      this.hasActive = vitest_1.vi.fn();
      this.isActive = vitest_1.vi.fn();
    }
  },
}));
const pty = require('node-pty');
const TerminalLifecycleService_1 = require('../../../../../services/terminal/TerminalLifecycleService');
// Mock other dependencies
vitest_1.vi.mock('node-pty', () => ({
  spawn: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../../../../utils/logger');
(0, vitest_1.describe)('TerminalLifecycleService', () => {
  let service;
  let mockPtyProcess;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    mockPtyProcess = {
      pid: 1234,
      onData: vitest_1.vi.fn(),
      onExit: vitest_1.vi.fn(),
      kill: vitest_1.vi.fn(),
      resize: vitest_1.vi.fn(),
      write: vitest_1.vi.fn(),
    };
    vitest_1.vi.mocked(pty.spawn).mockReturnValue(mockPtyProcess);
    service = new TerminalLifecycleService_1.TerminalLifecycleService();
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
  });
  (0, vitest_1.describe)('createTerminal', () => {
    (0, vitest_1.it)('should create a terminal instance successfully', async () => {
      const result = await service.createTerminal();
      (0, vitest_1.expect)(result.success).toBe(true);
      if (result.success) {
        (0, vitest_1.expect)(result.value.id).toBe('term-123');
        (0, vitest_1.expect)(result.value.pid).toBe(1234);
        (0, vitest_1.expect)(pty.spawn).toHaveBeenCalled();
      }
    });
    (0, vitest_1.it)('should respect custom options', async () => {
      const options = {
        shell: '/bin/zsh',
        shellArgs: ['-i'],
        cwd: '/custom/dir',
        terminalName: 'My Term',
      };
      const result = await service.createTerminal(options);
      (0, vitest_1.expect)(result.success).toBe(true);
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledWith(
        '/bin/zsh',
        ['-i'],
        vitest_1.expect.objectContaining({ cwd: '/custom/dir' })
      );
    });
    (0, vitest_1.it)('should prevent duplicate creation of same ID', async () => {
      // Since it's async, we can try to call it twice in parallel.
      const p1 = service.createTerminal();
      const p2 = service.createTerminal();
      const [r1, r2] = await Promise.all([p1, p2]);
      // Count successes and failures
      const results = [r1, r2];
      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      // Exactly one should succeed (the first to acquire the lock)
      (0, vitest_1.expect)(succeeded).toHaveLength(1);
      // One should fail due to duplicate ID
      (0, vitest_1.expect)(failed).toHaveLength(1);
      // Verify the failure has correct error code
      const failure = failed[0];
      if (!failure.success) {
        (0, vitest_1.expect)(failure.error.code).toBe('TERMINAL_ALREADY_EXISTS');
      }
    });
  });
  (0, vitest_1.describe)('disposeTerminal', () => {
    (0, vitest_1.it)('should kill pty process', async () => {
      const term = {
        id: 't1',
        pty: mockPtyProcess,
      };
      await service.disposeTerminal(term);
      (0, vitest_1.expect)(mockPtyProcess.kill).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('resizeTerminal', () => {
    (0, vitest_1.it)('should call pty.resize', () => {
      const term = { id: 't1', pty: mockPtyProcess };
      service.resizeTerminal(term, 100, 30);
      (0, vitest_1.expect)(mockPtyProcess.resize).toHaveBeenCalledWith(100, 30);
    });
  });
  (0, vitest_1.describe)('sendInputToTerminal', () => {
    (0, vitest_1.it)('should call pty.write', () => {
      const term = { id: 't1', pty: mockPtyProcess };
      service.sendInputToTerminal(term, 'hello');
      (0, vitest_1.expect)(mockPtyProcess.write).toHaveBeenCalledWith('hello');
    });
  });
});
//# sourceMappingURL=TerminalLifecycleService.test.js.map
