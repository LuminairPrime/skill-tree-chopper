"use strict";
/**
 * Unified Configuration Service
 *
 * Consolidates all configuration management across the extension following VS Code patterns.
 * This service replaces:
 * - src/config/ConfigManager.ts
 * - src/webview/managers/ConfigManager.ts
 * - src/services/core/UnifiedConfigurationService.ts
 * - src/services/webview/WebViewSettingsManagerService.ts
 *
 * Architecture follows VS Code's IConfigurationService pattern with:
 * - Configuration registry for type safety
 * - Hierarchical configuration targets
 * - Event-driven change notifications
 * - Centralized caching and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedConfigurationService = exports.ConfigurationTarget = void 0;
exports.getUnifiedConfigurationService = getUnifiedConfigurationService;
exports.getConfigManager = getConfigManager;
const vscode = require("vscode");
const vscode_1 = require("vscode");
const shared_1 = require("../types/shared");
const SystemConstants_1 = require("../constants/SystemConstants");
const logger_1 = require("../utils/logger");
/**
 * Configuration target priority (higher number = higher priority)
 * Following VS Code's ConfigurationTarget pattern
 */
var ConfigurationTarget;
(function (ConfigurationTarget) {
    ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 0] = "DEFAULT";
    ConfigurationTarget[ConfigurationTarget["APPLICATION"] = 1] = "APPLICATION";
    ConfigurationTarget[ConfigurationTarget["USER"] = 2] = "USER";
    ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 3] = "WORKSPACE";
    ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 4] = "WORKSPACE_FOLDER";
    ConfigurationTarget[ConfigurationTarget["MEMORY"] = 5] = "MEMORY";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
/**
 * Configuration registry following VS Code's IConfigurationRegistry pattern
 */
class ConfigurationRegistry {
    constructor() {
        this._schemas = new Map();
    }
    register(key, schema) {
        this._schemas.set(key, schema);
    }
    getSchema(key) {
        return this._schemas.get(key);
    }
    validate(key, value) {
        const schema = this._schemas.get(key);
        if (!schema) {
            return { isValid: true, errors: [] };
        }
        const errors = [];
        // Type validation
        if (schema.type === 'number' && typeof value !== 'number') {
            errors.push(`Expected number, got ${typeof value}`);
        }
        else if (schema.type === 'string' && typeof value !== 'string') {
            errors.push(`Expected string, got ${typeof value}`);
        }
        else if (schema.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`Expected boolean, got ${typeof value}`);
        }
        else if (schema.type === 'array' && !Array.isArray(value)) {
            errors.push(`Expected array, got ${typeof value}`);
        }
        else if (schema.type === 'object' && (typeof value !== 'object' || value === null)) {
            errors.push(`Expected object, got ${typeof value}`);
        }
        // Range validation for numbers
        if (schema.type === 'number' && typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(`Value ${value} is below minimum ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(`Value ${value} exceeds maximum ${schema.maximum}`);
            }
        }
        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Value ${value} is not one of allowed values: ${schema.enum.join(', ')}`);
        }
        return { isValid: errors.length === 0, errors };
    }
}
/**
 * Unified Configuration Service
 *
 * Single source of truth for all extension configuration management.
 * Follows VS Code's configuration architecture patterns.
 */
class UnifiedConfigurationService {
    /**
     * Get singleton instance following VS Code patterns
     */
    static getInstance() {
        if (!UnifiedConfigurationService._instance) {
            UnifiedConfigurationService._instance = new UnifiedConfigurationService();
        }
        return UnifiedConfigurationService._instance;
    }
    constructor() {
        // Event handling following VS Code patterns
        this._onDidChangeConfiguration = new vscode_1.EventEmitter();
        this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
        // Configuration registry and caching
        this._registry = new ConfigurationRegistry();
        this._configurationCache = new Map();
        this._disposables = [];
        // Cache configuration
        this.CACHE_TTL = SystemConstants_1.CONFIG_CACHE_CONSTANTS.CACHE_TTL_MS;
        this._initialized = false;
        this._registerConfigurationSchemas();
        this._initializeConfigurationWatcher();
        (0, logger_1.terminal)('⚙️ [UnifiedConfig] Unified configuration service initialized');
    }
    /**
     * Initialize the service (ensures proper VS Code API availability)
     */
    initialize() {
        if (this._initialized) {
            return;
        }
        try {
            // Test VS Code API availability
            if (typeof vscode !== 'undefined' && vscode?.workspace) {
                // Test if we can actually use getConfiguration
                vscode.workspace.getConfiguration(); // This should work if API is available
                this._initialized = true;
                (0, logger_1.terminal)('✅ [UnifiedConfig] Service initialized with VS Code API');
            }
            else {
                (0, logger_1.terminal)('⚠️ [UnifiedConfig] VS Code API not available, running in limited mode');
            }
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error during initialization:', error);
        }
    }
    /**
     * Get configuration value with type safety and caching
     */
    get(section, key, defaultValue) {
        const fullKey = `${section}.${key}`;
        // Check cache first
        const cached = this._configurationCache.get(fullKey);
        if (cached && Date.now() < cached.expiry) {
            return cached.value;
        }
        try {
            // Get from VS Code configuration
            const config = vscode.workspace.getConfiguration(section);
            const value = config.get(key, defaultValue);
            // Validate against schema
            const validation = this._registry.validate(fullKey, value);
            if (!validation.isValid) {
                (0, logger_1.terminal)(`⚠️ [UnifiedConfig] Validation failed for ${fullKey}:`, validation.errors);
                // Use default value on validation failure
                return defaultValue;
            }
            // Cache the value
            this._configurationCache.set(fullKey, {
                value,
                expiry: Date.now() + this.CACHE_TTL,
            });
            return value;
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [UnifiedConfig] Error getting ${fullKey}:`, error);
            return defaultValue;
        }
    }
    /**
     * Update configuration value following VS Code patterns
     */
    async update(section, key, value, target = vscode.ConfigurationTarget.Global) {
        const fullKey = `${section}.${key}`;
        try {
            // Validate against schema
            const validation = this._registry.validate(fullKey, value);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            const config = vscode.workspace.getConfiguration(section);
            const oldValue = config.get(key);
            await config.update(key, value, target);
            // Clear cache
            this._configurationCache.delete(fullKey);
            // Fire change event
            this._onDidChangeConfiguration.fire({
                affectsConfiguration: (checkSection, checkKey) => {
                    if (checkKey) {
                        return checkSection === section && checkKey === key;
                    }
                    return checkSection === section;
                },
                source: this._mapVSCodeTargetToConfigTarget(target),
                changedKeys: [fullKey],
                timestamp: Date.now(),
            });
            (0, logger_1.terminal)(`⚙️ [UnifiedConfig] Updated ${fullKey}: ${oldValue} → ${value}`);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [UnifiedConfig] Failed to update ${fullKey}:`, error);
            throw error;
        }
    }
    /**
     * Get extension terminal configuration (replaces ConfigManager.getExtensionTerminalConfig)
     */
    getExtensionTerminalConfig() {
        this.initialize();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            maxTerminals: this.get(section, shared_1.CONFIG_KEYS.MAX_TERMINALS, SystemConstants_1.TERMINAL_CONSTANTS.DEFAULT_MAX_TERMINALS),
            shell: this.get(section, shared_1.CONFIG_KEYS.SHELL, ''),
            shellArgs: this.get(section, shared_1.CONFIG_KEYS.SHELL_ARGS, []),
            defaultDirectory: this.get(section, shared_1.CONFIG_KEYS.DEFAULT_DIRECTORY, ''),
            fontSize: this.getFontSize(),
            fontFamily: this.getFontFamily(),
            cursorBlink: this.get(section, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            cursor: {
                style: 'block',
                blink: this.get(section, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            },
            enableCliAgentIntegration: this.get(section, 'enableCliAgentIntegration', true),
            enableTerminalHeaderEnhancements: this.get(section, 'enableTerminalHeaderEnhancements', true),
            activeBorderMode: this.get(section, 'activeBorderMode', 'multipleOnly'),
        };
    }
    /**
     * Get complete terminal settings (consolidates multiple config methods)
     */
    getCompleteTerminalSettings() {
        this.initialize();
        const sidebarConfig = this.getExtensionTerminalConfig();
        return {
            ...sidebarConfig,
            fontSize: this.getFontSize(),
            fontFamily: this.getFontFamily(),
            theme: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.THEME, 'auto'),
            cursorBlink: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            confirmBeforeKill: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.CONFIRM_BEFORE_KILL, false),
            protectLastTerminal: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.PROTECT_LAST_TERMINAL, true),
            minTerminalCount: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.MIN_TERMINAL_COUNT, 1),
            altClickMovesCursor: this.get(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED, shared_1.CONFIG_KEYS.ALT_CLICK_MOVES_CURSOR, false),
            multiCursorModifier: this.get(shared_1.CONFIG_SECTIONS.EDITOR, shared_1.CONFIG_KEYS.MULTI_CURSOR_MODIFIER, 'ctrlCmd'),
            activeBorderMode: this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'activeBorderMode', 'multipleOnly'),
        };
    }
    /**
     * Get WebView terminal settings (consolidates WebView config logic)
     */
    getWebViewTerminalSettings() {
        const baseConfig = this.getCompleteTerminalSettings();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            ...baseConfig,
            scrollback: this.get(section, 'scrollback', 1000),
            bellSound: this.get(section, 'bellSound', false),
            enableCliAgentIntegration: this.get(section, 'enableCliAgentIntegration', true),
            enableTerminalHeaderEnhancements: this.get(section, 'enableTerminalHeaderEnhancements', true),
            sendKeybindingsToShell: this.get(section, 'sendKeybindingsToShell', false),
            commandsToSkipShell: this.get(section, 'commandsToSkipShell', []),
            allowChords: this.get(section, 'allowChords', true),
            allowMnemonics: this.get(section, 'allowMnemonics', true),
            cursor: {
                style: this.get(section, 'cursor.style', 'block'),
                blink: this.get(section, 'cursor.blink', true),
            },
            dynamicSplitDirection: this.get(section, 'dynamicSplitDirection', true),
            panelLocation: this.get(section, 'panelLocation', 'auto'),
        };
    }
    /**
     * Get WebView font settings (consolidates font config logic)
     */
    getWebViewFontSettings() {
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            fontSize: this.getFontSize(),
            fontFamily: this.getFontFamily(),
            fontWeight: this.getFontWeight(),
            fontWeightBold: this.getFontWeightBold(),
            lineHeight: this.getLineHeight(),
            letterSpacing: this.getLetterSpacing(),
            // Cursor settings
            cursorStyle: this.get(section, 'cursorStyle', 'block'),
            cursorWidth: this.get(section, 'cursorWidth', 1),
            // Display settings
            drawBoldTextInBrightColors: this.get(section, 'drawBoldTextInBrightColors', true),
            minimumContrastRatio: this.get(section, 'minimumContrastRatio', 1),
        };
    }
    /**
     * Get complete extension config for WebView display
     */
    getCompleteExtensionConfig() {
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        const baseConfig = this.getCompleteTerminalSettings();
        return {
            fontSize: baseConfig.fontSize,
            fontFamily: baseConfig.fontFamily,
            theme: baseConfig.theme || 'auto',
            cursorBlink: baseConfig.cursorBlink,
            maxTerminals: baseConfig.maxTerminals,
            minTerminalHeight: this.get(section, 'minTerminalHeight', 200),
            autoHideStatus: this.get(section, 'autoHideStatus', false),
            statusDisplayDuration: this.get(section, 'statusDisplayDuration', 3000),
            showWebViewHeader: this.get(section, 'showWebViewHeader', true),
            webViewTitle: this.get(section, 'webViewTitle', 'Terminal'),
            showSampleIcons: this.get(section, 'showSampleIcons', true),
            sampleIconOpacity: this.get(section, 'sampleIconOpacity', 0.3),
            headerFontSize: this.get(section, 'headerFontSize', 14),
            headerIconSize: this.get(section, 'headerIconSize', 16),
            sampleIconSize: this.get(section, 'sampleIconSize', 24),
        };
    }
    /**
     * Get platform-specific shell configuration
     */
    getShellForPlatform(customShell) {
        this.initialize();
        if (customShell) {
            return customShell;
        }
        const section = shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED;
        switch (process.platform) {
            case SystemConstants_1.TERMINAL_CONSTANTS.PLATFORMS.WINDOWS:
                return (this.get(section, shared_1.CONFIG_KEYS.SHELL_WINDOWS, '') || process.env['COMSPEC'] || 'cmd.exe');
            case SystemConstants_1.TERMINAL_CONSTANTS.PLATFORMS.DARWIN:
                return this.get(section, shared_1.CONFIG_KEYS.SHELL_OSX, '') || process.env['SHELL'] || '/bin/zsh';
            default:
                return (this.get(section, shared_1.CONFIG_KEYS.SHELL_LINUX, '') || process.env['SHELL'] || '/bin/bash');
        }
    }
    /**
     * Get Alt+Click settings (VS Code standard)
     */
    getAltClickSettings() {
        this.initialize();
        return {
            altClickMovesCursor: this.get(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED, shared_1.CONFIG_KEYS.ALT_CLICK_MOVES_CURSOR, false),
            multiCursorModifier: this.get(shared_1.CONFIG_SECTIONS.EDITOR, shared_1.CONFIG_KEYS.MULTI_CURSOR_MODIFIER, 'ctrlCmd'),
        };
    }
    /**
     * Get font family with VS Code hierarchy
     * Priority: secondaryTerminal.fontFamily > terminal.integrated.fontFamily > editor.fontFamily > system default
     */
    getFontFamily() {
        this.initialize();
        try {
            // Clear cache for font settings to ensure fresh values
            this._configurationCache.delete('secondaryTerminal.fontFamily');
            this._configurationCache.delete('terminal.integrated.fontFamily');
            this._configurationCache.delete('editor.fontFamily');
            // Direct VS Code API call to ensure we get the latest value
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const directTerminalFont = terminalConfig.get('fontFamily');
            // 1. Extension-specific font (highest priority)
            const extensionFont = this.get('secondaryTerminal', 'fontFamily', '');
            if (typeof extensionFont === 'string' &&
                extensionFont.trim() &&
                extensionFont.trim() !== 'monospace') {
                return extensionFont.trim();
            }
            // 2. Terminal-specific font - use direct value if available
            const terminalFont = directTerminalFont || this.get('terminal.integrated', 'fontFamily', '');
            if (typeof terminalFont === 'string' && terminalFont.trim()) {
                return terminalFont.trim();
            }
            // 3. Editor font fallback
            const editorFont = this.get('editor', 'fontFamily', '');
            if (typeof editorFont === 'string' && editorFont.trim()) {
                return editorFont.trim();
            }
            // 4. System default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_FAMILY;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting fontFamily:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_FAMILY;
        }
    }
    /**
     * Get font size with VS Code hierarchy
     * Priority: secondaryTerminal.fontSize > terminal.integrated.fontSize > editor.fontSize > default(14)
     */
    getFontSize() {
        this.initialize();
        try {
            // 1. Extension-specific font size (highest priority)
            const extensionSize = this.get('secondaryTerminal', 'fontSize', 0);
            // Use extension setting if explicitly set (not default value of 12)
            // Note: package.json default is 12, so we only use if user changed it
            if (extensionSize > 0 && extensionSize !== 12) {
                return extensionSize;
            }
            // 2. Terminal-specific font size
            const terminalSize = this.get('terminal.integrated', 'fontSize', 0);
            if (typeof terminalSize === 'number' && terminalSize > 0) {
                return terminalSize;
            }
            // 3. Editor font size fallback
            const editorSize = this.get('editor', 'fontSize', 0);
            if (typeof editorSize === 'number' && editorSize > 0) {
                return editorSize;
            }
            // 4. Default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_SIZE;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting fontSize:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_SIZE;
        }
    }
    /**
     * Get font weight with extension priority
     */
    getFontWeight() {
        this.initialize();
        try {
            // 1. Extension-specific setting
            const extensionWeight = this.get('secondaryTerminal', 'fontWeight', '');
            if (typeof extensionWeight === 'string' && extensionWeight.trim()) {
                return extensionWeight.trim();
            }
            // 2. Terminal setting
            const terminalWeight = this.get('terminal.integrated', 'fontWeight', '');
            if (typeof terminalWeight === 'string' && terminalWeight.trim()) {
                return terminalWeight.trim();
            }
            // 3. Default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting fontWeight:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT;
        }
    }
    /**
     * Get bold font weight with extension priority
     */
    getFontWeightBold() {
        this.initialize();
        try {
            // 1. Extension-specific setting
            const extensionBold = this.get('secondaryTerminal', 'fontWeightBold', '');
            if (typeof extensionBold === 'string' && extensionBold.trim()) {
                return extensionBold.trim();
            }
            // 2. Terminal setting
            const terminalBold = this.get('terminal.integrated', 'fontWeightBold', '');
            if (typeof terminalBold === 'string' && terminalBold.trim()) {
                return terminalBold.trim();
            }
            // 3. Default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT_BOLD;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting fontWeightBold:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT_BOLD;
        }
    }
    /**
     * Get line height with extension priority
     */
    getLineHeight() {
        this.initialize();
        try {
            // 1. Extension-specific setting
            const extensionHeight = this.get('secondaryTerminal', 'lineHeight', 0);
            if (typeof extensionHeight === 'number' && extensionHeight > 0) {
                return extensionHeight;
            }
            // 2. Terminal setting
            const terminalHeight = this.get('terminal.integrated', 'lineHeight', 0);
            if (typeof terminalHeight === 'number' && terminalHeight > 0) {
                return terminalHeight;
            }
            // 3. Default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LINE_HEIGHT;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting lineHeight:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LINE_HEIGHT;
        }
    }
    /**
     * Get letter spacing with extension priority
     */
    getLetterSpacing() {
        this.initialize();
        try {
            // 1. Extension-specific setting
            const extensionSpacing = this.get('secondaryTerminal', 'letterSpacing', undefined);
            if (typeof extensionSpacing === 'number') {
                return extensionSpacing;
            }
            // 2. Terminal setting
            const terminalSpacing = this.get('terminal.integrated', 'letterSpacing', undefined);
            if (typeof terminalSpacing === 'number') {
                return terminalSpacing;
            }
            // 3. Default
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LETTER_SPACING;
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error getting letterSpacing:', error);
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LETTER_SPACING;
        }
    }
    /**
     * Get terminal profiles configuration
     */
    getTerminalProfilesConfig() {
        this.initialize();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            profiles: {
                windows: this.get(section, shared_1.CONFIG_KEYS.PROFILES_WINDOWS, {}),
                linux: this.get(section, shared_1.CONFIG_KEYS.PROFILES_LINUX, {}),
                osx: this.get(section, shared_1.CONFIG_KEYS.PROFILES_OSX, {}),
            },
            defaultProfiles: {
                windows: this.get(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS, null),
                linux: this.get(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX, null),
                osx: this.get(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX, null),
            },
            autoDetection: {
                enabled: this.get(section, shared_1.CONFIG_KEYS.ENABLE_PROFILE_AUTO_DETECTION, true),
                searchPaths: [],
                useCache: true,
                cacheExpiration: SystemConstants_1.CONFIG_CACHE_CONSTANTS.PROFILE_CACHE_EXPIRATION_MS,
            },
            inheritVSCodeProfiles: this.get(section, shared_1.CONFIG_KEYS.INHERIT_VSCODE_PROFILES, true),
        };
    }
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(featureName) {
        switch (featureName) {
            case 'cliAgentIntegration':
                return this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'enableCliAgentIntegration', true);
            case 'terminalHeaderEnhancements':
                return this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'enableTerminalHeaderEnhancements', true);
            case 'githubCopilotIntegration':
                return this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'enableGitHubCopilotIntegration', true);
            case 'altClickMovesCursor':
                return (this.get(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED, 'altClickMovesCursor', true) &&
                    this.get(shared_1.CONFIG_SECTIONS.EDITOR, 'multiCursorModifier', 'alt') === 'alt');
            case 'dynamicSplitDirection':
                return this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'dynamicSplitDirection', true);
            case 'activeBorderMode':
                return (this.get(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'activeBorderMode', 'multipleOnly') !== 'none');
            default:
                (0, logger_1.terminal)(`⚠️ [UnifiedConfig] Unknown feature: ${featureName}`);
                return false;
        }
    }
    /**
     * Clear configuration cache
     */
    clearCache() {
        this._configurationCache.clear();
        (0, logger_1.terminal)('🧹 [UnifiedConfig] Configuration cache cleared');
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            initialized: this._initialized,
            cacheSize: this._configurationCache.size,
            registeredSchemas: 'ConfigurationRegistry', // Can't access private property
            disposables: this._disposables.length,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Register configuration schemas for validation
     */
    _registerConfigurationSchemas() {
        // Font settings
        this._registry.register('terminal.integrated.fontSize', {
            type: 'number',
            default: 14,
            minimum: 8,
            maximum: 72,
        });
        this._registry.register('terminal.integrated.fontFamily', {
            type: 'string',
            default: 'monospace',
        });
        // Terminal limits
        this._registry.register(`${shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL}.${shared_1.CONFIG_KEYS.MAX_TERMINALS}`, {
            type: 'number',
            default: 5,
            minimum: 1,
            maximum: 10,
        });
        // Theme
        this._registry.register(`${shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL}.${shared_1.CONFIG_KEYS.THEME}`, {
            type: 'string',
            default: 'auto',
            enum: ['light', 'dark', 'auto'],
        });
        // Add more schemas as needed...
    }
    /**
     * Initialize configuration change watcher
     */
    _initializeConfigurationWatcher() {
        try {
            if (vscode?.workspace?.onDidChangeConfiguration) {
                const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
                    const affectedSections = [
                        shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL,
                        shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED,
                        shared_1.CONFIG_SECTIONS.EDITOR,
                    ];
                    const changedKeys = [];
                    let hasChanges = false;
                    for (const section of affectedSections) {
                        if (event.affectsConfiguration(section)) {
                            hasChanges = true;
                            // Clear cache for this section
                            for (const [key] of this._configurationCache) {
                                if (key.startsWith(section)) {
                                    this._configurationCache.delete(key);
                                    changedKeys.push(key);
                                }
                            }
                        }
                    }
                    if (hasChanges) {
                        this._onDidChangeConfiguration.fire({
                            affectsConfiguration: (section, key) => {
                                if (key) {
                                    return changedKeys.includes(`${section}.${key}`);
                                }
                                return changedKeys.some((k) => k.startsWith(section));
                            },
                            source: ConfigurationTarget.USER,
                            changedKeys,
                            timestamp: Date.now(),
                        });
                        (0, logger_1.terminal)(`⚙️ [UnifiedConfig] Configuration changed: ${changedKeys.length} keys affected`);
                    }
                });
                this._disposables.push(disposable);
            }
        }
        catch (error) {
            (0, logger_1.terminal)('⚠️ [UnifiedConfig] Could not initialize configuration watcher:', error);
        }
    }
    /**
     * Map VS Code ConfigurationTarget to our ConfigurationTarget
     */
    _mapVSCodeTargetToConfigTarget(target) {
        switch (target) {
            case vscode.ConfigurationTarget.Global:
                return ConfigurationTarget.USER;
            case vscode.ConfigurationTarget.Workspace:
                return ConfigurationTarget.WORKSPACE;
            case vscode.ConfigurationTarget.WorkspaceFolder:
                return ConfigurationTarget.WORKSPACE_FOLDER;
            default:
                return ConfigurationTarget.USER;
        }
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        (0, logger_1.terminal)('🧹 [UnifiedConfig] Disposing unified configuration service');
        try {
            // Dispose event emitter
            this._onDidChangeConfiguration.dispose();
            // Dispose all subscriptions
            for (const disposable of this._disposables) {
                disposable.dispose();
            }
            this._disposables.length = 0;
            // Clear cache
            this._configurationCache.clear();
            // Clear singleton instance
            UnifiedConfigurationService._instance = undefined;
            (0, logger_1.terminal)('✅ [UnifiedConfig] Service disposed successfully');
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error during disposal:', error);
        }
    }
}
exports.UnifiedConfigurationService = UnifiedConfigurationService;
/**
 * Get the singleton instance of UnifiedConfigurationService
 * This replaces all previous config manager imports
 */
function getUnifiedConfigurationService() {
    return UnifiedConfigurationService.getInstance();
}
/**
 * Legacy compatibility helper (to be removed after migration)
 * @deprecated Use getUnifiedConfigurationService() instead
 */
function getConfigManager() {
    return UnifiedConfigurationService.getInstance();
}
//# sourceMappingURL=UnifiedConfigurationService.js.map