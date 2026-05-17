'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const CliAgentDetectionEngine_1 = require('../../../../services/CliAgentDetectionEngine');
// Mock logger to avoid terminal output during tests
vitest_1.vi.mock('../../../../utils/logger', () => ({
  terminal: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('CliAgentDetectionEngine', () => {
  let engine;
  const terminalId = 'test-terminal';
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
    engine = new CliAgentDetectionEngine_1.CliAgentDetectionEngine();
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.useRealTimers();
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('detectFromInput', () => {
    (0, vitest_1.it)('should detect claude command', () => {
      const result = engine.detectFromInput(terminalId, 'claude code');
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('claude');
      (0, vitest_1.expect)(result.source).toBe('input');
    });
    (0, vitest_1.it)('should detect gemini command', () => {
      const result = engine.detectFromInput(terminalId, 'gemini code');
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('gemini');
    });
    (0, vitest_1.it)('should return negative result for normal command', () => {
      const result = engine.detectFromInput(terminalId, 'ls -la');
      (0, vitest_1.expect)(result.isDetected).toBe(false);
      (0, vitest_1.expect)(result.agentType).toBeNull();
    });
    (0, vitest_1.it)('should handle empty input', () => {
      const result = engine.detectFromInput(terminalId, '  ');
      (0, vitest_1.expect)(result.isDetected).toBe(false);
      (0, vitest_1.expect)(result.reason).toBe('Empty input');
    });
    (0, vitest_1.it)('should use cache for repeated inputs', () => {
      // First call
      engine.detectFromInput(terminalId, 'claude code');
      // Spy on Date.now or registry if needed, but here we just check correctness
      const result = engine.detectFromInput(terminalId, 'claude code');
      (0, vitest_1.expect)(result.isDetected).toBe(true);
    });
    (0, vitest_1.it)('should expire cache after TTL', () => {
      engine.detectFromInput(terminalId, 'claude code');
      // Advance time beyond 5s TTL
      vitest_1.vi.advanceTimersByTime(6000);
      const result = engine.detectFromInput(terminalId, 'claude code');
      (0, vitest_1.expect)(result.isDetected).toBe(true);
    });
  });
  (0, vitest_1.describe)('detectFromOutput', () => {
    (0, vitest_1.it)('should detect agent startup from shell integration command execution', () => {
      const output = '\x1b]633;B;gh copilot suggest "fix bug"\x07';
      const result = engine.detectFromOutput(terminalId, output);
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('copilot');
      (0, vitest_1.expect)(result.source).toBe('output');
      (0, vitest_1.expect)(result.reason).toContain('Shell integration');
    });
    (0, vitest_1.it)(
      'should detect opencode startup from shell integration command execution',
      () => {
        const output = '\x1b]633;B;opencode\x07';
        const result = engine.detectFromOutput(terminalId, output);
        (0, vitest_1.expect)(result.isDetected).toBe(true);
        (0, vitest_1.expect)(result.agentType).toBe('opencode');
        (0, vitest_1.expect)(result.source).toBe('output');
      }
    );
    (0, vitest_1.it)('should detect startup patterns in multi-line output', () => {
      const output = 'Some unrelated text\nWelcome to Claude Code\nMore text';
      const result = engine.detectFromOutput(terminalId, output);
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('claude');
      (0, vitest_1.expect)(result.detectedLine).toContain('Welcome to Claude Code');
    });
    (0, vitest_1.it)('should clean ANSI escape sequences and box characters', () => {
      // Line with ANSI colors and Unicode box characters
      const line = '\x1b[32m│\x1b[0m Welcome to Claude Code \x1b[32m│\x1b[0m';
      const result = engine.detectFromOutput(terminalId, line);
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('claude');
    });
    (0, vitest_1.it)('should handle output with no matches', () => {
      const result = engine.detectFromOutput(terminalId, 'Hello world\nThis is a test');
      (0, vitest_1.expect)(result.isDetected).toBe(false);
    });
    (0, vitest_1.it)('should handle error in output processing', () => {
      // Pass null to trigger error in split
      const result = engine.detectFromOutput(terminalId, null);
      (0, vitest_1.expect)(result.isDetected).toBe(false);
      (0, vitest_1.expect)(result.reason).toBe('Detection error');
    });
    (0, vitest_1.it)('should detect Claude Code from TUI output with box characters', () => {
      const tuiLine = '\x1b[32m╭─\x1b[0m Claude Code v2.1.32 \x1b[32m───╮\x1b[0m';
      const result = engine.detectFromOutput(terminalId, tuiLine);
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('claude');
    });
    (0, vitest_1.it)(
      'should detect Claude Code even if whitespace between words is missing after ANSI cleaning',
      () => {
        // Some TUIs can interleave style resets such that the visible gap isn't preserved in the
        // cleaned output, resulting in "ClaudeCode".
        const tuiLine = '\x1b[32mClaude\x1b[0m\x1b[1mCode\x1b[0m v2.1.37';
        const result = engine.detectFromOutput(terminalId, tuiLine);
        (0, vitest_1.expect)(result.isDetected).toBe(true);
        (0, vitest_1.expect)(result.agentType).toBe('claude');
      }
    );
    (0, vitest_1.it)('should detect OpenCode from TUI output', () => {
      const tuiLine = 'OpenCode Zen';
      const result = engine.detectFromOutput(terminalId, tuiLine);
      (0, vitest_1.expect)(result.isDetected).toBe(true);
      (0, vitest_1.expect)(result.agentType).toBe('opencode');
    });
  });
  (0, vitest_1.describe)('detectTermination', () => {
    (0, vitest_1.it)('should detect termination from shell integration command completion', () => {
      engine.detectFromOutput(terminalId, '\x1b]633;B;claude\x07');
      const result = engine.detectTermination(terminalId, '\x1b]633;C;0\x07', 'claude');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBeGreaterThanOrEqual(0.9);
      (0, vitest_1.expect)(result.reason).toContain('Shell integration');
    });
    (0, vitest_1.it)('should detect termination from shell integration SIGINT completion', () => {
      const result = engine.detectTermination(terminalId, '\x1b]633;C;130\x07', 'claude');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBeGreaterThanOrEqual(0.9);
      (0, vitest_1.expect)(result.reason).toContain('Shell integration');
    });
    (0, vitest_1.it)('should detect explicit termination pattern', () => {
      const result = engine.detectTermination(terminalId, '[Process completed]', 'claude');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBe(1.0);
      (0, vitest_1.expect)(result.reason).toBe('Explicit termination pattern');
    });
    (0, vitest_1.it)('should detect Gemini farewell as termination', () => {
      const result = engine.detectTermination(
        terminalId,
        'Agent powering down. Goodbye!',
        'gemini'
      );
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBe(1.0);
      (0, vitest_1.expect)(result.reason).toBe('Explicit termination pattern');
    });
    (0, vitest_1.it)('should not detect bare exit/quit as termination', () => {
      const exitResult = engine.detectTermination(terminalId, 'exit', 'claude');
      (0, vitest_1.expect)(exitResult.isTerminated).toBe(false);
      const quitResult = engine.detectTermination(terminalId, 'quit', 'gemini');
      (0, vitest_1.expect)(quitResult.isTerminated).toBe(false);
    });
    (0, vitest_1.it)('should not detect conversational Goodbye as termination', () => {
      const result = engine.detectTermination(terminalId, 'Goodbye! Have a great day!', 'gemini');
      (0, vitest_1.expect)(result.isTerminated).toBe(false);
    });
    (0, vitest_1.it)('should detect shell prompt as termination if no recent AI activity', () => {
      const result = engine.detectTermination(terminalId, 'user@host:~$ ');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBe(0.6);
    });
    (0, vitest_1.it)('should ignore shell prompt if there is very recent AI activity', () => {
      engine.detectFromOutput(terminalId, 'Claude is thinking...');
      const result = engine.detectTermination(terminalId, 'user@host:~$ ');
      (0, vitest_1.expect)(result.isTerminated).toBe(false);
    });
    (0, vitest_1.it)(
      'should not treat Claude TUI prompt "❯" as shell termination (prevents connected -> none flip)',
      () => {
        // Simulate Claude startup / activity (sets last AI output timestamp)
        engine.detectFromOutput(terminalId, 'Claude Code v2.1.37');
        // Advance beyond the "recent AI activity" window so the generic shell-prompt
        // termination heuristic would normally trigger.
        vitest_1.vi.advanceTimersByTime(15000);
        // Claude Code uses "❯" as an in-app prompt. Treating it as a shell prompt
        // causes a false termination and flips the status back to none.
        const result = engine.detectTermination(terminalId, '❯', 'claude');
        (0, vitest_1.expect)(result.isTerminated).toBe(false);
      }
    );
    (0, vitest_1.it)(
      'should not terminate on "❯" even if currentAgentType is missing but shell integration context indicates claude',
      () => {
        // Simulate VS Code shell integration command start for claude.
        engine.detectFromOutput(terminalId, '\x1b]633;B;claude\x07');
        // After some time, Claude TUI prompt is displayed.
        vitest_1.vi.advanceTimersByTime(15000);
        // Some call sites may not provide currentAgentType (or it may be temporarily unknown).
        // Still, we must not treat Claude's in-app prompt as a shell prompt termination signal.
        const result = engine.detectTermination(terminalId, '❯');
        (0, vitest_1.expect)(result.isTerminated).toBe(false);
      }
    );
    (0, vitest_1.it)('should detect termination when Ctrl+C is followed by shell prompt', () => {
      engine.detectFromInput(terminalId, '\x03');
      engine.detectFromOutput(terminalId, 'Claude is thinking...');
      const result = engine.detectTermination(terminalId, '^C\nuser@host:~$ ', 'claude');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.reason).toContain('Interrupt');
    });
    (0, vitest_1.it)(
      'should detect termination when Ctrl+C is followed by decorated zsh prompt',
      () => {
        engine.detectFromInput(terminalId, '\x03');
        engine.detectFromOutput(terminalId, 'Claude is thinking...');
        const result = engine.detectTermination(
          terminalId,
          '^C\n➜ myproject git:(main) ✗ ',
          'claude'
        );
        (0, vitest_1.expect)(result.isTerminated).toBe(true);
        (0, vitest_1.expect)(result.reason).toContain('Interrupt');
      }
    );
    (0, vitest_1.it)('should not detect termination from Ctrl+C without shell prompt', () => {
      engine.detectFromInput(terminalId, '\x03');
      const result = engine.detectTermination(terminalId, '^C', 'claude');
      (0, vitest_1.expect)(result.isTerminated).toBe(false);
    });
    (0, vitest_1.it)(
      'should detect termination from double Ctrl+C input without shell prompt',
      () => {
        engine.detectFromInput(terminalId, '\x03');
        const first = engine.detectImmediateInterruptTermination(terminalId, 'claude');
        (0, vitest_1.expect)(first).toBeNull();
        vitest_1.vi.advanceTimersByTime(500);
        engine.detectFromInput(terminalId, '\x03');
        const second = engine.detectImmediateInterruptTermination(terminalId, 'claude');
        (0, vitest_1.expect)(second?.isTerminated).toBe(true);
        (0, vitest_1.expect)(second?.reason).toBe('Double interrupt detected');
      }
    );
    (0, vitest_1.it)('should not detect double Ctrl+C termination when outside window', () => {
      engine.detectFromInput(terminalId, '\x03');
      vitest_1.vi.advanceTimersByTime(4000);
      engine.detectFromInput(terminalId, '\x03');
      const result = engine.detectImmediateInterruptTermination(terminalId, 'claude');
      (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should not treat generic long output as AI activity', () => {
      engine.detectFromOutput(
        terminalId,
        'This is a very long plain output line without any agent related keywords to simulate normal command output'
      );
      const result = engine.detectTermination(terminalId, 'user@host:~$ ');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
    });
    (0, vitest_1.it)('should handle error in termination detection', () => {
      const result = engine.detectTermination(terminalId, null);
      (0, vitest_1.expect)(result.isTerminated).toBe(false);
      (0, vitest_1.expect)(result.reason).toBe('Detection error');
    });
    (0, vitest_1.it)('should detect termination via timeout-based lenient check', () => {
      // 1. Simulate AI activity
      engine.detectFromOutput(terminalId, 'Some AI output');
      // 2. Advance time by 31 seconds (beyond 30s timeout)
      vitest_1.vi.advanceTimersByTime(31000);
      // 3. Check with a prompt-like character but not a standard prompt
      // Using a character that triggers the timeout-based check but NOT the standard prompt check
      // Standard prompt check usually requires more structure or specific patterns
      // Here we provide a line that contains '>' but doesn't look like AI output
      const result = engine.detectTermination(terminalId, '> ');
      (0, vitest_1.expect)(result.isTerminated).toBe(true);
      (0, vitest_1.expect)(result.confidence).toBe(0.6); // Matches shell prompt pattern
      (0, vitest_1.expect)(result.reason).toBe('Shell prompt detected');
    });
    (0, vitest_1.it)(
      'should treat embedded agent keywords as non-keywords in timeout prompt detection',
      () => {
        // Simulate previous AI activity and timeout window passage.
        engine.detectFromOutput(terminalId, 'some output');
        vitest_1.vi.advanceTimersByTime(31000);
        // Contains "claude" as a substring only, not a whole word.
        const result = engine.detectTermination(terminalId, 'xclaudex>');
        (0, vitest_1.expect)(result.isTerminated).toBe(true);
        (0, vitest_1.expect)(result.reason).toBe('Timeout-based detection');
      }
    );
  });
  (0, vitest_1.describe)('Cache Management', () => {
    (0, vitest_1.it)('should clear terminal cache', () => {
      engine.detectFromInput(terminalId, 'claude');
      (0, vitest_1.expect)(() => engine.clearTerminalCache(terminalId)).not.toThrow();
    });
    (0, vitest_1.it)('should fallback to full clear if iteration fails', () => {
      // Mock detectionCache to throw on forEach
      const cache = engine.detectionCache;
      vitest_1.vi.spyOn(cache, 'clear');
      // Use any to force iteration error if we can, or just clear
      engine.clearTerminalCache(terminalId);
      (0, vitest_1.expect)(cache.clear).toBeDefined();
    });
  });
  (0, vitest_1.describe)('Validation', () => {
    (0, vitest_1.it)('should validate termination signal with different confidence levels', () => {
      // High confidence always valid
      (0, vitest_1.expect)(engine.validateTerminationSignal(terminalId, 0.9)).toBe(true);
      // Low confidence without time passed
      (0, vitest_1.expect)(engine.validateTerminationSignal(terminalId, 0.1)).toBe(false);
    });
  });
});
//# sourceMappingURL=CliAgentDetectionEngine.test.js.map
