"use strict";
/**
 * CommandRegistrar - Handles VS Code command registration for the extension
 *
 * This service encapsulates all command registration logic, separating it from
 * the main ExtensionLifecycle class for better maintainability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistrar = void 0;
const vscode = require("vscode");
const VersionUtils_1 = require("../utils/VersionUtils");
const logger_1 = require("../utils/logger");
/**
 * CommandRegistrar - Registers all VS Code commands for the extension
 */
class CommandRegistrar {
    constructor(deps, sessionHandlers) {
        this.deps = deps;
        this.sessionHandlers = sessionHandlers;
    }
    /**
     * Registers all VS Code commands provided by the extension.
     *
     * This method registers command handlers for:
     * - Terminal management (split, kill, focus, etc.)
     * - File reference operations (@mention functionality)
     * - GitHub Copilot integration
     * - Session management (save, restore, clear)
     * - Shell integration features
     * - Search functionality
     * - Debug and diagnostic commands
     *
     * @param context - The VS Code extension context for registering command subscriptions
     */
    registerCommands(context) {
        const commandDisposables = this.buildCommandDefinitions();
        // Register all commands with telemetry tracking
        commandDisposables.forEach(({ command, handler }) => {
            const wrappedHandler = async (...args) => {
                try {
                    this.deps.telemetryService?.trackCommandExecuted(command, true);
                    return await handler(...args);
                }
                catch (error) {
                    this.deps.telemetryService?.trackCommandExecuted(command, false);
                    if (error instanceof Error) {
                        this.deps.telemetryService?.trackError(error, `command:${command}`);
                    }
                    throw error;
                }
            };
            const disposable = vscode.commands.registerCommand(command, wrappedHandler);
            context.subscriptions.push(disposable);
        });
    }
    /**
     * Builds the list of all command definitions
     */
    buildCommandDefinitions() {
        return [
            // ======================= メインコマンド =======================
            ...this.getMainCommands(),
            // ======================= ファイル参照コマンド =======================
            ...this.getFileReferenceCommands(),
            // ======================= GitHub Copilot統合コマンド =======================
            ...this.getCopilotCommands(),
            // ======================= セッション管理コマンド =======================
            ...this.getSessionManagementCommands(),
            // ======================= ターミナル操作コマンド =======================
            ...this.getTerminalOperationCommands(),
            // ======================= Shell Integration Commands =======================
            ...this.getShellIntegrationCommands(),
            // ======================= その他のコマンド =======================
            ...this.getMiscCommands(),
        ];
    }
    /**
     * Main terminal commands
     */
    getMainCommands() {
        return [
            {
                command: 'secondaryTerminal.splitTerminal',
                handler: () => {
                    this.deps.sidebarProvider?.splitTerminal();
                },
            },
            {
                command: 'secondaryTerminal.splitTerminalHorizontal',
                handler: () => {
                    this.deps.sidebarProvider?.splitTerminal('horizontal');
                },
            },
        ];
    }
    /**
     * File reference commands
     */
    getFileReferenceCommands() {
        return [
            {
                command: 'secondaryTerminal.sendAtMention',
                handler: () => {
                    void this.deps.fileReferenceCommand?.handleSendAtMention();
                },
            },
            {
                command: 'secondaryTerminal.sendAllOpenFiles',
                handler: () => {
                    void this.deps.fileReferenceCommand?.handleSendAllOpenFiles();
                },
            },
        ];
    }
    /**
     * GitHub Copilot integration commands
     */
    getCopilotCommands() {
        return [
            {
                command: 'secondaryTerminal.activateCopilot',
                handler: async () => {
                    await this.deps.copilotIntegrationCommand?.handleActivateCopilot();
                },
            },
        ];
    }
    /**
     * Session management commands
     */
    getSessionManagementCommands() {
        return [
            {
                command: 'secondaryTerminal.clearCorruptedHistory',
                handler: async () => {
                    try {
                        if (this.deps.extensionPersistenceService) {
                            await this.deps.extensionPersistenceService.clearSession();
                            void vscode.window.showInformationMessage('🧹 Terminal session cleared! VS Code standard session will be saved from now on.');
                        }
                        else {
                            void vscode.window.showErrorMessage('Session manager not available');
                        }
                    }
                    catch (error) {
                        logger_1.logger.error('Failed to clear terminal session via clearCorruptedHistory command', error);
                        void vscode.window.showErrorMessage(`Failed to clear session: ${error instanceof Error ? error.message : String(error)}`);
                    }
                },
            },
            {
                command: 'secondaryTerminal.saveSession',
                handler: async () => {
                    await this.sessionHandlers.handleSaveSession();
                },
            },
            {
                command: 'secondaryTerminal.restoreSession',
                handler: async () => {
                    await this.sessionHandlers.handleRestoreSession();
                },
            },
            {
                command: 'secondaryTerminal.clearSession',
                handler: async () => {
                    await this.sessionHandlers.handleClearSession();
                },
            },
            {
                command: 'secondaryTerminal.testScrollback',
                handler: async () => {
                    await this.sessionHandlers.handleTestScrollback();
                },
            },
            {
                command: 'secondaryTerminal.diagnoseSession',
                handler: async () => {
                    await this.sessionHandlers.diagnoseSessionData();
                },
            },
        ];
    }
    /**
     * Terminal operation commands
     */
    getTerminalOperationCommands() {
        return [
            {
                command: 'secondaryTerminal.sendToTerminal',
                handler: (content) => {
                    this.deps.terminalCommand?.handleSendToTerminal(content);
                },
            },
            {
                command: 'secondaryTerminal.killTerminal',
                handler: async () => {
                    try {
                        await this.deps.sidebarProvider?.killTerminal();
                    }
                    catch (error) {
                        logger_1.logger.error('Failed to execute killTerminal command', error);
                    }
                },
            },
        ];
    }
    /**
     * Shell integration commands
     */
    getShellIntegrationCommands() {
        return [
            {
                command: 'secondaryTerminal.updateShellStatus',
                handler: (args) => {
                    this.deps.sidebarProvider?.sendMessageToWebview({
                        command: 'updateShellStatus',
                        terminalId: args.terminalId,
                        status: args.status,
                    });
                },
            },
            {
                command: 'secondaryTerminal.updateCwd',
                handler: (args) => {
                    this.deps.sidebarProvider?.sendMessageToWebview({
                        command: 'updateCwd',
                        terminalId: args.terminalId,
                        cwd: args.cwd,
                    });
                },
            },
            {
                command: 'secondaryTerminal.getCommandHistory',
                handler: (terminalId) => {
                    if (this.deps.shellIntegrationService) {
                        const history = this.deps.shellIntegrationService.getCommandHistory(terminalId);
                        this.deps.sidebarProvider?.sendMessageToWebview({
                            command: 'commandHistory',
                            terminalId,
                            history,
                        });
                        return history;
                    }
                    return [];
                },
            },
        ];
    }
    /**
     * Miscellaneous commands
     */
    getMiscCommands() {
        return [
            {
                command: 'secondaryTerminal.find',
                handler: () => {
                    this.deps.keyboardShortcutService?.find();
                },
            },
            {
                command: 'secondaryTerminal.selectProfile',
                handler: () => {
                    this.deps.sidebarProvider?.selectProfile();
                },
            },
            {
                command: 'secondaryTerminal.openSettings',
                handler: () => {
                    this.deps.sidebarProvider?.openSettings();
                },
            },
            {
                command: 'secondaryTerminal.debugInput',
                handler: async () => {
                    if (!this.deps.terminalManager) {
                        void vscode.window.showErrorMessage('TerminalManager not available');
                        return;
                    }
                    const activeTerminalId = this.deps.terminalManager.getActiveTerminalId();
                    if (!activeTerminalId) {
                        void vscode.window.showErrorMessage('No active terminal available');
                        return;
                    }
                    const testCommand = 'echo "DEBUG: Direct Extension input test successful"\\r';
                    this.deps.terminalManager.sendInput(testCommand, activeTerminalId);
                    void vscode.window.showInformationMessage('Debug input test sent directly to terminal');
                },
            },
            {
                command: 'secondaryTerminal.showVersion',
                handler: () => {
                    const versionInfo = VersionUtils_1.VersionUtils.getExtensionDisplayInfo();
                    void vscode.window.showInformationMessage(versionInfo);
                },
            },
        ];
    }
}
exports.CommandRegistrar = CommandRegistrar;
//# sourceMappingURL=CommandRegistrar.js.map