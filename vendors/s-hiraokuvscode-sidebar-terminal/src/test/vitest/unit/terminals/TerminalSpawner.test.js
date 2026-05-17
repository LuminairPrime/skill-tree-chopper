'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const fs = require('fs');
const pty = require('node-pty');
const TerminalSpawner_1 = require('../../../../terminals/TerminalSpawner');
const constants_1 = require('../../../../constants');
// Mock dependencies
vitest_1.vi.mock('fs', () => ({
  statSync: vitest_1.vi.fn(),
  accessSync: vitest_1.vi.fn(),
  constants: {
    R_OK: 4,
    X_OK: 1,
  },
}));
vitest_1.vi.mock('node-pty', () => ({
  spawn: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../../../../utils/logger');
(0, vitest_1.describe)('TerminalSpawner', () => {
  let spawner;
  let mockPtyProcess;
  const defaultRequest = {
    terminalId: 'test-term',
    shell: '/bin/bash',
    shellArgs: ['-l'],
    cwd: '/users/test',
    env: { TEST_VAR: 'value' },
  };
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    spawner = new TerminalSpawner_1.TerminalSpawner();
    mockPtyProcess = {
      pid: 12345,
      onData: vitest_1.vi.fn(),
      onExit: vitest_1.vi.fn(),
      write: vitest_1.vi.fn(),
      resize: vitest_1.vi.fn(),
      kill: vitest_1.vi.fn(),
    };
    // Default mocks
    vitest_1.vi.mocked(pty.spawn).mockReturnValue(mockPtyProcess);
    // Mock fs.statSync and accessSync to simulate valid directories by default
    vitest_1.vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => true,
    });
    vitest_1.vi.mocked(fs.accessSync).mockReturnValue(undefined);
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.clearAllMocks();
  });
  (0, vitest_1.describe)('spawnTerminal', () => {
    (0, vitest_1.it)('should spawn a terminal with provided configuration', () => {
      const result = spawner.spawnTerminal(defaultRequest);
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledWith(
        defaultRequest.shell,
        defaultRequest.shellArgs,
        vitest_1.expect.objectContaining({
          cwd: defaultRequest.cwd,
          cols: constants_1.TERMINAL_CONSTANTS.DEFAULT_COLS,
          rows: constants_1.TERMINAL_CONSTANTS.DEFAULT_ROWS,
          name: 'xterm-256color',
        })
      );
      (0, vitest_1.expect)(result.ptyProcess).toBe(mockPtyProcess);
    });
    (0, vitest_1.it)('should build environment variables correctly', () => {
      spawner.spawnTerminal(defaultRequest);
      const spawnCall = vitest_1.vi.mocked(pty.spawn).mock.calls[0];
      const env = spawnCall[2].env;
      (0, vitest_1.expect)(env).toMatchObject({
        TEST_VAR: 'value',
        LANG: 'en_US.UTF-8',
        FORCE_COLOR: '1',
      });
    });
    (0, vitest_1.it)('should try fallback shells if primary shell fails', () => {
      // First call throws error
      vitest_1.vi.mocked(pty.spawn).mockImplementationOnce(() => {
        throw new Error('Shell not found');
      });
      // Second call returns process
      vitest_1.vi.mocked(pty.spawn).mockReturnValueOnce(mockPtyProcess);
      const request = { ...defaultRequest, shell: '/invalid/shell' };
      const result = spawner.spawnTerminal(request);
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledTimes(2);
      // @ts-expect-error - test mock type
      (0, vitest_1.expect)(vitest_1.vi.mocked(pty.spawn).mock.calls[0][0]).toBe('/invalid/shell');
      // Should fall back to one of the default shells (zsh, bash, sh)
      (0, vitest_1.expect)(['/bin/zsh', '/bin/bash', '/bin/sh']).toContain(
        vitest_1.vi.mocked(pty.spawn).mock.calls[1][0]
      );
      (0, vitest_1.expect)(result.ptyProcess).toBe(mockPtyProcess);
    });
    (0, vitest_1.it)('should skip inaccessible directories', () => {
      // Mock fs.statSync to fail for the requested cwd
      vitest_1.vi.mocked(fs.statSync).mockImplementation((path) => {
        if (path === defaultRequest.cwd) {
          throw new Error('Not found');
        }
        return { isDirectory: () => true };
      });
      // It should try other candidates like home or tmp
      const home = '/users/home';
      const env = { ...defaultRequest.env, HOME: home };
      spawner.spawnTerminal({ ...defaultRequest, env });
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledWith(
        vitest_1.expect.any(String),
        vitest_1.expect.any(Array),
        vitest_1.expect.objectContaining({
          cwd: vitest_1.expect.not.stringMatching(defaultRequest.cwd),
        })
      );
    });
    (0, vitest_1.it)('should fallback to home directory if requested cwd is invalid', () => {
      vitest_1.vi.mocked(fs.statSync).mockImplementation((path) => {
        if (path === defaultRequest.cwd) {
          throw new Error('Invalid');
        }
        return { isDirectory: () => true };
      });
      const home = '/users/home';
      spawner.spawnTerminal({ ...defaultRequest, env: { HOME: home } });
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledWith(
        vitest_1.expect.any(String),
        vitest_1.expect.any(Array),
        vitest_1.expect.objectContaining({
          cwd: home,
        })
      );
    });
    (0, vitest_1.it)('should throw error if all attempts fail', () => {
      vitest_1.vi.mocked(pty.spawn).mockImplementation(() => {
        throw new Error('Spawn failed');
      });
      (0, vitest_1.expect)(() => spawner.spawnTerminal(defaultRequest)).toThrow('Spawn failed');
    });
    (0, vitest_1.it)('should filter duplicate shells in candidates', () => {
      // Mock process.cwd to match defaultRequest.cwd so we only have 1 candidate CWD
      const originalCwd = process.cwd;
      // @ts-ignore
      process.cwd = vitest_1.vi.fn().mockReturnValue(defaultRequest.cwd);
      // If requested shell is same as fallback, shouldn't try twice
      const request = { ...defaultRequest, shell: '/bin/bash' }; // bash is also a fallback
      vitest_1.vi.mocked(pty.spawn).mockImplementation(() => {
        throw new Error('Fail');
      });
      try {
        spawner.spawnTerminal(request);
      } catch (e) {
        // Ignore error
      }
      const calls = vitest_1.vi.mocked(pty.spawn).mock.calls;
      const shellsTried = calls.map((c) => c[0]);
      const bashCount = shellsTried.filter((s) => s === '/bin/bash').length;
      (0, vitest_1.expect)(bashCount).toBe(1);
      // Restore
      process.cwd = originalCwd;
    });
    (0, vitest_1.it)('should include process.cwd in candidates if valid', () => {
      const originalCwd = process.cwd;
      const mockCwd = '/process/cwd';
      // @ts-ignore
      process.cwd = vitest_1.vi.fn().mockReturnValue(mockCwd);
      // Make requested cwd invalid
      vitest_1.vi.mocked(fs.statSync).mockImplementation((path) => {
        if (path === defaultRequest.cwd) {
          throw new Error('Invalid');
        }
        if (path === mockCwd) {
          return { isDirectory: () => true };
        }
        return { isDirectory: () => true };
      });
      spawner.spawnTerminal(defaultRequest);
      (0, vitest_1.expect)(pty.spawn).toHaveBeenCalledWith(
        vitest_1.expect.any(String),
        vitest_1.expect.any(Array),
        vitest_1.expect.objectContaining({
          cwd: mockCwd,
        })
      );
      // Restore
      process.cwd = originalCwd;
    });
  });
});
//# sourceMappingURL=TerminalSpawner.test.js.map
