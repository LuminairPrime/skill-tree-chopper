'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
const vitest_1 = require('vitest');
const TerminalDataBufferService_1 = require('../../../../../services/terminal/TerminalDataBufferService');
(0, vitest_1.describe)('TerminalDataBufferService', () => {
  let service;
  (0, vitest_1.beforeEach)(() => {
    service = new TerminalDataBufferService_1.TerminalDataBufferService();
  });
  (0, vitest_1.afterEach)(() => {
    service.dispose();
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('Constructor', () => {
    (0, vitest_1.it)('should initialize with default config', () => {
      const stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.flushInterval).toBe(16);
      (0, vitest_1.expect)(stats.isCliAgentActive).toBe(false);
    });
    (0, vitest_1.it)('should initialize with custom config', () => {
      const customService = new TerminalDataBufferService_1.TerminalDataBufferService({
        flushInterval: 8,
        maxBufferSize: 100,
        cliAgentFlushInterval: 2,
      });
      const stats = customService.getBufferStats();
      (0, vitest_1.expect)(stats.flushInterval).toBe(8);
      customService.dispose();
    });
  });
  (0, vitest_1.describe)('bufferData', () => {
    (0, vitest_1.it)('should buffer small data chunks', async () => {
      let eventFired = false;
      service.onData((event) => {
        (0, vitest_1.expect)(event.terminalId).toBe('test1');
        (0, vitest_1.expect)(event.data).toBe('hello');
        (0, vitest_1.expect)(event.timestamp).toBeDefined();
        eventFired = true;
      });
      service.bufferData('test1', 'hello');
      // Should not fire immediately for small data
      (0, vitest_1.expect)(eventFired).toBe(false);
      // Should fire after flush interval
      await new Promise((resolve) => {
        setTimeout(() => {
          (0, vitest_1.expect)(eventFired).toBe(true);
          resolve();
        }, 25);
      });
    });
    (0, vitest_1.it)('should immediately flush large data chunks', async () => {
      let eventFired = false;
      await new Promise((resolve) => {
        service.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data?.length).toBe(1000);
          eventFired = true;
          resolve();
        });
        // Large data should flush immediately
        service.bufferData('test1', 'x'.repeat(1000));
        // Should fire immediately
        (0, vitest_1.expect)(eventFired).toBe(true);
      });
    });
    (0, vitest_1.it)('should combine multiple small chunks', async () => {
      let eventFired = false;
      await new Promise((resolve) => {
        service.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data).toBe('helloworldtest');
          eventFired = true;
          resolve();
        });
        service.bufferData('test1', 'hello');
        service.bufferData('test1', 'world');
        service.bufferData('test1', 'test');
        // Should not fire immediately
        (0, vitest_1.expect)(eventFired).toBe(false);
        // Force flush
        service.flushBuffer('test1');
      });
    });
    (0, vitest_1.it)('should handle buffer overflow', async () => {
      const customService = new TerminalDataBufferService_1.TerminalDataBufferService({
        flushInterval: 16,
        maxBufferSize: 2,
      });
      let eventFired = false;
      await new Promise((resolve) => {
        customService.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data).toBe('ab');
          eventFired = true;
          resolve();
        });
        customService.bufferData('test1', 'a');
        customService.bufferData('test1', 'b');
        // This should trigger immediate flush due to buffer overflow
        (0, vitest_1.expect)(eventFired).toBe(true);
        customService.dispose();
      });
    });
  });
  (0, vitest_1.describe)('CLI Agent Integration', () => {
    (0, vitest_1.it)('should switch to faster flush interval for CLI Agent', () => {
      service.setCliAgentActive(true);
      const stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.flushInterval).toBe(4);
      (0, vitest_1.expect)(stats.isCliAgentActive).toBe(true);
    });
    (0, vitest_1.it)('should flush all buffers when CLI Agent becomes active', async () => {
      let eventCount = 0;
      await new Promise((resolve) => {
        service.onData((_event) => {
          eventCount++;
          if (eventCount === 2) {
            resolve();
          }
        });
        // Buffer data for two terminals
        service.bufferData('test1', 'data1');
        service.bufferData('test2', 'data2');
        // Activate CLI Agent - should flush all buffers
        service.setCliAgentActive(true);
      });
    });
    (0, vitest_1.it)('should return to normal flush interval when CLI Agent deactivated', () => {
      service.setCliAgentActive(true);
      (0, vitest_1.expect)(service.getBufferStats().flushInterval).toBe(4);
      service.setCliAgentActive(false);
      (0, vitest_1.expect)(service.getBufferStats().flushInterval).toBe(16);
    });
  });
  (0, vitest_1.describe)('flushBuffer', () => {
    (0, vitest_1.it)('should flush specific terminal buffer', async () => {
      let eventFired = false;
      await new Promise((resolve) => {
        service.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data).toBe('test');
          eventFired = true;
          resolve();
        });
        service.bufferData('test1', 'test');
        service.flushBuffer('test1');
        (0, vitest_1.expect)(eventFired).toBe(true);
      });
    });
    (0, vitest_1.it)('should handle flush of empty buffer', () => {
      // Should not throw error
      service.flushBuffer('non-existent');
    });
    (0, vitest_1.it)('should clear buffer after flush', async () => {
      await new Promise((resolve) => {
        service.onData(() => {
          const stats = service.getBufferStats();
          (0, vitest_1.expect)(stats.totalBufferedChars).toBe(0);
          resolve();
        });
        service.bufferData('test1', 'test');
        service.flushBuffer('test1');
      });
    });
  });
  (0, vitest_1.describe)('flushAllBuffers', () => {
    (0, vitest_1.it)('should flush all terminal buffers', async () => {
      let eventCount = 0;
      const expectedEvents = 3;
      await new Promise((resolve) => {
        service.onData((_event) => {
          eventCount++;
          if (eventCount === expectedEvents) {
            resolve();
          }
        });
        service.bufferData('test1', 'data1');
        service.bufferData('test2', 'data2');
        service.bufferData('test3', 'data3');
        service.flushAllBuffers();
      });
    });
  });
  (0, vitest_1.describe)('clearTerminalBuffer', () => {
    (0, vitest_1.it)('should clear specific terminal buffer', async () => {
      await new Promise((resolve) => {
        service.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data).toBe('test');
          // Clear the buffer
          service.clearTerminalBuffer('test1');
          const stats = service.getBufferStats();
          (0, vitest_1.expect)(stats.activeBuffers).toBe(0);
          resolve();
        });
        service.bufferData('test1', 'test');
        service.clearTerminalBuffer('test1');
      });
    });
  });
  (0, vitest_1.describe)('getBufferStats', () => {
    (0, vitest_1.it)('should return accurate buffer statistics', () => {
      service.bufferData('test1', 'hello');
      service.bufferData('test2', 'world');
      const stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.activeBuffers).toBe(2);
      (0, vitest_1.expect)(stats.totalBufferedChars).toBe(10); // 'hello' + 'world'
      (0, vitest_1.expect)(stats.pendingFlushes).toBe(2);
      (0, vitest_1.expect)(stats.isCliAgentActive).toBe(false);
      (0, vitest_1.expect)(stats.flushInterval).toBe(16);
    });
    (0, vitest_1.it)('should update statistics when CLI Agent active', () => {
      service.setCliAgentActive(true);
      const stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.isCliAgentActive).toBe(true);
      (0, vitest_1.expect)(stats.flushInterval).toBe(4);
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle data buffering errors gracefully', async () => {
      // Use existing console.error stub if present, otherwise skip
      const consoleError = console.error;
      const isAlreadyStubbed = typeof consoleError?.mockReset === 'function';
      if (isAlreadyStubbed) {
        consoleError.mockReset();
      }
      let eventFired = false;
      await new Promise((resolve) => {
        service.onData((event) => {
          (0, vitest_1.expect)(event.terminalId).toBe('test1');
          (0, vitest_1.expect)(event.data).toBe('test');
          eventFired = true;
          resolve();
        });
        // This should trigger error handling but still emit data
        service.bufferData('test1', 'test');
        // Should still work despite any internal errors
        (0, vitest_1.expect)(eventFired).toBe(false); // Not immediate
        service.flushBuffer('test1');
      });
    });
  });
  (0, vitest_1.describe)('dispose', () => {
    (0, vitest_1.it)('should clean up all resources', () => {
      service.bufferData('test1', 'data');
      service.bufferData('test2', 'data');
      let stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.activeBuffers).toBeGreaterThan(0);
      service.dispose();
      // After dispose, should be clean
      stats = service.getBufferStats();
      (0, vitest_1.expect)(stats.activeBuffers).toBe(0);
      (0, vitest_1.expect)(stats.pendingFlushes).toBe(0);
    });
  });
  (0, vitest_1.describe)('Performance Tests', () => {
    (0, vitest_1.it)('should handle high-frequency data efficiently', async () => {
      let eventCount = 0;
      const startTime = Date.now();
      await new Promise((resolve) => {
        service.onData(() => {
          eventCount++;
          if (eventCount === 10) {
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(1000);
            resolve();
          }
        });
        // Send data rapidly
        for (let i = 0; i < 10; i++) {
          service.bufferData(`test${i}`, `data${i}`);
          service.flushBuffer(`test${i}`);
        }
      });
    });
    (0, vitest_1.it)('should maintain performance with CLI Agent mode', async () => {
      service.setCliAgentActive(true);
      let eventCount = 0;
      await new Promise((resolve) => {
        service.onData(() => {
          eventCount++;
          if (eventCount === 5) {
            resolve();
          }
        });
        // Rapid data in CLI Agent mode
        for (let i = 0; i < 5; i++) {
          service.bufferData('agent-test', `fast-data-${i}`);
          service.flushBuffer('agent-test');
        }
      });
    });
  });
});
//# sourceMappingURL=TerminalDataBufferService.test.js.map
