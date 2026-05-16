"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const KeyboardShortcutService_1 = require("../../../../services/KeyboardShortcutService");
const commandHandlers = new Map();
const configChangeListeners = [];
const mocks = vitest_1.vi.hoisted(() => {
    const mockCommands = {
        registerCommand: vitest_1.vi.fn((command, handler) => {
            commandHandlers.set(command, handler);
            return { dispose: vitest_1.vi.fn() };
        }),
        executeCommand: vitest_1.vi.fn(),
    };
    const mockWindow = {
        showWarningMessage: vitest_1.vi.fn(),
        showErrorMessage: vitest_1.vi.fn(),
    };
    const mockWorkspace = {
        getConfiguration: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        }),
        onDidChangeConfiguration: vitest_1.vi.fn((listener) => {
            configChangeListeners.push(listener);
            return { dispose: vitest_1.vi.fn() };
        }),
    };
    return {
        mockCommands,
        mockWindow,
        mockWorkspace,
    };
});
vitest_1.vi.mock('vscode', () => ({
    commands: mocks.mockCommands,
    window: mocks.mockWindow,
    workspace: mocks.mockWorkspace,
}));
vitest_1.vi.mock('../../../../utils/logger', () => ({
    terminal: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('KeyboardShortcutService', () => {
    let terminalManager;
    let service;
    let webviewProvider;
    (0, vitest_1.beforeEach)(() => {
        commandHandlers.clear();
        configChangeListeners.length = 0;
        mocks.mockCommands.registerCommand.mockClear();
        mocks.mockCommands.executeCommand.mockClear();
        mocks.mockWindow.showWarningMessage.mockClear();
        mocks.mockWindow.showErrorMessage.mockClear();
        mocks.mockWorkspace.getConfiguration.mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        });
        mocks.mockWorkspace.onDidChangeConfiguration.mockClear();
        mocks.mockWorkspace.onDidChangeConfiguration.mockImplementation((listener) => {
            configChangeListeners.push(listener);
            return { dispose: vitest_1.vi.fn() };
        });
        terminalManager = {
            getDefaultProfile: vitest_1.vi.fn().mockReturnValue(null),
            createTerminal: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            createTerminalWithProfile: vitest_1.vi.fn().mockResolvedValue('terminal-2'),
            setActiveTerminal: vitest_1.vi.fn(),
        };
        webviewProvider = {
            sendMessageToWebview: vitest_1.vi.fn(),
        };
        service = new KeyboardShortcutService_1.KeyboardShortcutService(terminalManager);
        service.setWebviewProvider(webviewProvider);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
    });
    (0, vitest_1.it)('should create terminal with fullscreen display override when no default profile', async () => {
        await service.createTerminal();
        (0, vitest_1.expect)(terminalManager.createTerminal).toHaveBeenCalledWith({
            displayModeOverride: 'fullscreen',
        });
        (0, vitest_1.expect)(terminalManager.setActiveTerminal).toHaveBeenCalledWith('terminal-1');
        (0, vitest_1.expect)(webviewProvider.sendMessageToWebview).toHaveBeenCalledWith({
            command: 'setDisplayMode',
            mode: 'fullscreen',
            forceNextCreate: true,
        });
    });
    (0, vitest_1.it)('should create terminal with fullscreen display override when default profile exists', async () => {
        terminalManager.getDefaultProfile.mockReturnValue('bash');
        await service.createTerminal();
        (0, vitest_1.expect)(terminalManager.createTerminalWithProfile).toHaveBeenCalledWith('bash', {
            displayModeOverride: 'fullscreen',
        });
        (0, vitest_1.expect)(terminalManager.setActiveTerminal).toHaveBeenCalledWith('terminal-2');
        (0, vitest_1.expect)(webviewProvider.sendMessageToWebview).toHaveBeenCalledWith({
            command: 'setDisplayMode',
            mode: 'fullscreen',
            forceNextCreate: true,
        });
    });
    (0, vitest_1.it)('should toggle panel navigation mode context via command', async () => {
        const handler = commandHandlers.get('secondaryTerminal.togglePanelNavigationMode');
        (0, vitest_1.expect)(handler).toBeDefined();
        await handler?.();
        (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigationMode', true);
        (0, vitest_1.expect)(webviewProvider.sendMessageToWebview).toHaveBeenCalledWith({
            command: 'panelNavigationMode',
            enabled: true,
        });
        await handler?.();
        (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigationMode', false);
        (0, vitest_1.expect)(webviewProvider.sendMessageToWebview).toHaveBeenCalledWith({
            command: 'panelNavigationMode',
            enabled: false,
        });
    });
    (0, vitest_1.it)('should exit panel navigation mode context via command', async () => {
        const toggleHandler = commandHandlers.get('secondaryTerminal.togglePanelNavigationMode');
        const exitHandler = commandHandlers.get('secondaryTerminal.exitPanelNavigationMode');
        (0, vitest_1.expect)(toggleHandler).toBeDefined();
        (0, vitest_1.expect)(exitHandler).toBeDefined();
        await toggleHandler?.();
        await exitHandler?.();
        (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenLastCalledWith('setContext', 'secondaryTerminal.panelNavigationMode', false);
        (0, vitest_1.expect)(webviewProvider.sendMessageToWebview).toHaveBeenLastCalledWith({
            command: 'panelNavigationMode',
            enabled: false,
        });
    });
    (0, vitest_1.describe)('Panel Navigation Enabled', () => {
        (0, vitest_1.it)('should initialize panel navigation enabled context key from settings (default: false)', () => {
            (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigation.enabled', false);
        });
        (0, vitest_1.it)('should initialize panel navigation enabled context key as true when setting is enabled', () => {
            mocks.mockCommands.executeCommand.mockClear();
            mocks.mockWorkspace.getConfiguration.mockReturnValue({
                get: vitest_1.vi.fn().mockReturnValue(true),
            });
            const svc = new KeyboardShortcutService_1.KeyboardShortcutService(terminalManager);
            (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigation.enabled', true);
            svc.dispose();
        });
        (0, vitest_1.it)('should update panel navigation enabled context key when configuration changes', () => {
            mocks.mockWorkspace.getConfiguration.mockReturnValue({
                get: vitest_1.vi.fn().mockReturnValue(true),
            });
            const event = {
                affectsConfiguration: (key) => key === 'secondaryTerminal.panelNavigation.enabled',
            };
            configChangeListeners.forEach((listener) => {
                listener(event);
            });
            (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigation.enabled', true);
        });
        (0, vitest_1.it)('should not react to unrelated configuration changes', () => {
            mocks.mockCommands.executeCommand.mockClear();
            const event = {
                affectsConfiguration: (key) => key === 'editor.fontSize',
            };
            configChangeListeners.forEach((listener) => {
                listener(event);
            });
            (0, vitest_1.expect)(mocks.mockCommands.executeCommand).not.toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigation.enabled', vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should clear panel navigation enabled context key on dispose', () => {
            service.dispose();
            (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminal.panelNavigation.enabled', false);
        });
    });
});
//# sourceMappingURL=KeyboardShortcutService.test.js.map