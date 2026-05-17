'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CopilotIntegrationCommand = void 0;
const vscode = require('vscode');
const path = require('path');
const logger_1 = require('../utils/logger');
const constants_1 = require('../constants');
/**
 * GitHub Copilot連携コマンドのハンドラー
 * CMD+K CMD+C でGitHub Copilot Chatをアクティブ化し、#file:形式でファイル参照を送信する
 */
class CopilotIntegrationCommand {
  /**
   * GitHub Copilot Chatをアクティブ化してファイル参照を送信する
   */
  async handleActivateCopilot() {
    try {
      (0, logger_1.extension)('🚀 [DEBUG] handleActivateCopilot called');
      // GitHub Copilot統合機能が有効かチェック
      if (!this.isGitHubCopilotIntegrationEnabled()) {
        (0, logger_1.extension)(
          '🔧 [DEBUG] GitHub Copilot integration is disabled by user setting'
        );
        await vscode.window.showInformationMessage(
          'GitHub Copilot integration is disabled. Enable it in Terminal Settings.'
        );
        return;
      }
      // アクティブエディタの確認
      const fileInfo = this.getActiveFileInfo();
      if (!fileInfo) {
        (0, logger_1.extension)(
          '⚠️ [DEBUG] No active editor found, activating Copilot without file reference'
        );
        // ファイルが開いていなくてもCopilot Chatをアクティブ化
        await this.activateCopilotChat();
        return;
      }
      // GitHub Copilot Chatをアクティブ化してファイル参照を送信
      await this.activateCopilotChatWithFileReference(fileInfo);
      (0, logger_1.extension)(
        '✅ [DEBUG] Successfully activated GitHub Copilot Chat with file reference'
      );
    } catch (error) {
      (0, logger_1.extension)('❌ [ERROR] Error in handleActivateCopilot:', error);
      await vscode.window.showErrorMessage(
        `Failed to activate GitHub Copilot Chat: ${String(error)}`
      );
    }
  }
  /**
   * GitHub Copilot Chatをアクティブ化する
   */
  async activateCopilotChat() {
    await vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.CHAT_OPEN);
  }
  /**
   * GitHub Copilot Chatをアクティブ化してファイル参照を送信
   */
  async activateCopilotChatWithFileReference(fileInfo) {
    await this.sendFileReferenceToCopilot(fileInfo);
  }
  /**
   * Copilot Chatにファイル参照を送信
   */
  async sendFileReferenceToCopilot(fileInfo) {
    const fileReference = this.formatCopilotFileReference(fileInfo);
    (0, logger_1.extension)(`📤 [DEBUG] Sending file reference to Copilot: "${fileReference}"`);
    await vscode.commands.executeCommand(constants_1.VSCODE_COMMANDS.CHAT_OPEN, {
      query: fileReference,
      isPartialQuery: true,
    });
  }
  /**
   * アクティブエディタからファイル情報と選択範囲を取得
   */
  getActiveFileInfo() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return null;
    }
    const fullPath = activeEditor.document.fileName;
    // ワークスペースルートからの相対パスを計算
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let relativePath = fullPath;
    if (workspaceFolder) {
      const workspaceRoot = workspaceFolder.uri.fsPath;
      if (fullPath.startsWith(workspaceRoot)) {
        // クロスプラットフォーム対応の相対パス計算
        relativePath = path.relative(workspaceRoot, fullPath);
        // パス区切り文字を正規化（Windowsの場合）
        relativePath = relativePath.replace(/\\/g, '/');
      }
    }
    // 選択範囲の情報を取得
    const selection = activeEditor.selection;
    let selectionInfo = undefined;
    if (!selection.isEmpty) {
      // 選択がある場合の行番号を取得（1ベースに変換）
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      selectionInfo = {
        startLine,
        endLine,
        hasSelection: true,
      };
      (0, logger_1.extension)(
        `🔍 [DEBUG] Selection detected for Copilot: L${startLine}-L${endLine}`
      );
    }
    return { relativePath, selection: selectionInfo };
  }
  /**
   * Copilot用のファイル参照文字列をフォーマット
   * VS CodeのCopilot Chatでは特定の形式でファイル参照を生成する必要がある
   */
  formatCopilotFileReference(fileInfo) {
    // シンプルな #file: 形式（Copilotの正確な仕様を調査中）
    const fullReference = `#file:${fileInfo.relativePath}`;
    // デバッグ用：ファイル参照情報をログ出力
    (0, logger_1.extension)(`🔍 [DEBUG] Creating file reference: ${fullReference}`);
    // 選択範囲がある場合のログ出力
    if (fileInfo.selection?.hasSelection) {
      const { startLine, endLine } = fileInfo.selection;
      (0, logger_1.extension)(`🔍 [DEBUG] File selection detected: lines ${startLine}-${endLine}`);
      // 将来的な拡張: 選択範囲の情報も含める可能性
      // return `${fullReference} (lines ${startLine}-${endLine}) `;
    }
    return `${fullReference}  `;
  }
  /**
   * GitHub Copilot連携機能が有効かチェック
   */
  isGitHubCopilotIntegrationEnabled() {
    const config = vscode.workspace.getConfiguration('secondaryTerminal');
    return config.get('enableGitHubCopilotIntegration', true);
  }
}
exports.CopilotIntegrationCommand = CopilotIntegrationCommand;
//# sourceMappingURL=CopilotIntegrationCommand.js.map
