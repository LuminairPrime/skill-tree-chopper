"use strict";
/**
 * HeaderManager Unit Tests
 *
 * Tests for WebView header management including:
 * - Header creation and removal
 * - Configuration updates
 * - Terminal count badge
 * - Icon interactions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const HeaderManager_1 = require("../../../../../webview/managers/HeaderManager");
// Mock dependencies
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../../../../webview/utils/DOMUtils', () => ({
    DOMUtils: {
        createElement: vitest_1.vi.fn((tag, styles, attrs) => {
            const el = {
                tagName: tag.toUpperCase(),
                style: { ...styles },
                id: attrs?.id || '',
                className: attrs?.className || '',
                textContent: attrs?.textContent || '',
                title: attrs?.title || '',
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
                remove: vitest_1.vi.fn(),
                firstChild: null,
                childElementCount: 0,
                children: [],
            };
            return el;
        }),
        getElement: vitest_1.vi.fn(),
        safeRemove: vitest_1.vi.fn(),
        appendChildren: vitest_1.vi.fn(),
        addEventListenerSafe: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/utils/ErrorHandler', () => ({
    ErrorHandler: {
        handleOperationError: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../../../../../webview/constants', () => ({
    SAMPLE_ICONS: [
        { icon: '➕', title: 'New Terminal' },
        { icon: '➖', title: 'Close Terminal' },
    ],
    UI_CONSTANTS: {
        SIZES: {
            SAMPLE_ICON_SIZE: 14,
            TITLE_FONT_SIZE: 12,
            HEADER_HEIGHT: 32,
            TERMINAL_ICON_SIZE: 16,
            ICON_BUTTON_SIZE: 24,
        },
        SPACING: {
            HEADER_PADDING: 8,
            TITLE_GAP: 6,
            ICON_GAP: 4,
            ICON_PADDING: 4,
        },
        OPACITY: {
            SAMPLE_ICON: 0.4,
        },
    },
}));
(0, vitest_1.describe)('HeaderManager', () => {
    let manager;
    let mockCoordinator;
    let DOMUtils;
    (0, vitest_1.beforeEach)(async () => {
        const domUtilsModule = await Promise.resolve().then(() => require('../../../../../webview/utils/DOMUtils'));
        DOMUtils = domUtilsModule.DOMUtils;
        // Reset mocks
        vitest_1.vi.mocked(DOMUtils.getElement).mockReturnValue(null);
        mockCoordinator = {
            getManager: vitest_1.vi.fn(),
            postMessage: vitest_1.vi.fn(),
        };
        manager = new HeaderManager_1.HeaderManager();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('setCoordinator', () => {
        (0, vitest_1.it)('should store coordinator reference', () => {
            manager.setCoordinator(mockCoordinator);
            // Coordinator is stored internally (can be verified through behavior tests)
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('updateConfig', () => {
        (0, vitest_1.it)('should update configuration', () => {
            const newConfig = {
                showHeader: false,
                title: 'Custom Terminal',
            };
            manager.updateConfig(newConfig);
            // Config is applied when creating header
            // Since header doesn't exist yet, no recreation occurs
            (0, vitest_1.expect)(() => manager.updateConfig(newConfig)).not.toThrow();
        });
        (0, vitest_1.it)('should merge partial config with existing', () => {
            manager.updateConfig({ title: 'First Update' });
            manager.updateConfig({ showIcons: false });
            // Both updates should be applied without error
            (0, vitest_1.expect)(() => manager.createWebViewHeader()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('createWebViewHeader', () => {
        (0, vitest_1.it)('should create header when showHeader is true', () => {
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            (0, vitest_1.expect)(DOMUtils.createElement).toHaveBeenCalledWith('div', vitest_1.expect.any(Object), vitest_1.expect.objectContaining({ id: 'webview-header' }));
        });
        (0, vitest_1.it)('should not create header when showHeader is false', () => {
            manager.updateConfig({ showHeader: false });
            manager.createWebViewHeader();
            (0, vitest_1.expect)(DOMUtils.appendChildren).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should remove existing header before creating new one', () => {
            // Create header first
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            manager.createWebViewHeader();
            // safeRemove should be called on second creation
            (0, vitest_1.expect)(DOMUtils.safeRemove).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should insert header at beginning of container', () => {
            const existingChild = { tagName: 'DIV' };
            const mockContainer = {
                firstChild: existingChild,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            (0, vitest_1.expect)(mockContainer.insertBefore).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('updateTerminalCountBadge', () => {
        (0, vitest_1.it)('should update badge text with terminal count', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            const mockTabs = {
                childElementCount: 3,
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                if (selector === '#terminal-tabs')
                    return mockTabs;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.textContent).toBe('3');
        });
        (0, vitest_1.it)('should set error color when count is 0', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            const mockTabs = {
                childElementCount: 0,
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                if (selector === '#terminal-tabs')
                    return mockTabs;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.style.background).toContain('errorBackground');
        });
        (0, vitest_1.it)('should set warning color when count >= 5', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            const mockTabs = {
                childElementCount: 5,
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                if (selector === '#terminal-tabs')
                    return mockTabs;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.style.background).toContain('notificationWarning');
        });
        (0, vitest_1.it)('should set orange color when count >= 3 but < 5', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            const mockTabs = {
                childElementCount: 4,
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                if (selector === '#terminal-tabs')
                    return mockTabs;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.style.background).toContain('charts-orange');
        });
        (0, vitest_1.it)('should set default color when count is 1 or 2', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            const mockTabs = {
                childElementCount: 2,
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                if (selector === '#terminal-tabs')
                    return mockTabs;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.style.background).toContain('badge-background');
        });
        (0, vitest_1.it)('should handle missing badge element gracefully', () => {
            vitest_1.vi.mocked(DOMUtils.getElement).mockReturnValue(null);
            (0, vitest_1.expect)(() => manager.updateTerminalCountBadge()).not.toThrow();
        });
        (0, vitest_1.it)('should handle missing tabs element gracefully', () => {
            const mockBadge = {
                textContent: '',
                style: { background: '' },
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal-count-badge')
                    return mockBadge;
                return null;
            });
            manager.updateTerminalCountBadge();
            (0, vitest_1.expect)(mockBadge.textContent).toBe('0');
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should remove header element', () => {
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            manager.dispose();
            (0, vitest_1.expect)(DOMUtils.safeRemove).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear coordinator reference', () => {
            manager.setCoordinator(mockCoordinator);
            manager.dispose();
            // After dispose, coordinator should be null
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
        });
        (0, vitest_1.it)('should handle errors gracefully', async () => {
            const { ErrorHandler } = await Promise.resolve().then(() => require('../../../../../webview/utils/ErrorHandler'));
            vitest_1.vi.mocked(DOMUtils.safeRemove).mockImplementation(() => {
                throw new Error('Remove failed');
            });
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            (0, vitest_1.expect)(() => manager.dispose()).not.toThrow();
            (0, vitest_1.expect)(ErrorHandler.handleOperationError).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Configuration', () => {
        (0, vitest_1.it)('should use custom title from config', () => {
            manager.updateConfig({ title: 'Custom Title' });
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            // Verify createElement was called with title text
            (0, vitest_1.expect)(DOMUtils.createElement).toHaveBeenCalledWith('span', vitest_1.expect.any(Object), vitest_1.expect.objectContaining({ textContent: 'Custom Title' }));
        });
        (0, vitest_1.it)('should hide icons when showIcons is false', () => {
            manager.updateConfig({ showIcons: false });
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            // Sample icons should not be created
            // Check that no icon elements were created with sample-icon class
            const createElementCalls = vitest_1.vi.mocked(DOMUtils.createElement).mock.calls;
            const sampleIconCalls = createElementCalls.filter((call) => call[2]?.className === 'sample-icon');
            (0, vitest_1.expect)(sampleIconCalls.length).toBe(0);
        });
        (0, vitest_1.it)('should use custom font size from config', () => {
            manager.updateConfig({ fontSize: 16 });
            const mockContainer = {
                firstChild: null,
                appendChild: vitest_1.vi.fn(),
                insertBefore: vitest_1.vi.fn(),
            };
            vitest_1.vi.mocked(DOMUtils.getElement).mockImplementation((selector) => {
                if (selector === '#terminal')
                    return mockContainer;
                return null;
            });
            manager.createWebViewHeader();
            (0, vitest_1.expect)(DOMUtils.createElement).toHaveBeenCalledWith('span', vitest_1.expect.objectContaining({ fontSize: '16px' }), vitest_1.expect.any(Object));
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle null container gracefully', () => {
            vitest_1.vi.mocked(DOMUtils.getElement).mockReturnValue(null);
            (0, vitest_1.expect)(() => manager.createWebViewHeader()).not.toThrow();
        });
        (0, vitest_1.it)('should handle multiple rapid config updates', () => {
            (0, vitest_1.expect)(() => {
                manager.updateConfig({ title: 'Title 1' });
                manager.updateConfig({ title: 'Title 2' });
                manager.updateConfig({ title: 'Title 3' });
                manager.updateConfig({ showIcons: false });
                manager.updateConfig({ showHeader: true });
            }).not.toThrow();
        });
    });
});
//# sourceMappingURL=HeaderManager.test.js.map