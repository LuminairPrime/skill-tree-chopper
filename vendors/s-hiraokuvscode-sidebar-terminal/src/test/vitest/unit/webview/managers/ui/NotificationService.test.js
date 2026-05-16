"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const NotificationService_1 = require("../../../../../../webview/managers/ui/NotificationService");
const DOMUtils_1 = require("../../../../../../webview/utils/DOMUtils");
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger');
vitest_1.vi.mock('../../../../../../webview/utils/DOMUtils');
(0, vitest_1.describe)('NotificationService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new NotificationService_1.NotificationService();
        // Mock DOMUtils.createElement
        vitest_1.vi.mocked(DOMUtils_1.DOMUtils.createElement).mockImplementation((tag, styles, props) => {
            const el = document.createElement(tag);
            if (styles)
                Object.assign(el.style, styles);
            if (props)
                Object.assign(el, props);
            return el;
        });
    });
    (0, vitest_1.afterEach)(() => {
        document.head.innerHTML = '';
    });
    (0, vitest_1.describe)('createNotificationElement', () => {
        (0, vitest_1.it)('should create notification with correct structure', () => {
            const config = {
                type: 'info',
                title: 'Test Title',
                message: 'Test Message',
            };
            const element = service.createNotificationElement(config);
            (0, vitest_1.expect)(element.classList.contains('terminal-notification')).toBe(true);
            (0, vitest_1.expect)(element.textContent).toContain('Test Title');
            (0, vitest_1.expect)(element.textContent).toContain('Test Message');
            (0, vitest_1.expect)(element.textContent).toContain('ℹ️'); // Default info icon
        });
        (0, vitest_1.it)('should use custom icon if provided', () => {
            const config = {
                type: 'success',
                title: 'Title',
                message: 'Message',
                icon: '🚀',
            };
            const element = service.createNotificationElement(config);
            (0, vitest_1.expect)(element.textContent).toContain('🚀');
        });
        (0, vitest_1.it)('should apply correct colors for error', () => {
            const config = {
                type: 'error',
                title: 'Error',
                message: 'Message',
            };
            service.createNotificationElement(config);
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.createElement).toHaveBeenCalledWith('div', vitest_1.expect.objectContaining({
                border: vitest_1.expect.stringContaining('var(--vscode-notificationError-border'),
            }), vitest_1.expect.any(Object));
        });
    });
    (0, vitest_1.describe)('ensureAnimationsLoaded', () => {
        (0, vitest_1.it)('should inject style tag once', () => {
            service.ensureAnimationsLoaded();
            const style = document.getElementById('ui-manager-animations');
            (0, vitest_1.expect)(style).not.toBeNull();
            (0, vitest_1.expect)(style?.textContent).toContain('@keyframes slideInFromRight');
            // Call again, should not duplicate (though difficult to test duplication without spying on appendChild, checking count is enough)
            service.ensureAnimationsLoaded();
            (0, vitest_1.expect)(document.querySelectorAll('#ui-manager-animations').length).toBe(1);
        });
    });
    (0, vitest_1.describe)('helper methods', () => {
        (0, vitest_1.it)('getNotificationColors returns correct values', () => {
            const errorColors = service.getNotificationColors('error');
            (0, vitest_1.expect)(errorColors.border).toContain('Error');
            const warningColors = service.getNotificationColors('warning');
            (0, vitest_1.expect)(warningColors.border).toContain('Warning');
            const successColors = service.getNotificationColors('success');
            (0, vitest_1.expect)(successColors.border).toContain('success');
            const infoColors = service.getNotificationColors('info');
            (0, vitest_1.expect)(infoColors.border).toContain('info');
        });
        (0, vitest_1.it)('getDefaultIcon returns correct icons', () => {
            (0, vitest_1.expect)(service.getDefaultIcon('error')).toBe('❌');
            (0, vitest_1.expect)(service.getDefaultIcon('warning')).toBe('⚠️');
            (0, vitest_1.expect)(service.getDefaultIcon('success')).toBe('✅');
            (0, vitest_1.expect)(service.getDefaultIcon('info')).toBe('ℹ️');
        });
    });
});
//# sourceMappingURL=NotificationService.test.js.map