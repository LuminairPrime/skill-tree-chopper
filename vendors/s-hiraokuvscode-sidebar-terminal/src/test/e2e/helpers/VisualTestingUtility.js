'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.VisualTestingUtility = void 0;
const test_1 = require('@playwright/test');
const test_constants_1 = require('../config/test-constants');
const path = require('path');
/**
 * Helper class for visual testing and screenshot comparison
 * Provides utilities for capturing and comparing screenshots
 */
class VisualTestingUtility {
  constructor(page) {
    this.page = page;
  }
  /**
   * Capture a screenshot
   * @param options - Screenshot options
   * @returns Path to saved screenshot
   */
  async captureScreenshot(options) {
    const { name, fullPage = false, element } = options;
    const screenshotPath = path.join(test_constants_1.TEST_PATHS.SCREENSHOTS, name);
    if (element) {
      const locator = this.page.locator(element);
      await locator.screenshot({ path: screenshotPath });
    } else {
      await this.page.screenshot({
        path: screenshotPath,
        fullPage,
      });
    }
    console.log(`[E2E] Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }
  /**
   * Compare screenshot with baseline
   * @param options - Screenshot options
   */
  async compareWithBaseline(options) {
    const {
      name,
      maxDiffPixels = test_constants_1.VISUAL_TEST_CONSTANTS.MAX_DIFF_PIXELS,
      threshold = test_constants_1.VISUAL_TEST_CONSTANTS.THRESHOLD,
    } = options;
    await (0, test_1.expect)(this.page).toHaveScreenshot(name, {
      maxDiffPixels,
      threshold,
    });
  }
  /**
   * Capture element screenshot
   * @param selector - Element selector
   * @param name - Screenshot name
   * @returns Path to saved screenshot
   */
  async captureElement(selector, name) {
    return await this.captureScreenshot({
      name,
      element: selector,
    });
  }
  /**
   * Capture full page screenshot
   * @param name - Screenshot name
   * @returns Path to saved screenshot
   */
  async captureFullPage(name) {
    return await this.captureScreenshot({
      name,
      fullPage: true,
    });
  }
  /**
   * Update baseline screenshot
   * @param options - Screenshot options
   */
  async updateBaseline(options) {
    // Capture new screenshot as baseline
    await this.captureScreenshot(options);
    console.log(`[E2E] Baseline updated: ${options.name}`);
  }
  /**
   * Check if two screenshots match
   * @param _actual - Actual screenshot path
   * @param _expected - Expected screenshot path
   * @param _tolerance - Pixel difference tolerance (0.0-1.0)
   * @returns True if screenshots match within tolerance
   */
  async screenshotsMatch(_actual, _expected, _tolerance = 0.001) {
    // Future: Implement pixel-by-pixel comparison
    console.log('[E2E] Comparing screenshots (placeholder)');
    return true;
  }
  /**
   * Get screenshot diff percentage
   * @param _actual - Actual screenshot path
   * @param _expected - Expected screenshot path
   * @returns Percentage of different pixels (0.0-100.0)
   */
  async getScreenshotDiff(_actual, _expected) {
    // Future: Calculate pixel difference percentage
    return 0.0;
  }
  /**
   * Generate diff image
   * @param actual - Actual screenshot path
   * @param expected - Expected screenshot path
   * @param output - Output path for diff image
   */
  async generateDiffImage(actual, expected, output) {
    // Future: Generate highlighted diff image
    console.log(`[E2E] Diff image would be saved to: ${output}`);
  }
}
exports.VisualTestingUtility = VisualTestingUtility;
//# sourceMappingURL=VisualTestingUtility.js.map
