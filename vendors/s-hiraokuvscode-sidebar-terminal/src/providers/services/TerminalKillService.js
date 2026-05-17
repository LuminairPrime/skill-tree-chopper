'use strict';
/**
 * TerminalKillService
 *
 * Terminal kill operations extracted from SecondaryTerminalProvider.
 * Handles confirmation dialogs, kill execution, and state synchronization.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalKillService = void 0;
const vscode = require('vscode');
const logger_1 = require('../../utils/logger');
class TerminalKillService {
  constructor(deps) {
    this.deps = deps;
    this.inFlightKills = new Set();
  }
  /**
   * Kill the active terminal with optional confirmation
   */
  async killTerminal() {
    const activeTerminalId = this.deps.getActiveTerminalId();
    if (!activeTerminalId) {
      (0, logger_1.provider)('⚠️ [PROVIDER] No active terminal to kill');
      return;
    }
    if (this.inFlightKills.has(activeTerminalId)) {
      return;
    }
    this.inFlightKills.add(activeTerminalId);
    try {
      if (await this.shouldConfirmKill(activeTerminalId)) {
        return;
      }
      await this.performKill(activeTerminalId);
    } finally {
      this.inFlightKills.delete(activeTerminalId);
    }
  }
  /**
   * Kill a specific terminal by ID with optional confirmation
   */
  async killSpecificTerminal(terminalId) {
    if (this.inFlightKills.has(terminalId)) {
      return;
    }
    this.inFlightKills.add(terminalId);
    try {
      if (await this.shouldConfirmKill(terminalId)) {
        return;
      }
      await this.performKill(terminalId);
    } finally {
      this.inFlightKills.delete(terminalId);
    }
  }
  /**
   * Check confirmation setting and show dialog if needed.
   * Returns true if user cancelled, false to proceed.
   */
  async shouldConfirmKill(terminalId) {
    const confirmBeforeKill = vscode.workspace
      .getConfiguration('secondaryTerminal')
      .get('confirmBeforeKill', false);
    if (!confirmBeforeKill) {
      return false;
    }
    const terminal = this.deps.getTerminal(terminalId);
    const terminalName = terminal?.name || `Terminal ${terminalId}`;
    const result = await vscode.window.showWarningMessage(
      `Are you sure you want to kill "${terminalName}"?`,
      { modal: true },
      'Kill Terminal'
    );
    if (result !== 'Kill Terminal') {
      (0, logger_1.provider)('⚠️ [PROVIDER] Terminal kill cancelled by user');
      return true;
    }
    return false;
  }
  /**
   * Execute the kill operation with proper state synchronization
   */
  async performKill(terminalId) {
    (0, logger_1.provider)(`🗑️ [PROVIDER] Killing terminal: ${terminalId}`);
    try {
      await this.deps.killTerminal(terminalId);
    } catch (error) {
      (0, logger_1.provider)(`❌ [PROVIDER] Error killing terminal: ${error}`);
      await this.deps.sendMessage({
        command: 'deleteTerminalResponse',
        terminalId: terminalId,
        success: false,
        reason: error instanceof Error ? error.message : 'Terminal deletion failed',
      });
      return;
    }
    // Send terminalRemoved message first (only on successful deletion)
    await this.deps.sendMessage({
      command: 'terminalRemoved',
      terminalId: terminalId,
    });
    // Small delay to ensure WebView processes terminalRemoved before stateUpdate
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Then send the updated state
    await this.deps.sendMessage({
      command: 'stateUpdate',
      state: this.deps.getCurrentState(),
    });
    (0, logger_1.provider)(`✅ [PROVIDER] Terminal killed: ${terminalId}`);
  }
}
exports.TerminalKillService = TerminalKillService;
//# sourceMappingURL=TerminalKillService.js.map
