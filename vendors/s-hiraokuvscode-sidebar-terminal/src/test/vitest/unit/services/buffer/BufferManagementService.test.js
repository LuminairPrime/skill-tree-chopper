"use strict";
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * BufferManagementService Unit Tests
 *
 * Tests for the buffer management service.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const EventBus_1 = require("../../../../../core/EventBus");
const BufferManagementService_1 = require("../../../../../services/buffer/BufferManagementService");
(0, vitest_1.describe)('BufferManagementService', () => {
    let eventBus;
    let service;
    (0, vitest_1.beforeEach)(() => {
        eventBus = new EventBus_1.EventBus();
        service = new BufferManagementService_1.BufferManagementService(eventBus);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        eventBus.dispose();
    });
    (0, vitest_1.describe)('Buffer Initialization', () => {
        (0, vitest_1.it)('should initialize buffer with default configuration', () => {
            service.initializeBuffer(1);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats).toBeDefined();
            (0, vitest_1.expect)(stats?.terminalId).toBe(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(0);
        });
        (0, vitest_1.it)('should initialize buffer with custom configuration', () => {
            service.initializeBuffer(1, {
                flushInterval: 100,
                maxBufferSize: 1000,
            });
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(100);
        });
        (0, vitest_1.it)('should not reinitialize existing buffer', () => {
            service.initializeBuffer(1);
            service.write(1, 'test');
            service.initializeBuffer(1); // Should not clear buffer
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.describe)('Buffer Write Operations', () => {
        (0, vitest_1.it)('should write data to buffer', () => {
            service.initializeBuffer(1);
            const buffered = service.write(1, 'test data');
            (0, vitest_1.expect)(buffered).toBe(true);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(9);
        });
        (0, vitest_1.it)('should initialize buffer on-demand', () => {
            const buffered = service.write(1, 'test');
            (0, vitest_1.expect)(buffered).toBe(true);
            (0, vitest_1.expect)(service.getBufferStats(1)).toBeDefined();
        });
        (0, vitest_1.it)('should accumulate multiple writes', () => {
            service.initializeBuffer(1);
            service.write(1, 'Hello ');
            service.write(1, 'World');
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(11);
        });
        (0, vitest_1.it)('should flush immediately on buffer overflow', () => {
            service.initializeBuffer(1, { maxBufferSize: 2 });
            let overflowEventReceived = false;
            eventBus.subscribe(BufferManagementService_1.BufferOverflowEvent, () => {
                overflowEventReceived = true;
            });
            service.write(1, '12345');
            const buffered = service.write(1, '67890X'); // Exceeds max chunk count
            (0, vitest_1.expect)(buffered).toBe(false); // Flushed immediately
            (0, vitest_1.expect)(overflowEventReceived).toBe(true);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(0); // Buffer cleared after flush
        });
        (0, vitest_1.it)('should treat maxBufferSize consistently as chunk count', () => {
            service.initializeBuffer(1, { maxBufferSize: 2 });
            // First large chunk should still be buffered if maxBufferSize is chunk-based.
            const firstBuffered = service.write(1, 'x'.repeat(100));
            (0, vitest_1.expect)(firstBuffered).toBe(true);
            // Second chunk reaches chunk limit and flushes.
            const secondBuffered = service.write(1, 'y'.repeat(100));
            (0, vitest_1.expect)(secondBuffered).toBe(false);
        });
    });
    (0, vitest_1.describe)('Buffer Flush Operations', () => {
        (0, vitest_1.it)('should flush buffer and return data', () => {
            service.initializeBuffer(1);
            service.write(1, 'test');
            const data = service.flush(1);
            (0, vitest_1.expect)(data).toBe('test');
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(0);
        });
        (0, vitest_1.it)('should return empty string for empty buffer', () => {
            service.initializeBuffer(1);
            const data = service.flush(1);
            (0, vitest_1.expect)(data).toBe('');
        });
        (0, vitest_1.it)('should update flush statistics', () => {
            service.initializeBuffer(1);
            service.write(1, 'data1');
            service.flush(1);
            service.write(1, 'data2');
            service.flush(1);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.flushCount).toBe(2);
        });
        (0, vitest_1.it)('should publish flush event', () => {
            let flushedData = '';
            eventBus.subscribe(BufferManagementService_1.BufferFlushedEvent, (event) => {
                flushedData = event.data.data;
            });
            service.initializeBuffer(1);
            service.write(1, 'test');
            service.flush(1);
            (0, vitest_1.expect)(flushedData).toBe('test');
        });
        (0, vitest_1.it)('should flush all buffers', () => {
            service.initializeBuffer(1);
            service.initializeBuffer(2);
            service.write(1, 'data1');
            service.write(2, 'data2');
            const result = service.flushAll();
            (0, vitest_1.expect)(result.size).toBe(2);
            (0, vitest_1.expect)(result.get(1)).toBe('data1');
            (0, vitest_1.expect)(result.get(2)).toBe('data2');
        });
    });
    (0, vitest_1.describe)('Flush Interval Management', () => {
        (0, vitest_1.it)('should set flush interval', () => {
            service.initializeBuffer(1);
            service.setFlushInterval(1, 200);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(200);
        });
        (0, vitest_1.it)('should get default flush interval for uninitialized buffer', () => {
            const interval = service.getFlushInterval(999);
            (0, vitest_1.expect)(interval).toBe(16); // Default
        });
        (0, vitest_1.it)('should auto-flush after interval', async () => {
            service.initializeBuffer(1, { flushInterval: 20 });
            let flushed = false;
            eventBus.subscribe(BufferManagementService_1.BufferFlushedEvent, () => {
                flushed = true;
            });
            service.write(1, 'test');
            await new Promise((resolve) => {
                setTimeout(() => {
                    (0, vitest_1.expect)(flushed).toBe(true);
                    resolve();
                }, 30);
            });
        }, 100);
    });
    (0, vitest_1.describe)('Adaptive Buffering', () => {
        (0, vitest_1.it)('should enable adaptive buffering', () => {
            service.initializeBuffer(1, { adaptiveBuffering: false });
            service.enableAdaptiveBuffering(1);
            // Verify by checking CLI agent mode behavior
            service.onCliAgentDetected(1);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(4); // CLI agent interval
        });
        (0, vitest_1.it)('should disable adaptive buffering', () => {
            service.initializeBuffer(1, { adaptiveBuffering: true });
            service.disableAdaptiveBuffering(1);
            // Verify by checking CLI agent mode doesn't change interval
            const originalInterval = service.getFlushInterval(1);
            service.onCliAgentDetected(1);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(originalInterval);
        });
    });
    (0, vitest_1.describe)('CLI Agent Mode', () => {
        (0, vitest_1.it)('should switch to high-performance mode on CLI agent detection', () => {
            service.initializeBuffer(1, { adaptiveBuffering: true });
            service.onCliAgentDetected(1);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(4); // 250fps mode
        });
        (0, vitest_1.it)('should return to normal mode on CLI agent disconnection', () => {
            service.initializeBuffer(1, { adaptiveBuffering: true });
            service.onCliAgentDetected(1);
            service.onCliAgentDisconnected(1);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(16); // Normal mode
        });
        (0, vitest_1.it)('should not change interval if adaptive buffering is disabled', () => {
            service.initializeBuffer(1, {
                adaptiveBuffering: false,
                flushInterval: 50,
            });
            service.onCliAgentDetected(1);
            (0, vitest_1.expect)(service.getFlushInterval(1)).toBe(50); // Unchanged
        });
    });
    (0, vitest_1.describe)('Buffer Statistics', () => {
        (0, vitest_1.it)('should return buffer statistics', () => {
            service.initializeBuffer(1);
            service.write(1, 'test');
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats).toBeDefined();
            if (stats) {
                (0, vitest_1.expect)(stats.terminalId).toBe(1);
                (0, vitest_1.expect)(stats.currentSize).toBe(4);
                (0, vitest_1.expect)(stats.flushCount).toBe(0);
                (0, vitest_1.expect)(stats.lastFlushAt).toBeInstanceOf(Date);
            }
        });
        (0, vitest_1.it)('should return undefined for non-existent buffer', () => {
            const stats = service.getBufferStats(999);
            (0, vitest_1.expect)(stats).toBeUndefined();
        });
        (0, vitest_1.it)('should get all buffer statistics', () => {
            service.initializeBuffer(1);
            service.initializeBuffer(2);
            service.initializeBuffer(3);
            const allStats = service.getAllBufferStats();
            (0, vitest_1.expect)(allStats).toHaveLength(3);
            (0, vitest_1.expect)(allStats[0]?.terminalId).toBe(1);
            (0, vitest_1.expect)(allStats[1]?.terminalId).toBe(2);
            (0, vitest_1.expect)(allStats[2]?.terminalId).toBe(3);
        });
        (0, vitest_1.it)('should return empty array when no buffers exist', () => {
            const allStats = service.getAllBufferStats();
            (0, vitest_1.expect)(allStats).toEqual([]);
        });
    });
    (0, vitest_1.describe)('Buffer Clear and Disposal', () => {
        (0, vitest_1.it)('should clear buffer without disposing', () => {
            service.initializeBuffer(1);
            service.write(1, 'test');
            service.clearBuffer(1);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(0);
            (0, vitest_1.expect)(stats).toBeDefined(); // Buffer still exists
        });
        (0, vitest_1.it)('should dispose buffer and flush data', () => {
            let flushedData = '';
            eventBus.subscribe(BufferManagementService_1.BufferFlushedEvent, (event) => {
                flushedData = event.data.data;
            });
            service.initializeBuffer(1);
            service.write(1, 'test');
            service.disposeBuffer(1);
            (0, vitest_1.expect)(flushedData).toBe('test');
            (0, vitest_1.expect)(service.getBufferStats(1)).toBeUndefined();
        });
        (0, vitest_1.it)('should dispose all buffers', () => {
            service.initializeBuffer(1);
            service.initializeBuffer(2);
            service.write(1, 'data1');
            service.write(2, 'data2');
            service.dispose();
            (0, vitest_1.expect)(service.getAllBufferStats()).toEqual([]);
        });
        (0, vitest_1.it)('should throw error when using disposed service', () => {
            service.dispose();
            (0, vitest_1.expect)(() => service.initializeBuffer(1)).toThrow('Cannot use disposed BufferManagementService');
        });
        (0, vitest_1.it)('should allow multiple dispose calls', () => {
            service.dispose();
            service.dispose(); // Should not throw
            (0, vitest_1.expect)(true).toBe(true);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle write to non-existent buffer gracefully', () => {
            // Should auto-initialize
            (0, vitest_1.expect)(() => service.write(999, 'test')).not.toThrow();
        });
        (0, vitest_1.it)('should handle flush of non-existent buffer gracefully', () => {
            const data = service.flush(999);
            (0, vitest_1.expect)(data).toBe('');
        });
        (0, vitest_1.it)('should handle clear of non-existent buffer gracefully', () => {
            (0, vitest_1.expect)(() => service.clearBuffer(999)).not.toThrow();
        });
        (0, vitest_1.it)('should handle dispose of non-existent buffer gracefully', () => {
            (0, vitest_1.expect)(() => service.disposeBuffer(999)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Performance and Resource Management', () => {
        (0, vitest_1.it)('should handle rapid writes efficiently', () => {
            service.initializeBuffer(1, { maxBufferSize: 1000 });
            const startTime = Date.now();
            for (let i = 0; i < 100; i++) {
                service.write(1, `line ${i}\n`);
            }
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(50); // Should complete quickly
        });
        (0, vitest_1.it)('should handle multiple terminals', () => {
            for (let i = 1; i <= 10; i++) {
                service.initializeBuffer(i);
                service.write(i, `data for terminal ${i}`);
            }
            const allStats = service.getAllBufferStats();
            (0, vitest_1.expect)(allStats).toHaveLength(10);
        });
        (0, vitest_1.it)('should clean up timers on disposal', async () => {
            service.initializeBuffer(1, { flushInterval: 10 });
            service.dispose();
            // Wait to ensure no timer fires
            await new Promise((resolve) => {
                setTimeout(() => {
                    // Test passes if no error is thrown
                    resolve();
                }, 50);
            });
        }, 500);
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle empty string writes', () => {
            service.initializeBuffer(1);
            service.write(1, '');
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(0);
        });
        (0, vitest_1.it)('should handle very large buffer sizes', () => {
            service.initializeBuffer(1, { maxBufferSize: 10000 });
            const largeData = 'x'.repeat(5000);
            service.write(1, largeData);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.currentSize).toBe(5000);
        });
        (0, vitest_1.it)('should handle flush of empty buffer multiple times', () => {
            service.initializeBuffer(1);
            service.flush(1);
            service.flush(1);
            service.flush(1);
            const stats = service.getBufferStats(1);
            (0, vitest_1.expect)(stats?.flushCount).toBe(0); // No data to flush
        });
    });
});
//# sourceMappingURL=BufferManagementService.test.js.map