'use strict';
/**
 * CircularBuffer Tests
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const CircularBuffer_1 = require('../../../../utils/CircularBuffer');
(0, vitest_1.describe)('CircularBuffer', () => {
  (0, vitest_1.it)('uses the default capacity and starts empty', () => {
    const buffer = new CircularBuffer_1.CircularBuffer();
    (0, vitest_1.expect)(buffer.getCapacity()).toBe(50);
    (0, vitest_1.expect)(buffer.isEmpty()).toBe(true);
    (0, vitest_1.expect)(buffer.getSize()).toBe(0);
    (0, vitest_1.expect)(buffer.flush()).toBe('');
    (0, vitest_1.expect)(buffer.peek()).toBe('');
  });
  (0, vitest_1.it)('throws when initialized with a non-positive capacity', () => {
    (0, vitest_1.expect)(() => new CircularBuffer_1.CircularBuffer(0)).toThrow('capacity');
    (0, vitest_1.expect)(() => new CircularBuffer_1.CircularBuffer(-5)).toThrow('capacity');
  });
  (0, vitest_1.it)('buffers data in FIFO order and resets after flush', () => {
    const buffer = new CircularBuffer_1.CircularBuffer(3);
    buffer.push('a');
    buffer.push('bc');
    (0, vitest_1.expect)(buffer.getSize()).toBe(2);
    (0, vitest_1.expect)(buffer.peek()).toBe('abc');
    const flushed = buffer.flush();
    (0, vitest_1.expect)(flushed).toBe('abc');
    (0, vitest_1.expect)(buffer.isEmpty()).toBe(true);
  });
  (0, vitest_1.it)('does not clear data when peeking', () => {
    const buffer = new CircularBuffer_1.CircularBuffer(2);
    buffer.push('x');
    const firstPeek = buffer.peek();
    (0, vitest_1.expect)(firstPeek).toBe('x');
    (0, vitest_1.expect)(buffer.getSize()).toBe(1);
    (0, vitest_1.expect)(buffer.flush()).toBe('x');
  });
  (0, vitest_1.it)('overwrites the oldest entries once the buffer is full', () => {
    const buffer = new CircularBuffer_1.CircularBuffer(3);
    buffer.push('a');
    buffer.push('b');
    buffer.push('c');
    buffer.push('d');
    (0, vitest_1.expect)(buffer.getSize()).toBe(3);
    (0, vitest_1.expect)(buffer.peek()).toBe('bcd');
    (0, vitest_1.expect)(buffer.flush()).toBe('bcd');
    (0, vitest_1.expect)(buffer.isEmpty()).toBe(true);
  });
  (0, vitest_1.it)('reports the cumulative data length', () => {
    const buffer = new CircularBuffer_1.CircularBuffer(4);
    buffer.push('ab');
    buffer.push('cde');
    (0, vitest_1.expect)(buffer.getDataLength()).toBe(5);
  });
  (0, vitest_1.it)('can be cleared and reused without leaking entries', () => {
    const buffer = new CircularBuffer_1.CircularBuffer(2);
    buffer.push('foo');
    buffer.clear();
    (0, vitest_1.expect)(buffer.isEmpty()).toBe(true);
    (0, vitest_1.expect)(buffer.getSize()).toBe(0);
    buffer.push('bar');
    (0, vitest_1.expect)(buffer.flush()).toBe('bar');
  });
});
//# sourceMappingURL=CircularBuffer.test.js.map
