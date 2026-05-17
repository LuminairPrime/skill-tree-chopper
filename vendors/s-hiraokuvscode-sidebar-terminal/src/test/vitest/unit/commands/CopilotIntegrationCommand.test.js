'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
// Import shared test setup
const CopilotIntegrationCommand_1 = require('../../../../commands/CopilotIntegrationCommand');
(0, vitest_1.describe)('CopilotIntegrationCommand', () => {
  let copilotIntegrationCommand;
  (0, vitest_1.beforeEach)(() => {
    // Create CopilotIntegrationCommand instance
    copilotIntegrationCommand = new CopilotIntegrationCommand_1.CopilotIntegrationCommand();
    // Mock VS Code workspace configuration
    const mockConfig = {
      get: vitest_1.vi.fn().mockReturnValue(true), // GitHub Copilot integration enabled by default
    };
    vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
    // Mock commands
    vscode.commands.executeCommand.mockResolvedValue(undefined);
    // Mock notifications
    vscode.window.showInformationMessage.mockResolvedValue(undefined);
    vscode.window.showErrorMessage.mockResolvedValue(undefined);
    vscode.window.showWarningMessage.mockResolvedValue(undefined);
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('handleActivateCopilot', () => {
    (0, vitest_1.beforeEach)(() => {
      // Mock workspace folders
      vscode.workspace.workspaceFolders = [
        {
          uri: { fsPath: '/workspace/project' },
        },
      ];
      // Mock active editor (no selection by default)
      const mockDocument = {
        fileName: '/workspace/project/src/test.ts',
      };
      const mockSelection = {
        isEmpty: true,
        start: { line: 0 },
        end: { line: 0 },
      };
      vscode.window.activeTextEditor = {
        document: mockDocument,
        selection: mockSelection,
      };
    });
    (0, vitest_1.it)(
      'should activate Copilot Chat and send file reference when file is open',
      () => {
        copilotIntegrationCommand.handleActivateCopilot();
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'workbench.action.chat.open',
          {
            query: '#file:src/test.ts  ',
            isPartialQuery: true,
          }
        );
      }
    );
    (0, vitest_1.it)(
      'should activate Copilot Chat without file reference when no file is open',
      () => {
        vscode.window.activeTextEditor = null;
        copilotIntegrationCommand.handleActivateCopilot();
        (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
          'workbench.action.chat.open'
        );
      }
    );
    (0, vitest_1.it)('should show information message when integration is disabled', () => {
      // Reset executeCommand spy to ensure clean state
      vscode.commands.executeCommand.mockClear();
      // Mock integration disabled
      const mockConfig = {
        get: vitest_1.vi.fn().mockReturnValue(false),
      };
      vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
      copilotIntegrationCommand.handleActivateCopilot();
      (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'GitHub Copilot integration is disabled. Enable it in Terminal Settings.'
      );
      (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle command execution errors gracefully', async () => {
      // Mock command failure
      vscode.commands.executeCommand.mockRejectedValue(new Error('Command failed'));
      // Should handle error gracefully without throwing
      await (0, vitest_1.expect)(
        copilotIntegrationCommand.handleActivateCopilot()
      ).resolves.not.toThrow();
      // Should show error message
      (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('formatCopilotFileReference', () => {
    (0, vitest_1.it)('should format file reference with #file: prefix', () => {
      const fileInfo = {
        relativePath: 'src/test.ts',
      };
      const result = copilotIntegrationCommand.formatCopilotFileReference(fileInfo);
      (0, vitest_1.expect)(result).toBe('#file:src/test.ts  ');
    });
    (0, vitest_1.it)('should format file reference with #file: prefix even with selection', () => {
      const fileInfo = {
        relativePath: 'src/test.ts',
        selection: {
          startLine: 5,
          endLine: 5,
          hasSelection: true,
        },
      };
      const result = copilotIntegrationCommand.formatCopilotFileReference(fileInfo);
      // Line numbers are not included in #file: format
      (0, vitest_1.expect)(result).toBe('#file:src/test.ts  ');
    });
    (0, vitest_1.it)(
      'should format file reference with #file: prefix for multi-line selection',
      () => {
        const fileInfo = {
          relativePath: 'src/test.ts',
          selection: {
            startLine: 3,
            endLine: 7,
            hasSelection: true,
          },
        };
        const result = copilotIntegrationCommand.formatCopilotFileReference(fileInfo);
        // Line numbers are not included in #file: format
        (0, vitest_1.expect)(result).toBe('#file:src/test.ts  ');
      }
    );
  });
  (0, vitest_1.describe)('isGitHubCopilotIntegrationEnabled', () => {
    (0, vitest_1.it)('should return true when setting is enabled', () => {
      const result = copilotIntegrationCommand.isGitHubCopilotIntegrationEnabled();
      (0, vitest_1.expect)(result).toBe(true);
    });
    (0, vitest_1.it)('should return false when setting is disabled', () => {
      const mockConfig = {
        get: vitest_1.vi.fn().mockReturnValue(false),
      };
      vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
      const result = copilotIntegrationCommand.isGitHubCopilotIntegrationEnabled();
      (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)('should return default value (true) when setting is not found', () => {
      const mockConfig = {
        get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => defaultValue),
      };
      vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
      const result = copilotIntegrationCommand.isGitHubCopilotIntegrationEnabled();
      (0, vitest_1.expect)(result).toBe(true); // Default value should be true
    });
  });
});
//# sourceMappingURL=CopilotIntegrationCommand.test.js.map
