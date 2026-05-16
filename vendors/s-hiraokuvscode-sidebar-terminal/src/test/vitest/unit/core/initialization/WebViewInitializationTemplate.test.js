"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const WebViewInitializationTemplate_1 = require("../../../../../core/initialization/WebViewInitializationTemplate");
// Mock concrete implementation
class TestInitializationTemplate extends WebViewInitializationTemplate_1.WebViewInitializationTemplate {
    constructor() {
        super(...arguments);
        this.setupViewReferenceCalled = false;
        this.registerMessageHandlersCalled = false;
        this.initializeContentCalled = false;
        this.instantiateManagersCalled = false;
        this.postInitializationSetupCalled = false;
    }
    async setupViewReference() {
        this.setupViewReferenceCalled = true;
    }
    async registerMessageHandlers() {
        this.registerMessageHandlersCalled = true;
    }
    async initializeContent() {
        this.initializeContentCalled = true;
    }
    async instantiateManagers() {
        this.instantiateManagersCalled = true;
    }
    async postInitializationSetup() {
        this.postInitializationSetupCalled = true;
    }
}
(0, vitest_1.describe)('WebViewInitializationTemplate', () => {
    let template;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        template = new TestInitializationTemplate();
    });
    (0, vitest_1.it)('should execute all phases in order', async () => {
        await template.initialize();
        (0, vitest_1.expect)(template.isInitialized()).toBe(true);
        (0, vitest_1.expect)(template.setupViewReferenceCalled).toBe(true);
        (0, vitest_1.expect)(template.instantiateManagersCalled).toBe(true);
        (0, vitest_1.expect)(template.registerMessageHandlersCalled).toBe(true);
        (0, vitest_1.expect)(template.initializeContentCalled).toBe(true);
        (0, vitest_1.expect)(template.postInitializationSetupCalled).toBe(true);
    });
    (0, vitest_1.it)('should prevent duplicate initialization by default', async () => {
        await template.initialize();
        // Reset flags
        template.setupViewReferenceCalled = false;
        await template.initialize();
        (0, vitest_1.expect)(template.setupViewReferenceCalled).toBe(false);
    });
    (0, vitest_1.it)('should allow duplicate initialization if context permits', async () => {
        await template.initialize();
        template.setupViewReferenceCalled = false;
        await template.initialize({ skipDuplicates: false });
        (0, vitest_1.expect)(template.setupViewReferenceCalled).toBe(true);
    });
    (0, vitest_1.it)('should track metrics for each phase', async () => {
        await template.initialize();
        const metrics = template.getInitializationMetrics();
        (0, vitest_1.expect)(metrics.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(metrics.find((m) => m.phase === 'Core Setup')).toBeDefined();
        (0, vitest_1.expect)(metrics.every((m) => m.success === true)).toBe(true);
    });
    (0, vitest_1.it)('should handle errors and track failure metrics', async () => {
        const errorTemplate = new (class extends TestInitializationTemplate {
            async initializeContent() {
                throw new Error('Content failure');
            }
            handleInitializationError(_error) {
                // Recovery: don't re-throw
            }
        })();
        // Should not throw because we overridden handleInitializationError to recover
        await errorTemplate.initialize();
        (0, vitest_1.expect)(errorTemplate.isInitialized()).toBe(false);
        const metrics = errorTemplate.getInitializationMetrics();
        const contentMetric = metrics.find((m) => m.phase === 'Content Initialization');
        (0, vitest_1.expect)(contentMetric?.success).toBe(false);
        (0, vitest_1.expect)(String(contentMetric?.error)).toContain('Content failure');
    });
    (0, vitest_1.it)('should throw error if errorRecovery is false', async () => {
        const errorTemplate = new (class extends TestInitializationTemplate {
            async initializeContent() {
                throw new Error('Content failure');
            }
        })();
        await (0, vitest_1.expect)(errorTemplate.initialize({ errorRecovery: false })).rejects.toThrow('Content failure');
    });
});
//# sourceMappingURL=WebViewInitializationTemplate.test.js.map