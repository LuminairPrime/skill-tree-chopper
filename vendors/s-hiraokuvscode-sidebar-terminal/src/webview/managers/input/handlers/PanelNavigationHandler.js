"use strict";
/**
 * PanelNavigationHandler - Zellij-style panel navigation mode (Ctrl+P to toggle)
 *
 * Extracted from InputManager to reduce method size and improve testability.
 * Contains:
 * - handlePanelNavigationKey: Process keydown events for panel navigation mode
 * - setPanelNavigationEnabled: Enable/disable the panel navigation feature
 * - setPanelNavigationMode: Enter/exit panel navigation mode
 * - getOrCreatePanelNavigationIndicator: Create/reuse the mode indicator element
 * - resolveNavigationTerminalId: Resolve active terminal ID with DOM fallback
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelNavigationHandler = void 0;
/**
 * Key sets for panel navigation mode directional movement.
 * Hoisted to module scope to avoid recreating on every keypress.
 */
const PREVIOUS_NAVIGATION_KEYS = new Set(['h', 'k', 'ArrowLeft', 'ArrowUp']);
const NEXT_NAVIGATION_KEYS = new Set(['j', 'l', 'ArrowRight', 'ArrowDown']);
/**
 * Action keys for panel navigation mode (create/kill terminal).
 * Maps key to its action label for logging.
 */
const PANEL_ACTION_KEYS = new Map([
    ['r', 'create terminal'],
    ['d', 'create terminal'],
    ['x', 'kill terminal'],
]);
/**
 * PanelNavigationHandler - Manages Zellij-style panel navigation with Ctrl+P toggle
 */
class PanelNavigationHandler {
    constructor(deps) {
        this.deps = deps;
        this.panelNavigationMode = false;
        this.panelNavigationEnabled = false;
        this.panelNavigationIndicator = null;
    }
    /**
     * Check if panel navigation mode is currently active
     */
    isPanelNavigationMode() {
        return this.panelNavigationMode;
    }
    /**
     * Enable or disable the panel navigation feature entirely
     */
    setPanelNavigationEnabled(enabled) {
        this.panelNavigationEnabled = enabled;
        document.body.classList.toggle('panel-navigation-enabled', enabled);
        if (!enabled && this.panelNavigationMode) {
            this.setPanelNavigationMode(false);
        }
        this.deps.logger(`Panel navigation enabled: ${enabled}`);
    }
    /**
     * Enter or exit panel navigation mode
     */
    setPanelNavigationMode(enabled) {
        this.panelNavigationMode = enabled;
        document.body.classList.toggle('panel-navigation-mode', enabled);
        const indicator = this.getOrCreatePanelNavigationIndicator();
        indicator.style.display = enabled ? 'block' : 'none';
    }
    /**
     * Handle a keydown event for panel navigation.
     * Returns true if the event was consumed, false if it should continue propagating.
     */
    handlePanelNavigationKey(event) {
        if (!this.panelNavigationEnabled) {
            return false;
        }
        const normalizedKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        const isToggleShortcut = !event.shiftKey && !event.altKey && normalizedKey === 'p' && event.ctrlKey && !event.metaKey;
        if (isToggleShortcut) {
            this.setPanelNavigationMode(!this.panelNavigationMode);
            event.preventDefault();
            event.stopPropagation();
            this.deps.logger(`Panel navigation mode: ${this.panelNavigationMode ? 'enabled' : 'disabled'}`);
            return true;
        }
        if (!this.panelNavigationMode) {
            return false;
        }
        if (event.key === 'Escape') {
            this.setPanelNavigationMode(false);
            event.preventDefault();
            event.stopPropagation();
            this.deps.logger('Panel navigation mode: disabled (Escape)');
            return true;
        }
        let interactionType = null;
        if (PREVIOUS_NAVIGATION_KEYS.has(normalizedKey)) {
            interactionType = 'switch-previous';
        }
        else if (NEXT_NAVIGATION_KEYS.has(normalizedKey)) {
            interactionType = 'switch-next';
        }
        else if (PANEL_ACTION_KEYS.has(normalizedKey)) {
            event.preventDefault();
            event.stopPropagation();
            this.deps.logger(`Panel navigation ${PANEL_ACTION_KEYS.get(normalizedKey)}: ${event.key}`);
            if (normalizedKey === 'r' || normalizedKey === 'd') {
                this.deps.emitTerminalInteractionEvent('create-terminal', '', undefined);
            }
            else if (normalizedKey === 'x') {
                const activeTerminalId = this.resolveNavigationTerminalId();
                this.deps.emitTerminalInteractionEvent('kill-terminal', activeTerminalId || '', undefined);
            }
            return true;
        }
        else {
            // Block non-navigation keys from reaching the terminal while in panel navigation mode
            event.preventDefault();
            event.stopPropagation();
            this.deps.logger(`Ignored non-navigation key in panel navigation mode: ${event.key}`);
            return true;
        }
        event.preventDefault();
        event.stopPropagation();
        const activeTerminalId = this.resolveNavigationTerminalId();
        if (activeTerminalId) {
            this.deps.emitTerminalInteractionEvent(interactionType, activeTerminalId, undefined);
        }
        else {
            this.deps.logger('Panel navigation requested but no active terminal could be resolved');
        }
        return true;
    }
    /**
     * Resolve the active terminal ID, falling back to DOM query
     */
    resolveNavigationTerminalId() {
        const activeTerminalId = this.deps.getActiveTerminalId();
        if (activeTerminalId) {
            return activeTerminalId;
        }
        const activeContainer = document.querySelector('.terminal-container.active');
        const fallbackTerminalId = activeContainer?.getAttribute('data-terminal-id');
        return fallbackTerminalId || null;
    }
    /**
     * Get or create the panel navigation mode indicator element
     */
    getOrCreatePanelNavigationIndicator() {
        if (this.panelNavigationIndicator && document.body.contains(this.panelNavigationIndicator)) {
            return this.panelNavigationIndicator;
        }
        const indicator = document.createElement('div');
        indicator.className = 'panel-navigation-indicator';
        indicator.textContent = 'PANEL MODE (h/j/k/l, r/d:new, x:close, Esc)';
        Object.assign(indicator.style, {
            position: 'fixed',
            top: '8px',
            right: '8px',
            zIndex: '10000',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: 'var(--vscode-badge-background, #0e639c)',
            color: 'var(--vscode-badge-foreground, #ffffff)',
            pointerEvents: 'none',
            display: 'none',
        });
        document.body.appendChild(indicator);
        this.panelNavigationIndicator = indicator;
        return indicator;
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.setPanelNavigationMode(false);
        if (this.panelNavigationIndicator) {
            this.panelNavigationIndicator.remove();
            this.panelNavigationIndicator = null;
        }
    }
}
exports.PanelNavigationHandler = PanelNavigationHandler;
//# sourceMappingURL=PanelNavigationHandler.js.map