'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * SettingsCoordinator Tests
 *
 * Tests for settings management methods extracted from LightweightTerminalWebviewManager.
 * Covers: applySettings, loadSettings, saveSettings, applyFontSettings,
 *         getCurrentFontSettings, openSettings, updateAllTerminalThemes
 */
const vitest_1 = require('vitest');
const SettingsCoordinator_1 = require('../../../../../webview/coordinators/SettingsCoordinator');
function createMockDeps() {
  return {
    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({}),
    setCurrentSettings: vitest_1.vi.fn(),
    configManagerApplySettings: vitest_1.vi.fn(),
    configManagerGetCurrentSettings: vitest_1.vi.fn().mockReturnValue({}),
    hasConfigManager: vitest_1.vi.fn().mockReturnValue(true),
    getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
    getAllTerminalContainers: vitest_1.vi.fn().mockReturnValue(new Map()),
    getSplitTerminals: vitest_1.vi.fn().mockReturnValue(new Map()),
    setActiveBorderMode: vitest_1.vi.fn(),
    setTerminalHeaderEnhancementsEnabled: vitest_1.vi.fn(),
    updateTerminalBorders: vitest_1.vi.fn(),
    updateSplitTerminalBorders: vitest_1.vi.fn(),
    applyAllVisualSettings: vitest_1.vi.fn(),
    fontSettingsUpdateSettings: vitest_1.vi.fn(),
    fontSettingsGetCurrentSettings: vitest_1.vi.fn().mockReturnValue({
      fontFamily: 'monospace',
      fontSize: 14,
      fontWeight: 'normal',
      letterSpacing: 0,
      lineHeight: 1.2,
    }),
    loadState: vitest_1.vi.fn().mockReturnValue(null),
    saveState: vitest_1.vi.fn(),
    getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
    hasSettingsPanel: vitest_1.vi.fn().mockReturnValue(true),
    settingsPanelSetVersionInfo: vitest_1.vi.fn(),
    settingsPanelShow: vitest_1.vi.fn(),
    getVersionInfo: vitest_1.vi.fn().mockReturnValue('v0.1.0'),
  };
}
(0, vitest_1.describe)('SettingsCoordinator', () => {
  let coordinator;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    deps = createMockDeps();
    coordinator = new SettingsCoordinator_1.SettingsCoordinator(deps);
  });
  (0, vitest_1.describe)('applySettings', () => {
    (0, vitest_1.it)('should merge settings with current settings and update state', () => {
      vitest_1.vi.mocked(deps.getCurrentSettings).mockReturnValue({ theme: 'dark' });
      coordinator.applySettings({ fontSize: 16 });
      (0, vitest_1.expect)(deps.setCurrentSettings).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          theme: 'dark',
          fontSize: 16,
          activeBorderMode: 'multipleOnly',
        })
      );
    });
    (0, vitest_1.it)('should use provided activeBorderMode when specified', () => {
      coordinator.applySettings({ activeBorderMode: 'always' });
      (0, vitest_1.expect)(deps.setCurrentSettings).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          activeBorderMode: 'always',
        })
      );
    });
    (0, vitest_1.it)('should update ConfigManager when available', () => {
      const instances = new Map([['t-1', { terminal: {} }]]);
      vitest_1.vi.mocked(deps.getAllTerminalInstances).mockReturnValue(instances);
      coordinator.applySettings({ theme: 'light' });
      (0, vitest_1.expect)(deps.configManagerApplySettings).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ theme: 'light' }),
        instances
      );
    });
    (0, vitest_1.it)('should skip ConfigManager when not available', () => {
      vitest_1.vi.mocked(deps.hasConfigManager).mockReturnValue(false);
      coordinator.applySettings({ theme: 'light' });
      (0, vitest_1.expect)(deps.configManagerApplySettings).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should update active border mode on UI manager', () => {
      coordinator.applySettings({ activeBorderMode: 'never' });
      (0, vitest_1.expect)(deps.setActiveBorderMode).toHaveBeenCalledWith('never');
    });
    (0, vitest_1.it)('should set terminal header enhancements enabled by default', () => {
      coordinator.applySettings({});
      (0, vitest_1.expect)(deps.setTerminalHeaderEnhancementsEnabled).toHaveBeenCalledWith(true);
    });
    (0, vitest_1.it)(
      'should set terminal header enhancements disabled when explicitly false',
      () => {
        coordinator.applySettings({ enableTerminalHeaderEnhancements: false });
        (0, vitest_1.expect)(deps.setTerminalHeaderEnhancementsEnabled).toHaveBeenCalledWith(false);
      }
    );
    (0, vitest_1.it)('should update terminal borders when active terminal has containers', () => {
      vitest_1.vi.mocked(deps.getActiveTerminalId).mockReturnValue('t-1');
      const containers = new Map([['t-1', document.createElement('div')]]);
      vitest_1.vi.mocked(deps.getAllTerminalContainers).mockReturnValue(containers);
      coordinator.applySettings({});
      (0, vitest_1.expect)(deps.updateTerminalBorders).toHaveBeenCalledWith('t-1', containers);
    });
    (0, vitest_1.it)('should update split borders when active terminal has no containers', () => {
      vitest_1.vi.mocked(deps.getActiveTerminalId).mockReturnValue('t-1');
      vitest_1.vi.mocked(deps.getAllTerminalContainers).mockReturnValue(new Map());
      coordinator.applySettings({});
      (0, vitest_1.expect)(deps.updateSplitTerminalBorders).toHaveBeenCalledWith('t-1');
    });
    (0, vitest_1.it)('should apply visual settings to all terminal instances', () => {
      const mockTerminal = { options: {} };
      const instances = new Map([
        ['t-1', { terminal: mockTerminal, name: 'Terminal 1' }],
        ['t-2', { terminal: mockTerminal, name: 'Terminal 2' }],
      ]);
      vitest_1.vi.mocked(deps.getAllTerminalInstances).mockReturnValue(instances);
      coordinator.applySettings({ theme: 'dark' });
      (0, vitest_1.expect)(deps.applyAllVisualSettings).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('should not throw when applyAllVisualSettings fails for a terminal', () => {
      const instances = new Map([['t-1', { terminal: {}, name: 'T1' }]]);
      vitest_1.vi.mocked(deps.getAllTerminalInstances).mockReturnValue(instances);
      vitest_1.vi.mocked(deps.applyAllVisualSettings).mockImplementation(() => {
        throw new Error('Visual settings error');
      });
      (0, vitest_1.expect)(() => coordinator.applySettings({})).not.toThrow();
    });
    (0, vitest_1.it)('should not throw on error', () => {
      vitest_1.vi.mocked(deps.getCurrentSettings).mockImplementation(() => {
        throw new Error('Settings error');
      });
      (0, vitest_1.expect)(() => coordinator.applySettings({})).not.toThrow();
    });
  });
  (0, vitest_1.describe)('loadSettings', () => {
    (0, vitest_1.it)('should apply saved settings when available', () => {
      const savedSettings = { theme: 'dark', fontSize: 16 };
      vitest_1.vi.mocked(deps.loadState).mockReturnValue({ settings: savedSettings });
      const applySettingsSpy = vitest_1.vi.spyOn(coordinator, 'applySettings');
      coordinator.loadSettings();
      (0, vitest_1.expect)(applySettingsSpy).toHaveBeenCalledWith(savedSettings);
    });
    (0, vitest_1.it)('should apply saved font settings when available', () => {
      const savedFontSettings = { fontFamily: 'Fira Code', fontSize: 14 };
      vitest_1.vi.mocked(deps.loadState).mockReturnValue({
        fontSettings: savedFontSettings,
      });
      const applyFontSpy = vitest_1.vi.spyOn(coordinator, 'applyFontSettings');
      coordinator.loadSettings();
      (0, vitest_1.expect)(applyFontSpy).toHaveBeenCalledWith(savedFontSettings);
    });
    (0, vitest_1.it)('should handle null state gracefully', () => {
      vitest_1.vi.mocked(deps.loadState).mockReturnValue(null);
      (0, vitest_1.expect)(() => coordinator.loadSettings()).not.toThrow();
    });
    (0, vitest_1.it)('should not throw when loadState throws', () => {
      vitest_1.vi.mocked(deps.loadState).mockImplementation(() => {
        throw new Error('Load error');
      });
      (0, vitest_1.expect)(() => coordinator.loadSettings()).not.toThrow();
    });
  });
  (0, vitest_1.describe)('saveSettings', () => {
    (0, vitest_1.it)('should save current settings and font settings to state', () => {
      const currentSettings = { theme: 'dark' };
      const fontSettings = { fontFamily: 'monospace', fontSize: 14 };
      vitest_1.vi.mocked(deps.getCurrentSettings).mockReturnValue(currentSettings);
      vitest_1.vi.mocked(deps.fontSettingsGetCurrentSettings).mockReturnValue(fontSettings);
      coordinator.saveSettings();
      (0, vitest_1.expect)(deps.saveState).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          settings: currentSettings,
          fontSettings: fontSettings,
          timestamp: vitest_1.expect.any(Number),
        })
      );
    });
    (0, vitest_1.it)('should not throw when saveState throws', () => {
      vitest_1.vi.mocked(deps.saveState).mockImplementation(() => {
        throw new Error('Save error');
      });
      (0, vitest_1.expect)(() => coordinator.saveSettings()).not.toThrow();
    });
  });
  (0, vitest_1.describe)('applyFontSettings', () => {
    (0, vitest_1.it)('should delegate to fontSettingsUpdateSettings with split terminals', () => {
      const fontSettings = { fontFamily: 'Fira Code', fontSize: 16 };
      const terminals = new Map([['t-1', { terminal: {} }]]);
      vitest_1.vi.mocked(deps.getSplitTerminals).mockReturnValue(terminals);
      coordinator.applyFontSettings(fontSettings);
      (0, vitest_1.expect)(deps.fontSettingsUpdateSettings).toHaveBeenCalledWith(
        fontSettings,
        terminals
      );
    });
    (0, vitest_1.it)('should not throw on error', () => {
      vitest_1.vi.mocked(deps.fontSettingsUpdateSettings).mockImplementation(() => {
        throw new Error('Font error');
      });
      (0, vitest_1.expect)(() =>
        coordinator.applyFontSettings({ fontFamily: 'monospace' })
      ).not.toThrow();
    });
  });
  (0, vitest_1.describe)('getCurrentFontSettings', () => {
    (0, vitest_1.it)('should return current font settings from service', () => {
      const expected = { fontFamily: 'Fira Code', fontSize: 16 };
      vitest_1.vi.mocked(deps.fontSettingsGetCurrentSettings).mockReturnValue(expected);
      const result = coordinator.getCurrentFontSettings();
      (0, vitest_1.expect)(result).toBe(expected);
    });
  });
  (0, vitest_1.describe)('openSettings', () => {
    (0, vitest_1.it)('should show settings panel with merged settings', () => {
      const current = { theme: 'dark', fontSize: 14 };
      const base = { theme: 'auto', fontSize: 12, lineHeight: 1.2 };
      vitest_1.vi.mocked(deps.getCurrentSettings).mockReturnValue(current);
      vitest_1.vi.mocked(deps.configManagerGetCurrentSettings).mockReturnValue(base);
      coordinator.openSettings();
      (0, vitest_1.expect)(deps.settingsPanelSetVersionInfo).toHaveBeenCalledWith('v0.1.0');
      (0, vitest_1.expect)(deps.settingsPanelShow).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          theme: 'dark',
          fontSize: 14,
          lineHeight: 1.2,
        })
      );
    });
    (0, vitest_1.it)('should not open when settings panel is not initialized', () => {
      vitest_1.vi.mocked(deps.hasSettingsPanel).mockReturnValue(false);
      coordinator.openSettings();
      (0, vitest_1.expect)(deps.settingsPanelShow).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should use current settings as base when ConfigManager is not available',
      () => {
        vitest_1.vi.mocked(deps.hasConfigManager).mockReturnValue(false);
        vitest_1.vi.mocked(deps.getCurrentSettings).mockReturnValue({ theme: 'dark' });
        coordinator.openSettings();
        (0, vitest_1.expect)(deps.settingsPanelShow).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({ theme: 'dark' })
        );
      }
    );
    (0, vitest_1.it)('should not throw on error', () => {
      vitest_1.vi.mocked(deps.hasSettingsPanel).mockImplementation(() => {
        throw new Error('Panel error');
      });
      (0, vitest_1.expect)(() => coordinator.openSettings()).not.toThrow();
    });
  });
  (0, vitest_1.describe)('updateAllTerminalThemes', () => {
    (0, vitest_1.it)('should update theme for all terminals with terminal instances', () => {
      const mockTerminal = { options: { theme: null } };
      const mockContainer = document.createElement('div');
      const xtermDiv = document.createElement('div');
      xtermDiv.classList.add('xterm');
      mockContainer.appendChild(xtermDiv);
      const terminals = new Map([['t-1', { terminal: mockTerminal, container: mockContainer }]]);
      vitest_1.vi.mocked(deps.getSplitTerminals).mockReturnValue(terminals);
      const theme = { background: '#000000', foreground: '#ffffff' };
      coordinator.updateAllTerminalThemes(theme);
      (0, vitest_1.expect)(mockTerminal.options.theme).toBe(theme);
      (0, vitest_1.expect)(mockContainer.style.backgroundColor).toBe('#000000');
    });
    (0, vitest_1.it)('should skip terminals without terminal instance', () => {
      const terminals = new Map([['t-1', { terminal: null, container: null }]]);
      vitest_1.vi.mocked(deps.getSplitTerminals).mockReturnValue(terminals);
      (0, vitest_1.expect)(() =>
        coordinator.updateAllTerminalThemes({ background: '#000' })
      ).not.toThrow();
    });
    (0, vitest_1.it)('should not throw on error', () => {
      vitest_1.vi.mocked(deps.getSplitTerminals).mockImplementation(() => {
        throw new Error('Theme error');
      });
      (0, vitest_1.expect)(() =>
        coordinator.updateAllTerminalThemes({ background: '#000' })
      ).not.toThrow();
    });
  });
});
//# sourceMappingURL=SettingsCoordinator.test.js.map
