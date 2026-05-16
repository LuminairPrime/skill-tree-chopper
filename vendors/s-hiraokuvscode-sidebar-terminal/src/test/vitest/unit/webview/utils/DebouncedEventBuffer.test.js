"use strict";
/**
 * DebouncedEventBuffer Unit Tests
 *
 * Tests for debouncing, throttling, and event buffering utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DebouncedEventBuffer_1 = require("../../../../../webview/utils/DebouncedEventBuffer");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('DebouncedEventBuffer', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Debouncer', () => {
        (0, vitest_1.describe)('basic functionality', () => {
            (0, vitest_1.it)('should delay execution by specified delay', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                debouncer.trigger();
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(50);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(50);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
            (0, vitest_1.it)('should reset timer on subsequent triggers', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(50);
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(50);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(50);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
            (0, vitest_1.it)('should execute immediately on leading edge when configured', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100, leading: true });
                debouncer.trigger();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                // Trailing edge execution
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(2);
                debouncer.dispose();
            });
            (0, vitest_1.it)('should not execute on trailing edge when trailing is false', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100, leading: true, trailing: false });
                debouncer.trigger();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('cancel', () => {
            (0, vitest_1.it)('should cancel pending execution', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(50);
                debouncer.cancel();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                debouncer.dispose();
            });
            (0, vitest_1.it)('should reset leading executed flag', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100, leading: true, trailing: false });
                debouncer.trigger();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.cancel();
                debouncer.trigger();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(2);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('flush', () => {
            (0, vitest_1.it)('should execute immediately and cancel pending', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                debouncer.trigger();
                debouncer.flush();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('isPending', () => {
            (0, vitest_1.it)('should return true when execution is pending', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                (0, vitest_1.expect)(debouncer.isPending()).toBe(false);
                debouncer.trigger();
                (0, vitest_1.expect)(debouncer.isPending()).toBe(true);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(debouncer.isPending()).toBe(false);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('dispose', () => {
            (0, vitest_1.it)('should cancel pending and clean up', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100 });
                debouncer.trigger();
                debouncer.dispose();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
            });
        });
        (0, vitest_1.describe)('debug logging', () => {
            (0, vitest_1.it)('should log when debug is enabled', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = new DebouncedEventBuffer_1.Debouncer(callback, { delay: 100, debug: true, name: 'test' });
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(100);
                debouncer.dispose();
            });
        });
    });
    (0, vitest_1.describe)('Throttler', () => {
        (0, vitest_1.describe)('basic functionality', () => {
            (0, vitest_1.it)('should execute immediately on first call (leading)', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100 });
                throttler.trigger('arg1');
                (0, vitest_1.expect)(callback).toHaveBeenCalledWith('arg1');
                throttler.dispose();
            });
            (0, vitest_1.it)('should throttle subsequent calls', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100 });
                throttler.trigger('first');
                throttler.trigger('second');
                throttler.trigger('third');
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(2);
                (0, vitest_1.expect)(callback).toHaveBeenLastCalledWith('third');
                throttler.dispose();
            });
            (0, vitest_1.it)('should allow execution after interval passes', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100 });
                throttler.trigger('first');
                vitest_1.vi.advanceTimersByTime(100);
                throttler.trigger('second');
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(2);
                throttler.dispose();
            });
            (0, vitest_1.it)('should not execute on leading when leading is false', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100, leading: false });
                throttler.trigger('arg');
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledWith('arg');
                throttler.dispose();
            });
            (0, vitest_1.it)('should not execute on trailing when trailing is false', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100, trailing: false });
                throttler.trigger('first');
                throttler.trigger('second');
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                throttler.dispose();
            });
        });
        (0, vitest_1.describe)('cancel', () => {
            (0, vitest_1.it)('should cancel pending trailing execution', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100 });
                throttler.trigger('first');
                throttler.trigger('second');
                throttler.cancel();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                throttler.dispose();
            });
        });
        (0, vitest_1.describe)('dispose', () => {
            (0, vitest_1.it)('should cancel pending and clean up', () => {
                const callback = vitest_1.vi.fn();
                const throttler = new DebouncedEventBuffer_1.Throttler(callback, { interval: 100 });
                throttler.trigger('first');
                throttler.trigger('second');
                throttler.dispose();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
            });
        });
    });
    (0, vitest_1.describe)('EventBuffer', () => {
        (0, vitest_1.describe)('add', () => {
            (0, vitest_1.it)('should buffer items and flush after interval', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('item1');
                buffer.add('item2');
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1', 'item2']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should flush when maxBufferSize is reached', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    maxBufferSize: 3,
                    onFlush,
                });
                buffer.add('item1');
                buffer.add('item2');
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                buffer.add('item3');
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should not flush on max when flushOnMax is false', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    maxBufferSize: 3,
                    flushOnMax: false,
                    onFlush,
                });
                buffer.add('item1');
                buffer.add('item2');
                buffer.add('item3');
                buffer.add('item4');
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1', 'item2', 'item3', 'item4']);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('addAll', () => {
            (0, vitest_1.it)('should add multiple items at once', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.addAll(['item1', 'item2', 'item3']);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('flush', () => {
            (0, vitest_1.it)('should flush immediately', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('item1');
                buffer.flush();
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should not call onFlush if buffer is empty', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.flush();
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('clear', () => {
            (0, vitest_1.it)('should clear buffer without flushing', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('item1');
                buffer.add('item2');
                buffer.clear();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('properties', () => {
            (0, vitest_1.it)('should return correct size', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                (0, vitest_1.expect)(buffer.size).toBe(0);
                buffer.add('item1');
                (0, vitest_1.expect)(buffer.size).toBe(1);
                buffer.add('item2');
                (0, vitest_1.expect)(buffer.size).toBe(2);
                buffer.dispose();
            });
            (0, vitest_1.it)('should return correct isEmpty', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                (0, vitest_1.expect)(buffer.isEmpty).toBe(true);
                buffer.add('item1');
                (0, vitest_1.expect)(buffer.isEmpty).toBe(false);
                buffer.dispose();
            });
            (0, vitest_1.it)('should return correct isFlushScheduled', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                (0, vitest_1.expect)(buffer.isFlushScheduled).toBe(false);
                buffer.add('item1');
                (0, vitest_1.expect)(buffer.isFlushScheduled).toBe(true);
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(buffer.isFlushScheduled).toBe(false);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('dispose', () => {
            (0, vitest_1.it)('should flush remaining items on dispose', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.EventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('item1');
                buffer.dispose();
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item1']);
            });
        });
    });
    (0, vitest_1.describe)('KeyedEventBuffer', () => {
        (0, vitest_1.describe)('add', () => {
            (0, vitest_1.it)('should buffer items by key', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key1', 'item2');
                buffer.add('key2', 'item3');
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith('key1', ['item1', 'item2']);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith('key2', ['item3']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should flush when maxBufferSize is reached for a key', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    maxBufferSize: 2,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key1', 'item2');
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith('key1', ['item1', 'item2']);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('flushKey', () => {
            (0, vitest_1.it)('should flush specific key only', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                buffer.flushKey('key1');
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledTimes(1);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith('key1', ['item1']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should do nothing if key does not exist', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.flushKey('nonexistent');
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('flushAll', () => {
            (0, vitest_1.it)('should flush all keys', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                buffer.flushAll();
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledTimes(2);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('clearKey', () => {
            (0, vitest_1.it)('should clear specific key without flushing', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                buffer.clearKey('key1');
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledTimes(1);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith('key2', ['item2']);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('clearAll', () => {
            (0, vitest_1.it)('should clear all keys without flushing', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                buffer.clearAll();
                vitest_1.vi.advanceTimersByTime(100);
                (0, vitest_1.expect)(onFlush).not.toHaveBeenCalled();
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('getSize', () => {
            (0, vitest_1.it)('should return size for a key', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                (0, vitest_1.expect)(buffer.getSize('key1')).toBe(0);
                buffer.add('key1', 'item1');
                (0, vitest_1.expect)(buffer.getSize('key1')).toBe(1);
                buffer.add('key1', 'item2');
                (0, vitest_1.expect)(buffer.getSize('key1')).toBe(2);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('getKeys', () => {
            (0, vitest_1.it)('should return all keys', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                (0, vitest_1.expect)(buffer.getKeys()).toEqual([]);
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                (0, vitest_1.expect)(buffer.getKeys()).toEqual(['key1', 'key2']);
                buffer.dispose();
            });
        });
        (0, vitest_1.describe)('dispose', () => {
            (0, vitest_1.it)('should flush and clear all on dispose', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = new DebouncedEventBuffer_1.KeyedEventBuffer({
                    flushInterval: 100,
                    onFlush,
                });
                buffer.add('key1', 'item1');
                buffer.add('key2', 'item2');
                buffer.dispose();
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledTimes(2);
                (0, vitest_1.expect)(buffer.getKeys()).toEqual([]);
            });
        });
    });
    (0, vitest_1.describe)('Factory Functions', () => {
        (0, vitest_1.describe)('createDebouncer', () => {
            (0, vitest_1.it)('should create a debouncer with specified delay', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = (0, DebouncedEventBuffer_1.createDebouncer)(callback, 50);
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(50);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
            (0, vitest_1.it)('should accept additional options', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = (0, DebouncedEventBuffer_1.createDebouncer)(callback, 50, { leading: true });
                debouncer.trigger();
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('createResizeDebouncer', () => {
            (0, vitest_1.it)('should create a debouncer with default 100ms delay', () => {
                const callback = vitest_1.vi.fn();
                const debouncer = (0, DebouncedEventBuffer_1.createResizeDebouncer)(callback);
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(99);
                (0, vitest_1.expect)(callback).not.toHaveBeenCalled();
                vitest_1.vi.advanceTimersByTime(1);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
            (0, vitest_1.it)('should accept custom delay', () => {
                const callback = vitest_1.vi.fn();
                // @ts-expect-error - test mock type
                const debouncer = (0, DebouncedEventBuffer_1.createResizeDebouncer)(callback, 200);
                debouncer.trigger();
                vitest_1.vi.advanceTimersByTime(200);
                (0, vitest_1.expect)(callback).toHaveBeenCalledTimes(1);
                debouncer.dispose();
            });
        });
        (0, vitest_1.describe)('createOutputBuffer', () => {
            (0, vitest_1.it)('should create a buffer with default 16ms interval', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = (0, DebouncedEventBuffer_1.createOutputBuffer)(onFlush);
                buffer.add('item');
                vitest_1.vi.advanceTimersByTime(16);
                (0, vitest_1.expect)(onFlush).toHaveBeenCalledWith(['item']);
                buffer.dispose();
            });
            (0, vitest_1.it)('should create a buffer with default 100 max size', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = (0, DebouncedEventBuffer_1.createOutputBuffer)(onFlush);
                for (let i = 0; i < 100; i++) {
                    buffer.add(i);
                }
                (0, vitest_1.expect)(onFlush).toHaveBeenCalled();
                buffer.dispose();
            });
            (0, vitest_1.it)('should accept custom options', () => {
                const onFlush = vitest_1.vi.fn();
                const buffer = (0, DebouncedEventBuffer_1.createOutputBuffer)(onFlush, {
                    flushInterval: 50,
                    maxBufferSize: 5,
                });
                for (let i = 0; i < 5; i++) {
                    buffer.add(`item${i}`);
                }
                (0, vitest_1.expect)(onFlush).toHaveBeenCalled();
                buffer.dispose();
            });
        });
    });
});
//# sourceMappingURL=DebouncedEventBuffer.test.js.map