'use strict';
/**
 * TerminalDataBufferManager Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const TerminalDataBufferManager_1 = require('../../../../terminals/TerminalDataBufferManager');
(0, vitest_1.describe)('TerminalDataBufferManager', () => {
  (0, vitest_1.it)('strips CSI 3 J (erase scrollback) even when split across chunks', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      detectFromOutput: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    const received = [];
    const sub = emitter.event((e) => received.push(e));
    bufferManager.bufferData('terminal-1', '\u001b[');
    bufferManager.bufferData('terminal-1', '3Jhello');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(received).toHaveLength(1);
    (0, vitest_1.expect)(received[0]?.data).toBe('hello');
    sub.dispose();
    bufferManager.dispose();
  });
  (0, vitest_1.it)('does not strip other CSI erase sequences (e.g. CSI 2 J)', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      detectFromOutput: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    const received = [];
    const sub = emitter.event((e) => received.push(e));
    bufferManager.bufferData('terminal-1', '\u001b[2Jhi');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(received).toHaveLength(1);
    (0, vitest_1.expect)(received[0]?.data).toBe('\u001b[2Jhi');
    sub.dispose();
    bufferManager.dispose();
  });
  (0, vitest_1.it)('preserves non-CSI ESC sequences across chunk boundaries', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      detectFromOutput: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    const received = [];
    const sub = emitter.event((e) => received.push(e));
    bufferManager.bufferData('terminal-1', '\u001b');
    bufferManager.bufferData('terminal-1', 'X');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(received).toHaveLength(1);
    (0, vitest_1.expect)(received[0]?.data).toBe('\u001bX');
    sub.dispose();
    bufferManager.dispose();
  });
  (0, vitest_1.it)('runs termination detection when an agent is active', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      handleOutputChunk: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    bufferManager.bufferData('terminal-1', 'user@host:~$ ');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(cliAgentService.handleOutputChunk).toHaveBeenCalledWith(
      'terminal-1',
      'user@host:~$ '
    );
    bufferManager.dispose();
  });
  (0, vitest_1.it)('skips termination detection when no agent is active', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      handleOutputChunk: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    bufferManager.bufferData('terminal-1', 'plain shell output');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(cliAgentService.handleOutputChunk).toHaveBeenCalledWith(
      'terminal-1',
      'plain shell output'
    );
    bufferManager.dispose();
  });
  (0, vitest_1.it)('calls cli agent methods with service binding intact', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    class BoundCliService {
      constructor() {
        this.handleOutputChunk = vitest_1.vi.fn((id, data) => {
          return { id, data };
        });
      }
      getAgentState() {
        return { status: 'connected', agentType: 'claude' };
      }
    }
    const cliAgentService = new BoundCliService();
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    bufferManager.bufferData('terminal-1', 'user@host:~$ ');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(cliAgentService.handleOutputChunk).toHaveBeenCalledWith(
      'terminal-1',
      'user@host:~$ '
    );
    bufferManager.dispose();
  });
  (0, vitest_1.it)('delegates each flush to a single handleOutputChunk call', () => {
    const terminals = new Map();
    terminals.set('terminal-1', { id: 'terminal-1', name: 'Terminal 1' });
    const emitter = new vscode.EventEmitter();
    const cliAgentService = {
      handleOutputChunk: vitest_1.vi.fn(),
    };
    const bufferManager = new TerminalDataBufferManager_1.TerminalDataBufferManager(
      terminals,
      emitter,
      cliAgentService
    );
    bufferManager.bufferData('terminal-1', 'Gemini CLI v0.1.0\r\ngemini > ');
    bufferManager.flushBuffer('terminal-1');
    (0, vitest_1.expect)(cliAgentService.handleOutputChunk).toHaveBeenCalledTimes(1);
    (0, vitest_1.expect)(cliAgentService.handleOutputChunk).toHaveBeenCalledWith(
      'terminal-1',
      'Gemini CLI v0.1.0\r\ngemini > '
    );
    bufferManager.dispose();
  });
});
//# sourceMappingURL=TerminalDataBufferManager.test.js.map
