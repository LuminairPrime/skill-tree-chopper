"use strict";
/**
 * TerminalContainerManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalContainerManager_1 = require("../../../../../webview/managers/TerminalContainerManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../webview/managers/container/SplitLayoutService', () => ({
    SplitLayoutService: class {
        constructor() {
            this.cacheWrapper = vitest_1.vi.fn();
            this.getWrapper = vitest_1.vi.fn();
            this.removeWrapper = vitest_1.vi.fn();
            this.getSplitResizers = vitest_1.vi.fn().mockReturnValue(new Set());
            this.refreshSplitArtifacts = vitest_1.vi.fn();
            this.activateGridLayout = vitest_1.vi.fn();
            this.activateSplitLayout = vitest_1.vi.fn();
            this.getSplitWrapperCache = vitest_1.vi.fn().mockReturnValue(new Map());
            this.getWrapperArea = vitest_1.vi.fn();
            this.deactivateGridLayout = vitest_1.vi.fn();
            this.clear = vitest_1.vi.fn();
            this.setCoordinator = vitest_1.vi.fn(); // 🔧 FIX: Added for split resizer initialization
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/managers/container/ContainerVisibilityService', () => ({
    ContainerVisibilityService: class {
        constructor() {
            this.showContainer = vitest_1.vi.fn();
            this.hideContainer = vitest_1.vi.fn();
            this.restoreFromHiddenStorage = vitest_1.vi.fn();
            this.enforceFullscreenState = vitest_1.vi.fn();
            this.normalizeTerminalBody = vitest_1.vi.fn();
            this.ensureContainerInBody = vitest_1.vi.fn();
            this.getHiddenStorage = vitest_1.vi.fn((terminalBody) => terminalBody.querySelector('#terminal-hidden-storage'));
            this.isElementVisible = vitest_1.vi.fn().mockReturnValue(true);
            this.clearHiddenStorage = vitest_1.vi.fn();
        }
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        resetXtermInlineStyles: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalContainerManager', () => {
    let manager;
    let mockCoordinator;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><div id="terminal-body"></div>', {
            url: 'http://localhost',
        });
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        mockCoordinator = {
            updatePanelLocationIfNeeded: vitest_1.vi.fn(),
        };
        manager = new TerminalContainerManager_1.TerminalContainerManager(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Container Registration', () => {
        (0, vitest_1.it)('should register and unregister containers', () => {
            const container = document.createElement('div');
            document.body.appendChild(container); // Attach to DOM for document.contains check
            manager.registerContainer('t1', container);
            (0, vitest_1.expect)(manager.getContainer('t1')).toBe(container);
            (0, vitest_1.expect)(manager.getContainerMode('t1')).toBe('normal');
            manager.unregisterContainer('t1');
            (0, vitest_1.expect)(manager.getContainer('t1')).toBeNull();
        });
        (0, vitest_1.it)('should register split wrappers', () => {
            const wrapper = document.createElement('div');
            manager.registerSplitWrapper('t1', wrapper);
            (0, vitest_1.expect)(wrapper.classList.contains('split-terminal-container')).toBe(true);
            (0, vitest_1.expect)(wrapper.getAttribute('data-terminal-wrapper-id')).toBe('t1');
        });
    });
    (0, vitest_1.describe)('Visibility Control', () => {
        (0, vitest_1.it)('should set container visibility', () => {
            const container = document.createElement('div');
            document.body.appendChild(container); // Attach to DOM
            manager.registerContainer('t1', container);
            manager.setContainerVisibility('t1', true);
            // Detailed logic delegated to ContainerVisibilityService, verified via mock
            (0, vitest_1.expect)(manager.visibilityService.showContainer).toHaveBeenCalledWith(container);
            manager.setContainerVisibility('t1', false);
            (0, vitest_1.expect)(manager.visibilityService.hideContainer).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing container gracefully', () => {
            // Should not throw
            manager.setContainerVisibility('unknown', true);
        });
        (0, vitest_1.it)('should restore a hidden container through ContainerVisibilityService when showing it again', () => {
            const terminalBody = document.getElementById('terminal-body');
            const hiddenStorage = document.createElement('div');
            hiddenStorage.id = 'terminal-hidden-storage';
            terminalBody.appendChild(hiddenStorage);
            const container = document.createElement('div');
            hiddenStorage.appendChild(container);
            manager.registerContainer('t1', container);
            const terminal = { refresh: vitest_1.vi.fn(), rows: 24 };
            mockCoordinator.getTerminalInstance = vitest_1.vi.fn().mockReturnValue({ terminal });
            manager.setContainerVisibility('t1', true);
            (0, vitest_1.expect)(manager.visibilityService.restoreFromHiddenStorage).toHaveBeenCalledWith(container, terminalBody, terminal);
        });
    });
    (0, vitest_1.describe)('Display State Application', () => {
        (0, vitest_1.it)('should apply fullscreen mode', () => {
            const c1 = document.createElement('div');
            const c2 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.registerContainer('t2', c2);
            manager.applyDisplayState({
                mode: 'fullscreen',
                activeTerminalId: 't1',
                orderedTerminalIds: ['t1', 't2'],
            });
            (0, vitest_1.expect)(manager.visibilityService.enforceFullscreenState).toHaveBeenCalled();
            (0, vitest_1.expect)(c1.classList.contains('terminal-container--fullscreen')).toBe(true);
            (0, vitest_1.expect)(c2.classList.contains('terminal-container--fullscreen')).toBe(false);
        });
        (0, vitest_1.it)('should apply split mode', () => {
            const c1 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.applyDisplayState({
                mode: 'split',
                activeTerminalId: 't1',
                orderedTerminalIds: ['t1'],
                splitDirection: 'vertical',
            });
            (0, vitest_1.expect)(manager.splitLayoutService.activateSplitLayout).toHaveBeenCalled();
            (0, vitest_1.expect)(c1.classList.contains('terminal-container--split')).toBe(true);
        });
        (0, vitest_1.it)('should use horizontal single-row split in compact panel area even with 6 terminals', () => {
            const terminalBody = document.getElementById('terminal-body');
            Object.defineProperty(terminalBody, 'clientWidth', { value: 900, configurable: true });
            Object.defineProperty(terminalBody, 'clientHeight', { value: 800, configurable: true });
            for (let i = 1; i <= 6; i++) {
                const container = document.createElement('div');
                manager.registerContainer(`t${i}`, container);
            }
            manager.applyDisplayState({
                mode: 'split',
                activeTerminalId: 't1',
                orderedTerminalIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
                splitDirection: 'horizontal',
            });
            (0, vitest_1.expect)(manager.splitLayoutService.activateGridLayout).not.toHaveBeenCalled();
            (0, vitest_1.expect)(manager.splitLayoutService.activateSplitLayout).toHaveBeenCalledWith(terminalBody, ['t1', 't2', 't3', 't4', 't5', 't6'], 'horizontal', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should use grid layout in panel when area is large and terminals are 6+', () => {
            const terminalBody = document.getElementById('terminal-body');
            Object.defineProperty(terminalBody, 'clientWidth', { value: 1600, configurable: true });
            Object.defineProperty(terminalBody, 'clientHeight', { value: 1000, configurable: true });
            for (let i = 1; i <= 6; i++) {
                const container = document.createElement('div');
                manager.registerContainer(`t${i}`, container);
            }
            manager.applyDisplayState({
                mode: 'split',
                activeTerminalId: 't1',
                orderedTerminalIds: ['t1', 't2', 't3', 't4', 't5', 't6'],
                splitDirection: 'horizontal',
            });
            (0, vitest_1.expect)(manager.splitLayoutService.activateGridLayout).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should apply normal mode', () => {
            const c1 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.applyDisplayState({
                mode: 'normal',
                activeTerminalId: 't1',
                orderedTerminalIds: ['t1'],
            });
            (0, vitest_1.expect)(manager.visibilityService.normalizeTerminalBody).toHaveBeenCalled();
            (0, vitest_1.expect)(c1.classList.contains('terminal-container--fullscreen')).toBe(false);
            (0, vitest_1.expect)(c1.classList.contains('terminal-container--split')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Split Artifacts', () => {
        (0, vitest_1.it)('should clear split artifacts', () => {
            manager.clearSplitArtifacts();
            (0, vitest_1.expect)(manager.splitLayoutService.getSplitResizers).toHaveBeenCalled();
            (0, vitest_1.expect)(manager.splitLayoutService.getSplitWrapperCache).toHaveBeenCalled();
            (0, vitest_1.expect)(manager.visibilityService.normalizeTerminalBody).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear grid and horizontal split classes from terminals-wrapper', () => {
            const terminalBody = document.getElementById('terminal-body');
            const terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            terminalsWrapper.classList.add('terminal-grid-layout', 'terminal-split-horizontal');
            terminalsWrapper.style.display = 'grid';
            terminalsWrapper.style.gridTemplateColumns = 'repeat(5, 1fr)';
            terminalsWrapper.style.gridTemplateRows = '1fr auto 1fr';
            terminalBody.appendChild(terminalsWrapper);
            manager.clearSplitArtifacts();
            (0, vitest_1.expect)(terminalsWrapper.classList.contains('terminal-grid-layout')).toBe(false);
            (0, vitest_1.expect)(terminalsWrapper.classList.contains('terminal-split-horizontal')).toBe(false);
            (0, vitest_1.expect)(terminalsWrapper.style.gridTemplateColumns).toBe('');
            (0, vitest_1.expect)(terminalsWrapper.style.gridTemplateRows).toBe('');
        });
    });
    (0, vitest_1.describe)('Container Management', () => {
        (0, vitest_1.it)('should discover existing containers on init', async () => {
            const existing = document.createElement('div');
            existing.className = 'terminal-container';
            existing.setAttribute('data-terminal-id', 'existing-1');
            document.body.appendChild(existing);
            await manager.initialize();
            (0, vitest_1.expect)(manager.getContainer('existing-1')).toBe(existing);
        });
        (0, vitest_1.it)('should reorder containers in DOM', () => {
            const parent = document.getElementById('terminal-body');
            const c1 = document.createElement('div');
            const c2 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.registerContainer('t2', c2);
            parent?.appendChild(c1);
            parent?.appendChild(c2);
            manager.reorderContainers(['t2', 't1']);
            (0, vitest_1.expect)(parent?.firstChild).toBe(c2);
            (0, vitest_1.expect)(parent?.lastChild).toBe(c1);
        });
        (0, vitest_1.it)('should update containerCache order after reordering (fixes split mode display order)', () => {
            const parent = document.getElementById('terminal-body');
            const c1 = document.createElement('div');
            const c2 = document.createElement('div');
            const c3 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.registerContainer('t2', c2);
            manager.registerContainer('t3', c3);
            parent?.appendChild(c1);
            parent?.appendChild(c2);
            parent?.appendChild(c3);
            // Initial order should be t1, t2, t3
            (0, vitest_1.expect)(manager.getContainerOrder()).toEqual(['t1', 't2', 't3']);
            // Reorder to t3, t1, t2 (simulating drag-drop)
            manager.reorderContainers(['t3', 't1', 't2']);
            // Cache order should now reflect the new order
            (0, vitest_1.expect)(manager.getContainerOrder()).toEqual(['t3', 't1', 't2']);
        });
        (0, vitest_1.it)('should preserve containers not in order array at the end', () => {
            const parent = document.getElementById('terminal-body');
            const c1 = document.createElement('div');
            const c2 = document.createElement('div');
            const c3 = document.createElement('div');
            manager.registerContainer('t1', c1);
            manager.registerContainer('t2', c2);
            manager.registerContainer('t3', c3);
            parent?.appendChild(c1);
            parent?.appendChild(c2);
            parent?.appendChild(c3);
            // Reorder with only t2, t1 (t3 not mentioned)
            manager.reorderContainers(['t2', 't1']);
            // t3 should be preserved at the end
            (0, vitest_1.expect)(manager.getContainerOrder()).toEqual(['t2', 't1', 't3']);
        });
    });
    (0, vitest_1.describe)('Diagnostics', () => {
        (0, vitest_1.it)('should provide debug info and snapshot', () => {
            const container = document.createElement('div');
            manager.registerContainer('t1', container);
            const info = manager.getDebugInfo();
            (0, vitest_1.expect)(info.cachedContainers).toBe(1);
            (0, vitest_1.expect)(info.modes['t1']).toBe('normal');
            const snapshot = manager.getDisplaySnapshot();
            (0, vitest_1.expect)(snapshot.registeredContainers).toBe(1);
        });
    });
});
//# sourceMappingURL=TerminalContainerManager.test.js.map