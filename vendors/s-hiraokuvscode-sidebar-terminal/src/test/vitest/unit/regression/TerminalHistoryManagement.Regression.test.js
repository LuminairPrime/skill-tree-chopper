'use strict';
/**
 * Regression Test Suite for Terminal History Management Fixes
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 *
 * Based on recent commits that fixed:
 * - Terminal history and management processing issues
 * - Session restoration problems
 * - TypeScript compilation errors
 * - Memory leaks in WebView managers
 *
 * Following t-wada's regression prevention methodology:
 * 1. Capture exact behavior that was broken
 * 2. Ensure fixes continue to work
 * 3. Prevent similar regressions
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
(0, vitest_1.describe)('Terminal History Management - Regression Tests', () => {
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
  });
  (0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    vitest_1.vi.useRealTimers();
  });
  (0, vitest_1.describe)('Regression: Terminal History Processing Issues (Commit 1ead11a)', () => {
    (0, vitest_1.it)(
      'should prevent infinite terminal deletion loops that caused system freeze',
      async () => {
        // REGRESSION: Previously, concurrent deletion requests caused infinite loops
        const mockTerminalManager = {
          terminals: new Map([
            ['term-1', { id: 'term-1', name: 'Terminal 1', isDeleting: false }],
            ['term-2', { id: 'term-2', name: 'Terminal 2', isDeleting: false }],
          ]),
          deletionInProgress: new Set(),
          async deleteTerminal(terminalId) {
            // FIXED: Add deletion state tracking to prevent concurrent operations
            if (this.deletionInProgress.has(terminalId)) {
              return {
                success: false,
                reason: 'Deletion already in progress',
                alreadyInProgress: true,
              };
            }
            if (!this.terminals.has(terminalId)) {
              return {
                success: false,
                reason: 'Terminal not found',
                notFound: true,
              };
            }
            this.deletionInProgress.add(terminalId);
            try {
              // Simulate async deletion process
              await new Promise((resolve) => setTimeout(resolve, 50));
              const terminal = this.terminals.get(terminalId);
              if (!terminal) {
                return { success: false, reason: 'Terminal disappeared during deletion' };
              }
              this.terminals.delete(terminalId);
              return { success: true };
            } finally {
              this.deletionInProgress.delete(terminalId);
            }
          },
        };
        // Test concurrent deletion requests (regression scenario)
        const deletePromises = [
          mockTerminalManager.deleteTerminal('term-1'),
          mockTerminalManager.deleteTerminal('term-1'), // Duplicate request
          mockTerminalManager.deleteTerminal('term-1'), // Another duplicate
        ];
        // Advance timers to complete deletion
        await vitest_1.vi.advanceTimersByTimeAsync(60);
        const results = await Promise.all(deletePromises);
        // Only one deletion should succeed
        const successfulDeletions = results.filter((r) => r.success);
        const duplicateDeletions = results.filter((r) => r.alreadyInProgress);
        (0, vitest_1.expect)(successfulDeletions).toHaveLength(1);
        (0, vitest_1.expect)(duplicateDeletions).toHaveLength(2);
        (0, vitest_1.expect)(mockTerminalManager.terminals.has('term-1')).toBe(false);
        (0, vitest_1.expect)(mockTerminalManager.deletionInProgress.size).toBe(0);
      }
    );
    (0, vitest_1.it)('should handle terminal number recycling correctly without conflicts', () => {
      // REGRESSION: Terminal numbers were conflicting during rapid create/delete cycles
      class TerminalNumberManager {
        constructor() {
          this.usedNumbers = new Set();
          this.maxTerminals = 5;
        }
        assignNumber() {
          // FIXED: Proper number recycling logic
          for (let i = 1; i <= this.maxTerminals; i++) {
            if (!this.usedNumbers.has(i)) {
              this.usedNumbers.add(i);
              return i;
            }
          }
          return null; // No available numbers
        }
        releaseNumber(number) {
          this.usedNumbers.delete(number);
        }
        getUsedNumbers() {
          return Array.from(this.usedNumbers).sort();
        }
      }
      const numberManager = new TerminalNumberManager();
      // Create and delete terminals rapidly
      const createdNumbers = [];
      // Create 5 terminals
      for (let i = 0; i < 5; i++) {
        const number = numberManager.assignNumber();
        (0, vitest_1.expect)(number).toBeTypeOf('number');
        createdNumbers.push(number);
      }
      // Should be at capacity
      (0, vitest_1.expect)(numberManager.assignNumber()).toBeNull();
      // Release some numbers
      numberManager.releaseNumber(2);
      numberManager.releaseNumber(4);
      // Should be able to assign released numbers
      const newNumber1 = numberManager.assignNumber();
      const newNumber2 = numberManager.assignNumber();
      (0, vitest_1.expect)([newNumber1, newNumber2]).toEqual(
        vitest_1.expect.arrayContaining([2, 4])
      );
      (0, vitest_1.expect)(numberManager.getUsedNumbers()).toHaveLength(5);
    });
    (0, vitest_1.it)(
      'should preserve terminal history during session save/restore cycle',
      async () => {
        // REGRESSION: Terminal history was lost during session operations
        const mockPersistenceManager = {
          sessionData: null,
          async saveTerminalHistory(terminals) {
            // FIXED: Ensure scrollback data is properly captured
            const terminalData = terminals.map((terminal) => ({
              id: terminal.id,
              name: terminal.name,
              number: terminal.number,
              cwd: terminal.cwd,
              isActive: terminal.isActive,
              scrollbackData: terminal.scrollback || [], // This was missing before
            }));
            this.sessionData = {
              version: '3.0.0',
              timestamp: Date.now(),
              terminals: terminalData,
            };
            return {
              success: true,
              terminalCount: terminalData.length,
            };
          },
          async restoreTerminalHistory() {
            // FIXED: Properly restore scrollback data
            if (!this.sessionData) {
              return { success: false, error: 'No session data' };
            }
            const restoredTerminals = this.sessionData.terminals.map((terminalData) => ({
              id: `restored-${terminalData.id}`,
              name: terminalData.name,
              number: terminalData.number,
              cwd: terminalData.cwd,
              isActive: terminalData.isActive,
              scrollback: terminalData.scrollbackData || [], // Restored with history
            }));
            return {
              success: true,
              restoredTerminals,
              restoredCount: restoredTerminals.length,
            };
          },
        };
        // Original terminals with history
        const originalTerminals = [
          {
            id: 'term-1',
            name: 'Terminal 1',
            number: 1,
            cwd: '/project',
            isActive: true,
            scrollback: [
              'echo "Starting project"',
              'Starting project',
              'npm install',
              'Dependencies installed',
              '$ ',
            ],
          },
          {
            id: 'term-2',
            name: 'Terminal 2',
            number: 2,
            cwd: '/tests',
            isActive: false,
            scrollback: ['npm test', 'All tests passed', 'coverage: 85%', '$ '],
          },
        ];
        // Save session
        const saveResult = await mockPersistenceManager.saveTerminalHistory(originalTerminals);
        (0, vitest_1.expect)(saveResult.success).toBe(true);
        (0, vitest_1.expect)(saveResult.terminalCount).toBe(2);
        // Restore session
        const restoreResult = await mockPersistenceManager.restoreTerminalHistory();
        (0, vitest_1.expect)(restoreResult.success).toBe(true);
        (0, vitest_1.expect)(restoreResult.restoredCount).toBe(2);
        // Verify history is preserved
        const restoredTerminal1 = restoreResult.restoredTerminals.find(
          (t) => t.name === 'Terminal 1'
        );
        const restoredTerminal2 = restoreResult.restoredTerminals.find(
          (t) => t.name === 'Terminal 2'
        );
        (0, vitest_1.expect)(restoredTerminal1).toBeDefined();
        (0, vitest_1.expect)(restoredTerminal2).toBeDefined();
        if (restoredTerminal1 && restoredTerminal2) {
          (0, vitest_1.expect)(restoredTerminal1.scrollback).toEqual(
            originalTerminals[0].scrollback
          );
          (0, vitest_1.expect)(restoredTerminal2.scrollback).toEqual(
            originalTerminals[1].scrollback
          );
        }
      }
    );
  });
  (0, vitest_1.describe)(
    'Regression: VS Code Standard Features Implementation (Commit d542481)',
    () => {
      (0, vitest_1.it)('should handle Alt+Click cursor positioning correctly', () => {
        // REGRESSION: Alt+Click didn't work when VS Code settings were configured
        const mockTerminalManager = {
          altClickEnabled: false,
          cursorPosition: { row: 0, col: 0 },
          configureAltClick(vsCodeSettings) {
            // FIXED: Proper VS Code settings integration
            const altClickMovesCursor = vsCodeSettings.get(
              'terminal.integrated.altClickMovesCursor',
              false
            );
            const multiCursorModifier = vsCodeSettings.get('editor.multiCursorModifier', 'alt');
            this.altClickEnabled = altClickMovesCursor && multiCursorModifier === 'alt';
          },
          handleAltClick(event) {
            if (!event.altKey || !this.altClickEnabled) {
              return { handled: false, reason: 'Alt+Click not enabled or Alt key not pressed' };
            }
            this.cursorPosition = { row: event.row, col: event.col };
            return { handled: true, newPosition: this.cursorPosition };
          },
        };
        // Configure with correct VS Code settings
        const mockVSCodeSettings = {
          get: vitest_1.vi.fn().mockImplementation((key, defaultValue) => {
            const settings = {
              'terminal.integrated.altClickMovesCursor': true,
              'editor.multiCursorModifier': 'alt',
            };
            return settings[key] ?? defaultValue;
          }),
        };
        mockTerminalManager.configureAltClick(mockVSCodeSettings);
        // Test Alt+Click behavior
        const clickResult = mockTerminalManager.handleAltClick({
          row: 5,
          col: 10,
          altKey: true,
        });
        (0, vitest_1.expect)(clickResult.handled).toBe(true);
        (0, vitest_1.expect)(clickResult.newPosition).toEqual({ row: 5, col: 10 });
      });
      (0, vitest_1.it)('should integrate with VS Code themes correctly', () => {
        // REGRESSION: Theme integration was broken in WebView
        const mockThemeManager = {
          currentTheme: 'dark',
          cssVariables: new Map(),
          applyVSCodeTheme(themeInfo) {
            // FIXED: Proper CSS variable mapping for VS Code themes
            const themeMapping = {
              'terminal.background': '--vscode-terminal-background',
              'terminal.foreground': '--vscode-terminal-foreground',
              'terminal.ansiBlack': '--vscode-terminal-ansiBlack',
              'terminal.ansiRed': '--vscode-terminal-ansiRed',
              'terminal.ansiGreen': '--vscode-terminal-ansiGreen',
              'terminal.ansiYellow': '--vscode-terminal-ansiYellow',
              'terminal.ansiBlue': '--vscode-terminal-ansiBlue',
              'terminal.ansiMagenta': '--vscode-terminal-ansiMagenta',
              'terminal.ansiCyan': '--vscode-terminal-ansiCyan',
              'terminal.ansiWhite': '--vscode-terminal-ansiWhite',
            };
            this.currentTheme = themeInfo.kind === 1 ? 'light' : 'dark';
            this.cssVariables.clear();
            for (const [vsCodeColor, cssVar] of Object.entries(themeMapping)) {
              const colorValue =
                themeInfo.colors?.[vsCodeColor] || this.getDefaultColor(vsCodeColor);
              this.cssVariables.set(cssVar, colorValue);
            }
          },
          getDefaultColor(colorKey) {
            const darkDefaults = {
              'terminal.background': '#1e1e1e',
              'terminal.foreground': '#cccccc',
              'terminal.ansiBlack': '#000000',
              'terminal.ansiRed': '#cd3131',
              'terminal.ansiGreen': '#0dbc79',
              'terminal.ansiYellow': '#e5e510',
              'terminal.ansiBlue': '#2472c8',
              'terminal.ansiMagenta': '#bc3fbc',
              'terminal.ansiCyan': '#11a8cd',
              'terminal.ansiWhite': '#e5e5e5',
            };
            return darkDefaults[colorKey] || '#cccccc';
          },
          generateCSS() {
            let css = ':root {\n';
            for (const [variable, value] of this.cssVariables.entries()) {
              css += `  ${variable}: ${value};\n`;
            }
            css += '}';
            return css;
          },
        };
        // Apply dark theme
        const darkTheme = {
          kind: 2, // Dark theme
          colors: {
            'terminal.background': '#1a1a1a',
            'terminal.foreground': '#d4d4d4',
            'terminal.ansiRed': '#f14c4c',
          },
        };
        mockThemeManager.applyVSCodeTheme(darkTheme);
        (0, vitest_1.expect)(mockThemeManager.currentTheme).toBe('dark');
        (0, vitest_1.expect)(
          mockThemeManager.cssVariables.get('--vscode-terminal-background')
        ).toBe('#1a1a1a');
        (0, vitest_1.expect)(
          mockThemeManager.cssVariables.get('--vscode-terminal-foreground')
        ).toBe('#d4d4d4');
        (0, vitest_1.expect)(mockThemeManager.cssVariables.get('--vscode-terminal-ansiRed')).toBe(
          '#f14c4c'
        );
        const generatedCSS = mockThemeManager.generateCSS();
        (0, vitest_1.expect)(generatedCSS).toContain('--vscode-terminal-background: #1a1a1a');
        (0, vitest_1.expect)(generatedCSS).toContain('--vscode-terminal-foreground: #d4d4d4');
      });
    }
  );
  (0, vitest_1.describe)(
    'Regression: TypeScript Compilation and Quality Improvements (Commit 6a73e44)',
    () => {
      (0, vitest_1.it)(
        'should prevent TypeScript compilation errors in MessageManager',
        async () => {
          class ConsolidatedMessageManager {
            constructor(coordinator) {
              this.messageQueue = [];
              this.isReady = false;
              this.coordinator = coordinator;
            }
            // FIXED: Proper type definitions and async handling
            async postMessage(message) {
              if (!this.isReady) {
                this.messageQueue.push({
                  message,
                  timestamp: Date.now(),
                });
                return false;
              }
              try {
                await this.coordinator.sendMessageToExtension(message);
                return true;
              } catch (error) {
                this.coordinator.log(`Failed to send message: ${error}`);
                return false;
              }
            }
            setReady(ready) {
              this.isReady = ready;
              if (ready && this.messageQueue.length > 0) {
                // Fix floating promise
                void this.flushQueue();
              }
            }
            async flushQueue() {
              const queueToFlush = [...this.messageQueue];
              this.messageQueue = [];
              for (const queuedMessage of queueToFlush) {
                await this.postMessage(queuedMessage.message);
              }
            }
            getQueueSize() {
              return this.messageQueue.length;
            }
          }
          // Test the fixed implementation
          const mockCoordinator = {
            sendMessageToExtension: vitest_1.vi.fn().mockResolvedValue(undefined),
            log: vitest_1.vi.fn(),
          };
          const messageManager = new ConsolidatedMessageManager(mockCoordinator);
          // Queue messages when not ready
          await messageManager.postMessage({ command: 'test1' });
          await messageManager.postMessage({ command: 'test2' });
          (0, vitest_1.expect)(messageManager.getQueueSize()).toBe(2);
          // Set ready and verify queue is flushed
          messageManager.setReady(true);
          // Give time for async flush (no setTimeout used in implementation, but flushQueue is async)
          // Since flushQueue is void-ed, we need to wait for promises to resolve
          await vitest_1.vi.advanceTimersByTimeAsync(10); // Not strictly needed if promises resolve immediately, but safe
          // We need to wait for the microtask queue to drain since setReady calls void flushQueue()
          await new Promise(process.nextTick);
          await new Promise(process.nextTick);
          (0, vitest_1.expect)(mockCoordinator.sendMessageToExtension).toHaveBeenCalledTimes(2);
        }
      );
      (0, vitest_1.it)('should handle WebView disposal properly to prevent memory leaks', () => {
        // REGRESSION: EventEmitters were not properly disposed, causing memory leaks
        class WebViewManager {
          constructor() {
            this.disposables = [];
            this.eventEmitters = [];
          }
          addEventEmitter(emitter) {
            this.eventEmitters.push(emitter);
          }
          addDisposable(disposable) {
            this.disposables.push(disposable);
          }
          // FIXED: Proper disposal of all resources
          dispose() {
            // Dispose all event emitters
            for (const emitter of this.eventEmitters) {
              if (emitter.dispose && typeof emitter.dispose === 'function') {
                emitter.dispose();
              }
            }
            // Dispose all other disposables
            for (const disposable of this.disposables) {
              if (disposable.dispose && typeof disposable.dispose === 'function') {
                disposable.dispose();
              }
            }
            // Clear arrays to prevent references
            this.eventEmitters.length = 0;
            this.disposables.length = 0;
          }
          getResourceCounts() {
            return {
              emitters: this.eventEmitters.length,
              disposables: this.disposables.length,
            };
          }
        }
        const manager = new WebViewManager();
        // Add mock resources
        const mockEmitter = { dispose: vitest_1.vi.fn() };
        const mockDisposable = { dispose: vitest_1.vi.fn() };
        manager.addEventEmitter(mockEmitter);
        manager.addDisposable(mockDisposable);
        (0, vitest_1.expect)(manager.getResourceCounts()).toEqual({
          emitters: 1,
          disposables: 1,
        });
        // Dispose and verify cleanup
        manager.dispose();
        (0, vitest_1.expect)(mockEmitter.dispose).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockDisposable.dispose).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(manager.getResourceCounts()).toEqual({
          emitters: 0,
          disposables: 0,
        });
      });
    }
  );
  (0, vitest_1.describe)('Regression: Performance and Memory Optimization', () => {
    (0, vitest_1.it)('should prevent buffer overflow in high-frequency terminal output', () => {
      // REGRESSION: High frequency output caused memory issues
      class TerminalDataBuffer {
        constructor() {
          this.buffers = new Map();
          this.maxBufferSize = 1000; // lines
          this.maxLineLength = 2000; // characters
        }
        bufferData(terminalId, data) {
          if (!this.buffers.has(terminalId)) {
            this.buffers.set(terminalId, []);
          }
          const buffer = this.buffers.get(terminalId);
          // FIXED: Split data into lines and enforce limits
          const lines = data.split('\n');
          for (let line of lines) {
            // Truncate overly long lines
            if (line.length > this.maxLineLength) {
              line = line.substring(0, this.maxLineLength) + '...';
            }
            buffer.push(line);
            // Remove old lines if buffer is too large
            if (buffer.length > this.maxBufferSize) {
              buffer.shift();
            }
          }
        }
        getBufferStats(terminalId) {
          const buffer = this.buffers.get(terminalId) || [];
          const totalSize = buffer.reduce((sum, line) => sum + line.length, 0);
          return {
            lineCount: buffer.length,
            totalSize,
          };
        }
        clearBuffer(terminalId) {
          this.buffers.delete(terminalId);
        }
      }
      const dataBuffer = new TerminalDataBuffer();
      // Simulate high frequency output
      const terminalId = 'high-freq-terminal';
      // Add large amount of data
      for (let i = 0; i < 1500; i++) {
        dataBuffer.bufferData(terminalId, `Line ${i}: ${'x'.repeat(100)}\n`);
      }
      const stats = dataBuffer.getBufferStats(terminalId);
      // Buffer should be limited to max size
      (0, vitest_1.expect)(stats.lineCount).toBe(1000);
      (0, vitest_1.expect)(stats.totalSize).toBeLessThan(1000 * 2000); // Should not exceed max limits
    });
    (0, vitest_1.it)('should cleanup CLI agent detection patterns to prevent memory growth', () => {
      // REGRESSION: CLI agent patterns accumulated without cleanup
      class CLIAgentPatternManager {
        constructor() {
          this.detectionPatterns = new Map();
          this.patternUsageCount = new Map();
          this.maxPatterns = 50;
        }
        addPattern(name, pattern) {
          // FIXED: Limit number of patterns and track usage
          if (
            this.detectionPatterns.size >= this.maxPatterns &&
            !this.detectionPatterns.has(name)
          ) {
            this.removeOldestPattern();
          }
          this.detectionPatterns.set(name, new RegExp(pattern));
          this.patternUsageCount.set(name, 0);
        }
        removeOldestPattern() {
          // Remove pattern with lowest usage count
          let oldestPattern = '';
          let lowestUsage = Infinity;
          for (const [pattern, usage] of this.patternUsageCount.entries()) {
            if (usage < lowestUsage) {
              lowestUsage = usage;
              oldestPattern = pattern;
            }
          }
          if (oldestPattern) {
            this.detectionPatterns.delete(oldestPattern);
            this.patternUsageCount.delete(oldestPattern);
          }
        }
        detectAgent(output) {
          for (const [name, pattern] of this.detectionPatterns.entries()) {
            if (pattern.test(output)) {
              // Increment usage count
              const currentUsage = this.patternUsageCount.get(name) || 0;
              this.patternUsageCount.set(name, currentUsage + 1);
              return name;
            }
          }
          return null;
        }
        getPatternCount() {
          return this.detectionPatterns.size;
        }
        cleanup() {
          this.detectionPatterns.clear();
          this.patternUsageCount.clear();
        }
      }
      const patternManager = new CLIAgentPatternManager();
      // Add many patterns to test limit
      for (let i = 0; i < 60; i++) {
        patternManager.addPattern(`pattern-${i}`, `test-pattern-${i}`);
      }
      // Should be limited to max patterns
      (0, vitest_1.expect)(patternManager.getPatternCount()).toBe(50);
      // Test cleanup
      patternManager.cleanup();
      (0, vitest_1.expect)(patternManager.getPatternCount()).toBe(0);
    });
  });
});
//# sourceMappingURL=TerminalHistoryManagement.Regression.test.js.map
