"use strict";
/**
 * ShellIntegrationMessageHandler Tests
 *
 * Tests for shell integration message handling
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const ShellIntegrationMessageHandler_1 = require("../../../../../../webview/managers/handlers/ShellIntegrationMessageHandler");
(0, vitest_1.describe)('ShellIntegrationMessageHandler', () => {
    let handler;
    let mockCoordinator;
    let mockLogger;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        // CRITICAL: Create JSDOM in beforeEach to prevent test pollution
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
        });
        // Set up global DOM
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        // Create mock logger
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
        };
        // Create minimal mock coordinator
        mockCoordinator = {
            getActiveTerminalId: () => 'terminal-1',
            getAllTerminalInstances: () => new Map(),
            log: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
            shellIntegrationManager: {
                updateShellStatus: vitest_1.vi.fn(),
                updateWorkingDirectory: vitest_1.vi.fn(),
                showCommandHistory: vitest_1.vi.fn(),
            },
            getManagers: () => ({
                performance: {},
                input: {},
                ui: {},
                config: {},
                message: {},
                notification: {},
            }),
        };
        handler = new ShellIntegrationMessageHandler_1.ShellIntegrationMessageHandler(mockLogger);
    });
    (0, vitest_1.afterEach)(() => {
        // CRITICAL: Use try-finally to ensure all cleanup happens
        try {
            handler.dispose();
        }
        finally {
            try {
                vitest_1.vi.restoreAllMocks();
            }
            finally {
                try {
                    dom.window.close();
                }
                finally {
                    delete global.document;
                    delete global.window;
                    delete global.HTMLElement;
                }
            }
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', () => {
            (0, vitest_1.expect)(handler).toBeDefined();
        });
        (0, vitest_1.it)('should return supported commands', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toBeInstanceOf(Array);
            (0, vitest_1.expect)(commands).toContain('shellStatus');
            (0, vitest_1.expect)(commands).toContain('cwdUpdate');
            (0, vitest_1.expect)(commands).toContain('commandHistory');
            (0, vitest_1.expect)(commands).toContain('find');
        });
    });
    (0, vitest_1.describe)('Shell Status Handling', () => {
        (0, vitest_1.it)('should handle shellStatus message', () => {
            const message = {
                command: 'shellStatus',
                terminalId: 'terminal-1',
                status: 'ready',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle shellStatus without terminalId', () => {
            const message = {
                command: 'shellStatus',
                status: 'ready',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
        (0, vitest_1.it)('should handle shellStatus without status', () => {
            const message = {
                command: 'shellStatus',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
    });
    (0, vitest_1.describe)('CWD Update Handling', () => {
        (0, vitest_1.it)('should handle cwdUpdate message', () => {
            const message = {
                command: 'cwdUpdate',
                terminalId: 'terminal-1',
                cwd: '/home/user/project',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle cwdUpdate without terminalId', () => {
            const message = {
                command: 'cwdUpdate',
                cwd: '/home/user/project',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
        (0, vitest_1.it)('should handle cwdUpdate without cwd', () => {
            const message = {
                command: 'cwdUpdate',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
        (0, vitest_1.it)('should handle cwdUpdate when shellIntegrationManager is not available', () => {
            const coordinatorWithoutShell = {
                ...mockCoordinator,
                shellIntegrationManager: undefined,
            };
            const message = {
                command: 'cwdUpdate',
                terminalId: 'terminal-1',
                cwd: '/home/user/project',
            };
            handler.handleMessage(message, coordinatorWithoutShell);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Command History Handling', () => {
        (0, vitest_1.it)('should handle commandHistory message', () => {
            const message = {
                command: 'commandHistory',
                terminalId: 'terminal-1',
                history: [
                    { command: 'ls -la', exitCode: 0 },
                    { command: 'cd /home', exitCode: 0 },
                ],
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle commandHistory with duration info', () => {
            const message = {
                command: 'commandHistory',
                terminalId: 'terminal-1',
                history: [{ command: 'npm test', exitCode: 0, duration: 1234 }],
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle commandHistory without terminalId', () => {
            const message = {
                command: 'commandHistory',
                history: [],
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
        (0, vitest_1.it)('should handle commandHistory without history', () => {
            const message = {
                command: 'commandHistory',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
    });
    (0, vitest_1.describe)('Find/Search Handling', () => {
        (0, vitest_1.beforeEach)(() => {
            // Set up DOM for search UI tests
            const mainElement = document.createElement('div');
            mainElement.id = 'main';
            document.body.appendChild(mainElement);
        });
        (0, vitest_1.afterEach)(() => {
            // Clean up DOM
            const mainElement = document.getElementById('main');
            if (mainElement) {
                mainElement.remove();
            }
            // Clean up search container
            const searchContainer = document.getElementById('terminal-search-container');
            if (searchContainer) {
                searchContainer.remove();
            }
            // Clean up search styles
            const searchStyles = document.getElementById('terminal-search-styles');
            if (searchStyles) {
                searchStyles.remove();
            }
        });
        (0, vitest_1.it)('should handle find message', () => {
            const message = {
                command: 'find',
                action: 'show',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle find without active terminal', () => {
            const coordinatorWithoutTerminal = {
                ...mockCoordinator,
                getActiveTerminalId: () => null,
            };
            const message = {
                command: 'find',
                action: 'show',
            };
            handler.handleMessage(message, coordinatorWithoutTerminal);
            // Should warn but not throw
        });
        (0, vitest_1.it)('should handle find without terminal instance', () => {
            const coordinatorWithoutInstance = {
                ...mockCoordinator,
                getAllTerminalInstances: () => new Map(),
            };
            const message = {
                command: 'find',
                action: 'show',
            };
            handler.handleMessage(message, coordinatorWithoutInstance);
            // Should warn but not throw
        });
    });
    (0, vitest_1.describe)('Unknown Command Handling', () => {
        (0, vitest_1.it)('should handle unknown command gracefully', () => {
            const message = {
                command: 'unknownShellCommand',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
    });
    (0, vitest_1.describe)('Disposal', () => {
        (0, vitest_1.it)('should dispose cleanly', () => {
            handler.dispose();
            // Should not throw error
        });
        (0, vitest_1.it)('should clean up search UI on dispose', () => {
            // Create search UI elements
            const searchContainer = document.createElement('div');
            searchContainer.id = 'terminal-search-container';
            document.body.appendChild(searchContainer);
            const searchStyles = document.createElement('style');
            searchStyles.id = 'terminal-search-styles';
            document.body.appendChild(searchStyles);
            handler.dispose();
            // Should remove search UI
            (0, vitest_1.expect)(document.getElementById('terminal-search-container')).toBeNull();
            (0, vitest_1.expect)(document.getElementById('terminal-search-styles')).toBeNull();
        });
        (0, vitest_1.it)('should be safe to dispose multiple times', () => {
            handler.dispose();
            handler.dispose();
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Error Resilience', () => {
        (0, vitest_1.it)('should handle missing shellIntegrationManager gracefully', () => {
            const coordinatorWithoutShell = {
                ...mockCoordinator,
                shellIntegrationManager: undefined,
            };
            const message = {
                command: 'shellStatus',
                terminalId: 'terminal-1',
                status: 'ready',
            };
            handler.handleMessage(message, coordinatorWithoutShell);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle malformed message data', () => {
            const message = {
                command: 'shellStatus',
                // Missing required fields
            };
            handler.handleMessage(message, mockCoordinator);
            // Should warn but not throw
        });
    });
    (0, vitest_1.describe)('Shell Integration Manager Methods', () => {
        (0, vitest_1.it)('should call updateShellStatus when available', () => {
            const updateShellStatusMock = vitest_1.vi.fn();
            mockCoordinator.shellIntegrationManager = {
                updateShellStatus: updateShellStatusMock,
            };
            const message = {
                command: 'shellStatus',
                terminalId: 'terminal-1',
                status: 'ready',
            };
            handler.handleMessage(message, mockCoordinator);
            (0, vitest_1.expect)(updateShellStatusMock).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should call updateWorkingDirectory when available', () => {
            const updateWorkingDirectoryMock = vitest_1.vi.fn();
            mockCoordinator.shellIntegrationManager = {
                updateWorkingDirectory: updateWorkingDirectoryMock,
            };
            const message = {
                command: 'cwdUpdate',
                terminalId: 'terminal-1',
                cwd: '/test',
            };
            handler.handleMessage(message, mockCoordinator);
            (0, vitest_1.expect)(updateWorkingDirectoryMock).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should call showCommandHistory when available', () => {
            const showCommandHistoryMock = vitest_1.vi.fn();
            mockCoordinator.shellIntegrationManager = {
                showCommandHistory: showCommandHistoryMock,
            };
            const message = {
                command: 'commandHistory',
                terminalId: 'terminal-1',
                history: [],
            };
            handler.handleMessage(message, mockCoordinator);
            (0, vitest_1.expect)(showCommandHistoryMock).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=ShellIntegrationMessageHandler.test.js.map