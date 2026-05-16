"use strict";
/**
 * Terminal Creation Service
 *
 * Extracted from TerminalLifecycleCoordinator to follow Single Responsibility Principle.
 *
 * Responsibilities:
 * - Terminal instance creation with full xterm.js configuration
 * - Terminal removal with proper cleanup
 * - Terminal switching with state management
 * - Link provider registration and management
 * - Resize handling and observer setup
 * - Scrollback auto-save integration
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/split-lifecycle-manager/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalCreationService = void 0;
const xterm_1 = require("@xterm/xterm");
const TerminalAddonManager_1 = require("../managers/TerminalAddonManager");
const TerminalEventManager_1 = require("../managers/TerminalEventManager");
const TerminalLinkManager_1 = require("../managers/TerminalLinkManager");
const ResizeManager_1 = require("../utils/ResizeManager");
const LifecycleController_1 = require("../controllers/LifecycleController");
const PerformanceOptimizer_1 = require("../../utils/PerformanceOptimizer");
const ManagerLogger_1 = require("../utils/ManagerLogger");
// Extracted services
const terminal_1 = require("./terminal");
const TerminalScrollIndicatorService_1 = require("./terminal/TerminalScrollIndicatorService");
// ============================================================================
// Constants
// ============================================================================
/**
 * CSS class names for terminal elements
 */
const CssClasses = {
    ACTIVE: 'active',
};
/**
 * Timing constants for terminal operations
 */
const Timings = {
    /** Initial retry delay for terminal creation */
    CREATION_RETRY_DELAY_MS: 500,
};
const RenderingConfig = {
    RESIZE_DEBOUNCE_MS: 100,
};
/**
 * Limits for terminal operations
 */
const Limits = {
    /** Maximum retry attempts for terminal creation */
    MAX_CREATION_RETRIES: 2,
};
/**
 * Service responsible for terminal creation, removal, and switching operations
 *
 * Phase 3 Update: Integrated LifecycleController for proper resource management
 * Phase 4 Update: Extracted config, focus, scrollbar, and auto-save services
 */
class TerminalCreationService {
    /**
     * Mark a terminal as currently being restored (blocks auto-save)
     * Delegates to TerminalAutoSaveService
     */
    static markTerminalRestoring(terminalId) {
        terminal_1.TerminalAutoSaveService.markTerminalRestoring(terminalId);
    }
    /**
     * Mark a terminal as restored (ends protection period after delay)
     * Delegates to TerminalAutoSaveService
     */
    static markTerminalRestored(terminalId) {
        terminal_1.TerminalAutoSaveService.markTerminalRestored(terminalId);
    }
    /**
     * Clear restoration state for a terminal immediately.
     */
    static clearTerminalRestorationState(terminalId) {
        terminal_1.TerminalAutoSaveService.clearTerminalRestorationState(terminalId);
    }
    /**
     * Clear all restoration state.
     */
    static clearAllRestorationState() {
        terminal_1.TerminalAutoSaveService.clearAllRestorationState();
    }
    /**
     * Check if a terminal is currently being restored
     * Delegates to TerminalAutoSaveService
     */
    static isTerminalRestoring(terminalId) {
        return terminal_1.TerminalAutoSaveService.isTerminalRestoring(terminalId);
    }
    constructor(splitManager, coordinator, eventRegistry) {
        this.scrollIndicatorDisposables = new Map();
        this.splitManager = splitManager;
        this.coordinator = coordinator;
        this.addonManager = new TerminalAddonManager_1.TerminalAddonManager();
        this.autoSaveService = new terminal_1.TerminalAutoSaveService(coordinator);
        const lifecycleController = new LifecycleController_1.LifecycleController();
        this.eventManager = new TerminalEventManager_1.TerminalEventManager(coordinator, eventRegistry);
        this.linkManager = new TerminalLinkManager_1.TerminalLinkManager(coordinator);
        const focusService = new terminal_1.TerminalFocusService();
        const scrollbarService = new terminal_1.TerminalScrollbarService();
        const scrollIndicatorService = new TerminalScrollIndicatorService_1.TerminalScrollIndicatorService();
        this.mouseTrackingService = new terminal_1.MouseTrackingService();
        this.appearanceService = new terminal_1.TerminalAppearanceService({
            coordinator: coordinator,
        });
        this.domService = new terminal_1.TerminalDomService({ splitManager, coordinator });
        this.interactionService = new terminal_1.TerminalInteractionService({
            coordinator,
            eventRegistry,
            lifecycleController,
            eventManager: this.eventManager,
            focusService,
        });
        this.lifecycleService = new terminal_1.TerminalLifecycleService({
            splitManager,
            coordinator,
            linkManager: this.linkManager,
            scrollbarService,
            mouseTrackingService: this.mouseTrackingService,
            scrollIndicatorService,
            autoSaveService: this.autoSaveService,
            lifecycleController,
            eventManager: this.eventManager,
            scrollIndicatorDisposables: this.scrollIndicatorDisposables,
        });
    }
    /**
     * Create new terminal using centralized utilities.
     *
     * Orchestrates 6 phases:
     * 1. ensureDomReady — DOM readiness check with recovery
     * 2. prepareTerminalConfig — Font, theme, and config merging
     * 3. createTerminalWithAddons — Terminal instance + addon loading
     * 4. createAndInsertContainer — Container factory, header callbacks, DOM insertion
     * 5. setupTerminalInteraction — Open terminal, paste handler, settings, events
     * 6. finalizeTerminalSetup — Links, rendering, registration, resize, notifications
     */
    async createTerminal(terminalId, terminalName, config, terminalNumber) {
        const performanceMonitor = PerformanceOptimizer_1.PerformanceMonitor.getInstance();
        const maxRetries = Limits.MAX_CREATION_RETRIES;
        let currentRetry = 0;
        const attemptCreation = async () => {
            ResizeManager_1.ResizeManager.pauseObservers();
            ManagerLogger_1.terminalLogger.info(`⏸️ Paused all ResizeObservers during terminal creation: ${terminalId}`);
            try {
                performanceMonitor.startTimer(`terminal-creation-attempt-${terminalId}-${currentRetry}`);
                ManagerLogger_1.terminalLogger.info(`Creating terminal: ${terminalId} (${terminalName}) - attempt ${currentRetry + 1}/${maxRetries + 1}`);
                // Cache managers for reuse throughout terminal creation
                const managers = this.coordinator.getManagers?.();
                const configManager = managers?.config;
                const uiManager = managers?.ui;
                // Phase 1: DOM readiness
                this.domService.ensureDomReady();
                // Phase 2: Config preparation
                const { terminalConfig, currentSettings, currentFontSettings, linkModifier } = this.appearanceService.prepareTerminalConfig(config, configManager);
                // Phase 3: Terminal + addons
                const { terminal, fitAddon, serializeAddon, searchAddon } = await this.createTerminalWithAddons(terminalId, terminalConfig, linkModifier);
                // Phase 4: Container creation & DOM insertion
                const { container, terminalContent, containerElements, terminalNumberToUse } = this.domService.createAndInsertContainer({
                    terminalId,
                    terminalName,
                    config,
                    terminalNumber,
                    currentSettings,
                    uiManager,
                });
                // Phase 5: Terminal interaction setup
                this.interactionService.setupTerminalInteraction({
                    terminalId,
                    terminal,
                    container,
                    terminalContent,
                    currentSettings,
                    currentFontSettings,
                    configManager,
                    uiManager,
                    applyPostOpenSettings: (params) => this.appearanceService.applyPostOpenSettings(params),
                });
                // Phase 6: Rendering, registration & finalization
                const terminalInstance = await this.lifecycleService.finalizeTerminalSetup({
                    terminalId,
                    terminalName,
                    terminal,
                    fitAddon,
                    serializeAddon,
                    searchAddon,
                    container,
                    terminalContent,
                    containerElements,
                    terminalNumberToUse,
                    terminalConfig,
                    linkModifier,
                    config,
                    uiManager: uiManager,
                });
                const elapsed = performanceMonitor.endTimer(`terminal-creation-attempt-${terminalId}-${currentRetry}`);
                ManagerLogger_1.terminalLogger.info(`✅ Terminal creation completed: ${terminalId} in ${elapsed}ms`);
                // Final refresh after all setup (re-apply theme after WebGL/DOM renderer setup)
                this.appearanceService.schedulePostRendererRefresh({
                    terminalId,
                    terminal,
                    container,
                    terminalContent,
                    configManager,
                    uiManager: uiManager,
                });
                return terminalInstance.terminal;
            }
            catch (error) {
                ManagerLogger_1.terminalLogger.error(`Failed to create terminal ${terminalId}:`, error);
                if (currentRetry < maxRetries) {
                    currentRetry++;
                    ManagerLogger_1.terminalLogger.info(`Retrying terminal creation: ${terminalId} (${currentRetry}/${maxRetries})`);
                    await new Promise((resolve) => setTimeout(resolve, Timings.CREATION_RETRY_DELAY_MS));
                    return attemptCreation();
                }
                return null;
            }
            finally {
                ResizeManager_1.ResizeManager.resumeObservers();
                ManagerLogger_1.terminalLogger.info(`▶️ Resumed all ResizeObservers after terminal creation: ${terminalId}`);
            }
        };
        return attemptCreation();
    }
    // ============================================================================
    // Phase 3: Terminal + Addons Creation
    // ============================================================================
    /**
     * Create Terminal instance and load all addons.
     */
    async createTerminalWithAddons(terminalId, terminalConfig, linkModifier) {
        const terminal = new xterm_1.Terminal(terminalConfig);
        ManagerLogger_1.terminalLogger.info(`✅ Terminal instance created: ${terminalId}`);
        const loadedAddons = await this.addonManager.loadAllAddons(terminal, terminalId, {
            enableGpuAcceleration: terminalConfig.enableGpuAcceleration,
            enableSearchAddon: terminalConfig.enableSearchAddon,
            enableUnicode11: terminalConfig.enableUnicode11,
            linkModifier,
            linkHandler: (_event, uri) => {
                try {
                    this.coordinator?.postMessageToExtension({
                        command: 'openTerminalLink',
                        linkType: 'url',
                        url: uri,
                        terminalId,
                        timestamp: Date.now(),
                    });
                }
                catch {
                    try {
                        window.open(uri, '_blank');
                    }
                    catch {
                        // swallow; extension path is primary
                    }
                }
            },
        });
        const { fitAddon, serializeAddon, searchAddon } = loadedAddons;
        return { terminal, fitAddon, serializeAddon, searchAddon };
    }
    async removeTerminal(terminalId) {
        return this.lifecycleService.removeTerminal(terminalId);
    }
    /**
     * Switch to terminal with ResizeManager integration
     */
    async switchToTerminal(terminalId, currentActiveId, onActivate) {
        try {
            ManagerLogger_1.terminalLogger.info(`Switching to terminal: ${terminalId}`);
            const terminalInstance = this.splitManager.getTerminals().get(terminalId);
            if (!terminalInstance) {
                ManagerLogger_1.terminalLogger.error(`Terminal not found: ${terminalId}`);
                return false;
            }
            // Deactivate current terminal
            if (currentActiveId) {
                const currentInstance = this.splitManager.getTerminals().get(currentActiveId);
                if (currentInstance) {
                    currentInstance.isActive = false;
                    currentInstance.container.classList.remove(CssClasses.ACTIVE);
                }
            }
            // Activate new terminal
            terminalInstance.isActive = true;
            terminalInstance.container.classList.add(CssClasses.ACTIVE);
            onActivate(terminalId);
            // Debounced resize for smooth transition
            ResizeManager_1.ResizeManager.debounceResize(`switch-${terminalId}`, async () => {
                try {
                    if (terminalInstance.fitAddon) {
                        terminalInstance.fitAddon.fit();
                        this.notifyExtensionResize(terminalId, terminalInstance.terminal);
                    }
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.error(`Switch resize failed for ${terminalId}:`, error);
                }
            }, { delay: RenderingConfig.RESIZE_DEBOUNCE_MS });
            ManagerLogger_1.terminalLogger.info(`Switched to terminal successfully: ${terminalId}`);
            return true;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to switch to terminal ${terminalId}:`, error);
            return false;
        }
    }
    notifyExtensionResize(terminalId, terminal) {
        try {
            this.coordinator.postMessageToExtension({
                command: 'resize',
                terminalId,
                cols: terminal.cols,
                rows: terminal.rows,
            });
            ManagerLogger_1.terminalLogger.debug(`Sent resize notification: ${terminalId} (${terminal.cols}x${terminal.rows})`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to notify extension of resize for ${terminalId}:`, error);
        }
    }
    /**
     * Dispose all resources
     */
    dispose() {
        ManagerLogger_1.terminalLogger.info('Disposing TerminalCreationService...');
        try {
            // Dispose addon manager
            this.addonManager.dispose();
            // Dispose event manager
            this.eventManager.dispose();
            // Dispose link manager
            this.linkManager.dispose();
            // Dispose mouse tracking service
            this.mouseTrackingService.dispose();
            ManagerLogger_1.terminalLogger.info('TerminalCreationService disposed');
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error('Error disposing TerminalCreationService:', error);
        }
    }
}
exports.TerminalCreationService = TerminalCreationService;
//# sourceMappingURL=TerminalCreationService.js.map