"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalLifecycleService = void 0;
const pty = require("node-pty");
const shared_1 = require("../../types/shared");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
const TerminalNumberManager_1 = require("../../utils/TerminalNumberManager");
const TerminalProfileService_1 = require("../../services/TerminalProfileService");
const SystemConstants_1 = require("../../constants/SystemConstants");
/**
 * Service responsible for terminal lifecycle management
 *
 * This service extracts terminal creation, initialization, and disposal logic
 * from TerminalManager to improve:
 * - Single Responsibility: Focus only on terminal lifecycle
 * - Testability: Isolated terminal creation logic
 * - Reusability: Can be used by other components
 * - Maintainability: Cleaner separation of concerns
 */
class TerminalLifecycleService {
    constructor() {
        this._shellIntegrationService = null;
        // Track terminals being created to prevent races
        this._terminalsBeingCreated = new Set();
        const config = (0, common_1.getTerminalConfig)();
        this._terminalNumberManager = new TerminalNumberManager_1.TerminalNumberManager(config.maxTerminals);
        this._profileService = new TerminalProfileService_1.TerminalProfileService();
        (0, logger_1.terminal)('🔄 [LifecycleService] Terminal lifecycle service initialized');
    }
    /**
     * Create a new terminal with the specified options
     * @returns Result containing TerminalInstance or error details
     */
    async createTerminal(options = {}) {
        const terminalId = (0, common_1.generateTerminalId)();
        try {
            // Prevent duplicate creation
            if (this._terminalsBeingCreated.has(terminalId)) {
                return (0, shared_1.failureFromDetails)({
                    code: shared_1.ErrorCode.TERMINAL_ALREADY_EXISTS,
                    message: `Terminal ${terminalId} is already being created`,
                    context: { terminalId, options },
                });
            }
            this._terminalsBeingCreated.add(terminalId);
            (0, logger_1.terminal)(`🚀 [LifecycleService] Creating terminal ${terminalId} with options:`, options);
            // Get terminal number from manager
            const terminals = new Map(); // Empty for first terminal
            const terminalNumber = this._terminalNumberManager.findAvailableNumber(terminals);
            if (terminalNumber > SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT) {
                return (0, shared_1.failureFromDetails)({
                    code: shared_1.ErrorCode.RESOURCE_EXHAUSTED,
                    message: 'Maximum number of terminals reached',
                    context: {
                        maxTerminals: SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT,
                        attemptedNumber: terminalNumber,
                    },
                });
            }
            // Resolve shell and working directory
            const profileResult = await this.resolveTerminalProfile(options.profileName);
            const terminalProfile = profileResult; // Already handles errors internally with fallback
            const shell = options.shell || terminalProfile.shell;
            const shellArgs = options.shellArgs || terminalProfile.args;
            const cwd = options.cwd || (await (0, common_1.getWorkingDirectory)());
            // Generate terminal name
            const terminalName = options.terminalName || (0, common_1.generateTerminalName)(terminalNumber);
            (0, logger_1.terminal)(`🔧 [LifecycleService] Terminal config: shell=${shell}, args=[${shellArgs.join(', ')}], cwd=${cwd}`);
            // Create PTY process
            const ptyResult = await this.createPtyProcess({
                shell,
                args: shellArgs,
                cwd,
                safeMode: options.safeMode || false,
            });
            if (!ptyResult.success) {
                return ptyResult;
            }
            const ptyProcess = ptyResult.value;
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
            // Initialize shell integration if available (non-fatal)
            this.initializeShellIntegration(terminal, options.safeMode || false);
            (0, logger_1.terminal)(`✅ [LifecycleService] Terminal created successfully: ${terminalId} (${terminalName})`);
            return (0, shared_1.success)(terminal);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [LifecycleService] Failed to create terminal ${terminalId}:`, error);
            return (0, shared_1.failureFromDetails)({
                code: shared_1.ErrorCode.TERMINAL_CREATION_FAILED,
                message: error instanceof Error ? error.message : `Failed to create terminal: ${String(error)}`,
                context: { terminalId, options },
                cause: error instanceof Error ? error : undefined,
            });
        }
        finally {
            this._terminalsBeingCreated.delete(terminalId);
        }
    }
    /**
     * Dispose of a terminal and clean up resources
     * @returns Result indicating success or failure
     */
    async disposeTerminal(terminal) {
        try {
            (0, logger_1.terminal)(`🗑️ [LifecycleService] Disposing terminal ${terminal.id} (${terminal.name})`);
            // Kill PTY process
            if (terminal.pty) {
                terminal.pty.kill();
                // Wait briefly for graceful shutdown
                await new Promise((resolve) => setTimeout(resolve, 100));
                // Force kill if still alive (IPty doesn't have killed property, so we just attempt force kill)
                (0, logger_1.terminal)(`🔨 [LifecycleService] Force killing terminal process ${terminal.id}`);
                terminal.pty.kill('SIGKILL');
            }
            // Terminal number will be released by caller
            if (terminal.number) {
                (0, logger_1.terminal)(`🔢 [LifecycleService] Terminal number ${terminal.number} will be released by caller`);
            }
            // Clean up shell integration (method not available in current implementation)
            if (this._shellIntegrationService) {
                (0, logger_1.terminal)(`🧹 [LifecycleService] Shell integration cleanup skipped for terminal ${terminal.id}`);
            }
            (0, logger_1.terminal)(`✅ [LifecycleService] Terminal ${terminal.id} disposed successfully`);
            return (0, shared_1.success)(undefined);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [LifecycleService] Error disposing terminal ${terminal.id}:`, error);
            return (0, shared_1.failureFromDetails)({
                code: shared_1.ErrorCode.TERMINAL_PROCESS_FAILED,
                message: error instanceof Error ? error.message : `Failed to dispose terminal: ${String(error)}`,
                context: { terminalId: terminal.id, terminalName: terminal.name },
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
    /**
     * Resize a terminal
     * @returns Result indicating success or failure
     */
    resizeTerminal(terminal, cols, rows) {
        if (!terminal.pty) {
            (0, logger_1.terminal)(`⚠️ [LifecycleService] Cannot resize terminal without PTY ${terminal.id}`);
            return (0, shared_1.failureFromDetails)({
                code: shared_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Cannot resize terminal without PTY',
                context: { terminalId: terminal.id, cols, rows },
            });
        }
        return (0, shared_1.tryCatch)(() => {
            terminal.pty.resize(cols, rows);
            (0, logger_1.terminal)(`📏 [LifecycleService] Resized terminal ${terminal.id} to ${cols}x${rows}`);
        }, (error) => ({
            code: shared_1.ErrorCode.TERMINAL_PROCESS_FAILED,
            message: error instanceof Error ? error.message : `Failed to resize terminal: ${String(error)}`,
            context: { terminalId: terminal.id, cols, rows },
            cause: error instanceof Error ? error : undefined,
        }));
    }
    /**
     * Send input to a terminal
     * @returns Result indicating success or failure
     */
    sendInputToTerminal(terminal, data) {
        if (!terminal.pty) {
            (0, logger_1.terminal)(`⚠️ [LifecycleService] Cannot send input to terminal without PTY ${terminal.id}`);
            return (0, shared_1.failureFromDetails)({
                code: shared_1.ErrorCode.TERMINAL_NOT_FOUND,
                message: 'Cannot send input to terminal without PTY',
                context: { terminalId: terminal.id, dataLength: data.length },
            });
        }
        return (0, shared_1.tryCatch)(() => {
            terminal.pty.write(data);
            (0, logger_1.terminal)(`⌨️ [LifecycleService] Sent ${data.length} chars to terminal ${terminal.id}`);
        }, (error) => ({
            code: shared_1.ErrorCode.TERMINAL_PROCESS_FAILED,
            message: error instanceof Error ? error.message : `Failed to send input: ${String(error)}`,
            context: { terminalId: terminal.id, dataLength: data.length },
            cause: error instanceof Error ? error : undefined,
        }));
    }
    /**
     * Check if a terminal is alive
     */
    isTerminalAlive(terminal) {
        return !!(terminal.pty && terminal.pty.pid > 0);
    }
    /**
     * Get terminal statistics
     */
    getTerminalStats() {
        const terminals = new Map(); // Empty map for now
        return {
            maxTerminals: SystemConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT,
            availableNumbers: this._terminalNumberManager.getAvailableSlots(terminals),
            usedNumbers: [], // Would need to track this externally
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
                    (0, logger_1.terminal)(`⚠️ [LifecycleService] Profile service not available, using default for: ${requestedProfile}`);
                }
                catch (error) {
                    (0, logger_1.terminal)(`⚠️ [LifecycleService] Error getting profile ${requestedProfile}:`, error);
                }
            }
            // Fallback to platform default
            const defaultShell = (0, common_1.getShellForPlatform)();
            (0, logger_1.terminal)(`📋 [LifecycleService] Using default shell: ${defaultShell}`);
            return {
                shell: defaultShell,
                args: [],
                description: 'Default Shell',
            };
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [LifecycleService] Error resolving terminal profile:`, error);
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
     * @returns Result containing IPty or error details
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
            (0, logger_1.terminal)(`🔧 [LifecycleService] Creating PTY process: ${shell} ${args.join(' ')}`);
            const ptyProcess = pty.spawn(shell, args, ptyOptions);
            // Verify process was created successfully
            if (!ptyProcess || !ptyProcess.pid) {
                return (0, shared_1.failureFromDetails)({
                    code: shared_1.ErrorCode.TERMINAL_PROCESS_FAILED,
                    message: `Failed to spawn PTY process for shell: ${shell}`,
                    context: { shell, args, cwd, safeMode },
                });
            }
            (0, logger_1.terminal)(`✅ [LifecycleService] PTY process created with PID: ${ptyProcess.pid}`);
            return (0, shared_1.success)(ptyProcess);
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [LifecycleService] Failed to create PTY process:`, error);
            return (0, shared_1.failureFromDetails)({
                code: shared_1.ErrorCode.TERMINAL_PROCESS_FAILED,
                message: error instanceof Error ? error.message : `Terminal creation failed: ${String(error)}`,
                context: options,
                cause: error instanceof Error ? error : undefined,
            });
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
                (0, logger_1.terminal)(`⚠️ [LifecycleService] Shell integration service initialization skipped`);
            }
            // Skip shell integration in safe mode
            if (safeMode) {
                (0, logger_1.terminal)(`⚠️ [LifecycleService] Skipping shell integration for safe mode terminal ${terminal.id}`);
                return;
            }
            // this._shellIntegrationService.attachToTerminal(terminal);
            // Method not available in current implementation
            (0, logger_1.terminal)(`🔗 [LifecycleService] Shell integration attachment skipped for terminal ${terminal.id}`);
        }
        catch (error) {
            (0, logger_1.terminal)(`⚠️ [LifecycleService] Failed to initialize shell integration for terminal ${terminal.id}:`, error);
            // Non-fatal: continue without shell integration
        }
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        (0, logger_1.terminal)('🧹 [LifecycleService] Disposing terminal lifecycle service');
        try {
            // Clear creation tracking
            this._terminalsBeingCreated.clear();
            // Dispose shell integration service
            if (this._shellIntegrationService) {
                this._shellIntegrationService.dispose();
                this._shellIntegrationService = null;
            }
            (0, logger_1.terminal)('✅ [LifecycleService] Terminal lifecycle service disposed');
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [LifecycleService] Error disposing terminal lifecycle service:', error);
        }
    }
}
exports.TerminalLifecycleService = TerminalLifecycleService;
//# sourceMappingURL=TerminalLifecycleService.js.map