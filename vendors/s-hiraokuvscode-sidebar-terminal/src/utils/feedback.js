"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalErrorHandler = exports.FeedbackManager = exports.FeedbackType = void 0;
exports.showSuccess = showSuccess;
exports.showWarning = showWarning;
exports.showError = showError;
exports.showInfo = showInfo;
exports.showProgress = showProgress;
const vscode = require("vscode");
const constants_1 = require("../constants");
const logger_1 = require("./logger");
/**
 * Enhanced user feedback and error handling utilities
 */
var FeedbackType;
(function (FeedbackType) {
    FeedbackType["SUCCESS"] = "success";
    FeedbackType["WARNING"] = "warning";
    FeedbackType["ERROR"] = "error";
    FeedbackType["INFO"] = "info";
})(FeedbackType || (exports.FeedbackType = FeedbackType = {}));
class FeedbackManager {
    constructor() {
        this.activeNotifications = new Map();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.text = '$(terminal) Terminal';
        this.statusBarItem.show();
    }
    static getInstance() {
        if (!FeedbackManager.instance) {
            FeedbackManager.instance = new FeedbackManager();
        }
        return FeedbackManager.instance;
    }
    showFeedback(type, message, options = {}) {
        const { showNotification = true, logToConsole = true, timeout = 5000, actions = [] } = options;
        // Log to console
        if (logToConsole) {
            const prefix = this.getLogPrefix(type);
            (0, logger_1.log)(`${prefix} ${message}`);
        }
        // Show notification
        if (showNotification) {
            void this.showNotification(type, message, actions);
        }
        // Update status bar temporarily
        this.updateStatusBar(type, message, timeout);
    }
    getLogPrefix(type) {
        switch (type) {
            case FeedbackType.SUCCESS:
                return '✅ [SUCCESS]';
            case FeedbackType.WARNING:
                return '⚠️ [WARNING]';
            case FeedbackType.ERROR:
                return '❌ [ERROR]';
            case FeedbackType.INFO:
                return 'ℹ️ [INFO]';
            default:
                return '📝 [LOG]';
        }
    }
    async showNotification(type, message, actions = []) {
        const actionTitles = actions.map((a) => a.title);
        let selectedAction;
        switch (type) {
            case FeedbackType.SUCCESS:
                selectedAction = await vscode.window.showInformationMessage(message, ...actionTitles);
                break;
            case FeedbackType.WARNING:
                selectedAction = await vscode.window.showWarningMessage(message, ...actionTitles);
                break;
            case FeedbackType.ERROR:
                selectedAction = await vscode.window.showErrorMessage(message, ...actionTitles);
                break;
            case FeedbackType.INFO:
                selectedAction = await vscode.window.showInformationMessage(message, ...actionTitles);
                break;
        }
        // Execute selected action
        if (selectedAction) {
            const action = actions.find((a) => a.title === selectedAction);
            if (action) {
                action.action();
            }
        }
    }
    updateStatusBar(type, message, timeout) {
        const icon = this.getStatusBarIcon(type);
        const originalText = this.statusBarItem.text;
        this.statusBarItem.text = `${icon} ${message}`;
        this.statusBarItem.tooltip = message;
        // Restore original text after timeout
        setTimeout(() => {
            this.statusBarItem.text = originalText;
            this.statusBarItem.tooltip = undefined;
        }, timeout);
    }
    getStatusBarIcon(type) {
        switch (type) {
            case FeedbackType.SUCCESS:
                return '$(check)';
            case FeedbackType.WARNING:
                return '$(warning)';
            case FeedbackType.ERROR:
                return '$(error)';
            case FeedbackType.INFO:
                return '$(info)';
            default:
                return '$(terminal)';
        }
    }
    showProgress(title, task) {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title,
            cancellable: false,
        }, task);
    }
    dispose() {
        this.statusBarItem.dispose();
        for (const disposable of this.activeNotifications.values()) {
            disposable.dispose();
        }
        this.activeNotifications.clear();
    }
}
exports.FeedbackManager = FeedbackManager;
// Convenience functions
function showSuccess(message, options) {
    FeedbackManager.getInstance().showFeedback(FeedbackType.SUCCESS, message, options);
}
function showWarning(message, options) {
    FeedbackManager.getInstance().showFeedback(FeedbackType.WARNING, message, options);
}
function showError(message, options) {
    FeedbackManager.getInstance().showFeedback(FeedbackType.ERROR, message, options);
}
function showInfo(message, options) {
    FeedbackManager.getInstance().showFeedback(FeedbackType.INFO, message, options);
}
function showProgress(title, task) {
    return FeedbackManager.getInstance().showProgress(title, task);
}
/**
 * Enhanced error handling for terminal operations
 */
class TerminalErrorHandler {
    static handleTerminalCreationError(error) {
        const message = TerminalErrorHandler.getErrorMessage(error);
        if (message.includes('ENOENT') || message.includes('command not found')) {
            showError('Shell not found. Please check your terminal settings.', {
                actions: [
                    {
                        title: 'Open Settings',
                        action: () => {
                            void vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.WORKBENCH_OPEN_SETTINGS, 'secondaryTerminal.shell');
                        },
                    },
                ],
            });
        }
        else if (message.includes('EACCES') || message.includes('permission denied')) {
            showError('Permission denied. Please check shell permissions.', {
                actions: [
                    {
                        title: 'Learn More',
                        action: () => {
                            void vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/terminal/basics#_permission-issues'));
                        },
                    },
                ],
            });
        }
        else {
            showError(`Terminal creation failed: ${message}`, {
                actions: [
                    {
                        title: 'Retry',
                        action: () => {
                            void vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.SECONDARY_TERMINAL_CREATE);
                        },
                    },
                ],
            });
        }
    }
    static handleMaxTerminalsReached(maxCount) {
        showWarning(`Maximum number of terminals reached (${maxCount}). Close some terminals to create new ones.`, {
            actions: [
                {
                    title: 'Kill Active Terminal',
                    action: () => {
                        void vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.SECONDARY_TERMINAL_KILL);
                    },
                },
            ],
        });
    }
    static handleTerminalNotFound() {
        showWarning('No active terminal found.', {
            actions: [
                {
                    title: 'Create Terminal',
                    action: () => {
                        void vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.SECONDARY_TERMINAL_CREATE);
                    },
                },
            ],
        });
    }
    static handleWebviewError(error) {
        const message = TerminalErrorHandler.getErrorMessage(error);
        showError(`Webview error: ${message}. Try refreshing the terminal view.`, {
            actions: [
                {
                    title: 'Refresh',
                    action: () => {
                        void vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.WORKBENCH_RELOAD_WINDOW);
                    },
                },
            ],
        });
    }
    static getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error occurred';
    }
}
exports.TerminalErrorHandler = TerminalErrorHandler;
//# sourceMappingURL=feedback.js.map