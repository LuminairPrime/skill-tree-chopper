"use strict";
/**
 * TerminalLifecycleMessageHandler Tests
 *
 * Tests for terminal lifecycle message handling
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalLifecycleMessageHandler_1 = require("../../../../../../webview/managers/handlers/TerminalLifecycleMessageHandler");
(0, vitest_1.describe)('TerminalLifecycleMessageHandler', () => {
    let handler;
    let mockCoordinator;
    let mockLogger;
    let mockUiManager;
    (0, vitest_1.beforeEach)(() => {
        mockUiManager = {
            setTerminalProcessingIndicator: vitest_1.vi.fn(),
        };
        // Create mock logger
        mockLogger = {
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            debug: vitest_1.vi.fn(),
            lifecycle: vitest_1.vi.fn(),
        };
        // Create minimal mock coordinator
        mockCoordinator = {
            getActiveTerminalId: () => 'terminal-1',
            getCliAgentState: vitest_1.vi.fn().mockReturnValue({ status: 'connected', agentType: 'claude' }),
            setActiveTerminalId: vitest_1.vi.fn(),
            setForceNormalModeForNextCreate: vitest_1.vi.fn(),
            getTerminalInstance: () => undefined,
            getAllTerminalInstances: () => new Map(),
            getAllTerminalContainers: () => new Map(),
            getTerminalElement: () => undefined,
            postMessageToExtension: vitest_1.vi.fn(),
            log: vitest_1.vi.fn(),
            createTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
            openSettings: vitest_1.vi.fn(),
            setVersionInfo: vitest_1.vi.fn(),
            applyFontSettings: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            updateClaudeStatus: vitest_1.vi.fn(),
            updateCliAgentStatus: vitest_1.vi.fn(),
            ensureTerminalFocus: vitest_1.vi.fn(),
            getSerializeAddon: () => undefined,
            getManagers: () => ({
                performance: {
                    scheduleOutputBuffer: vitest_1.vi.fn(),
                    bufferedWrite: vitest_1.vi.fn(),
                },
                input: {},
                ui: mockUiManager,
                config: {},
                message: {},
                notification: {},
            }),
            getMessageManager: () => ({}),
            getDisplayModeManager: vitest_1.vi.fn().mockReturnValue({
                setDisplayMode: vitest_1.vi.fn(),
                showTerminalFullscreen: vitest_1.vi.fn(),
            }),
        };
        // Create mock message queue
        const mockMessageQueue = {
            enqueue: vitest_1.vi.fn(),
        };
        handler = new TerminalLifecycleMessageHandler_1.TerminalLifecycleMessageHandler(mockMessageQueue, mockLogger);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.useRealTimers(); // Ensure fake timers are always restored
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should initialize successfully', () => {
            (0, vitest_1.expect)(handler).toBeDefined();
        });
        (0, vitest_1.it)('should return supported commands', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toBeInstanceOf(Array);
            (0, vitest_1.expect)(commands).toContain('init');
            (0, vitest_1.expect)(commands).toContain('output');
            (0, vitest_1.expect)(commands).toContain('terminalCreated');
            (0, vitest_1.expect)(commands).toContain('clear');
        });
    });
    (0, vitest_1.describe)('Init Message Handling', () => {
        (0, vitest_1.it)('should handle init message with terminals', () => {
            const message = {
                command: 'init',
                terminals: [
                    { id: 'terminal-1', name: 'Terminal 1' },
                    { id: 'terminal-2', name: 'Terminal 2' },
                ],
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle init message without terminals', () => {
            const message = {
                command: 'init',
                terminals: [],
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Output Message Handling', () => {
        (0, vitest_1.it)('should handle output message', () => {
            const message = {
                command: 'output',
                terminalId: 'terminal-1',
                data: 'test output',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle output message without terminal instance', () => {
            const message = {
                command: 'output',
                terminalId: 'non-existent',
                data: 'test output',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error - handler should handle gracefully
        });
        (0, vitest_1.it)('should handle empty output', () => {
            const message = {
                command: 'output',
                terminalId: 'terminal-1',
                data: '',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should toggle processing indicator around output activity', async () => {
            vitest_1.vi.useFakeTimers();
            const message = {
                command: 'output',
                terminalId: 'terminal-1',
                data: 'processing...',
            };
            await handler.handleMessage({ command: 'startOutput', terminalId: 'terminal-1' }, mockCoordinator);
            await handler.handleMessage(message, mockCoordinator);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).toHaveBeenCalledWith('terminal-1', true);
            vitest_1.vi.advanceTimersByTime(1200);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).toHaveBeenCalledWith('terminal-1', false);
        });
        (0, vitest_1.it)('should not enable processing indicator when CLI agent status is none', async () => {
            vitest_1.vi.useFakeTimers();
            mockCoordinator.getCliAgentState.mockReturnValue({
                status: 'none',
                agentType: null,
            });
            await handler.handleMessage({ command: 'startOutput', terminalId: 'terminal-1' }, mockCoordinator);
            await handler.handleMessage({
                command: 'output',
                terminalId: 'terminal-1',
                data: 'processing...',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).not.toHaveBeenCalledWith('terminal-1', true);
        });
        (0, vitest_1.it)('should enable processing indicator for disconnected supported agent', async () => {
            vitest_1.vi.useFakeTimers();
            mockCoordinator.getCliAgentState.mockReturnValue({
                status: 'disconnected',
                agentType: 'copilot',
            });
            await handler.handleMessage({ command: 'startOutput', terminalId: 'terminal-1' }, mockCoordinator);
            await handler.handleMessage({
                command: 'output',
                terminalId: 'terminal-1',
                data: 'processing...',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).toHaveBeenCalledWith('terminal-1', true);
        });
        (0, vitest_1.it)('should not enable processing indicator for unsupported agent type', async () => {
            vitest_1.vi.useFakeTimers();
            mockCoordinator.getCliAgentState.mockReturnValue({
                status: 'connected',
                agentType: 'other',
            });
            await handler.handleMessage({ command: 'startOutput', terminalId: 'terminal-1' }, mockCoordinator);
            await handler.handleMessage({
                command: 'output',
                terminalId: 'terminal-1',
                data: 'processing...',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).not.toHaveBeenCalledWith('terminal-1', true);
        });
        (0, vitest_1.it)('should not enable processing indicator when header enhancements are disabled', async () => {
            vitest_1.vi.useFakeTimers();
            mockCoordinator.getManagers = () => ({
                performance: {
                    scheduleOutputBuffer: vitest_1.vi.fn(),
                    bufferedWrite: vitest_1.vi.fn(),
                },
                input: {},
                ui: mockUiManager,
                config: {
                    getCurrentSettings: () => ({ enableTerminalHeaderEnhancements: false }),
                },
                message: {},
                notification: {},
            });
            await handler.handleMessage({ command: 'startOutput', terminalId: 'terminal-1' }, mockCoordinator);
            await handler.handleMessage({
                command: 'output',
                terminalId: 'terminal-1',
                data: 'processing...',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockUiManager.setTerminalProcessingIndicator).not.toHaveBeenCalledWith('terminal-1', true);
        });
    });
    (0, vitest_1.describe)('Terminal Creation Handling', () => {
        (0, vitest_1.it)('should handle terminalCreated message', () => {
            const message = {
                command: 'terminalCreated',
                terminalId: 'terminal-2',
                name: 'New Terminal',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should force normal mode when displayModeOverride is normal', () => {
            const message = {
                command: 'terminalCreated',
                terminalId: 'terminal-2',
                terminalName: 'New Terminal',
                config: {
                    displayModeOverride: 'normal',
                },
            };
            handler.handleMessage(message, mockCoordinator);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(mockCoordinator.setForceNormalModeForNextCreate).toHaveBeenCalledWith(true);
            const displayModeManager = mockCoordinator.getDisplayModeManager();
            (0, vitest_1.expect)(displayModeManager.setDisplayMode).toHaveBeenCalledWith('normal');
        });
        (0, vitest_1.it)('should show terminal fullscreen when displayModeOverride is fullscreen', async () => {
            mockCoordinator.createTerminal.mockResolvedValue({});
            const message = {
                command: 'terminalCreated',
                terminalId: 'terminal-9',
                terminalName: 'Fullscreen Terminal',
                config: {
                    displayModeOverride: 'fullscreen',
                },
            };
            vitest_1.vi.useFakeTimers();
            await handler.handleMessage(message, mockCoordinator);
            vitest_1.vi.runAllTimers();
            const displayModeManager = mockCoordinator.getDisplayModeManager();
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('terminal-9');
            (0, vitest_1.expect)(displayModeManager.showTerminalFullscreen).toHaveBeenCalledWith('terminal-9');
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('should handle newTerminal message', () => {
            const message = {
                command: 'newTerminal',
                terminalId: 'terminal-3',
                name: 'Another Terminal',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Terminal Focus Handling', () => {
        (0, vitest_1.it)('should handle focusTerminal message', () => {
            const message = {
                command: 'focusTerminal',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle setActiveTerminal message', () => {
            const message = {
                command: 'setActiveTerminal',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Terminal Deletion Handling', () => {
        (0, vitest_1.it)('should handle deleteTerminalResponse message', () => {
            const message = {
                command: 'deleteTerminalResponse',
                terminalId: 'terminal-1',
                success: true,
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle terminalRemoved message', () => {
            const message = {
                command: 'terminalRemoved',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle deletion failure', () => {
            const message = {
                command: 'deleteTerminalResponse',
                terminalId: 'terminal-1',
                success: false,
                error: 'Cannot delete last terminal',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Clear Command Handling', () => {
        (0, vitest_1.it)('should handle clear message', () => {
            const message = {
                command: 'clear',
                terminalId: 'terminal-1',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
        (0, vitest_1.it)('should handle clear without terminal ID', () => {
            const message = {
                command: 'clear',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should clear active terminal
        });
    });
    (0, vitest_1.describe)('Unknown Command Handling', () => {
        (0, vitest_1.it)('should handle unknown command gracefully', () => {
            const message = {
                command: 'unknownLifecycleCommand',
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Disposal', () => {
        (0, vitest_1.it)('should dispose cleanly', () => {
            handler.dispose();
            // Should not throw error
        });
        (0, vitest_1.it)('should be safe to dispose multiple times', () => {
            handler.dispose();
            handler.dispose();
            // Should not throw error
        });
    });
    (0, vitest_1.describe)('Error Resilience', () => {
        // TODO: Fix handler to properly catch errors and prevent unhandled rejections
        vitest_1.it.skip('should handle coordinator method failures gracefully', () => {
            const faultyCoordinator = {
                ...mockCoordinator,
                getTerminalInstance: () => {
                    throw new Error('Test error');
                },
            };
            const message = {
                command: 'output',
                terminalId: 'terminal-1',
                data: 'test',
            };
            // Should not throw - handler should be resilient
            (0, vitest_1.expect)(() => handler.handleMessage(message, faultyCoordinator)).not.toThrow();
        });
        (0, vitest_1.it)('should handle missing data gracefully', () => {
            const message = {
                command: 'output',
                // Missing terminalId and data
            };
            handler.handleMessage(message, mockCoordinator);
            // Should not throw error
        });
    });
});
//# sourceMappingURL=TerminalLifecycleMessageHandler.test.js.map