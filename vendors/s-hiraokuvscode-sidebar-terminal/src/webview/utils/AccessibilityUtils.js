"use strict";
/**
 * Accessibility Utilities
 * Provides WCAG AA compliant accessibility features including:
 * - ARIA attribute management
 * - Screen reader announcements
 * - Keyboard navigation support
 * - Focus management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorContrastValidator = exports.KeyboardNavigationHelper = exports.AriaHelper = exports.FocusManager = exports.ScreenReaderAnnouncer = void 0;
exports.initializeAccessibility = initializeAccessibility;
const logger_1 = require("../../utils/logger");
/**
 * Announces a message to screen readers
 */
class ScreenReaderAnnouncer {
    /**
     * Initialize screen reader announcement regions
     */
    static initialize() {
        if (!this.liveRegion) {
            this.liveRegion = this.createLiveRegion('assertive');
            this.politeRegion = this.createLiveRegion('polite');
            document.body.appendChild(this.liveRegion);
            document.body.appendChild(this.politeRegion);
            (0, logger_1.webview)('✅ [A11Y] Screen reader announcement regions initialized');
        }
    }
    /**
     * Create a live region element
     */
    static createLiveRegion(priority) {
        const region = document.createElement('div');
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', priority);
        region.setAttribute('aria-atomic', 'true');
        region.className = `sr-only sr-live-region-${priority}`;
        region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
        return region;
    }
    /**
     * Announce a message to screen readers
     * @param message - Message to announce
     * @param priority - 'assertive' for immediate announcement, 'polite' for when user is idle
     */
    static announce(message, priority = 'polite') {
        if (!this.liveRegion || !this.politeRegion) {
            this.initialize();
        }
        const region = priority === 'assertive' ? this.liveRegion : this.politeRegion;
        if (region) {
            // Clear first to ensure announcement even if message is the same
            region.textContent = '';
            // Use setTimeout to ensure screen readers pick up the change
            setTimeout(() => {
                region.textContent = message;
                (0, logger_1.webview)(`📢 [A11Y] Announced (${priority}): ${message}`);
            }, 100);
        }
    }
    /**
     * Clear all announcements
     */
    static clear() {
        if (this.liveRegion) {
            this.liveRegion.textContent = '';
        }
        if (this.politeRegion) {
            this.politeRegion.textContent = '';
        }
    }
}
exports.ScreenReaderAnnouncer = ScreenReaderAnnouncer;
ScreenReaderAnnouncer.liveRegion = null;
ScreenReaderAnnouncer.politeRegion = null;
/**
 * Manages focus for accessibility
 */
class FocusManager {
    /**
     * Get all focusable elements within a container
     */
    static getFocusableElements(container) {
        return Array.from(container.querySelectorAll(this.focusableSelectors));
    }
    /**
     * Trap focus within a container (for modals, dialogs)
     */
    static trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            }
            else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };
        container.addEventListener('keydown', handleKeyDown);
        // Focus first element
        firstElement?.focus();
        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }
    /**
     * Set focus to element and scroll into view
     */
    static setFocus(element, scrollIntoView = true) {
        element.focus();
        if (scrollIntoView) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
exports.FocusManager = FocusManager;
FocusManager.focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');
/**
 * ARIA attribute helpers
 */
class AriaHelper {
    /**
     * Set ARIA attributes on an element
     */
    static setAttributes(element, attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
            element.setAttribute(ariaKey, String(value));
        });
    }
    /**
     * Mark element as expanded/collapsed
     */
    static setExpanded(element, expanded) {
        element.setAttribute('aria-expanded', String(expanded));
    }
    /**
     * Mark element as selected/unselected
     */
    static setSelected(element, selected) {
        element.setAttribute('aria-selected', String(selected));
    }
    /**
     * Mark element as pressed/unpressed (for toggle buttons)
     */
    static setPressed(element, pressed) {
        element.setAttribute('aria-pressed', String(pressed));
    }
    /**
     * Mark element as disabled/enabled
     */
    static setDisabled(element, disabled) {
        element.setAttribute('aria-disabled', String(disabled));
        if (disabled) {
            element.setAttribute('tabindex', '-1');
        }
        else {
            element.removeAttribute('tabindex');
        }
    }
    /**
     * Set ARIA label
     */
    static setLabel(element, label) {
        element.setAttribute('aria-label', label);
    }
    /**
     * Set ARIA described by
     */
    static setDescribedBy(element, describerId) {
        element.setAttribute('aria-describedby', describerId);
    }
    /**
     * Set ARIA labelled by
     */
    static setLabelledBy(element, labelId) {
        element.setAttribute('aria-labelledby', labelId);
    }
    /**
     * Set ARIA live region
     */
    static setLiveRegion(element, priority) {
        element.setAttribute('aria-live', priority);
        element.setAttribute('aria-atomic', 'true');
    }
    /**
     * Mark element as current (for navigation)
     */
    static setCurrent(element, current) {
        element.setAttribute('aria-current', current);
    }
}
exports.AriaHelper = AriaHelper;
/**
 * Keyboard navigation helpers
 */
class KeyboardNavigationHelper {
    /**
     * Handle arrow key navigation in a list
     */
    static handleArrowKeys(event, items, currentIndex, onNavigate) {
        let newIndex = currentIndex;
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                newIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                newIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = items.length - 1;
                break;
            default:
                return;
        }
        onNavigate(newIndex);
    }
    /**
     * Setup keyboard shortcuts with proper ARIA announcements
     */
    static setupShortcut(element, keys, callback, description) {
        const handleKeyDown = (e) => {
            if (keys.includes(e.key)) {
                e.preventDefault();
                callback();
                ScreenReaderAnnouncer.announce(description, 'polite');
            }
        };
        element.addEventListener('keydown', handleKeyDown);
        // Return cleanup function
        return () => {
            element.removeEventListener('keydown', handleKeyDown);
        };
    }
}
exports.KeyboardNavigationHelper = KeyboardNavigationHelper;
/**
 * Color contrast validation
 */
class ColorContrastValidator {
    /**
     * Calculate relative luminance
     */
    static getLuminance(r, g, b) {
        const values = [r, g, b].map((c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        const rs = values[0];
        const gs = values[1];
        const bs = values[2];
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    /**
     * Calculate contrast ratio between two colors
     */
    static getContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        if (!rgb1 || !rgb2)
            return 0;
        const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }
    /**
     * Convert hex color to RGB
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : null;
    }
    /**
     * Check if contrast meets WCAG AA standards (4.5:1 for normal text)
     */
    static meetsWCAG_AA(foreground, background) {
        return this.getContrastRatio(foreground, background) >= 4.5;
    }
    /**
     * Check if contrast meets WCAG AAA standards (7:1 for normal text)
     */
    static meetsWCAG_AAA(foreground, background) {
        return this.getContrastRatio(foreground, background) >= 7;
    }
}
exports.ColorContrastValidator = ColorContrastValidator;
/**
 * Initialize all accessibility features
 */
function initializeAccessibility() {
    ScreenReaderAnnouncer.initialize();
    (0, logger_1.webview)('✅ [A11Y] Accessibility utilities initialized');
}
//# sourceMappingURL=AccessibilityUtils.js.map