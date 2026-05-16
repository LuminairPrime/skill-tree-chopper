"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = require("vscode");
const TelemetryService_1 = require("../../../../services/TelemetryService");
// Mock VS Code API
vitest_1.vi.mock('vscode', () => ({
    env: {
        createTelemetryLogger: vitest_1.vi.fn(),
    },
    Disposable: class {
        constructor() {
            this.dispose = vitest_1.vi.fn();
        }
        static from(..._args) {
            return { dispose: vitest_1.vi.fn() };
        }
    },
}));
(0, vitest_1.describe)('TelemetryService', () => {
    let service;
    let mockContext;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        mockLogger = {
            logUsage: vitest_1.vi.fn(),
            logError: vitest_1.vi.fn(),
            dispose: vitest_1.vi.fn(),
        };
        vitest_1.vi.mocked(vscode.env.createTelemetryLogger).mockReturnValue(mockLogger);
        mockContext = {
            subscriptions: [],
        };
        service = new TelemetryService_1.TelemetryService(mockContext, 'test-extension', '1.0.0');
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
    });
    (0, vitest_1.it)('should initialize and register logger', () => {
        (0, vitest_1.expect)(vscode.env.createTelemetryLogger).toHaveBeenCalled();
        (0, vitest_1.expect)(mockContext.subscriptions).toContain(mockLogger);
    });
    (0, vitest_1.it)('should track extension activation', () => {
        service.trackActivation(1234567890);
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.ExtensionActivated, vitest_1.expect.objectContaining({
            extensionId: 'test-extension',
            version: '1.0.0',
            activationTime: 1234567890,
        }));
    });
    (0, vitest_1.it)('should track extension deactivation with duration', () => {
        const activationTime = Date.now() - 1000;
        service.trackActivation(activationTime);
        // Fast forward usually requires fake timers, but here we just check if it calculates something
        service.trackDeactivation();
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.ExtensionDeactivated, vitest_1.expect.objectContaining({
            extensionId: 'test-extension',
            sessionDuration: vitest_1.expect.any(Number),
        }));
    });
    (0, vitest_1.it)('should track terminal created without sensitive info', () => {
        service.trackTerminalCreated('term-123', 'My Profile');
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.TerminalCreated, {
            hasProfile: true,
        });
        // Ensure no sensitive data
        (0, vitest_1.expect)(mockLogger.logUsage).not.toHaveBeenCalledWith(vitest_1.expect.anything(), vitest_1.expect.objectContaining({ terminalId: 'term-123' }));
    });
    (0, vitest_1.it)('should track cli agent detection', () => {
        service.trackCliAgentDetected('claude');
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.CliAgentDetected, {
            agentType: 'claude',
        });
    });
    (0, vitest_1.it)('should track errors', () => {
        const error = new Error('Test Error');
        service.trackError(error, 'test-context');
        (0, vitest_1.expect)(mockLogger.logError).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.ErrorOccurred, vitest_1.expect.objectContaining({
            errorMessage: 'Test Error',
            context: 'test-context',
        }));
    });
    (0, vitest_1.it)('should measure sync operation performance', () => {
        const result = service.measure('test-op', () => {
            return 'success';
        });
        (0, vitest_1.expect)(result).toBe('success');
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.PerformanceMetric, vitest_1.expect.objectContaining({
            operation: 'test-op',
            success: true,
            duration: vitest_1.expect.any(Number),
        }));
    });
    (0, vitest_1.it)('should measure async operation performance', async () => {
        const result = await service.measureAsync('test-async', async () => {
            return 'async-success';
        });
        (0, vitest_1.expect)(result).toBe('async-success');
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.PerformanceMetric, vitest_1.expect.objectContaining({
            operation: 'test-async',
            success: true,
            duration: vitest_1.expect.any(Number),
        }));
    });
    (0, vitest_1.it)('should track failure in measurements', () => {
        (0, vitest_1.expect)(() => {
            service.measure('fail-op', () => {
                throw new Error('Fail');
            });
        }).toThrow('Fail');
        (0, vitest_1.expect)(mockLogger.logUsage).toHaveBeenCalledWith(TelemetryService_1.TelemetryEventType.PerformanceMetric, vitest_1.expect.objectContaining({
            operation: 'fail-op',
            success: false,
        }));
    });
});
//# sourceMappingURL=TelemetryService.test.js.map