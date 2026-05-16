"use strict";
/**
 * InitializationOrchestrator Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InitializationOrchestrator_1 = require("../../../../../providers/services/InitializationOrchestrator");
const { mockTerminalCoordinator, mockMessageRouter } = vitest_1.vi.hoisted(() => ({
    mockTerminalCoordinator: {
        initialize: vitest_1.vi.fn().mockResolvedValue(undefined),
    },
    mockMessageRouter: {
        setInitialized: vitest_1.vi.fn(),
        logRegisteredHandlers: vitest_1.vi.fn(),
    },
}));
const mockLifecycleManager = {};
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    provider: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('InitializationOrchestrator', () => {
    let orchestrator;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockTerminalCoordinator.initialize.mockResolvedValue(undefined);
        orchestrator = new InitializationOrchestrator_1.InitializationOrchestrator(mockTerminalCoordinator, mockLifecycleManager, mockMessageRouter);
    });
    (0, vitest_1.describe)('Initial State', () => {
        (0, vitest_1.it)('should start in NOT_STARTED phase', () => {
            (0, vitest_1.expect)(orchestrator.getCurrentPhase()).toBe(InitializationOrchestrator_1.InitializationPhase.NOT_STARTED);
            (0, vitest_1.expect)(orchestrator.isInitialized()).toBe(false);
        });
    });
    (0, vitest_1.describe)('initialize', () => {
        (0, vitest_1.it)('should complete all phases successfully', async () => {
            const result = await orchestrator.initialize();
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.phase).toBe(InitializationOrchestrator_1.InitializationPhase.COMPLETED);
            (0, vitest_1.expect)(orchestrator.isInitialized()).toBe(true);
            (0, vitest_1.expect)(mockMessageRouter.setInitialized).toHaveBeenCalledWith(true);
            (0, vitest_1.expect)(mockTerminalCoordinator.initialize).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should track phase timings', async () => {
            await orchestrator.initialize();
            const timings = orchestrator.getPhaseTimings();
            (0, vitest_1.expect)(timings.has(InitializationOrchestrator_1.InitializationPhase.WEBVIEW_SETUP)).toBe(true);
            (0, vitest_1.expect)(timings.has(InitializationOrchestrator_1.InitializationPhase.MESSAGE_HANDLERS)).toBe(true);
            (0, vitest_1.expect)(timings.has(InitializationOrchestrator_1.InitializationPhase.TERMINAL_SETUP)).toBe(true);
            (0, vitest_1.expect)(orchestrator.getTotalDuration()).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should skip initialization if already complete', async () => {
            await orchestrator.initialize();
            mockTerminalCoordinator.initialize.mockClear();
            const result = await orchestrator.initialize();
            (0, vitest_1.expect)(result.phase).toBe(InitializationOrchestrator_1.InitializationPhase.COMPLETED);
            (0, vitest_1.expect)(mockTerminalCoordinator.initialize).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle phase failure gracefully', async () => {
            const error = new Error('Setup failed');
            mockTerminalCoordinator.initialize.mockRejectedValue(error);
            const result = await orchestrator.initialize();
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.phase).toBe(InitializationOrchestrator_1.InitializationPhase.FAILED);
            (0, vitest_1.expect)(result.error).toBe(error);
            (0, vitest_1.expect)(orchestrator.isInitialized()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Reset and Independent Init', () => {
        (0, vitest_1.it)('should initialize terminals independently', async () => {
            await orchestrator.initializeTerminals();
            (0, vitest_1.expect)(mockTerminalCoordinator.initialize).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should allow re-initialization after reset', async () => {
            await orchestrator.initialize();
            orchestrator.reset();
            (0, vitest_1.expect)(orchestrator.isInitialized()).toBe(false);
            (0, vitest_1.expect)(orchestrator.getCurrentPhase()).toBe(InitializationOrchestrator_1.InitializationPhase.NOT_STARTED);
            await orchestrator.initialize();
            (0, vitest_1.expect)(orchestrator.isInitialized()).toBe(true);
        });
    });
});
//# sourceMappingURL=InitializationOrchestrator.test.js.map