"use strict";
/**
 * TerminalOperationsCoordinator Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalOperationsCoordinator_1 = require("../../../../../webview/coordinators/TerminalOperationsCoordinator");
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('TerminalOperationsCoordinator', () => {
    let coordinator;
    let mockDeps;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        mockDeps = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('t1'),
            setActiveTerminalId: vitest_1.vi.fn(),
            getTerminalInstance: vitest_1.vi.fn(),
            getAllTerminalInstances: vitest_1.vi.fn().mockReturnValue(new Map()),
            getTerminalStats: vitest_1.vi
                .fn()
                .mockReturnValue({ totalTerminals: 1, activeTerminalId: 't1', terminalIds: ['t1'] }),
            postMessageToExtension: vitest_1.vi.fn(),
            showWarning: vitest_1.vi.fn(),
            createTerminalInstance: vitest_1.vi.fn().mockResolvedValue({}),
            removeTerminalInstance: vitest_1.vi.fn().mockResolvedValue(true),
            getTerminalCount: vitest_1.vi.fn().mockReturnValue(1),
            ensureSplitModeBeforeCreation: vitest_1.vi.fn().mockResolvedValue(undefined),
            refreshSplitLayout: vitest_1.vi.fn(),
            prepareDisplayForDeletion: vitest_1.vi.fn(),
            updateTerminalBorders: vitest_1.vi.fn(),
            focusTerminal: vitest_1.vi.fn(),
            addTab: vitest_1.vi.fn(),
            setActiveTab: vitest_1.vi.fn(),
            removeTab: vitest_1.vi.fn(),
            saveSession: vitest_1.vi.fn().mockResolvedValue(true),
            removeCliAgentState: vitest_1.vi.fn(),
        };
        coordinator = new TerminalOperationsCoordinator_1.TerminalOperationsCoordinator(mockDeps);
    });
    (0, vitest_1.afterEach)(() => {
        coordinator.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('createTerminal', () => {
        (0, vitest_1.it)('should create terminal successfully', async () => {
            mockDeps.canCreateTerminal = () => true;
            mockDeps.getTerminalCount.mockReturnValue(0);
            const result = await coordinator.createTerminal('t-new', 'New Terminal');
            (0, vitest_1.expect)(result).toBeTruthy();
            (0, vitest_1.expect)(mockDeps.createTerminalInstance).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDeps.addTab).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should prevent duplicate creations', async () => {
            coordinator.markTerminalCreationPending('t1');
            await coordinator.createTerminal('t1', 'Duplicate');
            (0, vitest_1.expect)(mockDeps.createTerminalInstance).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should block creation if limit reached', async () => {
            mockDeps.getTerminalCount.mockReturnValue(10);
            const result = await coordinator.createTerminal('t-limit', 'Limit Test');
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(mockDeps.showWarning).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('deleteTerminalSafely', () => {
        (0, vitest_1.it)('should prevent deleting last terminal', async () => {
            mockDeps.getTerminalStats.mockReturnValue({ totalTerminals: 1 });
            mockDeps.getTerminalInstance.mockReturnValue({ terminal: {} });
            const result = await coordinator.deleteTerminalSafely('t1');
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(mockDeps.showWarning).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should send delete request to extension', async () => {
            mockDeps.getTerminalStats.mockReturnValue({ totalTerminals: 2 });
            mockDeps.getTerminalInstance.mockReturnValue({});
            const result = await coordinator.deleteTerminalSafely('t1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockDeps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'deleteTerminal',
                terminalId: 't1',
            }));
        });
    });
    (0, vitest_1.describe)('Queueing', () => {
        (0, vitest_1.it)('should queue and process creation requests', async () => {
            coordinator.queueTerminalCreation('Queued');
            (0, vitest_1.expect)(coordinator.getPendingCreationsCount()).toBe(1);
            // Assume limit reached, then state update clears it
            coordinator.processPendingCreationRequests();
            (0, vitest_1.expect)(mockDeps.postMessageToExtension).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                command: 'createTerminal',
                terminalName: 'Queued',
            }));
        });
    });
    (0, vitest_1.describe)('Disposal', () => {
        (0, vitest_1.it)('should clear all state', () => {
            coordinator.markTerminalCreationPending('t1');
            coordinator.dispose();
            (0, vitest_1.expect)(coordinator.isTerminalCreationPending('t1')).toBe(false);
        });
    });
});
//# sourceMappingURL=TerminalOperationsCoordinator.test.js.map