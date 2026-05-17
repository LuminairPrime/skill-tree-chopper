'use strict';
/**
 * PersistenceOrchestrator Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
require('../../../../shared/TestSetup');
const PersistenceOrchestrator_1 = require('../../../../../providers/secondaryTerminal/PersistenceOrchestrator');
(0, vitest_1.describe)('PersistenceOrchestrator', () => {
  let extensionContext;
  let sendMessage;
  let handler;
  let service;
  let terminalManager;
  let orchestrator;
  let terminalStore;
  (0, vitest_1.beforeEach)(() => {
    extensionContext = {
      subscriptions: [],
    };
    sendMessage = vitest_1.vi.fn().mockResolvedValue(undefined);
    terminalStore = new Map();
    terminalManager = {
      getTerminals: vitest_1.vi.fn().mockReturnValue([]),
      createTerminal: vitest_1.vi.fn().mockImplementation(() => {
        const id = `terminal-${terminalStore.size + 1}`;
        const terminal = { id, name: `Terminal ${terminalStore.size + 1}` };
        terminalStore.set(id, terminal);
        return id;
      }),
      getTerminal: vitest_1.vi.fn().mockImplementation((id) => terminalStore.get(id)),
      setActiveTerminal: vitest_1.vi.fn(),
    };
    handler = {
      handleMessage: vitest_1.vi.fn().mockResolvedValue({ success: true, data: [] }),
    };
    service = {
      saveCurrentSession: vitest_1.vi.fn().mockResolvedValue({ success: true, terminalCount: 1 }),
      restoreSession: vitest_1.vi
        .fn()
        .mockResolvedValue({ success: true, restoredCount: 1, skippedCount: 0 }),
      clearSession: vitest_1.vi.fn().mockResolvedValue(undefined),
      cleanupExpiredSessions: vitest_1.vi.fn().mockResolvedValue(undefined),
      dispose: vitest_1.vi.fn(),
    };
    orchestrator = new PersistenceOrchestrator_1.PersistenceOrchestrator({
      extensionContext,
      terminalManager: terminalManager,
      sendMessage: sendMessage,
      handlerFactory: () => handler,
      serviceFactory: () => service,
      logger: vitest_1.vi.fn(),
    });
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.it)('bridges persistence messages and forwards responses', async () => {
    handler.handleMessage.mockResolvedValue({ success: true, data: [] });
    await orchestrator.handlePersistenceMessage(
      {
        command: 'persistenceSaveSession',
        data: [],
        messageId: 'msg-1',
      },
      // @ts-expect-error - test mock type
      sendMessage
    );
    (0, vitest_1.expect)(handler.handleMessage).toHaveBeenCalled();
    // @ts-expect-error - test mock type
    const args = handler.handleMessage.mock.calls[0][0];
    (0, vitest_1.expect)(args?.command).toBe('savesession');
    (0, vitest_1.expect)(sendMessage).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ command: 'persistenceSaveSessionResponse', success: true })
    );
  });
  (0, vitest_1.it)('maps legacy commands before forwarding', async () => {
    handler.handleMessage.mockResolvedValue({ success: true, data: [] });
    await orchestrator.handleLegacyPersistenceMessage(
      {
        command: 'terminalSerializationRequest',
        data: [],
      },
      // @ts-expect-error - test mock type
      sendMessage
    );
    // @ts-expect-error - test mock type
    const args = handler.handleMessage.mock.calls[0][0];
    (0, vitest_1.expect)(args?.command).toBe('savesession');
  });
  (0, vitest_1.it)('cleans up persistence service on dispose', async () => {
    orchestrator.dispose();
    (0, vitest_1.expect)(service.cleanupExpiredSessions).toHaveBeenCalledOnce();
  });
  (0, vitest_1.it)('saves current session via persistence service', async () => {
    const result = await orchestrator.saveCurrentSession();
    (0, vitest_1.expect)(result).toBe(true);
    (0, vitest_1.expect)(service.saveCurrentSession).toHaveBeenCalledOnce();
  });
  (0, vitest_1.it)('restores sessions using persistence service', async () => {
    const result = await orchestrator.restoreLastSession();
    (0, vitest_1.expect)(result).toBe(true);
    (0, vitest_1.expect)(service.restoreSession).toHaveBeenCalledOnce();
  });
});
//# sourceMappingURL=PersistenceOrchestrator.test.js.map
