'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalLifecycleManager = void 0;
const vscode = require('vscode');
const shared_1 = require('../types/shared');
const constants_1 = require('../constants');
const common_1 = require('../utils/common');
/** Manages terminal creation and deletion lifecycle */
class TerminalLifecycleManager {
  constructor(
    _terminals,
    _terminalNumberManager,
    _profileService,
    _terminalSpawner,
    _cliAgentService,
    _terminalCreatedEmitter,
    _terminalRemovedEmitter,
    _exitEmitter,
    _setupEventsCallback,
    _notifyStateUpdateCallback,
    _cleanupTerminalDataCallback
  ) {
    this._terminals = _terminals;
    this._terminalNumberManager = _terminalNumberManager;
    this._profileService = _profileService;
    this._terminalSpawner = _terminalSpawner;
    this._cliAgentService = _cliAgentService;
    this._terminalCreatedEmitter = _terminalCreatedEmitter;
    this._terminalRemovedEmitter = _terminalRemovedEmitter;
    this._exitEmitter = _exitEmitter;
    this._setupEventsCallback = _setupEventsCallback;
    this._notifyStateUpdateCallback = _notifyStateUpdateCallback;
    this._cleanupTerminalDataCallback = _cleanupTerminalDataCallback;
    this._terminalBeingKilled = new Set();
    this.operationQueue = Promise.resolve();
  }
  async resolveTerminalProfile(requestedProfile) {
    try {
      const profileResult = await this._profileService.resolveProfile(requestedProfile);
      return {
        shell: profileResult.profile.path,
        shellArgs: profileResult.profile.args || [],
        cwd: profileResult.profile.cwd,
        env: profileResult.profile.env,
      };
    } catch {
      const config = (0, common_1.getTerminalConfig)();
      return { shell: (0, common_1.getShellForPlatform)(), shellArgs: config.shellArgs || [] };
    }
  }
  async createTerminalWithProfile(profileName, overrides) {
    if (!this._terminalNumberManager.canCreate(this._terminals)) {
      (0, common_1.showWarningMessage)(
        'Maximum number of terminals reached. Please close some terminals before creating new ones.'
      );
      return '';
    }
    const terminalId = (0, common_1.generateTerminalId)();
    const profileConfig = await this.resolveTerminalProfile(profileName);
    const cwd = profileConfig.cwd || (0, common_1.getWorkingDirectory)();
    try {
      const env = {
        ...process.env,
        PWD: cwd,
        ...(vscode.workspace.workspaceFolders?.[0] && {
          VSCODE_WORKSPACE: vscode.workspace.workspaceFolders[0].uri.fsPath || '',
          VSCODE_PROJECT_NAME: vscode.workspace.workspaceFolders[0].name || '',
        }),
        ...(profileConfig.env && profileConfig.env),
      };
      const { ptyProcess } = this._terminalSpawner.spawnTerminal({
        terminalId,
        shell: profileConfig.shell,
        shellArgs: profileConfig.shellArgs || [],
        cwd,
        env,
      });
      const terminalNumber = this._terminalNumberManager.findAvailableNumber(this._terminals);
      if (!terminalNumber) {
        throw new Error('Unable to assign terminal number');
      }
      const terminal = {
        id: terminalId,
        name: (0, common_1.generateTerminalName)(terminalNumber),
        number: terminalNumber,
        pty: ptyProcess,
        ptyProcess,
        cwd,
        isActive: false,
        createdAt: new Date(),
        creationDisplayModeOverride: overrides?.displayModeOverride,
      };
      this._terminals.set(terminalId, terminal);
      this._setupEventsCallback(terminal);
      this._terminalCreatedEmitter.fire(terminal);
      this._notifyStateUpdateCallback();
      return terminalId;
    } catch (error) {
      (0, common_1.showErrorMessage)(`Failed to create terminal: ${error}`);
      return '';
    }
  }
  createTerminal(overrides) {
    const config = (0, common_1.getTerminalConfig)();
    const canCreateResult = this._terminalNumberManager.canCreate(this._terminals);
    if (!canCreateResult) {
      // Edge case: if terminals map is empty but canCreate returns false, force creation
      if (this._terminals.size !== 0) {
        (0, common_1.showWarningMessage)(
          `${constants_1.ERROR_MESSAGES.MAX_TERMINALS_REACHED} (${config.maxTerminals})`
        );
        return '';
      }
    }
    const terminalNumber = this._terminalNumberManager.findAvailableNumber(this._terminals);
    const terminalId = (0, common_1.generateTerminalId)();
    const shell = (0, common_1.getShellForPlatform)();
    const cwd = (0, common_1.getWorkingDirectory)();
    try {
      const env = {
        ...process.env,
        PWD: cwd,
        ...(vscode.workspace.workspaceFolders?.[0] && {
          VSCODE_WORKSPACE: vscode.workspace.workspaceFolders[0].uri.fsPath || '',
          VSCODE_PROJECT_NAME: vscode.workspace.workspaceFolders[0].name || '',
        }),
      };
      const { ptyProcess } = this._terminalSpawner.spawnTerminal({
        terminalId,
        shell,
        shellArgs: config.shellArgs || [],
        cwd,
        env,
      });
      const terminal = {
        id: terminalId,
        pty: ptyProcess,
        ptyProcess: ptyProcess,
        name: (0, common_1.generateTerminalName)(terminalNumber),
        number: terminalNumber,
        cwd: cwd,
        isActive: true,
        createdAt: new Date(),
        creationDisplayModeOverride: overrides?.displayModeOverride,
      };
      this._terminals.set(terminalId, terminal);
      this._setupEventsCallback(terminal);
      this._terminalCreatedEmitter.fire(terminal);
      this._notifyStateUpdateCallback();
      return terminalId;
    } catch (error) {
      (0, common_1.showErrorMessage)(
        constants_1.ERROR_MESSAGES.TERMINAL_CREATION_FAILED,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }
  validateDeletion(terminalId) {
    if (!this._terminals.has(terminalId)) {
      return { canDelete: false, reason: 'Terminal not found' };
    }
    if (this._terminals.size <= 1) {
      return { canDelete: false, reason: 'Must keep at least 1 terminal open' };
    }
    return { canDelete: true };
  }
  canRemoveTerminal(terminalId) {
    const validation = this.validateDeletion(terminalId);
    return { canRemove: validation.canDelete, reason: validation.reason };
  }
  async deleteTerminal(terminalId, options = {}) {
    return new Promise((resolve, reject) => {
      this.operationQueue = this.operationQueue.then(() => {
        try {
          resolve(this.performDeleteOperation(terminalId, options));
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  performDeleteOperation(terminalId, options) {
    const validation = this.validateDeletion(terminalId);
    if (!validation.canDelete) {
      if (!options.force) {
        (0, common_1.showWarningMessage)(validation.reason || 'Cannot delete terminal');
      }
      return { success: false, reason: validation.reason };
    }
    const terminal = this._terminals.get(terminalId);
    if (!terminal) {
      return { success: false, reason: 'Terminal not found' };
    }
    try {
      this._terminalBeingKilled.add(terminalId);
      terminal.processState = shared_1.ProcessState.KilledByUser;
      const p = terminal.ptyProcess || terminal.pty;
      if (p && typeof p.kill === 'function') {
        p.kill();
      }
      return { success: true, newState: undefined };
    } catch (error) {
      this._terminalBeingKilled.delete(terminalId);
      return { success: false, reason: `Delete failed: ${String(error)}` };
    }
  }
  removeTerminal(terminalId) {
    const terminal = this._terminals.get(terminalId);
    if (terminal) {
      try {
        const p = terminal.ptyProcess || terminal.pty;
        if (p && typeof p.kill === 'function') {
          p.kill();
        }
      } catch {
        // Ignore errors when killing process during removal
      }
    }
    this._cleanupTerminalDataCallback(terminalId);
  }
  getTerminal(terminalId) {
    return this._terminals.get(terminalId);
  }
  getTerminals() {
    return Array.from(this._terminals.values());
  }
  isTerminalBeingKilled(terminalId) {
    return this._terminalBeingKilled.has(terminalId);
  }
  markTerminalBeingKilled(terminalId) {
    this._terminalBeingKilled.add(terminalId);
  }
  unmarkTerminalBeingKilled(terminalId) {
    this._terminalBeingKilled.delete(terminalId);
  }
  async getAvailableProfiles() {
    return await this._profileService.getAvailableProfiles();
  }
  getDefaultProfile() {
    return this._profileService.getDefaultProfile();
  }
  dispose() {
    this._terminalBeingKilled.clear();
    for (const terminal of this._terminals.values()) {
      const p = terminal.ptyProcess || terminal.pty;
      try {
        if (p && typeof p.kill === 'function') {
          p.kill();
        }
      } catch {
        // Ignore errors when killing processes during dispose
      }
    }
  }
}
exports.TerminalLifecycleManager = TerminalLifecycleManager;
//# sourceMappingURL=TerminalLifecycleManager.js.map
