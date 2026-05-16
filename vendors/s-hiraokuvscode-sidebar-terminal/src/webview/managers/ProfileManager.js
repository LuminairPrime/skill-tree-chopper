"use strict";
/**
 * Profile Manager
 * Manages terminal profiles in the webview with VS Code-style profile selection
 * - Profile discovery and caching
 * - Profile selector UI coordination
 * - Profile-based terminal creation
 * - Default profile management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileManager = void 0;
const ProfileSelector_1 = require("../components/ProfileSelector");
const logger_1 = require("../../utils/logger");
class ProfileManager {
    constructor() {
        this.coordinator = null;
        this.profileSelector = null;
        this.profileSelectorContainer = null;
        this.availableProfiles = new Map();
        this.defaultProfileId = null;
        this.lastRefreshTime = 0;
        this.CACHE_DURATION = 60000; // 1 minute cache
        this.setupProfileSelectorContainer();
    }
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
    }
    /**
     * Initialize profile manager
     */
    async initialize() {
        if (!this.coordinator) {
            console.error('ProfileManager: Coordinator not set');
            return;
        }
        this.setupProfileSelectorContainer();
        await this.refreshProfiles();
        (0, logger_1.webview)('🎯 Profile Manager initialized with', this.availableProfiles.size, 'profiles');
    }
    setupProfileSelectorContainer() {
        // Create container for profile selector dialog
        let container = document.getElementById('profile-selector-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'profile-selector-container';
            container.style.display = 'none';
            document.body.appendChild(container);
        }
        this.profileSelectorContainer = container;
        this.profileSelector = new ProfileSelector_1.ProfileSelector(container);
    }
    /**
     * Show profile selector dialog
     */
    showProfileSelector(onProfileSelected) {
        if (!this.profileSelector || !this.coordinator) {
            console.warn('ProfileManager: Profile selector not available');
            return;
        }
        const profiles = Array.from(this.availableProfiles.values());
        if (profiles.length === 0) {
            this.coordinator.getManagers().notification.showWarning('No terminal profiles available');
            return;
        }
        this.profileSelector.show(profiles, this.defaultProfileId || undefined, (profileId) => {
            this.selectedProfileId = profileId;
            if (onProfileSelected) {
                onProfileSelected(profileId);
            }
            else {
                // Default action: create terminal with selected profile
                this.createTerminalWithProfile(profileId);
            }
        }, () => {
            this.selectedProfileId = undefined;
        });
        (0, logger_1.webview)('🎯 Profile selector shown with', profiles.length, 'profiles');
    }
    /**
     * Hide profile selector dialog
     */
    hideProfileSelector() {
        if (this.profileSelector) {
            this.profileSelector.hide();
        }
        this.selectedProfileId = undefined;
    }
    /**
     * Get available profiles (with caching)
     */
    async getAvailableProfiles() {
        const now = Date.now();
        if (now - this.lastRefreshTime > this.CACHE_DURATION) {
            await this.refreshProfiles();
        }
        return Array.from(this.availableProfiles.values());
    }
    /**
     * Get profile by ID
     */
    getProfile(profileId) {
        return this.availableProfiles.get(profileId);
    }
    /**
     * Get default profile
     */
    getDefaultProfile() {
        if (this.defaultProfileId) {
            return this.availableProfiles.get(this.defaultProfileId);
        }
        // Fallback to first available profile
        const profiles = Array.from(this.availableProfiles.values());
        return profiles.find((p) => p.isDefault) || profiles[0];
    }
    /**
     * Set default profile
     */
    async setDefaultProfile(profileId) {
        if (!this.coordinator) {
            throw new Error('ProfileManager: Coordinator not available');
        }
        const profile = this.availableProfiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        // Update local state
        this.availableProfiles.forEach((p) => {
            p.isDefault = p.id === profileId;
        });
        this.defaultProfileId = profileId;
        // Notify extension
        this.coordinator.postMessageToExtension({
            command: 'setDefaultProfile',
            profileId: profileId,
        });
        (0, logger_1.webview)('🎯 Default profile set to:', profileId);
    }
    /**
     * Refresh profiles from extension
     */
    async refreshProfiles() {
        if (!this.coordinator) {
            console.warn('ProfileManager: Cannot refresh profiles - coordinator not available');
            return;
        }
        try {
            // Request profiles from extension
            this.coordinator.postMessageToExtension({
                command: 'getTerminalProfiles',
            });
            (0, logger_1.webview)('🎯 Requested profile refresh from extension');
        }
        catch (error) {
            console.error('ProfileManager: Failed to refresh profiles:', error);
        }
    }
    /**
     * Handle profiles received from extension
     */
    updateProfiles(profiles, defaultProfileId) {
        this.availableProfiles.clear();
        profiles.forEach((profile) => {
            this.availableProfiles.set(profile.id, profile);
        });
        if (defaultProfileId) {
            this.defaultProfileId = defaultProfileId;
        }
        else {
            // Find default profile
            const defaultProfile = profiles.find((p) => p.isDefault);
            this.defaultProfileId = defaultProfile?.id || profiles[0]?.id || null;
        }
        this.lastRefreshTime = Date.now();
        // Update profile selector if visible
        if (this.profileSelector && this.profileSelector.isVisible) {
            this.profileSelector.updateProfiles(profiles);
        }
        (0, logger_1.webview)('🎯 Updated profiles:', profiles.length, 'profiles, default:', this.defaultProfileId);
    }
    /**
     * Create terminal with specific profile
     */
    async createTerminalWithProfile(profileId, name) {
        if (!this.coordinator) {
            throw new Error('ProfileManager: Coordinator not available');
        }
        const profile = this.availableProfiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }
        // Generate terminal name if not provided
        const terminalName = name || `${profile.name} Terminal`;
        const terminalId = this.generateTerminalId();
        try {
            // Create terminal with profile via coordinator
            await this.coordinator.createTerminal(terminalId, terminalName, {
                profileId: profileId,
                shell: profile.path,
                args: profile.args,
                env: profile.env,
                cwd: profile.cwd,
            });
            (0, logger_1.webview)('🎯 Created terminal with profile:', profileId, '→', terminalId);
        }
        catch (error) {
            console.error('ProfileManager: Failed to create terminal with profile:', error);
            if (this.coordinator.getManagers().notification) {
                this.coordinator
                    .getManagers()
                    .notification.showWarning(`Failed to create terminal with profile "${profile.name}"`);
            }
            throw error;
        }
    }
    /**
     * Check if profile selector is visible
     */
    isProfileSelectorVisible() {
        return this.profileSelector?.isVisible ?? false;
    }
    /**
     * Get currently selected profile ID
     */
    getSelectedProfileId() {
        return this.selectedProfileId;
    }
    /**
     * Quick profile switching via keyboard shortcuts
     */
    async switchToProfileByIndex(index) {
        const profiles = Array.from(this.availableProfiles.values());
        const profile = profiles[index];
        if (profile) {
            await this.createTerminalWithProfile(profile.id);
        }
    }
    /**
     * Create terminal with default profile
     */
    async createTerminalWithDefaultProfile(name) {
        const defaultProfile = this.getDefaultProfile();
        if (!defaultProfile) {
            throw new Error('No default profile available');
        }
        await this.createTerminalWithProfile(defaultProfile.id, name);
    }
    /**
     * Handle profile-related messages from extension
     */
    handleMessage(message) {
        switch (message.command) {
            case 'profilesUpdated':
                this.updateProfiles(message.profiles, message.defaultProfileId);
                break;
            case 'defaultProfileChanged':
                if (message.profileId) {
                    this.defaultProfileId = message.profileId;
                    // Update default flag on profiles
                    this.availableProfiles.forEach((p) => {
                        p.isDefault = p.id === message.profileId;
                    });
                }
                break;
            default:
                console.warn('ProfileManager: Unknown message command:', message.command);
        }
    }
    generateTerminalId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `terminal-${timestamp}-${random}`;
    }
    /**
     * Get profile statistics
     */
    getStats() {
        return {
            totalProfiles: this.availableProfiles.size,
            defaultProfile: this.defaultProfileId,
            lastRefresh: this.lastRefreshTime,
            selectorVisible: this.isProfileSelectorVisible(),
        };
    }
    /**
     * Dispose resources
     */
    dispose() {
        if (this.profileSelector) {
            this.profileSelector.dispose();
            this.profileSelector = null;
        }
        if (this.profileSelectorContainer && this.profileSelectorContainer.parentNode) {
            this.profileSelectorContainer.parentNode.removeChild(this.profileSelectorContainer);
        }
        this.availableProfiles.clear();
        this.coordinator = null;
        this.selectedProfileId = undefined;
        this.defaultProfileId = null;
        (0, logger_1.webview)('🎯 Profile Manager disposed');
    }
}
exports.ProfileManager = ProfileManager;
//# sourceMappingURL=ProfileManager.js.map