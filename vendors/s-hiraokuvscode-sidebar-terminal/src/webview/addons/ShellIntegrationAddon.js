"use strict";
/**
 * Shell Integration Addon for Secondary Sidebar Terminal
 * Implements VS Code terminal shell integration features
 * - Command detection and tracking
 * - Exit code indication
 * - Command history navigation
 * - Current working directory detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellIntegrationAddon = void 0;
/**
 * Shell Integration Addon for processing OSC sequences
 * Compatible with VS Code terminal shell integration
 */
class ShellIntegrationAddon {
    constructor(events) {
        this.commandHistory = [];
        this.currentCwd = '';
        this.disposables = [];
        this.events = events;
    }
    activate(terminal) {
        this.terminal = terminal;
        // Register OSC handler for shell integration sequences
        const oscHandler = terminal.parser.registerOscHandler(633, (data) => {
            return this.handleOSC633(data);
        });
        this.disposables.push(() => oscHandler.dispose());
    }
    dispose() {
        this.disposables.forEach((dispose) => dispose());
        this.disposables = [];
        this.terminal = undefined;
        this.currentCommand = undefined;
    }
    /**
     * Handle OSC 633 sequences for shell integration
     * OSC 633 is VS Code specific shell integration protocol
     */
    handleOSC633(data) {
        const parts = data.split(';');
        const command = parts[0];
        try {
            switch (command) {
                case 'A': // Prompt start
                    this.handlePromptStart();
                    break;
                case 'B': // Command start
                    this.handleCommandStart();
                    break;
                case 'C': // Command executed
                    this.handleCommandExecuted();
                    break;
                case 'D': // Command finished with exit code
                    const exitCode = parts[1] ? parseInt(parts[1], 10) : 0;
                    this.handleCommandFinished(exitCode);
                    break;
                case 'E': // Command line with optional nonce
                    const commandLine = parts[1] || '';
                    this.handleCommandLine(commandLine);
                    break;
                case 'P': // Property (CWD, etc.)
                    this.handleProperty(parts.slice(1));
                    break;
                default:
                    console.warn(`Unknown OSC 633 command: ${command}`);
                    break;
            }
            return true;
        }
        catch (error) {
            console.error('Error handling OSC 633 sequence:', error);
            return false;
        }
    }
    /**
     * Handle prompt start (OSC 633;A)
     */
    handlePromptStart() {
        // Mark that we're at a prompt, not executing a command
        if (this.currentCommand?.isRunning) {
            // Command finished without explicit exit code
            this.handleCommandFinished(0);
        }
        this.events?.onPromptStart();
    }
    /**
     * Handle command start (OSC 633;B)
     */
    handleCommandStart() {
        this.currentCommand = {
            command: '',
            cwd: this.currentCwd,
            timestamp: Date.now(),
            isRunning: false,
        };
    }
    /**
     * Handle command executed (OSC 633;C)
     */
    handleCommandExecuted() {
        if (this.currentCommand) {
            this.currentCommand.isRunning = true;
            this.events?.onCommandStart(this.currentCommand);
        }
    }
    /**
     * Handle command finished (OSC 633;D)
     */
    handleCommandFinished(exitCode) {
        if (this.currentCommand) {
            this.currentCommand.exitCode = exitCode;
            this.currentCommand.isRunning = false;
            // Add to history
            this.commandHistory.push({ ...this.currentCommand });
            // Keep only last 100 commands
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }
            this.events?.onCommandEnd(this.currentCommand, exitCode);
            this.currentCommand = undefined;
        }
    }
    /**
     * Handle command line (OSC 633;E)
     */
    handleCommandLine(commandLine) {
        if (this.currentCommand) {
            this.currentCommand.command = commandLine;
        }
    }
    /**
     * Handle properties like CWD (OSC 633;P)
     */
    handleProperty(parts) {
        for (const part of parts) {
            const [key, value] = part.split('=', 2);
            switch (key) {
                case 'Cwd':
                    if (value && value !== this.currentCwd) {
                        this.currentCwd = value;
                        this.events?.onCwdChange(value);
                    }
                    break;
                default:
                    console.warn(`Unknown property: ${key}=${value}`);
                    break;
            }
        }
    }
    /**
     * Get command history
     */
    getCommandHistory() {
        return [...this.commandHistory];
    }
    /**
     * Get current working directory
     */
    getCurrentCwd() {
        return this.currentCwd;
    }
    /**
     * Get currently running command
     */
    getCurrentCommand() {
        return this.currentCommand;
    }
    /**
     * Check if shell integration is active
     */
    isActive() {
        return !!this.terminal;
    }
    /**
     * Get last command with exit code
     */
    getLastCommand() {
        return this.commandHistory[this.commandHistory.length - 1];
    }
    /**
     * Clear command history
     */
    clearHistory() {
        this.commandHistory = [];
    }
}
exports.ShellIntegrationAddon = ShellIntegrationAddon;
//# sourceMappingURL=ShellIntegrationAddon.js.map