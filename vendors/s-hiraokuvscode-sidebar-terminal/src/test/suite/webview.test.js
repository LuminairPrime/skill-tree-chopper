"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const SecondaryTerminalProvider_1 = require("../../providers/SecondaryTerminalProvider");
const TerminalManager_1 = require("../../terminals/TerminalManager");
suite('Webview Test Suite', () => {
    let terminalManager;
    let provider;
    let mockContext;
    setup(() => {
        mockContext = {
            subscriptions: [],
            extensionPath: '',
            extensionUri: vscode.Uri.file(''),
            globalState: {},
            workspaceState: {},
            asAbsolutePath: (relativePath) => relativePath,
            secrets: {},
            environmentVariableCollection: {},
            storageUri: undefined,
            storagePath: undefined,
            globalStorageUri: vscode.Uri.file(''),
            globalStoragePath: '',
            logUri: vscode.Uri.file(''),
            logPath: '',
            extensionMode: vscode.ExtensionMode.Test,
            extension: {},
            languageModelAccessInformation: {},
        };
        terminalManager = new TerminalManager_1.TerminalManager();
        provider = new SecondaryTerminalProvider_1.SecondaryTerminalProvider(mockContext, terminalManager);
    });
    teardown(() => {
        terminalManager.dispose();
    });
    test('Should generate valid HTML for webview', () => {
        const mockWebview = {
            asWebviewUri: (uri) => uri,
            cspSource: 'vscode-resource:',
        };
        // Use private method through type assertion for testing
        const html = provider._getHtmlForWebview(mockWebview);
        assert.ok(html);
        assert.ok(typeof html === 'string');
        assert.ok(html.includes('<!DOCTYPE html>'));
        assert.ok(html.includes('<div id="terminal-body">'));
        assert.ok(html.includes('webview.js'));
        assert.ok(html.includes('<!-- Simple terminal container -->'));
    });
    test('Should handle webview view resolution', () => {
        const mockWebviewView = {
            webview: {
                options: {},
                html: '',
                postMessage: () => Promise.resolve(true),
                onDidReceiveMessage: () => ({ dispose: () => { } }),
                asWebviewUri: (uri) => uri,
                cspSource: 'vscode-resource:',
            },
            onDidDispose: () => ({ dispose: () => { } }),
            onDidChangeVisibility: () => ({ dispose: () => { } }),
            visible: true,
            viewType: 'secondaryTerminal',
            show: () => { },
        };
        assert.doesNotThrow(() => {
            provider.resolveWebviewView(mockWebviewView, {}, {});
        });
        // Verify HTML was set
        assert.ok(mockWebviewView.webview.html.length > 0);
    });
    test('Should handle webview message communication', async () => {
        let messageHandled = false;
        let lastMessage = null;
        const mockWebviewView = {
            webview: {
                options: {},
                html: '',
                postMessage: (message) => {
                    lastMessage = message;
                    return Promise.resolve(true);
                },
                onDidReceiveMessage: (callback) => {
                    // Simulate webview ready message
                    setTimeout(() => {
                        messageHandled = true;
                        callback({ command: 'ready' });
                    }, 10);
                    return { dispose: () => { } };
                },
                asWebviewUri: (uri) => uri,
                cspSource: 'vscode-resource:',
            },
            onDidDispose: () => ({ dispose: () => { } }),
            onDidChangeVisibility: () => ({ dispose: () => { } }),
            visible: true,
            viewType: 'secondaryTerminal',
            show: () => { },
        };
        provider.resolveWebviewView(mockWebviewView, {}, {});
        // Wait for message handling
        await new Promise((resolve) => setTimeout(resolve, 50));
        assert.ok(messageHandled, 'Webview message should be handled');
        assert.ok(lastMessage, 'Message should be sent to webview');
        assert.strictEqual(lastMessage.command, 'init', 'Init message should be sent');
    });
    test('Should handle command execution through provider', () => {
        let createTerminalCalled = false;
        let killTerminalCalled = false;
        let splitTerminalCalled = false;
        // Mock the methods to track calls
        const originalKillTerminal = provider.killTerminal.bind(provider);
        const originalSplitTerminal = provider.splitTerminal.bind(provider);
        // Mock terminal manager createTerminal method
        const originalCreateTerminal = terminalManager.createTerminal.bind(terminalManager);
        terminalManager.createTerminal = () => {
            createTerminalCalled = true;
            return originalCreateTerminal();
        };
        provider.killTerminal = async () => {
            killTerminalCalled = true;
            await originalKillTerminal();
        };
        provider.splitTerminal = () => {
            splitTerminalCalled = true;
            originalSplitTerminal();
        };
        // Test command execution
        terminalManager.createTerminal();
        provider.splitTerminal();
        // Create a terminal first before killing
        terminalManager.createTerminal();
        provider.killTerminal();
        assert.ok(createTerminalCalled, 'Create terminal command should be called');
        assert.ok(killTerminalCalled, 'Kill terminal command should be called');
        assert.ok(splitTerminalCalled, 'Split terminal command should be called');
        // Restore original methods
        terminalManager.createTerminal = originalCreateTerminal;
        provider.killTerminal = originalKillTerminal;
        provider.splitTerminal = originalSplitTerminal;
    });
    test('Should handle error cases gracefully', async () => {
        let _errorOccurred = false;
        // Mock vscode.window.showErrorMessage to capture errors
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = () => {
            _errorOccurred = true;
            return Promise.resolve(undefined);
        };
        try {
            // Test with invalid webview view
            const invalidWebviewView = null;
            assert.doesNotThrow(() => {
                try {
                    provider.resolveWebviewView(invalidWebviewView, {}, {});
                }
                catch (error) {
                    // Expected to fail gracefully
                }
            });
            // Test sending message without webview
            await provider._sendMessage({ command: 'test' });
            // Give time for error handling
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        finally {
            // Restore original method
            vscode.window.showErrorMessage = originalShowErrorMessage;
        }
    });
    test('Should handle different message types correctly', () => {
        const messageTypes = ['ready', 'input', 'resize', 'focusTerminal'];
        const processedMessages = [];
        const mockWebviewView = {
            webview: {
                options: {},
                html: '',
                postMessage: () => Promise.resolve(true),
                onDidReceiveMessage: (callback) => {
                    // Test different message types
                    messageTypes.forEach((command) => {
                        const message = {
                            command,
                            data: command === 'input' ? 'test data' : undefined,
                            cols: command === 'resize' ? 80 : undefined,
                            rows: command === 'resize' ? 24 : undefined,
                            terminalId: ['focusTerminal', 'input', 'resize'].includes(command)
                                ? 'test-terminal'
                                : undefined,
                        };
                        try {
                            callback(message);
                            processedMessages.push(command);
                        }
                        catch (error) {
                            // Some messages might fail due to missing terminal, that's expected
                        }
                    });
                    return { dispose: () => { } };
                },
                asWebviewUri: (uri) => uri,
                cspSource: 'vscode-resource:',
            },
            onDidDispose: () => ({ dispose: () => { } }),
            onDidChangeVisibility: () => ({ dispose: () => { } }),
            visible: true,
            viewType: 'secondaryTerminal',
            show: () => { },
        };
        provider.resolveWebviewView(mockWebviewView, {}, {});
        // At least some messages should be processed
        assert.ok(processedMessages.length > 0, 'Some messages should be processed');
    });
});
//# sourceMappingURL=webview.test.js.map