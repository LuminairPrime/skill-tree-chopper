'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalLifecycleService = void 0;
const TerminalCommandQueue_1 = require('./TerminalCommandQueue');
class TerminalLifecycleService {
  constructor() {
    this.queue = new TerminalCommandQueue_1.TerminalCommandQueue();
    this.terminalsBeingKilled = new Set();
  }
  enqueue(operation) {
    return this.queue.enqueue(operation);
  }
  markBeingKilled(terminalId) {
    this.terminalsBeingKilled.add(terminalId);
  }
  unmarkBeingKilled(terminalId) {
    this.terminalsBeingKilled.delete(terminalId);
  }
  isBeingKilled(terminalId) {
    return this.terminalsBeingKilled.has(terminalId);
  }
  clear() {
    this.terminalsBeingKilled.clear();
  }
}
exports.TerminalLifecycleService = TerminalLifecycleService;
//# sourceMappingURL=TerminalLifecycleService.js.map
