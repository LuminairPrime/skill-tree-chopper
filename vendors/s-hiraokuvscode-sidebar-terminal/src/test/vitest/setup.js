'use strict';
/**
 * Vitest Global Setup
 * Provides common setup for all tests including DOM, browser APIs, and xterm.js mocks
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.createMockTerminal = void 0;
const vitest_1 = require('vitest');
const vscode_1 = require('./mocks/vscode');
// Make vscode available globally for tests that rely on it
global.vscode = vscode_1.default;
// ============================================================================
// Browser API Polyfills
// ============================================================================
// Performance API
if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = {
    now: () => Date.now(),
    mark: vitest_1.vi.fn(),
    measure: vitest_1.vi.fn(),
    clearMarks: vitest_1.vi.fn(),
    clearMeasures: vitest_1.vi.fn(),
    getEntries: vitest_1.vi.fn().mockReturnValue([]),
    getEntriesByName: vitest_1.vi.fn().mockReturnValue([]),
    getEntriesByType: vitest_1.vi.fn().mockReturnValue([]),
    toJSON: vitest_1.vi.fn().mockReturnValue({}),
    timeOrigin: Date.now(),
    timing: {},
    navigation: {},
    onresourcetimingbufferfull: null,
    setResourceTimingBufferSize: vitest_1.vi.fn(),
    clearResourceTimings: vitest_1.vi.fn(),
    eventCounts: new Map(),
  };
}
// MessageEvent polyfill
if (typeof globalThis.MessageEvent === 'undefined') {
  globalThis.MessageEvent = class MockMessageEvent extends Event {
    constructor(type, init) {
      super(type, init);
      this.data = init?.data;
      this.origin = init?.origin || '';
      this.lastEventId = init?.lastEventId || '';
      this.source = init?.source || null;
      this.ports = init?.ports || [];
    }
    initMessageEvent() {}
  };
}
// CustomEvent polyfill
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class MockCustomEvent extends Event {
    constructor(type, init) {
      super(type, init);
      this.detail = init?.detail;
    }
    initCustomEvent() {}
  };
}
// ResizeObserver polyfill
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
      this.observedElements = new Set();
      this.callback = callback;
    }
    observe(target) {
      this.observedElements.add(target);
    }
    unobserve(target) {
      this.observedElements.delete(target);
    }
    disconnect() {
      this.observedElements.clear();
    }
    // Test helper to trigger resize
    _triggerResize(entries) {
      this.callback(entries, this);
    }
  };
}
// IntersectionObserver polyfill
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class MockIntersectionObserver {
    constructor(_callback, _options) {
      this.root = null;
      this.rootMargin = '0px';
      this.thresholds = [0];
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}
// MutationObserver polyfill (happy-dom may already provide this)
if (typeof globalThis.MutationObserver === 'undefined') {
  globalThis.MutationObserver = class MockMutationObserver {
    constructor(_callback) {}
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}
// requestAnimationFrame / cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback) => {
    return setTimeout(() => callback(performance.now()), 16);
  };
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = (handle) => {
    clearTimeout(handle);
  };
}
// ============================================================================
// xterm.js Mock
// ============================================================================
const createMockTerminal = () => ({
  onData: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onKey: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onResize: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onTitleChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onBell: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onBinary: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onCursorMove: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onLineFeed: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onScroll: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onSelectionChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onRender: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  onWriteParsed: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  open: vitest_1.vi.fn(),
  write: vitest_1.vi.fn(),
  writeln: vitest_1.vi.fn(),
  paste: vitest_1.vi.fn(),
  clear: vitest_1.vi.fn(),
  reset: vitest_1.vi.fn(),
  resize: vitest_1.vi.fn(),
  focus: vitest_1.vi.fn(),
  blur: vitest_1.vi.fn(),
  scrollToTop: vitest_1.vi.fn(),
  scrollToBottom: vitest_1.vi.fn(),
  scrollLines: vitest_1.vi.fn(),
  scrollPages: vitest_1.vi.fn(),
  scrollToLine: vitest_1.vi.fn(),
  select: vitest_1.vi.fn(),
  selectAll: vitest_1.vi.fn(),
  selectLines: vitest_1.vi.fn(),
  clearSelection: vitest_1.vi.fn(),
  hasSelection: vitest_1.vi.fn().mockReturnValue(false),
  getSelection: vitest_1.vi.fn().mockReturnValue(''),
  getSelectionPosition: vitest_1.vi.fn().mockReturnValue(undefined),
  refresh: vitest_1.vi.fn(),
  attachCustomKeyEventHandler: vitest_1.vi.fn(),
  attachCustomWheelEventHandler: vitest_1.vi.fn(),
  registerLinkProvider: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  registerCharacterJoiner: vitest_1.vi.fn().mockReturnValue(0),
  deregisterCharacterJoiner: vitest_1.vi.fn(),
  registerMarker: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  registerDecoration: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  loadAddon: vitest_1.vi.fn(),
  dispose: vitest_1.vi.fn(),
  element: null,
  textarea: null,
  rows: 24,
  cols: 80,
  buffer: {
    active: {
      type: 'normal',
      baseY: 0,
      length: 0,
      viewportY: 0,
      cursorX: 0,
      cursorY: 0,
      getLine: vitest_1.vi.fn().mockReturnValue(null),
    },
    alternate: {
      type: 'alternate',
      baseY: 0,
      length: 0,
      viewportY: 0,
      cursorX: 0,
      cursorY: 0,
      getLine: vitest_1.vi.fn().mockReturnValue(null),
    },
    normal: {
      type: 'normal',
      baseY: 0,
      length: 0,
      viewportY: 0,
      cursorX: 0,
      cursorY: 0,
      getLine: vitest_1.vi.fn().mockReturnValue(null),
    },
    onBufferChange: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  },
  options: {
    cursorBlink: false,
    cursorStyle: 'block',
    scrollback: 1000,
    tabStopWidth: 8,
    theme: {},
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 1,
    letterSpacing: 0,
    allowTransparency: false,
    bellStyle: 'none',
    cols: 80,
    rows: 24,
  },
  markers: [],
  unicode: {
    activeVersion: '11',
    versions: ['6', '11'],
  },
  parser: {
    registerCsiHandler: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerDcsHandler: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerEscHandler: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    registerOscHandler: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  },
  modes: {
    mouseTrackingMode: 'none',
    applicationCursorKeysMode: false,
    applicationKeypadMode: false,
    bracketedPasteMode: false,
    insertMode: false,
    originMode: false,
    reverseWraparoundMode: false,
    sendFocusMode: false,
    wraparoundMode: true,
  },
});
exports.createMockTerminal = createMockTerminal;
// Mock xterm.js Terminal class
vitest_1.vi.mock('@xterm/xterm', () => ({
  Terminal: vitest_1.vi.fn().mockImplementation(() => createMockTerminal()),
}));
// Mock xterm addons
vitest_1.vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
    fit: vitest_1.vi.fn(),
    proposeDimensions: vitest_1.vi.fn().mockReturnValue({ cols: 80, rows: 24 }),
  })),
}));
vitest_1.vi.mock('@xterm/addon-webgl', () => ({
  WebglAddon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
    onContextLoss: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
    clearTextureAtlas: vitest_1.vi.fn(),
  })),
}));
vitest_1.vi.mock('@xterm/addon-serialize', () => ({
  SerializeAddon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
    serialize: vitest_1.vi.fn().mockReturnValue(''),
    serializeAsHTML: vitest_1.vi.fn().mockReturnValue(''),
  })),
}));
vitest_1.vi.mock('@xterm/addon-search', () => ({
  SearchAddon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
    findNext: vitest_1.vi.fn().mockReturnValue(false),
    findPrevious: vitest_1.vi.fn().mockReturnValue(false),
    clearDecorations: vitest_1.vi.fn(),
    onDidChangeResults: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
  })),
}));
vitest_1.vi.mock('@xterm/addon-unicode11', () => ({
  Unicode11Addon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
  })),
}));
vitest_1.vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vitest_1.vi.fn().mockImplementation(() => ({
    activate: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
  })),
}));
// ============================================================================
// Console suppression to prevent EnvironmentTeardownError
// ============================================================================
// On CI (especially Windows), console output triggers onUserConsoleLog RPC calls
// that can still be pending when the vitest worker shuts down, causing
// "Closing rpc while onUserConsoleLog was pending" errors.
// Replacing console methods at module level ensures they stay suppressed
// even after vi.restoreAllMocks() in afterEach.
const noop = () => {};
console.log = noop;
console.debug = noop;
console.warn = noop;
console.info = noop;
// ============================================================================
// Global Test Hooks
// ============================================================================
// Reset mocks between tests
(0, vitest_1.beforeEach)(() => {
  vitest_1.vi.clearAllMocks();
});
(0, vitest_1.afterEach)(() => {
  vitest_1.vi.restoreAllMocks();
});
//# sourceMappingURL=setup.js.map
