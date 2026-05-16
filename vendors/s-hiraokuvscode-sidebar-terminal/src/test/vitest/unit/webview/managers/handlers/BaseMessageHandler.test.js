"use strict";
/**
 * BaseMessageHandler Unit Tests
 *
 * Tests for abstract base message handler with common patterns
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BaseMessageHandler_1 = require("../../../../../../webview/managers/handlers/BaseMessageHandler");
const MessageQueue_1 = require("../../../../../../webview/utils/MessageQueue");
const ManagerLogger_1 = require("../../../../../../webview/utils/ManagerLogger");
// Concrete implementation for testing abstract class
class TestMessageHandler extends BaseMessageHandler_1.BaseMessageHandler {
    constructor() {
        super(...arguments);
        this.supportedCommands = ['testCommand1', 'testCommand2', 'testCommand3'];
    }
    async handleMessage(msg, _coordinator) {
        const command = this.getCommand(msg);
        if (!this.validate(msg)) {
            this.handleValidationError(msg);
            return;
        }
        switch (command) {
            case 'testCommand1':
                this.handleTestCommand1(msg);
                break;
            case 'testCommand2':
                await this.handleTestCommand2(msg);
                break;
            case 'testCommand3':
                this.handleTestCommand3WithError(msg);
                break;
            default:
                this.handleUnknownCommand(command);
        }
    }
    handleTestCommand1(_msg) {
        // Simple command
    }
    async handleTestCommand2(_msg) {
        // Async command
    }
    handleTestCommand3WithError(_msg) {
        throw new Error('Test error');
    }
    // Expose protected methods for testing
    testGetCommand(msg) {
        return this.getCommand(msg);
    }
    testValidate(msg) {
        return this.validate(msg);
    }
    testHandleError(error, operation, context) {
        this.handleError(error, operation, context);
    }
    testHandleWarning(error, operation, context) {
        this.handleWarning(error, operation, context);
    }
    testSafeExecute(operation, operationName, context) {
        return this.safeExecute(operation, operationName, context);
    }
    testHasProperty(msg, prop) {
        return this.hasProperty(msg, prop);
    }
    testGetProperty(msg, prop) {
        return this.getProperty(msg, prop);
    }
    testGetRequiredProperty(msg, prop) {
        return this.getRequiredProperty(msg, prop);
    }
}
(0, vitest_1.describe)('BaseMessageHandler', () => {
    let handler;
    let messageQueue;
    let logger;
    let loggerWarnSpy;
    let mockCoordinator;
    (0, vitest_1.beforeEach)(() => {
        messageQueue = new MessageQueue_1.MessageQueue({}, {});
        logger = new ManagerLogger_1.ManagerLogger('test');
        // Spy on logger methods
        vitest_1.vi.spyOn(logger, 'info').mockImplementation(() => { });
        loggerWarnSpy = vitest_1.vi.spyOn(logger, 'warn').mockImplementation(() => { });
        vitest_1.vi.spyOn(logger, 'error').mockImplementation(() => { });
        handler = new TestMessageHandler(messageQueue, logger);
        // Create minimal coordinator mock
        mockCoordinator = {};
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('getSupportedCommands()', () => {
        (0, vitest_1.it)('should return list of supported commands', () => {
            const commands = handler.getSupportedCommands();
            (0, vitest_1.expect)(commands).toEqual(['testCommand1', 'testCommand2', 'testCommand3']);
        });
    });
    (0, vitest_1.describe)('getCommand()', () => {
        (0, vitest_1.it)('should extract command from message', () => {
            const msg = { command: 'testCommand1' };
            const command = handler.testGetCommand(msg);
            (0, vitest_1.expect)(command).toBe('testCommand1');
        });
        (0, vitest_1.it)('should return undefined for message without command', () => {
            const msg = {};
            const command = handler.testGetCommand(msg);
            (0, vitest_1.expect)(command).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('validate()', () => {
        (0, vitest_1.it)('should return true for valid message', () => {
            const msg = { command: 'testCommand1' };
            const isValid = handler.testValidate(msg);
            (0, vitest_1.expect)(isValid).toBe(true);
        });
        (0, vitest_1.it)('should return false for message without command', () => {
            const msg = {};
            const isValid = handler.testValidate(msg);
            (0, vitest_1.expect)(isValid).toBe(false);
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalledWith('Message missing command field');
        });
        (0, vitest_1.it)('should return false for unsupported command', () => {
            const msg = { command: 'unsupportedCommand' };
            const isValid = handler.testValidate(msg);
            (0, vitest_1.expect)(isValid).toBe(false);
        });
    });
    (0, vitest_1.describe)('handleUnknownCommand()', () => {
        (0, vitest_1.it)('should log warning for unknown command', async () => {
            // Note: When using handleMessage, validation happens first
            // so unsupported commands get validation error, not unknown command warning
            const msg = { command: 'unknownCommand' };
            await handler.handleMessage(msg, mockCoordinator);
            // Validation fails before unknown command handler is called
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalledWith('Validation failed for command: unknownCommand');
        });
    });
    (0, vitest_1.describe)('handleValidationError()', () => {
        (0, vitest_1.it)('should log validation error', async () => {
            const msg = { command: 'unsupportedCommand' };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalledWith('Validation failed for command: unsupportedCommand');
        });
    });
    (0, vitest_1.describe)('handleError()', () => {
        (0, vitest_1.it)('should handle error with ErrorHandler', () => {
            const error = new Error('Test error');
            handler.testHandleError(error, 'Test operation');
            // ErrorHandler should log the error (verified via loggerErrorStub in ErrorHandler tests)
        });
        (0, vitest_1.it)('should handle error with context', () => {
            const error = new Error('Context error');
            const context = { testId: '123', action: 'test' };
            handler.testHandleError(error, 'Context operation', context);
            // ErrorHandler logs context information
        });
    });
    (0, vitest_1.describe)('handleWarning()', () => {
        (0, vitest_1.it)('should handle warning with ErrorHandler', () => {
            const error = new Error('Warning test');
            handler.testHandleWarning(error, 'Warning operation');
            // ErrorHandler uses warn severity
        });
    });
    (0, vitest_1.describe)('safeExecute()', () => {
        (0, vitest_1.it)('should execute operation successfully', async () => {
            const result = await handler.testSafeExecute(() => 'success', 'Test operation');
            (0, vitest_1.expect)(result).toBe('success');
        });
        (0, vitest_1.it)('should handle operation error gracefully', async () => {
            const operation = () => {
                throw new Error('Operation failed');
            };
            const result = await handler.testSafeExecute(operation, 'Failing operation');
            (0, vitest_1.expect)(result).toBeUndefined();
        });
        (0, vitest_1.it)('should execute async operation successfully', async () => {
            const asyncOp = async () => 'async success';
            const result = await handler.testSafeExecute(asyncOp, 'Async operation');
            (0, vitest_1.expect)(result).toBe('async success');
        });
        (0, vitest_1.it)('should handle async operation error', async () => {
            const asyncOp = async () => {
                throw new Error('Async failed');
            };
            const result = await handler.testSafeExecute(asyncOp, 'Failing async operation');
            (0, vitest_1.expect)(result).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('hasProperty()', () => {
        (0, vitest_1.it)('should return true for existing property', () => {
            const msg = { command: 'test', terminalId: '123' };
            const hasTerminalId = handler.testHasProperty(msg, 'terminalId');
            (0, vitest_1.expect)(hasTerminalId).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existing property', () => {
            const msg = { command: 'test' };
            const hasTerminalId = handler.testHasProperty(msg, 'terminalId');
            (0, vitest_1.expect)(hasTerminalId).toBe(false);
        });
    });
    (0, vitest_1.describe)('getProperty()', () => {
        (0, vitest_1.it)('should return property value if exists', () => {
            const msg = { command: 'test', terminalId: '123' };
            const terminalId = handler.testGetProperty(msg, 'terminalId');
            (0, vitest_1.expect)(terminalId).toBe('123');
        });
        (0, vitest_1.it)('should return undefined for non-existing property', () => {
            const msg = { command: 'test' };
            const terminalId = handler.testGetProperty(msg, 'terminalId');
            (0, vitest_1.expect)(terminalId).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getRequiredProperty()', () => {
        (0, vitest_1.it)('should return property value if exists', () => {
            const msg = { command: 'test', terminalId: '123' };
            const terminalId = handler.testGetRequiredProperty(msg, 'terminalId');
            (0, vitest_1.expect)(terminalId).toBe('123');
        });
        (0, vitest_1.it)('should log warning for missing required property', () => {
            const msg = { command: 'test' };
            const terminalId = handler.testGetRequiredProperty(msg, 'terminalId');
            (0, vitest_1.expect)(terminalId).toBeUndefined();
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalledWith("Required property 'terminalId' missing from message");
        });
    });
    (0, vitest_1.describe)('dispose()', () => {
        (0, vitest_1.it)('should execute without error', () => {
            (0, vitest_1.expect)(() => handler.dispose()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Integration Scenarios', () => {
        (0, vitest_1.it)('should handle valid message end-to-end', async () => {
            const msg = { command: 'testCommand1' };
            await handler.handleMessage(msg, mockCoordinator);
            // Should execute successfully without errors
        });
        (0, vitest_1.it)('should handle async message end-to-end', async () => {
            const msg = { command: 'testCommand2' };
            await handler.handleMessage(msg, mockCoordinator);
            // Should execute async command successfully
        });
        (0, vitest_1.it)('should reject invalid message', async () => {
            const msg = { command: 'invalidCommand' };
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle message without command', async () => {
            const msg = {};
            await handler.handleMessage(msg, mockCoordinator);
            (0, vitest_1.expect)(loggerWarnSpy).toHaveBeenCalledWith('Message missing command field');
        });
    });
});
//# sourceMappingURL=BaseMessageHandler.test.js.map