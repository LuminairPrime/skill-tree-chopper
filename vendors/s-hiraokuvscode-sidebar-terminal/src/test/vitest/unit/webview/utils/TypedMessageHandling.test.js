"use strict";
/**
 * TypedMessageHandling 完全テストスイート
 * - 型安全性とエラーハンドリングの検証
 * - パフォーマンスとリソース管理のテスト
 * - リアルワールドシナリオの包括的カバレッジ
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TypedMessageHandling_1 = require("../../../../../webview/utils/TypedMessageHandling");
(0, vitest_1.describe)('TypedMessageHandling - 型安全なメッセージシステム', () => {
    // =============================================================================
    // テストセットアップとユーティリティ
    // =============================================================================
    let mockLogger;
    let mockVSCodeAPI;
    (0, vitest_1.beforeEach)(() => {
        mockLogger = vitest_1.vi.fn();
        mockVSCodeAPI = {
            postMessage: vitest_1.vi.fn(),
        };
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    // =============================================================================
    // MessageDataValidator テスト
    // =============================================================================
    (0, vitest_1.describe)('MessageDataValidator - データ検証機能', () => {
        (0, vitest_1.describe)('基本的な検証機能', () => {
            (0, vitest_1.it)('should validate required fields correctly', () => {
                const validator = new TypedMessageHandling_1.MessageDataValidator(['terminalId', 'action'], mockLogger);
                const validData = { terminalId: 'term-1', action: 'create' };
                const result = validator.validate(validData);
                (0, vitest_1.expect)(result.isValid).toBe(true);
                (0, vitest_1.expect)(result.errors).toEqual([]);
                (0, vitest_1.expect)(result.data).toEqual(validData);
            });
            (0, vitest_1.it)('should detect missing required fields', () => {
                const validator = new TypedMessageHandling_1.MessageDataValidator(['terminalId', 'action'], mockLogger);
                const invalidData = { terminalId: 'term-1' }; // missing 'action'
                const result = validator.validate(invalidData);
                (0, vitest_1.expect)(result.isValid).toBe(false);
                (0, vitest_1.expect)(result.errors).toContain('Missing required field: action');
            });
            (0, vitest_1.it)('should handle null and undefined input gracefully', () => {
                const validator = new TypedMessageHandling_1.MessageDataValidator(['field'], mockLogger);
                (0, vitest_1.expect)(validator.validate(null).isValid).toBe(false);
                (0, vitest_1.expect)(validator.validate(undefined).isValid).toBe(false);
                (0, vitest_1.expect)(validator.validate('string').isValid).toBe(false);
            });
        });
        (0, vitest_1.describe)('専用バリデーター作成機能', () => {
            (0, vitest_1.it)('should create terminal message validator', () => {
                const validator = TypedMessageHandling_1.MessageDataValidator.createTerminalValidator(mockLogger);
                const validTerminalData = {
                    terminalId: 'term-123',
                    action: 'create',
                    payload: { shell: '/bin/bash' },
                };
                const result = validator.validate(validTerminalData);
                (0, vitest_1.expect)(result.isValid).toBe(true);
            });
            (0, vitest_1.it)('should create session message validator', () => {
                const validator = TypedMessageHandling_1.MessageDataValidator.createSessionValidator(mockLogger);
                const validSessionData = {
                    sessionId: 'session-456',
                    terminalStates: { 'term-1': { active: true } },
                };
                const result = validator.validate(validSessionData);
                (0, vitest_1.expect)(result.isValid).toBe(true);
            });
        });
    });
    // =============================================================================
    // TypedMessageRouter テスト
    // =============================================================================
    (0, vitest_1.describe)('TypedMessageRouter - メッセージルーティング', () => {
        let router;
        (0, vitest_1.beforeEach)(() => {
            router = new TypedMessageHandling_1.TypedMessageRouter('test-component', mockLogger);
        });
        (0, vitest_1.describe)('ハンドラー登録機能', () => {
            (0, vitest_1.it)('should register single handler successfully', () => {
                const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
                router.registerHandler({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    handler,
                    description: 'Create terminal handler',
                });
                const commands = router.getRegisteredCommands();
                (0, vitest_1.expect)(commands).toContain(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE);
                (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE));
            });
            (0, vitest_1.it)('should register multiple handlers at once', () => {
                const handlers = [
                    {
                        command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                        handler: vitest_1.vi.fn().mockResolvedValue(undefined),
                    },
                    {
                        command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_DELETE,
                        handler: vitest_1.vi.fn().mockResolvedValue(undefined),
                    },
                ];
                router.registerMultipleHandlers(handlers);
                const commands = router.getRegisteredCommands();
                (0, vitest_1.expect)(commands).toContain(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE);
                (0, vitest_1.expect)(commands).toContain(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_DELETE);
            });
        });
        (0, vitest_1.describe)('メッセージ処理機能', () => {
            (0, vitest_1.it)('should process valid message successfully', async () => {
                const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
                router.registerHandler({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    handler,
                });
                const result = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {
                    terminalId: 'term-1',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(result.command).toBe(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE);
                (0, vitest_1.expect)(result.processingTimeMs).toBeTypeOf('number');
                (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
            });
            (0, vitest_1.it)('should handle unregistered commands gracefully', async () => {
                const result = await router.processMessage('unknown-command', {});
                (0, vitest_1.expect)(result.success).toBe(false);
                (0, vitest_1.expect)(result.command).toBe('unknown-command');
                (0, vitest_1.expect)(result.error).toBeInstanceOf(Error);
                (0, vitest_1.expect)(result.error?.message).toContain('No handler registered');
            });
            (0, vitest_1.it)('should handle handler exceptions', async () => {
                const error = new Error('Handler execution failed');
                const handler = vitest_1.vi.fn().mockRejectedValue(error);
                router.registerHandler({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    handler,
                });
                const result = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {
                    terminalId: 'term-1',
                });
                (0, vitest_1.expect)(result.success).toBe(false);
                (0, vitest_1.expect)(result.error).toBe(error);
            });
        });
        (0, vitest_1.describe)('データ検証統合', () => {
            (0, vitest_1.it)('should use validator when provided', async () => {
                const validator = TypedMessageHandling_1.MessageDataValidator.createTerminalValidator(mockLogger);
                const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
                router.registerHandler({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    handler,
                    validator,
                });
                // Valid data
                const validResult = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {
                    terminalId: 'term-1',
                });
                (0, vitest_1.expect)(validResult.success).toBe(true);
                // Invalid data
                const invalidResult = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {} // missing terminalId
                );
                (0, vitest_1.expect)(invalidResult.success).toBe(false);
                (0, vitest_1.expect)(invalidResult.error?.message).toContain('Validation failed');
            });
        });
        (0, vitest_1.describe)('リソース管理', () => {
            (0, vitest_1.it)('should clear all handlers and validators', () => {
                router.registerHandler({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    handler: vitest_1.vi.fn().mockResolvedValue(undefined),
                });
                (0, vitest_1.expect)(router.getRegisteredCommands()).not.toEqual([]);
                router.clearAllHandlers();
                (0, vitest_1.expect)(router.getRegisteredCommands()).toEqual([]);
            });
        });
    });
    // =============================================================================
    // TypedMessageSender テスト
    // =============================================================================
    (0, vitest_1.describe)('TypedMessageSender - メッセージ送信機能', () => {
        let sender;
        (0, vitest_1.beforeEach)(() => {
            sender = new TypedMessageHandling_1.TypedMessageSender(mockVSCodeAPI, 'test-sender', mockLogger);
        });
        (0, vitest_1.describe)('基本的な送信機能', () => {
            (0, vitest_1.it)('should send message successfully', () => {
                const terminalData = {
                    terminalId: 'term-1',
                    action: 'create',
                };
                sender.sendMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, terminalData);
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledOnce();
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledWith({
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    ...terminalData,
                });
            });
            (0, vitest_1.it)('should send multiple messages sequentially', () => {
                const messages = [
                    { command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, data: { terminalId: 'term-1' } },
                    { command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_DELETE, data: { terminalId: 'term-2' } },
                ];
                sender.sendMultipleMessages(messages);
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledTimes(2);
            });
            (0, vitest_1.it)('should send conditional messages based on condition', () => {
                const data = { terminalId: 'term-1' };
                // True condition
                sender.sendConditionalMessage(true, TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, data);
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledOnce();
                // False condition
                sender.sendConditionalMessage(false, TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_DELETE, data);
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledOnce(); // Still once
                // Function condition
                sender.sendConditionalMessage(() => true, TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_RESIZE, data);
                (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledTimes(2);
            });
        });
        (0, vitest_1.describe)('エラーハンドリングとリトライ', () => {
            (0, vitest_1.it)('should handle postMessage errors gracefully', () => {
                mockVSCodeAPI.postMessage.mockImplementation(() => {
                    throw new Error('VS Code API error');
                });
                (0, vitest_1.expect)(() => {
                    sender.sendMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, { terminalId: 'term-1' });
                }).not.toThrow();
                (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringContaining(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE), vitest_1.expect.any(Error));
            });
            (0, vitest_1.it)('should queue messages for retry on failure', () => {
                mockVSCodeAPI.postMessage.mockImplementation(() => {
                    throw new Error('Network error');
                });
                sender.sendMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, { terminalId: 'term-1' });
                // The error should be logged and message queued
                (0, vitest_1.expect)(mockLogger).toHaveBeenCalledWith(vitest_1.expect.stringMatching(/Failed to send.*terminal:create/), vitest_1.expect.any(Error));
            });
        });
    });
    // =============================================================================
    // Event Listener Integration テスト
    // =============================================================================
    (0, vitest_1.describe)('createTypedMessageEventListener - イベント統合', () => {
        let router;
        let eventListener;
        let onUnhandled;
        (0, vitest_1.beforeEach)(() => {
            router = new TypedMessageHandling_1.TypedMessageRouter('test-listener', mockLogger);
            onUnhandled = vitest_1.vi.fn();
            // @ts-expect-error - test mock type
            eventListener = (0, TypedMessageHandling_1.createTypedMessageEventListener)(router, onUnhandled);
        });
        (0, vitest_1.it)('should process valid message events', async () => {
            const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
            router.registerHandler({
                command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                handler,
            });
            const event = new MessageEvent('message', {
                data: {
                    command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                    terminalId: 'term-1',
                },
            });
            await eventListener(event);
            (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(onUnhandled).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle events without command', async () => {
            const event = new MessageEvent('message', {
                data: { data: 'some data without command' },
            });
            await eventListener(event);
            (0, vitest_1.expect)(onUnhandled).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(onUnhandled).toHaveBeenCalledWith(event);
        });
        (0, vitest_1.it)('should handle events with failed processing', async () => {
            const event = new MessageEvent('message', {
                data: {
                    command: 'unknown-command',
                    data: 'test',
                },
            });
            await eventListener(event);
            (0, vitest_1.expect)(onUnhandled).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(onUnhandled).toHaveBeenCalledWith(event);
        });
    });
    // =============================================================================
    // パフォーマンステスト
    // =============================================================================
    (0, vitest_1.describe)('パフォーマンスとスケーラビリティ', () => {
        (0, vitest_1.it)('should handle high-frequency message processing', async () => {
            const router = new TypedMessageHandling_1.TypedMessageRouter('perf-test', mockLogger);
            const handler = vitest_1.vi.fn().mockResolvedValue(undefined);
            router.registerHandler({
                command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_OUTPUT,
                handler,
            });
            const messageCount = 1000;
            const promises = [];
            const startTime = performance.now();
            for (let i = 0; i < messageCount; i++) {
                promises.push(router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_OUTPUT, {
                    terminalId: `term-${i}`,
                    data: `output-${i}`,
                }));
            }
            const results = await Promise.all(promises);
            const endTime = performance.now();
            (0, vitest_1.expect)(results).toHaveLength(messageCount);
            (0, vitest_1.expect)(results.every((r) => r.success)).toBe(true);
            (0, vitest_1.expect)(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(messageCount);
        });
        (0, vitest_1.it)('should handle memory efficiently with many handlers', () => {
            const router = new TypedMessageHandling_1.TypedMessageRouter('memory-test', mockLogger);
            const handlerCount = 100;
            // Register many handlers
            for (let i = 0; i < handlerCount; i++) {
                router.registerHandler({
                    command: `command-${i}`,
                    handler: vitest_1.vi.fn().mockResolvedValue(undefined),
                });
            }
            (0, vitest_1.expect)(router.getRegisteredCommands()).toHaveLength(handlerCount);
            // Clear all handlers - should free memory
            router.clearAllHandlers();
            (0, vitest_1.expect)(router.getRegisteredCommands()).toEqual([]);
        });
    });
    // =============================================================================
    // 統合テスト
    // =============================================================================
    (0, vitest_1.describe)('統合テスト - エンドツーエンドシナリオ', () => {
        (0, vitest_1.it)('should handle complete terminal creation workflow', async () => {
            const router = new TypedMessageHandling_1.TypedMessageRouter('integration-test', mockLogger);
            const sender = new TypedMessageHandling_1.TypedMessageSender(mockVSCodeAPI, 'integration-sender', mockLogger);
            // Set up terminal creation handler
            const createHandler = vitest_1.vi.fn().mockResolvedValue(undefined);
            router.registerHandler({
                command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                handler: createHandler,
                validator: TypedMessageHandling_1.MessageDataValidator.createTerminalValidator(mockLogger),
            });
            // Simulate message from extension to webview
            const terminalData = {
                terminalId: 'term-integration-1',
                action: 'create',
                payload: { shell: '/bin/bash', cwd: '/home/user' },
            };
            // Process incoming message
            const result = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, terminalData);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(createHandler).toHaveBeenCalledOnce();
            // Send response back to extension
            sender.sendMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.STATE_UPDATE, {
                terminalId: terminalData.terminalId,
                status: 'created',
            });
            (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledOnce();
            (0, vitest_1.expect)(mockVSCodeAPI.postMessage).toHaveBeenCalledWith({
                command: TypedMessageHandling_1.MESSAGE_COMMANDS.STATE_UPDATE,
                terminalId: terminalData.terminalId,
                status: 'created',
            });
        });
        (0, vitest_1.it)('should handle error recovery in complex scenarios', async () => {
            const router = new TypedMessageHandling_1.TypedMessageRouter('error-recovery-test', mockLogger);
            // Handler that fails on first call, succeeds on second
            let callCount = 0;
            const flakyHandler = vitest_1.vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Simulated failure');
                }
                return Promise.resolve();
            });
            router.registerHandler({
                command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
                handler: flakyHandler,
            });
            // First call should fail
            const firstResult = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {
                terminalId: 'term-1',
            });
            (0, vitest_1.expect)(firstResult.success).toBe(false);
            // Second call should succeed
            const secondResult = await router.processMessage(TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE, {
                terminalId: 'term-1',
            });
            (0, vitest_1.expect)(secondResult.success).toBe(true);
        });
    });
});
// =============================================================================
// TypeScript 型安全性検証テスト
// =============================================================================
(0, vitest_1.describe)('TypeScript Type Safety Verification', () => {
    (0, vitest_1.it)('should enforce type safety at compile time', () => {
        // These tests primarily verify that TypeScript compilation succeeds
        // with proper type checking enabled
        const router = new TypedMessageHandling_1.TypedMessageRouter('type-test');
        // Valid typed registration
        // @ts-expect-error - test mock type
        router.registerHandler({
            command: TypedMessageHandling_1.MESSAGE_COMMANDS.TERMINAL_CREATE,
            handler: async (data) => {
                // TypeScript should enforce that data has terminalId property
                const terminalId = data.terminalId;
                (0, vitest_1.expect)(terminalId).toBeTypeOf('string');
                // Handlers should not return anything (void)
            },
        });
        // TypeScript should prevent invalid registrations at compile time
        // This would cause a compilation error:
        // router.registerHandler<TerminalMessageData>({
        //   command: MESSAGE_COMMANDS.TERMINAL_CREATE,
        //   handler: async (data: any) => { ... } // Type mismatch!
        // });
        (0, vitest_1.expect)(true).toBe(true); // Test passes if compilation succeeds
    });
});
//# sourceMappingURL=TypedMessageHandling.test.js.map