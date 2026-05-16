"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
// Import after mocks are set up
const AccessibilityUtils_1 = require("../../../../../webview/utils/AccessibilityUtils");
(0, vitest_1.describe)('AccessibilityUtils', () => {
    (0, vitest_1.beforeEach)(() => {
        // Reset DOM
        document.body.innerHTML = '';
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('FocusManager', () => {
        (0, vitest_1.describe)('getFocusableElements', () => {
            (0, vitest_1.it)('should return focusable elements', () => {
                const container = document.createElement('div');
                container.innerHTML = `
          <button>Button 1</button>
          <a href="#">Link</a>
          <input type="text">
          <textarea></textarea>
          <select><option>Option</option></select>
          <div tabindex="0">Focusable div</div>
          <div tabindex="-1">Non-focusable div</div>
          <span>Non-focusable span</span>
        `;
                document.body.appendChild(container);
                const focusable = AccessibilityUtils_1.FocusManager.getFocusableElements(container);
                (0, vitest_1.expect)(focusable.length).toBe(6);
            });
            (0, vitest_1.it)('should exclude disabled elements', () => {
                const container = document.createElement('div');
                container.innerHTML = `
          <button>Enabled Button</button>
          <button disabled>Disabled Button</button>
          <input type="text">
          <input type="text" disabled>
        `;
                document.body.appendChild(container);
                const focusable = AccessibilityUtils_1.FocusManager.getFocusableElements(container);
                (0, vitest_1.expect)(focusable.length).toBe(2);
            });
            (0, vitest_1.it)('should return empty array for empty container', () => {
                const container = document.createElement('div');
                document.body.appendChild(container);
                const focusable = AccessibilityUtils_1.FocusManager.getFocusableElements(container);
                (0, vitest_1.expect)(focusable.length).toBe(0);
            });
        });
        (0, vitest_1.describe)('trapFocus', () => {
            (0, vitest_1.it)('should return cleanup function', () => {
                const container = document.createElement('div');
                container.innerHTML = `
          <button id="first">First</button>
          <button id="last">Last</button>
        `;
                document.body.appendChild(container);
                const cleanup = AccessibilityUtils_1.FocusManager.trapFocus(container);
                (0, vitest_1.expect)(typeof cleanup).toBe('function');
                cleanup();
            });
            (0, vitest_1.it)('should focus first element', () => {
                const container = document.createElement('div');
                container.innerHTML = `
          <button id="first">First</button>
          <button id="second">Second</button>
        `;
                document.body.appendChild(container);
                AccessibilityUtils_1.FocusManager.trapFocus(container);
                const firstButton = document.getElementById('first');
                (0, vitest_1.expect)(document.activeElement).toBe(firstButton);
            });
        });
        (0, vitest_1.describe)('setFocus', () => {
            (0, vitest_1.it)('should focus element', () => {
                const button = document.createElement('button');
                button.textContent = 'Test';
                // Mock scrollIntoView
                button.scrollIntoView = vitest_1.vi.fn();
                document.body.appendChild(button);
                AccessibilityUtils_1.FocusManager.setFocus(button);
                (0, vitest_1.expect)(document.activeElement).toBe(button);
            });
            (0, vitest_1.it)('should scroll into view when specified', () => {
                const button = document.createElement('button');
                button.textContent = 'Test';
                button.scrollIntoView = vitest_1.vi.fn();
                document.body.appendChild(button);
                AccessibilityUtils_1.FocusManager.setFocus(button, true);
                (0, vitest_1.expect)(button.scrollIntoView).toHaveBeenCalledWith({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
            (0, vitest_1.it)('should not scroll when scrollIntoView is false', () => {
                const button = document.createElement('button');
                button.textContent = 'Test';
                button.scrollIntoView = vitest_1.vi.fn();
                document.body.appendChild(button);
                AccessibilityUtils_1.FocusManager.setFocus(button, false);
                (0, vitest_1.expect)(button.scrollIntoView).not.toHaveBeenCalled();
            });
        });
    });
    (0, vitest_1.describe)('AriaHelper', () => {
        let element;
        (0, vitest_1.beforeEach)(() => {
            element = document.createElement('div');
            document.body.appendChild(element);
        });
        (0, vitest_1.describe)('setAttributes', () => {
            (0, vitest_1.it)('should set multiple ARIA attributes', () => {
                AccessibilityUtils_1.AriaHelper.setAttributes(element, {
                    label: 'Test label',
                    expanded: 'true',
                });
                (0, vitest_1.expect)(element.getAttribute('aria-label')).toBe('Test label');
                (0, vitest_1.expect)(element.getAttribute('aria-expanded')).toBe('true');
            });
            (0, vitest_1.it)('should handle attributes with aria- prefix', () => {
                AccessibilityUtils_1.AriaHelper.setAttributes(element, {
                    'aria-hidden': 'true',
                });
                (0, vitest_1.expect)(element.getAttribute('aria-hidden')).toBe('true');
            });
            (0, vitest_1.it)('should convert boolean values to strings', () => {
                AccessibilityUtils_1.AriaHelper.setAttributes(element, {
                    expanded: true,
                    hidden: false,
                });
                (0, vitest_1.expect)(element.getAttribute('aria-expanded')).toBe('true');
                (0, vitest_1.expect)(element.getAttribute('aria-hidden')).toBe('false');
            });
        });
        (0, vitest_1.describe)('setExpanded', () => {
            (0, vitest_1.it)('should set aria-expanded to true', () => {
                AccessibilityUtils_1.AriaHelper.setExpanded(element, true);
                (0, vitest_1.expect)(element.getAttribute('aria-expanded')).toBe('true');
            });
            (0, vitest_1.it)('should set aria-expanded to false', () => {
                AccessibilityUtils_1.AriaHelper.setExpanded(element, false);
                (0, vitest_1.expect)(element.getAttribute('aria-expanded')).toBe('false');
            });
        });
        (0, vitest_1.describe)('setSelected', () => {
            (0, vitest_1.it)('should set aria-selected', () => {
                AccessibilityUtils_1.AriaHelper.setSelected(element, true);
                (0, vitest_1.expect)(element.getAttribute('aria-selected')).toBe('true');
            });
        });
        (0, vitest_1.describe)('setPressed', () => {
            (0, vitest_1.it)('should set aria-pressed', () => {
                AccessibilityUtils_1.AriaHelper.setPressed(element, true);
                (0, vitest_1.expect)(element.getAttribute('aria-pressed')).toBe('true');
            });
        });
        (0, vitest_1.describe)('setDisabled', () => {
            (0, vitest_1.it)('should set aria-disabled and tabindex when disabled', () => {
                AccessibilityUtils_1.AriaHelper.setDisabled(element, true);
                (0, vitest_1.expect)(element.getAttribute('aria-disabled')).toBe('true');
                (0, vitest_1.expect)(element.getAttribute('tabindex')).toBe('-1');
            });
            (0, vitest_1.it)('should remove tabindex when enabled', () => {
                element.setAttribute('tabindex', '-1');
                AccessibilityUtils_1.AriaHelper.setDisabled(element, false);
                (0, vitest_1.expect)(element.getAttribute('aria-disabled')).toBe('false');
                (0, vitest_1.expect)(element.hasAttribute('tabindex')).toBe(false);
            });
        });
        (0, vitest_1.describe)('setLabel', () => {
            (0, vitest_1.it)('should set aria-label', () => {
                AccessibilityUtils_1.AriaHelper.setLabel(element, 'Test label');
                (0, vitest_1.expect)(element.getAttribute('aria-label')).toBe('Test label');
            });
        });
        (0, vitest_1.describe)('setDescribedBy', () => {
            (0, vitest_1.it)('should set aria-describedby', () => {
                AccessibilityUtils_1.AriaHelper.setDescribedBy(element, 'description-id');
                (0, vitest_1.expect)(element.getAttribute('aria-describedby')).toBe('description-id');
            });
        });
        (0, vitest_1.describe)('setLabelledBy', () => {
            (0, vitest_1.it)('should set aria-labelledby', () => {
                AccessibilityUtils_1.AriaHelper.setLabelledBy(element, 'label-id');
                (0, vitest_1.expect)(element.getAttribute('aria-labelledby')).toBe('label-id');
            });
        });
        (0, vitest_1.describe)('setLiveRegion', () => {
            (0, vitest_1.it)('should set aria-live and aria-atomic', () => {
                AccessibilityUtils_1.AriaHelper.setLiveRegion(element, 'polite');
                (0, vitest_1.expect)(element.getAttribute('aria-live')).toBe('polite');
                (0, vitest_1.expect)(element.getAttribute('aria-atomic')).toBe('true');
            });
            (0, vitest_1.it)('should set aria-live to off', () => {
                AccessibilityUtils_1.AriaHelper.setLiveRegion(element, 'off');
                (0, vitest_1.expect)(element.getAttribute('aria-live')).toBe('off');
            });
        });
        (0, vitest_1.describe)('setCurrent', () => {
            (0, vitest_1.it)('should set aria-current to page', () => {
                AccessibilityUtils_1.AriaHelper.setCurrent(element, 'page');
                (0, vitest_1.expect)(element.getAttribute('aria-current')).toBe('page');
            });
            (0, vitest_1.it)('should set aria-current to step', () => {
                AccessibilityUtils_1.AriaHelper.setCurrent(element, 'step');
                (0, vitest_1.expect)(element.getAttribute('aria-current')).toBe('step');
            });
        });
    });
    (0, vitest_1.describe)('KeyboardNavigationHelper', () => {
        (0, vitest_1.describe)('handleArrowKeys', () => {
            (0, vitest_1.it)('should navigate down with ArrowDown', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 0, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(1);
            });
            (0, vitest_1.it)('should navigate up with ArrowUp', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 1, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(0);
            });
            (0, vitest_1.it)('should wrap to end with ArrowUp at start', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 0, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(2);
            });
            (0, vitest_1.it)('should wrap to start with ArrowDown at end', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 2, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(0);
            });
            (0, vitest_1.it)('should navigate to start with Home', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'Home' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 1, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(0);
            });
            (0, vitest_1.it)('should navigate to end with End', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [
                    document.createElement('div'),
                    document.createElement('div'),
                    document.createElement('div'),
                ];
                const event = new KeyboardEvent('keydown', { key: 'End' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 1, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(2);
            });
            (0, vitest_1.it)('should not navigate for other keys', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [document.createElement('div'), document.createElement('div')];
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 0, onNavigate);
                (0, vitest_1.expect)(onNavigate).not.toHaveBeenCalled();
            });
            (0, vitest_1.it)('should handle ArrowRight same as ArrowDown', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [document.createElement('div'), document.createElement('div')];
                const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 0, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(1);
            });
            (0, vitest_1.it)('should handle ArrowLeft same as ArrowUp', () => {
                const onNavigate = vitest_1.vi.fn();
                const items = [document.createElement('div'), document.createElement('div')];
                const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                AccessibilityUtils_1.KeyboardNavigationHelper.handleArrowKeys(event, items, 1, onNavigate);
                (0, vitest_1.expect)(onNavigate).toHaveBeenCalledWith(0);
            });
        });
        (0, vitest_1.describe)('setupShortcut', () => {
            (0, vitest_1.it)('should return cleanup function', () => {
                const element = document.createElement('div');
                const callback = vitest_1.vi.fn();
                const cleanup = AccessibilityUtils_1.KeyboardNavigationHelper.setupShortcut(element, ['Enter'], callback, 'Test action');
                (0, vitest_1.expect)(typeof cleanup).toBe('function');
                cleanup();
            });
            (0, vitest_1.it)('should call callback on matching key', () => {
                const element = document.createElement('div');
                document.body.appendChild(element);
                const callback = vitest_1.vi.fn();
                AccessibilityUtils_1.KeyboardNavigationHelper.setupShortcut(element, ['Enter'], callback, 'Test action');
                const event = new KeyboardEvent('keydown', { key: 'Enter' });
                element.dispatchEvent(event);
                (0, vitest_1.expect)(callback).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should not call callback on non-matching key', () => {
                const element = document.createElement('div');
                document.body.appendChild(element);
                const callback = vitest_1.vi.fn();
                AccessibilityUtils_1.KeyboardNavigationHelper.setupShortcut(element, ['Enter'], callback, 'Test action');
                const event = new KeyboardEvent('keydown', { key: 'Escape' });
                element.dispatchEvent(event);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            });
        });
    });
    (0, vitest_1.describe)('ColorContrastValidator', () => {
        (0, vitest_1.describe)('getContrastRatio', () => {
            (0, vitest_1.it)('should return 21 for black and white', () => {
                const ratio = AccessibilityUtils_1.ColorContrastValidator.getContrastRatio('#000000', '#ffffff');
                (0, vitest_1.expect)(ratio).toBeCloseTo(21, 0);
            });
            (0, vitest_1.it)('should return 1 for same colors', () => {
                const ratio = AccessibilityUtils_1.ColorContrastValidator.getContrastRatio('#000000', '#000000');
                (0, vitest_1.expect)(ratio).toBeCloseTo(1, 0);
            });
            (0, vitest_1.it)('should return 0 for invalid colors', () => {
                const ratio = AccessibilityUtils_1.ColorContrastValidator.getContrastRatio('invalid', '#ffffff');
                (0, vitest_1.expect)(ratio).toBe(0);
            });
            (0, vitest_1.it)('should handle colors without hash', () => {
                const ratio = AccessibilityUtils_1.ColorContrastValidator.getContrastRatio('000000', 'ffffff');
                (0, vitest_1.expect)(ratio).toBeCloseTo(21, 0);
            });
        });
        (0, vitest_1.describe)('meetsWCAG_AA', () => {
            (0, vitest_1.it)('should return true for black on white', () => {
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AA('#000000', '#ffffff');
                (0, vitest_1.expect)(meets).toBe(true);
            });
            (0, vitest_1.it)('should return false for low contrast', () => {
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AA('#777777', '#888888');
                (0, vitest_1.expect)(meets).toBe(false);
            });
            (0, vitest_1.it)('should return true for 4.5:1 ratio', () => {
                // Gray that should meet AA
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AA('#595959', '#ffffff');
                (0, vitest_1.expect)(meets).toBe(true);
            });
        });
        (0, vitest_1.describe)('meetsWCAG_AAA', () => {
            (0, vitest_1.it)('should return true for black on white', () => {
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AAA('#000000', '#ffffff');
                (0, vitest_1.expect)(meets).toBe(true);
            });
            (0, vitest_1.it)('should return false for medium contrast', () => {
                // Gray that meets AA but not AAA
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AAA('#767676', '#ffffff');
                (0, vitest_1.expect)(meets).toBe(false);
            });
            (0, vitest_1.it)('should return true for 7:1 ratio', () => {
                const meets = AccessibilityUtils_1.ColorContrastValidator.meetsWCAG_AAA('#3d3d3d', '#ffffff');
                (0, vitest_1.expect)(meets).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=AccessibilityUtils.test.js.map