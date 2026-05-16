"use strict";
/**
 * SessionRestoreManager Unit Tests
 *
 * Tests for terminal session restoration including:
 * - Restoration state management
 * - Duplicate restoration prevention
 * - Scrollback data restoration
 * - Error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SessionRestoreManager_1 = require("../../../../../webview/managers/SessionRestoreManager");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
// Mock TerminalCreationService
vitest_1.vi.mock('../../../../../webview/services/TerminalCreationService', () => ({
    TerminalCreationService: {
        isTerminalRestoring: vitest_1.vi.fn().mockReturnValue(false),
        markTerminalRestoring: vitest_1.vi.fn(),
        markTerminalRestored: vitest_1.vi.fn(),
        clearTerminalRestorationState: vitest_1.vi.fn(),
        clearAllRestorationState: vitest_1.vi.fn(),
    },
}));
// Helper to create mock terminal
function createMockTerminal() {
    return {
        clear: vitest_1.vi.fn(),
        writeln: vitest_1.vi.fn(),
        focus: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    };
}
// Helper to create mock terminal instance
function createMockTerminalInstance(terminal) {
    // @ts-expect-error - test mock type
    return {
        terminal: terminal ?? createMockTerminal(),
        fitAddon: null,
        container: document.createElement('div'),
    };
}
// Helper to create mock callbacks
function createMockCallbacks(overrides = {}) {
    return {
        getTerminalInstance: vitest_1.vi.fn().mockReturnValue(undefined),
        createTerminal: vitest_1.vi.fn().mockResolvedValue(createMockTerminal()),
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
        ...overrides,
    };
}
(0, vitest_1.describe)('SessionRestoreManager', () => {
    let manager;
    let mockCallbacks;
    let TerminalCreationService;
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.useFakeTimers();
        const terminalCreationModule = await Promise.resolve().then(() => require('../../../../../webview/services/TerminalCreationService'));
        TerminalCreationService = terminalCreationModule.TerminalCreationService;
        vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockReturnValue(false);
        vitest_1.vi.mocked(TerminalCreationService.markTerminalRestoring).mockClear();
        vitest_1.vi.mocked(TerminalCreationService.markTerminalRestored).mockClear();
        mockCallbacks = createMockCallbacks();
        manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.describe)('Constructor', () => {
        (0, vitest_1.it)('should create instance with callbacks', () => {
            (0, vitest_1.expect)(manager).toBeDefined();
        });
        (0, vitest_1.it)('should start with isRestoringSession as false', () => {
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(false);
        });
    });
    (0, vitest_1.describe)('isRestoringSession / setRestoringSession', () => {
        (0, vitest_1.it)('should return false initially', () => {
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(false);
        });
        (0, vitest_1.it)('should set restoring session flag to true', () => {
            manager.setRestoringSession(true);
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(true);
        });
        (0, vitest_1.it)('should set restoring session flag to false', () => {
            manager.setRestoringSession(true);
            manager.setRestoringSession(false);
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(false);
        });
    });
    (0, vitest_1.describe)('isTerminalRestored', () => {
        (0, vitest_1.it)('should return false for non-restored terminal', () => {
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(false);
        });
        (0, vitest_1.it)('should return true after terminal is restored', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1', 'line2'],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(true);
        });
        (0, vitest_1.it)('should return true if TerminalCreationService reports terminal as restoring', () => {
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockReturnValue(true);
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(true);
        });
    });
    (0, vitest_1.describe)('restoreSession', () => {
        (0, vitest_1.it)('should skip restoration for already restored terminal', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            // First restore
            const firstRestorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await firstRestorePromise;
            // Second restore attempt
            const result = await manager.restoreSession(sessionData);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.reason).toBe('already_restored');
            (0, vitest_1.expect)(result.linesRestored).toBe(0);
        });
        (0, vitest_1.it)('should skip restoration if TerminalCreationService reports as restoring', async () => {
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockReturnValue(true);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const result = await manager.restoreSession(sessionData);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.reason).toBe('already_restored');
        });
        (0, vitest_1.it)('should create terminal if it does not exist', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi
                    .fn()
                    .mockReturnValueOnce(undefined) // First call: terminal doesn't exist
                    .mockReturnValue(mockInstance), // After creation: terminal exists
                createTerminal: vitest_1.vi.fn().mockResolvedValue(mockTerminal),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'New Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(mockCallbacks.createTerminal).toHaveBeenCalledWith('terminal-1', 'New Terminal');
        });
        (0, vitest_1.it)('should fail if terminal creation fails', async () => {
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(undefined),
                createTerminal: vitest_1.vi.fn().mockResolvedValue(null),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe('terminal_creation_failed');
        });
        (0, vitest_1.it)('should fail if terminal instance not available after creation', async () => {
            const mockTerminal = createMockTerminal();
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(undefined), // Always undefined
                createTerminal: vitest_1.vi.fn().mockResolvedValue(mockTerminal),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe('terminal_not_available');
        });
        (0, vitest_1.it)('should restore scrollback data', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1', 'line2', 'line3'],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.linesRestored).toBe(3);
            (0, vitest_1.expect)(mockTerminal.clear).toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledTimes(3);
        });
        (0, vitest_1.it)('should skip empty lines in scrollback data', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1', '   ', 'line3', ''],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.linesRestored).toBe(2); // Only non-empty lines
        });
        (0, vitest_1.it)('should restore session restore message', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                sessionRestoreMessage: '--- Session Restored ---',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(mockTerminal.writeln).toHaveBeenCalledWith('--- Session Restored ---');
        });
        (0, vitest_1.it)('should not clear terminal if no scrollback data', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: [],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(mockTerminal.clear).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should focus terminal if it is the active one', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
                getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(mockTerminal.focus).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not focus terminal if it is not the active one', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
                getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-2'),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(mockTerminal.focus).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should mark terminal as restoring during restore', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(TerminalCreationService.markTerminalRestoring).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should mark terminal as restored after restore', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(TerminalCreationService.markTerminalRestored).toHaveBeenCalledWith('terminal-1');
        });
        (0, vitest_1.it)('should handle errors gracefully', async () => {
            const mockTerminal = createMockTerminal();
            vitest_1.vi.mocked(mockTerminal.clear).mockImplementation(() => {
                throw new Error('Clear failed');
            });
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1'],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe('Clear failed');
            (0, vitest_1.expect)(TerminalCreationService.markTerminalRestored).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle non-Error exceptions', async () => {
            const mockTerminal = createMockTerminal();
            vitest_1.vi.mocked(mockTerminal.clear).mockImplementation(() => {
                throw 'String error';
            });
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1'],
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe('unknown_error');
        });
    });
    (0, vitest_1.describe)('clearRestorationState', () => {
        (0, vitest_1.it)('should clear restoration state for terminal', async () => {
            let isRestoring = false;
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockImplementation(() => isRestoring);
            vitest_1.vi.mocked(TerminalCreationService.markTerminalRestoring).mockImplementation(() => {
                isRestoring = true;
            });
            vitest_1.vi.mocked(TerminalCreationService.clearTerminalRestorationState).mockImplementation(() => {
                isRestoring = false;
            });
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            // Given: a terminal that has been restored and is still flagged as restoring
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(true);
            (0, vitest_1.expect)(isRestoring).toBe(true);
            // When: clearRestorationState removes both the processed request and restoration flag
            manager.clearRestorationState('terminal-1');
            // Then: isTerminalRestored reflects that both restoration guards were cleared
            (0, vitest_1.expect)(isRestoring).toBe(false);
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(false);
        });
        (0, vitest_1.it)('should handle clearing non-existent terminal state', () => {
            (0, vitest_1.expect)(() => manager.clearRestorationState('non-existent')).not.toThrow();
        });
        (0, vitest_1.it)('should allow re-restoration after clearRestorationState with recycled ID', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            // First terminal with ID "1" is restored
            const sessionData = {
                terminalId: '1',
                terminalName: 'Terminal 1',
                scrollbackData: ['old-line'],
            };
            const firstRestore = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await firstRestore;
            (0, vitest_1.expect)(manager.isTerminalRestored('1')).toBe(true);
            // Terminal is deleted, state cleared
            manager.clearRestorationState('1');
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockReturnValue(false);
            (0, vitest_1.expect)(manager.isTerminalRestored('1')).toBe(false);
            // New terminal with recycled ID "1" should be restorable
            const newSessionData = {
                terminalId: '1',
                terminalName: 'New Terminal 1',
                scrollbackData: ['new-line'],
            };
            const secondRestore = manager.restoreSession(newSessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await secondRestore;
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.linesRestored).toBe(1);
            (0, vitest_1.expect)(result.reason).toBeUndefined(); // Not 'already_restored'
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear all processed requests', async () => {
            let isRestoring = false;
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockImplementation(() => isRestoring);
            vitest_1.vi.mocked(TerminalCreationService.markTerminalRestoring).mockImplementation(() => {
                isRestoring = true;
            });
            vitest_1.vi.mocked(TerminalCreationService.clearAllRestorationState).mockImplementation(() => {
                isRestoring = false;
            });
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            // Given: a restored terminal that still has restoration state tracked
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            await restorePromise;
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(true);
            (0, vitest_1.expect)(isRestoring).toBe(true);
            // When: dispose clears manager and shared restoration state
            manager.dispose();
            // Then: isTerminalRestored reports that restoration state is fully gone
            (0, vitest_1.expect)(isRestoring).toBe(false);
            (0, vitest_1.expect)(manager.isTerminalRestored('terminal-1')).toBe(false);
        });
        (0, vitest_1.it)('should reset isRestoringSession flag', () => {
            manager.setRestoringSession(true);
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(true);
            manager.dispose();
            (0, vitest_1.expect)(manager.isRestoringSession()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Concurrent Restoration Prevention', () => {
        (0, vitest_1.it)('should prevent concurrent restoration of same terminal', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: ['line1'],
            };
            // Start first restoration
            const firstRestore = manager.restoreSession(sessionData);
            // Mark as restoring after first call
            vitest_1.vi.mocked(TerminalCreationService.isTerminalRestoring).mockReturnValue(true);
            // Attempt second restoration immediately
            const secondRestore = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const [firstResult, secondResult] = await Promise.all([firstRestore, secondRestore]);
            // First should succeed, second should be skipped
            (0, vitest_1.expect)(firstResult.success).toBe(true);
            (0, vitest_1.expect)(secondResult.success).toBe(true);
            (0, vitest_1.expect)(secondResult.reason).toBe('already_restored');
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle terminal instance with null terminal', async () => {
            const mockInstance = {
                terminal: null,
                fitAddon: null,
                container: document.createElement('div'),
            };
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe('terminal_not_available');
        });
        (0, vitest_1.it)('should handle undefined scrollbackData', async () => {
            const mockTerminal = createMockTerminal();
            const mockInstance = createMockTerminalInstance(mockTerminal);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockReturnValue(mockInstance),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData = {
                terminalId: 'terminal-1',
                terminalName: 'Test Terminal',
                scrollbackData: undefined,
            };
            const restorePromise = manager.restoreSession(sessionData);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const result = await restorePromise;
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.linesRestored).toBe(0);
            (0, vitest_1.expect)(mockTerminal.clear).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle multiple terminals independently', async () => {
            const mockTerminal1 = createMockTerminal();
            const mockTerminal2 = createMockTerminal();
            const mockInstance1 = createMockTerminalInstance(mockTerminal1);
            const mockInstance2 = createMockTerminalInstance(mockTerminal2);
            mockCallbacks = createMockCallbacks({
                getTerminalInstance: vitest_1.vi.fn().mockImplementation((id) => {
                    if (id === 'terminal-1')
                        return mockInstance1;
                    if (id === 'terminal-2')
                        return mockInstance2;
                    return undefined;
                }),
            });
            manager = new SessionRestoreManager_1.SessionRestoreManager(mockCallbacks);
            const sessionData1 = {
                terminalId: 'terminal-1',
                terminalName: 'Terminal 1',
                scrollbackData: ['line1'],
            };
            const sessionData2 = {
                terminalId: 'terminal-2',
                terminalName: 'Terminal 2',
                scrollbackData: ['line2'],
            };
            const restore1Promise = manager.restoreSession(sessionData1);
            const restore2Promise = manager.restoreSession(sessionData2);
            await vitest_1.vi.advanceTimersByTimeAsync(200);
            const [result1, result2] = await Promise.all([restore1Promise, restore2Promise]);
            (0, vitest_1.expect)(result1.success).toBe(true);
            (0, vitest_1.expect)(result2.success).toBe(true);
            (0, vitest_1.expect)(mockTerminal1.writeln).toHaveBeenCalledWith('line1');
            (0, vitest_1.expect)(mockTerminal2.writeln).toHaveBeenCalledWith('line2');
        });
    });
});
//# sourceMappingURL=SessionRestoreManager.test.js.map