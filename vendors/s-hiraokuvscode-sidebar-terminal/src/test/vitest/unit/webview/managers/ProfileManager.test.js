"use strict";
/**
 * ProfileManager Test Suite
 * Tests the profile management functionality including selector integration
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ProfileManager_1 = require("../../../../../webview/managers/ProfileManager");
(0, vitest_1.describe)('ProfileManager', () => {
    let profileManager;
    let mockCoordinator;
    let mockProfiles;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Create mock profiles
        mockProfiles = [
            {
                id: 'bash',
                name: 'Bash',
                path: '/bin/bash',
                description: 'Bash shell',
                icon: 'terminal-bash',
                isDefault: true,
                args: [],
            },
            {
                id: 'zsh',
                name: 'Zsh',
                path: '/bin/zsh',
                description: 'Z shell',
                icon: 'terminal-bash',
                isDefault: false,
                args: [],
            },
            {
                id: 'powershell',
                name: 'PowerShell',
                path: '/usr/local/bin/pwsh',
                description: 'PowerShell Core',
                icon: 'terminal-pwsh',
                isDefault: false,
                args: [],
            },
        ];
        // Create mock coordinator
        mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            createTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
            getManagers: vitest_1.vi.fn().mockReturnValue({
                notification: {
                    showWarning: vitest_1.vi.fn(),
                    showInfo: vitest_1.vi.fn(),
                },
            }),
        };
        profileManager = new ProfileManager_1.ProfileManager();
        profileManager.setCoordinator(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        profileManager.dispose();
        vitest_1.vi.useRealTimers();
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create profile selector container', async () => {
            await profileManager.initialize();
            const container = document.getElementById('profile-selector-container');
            (0, vitest_1.expect)(container).toBeDefined();
            (0, vitest_1.expect)(container?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should initialize with no profiles', async () => {
            await profileManager.initialize();
            const profiles = await profileManager.getAvailableProfiles();
            (0, vitest_1.expect)(profiles).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('Profile Management', () => {
        (0, vitest_1.it)('should update profiles from extension', () => {
            profileManager.updateProfiles(mockProfiles, 'bash');
            const profile = profileManager.getProfile('bash');
            (0, vitest_1.expect)(profile).toBeDefined();
            (0, vitest_1.expect)(profile?.name).toBe('Bash');
        });
        (0, vitest_1.it)('should identify default profile', () => {
            profileManager.updateProfiles(mockProfiles, 'bash');
            const defaultProfile = profileManager.getDefaultProfile();
            (0, vitest_1.expect)(defaultProfile?.id).toBe('bash');
            (0, vitest_1.expect)(defaultProfile?.isDefault).toBe(true);
        });
        (0, vitest_1.it)('should get profile by ID', () => {
            profileManager.updateProfiles(mockProfiles);
            const zshProfile = profileManager.getProfile('zsh');
            (0, vitest_1.expect)(zshProfile).toBeDefined();
            (0, vitest_1.expect)(zshProfile?.name).toBe('Zsh');
        });
        (0, vitest_1.it)('should return undefined for non-existent profile', () => {
            profileManager.updateProfiles(mockProfiles);
            const nonExistent = profileManager.getProfile('nonexistent');
            (0, vitest_1.expect)(nonExistent).toBeUndefined();
        });
        (0, vitest_1.it)('should get all available profiles', async () => {
            profileManager.updateProfiles(mockProfiles);
            const profiles = await profileManager.getAvailableProfiles();
            (0, vitest_1.expect)(profiles).toHaveLength(3);
        });
        (0, vitest_1.it)('should fallback to first profile when no default specified', () => {
            profileManager.updateProfiles(mockProfiles);
            const defaultProfile = profileManager.getDefaultProfile();
            (0, vitest_1.expect)(defaultProfile).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Profile Selector UI', () => {
        (0, vitest_1.beforeEach)(async () => {
            await profileManager.initialize();
            profileManager.updateProfiles(mockProfiles, 'bash');
        });
        (0, vitest_1.it)('should show profile selector', () => {
            profileManager.showProfileSelector();
            (0, vitest_1.expect)(profileManager.isProfileSelectorVisible()).toBe(true);
            const container = document.getElementById('profile-selector-container');
            (0, vitest_1.expect)(container?.style.display).toBe('block');
        });
        (0, vitest_1.it)('should hide profile selector', () => {
            profileManager.showProfileSelector();
            profileManager.hideProfileSelector();
            (0, vitest_1.expect)(profileManager.isProfileSelectorVisible()).toBe(false);
            const container = document.getElementById('profile-selector-container');
            (0, vitest_1.expect)(container?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should show warning when no profiles available', () => {
            profileManager.updateProfiles([], undefined);
            profileManager.showProfileSelector();
            const notificationManager = mockCoordinator.getManagers().notification;
            (0, vitest_1.expect)(notificationManager.showWarning).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(notificationManager.showWarning).toHaveBeenCalledWith('No terminal profiles available');
        });
        (0, vitest_1.it)('should call onProfileSelected callback when profile selected', () => {
            return new Promise((resolve) => {
                profileManager.showProfileSelector((profileId) => {
                    (0, vitest_1.expect)(profileId).toBe('zsh');
                    resolve();
                });
                // Simulate profile selection
                const profileItems = document.querySelectorAll('.profile-item');
                const zshItem = Array.from(profileItems).find((item) => item.textContent?.includes('Zsh'));
                zshItem?.click();
                const confirmBtn = document.querySelector('.profile-selector-confirm');
                confirmBtn?.click();
            });
        });
        (0, vitest_1.it)('should create terminal with selected profile when no callback provided', async () => {
            profileManager.showProfileSelector();
            // Simulate profile selection
            const profileItems = document.querySelectorAll('.profile-item');
            const zshItem = Array.from(profileItems).find((item) => item.textContent?.includes('Zsh'));
            zshItem?.click();
            const confirmBtn = document.querySelector('.profile-selector-confirm');
            confirmBtn?.click();
            // Small delay for async operation
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Default Profile Management', () => {
        (0, vitest_1.beforeEach)(() => {
            profileManager.updateProfiles(mockProfiles, 'bash');
        });
        (0, vitest_1.it)('should set default profile', async () => {
            await profileManager.setDefaultProfile('zsh');
            const defaultProfile = profileManager.getDefaultProfile();
            (0, vitest_1.expect)(defaultProfile?.id).toBe('zsh');
        });
        (0, vitest_1.it)('should notify extension of default profile change', async () => {
            await profileManager.setDefaultProfile('zsh');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledTimes(1);
            const message = mockCoordinator.postMessageToExtension.mock.calls[0][0];
            (0, vitest_1.expect)(message.command).toBe('setDefaultProfile');
            (0, vitest_1.expect)(message.profileId).toBe('zsh');
        });
        (0, vitest_1.it)('should throw error when setting non-existent profile as default', async () => {
            await (0, vitest_1.expect)(profileManager.setDefaultProfile('nonexistent')).rejects.toThrow('Profile not found');
        });
        (0, vitest_1.it)('should update isDefault flag on all profiles', async () => {
            await profileManager.setDefaultProfile('zsh');
            const bashProfile = profileManager.getProfile('bash');
            const zshProfile = profileManager.getProfile('zsh');
            (0, vitest_1.expect)(bashProfile?.isDefault).toBe(false);
            (0, vitest_1.expect)(zshProfile?.isDefault).toBe(true);
        });
    });
    (0, vitest_1.describe)('Terminal Creation with Profile', () => {
        (0, vitest_1.beforeEach)(() => {
            profileManager.updateProfiles(mockProfiles, 'bash');
        });
        (0, vitest_1.it)('should create terminal with specified profile', async () => {
            await profileManager.createTerminalWithProfile('zsh');
            (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledTimes(1);
            const args = mockCoordinator.createTerminal.mock.calls[0];
            const [terminalId, terminalName, options] = args;
            (0, vitest_1.expect)(typeof terminalId).toBe('string');
            (0, vitest_1.expect)(terminalName).toContain('Zsh');
            (0, vitest_1.expect)(options.profileId).toBe('zsh');
            (0, vitest_1.expect)(options.shell).toBe('/bin/zsh');
        });
        (0, vitest_1.it)('should create terminal with custom name', async () => {
            await profileManager.createTerminalWithProfile('bash', 'My Custom Terminal');
            const args = mockCoordinator.createTerminal.mock.calls[0];
            const [, terminalName] = args;
            (0, vitest_1.expect)(terminalName).toBe('My Custom Terminal');
        });
        (0, vitest_1.it)('should create terminal with default profile', async () => {
            await profileManager.createTerminalWithDefaultProfile();
            (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledTimes(1);
            const args = mockCoordinator.createTerminal.mock.calls[0];
            const [, , options] = args;
            (0, vitest_1.expect)(options.profileId).toBe('bash');
        });
        (0, vitest_1.it)('should throw error when creating terminal with non-existent profile', async () => {
            await (0, vitest_1.expect)(profileManager.createTerminalWithProfile('nonexistent')).rejects.toThrow('Profile not found');
        });
        (0, vitest_1.it)('should show warning on terminal creation failure', async () => {
            mockCoordinator.createTerminal.mockRejectedValue(new Error('Creation failed'));
            await (0, vitest_1.expect)(profileManager.createTerminalWithProfile('bash')).rejects.toThrow();
            const notificationManager = mockCoordinator.getManagers().notification;
            (0, vitest_1.expect)(notificationManager.showWarning).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Profile Cache Management', () => {
        (0, vitest_1.it)('should cache profiles for 1 minute', async () => {
            profileManager.updateProfiles(mockProfiles);
            // First call - should use cached profiles
            await profileManager.getAvailableProfiles();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
            // Advance time by 30 seconds - should still use cache
            vitest_1.vi.advanceTimersByTime(30000);
            await profileManager.getAvailableProfiles();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).not.toHaveBeenCalled();
            // Advance time by another 31 seconds - cache expired
            vitest_1.vi.advanceTimersByTime(31000);
            await profileManager.getAvailableProfiles();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should refresh profiles from extension', async () => {
            await profileManager.refreshProfiles();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledTimes(1);
            const message = mockCoordinator.postMessageToExtension.mock.calls[0][0];
            (0, vitest_1.expect)(message.command).toBe('getTerminalProfiles');
        });
    });
    (0, vitest_1.describe)('Message Handling', () => {
        (0, vitest_1.it)('should handle profilesUpdated message', () => {
            profileManager.handleMessage({
                command: 'profilesUpdated',
                profiles: mockProfiles,
                defaultProfileId: 'zsh',
            });
            const profiles = profileManager.getProfile('zsh');
            (0, vitest_1.expect)(profiles).toBeDefined();
            const defaultProfile = profileManager.getDefaultProfile();
            (0, vitest_1.expect)(defaultProfile?.id).toBe('zsh');
        });
        (0, vitest_1.it)('should handle defaultProfileChanged message', () => {
            profileManager.updateProfiles(mockProfiles, 'bash');
            profileManager.handleMessage({
                command: 'defaultProfileChanged',
                profileId: 'zsh',
            });
            const defaultProfile = profileManager.getDefaultProfile();
            (0, vitest_1.expect)(defaultProfile?.id).toBe('zsh');
        });
        (0, vitest_1.it)('should log warning for unknown message command', () => {
            const consoleWarnSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            profileManager.handleMessage({
                command: 'unknownCommand',
            });
            // Verify console.warn was called (implementation may log different message format)
            (0, vitest_1.expect)(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('Quick Profile Switching', () => {
        (0, vitest_1.beforeEach)(() => {
            profileManager.updateProfiles(mockProfiles);
        });
        (0, vitest_1.it)('should switch to profile by index', async () => {
            await profileManager.switchToProfileByIndex(1);
            (0, vitest_1.expect)(mockCoordinator.createTerminal).toHaveBeenCalledTimes(1);
            const args = mockCoordinator.createTerminal.mock.calls[0];
            const [, , options] = args;
            (0, vitest_1.expect)(options.profileId).toBe('zsh');
        });
        (0, vitest_1.it)('should handle out of bounds index gracefully', async () => {
            await profileManager.switchToProfileByIndex(999);
            (0, vitest_1.expect)(mockCoordinator.createTerminal).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Statistics', () => {
        (0, vitest_1.it)('should provide profile statistics', () => {
            profileManager.updateProfiles(mockProfiles, 'bash');
            profileManager.showProfileSelector();
            const stats = profileManager.getStats();
            (0, vitest_1.expect)(stats.totalProfiles).toBe(3);
            (0, vitest_1.expect)(stats.defaultProfile).toBe('bash');
            (0, vitest_1.expect)(stats.selectorVisible).toBe(true);
            (0, vitest_1.expect)(typeof stats.lastRefresh).toBe('number');
        });
    });
    (0, vitest_1.describe)('Disposal', () => {
        (0, vitest_1.it)('should clean up profile selector on dispose', async () => {
            await profileManager.initialize();
            profileManager.dispose();
            const container = document.getElementById('profile-selector-container');
            (0, vitest_1.expect)(container).toBeNull();
        });
        (0, vitest_1.it)('should clear all profiles on dispose', async () => {
            profileManager.updateProfiles(mockProfiles);
            profileManager.dispose();
            const stats = profileManager.getStats();
            (0, vitest_1.expect)(stats.totalProfiles).toBe(0);
            (0, vitest_1.expect)(stats.defaultProfile).toBeNull();
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle coordinator not set', async () => {
            const managerWithoutCoordinator = new ProfileManager_1.ProfileManager();
            await managerWithoutCoordinator.initialize();
            const consoleWarnSpy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
            await managerWithoutCoordinator.refreshProfiles();
            // Just logs warning, doesn't throw
            (0, vitest_1.expect)(consoleWarnSpy).toHaveBeenCalled();
            consoleWarnSpy.mockRestore();
            managerWithoutCoordinator.dispose();
        });
        (0, vitest_1.it)('should handle no default profile when creating terminal', async () => {
            profileManager.updateProfiles([]);
            await (0, vitest_1.expect)(profileManager.createTerminalWithDefaultProfile()).rejects.toThrow('No default profile available');
        });
    });
});
//# sourceMappingURL=ProfileManager.test.js.map