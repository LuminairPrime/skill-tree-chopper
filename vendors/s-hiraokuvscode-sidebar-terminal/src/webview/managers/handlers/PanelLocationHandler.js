"use strict";
/**
 * Panel Location Handler
 *
 * Handles panel location detection and updates based on WebView dimensions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelLocationHandler = void 0;
const type_guards_1 = require("../../../types/type-guards");
const DOMUtils_1 = require("../../utils/DOMUtils");
const webview_1 = require("../../constants/webview");
/**
 * Panel Location Handler
 *
 * 🎯 SINGLE SOURCE OF TRUTH for panel location and flex-direction updates
 *
 * Responsibilities:
 * - Detect panel location based on WebView dimensions
 * - Update split direction based on panel location
 * - Report panel location to Extension
 * - Manage cached state to prevent redundant updates (VS Code pattern)
 *
 * Architecture Pattern (from VS Code):
 * - Cached state comparison (update only when changed)
 * - Double-guard pattern (check at multiple levels)
 * - No debouncing (simple state comparison is sufficient)
 */
class PanelLocationHandler {
    constructor(messageQueue, logger) {
        this.messageQueue = messageQueue;
        this.logger = logger;
        /**
         * 🎯 Cached state to prevent redundant updates (VS Code pattern)
         */
        this.cachedFlexDirection = null;
        this.cachedPanelLocation = null;
        // 🎯 OPTIMIZATION: Initialize autonomous detection when DOM is ready
        // ResizeObserver will wait for valid (non-zero) dimensions before applying
        this.initializeAutonomousDetection();
    }
    /**
     * Initialize autonomous panel location detection
     *
     * 🎯 VS Code Pattern: CSS class-based layout with state comparison
     */
    initializeAutonomousDetection() {
        let initialDetectionDone = false;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Wait for valid dimensions
                if (width === 0 || height === 0) {
                    continue;
                }
                const detectedLocation = this.detectPanelLocation();
                // Initial detection
                if (!initialDetectionDone) {
                    const terminalsWrapper = document.getElementById('terminals-wrapper');
                    // Update cached state even if terminals-wrapper isn't ready yet
                    this.cachedFlexDirection = detectedLocation === 'panel' ? 'row' : 'column';
                    this.cachedPanelLocation = detectedLocation;
                    if (terminalsWrapper) {
                        // 🔧 FIX: Apply CSS class for horizontal layout (bottom panel only)
                        // Default is column (vertical/sidebar), add class for row (horizontal/panel)
                        if (detectedLocation === 'panel') {
                            terminalsWrapper.classList.add('terminal-split-horizontal');
                        }
                        else {
                            terminalsWrapper.classList.remove('terminal-split-horizontal');
                        }
                    }
                    else {
                        // terminals-wrapper may be created later (after terminalCreated messages)
                        // Retry once the wrapper exists so layout matches the detected location
                        this.scheduleTerminalsWrapperClassSync(detectedLocation);
                    }
                    // Report to Extension
                    void this.messageQueue.enqueue({
                        command: 'reportPanelLocation',
                        location: detectedLocation,
                        timestamp: Date.now(),
                    });
                    initialDetectionDone = true;
                    // 🔧 FIX: Schedule terminal refit after initial detection
                    this.scheduleTerminalRefitViaDOM(detectedLocation);
                }
                else {
                    // Change detection: Only update if location changed
                    if (this.cachedPanelLocation !== detectedLocation) {
                        const terminalsWrapper = document.getElementById('terminals-wrapper');
                        if (terminalsWrapper) {
                            // 🔧 FIX: Toggle CSS class for horizontal layout (bottom panel only)
                            if (detectedLocation === 'panel') {
                                terminalsWrapper.classList.add('terminal-split-horizontal');
                            }
                            else {
                                terminalsWrapper.classList.remove('terminal-split-horizontal');
                            }
                        }
                        else {
                            this.scheduleTerminalsWrapperClassSync(detectedLocation);
                        }
                        // Update cached state
                        this.cachedFlexDirection = detectedLocation === 'panel' ? 'row' : 'column';
                        this.cachedPanelLocation = detectedLocation;
                        // Report to Extension
                        void this.messageQueue.enqueue({
                            command: 'reportPanelLocation',
                            location: detectedLocation,
                            timestamp: Date.now(),
                        });
                        // 🔧 FIX: Schedule terminal refit after panel location change
                        this.scheduleTerminalRefitViaDOM(detectedLocation);
                    }
                }
                break;
            }
        });
        // Start observing
        if (document.body) {
            resizeObserver.observe(document.body);
        }
        else {
            document.addEventListener('DOMContentLoaded', () => {
                resizeObserver.observe(document.body);
            });
        }
    }
    /**
     * 🔧 FIX: Schedule terminal refit via DOM event
     * Used when coordinator is not available (autonomous detection)
     * Dispatches a custom event that TerminalWebviewManager can listen to
     */
    scheduleTerminalRefitViaDOM(location) {
        setTimeout(() => {
            try {
                // Dispatch custom event for terminal refit
                const event = new CustomEvent('terminal-panel-location-changed', {
                    bubbles: true,
                    detail: { location },
                });
                window.dispatchEvent(event);
                this.logger.info('📤 Dispatched terminal-panel-location-changed event');
            }
            catch (error) {
                this.logger.error('Failed to dispatch terminal refit event:', error);
            }
        }, webview_1.WEBVIEW_TIMING.PANEL_REFIT_DELAY_MS);
    }
    scheduleTerminalsWrapperClassSync(location) {
        let attempt = 0;
        const timer = setInterval(() => {
            attempt++;
            const terminalsWrapper = document.getElementById('terminals-wrapper');
            if (terminalsWrapper) {
                if (location === 'panel') {
                    terminalsWrapper.classList.add('terminal-split-horizontal');
                }
                else {
                    terminalsWrapper.classList.remove('terminal-split-horizontal');
                }
                clearInterval(timer);
                return;
            }
            if (attempt >= webview_1.PANEL_LOCATION_CONSTANTS.CLASS_SYNC_MAX_ATTEMPTS) {
                clearInterval(timer);
            }
        }, webview_1.PANEL_LOCATION_CONSTANTS.CLASS_SYNC_RETRY_INTERVAL_MS);
    }
    /**
     * 🎯 PUBLIC API: Update flex-direction if panel location has changed
     * Uses VS Code's double-guard pattern to prevent redundant updates
     */
    updateFlexDirectionIfNeeded(coordinator) {
        const detectedLocation = this.detectPanelLocation();
        // First guard: Check if location changed
        if (this.cachedPanelLocation === detectedLocation) {
            return false;
        }
        const newFlexDirection = detectedLocation === 'panel' ? 'row' : 'column';
        // Second guard: Check if flex-direction changed
        if (this.cachedFlexDirection === newFlexDirection) {
            this.cachedPanelLocation = detectedLocation;
            return false;
        }
        // Apply the update
        this.applyFlexDirection(newFlexDirection, detectedLocation, coordinator);
        // Update cached state
        this.cachedFlexDirection = newFlexDirection;
        this.cachedPanelLocation = detectedLocation;
        return true;
    }
    /**
     * 🎯 PUBLIC API: Get current flex-direction
     */
    getCurrentFlexDirection() {
        return this.cachedFlexDirection;
    }
    /**
     * 🎯 PUBLIC API: Get current panel location
     */
    getCurrentPanelLocation() {
        return this.cachedPanelLocation;
    }
    /**
     * Handle panel location related messages
     */
    handleMessage(msg, coordinator) {
        const command = msg.command;
        switch (command) {
            case 'panelLocationUpdate':
                this.handlePanelLocationUpdate(msg, coordinator);
                break;
            case 'requestPanelLocationDetection':
                this.handleRequestPanelLocationDetection(coordinator);
                break;
            default:
                this.logger.warn(`Unknown panel location command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return ['panelLocationUpdate', 'requestPanelLocationDetection'];
    }
    /**
     * 🎯 Detect panel location based on aspect ratio
     */
    detectPanelLocation() {
        try {
            let width = window.innerWidth;
            let height = window.innerHeight;
            // Fallback chain
            if (width === 0 || height === 0) {
                width = document.documentElement.clientWidth;
                height = document.documentElement.clientHeight;
            }
            if (width === 0 || height === 0) {
                width = document.body.clientWidth;
                height = document.body.clientHeight;
            }
            if (width === 0 || height === 0) {
                return 'sidebar';
            }
            return this.classifyPanelLocation(width, height);
        }
        catch (error) {
            this.logger.error('Error detecting panel location', error);
            return 'sidebar';
        }
    }
    /**
     * 🎯 VS Code Pattern: Apply CSS class-based layout
     */
    applyFlexDirection(newFlexDirection, location, coordinator) {
        // Update split manager
        const splitManager = coordinator.getSplitManager?.();
        if (splitManager) {
            const newSplitDirection = newFlexDirection === 'row' ? 'horizontal' : 'vertical';
            if ((0, type_guards_1.hasProperty)(splitManager, 'updateSplitDirection', (value) => typeof value === 'function')) {
                splitManager.updateSplitDirection(newSplitDirection, location);
            }
        }
        // Apply CSS class to terminals-wrapper
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (terminalsWrapper) {
            // 🔧 FIX: Toggle CSS class for horizontal layout (bottom panel only)
            if (location === 'panel') {
                terminalsWrapper.classList.add('terminal-split-horizontal');
            }
            else {
                terminalsWrapper.classList.remove('terminal-split-horizontal');
            }
        }
        // 🔧 FIX: Trigger resize on all terminals after panel location change
        // This ensures terminals expand to full width after layout change
        this.scheduleTerminalRefit(coordinator);
    }
    /**
     * 🔧 FIX: Schedule terminal refit after layout change
     * Delays the fit to allow CSS layout to settle
     *
     * 🎯 CRITICAL: Reset xterm.js inline styles BEFORE fit() to allow width expansion
     */
    scheduleTerminalRefit(coordinator) {
        setTimeout(() => {
            try {
                // Get split manager and refit all terminals
                const splitManager = coordinator.getSplitManager?.();
                if (splitManager && typeof splitManager.getTerminals === 'function') {
                    const terminals = splitManager.getTerminals();
                    terminals.forEach((terminalData, terminalId) => {
                        if (terminalData.fitAddon) {
                            try {
                                // 🎯 CRITICAL FIX: Reset xterm.js inline styles BEFORE fit()
                                // This allows the terminal to expand to full container width
                                if (terminalData.container) {
                                    DOMUtils_1.DOMUtils.resetXtermInlineStyles(terminalData.container);
                                }
                                terminalData.fitAddon.fit();
                                this.logger.info(`✅ Terminal ${terminalId} refitted after panel location change`);
                            }
                            catch (error) {
                                this.logger.warn(`Failed to refit terminal ${terminalId}:`, error);
                            }
                        }
                    });
                }
            }
            catch (error) {
                this.logger.error('Failed to refit terminals after panel location change:', error);
            }
        }, webview_1.WEBVIEW_TIMING.PANEL_REFIT_DELAY_MS);
    }
    /**
     * Handle panel location update message (backward compatibility)
     */
    handlePanelLocationUpdate(_msg, coordinator) {
        try {
            // Check if dynamic split direction is enabled
            const configManager = coordinator.getManagers?.()?.config;
            let isDynamicSplitEnabled = true;
            if (configManager) {
                try {
                    if ((0, type_guards_1.hasProperty)(configManager, 'getCurrentSettings', (value) => typeof value === 'function')) {
                        const settings = configManager.getCurrentSettings();
                        isDynamicSplitEnabled = settings.dynamicSplitDirection !== false;
                    }
                }
                catch {
                    // Use default
                }
            }
            if (!isDynamicSplitEnabled) {
                return;
            }
            // Only update if autonomous detection hasn't completed
            if (this.cachedPanelLocation === null || this.cachedFlexDirection === null) {
                this.updateFlexDirectionIfNeeded(coordinator);
            }
        }
        catch (error) {
            this.logger.error('Error handling panel location update', error);
        }
    }
    /**
     * Handle panel location detection request from Extension
     */
    handleRequestPanelLocationDetection(_coordinator) {
        try {
            const detectedLocation = this.analyzeWebViewDimensions();
            void this.messageQueue.enqueue({
                command: 'reportPanelLocation',
                location: detectedLocation,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            this.logger.error('Error in panel location detection', error);
            void this.messageQueue.enqueue({
                command: 'reportPanelLocation',
                location: 'sidebar',
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Analyze WebView dimensions to determine panel location
     */
    analyzeWebViewDimensions() {
        try {
            const container = document.body;
            if (!container) {
                return 'sidebar';
            }
            const width = container.clientWidth;
            const height = container.clientHeight;
            if (width === 0 || height === 0) {
                return 'sidebar';
            }
            return this.classifyPanelLocation(width, height);
        }
        catch (error) {
            this.logger.error('Error analyzing dimensions', error);
            return 'sidebar';
        }
    }
    /**
     * Classify panel location from dimensions.
     * Wide layouts use panel mode (horizontal split), otherwise sidebar mode.
     */
    classifyPanelLocation(width, height) {
        const viewportArea = width * height;
        if (viewportArea <= webview_1.PANEL_LOCATION_CONSTANTS.COMPACT_VIEWPORT_AREA_THRESHOLD) {
            return width > height ? 'panel' : 'sidebar';
        }
        const aspectRatio = width / height;
        return aspectRatio > webview_1.PANEL_LOCATION_CONSTANTS.ASPECT_RATIO_THRESHOLD ? 'panel' : 'sidebar';
    }
    /**
     * Clean up resources
     */
    dispose() {
        // No resources to clean up
    }
}
exports.PanelLocationHandler = PanelLocationHandler;
//# sourceMappingURL=PanelLocationHandler.js.map