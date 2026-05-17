'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
const vitest_1 = require('vitest');
const CliAgentWebViewService_1 = require('../../../../../services/webview/CliAgentWebViewService');
(0, vitest_1.describe)('CliAgentWebViewService', () => {
  let service;
  let mockContext;
  (0, vitest_1.beforeEach)(() => {
    service = new CliAgentWebViewService_1.CliAgentWebViewService();
    // Create mock context
    mockContext = {
      extensionContext: {
        subscriptions: [],
      },
      terminalManager: {
        getConnectedAgentTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
        getConnectedAgentType: vitest_1.vi.fn().mockReturnValue('claude'),
        getDisconnectedAgents: vitest_1.vi
          .fn()
          .mockReturnValue(new Map([['terminal-2', { type: 'gemini', lastSeen: Date.now() }]])),
        getTerminals: vitest_1.vi.fn().mockReturnValue([
          { id: 'terminal-1', name: 'Terminal 1' },
          { id: 'terminal-2', name: 'Terminal 2' },
          { id: 'terminal-3', name: 'Terminal 3' },
        ]),
        onCliAgentStatusChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        switchAiAgentConnection: vitest_1.vi.fn().mockReturnValue({
          success: true,
          newStatus: 'connected',
          agentType: 'claude',
        }),
      },
      webview: undefined,
      sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
      terminalIdMapping: new Map(),
    };
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('constructor', () => {
    (0, vitest_1.it)('should initialize successfully', () => {
      const cliAgentService = new CliAgentWebViewService_1.CliAgentWebViewService();
      (0, vitest_1.expect)(cliAgentService).toBeInstanceOf(
        CliAgentWebViewService_1.CliAgentWebViewService
      );
    });
  });
  (0, vitest_1.describe)('sendStatusUpdate', () => {
    (0, vitest_1.it)('should send status update message', () => {
      service.sendStatusUpdate('Terminal 1', 'connected', 'claude', mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'cliAgentStatusUpdate',
        cliAgentStatus: {
          activeTerminalName: 'Terminal 1',
          status: 'connected',
          agentType: 'claude',
        },
      });
    });
    (0, vitest_1.it)('should send status update with null values', () => {
      service.sendStatusUpdate(null, 'none', null, mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'cliAgentStatusUpdate',
        cliAgentStatus: {
          activeTerminalName: null,
          status: 'none',
          agentType: null,
        },
      });
    });
    (0, vitest_1.it)('should handle sendMessage errors gracefully', async () => {
      mockContext.sendMessage.mockRejectedValue(new Error('Send message error'));
      // Should not throw
      service.sendStatusUpdate('Terminal 1', 'connected', 'claude', mockContext);
      // Give some time for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    (0, vitest_1.it)('should handle all status types', () => {
      const statuses = ['connected', 'disconnected', 'none'];
      statuses.forEach((status) => {
        service.sendStatusUpdate('Terminal 1', status, 'claude', mockContext);
        (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
          command: 'cliAgentStatusUpdate',
          cliAgentStatus: {
            activeTerminalName: 'Terminal 1',
            status,
            agentType: 'claude',
          },
        });
      });
    });
  });
  (0, vitest_1.describe)('sendFullStateSync', () => {
    (0, vitest_1.it)('should send full state sync with all terminals', () => {
      service.sendFullStateSync(mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'cliAgentFullStateSync',
        terminalStates: {
          'terminal-1': {
            status: 'connected',
            agentType: 'claude',
            terminalName: 'Terminal 1',
          },
          'terminal-2': {
            status: 'disconnected',
            agentType: 'gemini',
            terminalName: 'Terminal 2',
          },
          'terminal-3': {
            status: 'none',
            agentType: null,
            terminalName: 'Terminal 3',
          },
        },
      });
    });
    (0, vitest_1.it)('should handle empty terminal list', () => {
      mockContext.terminalManager.getTerminals.mockReturnValue([]);
      service.sendFullStateSync(mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'cliAgentFullStateSync',
        terminalStates: {},
      });
    });
    (0, vitest_1.it)('should handle no connected agent', () => {
      mockContext.terminalManager.getConnectedAgentTerminalId.mockReturnValue(null);
      mockContext.terminalManager.getConnectedAgentType.mockReturnValue(null);
      service.sendFullStateSync(mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'cliAgentFullStateSync',
        terminalStates: {
          'terminal-1': {
            status: 'none',
            agentType: null,
            terminalName: 'Terminal 1',
          },
          'terminal-2': {
            status: 'disconnected',
            agentType: 'gemini',
            terminalName: 'Terminal 2',
          },
          'terminal-3': {
            status: 'none',
            agentType: null,
            terminalName: 'Terminal 3',
          },
        },
      });
    });
    (0, vitest_1.it)('should handle sendMessage errors gracefully', async () => {
      mockContext.sendMessage.mockRejectedValue(new Error('Send message error'));
      // Should not throw
      service.sendFullStateSync(mockContext);
      // Give some time for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });
  (0, vitest_1.describe)('setupListeners', () => {
    (0, vitest_1.it)('should set up CLI Agent status change listeners', () => {
      const disposables = service.setupListeners(mockContext);
      (0, vitest_1.expect)(mockContext.terminalManager.onCliAgentStatusChange).toHaveBeenCalled();
      (0, vitest_1.expect)(Array.isArray(disposables)).toBe(true);
      (0, vitest_1.expect)(disposables.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should add disposables to extension context', () => {
      service.setupListeners(mockContext);
      (0, vitest_1.expect)(mockContext.extensionContext.subscriptions.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should handle listener setup errors gracefully', () => {
      mockContext.terminalManager.onCliAgentStatusChange.mockImplementation(() => {
        throw new Error('Listener setup error');
      });
      const disposables = service.setupListeners(mockContext);
      (0, vitest_1.expect)(Array.isArray(disposables)).toBe(true);
      (0, vitest_1.expect)(disposables).toEqual([]);
    });
  });
  (0, vitest_1.describe)('clearListeners', () => {
    (0, vitest_1.it)('should clear all listeners', () => {
      const mockDisposable = { dispose: vitest_1.vi.fn() };
      mockContext.terminalManager.onCliAgentStatusChange.mockReturnValue(mockDisposable);
      // Set up listeners
      service.setupListeners(mockContext);
      // Clear listeners
      service.clearListeners();
      (0, vitest_1.expect)(mockDisposable.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle dispose errors gracefully', () => {
      const mockDisposable = {
        dispose: vitest_1.vi.fn().mockImplementation(() => {
          throw new Error('Dispose error');
        }),
      };
      mockContext.terminalManager.onCliAgentStatusChange.mockReturnValue(mockDisposable);
      // Set up listeners
      service.setupListeners(mockContext);
      // Clear listeners should not throw
      service.clearListeners();
    });
  });
  (0, vitest_1.describe)('handleSwitchAiAgent', () => {
    (0, vitest_1.it)('should handle successful AI agent switch', async () => {
      await service.handleSwitchAiAgent('terminal-1', 'connect', mockContext);
      (0, vitest_1.expect)(
        mockContext.terminalManager.switchAiAgentConnection
      ).toHaveBeenCalledWith('terminal-1');
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'switchAiAgentResponse',
        terminalId: 'terminal-1',
        success: true,
        newStatus: 'connected',
        agentType: 'claude',
      });
    });
    (0, vitest_1.it)('should handle failed AI agent switch', async () => {
      mockContext.terminalManager.switchAiAgentConnection.mockReturnValue({
        success: false,
        reason: 'No agent available',
        newStatus: 'none',
      });
      await service.handleSwitchAiAgent('terminal-1', 'connect', mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'switchAiAgentResponse',
        terminalId: 'terminal-1',
        success: false,
        reason: 'No agent available',
        newStatus: 'none',
      });
    });
    (0, vitest_1.it)('should handle switchAiAgentConnection errors', async () => {
      mockContext.terminalManager.switchAiAgentConnection.mockImplementation(() => {
        throw new Error('Switch error');
      });
      await service.handleSwitchAiAgent('terminal-1', 'connect', mockContext);
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalledWith({
        command: 'switchAiAgentResponse',
        terminalId: 'terminal-1',
        success: false,
        reason: 'Internal error occurred',
      });
    });
  });
  (0, vitest_1.describe)('getDebugInfo', () => {
    (0, vitest_1.it)('should return debug information', () => {
      const debugInfo = service.getDebugInfo(mockContext);
      (0, vitest_1.expect)(debugInfo).toBeTypeOf('object');
      (0, vitest_1.expect)(debugInfo).toHaveProperty('connectedAgent');
      (0, vitest_1.expect)(debugInfo).toHaveProperty('disconnectedAgents');
      (0, vitest_1.expect)(debugInfo).toHaveProperty('activeListeners');
      (0, vitest_1.expect)(debugInfo).toHaveProperty('timestamp');
    });
    (0, vitest_1.it)('should include connected agent info', () => {
      const debugInfo = service.getDebugInfo(mockContext);
      (0, vitest_1.expect)(debugInfo.connectedAgent).toEqual({
        id: 'terminal-1',
        type: 'claude',
      });
    });
    (0, vitest_1.it)('should include disconnected agents info', () => {
      const debugInfo = service.getDebugInfo(mockContext);
      (0, vitest_1.expect)(Array.isArray(debugInfo.disconnectedAgents)).toBe(true);
      (0, vitest_1.expect)(debugInfo.disconnectedAgents).toHaveLength(1);
    });
    (0, vitest_1.it)('should handle errors gracefully', () => {
      mockContext.terminalManager.getConnectedAgentTerminalId.mockImplementation(() => {
        throw new Error('Debug error');
      });
      const debugInfo = service.getDebugInfo(mockContext);
      (0, vitest_1.expect)(debugInfo).toHaveProperty('error');
      (0, vitest_1.expect)(debugInfo).toHaveProperty('timestamp');
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should dispose all resources', () => {
      const clearListenersSpy = vitest_1.vi.spyOn(service, 'clearListeners');
      service.dispose();
      (0, vitest_1.expect)(clearListenersSpy).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('edge cases', () => {
    (0, vitest_1.it)('should handle concurrent full state sync calls', () => {
      for (let i = 0; i < 5; i++) {
        service.sendFullStateSync(mockContext);
      }
      (0, vitest_1.expect)(mockContext.sendMessage).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=CliAgentWebViewService.test.js.map
