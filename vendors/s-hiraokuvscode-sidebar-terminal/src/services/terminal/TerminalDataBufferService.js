"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalDataBufferService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
const SystemConstants_1 = require("../../constants/SystemConstants");
/**
 * Service responsible for buffering and batching terminal data output
 *
 * This service extracts data buffering logic from TerminalManager to improve:
 * - Performance through intelligent batching
 * - Responsiveness during CLI Agent operations
 * - Memory efficiency with bounded buffers
 * - Testability with isolated buffer logic
 */
class TerminalDataBufferService {
    constructor(config = {}) {
        this._dataEmitter = new vscode.EventEmitter();
        this._dataBuffers = new Map();
        this._dataFlushTimers = new Map();
        // CLI Agent detection for adaptive buffering
        this._isCliAgentActive = false;
        this.onData = this._dataEmitter.event;
        this._config = {
            flushInterval: config.flushInterval ?? SystemConstants_1.PERFORMANCE_CONSTANTS.OUTPUT_BUFFER_FLUSH_INTERVAL_MS, // ~60fps default
            maxBufferSize: config.maxBufferSize ?? SystemConstants_1.PERFORMANCE_CONSTANTS.MAX_BUFFER_CHUNK_COUNT,
            cliAgentFlushInterval: config.cliAgentFlushInterval ?? SystemConstants_1.PERFORMANCE_CONSTANTS.CLI_AGENT_FAST_FLUSH_INTERVAL_MS, // ~250fps for CLI agents
        };
        (0, logger_1.terminal)('🚰 [DataBuffer] Service initialized with config:', this._config);
    }
    /**
     * Buffer terminal data with intelligent batching
     */
    bufferData(terminalId, data) {
        try {
            // Initialize buffer if needed
            if (!this._dataBuffers.has(terminalId)) {
                this._dataBuffers.set(terminalId, []);
            }
            const buffer = this._dataBuffers.get(terminalId);
            buffer.push(data);
            (0, logger_1.terminal)(`📦 [DataBuffer] Buffered ${data.length} chars for terminal ${terminalId} (buffer: ${buffer.length}/${this._config.maxBufferSize})`);
            // Immediate flush for large data chunks or full buffers
            if (data.length >= SystemConstants_1.PERFORMANCE_CONSTANTS.IMMEDIATE_FLUSH_THRESHOLD_BYTES ||
                buffer.length >= this._config.maxBufferSize) {
                this.flushBuffer(terminalId);
                return;
            }
            // Set up delayed flush if not already pending
            if (!this._dataFlushTimers.has(terminalId)) {
                this.scheduleFlush(terminalId);
            }
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [DataBuffer] Error buffering data:', error);
            // Fallback: emit data immediately
            this.emitData(terminalId, data);
        }
    }
    /**
     * Set CLI Agent active state for adaptive buffering
     */
    setCliAgentActive(isActive) {
        if (this._isCliAgentActive !== isActive) {
            this._isCliAgentActive = isActive;
            (0, logger_1.terminal)(`🤖 [DataBuffer] CLI Agent mode: ${isActive ? 'ACTIVE' : 'INACTIVE'} (flush interval: ${this.getCurrentFlushInterval()}ms)`);
            // If CLI Agent becomes active, flush all pending buffers immediately for responsiveness
            if (isActive) {
                this.flushAllBuffers();
            }
        }
    }
    /**
     * Force flush buffer for a specific terminal
     */
    flushBuffer(terminalId) {
        try {
            const buffer = this._dataBuffers.get(terminalId);
            const timer = this._dataFlushTimers.get(terminalId);
            if (timer) {
                clearTimeout(timer);
                this._dataFlushTimers.delete(terminalId);
            }
            if (buffer && buffer.length > 0) {
                const combinedData = buffer.join('');
                buffer.length = 0; // Clear buffer efficiently
                (0, logger_1.terminal)(`🚰 [DataBuffer] Flushing ${combinedData.length} chars for terminal ${terminalId}`);
                this.emitData(terminalId, combinedData);
            }
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [DataBuffer] Error flushing buffer:', error);
        }
    }
    /**
     * Flush all pending buffers
     */
    flushAllBuffers() {
        (0, logger_1.terminal)('🚰 [DataBuffer] Flushing all buffers');
        try {
            for (const terminalId of this._dataBuffers.keys()) {
                this.flushBuffer(terminalId);
            }
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [DataBuffer] Error flushing all buffers:', error);
        }
    }
    /**
     * Clear buffer for a terminated terminal
     */
    clearTerminalBuffer(terminalId) {
        try {
            // Flush any pending data before clearing
            this.flushBuffer(terminalId);
            // Remove buffer and timer
            this._dataBuffers.delete(terminalId);
            const timer = this._dataFlushTimers.get(terminalId);
            if (timer) {
                clearTimeout(timer);
                this._dataFlushTimers.delete(terminalId);
            }
            (0, logger_1.terminal)(`🧹 [DataBuffer] Cleared buffer for terminal ${terminalId}`);
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [DataBuffer] Error clearing terminal buffer:', error);
        }
    }
    /**
     * Get current buffer statistics for debugging
     */
    getBufferStats() {
        const totalBufferedChars = Array.from(this._dataBuffers.values()).reduce((total, buffer) => total + buffer.reduce((sum, data) => sum + data.length, 0), 0);
        return {
            activeBuffers: this._dataBuffers.size,
            totalBufferedChars,
            pendingFlushes: this._dataFlushTimers.size,
            isCliAgentActive: this._isCliAgentActive,
            flushInterval: this.getCurrentFlushInterval(),
        };
    }
    /**
     * Schedule flush with appropriate timing
     */
    scheduleFlush(terminalId) {
        const flushInterval = this.getCurrentFlushInterval();
        const timer = setTimeout(() => {
            this._dataFlushTimers.delete(terminalId);
            this.flushBuffer(terminalId);
        }, flushInterval);
        this._dataFlushTimers.set(terminalId, timer);
    }
    /**
     * Get current flush interval based on CLI Agent activity
     */
    getCurrentFlushInterval() {
        return this._isCliAgentActive ? this._config.cliAgentFlushInterval : this._config.flushInterval;
    }
    /**
     * Emit data event
     */
    emitData(terminalId, data) {
        this._dataEmitter.fire({
            terminalId,
            data,
            timestamp: Date.now(),
        });
    }
    /**
     * Dispose of all resources
     */
    dispose() {
        (0, logger_1.terminal)('🧹 [DataBuffer] Disposing data buffer service');
        try {
            // Clear all timers
            for (const timer of this._dataFlushTimers.values()) {
                clearTimeout(timer);
            }
            this._dataFlushTimers.clear();
            // Clear all buffers
            this._dataBuffers.clear();
            // Dispose event emitter
            this._dataEmitter.dispose();
            (0, logger_1.terminal)('✅ [DataBuffer] Data buffer service disposed');
        }
        catch (error) {
            (0, logger_1.terminal)('❌ [DataBuffer] Error disposing data buffer service:', error);
        }
    }
}
exports.TerminalDataBufferService = TerminalDataBufferService;
//# sourceMappingURL=TerminalDataBufferService.js.map