"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastNotificationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
const agentConstants_1 = require("./agentConstants");
const SETTING_PREFIX = 'secondaryTerminal';
const STATUS_BAR_DISPLAY_MS = 5000;
class ToastNotificationService {
    constructor() {
        this.lastNotifiedAt = new Map();
        this.lastGlobalNotifiedAt = 0;
        this.isDisposed = false;
    }
    getConfig() {
        const config = vscode.workspace.getConfiguration(SETTING_PREFIX);
        return {
            enabled: config.get('agentToastNotification.enabled', true),
            cooldownMs: Math.max(1000, Math.min(60000, config.get('agentToastNotification.cooldownMs', 10000))),
        };
    }
    canNotify(terminalId, cooldownMs) {
        const now = Date.now();
        if (now - this.lastGlobalNotifiedAt < cooldownMs) {
            return false;
        }
        const lastNotified = this.lastNotifiedAt.get(terminalId) ?? 0;
        if (now - lastNotified < cooldownMs) {
            return false;
        }
        this.lastNotifiedAt.set(terminalId, now);
        this.lastGlobalNotifiedAt = now;
        return true;
    }
    showCompletedNotification(terminalId, agentType) {
        if (this.isDisposed) {
            return;
        }
        const config = this.getConfig();
        if (!config.enabled || !this.canNotify(terminalId, config.cooldownMs)) {
            return;
        }
        const agentName = (0, agentConstants_1.getAgentDisplayName)(agentType);
        const message = `${agentName} has completed (${terminalId})`;
        (0, logger_1.terminal)('[TOAST]', message);
        vscode.window.setStatusBarMessage(`$(terminal) ${message}`, STATUS_BAR_DISPLAY_MS);
    }
    clearTerminal(terminalId) {
        this.lastNotifiedAt.delete(terminalId);
    }
    dispose() {
        this.isDisposed = true;
        this.lastNotifiedAt.clear();
        this.lastGlobalNotifiedAt = 0;
    }
}
exports.ToastNotificationService = ToastNotificationService;
//# sourceMappingURL=ToastNotificationService.js.map