"use strict";
/**
 * TerminalCoordinator Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalCoordinator_1 = require("../../../../../webview/services/TerminalCoordinator");
// Mock Terminal and Addons
vi.mock('@xterm/xterm', () => {
    class MockTerminal {
        constructor() {
            this.loadAddon = vi.fn();
            this.open = vi.fn();
            this.focus = vi.fn();
            this.dispose = vi.fn();
            this.onResize = vi.fn().mockReturnValue({ dispose: vi.fn() });
            this.write = vi.fn((data, cb) => cb?.());
            this.scrollToBottom = vi.fn();
            this.resize = vi.fn();
            this.refresh = vi.fn();
            this.rows = 24;
            this.cols = 80;
            this.buffer = { active: { baseY: 0, viewportY: 0 } };
        }
    }
    return { Terminal: MockTerminal };
});
vi.mock('@xterm/addon-fit', () => {
    class MockFitAddon {
        constructor() {
            this.fit = vi.fn();
        }
    }
    return { FitAddon: MockFitAddon };
});
// Mock logger
vi.mock('../../../../../webview/utils/logger', () => ({
    webview: vi.fn(),
}));
(0, vitest_1.describe)('TerminalCoordinator', () => {
    let coordinator;
    beforeEach(() => {
        // @ts-expect-error - test mock type
        coordinator = new TerminalCoordinator_1.TerminalCoordinator({
            maxTerminals: 5,
            defaultShell: '/bin/bash',
            workingDirectory: '/',
            debugMode: false,
        });
    });
    afterEach(() => {
        coordinator.dispose();
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('createTerminal', () => {
        (0, vitest_1.it)('should create and store terminal instance', async () => {
            const terminalId = await coordinator.createTerminal();
            (0, vitest_1.expect)(terminalId).toBeDefined();
            (0, vitest_1.expect)(coordinator.getTerminalCount()).toBe(1);
            (0, vitest_1.expect)(coordinator.getTerminal(terminalId)).toBeTruthy();
        });
        (0, vitest_1.it)('should throw error if limit reached', async () => {
            // Set low limit
            coordinator.config.maxTerminals = 1;
            await coordinator.createTerminal();
            await (0, vitest_1.expect)(coordinator.createTerminal()).rejects.toThrow('maximum of 1 terminals reached');
        });
        (0, vitest_1.it)('should emit onTerminalCreated event', async () => {
            const listener = vi.fn();
            coordinator.addEventListener('onTerminalCreated', listener);
            await coordinator.createTerminal();
            (0, vitest_1.expect)(listener).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Terminal Operations', () => {
        let t1Id;
        beforeEach(async () => {
            t1Id = await coordinator.createTerminal();
        });
        (0, vitest_1.it)('should activate terminal', () => {
            const _t2Id = 'terminal-2'; // mock expected next ID
            coordinator.activateTerminal(t1Id);
            const info = coordinator.getTerminalInfo(t1Id);
            (0, vitest_1.expect)(info?.isActive).toBe(true);
            (0, vitest_1.expect)(info?.container.style.display).toBe('block');
        });
        (0, vitest_1.it)('should write to terminal', () => {
            const terminal = coordinator.getTerminal(t1Id);
            coordinator.writeToTerminal(t1Id, 'hello');
            (0, vitest_1.expect)(terminal.write).toHaveBeenCalledWith('hello', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should resize terminal', () => {
            const terminal = coordinator.getTerminal(t1Id);
            coordinator.resizeTerminal(t1Id, 100, 40);
            (0, vitest_1.expect)(terminal.resize).toHaveBeenCalledWith(100, 40);
        });
    });
    (0, vitest_1.describe)('removeTerminal', () => {
        (0, vitest_1.it)('should dispose terminal and remove from collection', async () => {
            const id = await coordinator.createTerminal();
            const terminal = coordinator.getTerminal(id);
            await coordinator.removeTerminal(id);
            (0, vitest_1.expect)(terminal.dispose).toHaveBeenCalled();
            (0, vitest_1.expect)(coordinator.hasTerminals()).toBe(false);
        });
    });
});
//# sourceMappingURL=TerminalCoordinator.test.js.map