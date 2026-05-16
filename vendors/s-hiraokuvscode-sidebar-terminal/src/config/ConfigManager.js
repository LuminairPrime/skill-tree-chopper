"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
exports.getConfigManager = getConfigManager;
const vscode = require("vscode");
const shared_1 = require("../types/shared");
const SystemConstants_1 = require("../constants/SystemConstants");
/** Unified VS Code configuration access with type safety and caching */
class ConfigManager {
    static getInstance() {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }
    constructor() {
        this._configCache = new Map();
        this._cacheExpiry = new Map();
        this.CACHE_TTL = SystemConstants_1.CONFIG_CACHE_CONSTANTS.CACHE_TTL_MS;
        this._initialized = false;
    }
    _ensureInitialized() {
        if (this._initialized) {
            return;
        }
        try {
            if (vscode?.workspace?.onDidChangeConfiguration) {
                vscode.workspace.onDidChangeConfiguration((event) => {
                    if (event.affectsConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL) ||
                        event.affectsConfiguration(shared_1.CONFIG_SECTIONS.EDITOR) ||
                        event.affectsConfiguration(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED)) {
                        this.clearCache();
                    }
                });
            }
        }
        catch {
            // Test/mock environment - VS Code API not available
        }
        this._initialized = true;
    }
    clearCache() {
        this._configCache.clear();
        this._cacheExpiry.clear();
    }
    getConfig(section, key, defaultValue) {
        const cacheKey = `${section}.${key}`;
        if (this._isValidCache(cacheKey)) {
            return this._configCache.get(cacheKey);
        }
        const config = vscode.workspace.getConfiguration(section);
        const value = config.get(key, defaultValue);
        this._configCache.set(cacheKey, value);
        this._cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
        return value;
    }
    getExtensionTerminalConfig() {
        this._ensureInitialized();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            maxTerminals: this.getConfig(section, shared_1.CONFIG_KEYS.MAX_TERMINALS, SystemConstants_1.TERMINAL_CONSTANTS.DEFAULT_MAX_TERMINALS),
            shell: this.getConfig(section, shared_1.CONFIG_KEYS.SHELL, ''),
            shellArgs: this.getConfig(section, shared_1.CONFIG_KEYS.SHELL_ARGS, []),
            defaultDirectory: this.getConfig(section, shared_1.CONFIG_KEYS.DEFAULT_DIRECTORY, ''),
            fontSize: this.getFontSize(),
            fontFamily: this.getFontFamily(),
            cursorBlink: this.getConfig(section, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            cursor: {
                style: 'block',
                blink: this.getConfig(section, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            },
            enableCliAgentIntegration: this.getConfig(section, 'enableCliAgentIntegration', true),
            activeBorderMode: this.getConfig(section, 'activeBorderMode', 'multipleOnly'),
        };
    }
    getCompleteTerminalSettings() {
        this._ensureInitialized();
        const sidebarConfig = this.getExtensionTerminalConfig();
        return {
            ...sidebarConfig,
            fontSize: this.getFontSize(),
            fontFamily: this.getFontFamily(),
            theme: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.THEME, 'auto'),
            cursorBlink: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.CURSOR_BLINK, true),
            confirmBeforeKill: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.CONFIRM_BEFORE_KILL, false),
            protectLastTerminal: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.PROTECT_LAST_TERMINAL, true),
            minTerminalCount: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.MIN_TERMINAL_COUNT, 1),
            altClickMovesCursor: this.getConfig(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED, shared_1.CONFIG_KEYS.ALT_CLICK_MOVES_CURSOR, false),
            multiCursorModifier: this.getConfig(shared_1.CONFIG_SECTIONS.EDITOR, shared_1.CONFIG_KEYS.MULTI_CURSOR_MODIFIER, 'ctrlCmd'),
            activeBorderMode: this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, 'activeBorderMode', 'multipleOnly'),
        };
    }
    getCompleteExtensionConfig() {
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        const baseConfig = this.getCompleteTerminalSettings();
        return {
            fontSize: baseConfig.fontSize,
            fontFamily: baseConfig.fontFamily,
            theme: baseConfig.theme || 'auto',
            cursorBlink: baseConfig.cursorBlink,
            maxTerminals: baseConfig.maxTerminals,
            minTerminalHeight: this.getConfig(section, 'minTerminalHeight', 200),
            autoHideStatus: this.getConfig(section, 'autoHideStatus', false),
            statusDisplayDuration: this.getConfig(section, 'statusDisplayDuration', 3000),
            showWebViewHeader: this.getConfig(section, 'showWebViewHeader', true),
            webViewTitle: this.getConfig(section, 'webViewTitle', 'Terminal'),
            showSampleIcons: this.getConfig(section, 'showSampleIcons', true),
            sampleIconOpacity: this.getConfig(section, 'sampleIconOpacity', 0.3),
            headerFontSize: this.getConfig(section, 'headerFontSize', 14),
            headerIconSize: this.getConfig(section, 'headerIconSize', 16),
            sampleIconSize: this.getConfig(section, 'sampleIconSize', 24),
        };
    }
    getShellForPlatform(customShell) {
        this._ensureInitialized();
        if (customShell) {
            return customShell;
        }
        const section = shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED;
        switch (process.platform) {
            case SystemConstants_1.TERMINAL_CONSTANTS.PLATFORMS.WINDOWS:
                return (this.getConfig(section, shared_1.CONFIG_KEYS.SHELL_WINDOWS, '') ||
                    process.env['COMSPEC'] ||
                    'cmd.exe');
            case SystemConstants_1.TERMINAL_CONSTANTS.PLATFORMS.DARWIN:
                return (this.getConfig(section, shared_1.CONFIG_KEYS.SHELL_OSX, '') || process.env['SHELL'] || '/bin/zsh');
            default:
                return (this.getConfig(section, shared_1.CONFIG_KEYS.SHELL_LINUX, '') ||
                    process.env['SHELL'] ||
                    '/bin/bash');
        }
    }
    getAltClickSettings() {
        this._ensureInitialized();
        return {
            altClickMovesCursor: this.getConfig(shared_1.CONFIG_SECTIONS.TERMINAL_INTEGRATED, shared_1.CONFIG_KEYS.ALT_CLICK_MOVES_CURSOR, false),
            multiCursorModifier: this.getConfig(shared_1.CONFIG_SECTIONS.EDITOR, shared_1.CONFIG_KEYS.MULTI_CURSOR_MODIFIER, 'ctrlCmd'),
        };
    }
    /** Font family: secondaryTerminal > terminal.integrated > editor > system monospace */
    getFontFamily() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionFontFamily = extensionConfig.get('fontFamily');
            if (extensionFontFamily &&
                extensionFontFamily.trim() &&
                extensionFontFamily.trim() !== 'monospace') {
                return extensionFontFamily.trim();
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalFontFamily = terminalConfig.get('fontFamily');
            if (terminalFontFamily && terminalFontFamily.trim()) {
                return terminalFontFamily.trim();
            }
            const editorConfig = vscode.workspace.getConfiguration('editor');
            const editorFontFamily = editorConfig.get('fontFamily');
            if (editorFontFamily && editorFontFamily.trim()) {
                return editorFontFamily.trim();
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_FAMILY;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_FAMILY;
        }
    }
    /** Font size: secondaryTerminal > terminal.integrated > editor > default(14) */
    getFontSize() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionFontSize = extensionConfig.get('fontSize');
            if (extensionFontSize && extensionFontSize > 0 && extensionFontSize !== 12) {
                return extensionFontSize;
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalFontSize = terminalConfig.get('fontSize');
            if (terminalFontSize && terminalFontSize > 0) {
                return terminalFontSize;
            }
            const editorConfig = vscode.workspace.getConfiguration('editor');
            const editorFontSize = editorConfig.get('fontSize');
            if (editorFontSize && editorFontSize > 0) {
                return editorFontSize;
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_SIZE;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_SIZE;
        }
    }
    /** Font weight: secondaryTerminal > terminal.integrated > default('normal') */
    getFontWeight() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionFontWeight = extensionConfig.get('fontWeight');
            if (extensionFontWeight && extensionFontWeight.trim()) {
                return extensionFontWeight.trim();
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalFontWeight = terminalConfig.get('fontWeight');
            if (terminalFontWeight && terminalFontWeight.trim()) {
                return terminalFontWeight.trim();
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT;
        }
    }
    /** Bold font weight: secondaryTerminal > terminal.integrated > default('bold') */
    getFontWeightBold() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionFontWeightBold = extensionConfig.get('fontWeightBold');
            if (extensionFontWeightBold && extensionFontWeightBold.trim()) {
                return extensionFontWeightBold.trim();
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalFontWeightBold = terminalConfig.get('fontWeightBold');
            if (terminalFontWeightBold && terminalFontWeightBold.trim()) {
                return terminalFontWeightBold.trim();
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT_BOLD;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_FONT_WEIGHT_BOLD;
        }
    }
    /** Line height: secondaryTerminal > terminal.integrated > default(1.0) */
    getLineHeight() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionLineHeight = extensionConfig.get('lineHeight');
            if (extensionLineHeight && extensionLineHeight > 0) {
                return extensionLineHeight;
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalLineHeight = terminalConfig.get('lineHeight');
            if (terminalLineHeight && terminalLineHeight > 0) {
                return terminalLineHeight;
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LINE_HEIGHT;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LINE_HEIGHT;
        }
    }
    /** Letter spacing: secondaryTerminal > terminal.integrated > default(0) */
    getLetterSpacing() {
        this._ensureInitialized();
        try {
            const extensionConfig = vscode.workspace.getConfiguration('secondaryTerminal');
            const extensionLetterSpacing = extensionConfig.get('letterSpacing');
            if (typeof extensionLetterSpacing === 'number') {
                return extensionLetterSpacing;
            }
            const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
            const terminalLetterSpacing = terminalConfig.get('letterSpacing');
            if (typeof terminalLetterSpacing === 'number') {
                return terminalLetterSpacing;
            }
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LETTER_SPACING;
        }
        catch {
            return SystemConstants_1.CONFIG_CACHE_CONSTANTS.DEFAULT_LETTER_SPACING;
        }
    }
    onConfigurationChange(callback) {
        return vscode.workspace.onDidChangeConfiguration(callback);
    }
    _isValidCache(key) {
        const expiry = this._cacheExpiry.get(key);
        if (!expiry || Date.now() > expiry) {
            this._configCache.delete(key);
            this._cacheExpiry.delete(key);
            return false;
        }
        return this._configCache.has(key);
    }
    getTerminalProfilesConfig() {
        this._ensureInitialized();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        return {
            profiles: {
                windows: this.getConfig(section, shared_1.CONFIG_KEYS.PROFILES_WINDOWS, {}),
                linux: this.getConfig(section, shared_1.CONFIG_KEYS.PROFILES_LINUX, {}),
                osx: this.getConfig(section, shared_1.CONFIG_KEYS.PROFILES_OSX, {}),
            },
            defaultProfiles: {
                windows: this.getConfig(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS, null),
                linux: this.getConfig(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX, null),
                osx: this.getConfig(section, shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX, null),
            },
            autoDetection: {
                enabled: this.getConfig(section, shared_1.CONFIG_KEYS.ENABLE_PROFILE_AUTO_DETECTION, true),
                searchPaths: [],
                useCache: true,
                cacheExpiration: SystemConstants_1.CONFIG_CACHE_CONSTANTS.PROFILE_CACHE_EXPIRATION_MS,
            },
            inheritVSCodeProfiles: this.getConfig(section, shared_1.CONFIG_KEYS.INHERIT_VSCODE_PROFILES, true),
        };
    }
    getTerminalProfilesForCurrentPlatform() {
        this._ensureInitialized();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        const profileKeyMap = {
            win32: shared_1.CONFIG_KEYS.PROFILES_WINDOWS,
            darwin: shared_1.CONFIG_KEYS.PROFILES_OSX,
        };
        const profileKey = profileKeyMap[process.platform] || shared_1.CONFIG_KEYS.PROFILES_LINUX;
        return this.getConfig(section, profileKey, {});
    }
    getDefaultTerminalProfile() {
        this._ensureInitialized();
        const section = shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL;
        const defaultKeyMap = {
            win32: shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS,
            darwin: shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX,
        };
        const defaultKey = defaultKeyMap[process.platform] || shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX;
        return this.getConfig(section, defaultKey, null);
    }
    getVSCodeTerminalProfiles() {
        this._ensureInitialized();
        const profileKeyMap = {
            win32: 'profiles.windows',
            darwin: 'profiles.osx',
        };
        const profileKey = profileKeyMap[process.platform] || 'profiles.linux';
        const vscodeConfig = vscode.workspace.getConfiguration('terminal.integrated');
        const vscodeProfiles = vscodeConfig.get(profileKey, {});
        const convertedProfiles = {};
        for (const [name, profile] of Object.entries(vscodeProfiles)) {
            if (profile && typeof profile === 'object') {
                const prof = profile;
                if (prof.path) {
                    convertedProfiles[name] = {
                        path: prof.path,
                        args: prof.args,
                        cwd: prof.cwd,
                        env: prof.env,
                        icon: prof.icon,
                        color: prof.color,
                        isVisible: prof.isVisible !== false,
                        overrideName: prof.overrideName,
                        useColor: prof.useColor,
                    };
                }
            }
        }
        return convertedProfiles;
    }
    isVSCodeProfileInheritanceEnabled() {
        this._ensureInitialized();
        return this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.INHERIT_VSCODE_PROFILES, true);
    }
    isProfileAutoDetectionEnabled() {
        this._ensureInitialized();
        return this.getConfig(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL, shared_1.CONFIG_KEYS.ENABLE_PROFILE_AUTO_DETECTION, true);
    }
    getCacheInfo() {
        return {
            size: this._configCache.size,
            keys: Array.from(this._configCache.keys()),
        };
    }
}
exports.ConfigManager = ConfigManager;
function getConfigManager() {
    return ConfigManager.getInstance();
}
//# sourceMappingURL=ConfigManager.js.map