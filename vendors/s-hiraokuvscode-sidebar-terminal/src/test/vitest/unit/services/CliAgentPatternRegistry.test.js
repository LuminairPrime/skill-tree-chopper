'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const CliAgentPatternRegistry_1 = require('../../../../services/CliAgentPatternRegistry');
(0, vitest_1.describe)('CliAgentPatternRegistry', () => {
  let registry;
  (0, vitest_1.beforeEach)(() => {
    registry = new CliAgentPatternRegistry_1.CliAgentPatternRegistry();
  });
  (0, vitest_1.describe)('matchCommandInput', () => {
    (0, vitest_1.it)('should match claude commands', () => {
      (0, vitest_1.expect)(registry.matchCommandInput('claude')).toBe('claude');
      (0, vitest_1.expect)(registry.matchCommandInput('claude code')).toBe('claude');
    });
    (0, vitest_1.it)('should match gemini commands', () => {
      (0, vitest_1.expect)(registry.matchCommandInput('gemini')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchCommandInput('gemini help')).toBe('gemini');
    });
    (0, vitest_1.it)('should match codex/opencode/copilot commands', () => {
      (0, vitest_1.expect)(registry.matchCommandInput('codex')).toBe('codex');
      (0, vitest_1.expect)(registry.matchCommandInput('opencode')).toBe('opencode');
      (0, vitest_1.expect)(registry.matchCommandInput('gh copilot suggest')).toBe('copilot');
    });
    (0, vitest_1.it)('should match wrapper commands and env-prefixed commands', () => {
      (0, vitest_1.expect)(registry.matchCommandInput('FOO=1 codex --help')).toBe('codex');
      (0, vitest_1.expect)(registry.matchCommandInput('npx @openai/codex@latest')).toBe('codex');
      (0, vitest_1.expect)(registry.matchCommandInput('pnpm dlx @google/gemini-cli')).toBe(
        'gemini'
      );
      (0, vitest_1.expect)(registry.matchCommandInput('yarn dlx @anthropic-ai/claude-code')).toBe(
        'claude'
      );
      (0, vitest_1.expect)(registry.matchCommandInput('bunx opencode')).toBe('opencode');
    });
    (0, vitest_1.it)('should return null for normal shell commands', () => {
      (0, vitest_1.expect)(registry.matchCommandInput('ls -la')).toBeNull();
      (0, vitest_1.expect)(registry.matchCommandInput('cat file.txt')).toBeNull();
    });
  });
  (0, vitest_1.describe)('matchStartupOutput', () => {
    (0, vitest_1.it)('should match Claude startup messages', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Welcome to Claude Code!')).toBe('claude');
      (0, vitest_1.expect)(registry.matchStartupOutput('Running Claude Code v1.0')).toBe('claude');
    });
    (0, vitest_1.it)('should match Gemini startup messages', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Welcome to Gemini')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchStartupOutput('Gemini model initialized')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchStartupOutput('gemini mcp')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchStartupOutput('gemini skills')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchStartupOutput('gemini extensions')).toBe('gemini');
      (0, vitest_1.expect)(registry.matchStartupOutput('gemini hooks')).toBe('gemini');
    });
    (0, vitest_1.it)('should match GitHub Copilot startup banner with version', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('GitHub Copilot v0.0.406')).toBe('copilot');
      (0, vitest_1.expect)(registry.matchStartupOutput('GitHub Copilot v1.2.3')).toBe('copilot');
    });
    (0, vitest_1.it)('should match GitHub Copilot CLI startup message', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Welcome to GitHub Copilot CLI')).toBe(
        'copilot'
      );
    });
    (0, vitest_1.it)('should not match plain agent command text as startup output', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('opencode')).toBeNull();
      (0, vitest_1.expect)(registry.matchStartupOutput('copilot')).toBeNull();
    });
    (0, vitest_1.it)('should not detect legacy OpenCode welcome banners as startup output', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Welcome to OpenCode')).toBeNull();
      (0, vitest_1.expect)(registry.matchStartupOutput('OpenCode CLI')).toBeNull();
    });
    (0, vitest_1.it)('should match Claude Code version header regardless of version', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Claude Code v2.1.32')).toBe('claude');
      (0, vitest_1.expect)(registry.matchStartupOutput('Claude Code v3.0.0')).toBe('claude');
      (0, vitest_1.expect)(registry.matchStartupOutput('Claude Code v99.0.0-beta')).toBe('claude');
    });
    (0, vitest_1.it)('should match Claude Code fixed TUI text', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('Tips for getting started')).toBe('claude');
    });
    (0, vitest_1.it)('should not match variable user-specific text as Claude startup', () => {
      // These are variable and should NOT be used as detection patterns
      (0, vitest_1.expect)(registry.matchStartupOutput('Welcome back Hiraoku!')).toBeNull();
      (0, vitest_1.expect)(registry.matchStartupOutput('Opus 4.6 · Claude Max')).toBeNull();
    });
    (0, vitest_1.it)('should match OpenCode Zen mode text', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('OpenCode Zen')).toBe('opencode');
    });
    (0, vitest_1.it)('should match OpenCode Base mode text', () => {
      (0, vitest_1.expect)(registry.matchStartupOutput('OpenCode Base')).toBe('opencode');
    });
  });
  (0, vitest_1.describe)('isAgentActivity', () => {
    (0, vitest_1.it)('should detect activity by known agent keywords', () => {
      (0, vitest_1.expect)(registry.isAgentActivity('Claude is thinking about the fix')).toBe(true);
      (0, vitest_1.expect)(registry.isAgentActivity('Gemini generated a response')).toBe(true);
    });
    (0, vitest_1.it)('should not treat generic long text as agent activity', () => {
      (0, vitest_1.expect)(
        registry.isAgentActivity(
          'This output is very long but does not include any known agent keywords and should not count as agent activity'
        )
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('isShellPrompt', () => {
    (0, vitest_1.it)('should match standard bash/zsh prompts', () => {
      (0, vitest_1.expect)(registry.isShellPrompt('user@host:~$ ')).toBe(true);
      (0, vitest_1.expect)(registry.isShellPrompt('user@host /path % ')).toBe(true);
    });
    (0, vitest_1.it)('should match modern prompt symbols', () => {
      (0, vitest_1.expect)(registry.isShellPrompt('❯ ')).toBe(true);
      (0, vitest_1.expect)(registry.isShellPrompt('➜ ~ ')).toBe(true);
    });
    (0, vitest_1.it)('should match powerline/starship style prompts', () => {
      (0, vitest_1.expect)(registry.isShellPrompt('❯ [main] ')).toBe(true);
      (0, vitest_1.expect)(registry.isShellPrompt('➜ myproject git:(main) ✗ ')).toBe(true);
    });
    (0, vitest_1.it)('should return false for long output lines', () => {
      (0, vitest_1.expect)(
        registry.isShellPrompt(
          'This is a very long line that clearly is not a prompt even if it has $ in it'
        )
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('isTerminationPattern', () => {
    (0, vitest_1.describe)('should detect real agent termination output', () => {
      (0, vitest_1.it)('should detect Claude process completion', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('[Process completed]')).toBe(true);
      });
      (0, vitest_1.it)('should detect process exit with code', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('[process exited with code 0]')).toBe(
          true
        );
        (0, vitest_1.expect)(registry.isTerminationPattern('[process exited with code 130]')).toBe(
          true
        );
      });
      (0, vitest_1.it)('should detect Gemini farewell message', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('Agent powering down. Goodbye!')).toBe(
          true
        );
      });
      (0, vitest_1.it)('should detect command not found errors', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('command not found: claude')).toBe(true);
        (0, vitest_1.expect)(registry.isTerminationPattern('command not found: gemini')).toBe(true);
        (0, vitest_1.expect)(registry.isTerminationPattern('command not found: codex')).toBe(true);
        (0, vitest_1.expect)(registry.isTerminationPattern('command not found: copilot')).toBe(
          true
        );
        (0, vitest_1.expect)(registry.isTerminationPattern('command not found: opencode')).toBe(
          true
        );
      });
    });
    (0, vitest_1.describe)('should NOT false-positive on generic words', () => {
      (0, vitest_1.it)('should not detect bare exit/quit/goodbye/bye', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('exit')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('quit')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('goodbye')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('bye')).toBe(false);
      });
      (0, vitest_1.it)('should not detect conversational goodbye messages', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('Goodbye! Have a great day!')).toBe(
          false
        );
      });
      (0, vitest_1.it)('should not detect exit in explanatory text', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('You can exit the program by...')).toBe(
          false
        );
      });
      (0, vitest_1.it)('should not detect fictional session-ended patterns', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('session ended')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('goodbye claude')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('goodbye gemini')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('exiting claude')).toBe(false);
        (0, vitest_1.expect)(registry.isTerminationPattern('claude exited')).toBe(false);
      });
    });
    (0, vitest_1.describe)('should still detect crash indicators', () => {
      (0, vitest_1.it)('should detect segmentation fault', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('segmentation fault')).toBe(true);
      });
      (0, vitest_1.it)('should detect fatal error out of memory', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('FATAL ERROR: out of memory')).toBe(
          true
        );
      });
      (0, vitest_1.it)('should detect core dumped', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('core dumped')).toBe(true);
      });
      (0, vitest_1.it)('should detect panic', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('panic: runtime error')).toBe(true);
      });
    });
    (0, vitest_1.describe)('should not false-positive on broad crash indicators', () => {
      (0, vitest_1.it)('should not detect killed in normal output', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('The process killed the zombie')).toBe(
          false
        );
      });
      (0, vitest_1.it)('should not detect signal in normal output', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('The signal was received')).toBe(false);
      });
      (0, vitest_1.it)('should not detect exception in normal output', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('Handle the exception gracefully')).toBe(
          false
        );
      });
      (0, vitest_1.it)('should not detect abort in normal output', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('abort the mission')).toBe(false);
      });
    });
    (0, vitest_1.describe)('should detect agent-specific termination patterns', () => {
      (0, vitest_1.it)('should detect Claude termination with agent type', () => {
        (0, vitest_1.expect)(registry.isTerminationPattern('[Process completed]', 'claude')).toBe(
          true
        );
      });
      (0, vitest_1.it)('should detect Gemini termination with agent type', () => {
        (0, vitest_1.expect)(
          registry.isTerminationPattern('Agent powering down. Goodbye!', 'gemini')
        ).toBe(true);
      });
      (0, vitest_1.it)('should detect process exit code for codex', () => {
        (0, vitest_1.expect)(
          registry.isTerminationPattern('[process exited with code 0]', 'codex')
        ).toBe(true);
      });
    });
  });
  (0, vitest_1.describe)('cleanAnsiEscapeSequences', () => {
    (0, vitest_1.it)('should strip colors and formatting', () => {
      const raw = '\x1b[32mGreen\x1b[0m and \x1b[1mBold\x1b[0m';
      (0, vitest_1.expect)(registry.cleanAnsiEscapeSequences(raw)).toBe('Green and Bold');
    });
    (0, vitest_1.it)(
      'should remove carriage returns and control chars while preserving line boundaries',
      () => {
        const raw = 'line1\r\nline2\x07';
        (0, vitest_1.expect)(registry.cleanAnsiEscapeSequences(raw)).toBe('line1\nline2');
      }
    );
    (0, vitest_1.it)('should handle complex OSC sequences', () => {
      const raw = '\x1b]0;terminal title\x07Prompt$ ';
      (0, vitest_1.expect)(registry.cleanAnsiEscapeSequences(raw)).toBe('Prompt$');
    });
  });
  (0, vitest_1.describe)('Registry Access', () => {
    (0, vitest_1.it)('should provide all registered agent types', () => {
      const types = registry.getAllAgentTypes();
      (0, vitest_1.expect)(types).toContain('claude');
      (0, vitest_1.expect)(types).toContain('gemini');
      (0, vitest_1.expect)(types).toContain('codex');
      (0, vitest_1.expect)(types).toContain('copilot');
      (0, vitest_1.expect)(types).toContain('opencode');
    });
    (0, vitest_1.it)('should provide shell prompt patterns', () => {
      const patterns = registry.getShellPromptPatterns();
      (0, vitest_1.expect)(patterns.standard.length).toBeGreaterThan(0);
      (0, vitest_1.expect)(patterns.explicitTermination.length).toBeGreaterThan(0);
    });
  });
});
//# sourceMappingURL=CliAgentPatternRegistry.test.js.map
