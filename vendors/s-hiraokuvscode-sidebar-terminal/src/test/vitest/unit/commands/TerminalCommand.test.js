'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const TerminalCommand_1 = require('../../../../commands/TerminalCommand');
// Mock VS Code
vitest_1.vi.mock('vscode', () => ({
  window: {
    showWarningMessage: vitest_1.vi.fn(),
    showErrorMessage: vitest_1.vi.fn(),
    showInputBox: vitest_1.vi.fn().mockResolvedValue('user-input'),
  },
}));
vitest_1.vi.mock('../../../../utils/logger');
(0, vitest_1.describe)('TerminalCommand', () => {
  let command;
  let mockTerminalManager;
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    mockTerminalManager = {
      hasActiveTerminal: vitest_1.vi.fn().mockReturnValue(true),
      getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('term-1'),
      sendInput: vitest_1.vi.fn(),
    };
    command = new TerminalCommand_1.TerminalCommand(mockTerminalManager);
  });
  (0, vitest_1.describe)('handleSendToTerminal', () => {
    (0, vitest_1.it)('should send provided content directly', () => {
      command.handleSendToTerminal('echo hello');
      (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith(
        'echo hello',
        'term-1'
      );
    });
    (0, vitest_1.it)('should show input box if no content provided', async () => {
      // Create a promise that we can control
      let resolveInput;
      const inputPromise = new Promise((resolve) => {
        resolveInput = resolve;
      });
      vitest_1.vi.mocked(vscode.window.showInputBox).mockReturnValue(inputPromise);
      command.handleSendToTerminal();
      (0, vitest_1.expect)(vscode.window.showInputBox).toHaveBeenCalled();
      // Resolve the promise
      resolveInput('user-input');
      // Wait for .then() to execute
      await Promise.resolve();
      await Promise.resolve(); // extra tick just in case
      (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith(
        'user-input',
        'term-1'
      );
    });
    (0, vitest_1.it)('should show warning if no active terminal', () => {
      mockTerminalManager.hasActiveTerminal.mockReturnValue(false);
      command.handleSendToTerminal('hello');
      (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalled();
      (0, vitest_1.expect)(mockTerminalManager.sendInput).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle errors gracefully', () => {
      mockTerminalManager.sendInput.mockImplementation(() => {
        throw new Error('Send failed');
      });
      command.handleSendToTerminal('hello');
      (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        vitest_1.expect.stringContaining('Send failed')
      );
    });
  });
});
//# sourceMappingURL=TerminalCommand.test.js.map
