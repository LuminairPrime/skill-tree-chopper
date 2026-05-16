"use strict";
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const ExtensionLifecycle_1 = require("../../../../core/ExtensionLifecycle");
const mocks = vitest_1.vi.hoisted(() => ({
    executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
    registerWebviewViewProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    getExtension: vitest_1.vi.fn().mockReturnValue({ packageJSON: { version: '0.2.23' } }),
    registerCommands: vitest_1.vi.fn(),
    setupSessionAutoSave: vitest_1.vi.fn(),
    loggerLifecycle: vitest_1.vi.fn(),
    loggerWarn: vitest_1.vi.fn(),
    loggerError: vitest_1.vi.fn(),
    loggerSetLevel: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('vscode', () => ({
    commands: {
        executeCommand: mocks.executeCommand,
    },
    window: {
        registerWebviewViewProvider: mocks.registerWebviewViewProvider,
        showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
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
vitest_1.vi.mock('../../../../utils/logger', () => ({
    extension: vitest_1.vi.fn(),
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
vitest_1.vi.mock('../../../../providers/SecondaryTerminalProvider', () => {
    var _a;
    return ({
        SecondaryTerminalProvider: (_a = class {
                constructor(..._args) { }
                setPhase8Services(..._args) { }
                dispose() { }
            },
            __setFunctionName(_a, "SecondaryTerminalProvider"),
            _a.viewType = 'secondaryTerminal',
            _a),
    });
});
vitest_1.vi.mock('../../../../terminals/TerminalManager', () => ({
    TerminalManager: class {
        constructor(..._args) { }
        setShellIntegrationService(..._args) { }
        onTerminalCreated() {
            return { dispose: vitest_1.vi.fn() };
        }
        onTerminalRemoved() {
            return { dispose: vitest_1.vi.fn() };
        }
        onTerminalFocus() {
            return { dispose: vitest_1.vi.fn() };
        }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../services/persistence/ExtensionPersistenceService', () => ({
    ExtensionPersistenceService: class {
        constructor(..._args) { }
        setSidebarProvider(..._args) { }
        dispose() { }
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
        constructor(..._args) { }
        setWebviewProvider(..._args) { }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../services/KeyboardShortcutService', () => ({
    KeyboardShortcutService: class {
        constructor(..._args) { }
        setWebviewProvider(..._args) { }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../services/TerminalDecorationsService', () => ({
    TerminalDecorationsService: class {
        constructor(..._args) { }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../services/TerminalLinksService', () => ({
    TerminalLinksService: class {
        constructor(..._args) { }
        dispose() { }
    },
}));
vitest_1.vi.mock('../../../../services/TelemetryService', () => ({
    TelemetryService: class {
        constructor(..._args) {
            throw new Error('Telemetry unavailable in test');
        }
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
            this.saveSimpleSessionOnExit = vitest_1.vi.fn().mockResolvedValue(undefined);
        }
        setupSessionAutoSave(..._args) {
            mocks.setupSessionAutoSave(..._args);
        }
    },
}));
(0, vitest_1.describe)('ExtensionLifecycle - panel location context on activate', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should not set secondaryTerminal.panelLocation context during activation', async () => {
        const lifecycle = new ExtensionLifecycle_1.ExtensionLifecycle();
        const context = {
            extensionMode: vscode.ExtensionMode.Development,
            extensionUri: {},
            subscriptions: [],
        };
        await lifecycle.activate(context);
        const setContextCalls = mocks.executeCommand.mock.calls.filter((call) => call[0] === 'setContext' && call[1] === 'secondaryTerminal.panelLocation');
        (0, vitest_1.expect)(setContextCalls).toHaveLength(0);
    });
});
//# sourceMappingURL=ExtensionLifecycle.PanelLocationContext.test.js.map