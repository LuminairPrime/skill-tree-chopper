'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const MessageRouter_1 = require('../../../../../services/MessageRouter');
const TerminalMessageHandlers_1 = require('../../../../../services/handlers/TerminalMessageHandlers');
const common_1 = require('../../../../../utils/common');
vitest_1.vi.mock('../../../../../utils/logger', () => ({
  log: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalMessageHandlers', () => {
  let dependencies;
  (0, vitest_1.beforeEach)(() => {
    dependencies = {
      terminalManager: {
        createTerminal: vitest_1.vi.fn().mockResolvedValue('terminal-2'),
        deleteTerminal: vitest_1.vi.fn().mockResolvedValue(true),
        sendInput: vitest_1.vi.fn(),
        resize: vitest_1.vi.fn(),
        focusTerminal: vitest_1.vi.fn(),
        getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
        getWorkingDirectory: vitest_1.vi.fn().mockResolvedValue('/tmp/worktree'),
      },
      persistenceService: {
        getLastSession: vitest_1.vi.fn().mockResolvedValue({ terminals: ['terminal-1'] }),
      },
      configService: {
        getCurrentSettings: vitest_1.vi.fn().mockReturnValue({ theme: 'light' }),
        updateSettings: vitest_1.vi.fn().mockResolvedValue(undefined),
      },
      notificationService: {
        showError: vitest_1.vi.fn(),
        showInfo: vitest_1.vi.fn(),
        showWarning: vitest_1.vi.fn(),
      },
    };
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    dependencies = null;
  });
  (0, vitest_1.it)('creates terminals with the requested options', async () => {
    // Given
    const handler = new TerminalMessageHandlers_1.CreateTerminalHandler(dependencies);
    // When
    await (0, vitest_1.expect)(
      handler.handle({
        profile: 'zsh',
        workingDirectory: '/workspace',
        environmentVariables: { FOO: 'bar' },
      })
    ).resolves.toEqual({ terminalId: 'terminal-2' });
    // Then
    (0, vitest_1.expect)(dependencies.terminalManager.createTerminal).toHaveBeenCalledWith({
      profile: 'zsh',
      workingDirectory: '/workspace',
      environmentVariables: { FOO: 'bar' },
    });
  });
  (0, vitest_1.it)('wraps create-terminal failures with handler context', async () => {
    // Given
    const handler = new TerminalMessageHandlers_1.CreateTerminalHandler(dependencies);
    vitest_1.vi
      .mocked(dependencies.terminalManager.createTerminal)
      .mockRejectedValueOnce(new Error('boom'));
    // When / Then
    await (0, vitest_1.expect)(handler.handle({})).rejects.toThrow(
      'Terminal creation failed: Error: boom'
    );
  });
  (0, vitest_1.it)('requires a terminal id before deleting', async () => {
    // Given
    const handler = new TerminalMessageHandlers_1.DeleteTerminalHandler(dependencies);
    const invokeWithPartialPayload = (data) => handler.handle(data);
    // When / Then
    await (0, vitest_1.expect)(invokeWithPartialPayload({})).rejects.toThrow(
      "Required field 'terminalId' is missing or null"
    );
  });
  (0, vitest_1.it)(
    'passes input and terminal id in the runtime order expected by terminalManager',
    () => {
      // Given
      const handler = new TerminalMessageHandlers_1.TerminalInputHandler(dependencies);
      // When
      (0, vitest_1.expect)(handler.handle({ terminalId: 'terminal-1', input: 'pwd' })).toEqual({
        success: true,
      });
      // Then
      (0, vitest_1.expect)(dependencies.terminalManager.sendInput).toHaveBeenCalledWith(
        'pwd',
        'terminal-1'
      );
    }
  );
  (0, vitest_1.it)('rejects resize requests with non-positive dimensions', () => {
    // Given
    const handler = new TerminalMessageHandlers_1.TerminalResizeHandler(dependencies);
    // When / Then
    (0, vitest_1.expect)(() =>
      handler.handle({
        terminalId: 'terminal-1',
        cols: 0,
        rows: 24,
      })
    ).toThrow('Invalid resize dimensions: cols and rows must be positive');
  });
  (0, vitest_1.it)('delegates valid resize requests to terminalManager', () => {
    // Given
    const handler = new TerminalMessageHandlers_1.TerminalResizeHandler(dependencies);
    // When
    (0, vitest_1.expect)(
      handler.handle({
        terminalId: 'terminal-1',
        cols: 120,
        rows: 30,
      })
    ).toEqual({ success: true });
    // Then
    (0, vitest_1.expect)(dependencies.terminalManager.resize).toHaveBeenCalledWith(
      120,
      30,
      'terminal-1'
    );
  });
  (0, vitest_1.it)('returns current settings through the settings handler', () => {
    // Given
    const handler = new TerminalMessageHandlers_1.GetSettingsHandler(dependencies);
    // When
    (0, vitest_1.expect)(handler.handle()).toEqual({ settings: { theme: 'light' } });
    // Then
    (0, vitest_1.expect)(dependencies.configService.getCurrentSettings).toHaveBeenCalledTimes(1);
  });
  (0, vitest_1.it)('wraps settings update errors', async () => {
    // Given
    const handler = new TerminalMessageHandlers_1.UpdateSettingsHandler(dependencies);
    vitest_1.vi
      .mocked(dependencies.configService.updateSettings)
      .mockRejectedValueOnce(new Error('nope'));
    // When / Then
    await (0, vitest_1.expect)(handler.handle({ settings: { theme: 'dark' } })).rejects.toThrow(
      'Settings update failed: Error: nope'
    );
  });
  (0, vitest_1.it)('returns persisted session data for restoration', async () => {
    // Given
    const handler = new TerminalMessageHandlers_1.SessionRestorationHandler(dependencies);
    // When / Then
    await (0, vitest_1.expect)(handler.handle()).resolves.toEqual({
      sessionData: { terminals: ['terminal-1'] },
    });
  });
  (0, vitest_1.it)(
    'uses the active terminal working directory when creating a split terminal',
    async () => {
      // Given
      const handler = new TerminalMessageHandlers_1.SplitTerminalHandler(dependencies);
      // When
      await (0, vitest_1.expect)(handler.handle({ direction: 'vertical' })).resolves.toEqual({
        terminalId: 'terminal-2',
      });
      // Then
      (0, vitest_1.expect)(dependencies.terminalManager.getWorkingDirectory).toHaveBeenCalledWith(
        'terminal-1'
      );
      (0, vitest_1.expect)(dependencies.terminalManager.createTerminal).toHaveBeenCalledWith({
        workingDirectory: '/tmp/worktree',
      });
    }
  );
  (0, vitest_1.it)(
    'falls back to safeProcessCwd when the active terminal cwd cannot be resolved',
    async () => {
      // Given
      const handler = new TerminalMessageHandlers_1.SplitTerminalHandler(dependencies);
      vitest_1.vi
        .mocked(dependencies.terminalManager.getWorkingDirectory)
        .mockRejectedValueOnce(new Error('cwd unavailable'));
      // When
      await handler.handle({});
      // Then
      (0, vitest_1.expect)(dependencies.terminalManager.createTerminal).toHaveBeenCalledWith({
        workingDirectory: (0, common_1.safeProcessCwd)(),
      });
    }
  );
  (0, vitest_1.it)('creates and registers the full handler set', () => {
    // Given
    const handlers =
      TerminalMessageHandlers_1.TerminalMessageHandlerFactory.createAllHandlers(dependencies);
    const router = MessageRouter_1.MessageRouterFactory.create({ enableLogging: false });
    // When / Then
    (0, vitest_1.expect)(Array.from(handlers.keys()).sort()).toEqual([
      'createTerminal',
      'deleteTerminal',
      'focusTerminal',
      'getSettings',
      'sessionRestore',
      'splitTerminal',
      'terminalInput',
      'terminalResize',
      'updateSettings',
    ]);
    // When
    TerminalMessageHandlers_1.TerminalMessageHandlerFactory.registerAllHandlers(
      router,
      dependencies
    );
    // Then
    (0, vitest_1.expect)(router.getRegisteredCommands().sort()).toEqual([
      'createTerminal',
      'deleteTerminal',
      'focusTerminal',
      'getSettings',
      'sessionRestore',
      'splitTerminal',
      'terminalInput',
      'terminalResize',
      'updateSettings',
    ]);
  });
});
//# sourceMappingURL=TerminalMessageHandlers.test.js.map
