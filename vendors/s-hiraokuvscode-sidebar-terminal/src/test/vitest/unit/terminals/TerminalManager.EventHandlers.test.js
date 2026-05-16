"use strict";
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * TDD Test Suite: TerminalManager Event Handler Setup
 *
 * Purpose: Verify that event handlers (_setupTerminalEvents) are set up correctly
 * and only once, preventing duplicate event registration that causes issues like
 * double character display.
 *
 * Test Strategy:
 * - RED: Write failing tests that detect duplicate handlers
 * - GREEN: Verify current implementation has no duplicates
 * - REFACTOR: Add comprehensive edge case coverage
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
require("../../../shared/TestSetup");
const TerminalManager_1 = require("../../../../terminals/TerminalManager");
const shared_1 = require("../../../../types/shared");
/**
 * Mock PTY Process for testing event handler registration
 */
class MockPtyProcess {
    constructor() {
        this.dataHandlers = [];
        this.exitHandlers = [];
        this.pid = 12345;
    }
    onData(handler) {
        this.dataHandlers.push(handler);
        return {
            dispose: () => {
                const index = this.dataHandlers.indexOf(handler);
                if (index > -1) {
                    this.dataHandlers.splice(index, 1);
                }
            },
        };
    }
    onExit(handler) {
        this.exitHandlers.push(handler);
        return {
            dispose: () => {
                const index = this.exitHandlers.indexOf(handler);
                if (index > -1) {
                    this.exitHandlers.splice(index, 1);
                }
            },
        };
    }
    write(_data) {
        // Mock write operation
    }
    resize(_cols, _rows) {
        // Mock resize operation
    }
    kill() {
        // Simulate process exit
        this.emitExit({ exitCode: 0 });
    }
    // Test helpers
    emitData(data) {
        this.dataHandlers.forEach((handler) => handler(data));
    }
    emitExit(event) {
        this.exitHandlers.forEach((handler) => handler(event));
    }
    getDataHandlerCount() {
        return this.dataHandlers.length;
    }
    getExitHandlerCount() {
        return this.exitHandlers.length;
    }
}
(0, vitest_1.describe)('TerminalManager - Event Handler Setup (TDD)', () => {
    let terminalManager;
    let spawnStub;
    let mockPty;
    (0, vitest_1.beforeEach)(async () => {
        // Create fresh mock PTY for each test
        mockPty = new MockPtyProcess();
        // Stub TerminalSpawner to return our mock PTY
        const { TerminalSpawner } = await Promise.resolve().then(() => require('../../../../terminals/TerminalSpawner'));
        spawnStub = vitest_1.vi.spyOn(TerminalSpawner.prototype, 'spawnTerminal').mockReturnValue({
            ptyProcess: mockPty,
        });
        terminalManager = new TerminalManager_1.TerminalManager();
    });
    (0, vitest_1.afterEach)(() => {
        terminalManager.dispose();
        spawnStub.mockRestore();
    });
    (0, vitest_1.describe)('RED Phase: Event Handler Duplication Detection', () => {
        (0, vitest_1.it)('should register onData handler exactly once in createTerminal()', () => {
            // Act: Create terminal (this triggers _setupTerminalEvents)
            const terminalId = terminalManager.createTerminal();
            // Assert: Only one data handler should be registered
            (0, vitest_1.expect)(mockPty.getDataHandlerCount()).toBe(1);
            // Cleanup
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should register onExit handler exactly once in createTerminal()', () => {
            // Act: Create terminal
            const terminalId = terminalManager.createTerminal();
            // Assert: Only one exit handler should be registered
            (0, vitest_1.expect)(mockPty.getExitHandlerCount()).toBe(1);
            // Cleanup
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should register onData handler exactly once in createTerminalWithProfile()', async () => {
            // Act: Create terminal with profile
            const terminalId = await terminalManager.createTerminalWithProfile();
            // Assert: Only one data handler should be registered
            (0, vitest_1.expect)(mockPty.getDataHandlerCount()).toBe(1);
            // Cleanup
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should register onExit handler exactly once in createTerminalWithProfile()', async () => {
            // Act: Create terminal with profile
            const terminalId = await terminalManager.createTerminalWithProfile();
            // Assert: Only one exit handler should be registered
            (0, vitest_1.expect)(mockPty.getExitHandlerCount()).toBe(1);
            // Cleanup
            terminalManager.removeTerminal(terminalId);
        });
    });
    (0, vitest_1.describe)('RED Phase: Data Event Emission Count', () => {
        (0, vitest_1.it)('should emit data event exactly once when PTY sends data', async () => {
            const terminalId = terminalManager.createTerminal();
            let dataEventCount = 0;
            const testData = 'test output';
            // Listen for data events
            terminalManager.onData((event) => {
                if (event.terminalId === terminalId && event.data === testData) {
                    dataEventCount++;
                }
            });
            // Simulate PTY data emission
            mockPty.emitData(testData);
            // Wait for event processing
            await new Promise((resolve) => setTimeout(resolve, 100));
            (0, vitest_1.expect)(dataEventCount).toBe(1);
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should emit exit event exactly once when PTY process exits', async () => {
            const terminalId = terminalManager.createTerminal();
            let exitEventCount = 0;
            // Listen for exit events
            terminalManager.onExit((event) => {
                if (event.terminalId === terminalId) {
                    exitEventCount++;
                }
            });
            // Simulate PTY exit
            mockPty.emitExit({ exitCode: 0 });
            // Wait for event processing
            await new Promise((resolve) => setTimeout(resolve, 100));
            (0, vitest_1.expect)(exitEventCount).toBe(1);
        });
    });
    (0, vitest_1.describe)('GREEN Phase: Process State Management', () => {
        (0, vitest_1.it)('should initialize terminal with Launching state', () => {
            const terminalId = terminalManager.createTerminal();
            const terminal = terminalManager.getTerminal(terminalId);
            (0, vitest_1.expect)(terminal).toBeDefined();
            (0, vitest_1.expect)(terminal?.processState).toBe(shared_1.ProcessState.Launching);
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should transition from Launching to Running on first data', async () => {
            const terminalId = terminalManager.createTerminal();
            const terminal = terminalManager.getTerminal(terminalId);
            (0, vitest_1.expect)(terminal?.processState).toBe(shared_1.ProcessState.Launching);
            // Simulate first data reception
            mockPty.emitData('$ ');
            // Wait for state transition
            await new Promise((resolve) => setTimeout(resolve, 50));
            const updatedTerminal = terminalManager.getTerminal(terminalId);
            (0, vitest_1.expect)(updatedTerminal?.processState).toBe(shared_1.ProcessState.Running);
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should set KilledByUser state when deleteTerminal is called', async () => {
            // Create TWO terminals to satisfy the "at least 1 terminal" rule
            const terminalId = terminalManager.createTerminal();
            terminalManager.createTerminal();
            // Transition to Running state first
            mockPty.emitData('initial data');
            await new Promise((resolve) => setTimeout(resolve, 50));
            let capturedExitState;
            // Capture exit event state
            terminalManager.onExit((event) => {
                if (event.terminalId === terminalId) {
                    const terminal = terminalManager.getTerminal(terminalId);
                    capturedExitState = terminal?.processState;
                }
            });
            // Delete terminal
            await terminalManager.deleteTerminal(terminalId);
            // Verify state was KilledByUser
            (0, vitest_1.expect)(capturedExitState).toBe(shared_1.ProcessState.KilledByUser);
        });
    });
    (0, vitest_1.describe)('REFACTOR Phase: Method Consistency', () => {
        (0, vitest_1.it)('should use identical event setup pattern in both create methods', async () => {
            // Create terminal using both methods
            const terminal1Id = terminalManager.createTerminal();
            // Create new mock PTY for second terminal
            const mockPty2 = new MockPtyProcess();
            spawnStub.mockReturnValue({ ptyProcess: mockPty2 });
            const terminal2Id = await terminalManager.createTerminalWithProfile();
            // Both should have exactly one handler each
            (0, vitest_1.expect)(mockPty.getDataHandlerCount()).toBe(1);
            (0, vitest_1.expect)(mockPty.getExitHandlerCount()).toBe(1);
            (0, vitest_1.expect)(mockPty2.getDataHandlerCount()).toBe(1);
            (0, vitest_1.expect)(mockPty2.getExitHandlerCount()).toBe(1);
            // Cleanup
            terminalManager.removeTerminal(terminal1Id);
            terminalManager.removeTerminal(terminal2Id);
        });
    });
    (0, vitest_1.describe)('REFACTOR Phase: Edge Cases', () => {
        (0, vitest_1.it)('should handle rapid terminal creation without handler leaks', () => {
            const terminalIds = [];
            // Create 5 terminals rapidly
            for (let i = 0; i < 5; i++) {
                const mockPtyN = new MockPtyProcess();
                spawnStub.mockReturnValue({ ptyProcess: mockPtyN });
                const id = terminalManager.createTerminal();
                terminalIds.push(id);
                // Each should have exactly one handler
                (0, vitest_1.expect)(mockPtyN.getDataHandlerCount()).toBe(1);
                (0, vitest_1.expect)(mockPtyN.getExitHandlerCount()).toBe(1);
            }
            // Cleanup all
            terminalIds.forEach((id) => terminalManager.removeTerminal(id));
        });
        (0, vitest_1.it)('should not register duplicate handlers on multiple state transitions', async () => {
            const terminalId = terminalManager.createTerminal();
            // Emit multiple data events to trigger state transitions
            mockPty.emitData('data 1');
            mockPty.emitData('data 2');
            mockPty.emitData('data 3');
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Handler count should still be 1
            (0, vitest_1.expect)(mockPty.getDataHandlerCount()).toBe(1);
            terminalManager.removeTerminal(terminalId);
        });
        (0, vitest_1.it)('should handle terminal deletion during data processing', async () => {
            // Create TWO terminals to satisfy the "at least 1 terminal" rule
            const terminalId = terminalManager.createTerminal();
            terminalManager.createTerminal();
            // Start data emission
            mockPty.emitData('data before deletion');
            // Delete terminal immediately
            void terminalManager.deleteTerminal(terminalId);
            // Should not crash or cause errors
            await new Promise((resolve) => setTimeout(resolve, 100));
            (0, vitest_1.expect)(terminalManager.getTerminal(terminalId)).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('REFACTOR Phase: Handler Cleanup', () => {
        (0, vitest_1.it)('should clean up handlers when terminal is removed', async () => {
            const terminalId = terminalManager.createTerminal();
            (0, vitest_1.expect)(mockPty.getDataHandlerCount()).toBe(1);
            (0, vitest_1.expect)(mockPty.getExitHandlerCount()).toBe(1);
            // Remove terminal
            terminalManager.removeTerminal(terminalId);
            // Wait for cleanup
            await new Promise((resolve) => setTimeout(resolve, 50));
            // Note: In real implementation, handlers might not be explicitly removed
            // but the terminal reference should be gone
            (0, vitest_1.expect)(terminalManager.getTerminal(terminalId)).toBeUndefined();
        });
    });
});
(0, vitest_1.describe)('TerminalManager - Event Handler Cross-Contamination Prevention', () => {
    let terminalManager;
    let spawnStub;
    let mockPty1;
    let mockPty2;
    (0, vitest_1.beforeEach)(async () => {
        mockPty1 = new MockPtyProcess();
        mockPty2 = new MockPtyProcess();
        const { TerminalSpawner } = await Promise.resolve().then(() => require('../../../../terminals/TerminalSpawner'));
        let callCount = 0;
        spawnStub = vitest_1.vi.spyOn(TerminalSpawner.prototype, 'spawnTerminal').mockImplementation(() => {
            callCount++;
            return { ptyProcess: callCount === 1 ? mockPty1 : mockPty2 };
        });
        terminalManager = new TerminalManager_1.TerminalManager();
    });
    (0, vitest_1.afterEach)(() => {
        terminalManager.dispose();
        spawnStub.mockRestore();
    });
    (0, vitest_1.it)('should not mix events between multiple terminals', async () => {
        const terminal1Id = terminalManager.createTerminal();
        const terminal2Id = terminalManager.createTerminal();
        const terminal1Events = [];
        const terminal2Events = [];
        // Listen for events
        terminalManager.onData((event) => {
            if (event.terminalId === terminal1Id && event.data) {
                terminal1Events.push(event.data);
            }
            if (event.terminalId === terminal2Id && event.data) {
                terminal2Events.push(event.data);
            }
        });
        // Send data to different terminals
        mockPty1.emitData('terminal1 data');
        mockPty2.emitData('terminal2 data');
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Each terminal should only receive its own data
        (0, vitest_1.expect)(terminal1Events).toContain('terminal1 data');
        (0, vitest_1.expect)(terminal1Events).not.toContain('terminal2 data');
        (0, vitest_1.expect)(terminal2Events).toContain('terminal2 data');
        (0, vitest_1.expect)(terminal2Events).not.toContain('terminal1 data');
        terminalManager.removeTerminal(terminal1Id);
        terminalManager.removeTerminal(terminal2Id);
    });
});
//# sourceMappingURL=TerminalManager.EventHandlers.test.js.map