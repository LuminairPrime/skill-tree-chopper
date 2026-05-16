"use strict";
/**
 * NotificationManager Test Suite - User feedback and notifications
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const NotificationManager_1 = require("../../../../../webview/managers/NotificationManager");
(0, vitest_1.describe)('NotificationManager', () => {
    let notificationManager;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Create container element
        const container = document.createElement('div');
        container.id = 'terminal-container';
        document.body.appendChild(container);
        notificationManager = new NotificationManager_1.NotificationManager();
        notificationManager.initialize();
    });
    (0, vitest_1.afterEach)(() => {
        notificationManager.dispose();
        vitest_1.vi.useRealTimers();
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('Initialization and Lifecycle', () => {
        (0, vitest_1.it)('should create instance correctly', () => {
            (0, vitest_1.expect)(notificationManager).toBeInstanceOf(NotificationManager_1.NotificationManager);
        });
        (0, vitest_1.it)('should initialize with zero notifications', () => {
            const stats = notificationManager.getStats();
            (0, vitest_1.expect)(stats.activeCount).toBe(0);
            (0, vitest_1.expect)(stats.totalCreated).toBe(0);
        });
        (0, vitest_1.it)('should dispose resources properly', () => {
            notificationManager.showNotificationInTerminal('Test', 'info');
            notificationManager.dispose();
            const stats = notificationManager.getStats();
            (0, vitest_1.expect)(stats.activeCount).toBe(0);
            (0, vitest_1.expect)(stats.totalCreated).toBe(0);
        });
    });
    (0, vitest_1.describe)('Notification Display', () => {
        (0, vitest_1.it)('should show info notification', () => {
            notificationManager.showNotificationInTerminal('Info message', 'info');
            const notifications = document.querySelectorAll('.notification-info');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should show success notification', () => {
            notificationManager.showNotificationInTerminal('Success message', 'success');
            const notifications = document.querySelectorAll('.notification-success');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should show warning notification', () => {
            notificationManager.showNotificationInTerminal('Warning message', 'warning');
            const notifications = document.querySelectorAll('.notification-warning');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should show error notification', () => {
            notificationManager.showNotificationInTerminal('Error message', 'error');
            const notifications = document.querySelectorAll('.notification-error');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should default to info type', () => {
            notificationManager.showNotificationInTerminal('Default message');
            const notifications = document.querySelectorAll('.notification-info');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
    });
    (0, vitest_1.describe)('Notification Auto-Dismiss', () => {
        (0, vitest_1.it)('should auto-dismiss notification after default duration', () => {
            notificationManager.showNotificationInTerminal('Test message');
            // Before timeout
            let notifications = document.querySelectorAll('.notification');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
            // After timeout (3000ms + 200ms animation)
            vitest_1.vi.advanceTimersByTime(3200);
            notifications = document.querySelectorAll('.notification');
            (0, vitest_1.expect)(notifications.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Specific Error Notifications', () => {
        (0, vitest_1.it)('should show terminal kill error', () => {
            notificationManager.showTerminalKillError('Process terminated');
            const notifications = document.querySelectorAll('.notification-error');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should show terminal close error with count', () => {
            notificationManager.showTerminalCloseError(1);
            const notifications = document.querySelectorAll('.notification-warning');
            (0, vitest_1.expect)(notifications.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should pluralize terminal count correctly', () => {
            notificationManager.showTerminalCloseError(2);
            const notification = document.querySelector('.notification');
            (0, vitest_1.expect)(notification?.textContent).toContain('terminals');
        });
        (0, vitest_1.it)('should not pluralize for single terminal', () => {
            notificationManager.showTerminalCloseError(1);
            const notification = document.querySelector('.notification');
            (0, vitest_1.expect)(notification?.textContent).toContain('terminal');
            (0, vitest_1.expect)(notification?.textContent).not.toContain('terminals');
        });
    });
    (0, vitest_1.describe)('Alt+Click Feedback', () => {
        (0, vitest_1.it)('should show Alt+Click feedback at position', () => {
            notificationManager.showAltClickFeedback(100, 200);
            const feedback = document.querySelector('.alt-click-feedback');
            (0, vitest_1.expect)(feedback).toBeDefined();
            (0, vitest_1.expect)(feedback.style.left).toBe('100px');
            (0, vitest_1.expect)(feedback.style.top).toBe('200px');
        });
        (0, vitest_1.it)('should remove Alt+Click feedback after animation', () => {
            notificationManager.showAltClickFeedback(100, 200);
            // Before animation completes
            let feedback = document.querySelector('.alt-click-feedback');
            (0, vitest_1.expect)(feedback).toBeDefined();
            // After animation (600ms)
            vitest_1.vi.advanceTimersByTime(600);
            feedback = document.querySelector('.alt-click-feedback');
            (0, vitest_1.expect)(feedback).toBeNull();
        });
    });
    (0, vitest_1.describe)('Warning Management', () => {
        (0, vitest_1.it)('should show warning notification', () => {
            notificationManager.showWarning('Warning message');
            const warnings = document.querySelectorAll('.notification-warning');
            (0, vitest_1.expect)(warnings.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('should clear all warnings', () => {
            notificationManager.showWarning('Warning 1');
            notificationManager.showWarning('Warning 2');
            notificationManager.clearWarnings();
            const warnings = document.querySelectorAll('.notification-warning');
            (0, vitest_1.expect)(warnings.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Clear All Notifications', () => {
        (0, vitest_1.it)('should clear all notifications', () => {
            notificationManager.showNotificationInTerminal('Info', 'info');
            notificationManager.showWarning('Warning');
            notificationManager.showAltClickFeedback(50, 50);
            notificationManager.clearNotifications();
            const notifications = document.querySelectorAll('.notification, .alt-click-feedback');
            (0, vitest_1.expect)(notifications.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('Loading Notifications', () => {
        (0, vitest_1.it)('should show loading notification', () => {
            const id = notificationManager.showLoading('Loading...');
            (0, vitest_1.expect)(id).toBeTypeOf('string');
            (0, vitest_1.expect)(id).toContain('loading-');
            const loading = document.querySelector('.loading-notification');
            (0, vitest_1.expect)(loading).toBeDefined();
        });
        (0, vitest_1.it)('should show loading spinner', () => {
            notificationManager.showLoading('Processing...');
            const spinner = document.querySelector('.loading-spinner');
            (0, vitest_1.expect)(spinner).toBeDefined();
        });
        (0, vitest_1.it)('should hide loading notification by id', () => {
            const id = notificationManager.showLoading('Loading...');
            (0, vitest_1.expect)(document.querySelector('.loading-notification')).toBeDefined();
            notificationManager.hideLoading(id);
            // Wait for animation
            vitest_1.vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(document.querySelector('.loading-notification')).toBeNull();
        });
        (0, vitest_1.it)('should persist loading notification until hidden', () => {
            const id = notificationManager.showLoading();
            // Wait longer than normal auto-dismiss
            vitest_1.vi.advanceTimersByTime(5000);
            // Should still exist
            const loading = document.querySelector('.loading-notification');
            (0, vitest_1.expect)(loading).toBeDefined();
            // Clean up
            notificationManager.hideLoading(id);
        });
    });
    (0, vitest_1.describe)('Toast Notifications', () => {
        (0, vitest_1.it)('should show toast notification', () => {
            notificationManager.showToast('Toast message');
            const toast = document.querySelector('.toast-notification');
            (0, vitest_1.expect)(toast).toBeDefined();
        });
        (0, vitest_1.it)('should show toast with custom type', () => {
            notificationManager.showToast('Success!', 'success');
            const toast = document.querySelector('.toast-notification.notification-success');
            (0, vitest_1.expect)(toast).toBeDefined();
        });
        (0, vitest_1.it)('should show toast with custom duration', () => {
            notificationManager.showToast('Quick toast', 'info', 1000);
            // Before dismiss
            (0, vitest_1.expect)(document.querySelector('.toast-notification')).toBeDefined();
            // After dismiss (1000ms + 200ms animation)
            vitest_1.vi.advanceTimersByTime(1200);
            (0, vitest_1.expect)(document.querySelector('.toast-notification')).toBeNull();
        });
    });
    (0, vitest_1.describe)('Notification Styles', () => {
        (0, vitest_1.it)('should setup notification styles', () => {
            notificationManager.setupNotificationStyles();
            const styles = document.querySelector('style');
            (0, vitest_1.expect)(styles).toBeDefined();
            (0, vitest_1.expect)(styles?.textContent).toContain('@keyframes');
        });
        (0, vitest_1.it)('should include all required animations', () => {
            notificationManager.setupNotificationStyles();
            const styles = document.querySelector('style');
            const content = styles?.textContent || '';
            (0, vitest_1.expect)(content).toContain('subtleSlideIn');
            (0, vitest_1.expect)(content).toContain('subtleSlideOut');
            (0, vitest_1.expect)(content).toContain('altClickFade');
            (0, vitest_1.expect)(content).toContain('spin');
        });
    });
    (0, vitest_1.describe)('Statistics', () => {
        (0, vitest_1.it)('should track notification count', () => {
            notificationManager.showNotificationInTerminal('Test 1');
            notificationManager.showNotificationInTerminal('Test 2');
            notificationManager.showNotificationInTerminal('Test 3');
            const stats = notificationManager.getStats();
            (0, vitest_1.expect)(stats.totalCreated).toBeGreaterThanOrEqual(3);
        });
        (0, vitest_1.it)('should track active notifications', () => {
            const id = notificationManager.showLoading('Loading...');
            const stats = notificationManager.getStats();
            (0, vitest_1.expect)(stats.activeCount).toBeGreaterThanOrEqual(1);
            notificationManager.hideLoading(id);
            vitest_1.vi.advanceTimersByTime(200);
            const newStats = notificationManager.getStats();
            (0, vitest_1.expect)(newStats.activeCount).toBeLessThan(stats.activeCount);
        });
    });
    (0, vitest_1.describe)('Notification Position', () => {
        (0, vitest_1.it)('should position notification at top', () => {
            notificationManager.showNotificationInTerminal('Top message');
            const notification = document.querySelector('.notification');
            (0, vitest_1.expect)(notification.style.cssText).toContain('top');
        });
    });
    (0, vitest_1.describe)('Notification Background Colors', () => {
        (0, vitest_1.it)('should use correct color for info', () => {
            notificationManager.showNotificationInTerminal('Info', 'info');
            const notification = document.querySelector('.notification-info');
            (0, vitest_1.expect)(notification.style.background).toContain('rgba');
        });
        (0, vitest_1.it)('should use correct color for success', () => {
            notificationManager.showNotificationInTerminal('Success', 'success');
            const notification = document.querySelector('.notification-success');
            (0, vitest_1.expect)(notification.style.background).toContain('rgba');
        });
        (0, vitest_1.it)('should use correct color for warning', () => {
            notificationManager.showNotificationInTerminal('Warning', 'warning');
            const notification = document.querySelector('.notification-warning');
            (0, vitest_1.expect)(notification.style.background).toContain('rgba');
        });
        (0, vitest_1.it)('should use correct color for error', () => {
            notificationManager.showNotificationInTerminal('Error', 'error');
            const notification = document.querySelector('.notification-error');
            (0, vitest_1.expect)(notification.style.background).toContain('rgba');
        });
    });
    (0, vitest_1.describe)('XSS Prevention', () => {
        (0, vitest_1.it)('should escape HTML in notification message', () => {
            const maliciousMessage = '<script>alert("xss")</script>';
            notificationManager.showNotificationInTerminal(maliciousMessage);
            const notification = document.querySelector('.notification');
            // Should display as text, not execute
            (0, vitest_1.expect)(notification?.textContent).toContain('<script>');
            (0, vitest_1.expect)(document.querySelectorAll('script').length).toBe(0);
        });
        (0, vitest_1.it)('should escape HTML in loading message', () => {
            const maliciousMessage = '<img src="x" onerror="alert(1)">';
            notificationManager.showLoading(maliciousMessage);
            const loadingSpan = document.querySelector('.loading-notification span');
            (0, vitest_1.expect)(loadingSpan?.textContent).toContain('<img');
        });
    });
});
//# sourceMappingURL=NotificationManager.test.js.map