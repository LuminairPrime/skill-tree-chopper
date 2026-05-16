"use strict";
/** Component-specific loggers for debugging and monitoring. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebViewLogger = exports.AgentLogger = exports.PerformanceLogger = exports.SessionLogger = exports.ExtensionLogger = exports.WebViewLogger = exports.MessageLogger = exports.TerminalLogger = void 0;
const logger_1 = require("./logger");
/** Terminal operations logger. */
class TerminalLogger {
    constructor(terminalId, terminalName) {
        this.terminalId = terminalId;
        this.terminalName = terminalName;
    }
    fmt(action) {
        const ctx = this.terminalId ? `[${this.terminalId}]` : '';
        const name = this.terminalName ? `(${this.terminalName})` : '';
        return `${ctx}${name} ${action}`;
    }
    create(id, name) {
        (0, logger_1.terminal)(this.fmt(`Created: ${id} - ${name}`));
    }
    destroy(reason) {
        (0, logger_1.terminal)(this.fmt(`Destroyed${reason ? ` - ${reason}` : ''}`));
    }
    output(data, size) {
        (0, logger_1.output)(this.fmt(`Output: ${size} chars`), data.length > 100 ? `${data.slice(0, 100)}...` : data);
    }
    input(data) {
        (0, logger_1.input)(this.fmt(`Input: ${data.length} chars`), data);
    }
    resize(cols, rows) {
        (0, logger_1.terminal)(this.fmt(`Resized to ${cols}x${rows}`));
    }
    focus() {
        (0, logger_1.terminal)(this.fmt('Focused'));
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
    performance(op, duration) {
        (0, logger_1.performance)(this.fmt(`${op}: ${duration}ms`));
    }
}
exports.TerminalLogger = TerminalLogger;
/** Message processing logger. */
class MessageLogger {
    constructor(context = 'MessageManager') {
        this.context = context;
    }
    fmt(action) {
        return `[${this.context}] ${action}`;
    }
    received(cmd, source) {
        (0, logger_1.message)(this.fmt(`Received: ${cmd}${source ? ` from ${source}` : ''}`));
    }
    sent(cmd, target) {
        (0, logger_1.message)(this.fmt(`Sent: ${cmd}${target ? ` to ${target}` : ''}`));
    }
    queued(cmd, queueSize) {
        (0, logger_1.message)(this.fmt(`Queued: ${cmd} (queue: ${queueSize})`));
    }
    processed(cmd, duration) {
        (0, logger_1.message)(this.fmt(`Processed: ${cmd} in ${duration}ms`));
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
    performance(op, metrics) {
        (0, logger_1.performance)(this.fmt(`${op} metrics`), metrics);
    }
}
exports.MessageLogger = MessageLogger;
/** WebView operations logger. */
class WebViewLogger {
    constructor(managerId) {
        this.managerId = managerId;
    }
    fmt(action) {
        return `[${this.managerId}] ${action}`;
    }
    initialized() {
        (0, logger_1.lifecycle)(this.fmt('Initialized'));
    }
    domReady() {
        (0, logger_1.ui)(this.fmt('DOM ready'));
    }
    render(component, duration) {
        (0, logger_1.ui)(this.fmt(`Rendered ${component}${duration ? ` in ${duration}ms` : ''}`));
    }
    interaction(type, element) {
        (0, logger_1.input)(this.fmt(`${type} on ${element}`));
    }
    stateChange(prop, oldVal, newVal) {
        (0, logger_1.state)(this.fmt(`State: ${prop}`), { oldVal, newVal });
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
    warning(op, details) {
        (0, logger_1.warning_category)(this.fmt(`Warning in ${op}`), details);
    }
}
exports.WebViewLogger = WebViewLogger;
/** Extension provider logger. */
class ExtensionLogger {
    constructor(providerId) {
        this.providerId = providerId;
    }
    fmt(action) {
        return `[${this.providerId}] ${action}`;
    }
    activated() {
        (0, logger_1.lifecycle)(this.fmt('Activated'));
    }
    deactivated() {
        (0, logger_1.lifecycle)(this.fmt('Deactivated'));
    }
    command(cmdId, args) {
        (0, logger_1.extension)(this.fmt(`Command: ${cmdId}`), args);
    }
    configChanged(setting, value) {
        (0, logger_1.config)(this.fmt(`Config: ${setting}`), value);
    }
    event(type, data) {
        (0, logger_1.extension)(this.fmt(`Event: ${type}`), data);
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
}
exports.ExtensionLogger = ExtensionLogger;
/** Session management logger. */
class SessionLogger {
    constructor(sessionType = 'Session') {
        this.sessionType = sessionType;
    }
    fmt(action) {
        return `[${this.sessionType}] ${action}`;
    }
    save(id, size) {
        (0, logger_1.session)(this.fmt(`Saved: ${id} (${size} bytes)`));
    }
    restore(id, count) {
        (0, logger_1.session)(this.fmt(`Restored: ${id} (${count} terminals)`));
    }
    clear(id) {
        (0, logger_1.session)(this.fmt(`Cleared: ${id}`));
    }
    progress(op, current, total) {
        (0, logger_1.session)(this.fmt(`${op}: ${current}/${total}`));
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
}
exports.SessionLogger = SessionLogger;
/** Performance monitoring logger. */
class PerformanceLogger {
    constructor(component) {
        this.component = component;
    }
    fmt(action) {
        return `[${this.component}] ${action}`;
    }
    startOperation(id) {
        (0, logger_1.performance)(this.fmt(`Started: ${id}`));
    }
    endOperation(id, duration, meta) {
        (0, logger_1.performance)(this.fmt(`Completed: ${id} in ${duration}ms`), meta);
    }
    memory(usage) {
        (0, logger_1.performance)(this.fmt(`Memory: ${usage.used}/${usage.total} MB`));
    }
    throttle(op, delay) {
        (0, logger_1.performance)(this.fmt(`Throttled: ${op} (${delay}ms)`));
    }
    buffer(op, size, interval) {
        (0, logger_1.performance)(this.fmt(`Buffered: ${op} (${size} items, ${interval}ms)`));
    }
}
exports.PerformanceLogger = PerformanceLogger;
/** CLI Agent detection logger. */
class AgentLogger {
    constructor(agentType) {
        this.agentType = agentType;
    }
    fmt(action) {
        return `[${this.agentType || 'Agent'}] ${action}`;
    }
    detected(terminalId, type) {
        (0, logger_1.agent)(this.fmt(`Detected in ${terminalId}: ${type}`));
    }
    statusChange(oldStatus, newStatus, terminalId) {
        (0, logger_1.agent)(this.fmt(`${oldStatus} → ${newStatus}${terminalId ? ` (${terminalId})` : ''}`));
    }
    terminated(terminalId, reason) {
        (0, logger_1.agent)(this.fmt(`Terminated in ${terminalId}${reason ? ` - ${reason}` : ''}`));
    }
    output(terminalId, size, patterns) {
        (0, logger_1.agent)(this.fmt(`Output in ${terminalId}: ${size} chars`), patterns);
    }
    error(op, err) {
        (0, logger_1.error_category)(this.fmt(`Error in ${op}`), err);
    }
}
exports.AgentLogger = AgentLogger;
const createWebViewLogger = (managerId) => new WebViewLogger(managerId);
exports.createWebViewLogger = createWebViewLogger;
//# sourceMappingURL=ComponentLoggers.js.map