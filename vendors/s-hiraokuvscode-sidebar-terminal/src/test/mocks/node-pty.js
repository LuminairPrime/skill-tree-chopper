'use strict';
/**
 * Mock implementation of node-pty for testing environments
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.MockPty = void 0;
exports.spawn = spawn;
class MockDisposable {
  dispose() {
    // Mock implementation
  }
}
class MockPty {
  constructor() {
    this.pid = 1234;
    this.cols = 80;
    this.rows = 24;
    this.process = 'bash';
    this.handleFlowControl = false;
    this.onData = (listener) => {
      this.dataCallback = listener;
      return new MockDisposable();
    };
    this.onExit = (listener) => {
      this.exitCallback = listener;
      return new MockDisposable();
    };
  }
  on(event, listener) {
    if (event === 'data') {
      this.dataCallback = listener;
    } else if (event === 'exit') {
      const exitListener = listener;
      this.exitCallback = (e) => exitListener(e.exitCode, e.signal);
    }
  }
  write(data) {
    // Echo back for testing
    if (this.dataCallback) {
      this.dataCallback(data);
    }
  }
  resize(cols, rows) {
    // Override readonly properties for testing
    Object.defineProperty(this, 'cols', { value: cols });
    Object.defineProperty(this, 'rows', { value: rows });
  }
  kill(_signal) {
    if (this.exitCallback) {
      this.exitCallback({ exitCode: 0 });
    }
  }
  clear() {
    // Mock implementation
  }
  pause() {
    // Mock implementation
  }
  resume() {
    // Mock implementation
  }
}
exports.MockPty = MockPty;
function spawn(_file, _args, _options) {
  return new MockPty();
}
// CommonJS compatibility
module.exports = {
  spawn,
  IPty: MockPty,
  IWindowsPtyForkOptions: {},
  IUnixForkOptions: {},
};
//# sourceMappingURL=node-pty.js.map
