"use strict";
/**
 * MessageBridge Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
require("../../../../shared/TestSetup");
const MessageBridge_1 = require("../../../../../providers/secondaryTerminal/MessageBridge");
(0, vitest_1.describe)('MessageBridge', () => {
    let extensionContext;
    let bridge;
    (0, vitest_1.beforeEach)(() => {
        extensionContext = {
            subscriptions: [],
        };
        bridge = new MessageBridge_1.MessageBridge(extensionContext, vitest_1.vi.fn());
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.it)('forwards validated messages to the handler', async () => {
        const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
        const validatorSpy = vitest_1.vi.fn();
        const validator = (message) => {
            validatorSpy(message);
            return true;
        };
        let capturedListener;
        const disposable = { dispose: vitest_1.vi.fn() };
        const mockWebviewView = {
            webview: {
                onDidReceiveMessage: (listener) => {
                    capturedListener = listener;
                    return disposable;
                },
            },
        };
        bridge.register(mockWebviewView, validator, handler);
        (0, vitest_1.expect)(extensionContext.subscriptions).toHaveLength(1);
        (0, vitest_1.expect)(extensionContext.subscriptions[0]).toBe(disposable);
        await capturedListener?.({ command: 'input' });
        (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(validatorSpy).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('ignores messages that fail validation', async () => {
        const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
        const validatorSpy = vitest_1.vi.fn();
        const validator = (message) => {
            validatorSpy(message);
            return false;
        };
        let capturedListener;
        const mockWebviewView = {
            webview: {
                onDidReceiveMessage: (listener) => {
                    capturedListener = listener;
                    return { dispose: vitest_1.vi.fn() };
                },
            },
        };
        bridge.register(mockWebviewView, validator, handler);
        await capturedListener?.({ command: 'input' });
        (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=MessageBridge.test.js.map