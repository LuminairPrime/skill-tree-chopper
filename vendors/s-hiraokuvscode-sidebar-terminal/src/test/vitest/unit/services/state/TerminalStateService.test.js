"use strict";
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * TerminalStateService Unit Tests
 *
 * Tests for the terminal state management service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const EventBus_1 = require("../../../../../core/EventBus");
const TerminalStateService_1 = require("../../../../../services/state/TerminalStateService");
const shared_1 = require("../../../../../types/shared");
(0, vitest_1.describe)('TerminalStateService', () => {
    let eventBus;
    let service;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new EventBus_1.EventBus();
        service = new TerminalStateService_1.TerminalStateService(eventBus);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        eventBus.dispose();
    });
    (0, vitest_1.describe)('Terminal Registration', () => {
        (0, vitest_1.it)('should register a new terminal', () => {
            service.registerTerminal('term1', {
                name: 'Terminal 1',
                number: 1,
            });
            (0, vitest_1.expect)(service.hasTerminal('term1')).toBe(true);
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(1);
        });
        (0, vitest_1.it)('should set default values for missing metadata', () => {
            service.registerTerminal('term1', {});
            const metadata = service.getMetadata('term1');
            (0, vitest_1.expect)(metadata).toBeDefined();
            if (metadata) {
                (0, vitest_1.expect)(metadata.id).toBe('term1');
                (0, vitest_1.expect)(metadata.name).toBe('Terminal term1');
                (0, vitest_1.expect)(metadata.isActive).toBe(false);
                (0, vitest_1.expect)(metadata.createdAt).toBeInstanceOf(Date);
                (0, vitest_1.expect)(metadata.lastActiveAt).toBeInstanceOf(Date);
            }
        });
        (0, vitest_1.it)('should throw error when registering duplicate terminal', () => {
            service.registerTerminal('term1', {});
            (0, vitest_1.expect)(() => service.registerTerminal('term1', {})).toThrow('Terminal term1 is already registered');
        });
        (0, vitest_1.it)('should initialize lifecycle state to defaults', () => {
            service.registerTerminal('term1', {});
            const lifecycle = service.getLifecycleState('term1');
            (0, vitest_1.expect)(lifecycle).toBeDefined();
            if (lifecycle) {
                (0, vitest_1.expect)(lifecycle.processState).toBe(shared_1.ProcessState.Uninitialized);
                (0, vitest_1.expect)(lifecycle.interactionState).toBe(shared_1.InteractionState.None);
                (0, vitest_1.expect)(lifecycle.shouldPersist).toBe(false);
            }
        });
        (0, vitest_1.it)('should publish registration event', () => {
            let eventReceived = false;
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                if (event.data.changeType === 'registered') {
                    eventReceived = true;
                }
            });
            service.registerTerminal('term1', {});
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
    });
    (0, vitest_1.describe)('Terminal Unregistration', () => {
        (0, vitest_1.it)('should unregister existing terminal', () => {
            service.registerTerminal('term1', {});
            const result = service.unregisterTerminal('term1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(service.hasTerminal('term1')).toBe(false);
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(0);
        });
        (0, vitest_1.it)('should return false when unregistering non-existent terminal', () => {
            const result = service.unregisterTerminal('nonexistent');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should clear active terminal when unregistering active terminal', () => {
            service.registerTerminal('term1', {});
            service.setActiveTerminal('term1');
            service.unregisterTerminal('term1');
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBeUndefined();
        });
        (0, vitest_1.it)('should publish unregistration event', () => {
            let eventReceived = false;
            service.registerTerminal('term1', {});
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                if (event.data.changeType === 'unregistered') {
                    eventReceived = true;
                }
            });
            service.unregisterTerminal('term1');
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
    });
    (0, vitest_1.describe)('Metadata Management', () => {
        (0, vitest_1.it)('should get terminal metadata', () => {
            service.registerTerminal('term1', {
                name: 'My Terminal',
                number: 1,
                cwd: '/home/user',
            });
            const metadata = service.getMetadata('term1');
            (0, vitest_1.expect)(metadata).toBeDefined();
            if (metadata) {
                (0, vitest_1.expect)(metadata.id).toBe('term1');
                (0, vitest_1.expect)(metadata.name).toBe('My Terminal');
                (0, vitest_1.expect)(metadata.number).toBe(1);
                (0, vitest_1.expect)(metadata.cwd).toBe('/home/user');
            }
        });
        (0, vitest_1.it)('should return undefined for non-existent terminal', () => {
            const metadata = service.getMetadata('nonexistent');
            (0, vitest_1.expect)(metadata).toBeUndefined();
        });
        (0, vitest_1.it)('should update terminal metadata', () => {
            service.registerTerminal('term1', { name: 'Original' });
            const result = service.updateMetadata('term1', {
                name: 'Updated',
                cwd: '/new/path',
            });
            (0, vitest_1.expect)(result).toBe(true);
            const metadata = service.getMetadata('term1');
            (0, vitest_1.expect)(metadata?.name).toBe('Updated');
            (0, vitest_1.expect)(metadata?.cwd).toBe('/new/path');
        });
        (0, vitest_1.it)('should return false when updating non-existent terminal', () => {
            const result = service.updateMetadata('nonexistent', { name: 'Test' });
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should publish update event when metadata changes', () => {
            let eventReceived = false;
            service.registerTerminal('term1', {});
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                if (event.data.changeType === 'updated') {
                    eventReceived = true;
                }
            });
            service.updateMetadata('term1', { name: 'Updated' });
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
    });
    (0, vitest_1.describe)('Lifecycle State Management', () => {
        (0, vitest_1.it)('should get lifecycle state', () => {
            service.registerTerminal('term1', {});
            const lifecycle = service.getLifecycleState('term1');
            (0, vitest_1.expect)(lifecycle).toBeDefined();
        });
        (0, vitest_1.it)('should update lifecycle state', () => {
            service.registerTerminal('term1', {});
            const result = service.updateLifecycleState('term1', {
                processState: shared_1.ProcessState.Running,
                shouldPersist: true,
            });
            (0, vitest_1.expect)(result).toBe(true);
            const lifecycle = service.getLifecycleState('term1');
            (0, vitest_1.expect)(lifecycle?.processState).toBe(shared_1.ProcessState.Running);
            (0, vitest_1.expect)(lifecycle?.shouldPersist).toBe(true);
        });
        (0, vitest_1.it)('should set process state', () => {
            service.registerTerminal('term1', {});
            service.setProcessState('term1', shared_1.ProcessState.Running);
            (0, vitest_1.expect)(service.getProcessState('term1')).toBe(shared_1.ProcessState.Running);
        });
        (0, vitest_1.it)('should set interaction state', () => {
            service.registerTerminal('term1', {});
            service.setInteractionState('term1', shared_1.InteractionState.Session);
            (0, vitest_1.expect)(service.getInteractionState('term1')).toBe(shared_1.InteractionState.Session);
        });
        (0, vitest_1.it)('should return undefined for non-existent terminal states', () => {
            (0, vitest_1.expect)(service.getProcessState('nonexistent')).toBeUndefined();
            (0, vitest_1.expect)(service.getInteractionState('nonexistent')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Complete State Management', () => {
        (0, vitest_1.it)('should get complete terminal state', () => {
            service.registerTerminal('term1', {
                name: 'Terminal 1',
                number: 1,
            });
            service.setProcessState('term1', shared_1.ProcessState.Running);
            const state = service.getState('term1');
            (0, vitest_1.expect)(state).toBeDefined();
            if (state) {
                (0, vitest_1.expect)(state.id).toBe('term1');
                (0, vitest_1.expect)(state.name).toBe('Terminal 1');
                (0, vitest_1.expect)(state.lifecycle.processState).toBe(shared_1.ProcessState.Running);
            }
        });
        (0, vitest_1.it)('should return undefined for non-existent terminal state', () => {
            const state = service.getState('nonexistent');
            (0, vitest_1.expect)(state).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Active Terminal Management', () => {
        (0, vitest_1.it)('should set active terminal', () => {
            service.registerTerminal('term1', {});
            const result = service.setActiveTerminal('term1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBe('term1');
            (0, vitest_1.expect)(service.isTerminalActive('term1')).toBe(true);
        });
        (0, vitest_1.it)('should update isActive flag when setting active terminal', () => {
            service.registerTerminal('term1', {});
            service.setActiveTerminal('term1');
            const metadata = service.getMetadata('term1');
            (0, vitest_1.expect)(metadata?.isActive).toBe(true);
        });
        (0, vitest_1.it)('should update lastActiveAt when setting active terminal', async () => {
            service.registerTerminal('term1', {});
            const initialTime = service.getMetadata('term1')?.lastActiveAt;
            // Small delay to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 10));
            service.setActiveTerminal('term1');
            const updatedTime = service.getMetadata('term1')?.lastActiveAt;
            (0, vitest_1.expect)(updatedTime).toBeDefined();
            if (initialTime && updatedTime) {
                (0, vitest_1.expect)(updatedTime.getTime()).toBeGreaterThan(initialTime.getTime());
            }
        });
        (0, vitest_1.it)('should deactivate previous active terminal', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.setActiveTerminal('term1');
            service.setActiveTerminal('term2');
            (0, vitest_1.expect)(service.getMetadata('term1')?.isActive).toBe(false);
            (0, vitest_1.expect)(service.getMetadata('term2')?.isActive).toBe(true);
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBe('term2');
        });
        (0, vitest_1.it)('should return false when setting non-existent terminal as active', () => {
            const result = service.setActiveTerminal('nonexistent');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should get active terminal metadata', () => {
            service.registerTerminal('term1', { name: 'Active Terminal' });
            service.setActiveTerminal('term1');
            const active = service.getActiveTerminal();
            (0, vitest_1.expect)(active).toBeDefined();
            (0, vitest_1.expect)(active?.id).toBe('term1');
            (0, vitest_1.expect)(active?.name).toBe('Active Terminal');
        });
        (0, vitest_1.it)('should return undefined when no active terminal', () => {
            const active = service.getActiveTerminal();
            (0, vitest_1.expect)(active).toBeUndefined();
        });
        (0, vitest_1.it)('should clear active terminal', () => {
            service.registerTerminal('term1', {});
            service.setActiveTerminal('term1');
            service.clearActiveTerminal();
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBeUndefined();
            (0, vitest_1.expect)(service.getMetadata('term1')?.isActive).toBe(false);
        });
        (0, vitest_1.it)('should publish activation event', () => {
            let eventReceived = false;
            service.registerTerminal('term1', {});
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                if (event.data.changeType === 'activated') {
                    eventReceived = true;
                }
            });
            service.setActiveTerminal('term1');
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
        (0, vitest_1.it)('should publish deactivation event', () => {
            let eventReceived = false;
            service.registerTerminal('term1', {});
            service.setActiveTerminal('term1');
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                if (event.data.changeType === 'deactivated') {
                    eventReceived = true;
                }
            });
            service.clearActiveTerminal();
            (0, vitest_1.expect)(eventReceived).toBe(true);
        });
    });
    (0, vitest_1.describe)('Terminal Queries', () => {
        (0, vitest_1.it)('should get all terminal IDs', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.registerTerminal('term3', {});
            const ids = service.getAllTerminalIds();
            (0, vitest_1.expect)(ids).toHaveLength(3);
            (0, vitest_1.expect)(ids).toContain('term1');
            (0, vitest_1.expect)(ids).toContain('term2');
            (0, vitest_1.expect)(ids).toContain('term3');
        });
        (0, vitest_1.it)('should get all terminal metadata', () => {
            service.registerTerminal('term1', { name: 'Terminal 1' });
            service.registerTerminal('term2', { name: 'Terminal 2' });
            const terminals = service.getAllTerminals();
            (0, vitest_1.expect)(terminals).toHaveLength(2);
            (0, vitest_1.expect)(['Terminal 1', 'Terminal 2']).toContain(terminals[0]?.name);
        });
        (0, vitest_1.it)('should get all terminal states', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            const states = service.getAllStates();
            (0, vitest_1.expect)(states).toHaveLength(2);
            (0, vitest_1.expect)(states[0]).toHaveProperty('lifecycle');
        });
        (0, vitest_1.it)('should get terminal count', () => {
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(0);
            service.registerTerminal('term1', {});
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(1);
            service.registerTerminal('term2', {});
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(2);
            service.unregisterTerminal('term1');
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(1);
        });
        (0, vitest_1.it)('should check if terminal is ready', () => {
            service.registerTerminal('term1', {});
            (0, vitest_1.expect)(service.isTerminalReady('term1')).toBe(false);
            service.setProcessState('term1', shared_1.ProcessState.Running);
            (0, vitest_1.expect)(service.isTerminalReady('term1')).toBe(true);
        });
        (0, vitest_1.it)('should check if terminal is active', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.setActiveTerminal('term1');
            (0, vitest_1.expect)(service.isTerminalActive('term1')).toBe(true);
            (0, vitest_1.expect)(service.isTerminalActive('term2')).toBe(false);
        });
        (0, vitest_1.it)('should find terminals by predicate', () => {
            service.registerTerminal('term1', { number: 1 });
            service.registerTerminal('term2', { number: 2 });
            service.registerTerminal('term3', { number: 3 });
            const found = service.findTerminals((m) => m.number === 2);
            (0, vitest_1.expect)(found).toHaveLength(1);
            (0, vitest_1.expect)(found[0]?.id).toBe('term2');
        });
        (0, vitest_1.it)('should return empty array when no terminals match predicate', () => {
            service.registerTerminal('term1', { number: 1 });
            const found = service.findTerminals((m) => m.number === 99);
            (0, vitest_1.expect)(found).toEqual([]);
        });
    });
    (0, vitest_1.describe)('Activity Tracking', () => {
        (0, vitest_1.it)('should update last active time', async () => {
            service.registerTerminal('term1', {});
            const initialTime = service.getMetadata('term1')?.lastActiveAt;
            // Small delay to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 10));
            const result = service.updateLastActiveTime('term1');
            (0, vitest_1.expect)(result).toBe(true);
            const updatedTime = service.getMetadata('term1')?.lastActiveAt;
            if (initialTime && updatedTime) {
                (0, vitest_1.expect)(updatedTime.getTime()).toBeGreaterThan(initialTime.getTime());
            }
        });
        (0, vitest_1.it)('should get terminals ordered by activity', () => {
            vitest_1.vi.useFakeTimers();
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.registerTerminal('term3', {});
            // Update activity in specific order with time advancement
            vitest_1.vi.advanceTimersByTime(10);
            service.updateLastActiveTime('term2');
            vitest_1.vi.advanceTimersByTime(10);
            service.updateLastActiveTime('term3');
            vitest_1.vi.advanceTimersByTime(10);
            service.updateLastActiveTime('term1');
            const ordered = service.getTerminalsByActivity();
            // Most recent first
            (0, vitest_1.expect)(ordered[0]).toBe('term1');
            (0, vitest_1.expect)(ordered[1]).toBe('term3');
            (0, vitest_1.expect)(ordered[2]).toBe('term2');
            vitest_1.vi.useRealTimers();
        });
    });
    (0, vitest_1.describe)('Clear and Disposal', () => {
        (0, vitest_1.it)('should clear all terminals', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.setActiveTerminal('term1');
            service.clear();
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(0);
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBeUndefined();
        });
        (0, vitest_1.it)('should dispose service', () => {
            service.registerTerminal('term1', {});
            service.dispose();
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(0);
        });
        (0, vitest_1.it)('should throw error when using disposed service', () => {
            service.dispose();
            (0, vitest_1.expect)(() => service.registerTerminal('term1', {})).toThrow('Cannot use disposed TerminalStateService');
        });
        (0, vitest_1.it)('should allow multiple dispose calls', () => {
            service.dispose();
            service.dispose(); // Should not throw
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle operations on non-existent terminals gracefully', () => {
            (0, vitest_1.expect)(() => service.updateMetadata('nonexistent', {})).not.toThrow();
            (0, vitest_1.expect)(() => service.setProcessState('nonexistent', shared_1.ProcessState.Running)).not.toThrow();
            (0, vitest_1.expect)(() => service.updateLastActiveTime('nonexistent')).not.toThrow();
        });
        (0, vitest_1.it)('should handle setting non-existent terminal as active', () => {
            const result = service.setActiveTerminal('nonexistent');
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle empty terminal ID', () => {
            service.registerTerminal('', {});
            (0, vitest_1.expect)(service.hasTerminal('')).toBe(true);
            (0, vitest_1.expect)(service.getMetadata('')?.id).toBe('');
        });
        (0, vitest_1.it)('should handle many terminals', () => {
            for (let i = 0; i < 100; i++) {
                service.registerTerminal(`term${i}`, { number: i });
            }
            (0, vitest_1.expect)(service.getTerminalCount()).toBe(100);
            (0, vitest_1.expect)(service.getAllTerminalIds()).toHaveLength(100);
        });
        (0, vitest_1.it)('should handle rapid state updates', () => {
            service.registerTerminal('term1', {});
            for (let i = 0; i < 100; i++) {
                service.updateMetadata('term1', { name: `Name ${i}` });
            }
            const metadata = service.getMetadata('term1');
            (0, vitest_1.expect)(metadata?.name).toBe('Name 99');
        });
        (0, vitest_1.it)('should handle terminal switching', () => {
            service.registerTerminal('term1', {});
            service.registerTerminal('term2', {});
            service.registerTerminal('term3', {});
            service.setActiveTerminal('term1');
            service.setActiveTerminal('term2');
            service.setActiveTerminal('term3');
            service.setActiveTerminal('term1');
            (0, vitest_1.expect)(service.getActiveTerminalId()).toBe('term1');
            (0, vitest_1.expect)(service.isTerminalActive('term1')).toBe(true);
            (0, vitest_1.expect)(service.isTerminalActive('term2')).toBe(false);
            (0, vitest_1.expect)(service.isTerminalActive('term3')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Event System Integration', () => {
        (0, vitest_1.it)('should emit events for all state changes', () => {
            const events = [];
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                events.push(event.data.changeType);
            });
            service.registerTerminal('term1', {});
            service.setActiveTerminal('term1');
            service.updateMetadata('term1', { name: 'Updated' });
            service.clearActiveTerminal();
            service.unregisterTerminal('term1');
            (0, vitest_1.expect)(events).toContain('registered');
            (0, vitest_1.expect)(events).toContain('activated');
            (0, vitest_1.expect)(events).toContain('updated');
            (0, vitest_1.expect)(events).toContain('deactivated');
            (0, vitest_1.expect)(events).toContain('unregistered');
        });
        (0, vitest_1.it)('should include previous and current state in events', () => {
            let receivedEvent;
            service.registerTerminal('term1', { name: 'Original' });
            eventBus.subscribe(TerminalStateService_1.TerminalStateChangedEvent, (event) => {
                receivedEvent = event.data;
            });
            service.updateMetadata('term1', { name: 'Updated' });
            (0, vitest_1.expect)(receivedEvent).toBeDefined();
            (0, vitest_1.expect)(receivedEvent.previousState.name).toBe('Original');
            (0, vitest_1.expect)(receivedEvent.currentState.name).toBe('Updated');
        });
    });
});
//# sourceMappingURL=TerminalStateService.test.js.map