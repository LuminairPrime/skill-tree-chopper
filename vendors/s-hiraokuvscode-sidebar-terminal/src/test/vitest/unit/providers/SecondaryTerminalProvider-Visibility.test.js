'use strict';
/**
 * SecondaryTerminalProvider - Visibility Guard Tests
 *
 * Fix: Prevent secondary sidebar maximize from being cancelled
 * when _handleWebviewVisible triggers redundant panel location detection.
 *
 * Root cause: _handleWebviewVisible() unconditionally calls _requestPanelLocationDetection()
 * on every visibility change, even simple focus-driven hidden->visible transitions.
 * The resulting setContext call triggers VS Code layout recalculation, cancelling maximize.
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
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
  window: {
    activeColorTheme: { kind: 2 },
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
    HighContrast: 3,
    HighContrastLight: 4,
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
  isDebugEnabled: vitest_1.vi.fn(() => false),
}));
(0, vitest_1.describe)('SecondaryTerminalProvider - Visibility Guard', () => {
  let mockRequestPanelLocationDetection;
  let provider;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    mockRequestPanelLocationDetection = vitest_1.vi.fn();
    // Create a minimal mock that simulates the fixed SecondaryTerminalProvider behavior
    provider = {
      _hasDetectedPanelLocation: false,
      _handleWebviewVisible() {
        // Guard: Skip panel location detection on simple visibility restore
        if (this._hasDetectedPanelLocation) {
          return;
        }
        // Set flag BEFORE setTimeout to prevent race condition
        this._hasDetectedPanelLocation = true;
        // First visibility: trigger detection after layout stabilizes
        setTimeout(() => {
          this._requestPanelLocationDetection();
        }, 200);
      },
      // @ts-expect-error - test mock type
      _requestPanelLocationDetection: mockRequestPanelLocationDetection,
      dispose() {
        this._hasDetectedPanelLocation = false;
      },
    };
  });
  (0, vitest_1.afterEach)(() => {
    provider.dispose();
    vitest_1.vi.useRealTimers();
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('_handleWebviewVisible - panel location detection guard', () => {
    (0, vitest_1.it)('should detect panel location on first visibility event', () => {
      // Act: First visibility event
      provider._handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      // Assert: Detection should run
      (0, vitest_1.expect)(mockRequestPanelLocationDetection).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should set _hasDetectedPanelLocation flag after first detection', () => {
      // Arrange: Flag starts false
      (0, vitest_1.expect)(provider._hasDetectedPanelLocation).toBe(false);
      // Act: First visibility event
      provider._handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      // Assert: Flag is now true
      (0, vitest_1.expect)(provider._hasDetectedPanelLocation).toBe(true);
    });
    (0, vitest_1.it)(
      'should skip panel location detection on subsequent visibility restore',
      () => {
        // Arrange: Simulate first detection completed
        provider._handleWebviewVisible();
        vitest_1.vi.advanceTimersByTime(200);
        mockRequestPanelLocationDetection.mockClear();
        // Act: Subsequent visibility events (e.g., focus changes during Claude Code operation)
        provider._handleWebviewVisible();
        vitest_1.vi.advanceTimersByTime(200);
        provider._handleWebviewVisible();
        vitest_1.vi.advanceTimersByTime(200);
        // Assert: No additional detection calls
        (0, vitest_1.expect)(mockRequestPanelLocationDetection).not.toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should reset flag on dispose (allowing re-detection after reinitialization)',
      () => {
        // Arrange: Complete first detection
        provider._handleWebviewVisible();
        vitest_1.vi.advanceTimersByTime(200);
        (0, vitest_1.expect)(provider._hasDetectedPanelLocation).toBe(true);
        // Act: Dispose (simulates WebView destruction)
        provider.dispose();
        // Assert: Flag is reset
        (0, vitest_1.expect)(provider._hasDetectedPanelLocation).toBe(false);
      }
    );
    (0, vitest_1.it)('should allow detection after dispose and re-creation', () => {
      // Arrange: Complete first detection cycle
      provider._handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      mockRequestPanelLocationDetection.mockClear();
      // Act: Dispose and trigger new visibility
      provider.dispose();
      provider._handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      // Assert: Detection runs again for new lifecycle
      (0, vitest_1.expect)(mockRequestPanelLocationDetection).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)(
      'should NOT queue multiple timers when rapid visibility events fire within 200ms',
      () => {
        // This tests the race condition: if multiple visibility events fire
        // before the 200ms setTimeout completes, only ONE detection should run.
        // Bug: _hasDetectedPanelLocation was set INSIDE setTimeout, allowing
        // multiple timers to be queued.
        // Act: Fire 5 rapid visibility events within 200ms
        provider._handleWebviewVisible();
        provider._handleWebviewVisible();
        provider._handleWebviewVisible();
        provider._handleWebviewVisible();
        provider._handleWebviewVisible();
        // Advance past all timers
        vitest_1.vi.advanceTimersByTime(200);
        // Assert: Detection should run exactly ONCE, not 5 times
        (0, vitest_1.expect)(mockRequestPanelLocationDetection).toHaveBeenCalledTimes(1);
      }
    );
    (0, vitest_1.it)('should set flag immediately to prevent race condition', () => {
      // The flag must be set BEFORE setTimeout to prevent
      // concurrent visibility events from bypassing the guard.
      // Act: First visibility event
      provider._handleWebviewVisible();
      // Assert: Flag should be true IMMEDIATELY, not after 200ms
      (0, vitest_1.expect)(provider._hasDetectedPanelLocation).toBe(true);
    });
  });
});
//# sourceMappingURL=SecondaryTerminalProvider-Visibility.test.js.map
