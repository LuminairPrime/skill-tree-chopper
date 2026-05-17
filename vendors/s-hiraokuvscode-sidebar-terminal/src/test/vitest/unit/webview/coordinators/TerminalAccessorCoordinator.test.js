'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalAccessorCoordinator_1 = require('../../../../../webview/coordinators/TerminalAccessorCoordinator');
function createDeps() {
  const terminalInstance = {
    terminal: { id: 'terminal-object' },
    fitAddon: { id: 'fit-addon' },
    container: { id: 'terminal-container' },
    serializeAddon: { id: 'serialize-addon' },
  };
  return {
    getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
    getTerminalInstance: vitest_1.vi
      .fn()
      .mockImplementation((id) => (id === 'terminal-1' ? terminalInstance : undefined)),
    getAllTerminalInstances: vitest_1.vi
      .fn()
      .mockReturnValue(new Map([['terminal-1', terminalInstance]])),
    getAllTerminalContainers: vitest_1.vi
      .fn()
      .mockReturnValue(new Map([['terminal-1', terminalInstance.container]])),
    getTerminalElement: vitest_1.vi.fn().mockReturnValue(terminalInstance.container),
    managers: {
      performance: { id: 'performance' },
      input: { id: 'input' },
      ui: { id: 'ui' },
      config: { id: 'config' },
      message: { id: 'message' },
      notification: { id: 'notification' },
      findInTerminal: { id: 'find' },
      profile: { id: 'profile' },
      tabs: { id: 'tabs' },
      persistence: { id: 'persistence' },
      terminalContainer: { id: 'terminalContainer' },
      displayMode: { id: 'displayMode' },
      header: { id: 'header' },
    },
    splitManager: { id: 'splitManager' },
  };
}
(0, vitest_1.describe)('TerminalAccessorCoordinator', () => {
  let coordinator;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    deps = createDeps();
    coordinator = new TerminalAccessorCoordinator_1.TerminalAccessorCoordinator(deps);
  });
  (0, vitest_1.it)('delegates terminal instance and container lookups', () => {
    (0, vitest_1.expect)(coordinator.getTerminalInstance('terminal-1')).toBeDefined();
    (0, vitest_1.expect)(coordinator.getSerializeAddon('terminal-1')).toEqual({
      id: 'serialize-addon',
    });
    (0, vitest_1.expect)(coordinator.getAllTerminalInstances()).toBeInstanceOf(Map);
    (0, vitest_1.expect)(coordinator.getAllTerminalContainers()).toBeInstanceOf(Map);
    (0, vitest_1.expect)(coordinator.getTerminalElement('terminal-1')).toEqual({
      id: 'terminal-container',
    });
  });
  (0, vitest_1.it)('returns grouped managers and direct manager accessors', () => {
    (0, vitest_1.expect)(coordinator.getManagers()).toBe(deps.managers);
    (0, vitest_1.expect)(coordinator.getMessageManager()).toBe(deps.managers.message);
    (0, vitest_1.expect)(coordinator.getTerminalContainerManager()).toBe(
      deps.managers.terminalContainer
    );
    (0, vitest_1.expect)(coordinator.getDisplayModeManager()).toBe(deps.managers.displayMode);
    (0, vitest_1.expect)(coordinator.getSplitManager()).toBe(deps.splitManager);
  });
  (0, vitest_1.it)('returns active-terminal derived legacy accessors', () => {
    (0, vitest_1.expect)(coordinator.getTerminal()).toEqual({ id: 'terminal-object' });
    (0, vitest_1.expect)(coordinator.getFitAddon()).toEqual({ id: 'fit-addon' });
    (0, vitest_1.expect)(coordinator.getTerminalContainer()).toEqual({ id: 'terminal-container' });
    (0, vitest_1.expect)(coordinator.getActiveTerminalIdValue()).toBe('terminal-1');
  });
  (0, vitest_1.it)('returns null legacy accessors when there is no active terminal', () => {
    vitest_1.vi.mocked(deps.getActiveTerminalId).mockReturnValue(null);
    (0, vitest_1.expect)(coordinator.getTerminal()).toBeNull();
    (0, vitest_1.expect)(coordinator.getFitAddon()).toBeNull();
    (0, vitest_1.expect)(coordinator.getTerminalContainer()).toBeNull();
    (0, vitest_1.expect)(coordinator.getActiveTerminalIdValue()).toBeNull();
  });
});
//# sourceMappingURL=TerminalAccessorCoordinator.test.js.map
