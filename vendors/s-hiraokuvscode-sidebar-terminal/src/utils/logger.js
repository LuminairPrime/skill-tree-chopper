"use strict";
/** Environment-aware logging utility for VS Code extension. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInfoEnabled = exports.isDebugEnabled = exports.warning_category = exports.error_category = exports.agent = exports.startup = exports.success = exports.lifecycle = exports.session = exports.scrollback = exports.state = exports.network = exports.file = exports.debug_category = exports.output = exports.input = exports.config = exports.ui = exports.message = exports.performance = exports.extension = exports.provider = exports.webview = exports.terminal = exports.log = exports.error = exports.warn = exports.info = exports.debug = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.logBuffer = [];
        this.bufferFlushInterval = 100; // ms
        this.maxBufferSize = 50;
        const isWebViewEnvironment = typeof window !== 'undefined' && typeof process === 'undefined';
        if (isWebViewEnvironment) {
            this.isDevelopment = this.detectWebViewDevMode();
        }
        else {
            this.isDevelopment = process.env.NODE_ENV !== 'production';
        }
        this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
        this.isProduction = !this.isDevelopment;
        if (this.isProduction) {
            this.setupProductionLogging();
        }
    }
    detectWebViewDevMode() {
        if (typeof window === 'undefined')
            return false;
        const isDevHost = window.location?.hostname === 'localhost' || window.location?.protocol === 'vscode-webview:';
        const hasDebugFlag = window.location?.search?.includes('debug=true') ||
            window.VSCODE_DEBUG === true;
        return isDevHost || hasDebugFlag;
    }
    setLevel(level) {
        this.level = level;
    }
    isDebugEnabled() {
        return this.level <= LogLevel.DEBUG;
    }
    isInfoEnabled() {
        return this.level <= LogLevel.INFO;
    }
    setupProductionLogging() {
        this.flushTimer = setInterval(() => this.flushBuffer(), this.bufferFlushInterval);
    }
    addToBuffer(level, args) {
        this.logBuffer.push({ level, args, timestamp: Date.now() });
        if (this.logBuffer.length >= this.maxBufferSize)
            this.flushBuffer();
    }
    flushBuffer() {
        if (this.logBuffer.length === 0)
            return;
        // Production logs are suppressed - buffer is only cleared
        this.logBuffer = [];
    }
    dispose() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        this.flushBuffer();
    }
    safeStringify(obj) {
        if (typeof obj === 'string')
            return obj;
        if (typeof obj === 'number' || typeof obj === 'boolean')
            return String(obj);
        if (obj === null || obj === undefined)
            return String(obj);
        try {
            return JSON.stringify(obj, null, 2);
        }
        catch {
            return '[Complex Object]';
        }
    }
    formatMessage(level, category, emoji, ...args) {
        const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS format
        const safeArgs = args.map((arg) => (typeof arg === 'object' ? this.safeStringify(arg) : arg));
        return [`[${timestamp}] ${emoji} [${level}:${category}]`, ...safeArgs];
    }
    debug(...args) {
        if (this.level <= LogLevel.DEBUG) {
            const safeArgs = args.map((arg) => (typeof arg === 'object' ? this.safeStringify(arg) : arg));
            if (this.isProduction) {
                this.addToBuffer('log', ['[DEBUG]', ...safeArgs]);
            }
            else {
                // Development mode only - will be stripped in production builds
                console.log('[DEBUG]', ...safeArgs);
            }
        }
    }
    info(...args) {
        if (this.level <= LogLevel.INFO) {
            const safeArgs = args.map((arg) => (typeof arg === 'object' ? this.safeStringify(arg) : arg));
            if (this.isProduction) {
                this.addToBuffer('log', ['[INFO]', ...safeArgs]);
            }
            else {
                // Development mode only - will be stripped in production builds
                console.log('[INFO]', ...safeArgs);
            }
        }
    }
    warn(...args) {
        if (this.level <= LogLevel.WARN) {
            const safeArgs = args.map((arg) => (typeof arg === 'object' ? this.safeStringify(arg) : arg));
            if (this.isProduction) {
                this.addToBuffer('warn', ['[WARN]', ...safeArgs]);
            }
            else {
                // Development mode only - will be stripped in production builds
                console.warn('[WARN]', ...safeArgs);
            }
        }
    }
    error(...args) {
        if (this.level <= LogLevel.ERROR) {
            const safeArgs = args.map((arg) => (typeof arg === 'object' ? this.safeStringify(arg) : arg));
            // Errors are always logged immediately, even in production
            console.error('[ERROR]', ...safeArgs);
        }
    }
    // Categorized logging - DEBUG level
    logDebug(category, emoji, ...args) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(...this.formatMessage('DEBUG', category, emoji, ...args));
        }
    }
    // Categorized logging - INFO level
    logInfo(category, emoji, ...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(...this.formatMessage('INFO', category, emoji, ...args));
        }
    }
    terminal(...args) {
        this.logDebug('TERMINAL', '✨', ...args);
    }
    webview(...args) {
        this.logDebug('WEBVIEW', '🌐', ...args);
    }
    provider(...args) {
        this.logDebug('PROVIDER', '📡', ...args);
    }
    extension(...args) {
        this.logDebug('EXTENSION', '🔧', ...args);
    }
    performance(...args) {
        this.logDebug('PERF', '⚡', ...args);
    }
    message(...args) {
        this.logDebug('MESSAGE', '📨', ...args);
    }
    ui(...args) {
        this.logDebug('UI', '🎨', ...args);
    }
    config(...args) {
        this.logDebug('CONFIG', '⚙️', ...args);
    }
    input(...args) {
        this.logDebug('INPUT', '⌨️', ...args);
    }
    output(...args) {
        this.logDebug('OUTPUT', '📤', ...args);
    }
    debug_category(...args) {
        this.logDebug('DEBUG', '🔍', ...args);
    }
    file(...args) {
        this.logDebug('FILE', '📁', ...args);
    }
    network(...args) {
        this.logDebug('NETWORK', '🌐', ...args);
    }
    state(...args) {
        this.logDebug('STATE', '🔄', ...args);
    }
    scrollback(...args) {
        this.logDebug('SCROLLBACK', '📜', ...args);
    }
    session(...args) {
        this.logInfo('SESSION', '💾', ...args);
    }
    lifecycle(...args) {
        this.logInfo('LIFECYCLE', '🔄', ...args);
    }
    success(...args) {
        this.logInfo('SUCCESS', '✅', ...args);
    }
    startup(...args) {
        this.logInfo('STARTUP', '🚀', ...args);
    }
    agent(...args) {
        this.logInfo('AGENT', '🤖', ...args);
    }
    error_category(...args) {
        if (this.level <= LogLevel.ERROR) {
            console.error(...this.formatMessage('ERROR', 'ERROR', '🚨', ...args));
        }
    }
    warning_category(...args) {
        if (this.level <= LogLevel.WARN) {
            console.warn(...this.formatMessage('WARN', 'WARNING', '⚠️', ...args));
        }
    }
}
exports.logger = new Logger();
// Basic logging
const debug = (...args) => exports.logger.debug(...args);
exports.debug = debug;
const info = (...args) => exports.logger.info(...args);
exports.info = info;
const warn = (...args) => exports.logger.warn(...args);
exports.warn = warn;
const error = (...args) => exports.logger.error(...args);
exports.error = error;
const log = (...args) => exports.logger.info(...args);
exports.log = log;
// Categorized logging - DEBUG level
const terminal = (...args) => exports.logger.terminal(...args);
exports.terminal = terminal;
const webview = (...args) => exports.logger.webview(...args);
exports.webview = webview;
const provider = (...args) => exports.logger.provider(...args);
exports.provider = provider;
const extension = (...args) => exports.logger.extension(...args);
exports.extension = extension;
const performance = (...args) => exports.logger.performance(...args);
exports.performance = performance;
const message = (...args) => exports.logger.message(...args);
exports.message = message;
const ui = (...args) => exports.logger.ui(...args);
exports.ui = ui;
const config = (...args) => exports.logger.config(...args);
exports.config = config;
const input = (...args) => exports.logger.input(...args);
exports.input = input;
const output = (...args) => exports.logger.output(...args);
exports.output = output;
const debug_category = (...args) => exports.logger.debug_category(...args);
exports.debug_category = debug_category;
const file = (...args) => exports.logger.file(...args);
exports.file = file;
const network = (...args) => exports.logger.network(...args);
exports.network = network;
const state = (...args) => exports.logger.state(...args);
exports.state = state;
const scrollback = (...args) => exports.logger.scrollback(...args);
exports.scrollback = scrollback;
// Categorized logging - INFO level
const session = (...args) => exports.logger.session(...args);
exports.session = session;
const lifecycle = (...args) => exports.logger.lifecycle(...args);
exports.lifecycle = lifecycle;
const success = (...args) => exports.logger.success(...args);
exports.success = success;
const startup = (...args) => exports.logger.startup(...args);
exports.startup = startup;
const agent = (...args) => exports.logger.agent(...args);
exports.agent = agent;
// Categorized logging - WARN/ERROR level
const error_category = (...args) => exports.logger.error_category(...args);
exports.error_category = error_category;
const warning_category = (...args) => exports.logger.warning_category(...args);
exports.warning_category = warning_category;
// Query helpers
const isDebugEnabled = () => exports.logger.isDebugEnabled();
exports.isDebugEnabled = isDebugEnabled;
const isInfoEnabled = () => exports.logger.isInfoEnabled();
exports.isInfoEnabled = isInfoEnabled;
//# sourceMappingURL=logger.js.map