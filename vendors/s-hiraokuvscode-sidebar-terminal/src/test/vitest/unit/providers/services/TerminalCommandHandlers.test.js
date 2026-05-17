'use strict';
/**
 * TerminalCommandHandlers Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
const TerminalCommandHandlers_1 = require('../../../../../providers/services/TerminalCommandHandlers');
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
  env: {
    clipboard: {
      readText: vitest_1.vi.fn().mockResolvedValue('clipboard content'),
      writeText: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
  },
  window: {
    showErrorMessage: vitest_1.vi.fn(),
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  provider: vitest_1.vi.fn(),
}));
// Mock UnifiedConfigurationService
const { mockUnifiedConfig } = vitest_1.vi.hoisted(() => ({
  mockUnifiedConfig: {
    getTerminalProfilesConfig: vitest_1.vi
      .fn()
      .mockReturnValue({ profiles: { linux: {} }, defaultProfiles: {} }),
    getWebViewFontSettings: vitest_1.vi.fn().mockReturnValue({ fontSize: 14 }),
  },
}));
vitest_1.vi.mock('../../../../../config/UnifiedConfigurationService', () => ({
  getUnifiedConfigurationService: vitest_1.vi.fn(() => mockUnifiedConfig),
}));
(0, vitest_1.describe)('TerminalCommandHandlers', () => {
  let handlers;
  let mockTerminalManager;
  let mockCommService;
  let mockLinkResolver;
  (0, vitest_1.beforeEach)(() => {
    mockTerminalManager = {
      getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('t1'),
      setActiveTerminal: vitest_1.vi.fn(),
      createTerminal: vitest_1.vi.fn().mockReturnValue('t-new'),
      getCurrentState: vitest_1.vi.fn().mockReturnValue({}),
      getTerminals: vitest_1.vi.fn().mockReturnValue([]),
      sendInput: vitest_1.vi.fn(),
      resize: vitest_1.vi.fn(),
      removeTerminal: vitest_1.vi.fn(),
      killTerminal: vitest_1.vi.fn().mockResolvedValue(undefined),
      reorderTerminals: vitest_1.vi.fn(),
      renameTerminal: vitest_1.vi.fn().mockReturnValue(true),
      updateTerminalHeader: vitest_1.vi.fn().mockReturnValue(true),
      getTerminal: vitest_1.vi.fn().mockReturnValue({ shellPath: '/bin/bash' }),
      switchAiAgentConnection: vitest_1.vi
        .fn()
        .mockReturnValue({ success: true, newStatus: 'connected' }),
    };
    mockCommService = {
      sendMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
    };
    mockLinkResolver = {
      handleOpenTerminalLink: vitest_1.vi.fn(),
    };
    handlers = new TerminalCommandHandlers_1.TerminalCommandHandlers({
      terminalManager: mockTerminalManager,
      communicationService: mockCommService,
      linkResolver: mockLinkResolver,
      getSplitDirection: () => 'vertical',
    });
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('Terminal Lifecycle Commands', () => {
    (0, vitest_1.it)('should handle focus terminal', async () => {
      await handlers.handleFocusTerminal({ command: 'focusTerminal', terminalId: 't2' });
      (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t2');
    });
    (0, vitest_1.it)('should handle create terminal', async () => {
      await handlers.handleCreateTerminal({ command: 'createTerminal' });
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should handle split terminal', () => {
      handlers.handleSplitTerminal({ command: 'splitTerminal', direction: 'horizontal' });
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          command: 'split',
          direction: 'horizontal',
        })
      );
    });
    (0, vitest_1.it)('should handle kill terminal', async () => {
      await handlers.handleKillTerminal({ command: 'killTerminal', terminalId: 't1' });
      (0, vitest_1.expect)(mockTerminalManager.killTerminal).toHaveBeenCalledWith('t1');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'terminalRemoved' })
      );
    });
  });
  (0, vitest_1.describe)('Terminal Interaction Commands', () => {
    (0, vitest_1.it)('should handle terminalInteraction switch-next', async () => {
      mockTerminalManager.getTerminals.mockReturnValue([{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
      mockTerminalManager.getActiveTerminalId.mockReturnValue('t1');
      await handlers.handleTerminalInteraction({
        command: 'terminalInteraction',
        type: 'switch-next',
        terminalId: 't1',
      });
      (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t2');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'focusTerminal', terminalId: 't2' })
      );
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should handle terminalInteraction switch-previous', async () => {
      mockTerminalManager.getTerminals.mockReturnValue([{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
      mockTerminalManager.getActiveTerminalId.mockReturnValue('t1');
      await handlers.handleTerminalInteraction({
        command: 'terminalInteraction',
        type: 'switch-previous',
        terminalId: 't1',
      });
      (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t3');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'focusTerminal', terminalId: 't3' })
      );
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should handle terminalInteraction create-terminal', async () => {
      await handlers.handleTerminalInteraction({
        command: 'terminalInteraction',
        type: 'create-terminal',
        terminalId: '',
      });
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).toHaveBeenCalled();
      (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t-new');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should handle terminalInteraction kill-terminal', async () => {
      mockTerminalManager.getActiveTerminalId.mockReturnValue('t1');
      await handlers.handleTerminalInteraction({
        command: 'terminalInteraction',
        type: 'kill-terminal',
        terminalId: 't1',
      });
      (0, vitest_1.expect)(mockTerminalManager.killTerminal).toHaveBeenCalledWith('t1');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'terminalRemoved', terminalId: 't1' })
      );
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)(
      'should use the active terminal when terminalInteraction kill-terminal omits terminalId',
      async () => {
        mockTerminalManager.getActiveTerminalId.mockReturnValue('t2');
        await handlers.handleTerminalInteraction({
          command: 'terminalInteraction',
          type: 'kill-terminal',
        });
        (0, vitest_1.expect)(mockTerminalManager.killTerminal).toHaveBeenCalledWith('t2');
        (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({ command: 'terminalRemoved', terminalId: 't2' })
        );
      }
    );
    (0, vitest_1.it)(
      'should fall back to message terminalId when active terminal is unavailable during navigation',
      async () => {
        mockTerminalManager.getTerminals.mockReturnValue([
          { id: 't1' },
          { id: 't2' },
          { id: 't3' },
        ]);
        mockTerminalManager.getActiveTerminalId.mockReturnValue(undefined);
        await handlers.handleTerminalInteraction({
          command: 'terminalInteraction',
          type: 'switch-next',
          terminalId: 't2',
        });
        (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).toHaveBeenCalledWith('t3');
        (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({ command: 'focusTerminal', terminalId: 't3' })
        );
      }
    );
    (0, vitest_1.it)('should ignore unsupported terminal interaction types', async () => {
      await handlers.handleTerminalInteraction({
        command: 'terminalInteraction',
        type: 'unsupported',
        terminalId: 't1',
      });
      (0, vitest_1.expect)(mockTerminalManager.createTerminal).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockTerminalManager.killTerminal).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockTerminalManager.setActiveTerminal).not.toHaveBeenCalled();
      (0, vitest_1.expect)(mockCommService.sendMessage).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle terminal input', () => {
      handlers.handleTerminalInput({ command: 'input', terminalId: 't1', data: 'ls\n' });
      (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith('ls\n', 't1');
    });
    (0, vitest_1.it)('should handle terminal resize', () => {
      handlers.handleTerminalResize({ command: 'resize', terminalId: 't1', cols: 100, rows: 30 });
      (0, vitest_1.expect)(mockTerminalManager.resize).toHaveBeenCalledWith(100, 30, 't1');
    });
    (0, vitest_1.it)('should handle reorder', async () => {
      // @ts-expect-error - test mock type
      await handlers.handleReorderTerminals({ command: 'reorder', order: ['t2', 't1'] });
      (0, vitest_1.expect)(mockTerminalManager.reorderTerminals).toHaveBeenCalledWith(['t2', 't1']);
    });
    (0, vitest_1.it)('should handle rename terminal and send state update', async () => {
      await handlers.handleRenameTerminal({
        command: 'renameTerminal',
        terminalId: 't1',
        newName: 'Renamed Terminal',
      });
      (0, vitest_1.expect)(mockTerminalManager.renameTerminal).toHaveBeenCalledWith(
        't1',
        'Renamed Terminal'
      );
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should ignore rename terminal with empty name', async () => {
      await handlers.handleRenameTerminal({
        command: 'renameTerminal',
        terminalId: 't1',
        newName: '   ',
      });
      (0, vitest_1.expect)(mockTerminalManager.renameTerminal).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle update terminal header with name and color', async () => {
      await handlers.handleUpdateTerminalHeader({
        command: 'updateTerminalHeader',
        terminalId: 't1',
        newName: 'Agent Terminal',
        indicatorColor: '#FF69B4',
      });
      (0, vitest_1.expect)(mockTerminalManager.updateTerminalHeader).toHaveBeenCalledWith('t1', {
        newName: 'Agent Terminal',
        indicatorColor: '#FF69B4',
      });
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)('should handle update terminal header with OFF indicator color', async () => {
      await handlers.handleUpdateTerminalHeader({
        command: 'updateTerminalHeader',
        terminalId: 't1',
        indicatorColor: 'transparent',
      });
      (0, vitest_1.expect)(mockTerminalManager.updateTerminalHeader).toHaveBeenCalledWith('t1', {
        indicatorColor: 'transparent',
      });
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'stateUpdate' })
      );
    });
    (0, vitest_1.it)(
      'should normalize lowercase hex indicator colors before updating terminal header',
      async () => {
        await handlers.handleUpdateTerminalHeader({
          command: 'updateTerminalHeader',
          terminalId: 't1',
          indicatorColor: '#ff69b4',
        });
        (0, vitest_1.expect)(mockTerminalManager.updateTerminalHeader).toHaveBeenCalledWith('t1', {
          indicatorColor: '#FF69B4',
        });
      }
    );
    (0, vitest_1.it)(
      'should fall back to renameTerminal when updateTerminalHeader is unavailable',
      async () => {
        delete mockTerminalManager.updateTerminalHeader;
        await handlers.handleUpdateTerminalHeader({
          command: 'updateTerminalHeader',
          terminalId: 't1',
          newName: '  Agent Terminal  ',
          indicatorColor: 'not-a-color',
        });
        (0, vitest_1.expect)(mockTerminalManager.renameTerminal).toHaveBeenCalledWith(
          't1',
          'Agent Terminal'
        );
        (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
          vitest_1.expect.objectContaining({ command: 'stateUpdate' })
        );
      }
    );
    (0, vitest_1.it)(
      'should ignore update terminal header when all provided updates are invalid',
      async () => {
        await handlers.handleUpdateTerminalHeader({
          command: 'updateTerminalHeader',
          terminalId: 't1',
          newName: '   ',
          indicatorColor: 'not-a-color',
        });
        (0, vitest_1.expect)(mockTerminalManager.updateTerminalHeader).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockTerminalManager.renameTerminal).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockCommService.sendMessage).not.toHaveBeenCalled();
      }
    );
  });
  (0, vitest_1.describe)('Clipboard Commands', () => {
    (0, vitest_1.it)('should handle clipboard request (paste)', async () => {
      // @ts-expect-error - test mock type
      await handlers.handleClipboardRequest({ command: 'paste', terminalId: 't1' });
      (0, vitest_1.expect)(vscode.env.clipboard.readText).toHaveBeenCalled();
      // Text is wrapped with bracketed paste mode escape sequences
      (0, vitest_1.expect)(mockTerminalManager.sendInput).toHaveBeenCalledWith(
        '\x1b[200~clipboard content\x1b[201~',
        't1'
      );
    });
    (0, vitest_1.it)('should handle copy to clipboard', async () => {
      // @ts-expect-error - test mock type
      await handlers.handleCopyToClipboard({ command: 'copy', text: 'selected text' });
      (0, vitest_1.expect)(vscode.env.clipboard.writeText).toHaveBeenCalledWith('selected text');
    });
  });
  (0, vitest_1.describe)('Other Commands', () => {
    (0, vitest_1.it)('should handle terminal link', async () => {
      const msg = { command: 'openLink', linkType: 'url', url: 'http://test.com' };
      await handlers.handleOpenTerminalLink(msg);
      (0, vitest_1.expect)(mockLinkResolver.handleOpenTerminalLink).toHaveBeenCalledWith(msg);
    });
    (0, vitest_1.it)('should handle AI agent switch', async () => {
      // @ts-expect-error - test mock type
      await handlers.handleSwitchAiAgent({ command: 'switchAgent', terminalId: 't1' });
      (0, vitest_1.expect)(mockTerminalManager.switchAiAgentConnection).toHaveBeenCalledWith('t1');
      (0, vitest_1.expect)(mockCommService.sendMessage).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({ command: 'switchAiAgentResponse' })
      );
    });
  });
});
//# sourceMappingURL=TerminalCommandHandlers.test.js.map
