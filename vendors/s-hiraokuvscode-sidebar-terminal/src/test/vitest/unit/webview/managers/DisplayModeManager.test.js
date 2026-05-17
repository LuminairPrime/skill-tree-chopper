'use strict';
/**
 * DisplayModeManager Tests
 * Issue #198: Fullscreen terminal display when clicking tabs
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const DisplayModeManager_1 = require('../../../../../webview/managers/DisplayModeManager');
const DOMUtils_1 = require('../../../../../webview/utils/DOMUtils');
// Mock DOMUtils
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
  DOMUtils: {
    resetXtermInlineStyles: vitest_1.vi.fn(),
    forceReflow: vitest_1.vi.fn(),
    clearContainerHeightStyles: vitest_1.vi.fn(),
  },
}));
(0, vitest_1.describe)('DisplayModeManager - Fullscreen Display (Issue #198)', () => {
  let displayManager;
  let mockCoordinator;
  let mockSplitManager;
  let mockContainerManager;
  (0, vitest_1.beforeEach)(() => {
    // Set up DOM environment
    const terminalBody = document.createElement('div');
    terminalBody.id = 'terminal-body';
    document.body.appendChild(terminalBody);
    const terminalsWrapper = document.createElement('div');
    terminalsWrapper.id = 'terminals-wrapper';
    terminalBody.appendChild(terminalsWrapper);
    const container1 = document.createElement('div');
    container1.id = 'terminal-container-1';
    container1.className = 'terminal-container';
    terminalBody.appendChild(container1);
    const container2 = document.createElement('div');
    container2.id = 'terminal-container-2';
    container2.className = 'terminal-container';
    terminalBody.appendChild(container2);
    const container3 = document.createElement('div');
    container3.id = 'terminal-container-3';
    container3.className = 'terminal-container';
    terminalBody.appendChild(container3);
    // Create mock container manager
    mockContainerManager = {
      getContainerOrder: vitest_1.vi.fn().mockReturnValue(['1', '2', '3']),
      applyDisplayState: vitest_1.vi.fn(),
      getDisplaySnapshot: vitest_1.vi.fn().mockReturnValue({
        mode: 'normal',
        visibleTerminals: ['1', '2', '3'],
        activeTerminalId: null,
        registeredContainers: 3,
        registeredWrappers: 0,
      }),
      getAllContainers: vitest_1.vi.fn().mockReturnValue(
        new Map([
          ['1', document.getElementById('terminal-container-1')],
          ['2', document.getElementById('terminal-container-2')],
          ['3', document.getElementById('terminal-container-3')],
        ])
      ),
      clearSplitArtifacts: vitest_1.vi.fn(),
    };
    // Create mock split manager
    let isSplitMode = false;
    mockSplitManager = {
      get isSplitMode() {
        return isSplitMode;
      },
      set isSplitMode(value) {
        isSplitMode = value;
      },
      // @ts-expect-error - test mock type
      getIsSplitMode: vitest_1.vi.fn(() => isSplitMode),
      exitSplitMode: vitest_1.vi.fn(() => {
        isSplitMode = false;
      }),
      getOptimalSplitDirection: vitest_1.vi.fn().mockReturnValue('vertical'),
      prepareSplitMode: vitest_1.vi.fn(() => {
        isSplitMode = true;
      }),
      redistributeSplitTerminals: vitest_1.vi.fn(),
      getLayoutMode: vitest_1.vi.fn().mockReturnValue('single-row'),
      getCurrentPanelLocation: vitest_1.vi.fn().mockReturnValue('sidebar'),
      getSplitTerminals: vitest_1.vi.fn().mockReturnValue(new Map()),
    };
    // Create mock coordinator
    mockCoordinator = {
      getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue(mockContainerManager),
      getManagers: vitest_1.vi.fn().mockReturnValue({
        header: {},
        tabs: {
          updateModeIndicator: vitest_1.vi.fn(),
        },
      }),
      refitAllTerminals: vitest_1.vi.fn(),
      splitManager: mockSplitManager,
    };
    // Create DisplayModeManager instance with constructor injection (Issue #216)
    displayManager = new DisplayModeManager_1.DisplayModeManager(mockCoordinator);
    displayManager.initialize();
  });
  (0, vitest_1.afterEach)(() => {
    displayManager.dispose();
    document.body.innerHTML = '';
  });
  (0, vitest_1.describe)('Initialization', () => {
    (0, vitest_1.it)('should initialize in normal mode', () => {
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('normal');
    });
    (0, vitest_1.it)('should have no fullscreen terminal initially', () => {
      const debugInfo = displayManager.getDebugInfo();
      (0, vitest_1.expect)(debugInfo.fullscreenTerminalId).toBeNull();
    });
  });
  (0, vitest_1.describe)('Fullscreen Mode', () => {
    (0, vitest_1.it)(
      'should switch to fullscreen mode when showTerminalFullscreen is called',
      () => {
        // Act
        displayManager.showTerminalFullscreen('1');
        // Assert
        (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('fullscreen');
        (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({
            mode: 'fullscreen',
            activeTerminalId: '1',
          })
        );
      }
    );
    (0, vitest_1.it)('should exit split mode before entering fullscreen', () => {
      // Arrange - simulate split mode
      mockSplitManager.isSplitMode = true;
      // Act
      displayManager.showTerminalFullscreen('1');
      // Assert
      (0, vitest_1.expect)(mockSplitManager.exitSplitMode).toHaveBeenCalled();
      (0, vitest_1.expect)(mockSplitManager.isSplitMode).toBe(false);
    });
    (0, vitest_1.it)('should clear split artifacts when entering fullscreen', () => {
      // Arrange - simulate split mode
      mockSplitManager.isSplitMode = true;
      // Act
      displayManager.showTerminalFullscreen('1');
      // Assert
      (0, vitest_1.expect)(mockContainerManager.clearSplitArtifacts).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should update visibility from container manager snapshot', () => {
      // Arrange
      mockContainerManager.getDisplaySnapshot.mockReturnValue({
        mode: 'fullscreen',
        visibleTerminals: ['1'],
        activeTerminalId: '1',
        registeredContainers: 3,
        registeredWrappers: 0,
      });
      // Act
      displayManager.showTerminalFullscreen('1');
      // Assert
      (0, vitest_1.expect)(displayManager.isTerminalVisible('1')).toBe(true);
      (0, vitest_1.expect)(displayManager.isTerminalVisible('2')).toBe(false);
      (0, vitest_1.expect)(displayManager.isTerminalVisible('3')).toBe(false);
    });
    (0, vitest_1.it)('should notify mode change to tab manager', () => {
      // Arrange
      const mockTabs = mockCoordinator.getManagers().tabs;
      // Act
      displayManager.showTerminalFullscreen('1');
      // Assert
      if (mockTabs) {
        (0, vitest_1.expect)(mockTabs.updateModeIndicator).toHaveBeenCalledWith('fullscreen');
      }
    });
  });
  (0, vitest_1.describe)('Split Mode Toggle', () => {
    (0, vitest_1.it)('should toggle from normal to split mode', () => {
      // Arrange - start in normal mode
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('normal');
      // Act
      displayManager.toggleSplitMode();
      // Assert
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('split');
      (0, vitest_1.expect)(mockSplitManager.prepareSplitMode).toHaveBeenCalledWith('vertical');
    });
    (0, vitest_1.it)('should toggle from split to normal mode', () => {
      // Arrange - enter split mode first
      displayManager.toggleSplitMode();
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('split');
      // Act - toggle back
      displayManager.toggleSplitMode();
      // Assert
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('normal');
      (0, vitest_1.expect)(mockSplitManager.exitSplitMode).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should show all terminals in split mode', () => {
      // Act
      displayManager.showAllTerminalsSplit();
      // Assert
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('split');
      (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          mode: 'split',
          splitDirection: 'vertical',
        })
      );
    });
  });
  (0, vitest_1.describe)('Mode Transitions', () => {
    (0, vitest_1.it)('should track previous mode when switching', () => {
      // Arrange
      displayManager.setDisplayMode('fullscreen');
      // Act
      displayManager.setDisplayMode('split');
      // Assert
      const debugInfo = displayManager.getDebugInfo();
      (0, vitest_1.expect)(debugInfo.previousMode).toBe('fullscreen');
    });
    (0, vitest_1.it)('should handle fullscreen -> split transition', () => {
      // Arrange
      displayManager.showTerminalFullscreen('1');
      // Act
      displayManager.toggleSplitMode();
      // Assert
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('split');
    });
    (0, vitest_1.it)(
      'should clear container height styles when entering horizontal split from fullscreen',
      () => {
        // Arrange - enter fullscreen to apply fullscreen height styles
        displayManager.showTerminalFullscreen('1');
        DOMUtils_1.DOMUtils.clearContainerHeightStyles.mockClear();
        // Set split direction to horizontal (where clearContainerHeightStyles is called)
        mockSplitManager.getOptimalSplitDirection.mockReturnValue('horizontal');
        const containers = Array.from(mockContainerManager.getAllContainers().values());
        // Act - switch to split mode
        displayManager.showAllTerminalsSplit();
        // Assert - clear height styles for all containers in horizontal split
        containers.forEach((container) => {
          (0, vitest_1.expect)(DOMUtils_1.DOMUtils.clearContainerHeightStyles).toHaveBeenCalledWith(
            container
          );
        });
      }
    );
    (0, vitest_1.it)('should skip vertical redistribution when grid class is active on DOM', () => {
      vitest_1.vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 1;
      });
      const terminalsWrapper = document.getElementById('terminals-wrapper');
      terminalsWrapper.classList.add('terminal-grid-layout');
      Object.defineProperty(terminalsWrapper, 'clientHeight', {
        configurable: true,
        get: () => 500,
      });
      mockSplitManager.getOptimalSplitDirection.mockReturnValue('vertical');
      mockSplitManager.getLayoutMode.mockReturnValue('single-row');
      displayManager.showAllTerminalsSplit();
      (0, vitest_1.expect)(mockSplitManager.redistributeSplitTerminals).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)(
      'should schedule multiple refits in grid mode to avoid header-only rendering',
      () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
          cb(0);
          return 1;
        });
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        terminalsWrapper.classList.add('terminal-grid-layout');
        mockSplitManager.getOptimalSplitDirection.mockReturnValue('vertical');
        displayManager.showAllTerminalsSplit();
        vitest_1.vi.runAllTimers();
        (0, vitest_1.expect)(mockCoordinator.refitAllTerminals).toHaveBeenCalledTimes(3);
        vitest_1.vi.useRealTimers();
      }
    );
    (0, vitest_1.it)('should handle split -> fullscreen transition', () => {
      // Arrange
      displayManager.toggleSplitMode(); // Enter split mode
      // Act
      displayManager.showTerminalFullscreen('2');
      // Assert
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('fullscreen');
      (0, vitest_1.expect)(mockSplitManager.exitSplitMode).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Terminal Visibility', () => {
    (0, vitest_1.it)('should hide all terminals except specified one', () => {
      // Act
      displayManager.hideAllTerminalsExcept('2');
      // Assert
      (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          mode: 'fullscreen',
          activeTerminalId: '2',
        })
      );
    });
    (0, vitest_1.it)('should show all terminals', () => {
      // Act
      displayManager.showAllTerminals();
      // Assert
      (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          mode: 'normal',
          activeTerminalId: null,
        })
      );
    });
    (0, vitest_1.it)('should check terminal visibility correctly', () => {
      // Arrange
      mockContainerManager.getDisplaySnapshot.mockReturnValue({
        mode: 'fullscreen',
        visibleTerminals: ['1'],
        activeTerminalId: '1',
        registeredContainers: 3,
        registeredWrappers: 0,
      });
      // Act
      displayManager.showTerminalFullscreen('1');
      // Assert
      (0, vitest_1.expect)(displayManager.isTerminalVisible('1')).toBe(true);
      (0, vitest_1.expect)(displayManager.isTerminalVisible('2')).toBe(false);
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle missing container manager gracefully', () => {
      // Arrange
      mockCoordinator.getTerminalContainerManager.mockReturnValue(undefined);
      // Act & Assert - should not throw
      (0, vitest_1.expect)(() => {
        displayManager.showTerminalFullscreen('1');
      }).not.toThrow();
    });
    (0, vitest_1.it)('should handle missing split manager gracefully', () => {
      // Arrange
      mockCoordinator.splitManager = null;
      // Act & Assert - should not throw
      (0, vitest_1.expect)(() => {
        displayManager.showAllTerminalsSplit();
      }).not.toThrow();
    });
    (0, vitest_1.it)('should handle missing header manager gracefully', () => {
      // Arrange
      mockCoordinator.getManagers.mockReturnValue({
        header: undefined,
        tabs: undefined,
      });
      // Act & Assert - should not throw
      (0, vitest_1.expect)(() => {
        displayManager.showTerminalFullscreen('1');
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Cleanup', () => {
    (0, vitest_1.it)('should call showAllTerminals on dispose', () => {
      // Arrange
      displayManager.showTerminalFullscreen('1');
      (0, vitest_1.expect)(displayManager.getCurrentMode()).toBe('fullscreen');
      // Act - store call count before dispose
      const callCountBefore = mockContainerManager.applyDisplayState.mock.calls.length;
      displayManager.dispose();
      // Assert - dispose should call applyDisplayState to reset mode
      (0, vitest_1.expect)(
        mockContainerManager.applyDisplayState.mock.calls.length
      ).toBeGreaterThan(callCountBefore);
    });
    (0, vitest_1.it)('should clear all visibility tracking on dispose', () => {
      // Arrange
      displayManager.showTerminalFullscreen('1');
      // Act
      displayManager.dispose();
      // Assert
      const debugInfo = displayManager.getDebugInfo();
      (0, vitest_1.expect)(debugInfo.visibleTerminals).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('Debug Information', () => {
    (0, vitest_1.it)('should provide accurate debug info', () => {
      // Arrange
      displayManager.showTerminalFullscreen('2');
      // Act
      const debugInfo = displayManager.getDebugInfo();
      // Assert
      (0, vitest_1.expect)(debugInfo.currentMode).toBe('fullscreen');
      (0, vitest_1.expect)(debugInfo.fullscreenTerminalId).toBe('2');
      (0, vitest_1.expect)(debugInfo.previousMode).toBe('normal');
    });
  });
});
//# sourceMappingURL=DisplayModeManager.test.js.map
