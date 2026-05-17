'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalTest = void 0;
const BaseTest_1 = require('./BaseTest');
/**
 * Specialized base class for Terminal-related tests
 *
 * Features:
 * - Mock terminal creation
 * - Terminal data simulation
 * - Process lifecycle helpers
 * - Terminal state management
 *
 * Usage:
 * ```typescript
 * class MyTerminalTest extends TerminalTest {
 *   protected override setup(): void {
 *     super.setup();
 *     // Custom terminal setup
 *   }
 * }
 * ```
 */
class TerminalTest extends BaseTest_1.BaseTest {
  constructor() {
    super(...arguments);
    this.mockTerminals = new Map();
    this.nextTerminalId = 1;
  }
  setup() {
    super.setup();
  }
  teardown() {
    this.mockTerminals.clear();
    this.nextTerminalId = 1;
    super.teardown();
  }
  /**
   * Create a mock terminal
   */
  createMockTerminal(options) {
    const id = options?.id ?? this.nextTerminalId++;
    const name = options?.name ?? `Terminal ${id}`;
    const terminal = {
      id,
      name,
      number: id,
      cwd: options?.cwd ?? '/home/user',
      isActive: options?.isActive ?? false,
      processState: options?.processState ?? 'running',
      data: [],
      pty: this.createMockPty(),
      write: this.sandbox.stub(),
      clear: this.sandbox.stub(),
      dispose: this.sandbox.stub(),
      focus: this.sandbox.stub(),
      onData: this.sandbox.stub(),
      onExit: this.sandbox.stub(),
    };
    this.mockTerminals.set(id, terminal);
    return terminal;
  }
  /**
   * Create mock PTY (pseudo-terminal)
   */
  createMockPty() {
    return {
      onData: this.sandbox.stub(),
      onExit: this.sandbox.stub(),
      write: this.sandbox.stub(),
      resize: this.sandbox.stub(),
      kill: this.sandbox.stub(),
      pid: 12345,
    };
  }
  /**
   * Simulate terminal data output
   */
  simulateTerminalData(terminalId, data) {
    const terminal = this.mockTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    terminal.data.push(data);
    // Call onData handler if registered
    const onDataHandler = terminal.onData.getCall(0)?.args[0];
    if (onDataHandler) {
      onDataHandler(data);
    }
  }
  /**
   * Simulate terminal exit
   */
  simulateTerminalExit(terminalId, exitCode = 0) {
    const terminal = this.mockTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    terminal.processState = 'exited';
    // Call onExit handler if registered
    const onExitHandler = terminal.onExit.getCall(0)?.args[0];
    if (onExitHandler) {
      onExitHandler(exitCode);
    }
  }
  /**
   * Get all terminal data as string
   */
  getTerminalOutput(terminalId) {
    const terminal = this.mockTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    return terminal.data.join('');
  }
  /**
   * Clear terminal data
   */
  clearTerminalData(terminalId) {
    const terminal = this.mockTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    terminal.data = [];
  }
  /**
   * Assert terminal received data
   */
  assertTerminalReceivedData(terminalId, expectedData) {
    const output = this.getTerminalOutput(terminalId);
    if (typeof expectedData === 'string') {
      if (!output.includes(expectedData)) {
        throw new Error(
          `Expected terminal ${terminalId} to receive "${expectedData}", ` + `but got: "${output}"`
        );
      }
    } else {
      if (!expectedData.test(output)) {
        throw new Error(
          `Expected terminal ${terminalId} output to match ${expectedData}, ` +
            `but got: "${output}"`
        );
      }
    }
  }
  /**
   * Create terminal session data
   */
  createSessionData(terminalId) {
    const terminal = this.mockTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    return {
      id: terminal.id,
      name: terminal.name,
      number: terminal.number,
      cwd: terminal.cwd,
      scrollback: terminal.data,
      isActive: terminal.isActive,
      lastActivity: Date.now(),
    };
  }
  /**
   * Wait for terminal to be ready
   */
  async waitForTerminalReady(terminalId, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const terminal = this.mockTerminals.get(terminalId);
      if (terminal && terminal.processState === 'running') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Timeout waiting for terminal ${terminalId} to be ready`);
  }
}
exports.TerminalTest = TerminalTest;
//# sourceMappingURL=TerminalTest.js.map
