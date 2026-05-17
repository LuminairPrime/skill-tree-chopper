'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const NativeNotificationService_1 = require('../../../../services/NativeNotificationService');
const mockGetConfig = vitest_1.vi.fn();
const { mockWindowState } = vitest_1.vi.hoisted(() => {
  const mockWindowState = { focused: false };
  return { mockWindowState };
});
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: (...args) => mockGetConfig(...args),
  },
  env: {
    appName: 'Visual Studio Code',
  },
  window: {
    state: mockWindowState,
  },
}));
function setDefaultConfig(overrides = {}) {
  const settings = {
    'nativeNotification.enabled': true,
    'nativeNotification.activateWindow': true,
    'nativeNotification.cooldownMs': 10000,
    ...overrides,
  };
  mockGetConfig.mockReturnValue({
    get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
      return settings[key] ?? defaultValue;
    }),
  });
}
(0, vitest_1.describe)('NativeNotificationService', () => {
  let service;
  let mockExecFile;
  const originalPlatform = process.platform;
  function setPlatform(platform) {
    Object.defineProperty(process, 'platform', { value: platform, writable: true });
  }
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    setDefaultConfig();
    mockWindowState.focused = false;
    mockExecFile = vitest_1.vi.fn();
    service = new NativeNotificationService_1.NativeNotificationService(mockExecFile);
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
    Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true });
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('notifyCompleted', () => {
    (0, vitest_1.it)('sends an OS notification when enabled', () => {
      setPlatform('darwin');
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('does not send a notification when disabled', () => {
      setDefaultConfig({ 'nativeNotification.enabled': false });
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('respects per-terminal cooldown', () => {
      setPlatform('darwin');
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      service.notifyCompleted('terminal-1', 'Title', 'Completed again');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(1);
      vitest_1.vi.advanceTimersByTime(10000);
      service.notifyCompleted('terminal-1', 'Title', 'Completed later');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('resets per-terminal cooldown when the terminal is cleared', () => {
      setPlatform('darwin');
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(1);
      service.clearTerminal('terminal-1');
      vitest_1.vi.advanceTimersByTime(10000);
      service.notifyCompleted('terminal-1', 'Title', 'Completed after clear');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)('skips native notifications while VS Code is already focused', () => {
      setPlatform('darwin');
      mockWindowState.focused = true;
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('activates the window when VS Code is not focused', () => {
      setPlatform('darwin');
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).toHaveBeenCalledTimes(1);
      const args = mockExecFile.mock.calls[0][1];
      const script = args[args.indexOf('-e') + 1];
      (0, vitest_1.expect)(script).toContain('activate');
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('does not send notifications after dispose', () => {
      setPlatform('darwin');
      service.dispose();
      service.notifyCompleted('terminal-1', 'Title', 'Completed');
      (0, vitest_1.expect)(mockExecFile).not.toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=NativeNotificationService.test.js.map
