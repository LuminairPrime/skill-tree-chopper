'use strict';
/**
 * PersistenceMessageHandler Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const PersistenceMessageHandler_1 = require('../../../../handlers/PersistenceMessageHandler');
// Mock dependencies
const { mockPersistenceService } = vitest_1.vi.hoisted(() => ({
  mockPersistenceService: {
    saveCurrentSession: vitest_1.vi.fn(),
    restoreSession: vitest_1.vi.fn(),
    cleanupExpiredSessions: vitest_1.vi.fn(),
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
  extension: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('PersistenceMessageHandler', () => {
  let handler;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    handler = new PersistenceMessageHandler_1.PersistenceMessageHandler(mockPersistenceService);
  });
  (0, vitest_1.describe)('handleMessage', () => {
    (0, vitest_1.it)('should handle saveSession command', async () => {
      mockPersistenceService.saveCurrentSession.mockResolvedValue({
        success: true,
        terminalCount: 2,
      });
      const response = await handler.handleMessage({ command: 'saveSession' });
      (0, vitest_1.expect)(response.success).toBe(true);
      (0, vitest_1.expect)(response.terminalCount).toBe(2);
      (0, vitest_1.expect)(mockPersistenceService.saveCurrentSession).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle restoreSession command', async () => {
      mockPersistenceService.restoreSession.mockResolvedValue({
        success: true,
        terminalsRestored: 1,
        terminals: [{ id: 't1' }],
      });
      const response = await handler.handleMessage({ command: 'restoreSession' });
      (0, vitest_1.expect)(response.success).toBe(true);
      (0, vitest_1.expect)(response.terminalCount).toBe(1);
      (0, vitest_1.expect)(response.data).toHaveLength(1);
    });
    (0, vitest_1.it)('should handle clearSession command', async () => {
      mockPersistenceService.cleanupExpiredSessions.mockResolvedValue(undefined);
      const response = await handler.handleMessage({ command: 'clearSession' });
      (0, vitest_1.expect)(response.success).toBe(true);
      (0, vitest_1.expect)(mockPersistenceService.cleanupExpiredSessions).toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should handle alternative command names (persistenceSaveSession, etc)',
      async () => {
        mockPersistenceService.saveCurrentSession.mockResolvedValue({ success: true });
        await handler.handleMessage({ command: 'persistenceSaveSession' });
        (0, vitest_1.expect)(mockPersistenceService.saveCurrentSession).toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)('should return error for unknown commands', async () => {
      const response = await handler.handleMessage({ command: 'unknown' });
      (0, vitest_1.expect)(response.success).toBe(false);
      (0, vitest_1.expect)(response.error).toContain('Unknown persistence command');
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle service failures gracefully', async () => {
      mockPersistenceService.saveCurrentSession.mockRejectedValue(new Error('Disk full'));
      const response = await handler.handleMessage({ command: 'saveSession' });
      (0, vitest_1.expect)(response.success).toBe(false);
      (0, vitest_1.expect)(response.error).toContain('Disk full');
    });
  });
  (0, vitest_1.describe)('Response Helpers', () => {
    (0, vitest_1.it)('should create webview messages with timestamps', () => {
      const msg = handler.createWebViewMessage('test', { foo: 'bar' });
      (0, vitest_1.expect)(msg.command).toBe('persistenceTestResponse');
      (0, vitest_1.expect)(msg.data).toEqual({ foo: 'bar' });
      (0, vitest_1.expect)(msg.timestamp).toBeDefined();
    });
    (0, vitest_1.it)('should create error responses', () => {
      const msg = handler.createErrorResponse('fail', 'oops');
      (0, vitest_1.expect)(msg.success).toBe(false);
      (0, vitest_1.expect)(msg.data).toEqual({ error: 'oops' });
    });
  });
});
//# sourceMappingURL=PersistenceMessageHandler.test.js.map
