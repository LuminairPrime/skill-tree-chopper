"use strict";
/**
 * IME Handler - Manages Input Method Editor composition events
 * Based on VS Code's TextAreaInput pattern for accurate IME handling
 * Handles Japanese, Chinese, Korean and other complex input methods
 * Now extends BaseInputHandler for improved architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMEHandler = void 0;
const BaseInputHandler_1 = require("./BaseInputHandler");
/**
 * IME Handler for managing composition events
 * Implements VS Code standard TextAreaInput pattern with new architecture
 */
class IMEHandler extends BaseInputHandler_1.BaseInputHandler {
    constructor(eventDebounceTimers, stateManager, eventService) {
        super('IMEHandler', eventDebounceTimers, {
            enableDebouncing: false, // IME events should not be debounced
            enableStateTracking: true,
            enableEventPrevention: false,
        });
        // IME composition state - VS Code standard pattern
        this.compositionContext = null;
        // Track composition events for proper sequencing
        this.lastCompositionEvent = null;
        this.compositionRecoveryTimer = null;
        this.stateManager = stateManager;
        this.eventService = eventService;
        this.logger('initialization', 'starting');
    }
    /**
     * Initialize the IME handler (BaseInputHandler abstract method implementation)
     */
    doInitialize() {
        this.setupIMEHandling();
        this.logger('IMEHandler', 'completed');
    }
    /**
     * Initialize the IME handler (legacy method kept for compatibility)
     */
    async initialize() {
        await super.initialize();
    }
    /**
     * Setup IME composition handling with VS Code standard pattern
     * Note: xterm.js handles IME positioning via its internal CompositionHelper
     * We only track state and hide cursor during composition
     */
    setupIMEHandling() {
        this.logger('Setting up VS Code standard IME composition handling');
        // Ensure cursor styling matches VS Code behavior before events fire
        this.ensureIMECursorStyle();
        // Note: We do NOT create our own textarea - xterm.js has a built-in one
        // that CompositionHelper positions at the cursor location
        // Register composition events using the centralized event service
        this.eventService.registerEventHandler('ime-composition-start', document, 'compositionstart', this.handleCompositionStart.bind(this), { preventDefault: false, stopPropagation: false });
        this.eventService.registerEventHandler('ime-composition-update', document, 'compositionupdate', this.handleCompositionUpdate.bind(this), { preventDefault: false, stopPropagation: false });
        this.eventService.registerEventHandler('ime-composition-end', document, 'compositionend', this.handleCompositionEnd.bind(this), { preventDefault: false, stopPropagation: false });
        // Register input event handlers for composition tracking (VS Code pattern)
        this.eventService.registerEventHandler('ime-input', document, 'input', this.handleInput.bind(this), { preventDefault: false, stopPropagation: false });
        this.eventService.registerEventHandler('ime-beforeinput', document, 'beforeinput', this.handleBeforeInput.bind(this), { preventDefault: false, stopPropagation: false });
        // Fail-safe: browser/IME can occasionally miss compositionend.
        this.eventService.registerEventHandler('ime-window-blur', window, 'blur', this.handleWindowBlur.bind(this), { preventDefault: false, stopPropagation: false });
        this.eventService.registerEventHandler('ime-visibilitychange', document, 'visibilitychange', this.handleVisibilityChange.bind(this), { preventDefault: false, stopPropagation: false });
        this.logger('IME handling', 'completed');
    }
    /**
     * Handle composition start event
     */
    handleCompositionStart(event) {
        const compositionEvent = event;
        this.logger(`IME composition started: ${compositionEvent.data || 'no data'}`);
        // Hide cursor while IME composition is active (VS Code standard behavior)
        this.setIMECursorVisibility(true);
        // Create composition context (VS Code CompositionContext pattern)
        this.compositionContext = {
            data: compositionEvent.data || '',
            isActive: true,
            startOffset: 0,
            endOffset: 0,
        };
        this.lastCompositionEvent = 'start';
        // Update state manager
        this.stateManager.updateIMEState({
            isActive: true,
            data: compositionEvent.data || '',
            startOffset: 0,
            endOffset: 0,
            lastEvent: 'start',
            timestamp: Date.now(),
        });
        this.scheduleCompositionRecovery();
        // Clear any pending input events to avoid conflicts
        this.clearPendingInputEvents();
        // Note: xterm.js CompositionHelper automatically positions textarea at cursor
        // No need to manually position - this is handled by updateCompositionElements()
    }
    /**
     * Handle composition update event
     */
    handleCompositionUpdate(event) {
        const compositionEvent = event;
        this.logger(`IME composition update: ${compositionEvent.data || 'no data'}`);
        // Ensure cursor stays hidden during composition updates
        this.setIMECursorVisibility(true);
        // Update composition context with new data
        if (this.compositionContext) {
            this.compositionContext.data = compositionEvent.data || '';
            this.compositionContext.isActive = true;
        }
        else {
            // Handle case where update comes without start (Android/some IMEs)
            this.compositionContext = {
                data: compositionEvent.data || '',
                isActive: true,
                startOffset: 0,
                endOffset: 0,
            };
        }
        this.lastCompositionEvent = 'update';
        // Update state manager
        this.stateManager.updateIMEState({
            isActive: true,
            data: compositionEvent.data || '',
            lastEvent: 'update',
            timestamp: Date.now(),
        });
        this.scheduleCompositionRecovery();
    }
    /**
     * Handle composition end event
     */
    handleCompositionEnd(event) {
        const compositionEvent = event;
        this.logger(`IME composition ended: ${compositionEvent.data || 'no data'}`);
        this.clearCompositionRecoveryTimer();
        // Update final composition data
        if (this.compositionContext) {
            this.compositionContext.data = compositionEvent.data || '';
            this.compositionContext.isActive = false;
        }
        this.lastCompositionEvent = 'end';
        // Restore cursor visibility immediately after composition completes
        this.setIMECursorVisibility(false);
        // Update state manager
        this.stateManager.updateIMEState({
            isActive: false,
            data: compositionEvent.data || '',
            lastEvent: 'end',
            timestamp: Date.now(),
        });
        // Clear composition context after a brief delay to handle input events
        // VS Code pattern: Allow input events to process before clearing
        setTimeout(() => {
            this.compositionContext = null;
            this.lastCompositionEvent = null;
            // Ensure cursor visibility is restored after cleanup
            this.setIMECursorVisibility(false);
            // Final state reset
            this.stateManager.updateIMEState({
                isActive: false,
                data: '',
                lastEvent: null,
                timestamp: Date.now(),
            });
        }, 0);
    }
    handleWindowBlur() {
        if (!this.isIMEComposing()) {
            return;
        }
        this.logger('Window blur detected during IME composition; forcing composition reset');
        this.forceResetCompositionState('window-blur');
    }
    handleVisibilityChange() {
        if (document.visibilityState !== 'hidden' || !this.isIMEComposing()) {
            return;
        }
        this.logger('Document hidden during IME composition; forcing composition reset');
        this.forceResetCompositionState('visibility-hidden');
    }
    scheduleCompositionRecovery() {
        this.clearCompositionRecoveryTimer();
        this.compositionRecoveryTimer = setTimeout(() => {
            if (!this.isIMEComposing()) {
                return;
            }
            this.logger('IME composition recovery timeout hit; forcing composition reset');
            this.forceResetCompositionState('timeout');
        }, IMEHandler.compositionStuckRecoveryTimeoutMs);
    }
    clearCompositionRecoveryTimer() {
        if (this.compositionRecoveryTimer !== null) {
            clearTimeout(this.compositionRecoveryTimer);
            this.compositionRecoveryTimer = null;
        }
    }
    forceResetCompositionState(reason) {
        this.clearCompositionRecoveryTimer();
        this.compositionContext = null;
        this.lastCompositionEvent = null;
        this.setIMECursorVisibility(false);
        this.stateManager.updateIMEState({
            isActive: false,
            data: '',
            lastEvent: null,
            timestamp: Date.now(),
        });
        this.logger(`IME composition state reset by fail-safe: ${reason}`);
    }
    /**
     * Handle input events during composition (VS Code pattern)
     */
    handleInput(event) {
        const inputEvent = event;
        // Only process input events during active composition
        if (this.compositionContext?.isActive) {
            this.logger(`Input during composition: ${inputEvent.data || 'no data'}, isComposing: ${inputEvent.isComposing}`);
            // Update composition context with input data if available
            if (inputEvent.data && this.compositionContext) {
                this.compositionContext.data = inputEvent.data;
                // Update state manager
                this.stateManager.updateIMEState({
                    data: inputEvent.data,
                    timestamp: Date.now(),
                });
            }
        }
    }
    /**
     * Handle beforeinput events (VS Code pattern for better composition tracking)
     */
    handleBeforeInput(event) {
        const inputEvent = event;
        if (this.compositionContext?.isActive) {
            this.logger(`Before input during composition: ${inputEvent.data || 'no data'}, isComposing: ${inputEvent.isComposing}`);
        }
    }
    /**
     * Check if IME is currently composing (VS Code standard pattern)
     */
    isIMEComposing() {
        return this.stateManager.getStateSection('ime').isActive;
    }
    /**
     * Get current composition data
     */
    getCompositionData() {
        return this.stateManager.getStateSection('ime').data || null;
    }
    // Note: createHiddenTextarea, positionHiddenTextarea, hideHiddenTextarea removed
    // xterm.js has a built-in textarea (.xterm-helper-textarea) that CompositionHelper
    // automatically positions at the cursor location for IME candidate window
    /**
     * Ensure VS Code style cursor rules exist for IME composition
     */
    ensureIMECursorStyle() {
        if (document.getElementById(IMEHandler.IME_CURSOR_STYLE_ID)) {
            return;
        }
        const styleElement = document.createElement('style');
        styleElement.id = IMEHandler.IME_CURSOR_STYLE_ID;
        styleElement.textContent = `body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-block,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-bar,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-outline,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-overwrite {
  opacity: 0 !important;
  width: 0 !important;
  border: 0 !important;
  margin: 0 !important;
}

body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor::before,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor::after {
  display: none !important;
}

body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-layer,
body.${IMEHandler.IME_ACTIVE_CLASS} .terminal-container .xterm .xterm-cursor-layer canvas {
  opacity: 0 !important;
}

/*
 * VS Code Standard: Let xterm.js CompositionHelper handle positioning
 * xterm.js automatically positions composition-view and textarea at cursor
 * Do NOT override left/top/width - this breaks IME candidate window positioning
 */
.terminal-container .xterm .composition-view {
  /* Only reset spacing, let xterm.js set position */
  margin: 0 !important;
  padding: 0 !important;
}

/* Ensure textarea allows xterm.js to control positioning */
.terminal-container .xterm textarea {
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  /* Do NOT set width: 0 - xterm.js needs to set this for IME positioning */
}`;
        (document.head || document.body).appendChild(styleElement);
        this.logger('Injected IME cursor style for VS Code parity');
    }
    /**
     * Toggle cursor visibility during IME composition to match VS Code terminal
     */
    setIMECursorVisibility(active) {
        this.ensureIMECursorStyle();
        if (!document.body) {
            return;
        }
        if (active) {
            document.body.classList.add(IMEHandler.IME_ACTIVE_CLASS);
        }
        else {
            document.body.classList.remove(IMEHandler.IME_ACTIVE_CLASS);
        }
    }
    /**
     * Clear any pending input events that might conflict with IME
     */
    clearPendingInputEvents() {
        // Clear any debounced events that might interfere with IME composition
        for (const [key, timer] of this.eventDebounceTimers) {
            if (key.includes('input') || key.includes('keydown')) {
                clearTimeout(timer);
                this.eventDebounceTimers.delete(key);
                this.logger(`Cleared pending input event: ${key}`);
            }
        }
    }
    /**
     * Dispose IME handler resources (BaseInputHandler abstract method implementation)
     */
    doDispose() {
        this.logger('disposal', 'starting');
        // Clear composition context
        this.clearCompositionRecoveryTimer();
        this.compositionContext = null;
        this.lastCompositionEvent = null;
        // Note: No need to remove hidden textarea - we don't create one
        // xterm.js manages its own textarea
        // Ensure cursor class is cleared during disposal
        if (document.body) {
            document.body.classList.remove(IMEHandler.IME_ACTIVE_CLASS);
        }
        // Reset IME state in state manager
        this.stateManager.resetStateSection('ime');
        // Unregister all events from event service
        if (this.eventService) {
            this.eventService.unregisterEventHandler('ime-composition-start');
            this.eventService.unregisterEventHandler('ime-composition-update');
            this.eventService.unregisterEventHandler('ime-composition-end');
            this.eventService.unregisterEventHandler('ime-input');
            this.eventService.unregisterEventHandler('ime-beforeinput');
            this.eventService.unregisterEventHandler('ime-window-blur');
            this.eventService.unregisterEventHandler('ime-visibilitychange');
        }
        // Call parent dispose
        super.doDispose();
        this.logger('disposal', 'completed');
    }
    /**
     * Dispose of all event listeners and cleanup resources
     */
    dispose() {
        this.logger('Disposing IME handler');
        // Call parent dispose which will call doDispose()
        super.dispose();
        this.logger('IMEHandler', 'completed');
    }
}
exports.IMEHandler = IMEHandler;
IMEHandler.IME_CURSOR_STYLE_ID = 'terminal-ime-cursor-style';
IMEHandler.IME_ACTIVE_CLASS = 'terminal-ime-composing';
IMEHandler.compositionStuckRecoveryTimeoutMs = 5000;
//# sourceMappingURL=IMEHandler.js.map