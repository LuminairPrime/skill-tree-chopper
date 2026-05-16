"use strict";
/** Common utility functions for the extension. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveTerminalManager = void 0;
exports.safeProcessCwd = safeProcessCwd;
exports.validateDirectory = validateDirectory;
exports.getWorkingDirectory = getWorkingDirectory;
exports.generateTerminalId = generateTerminalId;
exports.normalizeTerminalInfo = normalizeTerminalInfo;
exports.generateTerminalName = generateTerminalName;
exports.generateNonce = generateNonce;
exports.getFirstItem = getFirstItem;
exports.getFirstValue = getFirstValue;
exports.delay = delay;
exports.safeStringify = safeStringify;
exports.getTerminalConfig = getTerminalConfig;
exports.getShellForPlatform = getShellForPlatform;
exports.showErrorMessage = showErrorMessage;
exports.showWarningMessage = showWarningMessage;
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const fs = require("fs");
const constants_1 = require("../constants");
const UnifiedConfigurationService_1 = require("../config/UnifiedConfigurationService");
/** Safe process.cwd() that works in test environments. */
function safeProcessCwd(fallback) {
    try {
        const cwd = process.cwd && typeof process.cwd === 'function' ? process.cwd() : null;
        if (cwd && cwd !== '/')
            return cwd;
        return fallback || os.homedir();
    }
    catch {
        return fallback || os.homedir();
    }
}
/** Validates that a directory exists and is accessible. */
function validateDirectory(dirPath) {
    try {
        const stat = fs.statSync(dirPath);
        if (!stat.isDirectory())
            return false;
        fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
/** Gets the working directory based on configuration and workspace. */
function getWorkingDirectory() {
    const config = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)().getExtensionTerminalConfig();
    const customDir = config.defaultDirectory?.trim();
    // Try custom directory first
    if (customDir && validateDirectory(customDir)) {
        return customDir;
    }
    // Try workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceRoot = workspaceFolders[0]?.uri.fsPath;
        if (workspaceRoot && validateDirectory(workspaceRoot)) {
            return workspaceRoot;
        }
    }
    // Try active editor's directory
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document?.uri?.scheme === 'file') {
        const activeFileDir = path.dirname(activeEditor.document.uri.fsPath);
        if (validateDirectory(activeFileDir)) {
            return activeFileDir;
        }
    }
    // Fallback to home directory
    const homeDir = os.homedir();
    if (validateDirectory(homeDir)) {
        return homeDir;
    }
    return safeProcessCwd();
}
function generateTerminalId() {
    return `terminal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function normalizeTerminalInfo(terminal) {
    return {
        id: terminal.id,
        name: terminal.name,
        isActive: terminal.isActive,
        ...(terminal.indicatorColor ? { indicatorColor: terminal.indicatorColor } : {}),
    };
}
function generateTerminalName(index) {
    return `${constants_1.TERMINAL_CONSTANTS.TERMINAL_NAME_PREFIX} ${index}`;
}
/** Manages active terminal state. */
class ActiveTerminalManager {
    setActive(terminalId) {
        this.activeTerminalId = terminalId;
    }
    getActive() {
        return this.activeTerminalId;
    }
    clearActive() {
        this.activeTerminalId = undefined;
    }
    hasActive() {
        return this.activeTerminalId !== undefined;
    }
    isActive(terminalId) {
        return this.activeTerminalId === terminalId;
    }
}
exports.ActiveTerminalManager = ActiveTerminalManager;
function generateNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < constants_1.TERMINAL_CONSTANTS.NONCE_LENGTH; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getFirstItem(array) {
    return array && array.length > 0 ? array[0] : undefined;
}
function getFirstValue(map) {
    return getFirstItem(Array.from(map.values()));
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function safeStringify(obj) {
    try {
        const result = JSON.stringify(obj);
        return result !== undefined ? result : String(obj);
    }
    catch {
        return String(obj);
    }
}
function getTerminalConfig() {
    return (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)().getExtensionTerminalConfig();
}
function getShellForPlatform() {
    const platform = os.platform();
    if (platform === 'win32')
        return process.env.COMSPEC || 'cmd.exe';
    if (platform === 'darwin')
        return process.env.SHELL || '/bin/zsh';
    return process.env.SHELL || '/bin/bash';
}
function showErrorMessage(message, ...items) {
    return vscode.window.showErrorMessage(message, ...items);
}
function showWarningMessage(message, ...items) {
    return vscode.window.showWarningMessage(message, ...items);
}
//# sourceMappingURL=common.js.map