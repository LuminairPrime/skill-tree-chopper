"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularBufferManager = void 0;
const CircularBuffer_1 = require("./CircularBuffer");
const logger_1 = require("./logger");
/**
 * Circular Buffer Manager
 *
 * Orchestrates multiple CircularBuffers with a single global timer.
 * Provides significant memory and performance improvements over per-terminal timers.
 *
 * Benefits:
 * - Single global timer instead of N terminal timers
 * - Approximately 50% memory reduction for buffering operations
 * - Automatic cleanup on terminal removal
 * - O(1) buffer operations
 * - Prevents race conditions
 */
class CircularBufferManager {
    constructor(flushCallback, options = {}) {
        this.buffers = new Map();
        this.globalTimer = null;
        this.terminalMetadata = new Map();
        this.flushCallback = flushCallback;
        this.options = {
            flushInterval: options.flushInterval ?? 16, // ~60fps for smooth output
            bufferCapacity: options.bufferCapacity ?? 50,
            maxDataSize: options.maxDataSize ?? 1000,
            debug: options.debug ?? false,
        };
    }
    /**
     * Buffer data for a specific terminal
     */
    bufferData(terminalId, data) {
        if (!terminalId || typeof terminalId !== 'string') {
            // Only log critical errors
            if (this.options.debug) {
                console.error('🚨 [CircularBufferManager] Invalid terminalId:', terminalId);
            }
            return;
        }
        if (!data || data.length === 0) {
            return;
        }
        // Get or create buffer for this terminal
        let buffer = this.buffers.get(terminalId);
        if (!buffer) {
            buffer = new CircularBuffer_1.CircularBuffer(this.options.bufferCapacity);
            this.buffers.set(terminalId, buffer);
            this.terminalMetadata.set(terminalId, {
                created: Date.now(),
                flushCount: 0,
                totalBytes: 0,
            });
            if (this.options.debug) {
                (0, logger_1.terminal)(`📊 [CircularBufferManager] Created buffer for terminal: ${terminalId}`);
            }
        }
        // Push data to buffer
        buffer.push(data);
        const metadata = this.terminalMetadata.get(terminalId);
        if (metadata) {
            metadata.totalBytes += data.length;
        }
        // Start global timer if not already running
        if (!this.globalTimer) {
            this._startGlobalTimer();
        }
        // Immediate flush if data is large or buffer is full
        const dataLength = buffer.getDataLength();
        if (dataLength >= this.options.maxDataSize || buffer.isFull()) {
            if (this.options.debug) {
                (0, logger_1.terminal)(`📤 [CircularBufferManager] Immediate flush for ${terminalId}: ${dataLength} bytes`);
            }
            this._flushBuffer(terminalId);
        }
    }
    /**
     * Flush a specific terminal's buffer
     */
    flushTerminal(terminalId) {
        this._flushBuffer(terminalId);
    }
    /**
     * Flush all buffers immediately
     */
    flushAll() {
        for (const terminalId of this.buffers.keys()) {
            this._flushBuffer(terminalId);
        }
    }
    /**
     * Remove a terminal's buffer and clean up resources
     */
    removeTerminal(terminalId) {
        // Flush any remaining data before removal
        this._flushBuffer(terminalId);
        // Clean up buffer and metadata
        this.buffers.delete(terminalId);
        this.terminalMetadata.delete(terminalId);
        if (this.options.debug) {
            (0, logger_1.terminal)(`🗑️ [CircularBufferManager] Removed buffer for terminal: ${terminalId}`);
        }
        // Stop global timer if no more buffers
        if (this.buffers.size === 0 && this.globalTimer) {
            this._stopGlobalTimer();
        }
    }
    /**
     * Check if a terminal has a buffer
     */
    hasTerminal(terminalId) {
        return this.buffers.has(terminalId);
    }
    /**
     * Get buffer statistics for a terminal
     */
    getTerminalStats(terminalId) {
        const buffer = this.buffers.get(terminalId);
        const metadata = this.terminalMetadata.get(terminalId);
        if (!buffer || !metadata) {
            return null;
        }
        return {
            bufferSize: buffer.getSize(),
            bufferCapacity: buffer.getCapacity(),
            dataLength: buffer.getDataLength(),
            flushCount: metadata.flushCount,
            totalBytes: metadata.totalBytes,
            age: Date.now() - metadata.created,
        };
    }
    /**
     * Get overall manager statistics
     */
    getManagerStats() {
        let totalFlushes = 0;
        let totalBytes = 0;
        for (const metadata of this.terminalMetadata.values()) {
            totalFlushes += metadata.flushCount;
            totalBytes += metadata.totalBytes;
        }
        return {
            activeBuffers: this.buffers.size,
            timerActive: this.globalTimer !== null,
            totalFlushes,
            totalBytes,
        };
    }
    /**
     * Dispose and clean up all resources
     */
    dispose() {
        // Flush all remaining data
        this.flushAll();
        // Stop timer
        this._stopGlobalTimer();
        // Clear all buffers and metadata
        this.buffers.clear();
        this.terminalMetadata.clear();
        if (this.options.debug) {
            (0, logger_1.terminal)('🗑️ [CircularBufferManager] Disposed');
        }
    }
    /**
     * Start the global flush timer
     */
    _startGlobalTimer() {
        if (this.globalTimer) {
            return; // Already running
        }
        this.globalTimer = setInterval(() => {
            this._flushAllBuffers();
        }, this.options.flushInterval);
        if (this.options.debug) {
            (0, logger_1.terminal)(`⏱️ [CircularBufferManager] Global timer started (${this.options.flushInterval}ms interval)`);
        }
    }
    /**
     * Stop the global flush timer
     */
    _stopGlobalTimer() {
        if (this.globalTimer) {
            clearInterval(this.globalTimer);
            this.globalTimer = null;
            if (this.options.debug) {
                (0, logger_1.terminal)('⏹️ [CircularBufferManager] Global timer stopped');
            }
        }
    }
    /**
     * Flush all non-empty buffers
     */
    _flushAllBuffers() {
        for (const terminalId of this.buffers.keys()) {
            const buffer = this.buffers.get(terminalId);
            if (buffer && !buffer.isEmpty()) {
                this._flushBuffer(terminalId);
            }
        }
        // Stop timer if no more buffers
        if (this.buffers.size === 0) {
            this._stopGlobalTimer();
        }
    }
    /**
     * Flush a specific buffer
     */
    _flushBuffer(terminalId) {
        const buffer = this.buffers.get(terminalId);
        if (!buffer || buffer.isEmpty()) {
            return;
        }
        const data = buffer.flush();
        if (data.length === 0) {
            return;
        }
        // Update metadata
        const metadata = this.terminalMetadata.get(terminalId);
        if (metadata) {
            metadata.flushCount++;
        }
        // Call the flush callback
        try {
            this.flushCallback(terminalId, data);
            if (this.options.debug) {
                (0, logger_1.terminal)(`📤 [CircularBufferManager] Flushed ${data.length} bytes for terminal: ${terminalId}`);
            }
        }
        catch (error) {
            console.error(`❌ [CircularBufferManager] Error flushing buffer for ${terminalId}:`, error);
        }
    }
}
exports.CircularBufferManager = CircularBufferManager;
//# sourceMappingURL=CircularBufferManager.js.map