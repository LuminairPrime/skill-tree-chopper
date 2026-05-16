"use strict";
/**
 * Panel Location Service
 *
 * Manages panel location detection and split direction determination
 * Extracted from SecondaryTerminalProvider for better separation of concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelLocationService = void 0;
exports.isPanelLocation = isPanelLocation;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
/**
 * Type guard to check if a value is a valid PanelLocation
 */
function isPanelLocation(value) {
    return value === 'sidebar' || value === 'panel';
}
/**
 * Panel Location Service
 *
 * Responsibilities:
 * - Panel location detection and caching
 * - Split direction determination based on layout
 * - Context key management for VS Code when clauses
 * - Panel location change notifications
 */
class PanelLocationService {
    constructor(sendMessage) {
        this._disposables = [];
        /**
         * Cached panel location reported by WebView
         */
        this._cachedPanelLocation = 'sidebar';
        /**
         * Debounce timer for panel location detection requests
         */
        this._detectionDebounceTimer = null;
        this._sendMessage = sendMessage;
    }
    /**
     * Initialize panel location detection
     *
     * 🎯 OPTIMIZATION: Defers initial detection to WebView DOM ready
     * This prevents premature detection that causes layout issues
     *
     * 🎯 VS Code Pattern: Visibility listener consolidated in SecondaryTerminalProvider
     * No longer registers duplicate visibility listener here
     */
    async initialize(_webviewView) {
        // Set up configuration change listener
        this._setupConfigurationListener();
        // 🎯 REMOVED: Visibility listener consolidated in SecondaryTerminalProvider
        // Following VS Code ViewPane pattern for single visibility handler
        // if (webviewView) {
        //   this._setupVisibilityListener(webviewView);
        // }
        // 🎯 REMOVED: Don't request detection immediately
        // Let WebView detect autonomously when DOM is ready
        // await this.requestPanelLocationDetection();
        (0, logger_1.provider)('📍 [PANEL-DETECTION] Panel location service initialized (detection deferred to WebView)');
    }
    /**
     * Handle panel location report from WebView
     *
     * 🎯 OPTIMIZATION: Removed redundant panelLocationUpdate message
     * WebView now applies changes autonomously without Extension confirmation
     */
    async handlePanelLocationReport(location, onLocationChange) {
        (0, logger_1.provider)('📍 [DEBUG] ==================== PANEL LOCATION REPORT ====================');
        (0, logger_1.provider)('📍 [DEBUG] Panel location reported from WebView:', location);
        (0, logger_1.provider)('📍 [DEBUG] Previous cached location:', this._cachedPanelLocation);
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const manualPanelLocation = config.get(PanelLocationService.CONFIG_KEYS.PANEL_LOCATION, 'auto');
        // Manual mode: always use configured location, never WebView-reported location.
        // This prevents layout oscillation and maximize cancellation when WebView dimensions
        // are interpreted differently from the user's explicit setting.
        const effectiveLocation = manualPanelLocation !== 'auto'
            ? manualPanelLocation
            : isPanelLocation(location)
                ? location
                : (() => {
                    (0, logger_1.provider)('⚠️ [DEBUG] Invalid or missing panel location:', location);
                    return this._cachedPanelLocation;
                })();
        if (manualPanelLocation !== 'auto' && location !== effectiveLocation) {
            (0, logger_1.provider)(`📍 [DEBUG] Manual panelLocation=${manualPanelLocation}; ignoring reported location=${String(location)}`);
        }
        if (manualPanelLocation === 'auto' && !isPanelLocation(location)) {
            return;
        }
        // Store previous location for change detection
        const previousLocation = this._cachedPanelLocation;
        // Cache the panel location for split direction determination
        this._cachedPanelLocation = effectiveLocation;
        (0, logger_1.provider)('📍 [DEBUG] ✅ Cached panel location UPDATED:', effectiveLocation);
        // Only call setContext when location actually changes and panel location is manually controlled.
        // In auto mode, setContext can trigger VS Code layout recalculation and cancel maximized secondary sidebar.
        if (previousLocation !== effectiveLocation) {
            const shouldUpdateContext = manualPanelLocation !== 'auto';
            if (shouldUpdateContext) {
                await vscode.commands.executeCommand('setContext', PanelLocationService.CONTEXT_KEY, effectiveLocation);
                (0, logger_1.provider)('📍 [DEBUG] Context key updated with NEW panel location:', effectiveLocation);
            }
            else {
                (0, logger_1.provider)('📍 [DEBUG] Auto mode detected, skipping setContext update');
            }
            // Notify caller if location changed
            if (onLocationChange) {
                (0, logger_1.provider)(`🔄 [RELAYOUT] Location changed: ${previousLocation} → ${effectiveLocation}`);
                await onLocationChange(previousLocation, effectiveLocation);
            }
        }
        else {
            (0, logger_1.provider)('📍 [DEBUG] ⏭️ Panel location unchanged, skipping setContext');
        }
        (0, logger_1.provider)('📍 [DEBUG] ===============================================================');
    }
    /**
     * Request panel location detection from WebView (with debouncing)
     *
     * 🎯 OPTIMIZATION: Debounced to prevent multiple rapid requests
     */
    async requestPanelLocationDetection() {
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const manualPanelLocation = config.get(PanelLocationService.CONFIG_KEYS.PANEL_LOCATION, 'auto');
        // Clear existing timer
        if (this._detectionDebounceTimer) {
            clearTimeout(this._detectionDebounceTimer);
            this._detectionDebounceTimer = null;
        }
        if (manualPanelLocation !== 'auto') {
            (0, logger_1.provider)(`📍 [PANEL-DETECTION] Manual panelLocation=${manualPanelLocation}; skipping WebView detection request`);
            return;
        }
        // Schedule new detection request
        this._detectionDebounceTimer = setTimeout(async () => {
            try {
                (0, logger_1.provider)('📍 [PANEL-DETECTION] Requesting panel location detection from WebView (debounced)');
                await this._sendMessage({
                    command: 'requestPanelLocationDetection',
                });
            }
            catch (error) {
                (0, logger_1.provider)('⚠️ [PANEL-DETECTION] Error requesting panel location detection:', error);
                // On detection failure, do NOT call setContext as a fallback.
                // - auto mode: setContext triggers layout recalculation → cancels maximize
                // - manual mode: user's explicit setting is used by getCurrentPanelLocation(),
                //   so overriding context key would contradict their preference
                // The cached value remains valid; detection will retry on next visibility cycle.
            }
        }, PanelLocationService.DEBOUNCE_DELAY);
    }
    /**
     * Determine split direction based on current panel location
     *
     * @returns Optimal split direction for current layout
     */
    determineSplitDirection() {
        (0, logger_1.provider)('🔀 [SPLIT] ==================== DETERMINE SPLIT DIRECTION ====================');
        (0, logger_1.provider)(`🔀 [SPLIT] _cachedPanelLocation value: ${this._cachedPanelLocation}`);
        const panelLocation = this.getCurrentPanelLocation();
        (0, logger_1.provider)(`🔀 [SPLIT] getCurrentPanelLocation() returned: ${panelLocation}`);
        // Map panel location to split direction
        // Sidebar (tall/narrow) → vertical split → column layout (terminals stacked)
        // Panel (wide/short) → horizontal split → row layout (terminals side by side)
        const splitDirection = panelLocation === 'panel' ? 'horizontal' : 'vertical';
        (0, logger_1.provider)(`🔀 [SPLIT] Mapping logic: ${panelLocation} === 'panel' ? 'horizontal' : 'vertical'`);
        (0, logger_1.provider)(`🔀 [SPLIT] ✅ Result: ${splitDirection}`);
        (0, logger_1.provider)(`🔀 [SPLIT] Expected behavior: ${panelLocation === 'panel' ? '横並び (side by side)' : '縦並び (stacked)'}`);
        (0, logger_1.provider)('🔀 [SPLIT] ====================================================================');
        return splitDirection;
    }
    /**
     * Get current panel location
     *
     * Determines panel location by checking:
     * 1. If dynamic split direction is disabled → return 'sidebar'
     * 2. If manual location is set → return manual value
     * 3. Otherwise → return cached location from WebView detection
     */
    getCurrentPanelLocation() {
        (0, logger_1.provider)('📍 [PANEL-DETECTION] ==================== GET CURRENT PANEL LOCATION ====================');
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const { DYNAMIC_SPLIT_DIRECTION, PANEL_LOCATION } = PanelLocationService.CONFIG_KEYS;
        // Check if dynamic split direction feature is enabled
        const isDynamicSplitEnabled = config.get(DYNAMIC_SPLIT_DIRECTION, true);
        (0, logger_1.provider)(`📍 [PANEL-DETECTION] Dynamic split direction enabled: ${isDynamicSplitEnabled}`);
        if (!isDynamicSplitEnabled) {
            (0, logger_1.provider)('📍 [PANEL-DETECTION] ❌ Dynamic split direction is DISABLED, defaulting to sidebar');
            (0, logger_1.provider)('📍 [PANEL-DETECTION] ==========================================================================');
            return 'sidebar';
        }
        // Get manual panel location setting
        const manualPanelLocation = config.get(PANEL_LOCATION, 'auto');
        (0, logger_1.provider)(`📍 [PANEL-DETECTION] Manual panel location setting: ${manualPanelLocation}`);
        if (manualPanelLocation !== 'auto') {
            (0, logger_1.provider)(`📍 [PANEL-DETECTION] ✅ Using MANUAL panel location: ${manualPanelLocation}`);
            (0, logger_1.provider)('📍 [PANEL-DETECTION] ==========================================================================');
            return manualPanelLocation;
        }
        // For auto-detection, use cached value from WebView
        (0, logger_1.provider)(`📍 [PANEL-DETECTION] AUTO mode - using cached value: ${this._cachedPanelLocation}`);
        (0, logger_1.provider)('📍 [PANEL-DETECTION] ==========================================================================');
        return this._cachedPanelLocation;
    }
    /**
     * Get cached panel location
     */
    getCachedPanelLocation() {
        return this._cachedPanelLocation;
    }
    /**
     * Set up configuration change listener
     */
    _setupConfigurationListener() {
        this._disposables.push(vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('secondaryTerminal.panelLocation')) {
                (0, logger_1.provider)('📍 [PANEL-DETECTION] Panel location setting changed - requesting detection');
                void this.requestPanelLocationDetection();
            }
            if (event.affectsConfiguration('secondaryTerminal.dynamicSplitDirection')) {
                (0, logger_1.provider)('📍 [PANEL-DETECTION] Dynamic split direction setting changed - requesting detection');
                void this.requestPanelLocationDetection();
            }
        }));
    }
    /**
     * 🎯 REMOVED: Visibility listener consolidated in SecondaryTerminalProvider
     * Following VS Code ViewPane pattern for single visibility handler
     * This duplicate listener has been replaced by SecondaryTerminalProvider._registerVisibilityListener()
     *
     * private _setupVisibilityListener(webviewView: vscode.WebviewView): void {
     *   if (webviewView.onDidChangeVisibility) {
     *     this._disposables.push(
     *       webviewView.onDidChangeVisibility(() => {
     *         setTimeout(() => {
     *           log('📍 [PANEL-DETECTION] Visibility change detected - requesting detection');
     *           void this.requestPanelLocationDetection();
     *         }, 100);
     *       })
     *     );
     *   }
     * }
     */
    /**
     * Clean up resources
     */
    dispose() {
        // Clear debounce timer
        if (this._detectionDebounceTimer) {
            clearTimeout(this._detectionDebounceTimer);
            this._detectionDebounceTimer = null;
        }
        this._disposables.forEach((d) => d.dispose());
    }
}
exports.PanelLocationService = PanelLocationService;
/**
 * Configuration keys for panel location settings
 */
PanelLocationService.CONFIG_KEYS = {
    DYNAMIC_SPLIT_DIRECTION: 'dynamicSplitDirection',
    PANEL_LOCATION: 'panelLocation',
};
/**
 * VS Code context key for panel location
 */
PanelLocationService.CONTEXT_KEY = 'secondaryTerminal.panelLocation';
/**
 * Debounce delay for panel location detection requests (ms)
 */
PanelLocationService.DEBOUNCE_DELAY = 300;
//# sourceMappingURL=PanelLocationService.js.map