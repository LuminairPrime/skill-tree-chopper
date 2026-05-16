"use strict";
/**
 * SettingsSyncService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const SettingsSyncService_1 = require("../../../../../providers/services/SettingsSyncService");
const { mockUnifiedConfig } = vitest_1.vi.hoisted(() => ({
    mockUnifiedConfig: {
        getCompleteTerminalSettings: vitest_1.vi.fn(),
        getWebViewFontSettings: vitest_1.vi.fn(),
        getExtensionTerminalConfig: vitest_1.vi.fn(),
        getWebViewTerminalSettings: vitest_1.vi.fn(),
        get: vitest_1.vi.fn(),
        update: vitest_1.vi.fn().mockResolvedValue(undefined),
        isFeatureEnabled: vitest_1.vi.fn(),
        getAltClickSettings: vitest_1.vi.fn(),
    },
}));
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn(() => ({
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn().mockResolvedValue(undefined),
            inspect: vitest_1.vi.fn(),
        })),
    },
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3,
    },
}));
// Mock UnifiedConfigurationService
vitest_1.vi.mock('../../../../../config/UnifiedConfigurationService', () => ({
    getUnifiedConfigurationService: vitest_1.vi.fn(() => mockUnifiedConfig),
}));
// Mock feedback utils
vitest_1.vi.mock('../../../../../utils/feedback', () => ({
    showSuccess: vitest_1.vi.fn(),
    showError: vitest_1.vi.fn(),
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('SettingsSyncService', () => {
    let service;
    let mockReinitializeCallback;
    (0, vitest_1.beforeEach)(() => {
        mockReinitializeCallback = vitest_1.vi.fn().mockResolvedValue(undefined);
        mockUnifiedConfig.update.mockResolvedValue(undefined);
        // Default mocks for migration check in constructor
        vscode.workspace.getConfiguration.mockReturnValue({
            inspect: vitest_1.vi.fn().mockReturnValue({ globalValue: undefined }),
            update: vitest_1.vi.fn().mockResolvedValue(undefined),
        });
        service = new SettingsSyncService_1.SettingsSyncService(mockReinitializeCallback);
    });
    afterEach(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Migration', () => {
        (0, vitest_1.it)('should migrate deprecated settings if found', () => {
            const mockConfig = {
                inspect: vitest_1.vi.fn().mockImplementation((key) => {
                    if (key === 'highlightActiveBorder') {
                        return { globalValue: true };
                    }
                    if (key === 'activeBorderMode') {
                        return { globalValue: undefined };
                    }
                    return undefined;
                }),
                update: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
            // Re-create service to trigger constructor migration
            new SettingsSyncService_1.SettingsSyncService();
            (0, vitest_1.expect)(mockConfig.update).toHaveBeenCalledWith('activeBorderMode', 'multipleOnly', vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should not migrate if new setting already exists', () => {
            const mockConfig = {
                inspect: vitest_1.vi.fn().mockImplementation((key) => {
                    if (key === 'highlightActiveBorder') {
                        return { globalValue: true };
                    }
                    if (key === 'activeBorderMode') {
                        return { globalValue: 'all' }; // Already set
                    }
                    return undefined;
                }),
                update: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
            new SettingsSyncService_1.SettingsSyncService();
            (0, vitest_1.expect)(mockConfig.update).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getCurrentSettings', () => {
        (0, vitest_1.it)('should return combined settings from unified config', () => {
            mockUnifiedConfig.getCompleteTerminalSettings.mockReturnValue({
                cursorBlink: true,
                theme: 'dark',
            });
            mockUnifiedConfig.getAltClickSettings.mockReturnValue({
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
            });
            mockUnifiedConfig.get.mockImplementation((section, key, def) => {
                if (key === 'scrollback')
                    return 5000;
                if (key === 'activeBorderMode')
                    return 'all';
                if (key === 'panelLocation')
                    return 'sidebar';
                return def;
            });
            mockUnifiedConfig.isFeatureEnabled.mockImplementation((feature) => {
                if (feature === 'cliAgentIntegration')
                    return true;
                if (feature === 'dynamicSplitDirection')
                    return false;
                if (feature === 'terminalHeaderEnhancements')
                    return false;
                return false;
            });
            const settings = service.getCurrentSettings();
            (0, vitest_1.expect)(settings).toEqual({
                cursorBlink: true,
                theme: 'dark',
                scrollback: 5000,
                altClickMovesCursor: true,
                multiCursorModifier: 'alt',
                enableCliAgentIntegration: true,
                enableTerminalHeaderEnhancements: false,
                activeBorderMode: 'all',
                dynamicSplitDirection: false,
                panelLocation: 'sidebar',
            });
        });
    });
    (0, vitest_1.describe)('getCurrentFontSettings', () => {
        (0, vitest_1.it)('should delegate to unified config', () => {
            const mockFontSettings = { fontSize: 14, fontFamily: 'Courier' };
            mockUnifiedConfig.getWebViewFontSettings.mockReturnValue(mockFontSettings);
            const result = service.getCurrentFontSettings();
            (0, vitest_1.expect)(result).toBe(mockFontSettings);
            (0, vitest_1.expect)(mockUnifiedConfig.getWebViewFontSettings).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getCompleteSettings', () => {
        (0, vitest_1.it)('should return complete settings', () => {
            mockUnifiedConfig.getExtensionTerminalConfig.mockReturnValue({
                shell: '/bin/bash',
                shellArgs: [],
                fontSize: 16,
                fontFamily: 'Monaco',
                cursor: { style: 'bar', blink: true },
                maxTerminals: 10,
                enableCliAgentIntegration: true,
                enableTerminalHeaderEnhancements: true,
            });
            mockUnifiedConfig.getWebViewTerminalSettings.mockReturnValue({
                theme: 'light',
                dynamicSplitDirection: true,
                panelLocation: 'bottom',
            });
            const settings = service.getCompleteSettings();
            (0, vitest_1.expect)(settings).toEqual({
                shell: '/bin/bash',
                shellArgs: [],
                fontSize: 16,
                fontFamily: 'Monaco',
                theme: 'light',
                cursor: { style: 'bar', blink: true },
                maxTerminals: 10,
                enableCliAgentIntegration: true,
                enableTerminalHeaderEnhancements: true,
                dynamicSplitDirection: true,
                panelLocation: 'bottom',
            });
        });
    });
    (0, vitest_1.describe)('updateSettings', () => {
        (0, vitest_1.it)('should update multiple settings and call reinitialize', async () => {
            const settingsToUpdate = {
                cursorBlink: false,
                theme: 'auto',
                enableCliAgentIntegration: false,
                enableTerminalHeaderEnhancements: false,
                activeBorderMode: 'none',
                dynamicSplitDirection: true,
                panelLocation: 'sidebar',
            };
            // @ts-expect-error - test mock type
            await service.updateSettings(settingsToUpdate);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'cursorBlink', false);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'theme', 'auto');
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'enableCliAgentIntegration', false);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'enableTerminalHeaderEnhancements', false);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'activeBorderMode', 'none');
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'dynamicSplitDirection', true);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'panelLocation', 'sidebar');
            (0, vitest_1.expect)(mockReinitializeCallback).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should only update provided settings', async () => {
            await service.updateSettings({ theme: 'dark' });
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockUnifiedConfig.update).toHaveBeenCalledWith('secondaryTerminal', 'theme', 'dark');
        });
        (0, vitest_1.it)('should handle errors gracefully', async () => {
            const { showError } = await Promise.resolve().then(() => require('../../../../../utils/feedback'));
            mockUnifiedConfig.update.mockRejectedValue(new Error('Update failed'));
            await service.updateSettings({ theme: 'dark' });
            (0, vitest_1.expect)(showError).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Failed to update settings'));
        });
    });
    (0, vitest_1.describe)('getAltClickSettings', () => {
        (0, vitest_1.it)('should retrieve settings from vscode configuration', () => {
            const mockGet = vitest_1.vi.fn().mockImplementation((key, def) => {
                if (key === 'altClickMovesCursor')
                    return true;
                if (key === 'multiCursorModifier')
                    return 'ctrlCmd';
                return def;
            });
            vscode.workspace.getConfiguration.mockReturnValue({
                get: mockGet,
            });
            const result = service.getAltClickSettings();
            (0, vitest_1.expect)(result).toEqual({
                altClickMovesCursor: true,
                multiCursorModifier: 'ctrlCmd',
            });
        });
    });
    (0, vitest_1.describe)('setReinitializeCallback', () => {
        (0, vitest_1.it)('should update the reinitialize callback', async () => {
            const newCallback = vitest_1.vi.fn().mockResolvedValue(undefined);
            service.setReinitializeCallback(newCallback);
            await service.updateSettings({ theme: 'dark' });
            (0, vitest_1.expect)(newCallback).toHaveBeenCalled();
            (0, vitest_1.expect)(mockReinitializeCallback).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=SettingsSyncService.test.js.map