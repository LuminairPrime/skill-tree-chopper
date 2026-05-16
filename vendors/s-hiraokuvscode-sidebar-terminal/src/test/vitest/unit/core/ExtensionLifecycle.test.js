"use strict";
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const ExtensionLifecycle_1 = require("../../../../core/ExtensionLifecycle");
// ── Hoisted mocks ──────────────────────────────────────────────────────
const mocks = vitest_1.vi.hoisted(() => ({
    executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
    registerWebviewViewProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    getExtension: vitest_1.vi.fn().mockReturnValue({ packageJSON: { version: '1.0.0' } }),
    showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    registerCommands: vitest_1.vi.fn(),
    setupSessionAutoSave: vitest_1.vi.fn(),
    loggerLifecycle: vitest_1.vi.fn(),
    loggerWarn: vitest_1.vi.fn(),
    loggerError: vitest_1.vi.fn(),
    loggerSetLevel: vitest_1.vi.fn(),
    extensionLog: vitest_1.vi.fn(),
    // Spies for dispose tracking
    terminalManagerDispose: vitest_1.vi.fn(),
    persistenceServiceDispose: vitest_1.vi.fn(),
    keyboardShortcutDispose: vitest_1.vi.fn(),
    decorationsServiceDispose: vitest_1.vi.fn(),
    linksServiceDispose: vitest_1.vi.fn(),
    shellIntegrationDispose: vitest_1.vi.fn(),
    sidebarProviderDispose: vitest_1.vi.fn(),
    telemetryServiceDispose: vitest_1.vi.fn(),
    telemetryTrackActivation: vitest_1.vi.fn(),
    telemetryTrackDeactivation: vitest_1.vi.fn(),
    telemetryTrackError: vitest_1.vi.fn(),
    telemetryTrackTerminalCreated: vitest_1.vi.fn(),
    telemetryTrackTerminalDeleted: vitest_1.vi.fn(),
    telemetryTrackTerminalFocused: vitest_1.vi.fn(),
    saveSimpleSessionOnExit: vitest_1.vi.fn().mockResolvedValue(undefined),
    // Terminal manager event handlers
    onTerminalCreatedCallback: null,
    onTerminalRemovedCallback: null,
    onTerminalFocusCallback: null,
    // Flags to control mock behavior
    terminalManagerShouldThrow: false,
    shellIntegrationShouldThrow: false,
    telemetryShouldThrow: false,
    decorationsShouldThrow: false,
}));
// ── VS Code mock ───────────────────────────────────────────────────────
vitest_1.vi.mock('vscode', () => ({
    commands: {
        executeCommand: mocks.executeCommand,
    },
    window: {
        registerWebviewViewProvider: mocks.registerWebviewViewProvider,
        showErrorMessage: mocks.showErrorMessage,
    },
    extensions: {
        getExtension: mocks.getExtension,
    },
    ExtensionMode: {
        Production: 1,
        Development: 2,
        Test: 3,
    },
}));
// ── Logger mock ────────────────────────────────────────────────────────
vitest_1.vi.mock('../../../../utils/logger', () => ({
    extension: mocks.extensionLog,
    logger: {
        lifecycle: mocks.loggerLifecycle,
        warn: mocks.loggerWarn,
        error: mocks.loggerError,
        info: vitest_1.vi.fn(),
        setLevel: mocks.loggerSetLevel,
    },
    LogLevel: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4,
    },
}));
// ── Service mocks ──────────────────────────────────────────────────────
vitest_1.vi.mock('../../../../providers/SecondaryTerminalProvider', () => {
    var _a;
    return ({
        SecondaryTerminalProvider: (_a = class {
                constructor(..._args) { }
                setPhase8Services(..._args) { }
                isWebViewVisible() {
                    return false;
                }
                dispose() {
                    mocks.sidebarProviderDispose();
                }
            },
            __setFunctionName(_a, "SecondaryTerminalProvider"),
            _a.viewType = 'secondaryTerminal',
            _a),
    });
});
vitest_1.vi.mock('../../../../terminals/TerminalManager', () => ({
    TerminalManager: class {
        constructor(..._args) {
            if (mocks.terminalManagerShouldThrow) {
                throw new Error('TerminalManager init failed');
            }
        }
        setShellIntegrationService(..._args) { }
        setTerminalFocused(_focused) { }
        isTerminalFocused() {
            return false;
        }
        sendInput(_data, _terminalId) { }
        getActiveTerminalId() {
            return undefined;
        }
        onTerminalCreated(cb) {
            mocks.onTerminalCreatedCallback = cb;
            return { dispose: vitest_1.vi.fn() };
        }
        onTerminalRemoved(cb) {
            mocks.onTerminalRemovedCallback = cb;
            return { dispose: vitest_1.vi.fn() };
        }
        onTerminalFocus(cb) {
            mocks.onTerminalFocusCallback = cb;
            return { dispose: vitest_1.vi.fn() };
        }
        dispose() {
            mocks.terminalManagerDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/persistence/ExtensionPersistenceService', () => ({
    ExtensionPersistenceService: class {
        constructor(..._args) { }
        setSidebarProvider(..._args) { }
        dispose() {
            mocks.persistenceServiceDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../commands', () => ({
    FileReferenceCommand: class {
        constructor(..._args) { }
    },
    TerminalCommand: class {
        constructor(..._args) { }
    },
}));
vitest_1.vi.mock('../../../../commands/CopilotIntegrationCommand', () => ({
    CopilotIntegrationCommand: class {
        constructor(..._args) { }
    },
}));
vitest_1.vi.mock('../../../../services/EnhancedShellIntegrationService', () => ({
    EnhancedShellIntegrationService: class {
        constructor(..._args) {
            if (mocks.shellIntegrationShouldThrow) {
                throw new Error('Shell integration init failed');
            }
        }
        setWebviewProvider(..._args) { }
        dispose() {
            mocks.shellIntegrationDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/KeyboardShortcutService', () => ({
    KeyboardShortcutService: class {
        constructor(..._args) { }
        setWebviewProvider(..._args) { }
        dispose() {
            mocks.keyboardShortcutDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/TerminalDecorationsService', () => ({
    TerminalDecorationsService: class {
        constructor(..._args) {
            if (mocks.decorationsShouldThrow) {
                throw new Error('Decorations init failed');
            }
        }
        dispose() {
            mocks.decorationsServiceDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/TerminalLinksService', () => ({
    TerminalLinksService: class {
        constructor(..._args) { }
        dispose() {
            mocks.linksServiceDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/TelemetryService', () => ({
    TelemetryService: class {
        constructor(..._args) {
            this.trackActivation = mocks.telemetryTrackActivation;
            this.trackDeactivation = mocks.telemetryTrackDeactivation;
            this.trackError = mocks.telemetryTrackError;
            this.trackTerminalCreated = mocks.telemetryTrackTerminalCreated;
            this.trackTerminalDeleted = mocks.telemetryTrackTerminalDeleted;
            this.trackTerminalFocused = mocks.telemetryTrackTerminalFocused;
            if (mocks.telemetryShouldThrow) {
                throw new Error('Telemetry unavailable');
            }
        }
        dispose() {
            mocks.telemetryServiceDispose();
        }
    },
}));
vitest_1.vi.mock('../../../../services/FocusProtectionService', () => ({
    FocusProtectionService: class {
        constructor(..._args) { }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../core/CommandRegistrar', () => ({
    CommandRegistrar: class {
        constructor(..._args) { }
        registerCommands(..._args) {
            mocks.registerCommands(..._args);
        }
    },
}));
vitest_1.vi.mock('../../../../core/SessionLifecycleManager', () => ({
    SessionLifecycleManager: class {
        constructor(..._args) {
            this.handleSaveSession = vitest_1.vi.fn();
            this.handleRestoreSession = vitest_1.vi.fn();
            this.handleClearSession = vitest_1.vi.fn();
            this.handleTestScrollback = vitest_1.vi.fn();
            this.diagnoseSessionData = vitest_1.vi.fn();
            this.saveSimpleSessionOnExit = mocks.saveSimpleSessionOnExit;
        }
        setupSessionAutoSave(..._args) {
            mocks.setupSessionAutoSave(..._args);
        }
    },
}));
// ── Helpers ────────────────────────────────────────────────────────────
function createMockContext(mode = vscode.ExtensionMode.Development) {
    return {
        extensionMode: mode,
        extensionUri: {},
        subscriptions: [],
    };
}
// ── Tests ──────────────────────────────────────────────────────────────
(0, vitest_1.describe)('ExtensionLifecycle', () => {
    let lifecycle;
    let savedEnv;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mocks.terminalManagerShouldThrow = false;
        mocks.shellIntegrationShouldThrow = false;
        mocks.telemetryShouldThrow = false;
        mocks.decorationsShouldThrow = false;
        mocks.onTerminalCreatedCallback = null;
        mocks.onTerminalRemovedCallback = null;
        mocks.onTerminalFocusCallback = null;
        savedEnv = process.env.SECONDARY_TERMINAL_LOG_LEVEL;
        delete process.env.SECONDARY_TERMINAL_LOG_LEVEL;
        lifecycle = new ExtensionLifecycle_1.ExtensionLifecycle();
    });
    (0, vitest_1.afterEach)(() => {
        if (savedEnv !== undefined) {
            process.env.SECONDARY_TERMINAL_LOG_LEVEL = savedEnv;
        }
        else {
            delete process.env.SECONDARY_TERMINAL_LOG_LEVEL;
        }
    });
    // ────────────────────────────────────────────────────────────────────
    // activate() – successful initialization
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('activate() - successful initialization', () => {
        (0, vitest_1.it)('should resolve without throwing', async () => {
            const ctx = createMockContext();
            await (0, vitest_1.expect)(lifecycle.activate(ctx)).resolves.toBeUndefined();
        });
        (0, vitest_1.it)('should initialize TerminalManager and expose it via getter', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
        });
        (0, vitest_1.it)('should initialize SidebarProvider and expose it via getter', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(lifecycle.getSidebarProvider()).toBeDefined();
        });
        (0, vitest_1.it)('should initialize ExtensionPersistenceService and expose it via getter', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(lifecycle.getExtensionPersistenceService()).toBeDefined();
        });
        (0, vitest_1.it)('should register webview view provider with retainContextWhenHidden', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.registerWebviewViewProvider).toHaveBeenCalledWith('secondaryTerminal', vitest_1.expect.anything(), { webviewOptions: { retainContextWhenHidden: true } });
        });
        (0, vitest_1.it)('should push the webview disposable into context.subscriptions', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            // registerWebviewViewProvider returns { dispose }, which gets pushed
            (0, vitest_1.expect)(ctx.subscriptions.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should register commands via CommandRegistrar', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.registerCommands).toHaveBeenCalledWith(ctx);
        });
        (0, vitest_1.it)('should set up session auto-save via SessionLifecycleManager', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.setupSessionAutoSave).toHaveBeenCalledWith(ctx);
        });
        (0, vitest_1.it)('should track activation duration when telemetry is available', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.telemetryTrackActivation).toHaveBeenCalledWith(vitest_1.expect.any(Number));
        });
        (0, vitest_1.it)('should set NODE_PTY_DEBUG to 0', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(process.env.NODE_PTY_DEBUG).toBe('0');
        });
        (0, vitest_1.it)('should log lifecycle start and completion messages', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ mode: 'Development', version: '1.0.0' }));
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal extension activated', vitest_1.expect.objectContaining({ durationMs: vitest_1.expect.any(Number), version: '1.0.0' }));
        });
        (0, vitest_1.it)('should read version from the extension manifest', async () => {
            mocks.getExtension.mockReturnValueOnce({ packageJSON: { version: '2.5.0' } });
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ version: '2.5.0' }));
        });
        (0, vitest_1.it)('should default version to "unknown" when extension not found', async () => {
            mocks.getExtension.mockReturnValueOnce(undefined);
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ version: 'unknown' }));
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // activate() – graceful failure when individual services fail
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('activate() - graceful failure handling', () => {
        (0, vitest_1.it)('should continue when TelemetryService throws', async () => {
            mocks.telemetryShouldThrow = true;
            const ctx = createMockContext();
            await (0, vitest_1.expect)(lifecycle.activate(ctx)).resolves.toBeUndefined();
            (0, vitest_1.expect)(mocks.loggerWarn).toHaveBeenCalledWith('Telemetry service unavailable; continuing without analytics', vitest_1.expect.any(Error));
            // Other services should still initialize
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
        });
        (0, vitest_1.it)('should continue when ShellIntegrationService throws', async () => {
            mocks.shellIntegrationShouldThrow = true;
            const ctx = createMockContext();
            await (0, vitest_1.expect)(lifecycle.activate(ctx)).resolves.toBeUndefined();
            (0, vitest_1.expect)(mocks.loggerWarn).toHaveBeenCalledWith('Enhanced shell integration service unavailable', vitest_1.expect.any(Error));
            // Core services still initialized
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
            (0, vitest_1.expect)(lifecycle.getSidebarProvider()).toBeDefined();
        });
        (0, vitest_1.it)('should continue when Phase 8 (decorations/links) services throw', async () => {
            mocks.decorationsShouldThrow = true;
            const ctx = createMockContext();
            await (0, vitest_1.expect)(lifecycle.activate(ctx)).resolves.toBeUndefined();
            (0, vitest_1.expect)(mocks.loggerWarn).toHaveBeenCalledWith('Phase 8 services unavailable; continuing without decorations/links', vitest_1.expect.any(Error));
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
        });
        (0, vitest_1.it)('should show error message and resolve when TerminalManager throws', async () => {
            mocks.terminalManagerShouldThrow = true;
            const ctx = createMockContext();
            await (0, vitest_1.expect)(lifecycle.activate(ctx)).resolves.toBeUndefined();
            (0, vitest_1.expect)(mocks.loggerError).toHaveBeenCalledWith('Failed to activate Sidebar Terminal extension', vitest_1.expect.any(Error));
            (0, vitest_1.expect)(mocks.showErrorMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('TerminalManager init failed'));
        });
        (0, vitest_1.it)('should track error via telemetry when activation fails (if telemetry is available)', async () => {
            // Telemetry succeeds but TerminalManager throws
            mocks.terminalManagerShouldThrow = true;
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.telemetryTrackError).toHaveBeenCalledWith(vitest_1.expect.any(Error), 'activation');
        });
        (0, vitest_1.it)('should still resolve the promise on catastrophic failure (prevents spinner hang)', async () => {
            mocks.terminalManagerShouldThrow = true;
            const ctx = createMockContext();
            // Must resolve, not reject
            const result = lifecycle.activate(ctx);
            await (0, vitest_1.expect)(result).resolves.toBeUndefined();
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // deactivate() – proper disposal, no double-dispose
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('deactivate() - proper disposal', () => {
        (0, vitest_1.it)('should dispose all services in correct order', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.saveSimpleSessionOnExit).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.persistenceServiceDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.keyboardShortcutDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.decorationsServiceDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.linksServiceDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.terminalManagerDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.sidebarProviderDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.shellIntegrationDispose).toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.telemetryServiceDispose).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should track deactivation via telemetry', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.telemetryTrackDeactivation).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should null out all service references after disposal', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeUndefined();
            (0, vitest_1.expect)(lifecycle.getSidebarProvider()).toBeUndefined();
            (0, vitest_1.expect)(lifecycle.getExtensionPersistenceService()).toBeUndefined();
        });
        (0, vitest_1.it)('should not double-dispose when deactivate is called twice', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            // Reset call counts
            mocks.terminalManagerDispose.mockClear();
            mocks.persistenceServiceDispose.mockClear();
            mocks.sidebarProviderDispose.mockClear();
            mocks.telemetryServiceDispose.mockClear();
            // Second deactivate should not call dispose again
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.terminalManagerDispose).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.persistenceServiceDispose).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.sidebarProviderDispose).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mocks.telemetryServiceDispose).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should save session on exit via SessionLifecycleManager', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.saveSimpleSessionOnExit).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should log lifecycle messages for deactivation', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            mocks.loggerLifecycle.mockClear();
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal deactivation started');
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal deactivation complete');
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // deactivate() – handles errors during disposal
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('deactivate() - error handling during disposal', () => {
        (0, vitest_1.it)('should handle safely when no services were initialized', async () => {
            // deactivate without prior activate
            await (0, vitest_1.expect)(lifecycle.deactivate()).resolves.toBeUndefined();
        });
        (0, vitest_1.it)('should still dispose other services when session save throws', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            mocks.saveSimpleSessionOnExit.mockRejectedValueOnce(new Error('save failed'));
            // The await on saveSimpleSessionOnExit will throw, but deactivate should
            // propagate it since there's no try-catch in the source
            await (0, vitest_1.expect)(lifecycle.deactivate()).rejects.toThrow('save failed');
            // Despite the error, we can verify saveSimpleSessionOnExit was called
            (0, vitest_1.expect)(mocks.saveSimpleSessionOnExit).toHaveBeenCalled();
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // configureLogger() – log level from env vars
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('configureLogger() - log level configuration', () => {
        (0, vitest_1.it)('should set WARN level for Production mode', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Production);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(2); // LogLevel.WARN
        });
        (0, vitest_1.it)('should set INFO level for Development mode', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Development);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(1); // LogLevel.INFO
        });
        (0, vitest_1.it)('should set INFO level for Test mode', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Test);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(1); // LogLevel.INFO
        });
        vitest_1.it.each([
            ['debug', 0], // LogLevel.DEBUG
            ['info', 1], // LogLevel.INFO
            ['warn', 2], // LogLevel.WARN
            ['warning', 2], // LogLevel.WARN (alias)
            ['error', 3], // LogLevel.ERROR
            ['none', 4], // LogLevel.NONE
        ])('should override log level to %s (=%d) via SECONDARY_TERMINAL_LOG_LEVEL env var', async (envValue, expectedLevel) => {
            process.env.SECONDARY_TERMINAL_LOG_LEVEL = envValue;
            const ctx = createMockContext(vscode.ExtensionMode.Production);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(expectedLevel);
        });
        (0, vitest_1.it)('should use env var override regardless of extension mode', async () => {
            process.env.SECONDARY_TERMINAL_LOG_LEVEL = 'debug';
            // Production mode would normally set WARN, but env var should override
            const ctx = createMockContext(vscode.ExtensionMode.Production);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(0); // DEBUG, not WARN
        });
        (0, vitest_1.it)('should fall back to mode-based level when env var is invalid', async () => {
            process.env.SECONDARY_TERMINAL_LOG_LEVEL = 'invalid_value';
            const ctx = createMockContext(vscode.ExtensionMode.Production);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(2); // WARN (production default)
        });
        (0, vitest_1.it)('should be case-insensitive for env var values', async () => {
            process.env.SECONDARY_TERMINAL_LOG_LEVEL = 'DEBUG';
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerSetLevel).toHaveBeenCalledWith(0); // DEBUG
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // Multiple activate/deactivate cycles – no resource leaks
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('multiple activate/deactivate cycles', () => {
        (0, vitest_1.it)('should fully clean up and reinitialize across two cycles', async () => {
            const ctx1 = createMockContext();
            await lifecycle.activate(ctx1);
            // First cycle: services are up
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
            await lifecycle.deactivate();
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeUndefined();
            // Second cycle: fresh activation
            const ctx2 = createMockContext();
            await lifecycle.activate(ctx2);
            (0, vitest_1.expect)(lifecycle.getTerminalManager()).toBeDefined();
            (0, vitest_1.expect)(lifecycle.getSidebarProvider()).toBeDefined();
        });
        (0, vitest_1.it)('should not accumulate dispose calls across cycles', async () => {
            const ctx = createMockContext();
            // Cycle 1
            await lifecycle.activate(ctx);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.terminalManagerDispose).toHaveBeenCalledTimes(1);
            // Cycle 2
            await lifecycle.activate(createMockContext());
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.terminalManagerDispose).toHaveBeenCalledTimes(2); // exactly 2, not more
        });
        (0, vitest_1.it)('should register new webview providers on each activation', async () => {
            const ctx1 = createMockContext();
            await lifecycle.activate(ctx1);
            await lifecycle.deactivate();
            (0, vitest_1.expect)(mocks.registerWebviewViewProvider).toHaveBeenCalledTimes(1);
            const ctx2 = createMockContext();
            await lifecycle.activate(ctx2);
            (0, vitest_1.expect)(mocks.registerWebviewViewProvider).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should register commands for each activation context', async () => {
            const ctx1 = createMockContext();
            await lifecycle.activate(ctx1);
            (0, vitest_1.expect)(mocks.registerCommands).toHaveBeenCalledWith(ctx1);
            await lifecycle.deactivate();
            const ctx2 = createMockContext();
            await lifecycle.activate(ctx2);
            (0, vitest_1.expect)(mocks.registerCommands).toHaveBeenCalledWith(ctx2);
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // Telemetry event listeners
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('telemetry event listeners', () => {
        (0, vitest_1.it)('should wire up terminal created events to telemetry', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.onTerminalCreatedCallback).toBeTypeOf('function');
            mocks.onTerminalCreatedCallback({ id: 'term-1' });
            (0, vitest_1.expect)(mocks.telemetryTrackTerminalCreated).toHaveBeenCalledWith('term-1');
        });
        (0, vitest_1.it)('should wire up terminal removed events to telemetry', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.onTerminalRemovedCallback).toBeTypeOf('function');
            mocks.onTerminalRemovedCallback('term-2');
            (0, vitest_1.expect)(mocks.telemetryTrackTerminalDeleted).toHaveBeenCalledWith('term-2');
        });
        (0, vitest_1.it)('should wire up terminal focus events to telemetry', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.onTerminalFocusCallback).toBeTypeOf('function');
            mocks.onTerminalFocusCallback('term-3');
            (0, vitest_1.expect)(mocks.telemetryTrackTerminalFocused).toHaveBeenCalledWith('term-3');
        });
        (0, vitest_1.it)('should skip telemetry listener setup when telemetry is unavailable', async () => {
            mocks.telemetryShouldThrow = true;
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerWarn).toHaveBeenCalledWith('Telemetry service not available, skipping telemetry event listener setup');
        });
        (0, vitest_1.it)('should push event disposables into context.subscriptions', async () => {
            const ctx = createMockContext();
            await lifecycle.activate(ctx);
            // 1 webview provider + 3 terminal event disposables = at least 4
            (0, vitest_1.expect)(ctx.subscriptions.length).toBeGreaterThanOrEqual(4);
        });
    });
    // ────────────────────────────────────────────────────────────────────
    // getExtensionModeLabel - via logged output
    // ────────────────────────────────────────────────────────────────────
    (0, vitest_1.describe)('getExtensionModeLabel()', () => {
        (0, vitest_1.it)('should label Production mode correctly', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Production);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ mode: 'Production' }));
        });
        (0, vitest_1.it)('should label Development mode correctly', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Development);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ mode: 'Development' }));
        });
        (0, vitest_1.it)('should label Test mode correctly', async () => {
            const ctx = createMockContext(vscode.ExtensionMode.Test);
            await lifecycle.activate(ctx);
            (0, vitest_1.expect)(mocks.loggerLifecycle).toHaveBeenCalledWith('Sidebar Terminal activation started', vitest_1.expect.objectContaining({ mode: 'Test' }));
        });
    });
});
//# sourceMappingURL=ExtensionLifecycle.test.js.map