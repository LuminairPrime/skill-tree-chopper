'use strict';
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * TDD Test Suite for Terminal History Restoration
 *
 * User Issue: "terminalに以前の履歴が表示されなく、新規の状態で復元されます"
 * (Terminals restore in new state without previous history)
 *
 * This test suite follows TDD methodology:
 * RED -> GREEN -> REFACTOR
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockImplementation((section) => ({
      get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
        if (section === 'secondaryTerminal') {
          if (key === 'enablePersistentSessions') return true;
          if (key === 'persistentSessionScrollback') return 1000;
          if (key === 'persistentSessionStorageLimit') return 20;
          if (key === 'persistentSessionExpiryDays') return 7;
        }
        return defaultValue;
      }),
    })),
  },
  Disposable: class {
    dispose() {}
  },
}));
(0, vitest_1.describe)('Terminal History Restoration', () => {
  let mockContext;
  (0, vitest_1.beforeEach)(() => {
    // Mock VS Code context
    mockContext = {
      globalState: {
        get: vitest_1.vi.fn(),
        update: vitest_1.vi.fn().mockResolvedValue(undefined),
        keys: vitest_1.vi.fn().mockReturnValue([]),
      },
      workspaceState: {
        get: vitest_1.vi.fn(),
        update: vitest_1.vi.fn().mockResolvedValue(undefined),
      },
    };
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('RED Phase - Failing Tests (Expected Behavior)', () => {
    (0, vitest_1.it)(
      'should fail: message flow for session restoration should be established',
      async () => {
        // 1. Arrange
        const mockTerminalManager = {
          getTerminals: vitest_1.vi.fn().mockReturnValue([]),
          createTerminal: vitest_1.vi.fn().mockReturnValue('term-1'),
          setActiveTerminal: vitest_1.vi.fn(),
          reorderTerminals: vitest_1.vi.fn(),
          renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
          updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
        };
        const mockSidebarProvider = {
          sendMessageToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        // Import the service dynamically to allow mocking dependencies if needed
        // but here we inject mocks via constructor
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service = new ExtensionPersistenceService(
          mockContext,
          mockTerminalManager,
          mockSidebarProvider
        );
        // Setup session data in mock storage
        const sessionData = {
          version: '4.0.0',
          timestamp: Date.now(),
          terminals: [
            {
              id: 'term-original-1',
              name: 'Terminal 1',
              number: 1,
              cwd: '/test/cwd',
              isActive: true,
            },
          ],
          scrollbackData: {
            'term-original-1': ['line 1', 'line 2'],
          },
        };
        mockContext.globalState.get.mockReturnValue(sessionData);
        // Also mock workspaceState as that's what the service actually uses
        mockContext.workspaceState = {
          get: vitest_1.vi.fn().mockReturnValue(sessionData),
          update: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        // 2. Act
        const result = await service.restoreSession();
        // 3. Assert
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalledTimes(1);
        // Verify message sent to WebView
        (0, vitest_1.expect)(mockSidebarProvider.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'restoreTerminalSessions',
            terminals: vitest_1.expect.arrayContaining([
              vitest_1.expect.objectContaining({
                terminalId: 'term-1',
                // The service maps original ID to new ID, but scrollback should be from original
                scrollbackData: ['line 1', 'line 2'],
              }),
            ]),
          })
        );
      }
    );
    (0, vitest_1.it)(
      'should fail: terminal serialization should capture actual content',
      async () => {
        // 1. Arrange
        const mockTerminalManager = {
          getTerminals: vitest_1.vi
            .fn()
            .mockReturnValue([{ id: 'term-1', name: 'Terminal 1', cwd: '/cwd', number: 1 }]),
          getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
        };
        const mockSidebarProvider = {
          sendMessageToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service = new ExtensionPersistenceService(
          mockContext,
          mockTerminalManager,
          mockSidebarProvider
        );
        // Simulate the WebView responding to the extraction request
        // We need to spy on sendMessageToWebview to trigger the response
        mockSidebarProvider.sendMessageToWebview.mockImplementation(async (msg) => {
          if (msg.command === 'extractScrollbackData') {
            // Simulate async response from WebView
            setTimeout(() => {
              service.handleScrollbackDataCollected({
                terminalId: msg.terminalId,
                requestId: msg.requestId,
                scrollbackData: ['restored line 1', 'restored line 2'],
              });
            }, 10);
          }
        });
        // 2. Act
        const result = await service.saveCurrentSession();
        // 3. Assert
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(mockSidebarProvider.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'extractScrollbackData',
            terminalId: 'term-1',
          })
        );
        // Verify data saved to storage
        (0, vitest_1.expect)(mockContext.workspaceState.update).toHaveBeenCalledWith(
          'terminal-session-unified',
          vitest_1.expect.objectContaining({
            terminals: vitest_1.expect.arrayContaining([
              vitest_1.expect.objectContaining({ id: 'term-1', name: 'Terminal 1' }),
            ]),
            scrollbackData: vitest_1.expect.objectContaining({
              'term-1': ['restored line 1', 'restored line 2'],
            }),
          })
        );
      }
    );
    (0, vitest_1.it)('should fail: session data should be saved to Extension storage', async () => {
      // Setup
      const mockTerminalManager = {
        getTerminals: vitest_1.vi.fn().mockReturnValue([{ id: 't1', name: 'T1', number: 1 }]),
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('t1'),
      };
      const mockSidebarProvider = { sendMessageToWebview: vitest_1.vi.fn() };
      const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
        require('../../../../services/persistence/ExtensionPersistenceService')
      );
      const service = new ExtensionPersistenceService(
        mockContext,
        mockTerminalManager,
        mockSidebarProvider
      );
      // Act
      service.handleScrollbackDataCollected({
        terminalId: 't1',
        requestId: 'any',
        scrollbackData: ['data'],
      });
      await service.saveCurrentSession({ preferCache: true });
      // Assert
      (0, vitest_1.expect)(mockContext.workspaceState.update).toHaveBeenCalledWith(
        'terminal-session-unified',
        vitest_1.expect.objectContaining({
          scrollbackData: vitest_1.expect.objectContaining({ t1: ['data'] }),
        })
      );
    });
    (0, vitest_1.it)(
      'should fail: session data should be retrieved and sent to WebView',
      async () => {
        // Already covered by established message flow test, but adding explicit check for clarity
        const sessionData = {
          version: '4.0.0',
          timestamp: Date.now(),
          terminals: [{ id: 'orig-1', name: 'T1', number: 1, cwd: '/tmp', isActive: true }],
          scrollbackData: { 'orig-1': ['history'] },
        };
        mockContext.workspaceState.get.mockReturnValue(sessionData);
        const mockTerminalManager = {
          getTerminals: vitest_1.vi.fn().mockReturnValue([]),
          createTerminal: vitest_1.vi.fn().mockReturnValue('new-1'),
          setActiveTerminal: vitest_1.vi.fn(),
          reorderTerminals: vitest_1.vi.fn(),
          renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
          updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
        };
        const mockSidebarProvider = { sendMessageToWebview: vitest_1.vi.fn() };
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service = new ExtensionPersistenceService(
          mockContext,
          mockTerminalManager,
          mockSidebarProvider
        );
        await service.restoreSession();
        (0, vitest_1.expect)(mockSidebarProvider.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'restoreTerminalSessions',
            terminals: vitest_1.expect.arrayContaining([
              vitest_1.expect.objectContaining({
                terminalId: 'new-1',
                scrollbackData: ['history'],
              }),
            ]),
          })
        );
      }
    );
    (0, vitest_1.it)(
      'should fail: async terminal readiness should trigger scrollback restoration',
      async () => {
        // Test handling of handleTerminalReady
        const sessionData = {
          version: '4.0.0',
          timestamp: Date.now(),
          terminals: [{ id: 'orig-1', name: 'T1', number: 1, cwd: '/tmp', isActive: true }],
          scrollbackData: { 'orig-1': ['history'] },
        };
        mockContext.workspaceState.get.mockReturnValue(sessionData);
        const mockTerminalManager = {
          getTerminals: vitest_1.vi.fn().mockReturnValue([]),
          createTerminal: vitest_1.vi.fn().mockReturnValue('new-1'),
          setActiveTerminal: vitest_1.vi.fn(),
          reorderTerminals: vitest_1.vi.fn(),
          renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
          updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
        };
        const mockSidebarProvider = { sendMessageToWebview: vitest_1.vi.fn() };
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service = new ExtensionPersistenceService(
          mockContext,
          mockTerminalManager,
          mockSidebarProvider
        );
        // Act: start restore
        const restorePromise = service.restoreSession();
        // Simulate terminal readiness from WebView
        service.handleTerminalReady('new-1');
        await restorePromise;
        // Verify restoration message was eventually sent
        (0, vitest_1.expect)(mockSidebarProvider.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({ command: 'restoreTerminalSessions' })
        );
      }
    );
  });
  (0, vitest_1.describe)('Real User Scenario Tests (Should Fail Initially)', () => {
    (0, vitest_1.it)(
      'should fail: CLI Agent commands should be preserved across VS Code restarts',
      async () => {
        // 1. Arrange - Initial State
        const _mockStorage = new Map();
        // Mock Context for First Session (Save)
        const context1 = {
          globalState: {
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            keys: vitest_1.vi.fn().mockReturnValue([]),
          },
          workspaceState: {
            get: vitest_1.vi.fn().mockImplementation((k) => _mockStorage.get(k)),
            update: vitest_1.vi.fn().mockImplementation((k, v) => {
              _mockStorage.set(k, v);
              return Promise.resolve();
            }),
          },
        };
        const terminalManager1 = {
          getTerminals: vitest_1.vi
            .fn()
            .mockReturnValue([
              { id: 'term-1', name: 'Terminal 1', cwd: '/cwd', number: 1, isActive: true },
            ]),
          getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
        };
        const sidebarProvider1 = {
          sendMessageToWebview: vitest_1.vi.fn().mockImplementation(async (msg) => {
            if (msg.command === 'extractScrollbackData') {
              // Simulate WebView response
              setTimeout(() => {
                service1.handleScrollbackDataCollected({
                  terminalId: msg.terminalId,
                  requestId: msg.requestId,
                  scrollbackData: ['cmd: ls', 'file1.txt file2.txt'],
                });
              }, 5);
            }
          }),
        };
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service1 = new ExtensionPersistenceService(
          context1,
          terminalManager1,
          sidebarProvider1
        );
        // 2. Act - Save Session
        const saveResult = await service1.saveCurrentSession();
        (0, vitest_1.expect)(saveResult.success).toBe(true);
        // Simulate VS Code Restart (Dispose service1, create service2)
        service1.dispose();
        // Mock Context for Second Session (Restore)
        const context2 = {
          globalState: {
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            keys: vitest_1.vi.fn().mockReturnValue([]),
          },
          workspaceState: {
            get: vitest_1.vi.fn().mockImplementation((k) => _mockStorage.get(k)),
            update: vitest_1.vi.fn().mockImplementation((k, v) => {
              _mockStorage.set(k, v);
              return Promise.resolve();
            }),
          },
        };
        const terminalManager2 = {
          getTerminals: vitest_1.vi.fn().mockReturnValue([]), // Empty initially
          createTerminal: vitest_1.vi.fn().mockReturnValue('term-new-1'),
          setActiveTerminal: vitest_1.vi.fn(),
          reorderTerminals: vitest_1.vi.fn(),
          renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
          updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
        };
        const sidebarProvider2 = {
          sendMessageToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        const service2 = new ExtensionPersistenceService(
          context2,
          terminalManager2,
          sidebarProvider2
        );
        // 3. Act - Restore Session
        const restoreResult = await service2.restoreSession();
        // 4. Assert
        (0, vitest_1.expect)(restoreResult.success).toBe(true);
        (0, vitest_1.expect)(terminalManager2.createTerminal).toHaveBeenCalled();
        // Verify restoration message
        (0, vitest_1.expect)(sidebarProvider2.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'restoreTerminalSessions',
            terminals: vitest_1.expect.arrayContaining([
              vitest_1.expect.objectContaining({
                terminalId: 'term-new-1',
                scrollbackData: ['cmd: ls', 'file1.txt file2.txt'],
              }),
            ]),
          })
        );
      }
    );
    (0, vitest_1.it)(
      'should fail: multiple terminals should all restore with history',
      async () => {
        // 1. Arrange - Setup multiple terminals in session
        const sessionData = {
          version: '4.0.0',
          timestamp: Date.now(),
          terminals: [
            { id: 't1-orig', name: 'Term 1', number: 1, cwd: '/cwd1', isActive: false },
            { id: 't2-orig', name: 'Term 2', number: 2, cwd: '/cwd2', isActive: true },
          ],
          scrollbackData: {
            't1-orig': ['line 1-1', 'line 1-2'],
            't2-orig': ['line 2-1', 'line 2-2'],
          },
        };
        mockContext.workspaceState = {
          get: vitest_1.vi.fn().mockReturnValue(sessionData),
          update: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        const mockTerminalManager = {
          getTerminals: vitest_1.vi.fn().mockReturnValue([]),
          createTerminal: vitest_1.vi
            .fn()
            .mockReturnValueOnce('t1-new')
            .mockReturnValueOnce('t2-new'),
          setActiveTerminal: vitest_1.vi.fn(),
          reorderTerminals: vitest_1.vi.fn(),
          renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
          updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
        };
        const mockSidebarProvider = {
          sendMessageToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        const { ExtensionPersistenceService } = await Promise.resolve().then(() =>
          require('../../../../services/persistence/ExtensionPersistenceService')
        );
        const service = new ExtensionPersistenceService(
          mockContext,
          mockTerminalManager,
          mockSidebarProvider
        );
        // 2. Act
        const result = await service.restoreSession();
        // 3. Assert
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.restoredCount).toBe(2);
        (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalledTimes(2);
        // Verify active terminal set correctly (Term 2 was active)
        (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t2-new');
        // Verify scrollback restoration message contains both terminals
        (0, vitest_1.expect)(mockSidebarProvider.sendMessageToWebview).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            command: 'restoreTerminalSessions',
            terminals: vitest_1.expect.arrayContaining([
              vitest_1.expect.objectContaining({
                terminalId: 't1-new',
                scrollbackData: ['line 1-1', 'line 1-2'],
              }),
              vitest_1.expect.objectContaining({
                terminalId: 't2-new',
                scrollbackData: ['line 2-1', 'line 2-2'],
              }),
            ]),
          })
        );
      }
    );
  });
});
//# sourceMappingURL=TerminalHistoryRestoration.test.js.map
