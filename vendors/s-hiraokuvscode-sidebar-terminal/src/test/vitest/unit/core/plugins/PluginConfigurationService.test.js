'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const PluginConfigurationService_1 = require('../../../../../core/plugins/PluginConfigurationService');
// Mock VS Code
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn(),
    onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
  },
}));
(0, vitest_1.describe)('PluginConfigurationService', () => {
  let service;
  let mockPluginManager;
  let mockConfig;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    mockConfig = {
      get: vitest_1.vi.fn((key, defaultValue) => {
        if (key.includes('enablePluginSystem')) return true;
        if (key.includes('enabled')) return true;
        if (key.includes('confidenceThreshold')) return 0.7;
        return defaultValue;
      }),
    };
    vitest_1.vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfig);
    mockPluginManager = {
      getPlugin: vitest_1.vi.fn().mockReturnValue({
        configure: vitest_1.vi.fn(),
        state: 'registered',
      }),
      activatePlugin: vitest_1.vi.fn().mockResolvedValue(undefined),
      deactivatePlugin: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
    service = new PluginConfigurationService_1.PluginConfigurationService(mockPluginManager);
  });
  (0, vitest_1.describe)('getConfiguration', () => {
    (0, vitest_1.it)('should return complete plugin system config', () => {
      const config = service.getConfiguration();
      (0, vitest_1.expect)(config.enablePluginSystem).toBe(true);
      (0, vitest_1.expect)(config.claude.enabled).toBe(true);
      (0, vitest_1.expect)(config.claude.confidenceThreshold).toBe(0.7);
    });
  });
  (0, vitest_1.describe)('initialize', () => {
    (0, vitest_1.it)('should setup config watcher and apply initial config', () => {
      service.initialize();
      (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
      (0, vitest_1.expect)(mockPluginManager.getPlugin).toHaveBeenCalledWith('claude-agent');
    });
  });
  (0, vitest_1.describe)('applyConfiguration', () => {
    (0, vitest_1.it)('should deactivate plugins if system is disabled', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key.includes('enablePluginSystem')) return false;
        return true;
      });
      // We need to trigger it via initialize or call a private method if we can
      // Since it's private, we'll initialize and check effects
      service.initialize();
      // Should stop early and not configure plugins
      (0, vitest_1.expect)(mockPluginManager.activatePlugin).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should activate enabled plugins', () => {
      const mockPlugin = {
        configure: vitest_1.vi.fn(),
        state: 'registered',
      };
      mockPluginManager.getPlugin.mockReturnValue(mockPlugin);
      service.initialize();
      (0, vitest_1.expect)(mockPlugin.configure).toHaveBeenCalled();
      (0, vitest_1.expect)(mockPluginManager.activatePlugin).toHaveBeenCalledWith('claude-agent');
    });
    (0, vitest_1.it)('should deactivate disabled plugins', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key.includes('claude.enabled')) return false;
        return true;
      });
      const mockPlugin = {
        configure: vitest_1.vi.fn(),
        state: 'active',
      };
      mockPluginManager.getPlugin.mockReturnValue(mockPlugin);
      service.initialize();
      (0, vitest_1.expect)(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith('claude-agent');
    });
  });
});
//# sourceMappingURL=PluginConfigurationService.test.js.map
