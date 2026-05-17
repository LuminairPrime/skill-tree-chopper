'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * ProviderSessionService Tests
 */
const vitest_1 = require('vitest');
const ProviderSessionService_1 = require('../../../../../providers/services/ProviderSessionService');
const TimingConstants_1 = require('../../../../../constants/TimingConstants');
function createMockDeps() {
  return {
    extensionPersistenceService: {
      saveCurrentSession: vitest_1.vi.fn().mockResolvedValue({ success: true }),
      restoreSession: vitest_1.vi.fn().mockResolvedValue(null),
    },
    getTerminals: vitest_1.vi
      .fn()
      .mockReturnValue([{ id: 'terminal-1', name: 'Terminal 1', cwd: '/home' }]),
    getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
    createTerminal: vitest_1.vi.fn().mockReturnValue('terminal-new'),
    sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    getCurrentFontSettings: vitest_1.vi.fn().mockReturnValue({ fontSize: 14 }),
  };
}
(0, vitest_1.describe)('ProviderSessionService', () => {
  let service;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    deps = createMockDeps();
    service = new ProviderSessionService_1.ProviderSessionService(deps);
  });
  (0, vitest_1.describe)('saveCurrentSession', () => {
    (0, vitest_1.it)('should save session successfully', async () => {
      const result = await service.saveCurrentSession();
      (0, vitest_1.expect)(result).toBe(true);
      (0, vitest_1.expect)(deps.extensionPersistenceService.saveCurrentSession).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return false when persistence service not available', async () => {
      deps.extensionPersistenceService = null;
      service = new ProviderSessionService_1.ProviderSessionService(deps);
      const result = await service.saveCurrentSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should return false on save failure', async () => {
      vitest_1.vi.mocked(deps.extensionPersistenceService.saveCurrentSession).mockResolvedValue({
        success: false,
        error: 'Storage full',
      });
      const result = await service.saveCurrentSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should return false on exception', async () => {
      vitest_1.vi
        .mocked(deps.extensionPersistenceService.saveCurrentSession)
        .mockRejectedValue(new Error('Network error'));
      const result = await service.saveCurrentSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
  });
  (0, vitest_1.describe)('restoreLastSession', () => {
    (0, vitest_1.it)('should return false when persistence service not available', async () => {
      deps.extensionPersistenceService = null;
      service = new ProviderSessionService_1.ProviderSessionService(deps);
      const result = await service.restoreLastSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should return false when no session data', async () => {
      const result = await service.restoreLastSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should restore terminals from session', async () => {
      vitest_1.vi.mocked(deps.extensionPersistenceService.restoreSession).mockResolvedValue({
        terminals: [
          { id: 'old-1', name: 'Terminal 1', cwd: '/home', scrollback: ['line1'] },
          { id: 'old-2', name: 'Terminal 2' },
        ],
      });
      let callCount = 0;
      vitest_1.vi.mocked(deps.createTerminal).mockImplementation(() => {
        callCount++;
        return `terminal-${callCount}`;
      });
      const result = await service.restoreLastSession();
      (0, vitest_1.expect)(result).toBe(true);
      (0, vitest_1.expect)(deps.createTerminal).toHaveBeenCalledTimes(2);
      // Should send terminalCreated messages
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'terminalCreated' })
      );
      // Should restore scrollback for the first terminal
      (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'restoreScrollback' })
      );
    });
    (0, vitest_1.it)(
      'should send fontSettings at top level for terminalCreated messages',
      async () => {
        vitest_1.vi.mocked(deps.extensionPersistenceService.restoreSession).mockResolvedValue({
          terminals: [{ id: 'old-1', name: 'Terminal 1' }],
        });
        vitest_1.vi.mocked(deps.createTerminal).mockReturnValue('terminal-1');
        await service.restoreLastSession();
        (0, vitest_1.expect)(deps.sendMessage).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'terminalCreated',
            fontSettings: { fontSize: 14 },
          })
        );
        const terminalCreatedCalls = vitest_1.vi
          .mocked(deps.sendMessage)
          .mock.calls.filter((call) => call[0]?.command === 'terminalCreated');
        (0, vitest_1.expect)(terminalCreatedCalls).toHaveLength(1);
        // @ts-expect-error - test mock type
        (0, vitest_1.expect)(terminalCreatedCalls[0][0].config).toBeUndefined();
      }
    );
    (0, vitest_1.it)(
      'should wait using TIMING_CONSTANTS.WEBVIEW_INIT_DELAY_MS before restoring scrollback',
      async () => {
        vitest_1.vi.useFakeTimers();
        const setTimeoutSpy = vitest_1.vi.spyOn(global, 'setTimeout');
        const originalDelay = TimingConstants_1.TIMING_CONSTANTS.WEBVIEW_INIT_DELAY_MS;
        try {
          TimingConstants_1.TIMING_CONSTANTS.WEBVIEW_INIT_DELAY_MS = 321;
          vitest_1.vi.mocked(deps.extensionPersistenceService.restoreSession).mockResolvedValue({
            terminals: [{ id: 'old-1', name: 'Terminal 1', scrollback: ['line1'] }],
          });
          vitest_1.vi.mocked(deps.createTerminal).mockReturnValue('terminal-1');
          const restorePromise = service.restoreLastSession();
          await vitest_1.vi.runAllTimersAsync();
          await restorePromise;
          (0, vitest_1.expect)(setTimeoutSpy).toHaveBeenCalledWith(
            vitest_1.expect.any(Function),
            321
          );
        } finally {
          TimingConstants_1.TIMING_CONSTANTS.WEBVIEW_INIT_DELAY_MS = originalDelay;
          vitest_1.vi.useRealTimers();
        }
      }
    );
    (0, vitest_1.it)('should handle individual terminal restore failure gracefully', async () => {
      vitest_1.vi.mocked(deps.extensionPersistenceService.restoreSession).mockResolvedValue({
        terminals: [{ id: 'old-1', name: 'Terminal 1' }],
      });
      vitest_1.vi.mocked(deps.createTerminal).mockImplementation(() => {
        throw new Error('Create failed');
      });
      const result = await service.restoreLastSession();
      (0, vitest_1.expect)(result).toBe(false);
    });
  });
});
//# sourceMappingURL=ProviderSessionService.test.js.map
