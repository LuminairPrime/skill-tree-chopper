"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
// Import shared test setup
const FileReferenceCommand_1 = require("../../../../commands/FileReferenceCommand");
(0, vitest_1.describe)('FileReferenceCommand', () => {
    let fileReferenceCommand;
    let mockTerminalManager;
    let mockActiveEditor;
    let mockDocument;
    let mockSelection;
    class MockTabInputText {
        constructor(uri) {
            this.uri = uri;
        }
    }
    (0, vitest_1.beforeEach)(() => {
        // Mock TerminalManager
        mockTerminalManager = {
            hasActiveTerminal: vitest_1.vi.fn().mockReturnValue(true),
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            isTerminalFocused: vitest_1.vi.fn().mockReturnValue(false),
            getConnectedAgents: vitest_1.vi.fn().mockReturnValue([
                {
                    terminalId: 'terminal-1',
                    agentInfo: { type: 'claude' },
                },
            ]),
            getCurrentGloballyActiveAgent: vitest_1.vi.fn(),
            focusTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
            sendInput: vitest_1.vi.fn(),
            getTerminal: vitest_1.vi.fn().mockReturnValue({}),
            refreshCliAgentState: vitest_1.vi.fn().mockReturnValue(false),
        };
        // Create FileReferenceCommand instance
        fileReferenceCommand = new FileReferenceCommand_1.FileReferenceCommand(mockTerminalManager);
        // Mock VS Code workspace configuration
        const mockConfig = {
            get: vitest_1.vi.fn().mockReturnValue(true), // CLI Agent integration enabled
        };
        vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
        // Mock workspace folders
        vscode.workspace.workspaceFolders = [
            {
                uri: { fsPath: '/workspace/project' },
            },
        ];
        // Mock document
        mockDocument = {
            fileName: '/workspace/project/src/test.ts',
        };
        // Mock selection (empty by default)
        mockSelection = {
            isEmpty: true,
            start: { line: 0 },
            end: { line: 0 },
        };
        // Mock active editor
        mockActiveEditor = {
            document: mockDocument,
            selection: mockSelection,
        };
        vscode.window.activeTextEditor = mockActiveEditor;
        // Mock commands
        vscode.commands.executeCommand.mockResolvedValue(undefined);
        vscode.TabInputText = MockTabInputText;
        // Mock notifications
        vscode.window.showInformationMessage.mockResolvedValue(undefined);
        vscode.window.showWarningMessage.mockResolvedValue(undefined);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('getActiveFileInfo', () => {
        (0, vitest_1.it)('should return file info without selection when no text is selected', () => {
            const result = fileReferenceCommand.getActiveFileInfo();
            (0, vitest_1.expect)(result).toEqual({
                baseName: 'test.ts',
                fullPath: '/workspace/project/src/test.ts',
                relativePath: 'src/test.ts',
                selection: undefined,
            });
        });
        (0, vitest_1.it)('should return file info with single line selection', () => {
            // Mock single line selection (line 5)
            mockSelection.isEmpty = false;
            mockSelection.start = { line: 4 }; // 0-based
            mockSelection.end = { line: 4 }; // 0-based
            const result = fileReferenceCommand.getActiveFileInfo();
            (0, vitest_1.expect)(result).toEqual({
                baseName: 'test.ts',
                fullPath: '/workspace/project/src/test.ts',
                relativePath: 'src/test.ts',
                selection: {
                    startLine: 5, // 1-based
                    endLine: 5, // 1-based
                    hasSelection: true,
                },
            });
        });
        (0, vitest_1.it)('should return file info with multi-line selection', () => {
            // Mock multi-line selection (lines 3-7)
            mockSelection.isEmpty = false;
            mockSelection.start = { line: 2 }; // 0-based
            mockSelection.end = { line: 6 }; // 0-based
            const result = fileReferenceCommand.getActiveFileInfo();
            (0, vitest_1.expect)(result).toEqual({
                baseName: 'test.ts',
                fullPath: '/workspace/project/src/test.ts',
                relativePath: 'src/test.ts',
                selection: {
                    startLine: 3, // 1-based
                    endLine: 7, // 1-based
                    hasSelection: true,
                },
            });
        });
        (0, vitest_1.it)('should return null when no active editor', () => {
            vscode.window.activeTextEditor = null;
            const result = fileReferenceCommand.getActiveFileInfo();
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('formatFileReference', () => {
        (0, vitest_1.it)('should format file reference without line numbers when no selection', () => {
            const fileInfo = {
                relativePath: 'src/test.ts',
            };
            const result = fileReferenceCommand.formatFileReference(fileInfo);
            (0, vitest_1.expect)(result).toBe('@src/test.ts ');
        });
        (0, vitest_1.it)('should format file reference with single line number', () => {
            const fileInfo = {
                relativePath: 'src/test.ts',
                selection: {
                    startLine: 5,
                    endLine: 5,
                    hasSelection: true,
                },
            };
            const result = fileReferenceCommand.formatFileReference(fileInfo);
            (0, vitest_1.expect)(result).toBe('@src/test.ts#L5 ');
        });
        (0, vitest_1.it)('should format file reference with line range', () => {
            const fileInfo = {
                relativePath: 'src/test.ts',
                selection: {
                    startLine: 3,
                    endLine: 7,
                    hasSelection: true,
                },
            };
            const result = fileReferenceCommand.formatFileReference(fileInfo);
            (0, vitest_1.expect)(result).toBe('@src/test.ts#L3-L7 ');
        });
    });
    (0, vitest_1.describe)('handleSendAtMention', () => {
        (0, vitest_1.it)('should send file reference without line numbers when no selection', async () => {
            fileReferenceCommand.handleSendAtMention();
            // Verify that the correct text was sent
            await new Promise((resolve) => setTimeout(resolve, 200));
            (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts ', 'terminal-1');
        });
        (0, vitest_1.it)('should send file reference with line numbers when text is selected', async () => {
            // Mock selection
            mockSelection.isEmpty = false;
            mockSelection.start = { line: 2 }; // 0-based
            mockSelection.end = { line: 6 }; // 0-based
            fileReferenceCommand.handleSendAtMention();
            // Verify that the correct text with line range was sent
            await new Promise((resolve) => setTimeout(resolve, 200));
            (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts#L3-L7 ', 'terminal-1');
        });
        (0, vitest_1.it)('should show warning when no active editor', () => {
            vscode.window.activeTextEditor = null;
            fileReferenceCommand.handleSendAtMention();
            (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active file to mention. Please open a file first.');
        });
        (0, vitest_1.it)('should show warning when CLI Agent integration is disabled', () => {
            const mockConfig = {
                get: vitest_1.vi.fn().mockReturnValue(false), // CLI Agent integration disabled
            };
            vscode.workspace.getConfiguration.mockReturnValue(mockConfig);
            fileReferenceCommand.handleSendAtMention();
            (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith('File reference shortcuts are disabled. Enable them in Terminal Settings.');
        });
        (0, vitest_1.describe)('terminal focus behavior', () => {
            (0, vitest_1.it)('should send to focused terminal directly when terminal has focus, even without connected agent', async () => {
                // Terminal has focus, no connected agents
                mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(true);
                mockTerminalManager.getConnectedAgents.mockReturnValue([]);
                fileReferenceCommand.handleSendAtMention();
                await new Promise((resolve) => setTimeout(resolve, 200));
                // Should send to active terminal directly, not require connected agent
                (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts ', 'terminal-1');
            });
            (0, vitest_1.it)('should send to focused terminal (not connected agent terminal) when terminal has focus', async () => {
                // Terminal 2 has focus, agent is connected on terminal 1
                mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(true);
                mockTerminalManager.getActiveTerminalId.mockReturnValue('terminal-2');
                mockTerminalManager.getConnectedAgents.mockReturnValue([
                    { terminalId: 'terminal-1', agentInfo: { type: 'claude' } },
                ]);
                fileReferenceCommand.handleSendAtMention();
                await new Promise((resolve) => setTimeout(resolve, 200));
                // Should send to terminal-2 (focused), not terminal-1 (agent)
                (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts ', 'terminal-2');
            });
            (0, vitest_1.it)('should fall back to connected agent behavior when editor has focus', async () => {
                // Editor has focus (terminal not focused)
                mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
                mockTerminalManager.getConnectedAgents.mockReturnValue([
                    { terminalId: 'terminal-1', agentInfo: { type: 'claude' } },
                ]);
                fileReferenceCommand.handleSendAtMention();
                await new Promise((resolve) => setTimeout(resolve, 200));
                // Should use connected agent behavior
                (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts ', 'terminal-1');
            });
            (0, vitest_1.it)('should skip agents with stale terminalIds instead of falling back', () => {
                mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
                mockTerminalManager.getConnectedAgents.mockReturnValue([
                    { terminalId: 'stale-terminal', agentInfo: { type: 'claude' } },
                ]);
                mockTerminalManager.getTerminal = vitest_1.vi.fn().mockReturnValue(undefined);
                fileReferenceCommand.handleSendAtMention();
                (0, vitest_1.expect)(mockTerminalManager.sendInput).not.toHaveBeenCalled();
                (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith('CLI Agent terminals are no longer available. Please check agent status.');
            });
            (0, vitest_1.it)('should not focus the sidebar view before sending when editor has focus', async () => {
                mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
                mockTerminalManager.getConnectedAgents.mockReturnValue([
                    { terminalId: 'terminal-1', agentInfo: { type: 'claude' } },
                ]);
                fileReferenceCommand.handleSendAtMention();
                await new Promise((resolve) => setTimeout(resolve, 200));
                (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith('secondaryTerminal.focus');
                (0, vitest_1.expect)(mockTerminalManager.focusTerminal).not.toHaveBeenCalled();
                (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/test.ts ', 'terminal-1');
            });
        });
    });
    (0, vitest_1.describe)('handleSendAllOpenFiles', () => {
        (0, vitest_1.beforeEach)(() => {
            vscode.window.tabGroups = {
                all: [
                    {
                        tabs: [
                            {
                                input: new vscode.TabInputText(vscode.Uri.file('/workspace/project/src/a.ts')),
                            },
                            {
                                input: new vscode.TabInputText(vscode.Uri.file('/workspace/project/src/b.ts')),
                            },
                        ],
                    },
                ],
            };
        });
        (0, vitest_1.it)('should skip agents with stale terminalIds for sendAllOpenFiles', () => {
            mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
            mockTerminalManager.getConnectedAgents.mockReturnValue([
                { terminalId: 'stale-terminal', agentInfo: { type: 'claude' } },
            ]);
            mockTerminalManager.getTerminal = vitest_1.vi.fn().mockReturnValue(undefined);
            fileReferenceCommand.handleSendAllOpenFiles();
            (0, vitest_1.expect)(mockTerminalManager.sendInput).not.toHaveBeenCalled();
            (0, vitest_1.expect)(vscode.window.showWarningMessage).toHaveBeenCalledWith('CLI Agent terminals are no longer available. Please check agent status.');
        });
        (0, vitest_1.it)('should not focus the sidebar view before sending all open files when editor has focus', async () => {
            mockTerminalManager.isTerminalFocused = vitest_1.vi.fn().mockReturnValue(false);
            mockTerminalManager.getConnectedAgents.mockReturnValue([
                { terminalId: 'terminal-1', agentInfo: { type: 'claude' } },
            ]);
            fileReferenceCommand.handleSendAllOpenFiles();
            await new Promise((resolve) => setTimeout(resolve, 200));
            (0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalledWith('secondaryTerminal.focus');
            (0, vitest_1.expect)(mockTerminalManager.focusTerminal).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('@src/a.ts\n@src/b.ts ', 'terminal-1');
        });
    });
});
//# sourceMappingURL=FileReferenceCommand.test.js.map