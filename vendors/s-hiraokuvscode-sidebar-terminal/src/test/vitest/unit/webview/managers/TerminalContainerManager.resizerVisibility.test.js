"use strict";
// @vitest-environment jsdom
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalContainerManager_1 = require("../../../../../webview/managers/TerminalContainerManager");
(0, vitest_1.describe)('TerminalContainerManager resizer visibility', () => {
    let manager;
    let terminalBody;
    let terminalsWrapper;
    let coordinator;
    (0, vitest_1.beforeEach)(async () => {
        terminalBody = document.createElement('div');
        terminalBody.id = 'terminal-body';
        document.body.appendChild(terminalBody);
        terminalsWrapper = document.createElement('div');
        terminalsWrapper.id = 'terminals-wrapper';
        terminalBody.appendChild(terminalsWrapper);
        coordinator = {
            updatePanelLocationIfNeeded: vitest_1.vi.fn(),
        };
        manager = new TerminalContainerManager_1.TerminalContainerManager(coordinator);
        await manager.initialize();
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('removes stale resizers even when they are not tracked', () => {
        const container = document.createElement('div');
        container.className = 'terminal-container';
        container.dataset.terminalId = 't1';
        manager.registerContainer('t1', container);
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-terminal-wrapper-id', 't1');
        const area = document.createElement('div');
        area.setAttribute('data-terminal-area-id', 't1');
        area.appendChild(container);
        wrapper.appendChild(area);
        terminalsWrapper.appendChild(wrapper);
        // Track wrapper but leave resizers untracked (simulates stale state after restore)
        manager.registerSplitWrapper('t1', wrapper);
        const resizer = document.createElement('div');
        resizer.className = 'split-resizer';
        terminalsWrapper.appendChild(resizer);
        const resizerSet = manager.splitLayoutService.getSplitResizers();
        (0, vitest_1.expect)(resizerSet.size).toBe(0);
        manager.clearSplitArtifacts();
        (0, vitest_1.expect)(terminalsWrapper.contains(resizer)).toBe(false);
        (0, vitest_1.expect)(terminalsWrapper.contains(wrapper)).toBe(false);
        (0, vitest_1.expect)(terminalsWrapper.contains(container)).toBe(true);
    });
});
//# sourceMappingURL=TerminalContainerManager.resizerVisibility.test.js.map