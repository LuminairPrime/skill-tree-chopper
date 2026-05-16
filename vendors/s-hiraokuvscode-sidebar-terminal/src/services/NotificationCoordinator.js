"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCoordinator = void 0;
const agentConstants_1 = require("./agentConstants");
const logger_1 = require("../utils/logger");
class NotificationCoordinator {
    constructor(toastService, nativeService) {
        this.toastService = toastService;
        this.nativeService = nativeService;
        this.isDisposed = false;
    }
    notifyCompleted(terminalId, agentType) {
        if (this.isDisposed) {
            return;
        }
        this.safeCall(() => this.toastService.showCompletedNotification(terminalId, agentType));
        this.safeCall(() => this.nativeService.notifyCompleted(terminalId, agentConstants_1.NOTIFICATION_TITLE, `${(0, agentConstants_1.getAgentDisplayName)(agentType)} has completed (${terminalId})`));
    }
    clearTerminal(terminalId) {
        if (this.isDisposed) {
            return;
        }
        this.safeCall(() => this.toastService.clearTerminal(terminalId));
        this.safeCall(() => this.nativeService.clearTerminal(terminalId));
    }
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;
        this.safeCall(() => this.toastService.dispose());
        this.safeCall(() => this.nativeService.dispose());
    }
    safeCall(fn) {
        try {
            fn();
        }
        catch (error) {
            (0, logger_1.terminal)('[NOTIFICATION] Error in notification service:', error);
        }
    }
}
exports.NotificationCoordinator = NotificationCoordinator;
//# sourceMappingURL=NotificationCoordinator.js.map