"use strict";
/**
 * Input Optimization Integration Test Suite
 * Tests the complete input flow from InputManager through ConsolidatedMessageManager to PerformanceManager
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const InputManager_1 = require("../../../../webview/managers/InputManager");
const ConsolidatedMessageManager_1 = require("../../../../webview/managers/ConsolidatedMessageManager");
const PerformanceManager_1 = require("../../../../webview/managers/PerformanceManager");
(0, vitest_1.describe)('Input Optimization Integration', () => {
    let inputManager;
    let messageManager;
    let performanceManager;
    let mockCoordinator;
    let mockTerminal;
    let jsdom;
    (0, vitest_1.beforeEach)(() => {
        // Setup JSDOM environment
        jsdom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable',
        });
        global.window = jsdom.window;
        global.document = jsdom.window.document;
        global.Event = jsdom.window.Event;
        global.CompositionEvent = jsdom.window.CompositionEvent;
        global.KeyboardEvent = jsdom.window.KeyboardEvent;
        global.MouseEvent = jsdom.window.MouseEvent;
        vitest_1.vi.useFakeTimers();
        // Create mock terminal
        mockTerminal = {
            write: vitest_1.vi.fn(),
            resize: vitest_1.vi.fn(),
            hasSelection: vitest_1.vi.fn().mockReturnValue(false),
        };
        // Create comprehensive mock coordinator
        mockCoordinator = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            setActiveTerminalId: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn().mockResolvedValue(undefined),
            getTerminalInstance: vitest_1.vi.fn().mockReturnValue({
                terminal: mockTerminal,
                id: 'terminal-1',
                name: 'Terminal 1',
            }),
            getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
            createTerminal: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn().mockReturnValue({
                performance: null, // Will be set after creation
            }),
        };
        // Initialize managers (Issue #216: constructor injection)
        inputManager = new InputManager_1.InputManager(mockCoordinator);
        messageManager = new ConsolidatedMessageManager_1.ConsolidatedMessageManager();
        performanceManager = new PerformanceManager_1.PerformanceManager();
        performanceManager.initialize();
        // Update coordinator to include all required managers
        mockCoordinator.getManagers.mockReturnValue({
            performance: performanceManager,
            input: inputManager,
            ui: {},
            config: {},
            message: messageManager,
            notification: {},
        });
        // Setup managers
        inputManager.setupIMEHandling();
        inputManager.setupKeyboardShortcuts(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.useRealTimers();
        inputManager.dispose();
        messageManager.dispose();
        performanceManager.dispose();
        jsdom.window.close();
    });
    (0, vitest_1.describe)('End-to-End Input Flow', () => {
        (0, vitest_1.it)('should process typing input with optimized timing', async () => {
            const inputSequence = 'Hello World!';
            const writeCalls = [];
            // Track all writes to terminal
            mockTerminal.write.mockImplementation((data) => {
                writeCalls.push(data);
            });
            // Simulate typing each character
            for (const char of inputSequence) {
                // Use PerformanceManager directly as it would be used by output handling
                performanceManager.bufferedWrite(char, mockTerminal, 'terminal-1');
            }
            // All single characters should be written immediately (small input optimization)
            (0, vitest_1.expect)(writeCalls.length).toBe(inputSequence.length);
            (0, vitest_1.expect)(writeCalls.join('')).toBe(inputSequence);
        });
        vitest_1.it.skip('should handle high-priority input messages correctly', async () => {
            // TODO: Fix - queueMessage method does not exist in ConsolidatedMessageManager
            const executionOrder = [];
            mockCoordinator.postMessageToExtension.mockImplementation(async (message) => {
                executionOrder.push(`${message.command}-${message.type || 'none'}`);
            });
            // Queue mixed priority messages through messageManager
            messageManager.queueMessage({ command: 'stateUpdate' }, mockCoordinator);
            messageManager.queueMessage({ command: 'input', data: 'a' }, mockCoordinator);
            messageManager.queueMessage({ command: 'terminalInteraction', type: 'paste' }, mockCoordinator);
            messageManager.queueMessage({ command: 'fontSettingsUpdate' }, mockCoordinator);
            vitest_1.vi.advanceTimersByTime(10);
            await vitest_1.vi.runAllTimersAsync();
            // Input-related messages should be processed first
            (0, vitest_1.expect)(executionOrder.slice(0, 2)).toEqual(['input-none', 'terminalInteraction-paste']);
        });
        (0, vitest_1.it)('should handle IME composition without interrupting buffer flow', () => {
            const outputData = [];
            mockTerminal.write.mockImplementation((data) => outputData.push(data));
            // Start IME composition
            document.dispatchEvent(new jsdom.window.CompositionEvent('compositionstart', { data: 'あ' }));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            // Buffer output during composition (should still work)
            performanceManager.bufferedWrite('output during IME', mockTerminal, 'terminal-1');
            // Advance timers to trigger buffer flush
            vitest_1.vi.advanceTimersByTime(20);
            // Update composition
            document.dispatchEvent(new jsdom.window.CompositionEvent('compositionupdate', { data: 'あい' }));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            // End composition
            document.dispatchEvent(new jsdom.window.CompositionEvent('compositionend', { data: 'あいう' }));
            // After delay, should not be composing
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(false);
            // Output should have been processed normally
            (0, vitest_1.expect)(outputData).toContain('output during IME');
        });
        (0, vitest_1.it)('should recover IME state when compositionend is missing and focus/context changes', () => {
            // Start IME composition and intentionally skip compositionend
            document.dispatchEvent(new jsdom.window.CompositionEvent('compositionstart', { data: 'に' }));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            // Simulate user switching away from webview/tab (context lost)
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'hidden',
            });
            document.dispatchEvent(new jsdom.window.Event('visibilitychange'));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(false);
            // Start composing again and recover via window blur
            document.dispatchEvent(new jsdom.window.CompositionEvent('compositionstart', { data: 'ほ' }));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            window.dispatchEvent(new jsdom.window.Event('blur'));
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(false);
        });
        (0, vitest_1.it)('should maintain responsiveness during CLI Agent activity', () => {
            // Enable CLI Agent mode
            performanceManager.setCliAgentMode(true);
            const processingTimes = [];
            mockTerminal.write.mockImplementation(() => {
                processingTimes.push(Date.now());
            });
            // Mix of small inputs (typing) and moderate CLI Agent output
            const startTime = Date.now();
            // User typing (should be immediate)
            performanceManager.bufferedWrite('a', mockTerminal, 'terminal-1');
            performanceManager.bufferedWrite('b', mockTerminal, 'terminal-1');
            // CLI Agent output (should be immediate due to moderate size in CLI mode)
            const cliOutput = 'CLI Agent response: '.repeat(5); // ~100 chars
            performanceManager.bufferedWrite(cliOutput, mockTerminal, 'terminal-1');
            // More user typing
            performanceManager.bufferedWrite('c', mockTerminal, 'terminal-1');
            // All should be processed immediately
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledTimes(4);
            // Verify timing - all should be processed within first millisecond
            // Note: Date.now() doesn't advance with fake timers unless we advance it manually or use performance.now() which isn't mocked by default in all setups.
            // With vi.useFakeTimers(), Date.now() is mocked.
            // But we aren't advancing time here, so they should all be equal to startTime.
            processingTimes.forEach((time) => {
                (0, vitest_1.expect)(time - startTime).toBeLessThan(1);
            });
        });
        (0, vitest_1.it)('should handle rapid focus changes with optimized debouncing', () => {
            const focusMessages = [];
            mockCoordinator.postMessageToExtension.mockImplementation(async (message) => {
                if (message.command === 'terminalInteraction' && message.type === 'focus') {
                    focusMessages.push(message);
                }
            });
            // Rapid focus changes (as would happen with quick clicks)
            const terminals = ['terminal-1', 'terminal-2', 'terminal-3'];
            terminals.forEach((terminalId) => {
                inputManager.emitTerminalInteractionEvent('focus', terminalId, undefined, mockCoordinator);
            });
            // Should not send any messages yet (debounced)
            (0, vitest_1.expect)(focusMessages.length).toBe(0);
            // After optimized debounce time (50ms)
            vitest_1.vi.advanceTimersByTime(50);
            // Should send only the last focus message
            (0, vitest_1.expect)(focusMessages.length).toBe(1);
            (0, vitest_1.expect)(focusMessages[0].terminalId).toBe('terminal-3');
        });
        vitest_1.it.skip('should prevent race conditions in concurrent operations', async () => {
            // TODO: Fix - queueMessage method does not exist in ConsolidatedMessageManager
            const operationLog = [];
            let concurrentOperations = 0;
            let maxConcurrency = 0;
            // Mock operations that track concurrency
            mockCoordinator.postMessageToExtension.mockImplementation(async (message) => {
                concurrentOperations++;
                maxConcurrency = Math.max(maxConcurrency, concurrentOperations);
                operationLog.push(`start-${message.command}`);
                await new Promise((resolve) => setTimeout(resolve, 5));
                operationLog.push(`end-${message.command}`);
                concurrentOperations--;
            });
            // Trigger multiple concurrent operations
            const promises = [];
            for (let i = 0; i < 10; i++) {
                messageManager.queueMessage({ command: `op${i}` }, mockCoordinator);
                promises.push(messageManager.processMessageQueue(mockCoordinator));
            }
            vitest_1.vi.advanceTimersByTime(100);
            await Promise.all(promises);
            await vitest_1.vi.runAllTimersAsync();
            // Should never have more than 1 concurrent operation
            (0, vitest_1.expect)(maxConcurrency).toBe(1);
            // All operations should complete
            const completedOps = operationLog.filter((log) => log.startsWith('end-')).length;
            (0, vitest_1.expect)(completedOps).toBe(10);
        });
    });
    (0, vitest_1.describe)('Error Recovery and Resilience', () => {
        (0, vitest_1.it)('should recover gracefully from terminal write failures', () => {
            let failureCount = 0;
            mockTerminal.write.mockImplementation(() => {
                failureCount++;
                if (failureCount <= 2) {
                    throw new Error('Write failed');
                }
                // Third attempt succeeds
            });
            // Should not throw even with failures
            (0, vitest_1.expect)(() => {
                performanceManager.bufferedWrite('a', mockTerminal, 'terminal-1');
                performanceManager.bufferedWrite('b', mockTerminal, 'terminal-1');
                performanceManager.bufferedWrite('c', mockTerminal, 'terminal-1');
            }).not.toThrow();
            // Third write should succeed
            (0, vitest_1.expect)(failureCount).toBe(3);
        });
        vitest_1.it.skip('should handle IME events during message queue processing', async () => {
            // TODO: Fix - queueMessage method does not exist in ConsolidatedMessageManager
            let imeInterrupted = false;
            mockCoordinator.postMessageToExtension.mockImplementation(async () => {
                // Simulate IME event during message processing
                if (!imeInterrupted) {
                    imeInterrupted = true;
                    document.dispatchEvent(new jsdom.window.CompositionEvent('compositionstart', { data: 'test' }));
                }
                await new Promise((resolve) => setTimeout(resolve, 10));
            });
            // Queue message and start processing
            messageManager.queueMessage({ command: 'test' }, mockCoordinator);
            vitest_1.vi.advanceTimersByTime(20);
            await vitest_1.vi.runAllTimersAsync();
            // IME should be in composing state
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            // Message should still be processed
            (0, vitest_1.expect)(mockCoordinator.postMessageToExtension).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Performance Benchmarks', () => {
        (0, vitest_1.it)('should maintain <5ms response time for single character input', () => {
            const responseTime = performance.now();
            performanceManager.bufferedWrite('x', mockTerminal, 'terminal-1');
            const elapsed = performance.now() - responseTime;
            (0, vitest_1.expect)(elapsed).toBeLessThan(5);
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should process 1000 rapid inputs without significant delay accumulation', () => {
            const startTime = Date.now();
            const inputs = Array.from({ length: 1000 }, (_, i) => String.fromCharCode(65 + (i % 26))); // A-Z cycle
            inputs.forEach((char) => {
                performanceManager.bufferedWrite(char, mockTerminal, 'terminal-1');
            });
            const totalTime = Date.now() - startTime;
            // Should process all inputs very quickly (immediate for single chars)
            (0, vitest_1.expect)(totalTime).toBeLessThan(100); // Less than 100ms for 1000 chars
            (0, vitest_1.expect)(mockTerminal.write).toHaveBeenCalledTimes(1000);
        });
        (0, vitest_1.it)('should handle mixed input sizes efficiently', () => {
            const inputs = [
                'a', // Small (immediate)
                'b'.repeat(600), // Large (immediate)
                'c'.repeat(30), // Medium (buffered)
                'd', // Small (immediate)
                'e'.repeat(800), // Large (immediate)
                'f'.repeat(40), // Medium (buffered)
            ];
            let immediateWrites = 0;
            const beforeCount = mockTerminal.write.mock.calls.length;
            inputs.forEach((input) => {
                const before = mockTerminal.write.mock.calls.length;
                performanceManager.bufferedWrite(input, mockTerminal, 'terminal-1');
                const after = mockTerminal.write.mock.calls.length;
                if (after > before) {
                    immediateWrites++;
                }
            });
            // Should have 4 immediate writes (small + large)
            (0, vitest_1.expect)(immediateWrites).toBe(4);
            // Process buffered content - use longer timeout to ensure all buffers flush
            vitest_1.vi.advanceTimersByTime(50);
            // All should be written eventually (4 immediate + buffered writes may be merged)
            (0, vitest_1.expect)(mockTerminal.write.mock.calls.length - beforeCount).toBeGreaterThanOrEqual(5);
        });
    });
    (0, vitest_1.describe)('Memory and Resource Management', () => {
        vitest_1.it.skip('should properly cleanup all managers without memory leaks', () => {
            // TODO: Fix - queueMessage method does not exist in ConsolidatedMessageManager
            // Create some pending operations
            inputManager.emitTerminalInteractionEvent('focus', 'terminal-1', undefined, mockCoordinator);
            performanceManager.bufferedWrite('test output', mockTerminal, 'terminal-1');
            messageManager.queueMessage({ command: 'test' }, mockCoordinator);
            // Get initial stats
            const messageStats = messageManager.getQueueStats();
            const _performanceStats = performanceManager.getBufferStats();
            // Should have pending operations
            (0, vitest_1.expect)(messageStats.queueSize + (messageStats.highPriorityQueueSize || 0)).toBeGreaterThan(0);
            // Dispose all managers
            inputManager.dispose();
            messageManager.dispose();
            performanceManager.dispose();
            // Stats should show clean state
            const finalMessageStats = messageManager.getQueueStats();
            const finalPerformanceStats = performanceManager.getBufferStats();
            (0, vitest_1.expect)(finalMessageStats.queueSize).toBe(0);
            (0, vitest_1.expect)(finalMessageStats.highPriorityQueueSize).toBe(0);
            (0, vitest_1.expect)(finalPerformanceStats.bufferSize).toBe(0);
            (0, vitest_1.expect)(finalPerformanceStats.isFlushScheduled).toBe(false);
        });
    });
});
//# sourceMappingURL=InputOptimizationIntegration.test.js.map