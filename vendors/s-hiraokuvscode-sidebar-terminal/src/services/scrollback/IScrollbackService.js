'use strict';
/**
 * IScrollbackService Interface
 *
 * VS Code-style scrollback buffer management.
 * Based on VS Code's TerminalRecorder pattern with size and time limits.
 *
 * Reference: src/vs/platform/terminal/common/terminalRecorder.ts
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DEFAULT_SCROLLBACK_CONFIG = void 0;
/**
 * Default scrollback configuration
 *
 * VS Code-compatible defaults
 */
exports.DEFAULT_SCROLLBACK_CONFIG = {
  scrollback: 1000,
  persistentSessionScrollback: 100,
  maxRecordingSize: 10 * 1024 * 1024, // 10MB
  maxRecordingDuration: 10000, // 10 seconds
  flowControlHighWatermark: 100000,
  flowControlLowWatermark: 5000,
  charCountAckSize: 5000,
  writeMaxChunkSize: 50,
};
//# sourceMappingURL=IScrollbackService.js.map
