"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedConfigurationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
const SystemConstants_1 = require("../../constants/SystemConstants");
/**
 * Unified Configuration Service
 *
 * Centralizes all VS Code configuration management across the extension.
 * Provides type-safe configuration access, validation, and change notifications.
 *
 * Benefits:
 * - Single source of truth for all configuration
 * - Type safety with strong typing
 * - Configuration validation and migration
 * - Centralized change event handling
 * - Consistent default value management
 */
class UnifiedConfigurationService {
    constructor() {
        this._onConfigurationChanged = new vscode.EventEmitter();
        this._configurationCache = new Map();
        this._disposables = [];
        this.onConfigurationChanged = this._onConfigurationChanged.event;
        this._registerConfigurationWatcher();
        (0, logger_1.terminal)('⚙️ [UnifiedConfig] Unified configuration service initialized');
    }
    /**
     * Get sidebar terminal configuration with full type safety
     */
    getSidebarTerminalConfig() {
        const config = vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL);
        const settings = {
            // Display configuration
            fontSize: this._getWithDefault(config, 'fontSize', 14),
            fontFamily: this._getWithDefault(config, 'fontFamily', 'Consolas, monospace'),
            theme: this._getWithDefault(config, 'theme', 'auto'),
            cursorBlink: this._getWithDefault(config, 'cursorBlink', true),
            // Shell configuration
            shell: this._getWithDefault(config, 'shell', undefined),
            shellArgs: this._getWithDefault(config, 'shellArgs', []),
            cwd: this._getWithDefault(config, 'cwd', undefined),
            defaultDirectory: this._getWithDefault(config, 'defaultDirectory', undefined),
            // Terminal limits
            maxTerminals: this._getWithDefault(config, 'maxTerminals', SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT),
            minTerminalCount: this._getWithDefault(config, 'minTerminalCount', 1),
            protectLastTerminal: this._getWithDefault(config, 'protectLastTerminal', true),
            // Interaction settings
            confirmBeforeKill: this._getWithDefault(config, 'confirmBeforeKill', false),
            altClickMovesCursor: this._getIntegratedTerminalConfig('altClickMovesCursor', true),
            multiCursorModifier: this._getEditorConfig('multiCursorModifier', 'alt'),
        };
        this._cacheConfiguration('sidebarTerminal', settings);
        return settings;
    }
    /**
     * Get WebView-specific terminal settings
     */
    getWebViewTerminalSettings() {
        const baseConfig = this.getSidebarTerminalConfig();
        return {
            ...baseConfig,
            fontSize: baseConfig.fontSize,
            fontFamily: baseConfig.fontFamily,
            scrollback: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'scrollback', 1000),
            bellSound: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'bellSound', false),
            enableCliAgentIntegration: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'enableCliAgentIntegration', true),
            sendKeybindingsToShell: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'sendKeybindingsToShell', false),
            commandsToSkipShell: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'commandsToSkipShell', []),
            allowChords: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'allowChords', true),
            allowMnemonics: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'allowMnemonics', true),
            cursor: {
                style: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'cursor.style', 'block'),
                blink: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'cursor.blink', true),
            },
            dynamicSplitDirection: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'dynamicSplitDirection', true),
            panelLocation: this._getWithDefault(vscode.workspace.getConfiguration(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL), 'panelLocation', 'auto'),
        };
    }
    /**
     * Get specific configuration value with type safety
     */
    get(section, key, defaultValue) {
        const fullKey = `${section}.${key}`;
        // Check cache first
        if (this._configurationCache.has(fullKey)) {
            return this._configurationCache.get(fullKey);
        }
        const config = vscode.workspace.getConfiguration(section);
        const value = config.get(key, defaultValue);
        // Cache the value
        this._configurationCache.set(fullKey, value);
        return value;
    }
    /**
     * Update configuration value
     */
    async update(section, key, value, target) {
        try {
            const config = vscode.workspace.getConfiguration(section);
            const oldValue = config.get(key);
            await config.update(key, value, target);
            // Clear cache for this key
            const fullKey = `${section}.${key}`;
            this._configurationCache.delete(fullKey);
            // Emit change event
            this._onConfigurationChanged.fire({
                section,
                key,
                oldValue,
                newValue: value,
                timestamp: Date.now(),
            });
            (0, logger_1.terminal)(`⚙️ [UnifiedConfig] Updated ${section}.${key}: ${oldValue} → ${value}`);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [UnifiedConfig] Failed to update ${section}.${key}:`, error);
            throw error;
        }
    }
    /**
     * Check if specific feature is enabled
     */
    isFeatureEnabled(featureName) {
        switch (featureName) {
            case 'cliAgentIntegration':
                return this.get(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL, 'enableCliAgentIntegration', true);
            case 'githubCopilotIntegration':
                return this.get(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL, 'enableGitHubCopilotIntegration', true);
            case 'altClickMovesCursor':
                return (this.get(UnifiedConfigurationService.SECTIONS.TERMINAL_INTEGRATED, 'altClickMovesCursor', true) &&
                    this.get(UnifiedConfigurationService.SECTIONS.EDITOR, 'multiCursorModifier', 'alt') ===
                        'alt');
            case 'dynamicSplitDirection':
                return this.get(UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL, 'dynamicSplitDirection', true);
            default:
                (0, logger_1.terminal)(`⚠️ [UnifiedConfig] Unknown feature: ${featureName}`);
                return false;
        }
    }
    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = [];
        const warnings = [];
        try {
            const config = this.getSidebarTerminalConfig();
            // Validate font size
            if (config.fontSize < 8 || config.fontSize > 72) {
                errors.push('fontSize must be between 8 and 72');
            }
            // Validate max terminals
            if (config.maxTerminals < 1 || config.maxTerminals > SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT) {
                warnings.push(`maxTerminals should be between 1 and ${SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT} for optimal performance`);
            }
            // Validate shell configuration
            if (config.shell && typeof config.shell !== 'string') {
                errors.push('shell must be a string path');
            }
            if (config.shellArgs && !Array.isArray(config.shellArgs)) {
                errors.push('shellArgs must be an array');
            }
            (0, logger_1.terminal)(`⚙️ [UnifiedConfig] Configuration validation: ${errors.length} errors, ${warnings.length} warnings`);
        }
        catch (error) {
            errors.push(`Configuration validation failed: ${error}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Reset configuration to defaults
     */
    async resetToDefaults(section) {
        try {
            const targetSection = section || UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL;
            const config = vscode.workspace.getConfiguration(targetSection);
            // Get all configuration keys for the section
            const inspect = config.inspect('');
            if (!inspect) {
                return;
            }
            // Reset each configured value
            const promises = [];
            // This is a simplified reset - in practice, you'd need to enumerate all keys
            const commonKeys = ['fontSize', 'fontFamily', 'theme', 'maxTerminals', 'shell', 'shellArgs'];
            for (const key of commonKeys) {
                if (config.has(key)) {
                    promises.push(Promise.resolve(config.update(key, undefined, vscode.ConfigurationTarget.Workspace)));
                }
            }
            await Promise.all(promises);
            // Clear cache
            this._configurationCache.clear();
            (0, logger_1.terminal)(`⚙️ [UnifiedConfig] Reset configuration for section: ${targetSection}`);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [UnifiedConfig] Failed to reset configuration:`, error);
            throw error;
        }
    }
    /**
     * Get configuration as JSON for debugging
     */
    getConfigurationSnapshot() {
        return {
            sidebarTerminal: this.getSidebarTerminalConfig(),
            terminalIntegrated: {
                altClickMovesCursor: this._getIntegratedTerminalConfig('altClickMovesCursor', true),
                shell: this._getIntegratedTerminalConfig('shell', undefined),
            },
            editor: {
                multiCursorModifier: this._getEditorConfig('multiCursorModifier', 'alt'),
            },
            metadata: {
                timestamp: new Date().toISOString(),
                cacheSize: this._configurationCache.size,
            },
        };
    }
    /**
     * Get integrated terminal configuration
     */
    _getIntegratedTerminalConfig(key, defaultValue) {
        return this.get(UnifiedConfigurationService.SECTIONS.TERMINAL_INTEGRATED, key, defaultValue);
    }
    /**
     * Get editor configuration
     */
    _getEditorConfig(key, defaultValue) {
        return this.get(UnifiedConfigurationService.SECTIONS.EDITOR, key, defaultValue);
    }
    /**
     * Get configuration value with default fallback
     */
    _getWithDefault(config, key, defaultValue) {
        return config.get(key, defaultValue);
    }
    /**
     * Cache configuration for performance
     */
    _cacheConfiguration(section, config) {
        const cacheKey = `${section}_full_config`;
        this._configurationCache.set(cacheKey, config);
    }
    /**
     * Register configuration change watcher
     */
    _registerConfigurationWatcher() {
        const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
            // Clear cache for changed configurations
            const relevantSections = [
                UnifiedConfigurationService.SECTIONS.SIDEBAR_TERMINAL,
                UnifiedConfigurationService.SECTIONS.TERMINAL_INTEGRATED,
                UnifiedConfigurationService.SECTIONS.EDITOR,
            ];
            let cacheCleared = false;
            for (const section of relevantSections) {
                if (event.affectsConfiguration(section)) {
                    // Clear relevant cache entries
                    for (const [key] of this._configurationCache) {
                        if (key.startsWith(section)) {
                            this._configurationCache.delete(key);
                            cacheCleared = true;
                        }
                    }
                }
            }
            if (cacheCleared) {
                (0, logger_1.terminal)('⚙️ [UnifiedConfig] Configuration cache cleared due to changes');
            }
        });
        this._disposables.push(disposable);
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        (0, logger_1.terminal)('🧹 [UnifiedConfig] Disposing unified configuration service');
        try {
            // Dispose event emitter
            this._onConfigurationChanged.dispose();
            // Dispose all subscriptions
            for (const disposable of this._disposables) {
                disposable.dispose();
            }
            this._disposables = [];
            // Clear cache
            this._configurationCache.clear();
            (0, logger_1.terminal)('✅ [UnifiedConfig] Unified configuration service disposed');
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [UnifiedConfig] Error disposing configuration service:', error);
        }
    }
}
exports.UnifiedConfigurationService = UnifiedConfigurationService;
// Configuration sections
UnifiedConfigurationService.SECTIONS = {
    SIDEBAR_TERMINAL: 'sidebarTerminal',
    TERMINAL_INTEGRATED: 'terminal.integrated',
    EDITOR: 'editor',
    WORKBENCH: 'workbench',
};
//# sourceMappingURL=UnifiedConfigurationService.js.map