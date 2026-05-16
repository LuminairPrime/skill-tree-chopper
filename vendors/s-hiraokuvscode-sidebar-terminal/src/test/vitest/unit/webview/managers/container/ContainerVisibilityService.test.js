"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ContainerVisibilityService_1 = require("../../../../../../webview/managers/container/ContainerVisibilityService");
(0, vitest_1.describe)('ContainerVisibilityService', () => {
    let service;
    let terminalBody;
    let terminalsWrapper;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new ContainerVisibilityService_1.ContainerVisibilityService();
        // Setup DOM
        terminalBody = document.createElement('div');
        terminalBody.id = 'terminal-body';
        terminalsWrapper = document.createElement('div');
        terminalsWrapper.id = 'terminals-wrapper';
        document.body.appendChild(terminalBody);
        document.body.appendChild(terminalsWrapper);
    });
    (0, vitest_1.afterEach)(() => {
        document.body.innerHTML = '';
        service.clearHiddenStorage();
    });
    (0, vitest_1.describe)('isElementVisible', () => {
        (0, vitest_1.it)('should return true for visible elements', () => {
            const el = document.createElement('div');
            (0, vitest_1.expect)(service.isElementVisible(el)).toBe(true);
        });
        (0, vitest_1.it)('should return false for display: none', () => {
            const el = document.createElement('div');
            el.style.display = 'none';
            (0, vitest_1.expect)(service.isElementVisible(el)).toBe(false);
        });
        (0, vitest_1.it)('should return false for hidden-mode class', () => {
            const el = document.createElement('div');
            el.classList.add('hidden-mode');
            (0, vitest_1.expect)(service.isElementVisible(el)).toBe(false);
        });
    });
    (0, vitest_1.describe)('getHiddenStorage', () => {
        (0, vitest_1.it)('should create storage if missing', () => {
            const storage = service.getHiddenStorage(terminalBody, true);
            (0, vitest_1.expect)(storage).not.toBeNull();
            (0, vitest_1.expect)(storage?.id).toBe('terminal-hidden-storage');
            (0, vitest_1.expect)(storage?.style.display).toBe('none');
            (0, vitest_1.expect)(terminalBody.contains(storage)).toBe(true);
        });
        (0, vitest_1.it)('should reuse existing storage', () => {
            const s1 = service.getHiddenStorage(terminalBody, true);
            const s2 = service.getHiddenStorage(terminalBody, true);
            (0, vitest_1.expect)(s1).toBe(s2);
        });
    });
    (0, vitest_1.describe)('enforceFullscreenState', () => {
        (0, vitest_1.it)('should show active terminal and hide others', () => {
            const t1 = document.createElement('div');
            t1.className = 'terminal-container';
            t1.setAttribute('data-terminal-id', 'term-1');
            const t2 = document.createElement('div');
            t2.className = 'terminal-container';
            t2.setAttribute('data-terminal-id', 'term-2');
            terminalBody.appendChild(t1);
            terminalBody.appendChild(t2);
            service.enforceFullscreenState('term-1', terminalBody, new Map());
            (0, vitest_1.expect)(t1.style.display).toBe('flex');
            (0, vitest_1.expect)(t1.classList.contains('terminal-container--fullscreen')).toBe(true);
            (0, vitest_1.expect)(terminalsWrapper.contains(t1)).toBe(true);
            (0, vitest_1.expect)(t2.style.display).toBe('none');
            (0, vitest_1.expect)(t2.classList.contains('hidden-mode')).toBe(true);
            const storage = document.getElementById('terminal-hidden-storage');
            (0, vitest_1.expect)(storage?.contains(t2)).toBe(true);
        });
        (0, vitest_1.it)('should remove split artifacts', () => {
            const artifact = document.createElement('div');
            artifact.setAttribute('data-terminal-wrapper-id', 'wrap-1');
            terminalBody.appendChild(artifact);
            service.enforceFullscreenState(null, terminalBody, new Map());
            (0, vitest_1.expect)(terminalBody.contains(artifact)).toBe(false);
        });
    });
    (0, vitest_1.describe)('normalizeTerminalBody', () => {
        (0, vitest_1.it)('should move containers back from storage', () => {
            const t1 = document.createElement('div');
            t1.className = 'terminal-container';
            const storage = service.getHiddenStorage(terminalBody, true);
            storage.appendChild(t1);
            const cache = new Map([['t1', t1]]);
            service.normalizeTerminalBody(terminalBody, cache);
            (0, vitest_1.expect)(terminalsWrapper.contains(t1)).toBe(true);
            (0, vitest_1.expect)(t1.classList.contains('terminal-container--fullscreen')).toBe(false);
        });
    });
    (0, vitest_1.describe)('show/hideContainer', () => {
        (0, vitest_1.it)('showContainer should update styles', () => {
            const t1 = document.createElement('div');
            t1.style.display = 'none';
            t1.classList.add('hidden-mode');
            service.showContainer(t1);
            (0, vitest_1.expect)(t1.style.display).toBe('flex');
            (0, vitest_1.expect)(t1.classList.contains('hidden-mode')).toBe(false);
        });
        (0, vitest_1.it)('hideContainer should move to storage', () => {
            const t1 = document.createElement('div');
            terminalsWrapper.appendChild(t1);
            service.hideContainer(t1, terminalBody);
            (0, vitest_1.expect)(t1.style.display).toBe('none');
            (0, vitest_1.expect)(t1.classList.contains('hidden-mode')).toBe(true);
            const storage = document.getElementById('terminal-hidden-storage');
            (0, vitest_1.expect)(storage?.contains(t1)).toBe(true);
        });
    });
    (0, vitest_1.describe)('restoreFromHiddenStorage', () => {
        (0, vitest_1.it)('should call terminal.refresh after restoring container from hidden storage', () => {
            const t1 = document.createElement('div');
            t1.className = 'terminal-container';
            t1.dataset.terminalId = 'term-1';
            // Hide it first
            service.hideContainer(t1, terminalBody);
            const storage = document.getElementById('terminal-hidden-storage');
            (0, vitest_1.expect)(storage?.contains(t1)).toBe(true);
            // Create a mock terminal with refresh method
            const mockTerminal = {
                refresh: vitest_1.vi.fn(),
                rows: 24,
            };
            // Show it and call restoreFromHiddenStorage
            service.showContainer(t1);
            service.restoreFromHiddenStorage(t1, terminalBody, mockTerminal);
            // Should move the container to terminalsWrapper
            (0, vitest_1.expect)(terminalsWrapper.contains(t1)).toBe(true);
            // Should refresh the terminal canvas
            (0, vitest_1.expect)(mockTerminal.refresh).toHaveBeenCalledWith(0, 23);
        });
        (0, vitest_1.it)('should handle null terminal gracefully', () => {
            const t1 = document.createElement('div');
            (0, vitest_1.expect)(() => service.restoreFromHiddenStorage(t1, terminalBody, null)).not.toThrow();
        });
    });
});
//# sourceMappingURL=ContainerVisibilityService.test.js.map