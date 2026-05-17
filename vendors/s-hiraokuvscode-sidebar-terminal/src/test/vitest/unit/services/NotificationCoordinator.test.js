'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const NotificationCoordinator_1 = require('../../../../services/NotificationCoordinator');
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue(true),
    }),
  },
  window: {
    setStatusBarMessage: vitest_1.vi.fn(),
  },
  env: {
    appName: 'Visual Studio Code',
  },
}));
(0, vitest_1.describe)('NotificationCoordinator', () => {
  let coordinator;
  let mockToast;
  let mockNative;
  (0, vitest_1.beforeEach)(() => {
    mockToast = {
      showCompletedNotification: vitest_1.vi.fn(),
      clearTerminal: vitest_1.vi.fn(),
      dispose: vitest_1.vi.fn(),
    };
    mockNative = {
      notifyCompleted: vitest_1.vi.fn(),
      clearTerminal: vitest_1.vi.fn(),
      dispose: vitest_1.vi.fn(),
    };
    coordinator = new NotificationCoordinator_1.NotificationCoordinator(mockToast, mockNative);
  });
  (0, vitest_1.afterEach)(() => {
    coordinator.dispose();
  });
  (0, vitest_1.describe)('notifyCompleted', () => {
    (0, vitest_1.it)('should call toast and native for completion notification', () => {
      coordinator.notifyCompleted('terminal-1', 'claude');
      (0, vitest_1.expect)(mockToast.showCompletedNotification).toHaveBeenCalledWith(
        'terminal-1',
        'claude'
      );
      (0, vitest_1.expect)(mockNative.notifyCompleted).toHaveBeenCalledWith(
        'terminal-1',
        'Sidebar Terminal',
        vitest_1.expect.stringContaining('Claude has completed')
      );
    });
    (0, vitest_1.it)('should use "CLI Agent" when agentType is null', () => {
      coordinator.notifyCompleted('terminal-1', null);
      (0, vitest_1.expect)(mockNative.notifyCompleted).toHaveBeenCalledWith(
        'terminal-1',
        'Sidebar Terminal',
        vitest_1.expect.stringContaining('CLI Agent has completed')
      );
    });
    (0, vitest_1.it)('should not call services after dispose', () => {
      coordinator.dispose();
      coordinator.notifyCompleted('terminal-1', 'claude');
      (0, vitest_1.expect)(mockToast.showCompletedNotification).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockNative.notifyCompleted).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('clearTerminal', () => {
    (0, vitest_1.it)('should clear all three services', () => {
      coordinator.clearTerminal('terminal-1');
      (0, vitest_1.expect)(mockToast.clearTerminal).toHaveBeenCalledWith('terminal-1');
      (0, vitest_1.expect)(mockNative.clearTerminal).toHaveBeenCalledWith('terminal-1');
    });
    (0, vitest_1.it)('should not call services after dispose', () => {
      coordinator.dispose();
      coordinator.clearTerminal('terminal-1');
      (0, vitest_1.expect)(mockToast.clearTerminal).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockNative.clearTerminal).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('error isolation', () => {
    (0, vitest_1.it)('should continue notifying other services if one throws', () => {
      mockToast.showCompletedNotification.mockImplementation(() => {
        throw new Error('toast failed');
      });
      coordinator.notifyCompleted('terminal-1', 'claude');
      (0, vitest_1.expect)(mockNative.notifyCompleted).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should continue disposing other services if one throws', () => {
      mockToast.dispose.mockImplementation(() => {
        throw new Error('dispose failed');
      });
      (0, vitest_1.expect)(() => coordinator.dispose()).not.toThrow();
      (0, vitest_1.expect)(mockNative.dispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should dispose both services', () => {
      coordinator.dispose();
      (0, vitest_1.expect)(mockToast.dispose).toHaveBeenCalled();
      (0, vitest_1.expect)(mockNative.dispose).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should not throw on double dispose', () => {
      coordinator.dispose();
      (0, vitest_1.expect)(() => coordinator.dispose()).not.toThrow();
    });
  });
});
//# sourceMappingURL=NotificationCoordinator.test.js.map
