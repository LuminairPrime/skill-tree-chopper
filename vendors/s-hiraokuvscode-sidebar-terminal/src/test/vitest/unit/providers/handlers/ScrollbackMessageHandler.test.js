'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * ScrollbackMessageHandler Tests
 */
const vitest_1 = require('vitest');
// Mock vscode (required by logger)
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue(false),
    }),
  },
}));
const ScrollbackMessageHandler_1 = require('../../../../../providers/handlers/ScrollbackMessageHandler');
function createMockPersistenceService() {
  return {
    handlePushedScrollbackData: vitest_1.vi.fn(),
    handleScrollbackDataCollected: vitest_1.vi.fn(),
    handleScrollbackRefreshRequest: vitest_1.vi.fn().mockResolvedValue(undefined),
  };
}
function createMockDeps(persistenceService = null) {
  return {
    getExtensionPersistenceService: vitest_1.vi.fn().mockReturnValue(persistenceService),
  };
}
(0, vitest_1.describe)('ScrollbackMessageHandler', () => {
  let handler;
  let deps;
  let persistenceService;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    persistenceService = createMockPersistenceService();
    deps = createMockDeps(persistenceService);
    handler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(deps);
  });
  (0, vitest_1.describe)('handlePushScrollbackData', () => {
    (0, vitest_1.it)('should forward message to persistence service', async () => {
      const message = { command: 'pushScrollbackData', data: 'test' };
      await handler.handlePushScrollbackData(message);
      (0, vitest_1.expect)(persistenceService.handlePushedScrollbackData).toHaveBeenCalledWith(
        message
      );
    });
    (0, vitest_1.it)('should return early when persistence service is unavailable', async () => {
      const depsNoPersistence = createMockDeps(null);
      const handlerNoPersistence = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(
        depsNoPersistence
      );
      const message = { command: 'pushScrollbackData' };
      // Should not throw
      await handlerNoPersistence.handlePushScrollbackData(message);
    });
    (0, vitest_1.it)('should return early when handler method does not exist', async () => {
      const incompleteService = {};
      const depsIncomplete = createMockDeps(incompleteService);
      const handlerIncomplete = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(
        depsIncomplete
      );
      const message = { command: 'pushScrollbackData' };
      // Should not throw
      await handlerIncomplete.handlePushScrollbackData(message);
    });
    (0, vitest_1.it)('should catch and log errors from persistence service', async () => {
      persistenceService.handlePushedScrollbackData.mockImplementation(() => {
        throw new Error('persistence error');
      });
      const message = { command: 'pushScrollbackData' };
      // Should not throw
      await handler.handlePushScrollbackData(message);
    });
  });
  (0, vitest_1.describe)('handleScrollbackDataCollected', () => {
    (0, vitest_1.it)('should forward scrollback data to persistence service', async () => {
      const message = {
        command: 'scrollbackDataCollected',
        terminalId: 'term-1',
        requestId: 'req-1',
        scrollbackData: ['line1', 'line2'],
      };
      await handler.handleScrollbackDataCollected(message);
      (0, vitest_1.expect)(persistenceService.handleScrollbackDataCollected).toHaveBeenCalledWith({
        terminalId: 'term-1',
        requestId: 'req-1',
        scrollbackData: ['line1', 'line2'],
      });
    });
    (0, vitest_1.it)('should use scrollbackContent as fallback', async () => {
      const message = {
        command: 'scrollbackDataCollected',
        terminalId: 'term-1',
        scrollbackContent: ['line1'],
      };
      await handler.handleScrollbackDataCollected(message);
      (0, vitest_1.expect)(persistenceService.handleScrollbackDataCollected).toHaveBeenCalledWith({
        terminalId: 'term-1',
        requestId: undefined,
        scrollbackData: ['line1'],
      });
    });
    (0, vitest_1.it)('should return early when scrollbackData is not an array', async () => {
      const message = {
        command: 'scrollbackDataCollected',
        terminalId: 'term-1',
      };
      await handler.handleScrollbackDataCollected(message);
      (0, vitest_1.expect)(persistenceService.handleScrollbackDataCollected).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should fallback to pushScrollbackData when persistence service lacks handleScrollbackDataCollected',
      async () => {
        const partialService = {
          handlePushedScrollbackData: vitest_1.vi.fn(),
        };
        const partialDeps = createMockDeps(partialService);
        const partialHandler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(partialDeps);
        const message = {
          command: 'scrollbackDataCollected',
          terminalId: 'term-1',
          scrollbackData: ['line1'],
        };
        await partialHandler.handleScrollbackDataCollected(message);
        (0, vitest_1.expect)(partialService.handlePushedScrollbackData).toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should fallback to pushScrollbackData when persistence service is null',
      async () => {
        const nullDeps = createMockDeps(null);
        const nullHandler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(nullDeps);
        const message = {
          command: 'scrollbackDataCollected',
          terminalId: 'term-1',
          scrollbackData: ['line1'],
        };
        // Should not throw - both paths handle null gracefully
        await nullHandler.handleScrollbackDataCollected(message);
      }
    );
  });
  (0, vitest_1.describe)('handleScrollbackRefreshRequest', () => {
    (0, vitest_1.it)('should forward refresh request to persistence service', async () => {
      const message = {
        command: 'requestScrollbackRefresh',
      };
      await handler.handleScrollbackRefreshRequest(message);
      (0, vitest_1.expect)(persistenceService.handleScrollbackRefreshRequest).toHaveBeenCalledWith(
        message
      );
    });
    (0, vitest_1.it)('should return early when persistence service is unavailable', async () => {
      const depsNoPersistence = createMockDeps(null);
      const handlerNoPersistence = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(
        depsNoPersistence
      );
      const message = { command: 'requestScrollbackRefresh' };
      await handlerNoPersistence.handleScrollbackRefreshRequest(message);
    });
    (0, vitest_1.it)('should return early when handler method does not exist', async () => {
      const incompleteService = {};
      const depsIncomplete = createMockDeps(incompleteService);
      const handlerIncomplete = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(
        depsIncomplete
      );
      const message = { command: 'requestScrollbackRefresh' };
      await handlerIncomplete.handleScrollbackRefreshRequest(message);
    });
    (0, vitest_1.it)('should catch and log errors from persistence service', async () => {
      persistenceService.handleScrollbackRefreshRequest.mockRejectedValue(
        new Error('refresh error')
      );
      const message = { command: 'requestScrollbackRefresh' };
      // Should not throw
      await handler.handleScrollbackRefreshRequest(message);
    });
  });
});
//# sourceMappingURL=ScrollbackMessageHandler.test.js.map
