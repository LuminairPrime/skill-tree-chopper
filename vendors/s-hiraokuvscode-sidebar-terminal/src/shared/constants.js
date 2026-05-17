'use strict';
/**
 * Shared Constants
 * Constants used by both Extension and WebView to eliminate duplication
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.PLATFORMS =
  exports.SHARED_DEFAULTS =
  exports.SHARED_SIZES =
  exports.SHARED_DELAYS =
  exports.SHARED_TERMINAL_COMMANDS =
    void 0;
/**
 * Terminal command constants (shared between Extension and WebView)
 */
exports.SHARED_TERMINAL_COMMANDS = {
  READY: 'ready',
  INIT: 'init',
  INPUT: 'input',
  OUTPUT: 'output',
  START_OUTPUT: 'startOutput',
  RESIZE: 'resize',
  CLEAR: 'clear',
  EXIT: 'exit',
  SPLIT: 'split',
  TERMINAL_CREATED: 'terminalCreated',
  TERMINAL_REMOVED: 'terminalRemoved',
  FOCUS_TERMINAL: 'focusTerminal',
  GET_SETTINGS: 'getSettings',
  UPDATE_SETTINGS: 'updateSettings',
  SETTINGS_RESPONSE: 'settingsResponse',
  TERMINAL_CLOSED: 'terminalClosed',
  CREATE_TERMINAL: 'createTerminal',
};
/**
 * Shared timing constants
 */
exports.SHARED_DELAYS = {
  TERMINAL_REMOVE_DELAY: 2000,
  BUFFER_FLUSH_INTERVAL: 16,
  RESIZE_DEBOUNCE_DELAY: 150,
  STATUS_HIDE_DELAY: 3000,
  ERROR_STATUS_DELAY: 5000,
  HOVER_STATUS_DELAY: 1000,
  FADE_DURATION: 200,
};
/**
 * Shared size constants
 */
exports.SHARED_SIZES = {
  MIN_TERMINAL_HEIGHT: 100,
  STATUS_BAR_HEIGHT: 24,
  HEADER_HEIGHT: 36,
  TERMINAL_HEADER_HEIGHT: 32,
  SPLITTER_HEIGHT: 4,
  MIN_CONTAINER_WIDTH: 200,
  MIN_CONTAINER_HEIGHT: 100,
};
/**
 * Shared default values
 */
exports.SHARED_DEFAULTS = {
  MAX_TERMINALS: 10,
  DEFAULT_COLS: 80,
  DEFAULT_ROWS: 30,
  SCROLLBACK_LINES: 10000,
  TERMINAL_NAME_PREFIX: 'Terminal',
};
/**
 * Platform constants
 */
exports.PLATFORMS = {
  WINDOWS: 'win32',
  DARWIN: 'darwin',
  LINUX: 'linux',
};
//# sourceMappingURL=constants.js.map
