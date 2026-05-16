"use strict";
/**
 * Notification Manager - Handles user feedback, notifications, and visual alerts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const BaseManager_1 = require("./BaseManager");
class NotificationManager extends BaseManager_1.BaseManager {
    constructor() {
        super('NotificationManager', {
            enableLogging: true,
            enableValidation: false,
            enableErrorRecovery: true,
        });
        // Active notifications tracking
        this.activeNotifications = new Map();
        this.notificationCounter = 0;
        // Default notification settings
        this.DEFAULT_DURATION = 3000;
        this.DEFAULT_POSITION = 'top';
    }
    /**
     * Show notification in terminal area
     */
    showNotificationInTerminal(message, type = 'info') {
        const notification = this.createNotification(message, {
            type,
            duration: this.DEFAULT_DURATION,
            position: 'top',
        });
        this.addNotificationToTerminal(notification);
        this.logger(`📢 [NOTIFICATION] Showed ${type} notification: ${message}`);
    }
    /**
     * Show terminal kill error
     */
    showTerminalKillError(message) {
        this.showNotificationInTerminal(`❌ Kill Error: ${message}`, 'error');
    }
    /**
     * Show terminal close error
     */
    showTerminalCloseError(minCount) {
        this.showNotificationInTerminal(`⚠️ Cannot close: Minimum ${minCount} terminal${minCount > 1 ? 's' : ''} required`, 'warning');
    }
    /**
     * Show Alt+Click feedback at cursor position
     */
    showAltClickFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'alt-click-feedback';
        feedback.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: #007acc;
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      animation: altClickFade 0.6s ease-out forwards;
    `;
        document.body.appendChild(feedback);
        // Remove after animation
        setTimeout(() => {
            feedback.remove();
        }, 600);
        this.logger(`⌨️ [NOTIFICATION] Alt+Click feedback shown at (${x}, ${y})`);
    }
    /**
     * Show warning notification
     */
    showWarning(message) {
        this.showNotificationInTerminal(`⚠️ ${message}`, 'warning');
    }
    /**
     * Clear warning notifications
     */
    clearWarnings() {
        // Clear warning-specific notifications
        const warnings = document.querySelectorAll('.notification-warning');
        warnings.forEach((warning) => {
            warning.remove();
        });
        this.logger('⚠️ [NOTIFICATION] Warning notifications cleared');
    }
    /**
     * Clear all notifications
     */
    clearNotifications() {
        this.activeNotifications.forEach((_notification, id) => {
            this.removeNotification(id);
        });
        // Clear any remaining notification elements
        const notifications = document.querySelectorAll('.notification, .alt-click-feedback');
        notifications.forEach((notification) => {
            notification.remove();
        });
        this.logger('🧹 [NOTIFICATION] All notifications cleared');
    }
    /**
     * Create notification element
     */
    createNotification(message, options) {
        const notification = document.createElement('div');
        const id = `notification-${++this.notificationCounter}`;
        notification.id = id;
        notification.className = `notification notification-${options.type || 'info'}`;
        notification.textContent = message;
        // Apply subtle styling - more integrated with VS Code
        notification.style.cssText = `
      position: absolute;
      ${options.position === 'top' ? 'top: 10px' : options.position === 'bottom' ? 'bottom: 10px' : 'top: 50%'};
      left: 50%;
      transform: translateX(-50%) ${options.position === 'center' ? 'translateY(-50%)' : ''};
      background: ${this.getNotificationBackground(options.type || 'info')};
      color: rgba(255, 255, 255, 0.95);
      padding: 6px 12px;
      border-radius: 3px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 9999;
      max-width: 70%;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      opacity: 0.75;
      animation: subtleSlideIn 0.2s ease-out;
    `;
        // Auto-remove if not persistent
        if (!options.persistent) {
            setTimeout(() => {
                this.removeNotificationElement(notification);
            }, options.duration || this.DEFAULT_DURATION);
        }
        return notification;
    }
    /**
     * Get notification background color by type
     */
    getNotificationBackground(type) {
        switch (type) {
            case 'success':
                return 'rgba(40, 167, 69, 0.7)';
            case 'warning':
                return 'rgba(255, 193, 7, 0.7)';
            case 'error':
                return 'rgba(220, 53, 69, 0.7)';
            case 'info':
            default:
                return 'rgba(0, 123, 255, 0.7)';
        }
    }
    /**
     * Add notification to terminal container
     */
    addNotificationToTerminal(notification) {
        const terminalContainer = document.getElementById('terminal-container') || document.body;
        terminalContainer.appendChild(notification);
        // Position relative to terminal container
        if (terminalContainer.id === 'terminal-container') {
            notification.style.position = 'absolute';
        }
    }
    /**
     * Remove notification by ID
     */
    removeNotification(id) {
        const notification = this.activeNotifications.get(id);
        if (notification) {
            this.removeNotificationElement(notification);
            this.activeNotifications.delete(id);
        }
    }
    /**
     * Remove notification element with animation
     */
    removeNotificationElement(notification) {
        notification.style.animation = 'subtleSlideOut 0.2s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 200);
    }
    /**
     * Show loading notification
     */
    showLoading(message = 'Loading...') {
        const id = `loading-${++this.notificationCounter}`;
        const notification = this.createNotification(message, {
            type: 'info',
            persistent: true,
            position: 'center',
        });
        notification.classList.add('loading-notification');
        // SECURITY: Build DOM structure safely to prevent XSS
        const containerDiv = document.createElement('div');
        containerDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const spinnerDiv = document.createElement('div');
        spinnerDiv.className = 'loading-spinner';
        spinnerDiv.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message; // Safe: textContent escapes HTML
        containerDiv.appendChild(spinnerDiv);
        containerDiv.appendChild(messageSpan);
        // Clear existing content and append new structure
        notification.textContent = '';
        notification.appendChild(containerDiv);
        this.activeNotifications.set(id, notification);
        this.addNotificationToTerminal(notification);
        this.logger(`⏳ [NOTIFICATION] Loading notification shown: ${message}`);
        return id;
    }
    /**
     * Hide loading notification
     */
    hideLoading(id) {
        this.removeNotification(id);
        this.logger(`✅ [NOTIFICATION] Loading notification hidden: ${id}`);
    }
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 2000) {
        const notification = this.createNotification(message, {
            type,
            duration,
            position: 'top',
        });
        notification.classList.add('toast-notification');
        this.addNotificationToTerminal(notification);
        this.logger(`🍞 [NOTIFICATION] Toast shown: ${message} (${type})`);
    }
    /**
     * Setup CSS animations
     */
    setupNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
      @keyframes subtleSlideIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
        to { opacity: 0.85; transform: translateX(-50%) translateY(0); }
      }
      
      @keyframes subtleSlideOut {
        from { opacity: 0.85; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-5px); }
      }
      
      @keyframes notificationSlideIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      
      @keyframes notificationSlideOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
      
      @keyframes altClickFade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(3); }
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
        document.head.appendChild(style);
        this.logger('🎨 [NOTIFICATION] Notification styles setup');
    }
    /**
     * Get notification statistics
     */
    getStats() {
        return {
            activeCount: this.activeNotifications.size,
            totalCreated: this.notificationCounter,
        };
    }
    /**
     * Initialize the NotificationManager (BaseManager abstract method implementation)
     */
    doInitialize() {
        this.logger('🚀 NotificationManager initialized');
    }
    /**
     * Dispose NotificationManager resources (BaseManager abstract method implementation)
     */
    doDispose() {
        this.logger('🧹 Disposing NotificationManager resources');
        // Clear all notifications
        this.clearNotifications();
        // Reset counters
        this.notificationCounter = 0;
        this.logger('✅ NotificationManager resources disposed');
    }
    /**
     * Dispose and cleanup
     */
    dispose() {
        this.logger('🧹 [NOTIFICATION] Disposing notification manager');
        // Call parent dispose which will call doDispose()
        super.dispose();
        this.logger('✅ [NOTIFICATION] Notification manager disposed');
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=NotificationManager.js.map