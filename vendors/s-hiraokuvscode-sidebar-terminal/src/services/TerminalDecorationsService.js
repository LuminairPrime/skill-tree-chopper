'use strict';
/**
 * Terminal Decorations Service - VS Code standard command result decorations
 * Provides visual indicators for command success/failure like VS Code integrated terminal
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalDecorationsService = void 0;
const vscode = require('vscode');
const logger_1 = require('../utils/logger');
class TerminalDecorationsService {
  constructor() {
    this._decorations = new Map();
    this._decorationEmitter = new vscode.EventEmitter();
    this.onDecorationsChanged = this._decorationEmitter.event;
    this._settings = this.loadSettings();
    // Monitor configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('secondaryTerminal.decorations') ||
        e.affectsConfiguration('terminal.integrated.shellIntegration.decorationsEnabled')
      ) {
        this._settings = this.loadSettings();
        (0, logger_1.terminal)('🎨 [DECORATIONS] Settings updated:', this._settings);
      }
    });
  }
  /**
   * Load decoration settings from VS Code configuration
   */
  loadSettings() {
    const config = vscode.workspace.getConfiguration();
    // Check VS Code standard setting first
    const vscodeDecorations = config.get(
      'terminal.integrated.shellIntegration.decorationsEnabled',
      true
    );
    const sidebarConfig = config.get('secondaryTerminal.decorations', {});
    return {
      enabled: sidebarConfig.enabled ?? vscodeDecorations,
      showInGutter: sidebarConfig.showInGutter ?? true,
      showInOverviewRuler: sidebarConfig.showInOverviewRuler ?? true,
      successColor: sidebarConfig.successColor ?? '#00ff00',
      errorColor: sidebarConfig.errorColor ?? '#ff0000',
      runningColor: sidebarConfig.runningColor ?? '#ffff00',
    };
  }
  /**
   * Add command decoration for a terminal
   */
  addDecoration(decoration) {
    if (!this._settings.enabled) {
      return;
    }
    const fullDecoration = {
      ...decoration,
      timestamp: Date.now(),
    };
    const terminalDecorations = this._decorations.get(decoration.terminalId) || [];
    terminalDecorations.push(fullDecoration);
    // Keep only last 100 decorations per terminal for performance
    if (terminalDecorations.length > 100) {
      terminalDecorations.splice(0, terminalDecorations.length - 100);
    }
    this._decorations.set(decoration.terminalId, terminalDecorations);
    (0, logger_1.terminal)(
      `🎨 [DECORATIONS] Added ${decoration.status} decoration for terminal ${decoration.terminalId}: ${decoration.command || 'unknown'}`
    );
    this._decorationEmitter.fire({
      terminalId: decoration.terminalId,
      decorations: [...terminalDecorations],
    });
  }
  /**
   * Update running command to completed status
   */
  completeCommand(terminalId, commandId, exitCode) {
    const decorations = this._decorations.get(terminalId);
    if (!decorations) return;
    const decoration = decorations.find((d) => d.commandId === commandId && d.status === 'running');
    if (decoration) {
      decoration.status = exitCode === 0 ? 'success' : 'error';
      decoration.exitCode = exitCode;
      (0, logger_1.terminal)(
        `🎨 [DECORATIONS] Completed command ${commandId} with exit code ${exitCode}`
      );
      this._decorationEmitter.fire({
        terminalId,
        decorations: [...decorations],
      });
    }
  }
  /**
   * Get decorations for a terminal
   */
  getDecorations(terminalId) {
    return this._decorations.get(terminalId) || [];
  }
  /**
   * Clear decorations for a terminal
   */
  clearDecorations(terminalId) {
    this._decorations.delete(terminalId);
    this._decorationEmitter.fire({
      terminalId,
      decorations: [],
    });
    (0, logger_1.terminal)(`🎨 [DECORATIONS] Cleared decorations for terminal ${terminalId}`);
  }
  /**
   * Get current decoration settings
   */
  getSettings() {
    return { ...this._settings };
  }
  /**
   * Process shell integration output for command decorations
   */
  processShellIntegrationData(terminalId, data) {
    if (!this._settings.enabled) return;
    // VS Code shell integration escape sequences
    const commandStartPattern = /\x1b]633;A(?:;(.*))??\x07/;
    const commandEndPattern = /\x1b]633;D(?:;(\d+))?\x07/;
    // Command start (A sequence)
    const commandStartMatch = data.match(commandStartPattern);
    if (commandStartMatch) {
      const command = commandStartMatch[1] || 'unknown';
      const commandId = `${terminalId}-${Date.now()}`;
      this.addDecoration({
        terminalId,
        commandId,
        line: 0, // Will be updated with actual line number from WebView
        status: 'running',
        command,
      });
      return;
    }
    // Command end (D sequence)
    const commandEndMatch = data.match(commandEndPattern);
    if (commandEndMatch) {
      const exitCode = parseInt(commandEndMatch[1] || '0', 10);
      // Find the most recent running command for this terminal
      const decorations = this._decorations.get(terminalId) || [];
      const runningDecoration = decorations
        .filter((d) => d.status === 'running')
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      if (runningDecoration) {
        this.completeCommand(terminalId, runningDecoration.commandId, exitCode);
      }
    }
  }
  /**
   * Generate CSS classes for decorations
   */
  generateDecorationCSS() {
    if (!this._settings.enabled) return '';
    return `
      .terminal-command-decoration {
        position: absolute;
        left: 0;
        width: 4px;
        height: 1em;
        pointer-events: none;
      }
      
      .terminal-command-decoration.success {
        background-color: ${this._settings.successColor};
      }
      
      .terminal-command-decoration.error {
        background-color: ${this._settings.errorColor};
      }
      
      .terminal-command-decoration.running {
        background-color: ${this._settings.runningColor};
        animation: terminal-running-pulse 1.5s ease-in-out infinite;
      }
      
      @keyframes terminal-running-pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .terminal-overview-ruler-decoration {
        width: 2px;
        position: absolute;
        right: 0;
      }
      
      .terminal-overview-ruler-decoration.success {
        background-color: ${this._settings.successColor};
      }
      
      .terminal-overview-ruler-decoration.error {
        background-color: ${this._settings.errorColor};
      }
      
      .terminal-overview-ruler-decoration.running {
        background-color: ${this._settings.runningColor};
      }
    `;
  }
  /**
   * Dispose of resources
   */
  dispose() {
    this._decorationEmitter.dispose();
    this._decorations.clear();
    (0, logger_1.terminal)('🧹 [DECORATIONS] Service disposed');
  }
}
exports.TerminalDecorationsService = TerminalDecorationsService;
//# sourceMappingURL=TerminalDecorationsService.js.map
