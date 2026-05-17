'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalInstanceService = void 0;
const pty = require('node-pty');
const logger_1 = require('../../utils/logger');
const common_1 = require('../../utils/common');
const TerminalNumberManager_1 = require('../../utils/TerminalNumberManager');
const TerminalProfileService_1 = require('../../services/TerminalProfileService');
const SystemConstants_1 = require('../../constants/SystemConstants');
/**
 * Terminal Instance Service
 *
 * VS Code pattern: ITerminalInstanceService implementation
 * Responsible for creating and disposing terminal instances.
 *
 * Based on VS Code's ITerminalInstanceService - separates instance creation
 * from service orchestration (TerminalManager/ITerminalService).
 *
 * Responsibilities:
 * - Terminal instance creation (PTY spawning)
 * - Instance initialization (shell integration)
 * - Instance disposal (process cleanup)
 * - Terminal profile resolution
 *
 * @see src/terminals/interfaces/ITerminalService.ts
 */
class TerminalInstanceService {
  constructor() {
    this._shellIntegrationService = null;
    // Track terminals created by this service
    this._terminals = new Map();
    // Track terminals being created to prevent races
    this._terminalsBeingCreated = new Set();
    const config = (0, common_1.getTerminalConfig)();
    this._maxTerminals =
      config.maxTerminals || SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT;
    this._terminalNumberManager = new TerminalNumberManager_1.TerminalNumberManager(
      this._maxTerminals
    );
    this._profileService = new TerminalProfileService_1.TerminalProfileService();
    (0, logger_1.terminal)('🔄 [InstanceService] Terminal instance service initialized');
  }
  /**
   * Create a new terminal with the specified options
   */
  async createTerminal(options = {}) {
    const terminalId = (0, common_1.generateTerminalId)();
    try {
      // Prevent duplicate creation
      if (this._terminalsBeingCreated.has(terminalId)) {
        throw new Error(`Terminal ${terminalId} is already being created`);
      }
      // Check if we can create more terminals
      if (!this._terminalNumberManager.canCreate(this._terminals)) {
        throw new Error('Maximum number of terminals reached');
      }
      this._terminalsBeingCreated.add(terminalId);
      (0, logger_1.terminal)(
        `🚀 [InstanceService] Creating terminal ${terminalId} with options:`,
        options
      );
      // Get terminal number from manager
      const terminalNumber = this._terminalNumberManager.findAvailableNumber(this._terminals);
      // Resolve shell and working directory
      const terminalProfile = await this.resolveTerminalProfile(options.profileName);
      const shell = options.shell || terminalProfile.shell;
      const shellArgs = options.shellArgs || terminalProfile.args;
      const cwd = options.cwd || (await (0, common_1.getWorkingDirectory)());
      // Generate terminal name
      const terminalName =
        options.terminalName || (0, common_1.generateTerminalName)(terminalNumber);
      (0, logger_1.terminal)(
        `🔧 [InstanceService] Terminal config: shell=${shell}, args=[${shellArgs.join(', ')}], cwd=${cwd}`
      );
      // Create PTY process
      const ptyProcess = await this.createPtyProcess({
        shell,
        args: shellArgs,
        cwd,
        safeMode: options.safeMode || false,
      });
      // Create terminal instance
      const terminal = {
        id: terminalId,
        name: terminalName,
        number: terminalNumber,
        pty: ptyProcess,
        isActive: false,
        createdAt: new Date(),
        pid: ptyProcess.pid,
        cwd: cwd,
        shell: shell,
        shellArgs: shellArgs,
      };
      // Add to tracked terminals
      this._terminals.set(terminalId, terminal);
      // Initialize shell integration if available
      this.initializeShellIntegration(terminal, options.safeMode || false);
      (0, logger_1.terminal)(
        `✅ [InstanceService] Terminal created successfully: ${terminalId} (${terminalName})`
      );
      return terminal;
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [InstanceService] Failed to create terminal ${terminalId}:`,
        error
      );
      throw error;
    } finally {
      this._terminalsBeingCreated.delete(terminalId);
    }
  }
  /**
   * Dispose of a terminal and clean up resources
   */
  async disposeTerminal(terminal) {
    try {
      (0, logger_1.terminal)(
        `🗑️ [InstanceService] Disposing terminal ${terminal.id} (${terminal.name})`
      );
      // Kill PTY process
      if (terminal.pty) {
        try {
          terminal.pty.kill();
          // Wait briefly for graceful shutdown
          await new Promise((resolve) => setTimeout(resolve, 50));
          // Force kill
          terminal.pty.kill('SIGKILL');
        } catch (e) {
          (0, logger_1.terminal)(`⚠️ [InstanceService] Error killing PTY for ${terminal.id}:`, e);
        }
      }
      // Remove from tracked terminals
      this._terminals.delete(terminal.id);
      (0, logger_1.terminal)(`✅ [InstanceService] Terminal ${terminal.id} disposed successfully`);
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [InstanceService] Error disposing terminal ${terminal.id}:`,
        error
      );
      throw error;
    }
  }
  /**
   * Resize a terminal
   */
  resizeTerminal(terminal, cols, rows) {
    try {
      if (!terminal.pty) {
        (0, logger_1.terminal)(
          `⚠️ [InstanceService] Cannot resize terminal without PTY ${terminal.id}`
        );
        return;
      }
      terminal.pty.resize(cols, rows);
      (0, logger_1.terminal)(
        `📏 [InstanceService] Resized terminal ${terminal.id} to ${cols}x${rows}`
      );
    } catch (error) {
      (0, logger_1.terminal)(`❌ [InstanceService] Error resizing terminal ${terminal.id}:`, error);
      throw error;
    }
  }
  /**
   * Send input to a terminal
   */
  sendInputToTerminal(terminal, data) {
    try {
      if (!terminal.pty) {
        (0, logger_1.terminal)(
          `⚠️ [InstanceService] Cannot send input to terminal without PTY ${terminal.id}`
        );
        return;
      }
      terminal.pty.write(data);
      (0, logger_1.terminal)(
        `⌨️ [InstanceService] Sent ${data.length} chars to terminal ${terminal.id}`
      );
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [InstanceService] Error sending input to terminal ${terminal.id}:`,
        error
      );
      throw error;
    }
  }
  /**
   * Check if a terminal is alive
   */
  isTerminalAlive(terminal) {
    return this._terminals.has(terminal.id) && !!(terminal.pty && terminal.pty.pid > 0);
  }
  /**
   * Get terminal statistics
   */
  getTerminalStats() {
    const usedNumbers = Array.from(this._terminals.values())
      .map((t) => t.number)
      .filter((n) => typeof n === 'number');
    return {
      maxTerminals: this._maxTerminals,
      availableNumbers: this._terminalNumberManager.getAvailableSlots(this._terminals),
      usedNumbers,
      terminalsBeingCreated: this._terminalsBeingCreated.size,
    };
  }
  /**
   * Resolve terminal profile for shell configuration
   */
  async resolveTerminalProfile(requestedProfile) {
    try {
      if (requestedProfile) {
        try {
          // const profile = await this._profileService.getProfile(requestedProfile);
          // Profile service method not available, using default
          (0, logger_1.terminal)(
            `⚠️ [InstanceService] Profile service not available, using default for: ${requestedProfile}`
          );
        } catch (error) {
          (0, logger_1.terminal)(
            `⚠️ [InstanceService] Error getting profile ${requestedProfile}:`,
            error
          );
        }
      }
      // Fallback to platform default
      const defaultShell = (0, common_1.getShellForPlatform)();
      (0, logger_1.terminal)(`📋 [InstanceService] Using default shell: ${defaultShell}`);
      return {
        shell: defaultShell,
        args: [],
        description: 'Default Shell',
      };
    } catch (error) {
      (0, logger_1.terminal)(`❌ [InstanceService] Error resolving terminal profile:`, error);
      // Final fallback
      return {
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
        args: [],
        description: 'Fallback Shell',
      };
    }
  }
  /**
   * Create PTY process with safe mode support
   */
  async createPtyProcess(options) {
    try {
      const { shell, args, cwd, safeMode } = options;
      // Safe mode: use simpler shell configuration
      const ptyOptions = {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd,
        env: {
          ...process.env,
          ...(safeMode && {
            // Safe mode environment variables
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
          }),
        },
      };
      (0, logger_1.terminal)(
        `🔧 [InstanceService] Creating PTY process: ${shell} ${args.join(' ')}`
      );
      const ptyProcess = pty.spawn(shell, args, ptyOptions);
      // Verify process was created successfully
      if (!ptyProcess || !ptyProcess.pid) {
        throw new Error(`Failed to spawn PTY process for shell: ${shell}`);
      }
      (0, logger_1.terminal)(
        `✅ [InstanceService] PTY process created with PID: ${ptyProcess.pid}`
      );
      return ptyProcess;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [InstanceService] Failed to create PTY process:`, error);
      throw new Error(`Terminal creation failed: ${String(error)}`);
    }
  }
  /**
   * Initialize shell integration for terminal
   */
  initializeShellIntegration(terminal, safeMode) {
    try {
      // Shell integration service initialization skipped due to constructor requirements
      if (!this._shellIntegrationService) {
        // this._shellIntegrationService = new ShellIntegrationService();
        (0, logger_1.terminal)(
          `⚠️ [InstanceService] Shell integration service initialization skipped`
        );
      }
      // Skip shell integration in safe mode
      if (safeMode) {
        (0, logger_1.terminal)(
          `⚠️ [InstanceService] Skipping shell integration for safe mode terminal ${terminal.id}`
        );
        return;
      }
      // this._shellIntegrationService.attachToTerminal(terminal);
      // Method not available in current implementation
      (0, logger_1.terminal)(
        `🔗 [InstanceService] Shell integration attachment skipped for terminal ${terminal.id}`
      );
    } catch (error) {
      (0, logger_1.terminal)(
        `⚠️ [InstanceService] Failed to initialize shell integration for terminal ${terminal.id}:`,
        error
      );
      // Non-fatal: continue without shell integration
    }
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    (0, logger_1.terminal)('🧹 [InstanceService] Disposing terminal lifecycle service');
    try {
      // Clear creation tracking
      this._terminalsBeingCreated.clear();
      // Dispose shell integration service
      if (this._shellIntegrationService) {
        this._shellIntegrationService.dispose();
        this._shellIntegrationService = null;
      }
      (0, logger_1.terminal)('✅ [InstanceService] Terminal lifecycle service disposed');
    } catch (error) {
      (0, logger_1.terminal)(
        '❌ [InstanceService] Error disposing terminal lifecycle service:',
        error
      );
    }
  }
}
exports.TerminalInstanceService = TerminalInstanceService;
//# sourceMappingURL=TerminalInstanceService.js.map
