'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const test_constants_1 = require('../config/test-constants');
/**
 * Basic setup test to verify Playwright configuration
 */
test_1.test.describe('E2E Test Setup', () => {
  (0, test_1.test)('should have Playwright configured correctly', async () => {
    // This test verifies that Playwright is set up and can run
    (0, test_1.expect)(test_constants_1.TEST_TIMEOUTS.DEFAULT).toBe(30000);
    (0, test_1.expect)(test_constants_1.TEST_TIMEOUTS.EXTENSION_ACTIVATION).toBe(5000);
  });
  (0, test_1.test)('should have test constants defined', async () => {
    (0, test_1.expect)(test_constants_1.TEST_TIMEOUTS).toBeDefined();
    (0, test_1.expect)(test_constants_1.TEST_TIMEOUTS.DEFAULT).toBeGreaterThan(0);
  });
});
//# sourceMappingURL=setup.spec.js.map
