"use strict";
/**
 * InputFlushingService - Manages input buffering and flushing for terminal input
 * Extracted from InputManager to centralize input queuing, batching, and flushing logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputFlushingService = void 0;
/**
 * InputFlushingService handles queuing input data per terminal,
 * batching characters, and flushing them either immediately or
 * after a microtask delay (setTimeout 0).
 */
class InputFlushingService {
    constructor(deps) {
        this.pendingInputBuffers = new Map();
        this.deps = deps;
    }
    /**
     * Queue input data for a terminal. If flushImmediately is true, the buffer
     * is flushed synchronously. Otherwise a microtask flush is scheduled.
     */
    queueInputData(terminalId, data, flushImmediately) {
        if (!terminalId || data.length === 0) {
            return;
        }
        let entry = this.pendingInputBuffers.get(terminalId);
        if (!entry) {
            entry = { data: [], timer: null };
            this.pendingInputBuffers.set(terminalId, entry);
        }
        entry.data.push(data);
        if (flushImmediately) {
            this.flushPendingInput(terminalId);
            return;
        }
        if (entry.timer !== null) {
            return;
        }
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this.flushPendingInput(terminalId);
        }, 0);
    }
    /**
     * Flush all pending input for a terminal, joining buffered data and sending it.
     */
    flushPendingInput(terminalId) {
        const entry = this.pendingInputBuffers.get(terminalId);
        if (!entry || entry.data.length === 0) {
            return;
        }
        if (entry.timer !== null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        const payload = entry.data.join('');
        entry.data.length = 0;
        this.deps.sendInput(payload, terminalId);
    }
    /**
     * Determine if a key event should trigger immediate flushing.
     * Returns true for Enter, Backspace, Delete, and data containing newlines.
     */
    shouldFlushImmediately(data, domEvent) {
        if (!data) {
            return true;
        }
        const immediateKeys = new Set(['Enter', 'Backspace', 'Delete']);
        if (immediateKeys.has(domEvent.key)) {
            return true;
        }
        return /[\r\n]/.test(data);
    }
    /**
     * Clear pending input buffers and timers for a specific terminal.
     * Called when a terminal is removed to prevent stale flushes.
     */
    clearTerminalBuffer(terminalId) {
        const pendingBuffer = this.pendingInputBuffers.get(terminalId);
        if (pendingBuffer) {
            if (pendingBuffer.timer !== null) {
                clearTimeout(pendingBuffer.timer);
            }
            pendingBuffer.data = [];
            this.pendingInputBuffers.delete(terminalId);
        }
    }
    /**
     * Dispose all pending input buffers and timers.
     */
    dispose() {
        for (const entry of this.pendingInputBuffers.values()) {
            if (entry.timer !== null) {
                clearTimeout(entry.timer);
            }
            entry.data.length = 0;
        }
        this.pendingInputBuffers.clear();
    }
}
exports.InputFlushingService = InputFlushingService;
//# sourceMappingURL=InputFlushingService.js.map