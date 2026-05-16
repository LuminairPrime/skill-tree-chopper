"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const SecondaryTerminalProvider_1 = require("../../../../providers/SecondaryTerminalProvider");
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    window: {
        onDidChangeActiveColorTheme: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
        showWarningMessage: vitest_1.vi.fn(),
        showErrorMessage: vitest_1.vi.fn(),
    },
    workspace: {
        getConfiguration: vitest_1.vi.fn(() => ({
            get: vitest_1.vi.fn((key) => {
                if (key === 'panelLocation')
                    return 'sidebar';
                return undefined;
            }),
            inspect: vitest_1.vi.fn(() => ({
                key: 'test',
                defaultValue: false,
                globalValue: undefined,
                workspaceValue: undefined,
                workspaceFolderValue: undefined,
            })),
            affectsConfiguration: vitest_1.vi.fn().mockReturnValue(false),
        })),
        onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
    },
    commands: {
        executeCommand: vitest_1.vi.fn(),
    },
    EventEmitter: class {
        constructor() {
            this.event = vitest_1.vi.fn();
            this.fire = vitest_1.vi.fn();
        }
    },
    Disposable: class {
        constructor() {
            this.dispose = vitest_1.vi.fn();
        }
        static from(..._args) {
            return { dispose: vitest_1.vi.fn() };
        }
    },
    ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3, HighContrastLight: 4 },
    Uri: {
        file: (path) => ({ fsPath: path, scheme: 'file', toString: () => `file://${path}` }),
        joinPath: (uri, ...parts) => {
            const newPath = `${uri.fsPath}/${parts.join('/')}`;
            return {
                ...uri,
                fsPath: newPath,
                toString: () => `file://${newPath}`,
            };
        },
    },
}));
(0, vitest_1.describe)('SecondaryTerminalProvider', () => {
    let provider;
    let mockContext;
    let mockTerminalManager;
    let mockWebviewView;
    (0, vitest_1.beforeEach)(() => {
        mockContext = {
            extensionUri: { fsPath: '/test/path', scheme: 'file', toString: () => 'file:///test/path' },
            subscriptions: [],
        };
        mockTerminalManager = {
            getTerminals: vitest_1.vi.fn().mockReturnValue([]),
            getTerminal: vitest_1.vi.fn(),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue(null),
            setActiveTerminal: vitest_1.vi.fn(),
            renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
            updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
            createTerminal: vitest_1.vi.fn().mockReturnValue('term-1'),
            onTerminalCreated: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onTerminalRemoved: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onData: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onExit: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onStateUpdate: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onTerminalFocus: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onCliAgentStatusChange: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            getCurrentState: vitest_1.vi
                .fn()
                .mockReturnValue({ terminals: [], availableSlots: [1, 2, 3], maxTerminals: 5 }),
            getConnectedAgentTerminalId: vitest_1.vi.fn(),
            getConnectedAgentType: vitest_1.vi.fn(),
            getDisconnectedAgents: vitest_1.vi.fn().mockReturnValue(new Map()),
        };
        mockWebviewView = {
            webview: {
                options: {},
                onDidReceiveMessage: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
                postMessage: vitest_1.vi.fn().mockResolvedValue(true),
                asWebviewUri: vitest_1.vi.fn((uri) => uri),
                cspSource: 'vscode-resource:',
                html: '',
            },
            onDidDispose: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            onDidChangeVisibility: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
            visible: true,
        };
        provider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(mockContext, mockTerminalManager);
    });
    (0, vitest_1.afterEach)(() => {
        if (provider) {
            provider.dispose();
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should be created with all services', () => {
            (0, vitest_1.expect)(provider).toBeDefined();
        });
        (0, vitest_1.it)('should resolve webview view and set options', () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            (0, vitest_1.expect)(mockWebviewView.webview.options).toBeDefined();
            (0, vitest_1.expect)(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should generate and set HTML content', () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            (0, vitest_1.expect)(mockWebviewView.webview.html).toContain('<!DOCTYPE html>');
            (0, vitest_1.expect)(mockWebviewView.webview.html).toContain('terminal-body');
        });
    });
    (0, vitest_1.describe)('Message Handling (Handshake)', () => {
        (0, vitest_1.it)('should handle webviewReady and send extensionReady', async () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            // Extract the message handler registered with webview
            const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0];
            await messageHandler({ command: 'webviewReady' });
            await vitest_1.vi.waitFor(() => {
                (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'extensionReady',
                }));
            });
        });
        (0, vitest_1.it)('should handle webviewInitialized and start terminal init', async () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0];
            // Step 1: Handshake part 1
            await messageHandler({ command: 'webviewReady' });
            // Step 2: Handshake part 2
            await messageHandler({ command: 'webviewInitialized' });
            // Should send settings and init command
            await vitest_1.vi.waitFor(() => {
                (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'settingsResponse',
                }));
                (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                    command: 'init',
                }));
            });
        });
        (0, vitest_1.it)('should route renameTerminal message to terminal command handlers', async () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0];
            await messageHandler({
                command: 'renameTerminal',
                terminalId: 'term-1',
                newName: 'Renamed from Header',
            });
            await vitest_1.vi.waitFor(() => {
                (0, vitest_1.expect)(mockTerminalManager.renameTerminal).toHaveBeenCalledWith('term-1', 'Renamed from Header');
            });
        });
        (0, vitest_1.it)('should route updateTerminalHeader message to terminal command handlers', async () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            const messageHandler = mockWebviewView.webview.onDidReceiveMessage.mock.calls[0][0];
            await messageHandler({
                command: 'updateTerminalHeader',
                terminalId: 'term-1',
                newName: 'Renamed + Colored',
                indicatorColor: '#FF69B4',
            });
            await vitest_1.vi.waitFor(() => {
                (0, vitest_1.expect)(mockTerminalManager.updateTerminalHeader).toHaveBeenCalledWith('term-1', {
                    newName: 'Renamed + Colored',
                    indicatorColor: '#FF69B4',
                });
            });
        });
    });
    (0, vitest_1.describe)('Theme Sync', () => {
        (0, vitest_1.it)('should notify WebView when VS Code theme changes and mode is auto', () => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
            // Simulate theme change trigger
            const themeChangeCallback = vscode.window.onDidChangeActiveColorTheme.mock
                .calls[0][0];
            themeChangeCallback({ kind: 2 }); // Dark theme
            (0, vitest_1.expect)(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'themeChanged',
                theme: 'dark',
            }));
        });
    });
});
//# sourceMappingURL=SecondaryTerminalProvider.test.js.map