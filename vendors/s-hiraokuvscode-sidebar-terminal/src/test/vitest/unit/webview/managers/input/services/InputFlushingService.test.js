"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const InputFlushingService_1 = require("../../../../../../../webview/managers/input/services/InputFlushingService");
(0, vitest_1.describe)('InputFlushingService', () => {
    let dom;
    let service;
    let mockLogger;
    let mockSendInput;
    let deps;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.useFakeTimers();
        mockLogger = vitest_1.vi.fn();
        mockSendInput = vitest_1.vi.fn();
        // @ts-expect-error - test mock type
        deps = { logger: mockLogger, sendInput: mockSendInput };
        service = new InputFlushingService_1.InputFlushingService(deps);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('queueInputData', () => {
        (0, vitest_1.it)('should not send input for empty terminalId', () => {
            service.queueInputData('', 'a', true);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not send input for empty data', () => {
            service.queueInputData('terminal-1', '', true);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should flush immediately when flushImmediately is true', () => {
            service.queueInputData('terminal-1', 'a', true);
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('a', 'terminal-1');
        });
        (0, vitest_1.it)('should buffer data and flush after microtask when flushImmediately is false', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.queueInputData('terminal-1', 'b', false);
            // Not flushed yet
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('ab', 'terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should batch buffered data then flush immediately when a flush-immediate item arrives', () => {
            service.queueInputData('terminal-1', 'ls', false);
            service.queueInputData('terminal-1', '\r', true);
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('ls\r', 'terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should not schedule multiple timers for the same terminal', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.queueInputData('terminal-1', 'b', false);
            service.queueInputData('terminal-1', 'c', false);
            vitest_1.vi.advanceTimersByTime(10);
            // All should be batched in one call
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('abc', 'terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should maintain separate buffers for different terminals', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.queueInputData('terminal-2', 'x', false);
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('a', 'terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('x', 'terminal-2');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledTimes(2);
        });
    });
    (0, vitest_1.describe)('flushPendingInput', () => {
        (0, vitest_1.it)('should be a no-op for an unknown terminal', () => {
            service.flushPendingInput('unknown');
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should be a no-op when buffer is empty', () => {
            service.queueInputData('terminal-1', 'a', true);
            mockSendInput.mockClear();
            // Buffer is now empty after immediate flush
            service.flushPendingInput('terminal-1');
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should cancel pending timer when flushing manually', () => {
            service.queueInputData('terminal-1', 'a', false);
            // Manually flush before timer fires
            service.flushPendingInput('terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('a', 'terminal-1');
            mockSendInput.mockClear();
            // Timer fires but buffer is empty, no duplicate send
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('shouldFlushImmediately', () => {
        const makeKeyboardEvent = (key) => {
            return new dom.window.KeyboardEvent('keydown', { key });
        };
        (0, vitest_1.it)('should return true for empty data', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('', makeKeyboardEvent('a'))).toBe(true);
        });
        (0, vitest_1.it)('should return true for Enter key', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('\r', makeKeyboardEvent('Enter'))).toBe(true);
        });
        (0, vitest_1.it)('should return true for Backspace key', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('\x7f', makeKeyboardEvent('Backspace'))).toBe(true);
        });
        (0, vitest_1.it)('should return true for Delete key', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('\x1b[3~', makeKeyboardEvent('Delete'))).toBe(true);
        });
        (0, vitest_1.it)('should return true for data containing newline', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('hello\n', makeKeyboardEvent('a'))).toBe(true);
        });
        (0, vitest_1.it)('should return true for data containing carriage return', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('hello\r', makeKeyboardEvent('a'))).toBe(true);
        });
        (0, vitest_1.it)('should return false for regular character input', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('a', makeKeyboardEvent('a'))).toBe(false);
        });
        (0, vitest_1.it)('should return false for multi-char non-newline data', () => {
            (0, vitest_1.expect)(service.shouldFlushImmediately('abc', makeKeyboardEvent('c'))).toBe(false);
        });
    });
    (0, vitest_1.describe)('clearTerminalBuffer', () => {
        (0, vitest_1.it)('should clear buffered data and cancel timer for a terminal', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.clearTerminalBuffer('terminal-1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should be a no-op for an unknown terminal', () => {
            (0, vitest_1.expect)(() => service.clearTerminalBuffer('unknown')).not.toThrow();
        });
        (0, vitest_1.it)('should not affect other terminals', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.queueInputData('terminal-2', 'b', false);
            service.clearTerminalBuffer('terminal-1');
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalledWith('a', 'terminal-1');
            (0, vitest_1.expect)(mockSendInput).toHaveBeenCalledWith('b', 'terminal-2');
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear all pending timers and buffers', () => {
            service.queueInputData('terminal-1', 'a', false);
            service.queueInputData('terminal-2', 'b', false);
            service.dispose();
            vitest_1.vi.advanceTimersByTime(10);
            (0, vitest_1.expect)(mockSendInput).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should be safe to call multiple times', () => {
            service.dispose();
            (0, vitest_1.expect)(() => service.dispose()).not.toThrow();
        });
    });
});
//# sourceMappingURL=InputFlushingService.test.js.map