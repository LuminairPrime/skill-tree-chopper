'use strict';
/**
 * NotificationBridge Unit Tests
 *
 * Tests for notification bridge functionality including:
 * - Singleton instance management
 * - Migration mode switching (legacy/hybrid/unified)
 * - Notification display methods
 * - Legacy system compatibility
 * - Specialized notification helpers
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const NotificationBridge_1 = require('../../../../../webview/core/NotificationBridge');
// Mock NotificationSystem
const mockNotificationSystem = {
  getInstance: vitest_1.vi.fn(),
  notify: vitest_1.vi.fn().mockReturnValue('notification-id'),
  setEnabled: vitest_1.vi.fn(),
  setFallbackMode: vitest_1.vi.fn(),
  clearAll: vitest_1.vi.fn(),
  isEnabled: vitest_1.vi.fn().mockReturnValue(false),
  getStats: vitest_1.vi.fn().mockReturnValue({
    totalNotifications: 0,
    activeNotifications: 0,
    filteredNotifications: 0,
  }),
};
vitest_1.vi.mock('../../../../../webview/core/NotificationSystem', () => ({
  NotificationSystem: {
    getInstance: () => mockNotificationSystem,
  },
}));
(0, vitest_1.describe)('NotificationBridge', () => {
  let bridge;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    // Reset singleton for each test
    NotificationBridge_1.NotificationBridge._instance = null;
    bridge = NotificationBridge_1.NotificationBridge.getInstance();
  });
  (0, vitest_1.afterEach)(() => {
    // Clean up singleton
    NotificationBridge_1.NotificationBridge._instance = null;
  });
  (0, vitest_1.describe)('Singleton Pattern', () => {
    (0, vitest_1.it)('should return the same instance', () => {
      const instance1 = NotificationBridge_1.NotificationBridge.getInstance();
      const instance2 = NotificationBridge_1.NotificationBridge.getInstance();
      (0, vitest_1.expect)(instance1).toBe(instance2);
    });
    (0, vitest_1.it)('should create instance via getNotificationBridge helper', () => {
      const instance = (0, NotificationBridge_1.getNotificationBridge)();
      (0, vitest_1.expect)(instance).toBe(bridge);
    });
  });
  (0, vitest_1.describe)('Migration Mode', () => {
    (0, vitest_1.it)('should default to legacy mode', () => {
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('legacy');
    });
    (0, vitest_1.it)('should switch to legacy mode', () => {
      bridge.setMigrationMode('legacy');
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('legacy');
      (0, vitest_1.expect)(mockNotificationSystem.setEnabled).toHaveBeenCalledWith(false);
      (0, vitest_1.expect)(mockNotificationSystem.setFallbackMode).toHaveBeenCalledWith(true);
    });
    (0, vitest_1.it)('should switch to hybrid mode', () => {
      bridge.setMigrationMode('hybrid');
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('hybrid');
      (0, vitest_1.expect)(mockNotificationSystem.setEnabled).toHaveBeenCalledWith(true);
      (0, vitest_1.expect)(mockNotificationSystem.setFallbackMode).toHaveBeenCalledWith(true);
    });
    (0, vitest_1.it)('should switch to unified mode', () => {
      bridge.setMigrationMode('unified');
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('unified');
      (0, vitest_1.expect)(mockNotificationSystem.setEnabled).toHaveBeenCalledWith(true);
      (0, vitest_1.expect)(mockNotificationSystem.setFallbackMode).toHaveBeenCalledWith(false);
    });
  });
  (0, vitest_1.describe)('Helper Functions', () => {
    (0, vitest_1.it)('should enable hybrid notifications', () => {
      (0, NotificationBridge_1.enableHybridNotifications)();
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('hybrid');
    });
    (0, vitest_1.it)('should enable unified notifications only', () => {
      (0, NotificationBridge_1.enableUnifiedNotificationsOnly)();
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('unified');
    });
    (0, vitest_1.it)('should revert to legacy notifications', () => {
      bridge.setMigrationMode('unified');
      (0, NotificationBridge_1.revertToLegacyNotifications)();
      (0, vitest_1.expect)(bridge.getMigrationMode()).toBe('legacy');
    });
  });
  (0, vitest_1.describe)('showNotification', () => {
    (0, vitest_1.it)('should call legacy system in legacy mode', () => {
      const mockLegacyShow = vitest_1.vi.fn();
      globalThis.showNotification = mockLegacyShow;
      bridge.setMigrationMode('legacy');
      bridge.showNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).toHaveBeenCalled();
      (0, vitest_1.expect)(mockNotificationSystem.notify).not.toHaveBeenCalled();
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should call both systems in hybrid mode', () => {
      const mockLegacyShow = vitest_1.vi.fn();
      globalThis.showNotification = mockLegacyShow;
      bridge.setMigrationMode('hybrid');
      const result = bridge.showNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).toHaveBeenCalled();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalled();
      (0, vitest_1.expect)(result).toBe('notification-id');
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should call only unified system in unified mode', () => {
      const mockLegacyShow = vitest_1.vi.fn();
      globalThis.showNotification = mockLegacyShow;
      bridge.setMigrationMode('unified');
      const result = bridge.showNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalled();
      (0, vitest_1.expect)(result).toBe('notification-id');
      delete globalThis.showNotification;
    });
  });
  (0, vitest_1.describe)('Specialized Notification Methods', () => {
    (0, vitest_1.beforeEach)(() => {
      bridge.setMigrationMode('unified');
    });
    (0, vitest_1.it)('should show terminal close error', () => {
      bridge.showTerminalCloseError(1);
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'warning',
          title: 'Cannot close terminal',
          message: 'Must keep at least 1 terminal open',
          icon: '⚠️',
        })
      );
    });
    (0, vitest_1.it)('should show terminal close error with plural', () => {
      bridge.showTerminalCloseError(2);
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          message: 'Must keep at least 2 terminals open',
        })
      );
    });
    (0, vitest_1.it)('should show terminal kill error', () => {
      bridge.showTerminalKillError('Process not found');
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'error',
          title: 'Terminal kill failed',
          message: 'Process not found',
          icon: '❌',
        })
      );
    });
    (0, vitest_1.it)('should show split limit warning', () => {
      bridge.showSplitLimitWarning('Maximum 5 terminals allowed');
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'warning',
          title: 'Split Limit Reached',
          message: 'Maximum 5 terminals allowed',
          icon: '⚠️',
        })
      );
    });
    (0, vitest_1.it)('should show CLI agent detected notification', () => {
      bridge.showCliAgentDetected();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'info',
          title: 'CLI Agent Detected',
          icon: '🤖',
          duration: 6000,
        })
      );
    });
    (0, vitest_1.it)('should show CLI agent ended notification', () => {
      bridge.showCliAgentEnded();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'success',
          title: 'CLI Agent Session Ended',
          icon: '✅',
          duration: 3000,
        })
      );
    });
    (0, vitest_1.it)('should show Alt+Click disabled warning', () => {
      bridge.showAltClickDisabledWarning('Test reason');
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'warning',
          title: 'Alt+Click Disabled',
          message: 'Test reason',
          icon: '🚫',
          duration: 4000,
        })
      );
    });
    (0, vitest_1.it)('should show Alt+Click disabled warning with default message', () => {
      bridge.showAltClickDisabledWarning();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          message: 'Alt+Click cursor positioning is currently disabled',
        })
      );
    });
    (0, vitest_1.it)('should show Alt+Click setting error', () => {
      bridge.showAltClickSettingError();
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'warning',
          title: 'Alt+Click Configuration',
          icon: '⚙️',
          duration: 6000,
        })
      );
    });
    (0, vitest_1.it)('should show terminal interaction issue', () => {
      bridge.showTerminalInteractionIssue('Connection lost');
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'warning',
          title: 'Terminal Interaction Issue',
          message: 'Connection lost',
          icon: '⚡',
          duration: 5000,
        })
      );
    });
  });
  (0, vitest_1.describe)('clearAllNotifications', () => {
    (0, vitest_1.it)('should clear only unified system in unified mode', () => {
      const mockLegacyClear = vitest_1.vi.fn();
      globalThis.clearAllNotifications = mockLegacyClear;
      bridge.setMigrationMode('unified');
      bridge.clearAllNotifications();
      (0, vitest_1.expect)(mockNotificationSystem.clearAll).toHaveBeenCalled();
      (0, vitest_1.expect)(mockLegacyClear).not.toHaveBeenCalled();
      delete globalThis.clearAllNotifications;
    });
    (0, vitest_1.it)('should clear only legacy system in legacy mode', () => {
      const mockLegacyShow = vitest_1.vi.fn();
      const mockLegacyClear = vitest_1.vi.fn();
      globalThis.showNotification = mockLegacyShow;
      globalThis.clearAllNotifications = mockLegacyClear;
      bridge.setMigrationMode('legacy');
      bridge.clearAllNotifications();
      (0, vitest_1.expect)(mockNotificationSystem.clearAll).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockLegacyClear).toHaveBeenCalled();
      delete globalThis.showNotification;
      delete globalThis.clearAllNotifications;
    });
    (0, vitest_1.it)('should clear both systems in hybrid mode', () => {
      const mockLegacyShow = vitest_1.vi.fn();
      const mockLegacyClear = vitest_1.vi.fn();
      globalThis.showNotification = mockLegacyShow;
      globalThis.clearAllNotifications = mockLegacyClear;
      bridge.setMigrationMode('hybrid');
      bridge.clearAllNotifications();
      (0, vitest_1.expect)(mockNotificationSystem.clearAll).toHaveBeenCalled();
      (0, vitest_1.expect)(mockLegacyClear).toHaveBeenCalled();
      delete globalThis.showNotification;
      delete globalThis.clearAllNotifications;
    });
  });
  (0, vitest_1.describe)('getMigrationStats', () => {
    (0, vitest_1.it)('should return migration statistics', () => {
      mockNotificationSystem.isEnabled.mockReturnValue(true);
      bridge.setMigrationMode('hybrid');
      const stats = bridge.getMigrationStats();
      (0, vitest_1.expect)(stats).toEqual({
        mode: 'hybrid',
        unifiedSystemActive: true,
        legacySystemAvailable: false, // No global function defined
        unifiedStats: vitest_1.expect.any(Object),
      });
    });
    (0, vitest_1.it)('should detect legacy system availability', () => {
      globalThis.showNotification = vitest_1.vi.fn();
      const stats = bridge.getMigrationStats();
      (0, vitest_1.expect)(stats.legacySystemAvailable).toBe(true);
      delete globalThis.showNotification;
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle legacy show notification errors gracefully', () => {
      globalThis.showNotification = vitest_1.vi.fn().mockImplementation(() => {
        throw new Error('Legacy error');
      });
      bridge.setMigrationMode('legacy');
      (0, vitest_1.expect)(() => {
        bridge.showNotification({ type: 'info', title: 'Test', message: 'Test' });
      }).not.toThrow();
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should handle legacy clear all errors gracefully', () => {
      globalThis.clearAllNotifications = vitest_1.vi.fn().mockImplementation(() => {
        throw new Error('Legacy error');
      });
      bridge.setMigrationMode('legacy');
      (0, vitest_1.expect)(() => {
        bridge.clearAllNotifications();
      }).not.toThrow();
      delete globalThis.clearAllNotifications;
    });
    (0, vitest_1.it)('should handle missing legacy system gracefully', () => {
      // Ensure no global functions
      delete globalThis.showNotification;
      delete globalThis.clearAllNotifications;
      bridge.setMigrationMode('legacy');
      (0, vitest_1.expect)(() => {
        bridge.showNotification({ type: 'info', title: 'Test', message: 'Test' });
        bridge.clearAllNotifications();
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Source Detection', () => {
    (0, vitest_1.it)('should include source in unified mode notifications', () => {
      bridge.setMigrationMode('unified');
      bridge.showNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          source: vitest_1.expect.any(String),
        })
      );
    });
  });
});
(0, vitest_1.describe)('Notification Duration Constants', () => {
  let bridge;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    NotificationBridge_1.NotificationBridge._instance = null;
    bridge = NotificationBridge_1.NotificationBridge.getInstance();
    bridge.setMigrationMode('unified');
  });
  (0, vitest_1.afterEach)(() => {
    NotificationBridge_1.NotificationBridge._instance = null;
  });
  (0, vitest_1.it)('should use 6000ms for CLI agent detected', () => {
    bridge.showCliAgentDetected();
    (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ duration: 6000 })
    );
  });
  (0, vitest_1.it)('should use 3000ms for CLI agent ended', () => {
    bridge.showCliAgentEnded();
    (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ duration: 3000 })
    );
  });
  (0, vitest_1.it)('should use 4000ms for Alt+Click disabled', () => {
    bridge.showAltClickDisabledWarning();
    (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ duration: 4000 })
    );
  });
  (0, vitest_1.it)('should use 6000ms for Alt+Click setting error', () => {
    bridge.showAltClickSettingError();
    (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ duration: 6000 })
    );
  });
  (0, vitest_1.it)('should use 5000ms for terminal interaction issue', () => {
    bridge.showTerminalInteractionIssue('test');
    (0, vitest_1.expect)(mockNotificationSystem.notify).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ duration: 5000 })
    );
  });
});
//# sourceMappingURL=NotificationBridge.test.js.map
