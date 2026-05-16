"use strict";
/**
 * Split Resize Manager
 *
 * Handles drag-to-resize functionality for split terminal layouts.
 * Uses pointer events for cross-device compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitResizeManager = void 0;
const logger_1 = require("../../utils/logger");
const EventHandlerRegistry_1 = require("../utils/EventHandlerRegistry");
const DebouncedEventBuffer_1 = require("../utils/DebouncedEventBuffer");
const webview_1 = require("../constants/webview");
/**
 * Manages drag-to-resize functionality for split terminal layouts
 */
class SplitResizeManager {
    constructor(config) {
        this.moveThrottler = null;
        this.ptyNotifyTimer = null;
        this.disposed = false;
        this.config = config;
        this.eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        this.dragState = this.createInitialDragState();
        (0, logger_1.webview)('📐 [SPLIT-RESIZE] SplitResizeManager initialized');
    }
    /**
     * Create initial drag state
     */
    createInitialDragState() {
        return {
            isActive: false,
            resizerElement: null,
            startPosition: 0,
            startSizes: { before: 0, after: 0 },
            wrapperBefore: null,
            wrapperAfter: null,
            direction: 'vertical',
        };
    }
    /**
     * Initialize manager with resizer elements
     */
    initialize(resizers) {
        if (this.disposed) {
            (0, logger_1.webview)('⚠️ [SPLIT-RESIZE] Cannot initialize - manager is disposed');
            return;
        }
        // Clean up previous event listeners
        this.eventRegistry.unregisterByPattern(/^split-resize:/);
        // Register pointer down on each resizer
        resizers.forEach((resizer, index) => {
            this.eventRegistry.register(`split-resize:resizer-${index}-pointerdown`, resizer, 'pointerdown', (e) => this.handlePointerDown(e, resizer));
        });
        (0, logger_1.webview)(`📐 [SPLIT-RESIZE] Initialized with ${resizers.length} resizers`);
    }
    /**
     * Check if currently resizing
     */
    isResizing() {
        return this.dragState.isActive;
    }
    /**
     * Get current drag state (for testing)
     */
    getDragState() {
        return this.dragState.isActive ? { ...this.dragState } : null;
    }
    /**
     * Cancel any active drag operation
     */
    cancelDrag() {
        if (this.dragState.isActive) {
            (0, logger_1.webview)('📐 [SPLIT-RESIZE] Cancelling active drag');
            this.endDrag(false);
        }
    }
    /**
     * Handle pointer down on resizer
     */
    handlePointerDown(event, resizer) {
        event.preventDefault();
        event.stopPropagation();
        const isGridRowResizer = resizer.classList.contains('grid-row-resizer');
        if (isGridRowResizer) {
            this.handleGridRowPointerDown(event, resizer);
            return;
        }
        // Get terminal IDs from resizer data attributes
        const beforeId = resizer.getAttribute('data-resizer-before');
        const afterId = resizer.getAttribute('data-resizer-after');
        if (!beforeId || !afterId) {
            (0, logger_1.webview)('⚠️ [SPLIT-RESIZE] Resizer missing terminal ID attributes');
            return;
        }
        // Find wrapper elements
        const wrapperBefore = document.querySelector(`[data-terminal-wrapper-id="${beforeId}"]`);
        const wrapperAfter = document.querySelector(`[data-terminal-wrapper-id="${afterId}"]`);
        if (!wrapperBefore || !wrapperAfter) {
            (0, logger_1.webview)(`⚠️ [SPLIT-RESIZE] Could not find wrappers for terminals: ${beforeId}, ${afterId}`);
            return;
        }
        // Get current split direction
        const direction = this.config.getSplitDirection();
        // Get current sizes
        const beforeRect = wrapperBefore.getBoundingClientRect();
        const afterRect = wrapperAfter.getBoundingClientRect();
        const beforeSize = direction === 'horizontal' ? beforeRect.width : beforeRect.height;
        const afterSize = direction === 'horizontal' ? afterRect.width : afterRect.height;
        // Initialize drag state
        this.dragState = {
            isActive: true,
            resizerElement: resizer,
            startPosition: direction === 'horizontal' ? event.clientX : event.clientY,
            startSizes: { before: beforeSize, after: afterSize },
            wrapperBefore,
            wrapperAfter,
            direction,
        };
        this.startDragEvents(event, resizer, direction);
        (0, logger_1.webview)(`📐 [SPLIT-RESIZE] Drag started: ${beforeId} ↔ ${afterId} (${direction})`);
    }
    /**
     * Handle pointer down on grid row resizer.
     * Modifies grid-template-rows instead of individual wrapper flex values.
     */
    handleGridRowPointerDown(event, resizer) {
        const gridContainer = resizer.parentElement;
        if (!gridContainer) {
            (0, logger_1.webview)('⚠️ [SPLIT-RESIZE] Grid row resizer has no parent container');
            return;
        }
        const containerRect = gridContainer.getBoundingClientRect();
        // Row 1 ends at resizer, row 2 starts after resizer
        const resizerRect = resizer.getBoundingClientRect();
        const row1Height = resizerRect.top - containerRect.top;
        const row2Height = containerRect.bottom - resizerRect.bottom;
        this.dragState = {
            isActive: true,
            resizerElement: resizer,
            startPosition: event.clientY,
            startSizes: { before: row1Height, after: row2Height },
            wrapperBefore: null,
            wrapperAfter: null,
            direction: 'vertical',
            isGridRowResize: true,
            gridContainer,
        };
        this.startDragEvents(event, resizer, 'vertical');
        (0, logger_1.webview)(`📐 [SPLIT-RESIZE] Grid row drag started: row1=${row1Height.toFixed(0)}px, row2=${row2Height.toFixed(0)}px`);
    }
    /**
     * Common setup for drag event listeners and visual feedback
     */
    startDragEvents(event, resizer, cursorDirection) {
        // Add visual feedback classes
        document.body.classList.add('resizing-split');
        document.body.classList.add(`resizing-${cursorDirection}`);
        resizer.classList.add('dragging');
        // Set pointer capture for smooth tracking
        resizer.setPointerCapture(event.pointerId);
        // Create throttler for move events
        this.moveThrottler = new DebouncedEventBuffer_1.Throttler((moveEvent) => this.handlePointerMoveThrottled(moveEvent), {
            interval: webview_1.SPLIT_RESIZE_CONSTANTS.RESIZE_THROTTLE_MS,
            leading: true,
            trailing: true,
        });
        // Register document-level event listeners
        this.eventRegistry.register('split-resize:document-pointermove', document, 'pointermove', (e) => this.handlePointerMove(e));
        this.eventRegistry.register('split-resize:document-pointerup', document, 'pointerup', (e) => this.handlePointerUp(e));
        // Handle pointer cancel (e.g., focus loss during drag)
        this.eventRegistry.register('split-resize:document-pointercancel', document, 'pointercancel', () => this.endDrag(false));
        // Safety net: handle pointer leaving the document entirely
        this.eventRegistry.register('split-resize:document-pointerleave', document, 'pointerleave', () => this.endDrag(false));
    }
    /**
     * Handle pointer move (throttled)
     */
    handlePointerMove(event) {
        if (!this.dragState.isActive || !this.moveThrottler) {
            return;
        }
        event.preventDefault();
        this.moveThrottler.trigger(event);
    }
    /**
     * Throttled handler for pointer move
     */
    handlePointerMoveThrottled(event) {
        if (!this.dragState.isActive) {
            return;
        }
        if (this.dragState.isGridRowResize) {
            this.handleGridRowMoveThrottled(event);
            return;
        }
        const { direction, wrapperBefore, wrapperAfter } = this.dragState;
        if (!wrapperBefore || !wrapperAfter) {
            return;
        }
        const currentPosition = direction === 'horizontal' ? event.clientX : event.clientY;
        // Calculate new sizes
        const { beforeSize, afterSize } = this.calculateNewSizes({
            startPosition: this.dragState.startPosition,
            currentPosition,
            startSizes: this.dragState.startSizes,
            direction,
            minSize: webview_1.SPLIT_RESIZE_CONSTANTS.MIN_RESIZE_SIZE_PX,
        });
        // Apply sizes using flex-basis
        const totalSize = this.dragState.startSizes.before + this.dragState.startSizes.after;
        const beforeRatio = beforeSize / totalSize;
        const afterRatio = afterSize / totalSize;
        // Use flex-grow with ratio instead of fixed pixels for responsive layout
        wrapperBefore.style.flex = `${beforeRatio} 1 0`;
        wrapperAfter.style.flex = `${afterRatio} 1 0`;
        (0, logger_1.webview)(`📐 [SPLIT-RESIZE] Resizing: before=${beforeSize.toFixed(0)}px (${(beforeRatio * 100).toFixed(1)}%), after=${afterSize.toFixed(0)}px (${(afterRatio * 100).toFixed(1)}%)`);
    }
    /**
     * Handle grid row resize move - modifies grid-template-rows
     */
    handleGridRowMoveThrottled(event) {
        const { gridContainer } = this.dragState;
        if (!gridContainer) {
            return;
        }
        const currentPosition = event.clientY;
        const { beforeSize, afterSize } = this.calculateNewSizes({
            startPosition: this.dragState.startPosition,
            currentPosition,
            startSizes: this.dragState.startSizes,
            direction: 'vertical',
            minSize: webview_1.SPLIT_RESIZE_CONSTANTS.MIN_RESIZE_SIZE_PX,
        });
        const totalSize = this.dragState.startSizes.before + this.dragState.startSizes.after;
        const row1Fr = beforeSize / totalSize;
        const row2Fr = afterSize / totalSize;
        // Update grid-template-rows: row1 | auto (resizer) | row2
        gridContainer.style.gridTemplateRows = `${row1Fr}fr auto ${row2Fr}fr`;
        (0, logger_1.webview)(`📐 [GRID-RESIZE] Row resize: row1=${(row1Fr * 100).toFixed(1)}%, row2=${(row2Fr * 100).toFixed(1)}%`);
    }
    /**
     * Handle pointer up
     */
    handlePointerUp(event) {
        if (!this.dragState.isActive) {
            return;
        }
        // Release pointer capture
        if (this.dragState.resizerElement) {
            try {
                this.dragState.resizerElement.releasePointerCapture(event.pointerId);
            }
            catch {
                // Ignore if pointer capture was already released
            }
        }
        this.endDrag(true);
    }
    /**
     * End drag operation
     */
    endDrag(notifyPty) {
        document.body.classList.remove('resizing-split', 'resizing-horizontal', 'resizing-vertical');
        if (this.dragState.resizerElement) {
            this.dragState.resizerElement.classList.remove('dragging');
        }
        this.eventRegistry.unregister('split-resize:document-pointermove');
        this.eventRegistry.unregister('split-resize:document-pointerup');
        this.eventRegistry.unregister('split-resize:document-pointercancel');
        this.eventRegistry.unregister('split-resize:document-pointerleave');
        if (this.moveThrottler) {
            this.moveThrottler.dispose();
            this.moveThrottler = null;
        }
        this.dragState = this.createInitialDragState();
        (0, logger_1.webview)('📐 [SPLIT-RESIZE] Drag ended');
        if (notifyPty) {
            this.scheduleRefitCallback();
        }
    }
    /**
     * Schedule PTY notification with debounce
     */
    scheduleRefitCallback() {
        if (this.ptyNotifyTimer !== null) {
            clearTimeout(this.ptyNotifyTimer);
        }
        this.ptyNotifyTimer = setTimeout(() => {
            this.ptyNotifyTimer = null;
            (0, logger_1.webview)('📐 [SPLIT-RESIZE] Notifying PTY of resize completion');
            this.config.onResizeComplete();
        }, webview_1.SPLIT_RESIZE_CONSTANTS.PTY_NOTIFY_DEBOUNCE_MS);
    }
    /**
     * Calculate new sizes based on pointer delta
     */
    calculateNewSizes(params) {
        const { startPosition, currentPosition, startSizes, minSize } = params;
        // Calculate delta
        const delta = currentPosition - startPosition;
        // Calculate raw new sizes
        let beforeSize = startSizes.before + delta;
        let afterSize = startSizes.after - delta;
        // Get total size (should remain constant)
        const totalSize = startSizes.before + startSizes.after;
        // Enforce minimum sizes
        if (beforeSize < minSize) {
            beforeSize = minSize;
            afterSize = totalSize - beforeSize;
        }
        if (afterSize < minSize) {
            afterSize = minSize;
            beforeSize = totalSize - afterSize;
        }
        // Final clamp to ensure total remains constant
        if (beforeSize + afterSize !== totalSize) {
            // Adjust to maintain total
            const adjustment = (beforeSize + afterSize - totalSize) / 2;
            beforeSize -= adjustment;
            afterSize -= adjustment;
        }
        return { beforeSize, afterSize };
    }
    /**
     * Reinitialize with new resizers (called when split layout changes)
     */
    reinitialize(resizers) {
        this.cancelDrag();
        this.initialize(resizers);
    }
    /**
     * Dispose manager and clean up resources
     */
    dispose() {
        if (this.disposed) {
            return;
        }
        (0, logger_1.webview)('📐 [SPLIT-RESIZE] Disposing SplitResizeManager');
        this.cancelDrag();
        // Safety net: always remove resizing CSS classes to prevent stuck user-select: none
        if (typeof document !== 'undefined') {
            document.body.classList.remove('resizing-split', 'resizing-horizontal', 'resizing-vertical');
        }
        if (this.ptyNotifyTimer !== null) {
            clearTimeout(this.ptyNotifyTimer);
            this.ptyNotifyTimer = null;
        }
        if (this.moveThrottler) {
            this.moveThrottler.dispose();
            this.moveThrottler = null;
        }
        this.eventRegistry.unregisterByPattern(/^split-resize:/);
        this.eventRegistry.dispose();
        this.disposed = true;
        (0, logger_1.webview)('📐 [SPLIT-RESIZE] SplitResizeManager disposed');
    }
}
exports.SplitResizeManager = SplitResizeManager;
//# sourceMappingURL=SplitResizeManager.js.map