"use strict";
/**
 * DOMUtils Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DOMUtils_1 = require("../../../../../webview/utils/DOMUtils");
(0, vitest_1.describe)('DOMUtils', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('createElement', () => {
        (0, vitest_1.it)('should create element with tag name', () => {
            const el = DOMUtils_1.DOMUtils.createElement('div');
            (0, vitest_1.expect)(el.tagName).toBe('DIV');
        });
        (0, vitest_1.it)('should apply styles', () => {
            const el = DOMUtils_1.DOMUtils.createElement('div', { color: 'red', display: 'flex' });
            (0, vitest_1.expect)(el.style.color).toBe('red');
            (0, vitest_1.expect)(el.style.display).toBe('flex');
        });
        (0, vitest_1.it)('should apply attributes', () => {
            const el = DOMUtils_1.DOMUtils.createElement('div', {}, { id: 'test-id', 'data-value': '123' });
            (0, vitest_1.expect)(el.id).toBe('test-id');
            (0, vitest_1.expect)(el.getAttribute('data-value')).toBe('123');
        });
        (0, vitest_1.it)('should set textContent', () => {
            const el = DOMUtils_1.DOMUtils.createElement('div', {}, { textContent: 'hello world' });
            (0, vitest_1.expect)(el.textContent).toBe('hello world');
        });
        (0, vitest_1.it)('should block innerHTML for security', () => {
            const el = DOMUtils_1.DOMUtils.createElement('div', {}, { innerHTML: '<span>unsafe</span>' });
            (0, vitest_1.expect)(el.innerHTML).not.toContain('<span>');
            (0, vitest_1.expect)(el.textContent).toBe('<span>unsafe</span>');
        });
    });
    (0, vitest_1.describe)('Style Manipulation', () => {
        (0, vitest_1.it)('should apply style string', () => {
            const el = document.createElement('div');
            DOMUtils_1.DOMUtils.applyStyleString(el, 'color: blue; margin: 10px;');
            (0, vitest_1.expect)(el.style.color).toBe('blue');
            (0, vitest_1.expect)(el.style.margin).toBe('10px');
        });
        (0, vitest_1.it)('should set and get CSS variables', () => {
            DOMUtils_1.DOMUtils.setCSSVariable('test-var', '100px');
            // getCSSVariable uses getComputedStyle which might be limited in JSDOM/HappyDOM
            // but we can check the inline style on documentElement
            (0, vitest_1.expect)(document.documentElement.style.getPropertyValue('--test-var')).toBe('100px');
        });
    });
    (0, vitest_1.describe)('Element Retrieval and Life-cycle', () => {
        (0, vitest_1.it)('should safely remove element', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            (0, vitest_1.expect)(document.body.contains(el)).toBe(true);
            DOMUtils_1.DOMUtils.safeRemove(el);
            (0, vitest_1.expect)(document.body.contains(el)).toBe(false);
        });
        (0, vitest_1.it)('should check if element exists', () => {
            document.body.innerHTML = '<div class="test"></div>';
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.exists('.test')).toBe(true);
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.exists('.missing')).toBe(false);
        });
        (0, vitest_1.it)('should get or create element', () => {
            const el1 = DOMUtils_1.DOMUtils.getOrCreateElement('#new-el', 'div', document.body);
            (0, vitest_1.expect)(el1.id).toBe('new-el');
            (0, vitest_1.expect)(document.body.contains(el1)).toBe(true);
            const el2 = DOMUtils_1.DOMUtils.getOrCreateElement('#new-el', 'div');
            (0, vitest_1.expect)(el1).toBe(el2);
        });
    });
    (0, vitest_1.describe)('Child Management', () => {
        (0, vitest_1.it)('should append multiple children', () => {
            const parent = document.createElement('div');
            const c1 = document.createElement('span');
            const c2 = document.createElement('span');
            DOMUtils_1.DOMUtils.appendChildren(parent, c1, c2);
            (0, vitest_1.expect)(parent.children.length).toBe(2);
            (0, vitest_1.expect)(parent.firstChild).toBe(c1);
        });
        (0, vitest_1.it)('should prepend child', () => {
            const parent = document.createElement('div');
            const c1 = document.createElement('span');
            const c2 = document.createElement('span');
            parent.appendChild(c1);
            DOMUtils_1.DOMUtils.prependChild(parent, c2);
            (0, vitest_1.expect)(parent.firstChild).toBe(c2);
        });
    });
    (0, vitest_1.describe)('xterm Style Reset', () => {
        (0, vitest_1.it)('should reset inline styles on xterm elements', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            container.style.width = '500px';
            const xterm = document.createElement('div');
            xterm.className = 'xterm';
            xterm.style.height = '300px';
            container.appendChild(xterm);
            const canvas = document.createElement('canvas');
            const screen = document.createElement('div');
            screen.className = 'xterm-screen';
            screen.appendChild(canvas);
            container.appendChild(screen);
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(container.style.width).toBe('');
            (0, vitest_1.expect)(xterm.style.height).toBe('');
            // Canvas elements should NOT be reset — xterm.js requires precise pixel dimensions
            // for its canvas layers (text, cursor, selection). See DOMUtils.resetXtermInlineStyles.
            (0, vitest_1.expect)(canvas.style.width).toBe('');
        });
        (0, vitest_1.it)('should return false for null container', () => {
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.resetXtermInlineStyles(null, false)).toBe(false);
        });
        (0, vitest_1.it)('should clear all dimension styles on xterm internal elements', () => {
            const container = document.createElement('div');
            const viewport = document.createElement('div');
            viewport.className = 'xterm-viewport';
            viewport.style.width = '800px';
            viewport.style.height = '600px';
            viewport.style.maxWidth = '1000px';
            viewport.style.minWidth = '100px';
            container.appendChild(viewport);
            const helpers = document.createElement('div');
            helpers.className = 'xterm-helpers';
            helpers.style.width = '800px';
            container.appendChild(helpers);
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(viewport.style.width).toBe('');
            (0, vitest_1.expect)(viewport.style.height).toBe('');
            (0, vitest_1.expect)(viewport.style.maxWidth).toBe('');
            (0, vitest_1.expect)(viewport.style.minWidth).toBe('');
            (0, vitest_1.expect)(helpers.style.width).toBe('');
        });
        (0, vitest_1.it)('should use selector cache for repeated calls', () => {
            const container = document.createElement('div');
            const xterm = document.createElement('div');
            xterm.className = 'xterm';
            container.appendChild(xterm);
            // First call populates cache
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            // Set styles again
            xterm.style.width = '500px';
            // Second call should still find element via cache
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(xterm.style.width).toBe('');
        });
        (0, vitest_1.it)('should invalidate selector cache', () => {
            const container = document.createElement('div');
            const xterm = document.createElement('div');
            xterm.className = 'xterm';
            container.appendChild(xterm);
            // Populate cache
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            // Remove old element, add new one
            container.removeChild(xterm);
            const newXterm = document.createElement('div');
            newXterm.className = 'xterm';
            newXterm.style.width = '999px';
            container.appendChild(newXterm);
            // Invalidate and re-query
            DOMUtils_1.DOMUtils.invalidateSelectorCache(container);
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(newXterm.style.width).toBe('');
        });
        (0, vitest_1.it)('should re-query when an element appears after a cached null result', () => {
            const container = document.createElement('div');
            // First call caches misses for xterm selectors
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            const xterm = document.createElement('div');
            xterm.className = 'xterm';
            xterm.style.width = '500px';
            container.appendChild(xterm);
            // Must re-query instead of returning stale cached null
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(xterm.style.width).toBe('');
        });
        (0, vitest_1.it)('should copy background color from viewport to xterm element', () => {
            const container = document.createElement('div');
            const xterm = document.createElement('div');
            xterm.className = 'xterm';
            container.appendChild(xterm);
            const viewport = document.createElement('div');
            viewport.className = 'xterm-viewport';
            viewport.style.backgroundColor = 'rgb(30, 30, 30)';
            container.appendChild(viewport);
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container, false);
            (0, vitest_1.expect)(xterm.style.backgroundColor).toBe('rgb(30, 30, 30)');
        });
    });
    (0, vitest_1.describe)('scheduleXtermStyleReset', () => {
        (0, vitest_1.it)('should return false for null container', () => {
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.scheduleXtermStyleReset(null)).toBe(false);
        });
        (0, vitest_1.it)('should return true for valid container', () => {
            const container = document.createElement('div');
            (0, vitest_1.expect)(DOMUtils_1.DOMUtils.scheduleXtermStyleReset(container)).toBe(true);
        });
    });
});
//# sourceMappingURL=DOMUtils.test.js.map