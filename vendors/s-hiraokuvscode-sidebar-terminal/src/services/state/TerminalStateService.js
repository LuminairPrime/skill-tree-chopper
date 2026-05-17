'use strict';
/**
 * Terminal State Service Implementation
 *
 * Manages terminal lifecycle states and metadata with event-driven updates.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalStateService = exports.TerminalStateChangedEvent = void 0;
const EventBus_1 = require('../../core/EventBus');
const shared_1 = require('../../types/shared');
/**
 * Terminal state change event
 */
exports.TerminalStateChangedEvent = (0, EventBus_1.createEventType)('terminal.state.changed');
/**
 * Terminal State Service Implementation
 */
class TerminalStateService {
  constructor(_eventBus) {
    this._eventBus = _eventBus;
    this._terminals = new Map();
    this._isDisposed = false;
  }
  registerTerminal(id, metadata) {
    this._ensureNotDisposed();
    if (this._terminals.has(id)) {
      throw new Error(`Terminal ${id} is already registered`);
    }
    const now = new Date();
    const fullMetadata = {
      id,
      name: metadata.name || `Terminal ${id}`,
      number: metadata.number,
      cwd: metadata.cwd,
      shell: metadata.shell,
      shellArgs: metadata.shellArgs,
      pid: metadata.pid,
      isActive: metadata.isActive ?? false,
      createdAt: metadata.createdAt || now,
      lastActiveAt: metadata.lastActiveAt || now,
    };
    const lifecycle = {
      processState: shared_1.ProcessState.Uninitialized,
      interactionState: shared_1.InteractionState.None,
      shouldPersist: false,
    };
    this._terminals.set(id, {
      metadata: fullMetadata,
      lifecycle,
    });
    // Publish state change event
    this._publishStateChange(
      id,
      undefined,
      {
        ...fullMetadata,
        lifecycle,
      },
      'registered'
    );
  }
  unregisterTerminal(id) {
    this._ensureNotDisposed();
    const state = this._terminals.get(id);
    if (!state) {
      return false;
    }
    const previousState = {
      ...state.metadata,
      lifecycle: state.lifecycle,
    };
    this._terminals.delete(id);
    // Clear active terminal if it was the unregistered one
    if (this._activeTerminalId === id) {
      this._activeTerminalId = undefined;
    }
    // Publish state change event
    this._publishStateChange(id, previousState, previousState, 'unregistered');
    return true;
  }
  hasTerminal(id) {
    return this._terminals.has(id);
  }
  getMetadata(id) {
    return this._terminals.get(id)?.metadata;
  }
  updateMetadata(id, updates) {
    this._ensureNotDisposed();
    const state = this._terminals.get(id);
    if (!state) {
      return false;
    }
    const previousState = this._getCompleteState(state);
    // Update metadata
    Object.assign(state.metadata, updates);
    const currentState = this._getCompleteState(state);
    // Publish state change event
    this._publishStateChange(id, previousState, currentState, 'updated');
    return true;
  }
  getLifecycleState(id) {
    return this._terminals.get(id)?.lifecycle;
  }
  updateLifecycleState(id, updates) {
    this._ensureNotDisposed();
    const state = this._terminals.get(id);
    if (!state) {
      return false;
    }
    const previousState = this._getCompleteState(state);
    // Update lifecycle state
    Object.assign(state.lifecycle, updates);
    const currentState = this._getCompleteState(state);
    // Publish state change event
    this._publishStateChange(id, previousState, currentState, 'updated');
    return true;
  }
  getState(id) {
    const state = this._terminals.get(id);
    if (!state) {
      return undefined;
    }
    return this._getCompleteState(state);
  }
  setProcessState(id, processState) {
    return this.updateLifecycleState(id, { processState });
  }
  getProcessState(id) {
    return this._terminals.get(id)?.lifecycle.processState;
  }
  setInteractionState(id, interactionState) {
    return this.updateLifecycleState(id, { interactionState });
  }
  getInteractionState(id) {
    return this._terminals.get(id)?.lifecycle.interactionState;
  }
  setActiveTerminal(id) {
    this._ensureNotDisposed();
    const state = this._terminals.get(id);
    if (!state) {
      return false;
    }
    // Deactivate previous active terminal
    if (this._activeTerminalId && this._activeTerminalId !== id) {
      const prevState = this._terminals.get(this._activeTerminalId);
      if (prevState) {
        const previousCompleteState = this._getCompleteState(prevState);
        prevState.metadata.isActive = false;
        prevState.metadata.lastActiveAt = new Date();
        const currentCompleteState = this._getCompleteState(prevState);
        this._publishStateChange(
          this._activeTerminalId,
          previousCompleteState,
          currentCompleteState,
          'deactivated'
        );
      }
    }
    // Activate new terminal
    const previousState = this._getCompleteState(state);
    state.metadata.isActive = true;
    state.metadata.lastActiveAt = new Date();
    const currentState = this._getCompleteState(state);
    this._activeTerminalId = id;
    // Publish state change event
    this._publishStateChange(id, previousState, currentState, 'activated');
    return true;
  }
  getActiveTerminalId() {
    return this._activeTerminalId;
  }
  getActiveTerminal() {
    if (!this._activeTerminalId) {
      return undefined;
    }
    return this.getMetadata(this._activeTerminalId);
  }
  clearActiveTerminal() {
    this._ensureNotDisposed();
    if (this._activeTerminalId) {
      const state = this._terminals.get(this._activeTerminalId);
      if (state) {
        const previousState = this._getCompleteState(state);
        state.metadata.isActive = false;
        const currentState = this._getCompleteState(state);
        this._publishStateChange(
          this._activeTerminalId,
          previousState,
          currentState,
          'deactivated'
        );
      }
      this._activeTerminalId = undefined;
    }
  }
  getAllTerminalIds() {
    return Array.from(this._terminals.keys());
  }
  getAllTerminals() {
    return Array.from(this._terminals.values()).map((state) => state.metadata);
  }
  getAllStates() {
    return Array.from(this._terminals.values()).map((state) => this._getCompleteState(state));
  }
  getTerminalCount() {
    return this._terminals.size;
  }
  isTerminalReady(id) {
    const processState = this.getProcessState(id);
    return processState === shared_1.ProcessState.Running;
  }
  isTerminalActive(id) {
    return this._activeTerminalId === id;
  }
  findTerminals(predicate) {
    const results = [];
    for (const state of this._terminals.values()) {
      if (predicate(state.metadata)) {
        results.push(state.metadata);
      }
    }
    return results;
  }
  updateLastActiveTime(id) {
    return this.updateMetadata(id, {
      lastActiveAt: new Date(),
    });
  }
  getTerminalsByActivity() {
    const terminals = Array.from(this._terminals.entries());
    // Sort by lastActiveAt descending (most recent first)
    terminals.sort((a, b) => {
      const timeA = a[1].metadata.lastActiveAt.getTime();
      const timeB = b[1].metadata.lastActiveAt.getTime();
      return timeB - timeA;
    });
    return terminals.map(([id]) => id);
  }
  clear() {
    this._ensureNotDisposed();
    this._terminals.clear();
    this._activeTerminalId = undefined;
  }
  dispose() {
    if (this._isDisposed) {
      return;
    }
    this.clear();
    this._isDisposed = true;
  }
  /**
   * Helper to get complete terminal state
   */
  _getCompleteState(state) {
    return {
      ...state.metadata,
      lifecycle: { ...state.lifecycle },
    };
  }
  /**
   * Helper to publish state change events
   */
  _publishStateChange(terminalId, previousState, currentState, changeType) {
    this._eventBus.publish(exports.TerminalStateChangedEvent, {
      terminalId,
      previousState,
      currentState,
      changeType,
    });
  }
  /**
   * Ensure service is not disposed
   */
  _ensureNotDisposed() {
    if (this._isDisposed) {
      throw new Error('Cannot use disposed TerminalStateService');
    }
  }
}
exports.TerminalStateService = TerminalStateService;
//# sourceMappingURL=TerminalStateService.js.map
