'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const LightweightTerminalInitializationCoordinator_1 = require('../../../../../webview/coordinators/LightweightTerminalInitializationCoordinator');
vitest_1.vi.mock('../../../../../webview/components/SettingsPanel', () => ({
  SettingsPanel: class {
    constructor(options) {
      this.options = options;
      this.show = vitest_1.vi.fn();
      this.setVersionInfo = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/NotificationManager', () => ({
  NotificationManager: class {
    constructor() {
      this.showWarning = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/PerformanceManager', () => ({
  PerformanceManager: class {
    constructor() {
      this.initializePerformance = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/UIManager', () => ({
  UIManager: class {
    constructor() {
      this.setActiveBorderMode = vitest_1.vi.fn();
      this.setTabThemeUpdater = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/TerminalTabManager', () => ({
  TerminalTabManager: class {
    constructor() {
      this.setCoordinator = vitest_1.vi.fn();
      this.initialize = vitest_1.vi.fn();
      this.updateTheme = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/InputManager', () => ({
  InputManager: class {
    constructor(coordinator) {
      this.coordinator = coordinator;
      this.initialize = vitest_1.vi.fn();
      this.setupAltKeyVisualFeedback = vitest_1.vi.fn();
      this.setupIMEHandling = vitest_1.vi.fn();
      this.setupKeyboardShortcuts = vitest_1.vi.fn();
      this.setAgentInteractionMode = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/ConfigManager', () => ({
  ConfigManager: class {
    constructor() {
      this.setFontSettingsService = vitest_1.vi.fn();
      this.applySettings = vitest_1.vi.fn();
      this.getCurrentSettings = vitest_1.vi.fn().mockReturnValue({});
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/services/WebViewPersistenceService', () => ({
  WebViewPersistenceService: class {
    constructor() {
      this.saveSession = vitest_1.vi.fn().mockResolvedValue(true);
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/ConsolidatedMessageManager', () => ({
  ConsolidatedMessageManager: class {
    constructor() {
      this.setCoordinator = vitest_1.vi.fn();
      this.receiveMessage = vitest_1.vi.fn().mockResolvedValue(undefined);
      this.postMessage = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../webview/managers/TerminalStateDisplayManager', () => ({
  TerminalStateDisplayManager: class {},
}));
vitest_1.vi.mock('../../../../../webview/managers/SessionRestoreManager', () => ({
  SessionRestoreManager: class {},
}));
vitest_1.vi.mock('../../../../../webview/managers/TerminalSettingsManager', () => ({
  TerminalSettingsManager: class {},
}));
function createCoordinator() {
  const managerCoordinator = {
    ensureTerminalFocus: vitest_1.vi.fn(),
    postMessageToExtension: vitest_1.vi.fn(),
  };
  const deps = {
    managerCoordinator,
    getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ activeBorderMode: 'multipleOnly' }),
    setCurrentSettings: vitest_1.vi.fn(),
    applySettings: vitest_1.vi.fn(),
    saveSettings: vitest_1.vi.fn(),
    ensureTerminalFocus: vitest_1.vi.fn(),
    getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
    getAllTerminalContainers: vitest_1.vi.fn().mockReturnValue(new Map()),
    getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
    getTerminalInstance: vitest_1.vi.fn(),
    createTerminal: vitest_1.vi.fn(),
    getSystemStatus: vitest_1.vi.fn().mockReturnValue({ ready: true }),
    forceSynchronization: vitest_1.vi.fn(),
    requestLatestState: vitest_1.vi.fn(),
    postMessageToExtension: vitest_1.vi.fn(),
    terminalLifecycleManager: {
      getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
      getAllTerminalContainers: vitest_1.vi.fn().mockReturnValue(new Map()),
    },
    splitManager: {},
    findInTerminalManager: { setCoordinator: vitest_1.vi.fn() },
    profileManager: {
      setCoordinator: vitest_1.vi.fn(),
      initialize: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
    shellIntegrationManager: { setCoordinator: vitest_1.vi.fn() },
    displayModeManager: { initialize: vitest_1.vi.fn() },
    terminalContainerManager: { initialize: vitest_1.vi.fn() },
    debugPanelManager: { setCallbacks: vitest_1.vi.fn() },
    fontSettingsService: { setApplicator: vitest_1.vi.fn() },
    eventHandlerManager: {
      setMessageEventHandler: vitest_1.vi.fn(),
      onPageUnload: vitest_1.vi.fn(),
    },
    scheduleTimeout: vitest_1.vi.fn().mockReturnValue(42),
    settingsVersionInfo: vitest_1.vi.fn().mockReturnValue('v0.1.0'),
    disposeManager: vitest_1.vi.fn(),
  };
  return {
    coordinator:
      new LightweightTerminalInitializationCoordinator_1.LightweightTerminalInitializationCoordinator(
        deps
      ),
    deps,
  };
}
(0, vitest_1.describe)('LightweightTerminalInitializationCoordinator', () => {
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.restoreAllMocks();
    vitest_1.vi.stubGlobal('document', {
      addEventListener: vitest_1.vi.fn(),
    });
    vitest_1.vi.stubGlobal('window', {
      addEventListener: vitest_1.vi.fn(),
    });
  });
  (0, vitest_1.it)('initializes and wires the existing managers bundle', () => {
    const { coordinator, deps } = createCoordinator();
    const initialized = coordinator.initializeExistingManagers();
    (0, vitest_1.expect)(initialized.settingsPanel).toBeDefined();
    (0, vitest_1.expect)(initialized.notificationManager).toBeDefined();
    (0, vitest_1.expect)(initialized.performanceManager.initializePerformance).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(initialized.uiManager.setActiveBorderMode).toHaveBeenCalledWith(
      'multipleOnly'
    );
    (0, vitest_1.expect)(deps.fontSettingsService.setApplicator).toHaveBeenCalledWith(
      initialized.uiManager
    );
    (0, vitest_1.expect)(initialized.terminalTabManager.setCoordinator).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(initialized.inputManager.initialize).toHaveBeenCalled();
    (0, vitest_1.expect)(initialized.configManager.setFontSettingsService).toHaveBeenCalledWith(
      deps.fontSettingsService
    );
    (0, vitest_1.expect)(initialized.messageManager.setCoordinator).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(deps.findInTerminalManager.setCoordinator).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(deps.profileManager.setCoordinator).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(deps.shellIntegrationManager.setCoordinator).toHaveBeenCalledWith(
      deps.managerCoordinator
    );
    (0, vitest_1.expect)(deps.scheduleTimeout).toHaveBeenCalledWith(
      vitest_1.expect.any(Function),
      100
    );
    (0, vitest_1.expect)(initialized.profileManagerInitTimer).toBe(42);
    (0, vitest_1.expect)(initialized.terminalTabManager.initialize).toHaveBeenCalled();
    (0, vitest_1.expect)(deps.displayModeManager.initialize).toHaveBeenCalled();
    (0, vitest_1.expect)(deps.terminalContainerManager.initialize).toHaveBeenCalled();
    (0, vitest_1.expect)(deps.debugPanelManager.setCallbacks).toHaveBeenCalled();
  });
  (0, vitest_1.it)('applies the full input manager setup sequence', () => {
    const { coordinator } = createCoordinator();
    const inputManager = {
      setupAltKeyVisualFeedback: vitest_1.vi.fn(),
      setupIMEHandling: vitest_1.vi.fn(),
      setupKeyboardShortcuts: vitest_1.vi.fn(),
      setAgentInteractionMode: vitest_1.vi.fn(),
    };
    coordinator.setupInputManager(inputManager);
    (0, vitest_1.expect)(inputManager.setupAltKeyVisualFeedback).toHaveBeenCalled();
    (0, vitest_1.expect)(inputManager.setupIMEHandling).toHaveBeenCalled();
    (0, vitest_1.expect)(inputManager.setupKeyboardShortcuts).toHaveBeenCalled();
    (0, vitest_1.expect)(inputManager.setAgentInteractionMode).toHaveBeenCalledWith(false);
  });
  (0, vitest_1.it)('registers message, window, and unload event handlers', async () => {
    const { coordinator, deps } = createCoordinator();
    const messageManager = {
      receiveMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
    const handlers = coordinator.setupEventHandlers(messageManager);
    (0, vitest_1.expect)(deps.eventHandlerManager.setMessageEventHandler).toHaveBeenCalledWith(
      vitest_1.expect.any(Function)
    );
    (0, vitest_1.expect)(document.addEventListener).toHaveBeenCalledWith(
      'settings-open-requested',
      vitest_1.expect.any(Function)
    );
    (0, vitest_1.expect)(window.addEventListener).toHaveBeenCalledWith(
      'focus',
      handlers.onWindowFocus
    );
    (0, vitest_1.expect)(window.addEventListener).toHaveBeenCalledWith(
      'blur',
      handlers.onWindowBlur
    );
    (0, vitest_1.expect)(deps.eventHandlerManager.onPageUnload).toHaveBeenCalledWith(
      vitest_1.expect.any(Function)
    );
    // @ts-expect-error - test mock type
    const messageHandler = vitest_1.vi.mocked(deps.eventHandlerManager.setMessageEventHandler).mock
      .calls[0][0];
    await messageHandler({
      type: 'message',
      data: { command: 'ping' },
    });
    (0, vitest_1.expect)(messageManager.receiveMessage).toHaveBeenCalledWith(
      { command: 'ping' },
      deps.managerCoordinator
    );
    handlers.onWindowFocus();
    handlers.onWindowBlur();
    (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ command: 'terminalFocused', terminalId: 'terminal-1' })
    );
    (0, vitest_1.expect)(deps.postMessageToExtension).toHaveBeenCalledWith(
      vitest_1.expect.objectContaining({ command: 'terminalBlurred', terminalId: 'terminal-1' })
    );
  });
});
//# sourceMappingURL=LightweightTerminalInitializationCoordinator.test.js.map
