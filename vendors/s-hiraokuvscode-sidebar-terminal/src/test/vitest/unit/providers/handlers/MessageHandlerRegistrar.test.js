"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * MessageHandlerRegistrar Tests
 *
 * Verifies that all handler definitions are built and registered on the router.
 */
const vitest_1 = require("vitest");
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockReturnValue(false),
        }),
    },
    commands: {
        executeCommand: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../../../../constants', () => ({
    TERMINAL_CONSTANTS: {
        COMMANDS: {
            READY: 'ready',
            FOCUS_TERMINAL: 'focusTerminal_const',
            CREATE_TERMINAL: 'createTerminal_const',
            INPUT: 'input',
            RESIZE: 'resize',
            START_OUTPUT: 'startOutput',
        },
    },
}));
const MessageHandlerRegistrar_1 = require("../../../../../providers/handlers/MessageHandlerRegistrar");
function createMockDeps() {
    return {
        handleWebviewReady: vitest_1.vi.fn(),
        handleWebviewInitialized: vitest_1.vi.fn().mockResolvedValue(undefined),
        handleReportPanelLocation: vitest_1.vi.fn().mockResolvedValue(undefined),
        handleTerminalInitializationComplete: vitest_1.vi.fn().mockResolvedValue(undefined),
        handleTerminalReady: vitest_1.vi.fn().mockResolvedValue(undefined),
        handlePersistenceMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
        handleLegacyPersistenceMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
        terminalCommandHandlers: {
            handleFocusTerminal: vitest_1.vi.fn(),
            handleSplitTerminal: vitest_1.vi.fn(),
            handleCreateTerminal: vitest_1.vi.fn(),
            handleTerminalInput: vitest_1.vi.fn(),
            handleTerminalResize: vitest_1.vi.fn(),
            handleGetTerminalProfiles: vitest_1.vi.fn(),
            handleKillTerminal: vitest_1.vi.fn(),
            handleDeleteTerminal: vitest_1.vi.fn(),
            handleTerminalClosed: vitest_1.vi.fn(),
            handleOpenTerminalLink: vitest_1.vi.fn(),
            handleReorderTerminals: vitest_1.vi.fn(),
            handleRenameTerminal: vitest_1.vi.fn(),
            handleUpdateTerminalHeader: vitest_1.vi.fn(),
            handleRequestInitialTerminal: vitest_1.vi.fn(),
            handleTerminalInteraction: vitest_1.vi.fn(),
            handleClipboardRequest: vitest_1.vi.fn(),
            handleCopyToClipboard: vitest_1.vi.fn(),
            handlePasteImage: vitest_1.vi.fn(),
            handlePasteText: vitest_1.vi.fn(),
            handleSwitchAiAgent: vitest_1.vi.fn(),
        },
        settingsMessageHandler: {
            handleGetSettings: vitest_1.vi.fn(),
            handleUpdateSettings: vitest_1.vi.fn(),
        },
        scrollbackMessageHandler: {
            handlePushScrollbackData: vitest_1.vi.fn(),
            handleScrollbackDataCollected: vitest_1.vi.fn(),
            handleScrollbackRefreshRequest: vitest_1.vi.fn(),
        },
        debugMessageHandler: {
            handleHtmlScriptTest: vitest_1.vi.fn(),
            handleTimeoutTest: vitest_1.vi.fn(),
            handleDebugTest: vitest_1.vi.fn(),
        },
    };
}
function createMockRouter() {
    return {
        reset: vitest_1.vi.fn(),
        registerHandlers: vitest_1.vi.fn(),
        validateHandlers: vitest_1.vi.fn(),
        logRegisteredHandlers: vitest_1.vi.fn(),
    };
}
(0, vitest_1.describe)('MessageHandlerRegistrar', () => {
    let registrar;
    let deps;
    let router;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        deps = createMockDeps();
        registrar = new MessageHandlerRegistrar_1.MessageHandlerRegistrar(deps);
        router = createMockRouter();
    });
    (0, vitest_1.describe)('registerAll', () => {
        (0, vitest_1.it)('should reset the router before registering', () => {
            registrar.registerAll(router);
            (0, vitest_1.expect)(router.reset).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should register handlers on the router', () => {
            registrar.registerAll(router);
            (0, vitest_1.expect)(router.registerHandlers).toHaveBeenCalledOnce();
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            (0, vitest_1.expect)(handlers.length).toBeGreaterThan(30);
        });
        (0, vitest_1.it)('should validate critical handlers', () => {
            registrar.registerAll(router);
            (0, vitest_1.expect)(router.validateHandlers).toHaveBeenCalledOnce();
            // @ts-expect-error - test mock type
            const criticalCommands = router.validateHandlers.mock.calls[0][0];
            (0, vitest_1.expect)(criticalCommands).toContain('terminalInitializationComplete');
            (0, vitest_1.expect)(criticalCommands).toContain('terminalReady');
        });
        (0, vitest_1.it)('should log registered handlers', () => {
            registrar.registerAll(router);
            (0, vitest_1.expect)(router.logRegisteredHandlers).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should include UI handlers', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const commands = handlers.map((h) => h.command);
            (0, vitest_1.expect)(commands).toContain('webviewReady');
            (0, vitest_1.expect)(commands).toContain('webviewInitialized');
            (0, vitest_1.expect)(commands).toContain('reportPanelLocation');
        });
        (0, vitest_1.it)('should include settings handlers', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const commands = handlers.map((h) => h.command);
            (0, vitest_1.expect)(commands).toContain('getSettings');
            (0, vitest_1.expect)(commands).toContain('updateSettings');
        });
        (0, vitest_1.it)('should include terminal handlers', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const commands = handlers.map((h) => h.command);
            (0, vitest_1.expect)(commands).toContain('splitTerminal');
            (0, vitest_1.expect)(commands).toContain('createTerminal');
            (0, vitest_1.expect)(commands).toContain('killTerminal');
            (0, vitest_1.expect)(commands).toContain('deleteTerminal');
            (0, vitest_1.expect)(commands).toContain('terminalFocused');
            (0, vitest_1.expect)(commands).toContain('terminalBlurred');
            (0, vitest_1.expect)(commands).toContain('terminalInitializationComplete');
            (0, vitest_1.expect)(commands).toContain('terminalReady');
        });
        (0, vitest_1.it)('should include persistence handlers', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const commands = handlers.map((h) => h.command);
            (0, vitest_1.expect)(commands).toContain('persistenceSaveSession');
            (0, vitest_1.expect)(commands).toContain('persistenceRestoreSession');
            (0, vitest_1.expect)(commands).toContain('pushScrollbackData');
            (0, vitest_1.expect)(commands).toContain('scrollbackDataCollected');
        });
        (0, vitest_1.it)('should include debug handlers', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const commands = handlers.map((h) => h.command);
            (0, vitest_1.expect)(commands).toContain('htmlScriptTest');
            (0, vitest_1.expect)(commands).toContain('timeoutTest');
            (0, vitest_1.expect)(commands).toContain('test');
        });
        (0, vitest_1.it)('should categorize handlers correctly', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const categories = new Set(handlers.map((h) => h.category));
            (0, vitest_1.expect)(categories).toContain('ui');
            (0, vitest_1.expect)(categories).toContain('settings');
            (0, vitest_1.expect)(categories).toContain('terminal');
            (0, vitest_1.expect)(categories).toContain('persistence');
            (0, vitest_1.expect)(categories).toContain('debug');
        });
    });
    (0, vitest_1.describe)('handler delegation', () => {
        (0, vitest_1.it)('should delegate webviewReady to deps', () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const webviewReadyHandler = handlers.find((h) => h.command === 'webviewReady');
            const msg = { command: 'webviewReady' };
            webviewReadyHandler.handler(msg);
            (0, vitest_1.expect)(deps.handleWebviewReady).toHaveBeenCalledWith(msg);
        });
        (0, vitest_1.it)('should delegate terminalInitializationComplete to deps', async () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const initHandler = handlers.find((h) => h.command === 'terminalInitializationComplete');
            const msg = { command: 'terminalInitializationComplete', terminalId: '1' };
            await initHandler.handler(msg);
            (0, vitest_1.expect)(deps.handleTerminalInitializationComplete).toHaveBeenCalledWith(msg);
        });
        (0, vitest_1.it)('should delegate persistence messages to deps', async () => {
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const saveHandler = handlers.find((h) => h.command === 'persistenceSaveSession');
            const msg = { command: 'persistenceSaveSession' };
            await saveHandler.handler(msg);
            (0, vitest_1.expect)(deps.handlePersistenceMessage).toHaveBeenCalledWith(msg);
        });
        (0, vitest_1.it)('should set focus context on terminalFocused', async () => {
            const vscode = await Promise.resolve().then(() => require('vscode'));
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const focusHandler = handlers.find((h) => h.command === 'terminalFocused');
            await focusHandler.handler({ command: 'terminalFocused', terminalId: '1' });
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminalFocus', true);
        });
        (0, vitest_1.it)('should clear focus context on terminalBlurred', async () => {
            const vscode = await Promise.resolve().then(() => require('vscode'));
            registrar.registerAll(router);
            // @ts-expect-error - test mock type
            const handlers = router.registerHandlers.mock.calls[0][0];
            const blurHandler = handlers.find((h) => h.command === 'terminalBlurred');
            await blurHandler.handler({ command: 'terminalBlurred', terminalId: '1' });
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('setContext', 'secondaryTerminalFocus', false);
        });
    });
});
//# sourceMappingURL=MessageHandlerRegistrar.test.js.map