'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalProcessCoordinator = void 0;
const shared_1 = require('../types/shared');
const common_1 = require('../utils/common');
/** Manages PTY process lifecycle and shell integration */
class TerminalProcessCoordinator {
  constructor(_terminals, _shellIntegrationService, _stateUpdateEmitter, _bufferDataCallback) {
    this._terminals = _terminals;
    this._shellIntegrationService = _shellIntegrationService;
    this._stateUpdateEmitter = _stateUpdateEmitter;
    this._bufferDataCallback = _bufferDataCallback;
    this._shellInitialized = new Set();
    this._ptyOutputStarted = new Set();
    this._ptyDataDisposables = new Map();
    this._initialPromptGuards = new Map();
    this._launchTimeouts = new Map();
  }
  initializeShellForTerminal(terminalId, ptyProcess, safeMode) {
    if (this._shellInitialized.has(terminalId)) {
      return;
    }
    this._shellInitialized.add(terminalId);
    if (this._shellIntegrationService && !safeMode) {
      const terminal = this._terminals.get(terminalId);
      if (terminal) {
        const shellPath = terminal.ptyProcess?.spawnfile || '/bin/bash';
        void this._shellIntegrationService
          .injectShellIntegration(terminalId, shellPath, ptyProcess)
          .catch(() => {});
      }
    }
    if (!safeMode) {
      this.ensureInitialPrompt(terminalId, ptyProcess);
    }
  }
  startPtyOutput(terminalId) {
    if (this._ptyOutputStarted.has(terminalId)) {
      return;
    }
    const terminal = this._terminals.get(terminalId);
    if (!terminal || !terminal.ptyProcess) {
      return;
    }
    this._ptyOutputStarted.add(terminalId);
  }
  setupTerminalEvents(terminal, onExitCallback) {
    const { id: terminalId, ptyProcess } = terminal;
    terminal.processState = shared_1.ProcessState.Launching;
    this.notifyProcessStateChange(terminal, shared_1.ProcessState.Launching);
    const dataDisposable = ptyProcess.onData((data) => {
      if (terminal.processState === shared_1.ProcessState.Launching) {
        terminal.processState = shared_1.ProcessState.Running;
        this.notifyProcessStateChange(terminal, shared_1.ProcessState.Running);
      }
      if (this._shellIntegrationService) {
        try {
          this._shellIntegrationService.processTerminalData(terminalId, data);
        } catch {
          // Shell integration processing failed
        }
      }
      this._bufferDataCallback(terminalId, data);
    });
    this._ptyDataDisposables.set(terminalId, dataDisposable);
    ptyProcess.onExit((event) => {
      const exitCode = typeof event === 'number' ? event : event.exitCode;
      if (terminal.processState !== shared_1.ProcessState.KilledByUser) {
        terminal.processState =
          terminal.processState === shared_1.ProcessState.Launching
            ? shared_1.ProcessState.KilledDuringLaunch
            : shared_1.ProcessState.KilledByProcess;
      }
      this.notifyProcessStateChange(terminal, terminal.processState);
      onExitCallback(terminalId, exitCode);
    });
  }
  notifyProcessStateChange(terminal, newState) {
    const previousState = terminal.processState;
    this._stateUpdateEmitter.fire({
      type: 'processStateChange',
      terminalId: terminal.id,
      previousState,
      newState,
      timestamp: Date.now(),
    });
    this.handleProcessStateActions(terminal, newState);
  }
  handleProcessStateActions(terminal, newState) {
    switch (newState) {
      case shared_1.ProcessState.Launching:
        this.setupLaunchTimeout(terminal);
        break;
      case shared_1.ProcessState.Running:
        this.clearLaunchTimeout(terminal);
        break;
      case shared_1.ProcessState.KilledDuringLaunch:
        this.handleLaunchFailure(terminal);
        break;
      case shared_1.ProcessState.KilledByProcess:
        this.attemptProcessRecovery(terminal);
        break;
    }
  }
  setupLaunchTimeout(terminal) {
    this.clearLaunchTimeout(terminal);
    const timeoutId = setTimeout(() => {
      this._launchTimeouts.delete(terminal.id);
      if (terminal.processState === shared_1.ProcessState.Launching) {
        terminal.processState = shared_1.ProcessState.KilledDuringLaunch;
        this.notifyProcessStateChange(terminal, shared_1.ProcessState.KilledDuringLaunch);
      }
    }, 10000);
    this._launchTimeouts.set(terminal.id, timeoutId);
  }
  clearLaunchTimeout(terminal) {
    const timeoutId = this._launchTimeouts.get(terminal.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this._launchTimeouts.delete(terminal.id);
    }
  }
  handleLaunchFailure(terminal) {
    (0, common_1.showWarningMessage)(
      `Terminal ${terminal.name} failed to launch. Check your shell configuration.`
    );
  }
  attemptProcessRecovery(_terminal) {
    // Placeholder for persistent terminal recovery
  }
  ensureInitialPrompt(terminalId, ptyProcess) {
    this.cleanupInitialPromptGuard(terminalId);
    if (!ptyProcess || typeof ptyProcess.write !== 'function') {
      return;
    }
    let promptSeen = false;
    let timer;
    let dataDisposable;
    const guard = {
      disposed: false,
      dispose: () => {
        if (guard.disposed) {
          return;
        }
        guard.disposed = true;
        if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (dataDisposable && typeof dataDisposable.dispose === 'function') {
          dataDisposable.dispose();
        }
        if (this._initialPromptGuards.get(terminalId) === guard) {
          this._initialPromptGuards.delete(terminalId);
        }
      },
    };
    if (ptyProcess.onData) {
      try {
        dataDisposable = ptyProcess.onData((chunk) => {
          if (!promptSeen && this.hasVisibleOutput(chunk)) {
            promptSeen = true;
            guard.dispose();
          }
        });
      } catch {
        // Failed to attach prompt listener
      }
    }
    timer = setTimeout(() => {
      if (!promptSeen) {
        try {
          ptyProcess.write('\r');
        } catch {
          // Failed to send newline fallback
        }
      }
      guard.dispose();
    }, 1200);
    this._initialPromptGuards.set(terminalId, guard);
  }
  cleanupInitialPromptGuard(terminalId) {
    this._initialPromptGuards.get(terminalId)?.dispose();
  }
  hasVisibleOutput(data) {
    if (!data) {
      return false;
    }
    if (data.includes(']633;')) {
      return true;
    }
    const cleaned = data
      .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
      .replace(/\x1b\][^\x07]*\x07/g, '')
      .replace(/\x1b[P^_].*?\x1b\\/g, '')
      .replace(/\u0007/g, '')
      .replace(/[\r\n]/g, '')
      .trim();
    return cleaned.length > 0;
  }
  cleanupPtyOutput(terminalId) {
    const disposable = this._ptyDataDisposables.get(terminalId);
    if (disposable) {
      disposable.dispose();
      this._ptyDataDisposables.delete(terminalId);
    }
    this._ptyOutputStarted.delete(terminalId);
    this._shellInitialized.delete(terminalId);
    const timeoutId = this._launchTimeouts.get(terminalId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this._launchTimeouts.delete(terminalId);
    }
    this.cleanupInitialPromptGuard(terminalId);
  }
  dispose() {
    for (const disposable of this._ptyDataDisposables.values()) {
      try {
        disposable.dispose();
      } catch {
        // Disposal error
      }
    }
    this._ptyDataDisposables.clear();
    for (const guard of this._initialPromptGuards.values()) {
      try {
        guard.dispose();
      } catch {
        // Disposal error
      }
    }
    this._initialPromptGuards.clear();
    for (const timeoutId of this._launchTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this._launchTimeouts.clear();
    this._shellInitialized.clear();
    this._ptyOutputStarted.clear();
  }
}
exports.TerminalProcessCoordinator = TerminalProcessCoordinator;
//# sourceMappingURL=TerminalProcessCoordinator.js.map
