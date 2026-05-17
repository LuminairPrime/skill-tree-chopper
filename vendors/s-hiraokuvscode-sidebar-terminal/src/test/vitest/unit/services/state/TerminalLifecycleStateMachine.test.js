'use strict';
/**
 * TerminalLifecycleStateMachine Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 *
 * Tests for the terminal lifecycle state machine implementation.
 * Addresses issue #221: Terminal Lifecycle State Machine Implementation
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalLifecycleStateMachine_1 = require('../../../../../services/state/TerminalLifecycleStateMachine');
(0, vitest_1.describe)('TerminalLifecycleStateMachine', () => {
  (0, vitest_1.describe)('Basic State Management', () => {
    (0, vitest_1.it)('should initialize with Creating state by default', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating
      );
    });
    (0, vitest_1.it)('should initialize with custom initial state', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
    });
    (0, vitest_1.it)('should return correct terminal ID', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      (0, vitest_1.expect)(stateMachine.getTerminalId()).toBe('term1');
    });
    (0, vitest_1.it)('should correctly check if in specific state', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(
        stateMachine.isInState(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready)
      ).toBe(true);
      (0, vitest_1.expect)(
        stateMachine.isInState(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active)
      ).toBe(false);
    });
    (0, vitest_1.it)('should correctly check if in any of specified states', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(
        stateMachine.isInAnyState([
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready,
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active,
        ])
      ).toBe(true);
      (0, vitest_1.expect)(
        stateMachine.isInAnyState([
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating,
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing,
        ])
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('State Transition Rules', () => {
    (0, vitest_1.it)('should allow valid transition: Creating -> Initializing', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
    });
    (0, vitest_1.it)('should allow valid transition: Initializing -> Ready', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
    });
    (0, vitest_1.it)('should allow valid transition: Ready -> Active', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
    });
    (0, vitest_1.it)('should allow valid transition: Active -> Ready', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
    });
    (0, vitest_1.it)('should allow valid transition: Active -> Closing', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closing)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closing
      );
    });
    (0, vitest_1.it)('should allow valid transition: Closing -> Closed', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closing
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed
      );
    });
    (0, vitest_1.it)('should allow transition to Error from any non-terminal state', () => {
      const states = [
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating,
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing,
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready,
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active,
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closing,
      ];
      for (const state of states) {
        const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
          'term1',
          state
        );
        (0, vitest_1.expect)(() =>
          stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Error)
        ).not.toThrow();
        (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Error
        );
      }
    });
    (0, vitest_1.it)('should reject invalid transition: Creating -> Ready', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready)
      ).toThrow('Invalid state transition');
    });
    (0, vitest_1.it)('should reject invalid transition: Ready -> Initializing', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing)
      ).toThrow('Invalid state transition');
    });
    (0, vitest_1.it)('should reject any transition from Closed state', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed
      );
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready)
      ).toThrow('Invalid state transition');
    });
    (0, vitest_1.it)('should correctly identify valid next states', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      const validStates = stateMachine.getValidNextStates();
      (0, vitest_1.expect)(validStates).toContain(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
      (0, vitest_1.expect)(validStates).toContain(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closing
      );
      (0, vitest_1.expect)(validStates).toContain(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Error
      );
      (0, vitest_1.expect)(validStates).not.toContain(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
    });
    (0, vitest_1.it)('should correctly check if transition is valid', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(
        stateMachine.canTransitionTo(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active)
      ).toBe(true);
      (0, vitest_1.expect)(
        stateMachine.canTransitionTo(
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
        )
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('Transition Metadata', () => {
    (0, vitest_1.it)('should include metadata in transition', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing, {
        reason: 'Test reason',
        data: { key: 'value' },
      });
      const lastTransition = stateMachine.getLastTransition();
      (0, vitest_1.expect)(lastTransition).toBeDefined();
      if (lastTransition) {
        (0, vitest_1.expect)(lastTransition.metadata.reason).toBe('Test reason');
        (0, vitest_1.expect)(lastTransition.metadata.data).toEqual({ key: 'value' });
        (0, vitest_1.expect)(lastTransition.metadata.timestamp).toBeInstanceOf(Date);
      }
    });
    (0, vitest_1.it)('should include error in metadata when transitioning to Error state', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
      const error = new Error('Test error');
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Error, {
        error,
        reason: 'Process crashed',
      });
      const lastTransition = stateMachine.getLastTransition();
      (0, vitest_1.expect)(lastTransition).toBeDefined();
      if (lastTransition) {
        (0, vitest_1.expect)(lastTransition.metadata.error).toBe(error);
        (0, vitest_1.expect)(lastTransition.metadata.reason).toBe('Process crashed');
      }
    });
  });
  (0, vitest_1.describe)('Transition History', () => {
    (0, vitest_1.it)('should track transition history', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active);
      const history = stateMachine.getTransitionHistory();
      (0, vitest_1.expect)(history).toHaveLength(3);
      (0, vitest_1.expect)(history[0].from).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating
      );
      (0, vitest_1.expect)(history[0].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
      (0, vitest_1.expect)(history[1].from).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
      (0, vitest_1.expect)(history[1].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(history[2].from).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(history[2].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
    });
    (0, vitest_1.it)('should limit history size', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating,
        2 // Max history size
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active);
      const history = stateMachine.getTransitionHistory();
      (0, vitest_1.expect)(history).toHaveLength(2); // Only last 2 transitions
      (0, vitest_1.expect)(history[0].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(history[1].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
    });
    (0, vitest_1.it)('should return limited history when requested', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active);
      const history = stateMachine.getTransitionHistory(2);
      (0, vitest_1.expect)(history).toHaveLength(2);
      (0, vitest_1.expect)(history[0].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(history[1].to).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
    });
    (0, vitest_1.it)('should return last transition', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      const lastTransition = stateMachine.getLastTransition();
      (0, vitest_1.expect)(lastTransition).toBeDefined();
      if (lastTransition) {
        (0, vitest_1.expect)(lastTransition.to).toBe(
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
        );
      }
    });
    (0, vitest_1.it)('should clear history', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      stateMachine.clearHistory();
      const history = stateMachine.getTransitionHistory();
      (0, vitest_1.expect)(history).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('State Change Listeners', () => {
    (0, vitest_1.it)('should notify listeners on state change', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let eventReceived = null;
      stateMachine.addListener((event) => {
        eventReceived = event;
      });
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventReceived).toBeDefined();
      (0, vitest_1.expect)(eventReceived.terminalId).toBe('term1');
      (0, vitest_1.expect)(eventReceived.previousState).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Creating
      );
      (0, vitest_1.expect)(eventReceived.newState).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
    });
    (0, vitest_1.it)('should support multiple listeners', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let listener1Called = false;
      let listener2Called = false;
      stateMachine.addListener(() => {
        listener1Called = true;
      });
      stateMachine.addListener(() => {
        listener2Called = true;
      });
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(listener1Called).toBe(true);
      (0, vitest_1.expect)(listener2Called).toBe(true);
    });
    (0, vitest_1.it)('should remove listener when disposable is called', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let callCount = 0;
      const dispose = stateMachine.addListener(() => {
        callCount++;
      });
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(callCount).toBe(1);
      dispose();
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      (0, vitest_1.expect)(callCount).toBe(1); // Not called again
    });
    (0, vitest_1.it)('should remove listener directly', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let callCount = 0;
      const listener = () => {
        callCount++;
      };
      stateMachine.addListener(listener);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(callCount).toBe(1);
      stateMachine.removeListener(listener);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      (0, vitest_1.expect)(callCount).toBe(1);
    });
    (0, vitest_1.it)('should clear all listeners', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let callCount = 0;
      stateMachine.addListener(() => callCount++);
      stateMachine.addListener(() => callCount++);
      stateMachine.clearListeners();
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(callCount).toBe(0);
    });
    (0, vitest_1.it)('should return correct listener count', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      (0, vitest_1.expect)(stateMachine.getListenerCount()).toBe(0);
      stateMachine.addListener(() => {});
      stateMachine.addListener(() => {});
      (0, vitest_1.expect)(stateMachine.getListenerCount()).toBe(2);
      stateMachine.clearListeners();
      (0, vitest_1.expect)(stateMachine.getListenerCount()).toBe(0);
    });
    (0, vitest_1.it)('should handle listener errors gracefully', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      let goodListenerCalled = false;
      stateMachine.addListener(() => {
        throw new Error('Listener error');
      });
      stateMachine.addListener(() => {
        goodListenerCalled = true;
      });
      // Should not throw despite error in first listener
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing)
      ).not.toThrow();
      (0, vitest_1.expect)(goodListenerCalled).toBe(true);
    });
  });
  (0, vitest_1.describe)('Force Transition', () => {
    (0, vitest_1.it)('should allow forced transition bypassing validation', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      // Invalid transition normally
      (0, vitest_1.expect)(() =>
        stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed)
      ).toThrow();
      // Should work with force
      (0, vitest_1.expect)(() =>
        stateMachine.forceTransition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed)
      ).not.toThrow();
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed
      );
    });
    (0, vitest_1.it)('should record forced transitions in history', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.forceTransition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed);
      const lastTransition = stateMachine.getLastTransition();
      (0, vitest_1.expect)(lastTransition).toBeDefined();
      if (lastTransition) {
        (0, vitest_1.expect)(lastTransition.to).toBe(
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Closed
        );
        (0, vitest_1.expect)(lastTransition.metadata.reason).toContain('Forced transition');
      }
    });
  });
  (0, vitest_1.describe)('State Summary', () => {
    (0, vitest_1.it)('should provide complete state summary', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      const summary = stateMachine.getStateSummary();
      (0, vitest_1.expect)(summary.terminalId).toBe('term1');
      (0, vitest_1.expect)(summary.currentState).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(summary.validNextStates).toContain(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Active
      );
      (0, vitest_1.expect)(summary.transitionCount).toBe(2);
      (0, vitest_1.expect)(summary.lastTransition).toBeDefined();
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should clean up resources on dispose', () => {
      const stateMachine = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachine(
        'term1'
      );
      stateMachine.addListener(() => {});
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      stateMachine.dispose();
      (0, vitest_1.expect)(stateMachine.getListenerCount()).toBe(0);
      (0, vitest_1.expect)(stateMachine.getTransitionHistory()).toHaveLength(0);
    });
  });
});
(0, vitest_1.describe)('TerminalLifecycleStateMachineManager', () => {
  let manager;
  (0, vitest_1.beforeEach)(() => {
    manager = new TerminalLifecycleStateMachine_1.TerminalLifecycleStateMachineManager();
  });
  (0, vitest_1.afterEach)(() => {
    manager.dispose();
  });
  (0, vitest_1.describe)('State Machine Creation', () => {
    (0, vitest_1.it)('should create a new state machine', () => {
      const stateMachine = manager.createStateMachine('term1');
      (0, vitest_1.expect)(stateMachine).toBeDefined();
      (0, vitest_1.expect)(stateMachine.getTerminalId()).toBe('term1');
      (0, vitest_1.expect)(manager.hasStateMachine('term1')).toBe(true);
    });
    (0, vitest_1.it)('should throw error when creating duplicate state machine', () => {
      manager.createStateMachine('term1');
      (0, vitest_1.expect)(() => manager.createStateMachine('term1')).toThrow('already exists');
    });
    (0, vitest_1.it)('should create state machine with custom initial state', () => {
      const stateMachine = manager.createStateMachine(
        'term1',
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(stateMachine.getCurrentState()).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
    });
  });
  (0, vitest_1.describe)('State Machine Retrieval', () => {
    (0, vitest_1.it)('should get existing state machine', () => {
      manager.createStateMachine('term1');
      const stateMachine = manager.getStateMachine('term1');
      (0, vitest_1.expect)(stateMachine).toBeDefined();
      (0, vitest_1.expect)(stateMachine?.getTerminalId()).toBe('term1');
    });
    (0, vitest_1.it)('should return undefined for non-existent state machine', () => {
      const stateMachine = manager.getStateMachine('term1');
      (0, vitest_1.expect)(stateMachine).toBeUndefined();
    });
    (0, vitest_1.it)('should get or create state machine', () => {
      const stateMachine1 = manager.getOrCreateStateMachine('term1');
      (0, vitest_1.expect)(stateMachine1).toBeDefined();
      const stateMachine2 = manager.getOrCreateStateMachine('term1');
      (0, vitest_1.expect)(stateMachine1).toBe(stateMachine2);
    });
  });
  (0, vitest_1.describe)('State Machine Removal', () => {
    (0, vitest_1.it)('should remove existing state machine', () => {
      manager.createStateMachine('term1');
      const result = manager.removeStateMachine('term1');
      (0, vitest_1.expect)(result).toBe(true);
      (0, vitest_1.expect)(manager.hasStateMachine('term1')).toBe(false);
    });
    (0, vitest_1.it)('should return false when removing non-existent state machine', () => {
      const result = manager.removeStateMachine('term1');
      (0, vitest_1.expect)(result).toBe(false);
    });
  });
  (0, vitest_1.describe)('State Queries', () => {
    (0, vitest_1.it)('should get current state for terminal', () => {
      const stateMachine = manager.createStateMachine('term1');
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      const state = manager.getCurrentState('term1');
      (0, vitest_1.expect)(state).toBe(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
    });
    (0, vitest_1.it)('should return undefined for non-existent terminal state', () => {
      const state = manager.getCurrentState('term1');
      (0, vitest_1.expect)(state).toBeUndefined();
    });
    (0, vitest_1.it)('should check if terminal is in specific state', () => {
      const stateMachine = manager.createStateMachine('term1');
      stateMachine.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(
        manager.isTerminalInState(
          'term1',
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
        )
      ).toBe(true);
      (0, vitest_1.expect)(
        manager.isTerminalInState(
          'term1',
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
        )
      ).toBe(false);
    });
    (0, vitest_1.it)('should return false for non-existent terminal state check', () => {
      (0, vitest_1.expect)(
        manager.isTerminalInState(
          'term1',
          TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
        )
      ).toBe(false);
    });
    (0, vitest_1.it)('should get all terminals in specific state', () => {
      const sm1 = manager.createStateMachine('term1');
      const sm2 = manager.createStateMachine('term2');
      const sm3 = manager.createStateMachine('term3');
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      sm3.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      const readyTerminals = manager.getTerminalsInState(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready
      );
      (0, vitest_1.expect)(readyTerminals).toHaveLength(2);
      (0, vitest_1.expect)(readyTerminals).toContain('term1');
      (0, vitest_1.expect)(readyTerminals).toContain('term2');
      const initializingTerminals = manager.getTerminalsInState(
        TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing
      );
      (0, vitest_1.expect)(initializingTerminals).toHaveLength(1);
      (0, vitest_1.expect)(initializingTerminals).toContain('term3');
    });
  });
  (0, vitest_1.describe)('Global Listeners', () => {
    (0, vitest_1.it)('should add global listener to all state machines', () => {
      let eventCount = 0;
      manager.addGlobalListener(() => eventCount++);
      const sm1 = manager.createStateMachine('term1');
      const sm2 = manager.createStateMachine('term2');
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventCount).toBe(2);
    });
    (0, vitest_1.it)('should add global listener to newly created state machines', () => {
      let eventCount = 0;
      manager.addGlobalListener(() => eventCount++);
      const sm1 = manager.createStateMachine('term1');
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventCount).toBe(1);
      const sm2 = manager.createStateMachine('term2');
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventCount).toBe(2);
    });
    (0, vitest_1.it)('should remove global listener from all state machines', () => {
      let eventCount = 0;
      const listener = () => eventCount++;
      manager.addGlobalListener(listener);
      const sm1 = manager.createStateMachine('term1');
      const sm2 = manager.createStateMachine('term2');
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventCount).toBe(2);
      manager.removeGlobalListener(listener);
      sm1.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      sm2.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      (0, vitest_1.expect)(eventCount).toBe(2); // Not incremented
    });
    (0, vitest_1.it)('should clear all global listeners', () => {
      let eventCount = 0;
      manager.addGlobalListener(() => eventCount++);
      manager.addGlobalListener(() => eventCount++);
      const sm = manager.createStateMachine('term1');
      sm.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Initializing);
      (0, vitest_1.expect)(eventCount).toBe(2);
      manager.clearGlobalListeners();
      sm.transition(TerminalLifecycleStateMachine_1.TerminalLifecycleState.Ready);
      (0, vitest_1.expect)(eventCount).toBe(2);
    });
  });
  (0, vitest_1.describe)('Bulk Operations', () => {
    (0, vitest_1.it)('should get all terminal IDs', () => {
      manager.createStateMachine('term1');
      manager.createStateMachine('term2');
      manager.createStateMachine('term3');
      const ids = manager.getAllTerminalIds();
      (0, vitest_1.expect)(ids).toHaveLength(3);
      (0, vitest_1.expect)(ids).toContain('term1');
      (0, vitest_1.expect)(ids).toContain('term2');
      (0, vitest_1.expect)(ids).toContain('term3');
    });
    (0, vitest_1.it)('should get all state summaries', () => {
      manager.createStateMachine('term1');
      manager.createStateMachine('term2');
      const summaries = manager.getAllStateSummaries();
      (0, vitest_1.expect)(summaries.size).toBe(2);
      (0, vitest_1.expect)(summaries.has('term1')).toBe(true);
      (0, vitest_1.expect)(summaries.has('term2')).toBe(true);
    });
    (0, vitest_1.it)('should get state machine count', () => {
      (0, vitest_1.expect)(manager.getStateMachineCount()).toBe(0);
      manager.createStateMachine('term1');
      manager.createStateMachine('term2');
      (0, vitest_1.expect)(manager.getStateMachineCount()).toBe(2);
      manager.removeStateMachine('term1');
      (0, vitest_1.expect)(manager.getStateMachineCount()).toBe(1);
    });
  });
  (0, vitest_1.describe)('Disposal', () => {
    (0, vitest_1.it)('should dispose all state machines', () => {
      const sm1 = manager.createStateMachine('term1');
      const sm2 = manager.createStateMachine('term2');
      sm1.addListener(() => {});
      sm2.addListener(() => {});
      manager.dispose();
      (0, vitest_1.expect)(manager.getStateMachineCount()).toBe(0);
      (0, vitest_1.expect)(sm1.getListenerCount()).toBe(0);
      (0, vitest_1.expect)(sm2.getListenerCount()).toBe(0);
    });
  });
});
//# sourceMappingURL=TerminalLifecycleStateMachine.test.js.map
