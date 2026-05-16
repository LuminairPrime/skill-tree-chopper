"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const SplitManager_1 = require("../../../../../../webview/managers/SplitManager");
const TerminalDomService_1 = require("../../../../../../webview/services/terminal/TerminalDomService");
(0, vitest_1.describe)('TerminalDomService', () => {
    let dom;
    let splitManager;
    let service;
    let coordinator;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <body>
        <div id="terminal-view">
          <div id="terminal-body"></div>
        </div>
      </body>
    `);
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        splitManager = new SplitManager_1.SplitManager({ postMessageToExtension: vitest_1.vi.fn() });
        coordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
            setActiveTerminalId: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            deleteTerminalSafely: vitest_1.vi.fn(),
            handleAiAgentToggle: vitest_1.vi.fn(),
            profileManager: {
                createTerminalWithDefaultProfile: vitest_1.vi.fn(),
            },
            getManagers: vitest_1.vi.fn().mockReturnValue({
                tabs: {
                    addTab: vitest_1.vi.fn(),
                    handleTerminalRenamed: vitest_1.vi.fn(),
                },
            }),
        };
        service = new TerminalDomService_1.TerminalDomService({
            splitManager,
            coordinator,
        });
    });
    (0, vitest_1.afterEach)(() => {
        dom.window.close();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.it)('creates terminals-wrapper on demand, appends container, and applies active border styling', () => {
        const uiManager = {
            applyVSCodeStyling: vitest_1.vi.fn(),
            updateSingleTerminalBorder: vitest_1.vi.fn(),
        };
        const result = service.createAndInsertContainer({
            terminalId: 'terminal-1',
            terminalName: 'Terminal 1',
            config: { isActive: true },
            terminalNumber: undefined,
            currentSettings: { enableTerminalHeaderEnhancements: true },
            uiManager,
        });
        const wrapper = document.getElementById('terminals-wrapper');
        (0, vitest_1.expect)(wrapper).not.toBeNull();
        (0, vitest_1.expect)(wrapper?.contains(result.container)).toBe(true);
        (0, vitest_1.expect)(result.terminalNumberToUse).toBe(1);
        (0, vitest_1.expect)(uiManager.applyVSCodeStyling).toHaveBeenCalledWith(result.container);
        (0, vitest_1.expect)(uiManager.updateSingleTerminalBorder).toHaveBeenCalledWith(result.container, true);
    });
    (0, vitest_1.it)('reuses the first available terminal number when the id does not encode one', () => {
        splitManager.getTerminals().set('terminal-1', { number: 1 });
        splitManager.getTerminals().set('terminal-3', { number: 3 });
        const result = service.createAndInsertContainer({
            terminalId: 'session-restored',
            terminalName: 'Recovered Terminal',
            config: undefined,
            terminalNumber: undefined,
            currentSettings: undefined,
            uiManager: undefined,
        });
        (0, vitest_1.expect)(result.terminalNumberToUse).toBe(2);
    });
});
//# sourceMappingURL=TerminalDomService.test.js.map