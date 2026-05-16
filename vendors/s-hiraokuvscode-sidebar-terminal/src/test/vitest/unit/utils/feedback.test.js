"use strict";
/**
 * Feedback utilities Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const feedback_1 = require("../../../../utils/feedback");
// Mock VS Code API
vitest_1.vi.mock('vscode', () => {
    const mockStatusBarItem = {
        show: vitest_1.vi.fn(),
        hide: vitest_1.vi.fn(),
        dispose: vitest_1.vi.fn(),
        text: '',
        tooltip: undefined,
    };
    return {
        window: {
            createStatusBarItem: vitest_1.vi.fn(() => mockStatusBarItem),
            showInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
            showWarningMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
            showErrorMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
            withProgress: vitest_1.vi.fn((options, task) => task({ report: vitest_1.vi.fn() })),
        },
        StatusBarAlignment: { Left: 1, Right: 2 },
        ProgressLocation: { Notification: 15 },
        commands: {
            executeCommand: vitest_1.vi.fn().mockResolvedValue(undefined),
        },
        Uri: {
            parse: vitest_1.vi.fn((url) => ({ toString: () => url })),
        },
        env: {
            openExternal: vitest_1.vi.fn().mockResolvedValue(true),
        },
    };
});
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
    log: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('Feedback Utilities', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Reset singleton instance if necessary
        feedback_1.FeedbackManager.instance = undefined;
    });
    (0, vitest_1.describe)('FeedbackManager', () => {
        let _manager;
        (0, vitest_1.beforeEach)(() => {
            _manager = feedback_1.FeedbackManager.getInstance();
        });
        (0, vitest_1.describe)('showFeedback', () => {
            (0, vitest_1.it)('should show information message for success', async () => {
                (0, feedback_1.showSuccess)('Operation successful');
                (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith('Operation successful');
            });
            (0, vitest_1.it)('should show error message', async () => {
                (0, feedback_1.showError)('Something went wrong');
                (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith('Something went wrong');
            });
            (0, vitest_1.it)('should handle actions in notifications', async () => {
                const action = vitest_1.vi.fn();
                const options = {
                    actions: [{ title: 'Fix it', action }],
                };
                // Mock user selecting the action
                vscode.window.showInformationMessage.mockResolvedValue('Fix it');
                (0, feedback_1.showSuccess)('Error with fix', options);
                // Wait for async notification handling
                await new Promise((resolve) => setTimeout(resolve, 10));
                (0, vitest_1.expect)(action).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should execute action when notification button is clicked', async () => {
                const actionFn = vitest_1.vi.fn();
                vscode.window.showErrorMessage.mockResolvedValue('Retry');
                (0, feedback_1.showError)('Failed', {
                    actions: [{ title: 'Retry', action: actionFn }],
                });
                // Wait for async notification handling
                await new Promise((resolve) => setTimeout(resolve, 10));
                (0, vitest_1.expect)(actionFn).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should update status bar', () => {
                const statusBar = vscode.window.createStatusBarItem();
                (0, feedback_1.showWarning)('Disk full');
                (0, vitest_1.expect)(statusBar.text).toContain('Disk full');
            });
        });
    });
    (0, vitest_1.describe)('TerminalErrorHandler', () => {
        (0, vitest_1.it)('should handle ENOENT error', () => {
            feedback_1.TerminalErrorHandler.handleTerminalCreationError(new Error('ENOENT: file not found'));
            (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Shell not found'), vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should handle permission denied errors', () => {
            feedback_1.TerminalErrorHandler.handleTerminalCreationError(new Error('EACCES: permission denied'));
            (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Permission denied'), 'Learn More');
        });
        (0, vitest_1.it)('should handle max terminals reached', () => {
            feedback_1.TerminalErrorHandler.handleMaxTerminalsReached(5);
            (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Maximum number of terminals reached (5)'), vitest_1.expect.anything());
        });
        (0, vitest_1.it)('should handle webview errors', () => {
            feedback_1.TerminalErrorHandler.handleWebviewError('Unexpected crash');
            (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Webview error'), vitest_1.expect.anything());
        });
    });
});
//# sourceMappingURL=feedback.test.js.map