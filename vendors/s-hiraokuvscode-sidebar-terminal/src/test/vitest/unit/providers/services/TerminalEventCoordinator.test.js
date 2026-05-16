"use strict";
/**
 * TerminalEventCoordinator Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const TerminalEventCoordinator_1 = require("../../../../../providers/services/TerminalEventCoordinator");
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn(() => ({
            get: vitest_1.vi.fn((key, def) => def),
        })),
        onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
    },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
// Mock UnifiedConfigurationService
const { mockUnifiedConfig } = vitest_1.vi.hoisted(() => ({
    mockUnifiedConfig: {
        getExtensionTerminalConfig: vitest_1.vi.fn().mockReturnValue({ cursorBlink: true, theme: 'auto' }),
        getCompleteTerminalSettings: vitest_1.vi.fn().mockReturnValue({ cursorBlink: true, theme: 'auto' }),
        getAltClickSettings: vitest_1.vi
            .fn()
            .mockReturnValue({ altClickMovesCursor: true, multiCursorModifier: 'alt' }),
        getWebViewFontSettings: vitest_1.vi.fn().mockReturnValue({ fontSize: 14, fontFamily: 'monospace' }),
        isFeatureEnabled: vitest_1.vi.fn().mockReturnValue(true),
        get: vitest_1.vi.fn((section, key, def) => def),
    },
}));
vitest_1.vi.mock('../../../../../config/UnifiedConfigurationService', () => ({
    getUnifiedConfigurationService: vitest_1.vi.fn(() => mockUnifiedConfig),
}));
(0, vitest_1.describe)('TerminalEventCoordinator', () => {
    let coordinator;
    let mockTerminalManager;
    let mockSendMessage;
    let mockSendCliState;
    let mockInitState;
    (0, vitest_1.beforeEach)(() => {
        mockTerminalManager = {
            onData: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onExit: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onTerminalCreated: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onTerminalRemoved: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onStateUpdate: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onTerminalFocus: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onCliAgentStatusChange: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
        };
        mockSendMessage = vitest_1.vi.fn().mockResolvedValue(undefined);
        mockSendCliState = vitest_1.vi.fn();
        mockInitState = {
            isOutputAllowed: vitest_1.vi.fn().mockReturnValue(true),
        };
        coordinator = new TerminalEventCoordinator_1.TerminalEventCoordinator(mockTerminalManager, mockSendMessage, mockSendCliState, new Map(), mockInitState);
    });
    (0, vitest_1.afterEach)(() => {
        coordinator.dispose();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should setup all listeners', () => {
            coordinator.initialize();
            (0, vitest_1.expect)(mockTerminalManager.onData).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminalManager.onExit).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminalManager.onCliAgentStatusChange).toHaveBeenCalled();
            (0, vitest_1.expect)(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Terminal Events', () => {
        (0, vitest_1.beforeEach)(() => {
            coordinator.setupTerminalEventListeners();
        });
        (0, vitest_1.it)('should forward terminal data to WebView when allowed', () => {
            const onDataHandler = mockTerminalManager.onData.mock.calls[0][0];
            mockInitState.isOutputAllowed.mockReturnValue(true);
            onDataHandler({ terminalId: 't1', data: 'hello' });
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith({
                command: 'output',
                terminalId: 't1',
                data: 'hello',
            });
        });
        (0, vitest_1.it)('should buffer output if not allowed and flush later', () => {
            const onDataHandler = mockTerminalManager.onData.mock.calls[0][0];
            mockInitState.isOutputAllowed.mockReturnValue(false);
            onDataHandler({ terminalId: 't1', data: 'buffered' });
            (0, vitest_1.expect)(mockSendMessage).not.toHaveBeenCalled();
            coordinator.flushBufferedOutput('t1');
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith({
                command: 'output',
                terminalId: 't1',
                data: 'buffered',
            });
        });
        (0, vitest_1.it)('should include displayModeOverride when provided on terminal instance', () => {
            const onCreatedHandler = mockTerminalManager.onTerminalCreated.mock.calls[0][0];
            onCreatedHandler({
                id: 't1',
                name: 'Terminal 1',
                number: 1,
                creationDisplayModeOverride: 'normal',
            });
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalCreated',
                terminalId: 't1',
                config: vitest_1.expect.objectContaining({ displayModeOverride: 'normal' }),
            }));
        });
        (0, vitest_1.it)('should forward exit event', () => {
            const onExitHandler = mockTerminalManager.onExit.mock.calls[0][0];
            onExitHandler({ terminalId: 't1', exitCode: 0 });
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith({
                command: 'exit',
                terminalId: 't1',
                exitCode: 0,
            });
        });
        (0, vitest_1.it)('should forward focus event', () => {
            const onFocusHandler = mockTerminalManager.onTerminalFocus.mock.calls[0][0];
            onFocusHandler('t1');
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith({
                command: 'focusTerminal',
                terminalId: 't1',
            });
        });
    });
    (0, vitest_1.describe)('Configuration Changes', () => {
        (0, vitest_1.it)('should debounce and send settings update', async () => {
            vitest_1.vi.useFakeTimers();
            coordinator.initialize();
            const configHandler = vscode.workspace.onDidChangeConfiguration.mock.calls[0][0];
            // Simulate multiple changes
            configHandler({ affectsConfiguration: (key) => key === 'secondaryTerminal.theme' });
            configHandler({
                affectsConfiguration: (key) => key === 'secondaryTerminal.cursorBlink',
            });
            (0, vitest_1.expect)(mockSendMessage).not.toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'settingsResponse',
            }));
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should send font settings update', async () => {
            vitest_1.vi.useFakeTimers();
            coordinator.initialize();
            const configHandler = vscode.workspace.onDidChangeConfiguration.mock.calls[0][0];
            configHandler({
                affectsConfiguration: (key) => key === 'terminal.integrated.fontSize',
            });
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'fontSettingsUpdate',
            }));
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('CLI Agent Status', () => {
        (0, vitest_1.it)('should trigger full sync on status change', () => {
            coordinator.initialize();
            const onStatusChangeHandler = mockTerminalManager.onCliAgentStatusChange.mock.calls[0][0];
            onStatusChangeHandler({ terminalId: 't1', status: 'connected' });
            (0, vitest_1.expect)(mockSendCliState).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=TerminalEventCoordinator.test.js.map