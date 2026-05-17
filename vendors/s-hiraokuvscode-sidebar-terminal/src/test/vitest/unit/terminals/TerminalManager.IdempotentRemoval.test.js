'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
require('../../../shared/TestSetup');
const TerminalManager_1 = require('../../../../terminals/TerminalManager');
class MockPtyProcess {
  constructor() {
    this.pid = 12345;
  }
  onData() {
    return { dispose: () => {} };
  }
  onExit() {
    return { dispose: () => {} };
  }
  write() {}
  resize() {}
  kill() {}
}
(0, vitest_1.describe)('TerminalManager - Idempotent Removal', () => {
  let terminalManager;
  let spawnStub;
  let mockPty;
  (0, vitest_1.beforeEach)(async () => {
    mockPty = new MockPtyProcess();
    const { TerminalSpawner } = await Promise.resolve().then(() =>
      require('../../../../terminals/TerminalSpawner')
    );
    spawnStub = vitest_1.vi.spyOn(TerminalSpawner.prototype, 'spawnTerminal').mockReturnValue({
      ptyProcess: mockPty,
    });
    terminalManager = new TerminalManager_1.TerminalManager();
  });
  (0, vitest_1.afterEach)(() => {
    terminalManager.dispose();
    spawnStub.mockRestore();
  });
  (0, vitest_1.it)(
    'should fire terminalRemoved event exactly once even if _performCleanup is called multiple times',
    async () => {
      const terminalId = terminalManager.createTerminal();
      let removedEventCount = 0;
      terminalManager.onTerminalRemoved((id) => {
        if (id === terminalId) {
          removedEventCount++;
        }
      });
      // First cleanup
      terminalManager._performCleanup(terminalId);
      (0, vitest_1.expect)(removedEventCount).toBe(1);
      // Second cleanup (should be idempotent)
      terminalManager._performCleanup(terminalId);
      (0, vitest_1.expect)(removedEventCount).toBe(1);
    }
  );
  (0, vitest_1.it)(
    'should only fire exit event once if cleanup is already in progress',
    async () => {
      let exitEventCount = 0;
      terminalManager.onExit(() => {
        exitEventCount++;
      });
      // Trigger pty exit
      terminalManager._processCoordinator.setupTerminalEvents = vitest_1.vi
        .fn()
        .mockImplementation((terminal, callback) => {
          // Keep track of callback
          terminalManager._lastExitCallback = callback;
        });
      // Re-create terminal to use our mocked setupTerminalEvents
      const terminalId2 = terminalManager.createTerminal();
      const exitCallback = terminalManager._lastExitCallback;
      (0, vitest_1.expect)(exitCallback).toBeDefined();
      // Start cleanup
      terminalManager._performCleanup(terminalId2);
      // Call exit callback AFTER cleanup finished
      exitCallback(terminalId2, 0);
      (0, vitest_1.expect)(exitEventCount).toBe(0);
    }
  );
});
//# sourceMappingURL=TerminalManager.IdempotentRemoval.test.js.map
