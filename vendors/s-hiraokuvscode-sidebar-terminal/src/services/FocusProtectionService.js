'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FocusProtectionService = void 0;
const vscode = require('vscode');
const DisposableStore_1 = require('../utils/DisposableStore');
const logger_1 = require('../utils/logger');
/**
 * Protects sidebar terminal focus from being stolen by other extensions.
 *
 * When enabled, monitors VS Code's active terminal changes. If the sidebar
 * terminal recently had focus and a standard terminal becomes active (e.g.
 * via another extension calling terminal.show()), this service automatically
 * restores focus to the sidebar terminal after a short delay.
 *
 * Guard logic: requires WebView visible AND (terminal currently focused OR
 * was focused within RECENT_FOCUS_WINDOW_MS). The window accounts for the
 * race where terminalBlurred arrives via the WebView bridge before
 * onDidChangeActiveTerminal fires.
 *
 * The window is also refreshed by notifyInteraction() whenever the user
 * actively interacts with the terminal (keystrokes), so that long typing
 * sessions don't let _lastFocusedTime go stale and defeat protection.
 */
class FocusProtectionService {
  constructor(deps) {
    this._disposables = new DisposableStore_1.DisposableStore();
    this._cliAgentConnected = false;
    this._lastRestoreTime = 0;
    this._lastFocusedTime = 0;
    this._lastInteractionTime = 0;
    this._deps = deps;
    this._enabled = this._readSetting();
    this._disposables.add(
      vscode.window.onDidChangeActiveTerminal((terminal) => {
        this._onActiveTerminalChanged(terminal);
      })
    );
    // Diagnostic: log when a new integrated terminal is opened. Helps
    // correlate which extension created a terminal just before an
    // onDidChangeActiveTerminal event steals focus from the sidebar.
    this._disposables.add(
      vscode.window.onDidOpenTerminal((terminal) => {
        if (!(0, logger_1.isDebugEnabled)()) return;
        (0, logger_1.provider)(
          '🔍 [FOCUS_PROTECTION] onDidOpenTerminal fired:',
          this._describeTerminal(terminal)
        );
      })
    );
    this._disposables.add(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('secondaryTerminal.focusProtection')) {
          this._enabled = this._readSetting();
        }
      })
    );
  }
  /**
   * Called by the extension when sidebar terminal focus state changes.
   * Tracks the last time the sidebar terminal had focus.
   */
  notifyFocusChanged(focused) {
    if (focused) {
      this._lastFocusedTime = Date.now();
      this._clearPendingRestore();
      return;
    }
    if (this._shouldRestoreAfterBlur()) {
      this._scheduleFocusRestore();
    }
  }
  /**
   * Called when a CLI agent (e.g. Claude Code) connects or disconnects in the
   * sidebar terminal. When connected, focus protection becomes more aggressive
   * because the agent's VS Code extension may repeatedly call terminal.show()
   * to steal focus during MCP tool operations.
   */
  notifyCliAgentConnected(connected) {
    this._cliAgentConnected = connected;
  }
  /**
   * Called by the extension on user interaction (keystrokes / input) with the
   * sidebar terminal. Refreshes the recent-focus window so that long typing
   * sessions do not let the window expire while the user is actively working.
   *
   * Only refreshes when the WebView is visible, to avoid false positives from
   * buffered messages arriving after the view has been hidden.
   */
  notifyInteraction(terminalId) {
    if (!this._deps.isWebViewVisible()) return;
    const now = Date.now();
    this._lastFocusedTime = now;
    this._lastInteractionTime = now;
    if (terminalId !== undefined) {
      this._lastInteractedTerminalId = terminalId;
    }
  }
  _readSetting() {
    return vscode.workspace.getConfiguration('secondaryTerminal').get('focusProtection', true);
  }
  _hadRecentFocus() {
    if (this._deps.isTerminalFocused()) return true;
    const window = this._cliAgentConnected
      ? FocusProtectionService.CLI_AGENT_FOCUS_WINDOW_MS
      : FocusProtectionService.RECENT_FOCUS_WINDOW_MS;
    return Date.now() - this._lastFocusedTime < window;
  }
  _hadRecentInteraction() {
    return (
      Date.now() - this._lastInteractionTime < FocusProtectionService.RECENT_INTERACTION_WINDOW_MS
    );
  }
  _shouldRestoreAfterBlur() {
    if (!this._enabled) return false;
    if (!this._deps.isWebViewVisible()) return false;
    if (this._deps.isTerminalFocused()) return false;
    // When a CLI agent is connected, skip the interaction check — the agent's
    // VS Code extension steals focus during background MCP operations when the
    // user is not actively typing.
    if (!this._cliAgentConnected && !this._hadRecentInteraction()) return false;
    return this._hadRecentFocus();
  }
  /**
   * Best-effort fingerprint of a vscode.Terminal so we can log who activated it.
   *
   * VS Code does not expose which extension created a terminal, but
   * `creationOptions` usually contains enough (name, shellPath, env, iconPath,
   * and for ExtensionTerminalOptions the custom `pty` flag) to identify the
   * culprit by pattern matching against known extensions.
   */
  _describeTerminal(terminal) {
    // Fire-and-forget async resolution of processId. The error handler swallows
    // rejections so a pending pty that never resolves never becomes an unhandled
    // rejection.
    Promise.resolve(terminal.processId).then(
      (pid) =>
        (0, logger_1.provider)('🔍 [FOCUS_PROTECTION] terminal processId resolved:', {
          name: terminal.name,
          pid,
        }),
      () => undefined
    );
    const info = {
      name: terminal.name,
      state: terminal.state,
    };
    const opts = terminal.creationOptions;
    if (opts) {
      const terminalOpts = opts;
      const extOpts = opts;
      const cwd = terminalOpts.cwd;
      info.creationOptions = {
        name: terminalOpts.name,
        shellPath: terminalOpts.shellPath,
        shellArgs: terminalOpts.shellArgs,
        cwd: typeof cwd === 'string' ? cwd : cwd?.fsPath,
        hasPty: Boolean(extOpts.pty),
        iconPath: this._describeIcon(terminalOpts.iconPath),
        envKeys: terminalOpts.env ? Object.keys(terminalOpts.env) : undefined,
        isTransient: terminalOpts.isTransient,
        hideFromUser: terminalOpts.hideFromUser,
      };
    }
    return info;
  }
  _describeIcon(icon) {
    if (!icon) return undefined;
    if (typeof icon === 'string') return icon;
    if (icon instanceof vscode.ThemeIcon) return `ThemeIcon(${icon.id})`;
    if (icon.fsPath) return icon.fsPath;
    return undefined;
  }
  _onActiveTerminalChanged(terminal) {
    // Diagnostic: log who just became the active integrated terminal so users
    // can identify which external extension is stealing focus. Guarded by
    // isDebugEnabled() to avoid the describe-cost in production.
    if ((0, logger_1.isDebugEnabled)()) {
      if (terminal) {
        (0, logger_1.provider)(
          '🔍 [FOCUS_PROTECTION] onDidChangeActiveTerminal fired:',
          this._describeTerminal(terminal)
        );
      } else {
        (0, logger_1.provider)('🔍 [FOCUS_PROTECTION] onDidChangeActiveTerminal fired: undefined');
      }
    }
    if (!this._enabled) {
      (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] skip: disabled');
      return;
    }
    if (!terminal) {
      (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] skip: active terminal is undefined');
      return;
    }
    if (!this._deps.isWebViewVisible()) {
      (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] skip: webview not visible');
      return;
    }
    if (!this._hadRecentFocus()) {
      (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] skip: no recent focus');
      return;
    }
    this._scheduleFocusRestore();
  }
  _clearPendingRestore() {
    if (this._pendingTimer !== undefined) {
      clearTimeout(this._pendingTimer);
      this._pendingTimer = undefined;
    }
  }
  _scheduleFocusRestore() {
    this._clearPendingRestore();
    const now = Date.now();
    const cooldown = this._cliAgentConnected
      ? FocusProtectionService.CLI_AGENT_COOLDOWN_MS
      : FocusProtectionService.COOLDOWN_MS;
    if (now - this._lastRestoreTime < cooldown) {
      (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] skip: cooldown active');
      return;
    }
    (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] scheduling focus restoration');
    // Capture the terminal ID at schedule time, not at fire time, because
    // the active terminal may change between scheduling and execution.
    const targetTerminalId = this._lastInteractedTerminalId;
    this._pendingTimer = setTimeout(() => {
      this._pendingTimer = undefined;
      this._lastRestoreTime = Date.now();
      // Use the VS Code auto-generated view focus command: `${viewId}.focus`.
      // The view id is `secondaryTerminal` (see package.json contributes.views).
      // Mirrors the working sequence in KeyboardShortcutService.focusTerminal().
      void vscode.commands.executeCommand('secondaryTerminal.focus');
      // Then ask the webview to push DOM focus back into the specific xterm.js
      // terminal that the user was interacting with.
      try {
        this._deps.sendWebviewFocus?.(targetTerminalId);
      } catch (err) {
        (0, logger_1.provider)('🛡️ [FOCUS_PROTECTION] sendWebviewFocus failed:', err);
      }
    }, FocusProtectionService.RESTORE_DELAY_MS);
  }
  dispose() {
    this._clearPendingRestore();
    this._disposables.dispose();
  }
}
exports.FocusProtectionService = FocusProtectionService;
FocusProtectionService.RESTORE_DELAY_MS = 150;
FocusProtectionService.COOLDOWN_MS = 500;
FocusProtectionService.RECENT_FOCUS_WINDOW_MS = 600;
FocusProtectionService.RECENT_INTERACTION_WINDOW_MS = 200;
/**
 * When a CLI agent is connected, use a much longer focus window and shorter
 * cooldown. The agent's VS Code extension calls terminal.show() during MCP
 * tool operations which can happen at any time during a long-running task.
 * 10 minutes covers even lengthy code-generation / multi-file edit sessions.
 */
FocusProtectionService.CLI_AGENT_FOCUS_WINDOW_MS = 600000;
/** Shorter cooldown because MCP tool calls can steal focus in rapid succession. */
FocusProtectionService.CLI_AGENT_COOLDOWN_MS = 150;
//# sourceMappingURL=FocusProtectionService.js.map
