"use strict";
/**
 * WebviewCoordinator Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
require("../../../../shared/TestSetup");
const WebviewCoordinator_1 = require("../../../../../webview/coordinators/WebviewCoordinator");
const createHandler = () => ({ handleMessage: vitest_1.vi.fn() });
const createSessionController = () => ({
    handleSessionRestoreMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    handleSessionRestoreStartedMessage: vitest_1.vi.fn(),
    handleSessionRestoreProgressMessage: vitest_1.vi.fn(),
    handleSessionRestoreCompletedMessage: vitest_1.vi.fn(),
    handleSessionRestoreErrorMessage: vitest_1.vi.fn(),
    handleSessionSavedMessage: vitest_1.vi.fn(),
    handleSessionSaveErrorMessage: vitest_1.vi.fn(),
    handleSessionClearedMessage: vitest_1.vi.fn(),
    handleSessionRestoredMessage: vitest_1.vi.fn(),
    handleSessionRestoreSkippedMessage: vitest_1.vi.fn(),
    handleTerminalRestoreErrorMessage: vitest_1.vi.fn(),
});
const createCliAgentController = () => ({
    handleStatusUpdateMessage: vitest_1.vi.fn(),
    handleFullStateSyncMessage: vitest_1.vi.fn(),
    handleSwitchResponseMessage: vitest_1.vi.fn(),
});
(0, vitest_1.describe)('WebviewCoordinator', () => {
    let coordinator;
    let lifecycleHandler;
    let settingsHandler;
    let shellHandler;
    let serializationHandler;
    let scrollbackHandler;
    let panelHandler;
    let splitHandler;
    let profileHandler;
    let sessionController;
    let cliAgentController;
    let logger;
    (0, vitest_1.beforeEach)(() => {
        lifecycleHandler = createHandler();
        settingsHandler = createHandler();
        shellHandler = createHandler();
        serializationHandler = createHandler();
        scrollbackHandler = createHandler();
        panelHandler = createHandler();
        splitHandler = createHandler();
        profileHandler = createHandler();
        sessionController = createSessionController();
        cliAgentController = createCliAgentController();
        logger = {
            warn: vitest_1.vi.fn(),
            info: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
        };
        coordinator = new WebviewCoordinator_1.WebviewCoordinator({
            lifecycleHandler: lifecycleHandler,
            settingsHandler: settingsHandler,
            shellIntegrationHandler: shellHandler,
            serializationHandler: serializationHandler,
            scrollbackHandler: scrollbackHandler,
            panelLocationHandler: panelHandler,
            splitHandler: splitHandler,
            profileHandler: profileHandler,
            sessionController: sessionController,
            cliAgentController: cliAgentController,
        }, 
        // @ts-expect-error - test mock type
        logger);
    });
    (0, vitest_1.it)('dispatches lifecycle commands to the lifecycle handler', async () => {
        const message = { command: 'init' };
        await coordinator.dispatch(message, {});
        (0, vitest_1.expect)(lifecycleHandler.handleMessage).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('dispatches setDisplayMode to the split handler', async () => {
        const message = { command: 'setDisplayMode', mode: 'split' };
        await coordinator.dispatch(message, {});
        (0, vitest_1.expect)(splitHandler.handleMessage).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('routes session restore events to the session controller', async () => {
        const message = { command: 'sessionRestore' };
        await coordinator.dispatch(message, {});
        (0, vitest_1.expect)(sessionController.handleSessionRestoreMessage).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('logs a warning for unknown commands', async () => {
        const message = { command: 'unknownCommand' };
        await coordinator.dispatch(message, {});
        (0, vitest_1.expect)(logger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('unknownCommand'));
    });
    (0, vitest_1.it)('exposes registered command list', () => {
        const commands = coordinator.getRegisteredCommands();
        (0, vitest_1.expect)(commands).toContain('split');
        (0, vitest_1.expect)(commands).toContain('sessionRestore');
    });
});
//# sourceMappingURL=WebviewCoordinator.test.js.map