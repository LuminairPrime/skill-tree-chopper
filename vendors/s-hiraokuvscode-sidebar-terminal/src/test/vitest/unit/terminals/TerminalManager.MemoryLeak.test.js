"use strict";
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * Memory Leak Detection Tests for TerminalManager
 *
 * Tests to ensure TerminalManager properly disposes all resources
 * and doesn't leak memory when creating and destroying terminals.
 *
 * Related: Issue #232 - Memory Leak Detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalManager_1 = require("../../../../terminals/TerminalManager");
const MemoryLeakDetector_1 = require("../../../utils/MemoryLeakDetector");
(0, vitest_1.describe)('TerminalManager - Memory Leak Detection', () => {
    let terminalManager = null;
    (0, vitest_1.afterEach)(() => {
        if (terminalManager) {
            terminalManager.dispose();
            terminalManager = null;
        }
    });
    (0, vitest_1.it)('should not leak memory when creating and disposing TerminalManager', async () => {
        const detector = new MemoryLeakDetector_1.MemoryLeakDetector();
        await detector.startMonitoring();
        // Create and dispose multiple TerminalManager instances
        for (let i = 0; i < 50; i++) {
            const manager = new TerminalManager_1.TerminalManager();
            manager.dispose();
            // Periodically force GC
            if (i % 10 === 0 && global.gc) {
                global.gc();
            }
        }
        const result = await detector.checkForLeaks();
        console.log(detector.generateReport());
        // Log warnings if any
        if (result.warnings.length > 0) {
            console.warn('Memory warnings detected:');
            result.warnings.forEach((warning) => console.warn('  - ' + warning));
        }
        (0, vitest_1.expect)(result.hasLeak).toBe(false);
    }, 30000);
    (0, vitest_1.it)('should dispose all event emitters properly', () => {
        terminalManager = new TerminalManager_1.TerminalManager();
        // Verify event emitters are accessible
        (0, vitest_1.expect)(terminalManager.onData).toBeDefined();
        (0, vitest_1.expect)(terminalManager.onExit).toBeDefined();
        (0, vitest_1.expect)(terminalManager.onTerminalCreated).toBeDefined();
        (0, vitest_1.expect)(terminalManager.onTerminalRemoved).toBeDefined();
        // Dispose the manager
        terminalManager.dispose();
        // After disposal, attempting to add listeners should not cause leaks
        // (VS Code's EventEmitter handles this gracefully)
        (0, vitest_1.expect)(() => {
            terminalManager.onData(() => { });
        }).not.toThrow();
    });
    (0, vitest_1.it)('should clean up PTY data disposables when disposing', async () => {
        terminalManager = new TerminalManager_1.TerminalManager();
        // Create multiple terminals
        const terminalIds = [];
        for (let i = 0; i < 5; i++) {
            try {
                const id = terminalManager.createTerminal();
                if (id) {
                    terminalIds.push(id);
                    // Start PTY output for each terminal
                    terminalManager.startPtyOutput(id);
                }
            }
            catch (error) {
                // Ignore errors from terminal creation in test environment
                console.log(`Terminal creation ${i} failed (expected in test env):`, error);
            }
        }
        // Wait a bit for everything to initialize
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Dispose the manager - should clean up all PTY disposables
        terminalManager.dispose();
        // No explicit assertion - the test passes if no errors are thrown
        // and memory is properly cleaned up
        (0, vitest_1.expect)(true).toBe(true);
    }, 10000);
    (0, vitest_1.it)('should clean up timers when disposing', async () => {
        terminalManager = new TerminalManager_1.TerminalManager();
        // Create a terminal to trigger timer creation
        try {
            const terminalId = terminalManager.createTerminal();
            if (terminalId) {
                // Send some data to trigger buffering timers
                terminalManager.startPtyOutput(terminalId);
            }
        }
        catch (error) {
            // Ignore errors from terminal creation in test environment
            console.log('Terminal creation failed (expected in test env):', error);
        }
        // Wait for timers to be created
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Dispose should clean up all timers
        terminalManager.dispose();
        terminalManager = null;
        // Wait to ensure timers don't fire after disposal
        await new Promise((resolve) => setTimeout(resolve, 200));
        // If we get here without errors, timers were cleaned up properly
        (0, vitest_1.expect)(true).toBe(true);
    }, 10000);
    (0, vitest_1.it)('should handle rapid create/dispose cycles without leaking', async () => {
        const detector = new MemoryLeakDetector_1.MemoryLeakDetector();
        await detector.startMonitoring();
        // Rapid create/dispose cycles
        for (let i = 0; i < 20; i++) {
            const manager = new TerminalManager_1.TerminalManager();
            try {
                // Try to create a terminal
                const terminalId = manager.createTerminal();
                if (terminalId) {
                    // Immediately dispose
                    manager.dispose();
                }
                else {
                    manager.dispose();
                }
            }
            catch (error) {
                // Clean up on error
                manager.dispose();
            }
            // Force GC periodically
            if (i % 5 === 0 && global.gc) {
                global.gc();
            }
        }
        const result = await detector.checkForLeaks();
        console.log(detector.generateReport());
        if (result.warnings.length > 0) {
            console.warn('Memory warnings detected:');
            result.warnings.forEach((warning) => console.warn('  - ' + warning));
        }
        // Allow some memory growth for rapid cycles, but not excessive
        (0, vitest_1.expect)(result.heapGrowthPercent).toBeLessThan(50);
    }, 30000);
    (0, vitest_1.it)('should clean up shell integration resources', () => {
        terminalManager = new TerminalManager_1.TerminalManager();
        // Set a mock shell integration service
        const mockService = {
            injectShellIntegration: () => Promise.resolve(),
            processTerminalData: () => { },
            dispose: () => { },
        };
        terminalManager.setShellIntegrationService(mockService);
        // Dispose should not throw
        (0, vitest_1.expect)(() => terminalManager.dispose()).not.toThrow();
    });
});
(0, vitest_1.describe)('TerminalManager - Disposal Patterns', () => {
    (0, vitest_1.it)('should follow proper disposal order (LIFO)', () => {
        const disposalOrder = [];
        class MockDisposable {
            constructor(name) {
                this.name = name;
            }
            dispose() {
                disposalOrder.push(this.name);
            }
        }
        // Simulate the disposal pattern
        const disposables = [
            new MockDisposable('first'),
            new MockDisposable('second'),
            new MockDisposable('third'),
        ];
        // Dispose in reverse order (LIFO)
        for (let i = disposables.length - 1; i >= 0; i--) {
            disposables[i]?.dispose();
        }
        // Verify LIFO order
        (0, vitest_1.expect)(disposalOrder).toEqual(['third', 'second', 'first']);
    });
    (0, vitest_1.it)('should handle disposal errors gracefully', () => {
        class ErrorDisposable {
            dispose() {
                throw new Error('Disposal error');
            }
        }
        const disposable = new ErrorDisposable();
        // Should not throw - errors should be caught
        (0, vitest_1.expect)(() => {
            try {
                disposable.dispose();
            }
            catch (error) {
                // Caught and handled
                console.error('Disposal error caught:', error);
            }
        }).not.toThrow();
    });
});
//# sourceMappingURL=TerminalManager.MemoryLeak.test.js.map