"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalCommand = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
/**
 * ターミナル関連のコマンドハンドラー
 * テキスト送信、コマンド実行などの基本操作を提供
 */
class TerminalCommand {
    constructor(terminalManager) {
        this.terminalManager = terminalManager;
    }
    /**
     * アクティブなターミナルにコンテンツを送信
     */
    handleSendToTerminal(content) {
        (0, logger_1.extension)('🚀 [DEBUG] handleSendToTerminal called');
        try {
            if (!this.terminalManager.hasActiveTerminal()) {
                void vscode.window.showWarningMessage('No active sidebar terminal. Please open the sidebar terminal first.');
                return;
            }
            const activeTerminalId = this.terminalManager.getActiveTerminalId();
            if (!activeTerminalId) {
                (0, logger_1.extension)('❌ [ERROR] Active terminal ID is null');
                return;
            }
            if (content) {
                // コマンドから直接呼ばれた場合（コマンドパレットなど）
                this.terminalManager.sendInput(content, activeTerminalId);
                (0, logger_1.extension)(`✅ [DEBUG] Sent content to terminal: ${content}`);
            }
            else {
                // ユーザーに入力を求める
                void vscode.window
                    .showInputBox({
                    placeHolder: 'Enter text to send to terminal',
                    prompt: 'Text will be sent to the active sidebar terminal',
                })
                    .then((input) => {
                    if (input) {
                        this.terminalManager.sendInput(input, activeTerminalId);
                        (0, logger_1.extension)(`✅ [DEBUG] Sent user input to terminal: ${input}`);
                    }
                });
            }
        }
        catch (error) {
            (0, logger_1.extension)('❌ [ERROR] Error in handleSendToTerminal:', error);
            void vscode.window.showErrorMessage(`Failed to send to terminal: ${String(error)}`);
        }
    }
}
exports.TerminalCommand = TerminalCommand;
//# sourceMappingURL=TerminalCommand.js.map