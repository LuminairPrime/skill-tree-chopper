'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalIOCoordinator = void 0;
const logger_1 = require('../utils/logger');
const ENABLE_TERMINAL_DEBUG_LOGS = process.env.SECONDARY_TERMINAL_DEBUG_LOGS === 'true';
/** Handles terminal input/output operations */
class TerminalIOCoordinator {
  constructor(_terminals, _activeTerminalManager, _cliAgentService) {
    this._terminals = _terminals;
    this._activeTerminalManager = _activeTerminalManager;
    this._cliAgentService = _cliAgentService;
    this._debugLoggingEnabled = ENABLE_TERMINAL_DEBUG_LOGS;
  }
  debugLog(...args) {
    if (this._debugLoggingEnabled) {
      (0, logger_1.terminal)(...args);
    }
  }
  sendInput(data, terminalId) {
    const resolvedTerminalId = this.resolveTerminalId(terminalId);
    if (!resolvedTerminalId) {
      return;
    }
    const terminal = this._terminals.get(resolvedTerminalId);
    if (!terminal) {
      return;
    }
    try {
      this._cliAgentService.handleInputChunk(resolvedTerminalId, data);
      const result = this.writeToPtyWithValidation(terminal, data);
      if (!result.success && !this.attemptPtyRecovery(terminal, data)) {
        throw new Error(result.error || 'PTY write failed');
      }
    } catch (error) {
      (0, logger_1.terminal)(`Error sending input to ${terminal.name}:`, error);
    }
  }
  resolveTerminalId(terminalId) {
    if (terminalId && this._terminals.has(terminalId)) {
      return terminalId;
    }
    const activeId = this._activeTerminalManager.getActive();
    if (activeId && this._terminals.has(activeId)) {
      return activeId;
    }
    const availableTerminals = Array.from(this._terminals.keys());
    return availableTerminals[0];
  }
  resize(cols, rows, terminalId) {
    const id = terminalId || this._activeTerminalManager.getActive();
    if (!id) {
      return;
    }
    const terminal = this._terminals.get(id);
    if (!terminal) {
      return;
    }
    try {
      const result = this.resizePtyWithValidation(terminal, cols, rows);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      (0, logger_1.terminal)('Failed to resize terminal:', error);
    }
  }
  getTerminalInfo(terminalId) {
    const terminal = this._terminals.get(terminalId);
    if (!terminal) {
      return undefined;
    }
    return {
      id: terminal.id,
      name: terminal.name,
      isActive: terminal.isActive,
      ...(terminal.indicatorColor ? { indicatorColor: terminal.indicatorColor } : {}),
    };
  }
  writeToTerminal(terminalId, data) {
    const terminal = this._terminals.get(terminalId);
    if (!terminal) {
      return false;
    }
    try {
      const ptyInstance = terminal.ptyProcess || terminal.pty;
      if (!ptyInstance || typeof ptyInstance.write !== 'function') {
        return false;
      }
      ptyInstance.write(data);
      return true;
    } catch {
      return false;
    }
  }
  resizeTerminal(terminalId, cols, rows) {
    try {
      this.resize(cols, rows, terminalId);
      return true;
    } catch {
      return false;
    }
  }
  writeToPtyWithValidation(terminal, data, retryAttempt = 0) {
    const ptyInstance = terminal.ptyProcess || terminal.pty;
    if (!ptyInstance) {
      if (retryAttempt >= TerminalIOCoordinator.MAX_PTY_RETRY_ATTEMPTS) {
        return { success: false, error: `PTY not ready after ${retryAttempt} retries` };
      }
      const delay = TerminalIOCoordinator.PTY_RETRY_DELAY_MS * Math.pow(1.5, retryAttempt);
      setTimeout(() => {
        const updatedTerminal = this._terminals.get(terminal.id);
        if (updatedTerminal) {
          this.writeToPtyWithValidation(updatedTerminal, data, retryAttempt + 1);
        }
      }, delay);
      return { success: false, error: 'PTY not ready, queued for retry' };
    }
    if (typeof ptyInstance.write !== 'function') {
      return { success: false, error: 'PTY missing write method' };
    }
    if (
      terminal.ptyProcess &&
      typeof terminal.ptyProcess === 'object' &&
      'killed' in terminal.ptyProcess &&
      terminal.ptyProcess.killed
    ) {
      return { success: false, error: 'PTY process killed' };
    }
    try {
      ptyInstance.write(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Write failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  attemptPtyRecovery(terminal, data) {
    // Primary PTY is ptyProcess if available, otherwise pty
    const primary = terminal.ptyProcess;
    // Try alternative PTY instances (excluding the primary that already failed)
    const alternatives = [terminal.ptyProcess, terminal.pty].filter(
      (p) => p != null && p !== primary
    );
    for (const ptyInstance of alternatives) {
      if (typeof ptyInstance.write === 'function') {
        try {
          ptyInstance.write(data);
          // If we succeeded with terminal.pty, clear the failed ptyProcess
          if (ptyInstance === terminal.pty) {
            terminal.ptyProcess = undefined;
          }
          return true;
        } catch {
          // Try next alternative
        }
      }
    }
    return false;
  }
  resizePtyWithValidation(terminal, cols, rows) {
    if (cols <= 0 || rows <= 0) {
      return { success: false, error: `Invalid dimensions: ${cols}x${rows}` };
    }
    if (cols > 500 || rows > 200) {
      return { success: false, error: `Dimensions too large: ${cols}x${rows}` };
    }
    const ptyInstance = terminal.ptyProcess || terminal.pty;
    if (!ptyInstance) {
      return { success: false, error: 'No PTY instance' };
    }
    if (typeof ptyInstance.resize !== 'function') {
      return { success: false, error: 'PTY missing resize method' };
    }
    if (
      terminal.ptyProcess &&
      typeof terminal.ptyProcess === 'object' &&
      'killed' in terminal.ptyProcess &&
      terminal.ptyProcess.killed
    ) {
      return { success: false, error: 'PTY process killed' };
    }
    try {
      ptyInstance.resize(cols, rows);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Resize failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
exports.TerminalIOCoordinator = TerminalIOCoordinator;
TerminalIOCoordinator.MAX_PTY_RETRY_ATTEMPTS = 3;
TerminalIOCoordinator.PTY_RETRY_DELAY_MS = 300;
//# sourceMappingURL=TerminalIOCoordinator.js.map
