"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMUtils = void 0;
/**
 * DOM操作のユーティリティクラス
 */
/* eslint-disable @typescript-eslint/no-namespace */
var DOMUtils;
(function (DOMUtils) {
    /**
     * 要素を作成してスタイルを適用
     */
    function createElement(tagName, styles, attributes) {
        const element = document.createElement(tagName);
        if (styles) {
            Object.assign(element.style, styles);
        }
        if (attributes) {
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'textContent') {
                    element.textContent = value;
                }
                else if (key === 'innerHTML') {
                    // SECURITY: innerHTML is blocked to prevent XSS vulnerabilities
                    // Use textContent instead, or build DOM structure with createElement/appendChild
                    console.warn('[SECURITY] DOMUtils.createElement: innerHTML attribute is not supported. Use textContent instead.');
                    element.textContent = value;
                }
                else if (key === 'className') {
                    element.className = value;
                }
                else {
                    element.setAttribute(key, value);
                }
            });
        }
        return element;
    }
    DOMUtils.createElement = createElement;
    /**
     * CSS文字列から要素にスタイルを適用
     */
    function applyStyleString(element, cssText) {
        element.style.cssText = cssText;
    }
    DOMUtils.applyStyleString = applyStyleString;
    /**
     * 要素を安全に削除
     */
    function safeRemove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    DOMUtils.safeRemove = safeRemove;
    /**
     * 要素が存在するかチェック
     */
    function exists(selector) {
        return document.querySelector(selector) !== null;
    }
    DOMUtils.exists = exists;
    /**
     * 要素を取得（存在しない場合はnull）
     */
    function getElement(selector) {
        return document.querySelector(selector);
    }
    DOMUtils.getElement = getElement;
    /**
     * 要素を取得（存在しない場合は作成）
     */
    function getOrCreateElement(selector, tagName, parent) {
        let element = document.querySelector(selector);
        if (!element) {
            element = document.createElement(tagName);
            element.id = selector.replace('#', '');
            if (parent) {
                parent.appendChild(element);
            }
        }
        return element;
    }
    DOMUtils.getOrCreateElement = getOrCreateElement;
    /**
     * イベントリスナーを安全に追加
     */
    function addEventListenerSafe(element, type, listener, options) {
        if (element) {
            element.addEventListener(type, listener, options);
        }
    }
    DOMUtils.addEventListenerSafe = addEventListenerSafe;
    /**
     * 複数の子要素を一度に追加
     */
    function appendChildren(parent, ...children) {
        children.forEach((child) => parent.appendChild(child));
    }
    DOMUtils.appendChildren = appendChildren;
    /**
     * 要素を最初の子として挿入
     */
    function prependChild(parent, child) {
        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
        }
        else {
            parent.appendChild(child);
        }
    }
    DOMUtils.prependChild = prependChild;
    /**
     * CSS変数を設定
     */
    function setCSSVariable(name, value) {
        document.documentElement.style.setProperty(`--${name}`, value);
    }
    DOMUtils.setCSSVariable = setCSSVariable;
    /**
     * CSS変数を取得
     */
    function getCSSVariable(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    }
    DOMUtils.getCSSVariable = getCSSVariable;
    /**
     * Clear width/height/maxWidth/minWidth inline styles from an element.
     */
    function clearDimensionStyles(el) {
        el.style.width = '';
        el.style.height = '';
        el.style.maxWidth = '';
        el.style.minWidth = '';
    }
    /**
     * Selector cache: avoids repeated querySelector calls on the same container.
     * Uses WeakMap so entries are automatically GC'd when the container is removed from DOM.
     */
    const selectorCache = new WeakMap();
    /**
     * Query a selector within a container, using a WeakMap cache to avoid repeated DOM queries.
     * Cache is per-container so it's automatically cleaned up when the container is GC'd.
     */
    function cachedQuery(container, selector) {
        let cache = selectorCache.get(container);
        if (!cache) {
            cache = new Map();
            selectorCache.set(container, cache);
        }
        if (cache.has(selector)) {
            const cached = cache.get(selector);
            // Validate the cached element is still in the container (prevents stale references)
            if (cached !== null && container.contains(cached)) {
                return cached;
            }
            // Null or stale entry: re-query to handle dynamic DOM changes.
        }
        const result = container.querySelector(selector);
        cache.set(selector, result);
        return result;
    }
    /**
     * Invalidate the selector cache for a container.
     * Call this when the container's DOM structure changes (e.g., terminal removal).
     */
    function invalidateSelectorCache(container) {
        selectorCache.delete(container);
    }
    DOMUtils.invalidateSelectorCache = invalidateSelectorCache;
    /**
     * Reset xterm.js internal element inline styles (optimized).
     *
     * Consolidates all DOM queries into cached single-pass operations and
     * reduces forced browser reflows from 2 to 1.
     *
     * xterm.js sets fixed pixel widths on internal elements which prevents
     * the terminal from expanding beyond its initial size. This function
     * clears those inline styles to allow CSS flex/100% to work properly.
     *
     * @param container - The terminal container element
     * @param forceReflow - Whether to force a browser layout reflow (default: true)
     * @returns true if styles were reset, false if container is null
     */
    function resetXtermInlineStyles(container, forceReflow = true) {
        if (!container) {
            return false;
        }
        // Reset container itself
        container.style.width = '';
        container.style.maxWidth = '';
        container.style.minWidth = '';
        // Batch all child element queries using cache
        const xtermEl = cachedQuery(container, '.xterm');
        const viewport = cachedQuery(container, '.xterm-viewport');
        const screen = cachedQuery(container, '.xterm-screen');
        const terminalContent = cachedQuery(container, '.terminal-content');
        const xtermRows = cachedQuery(container, '.xterm-rows');
        const xtermHelpers = cachedQuery(container, '.xterm-helpers');
        // Reset dimension styles on all xterm internal elements in one pass
        if (terminalContent) {
            clearDimensionStyles(terminalContent);
        }
        if (xtermEl) {
            clearDimensionStyles(xtermEl);
            // Copy background color from viewport to eliminate visible gap
            if (viewport && viewport.style.backgroundColor) {
                xtermEl.style.backgroundColor = viewport.style.backgroundColor;
            }
        }
        if (viewport) {
            clearDimensionStyles(viewport);
        }
        if (screen) {
            clearDimensionStyles(screen);
        }
        if (xtermRows) {
            xtermRows.style.width = '';
        }
        if (xtermHelpers) {
            xtermHelpers.style.width = '';
        }
        // Reset canvas wrapper elements only — DO NOT touch canvas elements directly.
        // xterm.js requires precise pixel dimensions on its canvas layers (text, cursor,
        // selection, link) for correct rendering and hit-testing. Setting width to 100%
        // desynchronizes the selection overlay and causes text to become unselectable.
        // xterm.js manages canvas sizing internally via FitAddon.fit().
        // Reset parent/wrapper elements (outside container — not cached in WeakMap)
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (terminalsWrapper) {
            terminalsWrapper.style.width = '';
            terminalsWrapper.style.maxWidth = '';
        }
        const splitWrapper = container.closest('.terminal-split-wrapper');
        if (splitWrapper) {
            clearDimensionStyles(splitWrapper);
        }
        const terminalArea = container.closest('[data-terminal-area-id]');
        if (terminalArea) {
            clearDimensionStyles(terminalArea);
        }
        // Single forced reflow (reduced from 2 reads to 1)
        if (forceReflow) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            container.offsetHeight;
        }
        return true;
    }
    DOMUtils.resetXtermInlineStyles = resetXtermInlineStyles;
    /**
     * Schedule an xterm style reset on the next animation frame.
     * Coalesces multiple calls for the same container within a single frame.
     *
     * @param container - The terminal container element
     * @returns true if scheduled, false if container is null
     */
    const pendingResets = new WeakSet();
    function scheduleXtermStyleReset(container) {
        if (!container) {
            return false;
        }
        if (pendingResets.has(container)) {
            return true; // Already scheduled for this frame
        }
        pendingResets.add(container);
        requestAnimationFrame(() => {
            pendingResets.delete(container);
            resetXtermInlineStyles(container, true);
        });
        return true;
    }
    DOMUtils.scheduleXtermStyleReset = scheduleXtermStyleReset;
    /**
     * Clear split-related inline height styles from a container.
     * Used when transitioning between display modes (split -> fullscreen/normal).
     *
     * @param container - The terminal container element
     */
    function clearContainerHeightStyles(container) {
        container.style.removeProperty('height');
        container.style.removeProperty('flex-basis');
        container.style.removeProperty('flex');
        container.style.removeProperty('max-height');
    }
    DOMUtils.clearContainerHeightStyles = clearContainerHeightStyles;
    /**
     * Force browser reflow by reading offsetHeight.
     * Call this after CSS changes to ensure layout is recalculated before reading dimensions.
     *
     * @param element - Element to read offsetHeight from (defaults to document.body)
     */
    function forceReflow(element) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (element ?? document.body).offsetHeight;
    }
    DOMUtils.forceReflow = forceReflow;
})(DOMUtils || (exports.DOMUtils = DOMUtils = {}));
//# sourceMappingURL=DOMUtils.js.map