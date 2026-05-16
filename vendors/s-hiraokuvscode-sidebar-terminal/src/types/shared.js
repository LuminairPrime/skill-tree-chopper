"use strict";
/**
 * Shared type definitions - Base types used across all components
 * Type definitions shared between Extension Host and WebView
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionState = exports.ProcessState = exports.CONFIG_KEYS = exports.CONFIG_SECTIONS = exports.all = exports.tryCatch = exports.fromPromise = exports.onSuccess = exports.onFailure = exports.mapError = exports.chain = exports.map = exports.unwrapOr = exports.unwrap = exports.isFailure = exports.isSuccess = exports.failureFromError = exports.failureFromDetails = exports.failure = exports.success = exports.ResultError = exports.ErrorCode = void 0;
exports.isBaseTerminalConfig = isBaseTerminalConfig;
var result_1 = require("./result");
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return result_1.ErrorCode; } });
Object.defineProperty(exports, "ResultError", { enumerable: true, get: function () { return result_1.ResultError; } });
Object.defineProperty(exports, "success", { enumerable: true, get: function () { return result_1.success; } });
Object.defineProperty(exports, "failure", { enumerable: true, get: function () { return result_1.failure; } });
Object.defineProperty(exports, "failureFromDetails", { enumerable: true, get: function () { return result_1.failureFromDetails; } });
Object.defineProperty(exports, "failureFromError", { enumerable: true, get: function () { return result_1.failureFromError; } });
Object.defineProperty(exports, "isSuccess", { enumerable: true, get: function () { return result_1.isSuccess; } });
Object.defineProperty(exports, "isFailure", { enumerable: true, get: function () { return result_1.isFailure; } });
Object.defineProperty(exports, "unwrap", { enumerable: true, get: function () { return result_1.unwrap; } });
Object.defineProperty(exports, "unwrapOr", { enumerable: true, get: function () { return result_1.unwrapOr; } });
Object.defineProperty(exports, "map", { enumerable: true, get: function () { return result_1.map; } });
Object.defineProperty(exports, "chain", { enumerable: true, get: function () { return result_1.chain; } });
Object.defineProperty(exports, "mapError", { enumerable: true, get: function () { return result_1.mapError; } });
Object.defineProperty(exports, "onFailure", { enumerable: true, get: function () { return result_1.onFailure; } });
Object.defineProperty(exports, "onSuccess", { enumerable: true, get: function () { return result_1.onSuccess; } });
Object.defineProperty(exports, "fromPromise", { enumerable: true, get: function () { return result_1.fromPromise; } });
Object.defineProperty(exports, "tryCatch", { enumerable: true, get: function () { return result_1.tryCatch; } });
Object.defineProperty(exports, "all", { enumerable: true, get: function () { return result_1.all; } });
// ===== Configuration Key Constants =====
/**
 * Key constants for configuration access
 */
exports.CONFIG_SECTIONS = {
    SIDEBAR_TERMINAL: 'secondaryTerminal',
    EDITOR: 'editor',
    TERMINAL_INTEGRATED: 'terminal.integrated',
};
exports.CONFIG_KEYS = {
    // secondaryTerminal section
    THEME: 'theme',
    CURSOR_BLINK: 'cursorBlink',
    MAX_TERMINALS: 'maxTerminals',
    MIN_TERMINAL_COUNT: 'minTerminalCount',
    SHELL: 'shell',
    SHELL_ARGS: 'shellArgs',
    DEFAULT_DIRECTORY: 'defaultDirectory',
    CONFIRM_BEFORE_KILL: 'confirmBeforeKill',
    PROTECT_LAST_TERMINAL: 'protectLastTerminal',
    // editor section
    MULTI_CURSOR_MODIFIER: 'multiCursorModifier',
    // terminal.integrated section
    ALT_CLICK_MOVES_CURSOR: 'altClickMovesCursor',
    SHELL_WINDOWS: 'shell.windows',
    SHELL_OSX: 'shell.osx',
    SHELL_LINUX: 'shell.linux',
    // 🆕 Phase 5: Terminal Profile System keys
    PROFILES_WINDOWS: 'profiles.windows',
    PROFILES_LINUX: 'profiles.linux',
    PROFILES_OSX: 'profiles.osx',
    DEFAULT_PROFILE_WINDOWS: 'defaultProfile.windows',
    DEFAULT_PROFILE_LINUX: 'defaultProfile.linux',
    DEFAULT_PROFILE_OSX: 'defaultProfile.osx',
    INHERIT_VSCODE_PROFILES: 'inheritVSCodeProfiles',
    ENABLE_PROFILE_AUTO_DETECTION: 'enableProfileAutoDetection',
    ACTIVE_BORDER_MODE: 'activeBorderMode',
};
/**
 * Terminal state management
 */
/**
 * Terminal process states based on VS Code's implementation
 * Improves process lifecycle tracking and error handling
 */
var ProcessState;
(function (ProcessState) {
    /** Process has not yet been initialized */
    ProcessState[ProcessState["Uninitialized"] = 0] = "Uninitialized";
    /** Process is currently starting up */
    ProcessState[ProcessState["Launching"] = 1] = "Launching";
    /** Process is executing normally */
    ProcessState[ProcessState["Running"] = 2] = "Running";
    /** Process terminated prematurely during launch */
    ProcessState[ProcessState["KilledDuringLaunch"] = 3] = "KilledDuringLaunch";
    /** Process was explicitly terminated by the user */
    ProcessState[ProcessState["KilledByUser"] = 4] = "KilledByUser";
    /** Process terminated on its own */
    ProcessState[ProcessState["KilledByProcess"] = 5] = "KilledByProcess";
})(ProcessState || (exports.ProcessState = ProcessState = {}));
/**
 * Terminal interaction state for persistent processes
 */
var InteractionState;
(function (InteractionState) {
    /** No interaction */
    InteractionState[InteractionState["None"] = 0] = "None";
    /** Replay only mode */
    InteractionState[InteractionState["ReplayOnly"] = 1] = "ReplayOnly";
    /** Session interaction mode */
    InteractionState[InteractionState["Session"] = 2] = "Session";
})(InteractionState || (exports.InteractionState = InteractionState = {}));
// ===== Type Guard Functions =====
/**
 * Type guard for BaseTerminalConfig
 */
function isBaseTerminalConfig(obj) {
    return typeof obj === 'object' && obj !== null;
}
//# sourceMappingURL=shared.js.map