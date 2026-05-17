'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const TerminalManager_1 = require('../../../../terminals/TerminalManager');
const createMockCliAgentService = (connectedAgent) => {
  const statusEmitter = new vscode.EventEmitter();
  return {
    detectFromInput: vitest_1.vi.fn().mockReturnValue(null),
    detectFromOutput: vitest_1.vi.fn().mockReturnValue(null),
    detectTermination: vitest_1.vi.fn().mockReturnValue({
      isTerminated: false,
      confidence: 0,
      reason: '',
    }),
    getAgentState: vitest_1.vi.fn().mockReturnValue({ status: 'none', agentType: null }),
    getConnectedAgent: vitest_1.vi.fn().mockReturnValue(connectedAgent),
    getDisconnectedAgents: vitest_1.vi.fn().mockReturnValue(new Map()),
    switchAgentConnection: vitest_1.vi.fn().mockReturnValue({
      success: false,
      newStatus: 'none',
      agentType: null,
    }),
    // @ts-expect-error - test mock type
    onCliAgentStatusChange: statusEmitter.event,
    handleTerminalRemoved: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(() => statusEmitter.dispose()),
    startHeartbeat: vitest_1.vi.fn(),
    refreshAgentState: vitest_1.vi.fn().mockReturnValue(true),
    forceReconnectAgent: vitest_1.vi.fn().mockReturnValue(false),
    clearDetectionError: vitest_1.vi.fn().mockReturnValue(false),
    setAgentConnected: vitest_1.vi.fn(),
  };
};
(0, vitest_1.describe)('TerminalManager - getConnectedAgentType', () => {
  let terminalManager = null;
  (0, vitest_1.afterEach)(() => {
    terminalManager?.dispose();
    terminalManager = null;
  });
  (0, vitest_1.it)('returns null when no agent is connected', () => {
    const mockService = createMockCliAgentService(null);
    terminalManager = new TerminalManager_1.TerminalManager(mockService);
    (0, vitest_1.expect)(terminalManager.getConnectedAgentType()).toBeNull();
  });
  (0, vitest_1.it)('returns copilot when a copilot agent is connected', () => {
    const mockService = createMockCliAgentService({ terminalId: 'term-1', type: 'copilot' });
    terminalManager = new TerminalManager_1.TerminalManager(mockService);
    (0, vitest_1.expect)(terminalManager.getConnectedAgentType()).toBe('copilot');
  });
  (0, vitest_1.it)('returns null for unknown agent types', () => {
    const mockService = createMockCliAgentService({ terminalId: 'term-1', type: 'mystery' });
    terminalManager = new TerminalManager_1.TerminalManager(mockService);
    (0, vitest_1.expect)(terminalManager.getConnectedAgentType()).toBeNull();
  });
});
//# sourceMappingURL=TerminalManager.AgentType.test.js.map
