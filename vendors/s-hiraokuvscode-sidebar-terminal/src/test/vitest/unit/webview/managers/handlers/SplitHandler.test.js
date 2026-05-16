"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SplitHandler_1 = require("../../../../../../webview/managers/handlers/SplitHandler");
(0, vitest_1.describe)('SplitHandler', () => {
    let handler;
    let mockLogger;
    let mockCoordinator;
    let mockSplitManager;
    let mockContainerManager;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
        };
        mockSplitManager = {
            splitTerminal: vitest_1.vi.fn(),
            terminals: new Map([
                ['t1', {}],
                ['t2', {}],
            ]),
            splitDirection: 'vertical',
        };
        mockContainerManager = {
            getContainerOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2']),
            applyDisplayState: vitest_1.vi.fn(),
        };
        mockCoordinator = {
            getSplitManager: vitest_1.vi.fn().mockReturnValue(mockSplitManager),
            getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue(mockContainerManager),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('t1'),
        };
        handler = new SplitHandler_1.SplitHandler(mockLogger);
    });
    (0, vitest_1.it)('should return supported commands', () => {
        const commands = handler.getSupportedCommands();
        (0, vitest_1.expect)(commands).toContain('split');
        (0, vitest_1.expect)(commands).toContain('relayoutTerminals');
        (0, vitest_1.expect)(commands).toContain('setDisplayMode');
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should handle split with direction', () => {
            handler.handleMessage({ command: 'split', direction: 'horizontal' }, mockCoordinator);
            (0, vitest_1.expect)(mockSplitManager.splitTerminal).toHaveBeenCalledWith('horizontal');
        });
        (0, vitest_1.it)('should handle split with default direction', () => {
            handler.handleMessage({ command: 'split' }, mockCoordinator);
            (0, vitest_1.expect)(mockSplitManager.splitTerminal).toHaveBeenCalledWith('vertical');
        });
        (0, vitest_1.it)('should handle relayoutTerminals', () => {
            handler.handleMessage({ command: 'relayoutTerminals', direction: 'horizontal' }, mockCoordinator);
            (0, vitest_1.expect)(mockSplitManager.splitDirection).toBe('horizontal');
            (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                mode: 'split',
                splitDirection: 'horizontal',
            }));
        });
        (0, vitest_1.it)('should skip relayout if less than 2 terminals', () => {
            mockSplitManager.terminals = new Map([['t1', {}]]);
            handler.handleMessage({ command: 'relayoutTerminals' }, mockCoordinator);
            (0, vitest_1.expect)(mockContainerManager.applyDisplayState).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should warn if SplitManager is missing', () => {
            mockCoordinator.getSplitManager.mockReturnValue(null);
            handler.handleMessage({ command: 'split' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SplitManager not available'));
        });
        (0, vitest_1.it)('should set display mode when requested', () => {
            const displayModeManager = { setDisplayMode: vitest_1.vi.fn() };
            mockCoordinator.getDisplayModeManager = vitest_1.vi.fn().mockReturnValue(displayModeManager);
            handler.handleMessage({ command: 'setDisplayMode', mode: 'normal' }, mockCoordinator);
            (0, vitest_1.expect)(displayModeManager.setDisplayMode).toHaveBeenCalledWith('normal');
        });
        (0, vitest_1.it)('should request forcing normal mode for next create when flagged', () => {
            const displayModeManager = { setDisplayMode: vitest_1.vi.fn() };
            const setForce = vitest_1.vi.fn();
            mockCoordinator.getDisplayModeManager = vitest_1.vi.fn().mockReturnValue(displayModeManager);
            mockCoordinator.setForceNormalModeForNextCreate = setForce;
            handler.handleMessage({ command: 'setDisplayMode', mode: 'normal', forceNextCreate: true }, mockCoordinator);
            (0, vitest_1.expect)(displayModeManager.setDisplayMode).toHaveBeenCalledWith('normal');
            (0, vitest_1.expect)(setForce).toHaveBeenCalledWith(true);
        });
    });
});
//# sourceMappingURL=SplitHandler.test.js.map