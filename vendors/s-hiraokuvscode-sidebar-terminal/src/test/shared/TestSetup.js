"use strict";
/**
 * 共通テストセットアップユーティリティ
 * 全テストファイルで重複していた setupTestEnvironment 関数を統合
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockVscode = void 0;
exports.setupTestEnvironment = setupTestEnvironment;
exports.setupConsoleMocks = setupConsoleMocks;
exports.setupJSDOMEnvironment = setupJSDOMEnvironment;
exports.backupGlobalState = backupGlobalState;
exports.restoreGlobalState = restoreGlobalState;
exports.resetTestEnvironment = resetTestEnvironment;
exports.safeStub = safeStub;
exports.setupCompleteTestEnvironment = setupCompleteTestEnvironment;
exports.cleanupTestEnvironment = cleanupTestEnvironment;
exports.teardownTestEnvironment = teardownTestEnvironment;
exports.createIsolatedTestContext = createIsolatedTestContext;
exports.setupTestEnvironmentSync = setupTestEnvironmentSync;
// Initialize browser globals immediately before any imports
if (!global.self) {
    global.self = global;
}
if (!global.window) {
    global.window = global;
}
// Mock HTMLCanvasElement.getContext BEFORE any xterm.js imports
if (typeof global.HTMLCanvasElement === 'undefined') {
    global.HTMLCanvasElement = class MockHTMLCanvasElement {
        getContext(contextType) {
            if (contextType === '2d') {
                return {
                    fillStyle: '',
                    strokeStyle: '',
                    lineWidth: 1,
                    fillRect: () => { },
                    strokeRect: () => { },
                    clearRect: () => { },
                    beginPath: () => { },
                    closePath: () => { },
                    moveTo: () => { },
                    lineTo: () => { },
                    arc: () => { },
                    fill: () => { },
                    stroke: () => { },
                    fillText: () => { },
                    strokeText: () => { },
                    measureText: () => ({ width: 0 }),
                    save: () => { },
                    restore: () => { },
                    scale: () => { },
                    rotate: () => { },
                    translate: () => { },
                    transform: () => { },
                    setTransform: () => { },
                    createLinearGradient: () => ({ addColorStop: () => { } }),
                    createRadialGradient: () => ({ addColorStop: () => { } }),
                    createPattern: () => null,
                    getImageData: () => ({ data: new Uint8ClampedArray(), width: 0, height: 0 }),
                    putImageData: () => { },
                    drawImage: () => { },
                    canvas: this,
                };
            }
            return null;
        }
        get width() {
            return 300;
        }
        set width(_value) { }
        get height() {
            return 150;
        }
        set height(_value) { }
        toDataURL() {
            return 'data:,';
        }
        toBlob() { }
        getBoundingClientRect() {
            return {
                width: 300,
                height: 150,
                x: 0,
                y: 0,
                top: 0,
                left: 0,
                right: 300,
                bottom: 150,
            };
        }
    };
}
const sinon = require("sinon");
const chai = require("chai");
const sinon_chai_1 = require("sinon-chai");
const jsdom_1 = require("jsdom");
// Set up chai plugins
// sinon-chai may be incompatible with vitest's built-in chai (getter-only properties).
// Wrap in try-catch so vitest tests that import TestSetup are not broken.
try {
    chai.use(sinon_chai_1.default);
}
catch {
    // Ignored: sinon-chai is only needed by legacy Mocha integration tests
}
// ============================================================================
// TEST POLLUTION PREVENTION - Module-level state for cleanup
// ============================================================================
/**
 * Store original Module.prototype.require for restoration
 * CRITICAL: This must be restored in cleanupTestEnvironment to prevent test pollution
 */
let originalModuleRequire = null;
let moduleRequireOverridden = false;
/**
 * Store original process.env for restoration
 */
let originalProcessEnv = null;
// Async setup for chai-as-promised ES module
let chaiAsPromisedSetup = false;
async function setupChaiAsPromised() {
    if (!chaiAsPromisedSetup) {
        const chaiAsPromised = await Promise.resolve().then(() => require('chai-as-promised'));
        chai.use(chaiAsPromised.default);
        chaiAsPromisedSetup = true;
    }
}
/**
 * VS Code API のモックオブジェクト
 * 全テストで共通して使用されるVS Code API群のモック
 */
exports.mockVscode = {
    workspace: {
        getConfiguration: sinon.stub().callsFake((section) => {
            const config = {
                get: sinon.stub().callsFake((key, defaultValue) => {
                    // Return reasonable defaults for common configuration keys
                    if (section === 'secondaryTerminal') {
                        const defaults = {
                            shell: '/bin/bash',
                            shellArgs: [],
                            fontSize: 14,
                            fontFamily: 'monospace',
                            maxTerminals: 5,
                            theme: 'auto',
                            cursorBlink: true,
                            startDirectory: '',
                            showHeader: true,
                            showIcons: true,
                            altClickMovesCursor: true,
                            enableCliAgentIntegration: true,
                            enableGitHubCopilotIntegration: true,
                            enablePersistentSessions: true,
                            persistentSessionScrollback: 1000,
                            persistentSessionReviveProcess: false,
                        };
                        // Return default value if key exists in defaults, otherwise return the provided default
                        return key in defaults ? defaults[key] : defaultValue;
                    }
                    if (section === 'terminal.integrated') {
                        const defaults = {
                            shell: '/bin/bash',
                            shellArgs: [],
                            altClickMovesCursor: true,
                            profiles: {},
                            defaultProfile: {},
                        };
                        return key in defaults ? defaults[key] : defaultValue;
                    }
                    if (section === 'editor') {
                        const defaults = {
                            multiCursorModifier: 'alt',
                        };
                        return key in defaults ? defaults[key] : defaultValue;
                    }
                    if (section === 'workbench') {
                        const defaults = {
                            colorTheme: 'One Dark Pro',
                            iconTheme: 'vscode-icons',
                        };
                        return key in defaults ? defaults[key] : defaultValue;
                    }
                    return defaultValue;
                }),
                has: sinon.stub().returns(true),
                inspect: sinon.stub().returns({ defaultValue: undefined }),
                update: sinon.stub().resolves(),
            };
            return config;
        }),
        onDidChangeConfiguration: sinon.stub().returns({
            dispose: sinon.stub(),
        }),
        workspaceFolders: [
            {
                uri: {
                    fsPath: '/test/workspace',
                    scheme: 'file',
                    path: '/test/workspace',
                    toString: () => 'file:///test/workspace',
                },
                name: 'test-workspace',
            },
        ],
        name: 'test-workspace',
    },
    window: {
        showErrorMessage: sinon.stub().resolves(),
        showWarningMessage: sinon.stub().resolves(),
        showInformationMessage: sinon.stub().resolves(),
        createWebviewPanel: sinon.stub(),
        registerWebviewViewProvider: sinon.stub(),
        showOpenDialog: sinon.stub().resolves(),
        showSaveDialog: sinon.stub().resolves(),
        activeTextEditor: {
            document: {
                uri: {
                    scheme: 'file',
                    fsPath: '/test/file.ts',
                    path: '/test/file.ts',
                    toString: () => 'file:///test/file.ts',
                },
                getText: sinon.stub().returns('test content'),
                lineAt: sinon.stub().returns({ text: 'test line' }),
                lineCount: 10,
            },
            selection: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 },
                isEmpty: true,
            },
        },
    },
    commands: {
        registerCommand: sinon.stub(),
        executeCommand: sinon.stub().resolves(),
    },
    ExtensionContext: sinon.stub(),
    ViewColumn: { One: 1, Two: 2, Three: 3, Left: 1, Right: 2 },
    TreeDataProvider: sinon.stub(),
    EventEmitter: class MockEventEmitter {
        constructor() {
            this.listeners = [];
            this.fire = (event) => {
                this.listeners.forEach((listener) => {
                    try {
                        listener(event);
                    }
                    catch (error) {
                        console.error('Error in event listener:', error);
                    }
                });
            };
            this.event = (listener) => {
                this.listeners.push(listener);
                return {
                    dispose: () => {
                        const index = this.listeners.indexOf(listener);
                        if (index >= 0) {
                            this.listeners.splice(index, 1);
                        }
                    },
                };
            };
            this.dispose = () => {
                this.listeners.length = 0;
            };
        }
    },
    CancellationToken: sinon.stub(),
    Uri: {
        file: sinon.stub().callsFake((path) => ({
            scheme: 'file',
            path: path,
            fsPath: path,
            toString: () => `file://${path}`,
            with: sinon.stub(),
        })),
        parse: sinon.stub().callsFake((uri) => ({
            scheme: 'file',
            path: uri.replace('file://', ''),
            fsPath: uri.replace('file://', ''),
            toString: () => uri,
            with: sinon.stub(),
        })),
        joinPath: sinon.stub().callsFake((base, ...pathSegments) => ({
            scheme: base.scheme || 'file',
            path: `${base.path}/${pathSegments.join('/')}`,
            fsPath: `${base.fsPath || base.path}/${pathSegments.join('/')}`,
            toString: () => `${base.scheme || 'file'}://${base.path}/${pathSegments.join('/')}`,
            with: sinon.stub(),
        })),
    },
    env: {
        openExternal: sinon.stub().resolves(),
    },
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3,
    },
};
/**
 * 基本的なテスト環境セットアップ
 * グローバルなモックとNode.js環境のセットアップを行う
 */
async function setupTestEnvironment() {
    // Setup chai-as-promised first
    await setupChaiAsPromised();
    // Mock VS Code module
    global.vscode = exports.mockVscode;
    // CRITICAL: Register vscode mock in require.cache so that `import * as vscode from 'vscode'` returns the mock
    // This fixes ConfigurationService and other modules that import vscode directly
    const Module = require('module');
    try {
        const vscodeModulePath = require.resolve('vscode', { paths: [process.cwd()] });
        require.cache[vscodeModulePath] = {
            id: vscodeModulePath,
            filename: vscodeModulePath,
            loaded: true,
            exports: exports.mockVscode,
        };
    }
    catch (e) {
        // vscode module not found in require.resolve, will be handled by Module.prototype.require override
    }
    // Register mocks in require.cache where possible, keeping Module.prototype.require
    // override minimal to preserve nyc coverage instrumentation
    const mockNodePty = {
        spawn: () => ({
            pid: 1234,
            onData: () => ({ dispose: () => { } }),
            onExit: () => ({ dispose: () => { } }),
            write: () => { },
            resize: () => { },
            kill: () => { },
            dispose: () => { },
        }),
    };
    // Register node-pty mocks in cache
    const ptyModules = ['node-pty'];
    ptyModules.forEach((moduleName) => {
        try {
            const modulePath = require.resolve(moduleName, { paths: [process.cwd()] });
            require.cache[modulePath] = {
                id: modulePath,
                filename: modulePath,
                loaded: true,
                exports: mockNodePty,
            };
        }
        catch (e) {
            // Module not found, skip
        }
    });
    // Note: xterm mocks are handled by xterm-mock.js which is loaded first
    // Minimal hook ONLY for 'vscode' module (which has no physical file to cache)
    // CRITICAL: Store original require for restoration in cleanupTestEnvironment
    if (!moduleRequireOverridden) {
        originalModuleRequire = Module.prototype.require;
        moduleRequireOverridden = true;
    }
    const savedOriginalRequire = originalModuleRequire || Module.prototype.require;
    Module.prototype.require = function (id) {
        if (id === 'vscode') {
            return exports.mockVscode;
        }
        // All other modules pass through to original require (preserves nyc instrumentation)
        return savedOriginalRequire.apply(this, arguments);
    };
    // Mock Node.js modules
    global.require = sinon.stub();
    global.module = { exports: {} };
    // Enhanced process polyfilling for test compatibility
    // Save original process methods NOW before they might get replaced
    // CRITICAL: Save actual Node.js EventEmitter methods to prevent "process.emit is not a function" errors
    const EventEmitter = require('events');
    const originalProcessEmit = process.emit && typeof process.emit === 'function'
        ? process.emit.bind(process)
        : EventEmitter.prototype.emit.bind(process);
    const originalProcessOn = process.on && typeof process.on === 'function'
        ? process.on.bind(process)
        : EventEmitter.prototype.on.bind(process);
    const originalProcessListeners = process.listeners && typeof process.listeners === 'function'
        ? process.listeners.bind(process)
        : EventEmitter.prototype.listeners.bind(process);
    const originalProcessListenerCount = process.listenerCount && typeof process.listenerCount === 'function'
        ? process.listenerCount.bind(process)
        : () => 0;
    const savedCwd = process.cwd && typeof process.cwd === 'function' ? process.cwd.bind(process) : null;
    const processPolyfill = {
        ...process,
        nextTick: (callback) => setImmediate(callback),
        env: { ...process.env, NODE_ENV: 'test' },
        platform: process.platform,
        cwd: savedCwd || (() => '/test'),
        argv: process.argv,
        pid: process.pid,
        on: originalProcessOn,
        emit: originalProcessEmit,
        listeners: originalProcessListeners,
        listenerCount: originalProcessListenerCount,
        removeListener: () => processPolyfill,
        removeAllListeners: () => processPolyfill,
        off: () => processPolyfill,
    };
    // Processオブジェクトは上書きせず、必要なプロパティのみ安全に設定
    if (!global.process) {
        global.process = processPolyfill;
    }
    else {
        // 既存のprocessオブジェクトに不足しているメソッドを追加
        // Use saved original functions to ensure they work correctly
        const existingProcess = global.process;
        if (!existingProcess.nextTick) {
            existingProcess.nextTick = (callback) => setImmediate(callback);
        }
        if (!existingProcess.on || typeof existingProcess.on !== 'function') {
            existingProcess.on = originalProcessOn;
        }
        if (!existingProcess.emit || typeof existingProcess.emit !== 'function') {
            existingProcess.emit = originalProcessEmit;
        }
        if (!existingProcess.listeners || typeof existingProcess.listeners !== 'function') {
            existingProcess.listeners = originalProcessListeners;
        }
        if (!existingProcess.listenerCount || typeof existingProcess.listenerCount !== 'function') {
            existingProcess.listenerCount = originalProcessListenerCount;
        }
        if (!existingProcess.removeListener) {
            existingProcess.removeListener = () => existingProcess;
        }
        if (!existingProcess.removeAllListeners) {
            existingProcess.removeAllListeners = () => existingProcess;
        }
        if (!existingProcess.off) {
            existingProcess.off = () => existingProcess;
        }
        if (!existingProcess.cwd) {
            existingProcess.cwd = savedCwd || (() => '/test');
        }
    }
    // テスト用の環境変数を一時的に設定（復元可能な形で）
    // CRITICAL: Save original env for restoration
    if (!originalProcessEnv) {
        originalProcessEnv = { ...process.env };
    }
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'test';
    }
    // Mock global objects that might be needed
    global.Buffer = Buffer;
    global.setImmediate = setImmediate;
    global.clearImmediate = clearImmediate;
    // Global xterm.js mocks for tests that access them directly
    global.Terminal = function () {
        return {
            write: () => { },
            writeln: () => { },
            clear: () => { },
            resize: () => { },
            focus: () => { },
            blur: () => { },
            dispose: () => { },
            open: () => { },
            onData: () => ({ dispose: () => { } }),
            onResize: () => ({ dispose: () => { } }),
            onKey: () => ({ dispose: () => { } }),
            loadAddon: () => { },
            options: {},
            rows: 24,
            cols: 80,
            buffer: {
                active: {
                    length: 100,
                    viewportY: 50,
                    baseY: 0,
                    getLine: () => ({ translateToString: () => '' }),
                },
            },
        };
    };
    global.FitAddon = function () {
        return {
            fit: () => { },
            dispose: () => { },
        };
    };
    // Fix process event handler methods for Mocha compatibility
    // Only add missing methods to the actual process object if they don't exist
    const requiredMethods = ['removeListener', 'removeAllListeners', 'off'];
    requiredMethods.forEach((method) => {
        if (!process[method] &&
            typeof process[method] === 'undefined') {
            process[method] = function (..._args) {
                // For methods that need to be chainable
                if (method === 'removeListener' || method === 'removeAllListeners' || method === 'off') {
                    return process;
                }
                return;
            };
        }
    });
}
/**
 * 拡張コンソールモックセットアップ
 * テスト中のコンソール出力を制御するためのモック
 * Note: This preserves original console functionality while allowing tests to suppress output
 */
function setupConsoleMocks() {
    // Preserve original console for fallback
    const originalConsole = console;
    // Create pass-through stubs that call original console
    const consoleMocks = {
        log: sinon.stub().callsFake((...args) => originalConsole.log(...args)),
        warn: sinon.stub().callsFake((...args) => originalConsole.warn(...args)),
        error: sinon.stub().callsFake((...args) => originalConsole.error(...args)),
        info: sinon.stub().callsFake((...args) => originalConsole.info(...args)),
        debug: sinon.stub().callsFake((...args) => originalConsole.debug(...args)),
    };
    // Don't replace global console - this was causing hangs
    // Tests that need to mock console can access consoleMocks directly
    return consoleMocks;
}
/**
 * JSDOM環境のセットアップ
 * DOM操作が必要なテストのための環境構築
 */
function setupJSDOMEnvironment(htmlContent) {
    const defaultHtml = htmlContent ||
        `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Test Environment</title>
      </head>
      <body>
        <div id="terminal-container"></div>
        <div id="settings-panel"></div>
        <div id="notification-container"></div>
      </body>
    </html>
  `;
    // Ensure process.nextTick is available globally before JSDOM creation
    // Save the original process for JSDOM
    const originalProcess = global.process || process;
    // Ensure process.nextTick exists for JSDOM
    if (!process.nextTick || typeof process.nextTick !== 'function') {
        process.nextTick = (callback) => setImmediate(callback);
    }
    // Ensure global.process exists with necessary methods for tests
    if (!global.process) {
        global.process = {
            ...originalProcess,
            nextTick: (callback) => setImmediate(callback),
            env: { ...process.env, NODE_ENV: 'test' },
            on: () => { },
            removeListener: () => global.process,
            removeAllListeners: () => global.process,
            off: () => global.process,
        };
    }
    else if (typeof global.process.nextTick !== 'function') {
        global.process.nextTick = (callback) => setImmediate(callback);
    }
    const dom = new jsdom_1.JSDOM(defaultHtml, {
        url: 'http://localhost',
        contentType: 'text/html',
        includeNodeLocations: true,
        storageQuota: 10000000,
        beforeParse(window) {
            // Ensure process.nextTick is available for JSDOM
            window.process = {
                ...global.process,
                nextTick: (callback) => setImmediate(callback),
                env: { NODE_ENV: 'test' },
                platform: 'linux',
                cwd: () => '/test',
                on: () => { },
                removeListener: () => window.process,
                removeAllListeners: () => window.process,
                off: () => window.process,
            };
            // Add missing methods that might be needed
            window.setImmediate = setImmediate;
            window.clearImmediate = clearImmediate;
            window.setTimeout = setTimeout;
            window.clearTimeout = clearTimeout;
        },
    });
    const { window } = dom;
    const { document } = window;
    // グローバルにDOM要素を設定
    global.window = window;
    global.document = document;
    // navigatorは既に存在する場合があるので安全に設定
    if (!global.navigator) {
        global.navigator = window.navigator;
    }
    global.HTMLElement = window.HTMLElement;
    global.Element = window.Element;
    global.Node = window.Node;
    // DOM イベント系のモック
    global.Event = window.Event;
    global.CustomEvent = window.CustomEvent;
    global.MouseEvent = window.MouseEvent;
    global.KeyboardEvent = window.KeyboardEvent;
    // ResizeObserver モック
    global.ResizeObserver = class MockResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
    // requestAnimationFrame モック
    if (!global.requestAnimationFrame) {
        global.requestAnimationFrame = (callback) => {
            return setTimeout(() => callback(Date.now()), 16);
        };
        global.cancelAnimationFrame = (id) => {
            clearTimeout(id);
        };
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = global.requestAnimationFrame;
        window.cancelAnimationFrame = global.cancelAnimationFrame;
    }
    // Element.closest ポリフィル (JSDOMで不足する場合)
    if (window.Element && !window.Element.prototype.closest) {
        window.Element.prototype.closest = function (selector) {
            let element = this;
            while (element) {
                if (element.matches && element.matches(selector)) {
                    return element;
                }
                element = element.parentElement;
            }
            return null;
        };
    }
    // Element.matches ポリフィル
    if (window.Element && !window.Element.prototype.matches) {
        window.Element.prototype.matches =
            window.Element.prototype.msMatchesSelector ||
                window.Element.prototype.webkitMatchesSelector ||
                function (s) {
                    const matches = (this.ownerDocument || document).querySelectorAll(s);
                    let i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) { }
                    return i > -1;
                };
    }
    // Element.contains ポリフィル
    if (window.Element && !window.Element.prototype.contains) {
        window.Element.prototype.contains = function (other) {
            if (!other)
                return false;
            let node = other;
            while (node) {
                if (node === this)
                    return true;
                node = node.parentNode;
            }
            return false;
        };
    }
    // Element.remove ポリフィル
    if (window.Element && !window.Element.prototype.remove) {
        window.Element.prototype.remove = function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }
    // ChildNode.remove ポリフィル (for Text nodes etc.)
    if (window.CharacterData && !window.CharacterData.prototype.remove) {
        window.CharacterData.prototype.remove = function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }
    // HTMLCanvasElement.getContext モック (xterm.jsのCanvas依存関係対応)
    if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.getContext) {
        window.HTMLCanvasElement.prototype.getContext = function (contextType) {
            if (contextType === '2d') {
                return {
                    fillStyle: '',
                    strokeStyle: '',
                    lineWidth: 1,
                    fillRect: () => { },
                    strokeRect: () => { },
                    clearRect: () => { },
                    beginPath: () => { },
                    closePath: () => { },
                    moveTo: () => { },
                    lineTo: () => { },
                    arc: () => { },
                    fill: () => { },
                    stroke: () => { },
                    fillText: () => { },
                    strokeText: () => { },
                    measureText: () => ({ width: 0 }),
                    save: () => { },
                    restore: () => { },
                    scale: () => { },
                    rotate: () => { },
                    translate: () => { },
                    transform: () => { },
                    setTransform: () => { },
                    createLinearGradient: () => ({
                        addColorStop: () => { },
                    }),
                    createRadialGradient: () => ({
                        addColorStop: () => { },
                    }),
                    createPattern: () => null,
                    getImageData: () => ({
                        data: new Uint8ClampedArray(),
                        width: 0,
                        height: 0,
                    }),
                    putImageData: () => { },
                    drawImage: () => { },
                    canvas: this,
                };
            }
            return null;
        };
    }
    // グローバルにもHTMLCanvasElementモックを設定
    if (!global.HTMLCanvasElement) {
        global.HTMLCanvasElement = window.HTMLCanvasElement;
    }
    return { dom, document, window };
}
/**
 * Backup current global state for restoration
 * Call this in beforeEach to capture state before test modifications
 */
function backupGlobalState() {
    return {
        document: global.document,
        window: global.window,
        navigator: global.navigator,
        HTMLElement: global.HTMLElement,
        Element: global.Element,
        Node: global.Node,
        Event: global.Event,
        CustomEvent: global.CustomEvent,
        MouseEvent: global.MouseEvent,
        KeyboardEvent: global.KeyboardEvent,
        ResizeObserver: global.ResizeObserver,
    };
}
/**
 * Restore global state from snapshot
 * Call this in afterEach to restore original global state
 */
function restoreGlobalState(snapshot) {
    global.document = snapshot.document;
    global.window = snapshot.window;
    global.navigator = snapshot.navigator;
    global.HTMLElement = snapshot.HTMLElement;
    global.Element = snapshot.Element;
    global.Node = snapshot.Node;
    global.Event = snapshot.Event;
    global.CustomEvent = snapshot.CustomEvent;
    global.MouseEvent = snapshot.MouseEvent;
    global.KeyboardEvent = snapshot.KeyboardEvent;
    global.ResizeObserver = snapshot.ResizeObserver;
}
/**
 * Helper function to reset all stubs in an object recursively
 * Resets both call history and behavior
 */
function resetStubsRecursively(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 3)
        return;
    Object.keys(obj).forEach((key) => {
        try {
            const value = obj[key];
            if (value && typeof value === 'function') {
                // Reset stub history if it's a sinon stub
                if (typeof value.resetHistory === 'function') {
                    value.resetHistory();
                }
                if (typeof value.reset === 'function') {
                    value.reset();
                }
            }
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Recurse into nested objects
                resetStubsRecursively(value, depth + 1);
            }
        }
        catch (e) {
            // Ignore errors for individual stub resets
        }
    });
}
/**
 * テスト分離とクリーンアップのためのリセット関数
 * テスト間で状態が持ち越されることを防ぐ
 *
 * CRITICAL: This function now performs comprehensive cleanup to prevent test pollution
 */
function resetTestEnvironment() {
    // Clear all Sinon state safely
    try {
        sinon.reset();
    }
    catch (error) {
        // Reset may fail if nothing to reset, this is OK
        console.debug('Sinon reset warning:', error);
    }
    try {
        sinon.restore();
    }
    catch (error) {
        // Restore may fail if nothing to restore, this is OK
        console.debug('Sinon restore warning:', error);
    }
    // CRITICAL: Reset ALL mockVscode stubs to prevent call history accumulation
    try {
        if (exports.mockVscode) {
            // Reset workspace stubs
            resetStubsRecursively(exports.mockVscode.workspace);
            // Reset window stubs
            resetStubsRecursively(exports.mockVscode.window);
            // Reset commands stubs
            resetStubsRecursively(exports.mockVscode.commands);
            // Reset Uri stubs
            resetStubsRecursively(exports.mockVscode.Uri);
            // Reset env stubs
            resetStubsRecursively(exports.mockVscode.env);
        }
    }
    catch (error) {
        console.debug('MockVscode reset warning:', error);
    }
}
/**
 * 安全なSinon stub作成 - "already wrapped" エラーを防ぐ
 */
function safeStub(obj, method) {
    if (obj[method] && obj[method].restore) {
        obj[method].restore();
    }
    return sinon.stub(obj, method);
}
/**
 * 完全なテスト環境セットアップ
 * 基本環境 + コンソールモック + JSDOM環境の統合セットアップ
 */
function setupCompleteTestEnvironment(htmlContent) {
    setupTestEnvironment();
    const consoleMocks = setupConsoleMocks();
    const { dom, document, window } = setupJSDOMEnvironment(htmlContent);
    return {
        dom,
        document,
        window,
        consoleMocks,
        mockVscode: exports.mockVscode,
    };
}
/**
 * sinon サンドボックスとテスト環境のクリーンアップ
 * afterEach で呼び出してテスト間の状態リセットを行う
 *
 * CRITICAL: This function now restores Module.prototype.require and process.env
 * to prevent test pollution between test files
 */
function cleanupTestEnvironment(sandbox, dom, globalSnapshot) {
    // sinon スタブをリセット
    if (sandbox) {
        try {
            sandbox.restore();
        }
        catch (error) {
            // Restore may fail if already restored, this is OK
            console.debug('Sandbox restore warning:', error);
        }
    }
    // JSDOM をクリーンアップ
    if (dom) {
        try {
            dom.window.close();
        }
        catch (error) {
            // Window may already be closed, this is OK
            console.debug('JSDOM cleanup warning:', error);
        }
    }
    // グローバル状態を復元（スナップショットがある場合）
    if (globalSnapshot) {
        try {
            restoreGlobalState(globalSnapshot);
        }
        catch (error) {
            console.debug('Global state restore warning:', error);
        }
    }
    // CRITICAL: Reset mockVscode stubs to prevent call history accumulation
    resetTestEnvironment();
    // グローバル状態をクリア
    try {
        const config = exports.mockVscode.workspace.getConfiguration();
        if (config && typeof config === 'object') {
            Object.keys(config).forEach((key) => {
                if (typeof config[key] === 'object' && config[key] && config[key].reset) {
                    try {
                        config[key].reset();
                    }
                    catch (error) {
                        // Reset may fail, this is OK
                        console.debug(`Config reset warning for ${key}:`, error);
                    }
                }
            });
        }
    }
    catch (error) {
        // Config cleanup may fail, this is OK
        console.debug('Config cleanup warning:', error);
    }
    // グローバルオブジェクトの部分的クリーンアップ（スナップショットがない場合のみ）
    if (!globalSnapshot) {
        try {
            delete global.window;
            delete global.document;
            delete global.navigator;
        }
        catch (error) {
            // Global cleanup may fail, this is OK
            console.debug('Global cleanup warning:', error);
        }
    }
}
/**
 * Full test environment teardown - restores Module.prototype.require
 * Call this at the end of a test suite (in after()) to fully restore Node.js state
 *
 * CRITICAL: This prevents test pollution between test files
 */
function teardownTestEnvironment() {
    // Restore Module.prototype.require
    if (originalModuleRequire && moduleRequireOverridden) {
        try {
            const Module = require('module');
            Module.prototype.require = originalModuleRequire;
            moduleRequireOverridden = false;
        }
        catch (error) {
            console.debug('Module.prototype.require restore warning:', error);
        }
    }
    // Restore process.env
    if (originalProcessEnv) {
        try {
            // Clear current env and restore original
            Object.keys(process.env).forEach((key) => {
                if (!(key in originalProcessEnv)) {
                    delete process.env[key];
                }
            });
            Object.assign(process.env, originalProcessEnv);
        }
        catch (error) {
            console.debug('process.env restore warning:', error);
        }
    }
    // Clear require.cache entries we added
    try {
        const modulesToClear = ['vscode', 'node-pty'];
        modulesToClear.forEach((moduleName) => {
            try {
                const modulePath = require.resolve(moduleName, { paths: [process.cwd()] });
                delete require.cache[modulePath];
            }
            catch (e) {
                // Module not found, skip
            }
        });
    }
    catch (error) {
        console.debug('require.cache cleanup warning:', error);
    }
}
/**
 * Create an isolated test context with automatic cleanup
 * Use this for tests that need complete isolation
 *
 * @example
 * describe('MyTest', () => {
 *   const ctx = createIsolatedTestContext();
 *
 *   beforeEach(() => ctx.setup());
 *   afterEach(() => ctx.cleanup());
 *
 *   it('should work', () => {
 *     // Test code
 *   });
 * });
 */
function createIsolatedTestContext() {
    let dom = null;
    let globalSnapshot = null;
    let sandbox = null;
    return {
        setup: () => {
            // Create sandbox first
            sandbox = sinon.createSandbox();
            // Backup global state
            globalSnapshot = backupGlobalState();
            // Setup JSDOM
            const result = setupJSDOMEnvironment();
            dom = result.dom;
            return {
                dom: result.dom,
                document: result.document,
                window: result.window,
                sandbox,
            };
        },
        cleanup: () => {
            // Use try-finally to ensure all cleanup happens
            try {
                if (sandbox) {
                    sandbox.restore();
                }
            }
            finally {
                try {
                    if (dom) {
                        dom.window.close();
                    }
                }
                finally {
                    if (globalSnapshot) {
                        restoreGlobalState(globalSnapshot);
                    }
                }
            }
            // Reset references
            dom = null;
            globalSnapshot = null;
            sandbox = null;
        },
        getSandbox: () => {
            if (!sandbox) {
                throw new Error('Test context not set up. Call setup() first.');
            }
            return sandbox;
        },
    };
}
// Fix process.removeListener issue for Mocha
if (process && !process.removeListener) {
    process.removeListener = function () {
        return process;
    };
}
// Additional process polyfills for Mocha compatibility
if (process) {
    // Ensure all required event emitter methods exist
    const requiredMethods = ['removeListener', 'removeAllListeners', 'off', 'listenerCount'];
    requiredMethods.forEach((method) => {
        if (!process[method]) {
            const stub = method === 'listenerCount'
                ? function () {
                    return 0;
                } // Return 0 listeners for test environment
                : function () {
                    return process;
                };
            try {
                Object.defineProperty(process, method, {
                    value: stub,
                    writable: true,
                    configurable: true,
                    enumerable: false,
                });
            }
            catch (e) {
                // Fallback to direct assignment if defineProperty fails
                process[method] = stub;
            }
        }
    });
}
// Sync version for backwards compatibility (without chai-as-promised)
function setupTestEnvironmentSync() {
    // Mock VS Code module
    global.vscode = exports.mockVscode;
    // CRITICAL: Register vscode mock in require.cache so that `import * as vscode from 'vscode'` returns the mock
    // This fixes ConfigurationService and other modules that import vscode directly
    const Module = require('module');
    try {
        const vscodeModulePath = require.resolve('vscode', { paths: [process.cwd()] });
        require.cache[vscodeModulePath] = {
            id: vscodeModulePath,
            filename: vscodeModulePath,
            loaded: true,
            exports: exports.mockVscode,
        };
    }
    catch (e) {
        // vscode module not found in require.resolve, will be handled by Module.prototype.require override
    }
    // Register mocks in require.cache where possible
    const mockNodePtySync = {
        spawn: () => ({
            write: () => { },
            resize: () => { },
            kill: () => { },
            dispose: () => { },
        }),
    };
    // Register node-pty mock in cache
    try {
        const ptyPath = require.resolve('node-pty', { paths: [process.cwd()] });
        require.cache[ptyPath] = {
            id: ptyPath,
            filename: ptyPath,
            loaded: true,
            exports: mockNodePtySync,
        };
    }
    catch (e) {
        // Module not found, skip
    }
    // Minimal hook ONLY for 'vscode' module (which has no physical file to cache)
    // CRITICAL: Store original require for restoration in teardownTestEnvironment
    if (!moduleRequireOverridden) {
        originalModuleRequire = Module.prototype.require;
        moduleRequireOverridden = true;
    }
    const savedOriginalRequireSync = originalModuleRequire || Module.prototype.require;
    Module.prototype.require = function (id) {
        if (id === 'vscode') {
            return exports.mockVscode;
        }
        // All other modules pass through to original require (preserves nyc instrumentation)
        return savedOriginalRequireSync.apply(this, arguments);
    };
    // Set up DOM environment
    setupJSDOMEnvironment(); // Re-enabled - tests need DOM for UIController, WebView, etc.
    setupConsoleMocks(); // Re-enabled with pass-through implementation
    // Ensure process.cwd exists and is callable
    // Note: setup-exit-handler.js should have already wrapped process.cwd,
    // but we double-check here in case it wasn't loaded first
    if (!process.cwd || typeof process.cwd !== 'function') {
        const fallbackCwd = () => '/test';
        try {
            Object.defineProperty(process, 'cwd', {
                value: fallbackCwd,
                writable: true,
                configurable: true,
                enumerable: false,
            });
        }
        catch (e) {
            process.cwd = fallbackCwd;
        }
    }
    // Ensure process.memoryUsage exists for memory leak tests
    if (!process.memoryUsage || typeof process.memoryUsage !== 'function') {
        process.memoryUsage = () => ({
            heapUsed: 50 * 1024 * 1024, // 50MB
            heapTotal: 100 * 1024 * 1024, // 100MB
            external: 10 * 1024 * 1024, // 10MB
            rss: 150 * 1024 * 1024, // 150MB
            arrayBuffers: 5 * 1024 * 1024, // 5MB
        });
    }
    // Ensure process.emit exists for EventEmitter compatibility
    if (!process.emit || typeof process.emit !== 'function') {
        process.emit = () => false;
    }
}
// Auto-setup when this module is imported (sync version for compatibility)
try {
    setupTestEnvironmentSync();
}
catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
}
/**
 * TypeScript型定義の拡張
 * テスト環境で使用するグローバル変数の型を定義
 */
//# sourceMappingURL=TestSetup.js.map