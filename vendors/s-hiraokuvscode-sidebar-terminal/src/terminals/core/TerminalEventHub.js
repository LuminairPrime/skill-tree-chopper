'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalEventHub = void 0;
const vscode = require('vscode');
class TerminalEventHub {
  constructor() {
    this.dataEmitter = new vscode.EventEmitter();
    this.exitEmitter = new vscode.EventEmitter();
    this.createdEmitter = new vscode.EventEmitter();
    this.removedEmitter = new vscode.EventEmitter();
    this.stateUpdateEmitter = new vscode.EventEmitter();
    this.focusEmitter = new vscode.EventEmitter();
    this.onData = this.dataEmitter.event;
    this.onExit = this.exitEmitter.event;
    this.onTerminalCreated = this.createdEmitter.event;
    this.onTerminalRemoved = this.removedEmitter.event;
    this.onStateUpdate = this.stateUpdateEmitter.event;
    this.onTerminalFocus = this.focusEmitter.event;
  }
  get onOutput() {
    return this.ensureOutputEmitter().event;
  }
  fireData(event) {
    this.dataEmitter.fire(event);
  }
  fireExit(event) {
    this.exitEmitter.fire(event);
  }
  fireTerminalCreated(terminal) {
    this.createdEmitter.fire(terminal);
  }
  fireTerminalRemoved(terminalId) {
    this.removedEmitter.fire(terminalId);
  }
  fireStateUpdate(state) {
    this.stateUpdateEmitter.fire(state);
  }
  fireTerminalFocus(terminalId) {
    this.focusEmitter.fire(terminalId);
  }
  fireOutput(event) {
    this.outputEmitter?.fire(event);
  }
  dispose() {
    this.dataEmitter.dispose();
    this.exitEmitter.dispose();
    this.createdEmitter.dispose();
    this.removedEmitter.dispose();
    this.stateUpdateEmitter.dispose();
    this.focusEmitter.dispose();
    this.outputEmitter?.dispose();
  }
  ensureOutputEmitter() {
    if (!this.outputEmitter) {
      this.outputEmitter = new vscode.EventEmitter();
    }
    return this.outputEmitter;
  }
}
exports.TerminalEventHub = TerminalEventHub;
//# sourceMappingURL=TerminalEventHub.js.map
