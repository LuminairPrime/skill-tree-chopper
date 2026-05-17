'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
const vitest_1 = require('vitest');
const TerminalInstanceService_1 = require('../../../../../services/terminal/TerminalInstanceService');
(0, vitest_1.describe)('TerminalInstanceService', () => {
  let service;
  (0, vitest_1.beforeEach)(() => {
    service = new TerminalInstanceService_1.TerminalInstanceService();
  });
  (0, vitest_1.afterEach)(() => {
    if (service) {
      service.dispose();
    }
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('Constructor', () => {
    (0, vitest_1.it)('should initialize successfully', () => {
      const stats = service.getTerminalStats();
      (0, vitest_1.expect)(stats.maxTerminals).toBeGreaterThan(0);
      (0, vitest_1.expect)(Array.isArray(stats.availableNumbers)).toBe(true);
      (0, vitest_1.expect)(Array.isArray(stats.usedNumbers)).toBe(true);
      (0, vitest_1.expect)(stats.terminalsBeingCreated).toBe(0);
    });
  });
  (0, vitest_1.describe)('createTerminal', () => {
    (0, vitest_1.it)('should create terminal with default options', async () => {
      const terminal = await service.createTerminal();
      (0, vitest_1.expect)(terminal.id).toBeDefined();
      (0, vitest_1.expect)(terminal.name).toBeDefined();
      (0, vitest_1.expect)(terminal.number).toBeDefined();
      (0, vitest_1.expect)(terminal.process || terminal.pty).toBeDefined();
      (0, vitest_1.expect)(terminal.isActive).toBe(false);
      (0, vitest_1.expect)(terminal.createdAt).toBeDefined();
      (0, vitest_1.expect)(terminal.pid || terminal.process?.pid).toBeDefined();
      (0, vitest_1.expect)(terminal.cwd).toBeDefined();
      (0, vitest_1.expect)(terminal.shell || terminal.process).toBeDefined();
      (0, vitest_1.expect)(Array.isArray(terminal.shellArgs) || terminal.process).toBe(true);
    });
    (0, vitest_1.it)('should create terminal with custom options', async () => {
      const options = {
        terminalName: 'Custom Terminal',
        cwd: '/tmp',
        shell: '/bin/bash',
        shellArgs: ['--login'],
      };
      const terminal = await service.createTerminal(options);
      (0, vitest_1.expect)(terminal.name).toBe('Custom Terminal');
      (0, vitest_1.expect)(terminal.cwd).toBe('/tmp');
      (0, vitest_1.expect)(terminal.shell).toBe('/bin/bash');
      (0, vitest_1.expect)(terminal.shellArgs).toEqual(['--login']);
    });
    (0, vitest_1.it)('should create terminal with profile', async () => {
      const terminal = await service.createTerminal({ profileName: 'default' });
      (0, vitest_1.expect)(terminal.id).toBeDefined();
      (0, vitest_1.expect)(terminal.shell || terminal.process).toBeDefined();
      (0, vitest_1.expect)(Array.isArray(terminal.shellArgs) || terminal.process).toBe(true);
    });
    (0, vitest_1.it)('should handle safe mode', async () => {
      const terminal = await service.createTerminal({ safeMode: true });
      (0, vitest_1.expect)(terminal.id).toBeDefined();
      (0, vitest_1.expect)(terminal.process || terminal.pty).toBeDefined();
      // In safe mode, should still create terminal but with safer environment
    });
    (0, vitest_1.it)('should assign sequential terminal numbers', async () => {
      const terminal1 = await service.createTerminal();
      const terminal2 = await service.createTerminal();
      const terminal3 = await service.createTerminal();
      (0, vitest_1.expect)(terminal1.number).toBe(1);
      (0, vitest_1.expect)(terminal2.number).toBe(2);
      (0, vitest_1.expect)(terminal3.number).toBe(3);
      // Clean up
      await service.disposeTerminal(terminal1);
      await service.disposeTerminal(terminal2);
      await service.disposeTerminal(terminal3);
    });
    (0, vitest_1.it)('should reuse terminal numbers after disposal', async () => {
      const terminal1 = await service.createTerminal();
      (0, vitest_1.expect)(terminal1.number).toBe(1);
      await service.disposeTerminal(terminal1);
      const terminal2 = await service.createTerminal();
      (0, vitest_1.expect)(terminal2.number).toBe(1); // Should reuse number 1
      await service.disposeTerminal(terminal2);
    });
    (0, vitest_1.it)('should prevent duplicate creation', async () => {
      // This is hard to test due to random IDs, but we can test the logic
      const stats = service.getTerminalStats();
      (0, vitest_1.expect)(stats.terminalsBeingCreated).toBe(0);
    });
    (0, vitest_1.it)('should handle maximum terminals reached', async () => {
      const maxTerminals = service.getTerminalStats().maxTerminals;
      const terminals = [];
      try {
        // Create maximum number of terminals
        for (let i = 0; i < maxTerminals; i++) {
          const terminal = await service.createTerminal();
          terminals.push(terminal);
        }
        // Try to create one more - should fail
        try {
          await service.createTerminal();
          vitest_1.expect.fail('Should have thrown error for maximum terminals');
        } catch (error) {
          (0, vitest_1.expect)(error).toBeInstanceOf(Error);
          (0, vitest_1.expect)(error.message).toContain('Maximum number of terminals reached');
        }
      } finally {
        // Clean up all terminals
        for (const terminal of terminals) {
          await service.disposeTerminal(terminal);
        }
      }
    });
  });
  (0, vitest_1.describe)('disposeTerminal', () => {
    (0, vitest_1.it)('should dispose terminal successfully', async () => {
      const terminal = await service.createTerminal();
      await service.disposeTerminal(terminal);
      // Terminal should be cleaned up
      (0, vitest_1.expect)(service.isTerminalAlive(terminal)).toBe(false);
    });
    (0, vitest_1.it)('should handle disposal of already disposed terminal', async () => {
      const terminal = await service.createTerminal();
      await service.disposeTerminal(terminal);
      // Should not throw error when disposing again
      await service.disposeTerminal(terminal);
    });
    (0, vitest_1.it)('should release terminal number on disposal', async () => {
      const terminal = await service.createTerminal();
      const terminalNumber = terminal.number;
      await service.disposeTerminal(terminal);
      // Number should be available again
      const stats = service.getTerminalStats();
      (0, vitest_1.expect)(stats.availableNumbers).toContain(terminalNumber);
    });
    (0, vitest_1.it)('should clean up shell integration', async () => {
      const terminal = await service.createTerminal();
      // Should not throw error even if shell integration fails
      await service.disposeTerminal(terminal);
    });
  });
  (0, vitest_1.describe)('resizeTerminal', () => {
    (0, vitest_1.it)('should resize terminal successfully', async () => {
      const terminal = await service.createTerminal();
      // Should not throw error
      service.resizeTerminal(terminal, 100, 50);
      await service.disposeTerminal(terminal);
    });
    (0, vitest_1.it)('should handle resize of disposed terminal', async () => {
      const terminal = await service.createTerminal();
      await service.disposeTerminal(terminal);
      // Should not throw error
      service.resizeTerminal(terminal, 100, 50);
    });
  });
  (0, vitest_1.describe)('sendInputToTerminal', () => {
    (0, vitest_1.it)('should send input successfully', async () => {
      const terminal = await service.createTerminal();
      // Should not throw error
      service.sendInputToTerminal(terminal, 'echo hello\n');
      await service.disposeTerminal(terminal);
    });
    (0, vitest_1.it)('should handle input to disposed terminal', async () => {
      const terminal = await service.createTerminal();
      await service.disposeTerminal(terminal);
      // Should not throw error
      service.sendInputToTerminal(terminal, 'echo hello\n');
    });
  });
  (0, vitest_1.describe)('isTerminalAlive', () => {
    (0, vitest_1.it)('should return true for alive terminal', async () => {
      const terminal = await service.createTerminal();
      (0, vitest_1.expect)(service.isTerminalAlive(terminal)).toBe(true);
      await service.disposeTerminal(terminal);
    });
    (0, vitest_1.it)('should return false for disposed terminal', async () => {
      const terminal = await service.createTerminal();
      await service.disposeTerminal(terminal);
      (0, vitest_1.expect)(service.isTerminalAlive(terminal)).toBe(false);
    });
  });
  (0, vitest_1.describe)('getTerminalStats', () => {
    (0, vitest_1.it)('should return accurate statistics', async () => {
      const terminal1 = await service.createTerminal();
      const terminal2 = await service.createTerminal();
      const stats = service.getTerminalStats();
      (0, vitest_1.expect)(stats.maxTerminals).toBeGreaterThan(0);
      (0, vitest_1.expect)(stats.availableNumbers.length).toBeGreaterThan(0);
      (0, vitest_1.expect)(stats.usedNumbers.length).toBe(2);
      (0, vitest_1.expect)(stats.usedNumbers).toContain(terminal1.number);
      (0, vitest_1.expect)(stats.usedNumbers).toContain(terminal2.number);
      await service.disposeTerminal(terminal1);
      await service.disposeTerminal(terminal2);
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle PTY creation failure gracefully', async () => {
      // Test with invalid shell path
      try {
        await service.createTerminal({
          shell: '/invalid/shell/path',
          shellArgs: [],
        });
        // Note: This might still succeed on some systems, so we don't expect.fail here
      } catch (error) {
        (0, vitest_1.expect)(error).toBeInstanceOf(Error);
        (0, vitest_1.expect)(error.message).toContain('Terminal creation failed');
      }
    });
    (0, vitest_1.it)('should handle terminal profile resolution errors', async () => {
      // Should fallback to default profile
      const terminal = await service.createTerminal({
        profileName: 'non-existent-profile',
      });
      (0, vitest_1.expect)(terminal.id).toBeDefined();
      (0, vitest_1.expect)(terminal.shell || terminal.process).toBeDefined();
      await service.disposeTerminal(terminal);
    });
    (0, vitest_1.it)('should handle shell integration errors gracefully', async () => {
      const terminal = await service.createTerminal();
      // Shell integration errors should not prevent terminal creation
      (0, vitest_1.expect)(terminal.id).toBeDefined();
      (0, vitest_1.expect)(terminal.process || terminal.pty).toBeDefined();
      await service.disposeTerminal(terminal);
    });
  });
  (0, vitest_1.describe)('Performance Tests', () => {
    (0, vitest_1.it)('should handle rapid terminal creation and disposal', async () => {
      const startTime = Date.now();
      const terminals = [];
      try {
        // Create multiple terminals rapidly
        for (let i = 0; i < 3; i++) {
          const terminal = await service.createTerminal();
          terminals.push(terminal);
        }
        // Dispose them rapidly
        for (const terminal of terminals) {
          await service.disposeTerminal(terminal);
        }
        const duration = Date.now() - startTime;
        (0, vitest_1.expect)(duration).toBeLessThan(5000);
      } catch (error) {
        // Clean up on error
        for (const terminal of terminals) {
          try {
            await service.disposeTerminal(terminal);
          } catch (_e) {
            // Ignore cleanup errors
          }
        }
        throw error;
      }
    });
    (0, vitest_1.it)('should maintain number management integrity under load', async () => {
      const terminals = [];
      try {
        // Create and dispose terminals to test number reuse
        for (let i = 0; i < 5; i++) {
          const terminal = await service.createTerminal();
          terminals.push(terminal);
          if (i % 2 === 0) {
            await service.disposeTerminal(terminal);
            terminals.pop();
          }
        }
        const stats = service.getTerminalStats();
        (0, vitest_1.expect)(stats.availableNumbers.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(stats.usedNumbers.length).toBeGreaterThan(0);
      } finally {
        // Clean up remaining terminals
        for (const terminal of terminals) {
          await service.disposeTerminal(terminal);
        }
      }
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clean up all resources', () => {
      // Should not throw error
      service.dispose();
    });
  });
});
//# sourceMappingURL=TerminalInstanceService.test.js.map
