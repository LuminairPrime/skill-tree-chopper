'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const TerminalManager_1 = require('../../../../terminals/TerminalManager');
const createMockCliAgentService = () => {
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
    getConnectedAgent: vitest_1.vi.fn().mockReturnValue(null),
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
(0, vitest_1.describe)('TerminalManager - renameTerminal', () => {
  let terminalManager = null;
  (0, vitest_1.afterEach)(() => {
    terminalManager?.dispose();
    terminalManager = null;
  });
  (0, vitest_1.it)('renames terminal and emits state update', () => {
    terminalManager = new TerminalManager_1.TerminalManager(createMockCliAgentService());
    terminalManager._terminals.set('t1', {
      id: 't1',
      name: 'Old Name',
      isActive: true,
    });
    const states = [];
    const disposable = terminalManager.onStateUpdate((state) => states.push(state));
    const renamed = terminalManager.renameTerminal('t1', 'New Name');
    (0, vitest_1.expect)(renamed).toBe(true);
    (0, vitest_1.expect)(terminalManager._terminals.get('t1').name).toBe('New Name');
    (0, vitest_1.expect)(states).toHaveLength(1);
    (0, vitest_1.expect)(states[0]?.terminals?.[0]?.name).toBe('New Name');
    disposable.dispose();
  });
  (0, vitest_1.it)('returns false when terminal does not exist', () => {
    terminalManager = new TerminalManager_1.TerminalManager(createMockCliAgentService());
    const states = [];
    const disposable = terminalManager.onStateUpdate((state) => states.push(state));
    const renamed = terminalManager.renameTerminal('missing-terminal', 'New Name');
    (0, vitest_1.expect)(renamed).toBe(false);
    (0, vitest_1.expect)(states).toHaveLength(0);
    disposable.dispose();
  });
  (0, vitest_1.it)('updates terminal header name and indicator color together', () => {
    terminalManager = new TerminalManager_1.TerminalManager(createMockCliAgentService());
    terminalManager._terminals.set('t1', {
      id: 't1',
      name: 'Old Name',
      isActive: true,
      indicatorColor: '#00FFFF',
    });
    const states = [];
    const disposable = terminalManager.onStateUpdate((state) => states.push(state));
    const updated = terminalManager.updateTerminalHeader('t1', {
      newName: 'New Name',
      indicatorColor: '#FF69B4',
    });
    (0, vitest_1.expect)(updated).toBe(true);
    (0, vitest_1.expect)(terminalManager._terminals.get('t1').name).toBe('New Name');
    (0, vitest_1.expect)(terminalManager._terminals.get('t1').indicatorColor).toBe('#FF69B4');
    (0, vitest_1.expect)(states).toHaveLength(1);
    (0, vitest_1.expect)(states[0]?.terminals?.[0]?.name).toBe('New Name');
    (0, vitest_1.expect)(states[0]?.terminals?.[0]?.indicatorColor).toBe('#FF69B4');
    disposable.dispose();
  });
  (0, vitest_1.it)('accepts transparent indicator color for OFF state', () => {
    terminalManager = new TerminalManager_1.TerminalManager(createMockCliAgentService());
    terminalManager._terminals.set('t1', {
      id: 't1',
      name: 'Terminal',
      isActive: true,
      indicatorColor: '#00FFFF',
    });
    const updated = terminalManager.updateTerminalHeader('t1', {
      indicatorColor: 'transparent',
    });
    (0, vitest_1.expect)(updated).toBe(true);
    (0, vitest_1.expect)(terminalManager._terminals.get('t1').indicatorColor).toBe('transparent');
  });
});
//# sourceMappingURL=TerminalManager.Rename.test.js.map
