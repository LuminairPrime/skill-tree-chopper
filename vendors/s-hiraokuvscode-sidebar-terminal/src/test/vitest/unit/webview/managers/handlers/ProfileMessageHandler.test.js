"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ProfileMessageHandler_1 = require("../../../../../../webview/managers/handlers/ProfileMessageHandler");
(0, vitest_1.describe)('ProfileMessageHandler', () => {
    let handler;
    let mockLogger;
    let mockCoordinator;
    let mockProfileManager;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
        };
        mockProfileManager = {
            showProfileSelector: vitest_1.vi.fn(),
            handleMessage: vitest_1.vi.fn(),
        };
        mockCoordinator = {
            getManagers: vitest_1.vi.fn().mockReturnValue({
                profile: mockProfileManager,
            }),
        };
        handler = new ProfileMessageHandler_1.ProfileMessageHandler(mockLogger);
    });
    (0, vitest_1.it)('should return supported commands', () => {
        const commands = handler.getSupportedCommands();
        (0, vitest_1.expect)(commands).toContain('showProfileSelector');
        (0, vitest_1.expect)(commands).toContain('profilesUpdated');
        (0, vitest_1.expect)(commands).toContain('defaultProfileChanged');
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should handle showProfileSelector', () => {
            handler.handleMessage({ command: 'showProfileSelector' }, mockCoordinator);
            (0, vitest_1.expect)(mockProfileManager.showProfileSelector).toHaveBeenCalled();
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith('Show profile selector');
        });
        (0, vitest_1.it)('should handle profilesUpdated', () => {
            const msg = { command: 'profilesUpdated', profiles: [] };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockProfileManager.handleMessage).toHaveBeenCalledWith(msg);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith('Profiles updated');
        });
        (0, vitest_1.it)('should handle defaultProfileChanged', () => {
            const msg = { command: 'defaultProfileChanged', profile: 'bash' };
            handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockProfileManager.handleMessage).toHaveBeenCalledWith(msg);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith('Default profile changed');
        });
        (0, vitest_1.it)('should warn on unknown command', () => {
            handler.handleMessage({ command: 'unknown' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Unknown profile command'));
        });
        (0, vitest_1.it)('should warn if command property is missing', () => {
            handler.handleMessage({}, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('without command property'));
        });
    });
});
//# sourceMappingURL=ProfileMessageHandler.test.js.map