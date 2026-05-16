"use strict";
/**
 * Mouse Tracking Service
 *
 * Detects when terminal applications (zellij, vim, tmux, etc.) enable mouse tracking
 * and toggles native scroll behavior accordingly.
 *
 * Problem: When overflow:auto is set on the viewport, browser consumes wheel events
 * before xterm.js can convert them to escape sequences for mouse-tracking apps.
 *
 * Solution: Register CSI handlers to detect DECSET/DECRST for mouse modes and
 * toggle overflow between 'hidden' (mouse tracking on) and 'auto' (mouse tracking off).
 *
 * @see https://invisible-island.net/xterm/ctlseqs/ctlseqs.html - Mouse Tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MouseTrackingService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
/**
 * Mouse tracking modes that terminal applications use
 * - 1000: X10 mouse reporting (basic clicks)
 * - 1002: Button-event tracking (click + drag)
 * - 1003: Any-event tracking (all mouse movement)
 * - 1006: SGR extended mouse mode (modern format)
 */
const MOUSE_TRACKING_MODES = [1000, 1002, 1003, 1006];
/**
 * Service for managing mouse tracking detection and scroll behavior
 */
class MouseTrackingService {
    constructor() {
        /** Terminal ID -> tracking state */
        this.terminals = new Map();
    }
    /**
     * Setup mouse tracking detection for a terminal
     *
     * @param terminal - xterm.js Terminal instance
     * @param terminalId - Terminal identifier for logging
     * @param viewport - The .xterm-viewport element
     * @param sendInput - Callback to send input data to the Extension/PTY
     */
    setup(terminal, terminalId, viewport, sendInput) {
        if (this.terminals.has(terminalId)) {
            ManagerLogger_1.terminalLogger.warn(`[MouseTracking] Already setup for terminal: ${terminalId}`);
            return;
        }
        // Find the screen element for wheel events (viewport's sibling or child)
        const terminalElement = terminal.element;
        const screenElement = terminalElement?.querySelector('.xterm-screen');
        const state = {
            activeModes: new Set(),
            handlers: [],
            viewport,
            sendInput,
        };
        // Register DECSET handler (CSI ? Pm h) - mouse tracking enabled
        // Must specify prefix: '?' for private mode sequences (DEC private modes)
        const decsetHandler = terminal.parser.registerCsiHandler({ prefix: '?', final: 'h' }, (params) => {
            for (let i = 0; i < params.length; i++) {
                const rawParam = params[i];
                const mode = typeof rawParam === 'number'
                    ? rawParam
                    : Array.isArray(rawParam)
                        ? (rawParam[0] ?? 0)
                        : rawParam;
                if (mode !== undefined &&
                    MOUSE_TRACKING_MODES.includes(mode)) {
                    const wasEmpty = state.activeModes.size === 0;
                    state.activeModes.add(mode);
                    if (wasEmpty) {
                        // First mouse mode enabled - disable native scrolling
                        viewport.style.overflow = 'hidden';
                        // Attach wheel handler to screen element (where wheel events go)
                        const wheelTarget = screenElement || terminalElement || viewport;
                        state.wheelTarget = wheelTarget;
                        this.attachWheelHandler(terminal, terminalId, wheelTarget, state);
                        ManagerLogger_1.terminalLogger.info(`[MouseTracking] Mode ${mode} enabled for ${terminalId}, native scroll disabled`);
                    }
                    else {
                        ManagerLogger_1.terminalLogger.debug(`[MouseTracking] Mode ${mode} added for ${terminalId} (${state.activeModes.size} active)`);
                    }
                }
            }
            return false; // Don't consume - let xterm.js process it
        });
        state.handlers.push(decsetHandler);
        // Register DECRST handler (CSI ? Pm l) - mouse tracking disabled
        // Must specify prefix: '?' for private mode sequences (DEC private modes)
        const decrstHandler = terminal.parser.registerCsiHandler({ prefix: '?', final: 'l' }, (params) => {
            for (const param of params) {
                const mode = typeof param === 'number' ? param : (param[0] ?? 0);
                if (MOUSE_TRACKING_MODES.includes(mode)) {
                    state.activeModes.delete(mode);
                    if (state.activeModes.size === 0) {
                        // All mouse modes disabled - restore native scrolling
                        viewport.style.overflow = 'auto';
                        // Remove wheel handler
                        if (state.wheelHandler && state.wheelTarget) {
                            state.wheelTarget.removeEventListener('wheel', state.wheelHandler, {
                                capture: true,
                            });
                            state.wheelHandler = undefined;
                            state.wheelTarget = undefined;
                        }
                        ManagerLogger_1.terminalLogger.info(`[MouseTracking] Mode ${mode} disabled for ${terminalId}, native scroll restored`);
                    }
                    else {
                        ManagerLogger_1.terminalLogger.debug(`[MouseTracking] Mode ${mode} removed for ${terminalId} (${state.activeModes.size} remaining)`);
                    }
                }
            }
            return false; // Don't consume - let xterm.js process it
        });
        state.handlers.push(decrstHandler);
        this.terminals.set(terminalId, state);
        ManagerLogger_1.terminalLogger.info(`[MouseTracking] Setup complete for terminal: ${terminalId}`);
    }
    /**
     * Attach wheel event handler to convert wheel events to mouse escape sequences
     */
    attachWheelHandler(terminal, terminalId, targetElement, state) {
        const wheelHandler = (event) => {
            // Only handle if mouse tracking is still active
            if (state.activeModes.size === 0)
                return;
            // Prevent default scrolling behavior
            event.preventDefault();
            event.stopPropagation();
            // Calculate cell position from mouse coordinates
            const rect = targetElement.getBoundingClientRect();
            const cellWidth = terminal.element ? terminal.element.clientWidth / terminal.cols : 9;
            const cellHeight = terminal.element ? terminal.element.clientHeight / terminal.rows : 17;
            const col = Math.floor((event.clientX - rect.left) / cellWidth) + 1;
            const row = Math.floor((event.clientY - rect.top) / cellHeight) + 1;
            // Clamp to valid range
            const clampedCol = Math.max(1, Math.min(col, terminal.cols));
            const clampedRow = Math.max(1, Math.min(row, terminal.rows));
            // Determine scroll direction: wheel up (64) or wheel down (65)
            const button = event.deltaY < 0 ? 64 : 65;
            // Generate escape sequence based on active mode
            let sequence;
            if (state.activeModes.has(1006)) {
                // SGR extended mode: \x1b[<button;col;rowM
                sequence = `\x1b[<${button};${clampedCol};${clampedRow}M`;
            }
            else {
                // Legacy mode: \x1b[M + (button+32) + (col+32) + (row+32)
                sequence = `\x1b[M${String.fromCharCode(button + 32)}${String.fromCharCode(clampedCol + 32)}${String.fromCharCode(clampedRow + 32)}`;
            }
            // Send escape sequence to PTY via Extension message
            if (state.sendInput) {
                state.sendInput(terminalId, sequence);
            }
        };
        // Attach to target element with capture to ensure we get the event
        targetElement.addEventListener('wheel', wheelHandler, { capture: true, passive: false });
        // Store handler for cleanup
        state.wheelHandler = wheelHandler;
        ManagerLogger_1.terminalLogger.info(`[MouseTracking] Wheel handler attached for ${terminalId}`);
    }
    /**
     * Check if mouse tracking is currently active for a terminal
     */
    isMouseTrackingActive(terminalId) {
        const state = this.terminals.get(terminalId);
        return state ? state.activeModes.size > 0 : false;
    }
    /**
     * Get active mouse tracking modes for a terminal
     */
    getActiveModes(terminalId) {
        const state = this.terminals.get(terminalId);
        return state ? Array.from(state.activeModes) : [];
    }
    /**
     * Cleanup mouse tracking for a terminal
     */
    cleanup(terminalId) {
        const state = this.terminals.get(terminalId);
        if (!state) {
            return;
        }
        // Remove wheel handler
        if (state.wheelHandler && state.wheelTarget) {
            state.wheelTarget.removeEventListener('wheel', state.wheelHandler, { capture: true });
        }
        // Dispose CSI handlers
        for (const handler of state.handlers) {
            handler.dispose();
        }
        // Restore native scrolling before cleanup
        if (state.activeModes.size > 0) {
            state.viewport.style.overflow = 'auto';
        }
        this.terminals.delete(terminalId);
        ManagerLogger_1.terminalLogger.info(`[MouseTracking] Cleanup complete for terminal: ${terminalId}`);
    }
    /**
     * Dispose all resources
     */
    dispose() {
        for (const terminalId of this.terminals.keys()) {
            this.cleanup(terminalId);
        }
        ManagerLogger_1.terminalLogger.info('[MouseTracking] Service disposed');
    }
}
exports.MouseTrackingService = MouseTrackingService;
//# sourceMappingURL=MouseTrackingService.js.map