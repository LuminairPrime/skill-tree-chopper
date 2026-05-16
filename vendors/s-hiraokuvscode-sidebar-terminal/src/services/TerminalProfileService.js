"use strict";
/**
 * Terminal Profile Service - VS Code標準ターミナルプロファイルシステム
 * VS Code のターミナルプロファイル機能に準拠したプロファイル管理システム
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalProfileService = void 0;
const vscode = require("vscode");
const os = require("os");
const fs = require("fs");
const shared_1 = require("../types/shared");
const logger_1 = require("../utils/logger");
class TerminalProfileService {
    constructor() {
        this.profileCache = new Map();
        this.platform = this.getCurrentPlatform();
    }
    /**
     * Get current platform for profile selection
     */
    getCurrentPlatform() {
        const platform = os.platform();
        switch (platform) {
            case 'win32':
                return 'windows';
            case 'darwin':
                return 'osx';
            default:
                return 'linux';
        }
    }
    /**
     * Get all available terminal profiles for current platform
     */
    async getAvailableProfiles() {
        const profiles = this.getConfiguredProfiles();
        // If inherit VS Code profiles is enabled, merge with VS Code's profiles
        const inheritVSCode = vscode.workspace
            .getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL)
            .get(shared_1.CONFIG_KEYS.INHERIT_VSCODE_PROFILES, true);
        if (inheritVSCode) {
            const vscodeProfiles = await this.getVSCodeProfiles();
            return { ...vscodeProfiles, ...profiles };
        }
        return profiles;
    }
    /**
     * Get configured profiles from extension settings
     */
    getConfiguredProfiles() {
        const config = vscode.workspace.getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL);
        let profileKey;
        switch (this.platform) {
            case 'windows':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_WINDOWS;
                break;
            case 'linux':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_LINUX;
                break;
            case 'osx':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_OSX;
                break;
        }
        const profiles = config.get(profileKey, {});
        // Filter out null values
        const filteredProfiles = {};
        for (const [key, profile] of Object.entries(profiles)) {
            if (profile) {
                filteredProfiles[key] = profile;
            }
        }
        return filteredProfiles;
    }
    /**
     * Get VS Code's built-in terminal profiles
     */
    async getVSCodeProfiles() {
        const config = vscode.workspace.getConfiguration('terminal.integrated');
        let profileKey;
        switch (this.platform) {
            case 'windows':
                profileKey = 'profiles.windows';
                break;
            case 'linux':
                profileKey = 'profiles.linux';
                break;
            case 'osx':
                profileKey = 'profiles.osx';
                break;
        }
        const vscodeProfiles = config.get(profileKey, {});
        // Convert VS Code profile format to our format
        const convertedProfiles = {};
        for (const [name, profile] of Object.entries(vscodeProfiles)) {
            if (profile && typeof profile === 'object' && profile.path) {
                convertedProfiles[name] = {
                    path: profile.path,
                    args: profile.args,
                    cwd: profile.cwd,
                    env: profile.env,
                    icon: profile.icon,
                    color: profile.color,
                    isVisible: profile.isVisible,
                    overrideName: profile.overrideName,
                    useColor: profile.useColor,
                };
            }
        }
        return convertedProfiles;
    }
    /**
     * Get default profile for current platform
     */
    getDefaultProfile() {
        const config = vscode.workspace.getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL);
        let defaultKey;
        switch (this.platform) {
            case 'windows':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS;
                break;
            case 'linux':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX;
                break;
            case 'osx':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX;
                break;
        }
        const profileName = config.get(defaultKey, null);
        // Validate: warn if user entered a path instead of a profile name
        if (profileName && this.looksLikePath(profileName)) {
            (0, logger_1.terminal)(`⚠️ [PROFILE] Warning: "${profileName}" looks like a file path. ` +
                `The defaultProfile setting expects a profile NAME (e.g., "PowerShell 7", "bash"), not a path. ` +
                `Run "Terminal: Select Default Profile" from Command Palette to see available profile names.`);
            vscode.window.showWarningMessage(`Secondary Terminal: "${profileName}" looks like a file path. ` +
                `Please enter a profile name (e.g., "PowerShell 7") instead. ` +
                `Run "Terminal: Select Default Profile" to see available profiles.`);
            return null; // Ignore invalid path input
        }
        return profileName;
    }
    /**
     * Check if value looks like a file path rather than a profile name
     */
    looksLikePath(value) {
        // Windows paths: C:\, D:\, \\, etc.
        if (/^[A-Za-z]:[\\\/]/.test(value) || value.startsWith('\\\\')) {
            return true;
        }
        // Unix paths: /usr/bin, ./script, ~/bin, etc.
        if (/^[\/~.]/.test(value)) {
            return true;
        }
        // Contains file extensions commonly used for shells
        if (/\.(exe|sh|bash|zsh|fish|cmd|bat)$/i.test(value)) {
            return true;
        }
        return false;
    }
    /**
     * Resolve which profile to use for a new terminal
     */
    async resolveProfile(requestedProfile) {
        const availableProfiles = await this.getAvailableProfiles();
        // If specific profile requested, try to use it
        if (requestedProfile && availableProfiles[requestedProfile]) {
            return {
                profile: availableProfiles[requestedProfile],
                profileName: requestedProfile,
                platform: this.platform,
                isDefault: false,
                source: 'user',
            };
        }
        // Try to use default profile
        const defaultProfileName = this.getDefaultProfile();
        if (defaultProfileName && availableProfiles[defaultProfileName]) {
            return {
                profile: availableProfiles[defaultProfileName],
                profileName: defaultProfileName,
                platform: this.platform,
                isDefault: true,
                source: 'default',
            };
        }
        // Fallback to first available profile
        const profileNames = Object.keys(availableProfiles);
        if (profileNames.length > 0) {
            const firstProfileName = profileNames[0];
            if (firstProfileName) {
                const firstProfile = availableProfiles[firstProfileName];
                if (firstProfile) {
                    return {
                        profile: firstProfile,
                        profileName: firstProfileName,
                        platform: this.platform,
                        isDefault: false,
                        source: 'auto-detected',
                    };
                }
            }
        }
        // Ultimate fallback - create basic shell profile
        return this.createFallbackProfile();
    }
    /**
     * Create a fallback profile when no profiles are configured
     */
    createFallbackProfile() {
        let shellPath;
        const shellArgs = [];
        switch (this.platform) {
            case 'windows':
                shellPath = process.env.COMSPEC || 'cmd.exe';
                break;
            case 'osx':
                shellPath = process.env.SHELL || '/bin/zsh';
                break;
            default:
                shellPath = process.env.SHELL || '/bin/bash';
                break;
        }
        return {
            profile: {
                path: shellPath,
                args: shellArgs,
            },
            profileName: 'Fallback Shell',
            platform: this.platform,
            isDefault: false,
            source: 'auto-detected',
        };
    }
    /**
     * Auto-detect available shells on the system
     */
    async autoDetectProfiles() {
        const detectedProfiles = {};
        const shellCandidates = this.getShellCandidates();
        for (const candidate of shellCandidates) {
            const shellExists = await this.checkShellExists(candidate.path);
            if (shellExists) {
                detectedProfiles[candidate.name] = {
                    path: candidate.path,
                    args: candidate.args || [],
                    icon: candidate.icon,
                    isVisible: true,
                };
            }
        }
        return detectedProfiles;
    }
    /**
     * Get shell candidates for auto-detection
     */
    getShellCandidates() {
        switch (this.platform) {
            case 'windows':
                return [
                    { name: 'Command Prompt', path: 'cmd.exe', icon: 'terminal-cmd' },
                    { name: 'PowerShell', path: 'powershell.exe', icon: 'terminal-powershell' },
                    { name: 'PowerShell Core', path: 'pwsh.exe', icon: 'terminal-powershell' },
                    {
                        name: 'Git Bash',
                        path: 'C:\\Program Files\\Git\\bin\\bash.exe',
                        icon: 'terminal-bash',
                    },
                    { name: 'Windows Subsystem for Linux', path: 'wsl.exe', icon: 'terminal-ubuntu' },
                ];
            case 'osx':
                return [
                    { name: 'zsh', path: '/bin/zsh', icon: 'terminal-bash' },
                    { name: 'bash', path: '/bin/bash', icon: 'terminal-bash' },
                    { name: 'fish', path: '/usr/local/bin/fish', icon: 'terminal-bash' },
                    { name: 'tcsh', path: '/bin/tcsh', icon: 'terminal-bash' },
                ];
            default: // linux
                return [
                    { name: 'bash', path: '/bin/bash', icon: 'terminal-bash' },
                    { name: 'zsh', path: '/bin/zsh', icon: 'terminal-bash' },
                    { name: 'fish', path: '/usr/bin/fish', icon: 'terminal-bash' },
                    { name: 'dash', path: '/bin/dash', icon: 'terminal-bash' },
                    { name: 'sh', path: '/bin/sh', icon: 'terminal-bash' },
                ];
        }
    }
    /**
     * Check if a shell executable exists
     */
    async checkShellExists(shellPath) {
        try {
            await fs.promises.access(shellPath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get complete profiles configuration
     */
    async getProfilesConfig() {
        const config = vscode.workspace.getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL);
        return {
            profiles: {
                windows: config.get(shared_1.CONFIG_KEYS.PROFILES_WINDOWS, {}),
                linux: config.get(shared_1.CONFIG_KEYS.PROFILES_LINUX, {}),
                osx: config.get(shared_1.CONFIG_KEYS.PROFILES_OSX, {}),
            },
            defaultProfiles: {
                windows: config.get(shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS, null),
                linux: config.get(shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX, null),
                osx: config.get(shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX, null),
            },
            autoDetection: {
                enabled: config.get(shared_1.CONFIG_KEYS.ENABLE_PROFILE_AUTO_DETECTION, true),
                searchPaths: [],
                useCache: true,
                cacheExpiration: 3600000, // 1 hour
            },
            inheritVSCodeProfiles: config.get(shared_1.CONFIG_KEYS.INHERIT_VSCODE_PROFILES, true),
        };
    }
    /**
     * Update profile configuration
     */
    async updateProfileConfig(platform, profileName, profile) {
        const config = vscode.workspace.getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL);
        let profileKey;
        switch (platform) {
            case 'windows':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_WINDOWS;
                break;
            case 'linux':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_LINUX;
                break;
            case 'osx':
                profileKey = shared_1.CONFIG_KEYS.PROFILES_OSX;
                break;
        }
        const currentProfiles = config.get(profileKey, {});
        const updatedProfiles = {
            ...currentProfiles,
            [profileName]: profile,
        };
        await config.update(profileKey, updatedProfiles, vscode.ConfigurationTarget.Global);
    }
    /**
     * Set default profile for platform
     */
    async setDefaultProfile(platform, profileName) {
        const config = vscode.workspace.getConfiguration(shared_1.CONFIG_SECTIONS.SIDEBAR_TERMINAL);
        let defaultKey;
        switch (platform) {
            case 'windows':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_WINDOWS;
                break;
            case 'linux':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_LINUX;
                break;
            case 'osx':
                defaultKey = shared_1.CONFIG_KEYS.DEFAULT_PROFILE_OSX;
                break;
        }
        await config.update(defaultKey, profileName, vscode.ConfigurationTarget.Global);
    }
}
exports.TerminalProfileService = TerminalProfileService;
//# sourceMappingURL=TerminalProfileService.js.map