'use strict';
/**
 * NotificationSystem Unit Tests
 *
 * Tests for unified notification system including:
 * - Singleton pattern
 * - Observer/Publisher-Subscriber pattern
 * - Notification lifecycle (create, remove, clear)
 * - Filtering capabilities
 * - Legacy system fallback
 * - Statistics and monitoring
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const NotificationSystem_1 = require('../../../../../webview/core/NotificationSystem');
(0, vitest_1.describe)('NotificationSystem', () => {
  let system;
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset singleton for each test
    NotificationSystem_1.NotificationSystem._instance = null;
    system = NotificationSystem_1.NotificationSystem.getInstance();
    system.setEnabled(true);
    system.setFallbackMode(false);
  });
  afterEach(() => {
    system.clearAll();
    NotificationSystem_1.NotificationSystem._instance = null;
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  (0, vitest_1.describe)('Singleton Pattern', () => {
    (0, vitest_1.it)('should return the same instance', () => {
      const instance1 = NotificationSystem_1.NotificationSystem.getInstance();
      const instance2 = NotificationSystem_1.NotificationSystem.getInstance();
      (0, vitest_1.expect)(instance1).toBe(instance2);
    });
    (0, vitest_1.it)('should create instance via createNotificationSystem helper', () => {
      const instance = (0, NotificationSystem_1.createNotificationSystem)();
      (0, vitest_1.expect)(instance).toBe(system);
    });
  });
  (0, vitest_1.describe)('Feature Flags', () => {
    (0, vitest_1.it)('should be disabled by default', () => {
      NotificationSystem_1.NotificationSystem._instance = null;
      const newSystem = NotificationSystem_1.NotificationSystem.getInstance();
      (0, vitest_1.expect)(newSystem.isEnabled()).toBe(false);
    });
    (0, vitest_1.it)('should enable notifications', () => {
      system.setEnabled(true);
      (0, vitest_1.expect)(system.isEnabled()).toBe(true);
    });
    (0, vitest_1.it)('should disable notifications', () => {
      system.setEnabled(true);
      system.setEnabled(false);
      (0, vitest_1.expect)(system.isEnabled()).toBe(false);
    });
  });
  (0, vitest_1.describe)('Helper Functions', () => {
    (0, vitest_1.it)('should enable unified notifications via helper', () => {
      system.setEnabled(false);
      (0, NotificationSystem_1.enableUnifiedNotifications)();
      (0, vitest_1.expect)(system.isEnabled()).toBe(true);
    });
    (0, vitest_1.it)('should disable unified notifications via helper', () => {
      system.setEnabled(true);
      (0, NotificationSystem_1.disableUnifiedNotifications)();
      (0, vitest_1.expect)(system.isEnabled()).toBe(false);
    });
    (0, vitest_1.it)('should enable fallback mode via helper', () => {
      system.setFallbackMode(false);
      (0, NotificationSystem_1.enableFallbackMode)();
      // Verify by checking legacy call when notify is used
      const mockLegacyShow = vi.fn();
      globalThis.showNotification = mockLegacyShow;
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).toHaveBeenCalled();
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should disable fallback mode via helper', () => {
      system.setFallbackMode(true);
      (0, NotificationSystem_1.disableFallbackMode)();
      const mockLegacyShow = vi.fn();
      globalThis.showNotification = mockLegacyShow;
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).not.toHaveBeenCalled();
      delete globalThis.showNotification;
    });
  });
  (0, vitest_1.describe)('notify', () => {
    (0, vitest_1.it)('should create notification with generated id', () => {
      const id = system.notify({
        type: 'info',
        title: 'Test Title',
        message: 'Test message',
      });
      (0, vitest_1.expect)(id).toMatch(/^notification_\d+_/);
    });
    (0, vitest_1.it)('should store notification when enabled', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const notifications = system.getActiveNotifications();
      (0, vitest_1.expect)(notifications).toHaveLength(1);
    });
    (0, vitest_1.it)('should not store notification when disabled', () => {
      system.setEnabled(false);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const notifications = system.getActiveNotifications();
      (0, vitest_1.expect)(notifications).toHaveLength(0);
    });
    (0, vitest_1.it)('should use default duration of 4000ms when not specified', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].duration).toBe(4000);
    });
    (0, vitest_1.it)('should use custom duration when specified', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 6000,
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].duration).toBe(6000);
    });
    (0, vitest_1.it)('should set notification type correctly', () => {
      const types = ['error', 'warning', 'info', 'success'];
      types.forEach((type) => {
        system.notify({
          type,
          title: 'Test',
          message: 'Test message',
        });
      });
      const notifications = system.getActiveNotifications();
      (0, vitest_1.expect)(notifications.map((n) => n.type)).toEqual(types);
    });
    (0, vitest_1.it)('should set source to "unknown" when not specified', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].source).toBe('unknown');
    });
    (0, vitest_1.it)('should use custom source when specified', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        source: 'test-source',
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].source).toBe('test-source');
    });
    (0, vitest_1.it)('should auto-remove notification after duration', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 3000,
      });
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(1);
      vi.advanceTimersByTime(3000);
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(0);
    });
    (0, vitest_1.it)('should use default duration when duration is 0 (falsy)', () => {
      // duration: 0 is falsy, so || 4000 applies default duration
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        duration: 0,
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].duration).toBe(4000);
      // Notification should be auto-removed after default duration
      vi.advanceTimersByTime(4000);
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('Observer Pattern', () => {
    (0, vitest_1.it)('should subscribe observer', () => {
      const observer = {
        onNotification: vi.fn(),
      };
      system.subscribe(observer);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(observer.onNotification).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should unsubscribe observer', () => {
      const observer = {
        onNotification: vi.fn(),
      };
      system.subscribe(observer);
      system.unsubscribe(observer);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(observer.onNotification).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should notify multiple observers', () => {
      const observer1 = {
        onNotification: vi.fn(),
      };
      const observer2 = {
        onNotification: vi.fn(),
      };
      system.subscribe(observer1);
      system.subscribe(observer2);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(observer1.onNotification).toHaveBeenCalled();
      (0, vitest_1.expect)(observer2.onNotification).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should notify observer on notification removal', () => {
      const observer = {
        onNotification: vi.fn(),
        onNotificationRemoved: vi.fn(),
      };
      system.subscribe(observer);
      const id = system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      system.removeNotification(id);
      (0, vitest_1.expect)(observer.onNotificationRemoved).toHaveBeenCalledWith(id);
    });
    (0, vitest_1.it)('should handle observer errors gracefully', () => {
      const observer = {
        onNotification: vi.fn().mockImplementation(() => {
          throw new Error('Observer error');
        }),
      };
      system.subscribe(observer);
      (0, vitest_1.expect)(() => {
        system.notify({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      }).not.toThrow();
    });
    (0, vitest_1.it)('should return filter id when subscribing with filter', () => {
      const observer = {
        onNotification: vi.fn(),
      };
      const filterId = system.subscribe(observer, { type: ['error'] });
      (0, vitest_1.expect)(filterId).toMatch(/^filter_\d+_/);
    });
    (0, vitest_1.it)('should return "default" when subscribing without filter', () => {
      const observer = {
        onNotification: vi.fn(),
      };
      const filterId = system.subscribe(observer);
      (0, vitest_1.expect)(filterId).toBe('default');
    });
  });
  (0, vitest_1.describe)('removeNotification', () => {
    (0, vitest_1.it)('should remove existing notification', () => {
      const id = system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const result = system.removeNotification(id);
      (0, vitest_1.expect)(result).toBe(true);
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(0);
    });
    (0, vitest_1.it)('should return false for non-existent notification', () => {
      const result = system.removeNotification('non-existent-id');
      (0, vitest_1.expect)(result).toBe(false);
    });
  });
  (0, vitest_1.describe)('clearAll', () => {
    (0, vitest_1.it)('should remove all notifications', () => {
      system.notify({ type: 'info', title: 'Test 1', message: 'Message 1' });
      system.notify({ type: 'warning', title: 'Test 2', message: 'Message 2' });
      system.notify({ type: 'error', title: 'Test 3', message: 'Message 3' });
      system.clearAll();
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(0);
    });
    (0, vitest_1.it)('should notify observers of removal for each notification', () => {
      const observer = {
        onNotification: vi.fn(),
        onNotificationRemoved: vi.fn(),
      };
      system.subscribe(observer);
      system.notify({ type: 'info', title: 'Test 1', message: 'Message 1' });
      system.notify({ type: 'info', title: 'Test 2', message: 'Message 2' });
      system.clearAll();
      (0, vitest_1.expect)(observer.onNotificationRemoved).toHaveBeenCalledTimes(2);
    });
  });
  (0, vitest_1.describe)('getActiveNotifications', () => {
    (0, vitest_1.it)('should return all notifications without filter', () => {
      system.notify({ type: 'info', title: 'Test 1', message: 'Message 1' });
      system.notify({ type: 'error', title: 'Test 2', message: 'Message 2' });
      const notifications = system.getActiveNotifications();
      (0, vitest_1.expect)(notifications).toHaveLength(2);
    });
    (0, vitest_1.it)('should filter by type', () => {
      system.notify({ type: 'info', title: 'Test 1', message: 'Message 1' });
      system.notify({ type: 'error', title: 'Test 2', message: 'Message 2' });
      system.notify({ type: 'warning', title: 'Test 3', message: 'Message 3' });
      const filter = { type: ['error', 'warning'] };
      const notifications = system.getActiveNotifications(filter);
      (0, vitest_1.expect)(notifications).toHaveLength(2);
      (0, vitest_1.expect)(
        notifications.every((n) => n.type === 'error' || n.type === 'warning')
      ).toBe(true);
    });
    (0, vitest_1.it)('should filter by source', () => {
      system.notify({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
        source: 'source-a',
      });
      system.notify({
        type: 'info',
        title: 'Test 2',
        message: 'Message 2',
        source: 'source-b',
      });
      const filter = { source: ['source-a'] };
      const notifications = system.getActiveNotifications(filter);
      (0, vitest_1.expect)(notifications).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].source).toBe('source-a');
    });
    (0, vitest_1.it)('should filter by maxAge', () => {
      system.notify({ type: 'info', title: 'Test 1', message: 'Message 1' });
      vi.advanceTimersByTime(5000);
      system.notify({ type: 'info', title: 'Test 2', message: 'Message 2' });
      const filter = { maxAge: 3000 };
      const notifications = system.getActiveNotifications(filter);
      (0, vitest_1.expect)(notifications).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].title).toBe('Test 2');
    });
  });
  (0, vitest_1.describe)('getStats', () => {
    (0, vitest_1.it)('should return correct statistics', () => {
      system.notify({
        type: 'info',
        title: 'Test 1',
        message: 'Message 1',
        source: 'source-a',
      });
      system.notify({
        type: 'error',
        title: 'Test 2',
        message: 'Message 2',
        source: 'source-a',
      });
      system.notify({
        type: 'info',
        title: 'Test 3',
        message: 'Message 3',
        source: 'source-b',
      });
      const observer = {
        onNotification: vi.fn(),
      };
      system.subscribe(observer);
      const stats = system.getStats();
      (0, vitest_1.expect)(stats.totalNotifications).toBe(3);
      (0, vitest_1.expect)(stats.activeObservers).toBe(1);
      (0, vitest_1.expect)(stats.byType.info).toBe(2);
      (0, vitest_1.expect)(stats.byType.error).toBe(1);
      (0, vitest_1.expect)(stats.bySource['source-a']).toBe(2);
      (0, vitest_1.expect)(stats.bySource['source-b']).toBe(1);
    });
    (0, vitest_1.it)('should return empty statistics when no notifications', () => {
      const stats = system.getStats();
      (0, vitest_1.expect)(stats.totalNotifications).toBe(0);
      (0, vitest_1.expect)(stats.activeObservers).toBe(0);
      (0, vitest_1.expect)(stats.byType).toEqual({});
      (0, vitest_1.expect)(stats.bySource).toEqual({});
    });
  });
  (0, vitest_1.describe)('Legacy Fallback', () => {
    (0, vitest_1.it)('should call legacy system when fallback mode is enabled', () => {
      const mockLegacyShow = vi.fn();
      globalThis.showNotification = mockLegacyShow;
      system.setFallbackMode(true);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        })
      );
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should not call legacy system when fallback mode is disabled', () => {
      const mockLegacyShow = vi.fn();
      globalThis.showNotification = mockLegacyShow;
      system.setFallbackMode(false);
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      (0, vitest_1.expect)(mockLegacyShow).not.toHaveBeenCalled();
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should handle legacy system errors gracefully', () => {
      globalThis.showNotification = vi.fn().mockImplementation(() => {
        throw new Error('Legacy error');
      });
      system.setFallbackMode(true);
      (0, vitest_1.expect)(() => {
        system.notify({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      }).not.toThrow();
      delete globalThis.showNotification;
    });
    (0, vitest_1.it)('should handle missing legacy system gracefully', () => {
      delete globalThis.showNotification;
      system.setFallbackMode(true);
      (0, vitest_1.expect)(() => {
        system.notify({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Edge Cases', () => {
    (0, vitest_1.it)('should handle notification with icon', () => {
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
        icon: '🔔',
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].icon).toBe('🔔');
    });
    (0, vitest_1.it)('should set timestamp on notification', () => {
      const beforeTime = Date.now();
      system.notify({
        type: 'info',
        title: 'Test',
        message: 'Test message',
      });
      const notifications = system.getActiveNotifications();
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(notifications[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    });
    (0, vitest_1.it)('should handle rapid notifications', () => {
      for (let i = 0; i < 100; i++) {
        system.notify({
          type: 'info',
          title: `Test ${i}`,
          message: `Message ${i}`,
        });
      }
      (0, vitest_1.expect)(system.getActiveNotifications()).toHaveLength(100);
    });
    (0, vitest_1.it)('should generate unique notification IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) {
        const id = system.notify({
          type: 'info',
          title: `Test ${i}`,
          message: `Message ${i}`,
        });
        ids.add(id);
      }
      (0, vitest_1.expect)(ids.size).toBe(50);
    });
  });
});
(0, vitest_1.describe)('Default Duration Constant', () => {
  let system;
  beforeEach(() => {
    NotificationSystem_1.NotificationSystem._instance = null;
    system = NotificationSystem_1.NotificationSystem.getInstance();
    system.setEnabled(true);
    system.setFallbackMode(false);
  });
  afterEach(() => {
    system.clearAll();
    NotificationSystem_1.NotificationSystem._instance = null;
  });
  (0, vitest_1.it)('should use 4000ms as default duration', () => {
    system.notify({
      type: 'info',
      title: 'Test',
      message: 'Test message',
    });
    const notifications = system.getActiveNotifications();
    // @ts-expect-error - test mock type
    (0, vitest_1.expect)(notifications[0].duration).toBe(4000);
  });
});
//# sourceMappingURL=NotificationSystem.test.js.map
