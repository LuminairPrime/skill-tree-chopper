"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalProcessManager = void 0;
const OperationResultHandler_1 = require("../utils/OperationResultHandler");
/** Handles PTY process operations: read/write, resize, and lifecycle management */
class TerminalProcessManager {
    constructor() {
        this.WRITE_RETRY_DELAY_MS = 500;
        this.DEFAULT_MAX_RETRIES = 3;
    }
    writeToPty(terminal, data) {
        const ptyInstance = this.getPtyInstance(terminal);
        if (!ptyInstance) {
            return OperationResultHandler_1.OperationResultHandler.failure('PTY not ready');
        }
        if (!this.validatePtyWrite(ptyInstance)) {
            return OperationResultHandler_1.OperationResultHandler.failure('PTY instance missing write method or process killed');
        }
        try {
            ptyInstance.write(data);
            return OperationResultHandler_1.OperationResultHandler.success();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return OperationResultHandler_1.OperationResultHandler.failure(`Write failed: ${errorMessage}`);
        }
    }
    resizePty(terminal, cols, rows) {
        const validation = this.validateDimensions(cols, rows);
        if (!validation.success) {
            return validation;
        }
        const ptyInstance = this.getPtyInstance(terminal);
        if (!ptyInstance) {
            return OperationResultHandler_1.OperationResultHandler.failure('No PTY instance available');
        }
        if (typeof ptyInstance.resize !== 'function') {
            return OperationResultHandler_1.OperationResultHandler.failure('PTY instance missing resize method');
        }
        if (!this.isPtyAlive(terminal)) {
            return OperationResultHandler_1.OperationResultHandler.failure('PTY process has been killed');
        }
        try {
            ptyInstance.resize(cols, rows);
            return OperationResultHandler_1.OperationResultHandler.success();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return OperationResultHandler_1.OperationResultHandler.failure(`Resize failed: ${errorMessage}`);
        }
    }
    killPty(terminal) {
        const ptyInstance = this.getPtyInstance(terminal);
        if (!ptyInstance) {
            return OperationResultHandler_1.OperationResultHandler.failure('No PTY instance to kill');
        }
        try {
            if (typeof ptyInstance.kill === 'function') {
                ptyInstance.kill();
                return OperationResultHandler_1.OperationResultHandler.success();
            }
            else {
                return OperationResultHandler_1.OperationResultHandler.failure('PTY instance missing kill method');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return OperationResultHandler_1.OperationResultHandler.failure(`Kill failed: ${errorMessage}`);
        }
    }
    isPtyAlive(terminal) {
        const ptyInstance = this.getPtyInstance(terminal);
        if (!ptyInstance) {
            return false;
        }
        if (terminal.ptyProcess &&
            typeof terminal.ptyProcess === 'object' &&
            'killed' in terminal.ptyProcess &&
            terminal.ptyProcess.killed) {
            return false;
        }
        return Boolean(ptyInstance.pid && ptyInstance.pid > 0);
    }
    async retryWrite(terminal, data, maxRetries = this.DEFAULT_MAX_RETRIES) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const result = this.writeToPty(terminal, data);
            if (result.success) {
                return result;
            }
            lastError = result.error;
            if (attempt < maxRetries - 1) {
                await this.delay(this.WRITE_RETRY_DELAY_MS);
                await this.waitForPtyReady(terminal, this.WRITE_RETRY_DELAY_MS);
            }
        }
        return OperationResultHandler_1.OperationResultHandler.failure(`Write failed after ${maxRetries} attempts: ${lastError}`);
    }
    attemptRecovery(terminal) {
        const alternatives = [terminal.ptyProcess, terminal.pty].filter(Boolean);
        for (const ptyInstance of alternatives) {
            if (ptyInstance && typeof ptyInstance.write === 'function') {
                try {
                    if (ptyInstance === (terminal.ptyProcess || terminal.pty)) {
                        continue;
                    }
                    ptyInstance.write('');
                    if (ptyInstance === terminal.pty) {
                        terminal.ptyProcess = undefined;
                    }
                    return OperationResultHandler_1.OperationResultHandler.success();
                }
                catch {
                    // Alternative PTY instance also failed
                }
            }
        }
        return OperationResultHandler_1.OperationResultHandler.failure('All recovery attempts failed');
    }
    getPtyInstance(terminal) {
        return terminal.ptyProcess || terminal.pty;
    }
    validatePtyWrite(ptyInstance) {
        if (typeof ptyInstance.write !== 'function') {
            return false;
        }
        if ('killed' in ptyInstance && ptyInstance.killed) {
            return false;
        }
        return true;
    }
    validateDimensions(cols, rows) {
        if (cols <= 0 || rows <= 0) {
            return OperationResultHandler_1.OperationResultHandler.failure(`Invalid dimensions: ${cols}x${rows}`);
        }
        if (cols > 500 || rows > 200) {
            return OperationResultHandler_1.OperationResultHandler.failure(`Dimensions too large: ${cols}x${rows}`);
        }
        return OperationResultHandler_1.OperationResultHandler.success();
    }
    async waitForPtyReady(terminal, timeoutMs) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const ptyInstance = this.getPtyInstance(terminal);
            if (ptyInstance && this.validatePtyWrite(ptyInstance)) {
                return true;
            }
            await this.delay(100);
        }
        return false;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.TerminalProcessManager = TerminalProcessManager;
//# sourceMappingURL=TerminalProcessManager.js.map