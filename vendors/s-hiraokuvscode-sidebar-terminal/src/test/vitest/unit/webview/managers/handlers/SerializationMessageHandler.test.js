"use strict";
/**
 * SerializationMessageHandler Unit Tests
 *
 * Tests for terminal state serialization and restoration
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SerializationMessageHandler_1 = require("../../../../../../webview/managers/handlers/SerializationMessageHandler");
(0, vitest_1.describe)('SerializationMessageHandler', () => {
    let handler;
    let mockLogger;
    let mockCoordinator;
    // Mock terminal with buffer
    const createMockTerminal = (lines = []) => {
        const mockBuffer = {
            active: {
                length: lines.length,
                getLine: vitest_1.vi.fn((i) => {
                    if (i >= 0 && i < lines.length) {
                        return {
                            translateToString: vitest_1.vi.fn(() => lines[i] ?? ''),
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
        };
    };
    // Mock SerializeAddon
    const createMockSerializeAddon = (content) => ({
        serialize: vitest_1.vi.fn(() => content),
    });
    (0, vitest_1.beforeEach)(() => {
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
            getManagers: vitest_1.vi.fn(() => ({
                notification: {
                    showNotificationInTerminal: vitest_1.vi.fn(),
                },
            })),
        };
        // Create handler
        handler = new SerializationMessageHandler_1.SerializationMessageHandler(mockLogger);
    });
    (0, vitest_1.afterEach)(() => {
        handler.dispose();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('getSupportedCommands', () => {
        (0, vitest_1.it)('should return all supported command types', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toContain('serializeTerminal');
            (0, vitest_1.expect)(commands).toContain('restoreSerializedContent');
            (0, vitest_1.expect)(commands).toContain('requestTerminalSerialization');
            (0, vitest_1.expect)(commands).toContain('restoreTerminalSerialization');
            (0, vitest_1.expect)(commands).toContain('terminalRestoreInfo');
            (0, vitest_1.expect)(commands).toContain('saveAllTerminalSessions');
            (0, vitest_1.expect)(commands).toHaveLength(6);
        });
    });
    (0, vitest_1.describe)('handleMessage', () => {
        (0, vitest_1.it)('should warn when message has no command property', async () => {
            await handler.handleMessage({}, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith('Message received without command property');
        });
        (0, vitest_1.it)('should warn for unknown commands', async () => {
            await handler.handleMessage({ command: 'unknownCommand' }, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith('Unknown serialization command: unknownCommand');
        });
        (0, vitest_1.it)('should dispatch to correct handler for known commands', async () => {
            const msg = {
                command: 'terminalRestoreInfo',
                terminals: [],
                activeTerminalId: null,
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalledWith('Terminal restore info received');
        });
    });
    (0, vitest_1.describe)('serializeTerminal', () => {
        (0, vitest_1.it)('should send error when no terminalId provided', async () => {
            const msg = {
                command: 'serializeTerminal',
                requestId: 'req-1',
                messageId: 'msg-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationResponse',
                error: 'missing-terminal-id',
            }));
        });
        (0, vitest_1.it)('should process single terminalId', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2']);
            const mockSerializeAddon = createMockSerializeAddon('line1\nline2');
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(mockSerializeAddon);
            const msg = {
                command: 'serializeTerminal',
                terminalId: 'terminal-1',
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationResponse',
                serializationData: vitest_1.expect.objectContaining({
                    'terminal-1': vitest_1.expect.any(String),
                }),
            }));
        });
        (0, vitest_1.it)('should process multiple terminalIds array', async () => {
            const mockTerminal = createMockTerminal(['content']);
            const mockSerializeAddon = createMockSerializeAddon('content');
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(mockSerializeAddon);
            const msg = {
                command: 'serializeTerminal',
                terminalIds: ['terminal-1', 'terminal-2'],
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(mockCoordinator.getTerminalInstance).toHaveBeenCalledWith('terminal-2');
        });
    });
    (0, vitest_1.describe)('requestTerminalSerialization', () => {
        (0, vitest_1.it)('should send error when no terminalIds provided', async () => {
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: [],
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationResponse',
                error: 'no-terminal-ids',
            }));
        });
        (0, vitest_1.it)('should use SerializeAddon when available', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2', 'line3']);
            const mockSerializeAddon = createMockSerializeAddon('serialized-content');
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(mockSerializeAddon);
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: ['terminal-1'],
                scrollbackLines: 1000,
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockSerializeAddon.serialize).toHaveBeenCalled();
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationResponse',
                serializationData: {
                    'terminal-1': 'serialized-content',
                },
            }));
        });
        (0, vitest_1.it)('should fallback to buffer when SerializeAddon unavailable', async () => {
            const mockTerminal = createMockTerminal(['line1', 'line2']);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(null);
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: ['terminal-1'],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SerializeAddon not available'));
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                serializationData: {
                    'terminal-1': 'line1\nline2',
                },
            }));
        });
        (0, vitest_1.it)('should warn when terminal not found', async () => {
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue(null);
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: ['nonexistent'],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith('Terminal nonexistent not found for serialization');
        });
        (0, vitest_1.it)('should respect scrollbackLines limit', async () => {
            const lines = Array.from({ length: 100 }, (_, i) => `line${i}`);
            const mockTerminal = createMockTerminal(lines);
            const mockSerializeAddon = createMockSerializeAddon(lines.join('\n'));
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            vitest_1.vi.mocked(mockCoordinator.getSerializeAddon).mockReturnValue(mockSerializeAddon);
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: ['terminal-1'],
                scrollbackLines: 10,
            };
            await handler.handleMessage(msg, mockCoordinator);
            // The handler should slice to last 10 lines
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                serializationData: vitest_1.expect.objectContaining({
                    'terminal-1': vitest_1.expect.any(String),
                }),
            }));
        });
        (0, vitest_1.it)('should handle serialization errors gracefully', async () => {
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockImplementation(() => {
                throw new Error('Test serialization error');
            });
            const msg = {
                command: 'requestTerminalSerialization',
                terminalIds: ['terminal-1'],
            };
            await handler.handleMessage(msg, mockCoordinator);
            // Errors inside forEach are logged but don't cause global error response
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Error serializing terminal terminal-1'), vitest_1.expect.any(Error));
            // Response is still sent with empty data
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationResponse',
                serializationData: {},
            }));
        });
    });
    (0, vitest_1.describe)('restoreSerializedContent', () => {
        (0, vitest_1.it)('should send error when no terminalId provided', async () => {
            const msg = {
                command: 'restoreSerializedContent',
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith('Restore serialized content request missing terminalId');
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationRestoreResponse',
                error: 'missing-terminal-id',
            }));
        });
        (0, vitest_1.it)('should set active terminal when isActive is true', async () => {
            const mockTerminal = createMockTerminal([]);
            // Mock coordinator with restoreSession
            const coordWithRestore = {
                ...mockCoordinator,
                restoreSession: vitest_1.vi.fn().mockResolvedValue(true),
            };
            vitest_1.vi.mocked(coordWithRestore.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            const msg = {
                command: 'restoreSerializedContent',
                terminalId: 'terminal-1',
                scrollbackData: ['line1', 'line2'],
                isActive: true,
            };
            await handler.handleMessage(msg, coordWithRestore);
            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 50));
            (0, vitest_1.expect)(coordWithRestore.setActiveTerminalId).toHaveBeenCalledWith('terminal-1');
        });
    });
    (0, vitest_1.describe)('restoreTerminalSerialization', () => {
        (0, vitest_1.it)('should restore terminals with serialized content', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            const msg = {
                command: 'restoreTerminalSerialization',
                terminalData: [{ id: 'terminal-1', serializedContent: 'line1\nline2', isActive: false }],
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationRestoreResponse',
                restoredCount: 1,
                totalCount: 1,
            }));
        });
        (0, vitest_1.it)('should set active terminal when isActive is true', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            const msg = {
                command: 'restoreTerminalSerialization',
                terminalData: [{ id: 'terminal-1', serializedContent: 'content', isActive: true }],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.setActiveTerminalId).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should skip terminals without content', async () => {
            const mockTerminal = createMockTerminal([]);
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: mockTerminal,
            });
            const msg = {
                command: 'restoreTerminalSerialization',
                terminalData: [
                    { id: 'terminal-1', serializedContent: '', isActive: false },
                    { id: 'terminal-2', serializedContent: 'content', isActive: false },
                ],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                restoredCount: 1,
                totalCount: 2,
            }));
        });
        (0, vitest_1.it)('should handle missing terminal instances', async () => {
            // @ts-expect-error - test mock type
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue(null);
            const msg = {
                command: 'restoreTerminalSerialization',
                terminalData: [{ id: 'terminal-1', serializedContent: 'content', isActive: false }],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockLogger.warn).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Terminal terminal-1 not found for restoration'));
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                restoredCount: 0,
                totalCount: 1,
            }));
        });
        (0, vitest_1.it)('should handle restoration errors gracefully', async () => {
            vitest_1.vi.mocked(mockCoordinator.getTerminalInstance).mockImplementation(() => {
                throw new Error('Restoration error');
            });
            const msg = {
                command: 'restoreTerminalSerialization',
                terminalData: [{ id: 'terminal-1', serializedContent: 'content', isActive: false }],
            };
            await handler.handleMessage(msg, mockCoordinator);
            // Errors inside forEach are logged but restoration count is still tracked
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Error restoring terminal terminal-1'), vitest_1.expect.any(Error));
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'terminalSerializationRestoreResponse',
                restoredCount: 0,
                totalCount: 1,
            }));
        });
    });
    (0, vitest_1.describe)('terminalRestoreInfo', () => {
        (0, vitest_1.it)('should cache terminal restore info', async () => {
            const msg = {
                command: 'terminalRestoreInfo',
                terminals: [{ id: 'terminal-1', name: 'Test' }],
                activeTerminalId: 'terminal-1',
                config: { theme: 'dark' },
            };
            await handler.handleMessage(msg, mockCoordinator);
            const cached = handler.getCachedTerminalRestoreInfo();
            (0, vitest_1.expect)(cached).not.toBeNull();
            (0, vitest_1.expect)(cached?.terminals).toHaveLength(1);
            (0, vitest_1.expect)(cached?.activeTerminalId).toBe('terminal-1');
            (0, vitest_1.expect)(cached?.config).toEqual({ theme: 'dark' });
            (0, vitest_1.expect)(cached?.timestamp).toBeDefined();
        });
        (0, vitest_1.it)('should handle missing terminals array', async () => {
            const msg = {
                command: 'terminalRestoreInfo',
                activeTerminalId: 'terminal-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            const cached = handler.getCachedTerminalRestoreInfo();
            (0, vitest_1.expect)(cached?.terminals).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('saveAllTerminalSessions', () => {
        (0, vitest_1.it)('should send error when persistence manager unavailable', async () => {
            const msg = {
                command: 'saveAllTerminalSessions',
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'saveAllTerminalSessionsResponse',
                success: false,
                error: 'persistence-manager-unavailable',
            }));
        });
        (0, vitest_1.it)('should save all terminal sessions', async () => {
            const mockPersistenceManager = {
                getAvailableTerminals: vitest_1.vi.fn().mockReturnValue(['terminal-1', 'terminal-2']),
                saveTerminalContent: vitest_1.vi.fn(),
            };
            const coordWithPersistence = {
                ...mockCoordinator,
                persistenceManager: mockPersistenceManager,
            };
            const msg = {
                command: 'saveAllTerminalSessions',
                requestId: 'req-1',
            };
            await handler.handleMessage(msg, coordWithPersistence);
            (0, vitest_1.expect)(mockPersistenceManager.saveTerminalContent).toHaveBeenCalledWith('terminal-1');
            (0, vitest_1.expect)(mockPersistenceManager.saveTerminalContent).toHaveBeenCalledWith('terminal-2');
            (0, vitest_1.expect)(coordWithPersistence.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'saveAllTerminalSessionsResponse',
                success: true,
                savedTerminals: 2,
            }));
        });
        (0, vitest_1.it)('should show notification after save', async () => {
            const mockNotificationManager = {
                showNotificationInTerminal: vitest_1.vi.fn(),
            };
            const mockPersistenceManager = {
                getAvailableTerminals: vitest_1.vi.fn().mockReturnValue(['terminal-1']),
                saveTerminalContent: vitest_1.vi.fn(),
            };
            const coordWithManagers = {
                ...mockCoordinator,
                persistenceManager: mockPersistenceManager,
                getManagers: vitest_1.vi.fn(() => ({
                    notification: mockNotificationManager,
                })),
            };
            const msg = {
                command: 'saveAllTerminalSessions',
            };
            await handler.handleMessage(msg, coordWithManagers);
            (0, vitest_1.expect)(mockNotificationManager.showNotificationInTerminal).toHaveBeenCalledWith('Saved 1 terminal session', 'success');
        });
        (0, vitest_1.it)('should handle save errors for individual terminals', async () => {
            const mockPersistenceManager = {
                getAvailableTerminals: vitest_1.vi.fn().mockReturnValue(['terminal-1', 'terminal-2']),
                saveTerminalContent: vitest_1.vi.fn().mockImplementation((id) => {
                    if (id === 'terminal-1') {
                        throw new Error('Save error');
                    }
                }),
            };
            const coordWithPersistence = {
                ...mockCoordinator,
                persistenceManager: mockPersistenceManager,
            };
            const msg = {
                command: 'saveAllTerminalSessions',
            };
            await handler.handleMessage(msg, coordWithPersistence);
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Failed to save session for terminal terminal-1'), vitest_1.expect.any(Error));
            // Should still succeed overall
            (0, vitest_1.expect)(coordWithPersistence.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                success: true,
            }));
        });
    });
    (0, vitest_1.describe)('getCachedTerminalRestoreInfo', () => {
        (0, vitest_1.it)('should return null when no info cached', () => {
            (0, vitest_1.expect)(handler.getCachedTerminalRestoreInfo()).toBeNull();
        });
        (0, vitest_1.it)('should return cached info after terminalRestoreInfo message', async () => {
            const msg = {
                command: 'terminalRestoreInfo',
                terminals: [{ id: 'test' }],
                activeTerminalId: 'test',
            };
            await handler.handleMessage(msg, mockCoordinator);
            const cached = handler.getCachedTerminalRestoreInfo();
            (0, vitest_1.expect)(cached).not.toBeNull();
            (0, vitest_1.expect)(cached?.terminals).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear cached info on dispose', async () => {
            const msg = {
                command: 'terminalRestoreInfo',
                terminals: [{ id: 'test' }],
            };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(handler.getCachedTerminalRestoreInfo()).not.toBeNull();
            handler.dispose();
            (0, vitest_1.expect)(handler.getCachedTerminalRestoreInfo()).toBeNull();
        });
        (0, vitest_1.it)('should clear handlers registry on dispose', () => {
            handler.dispose();
            (0, vitest_1.expect)(handler.getSupportedCommands()).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=SerializationMessageHandler.test.js.map