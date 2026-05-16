"use strict";
/**
 * Feature Flag Service - VS Code Standard Terminal Features
 * Manages feature flags for gradual rollout of VS Code-compatible terminal features
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
const vscode = require("vscode");
const DisposableStore_1 = require("../utils/DisposableStore");
/**
 * Default feature flag values (Phase 1-5: disabled by default, Phase 7: enabled)
 */
const DEFAULT_FEATURE_FLAGS = {
    // Scrollback features
    enhancedScrollbackPersistence: true, // Default enabled to match VS Code persistence
    scrollbackLineLimit: 1000,
    // Input features
    vscodeStandardIME: true, // Default enabled to match VS Code IME handling
    vscodeKeyboardShortcuts: true, // Already stable
    // Display features
    vscodeStandardCursor: true, // Default enabled to match VS Code cursor behaviour
    fullANSISupport: true, // Already stable
};
/**
 * Configuration section for feature flags
 */
const FEATURE_FLAG_SECTION = 'secondaryTerminal.features';
/**
 * Service for managing VS Code standard terminal feature flags
 */
class FeatureFlagService {
    constructor() {
        this.flagCache = new Map();
        this._disposables = new DisposableStore_1.DisposableStore();
        // Listen for configuration changes and invalidate cache
        this._disposables.add(vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(FEATURE_FLAG_SECTION)) {
                this.invalidateCache();
            }
        }));
    }
    /**
     * Get feature flag configuration
     */
    getFeatureFlags() {
        const config = vscode.workspace.getConfiguration(FEATURE_FLAG_SECTION);
        return {
            enhancedScrollbackPersistence: this.getCachedFlag('enhancedScrollbackPersistence', config.get('enhancedScrollbackPersistence', DEFAULT_FEATURE_FLAGS.enhancedScrollbackPersistence)),
            scrollbackLineLimit: this.validateScrollbackLimit(this.getCachedFlag('scrollbackLineLimit', config.get('scrollbackLineLimit', DEFAULT_FEATURE_FLAGS.scrollbackLineLimit))),
            vscodeStandardIME: this.getCachedFlag('vscodeStandardIME', config.get('vscodeStandardIME', DEFAULT_FEATURE_FLAGS.vscodeStandardIME)),
            vscodeKeyboardShortcuts: this.getCachedFlag('vscodeKeyboardShortcuts', config.get('vscodeKeyboardShortcuts', DEFAULT_FEATURE_FLAGS.vscodeKeyboardShortcuts)),
            vscodeStandardCursor: this.getCachedFlag('vscodeStandardCursor', config.get('vscodeStandardCursor', DEFAULT_FEATURE_FLAGS.vscodeStandardCursor)),
            fullANSISupport: this.getCachedFlag('fullANSISupport', config.get('fullANSISupport', DEFAULT_FEATURE_FLAGS.fullANSISupport)),
        };
    }
    /**
     * Check if enhanced scrollback persistence is enabled
     */
    isEnhancedScrollbackEnabled() {
        return this.getFeatureFlags().enhancedScrollbackPersistence;
    }
    /**
     * Get scrollback line limit (clamped to 200-3000)
     */
    getScrollbackLineLimit() {
        return this.getFeatureFlags().scrollbackLineLimit;
    }
    /**
     * Check if VS Code standard IME is enabled
     */
    isVSCodeStandardIMEEnabled() {
        return this.getFeatureFlags().vscodeStandardIME;
    }
    /**
     * Check if VS Code keyboard shortcuts are enabled
     */
    isVSCodeKeyboardShortcutsEnabled() {
        return this.getFeatureFlags().vscodeKeyboardShortcuts;
    }
    /**
     * Check if VS Code standard cursor is enabled
     */
    isVSCodeStandardCursorEnabled() {
        return this.getFeatureFlags().vscodeStandardCursor;
    }
    /**
     * Check if full ANSI support is enabled
     */
    isFullANSISupportEnabled() {
        return this.getFeatureFlags().fullANSISupport;
    }
    /**
     * Get cached flag value with type safety
     */
    getCachedFlag(key, defaultValue) {
        if (!this.flagCache.has(key)) {
            this.flagCache.set(key, defaultValue);
        }
        return this.flagCache.get(key);
    }
    /**
     * Validate and clamp scrollback line limit to allowed range
     */
    validateScrollbackLimit(limit) {
        const MIN_SCROLLBACK = 200;
        const MAX_SCROLLBACK = 3000;
        if (limit < MIN_SCROLLBACK) {
            vscode.window.showWarningMessage(`Scrollback line limit ${limit} is below minimum ${MIN_SCROLLBACK}. Using ${MIN_SCROLLBACK}.`);
            return MIN_SCROLLBACK;
        }
        if (limit > MAX_SCROLLBACK) {
            vscode.window.showWarningMessage(`Scrollback line limit ${limit} exceeds maximum ${MAX_SCROLLBACK}. Using ${MAX_SCROLLBACK}.`);
            return MAX_SCROLLBACK;
        }
        return limit;
    }
    /**
     * Invalidate cache (called on configuration changes)
     */
    invalidateCache() {
        this.flagCache.clear();
    }
    /**
     * Get feature flag summary for logging/debugging
     */
    getFeatureFlagSummary() {
        const flags = this.getFeatureFlags();
        return JSON.stringify(flags, null, 2);
    }
    /**
     * Dispose service and clean up listeners
     */
    dispose() {
        this._disposables.dispose();
        this.flagCache.clear();
    }
}
exports.FeatureFlagService = FeatureFlagService;
//# sourceMappingURL=FeatureFlagService.js.map