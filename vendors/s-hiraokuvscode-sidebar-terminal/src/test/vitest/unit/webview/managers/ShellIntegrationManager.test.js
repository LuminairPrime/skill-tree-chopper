"use strict";
/**
 * ShellIntegrationManager Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const ShellIntegrationManager_1 = require("../../../../../webview/managers/ShellIntegrationManager");
// Mock generic logger
vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
// Mock ShellIntegrationAddon
vi.mock('../../../../../webview/addons/ShellIntegrationAddon', () => ({
    ShellIntegrationAddon: class {
        constructor(manager) {
            this.history = [];
            this.currentCommand = undefined;
            this.active = true;
            this.cwd = '/mock/cwd';
            this.manager = manager;
        }
        activate(_term) {
            // no-op
        }
        dispose() {
            // no-op
        }
        getCurrentCommand() {
            return this.currentCommand;
        }
        getCommandHistory() {
            return this.history;
        }
        isActive() {
            return this.active;
        }
        getCurrentCwd() {
            return this.cwd;
        }
        clearHistory() {
            this.history = [];
        }
    },
}));
(0, vitest_1.describe)('ShellIntegrationManager', () => {
    let manager;
    let mockCoordinator;
    let dom;
    let mockTerminal;
    beforeEach(() => {
        vi.useFakeTimers();
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><div id="terminal-body"></div>');
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        global.Element = dom.window.Element;
        mockCoordinator = {
            postMessageToExtension: vi.fn(),
            getAllTerminalInstances: vi.fn().mockReturnValue(new Map()),
        };
        mockTerminal = {
            loadAddon: vi.fn(),
            paste: vi.fn(),
        };
        manager = new ShellIntegrationManager_1.ShellIntegrationManager();
        manager.setCoordinator(mockCoordinator);
    });
    afterEach(() => {
        manager.dispose();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize shell integration for a terminal', () => {
            const termId = 't1';
            manager.initializeTerminalShellIntegration(mockTerminal, termId);
            (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalled();
            // Verify state initialization
            const state = manager.getShellIntegrationState(termId);
            (0, vitest_1.expect)(state).toBeDefined();
            (0, vitest_1.expect)(state?.isActive).toBe(true);
        });
        (0, vitest_1.it)('should setup styles on construction', () => {
            // Constructor calls setupStyles
            const styleTags = document.head.getElementsByTagName('style');
            (0, vitest_1.expect)(styleTags.length).toBeGreaterThan(0);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(styleTags[0].textContent).toContain('.shell-status-indicator');
        });
    });
    (0, vitest_1.describe)('Event Handling', () => {
        const termId = 't1';
        beforeEach(() => {
            manager.initializeTerminalShellIntegration(mockTerminal, termId);
        });
        (0, vitest_1.it)('should handle command start', () => {
            const command = { command: 'ls', cwd: '/test', timestamp: Date.now() };
            // Mock finding terminal ID (simplified in manager implementation to look up addon)
            // Since we can't easily mock the private map search without intrusive mocks,
            // we rely on the fallback behavior or mock the addon's getCurrentCommand if needed.
            // However, the manager uses `findTerminalIdForCommand` which iterates addons.
            // We need the mock addon to return the command we are passing.
            // Access the mock addon instance if possible or assume the fallback works (first terminal)
            // Since 't1' is the only terminal, it should be found as fallback or match.
            // @ts-expect-error - test mock type
            manager.onCommandStart(command);
            // Verify status update via side effect (e.g. status indicator or logging)
            // Ideally we check internal state or coordinator calls
            // The manager updates statusMap and calls updateStatusIndicator
            // We can check if statusMap was updated by checking getShellIntegrationState?
            // getShellIntegrationState pulls from addon mostly, but also statusMap for exitCode.
            // Let's check if we can verify via updateShellStatus side effects (e.g. UI)
            // But UI elements are created on demand.
            // We can check if `updateShellStatus` was called effectively.
            // Since `updateShellStatus` is public, we can spy on it? No, it's on the same instance.
            // We can verify by checking if the visual indicator was created/updated.
            // We need to mock the DOM structure for the terminal header.
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            // @ts-expect-error - test mock type
            manager.onCommandStart(command);
            const indicator = header.querySelector('.shell-status-indicator');
            (0, vitest_1.expect)(indicator).not.toBeNull();
            (0, vitest_1.expect)(indicator?.className).toContain('executing');
        });
        (0, vitest_1.it)('should handle command end (success)', () => {
            const command = { command: 'ls', cwd: '/test', timestamp: Date.now() };
            // Setup UI
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            // @ts-expect-error - test mock type
            manager.onCommandEnd(command, 0); // Success
            const indicator = header.querySelector('.shell-status-indicator');
            (0, vitest_1.expect)(indicator?.className).toContain('success');
            const state = manager.getShellIntegrationState(termId);
            (0, vitest_1.expect)(state?.lastExitCode).toBe(0);
        });
        (0, vitest_1.it)('should handle command end (error)', () => {
            const command = { command: 'ls', cwd: '/test', timestamp: Date.now() };
            // Setup UI
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            // @ts-expect-error - test mock type
            manager.onCommandEnd(command, 1); // Error
            const indicator = header.querySelector('.shell-status-indicator');
            (0, vitest_1.expect)(indicator?.className).toContain('error');
            // Should show notification via coordinator
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'showNotification',
                type: 'warning',
            }));
        });
        (0, vitest_1.it)('should auto-reset status to ready after delay', () => {
            const command = { command: 'ls', cwd: '/test', timestamp: Date.now() };
            // Setup UI
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            // @ts-expect-error - test mock type
            manager.onCommandEnd(command, 0);
            (0, vitest_1.expect)(header.querySelector('.shell-status-indicator')?.className).toContain('success');
            vi.advanceTimersByTime(2000);
            (0, vitest_1.expect)(header.querySelector('.shell-status-indicator')?.className).toContain('ready');
        });
    });
    (0, vitest_1.describe)('UI Updates', () => {
        const termId = 't1';
        beforeEach(() => {
            manager.initializeTerminalShellIntegration(mockTerminal, termId);
            // Setup UI
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
        });
        (0, vitest_1.it)('should update status indicator', () => {
            manager.updateShellStatus(termId, 'executing');
            const indicator = document.querySelector('.shell-status-indicator');
            (0, vitest_1.expect)(indicator).not.toBeNull();
            (0, vitest_1.expect)(indicator?.className).toContain('executing');
        });
        (0, vitest_1.it)('should update CWD display', () => {
            manager.updateCwd(termId, '/home/user/project');
            const cwdDisplay = document.querySelector('.shell-cwd-display');
            (0, vitest_1.expect)(cwdDisplay).not.toBeNull();
            (0, vitest_1.expect)(cwdDisplay?.textContent).toBe('/home/user/project');
        });
        (0, vitest_1.it)('should format home directory in CWD display', () => {
            process.env.HOME = '/home/user';
            manager.updateCwd(termId, '/home/user/project');
            const cwdDisplay = document.querySelector('.shell-cwd-display');
            (0, vitest_1.expect)(cwdDisplay?.textContent).toBe('~/project');
        });
    });
    (0, vitest_1.describe)('Message Handling', () => {
        (0, vitest_1.it)('should handle updateShellStatus message', () => {
            // Setup UI
            const termId = 't1';
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            manager.handleMessage({
                command: 'updateShellStatus',
                terminalId: termId,
                status: 'error',
            });
            const indicator = document.querySelector('.shell-status-indicator');
            (0, vitest_1.expect)(indicator?.className).toContain('error');
        });
        (0, vitest_1.it)('should handle updateCwd message', () => {
            const termId = 't1';
            // Setup UI
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            manager.handleMessage({
                command: 'updateCwd',
                terminalId: termId,
                cwd: '/new/cwd',
            });
            const cwdDisplay = document.querySelector('.shell-cwd-display');
            (0, vitest_1.expect)(cwdDisplay?.textContent).toBe('/new/cwd');
        });
    });
    (0, vitest_1.describe)('Cleanup', () => {
        (0, vitest_1.it)('should dispose terminal resources', () => {
            const termId = 't1';
            manager.initializeTerminalShellIntegration(mockTerminal, termId);
            // Setup UI elements to verify removal
            const header = document.createElement('div');
            header.className = 'terminal-header';
            const container = document.createElement('div');
            container.setAttribute('data-terminal-id', termId);
            container.appendChild(header);
            document.body.appendChild(container);
            manager.updateShellStatus(termId, 'ready'); // Creates indicator
            manager.disposeTerminal(termId);
            (0, vitest_1.expect)(document.querySelector('.shell-status-indicator')).toBeNull(); // Should be removed
            const state = manager.getShellIntegrationState(termId);
            (0, vitest_1.expect)(state).toBeUndefined();
        });
        (0, vitest_1.it)('should dispose all resources', () => {
            manager.initializeTerminalShellIntegration(mockTerminal, 't1');
            manager.initializeTerminalShellIntegration(mockTerminal, 't2');
            manager.dispose();
            (0, vitest_1.expect)(manager.getShellIntegrationState('t1')).toBeUndefined();
            (0, vitest_1.expect)(manager.getShellIntegrationState('t2')).toBeUndefined();
        });
    });
});
//# sourceMappingURL=ShellIntegrationManager.test.js.map