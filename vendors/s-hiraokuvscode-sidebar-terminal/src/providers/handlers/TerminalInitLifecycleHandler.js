'use strict';
/**
 * TerminalInitLifecycleHandler
 *
 * Terminal initialization lifecycle management extracted from SecondaryTerminalProvider.
 * Handles terminal ready, initialization complete, watchdog registration,
 * terminal ensure logic, and terminal state sync to WebView.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalInitLifecycleHandler = void 0;
const constants_1 = require('../../constants');
const logger_1 = require('../../utils/logger');
const TerminalInitializationStateMachine_1 = require('../services/TerminalInitializationStateMachine');
class TerminalInitLifecycleHandler {
  constructor(deps) {
    this.deps = deps;
    this._pendingInitRetries = new Map();
  }
  /**
   * Update the event coordinator reference (needed because it's created lazily in _resetForNewView)
   */
  setEventCoordinator(coordinator) {
    this.deps.eventCoordinator = coordinator;
  }
  /**
   * Handle terminalReady message from WebView
   */
  async handleTerminalReady(message) {
    const terminalId = message.terminalId;
    if (!terminalId) {
      (0, logger_1.provider)('⚠️ [PROVIDER] terminalReady missing terminalId');
      return;
    }
    (0, logger_1.provider)(`✅ [PROVIDER] Terminal ready: ${terminalId}`);
    const currentState = this.deps.terminalInitStateMachine.getState(terminalId);
    if (currentState < TerminalInitializationStateMachine_1.TerminalInitializationState.ViewReady) {
      this.deps.terminalInitStateMachine.markViewReady(terminalId, 'terminalReady');
      this.deps.watchdogCoordinator.startForTerminal(terminalId, 'prompt', 'terminalReady');
      (0, logger_1.provider)(
        `🔄 [PROVIDER] terminalReady promoted state to ViewReady for ${terminalId}`
      );
    }
    // Forward to persistence service for terminal ready event handling
    // Note: This is handled externally by the caller if needed
  }
  /**
   * Send initializationComplete message to WebView
   */
  async sendInitializationComplete(terminalCount) {
    (0, logger_1.provider)(
      `📤 [PROVIDER] Sending initialization complete: ${terminalCount} terminals`
    );
    await this.deps.sendMessage({
      command: 'initializationComplete',
      terminalCount: terminalCount,
      timestamp: Date.now(),
    });
  }
  /**
   * Handle terminalInitializationComplete message from WebView.
   * Advances the terminal through shell init, PTY output start, and prompt ready.
   */
  async handleTerminalInitializationComplete(message) {
    const terminalId = message.terminalId;
    if (!terminalId) {
      (0, logger_1.provider)('⚠️ [PROVIDER] Terminal initialization complete missing terminalId');
      return;
    }
    const currentState = this.deps.terminalInitStateMachine.getState(terminalId);
    const phase = this.deps.watchdogCoordinator.getPhase(terminalId);
    if (
      phase === 'prompt' &&
      currentState >= TerminalInitializationStateMachine_1.TerminalInitializationState.ViewReady &&
      !this.deps.watchdogCoordinator.isInSafeMode(terminalId)
    ) {
      (0, logger_1.provider)(
        `⏭️ [PROVIDER] Ignoring duplicate terminalInitializationComplete for ${terminalId}`
      );
      return;
    }
    (0, logger_1.provider)(
      `✅ [PROVIDER] Terminal ${terminalId} initialization confirmed by WebView`
    );
    this.deps.watchdogCoordinator.stopForTerminal(terminalId, 'webviewAck');
    this.deps.terminalInitStateMachine.markViewReady(terminalId, 'webviewAck');
    this.deps.watchdogCoordinator.startForTerminal(terminalId, 'prompt', 'awaitPrompt');
    const terminal = this.deps.getTerminal(terminalId);
    if (!terminal || !terminal.ptyProcess) {
      const attempts = (this._pendingInitRetries.get(terminalId) ?? 0) + 1;
      this._pendingInitRetries.set(terminalId, attempts);
      if (attempts > 5) {
        (0, logger_1.provider)(
          `❌ [PROVIDER] Terminal ${terminalId} still unavailable after ${attempts} retries`
        );
        this._pendingInitRetries.delete(terminalId);
        return;
      }
      (0, logger_1.provider)(
        `⏳ [PROVIDER] Terminal ${terminalId} not ready (attempt=${attempts}). Retrying terminalInitializationComplete handler...`
      );
      setTimeout(() => this.handleTerminalInitializationComplete(message), 50 * attempts);
      return;
    }
    this._pendingInitRetries.delete(terminalId);
    try {
      this.deps.terminalInitStateMachine.markShellInitializing(terminalId, 'initializeShell');
      this.deps.initializeShellForTerminal(terminalId, terminal.ptyProcess, false);
      this.deps.terminalInitStateMachine.markShellInitialized(terminalId, 'initializeShell');
    } catch (error) {
      (0, logger_1.provider)(`❌ [PROVIDER] Shell initialization failed for ${terminalId}:`, error);
      this.deps.terminalInitStateMachine.markFailed(terminalId, 'initializeShell');
      this.deps.watchdogCoordinator.startForTerminal(terminalId, 'prompt', 'shellInitRetry');
      return;
    }
    try {
      this.deps.startPtyOutput(terminalId);
      this.deps.terminalInitStateMachine.markOutputStreaming(terminalId, 'startPtyOutput');
    } catch (error) {
      (0, logger_1.provider)(`❌ [PROVIDER] PTY output start failed for ${terminalId}:`, error);
      this.deps.terminalInitStateMachine.markFailed(terminalId, 'startPtyOutput');
      this.deps.watchdogCoordinator.startForTerminal(terminalId, 'prompt', 'ptyRetry');
      return;
    }
    await this.deps.sendMessage({
      command: constants_1.TERMINAL_CONSTANTS.COMMANDS.START_OUTPUT,
      terminalId,
      timestamp: Date.now(),
    });
    this.deps.eventCoordinator?.flushBufferedOutput(terminalId);
    this.deps.terminalInitStateMachine.markPromptReady(terminalId, 'startOutput');
    this.deps.watchdogCoordinator.stopForTerminal(terminalId, 'promptReady');
    this.deps.watchdogCoordinator.clearSafeMode(terminalId);
    this.deps.watchdogCoordinator.markInitSuccess(terminalId);
  }
  /**
   * Initialize terminals in the WebView by sending terminalCreated messages for all existing terminals.
   */
  async initializeTerminal() {
    (0, logger_1.provider)('🔧 [PROVIDER] Initializing terminal...');
    const fontSettings = this.deps.getCurrentFontSettings();
    (0, logger_1.provider)('🔤 [PROVIDER] Font settings for terminal creation:', fontSettings);
    const terminals = this.deps.getTerminals();
    for (const terminal of terminals) {
      const displayModeOverride = this.deps.consumeCreationDisplayModeOverride(terminal.id);
      await this.deps.sendMessage({
        command: 'terminalCreated',
        terminal: {
          id: terminal.id,
          name: terminal.name,
          cwd: terminal.cwd || this.deps.safeProcessCwd(),
          isActive: terminal.id === this.deps.getActiveTerminalId(),
        },
        config: {
          fontSettings,
          ...(displayModeOverride ? { displayModeOverride } : {}),
        },
      });
    }
    await this.deps.sendMessage({
      command: 'stateUpdate',
      state: this.deps.getCurrentState(),
    });
    (0, logger_1.provider)('✅ [PROVIDER] Terminal initialization complete');
  }
  /**
   * Ensure at least one terminal exists, creating one if needed.
   */
  ensureMultipleTerminals() {
    (0, logger_1.provider)('🔥 [ENSURE] _ensureMultipleTerminals called');
    try {
      const currentTerminals = this.deps.getTerminals().length;
      (0, logger_1.provider)(`🔍 [ENSURE] Current terminal count: ${currentTerminals}`);
      if (currentTerminals < 1) {
        (0, logger_1.provider)('🎯 [ENSURE] Creating minimum terminal (1)');
        const terminalId = this.deps.createTerminal();
        (0, logger_1.provider)(`✅ [ENSURE] Created terminal: ${terminalId}`);
        if (!terminalId) {
          (0, logger_1.provider)('❌ [ENSURE] createTerminal() returned null/undefined!');
          return;
        }
        this.deps.setActiveTerminal(terminalId);
        (0, logger_1.provider)(`🎯 [ENSURE] Set terminal as active: ${terminalId}`);
        (0, logger_1.provider)('🎯 [ENSURE] About to call initializeTerminal...');
        void this.initializeTerminal()
          .then(() => {
            (0, logger_1.provider)('🎯 [ENSURE] initializeTerminal completed');
          })
          .catch((err) => {
            (0, logger_1.provider)(`❌ [ENSURE] initializeTerminal failed: ${err}`);
          });
        (0, logger_1.provider)('🎯 [ENSURE] Called initializeTerminal (async)');
      } else {
        (0, logger_1.provider)(
          `✅ [ENSURE] Sufficient terminals already exist: ${currentTerminals}`
        );
      }
    } catch (error) {
      (0, logger_1.provider)(`❌ [ENSURE] Failed to ensure terminals: ${String(error)}`);
    }
  }
  /**
   * Sync terminal state to WebView after panel movement.
   */
  syncTerminalStateToWebView() {
    (0, logger_1.provider)('🔄 [PROVIDER] Syncing terminal state to WebView after panel move');
    void this.initializeTerminal();
    this.deps.sendFullCliAgentStateSync();
    (0, logger_1.provider)('✅ [PROVIDER] Terminal state sync complete');
  }
  /**
   * Register watchdog listeners for terminal create/remove events.
   */
  registerInitializationWatchdogs() {
    try {
      const createdDisposable = this.deps.onTerminalCreated((terminal) => {
        if (!terminal?.id) {
          return;
        }
        this.deps.watchdogCoordinator.recordInitStart(terminal.id);
        this.deps.terminalInitStateMachine.markViewPending(terminal.id, 'terminalCreated');
        this.deps.terminalInitStateMachine.markPtySpawned(terminal.id, 'terminalCreated');
        if (this.deps.isWebViewInitialized()) {
          this.deps.watchdogCoordinator.startForTerminal(terminal.id, 'ack', 'terminalCreated');
        } else {
          this.deps.watchdogCoordinator.addPendingTerminal(terminal.id);
        }
      });
      const removedDisposable = this.deps.onTerminalRemoved((terminalId) => {
        this.deps.watchdogCoordinator.stopForTerminal(terminalId, 'terminalRemoved');
        this.deps.terminalInitStateMachine.reset(terminalId);
      });
      this.deps.addDisposable(createdDisposable);
      this.deps.addDisposable(removedDisposable);
      const existingTerminals = this.deps.getTerminals();
      for (const terminal of existingTerminals) {
        if (!terminal.id) {
          continue;
        }
        this.deps.watchdogCoordinator.recordInitStart(terminal.id);
        if (this.deps.isWebViewInitialized()) {
          this.deps.watchdogCoordinator.startForTerminal(terminal.id, 'ack', 'existingTerminal');
        } else {
          this.deps.watchdogCoordinator.addPendingTerminal(terminal.id);
        }
      }
    } catch (error) {
      (0, logger_1.provider)('⚠️ [PROVIDER] Failed to register initialization watchdogs:', error);
    }
  }
}
exports.TerminalInitLifecycleHandler = TerminalInitLifecycleHandler;
//# sourceMappingURL=TerminalInitLifecycleHandler.js.map
