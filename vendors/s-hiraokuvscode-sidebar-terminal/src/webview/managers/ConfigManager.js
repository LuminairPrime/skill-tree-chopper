"use strict";
/**
 * Config Manager - Handles settings management, persistence, and configuration updates
 *
 * Note: Font settings are managed by FontSettingsService (single source of truth).
 * ConfigManager provides getCurrentFontSettings() for compatibility but delegates
 * to FontSettingsService when available.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const logger_1 = require("../../utils/logger");
const webview_1 = require("../constants/webview");
/**
 * Validation limits for settings
 */
const ValidationLimits = {
    FONT_SIZE: { min: 8, max: 72 },
    SCROLLBACK: { min: 0, max: 100000 },
    MAX_TERMINALS: { min: 1, max: webview_1.SPLIT_CONSTANTS.MAX_TERMINALS },
};
/**
 * Allowed values for enumerated settings
 */
const AllowedValues = {
    THEME: ['light', 'dark', 'auto'],
    MULTI_CURSOR_MODIFIER: ['alt', 'ctrl', 'cmd'],
    CURSOR_STYLE: ['block', 'underline', 'bar'],
    ACTIVE_BORDER_MODE: ['none', 'always', 'multipleOnly'],
    PANEL_LOCATION: ['auto', 'sidebar', 'panel'],
};
/**
 * Validation helper functions
 */
const Validators = {
    /**
     * Validates a number is within a range, returns rounded value or default
     */
    numberInRange(value, limits, defaultValue) {
        if (typeof value === 'number' && value >= limits.min && value <= limits.max) {
            return Math.round(value);
        }
        return defaultValue;
    },
    /**
     * Validates a non-empty string, returns trimmed value or default
     */
    nonEmptyString(value, defaultValue) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
        return defaultValue;
    },
    /**
     * Validates a string is in an allowed list, returns value or default
     */
    stringInList(value, allowedValues, defaultValue) {
        if (typeof value === 'string' && allowedValues.includes(value)) {
            return value;
        }
        return defaultValue;
    },
    /**
     * Validates a boolean, returns value or default
     */
    boolean(value, defaultValue) {
        return typeof value === 'boolean' ? value : defaultValue;
    },
    /**
     * Validates an optional string (can be empty)
     */
    optionalString(value, defaultValue) {
        return typeof value === 'string' ? value : defaultValue;
    },
    /**
     * Validates a string array
     */
    stringArray(value, defaultValue) {
        if (Array.isArray(value)) {
            return value.filter((item) => typeof item === 'string');
        }
        return defaultValue;
    },
};
class ConfigManager {
    constructor() {
        // Font settings service reference (single source of truth)
        this.fontSettingsService = null;
        // Settings validation schema (single source of truth for defaults)
        // Default theme to 'auto' to detect VS Code theme instead of hardcoding dark
        this.DEFAULTS = {
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            theme: 'auto',
            cursorBlink: true,
            enableCliAgentIntegration: true,
            enableTerminalHeaderEnhancements: true,
            // Terminal profiles (will be populated from VS Code settings)
            profilesWindows: {},
            profilesLinux: {},
            profilesOsx: {},
            defaultProfileWindows: null,
            defaultProfileLinux: null,
            defaultProfileOsx: null,
            inheritVSCodeProfiles: true,
            enableProfileAutoDetection: true,
            scrollback: 2000, // Match package.json default
            activeBorderMode: 'multipleOnly',
            bellSound: false,
            altClickMovesCursor: false,
            multiCursorModifier: 'alt',
            sendKeybindingsToShell: false,
            commandsToSkipShell: [],
            allowChords: true,
            allowMnemonics: true,
            shell: '',
            shellArgs: [],
            cwd: '',
            defaultDirectory: '',
            maxTerminals: webview_1.SPLIT_CONSTANTS.MAX_TERMINALS,
            cursor: {
                style: 'block',
                blink: true,
            },
            // 🆕 Issue #148: Dynamic split direction settings
            dynamicSplitDirection: true,
            panelLocation: 'auto',
        };
        // Font settings validation defaults
        this.FONT_DEFAULTS = {
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            fontWeight: 'normal',
            fontWeightBold: 'bold',
            lineHeight: 1.0,
            letterSpacing: 0,
            cursorStyle: 'block',
            cursorWidth: 1,
            drawBoldTextInBrightColors: true,
            minimumContrastRatio: 1,
        };
        // Initialize from defaults to avoid duplication
        this.currentSettings = { ...this.DEFAULTS };
        this.fallbackFontSettings = { ...this.FONT_DEFAULTS };
    }
    /**
     * Set FontSettingsService reference for delegation
     * This enables single source of truth for font settings
     */
    setFontSettingsService(service) {
        this.fontSettingsService = service;
        (0, logger_1.webview)('⚙️ [CONFIG] FontSettingsService connected');
    }
    /**
     * Load settings from VS Code state with fallbacks
     */
    loadSettings() {
        try {
            const state = vscode.getState();
            const savedSettings = state?.terminalSettings;
            if (savedSettings) {
                this.currentSettings = this.validateAndNormalizeSettings(savedSettings);
                (0, logger_1.webview)('⚙️ [CONFIG] Settings loaded from VS Code state:', this.currentSettings);
            }
            else {
                this.currentSettings = { ...this.DEFAULTS };
                (0, logger_1.webview)('⚙️ [CONFIG] Using default settings');
            }
            this.updateFontSettingsFromGeneral();
            return { ...this.currentSettings };
        }
        catch (error) {
            (0, logger_1.webview)('❌ [CONFIG] Error loading settings, using defaults:', error);
            this.currentSettings = { ...this.DEFAULTS };
            this.updateFontSettingsFromGeneral();
            return { ...this.currentSettings };
        }
    }
    /**
     * Save settings to VS Code state
     */
    saveSettings(settings) {
        try {
            const validatedSettings = this.validateAndNormalizeSettings(settings);
            this.currentSettings = validatedSettings;
            const state = vscode.getState() || {};
            vscode.setState({
                ...state,
                terminalSettings: this.currentSettings,
            });
            this.updateFontSettingsFromGeneral();
            (0, logger_1.webview)('⚙️ [CONFIG] Settings saved:', this.currentSettings);
        }
        catch (error) {
            (0, logger_1.webview)('❌ [CONFIG] Error saving settings:', error);
        }
    }
    /**
     * Apply settings to all terminals
     */
    applySettings(settings, terminals) {
        const validatedSettings = this.validateAndNormalizeSettings(settings);
        this.currentSettings = validatedSettings;
        // Apply to each terminal
        terminals.forEach((terminalData, terminalId) => {
            try {
                const terminal = terminalData.terminal;
                // Apply theme
                if (validatedSettings.theme) {
                    // Theme application would be handled by UIManager
                    (0, logger_1.webview)(`⚙️ [CONFIG] Theme setting for terminal ${terminalId}: ${validatedSettings.theme}`);
                }
                // Apply cursor settings
                if (validatedSettings.cursorBlink !== undefined) {
                    terminal.options.cursorBlink = validatedSettings.cursorBlink;
                }
                // Apply scrollback
                if (validatedSettings.scrollback !== undefined) {
                    terminal.options.scrollback = validatedSettings.scrollback;
                }
                // Bell sound is not supported in xterm.js options
                // Terminal bell handling would be implemented differently
                // Apply Alt+Click setting (VS Code standard)
                if (validatedSettings.altClickMovesCursor !== undefined) {
                    terminal.options.altClickMovesCursor =
                        validatedSettings.altClickMovesCursor &&
                            validatedSettings.multiCursorModifier === 'alt';
                }
                (0, logger_1.webview)(`⚙️ [CONFIG] Settings applied to terminal ${terminalId}`);
            }
            catch (error) {
                (0, logger_1.webview)(`❌ [CONFIG] Error applying settings to terminal ${terminalId}:`, error);
            }
        });
        this.updateFontSettingsFromGeneral();
        (0, logger_1.webview)('⚙️ [CONFIG] Settings applied to all terminals');
    }
    /**
     * Apply font settings to all terminals
     *
     * @deprecated Use FontSettingsService.updateSettings() instead.
     * This method is kept for backward compatibility but actual font application
     * should go through FontSettingsService.
     */
    applyFontSettings(fontSettings, _terminals) {
        const validatedFontSettings = this.validateAndNormalizeFontSettings(fontSettings);
        // Update fallback cache for when FontSettingsService is not available
        this.fallbackFontSettings = validatedFontSettings;
        // Update general settings (create new object due to readonly properties)
        this.currentSettings = {
            ...this.currentSettings,
            fontSize: validatedFontSettings.fontSize,
            fontFamily: validatedFontSettings.fontFamily,
        };
        // Note: Actual terminal font application is handled by FontSettingsService
        // This method only updates ConfigManager's internal caches
        (0, logger_1.webview)('⚙️ [CONFIG] Font settings cache updated (actual application via FontSettingsService)');
    }
    /**
     * Get current settings
     */
    getCurrentSettings() {
        return { ...this.currentSettings };
    }
    /**
     * Get current font settings
     *
     * Delegates to FontSettingsService when available (single source of truth).
     * Falls back to local cache if service is not connected.
     */
    getCurrentFontSettings() {
        // Prefer FontSettingsService (single source of truth)
        if (this.fontSettingsService) {
            const settings = this.fontSettingsService.getCurrentSettings();
            (0, logger_1.webview)(`🔤 [CONFIG] getCurrentFontSettings from FontSettingsService: ${settings.fontFamily}, ${settings.fontSize}px`);
            return settings;
        }
        // Fallback for backward compatibility
        (0, logger_1.webview)(`🔤 [CONFIG] getCurrentFontSettings FALLBACK: ${this.fallbackFontSettings.fontFamily}, ${this.fallbackFontSettings.fontSize}px`);
        return { ...this.fallbackFontSettings };
    }
    /**
     * Update Alt+Click setting for all terminals
     */
    updateAltClickSetting(terminals, settings) {
        const altClickEnabled = settings.altClickMovesCursor ?? false;
        const multiCursorModifier = settings.multiCursorModifier ?? 'alt';
        const isVSCodeStandard = altClickEnabled && multiCursorModifier === 'alt';
        terminals.forEach((terminalData, terminalId) => {
            try {
                terminalData.terminal.options.altClickMovesCursor = isVSCodeStandard;
                (0, logger_1.webview)(`⚙️ [CONFIG] Alt+Click setting updated for terminal ${terminalId}: ${isVSCodeStandard}`);
            }
            catch (error) {
                (0, logger_1.webview)(`❌ [CONFIG] Error updating Alt+Click for terminal ${terminalId}:`, error);
            }
        });
        // Update current settings (create new object since properties are readonly)
        this.currentSettings = {
            ...this.currentSettings,
            altClickMovesCursor: altClickEnabled,
            multiCursorModifier: multiCursorModifier,
        };
        (0, logger_1.webview)(`⚙️ [CONFIG] Alt+Click setting updated globally: ${isVSCodeStandard} (altClick: ${altClickEnabled}, modifier: ${multiCursorModifier})`);
    }
    /**
     * Validate and normalize settings with fallbacks
     */
    validateAndNormalizeSettings(settings) {
        return {
            // Numeric settings with range validation
            fontSize: Validators.numberInRange(settings.fontSize, ValidationLimits.FONT_SIZE, this.DEFAULTS.fontSize),
            scrollback: Validators.numberInRange(settings.scrollback, ValidationLimits.SCROLLBACK, this.DEFAULTS.scrollback),
            maxTerminals: Validators.numberInRange(settings.maxTerminals, ValidationLimits.MAX_TERMINALS, this.DEFAULTS.maxTerminals),
            // String settings requiring non-empty values
            fontFamily: Validators.nonEmptyString(settings.fontFamily, this.DEFAULTS.fontFamily),
            // Enumerated string settings
            theme: Validators.stringInList(settings.theme, AllowedValues.THEME, this.DEFAULTS.theme),
            multiCursorModifier: Validators.stringInList(settings.multiCursorModifier, AllowedValues.MULTI_CURSOR_MODIFIER, this.DEFAULTS.multiCursorModifier),
            // Boolean settings
            cursorBlink: Validators.boolean(settings.cursorBlink, this.DEFAULTS.cursorBlink),
            bellSound: Validators.boolean(settings.bellSound, this.DEFAULTS.bellSound),
            altClickMovesCursor: Validators.boolean(settings.altClickMovesCursor, this.DEFAULTS.altClickMovesCursor),
            enableCliAgentIntegration: Validators.boolean(settings.enableCliAgentIntegration, this.DEFAULTS.enableCliAgentIntegration),
            enableTerminalHeaderEnhancements: Validators.boolean(settings.enableTerminalHeaderEnhancements, this.DEFAULTS.enableTerminalHeaderEnhancements),
            // Enumerated string settings (with restricted values)
            activeBorderMode: Validators.stringInList(settings.activeBorderMode, AllowedValues.ACTIVE_BORDER_MODE, this.DEFAULTS.activeBorderMode),
            panelLocation: Validators.stringInList(settings.panelLocation, AllowedValues.PANEL_LOCATION, this.DEFAULTS.panelLocation),
            // Optional string settings (can be empty)
            shell: Validators.optionalString(settings.shell, this.DEFAULTS.shell),
            cwd: Validators.optionalString(settings.cwd, this.DEFAULTS.cwd),
            defaultDirectory: Validators.optionalString(settings.defaultDirectory, this.DEFAULTS.defaultDirectory),
            // Array settings
            shellArgs: Validators.stringArray(settings.shellArgs, this.DEFAULTS.shellArgs),
            commandsToSkipShell: Validators.stringArray(settings.commandsToSkipShell, this.DEFAULTS.commandsToSkipShell),
            // Additional boolean settings
            dynamicSplitDirection: Validators.boolean(settings.dynamicSplitDirection, this.DEFAULTS.dynamicSplitDirection),
            sendKeybindingsToShell: Validators.boolean(settings.sendKeybindingsToShell, this.DEFAULTS.sendKeybindingsToShell),
            allowChords: Validators.boolean(settings.allowChords, this.DEFAULTS.allowChords),
            allowMnemonics: Validators.boolean(settings.allowMnemonics, this.DEFAULTS.allowMnemonics),
            // Cursor object validation
            cursor: this.validateCursorSettings(settings.cursor),
        };
    }
    /**
     * Validate cursor settings object
     */
    validateCursorSettings(cursor) {
        const defaultStyle = this.DEFAULTS.cursor?.style ?? 'block';
        const defaultBlink = this.DEFAULTS.cursor?.blink ?? true;
        if (cursor && typeof cursor === 'object') {
            return {
                style: Validators.stringInList(cursor.style, AllowedValues.CURSOR_STYLE, defaultStyle),
                blink: Validators.boolean(cursor.blink, defaultBlink),
            };
        }
        return { style: defaultStyle, blink: defaultBlink };
    }
    /**
     * Validate and normalize font settings
     */
    validateAndNormalizeFontSettings(fontSettings) {
        return {
            fontSize: Validators.numberInRange(fontSettings.fontSize, ValidationLimits.FONT_SIZE, this.FONT_DEFAULTS.fontSize),
            fontFamily: Validators.nonEmptyString(fontSettings.fontFamily, this.FONT_DEFAULTS.fontFamily),
        };
    }
    /**
     * Update font settings from general settings
     * Updates the fallback cache for backward compatibility
     */
    updateFontSettingsFromGeneral() {
        this.fallbackFontSettings = {
            fontSize: this.currentSettings.fontSize || this.FONT_DEFAULTS.fontSize,
            fontFamily: this.currentSettings.fontFamily || this.FONT_DEFAULTS.fontFamily,
        };
    }
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.currentSettings = { ...this.DEFAULTS };
        this.updateFontSettingsFromGeneral();
        this.saveSettings(this.currentSettings);
        (0, logger_1.webview)('⚙️ [CONFIG] Settings reset to defaults');
        return { ...this.currentSettings };
    }
    /**
     * Export current settings for backup
     */
    exportSettings() {
        return JSON.stringify({
            settings: this.currentSettings,
            fontSettings: this.getCurrentFontSettings(),
            timestamp: new Date().toISOString(),
        }, null, 2);
    }
    /**
     * Import settings from backup
     */
    importSettings(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.settings) {
                const settings = this.validateAndNormalizeSettings(data.settings);
                this.saveSettings(settings);
                (0, logger_1.webview)('⚙️ [CONFIG] Settings imported from backup');
                return settings;
            }
            else {
                throw new Error('Invalid settings format');
            }
        }
        catch (error) {
            (0, logger_1.webview)('❌ [CONFIG] Error importing settings:', error);
            throw error;
        }
    }
    /**
     * Dispose and cleanup
     */
    dispose() {
        (0, logger_1.webview)('🧹 [CONFIG] Disposing config manager');
        // Save current state before disposal
        this.saveSettings(this.currentSettings);
        (0, logger_1.webview)('✅ [CONFIG] Config manager disposed');
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map