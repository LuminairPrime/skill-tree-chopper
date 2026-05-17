'use strict';
/**
 * Buffer Management Service Implementation
 *
 * Manages terminal output buffering with adaptive flushing strategies.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.BufferManagementService = exports.BufferOverflowEvent = exports.BufferFlushedEvent = void 0;
const EventBus_1 = require('../../core/EventBus');
const SystemConstants_1 = require('../../constants/SystemConstants');
/**
 * Default buffer configuration
 */
const DEFAULT_BUFFER_CONFIG = {
  flushInterval: SystemConstants_1.PERFORMANCE_CONSTANTS.OUTPUT_BUFFER_FLUSH_INTERVAL_MS, // 16ms (60fps)
  maxBufferSize: SystemConstants_1.PERFORMANCE_CONSTANTS.MAX_BUFFER_CHUNK_COUNT, // 50 chunks
  adaptiveBuffering: true,
};
/**
 * CLI Agent mode configuration
 */
const CLI_AGENT_BUFFER_CONFIG = {
  flushInterval: SystemConstants_1.PERFORMANCE_CONSTANTS.CLI_AGENT_FAST_FLUSH_INTERVAL_MS, // 4ms (250fps)
};
/**
 * Buffer events
 */
exports.BufferFlushedEvent = (0, EventBus_1.createEventType)('buffer.flushed');
exports.BufferOverflowEvent = (0, EventBus_1.createEventType)('buffer.overflow');
/**
 * Buffer Management Service Implementation
 */
class BufferManagementService {
  constructor(_eventBus) {
    this._eventBus = _eventBus;
    this._buffers = new Map();
    this._isDisposed = false;
  }
  initializeBuffer(terminalId, config) {
    this._ensureNotDisposed();
    if (this._buffers.has(terminalId)) {
      // Already initialized, just update config
      const state = this._buffers.get(terminalId);
      state.config = { ...state.config, ...config };
      return;
    }
    const fullConfig = {
      ...DEFAULT_BUFFER_CONFIG,
      ...config,
    };
    const state = {
      buffer: [],
      config: fullConfig,
      timer: null,
      stats: {
        flushCount: 0,
        totalFlushTime: 0,
        lastFlushAt: new Date(),
      },
      cliAgentActive: false,
    };
    this._buffers.set(terminalId, state);
    this._startFlushTimer(terminalId);
  }
  write(terminalId, data) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (!state) {
      // Initialize on-demand
      this.initializeBuffer(terminalId);
      return this.write(terminalId, data);
    }
    state.buffer.push(data);
    // Check for overflow
    const currentSize = state.buffer.length;
    if (currentSize >= state.config.maxBufferSize) {
      this._eventBus.publish(exports.BufferOverflowEvent, {
        terminalId,
        size: currentSize,
        maxSize: state.config.maxBufferSize,
      });
      // Flush immediately on overflow
      this.flush(terminalId);
      return false; // Flushed immediately
    }
    return true; // Buffered
  }
  flush(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (!state || state.buffer.length === 0) {
      return '';
    }
    const data = state.buffer.join('');
    state.buffer = [];
    // Update stats
    state.stats.flushCount++;
    state.stats.lastFlushAt = new Date();
    // Publish event
    this._eventBus.publish(exports.BufferFlushedEvent, {
      terminalId,
      data,
      size: data.length,
    });
    return data;
  }
  flushAll() {
    this._ensureNotDisposed();
    const result = new Map();
    for (const [terminalId] of this._buffers) {
      const data = this.flush(terminalId);
      if (data) {
        result.set(terminalId, data);
      }
    }
    return result;
  }
  setFlushInterval(terminalId, interval) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (!state) {
      return;
    }
    state.config.flushInterval = interval;
    // Restart timer with new interval
    this._stopFlushTimer(terminalId);
    this._startFlushTimer(terminalId);
  }
  getFlushInterval(terminalId) {
    const state = this._buffers.get(terminalId);
    return state?.config.flushInterval ?? DEFAULT_BUFFER_CONFIG.flushInterval;
  }
  enableAdaptiveBuffering(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (state) {
      state.config.adaptiveBuffering = true;
    }
  }
  disableAdaptiveBuffering(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (state) {
      state.config.adaptiveBuffering = false;
    }
  }
  onCliAgentDetected(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (!state) {
      return;
    }
    state.cliAgentActive = true;
    // Switch to high-performance mode if adaptive buffering is enabled
    if (state.config.adaptiveBuffering) {
      this.setFlushInterval(terminalId, CLI_AGENT_BUFFER_CONFIG.flushInterval);
    }
  }
  onCliAgentDisconnected(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (!state) {
      return;
    }
    state.cliAgentActive = false;
    // Return to normal mode if adaptive buffering is enabled
    if (state.config.adaptiveBuffering) {
      this.setFlushInterval(terminalId, DEFAULT_BUFFER_CONFIG.flushInterval);
    }
  }
  getBufferStats(terminalId) {
    const state = this._buffers.get(terminalId);
    if (!state) {
      return undefined;
    }
    const currentSize = state.buffer.join('').length;
    const avgFlushInterval =
      state.stats.flushCount > 0 ? state.stats.totalFlushTime / state.stats.flushCount : 0;
    return {
      terminalId,
      currentSize,
      flushCount: state.stats.flushCount,
      avgFlushInterval,
      lastFlushAt: state.stats.lastFlushAt,
    };
  }
  getAllBufferStats() {
    const stats = [];
    for (const [terminalId] of this._buffers) {
      const stat = this.getBufferStats(terminalId);
      if (stat) {
        stats.push(stat);
      }
    }
    return stats;
  }
  clearBuffer(terminalId) {
    this._ensureNotDisposed();
    const state = this._buffers.get(terminalId);
    if (state) {
      state.buffer = [];
    }
  }
  disposeBuffer(terminalId) {
    this._ensureNotDisposed();
    // Flush any remaining data
    this.flush(terminalId);
    // Stop timer
    this._stopFlushTimer(terminalId);
    // Remove buffer state
    this._buffers.delete(terminalId);
  }
  dispose() {
    if (this._isDisposed) {
      return;
    }
    // Flush all buffers
    this.flushAll();
    // Stop all timers
    for (const [terminalId] of this._buffers) {
      this._stopFlushTimer(terminalId);
    }
    // Clear all buffers
    this._buffers.clear();
    this._isDisposed = true;
  }
  _startFlushTimer(terminalId) {
    const state = this._buffers.get(terminalId);
    if (!state) {
      return;
    }
    // Stop existing timer if any
    this._stopFlushTimer(terminalId);
    // Start new timer
    state.timer = setInterval(() => {
      if (state.buffer.length > 0) {
        this.flush(terminalId);
      }
    }, state.config.flushInterval);
  }
  _stopFlushTimer(terminalId) {
    const state = this._buffers.get(terminalId);
    if (state?.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }
  _ensureNotDisposed() {
    if (this._isDisposed) {
      throw new Error('Cannot use disposed BufferManagementService');
    }
  }
}
exports.BufferManagementService = BufferManagementService;
//# sourceMappingURL=BufferManagementService.js.map
