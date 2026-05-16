"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalLifecycleService = void 0;
const RenderingOptimizer_1 = require("../../optimizers/RenderingOptimizer");
const DOMUtils_1 = require("../../utils/DOMUtils");
const ManagerLogger_1 = require("../../utils/ManagerLogger");
const TerminalAutoSaveService_1 = require("./TerminalAutoSaveService");
const CssClasses = {
    XTERM: 'xterm',
    XTERM_VIEWPORT: 'xterm-viewport',
};
const RenderingConfig = {
    RESIZE_DEBOUNCE_MS: 100,
    MIN_WIDTH: 50,
    MIN_HEIGHT: 50,
};
const Timings = {
    CREATION_RETRY_DELAY_MS: 500,
    RESIZE_RETRY_DELAYS: [0, 50, 100, 200, 500],
    POST_RESIZE_DELAY_MS: 300,
    MOUSE_TRACKING_RETRY_DELAY_MS: 50,
};
const Limits = {
    MAX_RESIZE_RETRIES: 5,
    MIN_CONTAINER_DIMENSION: 50,
    MAX_MOUSE_TRACKING_SETUP_ATTEMPTS: 10,
};
class TerminalLifecycleService {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    async finalizeTerminalSetup(params) {
        const { terminalId, terminalName, terminal, fitAddon, serializeAddon, searchAddon, container, terminalContent, containerElements, terminalNumberToUse, terminalConfig, linkModifier, config, uiManager, } = params;
        this.dependencies.linkManager.setLinkModifier(linkModifier);
        this.dependencies.linkManager.registerTerminalLinkHandlers(terminal, terminalId);
        const xtermElement = terminalContent.querySelector(`.${CssClasses.XTERM}`);
        this.dependencies.scrollbarService.enableScrollbarDisplay(xtermElement, terminalId);
        this.setupMouseTrackingDelayed(terminal, terminalId, container);
        const scrollIndicatorDispose = this.dependencies.scrollIndicatorService.attach(terminal, container, terminalId);
        this.dependencies.scrollIndicatorDisposables.set(terminalId, scrollIndicatorDispose);
        const renderingOptimizer = await this.setupRenderingOptimizer(terminalId, terminal, fitAddon, container, terminalConfig.enableGpuAcceleration ?? true);
        const terminalInstance = {
            id: terminalId,
            terminal,
            fitAddon,
            container,
            name: terminalName,
            isActive: false,
            number: terminalNumberToUse,
            searchAddon,
            serializeAddon,
            renderingOptimizer: renderingOptimizer ?? undefined,
        };
        this.dependencies.splitManager.getTerminals().set(terminalId, terminalInstance);
        this.dependencies.splitManager.getTerminalContainers().set(terminalId, container);
        ManagerLogger_1.terminalLogger.info(`✅ Terminal registered with SplitManager: ${terminalId}`);
        const terminalReadyMessage = { command: 'terminalReady', terminalId, timestamp: Date.now() };
        ManagerLogger_1.terminalLogger.info(`📨 [WebView] Sending terminalReady for terminalId: ${terminalId}`);
        this.dependencies.coordinator.postMessageToExtension(terminalReadyMessage);
        ManagerLogger_1.terminalLogger.info('✅ [WebView] terminalReady sent successfully');
        const containerManager = this.dependencies.coordinator.getTerminalContainerManager?.();
        if (containerManager) {
            containerManager.registerContainer(terminalId, container);
            ManagerLogger_1.terminalLogger.info(`✅ Container registered with TerminalContainerManager: ${terminalId}`);
        }
        const displayModeOverride = config
            ?.displayModeOverride;
        if (this.dependencies.splitManager.getIsSplitMode() &&
            displayModeOverride !== 'normal' &&
            displayModeOverride !== 'fullscreen') {
            this.dependencies.splitManager.addNewTerminalToSplit(terminalId, terminalName);
            this.dependencies.coordinator.getDisplayModeManager?.()?.showAllTerminalsSplit();
        }
        else if ((displayModeOverride === 'normal' || displayModeOverride === 'fullscreen') &&
            this.dependencies.splitManager.getIsSplitMode()) {
            this.dependencies.splitManager.exitSplitMode();
        }
        if (containerElements.headerElements && this.hasHeaderElementsCache(uiManager)) {
            uiManager.headerElementsCache.set(terminalId, containerElements.headerElements);
            ManagerLogger_1.terminalLogger.info(`✅ Header elements registered with UIManager for AI Agent support: ${terminalId}`);
        }
        this.performInitialResize(terminal, fitAddon, container, terminalId);
        if (this.dependencies.coordinator.inputManager) {
            this.dependencies.coordinator.inputManager.addXtermClickHandler(terminal, terminalId, container, this.dependencies.coordinator);
            ManagerLogger_1.terminalLogger.info(`✅ Input handling setup for terminal: ${terminalId}`);
        }
        else {
            ManagerLogger_1.terminalLogger.error(`❌ InputManager not available for terminal: ${terminalId}`);
        }
        this.dependencies.autoSaveService.setupScrollbackAutoSave(terminal, terminalId, serializeAddon);
        return terminalInstance;
    }
    async removeTerminal(terminalId) {
        try {
            ManagerLogger_1.terminalLogger.info(`Removing terminal: ${terminalId}`);
            const terminalInstance = this.dependencies.splitManager.getTerminals().get(terminalId);
            if (!terminalInstance) {
                ManagerLogger_1.terminalLogger.warn(`Terminal not found: ${terminalId}`);
                return false;
            }
            terminalInstance.renderingOptimizer?.dispose();
            TerminalAutoSaveService_1.TerminalAutoSaveService.clearPeriodicSaveTimer(terminalId);
            const disposeScrollIndicator = this.dependencies.scrollIndicatorDisposables.get(terminalId);
            if (disposeScrollIndicator) {
                disposeScrollIndicator();
                this.dependencies.scrollIndicatorDisposables.delete(terminalId);
            }
            this.dependencies.mouseTrackingService.cleanup(terminalId);
            this.dependencies.lifecycleController.disposeTerminal(terminalId);
            this.dependencies.eventManager.removeTerminalEvents(terminalId);
            if (this.dependencies.coordinator.inputManager) {
                try {
                    this.dependencies.coordinator.inputManager.removeTerminalHandlers?.(terminalId);
                    ManagerLogger_1.terminalLogger.info(`✅ Input handlers removed via InputManager for: ${terminalId}`);
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn(`⚠️ Failed to remove InputManager handlers for ${terminalId}`, error);
                }
            }
            this.dependencies.linkManager.unregisterTerminalLinkProvider(terminalId);
            terminalInstance.terminal.dispose();
            if (terminalInstance.container?.parentNode) {
                terminalInstance.container.parentNode.removeChild(terminalInstance.container);
            }
            this.dependencies.splitManager.getTerminals().delete(terminalId);
            this.dependencies.splitManager.getTerminalContainers().delete(terminalId);
            const containerManager = this.dependencies.coordinator.getTerminalContainerManager?.();
            if (containerManager) {
                containerManager.unregisterContainer(terminalId);
                ManagerLogger_1.terminalLogger.info(`✅ Container unregistered from TerminalContainerManager: ${terminalId}`);
                const remainingTerminals = this.dependencies.splitManager.getTerminals().size;
                const displayManager = this.dependencies.coordinator.getDisplayModeManager?.();
                const currentMode = displayManager?.getCurrentMode?.() ?? 'normal';
                ManagerLogger_1.terminalLogger.info(`🔧 [CLEANUP] Current mode: ${currentMode}, remaining: ${remainingTerminals}`);
                if (remainingTerminals <= 1) {
                    containerManager.clearSplitArtifacts();
                    ManagerLogger_1.terminalLogger.info(`✅ Split artifacts cleared (remaining terminals: ${remainingTerminals})`);
                    if (currentMode === 'split' && displayManager && remainingTerminals === 1) {
                        displayManager.setDisplayMode('normal');
                        ManagerLogger_1.terminalLogger.info('✅ Switched to normal mode after deletion');
                    }
                }
                else if (currentMode === 'split') {
                    const orderedIds = Array.from(this.dependencies.splitManager.getTerminals().keys());
                    const activeId = this.dependencies.coordinator.getActiveTerminalId?.() ?? orderedIds[0] ?? null;
                    const currentLocation = this.dependencies.splitManager.getCurrentPanelLocation?.() || 'sidebar';
                    const splitDirection = this.dependencies.splitManager.getOptimalSplitDirection(currentLocation);
                    containerManager.applyDisplayState({
                        mode: 'split',
                        activeTerminalId: activeId,
                        orderedTerminalIds: orderedIds,
                        splitDirection,
                    });
                    ManagerLogger_1.terminalLogger.info(`✅ Split layout rebuilt with ${remainingTerminals} terminals`);
                }
                else {
                    containerManager.clearSplitArtifacts();
                    ManagerLogger_1.terminalLogger.info(`✅ Cleared stray split artifacts in ${currentMode} mode`);
                }
            }
            ManagerLogger_1.terminalLogger.info(`Terminal removed successfully: ${terminalId}`);
            return true;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to remove terminal ${terminalId}:`, error);
            return false;
        }
    }
    hasHeaderElementsCache(manager) {
        if (typeof manager === 'object' && manager !== null && 'headerElementsCache' in manager) {
            return manager.headerElementsCache instanceof Map;
        }
        return false;
    }
    performInitialResize(terminal, fitAddon, container, terminalId) {
        const maxRetries = Limits.MAX_RESIZE_RETRIES;
        const retryDelays = Timings.RESIZE_RETRY_DELAYS;
        let retryCount = 0;
        const attemptResize = () => {
            try {
                const rect = container.getBoundingClientRect();
                if (rect.width > Limits.MIN_CONTAINER_DIMENSION &&
                    rect.height > Limits.MIN_CONTAINER_DIMENSION) {
                    DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
                    fitAddon.fit();
                    requestAnimationFrame(() => {
                        DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
                        fitAddon.fit();
                    });
                    terminal.refresh(0, terminal.rows - 1);
                    setTimeout(() => {
                        try {
                            const finalRect = container.getBoundingClientRect();
                            if (finalRect.width > Limits.MIN_CONTAINER_DIMENSION &&
                                finalRect.height > Limits.MIN_CONTAINER_DIMENSION) {
                                DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
                                fitAddon.fit();
                                terminal.refresh(0, terminal.rows - 1);
                                ManagerLogger_1.terminalLogger.debug(`Terminal delayed resize: ${terminalId} (${terminal.cols}x${terminal.rows})`);
                            }
                        }
                        catch (error) {
                            ManagerLogger_1.terminalLogger.warn(`Delayed resize failed for ${terminalId}:`, error);
                        }
                    }, Timings.POST_RESIZE_DELAY_MS);
                }
                else if (retryCount < maxRetries) {
                    retryCount++;
                    const delay = retryDelays[retryCount] || Timings.CREATION_RETRY_DELAY_MS;
                    ManagerLogger_1.terminalLogger.debug(`Container too small, retry ${retryCount}/${maxRetries} in ${delay}ms: ${terminalId} (${rect.width}x${rect.height})`);
                    setTimeout(attemptResize, delay);
                }
                else {
                    ManagerLogger_1.terminalLogger.warn(`Container still too small after ${maxRetries} retries: ${terminalId} (${rect.width}x${rect.height})`);
                    try {
                        DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
                        fitAddon.fit();
                        terminal.refresh(0, terminal.rows - 1);
                        ManagerLogger_1.terminalLogger.info(`Forced fit for small container: ${terminalId}`);
                    }
                    catch (error) {
                        ManagerLogger_1.terminalLogger.error(`Forced fit failed for ${terminalId}:`, error);
                    }
                }
            }
            catch (error) {
                ManagerLogger_1.terminalLogger.error(`Failed initial resize for ${terminalId}:`, error);
            }
        };
        attemptResize();
    }
    setupMouseTrackingDelayed(terminal, terminalId, container) {
        const maxAttempts = Limits.MAX_MOUSE_TRACKING_SETUP_ATTEMPTS;
        const delayMs = Timings.MOUSE_TRACKING_RETRY_DELAY_MS;
        let attempts = 0;
        const sendInput = (tid, data) => {
            this.dependencies.coordinator.postMessageToExtension({
                command: 'input',
                terminalId: tid,
                data,
            });
        };
        const trySetup = () => {
            attempts++;
            const viewport = container.querySelector(`.${CssClasses.XTERM_VIEWPORT}`);
            if (viewport) {
                this.dependencies.mouseTrackingService.setup(terminal, terminalId, viewport, sendInput);
                ManagerLogger_1.terminalLogger.info(`[MouseTracking] Setup complete after ${attempts} attempt(s) for: ${terminalId}`);
            }
            else if (attempts < maxAttempts) {
                ManagerLogger_1.terminalLogger.debug(`[MouseTracking] Viewport not found, retry ${attempts}/${maxAttempts} for: ${terminalId}`);
                setTimeout(trySetup, delayMs);
            }
            else {
                ManagerLogger_1.terminalLogger.warn(`[MouseTracking] Could not find viewport after ${maxAttempts} attempts for: ${terminalId}`);
            }
        };
        requestAnimationFrame(trySetup);
    }
    async setupRenderingOptimizer(terminalId, terminal, fitAddon, container, enableGpuAcceleration) {
        try {
            const renderingOptimizer = new RenderingOptimizer_1.RenderingOptimizer({
                enableWebGL: enableGpuAcceleration,
                resizeDebounceMs: RenderingConfig.RESIZE_DEBOUNCE_MS,
                minWidth: RenderingConfig.MIN_WIDTH,
                minHeight: RenderingConfig.MIN_HEIGHT,
            });
            renderingOptimizer.setupOptimizedResize(terminal, fitAddon, container, terminalId);
            if (enableGpuAcceleration) {
                await renderingOptimizer.enableWebGL(terminal, terminalId);
            }
            renderingOptimizer.setupSmoothScrolling(terminal, container, terminalId);
            ManagerLogger_1.terminalLogger.info(`✅ RenderingOptimizer setup completed for: ${terminalId}`);
            return renderingOptimizer;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to setup RenderingOptimizer for ${terminalId}:`, error);
            return null;
        }
    }
}
exports.TerminalLifecycleService = TerminalLifecycleService;
//# sourceMappingURL=TerminalLifecycleService.js.map