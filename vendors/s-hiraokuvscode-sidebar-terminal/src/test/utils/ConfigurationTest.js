"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationTest = void 0;
const BaseTest_1 = require("./BaseTest");
const sinon = require("sinon");
/**
 * Specialized base class for configuration-related tests
 *
 * Features:
 * - Common configuration defaults
 * - Configuration change simulation
 * - Configuration target helpers
 * - Singleton reset helpers
 *
 * Usage:
 * ```typescript
 * class MyConfigTest extends ConfigurationTest {
 *   protected getDefaultConfig() {
 *     return {
 *       'myFeature.enabled': true,
 *       'myFeature.value': 42
 *     };
 *   }
 * }
 * ```
 */
class ConfigurationTest extends BaseTest_1.BaseTest {
    constructor() {
        super(...arguments);
        this.configChangeHandlers = [];
    }
    setup() {
        super.setup();
        // Setup configuration defaults
        const defaults = this.getDefaultConfig();
        if (defaults) {
            this.configureDefaults(defaults);
        }
        // Setup configuration change emitter
        this.configChangeEmitter = this.vscode.workspace.onDidChangeConfiguration;
        this.configChangeEmitter.callsFake((handler) => {
            this.configChangeHandlers.push(handler);
            return { dispose: this.sandbox.stub() };
        });
    }
    teardown() {
        this.configChangeHandlers = [];
        super.teardown();
    }
    /**
     * Override to provide default configuration values
     */
    getDefaultConfig() {
        return null;
    }
    /**
     * Simulate a configuration change event
     */
    triggerConfigChange(affectsConfiguration) {
        const event = {
            affectsConfiguration,
        };
        this.configChangeHandlers.forEach((handler) => {
            handler(event);
        });
    }
    /**
     * Simulate a configuration change for specific sections
     */
    triggerSectionChange(...sections) {
        this.triggerConfigChange((section) => {
            return sections.some((s) => section.startsWith(s));
        });
    }
    /**
     * Update a configuration value and optionally trigger change event
     */
    async updateConfig(key, value, triggerChange = true) {
        this.vscode.configuration.get.withArgs(key).returns(value);
        this.vscode.configuration.get.withArgs(key, sinon.match.any).returns(value);
        if (triggerChange) {
            const section = key.split('.')[0];
            if (section) {
                this.triggerSectionChange(section);
            }
        }
    }
    /**
     * Update multiple configuration values
     */
    async updateConfigs(configs, triggerChange = true) {
        Object.entries(configs).forEach(([key, value]) => {
            this.vscode.configuration.get.withArgs(key).returns(value);
            this.vscode.configuration.get.withArgs(key, sinon.match.any).returns(value);
        });
        if (triggerChange) {
            const sections = Array.from(new Set(Object.keys(configs)
                .map((key) => key.split('.')[0])
                .filter((s) => s !== undefined)));
            this.triggerSectionChange(...sections);
        }
    }
    /**
     * Get configuration target constants
     */
    get ConfigurationTarget() {
        return this.vscode.ConfigurationTarget;
    }
    /**
     * Assert configuration was updated with specific target
     */
    assertConfigUpdated(key, value, target) {
        const updateStub = this.vscode.configuration.update;
        if (target !== undefined) {
            if (!updateStub.calledWith(key, value, target)) {
                throw new Error(`Expected configuration "${key}" to be updated to ${JSON.stringify(value)} ` +
                    `with target ${target}, but it wasn't`);
            }
        }
        else {
            if (!updateStub.calledWith(key, value)) {
                throw new Error(`Expected configuration "${key}" to be updated to ${JSON.stringify(value)}, ` +
                    `but it wasn't`);
            }
        }
    }
    /**
     * Reset singleton instance (useful for configuration services)
     */
    resetSingleton(serviceClass) {
        serviceClass.instance = undefined;
    }
    /**
     * Mock configuration.inspect() response
     */
    mockInspect(key, globalValue, workspaceValue, workspaceFolderValue, defaultValue) {
        this.vscode.configuration.inspect.withArgs(key).returns({
            key,
            defaultValue,
            globalValue,
            workspaceValue,
            workspaceFolderValue,
        });
    }
    /**
     * Assert that a configuration change handler was registered
     */
    assertConfigChangeHandlerRegistered() {
        if (!this.configChangeEmitter.called) {
            throw new Error('Expected configuration change handler to be registered');
        }
    }
    /**
     * Get number of registered configuration change handlers
     */
    getConfigChangeHandlerCount() {
        return this.configChangeHandlers.length;
    }
    /**
     * Clear all registered configuration change handlers
     */
    clearConfigChangeHandlers() {
        this.configChangeHandlers = [];
    }
}
exports.ConfigurationTest = ConfigurationTest;
//# sourceMappingURL=ConfigurationTest.js.map