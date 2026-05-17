'use strict';
/**
 * PanelLocationService Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const PanelLocationService_1 = require('../../../../../providers/services/PanelLocationService');
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
  commands: {
    executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
  },
  workspace: {
    getConfiguration: vitest_1.vi.fn(() => ({
      get: vitest_1.vi.fn((key, def) => def),
    })),
    onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('PanelLocationService', () => {
  let service;
  let mockSendMessage;
  (0, vitest_1.beforeEach)(() => {
    vscode.workspace.getConfiguration.mockReturnValue({
      get: vitest_1.vi.fn((key, def) => def),
    });
    mockSendMessage = vitest_1.vi.fn().mockResolvedValue(undefined);
    service = new PanelLocationService_1.PanelLocationService(mockSendMessage);
    vitest_1.vi.useFakeTimers();
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
    vitest_1.vi.useRealTimers();
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('isPanelLocation', () => {
    (0, vitest_1.it)('should validate panel locations correctly', () => {
      (0, vitest_1.expect)((0, PanelLocationService_1.isPanelLocation)('sidebar')).toBe(true);
      (0, vitest_1.expect)((0, PanelLocationService_1.isPanelLocation)('panel')).toBe(true);
      (0, vitest_1.expect)((0, PanelLocationService_1.isPanelLocation)('top')).toBe(false);
      (0, vitest_1.expect)((0, PanelLocationService_1.isPanelLocation)(null)).toBe(false);
      (0, vitest_1.expect)((0, PanelLocationService_1.isPanelLocation)(undefined)).toBe(false);
    });
  });
  (0, vitest_1.describe)('Initialization', () => {
    (0, vitest_1.it)('should setup configuration listener', async () => {
      await service.initialize();
      (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('handlePanelLocationReport', () => {
    (0, vitest_1.it)('should update cached location and set context', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      await service.handlePanelLocationReport('panel');
      (0, vitest_1.expect)(service.getCachedPanelLocation()).toBe('panel');
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
    });
    (0, vitest_1.it)('should trigger callback when location changes', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      const onChange = vitest_1.vi.fn();
      // Default is 'sidebar'
      await service.handlePanelLocationReport('panel', onChange);
      (0, vitest_1.expect)(onChange).toHaveBeenCalledWith('sidebar', 'panel');
    });
    (0, vitest_1.it)('should ignore invalid locations', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'auto';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      await service.handlePanelLocationReport('invalid');
      (0, vitest_1.expect)(service.getCachedPanelLocation()).toBe('sidebar');
    });
    (0, vitest_1.it)('should skip setContext in auto mode but still update cache', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'auto';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      await service.handlePanelLocationReport('panel');
      (0, vitest_1.expect)(service.getCachedPanelLocation()).toBe('panel');
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'panel'
      );
    });
    (0, vitest_1.it)('should prioritize manual panelLocation over reported location', async () => {
      const autoGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'auto';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: autoGet });
      await service.handlePanelLocationReport('panel');
      (0, vitest_1.expect)(service.getCachedPanelLocation()).toBe('panel');
      vitest_1.vi.mocked(vscode.commands.executeCommand).mockClear();
      const manualGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'sidebar';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: manualGet });
      await service.handlePanelLocationReport('panel');
      (0, vitest_1.expect)(service.getCachedPanelLocation()).toBe('sidebar');
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
  });
  (0, vitest_1.describe)('requestPanelLocationDetection', () => {
    (0, vitest_1.it)('should send request message to WebView after debounce', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'auto';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      service.requestPanelLocationDetection();
      (0, vitest_1.expect)(mockSendMessage).not.toHaveBeenCalled();
      vitest_1.vi.advanceTimersByTime(300);
      (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith({
        command: 'requestPanelLocationDetection',
      });
    });
    (0, vitest_1.it)('should skip detection request in manual panelLocation mode', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'sidebar';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      service.requestPanelLocationDetection();
      vitest_1.vi.advanceTimersByTime(300);
      await vitest_1.vi.runAllTimersAsync();
      (0, vitest_1.expect)(mockSendMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT call setContext in error path even in manual mode', async () => {
      // On detection failure, setContext should never be called as fallback.
      // Manual mode users have explicit settings that getCurrentPanelLocation()
      // respects, so overriding context key would contradict their preference.
      mockSendMessage.mockRejectedValue(new Error('Fail'));
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      // Change cached location to 'panel'
      await service.handlePanelLocationReport('panel');
      vitest_1.vi.mocked(vscode.commands.executeCommand).mockClear();
      service.requestPanelLocationDetection();
      vitest_1.vi.advanceTimersByTime(300);
      await vitest_1.vi.runAllTimersAsync();
      // Assert: setContext should NOT be called - respect user's manual 'panel' setting
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should NOT call setContext in error path when panelLocation is auto mode',
      async () => {
        // Bug: The error fallback unconditionally calls setContext('sidebar')
        // even in auto mode, causing VS Code layout recalculation that
        // cancels the secondary sidebar maximize state.
        mockSendMessage.mockRejectedValue(new Error('Fail'));
        const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
          if (key === 'panelLocation') return 'auto';
          return def;
        });
        vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
        service.requestPanelLocationDetection();
        vitest_1.vi.advanceTimersByTime(300);
        await vitest_1.vi.runAllTimersAsync();
        // Assert: setContext should NOT be called in auto mode
        (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
          'setContext',
          'secondaryTerminal.panelLocation',
          'sidebar'
        );
      }
    );
    (0, vitest_1.it)(
      'should NOT call setContext in error path when cached location is already sidebar',
      async () => {
        // If cached location is already 'sidebar', calling setContext('sidebar')
        // is redundant and triggers unnecessary layout recalculation.
        mockSendMessage.mockRejectedValue(new Error('Fail'));
        const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
          if (key === 'panelLocation') return 'panel'; // manual mode
          return def;
        });
        vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
        // Default cached location is 'sidebar', so fallback to 'sidebar' is redundant
        service.requestPanelLocationDetection();
        vitest_1.vi.advanceTimersByTime(300);
        await vitest_1.vi.runAllTimersAsync();
        // Assert: setContext should NOT be called because location hasn't changed
        (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
          'setContext',
          'secondaryTerminal.panelLocation',
          'sidebar'
        );
      }
    );
  });
  (0, vitest_1.describe)('determineSplitDirection', () => {
    (0, vitest_1.it)('should return vertical for sidebar', () => {
      // Reset mock to default behavior to avoid leaking from previous tests
      vscode.workspace.getConfiguration.mockReturnValue({
        get: vitest_1.vi.fn((key, def) => def),
      });
      // Default cached location is sidebar
      (0, vitest_1.expect)(service.determineSplitDirection()).toBe('vertical');
    });
    (0, vitest_1.it)('should return horizontal for panel', async () => {
      await service.handlePanelLocationReport('panel');
      (0, vitest_1.expect)(service.determineSplitDirection()).toBe('horizontal');
    });
  });
  (0, vitest_1.describe)('handlePanelLocationReport - skip redundant setContext', () => {
    (0, vitest_1.it)('should skip setContext when location is unchanged', async () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      // Arrange: Report 'panel' first (changes from default 'sidebar')
      await service.handlePanelLocationReport('panel');
      vitest_1.vi.mocked(vscode.commands.executeCommand).mockClear();
      // Act: Report same location again
      await service.handlePanelLocationReport('panel');
      // Assert: setContext should NOT be called for unchanged location
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should call setContext when location changes', async () => {
      const panelGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: panelGet });
      // Arrange: Report 'panel' first
      await service.handlePanelLocationReport('panel');
      vitest_1.vi.mocked(vscode.commands.executeCommand).mockClear();
      const sidebarGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'panelLocation') return 'sidebar';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: sidebarGet });
      // Act: Emulate manual setting change to sidebar
      await service.handlePanelLocationReport('sidebar');
      // Assert: setContext should be called for changed location
      (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'setContext',
        'secondaryTerminal.panelLocation',
        'sidebar'
      );
    });
    (0, vitest_1.it)(
      'should not trigger onLocationChange callback when location unchanged',
      async () => {
        const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
          if (key === 'panelLocation') return 'panel';
          return def;
        });
        vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
        const onChange = vitest_1.vi.fn();
        // Arrange: Set location to 'panel'
        await service.handlePanelLocationReport('panel');
        // Act: Report same location with callback
        await service.handlePanelLocationReport('panel', onChange);
        // Assert: Callback should not be called
        (0, vitest_1.expect)(onChange).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should skip setContext when first report matches default location',
      async () => {
        const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
          if (key === 'panelLocation') return 'panel';
          return def;
        });
        vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
        // The default cached location is 'sidebar'
        // Reporting the same value should not trigger setContext
        // Act: Report 'sidebar' (same as default)
        await service.handlePanelLocationReport('sidebar');
        // Assert: setContext should NOT be called because location hasn't changed
        (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
          'setContext',
          'secondaryTerminal.panelLocation',
          'sidebar'
        );
      }
    );
  });
  (0, vitest_1.describe)('getCurrentPanelLocation', () => {
    (0, vitest_1.it)('should return sidebar if dynamic split is disabled', () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'dynamicSplitDirection') return false;
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      (0, vitest_1.expect)(service.getCurrentPanelLocation()).toBe('sidebar');
    });
    (0, vitest_1.it)('should return manual location if set', () => {
      const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
        if (key === 'dynamicSplitDirection') return true;
        if (key === 'panelLocation') return 'panel';
        return def;
      });
      vscode.workspace.getConfiguration.mockReturnValue({ get: mockGet });
      (0, vitest_1.expect)(service.getCurrentPanelLocation()).toBe('panel');
    });
  });
});
//# sourceMappingURL=PanelLocationService.test.js.map
