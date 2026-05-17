'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalSpawner = void 0;
const fs = require('fs');
const pty = require('node-pty');
const constants_1 = require('../constants');
const logger_1 = require('../utils/logger');
/**
 * Lightweight helper responsible only for spawning PTY processes.
 * Keeps TerminalManager focused on orchestration and event wiring.
 */
class TerminalSpawner {
  spawnTerminal(request) {
    const env = this.buildSpawnEnv(request.env);
    const candidateCwds = this.getCandidateWorkingDirectories(request.cwd, env.HOME);
    const attemptedShells = this.getCandidateShells(request.shell);
    let lastError = null;
    for (const cwd of candidateCwds) {
      if (!this.isDirectoryAccessible(cwd)) {
        (0, logger_1.terminal)(`⚠️ [SPAWNER] Skipping inaccessible cwd candidate: ${cwd}`);
        continue;
      }
      for (const shell of attemptedShells) {
        try {
          (0, logger_1.terminal)(
            `🔧 [SPAWNER] Attempting PTY spawn for ${request.terminalId} (shell=${shell}, cwd=${cwd})`
          );
          const ptyProcess = pty.spawn(shell, request.shellArgs, {
            name: 'xterm-256color',
            cols: constants_1.TERMINAL_CONSTANTS.DEFAULT_COLS,
            rows: constants_1.TERMINAL_CONSTANTS.DEFAULT_ROWS,
            cwd,
            env,
          });
          (0, logger_1.terminal)(
            `✅ [SPAWNER] PTY spawned successfully for ${request.terminalId} (pid=${ptyProcess.pid}, shell=${shell}, cwd=${cwd})`
          );
          return { ptyProcess };
        } catch (error) {
          lastError = error;
          const err = error;
          (0, logger_1.terminal)(
            `❌ [SPAWNER] PTY spawn failed for shell=${shell} cwd=${cwd}: ${err?.message || error}`
          );
          // Try next fallback shell/cwd
        }
      }
    }
    (0, logger_1.terminal)('❌ [SPAWNER] All spawn attempts failed. Throwing last error.');
    throw lastError ?? new Error('Failed to spawn PTY process');
  }
  buildSpawnEnv(baseEnv) {
    return {
      ...baseEnv,
      LANG: baseEnv.LANG || 'en_US.UTF-8',
      LC_ALL: baseEnv.LC_ALL || 'en_US.UTF-8',
      LC_CTYPE: baseEnv.LC_CTYPE || 'en_US.UTF-8',
      TERM: baseEnv.TERM || 'xterm-256color',
      COLORTERM: baseEnv.COLORTERM || 'truecolor',
      // Force interactive shell behavior and prompt display
      PS1: baseEnv.PS1 || '$ ',
      FORCE_COLOR: '1',
      // Ensure shell reads initialization files
      ...(baseEnv.BASH_ENV && { BASH_ENV: baseEnv.BASH_ENV }),
      ...(baseEnv.ENV && { ENV: baseEnv.ENV }),
    };
  }
  getCandidateShells(primaryShell) {
    const fallbacks = ['/bin/zsh', '/bin/bash', '/bin/sh'];
    const candidates = [primaryShell, ...fallbacks];
    const seen = new Set();
    return candidates.filter((shellPath) => {
      if (!shellPath) {
        return false;
      }
      const normalized = shellPath.trim();
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }
  getCandidateWorkingDirectories(requestedCwd, home) {
    const candidates = [requestedCwd];
    if (home) {
      candidates.push(home);
    }
    // Only add process.cwd() if it's not root directory
    const currentCwd = process.cwd();
    if (currentCwd && currentCwd !== '/') {
      candidates.push(currentCwd);
    }
    // Add home directory as last fallback if available
    if (home && !candidates.includes(home)) {
      candidates.push(home);
    }
    // Ensure we have at least one valid directory (fallback to /tmp)
    if (candidates.filter((c) => !!c).length === 0) {
      candidates.push('/tmp');
    }
    return candidates.filter((cwd, index, arr) => !!cwd && arr.indexOf(cwd) === index);
  }
  isDirectoryAccessible(dirPath) {
    try {
      const stat = fs.statSync(dirPath);
      if (!stat.isDirectory()) {
        return false;
      }
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
}
exports.TerminalSpawner = TerminalSpawner;
//# sourceMappingURL=TerminalSpawner.js.map
