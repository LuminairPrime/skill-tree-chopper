"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SplitLayoutService_1 = require("../../../../../../webview/managers/container/SplitLayoutService");
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger');
(0, vitest_1.describe)('SplitLayoutService', () => {
    let service;
    let terminalBody;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new SplitLayoutService_1.SplitLayoutService();
        // Setup DOM
        terminalBody = document.createElement('div');
        terminalBody.id = 'terminal-body';
        document.body.appendChild(terminalBody);
    });
    (0, vitest_1.afterEach)(() => {
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('ensureTerminalsWrapper', () => {
        (0, vitest_1.it)('should create terminals-wrapper if missing', () => {
            const wrapper = service.ensureTerminalsWrapper(terminalBody);
            (0, vitest_1.expect)(wrapper.id).toBe('terminals-wrapper');
            (0, vitest_1.expect)(terminalBody.contains(wrapper)).toBe(true);
        });
        (0, vitest_1.it)('should reuse existing terminals-wrapper', () => {
            const w1 = document.createElement('div');
            w1.id = 'terminals-wrapper';
            terminalBody.appendChild(w1);
            const w2 = service.ensureTerminalsWrapper(terminalBody);
            (0, vitest_1.expect)(w1).toBe(w2);
        });
    });
    (0, vitest_1.describe)('createSplitWrapper', () => {
        (0, vitest_1.it)('should create wrapper with correct attributes', () => {
            const terminalId = 't1';
            const wrapper = service.createSplitWrapper(terminalId, 'vertical');
            (0, vitest_1.expect)(wrapper.className).toBe('terminal-split-wrapper');
            (0, vitest_1.expect)(wrapper.getAttribute('data-terminal-wrapper-id')).toBe(terminalId);
            (0, vitest_1.expect)(wrapper.style.display).toBe('flex');
        });
        (0, vitest_1.it)('should set width 100% for vertical split', () => {
            const wrapper = service.createSplitWrapper('t1', 'vertical');
            (0, vitest_1.expect)(wrapper.style.width).toBe('100%');
        });
        (0, vitest_1.it)('should set height 100% for horizontal split', () => {
            const wrapper = service.createSplitWrapper('t1', 'horizontal');
            (0, vitest_1.expect)(wrapper.style.height).toBe('100%');
        });
    });
    (0, vitest_1.describe)('activateSplitLayout', () => {
        (0, vitest_1.it)('should build layout for multiple terminals', () => {
            const t1 = document.createElement('div');
            t1.id = 'container-1';
            const t2 = document.createElement('div');
            t2.id = 'container-2';
            const containers = new Map([
                ['term-1', t1],
                ['term-2', t2],
            ]);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2'], 'horizontal', (id) => containers.get(id));
            const wrapper = document.getElementById('terminals-wrapper');
            (0, vitest_1.expect)(wrapper.style.flexDirection).toBe('row'); // horizontal split -> row
            const wrappers = wrapper.querySelectorAll('.terminal-split-wrapper');
            (0, vitest_1.expect)(wrappers.length).toBe(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(wrappers[0].contains(t1)).toBe(true);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(wrappers[1].contains(t2)).toBe(true);
            (0, vitest_1.expect)(t1.classList.contains('terminal-container--split')).toBe(true);
        });
        (0, vitest_1.it)('should rebuild resizers when activation order changes', () => {
            const t1 = document.createElement('div');
            const t2 = document.createElement('div');
            const t3 = document.createElement('div');
            const containers = new Map([
                ['term-1', t1],
                ['term-2', t2],
                ['term-3', t3],
            ]);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2', 'term-3'], 'vertical', (id) => containers.get(id));
            let wrapper = document.getElementById('terminals-wrapper');
            let resizers = wrapper.querySelectorAll('.split-resizer');
            (0, vitest_1.expect)(resizers.length).toBe(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-before')).toBe('term-1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-after')).toBe('term-2');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[1].getAttribute('data-resizer-before')).toBe('term-2');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[1].getAttribute('data-resizer-after')).toBe('term-3');
            service.activateSplitLayout(terminalBody, ['term-3', 'term-1', 'term-2'], 'vertical', (id) => containers.get(id));
            wrapper = document.getElementById('terminals-wrapper');
            resizers = wrapper.querySelectorAll('.split-resizer');
            (0, vitest_1.expect)(resizers.length).toBe(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-before')).toBe('term-3');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-after')).toBe('term-1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[1].getAttribute('data-resizer-before')).toBe('term-1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[1].getAttribute('data-resizer-after')).toBe('term-2');
        });
        (0, vitest_1.it)('should insert resizers between terminals with correct attributes', () => {
            const t1 = document.createElement('div');
            const t2 = document.createElement('div');
            const containers = new Map([
                ['term-1', t1],
                ['term-2', t2],
            ]);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2'], 'vertical', (id) => containers.get(id));
            const wrapper = document.getElementById('terminals-wrapper');
            const resizers = wrapper.querySelectorAll('.split-resizer');
            (0, vitest_1.expect)(resizers.length).toBe(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-before')).toBe('term-1');
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(resizers[0].getAttribute('data-resizer-after')).toBe('term-2');
        });
        (0, vitest_1.it)('should sync terminals-wrapper class with split direction', () => {
            const t1 = document.createElement('div');
            const t2 = document.createElement('div');
            const containers = new Map([
                ['term-1', t1],
                ['term-2', t2],
            ]);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2'], 'horizontal', (id) => containers.get(id));
            const wrapper = document.getElementById('terminals-wrapper');
            (0, vitest_1.expect)(wrapper.classList.contains('terminal-split-horizontal')).toBe(true);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2'], 'vertical', (id) => containers.get(id));
            (0, vitest_1.expect)(wrapper.classList.contains('terminal-split-horizontal')).toBe(false);
        });
    });
    (0, vitest_1.describe)('removeSplitArtifacts', () => {
        (0, vitest_1.it)('should remove wrappers and resizers', () => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-terminal-wrapper-id', 't1');
            terminalBody.appendChild(wrapper);
            const resizer = document.createElement('div');
            resizer.className = 'split-resizer';
            terminalBody.appendChild(resizer);
            service.removeSplitArtifacts(terminalBody);
            (0, vitest_1.expect)(terminalBody.contains(wrapper)).toBe(false);
            (0, vitest_1.expect)(terminalBody.contains(resizer)).toBe(false);
        });
    });
    (0, vitest_1.describe)('cache management', () => {
        (0, vitest_1.it)('should cache and remove wrappers', () => {
            const el = document.createElement('div');
            service.cacheWrapper('t1', el);
            (0, vitest_1.expect)(service.getWrapper('t1')).toBe(el);
            service.removeWrapper('t1');
            (0, vitest_1.expect)(service.getWrapper('t1')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('coordinator integration', () => {
        (0, vitest_1.it)('should store coordinator reference via setCoordinator', () => {
            const mockCoordinator = {
                updateSplitResizers: vitest_1.vi.fn(),
            };
            // Should not throw
            (0, vitest_1.expect)(() => service.setCoordinator(mockCoordinator)).not.toThrow();
        });
        (0, vitest_1.it)('should call updateSplitResizers after activateSplitLayout', async () => {
            vitest_1.vi.useFakeTimers();
            const mockCoordinator = {
                updateSplitResizers: vitest_1.vi.fn(),
            };
            service.setCoordinator(mockCoordinator);
            const t1 = document.createElement('div');
            t1.id = 'container-1';
            const t2 = document.createElement('div');
            t2.id = 'container-2';
            const containers = new Map([
                ['term-1', t1],
                ['term-2', t2],
            ]);
            service.activateSplitLayout(terminalBody, ['term-1', 'term-2'], 'vertical', (id) => containers.get(id));
            // Advance timers to trigger the setTimeout callback (50ms)
            vitest_1.vi.advanceTimersByTime(50);
            // Verify updateSplitResizers was called
            (0, vitest_1.expect)(mockCoordinator.updateSplitResizers).toHaveBeenCalledTimes(1);
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should not fail activateSplitLayout if coordinator is not set', () => {
            const t1 = document.createElement('div');
            t1.id = 'container-1';
            const containers = new Map([['term-1', t1]]);
            // Should not throw even without coordinator
            (0, vitest_1.expect)(() => service.activateSplitLayout(terminalBody, ['term-1'], 'vertical', (id) => containers.get(id))).not.toThrow();
        });
        (0, vitest_1.it)('should not fail if coordinator has no updateSplitResizers method', async () => {
            vitest_1.vi.useFakeTimers();
            const mockCoordinator = {
            // No updateSplitResizers method
            };
            service.setCoordinator(mockCoordinator);
            const t1 = document.createElement('div');
            t1.id = 'container-1';
            const containers = new Map([['term-1', t1]]);
            // Should not throw
            (0, vitest_1.expect)(() => service.activateSplitLayout(terminalBody, ['term-1'], 'vertical', (id) => containers.get(id))).not.toThrow();
            vitest_1.vi.advanceTimersByTime(50);
            // No error should occur
            vitest_1.vi.useRealTimers();
        });
    });
});
//# sourceMappingURL=SplitLayoutService.test.js.map