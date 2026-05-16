"use strict";
/**
 * Application Constants
 * Using shared constants to eliminate duplication
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationCategory = exports.ResourceType = exports.PerformanceMetric = exports.SessionOperation = exports.TerminalState = exports.CliAgentStatus = exports.NotificationType = exports.MessageSeverity = exports.TerminalAction = exports.SystemStatus = exports.SYSTEM_TERMINAL_CONSTANTS = exports.CONFIG_CACHE_CONSTANTS = exports.ERROR_CONSTANTS = exports.COMMUNICATION_CONSTANTS = exports.UI_CONSTANTS = exports.TIMING_CONSTANTS = exports.PERFORMANCE_CONSTANTS = exports.VSCODE_COMMANDS = exports.ERROR_MESSAGES = exports.WEBVIEW_CONSTANTS = exports.TERMINAL_CONSTANTS = void 0;
const constants_1 = require("../shared/constants");
exports.TERMINAL_CONSTANTS = {
    // Import shared defaults
    DEFAULT_MAX_TERMINALS: constants_1.SHARED_DEFAULTS.MAX_TERMINALS,
    DEFAULT_COLS: constants_1.SHARED_DEFAULTS.DEFAULT_COLS,
    DEFAULT_ROWS: constants_1.SHARED_DEFAULTS.DEFAULT_ROWS,
    TERMINAL_NAME_PREFIX: constants_1.SHARED_DEFAULTS.TERMINAL_NAME_PREFIX,
    SCROLLBACK_LINES: constants_1.SHARED_DEFAULTS.SCROLLBACK_LINES,
    // Import shared timing
    TERMINAL_REMOVE_DELAY: constants_1.SHARED_DELAYS.TERMINAL_REMOVE_DELAY,
    // Extension-specific
    NONCE_LENGTH: 32,
    // Import shared platforms
    PLATFORMS: constants_1.PLATFORMS,
    // Extension-specific config keys
    CONFIG_KEYS: {
        SIDEBAR_TERMINAL: 'secondaryTerminal',
        TERMINAL_INTEGRATED: 'terminal.integrated',
        MAX_TERMINALS: 'maxTerminals',
        SHELL: 'shell',
        SHELL_ARGS: 'shellArgs',
        SHELL_WINDOWS: 'shell.windows',
        SHELL_OSX: 'shell.osx',
        SHELL_LINUX: 'shell.linux',
    },
    // Extension-specific events
    EVENTS: {
        DATA: 'data',
        EXIT: 'exit',
        RESIZE: 'resize',
        TERMINAL_CREATED: 'terminalCreated',
        TERMINAL_REMOVED: 'terminalRemoved',
    },
    // Import shared commands
    COMMANDS: constants_1.SHARED_TERMINAL_COMMANDS,
};
/**
 * WebView constants
 * Theme definitions moved to src/webview/types/theme.types.ts
 */
exports.WEBVIEW_CONSTANTS = {
    // CSS variables
    CSS_VARS: {
        TAB_INACTIVE_BACKGROUND: 'var(--vscode-tab-inactiveBackground)',
        TAB_ACTIVE_BACKGROUND: 'var(--vscode-tab-activeBackground)',
        TAB_INACTIVE_FOREGROUND: 'var(--vscode-tab-inactiveForeground)',
        TAB_ACTIVE_FOREGROUND: 'var(--vscode-tab-activeForeground)',
        TAB_BORDER: 'var(--vscode-tab-border)',
        EDITOR_BACKGROUND: 'var(--vscode-editor-background)',
    },
};
exports.ERROR_MESSAGES = {
    TERMINAL_CREATION_FAILED: 'Failed to create terminal',
    TERMINAL_CONTAINER_NOT_FOUND: 'Terminal container not found',
    MAX_TERMINALS_REACHED: 'Maximum number of terminals reached',
};
/**
 * VS Code コマンド定数
 */
exports.VSCODE_COMMANDS = {
    // Copilot Chat関連
    CHAT_OPEN: 'workbench.action.chat.open',
    CHAT_FOCUS_FALLBACK: 'workbench.panel.chat.view.copilot.focus',
    // Secondary Terminal関連
    SECONDARY_TERMINAL_FOCUS: 'secondaryTerminal.focus',
    SECONDARY_TERMINAL_CREATE: 'secondaryTerminal.createTerminal',
    SECONDARY_TERMINAL_KILL: 'secondaryTerminal.killTerminal',
    SECONDARY_TERMINAL_VIEW_FOCUS: 'secondaryTerminalView.focus',
    // Workbench関連
    SHOW_COMMANDS: 'workbench.action.showCommands',
    WORKBENCH_OPEN_SETTINGS: 'workbench.action.openSettings',
    WORKBENCH_RELOAD_WINDOW: 'workbench.action.reloadWindow',
};
/**
 * ドメイン別定数ファイルからの詳細な定数グループをエクスポート
 * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/226
 *
 * リファクタリング: SystemConstants.ts を以下のドメイン別ファイルに分割
 * - PerformanceConstants.ts: パフォーマンス関連
 * - TerminalConstants.ts: ターミナル関連
 * - UIConstants.ts: UI/UX 関連
 * - CommunicationConstants.ts: 通信・メッセージング関連
 * - ErrorConstants.ts: エラーハンドリング関連
 * - TimingConstants.ts: タイミング関連
 * - ConfigCacheConstants.ts: 設定キャッシュ関連
 * - EnumConstants.ts: 列挙型定義
 */
// パフォーマンス関連定数
var PerformanceConstants_1 = require("./PerformanceConstants");
Object.defineProperty(exports, "PERFORMANCE_CONSTANTS", { enumerable: true, get: function () { return PerformanceConstants_1.PERFORMANCE_CONSTANTS; } });
// タイミング関連定数
var TimingConstants_1 = require("./TimingConstants");
Object.defineProperty(exports, "TIMING_CONSTANTS", { enumerable: true, get: function () { return TimingConstants_1.TIMING_CONSTANTS; } });
// UI/UX関連定数
var UIConstants_1 = require("./UIConstants");
Object.defineProperty(exports, "UI_CONSTANTS", { enumerable: true, get: function () { return UIConstants_1.UI_CONSTANTS; } });
// 通信・メッセージング関連定数
var CommunicationConstants_1 = require("./CommunicationConstants");
Object.defineProperty(exports, "COMMUNICATION_CONSTANTS", { enumerable: true, get: function () { return CommunicationConstants_1.COMMUNICATION_CONSTANTS; } });
// エラーハンドリング関連定数
var ErrorConstants_1 = require("./ErrorConstants");
Object.defineProperty(exports, "ERROR_CONSTANTS", { enumerable: true, get: function () { return ErrorConstants_1.ERROR_CONSTANTS; } });
// 設定キャッシュ関連定数
var ConfigCacheConstants_1 = require("./ConfigCacheConstants");
Object.defineProperty(exports, "CONFIG_CACHE_CONSTANTS", { enumerable: true, get: function () { return ConfigCacheConstants_1.CONFIG_CACHE_CONSTANTS; } });
// システムターミナル定数（詳細版）
var TerminalConstants_1 = require("./TerminalConstants");
Object.defineProperty(exports, "SYSTEM_TERMINAL_CONSTANTS", { enumerable: true, get: function () { return TerminalConstants_1.TERMINAL_CONSTANTS; } });
// 列挙型
var EnumConstants_1 = require("./EnumConstants");
Object.defineProperty(exports, "SystemStatus", { enumerable: true, get: function () { return EnumConstants_1.SystemStatus; } });
Object.defineProperty(exports, "TerminalAction", { enumerable: true, get: function () { return EnumConstants_1.TerminalAction; } });
Object.defineProperty(exports, "MessageSeverity", { enumerable: true, get: function () { return EnumConstants_1.MessageSeverity; } });
Object.defineProperty(exports, "NotificationType", { enumerable: true, get: function () { return EnumConstants_1.NotificationType; } });
Object.defineProperty(exports, "CliAgentStatus", { enumerable: true, get: function () { return EnumConstants_1.CliAgentStatus; } });
Object.defineProperty(exports, "TerminalState", { enumerable: true, get: function () { return EnumConstants_1.TerminalState; } });
Object.defineProperty(exports, "SessionOperation", { enumerable: true, get: function () { return EnumConstants_1.SessionOperation; } });
Object.defineProperty(exports, "PerformanceMetric", { enumerable: true, get: function () { return EnumConstants_1.PerformanceMetric; } });
Object.defineProperty(exports, "ResourceType", { enumerable: true, get: function () { return EnumConstants_1.ResourceType; } });
Object.defineProperty(exports, "ConfigurationCategory", { enumerable: true, get: function () { return EnumConstants_1.ConfigurationCategory; } });
// 後方互換性のため SystemConstants.ts からもエクスポート
// 新しいコードでは上記のドメイン別インポートを推奨
__exportStar(require("./SystemConstants"), exports);
//# sourceMappingURL=index.js.map