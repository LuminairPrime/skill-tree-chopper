'use strict';
/**
 * DebugPanelManager Unit Tests
 *
 * Tests for debug panel display and system diagnostics including:
 * - Panel visibility toggle
 * - State update display
 * - Performance counters
 * - System diagnostics export
 * - Uptime calculation
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const DebugPanelManager_1 = require('../../../../../webview/managers/DebugPanelManager');
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  webview: vitest_1.vi.fn(),
}));
// Mock navigator for diagnostics tests
const mockNavigator = {
  userAgent: 'MockBrowser/1.0',
  platform: 'MockOS',
  language: 'en-US',
  cookieEnabled: true,
  onLine: true,
};
// Helper to create mock terminal state
function createMockTerminalState(options = {}) {
  return {
    terminals: options.terminals ?? [
      { id: 'terminal-1', isActive: true, number: 1 },
      { id: 'terminal-2', isActive: false, number: 2 },
    ],
    availableSlots: options.availableSlots ?? [3, 4, 5],
    activeTerminalId: options.activeTerminalId ?? 'terminal-1',
    maxTerminals: options.maxTerminals ?? 5,
    ...options,
  };
}
(0, vitest_1.describe)('DebugPanelManager', () => {
  let manager;
  let originalDocument;
  let mockDocument;
  (0, vitest_1.beforeEach)(() => {
    // Setup DOM mock
    originalDocument = global.document;
    mockDocument = {
      getElementById: vitest_1.vi.fn().mockReturnValue(null),
      createElement: vitest_1.vi.fn().mockImplementation((tag) => ({
        tagName: tag.toUpperCase(),
        style: { cssText: '' },
        appendChild: vitest_1.vi.fn(),
        remove: vitest_1.vi.fn(),
        innerHTML: '',
        textContent: '',
        onclick: null,
        id: '',
      })),
      body: {
        appendChild: vitest_1.vi.fn(),
      },
    };
    global.document = mockDocument;
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    manager = new DebugPanelManager_1.DebugPanelManager();
  });
  (0, vitest_1.afterEach)(() => {
    global.document = originalDocument;
    vitest_1.vi.clearAllMocks();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('toggle', () => {
    (0, vitest_1.it)('should enable debug mode on first toggle', () => {
      (0, vitest_1.expect)(manager.isActive()).toBe(false);
      manager.toggle();
      (0, vitest_1.expect)(manager.isActive()).toBe(true);
    });
    (0, vitest_1.it)('should disable debug mode on second toggle', () => {
      manager.toggle();
      manager.toggle();
      (0, vitest_1.expect)(manager.isActive()).toBe(false);
    });
    (0, vitest_1.it)('should update display when toggled with state', () => {
      const state = createMockTerminalState();
      manager.toggle(state);
      (0, vitest_1.expect)(manager.isActive()).toBe(true);
    });
    (0, vitest_1.it)('should remove panel when toggling off', () => {
      const mockPanel = {
        remove: vitest_1.vi.fn(),
      };
      mockDocument.getElementById.mockReturnValue(mockPanel);
      manager.toggle(); // Enable
      manager.toggle(); // Disable
      (0, vitest_1.expect)(mockPanel.remove).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('isActive', () => {
    (0, vitest_1.it)('should return false initially', () => {
      (0, vitest_1.expect)(manager.isActive()).toBe(false);
    });
    (0, vitest_1.it)('should return true after enabling', () => {
      manager.toggle();
      (0, vitest_1.expect)(manager.isActive()).toBe(true);
    });
  });
  (0, vitest_1.describe)('updateDisplay', () => {
    (0, vitest_1.it)('should increment state updates counter', () => {
      const state = createMockTerminalState();
      const initialCounters = manager.getCounters();
      manager.updateDisplay(state);
      const updatedCounters = manager.getCounters();
      (0, vitest_1.expect)(updatedCounters.stateUpdates).toBe(initialCounters.stateUpdates + 1);
    });
    (0, vitest_1.it)('should update lastSync timestamp', () => {
      vitest_1.vi.useFakeTimers();
      const testDate = new Date('2025-01-01T12:00:00Z');
      vitest_1.vi.setSystemTime(testDate);
      const state = createMockTerminalState();
      manager.updateDisplay(state);
      const counters = manager.getCounters();
      (0, vitest_1.expect)(counters.lastSync).toBe(testDate.toISOString());
    });
    (0, vitest_1.it)('should not display info when debug mode is inactive', () => {
      const state = createMockTerminalState();
      manager.updateDisplay(state);
      // No panel should be created when debug mode is off
      (0, vitest_1.expect)(mockDocument.createElement).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should display info when debug mode is active', () => {
      manager.toggle(); // Enable debug mode
      const state = createMockTerminalState();
      manager.updateDisplay(state, 'test-operation');
      (0, vitest_1.expect)(mockDocument.createElement).toHaveBeenCalledWith('div');
    });
  });
  (0, vitest_1.describe)('incrementStateUpdates', () => {
    (0, vitest_1.it)('should increment the counter', () => {
      const initialCount = manager.getCounters().stateUpdates;
      manager.incrementStateUpdates();
      manager.incrementStateUpdates();
      manager.incrementStateUpdates();
      (0, vitest_1.expect)(manager.getCounters().stateUpdates).toBe(initialCount + 3);
    });
    (0, vitest_1.it)('should update lastSync', () => {
      vitest_1.vi.useFakeTimers();
      const testDate = new Date('2025-06-15T10:30:00Z');
      vitest_1.vi.setSystemTime(testDate);
      manager.incrementStateUpdates();
      (0, vitest_1.expect)(manager.getCounters().lastSync).toBe(testDate.toISOString());
    });
  });
  (0, vitest_1.describe)('getCounters', () => {
    (0, vitest_1.it)('should return a copy of counters', () => {
      const counters1 = manager.getCounters();
      const counters2 = manager.getCounters();
      (0, vitest_1.expect)(counters1).not.toBe(counters2);
      (0, vitest_1.expect)(counters1).toEqual(counters2);
    });
    (0, vitest_1.it)('should have initial values', () => {
      const counters = manager.getCounters();
      (0, vitest_1.expect)(counters.stateUpdates).toBe(0);
      (0, vitest_1.expect)(counters.lastSync).toBe('never');
      (0, vitest_1.expect)(counters.systemStartTime).toBeGreaterThan(0);
    });
  });
  (0, vitest_1.describe)('exportDiagnostics', () => {
    (0, vitest_1.it)('should return complete diagnostics object', () => {
      const systemStatus = {
        ready: true,
        state: null,
        pendingOperations: { deletions: [], creations: 0 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 5);
      (0, vitest_1.expect)(diagnostics).toHaveProperty('timestamp');
      (0, vitest_1.expect)(diagnostics).toHaveProperty('systemStatus');
      (0, vitest_1.expect)(diagnostics).toHaveProperty('performanceCounters');
      (0, vitest_1.expect)(diagnostics).toHaveProperty('configuration');
      (0, vitest_1.expect)(diagnostics).toHaveProperty('extensionCommunication');
      (0, vitest_1.expect)(diagnostics).toHaveProperty('troubleshootingInfo');
    });
    (0, vitest_1.it)('should include correct system status', () => {
      const systemStatus = {
        ready: false,
        state: null,
        pendingOperations: { deletions: ['t1', 't2'], creations: 3 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 5);
      (0, vitest_1.expect)(diagnostics.systemStatus).toEqual(systemStatus);
    });
    (0, vitest_1.it)('should include configuration with debug mode', () => {
      manager.toggle(); // Enable debug mode
      const systemStatus = {
        ready: true,
        state: null,
        pendingOperations: { deletions: [], creations: 0 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 10);
      (0, vitest_1.expect)(diagnostics.configuration.debugMode).toBe(true);
      (0, vitest_1.expect)(diagnostics.configuration.maxTerminals).toBe(10);
    });
    (0, vitest_1.it)('should include troubleshooting info from navigator', () => {
      const systemStatus = {
        ready: true,
        state: null,
        pendingOperations: { deletions: [], creations: 0 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 5);
      (0, vitest_1.expect)(diagnostics.troubleshootingInfo.userAgent).toBe('MockBrowser/1.0');
      (0, vitest_1.expect)(diagnostics.troubleshootingInfo.platform).toBe('MockOS');
      (0, vitest_1.expect)(diagnostics.troubleshootingInfo.language).toBe('en-US');
      (0, vitest_1.expect)(diagnostics.troubleshootingInfo.cookieEnabled).toBe(true);
      (0, vitest_1.expect)(diagnostics.troubleshootingInfo.onLine).toBe(true);
    });
    (0, vitest_1.it)('should include performance counters snapshot', () => {
      manager.incrementStateUpdates();
      manager.incrementStateUpdates();
      const systemStatus = {
        ready: true,
        state: null,
        pendingOperations: { deletions: [], creations: 0 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 5);
      (0, vitest_1.expect)(diagnostics.performanceCounters.stateUpdates).toBe(2);
    });
  });
  (0, vitest_1.describe)('getUptime', () => {
    (0, vitest_1.it)('should return seconds for short uptime', () => {
      vitest_1.vi.useFakeTimers();
      const now = Date.now();
      vitest_1.vi.setSystemTime(now);
      const freshManager = new DebugPanelManager_1.DebugPanelManager();
      vitest_1.vi.advanceTimersByTime(45000); // 45 seconds
      const uptime = freshManager.getUptime();
      (0, vitest_1.expect)(uptime).toBe('45s');
    });
    (0, vitest_1.it)('should return minutes and seconds for medium uptime', () => {
      vitest_1.vi.useFakeTimers();
      const now = Date.now();
      vitest_1.vi.setSystemTime(now);
      const freshManager = new DebugPanelManager_1.DebugPanelManager();
      vitest_1.vi.advanceTimersByTime(185000); // 3 minutes 5 seconds
      const uptime = freshManager.getUptime();
      (0, vitest_1.expect)(uptime).toBe('3m 5s');
    });
    (0, vitest_1.it)('should return hours and minutes for long uptime', () => {
      vitest_1.vi.useFakeTimers();
      const now = Date.now();
      vitest_1.vi.setSystemTime(now);
      const freshManager = new DebugPanelManager_1.DebugPanelManager();
      vitest_1.vi.advanceTimersByTime(7500000); // 2 hours 5 minutes
      const uptime = freshManager.getUptime();
      (0, vitest_1.expect)(uptime).toBe('2h 5m');
    });
  });
  (0, vitest_1.describe)('setCallbacks', () => {
    (0, vitest_1.it)('should store callbacks for external integration', () => {
      const callbacks = {
        getSystemStatus: vitest_1.vi.fn().mockReturnValue({
          ready: true,
          state: null,
          pendingOperations: { deletions: [], creations: 0 },
        }),
        forceSynchronization: vitest_1.vi.fn(),
        requestLatestState: vitest_1.vi.fn(),
      };
      manager.setCallbacks(callbacks);
      manager.toggle(); // Enable debug mode
      const state = createMockTerminalState();
      manager.updateDisplay(state);
      (0, vitest_1.expect)(callbacks.getSystemStatus).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('updatePerformanceCounters', () => {
    (0, vitest_1.it)('should update DOM elements if they exist', () => {
      const mockElements = {
        'debug-state-updates': { textContent: '' },
        'debug-last-sync': { textContent: '' },
        'debug-uptime': { textContent: '' },
      };
      // @ts-expect-error - test mock type
      mockDocument.getElementById.mockImplementation((id) => mockElements[id] || null);
      manager.incrementStateUpdates();
      manager.updatePerformanceCounters();
      (0, vitest_1.expect)(mockElements['debug-state-updates'].textContent).toBe('1');
    });
    (0, vitest_1.it)('should handle missing DOM elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);
      (0, vitest_1.expect)(() => manager.updatePerformanceCounters()).not.toThrow();
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should remove the panel', () => {
      const mockPanel = {
        remove: vitest_1.vi.fn(),
      };
      mockDocument.getElementById.mockReturnValue(mockPanel);
      manager.toggle(); // Enable
      manager.dispose();
      (0, vitest_1.expect)(mockPanel.remove).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should set debug mode to inactive', () => {
      manager.toggle(); // Enable
      (0, vitest_1.expect)(manager.isActive()).toBe(true);
      manager.dispose();
      (0, vitest_1.expect)(manager.isActive()).toBe(false);
    });
  });
  (0, vitest_1.describe)('Panel Display', () => {
    (0, vitest_1.it)('should create panel with correct ID', () => {
      manager.toggle();
      const state = createMockTerminalState();
      manager.updateDisplay(state);
      (0, vitest_1.expect)(mockDocument.getElementById).toHaveBeenCalledWith('terminal-debug-info');
    });
    (0, vitest_1.it)('should use existing panel if already created', () => {
      const existingPanel = {
        innerHTML: '',
        id: 'terminal-debug-info',
        style: { cssText: '' },
      };
      mockDocument.getElementById.mockReturnValue(existingPanel);
      manager.toggle();
      const state = createMockTerminalState();
      manager.updateDisplay(state);
      // Should not create a new div since one already exists
      (0, vitest_1.expect)(mockDocument.createElement).not.toHaveBeenCalledWith('div');
    });
  });
  (0, vitest_1.describe)('Edge Cases', () => {
    (0, vitest_1.it)('should handle empty terminal list', () => {
      manager.toggle();
      const state = createMockTerminalState({
        terminals: [],
        availableSlots: [1, 2, 3, 4, 5],
        activeTerminalId: null,
      });
      (0, vitest_1.expect)(() => manager.updateDisplay(state)).not.toThrow();
    });
    (0, vitest_1.it)('should handle full terminal slots', () => {
      manager.toggle();
      const state = createMockTerminalState({
        terminals: [
          // @ts-expect-error - test mock type
          { id: 'terminal-1', isActive: true, number: 1 },
          // @ts-expect-error - test mock type
          { id: 'terminal-2', isActive: false, number: 2 },
          // @ts-expect-error - test mock type
          { id: 'terminal-3', isActive: false, number: 3 },
          // @ts-expect-error - test mock type
          { id: 'terminal-4', isActive: false, number: 4 },
          // @ts-expect-error - test mock type
          { id: 'terminal-5', isActive: false, number: 5 },
        ],
        availableSlots: [],
        maxTerminals: 5,
      });
      (0, vitest_1.expect)(() => manager.updateDisplay(state)).not.toThrow();
    });
    (0, vitest_1.it)('should handle unknown maxTerminals in diagnostics', () => {
      const systemStatus = {
        ready: true,
        state: null,
        pendingOperations: { deletions: [], creations: 0 },
      };
      const diagnostics = manager.exportDiagnostics(systemStatus, 'unknown');
      (0, vitest_1.expect)(diagnostics.configuration.maxTerminals).toBe('unknown');
    });
  });
});
//# sourceMappingURL=DebugPanelManager.test.js.map
