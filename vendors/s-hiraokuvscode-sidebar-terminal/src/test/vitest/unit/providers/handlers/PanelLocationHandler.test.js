'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * PanelLocationHandler Tests
 */
const vitest_1 = require('vitest');
// Mock vscode
vitest_1.vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue('auto'),
    }),
    onDidChangeConfiguration: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
const vscode = require('vscode');
const PanelLocationHandler_1 = require('../../../../../providers/handlers/PanelLocationHandler');
function createMockDeps() {
  return {
    panelLocationService: {
      handlePanelLocationReport: vitest_1.vi.fn().mockResolvedValue(undefined),
      requestPanelLocationDetection: vitest_1.vi.fn().mockResolvedValue(undefined),
      determineSplitDirection: vitest_1.vi.fn().mockReturnValue('vertical'),
      getCurrentPanelLocation: vitest_1.vi.fn().mockReturnValue('sidebar'),
      getCachedPanelLocation: vitest_1.vi.fn().mockReturnValue('sidebar'),
      initialize: vitest_1.vi.fn().mockResolvedValue(undefined),
      dispose: vitest_1.vi.fn(),
    },
    sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
  };
}
(0, vitest_1.describe)('PanelLocationHandler', () => {
  let handler;
  let deps;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    vitest_1.vi.useFakeTimers();
    deps = createMockDeps();
    handler = new PanelLocationHandler_1.PanelLocationHandler(deps);
    // Default: auto mode
    vscode.workspace.getConfiguration.mockReturnValue({
      get: vitest_1.vi.fn().mockReturnValue('auto'),
    });
  });
  (0, vitest_1.afterEach)(() => {
    handler.dispose();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('handleReportPanelLocation', () => {
    (0, vitest_1.it)('should ignore unsolicited panel location reports', async () => {
      const message = {
        command: 'reportPanelLocation',
        location: 'panel',
      };
      await handler.handleReportPanelLocation(message);
      (0, vitest_1.expect)(
        deps.panelLocationService.handlePanelLocationReport
      ).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should accept solicited panel location reports', async () => {
      // First request detection to set pending state
      handler.requestPanelLocationDetection();
      const message = {
        command: 'reportPanelLocation',
        location: 'panel',
      };
      await handler.handleReportPanelLocation(message);
      (0, vitest_1.expect)(
        deps.panelLocationService.handlePanelLocationReport
      ).toHaveBeenCalledWith('panel');
    });
    (0, vitest_1.it)('should ignore reports with missing location', async () => {
      handler.requestPanelLocationDetection();
      const message = {
        command: 'reportPanelLocation',
      };
      await handler.handleReportPanelLocation(message);
      (0, vitest_1.expect)(
        deps.panelLocationService.handlePanelLocationReport
      ).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should clear pending state after accepting report', async () => {
      handler.requestPanelLocationDetection();
      const message = {
        command: 'reportPanelLocation',
        location: 'sidebar',
      };
      await handler.handleReportPanelLocation(message);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
  });
  (0, vitest_1.describe)('requestPanelLocationDetection', () => {
    (0, vitest_1.it)('should set pending state in auto mode', () => {
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      (0, vitest_1.expect)(
        deps.panelLocationService.requestPanelLocationDetection
      ).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should skip detection in manual mode', () => {
      vscode.workspace.getConfiguration.mockReturnValue({
        get: vitest_1.vi.fn().mockReturnValue('sidebar'),
      });
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
      (0, vitest_1.expect)(
        deps.panelLocationService.requestPanelLocationDetection
      ).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should auto-clear pending state on timeout', () => {
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      // Advance past the 2000ms timeout
      vitest_1.vi.advanceTimersByTime(2000);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
    (0, vitest_1.it)('should reset timeout on subsequent requests', () => {
      handler.requestPanelLocationDetection();
      vitest_1.vi.advanceTimersByTime(1500);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      // Request again, should reset the 2000ms timer
      handler.requestPanelLocationDetection();
      vitest_1.vi.advanceTimersByTime(1500);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      // Advance past the new timeout
      vitest_1.vi.advanceTimersByTime(500);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
  });
  (0, vitest_1.describe)('clearPanelLocationDetectionPending', () => {
    (0, vitest_1.it)('should clear pending flag and timeout', () => {
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      handler.clearPanelLocationDetectionPending('test');
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
    (0, vitest_1.it)('should be a no-op when nothing is pending', () => {
      // Should not throw
      handler.clearPanelLocationDetectionPending('test');
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
  });
  (0, vitest_1.describe)('handleWebviewVisible', () => {
    (0, vitest_1.it)('should request detection on first visibility', () => {
      handler.handleWebviewVisible();
      (0, vitest_1.expect)(handler.hasDetectedPanelLocation).toBe(true);
      // Detection is scheduled after 200ms delay
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      (0, vitest_1.expect)(
        deps.panelLocationService.requestPanelLocationDetection
      ).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should skip detection on subsequent visibility events', () => {
      handler.handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      vitest_1.vi.clearAllMocks();
      handler.handleWebviewVisible();
      vitest_1.vi.advanceTimersByTime(200);
      (0, vitest_1.expect)(
        deps.panelLocationService.requestPanelLocationDetection
      ).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should set flag before timeout to prevent race conditions', () => {
      handler.handleWebviewVisible();
      // Flag is set immediately, not after timeout
      (0, vitest_1.expect)(handler.hasDetectedPanelLocation).toBe(true);
    });
  });
  (0, vitest_1.describe)('setupPanelLocationChangeListener', () => {
    (0, vitest_1.it)('should register a configuration change listener', () => {
      handler.setupPanelLocationChangeListener();
      (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return a disposable', () => {
      const disposable = handler.setupPanelLocationChangeListener();
      (0, vitest_1.expect)(disposable).toBeDefined();
      (0, vitest_1.expect)(typeof disposable.dispose).toBe('function');
    });
  });
  (0, vitest_1.describe)('resetDetectionState', () => {
    (0, vitest_1.it)('should reset hasDetectedPanelLocation flag', () => {
      handler.handleWebviewVisible();
      (0, vitest_1.expect)(handler.hasDetectedPanelLocation).toBe(true);
      handler.resetDetectionState();
      (0, vitest_1.expect)(handler.hasDetectedPanelLocation).toBe(false);
    });
    (0, vitest_1.it)('should clear pending detection state', () => {
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      handler.resetDetectionState();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clear pending state on dispose', () => {
      handler.requestPanelLocationDetection();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(true);
      handler.dispose();
      (0, vitest_1.expect)(handler.isDetectionPending).toBe(false);
    });
    (0, vitest_1.it)('should dispose registered listeners', () => {
      const disposable = handler.setupPanelLocationChangeListener();
      const disposeFn = disposable.dispose;
      handler.dispose();
      (0, vitest_1.expect)(disposeFn).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=PanelLocationHandler.test.js.map
