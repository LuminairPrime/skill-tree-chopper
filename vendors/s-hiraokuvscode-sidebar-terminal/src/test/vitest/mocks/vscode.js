"use strict";
/**
 * VS Code API Mock for Vitest
 * Provides a complete mock of the vscode module for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionContext = exports.debug = exports.env = exports.languages = exports.extensions = exports.commands = exports.window = exports.workspace = exports.ExtensionKind = exports.DiagnosticSeverity = exports.ProgressLocation = exports.TreeItemCollapsibleState = exports.StatusBarAlignment = exports.ViewColumn = exports.ConfigurationTarget = exports.CancellationTokenSource = exports.TextEdit = exports.Selection = exports.Range = exports.Position = exports.ThemeColor = exports.Disposable = exports.EventEmitter = exports.Uri = void 0;
const vitest_1 = require("vitest");
// URI mock
class Uri {
    constructor(scheme, authority, path, query, fragment) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query || '';
        this.fragment = fragment || '';
        this.fsPath = path;
    }
    static file(path) {
        return new Uri('file', '', path);
    }
    static parse(value) {
        try {
            const url = new URL(value);
            return new Uri(url.protocol.replace(':', ''), url.host, url.pathname, url.search.substring(1), url.hash.substring(1));
        }
        catch {
            // Fallback for non-URL strings
            return new Uri('file', '', value);
        }
    }
    static joinPath(base, ...pathSegments) {
        const newPath = `${base.path}/${pathSegments.join('/')}`;
        return new Uri(base.scheme, base.authority, newPath);
    }
    toString() {
        return `${this.scheme}://${this.authority}${this.path}`;
    }
    with(change) {
        return new Uri(change.scheme ?? this.scheme, change.authority ?? this.authority, change.path ?? this.path, change.query ?? this.query, change.fragment ?? this.fragment);
    }
    toJSON() {
        return {
            scheme: this.scheme,
            authority: this.authority,
            path: this.path,
            query: this.query,
            fragment: this.fragment,
            fsPath: this.fsPath,
        };
    }
}
exports.Uri = Uri;
// Event Emitter mock
class EventEmitter {
    constructor() {
        this.listeners = [];
        this.event = (listener) => {
            this.listeners.push(listener);
            return { dispose: () => this.listeners.splice(this.listeners.indexOf(listener), 1) };
        };
        this.fire = vitest_1.vi.fn((data) => {
            this.listeners.forEach((listener) => listener(data));
        });
    }
    dispose() {
        this.listeners = [];
    }
}
exports.EventEmitter = EventEmitter;
// Disposable mock
class Disposable {
    constructor(callOnDispose) {
        this._callOnDispose = callOnDispose;
    }
    static from(...disposables) {
        return new Disposable(() => {
            disposables.forEach((d) => d.dispose());
        });
    }
    dispose() {
        this._callOnDispose?.();
    }
}
exports.Disposable = Disposable;
// ThemeColor mock
class ThemeColor {
    constructor(id) {
        this.id = id;
    }
}
exports.ThemeColor = ThemeColor;
// Position mock
class Position {
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
    isEqual(other) {
        return this.line === other.line && this.character === other.character;
    }
    isBefore(other) {
        return this.line < other.line || (this.line === other.line && this.character < other.character);
    }
    isAfter(other) {
        return this.line > other.line || (this.line === other.line && this.character > other.character);
    }
    translate(lineDelta, characterDelta) {
        return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0));
    }
    with(line, character) {
        return new Position(line ?? this.line, character ?? this.character);
    }
}
exports.Position = Position;
// Range mock
class Range {
    constructor(startOrLine, endOrCharacter, endLine, endCharacter) {
        if (typeof startOrLine === 'number') {
            this.start = new Position(startOrLine, endOrCharacter);
            this.end = new Position(endLine, endCharacter);
        }
        else {
            this.start = startOrLine;
            this.end = endOrCharacter;
        }
    }
    get isEmpty() {
        return this.start.isEqual(this.end);
    }
    get isSingleLine() {
        return this.start.line === this.end.line;
    }
    contains(positionOrRange) {
        if (positionOrRange instanceof Position) {
            return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
        }
        return this.contains(positionOrRange.start) && this.contains(positionOrRange.end);
    }
}
exports.Range = Range;
// Selection mock
class Selection extends Range {
    constructor(anchorOrLine, activeOrCharacter, activeLine, activeCharacter) {
        if (typeof anchorOrLine === 'number') {
            const anchor = new Position(anchorOrLine, activeOrCharacter);
            const active = new Position(activeLine, activeCharacter);
            super(anchor, active);
            this.anchor = anchor;
            this.active = active;
        }
        else {
            super(anchorOrLine, activeOrCharacter);
            this.anchor = anchorOrLine;
            this.active = activeOrCharacter;
        }
    }
    get isReversed() {
        return this.anchor.isAfter(this.active);
    }
}
exports.Selection = Selection;
// TextEdit mock
class TextEdit {
    constructor(range, newText) {
        this.range = range;
        this.newText = newText;
    }
    static replace(range, newText) {
        return new TextEdit(range, newText);
    }
    static insert(position, newText) {
        return new TextEdit(new Range(position, position), newText);
    }
    static delete(range) {
        return new TextEdit(range, '');
    }
}
exports.TextEdit = TextEdit;
// CancellationTokenSource mock
class CancellationTokenSource {
    constructor() {
        this.token = {
            isCancellationRequested: false,
            onCancellationRequested: vitest_1.vi.fn(),
        };
    }
    cancel() {
        this.token.isCancellationRequested = true;
    }
    dispose() { }
}
exports.CancellationTokenSource = CancellationTokenSource;
// Enums
var ConfigurationTarget;
(function (ConfigurationTarget) {
    ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
    ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
    ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
var ViewColumn;
(function (ViewColumn) {
    ViewColumn[ViewColumn["Active"] = -1] = "Active";
    ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
    ViewColumn[ViewColumn["One"] = 1] = "One";
    ViewColumn[ViewColumn["Two"] = 2] = "Two";
    ViewColumn[ViewColumn["Three"] = 3] = "Three";
})(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
var StatusBarAlignment;
(function (StatusBarAlignment) {
    StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
    StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
})(StatusBarAlignment || (exports.StatusBarAlignment = StatusBarAlignment = {}));
var TreeItemCollapsibleState;
(function (TreeItemCollapsibleState) {
    TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
    TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
    TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
})(TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = TreeItemCollapsibleState = {}));
var ProgressLocation;
(function (ProgressLocation) {
    ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
    ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
    ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
})(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
})(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
var ExtensionKind;
(function (ExtensionKind) {
    ExtensionKind[ExtensionKind["UI"] = 1] = "UI";
    ExtensionKind[ExtensionKind["Workspace"] = 2] = "Workspace";
})(ExtensionKind || (exports.ExtensionKind = ExtensionKind = {}));
// Workspace mock
exports.workspace = {
    workspaceFolders: [
        {
            uri: Uri.file('/test/workspace'),
            name: 'Test Workspace',
            index: 0,
        },
    ],
    getConfiguration: vitest_1.vi.fn().mockReturnValue({
        get: vitest_1.vi.fn().mockReturnValue(undefined),
        has: vitest_1.vi.fn().mockReturnValue(false),
        inspect: vitest_1.vi.fn().mockReturnValue(undefined),
        update: vitest_1.vi.fn().mockResolvedValue(undefined),
    }),
    onDidChangeConfiguration: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidOpenTextDocument: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidCloseTextDocument: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidSaveTextDocument: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidChangeTextDocument: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    openTextDocument: vitest_1.vi.fn().mockResolvedValue({
        getText: vitest_1.vi.fn().mockReturnValue(''),
        lineAt: vitest_1.vi.fn().mockReturnValue({ text: '' }),
        lineCount: 0,
    }),
    fs: {
        readFile: vitest_1.vi.fn().mockResolvedValue(Buffer.from('')),
        writeFile: vitest_1.vi.fn().mockResolvedValue(undefined),
        stat: vitest_1.vi.fn().mockResolvedValue({ type: 1, ctime: 0, mtime: 0, size: 0 }),
        readDirectory: vitest_1.vi.fn().mockResolvedValue([]),
        createDirectory: vitest_1.vi.fn().mockResolvedValue(undefined),
        delete: vitest_1.vi.fn().mockResolvedValue(undefined),
        rename: vitest_1.vi.fn().mockResolvedValue(undefined),
        copy: vitest_1.vi.fn().mockResolvedValue(undefined),
        isWritableFileSystem: vitest_1.vi.fn().mockReturnValue(true),
    },
    rootPath: '/test/workspace',
    name: 'Test Workspace',
};
// Window mock
exports.window = {
    showInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    showQuickPick: vitest_1.vi.fn().mockResolvedValue(undefined),
    showInputBox: vitest_1.vi.fn().mockResolvedValue(undefined),
    createOutputChannel: vitest_1.vi.fn().mockReturnValue({
        appendLine: vitest_1.vi.fn(),
        append: vitest_1.vi.fn(),
        clear: vitest_1.vi.fn(),
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
        name: 'Test Output',
    }),
    createStatusBarItem: vitest_1.vi.fn().mockReturnValue({
        text: '',
        tooltip: '',
        command: undefined,
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    createTerminal: vitest_1.vi.fn().mockReturnValue({
        name: 'Test Terminal',
        processId: Promise.resolve(1234),
        sendText: vitest_1.vi.fn(),
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    createWebviewPanel: vitest_1.vi.fn().mockReturnValue({
        webview: {
            html: '',
            options: {},
            onDidReceiveMessage: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
            postMessage: vitest_1.vi.fn().mockResolvedValue(true),
            asWebviewUri: vitest_1.vi.fn((uri) => uri),
            cspSource: 'https://test.vscode-resource.vscode-cdn.net',
        },
        onDidDispose: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onDidChangeViewState: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        reveal: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
        visible: true,
        viewColumn: ViewColumn.One,
    }),
    registerWebviewViewProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerTreeDataProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    createTreeView: vitest_1.vi.fn().mockReturnValue({
        onDidChangeSelection: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onDidChangeVisibility: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onDidCollapseElement: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        onDidExpandElement: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        reveal: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
    activeTextEditor: undefined,
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidChangeVisibleTextEditors: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidChangeTextEditorSelection: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    withProgress: vitest_1.vi.fn().mockImplementation((_options, task) => task({ report: vitest_1.vi.fn() })),
    setStatusBarMessage: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    showTextDocument: vitest_1.vi.fn().mockResolvedValue(undefined),
    onDidChangeActiveColorTheme: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
};
// Commands mock
exports.commands = {
    registerCommand: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
    getCommands: vitest_1.vi.fn().mockResolvedValue([]),
};
// Extensions mock
exports.extensions = {
    getExtension: vitest_1.vi.fn().mockReturnValue(undefined),
    all: [],
    onDidChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
};
// Languages mock
exports.languages = {
    registerCompletionItemProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerHoverProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerDefinitionProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerCodeActionsProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    createDiagnosticCollection: vitest_1.vi.fn().mockReturnValue({
        set: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        clear: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
        forEach: vitest_1.vi.fn(),
        get: vitest_1.vi.fn(),
        has: vitest_1.vi.fn(),
    }),
    getDiagnostics: vitest_1.vi.fn().mockReturnValue([]),
};
// Env mock
exports.env = {
    appName: 'Visual Studio Code',
    appRoot: '/test/vscode',
    language: 'en',
    machineId: 'test-machine-id',
    sessionId: 'test-session-id',
    clipboard: {
        readText: vitest_1.vi.fn().mockResolvedValue(''),
        writeText: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
    openExternal: vitest_1.vi.fn().mockResolvedValue(true),
    uriScheme: 'vscode',
    shell: '/bin/bash',
    createTelemetryLogger: vitest_1.vi.fn().mockReturnValue({
        logUsage: vitest_1.vi.fn(),
        logError: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
    }),
};
// Debug mock
exports.debug = {
    activeDebugSession: undefined,
    breakpoints: [],
    onDidChangeActiveDebugSession: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidStartDebugSession: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidTerminateDebugSession: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    onDidChangeBreakpoints: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerDebugConfigurationProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    startDebugging: vitest_1.vi.fn().mockResolvedValue(true),
};
// Context mock
class ExtensionContext {
    constructor() {
        this.subscriptions = [];
        this.workspaceState = {
            get: vitest_1.vi.fn().mockReturnValue(undefined),
            update: vitest_1.vi.fn().mockResolvedValue(undefined),
            keys: vitest_1.vi.fn().mockReturnValue([]),
        };
        this.globalState = {
            get: vitest_1.vi.fn().mockReturnValue(undefined),
            update: vitest_1.vi.fn().mockResolvedValue(undefined),
            keys: vitest_1.vi.fn().mockReturnValue([]),
            setKeysForSync: vitest_1.vi.fn(),
        };
        this.secrets = {
            get: vitest_1.vi.fn().mockResolvedValue(undefined),
            store: vitest_1.vi.fn().mockResolvedValue(undefined),
            delete: vitest_1.vi.fn().mockResolvedValue(undefined),
            onDidChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
        };
        this.extensionPath = '/test/extension';
        this.extensionUri = Uri.file('/test/extension');
        this.storagePath = '/test/storage';
        this.storageUri = Uri.file('/test/storage');
        this.globalStoragePath = '/test/global-storage';
        this.globalStorageUri = Uri.file('/test/global-storage');
        this.logPath = '/test/logs';
        this.logUri = Uri.file('/test/logs');
        this.extensionMode = 3; // ExtensionMode.Production
        this.extension = {
            id: 'test.extension',
            extensionUri: Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            isActive: true,
            packageJSON: {},
            extensionKind: ExtensionKind.Workspace,
            exports: undefined,
            activate: vitest_1.vi.fn().mockResolvedValue(undefined),
        };
        this.environmentVariableCollection = {
            persistent: true,
            description: undefined,
            replace: vitest_1.vi.fn(),
            append: vitest_1.vi.fn(),
            prepend: vitest_1.vi.fn(),
            get: vitest_1.vi.fn(),
            forEach: vitest_1.vi.fn(),
            clear: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
            getScoped: vitest_1.vi.fn(),
        };
        this.asAbsolutePath = vitest_1.vi.fn((relativePath) => `/test/extension/${relativePath}`);
    }
}
exports.ExtensionContext = ExtensionContext;
// Default export
exports.default = {
    Uri,
    EventEmitter,
    Disposable,
    ThemeColor,
    Position,
    Range,
    Selection,
    TextEdit,
    CancellationTokenSource,
    ConfigurationTarget,
    ViewColumn,
    StatusBarAlignment,
    TreeItemCollapsibleState,
    ProgressLocation,
    DiagnosticSeverity,
    ExtensionKind,
    ExtensionContext,
    workspace: exports.workspace,
    window: exports.window,
    commands: exports.commands,
    extensions: exports.extensions,
    languages: exports.languages,
    env: exports.env,
    debug: exports.debug,
};
//# sourceMappingURL=vscode.js.map