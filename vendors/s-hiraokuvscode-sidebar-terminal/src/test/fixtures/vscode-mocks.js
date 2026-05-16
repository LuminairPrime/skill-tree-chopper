"use strict";
/**
 * VS Code API Mock Factory
 *
 * Provides consistent and reusable mocks for VS Code API objects.
 * Designed to work with the global vscode mock from mocha-setup.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeMockFactory = void 0;
exports.getGlobalVSCodeMock = getGlobalVSCodeMock;
exports.ensureStub = ensureStub;
const sinon = require("sinon");
/**
 * Factory for creating VS Code API mocks
 */
class VSCodeMockFactory {
    /**
     * Creates a mock WorkspaceConfiguration object
     */
    static createWorkspaceConfiguration(sandbox) {
        return {
            get: sandbox.stub(),
            has: sandbox.stub().returns(true),
            inspect: sandbox.stub(),
            update: sandbox.stub().resolves(),
        };
    }
    /**
     * Creates a mock Workspace object
     */
    static createWorkspace(sandbox, config) {
        const configuration = config || this.createWorkspaceConfiguration(sandbox);
        return {
            getConfiguration: sandbox.stub().returns(configuration),
            onDidChangeConfiguration: sandbox.stub().returns({ dispose: sandbox.stub() }),
            workspaceFolders: undefined,
            getWorkspaceFolder: sandbox.stub().returns(undefined),
        };
    }
    /**
     * Sets up mocks on the global vscode object that was created by mocha-setup.ts
     * This method reuses the existing global mock instead of creating a new one.
     *
     * @param sandbox - Sinon sandbox for cleanup
     * @returns Object containing the workspace and configuration mocks
     */
    static setupGlobalMock(sandbox) {
        const globalVscode = global.vscode;
        if (!globalVscode) {
            throw new Error('Global vscode mock not initialized. Ensure mocha-setup.ts runs first.');
        }
        // Create fresh configuration mock
        const configuration = this.createWorkspaceConfiguration(sandbox);
        // Reset existing stubs if they exist
        if (globalVscode.workspace.getConfiguration) {
            if (globalVscode.workspace.getConfiguration.resetBehavior) {
                globalVscode.workspace.getConfiguration.resetBehavior();
            }
            if (globalVscode.workspace.getConfiguration.returns) {
                globalVscode.workspace.getConfiguration.returns(configuration);
            }
        }
        return {
            workspace: globalVscode.workspace,
            configuration,
            ConfigurationTarget: globalVscode.ConfigurationTarget || {
                Global: 1,
                Workspace: 2,
                WorkspaceFolder: 3,
            },
        };
    }
    /**
     * Configures a configuration mock with default values
     *
     * @param config - The configuration mock to configure
     * @param defaults - Default values for configuration keys
     */
    static configureDefaults(config, defaults) {
        Object.entries(defaults).forEach(([key, value]) => {
            config.get.withArgs(key).returns(value);
            config.get.withArgs(key, sinon.match.any).returns(value);
        });
    }
    /**
     * Creates a disposable mock
     */
    static createDisposable(sandbox) {
        return {
            dispose: sandbox.stub(),
        };
    }
    /**
     * Creates a mock event emitter
     */
    static createEventEmitter(sandbox) {
        return {
            event: sandbox.stub(),
            fire: sandbox.stub(),
            dispose: sandbox.stub(),
        };
    }
}
exports.VSCodeMockFactory = VSCodeMockFactory;
/**
 * Helper function to get the global vscode mock
 * Throws an error if not initialized
 */
function getGlobalVSCodeMock() {
    const globalVscode = global.vscode;
    if (!globalVscode) {
        throw new Error('Global vscode mock not initialized');
    }
    return globalVscode;
}
/**
 * Helper to check if a stub needs to be created or reused
 */
function ensureStub(sandbox, object, method) {
    // If already a stub, reset and return it
    if (object[method] && object[method].isSinonProxy) {
        object[method].reset();
        return object[method];
    }
    // Otherwise create a new stub
    return sandbox.stub(object, method);
}
//# sourceMappingURL=vscode-mocks.js.map