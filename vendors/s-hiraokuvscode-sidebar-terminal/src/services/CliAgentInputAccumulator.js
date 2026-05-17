'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CliAgentInputAccumulator = void 0;
class CliAgentInputAccumulator {
  constructor() {
    this.buffers = new Map();
  }
  consume(terminalId, chunk) {
    const submittedCommands = [];
    let sawInterrupt = false;
    let buffer = this.buffers.get(terminalId) ?? '';
    for (const char of chunk) {
      if (char === '\x03') {
        sawInterrupt = true;
        buffer = '';
        continue;
      }
      if (char === '\b' || char === '\x7f') {
        buffer = buffer.slice(0, -1);
        continue;
      }
      if (char === '\r' || char === '\n') {
        const submitted = buffer.trim();
        if (submitted) {
          submittedCommands.push(submitted);
        }
        buffer = '';
        continue;
      }
      buffer += char;
    }
    this.buffers.set(terminalId, buffer);
    return {
      submittedCommands,
      sawInterrupt,
    };
  }
  clear(terminalId) {
    this.buffers.delete(terminalId);
  }
}
exports.CliAgentInputAccumulator = CliAgentInputAccumulator;
//# sourceMappingURL=CliAgentInputAccumulator.js.map
