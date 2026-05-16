"use strict";
/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests complete
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
async function globalTeardown(_config) {
    console.log('🧹 Starting Playwright E2E test cleanup...');
    try {
        // Clean up any test artifacts if needed
        if (process.env.CLEAN_ARTIFACTS === 'true') {
            // Future: Clean up generated screenshots, videos, etc.
        }
        console.log('✅ Global teardown complete');
    }
    catch (error) {
        console.error('❌ Global teardown failed:', error);
        // Don't throw to allow test results to be reported
    }
}
//# sourceMappingURL=global-teardown.js.map