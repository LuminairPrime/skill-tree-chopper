'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const PluginManager_1 = require('../../../../../core/plugins/PluginManager');
(0, vitest_1.describe)('PluginManager', () => {
  let manager;
  let mockEventBus;
  let mockPlugin;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    mockEventBus = {
      publish: vitest_1.vi.fn(),
      subscribe: vitest_1.vi.fn(),
    };
    mockPlugin = {
      metadata: { id: 'test-plugin', name: 'Test Plugin' },
      state: 'registered',
      activate: vitest_1.vi.fn().mockResolvedValue(undefined),
      deactivate: vitest_1.vi.fn().mockResolvedValue(undefined),
      configure: vitest_1.vi.fn(),
      dispose: vitest_1.vi.fn(),
    };
    manager = new PluginManager_1.PluginManager(mockEventBus);
  });
  (0, vitest_1.describe)('registerPlugin', () => {
    (0, vitest_1.it)('should register a standard plugin', async () => {
      await manager.registerPlugin(mockPlugin);
      (0, vitest_1.expect)(manager.hasPlugin('test-plugin')).toBe(true);
      (0, vitest_1.expect)(manager.getPlugin('test-plugin')).toBe(mockPlugin);
    });
    (0, vitest_1.it)('should register and activate immediately if requested', async () => {
      await manager.registerPlugin(mockPlugin, { activateImmediately: true });
      (0, vitest_1.expect)(mockPlugin.activate).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should identify agent plugins', async () => {
      const agentPlugin = {
        ...mockPlugin,
        detect: vitest_1.vi.fn(),
        onAgentActivated: vitest_1.vi.fn(),
        onAgentDeactivated: vitest_1.vi.fn(),
        getAgentType: vitest_1.vi.fn().mockReturnValue('test-agent'),
      };
      await manager.registerPlugin(agentPlugin);
      (0, vitest_1.expect)(manager.getAgentPlugins()).toContain(agentPlugin);
    });
  });
  (0, vitest_1.describe)('plugin lifecycle', () => {
    (0, vitest_1.beforeEach)(async () => {
      await manager.registerPlugin(mockPlugin);
    });
    (0, vitest_1.it)('should activate plugin', async () => {
      await manager.activatePlugin('test-plugin');
      (0, vitest_1.expect)(mockPlugin.activate).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should deactivate plugin', async () => {
      mockPlugin.state = 'active';
      await manager.deactivatePlugin('test-plugin');
      (0, vitest_1.expect)(mockPlugin.deactivate).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should configure plugin', () => {
      const config = { enabled: true };
      manager.configurePlugin('test-plugin', config);
      (0, vitest_1.expect)(mockPlugin.configure).toHaveBeenCalledWith(config);
    });
  });
  (0, vitest_1.describe)('error handling', () => {
    (0, vitest_1.it)('should throw if manager is disposed', async () => {
      manager.dispose();
      await (0, vitest_1.expect)(manager.activatePlugin('any')).rejects.toThrow(
        'PluginManager has been disposed'
      );
    });
    (0, vitest_1.it)('should handle activation failures', async () => {
      await manager.registerPlugin(mockPlugin);
      mockPlugin.activate.mockRejectedValue(new Error('Fail'));
      await (0, vitest_1.expect)(manager.activatePlugin('test-plugin')).rejects.toThrow('Fail');
    });
  });
  (0, vitest_1.describe)('disposal', () => {
    (0, vitest_1.it)('should dispose all plugins', async () => {
      await manager.registerPlugin(mockPlugin);
      manager.dispose();
      (0, vitest_1.expect)(mockPlugin.dispose).toHaveBeenCalled();
      (0, vitest_1.expect)(manager.getAllPlugins().length).toBe(0);
    });
  });
});
//# sourceMappingURL=PluginManager.test.js.map
