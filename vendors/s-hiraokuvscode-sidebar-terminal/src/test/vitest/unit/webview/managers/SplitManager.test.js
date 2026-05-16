"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SplitManager_1 = require("../../../../../webview/managers/SplitManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../webview/utils/NotificationUtils', () => ({
    showSplitLimitWarning: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        resetXtermInlineStyles: vitest_1.vi.fn(),
        forceReflow: vitest_1.vi.fn(),
        clearContainerHeightStyles: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    splitLogger: {
        info: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        lifecycle: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('SplitManager', () => {
    let manager;
    let mockCoordinator;
    let mockContainerManager;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        mockContainerManager = {
            getContainerOrder: vitest_1.vi.fn().mockReturnValue(['t1', 't2']),
            applyDisplayState: vitest_1.vi.fn(),
            clearSplitArtifacts: vitest_1.vi.fn(),
        };
        mockCoordinator = {
            getTerminalContainerManager: vitest_1.vi.fn().mockReturnValue(mockContainerManager),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('t1'),
        };
        // Reset document
        document.body.innerHTML = '<div id="terminal-body" style="height: 500px; width: 500px;"></div>';
        // Mock clientHeight/Width since JSDOM defaults to 0
        Object.defineProperty(document.getElementById('terminal-body'), 'clientHeight', {
            value: 500,
            configurable: true,
        });
        Object.defineProperty(document.getElementById('terminal-body'), 'clientWidth', {
            value: 500,
            configurable: true,
        });
        manager = new SplitManager_1.SplitManager(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)('calculateSplitLayout', () => {
        (0, vitest_1.it)('should return valid layout info when splitting is possible', () => {
            // 0 current terminals, adding 1 -> total 1
            const result = manager.calculateSplitLayout();
            (0, vitest_1.expect)(result.canSplit).toBe(true);
            (0, vitest_1.expect)(result.terminalHeight).toBe(500); // 500 / 1
        });
        (0, vitest_1.it)('should handle multiple terminals', () => {
            // Add a mock terminal
            manager.terminals.set('t1', {});
            // 1 current, adding 1 -> total 2
            const result = manager.calculateSplitLayout();
            (0, vitest_1.expect)(result.canSplit).toBe(true);
            (0, vitest_1.expect)(result.terminalHeight).toBe(250); // 500 / 2
        });
        (0, vitest_1.it)('should prevent split if max limit reached', () => {
            // Max is 10 (from constants)
            for (let i = 0; i < 10; i++) {
                manager.terminals.set(`t${i}`, {});
            }
            const result = manager.calculateSplitLayout();
            (0, vitest_1.expect)(result.canSplit).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Maximum');
        });
        (0, vitest_1.it)('should prevent split if terminal height too small', () => {
            // Reduce body height
            Object.defineProperty(document.getElementById('terminal-body'), 'clientHeight', {
                value: 50,
            });
            const result = manager.calculateSplitLayout();
            (0, vitest_1.expect)(result.canSplit).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('too small');
        });
    });
    (0, vitest_1.describe)('updateSplitDirection', () => {
        (0, vitest_1.it)('should update direction and panel location', () => {
            manager.updateSplitDirection('horizontal', 'panel');
            (0, vitest_1.expect)(manager.getCurrentPanelLocation()).toBe('panel');
            // @ts-ignore - access private
            (0, vitest_1.expect)(manager['splitDirection']).toBe('horizontal');
        });
        (0, vitest_1.it)('should apply new layout if in split mode', () => {
            manager.isSplitMode = true;
            manager.terminals.set('t1', {});
            manager.terminals.set('t2', {});
            manager.updateSplitDirection('horizontal', 'panel');
            (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('calculateTerminalHeightPercentage', () => {
        (0, vitest_1.it)('should return 100% for single terminal', () => {
            (0, vitest_1.expect)(manager.calculateTerminalHeightPercentage()).toBe('100%');
        });
        (0, vitest_1.it)('should return 50% for two terminals', () => {
            manager.terminals.set('t1', {});
            manager.terminals.set('t2', {});
            (0, vitest_1.expect)(manager.calculateTerminalHeightPercentage()).toBe('50%');
        });
    });
    (0, vitest_1.describe)('removeTerminal', () => {
        (0, vitest_1.it)('should remove terminal and container', () => {
            const mockTerminal = { terminal: { dispose: vitest_1.vi.fn() } };
            const mockContainer = document.createElement('div');
            manager.setTerminal('t1', mockTerminal);
            manager.setTerminalContainer('t1', mockContainer);
            manager.removeTerminal('t1');
            (0, vitest_1.expect)(manager.getTerminals().has('t1')).toBe(false);
            (0, vitest_1.expect)(manager.getTerminalContainers().has('t1')).toBe(false);
            (0, vitest_1.expect)(mockTerminal.terminal.dispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should update layout after removal if in split mode', () => {
            manager.isSplitMode = true;
            manager.terminals.set('t1', {});
            manager.terminals.set('t2', {});
            manager.terminals.set('t3', {}); // 3 terminals
            manager.removeTerminal('t3');
            vitest_1.vi.advanceTimersByTime(100);
            // Should still be in split mode and update layout
            (0, vitest_1.expect)(manager.isSplitMode).toBe(true);
            (0, vitest_1.expect)(mockContainerManager.applyDisplayState).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should exit split mode if terminals drop to 1', () => {
            manager.isSplitMode = true;
            manager.terminals.set('t1', {});
            manager.terminals.set('t2', {});
            manager.removeTerminal('t2');
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(manager.isSplitMode).toBe(false);
        });
    });
    (0, vitest_1.describe)('redistributeSplitTerminals', () => {
        (0, vitest_1.it)('should redistribute heights', () => {
            manager.isSplitMode = true;
            const t1 = document.createElement('div');
            const t2 = document.createElement('div');
            // Add to DOM as container targets
            document.getElementById('terminal-body')?.appendChild(t1);
            document.getElementById('terminal-body')?.appendChild(t2);
            // Mark them as terminal containers
            t1.setAttribute('data-terminal-container', 'true');
            t2.setAttribute('data-terminal-container', 'true');
            manager.redistributeSplitTerminals(400);
            // 400px / 2 = 200px
            (0, vitest_1.expect)(t1.style.height).toBe('200px');
            (0, vitest_1.expect)(t2.style.height).toBe('200px');
        });
        (0, vitest_1.it)('should account for resizer and all flex gaps when redistributing split wrappers', () => {
            manager.isSplitMode = true;
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            terminalsWrapper.style.paddingTop = '4px';
            terminalsWrapper.style.paddingBottom = '4px';
            terminalsWrapper.style.gap = '4px';
            terminalBody.appendChild(terminalsWrapper);
            const wrapper1 = document.createElement('div');
            const wrapper2 = document.createElement('div');
            const wrapper3 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 't1');
            wrapper2.setAttribute('data-terminal-wrapper-id', 't2');
            wrapper3.setAttribute('data-terminal-wrapper-id', 't3');
            const resizer1 = document.createElement('div');
            const resizer2 = document.createElement('div');
            resizer1.className = 'split-resizer';
            resizer2.className = 'split-resizer';
            Object.defineProperty(resizer1, 'offsetHeight', { value: 4, configurable: true });
            Object.defineProperty(resizer2, 'offsetHeight', { value: 4, configurable: true });
            terminalsWrapper.append(wrapper1, resizer1, wrapper2, resizer2, wrapper3);
            manager.redistributeSplitTerminals(600);
            const h1 = parseInt(wrapper1.style.height, 10);
            const h2 = parseInt(wrapper2.style.height, 10);
            const h3 = parseInt(wrapper3.style.height, 10);
            const totalWrapperHeight = h1 + h2 + h3;
            const totalResizerHeight = 8;
            const totalGapHeight = 4 * 4; // 5 items => 4 gaps
            const totalPadding = 8;
            (0, vitest_1.expect)(totalWrapperHeight + totalResizerHeight + totalGapHeight + totalPadding).toBeLessThanOrEqual(600);
        });
        (0, vitest_1.it)('should assign remainder pixels to the last split wrapper', () => {
            manager.isSplitMode = true;
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            terminalsWrapper.style.paddingTop = '4px';
            terminalsWrapper.style.paddingBottom = '4px';
            terminalsWrapper.style.gap = '4px';
            terminalBody.appendChild(terminalsWrapper);
            const wrapper1 = document.createElement('div');
            const wrapper2 = document.createElement('div');
            const wrapper3 = document.createElement('div');
            wrapper1.setAttribute('data-terminal-wrapper-id', 't1');
            wrapper2.setAttribute('data-terminal-wrapper-id', 't2');
            wrapper3.setAttribute('data-terminal-wrapper-id', 't3');
            const resizer1 = document.createElement('div');
            const resizer2 = document.createElement('div');
            resizer1.className = 'split-resizer';
            resizer2.className = 'split-resizer';
            Object.defineProperty(resizer1, 'offsetHeight', { value: 4, configurable: true });
            Object.defineProperty(resizer2, 'offsetHeight', { value: 4, configurable: true });
            terminalsWrapper.append(wrapper1, resizer1, wrapper2, resizer2, wrapper3);
            manager.redistributeSplitTerminals(601);
            (0, vitest_1.expect)(wrapper1.style.height).toBe('189px');
            (0, vitest_1.expect)(wrapper2.style.height).toBe('189px');
            (0, vitest_1.expect)(wrapper3.style.height).toBe('191px');
        });
    });
});
//# sourceMappingURL=SplitManager.test.js.map