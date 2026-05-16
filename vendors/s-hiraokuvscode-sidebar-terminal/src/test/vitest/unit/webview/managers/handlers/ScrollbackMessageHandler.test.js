"use strict";
/**
 * ScrollbackMessageHandler Unit Tests
 *
 * Tests for scrollback extraction, restoration, and progress tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackMessageHandler_1 = require("../../../../../../webview/managers/handlers/ScrollbackMessageHandler");
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/services/TerminalCreationService', () => ({
    TerminalCreationService: {
        markTerminalRestoring: vitest_1.vi.fn(),
        markTerminalRestored: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('ScrollbackMessageHandler', () => {
    let handler;
    let mockMessageQueue;
    let mockLogger;
    let mockCoordinator;
    // Mock terminal with buffer
    const createMockTerminal = (lines = []) => {
        const mockBuffer = {
            active: {
                length: lines.length,
                viewportY: 0,
                baseY: 0,
                getLine: vitest_1.vi.fn((i) => {
                    if (i >= 0 && i < lines.length) {
                        return {
                            translateToString: vitest_1.vi.fn((trim) => (trim ? lines[i]?.trim() : lines[i]) ?? ''),
                        };
                    }
                    return null;
                }),
            },
        };
        return {
            buffer: mockBuffer,
            write: vitest_1.vi.fn((data, callback) => {
                if (callback)
                    callback();
            }),
            writeln: vitest_1.vi.fn(),
            hasSelection: vitest_1.vi.fn(() => false),
            getSelection: vitest_1.vi.fn(() => ''),
        };
    };
    // Mock SerializeAddon
    const createMockSerializeAddon = (content) => ({
        serialize: vitest_1.vi.fn(() => content),
    });
    (0, vitest_1.beforeEach)(() => {
        // Create mock message queue
        mockMessageQueue = {
            enqueue: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        // Create mock logger
        mockLogger = {
            debug: vitest_1.vi.fn(),
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
        };
        // Create mock coordinator
        mockCoordinator = {
            getTerminalInstance: vitest_1.vi.fn(),
            getSerializeAddon: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn(() => 'terminal-1'),
            setActiveTerminalId: vitest_1.vi.fn(),
        };
        // Create handler
        handler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(mockMessageQueue, mockLogger);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('getSupportedCommands', () => {
        (0, vitest_1.it)('should return all supported command types', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toContain('getScrollback');
            (0, vitest_1.expect)(commands).toContain('restoreScrollback');
            (0, vitest_1.expect)(commands).toContain('scrollbackProgress');
            (0, vitest_1.expect)(commands).toContain('extractScrollbackData');
            (0, vitest_1.expect)(commands).toContain('restoreTerminalSessions');
            (0, vitest_1.expect)(commands).toHaveLength(5);
        });
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should handle getScrollback command', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2']);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'terminal-1', maxLines: 100 }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should handle restoreScrollback command', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: ['line1', 'line2'],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should handle scrollbackProgress command', async () => {
            await handler.handleMessage({
                command: 'scrollbackProgress',
                scrollbackProgress: {
                    terminalId: 'terminal-1',
                    progress: 50,
                    currentLines: 500,
                    totalLines: 1000,
                    stage: 'restoring',
                },
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(vitest_1.expect.stringContaining('50%'));
        });
        (0, vitest_1.it)('should log warning for unknown command', async () => {
            await handler.handleMessage({ command: 'unknownCommand' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Unknown scrollback command'));
        });
    });
    (0, vitest_1.describe)('getScrollback extraction', () => {
        (0, vitest_1.it)('should extract scrollback using SerializeAddon when available', async () => {
            const mockTerminal = createMockTerminal([]);
            const mockSerializeAddon = createMockSerializeAddon('line1\nline2\nline3');
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(mockSerializeAddon);
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'terminal-1', maxLines: 1000 }, mockCoordinator);
            (0, vitest_1.expect)(mockSerializeAddon.serialize).toHaveBeenCalled();
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'scrollbackDataCollected',
                terminalId: 'terminal-1',
            }));
        });
        (0, vitest_1.it)('should fallback to buffer extraction when SerializeAddon not available', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2']);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(undefined);
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'terminal-1', maxLines: 1000 }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SerializeAddon not available'));
        });
        (0, vitest_1.it)('should handle missing terminal ID', async () => {
            await handler.handleMessage({ command: 'getScrollback' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('No terminal ID provided'));
        });
        (0, vitest_1.it)('should handle terminal not found', async () => {
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue(null);
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'non-existent' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Terminal instance not found'));
        });
        (0, vitest_1.it)('should use default maxLines of 1000 when not specified', async () => {
            const mockTerminal = createMockTerminal(['line1']);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'terminal-1' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.debug).toHaveBeenCalledWith(vitest_1.expect.stringContaining('max 1000 lines'));
        });
    });
    (0, vitest_1.describe)('restoreScrollback', () => {
        (0, vitest_1.it)('should restore scrollback content to terminal', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: ['line1', 'line2', 'line3'],
            }, mockCoordinator);
            // Should use writeln for all but last line, write for last
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle string scrollback content (legacy format)', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: 'line1\nline2\nline3',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle ScrollbackLine array format', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            const scrollbackLines = [
                { content: 'line1', type: 'output' },
                { content: 'line2', type: 'input' },
                { content: 'line3', type: 'error' },
            ];
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: scrollbackLines,
            }, mockCoordinator);
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledWith('line3');
        });
        (0, vitest_1.it)('should prevent duplicate restoration', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            // First restoration
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: ['line1'],
            }, mockCoordinator);
            // Reset mock call counts
            mockTerminal.write.mockClear();
            mockTerminal.writeln.mockClear();
            // Second restoration should be skipped
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: ['line2'],
            }, mockCoordinator);
            // Should not write anything on duplicate
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.writeln).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing scrollback content', async () => {
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith('Invalid scrollback restore request', vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should send confirmation after successful restoration', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-1',
                scrollbackContent: ['line1', 'line2'],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'scrollbackRestored',
                terminalId: 'terminal-1',
                restoredLines: 2,
            }));
        });
    });
    (0, vitest_1.describe)('extractScrollbackData', () => {
        (0, vitest_1.it)('should extract scrollback and send to extension', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2']);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
                serializeAddon: createMockSerializeAddon('line1\nline2'),
            });
            await handler.handleMessage({
                command: 'extractScrollbackData',
                terminalId: 'terminal-1',
                requestId: 'req-123',
                maxLines: 500,
            }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'scrollbackDataCollected',
                terminalId: 'terminal-1',
                requestId: 'req-123',
            }));
        });
        (0, vitest_1.it)('should handle missing requestId', async () => {
            await handler.handleMessage({
                command: 'extractScrollbackData',
                terminalId: 'terminal-1',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Missing terminalId or requestId'));
        });
        (0, vitest_1.it)('should send empty response when terminal not found', async () => {
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue(null);
            await handler.handleMessage({
                command: 'extractScrollbackData',
                terminalId: 'terminal-1',
                requestId: 'req-123',
            }, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'scrollbackDataCollected',
                scrollbackData: [],
            }));
        });
    });
    (0, vitest_1.describe)('restoreTerminalSessions (batch)', () => {
        (0, vitest_1.it)('should restore multiple terminals', async () => {
            const mockTerminal1 = createMockTerminal([]);
            const mockTerminal2 = createMockTerminal([]);
            // Mock getTerminalInstance to return terminals for both IDs
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockImplementation((id) => {
                if (id === 'terminal-1')
                    return { terminal: mockTerminal1 };
                if (id === 'terminal-2')
                    return { terminal: mockTerminal2 };
                return null;
            });
            await handler.handleMessage({
                command: 'restoreTerminalSessions',
                terminals: [
                    { terminalId: 'terminal-1', scrollbackData: ['line1'], restoreScrollback: true },
                    { terminalId: 'terminal-2', scrollbackData: ['line2'], restoreScrollback: true },
                ],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSessionsRestored',
                terminalsRestored: 2,
                terminalsFailed: 0,
            }));
        });
        (0, vitest_1.it)('should skip terminals without scrollback data', async () => {
            await handler.handleMessage({
                command: 'restoreTerminalSessions',
                terminals: [
                    { terminalId: 'terminal-1', restoreScrollback: false },
                    { terminalId: 'terminal-2', scrollbackData: [], restoreScrollback: true },
                ],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(vitest_1.expect.stringContaining('no scrollback data'));
        });
        (0, vitest_1.it)('should handle empty terminals array', async () => {
            await handler.handleMessage({
                command: 'restoreTerminalSessions',
                terminals: [],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('No terminals provided'));
        });
        (0, vitest_1.it)('should handle terminals without terminalId', async () => {
            await handler.handleMessage({
                command: 'restoreTerminalSessions',
                terminals: [{ scrollbackData: ['line1'], restoreScrollback: true }],
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('missing terminalId'));
        });
    });
    (0, vitest_1.describe)('scrollbackProgress', () => {
        (0, vitest_1.it)('should log progress information', async () => {
            await handler.handleMessage({
                command: 'scrollbackProgress',
                scrollbackProgress: {
                    terminalId: 'terminal-1',
                    progress: 75,
                    currentLines: 750,
                    totalLines: 1000,
                    stage: 'loading',
                },
            }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(vitest_1.expect.stringContaining('75%'));
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith(vitest_1.expect.stringContaining('750/1000'));
        });
        (0, vitest_1.it)('should handle missing progress information', async () => {
            await handler.handleMessage({ command: 'scrollbackProgress' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('No progress information provided'));
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clean up resources', () => {
            // Create and use handler
            const testHandler = new ScrollbackMessageHandler_1.ScrollbackMessageHandler(mockMessageQueue, mockLogger);
            // Dispose should not throw
            (0, vitest_1.expect)(() => testHandler.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should handle extraction errors gracefully', async () => {
            // When getLine throws, the error is caught and logged, but still sends scrollbackDataCollected with empty data
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: {
                    buffer: {
                        active: {
                            length: 1,
                            viewportY: 0,
                            baseY: 0,
                            getLine: vitest_1.vi.fn(() => {
                                throw new Error('Buffer access error');
                            }),
                        },
                    },
                    write: vitest_1.vi.fn((_, cb) => cb?.()),
                },
            });
            await handler.handleMessage({ command: 'getScrollback', terminalId: 'terminal-1' }, mockCoordinator);
            // The error is caught inside extractScrollbackFromXterm and re-thrown,
            // then caught in handleGetScrollback which sends error message
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalled();
            // Check that the error was logged
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle restoration errors and still mark as restored', async () => {
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue(null);
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-error',
                scrollbackContent: ['line1'],
            }, mockCoordinator);
            // Should send error message
            (0, vitest_1.expect)(mockMessageQueue.enqueue).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'error',
            }));
            // Subsequent restoration should be skipped (marked as restored even on error)
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            await handler.handleMessage({
                command: 'restoreScrollback',
                terminalId: 'terminal-error',
                scrollbackContent: ['line2'],
            }, mockCoordinator);
            // Should not attempt to write (skipped as already "restored")
            (0, vitest_1.expect)(mockTerminal.write).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=ScrollbackMessageHandler.test.js.map