"use strict";
/**
 * FontSettingsService - Single source of truth for font settings management
 *
 * This service centralizes all font-related settings management to prevent
 * synchronization issues between different components.
 *
 * Responsibilities:
 * - Store and manage current font settings (single source of truth)
 * - Apply font settings to terminal instances
 * - Validate and normalize font settings
 * - Notify subscribers when font settings change
 *
 * Architecture:
 * ```
 * Extension (fontSettingsUpdate message)
 *     ↓
 * FontSettingsService.updateFontSettings()
 *     ↓
 * ├── Store in currentFontSettings (single source)
 * ├── Apply to all existing terminals via UIManager
 * └── Notify subscribers (ConfigManager, etc.)
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontSettingsService = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Detect platform for platform-specific defaults
 */
const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac'))
        return 'darwin';
    if (userAgent.includes('linux'))
        return 'linux';
    return 'win32';
};
/**
 * Default font settings following VS Code terminal defaults
 * Platform-specific adjustments:
 * - macOS: 12px font size (VS Code default)
 * - Linux: lineHeight 1.1 (better underline rendering)
 * - Windows/Other: 14px font size, lineHeight 1.0
 *
 * @see https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/terminal/common/terminalConfiguration.ts
 */
const getDefaultFontSettings = () => {
    const platform = detectPlatform();
    return {
        fontSize: platform === 'darwin' ? 12 : 14,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontWeight: 'normal',
        fontWeightBold: 'bold',
        lineHeight: platform === 'linux' ? 1.1 : 1.0,
        letterSpacing: 0,
    };
};
const DEFAULT_FONT_SETTINGS = getDefaultFontSettings();
/**
 * Font settings validation constraints
 */
const FONT_CONSTRAINTS = {
    MIN_FONT_SIZE: 8,
    MAX_FONT_SIZE: 72,
    VALID_FONT_WEIGHTS: [
        'normal',
        'bold',
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
    ],
};
/**
 * FontSettingsService
 *
 * Centralized service for managing font settings across the WebView.
 * Implements the Single Responsibility Principle by handling only font-related concerns.
 */
class FontSettingsService {
    constructor(initialSettings) {
        this.listeners = new Set();
        this.applicator = null;
        this.currentSettings = this.validateAndNormalize({
            ...DEFAULT_FONT_SETTINGS,
            ...initialSettings,
        });
        (0, logger_1.webview)('🔤 [FontSettingsService] Initialized with settings:', this.currentSettings);
    }
    /**
     * Set the font settings applicator (typically UIManager)
     */
    setApplicator(applicator) {
        this.applicator = applicator;
        (0, logger_1.webview)('🔤 [FontSettingsService] Applicator set');
    }
    /**
     * Get current font settings (immutable copy)
     */
    getCurrentSettings() {
        return { ...this.currentSettings };
    }
    /**
     * Update font settings and apply to all terminals
     *
     * This is the main entry point for font settings updates.
     * It validates, stores, applies, and notifies in a single atomic operation.
     */
    updateSettings(newSettings, terminals) {
        const previousSettings = { ...this.currentSettings };
        // Merge and validate new settings
        const mergedSettings = {
            ...this.currentSettings,
            ...newSettings,
        };
        this.currentSettings = this.validateAndNormalize(mergedSettings);
        (0, logger_1.webview)('🔤 [FontSettingsService] Settings updated:', {
            previous: previousSettings,
            new: this.currentSettings,
        });
        // Apply to all existing terminals
        this.applyToAllTerminals(terminals);
        // Notify listeners
        this.notifyListeners(previousSettings, this.currentSettings);
    }
    /**
     * Apply current font settings to a single terminal
     */
    applyToTerminal(terminal, terminalId) {
        if (!this.applicator) {
            (0, logger_1.webview)('⚠️ [FontSettingsService] No applicator set, cannot apply font settings');
            return;
        }
        try {
            this.applicator.applyFontSettings(terminal, this.currentSettings);
            (0, logger_1.webview)(`🔤 [FontSettingsService] Applied font settings to terminal: ${terminalId}`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ [FontSettingsService] Failed to apply font to terminal ${terminalId}:`, error);
        }
    }
    /**
     * Apply current font settings to all terminals
     *
     * 🔧 CRITICAL FIX: After applying font settings, call fitAddon.fit() to recalculate
     * terminal dimensions based on the new font size. Without this, the terminal
     * may not display correctly (e.g., Nerd Font icons may not show).
     */
    applyToAllTerminals(terminals) {
        if (!this.applicator) {
            (0, logger_1.webview)('⚠️ [FontSettingsService] No applicator set, cannot apply font settings');
            return;
        }
        let successCount = 0;
        let errorCount = 0;
        terminals.forEach((instance, terminalId) => {
            try {
                this.applicator.applyFontSettings(instance.terminal, this.currentSettings);
                // 🔧 CRITICAL FIX: Call fit() after applying font settings
                // xterm.js needs to recalculate dimensions when font changes
                if (instance.fitAddon) {
                    try {
                        instance.fitAddon.fit();
                        // Also refresh to ensure rendering is updated
                        instance.terminal.refresh(0, instance.terminal.rows - 1);
                    }
                    catch (fitError) {
                        (0, logger_1.webview)(`⚠️ [FontSettingsService] fit() failed for terminal ${terminalId}:`, fitError);
                    }
                }
                successCount++;
            }
            catch (error) {
                (0, logger_1.webview)(`❌ [FontSettingsService] Failed to apply font to terminal ${terminalId}:`, error);
                errorCount++;
            }
        });
        (0, logger_1.webview)(`🔤 [FontSettingsService] Applied font settings to ${successCount} terminals (${errorCount} errors)`);
    }
    /**
     * Subscribe to font settings changes
     */
    onSettingsChange(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Validate and normalize font settings
     */
    validateAndNormalize(settings) {
        const normalized = {
            ...DEFAULT_FONT_SETTINGS,
            fontSize: settings.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize,
            fontFamily: settings.fontFamily ?? DEFAULT_FONT_SETTINGS.fontFamily,
        };
        // Font size validation
        if (typeof settings.fontSize === 'number') {
            normalized.fontSize = Math.max(FONT_CONSTRAINTS.MIN_FONT_SIZE, Math.min(FONT_CONSTRAINTS.MAX_FONT_SIZE, Math.round(settings.fontSize)));
        }
        // Font family validation
        if (typeof settings.fontFamily === 'string' && settings.fontFamily.trim().length > 0) {
            normalized.fontFamily = settings.fontFamily.trim();
        }
        // Optional properties
        if (settings.fontWeight !== undefined) {
            normalized.fontWeight = this.validateFontWeight(settings.fontWeight);
        }
        if (settings.fontWeightBold !== undefined) {
            normalized.fontWeightBold = this.validateFontWeight(settings.fontWeightBold);
        }
        if (typeof settings.lineHeight === 'number' && settings.lineHeight > 0) {
            normalized.lineHeight = settings.lineHeight;
        }
        if (typeof settings.letterSpacing === 'number') {
            normalized.letterSpacing = settings.letterSpacing;
        }
        return normalized;
    }
    /**
     * Validate font weight value
     */
    validateFontWeight(weight) {
        if (weight === undefined) {
            return 'normal';
        }
        const weightStr = String(weight);
        const validWeights = FONT_CONSTRAINTS.VALID_FONT_WEIGHTS;
        if (validWeights.includes(weightStr)) {
            return weightStr;
        }
        return 'normal';
    }
    /**
     * Notify all listeners of settings change
     */
    notifyListeners(previousSettings, newSettings) {
        const event = {
            previousSettings,
            newSettings,
            timestamp: Date.now(),
        };
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            }
            catch (error) {
                (0, logger_1.webview)('❌ [FontSettingsService] Error in change listener:', error);
            }
        });
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.listeners.clear();
        this.applicator = null;
        (0, logger_1.webview)('🧹 [FontSettingsService] Disposed');
    }
}
exports.FontSettingsService = FontSettingsService;
//# sourceMappingURL=FontSettingsService.js.map