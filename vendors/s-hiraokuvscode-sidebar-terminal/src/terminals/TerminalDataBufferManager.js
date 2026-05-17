'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalDataBufferManager = void 0;
const logger_1 = require('../utils/logger');
const SystemConstants_1 = require('../constants/SystemConstants');
const ENABLE_TERMINAL_DEBUG_LOGS = process.env.SECONDARY_TERMINAL_DEBUG_LOGS === 'true';
/** Handles data buffering and flushing for terminal output (~60fps via DATA_FLUSH_INTERVAL=16ms). */
class TerminalDataBufferManager {
  constructor(_terminals, _dataEmitter, _cliAgentService) {
    this._terminals = _terminals;
    this._dataEmitter = _dataEmitter;
    this._cliAgentService = _cliAgentService;
    this._dataBuffers = new Map();
    this._dataFlushTimers = new Map();
    this.DATA_FLUSH_INTERVAL =
      SystemConstants_1.PERFORMANCE_CONSTANTS.OUTPUT_BUFFER_FLUSH_INTERVAL_MS;
    this.MAX_BUFFER_SIZE = 50;
    this._debugLoggingEnabled = ENABLE_TERMINAL_DEBUG_LOGS;
    this._ansiFilterState = new Map();
  }
  debugLog(...args) {
    if (this._debugLoggingEnabled) {
      (0, logger_1.terminal)(...args);
    }
  }
  bufferData(terminalId, data) {
    if (!terminalId || typeof terminalId !== 'string' || !this._terminals.has(terminalId)) {
      return;
    }
    if (!this._dataBuffers.has(terminalId)) {
      this._dataBuffers.set(terminalId, []);
    }
    const buffer = this._dataBuffers.get(terminalId);
    const normalizedData = this._normalizeControlSequences(terminalId, data);
    buffer.push(normalizedData);
    if (buffer.length >= this.MAX_BUFFER_SIZE || data.length > 1000) {
      this.flushBuffer(terminalId);
    } else {
      this._scheduleFlush(terminalId);
    }
  }
  _scheduleFlush(terminalId) {
    if (!this._dataFlushTimers.has(terminalId)) {
      const timer = setTimeout(() => this.flushBuffer(terminalId), this.DATA_FLUSH_INTERVAL);
      this._dataFlushTimers.set(terminalId, timer);
    }
  }
  flushBuffer(terminalId) {
    if (!terminalId || typeof terminalId !== 'string') {
      return;
    }
    if (!this._terminals.has(terminalId)) {
      this._dataBuffers.delete(terminalId);
      this._ansiFilterState.delete(terminalId);
      const timer = this._dataFlushTimers.get(terminalId);
      if (timer) {
        clearTimeout(timer);
        this._dataFlushTimers.delete(terminalId);
      }
      return;
    }
    const timer = this._dataFlushTimers.get(terminalId);
    if (timer) {
      clearTimeout(timer);
      this._dataFlushTimers.delete(terminalId);
    }
    const buffer = this._dataBuffers.get(terminalId);
    if (buffer && buffer.length > 0) {
      const combinedData = buffer.join('');
      buffer.length = 0;
      const terminal = this._terminals.get(terminalId);
      if (!terminal) {
        return;
      }
      try {
        this._cliAgentService.handleOutputChunk(terminalId, combinedData);
      } catch {
        // Ignore CLI Agent detection errors
      }
      this._dataEmitter.fire({
        terminalId,
        data: combinedData,
        timestamp: Date.now(),
        terminalName: terminal.name,
      });
    }
  }
  flushAllBuffers() {
    for (const terminalId of this._dataBuffers.keys()) {
      this.flushBuffer(terminalId);
    }
  }
  _normalizeControlSequences(terminalId, data) {
    if (!data) {
      return data;
    }
    // Normalize form-feed to clear screen + cursor home
    if (data.indexOf('\f') !== -1) {
      data = data.replace(/\f+/g, '\u001b[2J\u001b[H');
    }
    // Filter CSI 3 J (erase scrollback) to preserve scrollback like VS Code
    return this._filterEraseScrollbackSequence(terminalId, data);
  }
  _filterEraseScrollbackSequence(terminalId, data) {
    const state = this._ansiFilterState.get(terminalId) ?? {
      mode: 'normal',
      csiParams: '',
    };
    let out = '';
    for (let i = 0; i < data.length; i++) {
      const ch = data.charAt(i);
      if (state.mode === 'normal') {
        if (ch === '\u001b') {
          state.mode = 'esc';
          continue;
        }
        out += ch;
        continue;
      }
      if (state.mode === 'esc') {
        if (ch === '[') {
          state.mode = 'csi';
          state.csiParams = '';
          continue;
        }
        out += '\u001b' + ch;
        state.mode = 'normal';
        continue;
      }
      // CSI mode: collect params until a final byte
      const isParamChar =
        (ch >= '0' && ch <= '9') || ch === ';' || ch === '?' || ch === ' ' || ch === '>';
      if (isParamChar) {
        state.csiParams += ch;
        continue;
      }
      const finalByte = ch;
      const params = state.csiParams;
      state.mode = 'normal';
      state.csiParams = '';
      // Skip CSI 3 J (erase scrollback)
      if (finalByte === 'J' && params === '3') {
        continue;
      }
      out += '\u001b[' + params + finalByte;
    }
    this._ansiFilterState.set(terminalId, state);
    return out;
  }
  cleanupBuffer(terminalId) {
    this.flushBuffer(terminalId);
    this._dataBuffers.delete(terminalId);
    this._ansiFilterState.delete(terminalId);
    const timer = this._dataFlushTimers.get(terminalId);
    if (timer) {
      clearTimeout(timer);
      this._dataFlushTimers.delete(terminalId);
    }
  }
  dispose() {
    this.flushAllBuffers();
    for (const timer of this._dataFlushTimers.values()) {
      clearTimeout(timer);
    }
    this._dataBuffers.clear();
    this._dataFlushTimers.clear();
    this._ansiFilterState.clear();
  }
}
exports.TerminalDataBufferManager = TerminalDataBufferManager;
//# sourceMappingURL=TerminalDataBufferManager.js.map
