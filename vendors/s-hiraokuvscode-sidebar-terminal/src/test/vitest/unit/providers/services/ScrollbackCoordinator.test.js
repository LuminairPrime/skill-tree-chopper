"use strict";
/**
 * ScrollbackCoordinator Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackCoordinator_1 = require("../../../../../providers/services/ScrollbackCoordinator");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('ScrollbackCoordinator', () => {
    let coordinator;
    let mockSendMessage;
    (0, vitest_1.beforeEach)(() => {
        mockSendMessage = vitest_1.vi.fn().mockResolvedValue(undefined);
        coordinator = new ScrollbackCoordinator_1.ScrollbackCoordinator(mockSendMessage);
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        coordinator.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('requestScrollbackData', () => {
        (0, vitest_1.it)('should send extraction message to WebView', async () => {
            const promise = coordinator.requestScrollbackData('term-1', 500);
            (0, vitest_1.expect)(mockSendMessage).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'extractScrollbackData',
                terminalId: 'term-1',
                maxLines: 500,
                requestId: vitest_1.expect.any(String),
            }));
            coordinator.clearPendingRequests();
            await promise;
        });
        (0, vitest_1.it)('should resolve with data when response is received', async () => {
            const promise = coordinator.requestScrollbackData('term-1');
            const requestId = mockSendMessage.mock.calls[0][0].requestId;
            coordinator.handleScrollbackDataResponse({
                command: 'scrollbackDataResponse',
                terminalId: 'term-1',
                scrollbackData: ['line1', 'line2'],
                requestId, // using injected property
            });
            const result = await promise;
            (0, vitest_1.expect)(result).toEqual(['line1', 'line2']);
        });
        (0, vitest_1.it)('should resolve with empty array on timeout', async () => {
            const promise = coordinator.requestScrollbackData('term-1');
            vitest_1.vi.advanceTimersByTime(10000);
            const result = await promise;
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('should resolve with empty array on error response', async () => {
            const promise = coordinator.requestScrollbackData('term-1');
            const requestId = mockSendMessage.mock.calls[0][0].requestId;
            coordinator.handleScrollbackDataResponse({
                command: 'scrollbackDataResponse',
                error: 'Failed to extract',
                requestId,
            });
            const result = await promise;
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)('requestMultipleScrollbackData', () => {
        (0, vitest_1.it)('should collect data from multiple terminals in parallel', async () => {
            const promise = coordinator.requestMultipleScrollbackData(['t1', 't2']);
            // Simulate responses
            const req1 = mockSendMessage.mock.calls.find((c) => c[0].terminalId === 't1')[0]
                .requestId;
            const req2 = mockSendMessage.mock.calls.find((c) => c[0].terminalId === 't2')[0]
                .requestId;
            coordinator.handleScrollbackDataResponse({
                requestId: req1,
                terminalId: 't1',
                scrollbackData: ['data1'],
            });
            coordinator.handleScrollbackDataResponse({
                requestId: req2,
                terminalId: 't2',
                scrollbackData: ['data2'],
            });
            const result = await promise;
            (0, vitest_1.expect)(result).toEqual({
                t1: ['data1'],
                t2: ['data2'],
            });
        });
    });
    (0, vitest_1.describe)('Maintenance', () => {
        (0, vitest_1.it)('should track pending requests count', () => {
            coordinator.requestScrollbackData('t1');
            coordinator.requestScrollbackData('t2');
            (0, vitest_1.expect)(coordinator.getPendingRequestsCount()).toBe(2);
        });
        (0, vitest_1.it)('should handle responses with missing requestId gracefully', () => {
            // Should not throw
            coordinator.handleScrollbackDataResponse({ command: 'test' });
        });
        (0, vitest_1.it)('should handle responses for non-existent requests gracefully', () => {
            // Should not throw
            coordinator.handleScrollbackDataResponse({ requestId: 'unknown' });
        });
    });
});
//# sourceMappingURL=ScrollbackCoordinator.test.js.map