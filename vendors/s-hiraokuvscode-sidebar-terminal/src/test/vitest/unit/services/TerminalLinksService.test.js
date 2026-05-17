'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// @vitest-environment node
const vitest_1 = require('vitest');
const TerminalLinksService_1 = require('../../../../services/TerminalLinksService');
// Mock vscode
const mocks = vitest_1.vi.hoisted(() => {
  const mockEventEmitter = {
    event: vitest_1.vi.fn(),
    fire: vitest_1.vi.fn(),
    dispose: vitest_1.vi.fn(),
  };
  const mockConfiguration = {
    get: vitest_1.vi.fn((key, defaultValue) => {
      if (key === 'terminal.integrated.allowedLinkSchemes')
        return ['http', 'https', 'file', 'mailto'];
      return defaultValue;
    }),
  };
  const mockWorkspace = {
    getConfiguration: vitest_1.vi.fn(() => mockConfiguration),
    onDidChangeConfiguration: vitest_1.vi.fn(() => ({ dispose: vitest_1.vi.fn() })),
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    openTextDocument: vitest_1.vi.fn().mockResolvedValue({}),
  };
  const mockEnv = {
    openExternal: vitest_1.vi.fn().mockResolvedValue(true),
  };
  const mockWindow = {
    showTextDocument: vitest_1.vi.fn().mockResolvedValue(true),
  };
  const mockCommands = {
    executeCommand: vitest_1.vi.fn().mockResolvedValue(true),
  };
  const mockUri = {
    parse: vitest_1.vi.fn((str) => ({ toString: () => str })),
    file: vitest_1.vi.fn((str) => ({ fsPath: str })),
  };
  return {
    mockEventEmitter,
    mockConfiguration,
    mockWorkspace,
    mockEnv,
    mockWindow,
    mockCommands,
    mockUri,
  };
});
vitest_1.vi.mock('vscode', () => ({
  EventEmitter: vitest_1.vi.fn(function () {
    return mocks.mockEventEmitter;
  }),
  workspace: mocks.mockWorkspace,
  env: mocks.mockEnv,
  window: mocks.mockWindow,
  commands: mocks.mockCommands,
  Uri: mocks.mockUri,
}));
// Mock fs
vitest_1.vi.mock('fs', () => ({
  promises: {
    stat: vitest_1.vi.fn().mockImplementation(async (path) => {
      if (typeof path === 'string' && (path.includes('file') || path.includes('folder'))) {
        return { isDirectory: () => path.includes('folder') };
      }
      throw new Error('File not found');
    }),
  },
}));
// Mock logger
vitest_1.vi.mock('../../../../utils/logger', () => ({
  terminal: vitest_1.vi.fn(),
}));
// Mock path
vitest_1.vi.mock('path', async () => {
  const actual = await vitest_1.vi.importActual('path');
  return {
    ...actual,
    isAbsolute: vitest_1.vi.fn((p) => p.startsWith('/')),
    resolve: vitest_1.vi.fn((...args) => args.join('/')),
  };
});
(0, vitest_1.describe)('TerminalLinksService', () => {
  let service;
  (0, vitest_1.beforeEach)(() => {
    service = new TerminalLinksService_1.TerminalLinksService();
    mocks.mockEventEmitter.fire.mockClear();
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
  });
  (0, vitest_1.describe)('detectLinks', () => {
    (0, vitest_1.it)('should detect web links', async () => {
      const links = await service.detectLinks('t1', 1, 'Check this https://example.com link');
      (0, vitest_1.expect)(links).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].type).toBe('url');
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].text).toBe('https://example.com');
    });
    (0, vitest_1.it)('should detect file links', async () => {
      const links = await service.detectLinks('t1', 1, 'File at /absolute/path/file');
      (0, vitest_1.expect)(links).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].type).toBe('file');
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].text).toBe('/absolute/path/file');
    });
    (0, vitest_1.it)('should detect email links', async () => {
      const links = await service.detectLinks('t1', 1, 'Mail to user@example.com');
      (0, vitest_1.expect)(links).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].type).toBe('email');
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].text).toBe('user@example.com');
    });
    (0, vitest_1.it)('should fire event when links detected', async () => {
      await service.detectLinks('t1', 1, 'https://example.com');
      (0, vitest_1.expect)(mocks.mockEventEmitter.fire).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          terminalId: 't1',
          links: vitest_1.expect.arrayContaining([
            vitest_1.expect.objectContaining({ type: 'url' }),
          ]),
        })
      );
    });
  });
  (0, vitest_1.describe)('activateLink', () => {
    (0, vitest_1.it)('should activate web link', async () => {
      const link = { type: 'url', text: 'https://example.com' };
      await service.activateLink(link);
      (0, vitest_1.expect)(mocks.mockEnv.openExternal).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should activate file link', async () => {
      const link = { type: 'file', activationData: { path: '/file.txt' } };
      await service.activateLink(link);
      (0, vitest_1.expect)(mocks.mockWorkspace.openTextDocument).toHaveBeenCalledWith('/file.txt');
      (0, vitest_1.expect)(mocks.mockWindow.showTextDocument).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should activate folder link', async () => {
      const link = { type: 'folder', activationData: { path: '/folder' } };
      await service.activateLink(link);
      (0, vitest_1.expect)(mocks.mockCommands.executeCommand).toHaveBeenCalledWith(
        'revealFileInOS',
        vitest_1.expect.anything()
      );
    });
    (0, vitest_1.it)('should activate email link', async () => {
      const link = { type: 'email', text: 'test@example.com' };
      await service.activateLink(link);
      (0, vitest_1.expect)(mocks.mockEnv.openExternal).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('custom providers', () => {
    (0, vitest_1.it)('should support custom link providers', async () => {
      const provider = {
        provideTerminalLinks: vitest_1.vi
          .fn()
          .mockResolvedValue([{ startIndex: 0, length: 5, tooltip: 'Custom' }]),
        handleTerminalLink: vitest_1.vi.fn(),
      };
      service.registerLinkProvider(provider);
      const links = await service.detectLinks('t1', 1, '12345');
      (0, vitest_1.expect)(links).toHaveLength(1);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(links[0].type).toBe('custom');
      (0, vitest_1.expect)(provider.provideTerminalLinks).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=TerminalLinksService.test.js.map
