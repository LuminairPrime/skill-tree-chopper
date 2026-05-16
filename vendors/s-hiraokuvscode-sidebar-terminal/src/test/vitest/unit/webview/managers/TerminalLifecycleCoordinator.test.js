"use strict";
/**
 * TerminalLifecycleCoordinator Unit Tests
 *
 * Tests for terminal lifecycle management including:
 * - Active terminal management
 * - Terminal instance access
 * - Terminal resize handling
 * - Data writing with auto-scroll
 * - Container initialization
 * - Resource disposal
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock dependencies before importing the module under test
vitest_1.vi.mock('../../../../../webview/services/TerminalCreationService', () => {
    return {
        TerminalCreationService: class MockTerminalCreationService {
            constructor() {
                this.createTerminal = vitest_1.vi.fn().mockResolvedValue({});
                this.removeTerminal = vitest_1.vi.fn().mockResolvedValue(true);
                this.switchToTerminal = vitest_1.vi.fn().mockResolvedValue(true);
            }
        },
    };
});
vitest_1.vi.mock('../../../../../webview/utils/ResizeManager', () => ({
    ResizeManager: {
        debounceResize: vitest_1.vi.fn((_key, callback) => {
            callback();
        }),
        unobserveResize: vitest_1.vi.fn(),
        clearResize: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/EventHandlerRegistry', () => {
    return {
        EventHandlerRegistry: class MockEventHandlerRegistry {
            constructor() {
                this.dispose = vitest_1.vi.fn();
            }
        },
    };
});
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        resetXtermInlineStyles: vitest_1.vi.fn(),
    },
}));
// Import after mocks are set up
const TerminalLifecycleCoordinator_1 = require("../../../../../webview/managers/TerminalLifecycleCoordinator");
(0, vitest_1.describe)('TerminalLifecycleCoordinator', () => {
    let coordinator;
    let mockTerminals;
    let mockContainers;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Setup mock terminal and container maps
        mockTerminals = new Map();
        mockContainers = new Map();
        // Create mock SplitManager
        const mockSplitManager = {
            getTerminals: vitest_1.vi.fn(() => mockTerminals),
            getTerminalContainers: vitest_1.vi.fn(() => mockContainers),
        };
        // Create mock coordinator
        const mockCoordinator = {
            postMessageToExtension: vitest_1.vi.fn(),
        };
        coordinator = new TerminalLifecycleCoordinator_1.TerminalLifecycleCoordinator(mockSplitManager, mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        if (coordinator) {
            coordinator.dispose();
        }
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('getActiveTerminalId', () => {
        (0, vitest_1.it)('should return null initially', () => {
            (0, vitest_1.expect)(coordinator.getActiveTerminalId()).toBeNull();
        });
        (0, vitest_1.it)('should return set terminal ID', () => {
            coordinator.activeTerminalId = 'terminal-1';
            (0, vitest_1.expect)(coordinator.getActiveTerminalId()).toBe('terminal-1');
        });
    });
    (0, vitest_1.describe)('setActiveTerminalId', () => {
        (0, vitest_1.it)('should set active terminal ID', () => {
            coordinator.setActiveTerminalId('terminal-1');
            (0, vitest_1.expect)(coordinator.activeTerminalId).toBe('terminal-1');
        });
        (0, vitest_1.it)('should set to null', () => {
            coordinator.setActiveTerminalId('terminal-1');
            coordinator.setActiveTerminalId(null);
            (0, vitest_1.expect)(coordinator.activeTerminalId).toBeNull();
        });
        (0, vitest_1.it)('should attempt to focus terminal when setting active', () => {
            const mockTextarea = document.createElement('textarea');
            const mockTerminal = {
                textarea: mockTextarea,
                focus: vitest_1.vi.fn(),
            };
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: mockTerminal,
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.setActiveTerminalId('terminal-1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should skip focus if textarea already focused', () => {
            const mockTextarea = document.createElement('textarea');
            document.body.appendChild(mockTextarea);
            mockTextarea.focus();
            const mockTerminal = {
                textarea: mockTextarea,
                focus: vitest_1.vi.fn(),
            };
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: mockTerminal,
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.setActiveTerminalId('terminal-1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getTerminalInstance', () => {
        (0, vitest_1.it)('should return undefined for non-existent terminal', () => {
            (0, vitest_1.expect)(coordinator.getTerminalInstance('terminal-999')).toBeUndefined();
        });
        (0, vitest_1.it)('should return terminal instance', () => {
            // @ts-expect-error - test mock type
            const instance = {
                terminal: {},
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            };
            mockTerminals.set('terminal-1', instance);
            (0, vitest_1.expect)(coordinator.getTerminalInstance('terminal-1')).toBe(instance);
        });
    });
    (0, vitest_1.describe)('getAllTerminalInstances', () => {
        (0, vitest_1.it)('should return empty map initially', () => {
            (0, vitest_1.expect)(coordinator.getAllTerminalInstances().size).toBe(0);
        });
        (0, vitest_1.it)('should return all terminal instances', () => {
            mockTerminals.set('terminal-1', {});
            mockTerminals.set('terminal-2', {});
            (0, vitest_1.expect)(coordinator.getAllTerminalInstances().size).toBe(2);
        });
    });
    (0, vitest_1.describe)('getAllTerminalContainers', () => {
        (0, vitest_1.it)('should return containers map', () => {
            mockContainers.set('terminal-1', document.createElement('div'));
            (0, vitest_1.expect)(coordinator.getAllTerminalContainers().size).toBe(1);
        });
    });
    (0, vitest_1.describe)('getTerminalElement', () => {
        (0, vitest_1.it)('should return undefined for non-existent terminal', () => {
            (0, vitest_1.expect)(coordinator.getTerminalElement('terminal-999')).toBeUndefined();
        });
        (0, vitest_1.it)('should return container element', () => {
            const container = document.createElement('div');
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: {},
                fitAddon: {},
                container,
                name: 'Terminal 1',
                number: 1,
            });
            (0, vitest_1.expect)(coordinator.getTerminalElement('terminal-1')).toBe(container);
        });
    });
    (0, vitest_1.describe)('createTerminal', () => {
        (0, vitest_1.it)('should delegate to TerminalCreationService', async () => {
            const result = await coordinator.createTerminal('terminal-1', 'Terminal 1');
            (0, vitest_1.expect)(result).toBeTruthy();
        });
    });
    (0, vitest_1.describe)('removeTerminal', () => {
        (0, vitest_1.it)('should delegate to TerminalCreationService', async () => {
            const result = await coordinator.removeTerminal('terminal-1');
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('switchToTerminal', () => {
        (0, vitest_1.it)('should delegate to TerminalCreationService', async () => {
            const result = await coordinator.switchToTerminal('terminal-1');
            (0, vitest_1.expect)(result).toBe(true);
        });
    });
    (0, vitest_1.describe)('writeToTerminal', () => {
        (0, vitest_1.it)('should return false when no active terminal', () => {
            const result = coordinator.writeToTerminal('test data');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when terminal not found', () => {
            coordinator.activeTerminalId = 'terminal-999';
            const result = coordinator.writeToTerminal('test data');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should write to active terminal', () => {
            const mockWrite = vitest_1.vi.fn((data, callback) => {
                callback();
            });
            const mockTerminal = {
                write: mockWrite,
                buffer: {
                    active: {
                        baseY: 100,
                        viewportY: 100,
                    },
                },
                scrollToBottom: vitest_1.vi.fn(),
            };
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: mockTerminal,
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.activeTerminalId = 'terminal-1';
            const result = coordinator.writeToTerminal('test data');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockWrite).toHaveBeenCalledWith('test data', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should write to specific terminal by ID', () => {
            const mockWrite = vitest_1.vi.fn();
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-2', {
                terminal: { write: mockWrite, buffer: { active: { baseY: 0, viewportY: 0 } } },
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 2',
                number: 2,
            });
            const result = coordinator.writeToTerminal('test data', 'terminal-2');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockWrite).toHaveBeenCalledWith('test data', vitest_1.expect.any(Function));
        });
        (0, vitest_1.it)('should auto-scroll when at bottom', () => {
            const mockScrollToBottom = vitest_1.vi.fn();
            const mockWrite = vitest_1.vi.fn((data, callback) => {
                callback();
            });
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: {
                    write: mockWrite,
                    buffer: {
                        active: {
                            baseY: 100,
                            viewportY: 100, // At bottom
                        },
                    },
                    scrollToBottom: mockScrollToBottom,
                },
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.activeTerminalId = 'terminal-1';
            coordinator.writeToTerminal('test data');
            (0, vitest_1.expect)(mockScrollToBottom).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not auto-scroll when not at bottom', () => {
            const mockScrollToBottom = vitest_1.vi.fn();
            const mockWrite = vitest_1.vi.fn((data, callback) => {
                callback();
            });
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: {
                    write: mockWrite,
                    buffer: {
                        active: {
                            baseY: 100,
                            viewportY: 50, // Not at bottom (difference > 1)
                        },
                    },
                    scrollToBottom: mockScrollToBottom,
                },
                fitAddon: {},
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.activeTerminalId = 'terminal-1';
            coordinator.writeToTerminal('test data');
            (0, vitest_1.expect)(mockScrollToBottom).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('initializeSimpleTerminal', () => {
        (0, vitest_1.afterEach)(() => {
            const body = document.getElementById('terminal-body');
            if (body && body.parentNode) {
                body.parentNode.removeChild(body);
            }
        });
        (0, vitest_1.it)('should initialize terminal body container', () => {
            const container = document.createElement('div');
            container.id = 'terminal-body';
            document.body.appendChild(container);
            coordinator.initializeSimpleTerminal();
            (0, vitest_1.expect)(container.className).toBe('terminal-body-container');
            (0, vitest_1.expect)(container.style.display).toBe('flex');
        });
        (0, vitest_1.it)('should create terminals-wrapper if not exists', () => {
            const container = document.createElement('div');
            container.id = 'terminal-body';
            document.body.appendChild(container);
            coordinator.initializeSimpleTerminal();
            const wrapper = document.getElementById('terminals-wrapper');
            (0, vitest_1.expect)(wrapper).not.toBeNull();
            (0, vitest_1.expect)(wrapper?.style.display).toBe('flex');
        });
        (0, vitest_1.it)('should not create duplicate terminals-wrapper', () => {
            const container = document.createElement('div');
            container.id = 'terminal-body';
            document.body.appendChild(container);
            const existingWrapper = document.createElement('div');
            existingWrapper.id = 'terminals-wrapper';
            container.appendChild(existingWrapper);
            coordinator.initializeSimpleTerminal();
            const wrappers = document.querySelectorAll('#terminals-wrapper');
            (0, vitest_1.expect)(wrappers.length).toBe(1);
        });
        (0, vitest_1.it)('should handle missing container gracefully', () => {
            // No container in DOM
            (0, vitest_1.expect)(() => coordinator.initializeSimpleTerminal()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('resizeAllTerminals', () => {
        (0, vitest_1.it)('should resize all terminals', async () => {
            const mockFit = vitest_1.vi.fn();
            // @ts-expect-error - test mock type
            mockTerminals.set('terminal-1', {
                terminal: { cols: 80, rows: 24 },
                fitAddon: { fit: mockFit },
                container: document.createElement('div'),
                name: 'Terminal 1',
                number: 1,
            });
            coordinator.resizeAllTerminals();
            // Fast-forward for requestAnimationFrame
            vitest_1.vi.advanceTimersByTime(100);
            (0, vitest_1.expect)(mockFit).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getTerminalStats', () => {
        (0, vitest_1.it)('should return correct stats with no terminals', () => {
            const stats = coordinator.getTerminalStats();
            (0, vitest_1.expect)(stats.totalTerminals).toBe(0);
            (0, vitest_1.expect)(stats.activeTerminalId).toBeNull();
            (0, vitest_1.expect)(stats.terminalIds).toEqual([]);
        });
        (0, vitest_1.it)('should return correct stats with terminals', () => {
            mockTerminals.set('terminal-1', {});
            mockTerminals.set('terminal-2', {});
            coordinator.activeTerminalId = 'terminal-1';
            const stats = coordinator.getTerminalStats();
            (0, vitest_1.expect)(stats.totalTerminals).toBe(2);
            (0, vitest_1.expect)(stats.activeTerminalId).toBe('terminal-1');
            (0, vitest_1.expect)(stats.terminalIds).toContain('terminal-1');
            (0, vitest_1.expect)(stats.terminalIds).toContain('terminal-2');
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should reset all instance variables', () => {
            coordinator.activeTerminalId = 'terminal-1';
            coordinator.terminal = {};
            coordinator.fitAddon = {};
            coordinator.terminalContainer = document.createElement('div');
            coordinator.dispose();
            (0, vitest_1.expect)(coordinator.activeTerminalId).toBeNull();
            (0, vitest_1.expect)(coordinator.terminal).toBeNull();
            (0, vitest_1.expect)(coordinator.fitAddon).toBeNull();
            (0, vitest_1.expect)(coordinator.terminalContainer).toBeNull();
        });
        (0, vitest_1.it)('should cleanup resize observers for all terminals', async () => {
            const { ResizeManager } = await Promise.resolve().then(() => require('../../../../../webview/utils/ResizeManager'));
            mockTerminals.set('terminal-1', {});
            mockTerminals.set('terminal-2', {});
            coordinator.dispose();
            (0, vitest_1.expect)(ResizeManager.unobserveResize).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(ResizeManager.unobserveResize).toHaveBeenCalledWith('terminal-2');
        });
    });
});
//# sourceMappingURL=TerminalLifecycleCoordinator.test.js.map