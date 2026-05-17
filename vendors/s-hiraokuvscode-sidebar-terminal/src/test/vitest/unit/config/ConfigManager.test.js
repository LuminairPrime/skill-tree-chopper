'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const ConfigManager_1 = require('../../../../config/ConfigManager');
(0, vitest_1.describe)('ConfigManager', () => {
  let mockWorkspaceConfiguration;
  let configManager;
  (0, vitest_1.beforeEach)(() => {
    // Clear singleton instance before creating new stubs
    const configManagerClass = ConfigManager_1.ConfigManager;
    configManagerClass._instance = undefined;
    mockWorkspaceConfiguration = {
      get: vitest_1.vi.fn(),
      has: vitest_1.vi.fn(),
      inspect: vitest_1.vi.fn(),
      update: vitest_1.vi.fn(),
    };
    // Mock vscode.workspace.getConfiguration
    vscode.workspace.getConfiguration.mockReturnValue(mockWorkspaceConfiguration);
    // Mock vscode.workspace.onDidChangeConfiguration
    vscode.workspace.onDidChangeConfiguration.mockReturnValue({ dispose: vitest_1.vi.fn() });
    configManager = (0, ConfigManager_1.getConfigManager)();
  });
  (0, vitest_1.afterEach)(() => {
    // Clear singleton before restoring stubs
    const configManagerClass = ConfigManager_1.ConfigManager;
    configManagerClass._instance = undefined;
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('getExtensionTerminalConfig', () => {
    (0, vitest_1.it)('should return terminal configuration with defaults', () => {
      // Setup default values - need to return the default value when called with default parameter
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        return defaultValue; // Return the default value passed by the ConfigManager
      });
      const config = configManager.getExtensionTerminalConfig();
      (0, vitest_1.expect)(config).toHaveProperty('maxTerminals', 10);
      (0, vitest_1.expect)(config).toHaveProperty('shell', '');
      (0, vitest_1.expect)(config).toHaveProperty('fontFamily', 'monospace');
      (0, vitest_1.expect)(config).toHaveProperty('fontSize', 14);
      (0, vitest_1.expect)(config).toHaveProperty('cursorBlink', true);
    });
    (0, vitest_1.it)('should return user-configured values', () => {
      // Setup specific values
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'maxTerminals') return 3;
        if (key === 'shell') return '/bin/zsh';
        if (key === 'fontSize') return 16;
        if (key === 'fontFamily') return 'Courier New';
        return defaultValue;
      });
      const config = configManager.getExtensionTerminalConfig();
      (0, vitest_1.expect)(config.maxTerminals).toBe(3);
      (0, vitest_1.expect)(config.shell).toBe('/bin/zsh');
      (0, vitest_1.expect)(config.fontSize).toBe(16);
      (0, vitest_1.expect)(config.fontFamily).toBe('Courier New');
    });
    (0, vitest_1.it)('should handle partial configuration', () => {
      // Only some values configured with proper default handling
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'maxTerminals') return 10;
        return defaultValue; // Return default for undefined keys
      });
      const config = configManager.getExtensionTerminalConfig();
      (0, vitest_1.expect)(config.maxTerminals).toBe(10);
      (0, vitest_1.expect)(config.shell).toBe('');
      (0, vitest_1.expect)(config.fontSize).toBe(14); // default
    });
  });
  (0, vitest_1.describe)('onConfigurationChange', () => {
    (0, vitest_1.it)('should register configuration change listener', () => {
      const callback = vitest_1.vi.fn();
      const mockDisposable = { dispose: vitest_1.vi.fn() };
      vscode.workspace.onDidChangeConfiguration.mockReturnValue(mockDisposable);
      const disposable = configManager.onConfigurationChange(callback);
      (0, vitest_1.expect)(disposable).toBe(mockDisposable);
      (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalledWith(
        callback
      );
    });
  });
  (0, vitest_1.describe)('clearCache', () => {
    (0, vitest_1.it)('should clear configuration cache', () => {
      // First get a config to populate cache
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'maxTerminals') return 5;
        return defaultValue;
      });
      configManager.getExtensionTerminalConfig();
      // Verify cache has data
      const cacheInfo = configManager.getCacheInfo();
      (0, vitest_1.expect)(cacheInfo.size).toBeGreaterThan(0);
      // Clear cache
      configManager.clearCache();
      // Verify cache is empty
      const clearedCacheInfo = configManager.getCacheInfo();
      (0, vitest_1.expect)(clearedCacheInfo.size).toBe(0);
    });
  });
  (0, vitest_1.describe)('getCompleteTerminalSettings', () => {
    (0, vitest_1.it)(
      'should return complete terminal settings with alt-click configuration',
      () => {
        mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
          if (key === 'altClickMovesCursor') return true;
          if (key === 'multiCursorModifier') return 'alt';
          return defaultValue;
        });
        const settings = configManager.getCompleteTerminalSettings();
        (0, vitest_1.expect)(settings).toHaveProperty('altClickMovesCursor', true);
        (0, vitest_1.expect)(settings).toHaveProperty('multiCursorModifier', 'alt');
        (0, vitest_1.expect)(settings).toHaveProperty('confirmBeforeKill');
        (0, vitest_1.expect)(settings).toHaveProperty('protectLastTerminal');
      }
    );
  });
  (0, vitest_1.describe)('getShellForPlatform', () => {
    (0, vitest_1.it)('should return platform-specific shell', () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      // Test Windows
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'shell.windows') return 'powershell.exe';
        return defaultValue;
      });
      (0, vitest_1.expect)(configManager.getShellForPlatform()).toBe('powershell.exe');
      // Test macOS
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'shell.osx') return '/bin/zsh';
        return defaultValue;
      });
      (0, vitest_1.expect)(configManager.getShellForPlatform()).toBe('/bin/zsh');
      // Test Linux
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
      mockWorkspaceConfiguration.get.mockImplementation((key, defaultValue) => {
        if (key === 'shell.linux') return '/bin/bash';
        return defaultValue;
      });
      (0, vitest_1.expect)(configManager.getShellForPlatform()).toBe('/bin/bash');
      // Restore original platform
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
  });
});
//# sourceMappingURL=ConfigManager.test.js.map
