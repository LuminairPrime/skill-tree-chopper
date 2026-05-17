'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalCommandQueue = void 0;
class TerminalCommandQueue {
  constructor() {
    this.queue = Promise.resolve();
  }
  enqueue(operation) {
    const run = this.queue.then(operation, operation);
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }
}
exports.TerminalCommandQueue = TerminalCommandQueue;
//# sourceMappingURL=TerminalCommandQueue.js.map
