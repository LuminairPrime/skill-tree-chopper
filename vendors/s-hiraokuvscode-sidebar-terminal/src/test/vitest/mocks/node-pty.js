"use strict";
/**
 * node-pty Mock for Vitest
 * Provides a complete mock of node-pty for testing terminal operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawn = spawn;
const vitest_1 = require("vitest");
class MockPty {
    constructor(_file, _args, options) {
        this.pid = Math.floor(Math.random() * 10000) + 1000;
        this.cols = 80;
        this.rows = 24;
        this.process = 'mock-shell';
        this.handleFlowControl = false;
        this.dataCallbacks = [];
        this.exitCallbacks = [];
        this._killed = false;
        this.onData = vitest_1.vi.fn((callback) => {
            this.dataCallbacks.push(callback);
            return {
                dispose: () => {
                    const index = this.dataCallbacks.indexOf(callback);
                    if (index > -1)
                        this.dataCallbacks.splice(index, 1);
                },
            };
        });
        this.onExit = vitest_1.vi.fn((callback) => {
            this.exitCallbacks.push(callback);
            return {
                dispose: () => {
                    const index = this.exitCallbacks.indexOf(callback);
                    if (index > -1)
                        this.exitCallbacks.splice(index, 1);
                },
            };
        });
        this.write = vitest_1.vi.fn((_data) => {
            // Simulate echo back for testing
        });
        this.resize = vitest_1.vi.fn((cols, rows) => {
            this.cols = cols;
            this.rows = rows;
        });
        this.kill = vitest_1.vi.fn((_signal) => {
            if (!this._killed) {
                this._killed = true;
                this.exitCallbacks.forEach((cb) => cb({ exitCode: 0 }));
            }
        });
        this.pause = vitest_1.vi.fn();
        this.resume = vitest_1.vi.fn();
        this.clear = vitest_1.vi.fn();
        if (options?.cols)
            this.cols = options.cols;
        if (options?.rows)
            this.rows = options.rows;
        if (options?.handleFlowControl !== undefined)
            this.handleFlowControl = options.handleFlowControl;
    }
    // Test helper methods
    _simulateData(data) {
        this.dataCallbacks.forEach((cb) => cb(data));
    }
    _simulateExit(exitCode, signal) {
        if (!this._killed) {
            this._killed = true;
            this.exitCallbacks.forEach((cb) => cb({ exitCode, signal }));
        }
    }
}
function spawn(file, args = [], options) {
    return new MockPty(file, args, options);
}
exports.default = {
    spawn,
};
//# sourceMappingURL=node-pty.js.map