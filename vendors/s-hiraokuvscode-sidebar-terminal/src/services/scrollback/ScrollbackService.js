'use strict';
/**
 * Scrollback Service - VS Code compatible implementation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ScrollbackService = void 0;
const logger_1 = require('../../utils/logger');
const IScrollbackService_1 = require('./IScrollbackService');
class ScrollbackService {
  constructor(config) {
    this._sessions = new Map();
    this._config = { ...IScrollbackService_1.DEFAULT_SCROLLBACK_CONFIG, ...config };
    (0, logger_1.scrollback)(`📋 [SCROLLBACK] Service initialized`);
  }
  startRecording(terminalId) {
    if (this._sessions.has(terminalId)) return;
    this._sessions.set(terminalId, {
      terminalId,
      entries: [],
      startTime: Date.now(),
      totalSize: 0,
      isRecording: true,
      sizeLimitReached: false,
      timeLimitReached: false,
      unacknowledgedChars: 0,
    });
  }
  stopRecording(terminalId) {
    const session = this._sessions.get(terminalId);
    if (session) session.isRecording = false;
  }
  recordData(terminalId, data) {
    const session = this._sessions.get(terminalId);
    if (!session || !session.isRecording) return;
    const duration = Date.now() - session.startTime;
    if (duration > this._config.maxRecordingDuration) {
      session.timeLimitReached = true;
      return;
    }
    const dataSize = Buffer.byteLength(data, 'utf8');
    if (session.totalSize + dataSize > this._config.maxRecordingSize) {
      session.sizeLimitReached = true;
      return;
    }
    session.entries.push({ cols: 80, rows: 24, data, timestamp: duration });
    session.totalSize += dataSize;
    session.unacknowledgedChars += data.length;
  }
  getSerializedData(terminalId, options) {
    const session = this._sessions.get(terminalId);
    if (!session || session.entries.length === 0) return null;
    const limit = options?.scrollback ?? this._config.persistentSessionScrollback;
    const entries = options?.range
      ? session.entries.slice(options.range.start, options.range.end)
      : session.entries;
    let lineCount = 0;
    const limited = [];
    for (let i = entries.length - 1; i >= 0 && lineCount < limit; i--) {
      const entry = entries[i];
      if (entry) {
        lineCount += (entry.data.match(/\n/g) || []).length;
        limited.unshift(entry);
      }
    }
    return limited.map((e) => e.data).join('');
  }
  getReplayEvent(terminalId) {
    const session = this._sessions.get(terminalId);
    if (!session) return null;
    return {
      events: [...session.entries],
      totalSize: session.totalSize,
      duration: Date.now() - session.startTime,
      truncated: session.sizeLimitReached || session.timeLimitReached,
    };
  }
  clearScrollback(terminalId) {
    this._sessions.delete(terminalId);
  }
  getScrollbackStats(terminalId) {
    const session = this._sessions.get(terminalId);
    if (!session) return null;
    let lineCount = 0;
    for (const entry of session.entries) {
      lineCount += (entry.data.match(/\n/g) || []).length;
    }
    return {
      terminalId,
      entryCount: session.entries.length,
      totalSize: session.totalSize,
      duration: Date.now() - session.startTime,
      isRecording: session.isRecording,
      sizeLimitReached: session.sizeLimitReached,
      timeLimitReached: session.timeLimitReached,
      lineCount,
    };
  }
  acknowledgeChars(terminalId, charCount) {
    const session = this._sessions.get(terminalId);
    if (session) {
      session.unacknowledgedChars = Math.max(0, session.unacknowledgedChars - charCount);
    }
  }
  updateTerminalDimensions(terminalId, cols, rows) {
    const session = this._sessions.get(terminalId);
    if (session && session.entries.length > 0) {
      const last = session.entries[session.entries.length - 1];
      if (last) {
        last.cols = cols;
        last.rows = rows;
      }
    }
  }
  shouldPausePty(terminalId) {
    const session = this._sessions.get(terminalId);
    return session ? session.unacknowledgedChars >= this._config.flowControlHighWatermark : false;
  }
  shouldResumePty(terminalId) {
    const session = this._sessions.get(terminalId);
    return session ? session.unacknowledgedChars <= this._config.flowControlLowWatermark : false;
  }
  dispose() {
    this._sessions.clear();
  }
}
exports.ScrollbackService = ScrollbackService;
//# sourceMappingURL=ScrollbackService.js.map
