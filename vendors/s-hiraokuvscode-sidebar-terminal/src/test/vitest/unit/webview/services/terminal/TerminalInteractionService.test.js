"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const EventHandlerRegistry_1 = require("../../../../../../webview/utils/EventHandlerRegistry");
const TerminalInteractionService_1 = require("../../../../../../webview/services/terminal/TerminalInteractionService");
(0, vitest_1.describe)('TerminalInteractionService', () => {
    let dom;
    let eventRegistry;
    let service;
    let coordinator;
    let terminal;
    let container;
    let terminalContent;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><body></body>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        coordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            shellIntegrationManager: {
                decorateTerminalOutput: vitest_1.vi.fn(),
            },
        };
        terminal = {
            open: vitest_1.vi.fn(),
            attachCustomKeyEventHandler: vitest_1.vi.fn(),
        };
        container = document.createElement('div');
        terminalContent = document.createElement('div');
        service = new TerminalInteractionService_1.TerminalInteractionService({
            coordinator,
            eventRegistry,
            lifecycleController: {
                attachTerminal: vitest_1.vi.fn(),
            },
            eventManager: {
                setupTerminalEvents: vitest_1.vi.fn(),
            },
            focusService: {
                ensureTerminalFocus: vitest_1.vi.fn(),
                setupContainerFocusHandler: vitest_1.vi.fn(),
            },
        });
    });
    (0, vitest_1.afterEach)(() => {
        eventRegistry.dispose();
        dom.window.close();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('opens the terminal and wires focus, lifecycle, event, and shell integration', () => {
        const applyPostOpenSettings = vitest_1.vi.fn();
        service.setupTerminalInteraction({
            terminalId: 'terminal-1',
            terminal,
            container,
            terminalContent,
            currentSettings: undefined,
            currentFontSettings: undefined,
            configManager: undefined,
            uiManager: undefined,
            applyPostOpenSettings,
        });
        (0, vitest_1.expect)(terminal.open).toHaveBeenCalledWith(terminalContent);
        (0, vitest_1.expect)(applyPostOpenSettings).toHaveBeenCalled();
        (0, vitest_1.expect)(coordinator.shellIntegrationManager.decorateTerminalOutput).toHaveBeenCalledWith(terminal, 'terminal-1');
    });
    (0, vitest_1.it)('routes text paste and image paste to the extension instead of xterm default handling', () => {
        service.setupTerminalInteraction({
            terminalId: 'terminal-1',
            terminal,
            container,
            terminalContent,
            currentSettings: undefined,
            currentFontSettings: undefined,
            configManager: undefined,
            uiManager: undefined,
            applyPostOpenSettings: vitest_1.vi.fn(),
        });
        const textPasteEvent = new dom.window.Event('paste', {
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(textPasteEvent, 'clipboardData', {
            value: {
                items: [],
                getData: vitest_1.vi.fn().mockReturnValue('hello'),
            },
        });
        terminalContent.dispatchEvent(textPasteEvent);
        (0, vitest_1.expect)(coordinator.postMessageToExtension).toHaveBeenCalledWith({
            command: 'pasteText',
            terminalId: 'terminal-1',
            text: 'hello',
        });
        const imagePasteEvent = new dom.window.Event('paste', {
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(imagePasteEvent, 'clipboardData', {
            value: {
                items: [{ type: 'image/png' }],
                getData: vitest_1.vi.fn().mockReturnValue(''),
            },
        });
        terminalContent.dispatchEvent(imagePasteEvent);
        (0, vitest_1.expect)(coordinator.postMessageToExtension).toHaveBeenCalledWith({
            command: 'input',
            terminalId: 'terminal-1',
            data: '\x16',
        });
    });
});
//# sourceMappingURL=TerminalInteractionService.test.js.map