'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const ToastNotificationService_1 = require('../../../../services/ToastNotificationService');
const mockGetConfig = vitest_1.vi.fn();
const mockShowInformationMessage = vitest_1.vi.fn();
const mockSetStatusBarMessage = vitest_1.vi.fn();
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: (...args) => mockGetConfig(...args),
  },
  window: {
    showInformationMessage: (...args) => mockShowInformationMessage(...args),
    setStatusBarMessage: (...args) => mockSetStatusBarMessage(...args),
  },
}));
function setDefaultConfig(overrides = {}) {
  const settings = {
    'agentToastNotification.enabled': true,
    'agentToastNotification.cooldownMs': 10000,
    ...overrides,
  };
  mockGetConfig.mockReturnValue({
    get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
      return settings[key] ?? defaultValue;
    }),
  });
}
(0, vitest_1.describe)('ToastNotificationService', () => {
  let service;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    setDefaultConfig();
    mockShowInformationMessage.mockClear();
    mockSetStatusBarMessage.mockClear();
    service = new ToastNotificationService_1.ToastNotificationService();
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('showCompletedNotification', () => {
    (0, vitest_1.it)('should show completion notification', () => {
      service.showCompletedNotification('terminal-1');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledTimes(1);
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('completed'),
        vitest_1.expect.any(Number)
      );
    });
    (0, vitest_1.it)('should include agent type in completion message', () => {
      service.showCompletedNotification('terminal-1', 'claude');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Claude'),
        vitest_1.expect.any(Number)
      );
    });
    (0, vitest_1.it)('should not show when disabled', () => {
      setDefaultConfig({ 'agentToastNotification.enabled': false });
      service.showCompletedNotification('terminal-1');
      (0, vitest_1.expect)(mockSetStatusBarMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should respect cooldown', () => {
      service.showCompletedNotification('terminal-1');
      service.showCompletedNotification('terminal-1');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledTimes(1);
      vitest_1.vi.advanceTimersByTime(10000);
      service.showCompletedNotification('terminal-1');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('should not show after dispose', () => {
      service.dispose();
      service.showCompletedNotification('terminal-1');
      (0, vitest_1.expect)(mockSetStatusBarMessage).not.toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('clearTerminal', () => {
    (0, vitest_1.it)('should allow notification after clearTerminal resets cooldown', () => {
      service.showCompletedNotification('terminal-1', 'claude');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledTimes(1);
      service.clearTerminal('terminal-1');
      // Global cooldown still applies, advance past it
      vitest_1.vi.advanceTimersByTime(10000);
      service.showCompletedNotification('terminal-1', 'claude');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledTimes(2);
    });
  });
  (0, vitest_1.describe)('focus safety', () => {
    (0, vitest_1.it)('should never call showInformationMessage to avoid stealing focus', () => {
      service.showCompletedNotification('terminal-1', 'claude');
      (0, vitest_1.expect)(mockShowInformationMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should use setStatusBarMessage with auto-dismiss duration', () => {
      service.showCompletedNotification('terminal-1', 'claude');
      (0, vitest_1.expect)(mockSetStatusBarMessage).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Claude'),
        vitest_1.expect.any(Number)
      );
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should not throw on double dispose', () => {
      service.dispose();
      (0, vitest_1.expect)(() => service.dispose()).not.toThrow();
    });
  });
});
//# sourceMappingURL=ToastNotificationService.test.js.map
