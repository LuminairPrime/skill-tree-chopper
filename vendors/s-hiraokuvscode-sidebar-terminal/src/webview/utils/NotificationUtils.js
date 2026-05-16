"use strict";
/**
 * Webview内でのエラー・警告・情報メッセージ表示の統一ユーティリティ
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUIManager = setUIManager;
exports.showTerminalCloseError = showTerminalCloseError;
exports.showTerminalKillError = showTerminalKillError;
exports.showSplitLimitWarning = showSplitLimitWarning;
exports.showCliAgentDetected = showCliAgentDetected;
exports.showCliAgentEnded = showCliAgentEnded;
exports.showAltClickDisabledWarning = showAltClickDisabledWarning;
exports.showAltClickSettingError = showAltClickSettingError;
exports.showTerminalInteractionWarning = showTerminalInteractionWarning;
exports.showSessionRestoreStarted = showSessionRestoreStarted;
exports.showSessionRestoreProgress = showSessionRestoreProgress;
exports.showSessionRestoreCompleted = showSessionRestoreCompleted;
exports.showSessionRestoreError = showSessionRestoreError;
exports.showSessionSaved = showSessionSaved;
exports.showSessionSaveError = showSessionSaveError;
exports.showTerminalRestoreError = showTerminalRestoreError;
exports.showSessionCleared = showSessionCleared;
exports.showSessionRestoreSkipped = showSessionRestoreSkipped;
exports.showNotification = showNotification;
exports.clearAllNotifications = clearAllNotifications;
const DEFAULT_DURATION = 4000;
const activeNotifications = new Set();
let uiManager = null;
/**
 * UIManagerインスタンスを設定
 */
function setUIManager(manager) {
    uiManager = manager;
}
/**
 * ターミナル削除エラーの表示
 */
function showTerminalCloseError(minCount) {
    showNotification({
        type: 'warning',
        title: 'Cannot close terminal',
        message: `Must keep at least ${minCount} terminal${minCount > 1 ? 's' : ''} open`,
        icon: '⚠️',
    });
}
/**
 * ターミナルキルエラーの表示
 */
function showTerminalKillError(reason) {
    showNotification({
        type: 'error',
        title: 'Terminal kill failed',
        message: reason,
        icon: '❌',
    });
}
/**
 * 分割制限警告の表示
 */
function showSplitLimitWarning(reason) {
    showNotification({
        type: 'warning',
        title: 'Split Limit Reached',
        message: reason,
        icon: '⚠️',
    });
}
/**
 * CLI Agent検出通知の表示
 */
function showCliAgentDetected() {
    showNotification({
        type: 'info',
        title: 'CLI Agent Detected',
        message: 'Alt+Click temporarily disabled for optimal performance during AI interaction',
        icon: '🤖',
        duration: 6000,
    });
}
/**
 * CLI Agent終了通知の表示
 */
function showCliAgentEnded() {
    showNotification({
        type: 'success',
        title: 'CLI Agent Session Ended',
        message: 'Alt+Click cursor positioning re-enabled',
        icon: '✅',
        duration: 3000,
    });
}
/**
 * Alt+Click無効化警告の表示
 */
function showAltClickDisabledWarning(reason) {
    showNotification({
        type: 'warning',
        title: 'Alt+Click Disabled',
        message: reason || 'Alt+Click cursor positioning is currently disabled',
        icon: '🚫',
        duration: 4000,
    });
}
/**
 * Alt+Click設定エラーの表示
 */
function showAltClickSettingError() {
    showNotification({
        type: 'warning',
        title: 'Alt+Click Configuration',
        message: 'Check VS Code settings: terminal.integrated.altClickMovesCursor and editor.multiCursorModifier',
        icon: '⚙️',
        duration: 6000,
    });
}
/**
 * Terminal相互作用問題の表示
 */
function showTerminalInteractionWarning() {
    showNotification({
        type: 'warning',
        title: 'Terminal Interaction Issue',
        message: 'High frequency output detected - some features may be temporarily limited',
        icon: '⚡',
        duration: 5000,
    });
}
/**
 * セッション復元開始の通知
 */
function showSessionRestoreStarted(terminalCount) {
    showNotification({
        type: 'info',
        title: 'Terminal Session Restore',
        message: `Restoring ${terminalCount} terminal${terminalCount > 1 ? 's' : ''} from previous session...`,
        icon: '🔄',
        duration: 3000,
    });
}
/**
 * セッション復元進行状況の通知
 */
function showSessionRestoreProgress(restored, total) {
    showNotification({
        type: 'info',
        title: 'Restoring Terminals',
        message: `Restored ${restored}/${total} terminals`,
        icon: '⏳',
        duration: 2000,
    });
}
/**
 * セッション復元完了の通知
 */
function showSessionRestoreCompleted(restoredCount, skippedCount = 0) {
    let message = `Successfully restored ${restoredCount} terminal${restoredCount > 1 ? 's' : ''}`;
    if (skippedCount > 0) {
        message += `, ${skippedCount} skipped`;
    }
    showNotification({
        type: 'success',
        title: 'Session Restored',
        message,
        icon: '✅',
        duration: 4000,
    });
}
/**
 * セッション復元エラーの通知
 */
function showSessionRestoreError(error, partialSuccess, errorType) {
    let title = partialSuccess ? 'Partial Session Restore' : 'Session Restore Failed';
    let icon = '❌';
    let message = partialSuccess
        ? `Some terminals could not be restored: ${error}`
        : `Failed to restore session: ${error}`;
    // エラータイプに応じてメッセージをカスタマイズ
    if (errorType === 'file') {
        title = 'Session File Missing';
        icon = '📁';
        message = 'Session file not found - starting with fresh terminals';
    }
    else if (errorType === 'corruption') {
        title = 'Session Data Corrupted';
        icon = '🔧';
        message = 'Session data was corrupted and has been cleared - starting fresh';
    }
    else if (errorType === 'permission') {
        title = 'Session Access Denied';
        icon = '🔒';
        message = 'Permission denied accessing session data - check file permissions';
    }
    showNotification({
        type: errorType === 'file' || errorType === 'corruption' ? 'warning' : 'error',
        title,
        message,
        icon,
        duration: 6000,
    });
}
/**
 * セッション保存成功の通知
 */
function showSessionSaved(terminalCount) {
    showNotification({
        type: 'success',
        title: 'Session Saved',
        message: `Terminal session saved (${terminalCount} terminal${terminalCount > 1 ? 's' : ''})`,
        icon: '💾',
        duration: 3000,
    });
}
/**
 * セッション保存エラーの通知
 */
function showSessionSaveError(error) {
    showNotification({
        type: 'error',
        title: 'Session Save Failed',
        message: `Failed to save session: ${error}`,
        icon: '💾❌',
        duration: 5000,
    });
}
/**
 * 個別ターミナル復元エラーの通知
 */
function showTerminalRestoreError(terminalName, error) {
    showNotification({
        type: 'warning',
        title: 'Terminal Restore Warning',
        message: `Failed to restore "${terminalName}": ${error}`,
        icon: '⚠️',
        duration: 5000,
    });
}
/**
 * セッションクリア通知
 */
function showSessionCleared() {
    showNotification({
        type: 'info',
        title: 'Session Cleared',
        message: 'Previous terminal session data has been cleared',
        icon: '🗑️',
        duration: 3000,
    });
}
/**
 * セッション復元スキップ通知
 */
function showSessionRestoreSkipped(reason) {
    showNotification({
        type: 'warning',
        title: 'Session Restore Skipped',
        message: reason,
        icon: '⏭️',
        duration: 4000,
    });
}
/**
 * 汎用的な通知表示
 */
function showNotification(config) {
    if (!uiManager) {
        console.error('UIManager not initialized for NotificationUtils');
        return;
    }
    uiManager.ensureAnimationsLoaded();
    const notification = uiManager.createNotificationElement(config);
    // Add close button event listener
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });
    }
    document.body.appendChild(notification);
    activeNotifications.add(notification);
    const duration = config.duration || DEFAULT_DURATION;
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
}
/**
 * 通知の削除
 */
function removeNotification(notification) {
    if (notification.parentNode && activeNotifications.has(notification)) {
        notification.style.animation = 'slideOutToRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            activeNotifications.delete(notification);
        }, 300);
    }
}
/**
 * 全ての通知をクリア
 */
function clearAllNotifications() {
    activeNotifications.forEach((notification) => {
        removeNotification(notification);
    });
}
//# sourceMappingURL=NotificationUtils.js.map