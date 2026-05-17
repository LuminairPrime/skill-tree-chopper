'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const SessionLifecycleManager_1 = require('../../../../core/SessionLifecycleManager');
const debugSpy = vitest_1.vi.hoisted(() => vitest_1.vi.fn());
vitest_1.vi.mock('../../../../utils/logger', () => ({
  logger: {
    debug: debugSpy,
    error: vitest_1.vi.fn(),
    info: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
  },
}));
(0, vitest_1.describe)('SessionLifecycleManager - scrollback extraction logging', () => {
  (0, vitest_1.it)('logs debug details when scrollback extraction fails', async () => {
    const error = new Error('scrollback failed');
    const mockTerminalManager = {
      getTerminals: () => [{ id: 'term-1' }],
    };
    const mockSidebarProvider = {
      _sendMessage: vitest_1.vi.fn().mockRejectedValue(error),
    };
    const manager = new SessionLifecycleManager_1.SessionLifecycleManager({
      getTerminalManager: () => mockTerminalManager,
      getSidebarProvider: () => mockSidebarProvider,
      getExtensionPersistenceService: () => undefined,
      getExtensionContext: () => undefined,
    });
    await manager.extractScrollbackFromAllTerminals();
    (0, vitest_1.expect)(debugSpy).toHaveBeenCalledWith(
      vitest_1.expect.stringContaining(
        'Scrollback extraction failed for terminal term-1: scrollback failed'
      )
    );
  });
});
//# sourceMappingURL=SessionLifecycleManager.test.js.map
