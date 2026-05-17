'use strict';
/**
 * ResizeCoordinator Unit Tests
 *
 * Tests for terminal resize coordination including:
 * - Initialization and ResizeObserver setup
 * - Window and body resize handling
 * - Terminal refit operations
 * - Panel location change handling
 * - Resource disposal
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const ResizeCoordinator_1 = require('../../../../../webview/coordinators/ResizeCoordinator');
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  webview: vitest_1.vi.fn(),
}));
// Mock DOMUtils
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
  DOMUtils: {
    resetXtermInlineStyles: vitest_1.vi.fn(),
    forceReflow: vitest_1.vi.fn(),
    clearContainerHeightStyles: vitest_1.vi.fn(),
  },
}));
// Mock Debouncer
vitest_1.vi.mock('../../../../../webview/utils/DebouncedEventBuffer', () => ({
  Debouncer: class MockDebouncer {
    constructor(callback, _options) {
      this.callback = callback;
    }
    trigger() {
      // Execute callback immediately for testing
      this.callback();
    }
    dispose() {}
  },
}));
(0, vitest_1.describe)('ResizeCoordinator', () => {
  let coordinator;
  let mockDeps;
  let mockTerminals;
  let resizeObserverCallback = null;
  // Mock ResizeObserver - must be a class
  class MockResizeObserver {
    constructor(callback) {
      this.observe = vitest_1.vi.fn();
      this.unobserve = vitest_1.vi.fn();
      this.disconnect = vitest_1.vi.fn();
      resizeObserverCallback = callback;
    }
  }
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    // Setup ResizeObserver mock
    vitest_1.vi.stubGlobal('ResizeObserver', MockResizeObserver);
    // Setup mock terminals
    mockTerminals = new Map();
    // Create mock dependencies
    mockDeps = {
      getTerminals: vitest_1.vi.fn(() => mockTerminals),
      notifyResize: vitest_1.vi.fn(),
    };
    // Setup DOM elements
    const terminalBody = document.createElement('div');
    terminalBody.id = 'terminal-body';
    document.body.appendChild(terminalBody);
    const terminalsWrapper = document.createElement('div');
    terminalsWrapper.id = 'terminals-wrapper';
    document.body.appendChild(terminalsWrapper);
    coordinator = new ResizeCoordinator_1.ResizeCoordinator(mockDeps);
  });
  (0, vitest_1.afterEach)(() => {
    coordinator.dispose();
    vitest_1.vi.useRealTimers();
    vitest_1.vi.clearAllMocks();
    vitest_1.vi.unstubAllGlobals();
    document.body.innerHTML = '';
    resizeObserverCallback = null;
  });
  (0, vitest_1.describe)('constructor', () => {
    (0, vitest_1.it)('should create a new instance', () => {
      (0, vitest_1.expect)(coordinator).toBeDefined();
    });
  });
  (0, vitest_1.describe)('initialize', () => {
    (0, vitest_1.it)('should set up resize listeners', () => {
      const addEventListenerSpy = vitest_1.vi.spyOn(window, 'addEventListener');
      coordinator.initialize();
      (0, vitest_1.expect)(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        vitest_1.expect.any(Function)
      );
    });
    (0, vitest_1.it)('should not reinitialize if already initialized', () => {
      const addEventListenerSpy = vitest_1.vi.spyOn(window, 'addEventListener');
      coordinator.initialize();
      coordinator.initialize();
      // Should only be called once for window resize
      const resizeCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize');
      (0, vitest_1.expect)(resizeCalls.length).toBe(1);
    });
  });
  (0, vitest_1.describe)('setupParentContainerResizeObserver', () => {
    (0, vitest_1.it)('should set up ResizeObserver on terminal-body', () => {
      coordinator.setupParentContainerResizeObserver();
      // Verify ResizeObserver was created and is observing
      (0, vitest_1.expect)(resizeObserverCallback).not.toBeNull();
    });
    (0, vitest_1.it)('should handle missing terminal-body gracefully', () => {
      // Remove terminal-body
      const terminalBody = document.getElementById('terminal-body');
      terminalBody?.remove();
      (0, vitest_1.expect)(() => coordinator.setupParentContainerResizeObserver()).not.toThrow();
    });
    (0, vitest_1.it)('should trigger refit when resize is detected', () => {
      coordinator.setupParentContainerResizeObserver();
      // Add a mock terminal
      const mockFit = vitest_1.vi.fn();
      const mockContainer = document.createElement('div');
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer,
      });
      // Trigger resize observer
      if (resizeObserverCallback) {
        resizeObserverCallback(
          // @ts-expect-error - test mock type
          [{ contentRect: { width: 800, height: 600 }, target: document.body }],
          {}
        );
      }
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(100);
      // Verify refit was called
      (0, vitest_1.expect)(mockFit).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('refitAllTerminals', () => {
    (0, vitest_1.it)('should call fit on all terminals with fitAddon', () => {
      const mockFit1 = vitest_1.vi.fn();
      const mockFit2 = vitest_1.vi.fn();
      const mockContainer1 = document.createElement('div');
      const mockContainer2 = document.createElement('div');
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit1, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer1,
      });
      mockTerminals.set('terminal-2', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit2, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer2,
      });
      coordinator.refitAllTerminals();
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(100);
      (0, vitest_1.expect)(mockFit1).toHaveBeenCalled();
      (0, vitest_1.expect)(mockFit2).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should notify PTY about resize when notifyResize is provided', () => {
      const mockFit = vitest_1.vi.fn();
      const mockContainer = document.createElement('div');
      mockTerminals.set('terminal-1', {
        terminal: { cols: 120, rows: 40 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer,
      });
      coordinator.refitAllTerminals();
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(100);
      (0, vitest_1.expect)(mockDeps.notifyResize).toHaveBeenCalledWith('terminal-1', 120, 40);
    });
    (0, vitest_1.it)('should skip terminals without fitAddon', () => {
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: null,
        container: document.createElement('div'),
      });
      (0, vitest_1.expect)(() => coordinator.refitAllTerminals()).not.toThrow();
    });
    (0, vitest_1.it)('should skip terminals without container', () => {
      const mockFit = vitest_1.vi.fn();
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: null,
      });
      coordinator.refitAllTerminals();
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(100);
      (0, vitest_1.expect)(mockFit).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle errors gracefully', () => {
      const mockFit = vitest_1.vi.fn().mockImplementation(() => {
        throw new Error('Fit failed');
      });
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: document.createElement('div'),
      });
      (0, vitest_1.expect)(() => {
        coordinator.refitAllTerminals();
        vitest_1.vi.advanceTimersByTime(100);
      }).not.toThrow();
    });
    (0, vitest_1.it)(
      'should notify PTY with dimensions AFTER double-fit completes (Issue #368)',
      () => {
        // This test verifies that PTY resize notification happens AFTER
        // the second fit() call, ensuring TUI applications receive correct dimensions
        const fitCallOrder = [];
        let terminalDimensions = { cols: 80, rows: 24 };
        const mockFit = vitest_1.vi.fn().mockImplementation(() => {
          fitCallOrder.push('fit');
          // Simulate fit() updating terminal dimensions on second call
          if (fitCallOrder.filter((c) => c === 'fit').length >= 2) {
            terminalDimensions = { cols: 100, rows: 30 };
          }
        });
        const mockContainer = document.createElement('div');
        // Mock terminal that updates dimensions after fit
        const mockTerminal = {
          get cols() {
            return terminalDimensions.cols;
          },
          get rows() {
            return terminalDimensions.rows;
          },
        };
        mockTerminals.set('terminal-1', {
          terminal: mockTerminal,
          fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
          container: mockContainer,
        });
        coordinator.refitAllTerminals();
        // Advance past BOTH requestAnimationFrame calls (first fit + second fit)
        vitest_1.vi.advanceTimersByTime(100);
        // fit() should be called at least twice (double-fit pattern)
        (0, vitest_1.expect)(mockFit).toHaveBeenCalledTimes(2);
        // PTY should be notified with the FINAL dimensions after double-fit
        // This is the critical assertion for Issue #368
        (0, vitest_1.expect)(mockDeps.notifyResize).toHaveBeenCalledWith('terminal-1', 100, 30);
      }
    );
    (0, vitest_1.it)(
      'should refresh terminal after double-fit to avoid stale render on shrink',
      () => {
        const fitCallOrder = [];
        let terminalDimensions = { cols: 80, rows: 24 };
        const mockFit = vitest_1.vi.fn().mockImplementation(() => {
          fitCallOrder.push('fit');
          if (fitCallOrder.filter((c) => c === 'fit').length >= 2) {
            terminalDimensions = { cols: 80, rows: 10 };
          }
        });
        const mockRefresh = vitest_1.vi.fn();
        const mockContainer = document.createElement('div');
        const mockTerminal = {
          get cols() {
            return terminalDimensions.cols;
          },
          get rows() {
            return terminalDimensions.rows;
          },
          refresh: mockRefresh,
        };
        mockTerminals.set('terminal-1', {
          terminal: mockTerminal,
          fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
          container: mockContainer,
        });
        coordinator.refitAllTerminals();
        // Advance past both requestAnimationFrame calls
        vitest_1.vi.advanceTimersByTime(100);
        (0, vitest_1.expect)(mockFit).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(mockRefresh).toHaveBeenCalledWith(0, 9);
      }
    );
    (0, vitest_1.it)(
      'should use deferred PTY notification for split mode timing (Issue #368)',
      () => {
        // When in split mode, CSS layout changes need time to settle
        // PTY notification should be deferred until layout is stable
        const mockFit = vitest_1.vi.fn();
        const mockContainer = document.createElement('div');
        mockTerminals.set('terminal-1', {
          terminal: { cols: 80, rows: 24 },
          fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
          container: mockContainer,
        });
        coordinator.refitAllTerminals();
        // First RAF - initial fit
        vitest_1.vi.advanceTimersByTime(16);
        // PTY should NOT be notified immediately after first fit
        // (This would be the old buggy behavior - Issue #368)
        (0, vitest_1.expect)(mockDeps.notifyResize).not.toHaveBeenCalled();
        // Second RAF - double-fit completes
        vitest_1.vi.advanceTimersByTime(16);
        // Only after both fits complete should PTY be notified
        // Advance more to ensure all callbacks processed
        vitest_1.vi.advanceTimersByTime(100);
        (0, vitest_1.expect)(mockDeps.notifyResize).toHaveBeenCalledTimes(1);
      }
    );
  });
  (0, vitest_1.describe)('setupPanelLocationListener', () => {
    (0, vitest_1.it)('should listen for panel location change events', () => {
      const addEventListenerSpy = vitest_1.vi.spyOn(window, 'addEventListener');
      coordinator.setupPanelLocationListener();
      (0, vitest_1.expect)(addEventListenerSpy).toHaveBeenCalledWith(
        'terminal-panel-location-changed',
        vitest_1.expect.any(Function)
      );
    });
    (0, vitest_1.it)('should trigger refit when panel location changes', () => {
      const mockFit = vitest_1.vi.fn();
      const mockContainer = document.createElement('div');
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer,
      });
      coordinator.setupPanelLocationListener();
      // Dispatch panel location change event
      window.dispatchEvent(new CustomEvent('terminal-panel-location-changed'));
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(100);
      (0, vitest_1.expect)(mockFit).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should disconnect ResizeObservers', () => {
      coordinator.setupParentContainerResizeObserver();
      coordinator.initialize();
      coordinator.dispose();
      // Verify observers are cleaned up
      // (Checking that dispose doesn't throw)
      (0, vitest_1.expect)(() => coordinator.dispose()).not.toThrow();
    });
    (0, vitest_1.it)('should reset initialization state', () => {
      coordinator.initialize();
      coordinator.dispose();
      // Should be able to initialize again after dispose
      const addEventListenerSpy = vitest_1.vi.spyOn(window, 'addEventListener');
      coordinator.initialize();
      const resizeCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'resize');
      (0, vitest_1.expect)(resizeCalls.length).toBe(1);
    });
    (0, vitest_1.it)('Bug #7: should remove window resize listener on dispose', () => {
      const removeEventListenerSpy = vitest_1.vi.spyOn(window, 'removeEventListener');
      coordinator.initialize();
      coordinator.dispose();
      // Should have called removeEventListener for 'resize'
      const resizeRemoveCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'resize'
      );
      (0, vitest_1.expect)(resizeRemoveCalls.length).toBe(1);
    });
  });
  (0, vitest_1.describe)('window resize handling', () => {
    (0, vitest_1.it)('should refit terminals on window resize', () => {
      const mockFit = vitest_1.vi.fn();
      const mockContainer = document.createElement('div');
      mockTerminals.set('terminal-1', {
        terminal: { cols: 80, rows: 24 },
        fitAddon: { fit: mockFit, proposeDimensions: vitest_1.vi.fn() },
        container: mockContainer,
      });
      coordinator.initialize();
      // Trigger window resize
      window.dispatchEvent(new Event('resize'));
      // Advance past requestAnimationFrame
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(mockFit).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('edge cases', () => {
    (0, vitest_1.it)('should handle empty terminal map', () => {
      (0, vitest_1.expect)(() => coordinator.refitAllTerminals()).not.toThrow();
    });
    (0, vitest_1.it)('should handle terminal with missing terminal object', () => {
      mockTerminals.set('terminal-1', {
        terminal: null,
        fitAddon: { fit: vitest_1.vi.fn(), proposeDimensions: vitest_1.vi.fn() },
        container: document.createElement('div'),
      });
      (0, vitest_1.expect)(() => {
        coordinator.refitAllTerminals();
        vitest_1.vi.advanceTimersByTime(100);
      }).not.toThrow();
    });
  });
});
//# sourceMappingURL=ResizeCoordinator.test.js.map
