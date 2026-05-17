'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const helpers_1 = require('../../helpers');
/**
 * Visual Regression Tests - ANSI Colors
 * Based on TEST_PLAN.md Section 4.6: ANSI Color Rendering
 *
 * Test Scenarios:
 * - 4.6 ANSI Color Rendering (P0)
 * - Visual regression for color output
 * - Theme compatibility
 *
 * These tests use fixture-based content injection to validate
 * ANSI color rendering without requiring actual terminal I/O.
 */
test_1.test.describe('ANSI Color Rendering @visual-regression', () => {
  let vrtHelper;
  test_1.test.beforeEach(async ({ page }) => {
    vrtHelper = new helpers_1.VRTHelper(page);
    // Navigate to the standalone WebView fixture
    await page.goto('/standalone-webview.html');
    // Prepare page for VRT (disable animations, wait for render)
    await vrtHelper.prepareForVRT();
  });
  /**
   * Test Scenario 4.6: Basic 8-Color Palette
   * Priority: P0 (Critical)
   *
   * Validates that basic ANSI colors (8 colors) are
   * rendered correctly in the terminal.
   */
  (0, test_1.test)('should render 8-color palette correctly @P0', async ({ page }) => {
    // Arrange: Generate 8-color palette content
    const colorPalette = helpers_1.VRTHelper.generate8ColorPalette();
    // Act: Inject color content into terminal
    await vrtHelper.injectTerminalContent(colorPalette);
    // Assert: Visual comparison with baseline
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-8-colors.png');
  });
  /**
   * Test Scenario 4.6: 16-Color Palette (includes bright colors)
   * Priority: P0 (Critical)
   *
   * Validates that the full 16-color ANSI palette renders correctly.
   */
  (0, test_1.test)('should render 16-color palette correctly @P0', async ({ page }) => {
    // Arrange: Generate 16-color palette content
    const colorPalette = helpers_1.VRTHelper.generate16ColorPalette();
    // Act: Inject color content into terminal
    await vrtHelper.injectTerminalContent(colorPalette);
    // Assert: Visual comparison with baseline
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-16-colors.png');
  });
  /**
   * Test Scenario 4.6 (Extended): Bold and Italic Styling
   * Priority: P0 (Critical)
   *
   * Validates that text styling (bold, italic, underline)
   * is rendered correctly.
   */
  (0, test_1.test)('should render text styling correctly @P0', async ({ page }) => {
    // Arrange: Text with styling
    const styledText = [
      `${helpers_1.ANSI.BOLD}Bold text${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.ITALIC}Italic text${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.UNDERLINE}Underlined text${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}Bold red text${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.ITALIC}${helpers_1.ANSI.GREEN}Italic green text${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.UNDERLINE}${helpers_1.ANSI.BLUE}Bold underlined blue${helpers_1.ANSI.RESET}`,
    ].join('\n');
    // Act: Inject styled text
    await vrtHelper.injectTerminalContent(styledText);
    // Assert: Visual comparison
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-text-styling.png');
  });
  /**
   * Test Scenario 4.6 (Extended): Background Colors
   * Priority: P0 (Critical)
   *
   * Validates that ANSI background colors are rendered.
   */
  (0, test_1.test)('should render background colors correctly @P0', async ({ page }) => {
    // Arrange: Text with background colors
    const bgColors = [
      `${helpers_1.ANSI.BG_RED}${helpers_1.ANSI.WHITE} Red background ${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BG_GREEN}${helpers_1.ANSI.BLACK} Green background ${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BG_YELLOW}${helpers_1.ANSI.BLACK} Yellow background ${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BG_BLUE}${helpers_1.ANSI.WHITE} Blue background ${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BG_MAGENTA}${helpers_1.ANSI.WHITE} Magenta background ${helpers_1.ANSI.RESET}`,
      `${helpers_1.ANSI.BG_CYAN}${helpers_1.ANSI.BLACK} Cyan background ${helpers_1.ANSI.RESET}`,
    ].join('\n');
    // Act: Inject background colored text
    await vrtHelper.injectTerminalContent(bgColors);
    // Assert: Visual comparison
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-background-colors.png');
  });
  /**
   * Test Scenario: Success/Error/Warning Indicators
   * Priority: P0 (Critical)
   *
   * Validates that common indicators (✓✗⚠) render
   * correctly with colors.
   */
  (0, test_1.test)('should render status indicators correctly @P0', async ({ page }) => {
    // Arrange: Status indicators
    const indicators = [
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Tests passed`,
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}✗${helpers_1.ANSI.RESET} Tests failed`,
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.YELLOW}⚠${helpers_1.ANSI.RESET} Warning: deprecated API`,
      `${helpers_1.ANSI.BLUE}ℹ${helpers_1.ANSI.RESET} Information message`,
      `${helpers_1.ANSI.BRIGHT_CYAN}→${helpers_1.ANSI.RESET} Running command...`,
      `${helpers_1.ANSI.BRIGHT_GREEN}✓${helpers_1.ANSI.RESET} Build successful`,
    ].join('\n');
    // Act: Inject indicators
    await vrtHelper.injectTerminalContent(indicators);
    // Assert: Visual comparison
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-status-indicators.png');
  });
  /**
   * Test Scenario: Mixed Content Rendering
   * Priority: P0 (Critical)
   *
   * Validates that mixed content (colored and plain text)
   * renders correctly together.
   */
  (0, test_1.test)('should render mixed colored and plain text @P0', async ({ page }) => {
    // Arrange: Mixed content
    const mixedContent = [
      'Plain text before colored output',
      `${helpers_1.ANSI.GREEN}Success:${helpers_1.ANSI.RESET} Operation completed`,
      'Plain text between colored lines',
      `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}Error:${helpers_1.ANSI.RESET} Something went wrong`,
      'Plain text after colored output',
      `${helpers_1.ANSI.YELLOW}Warning:${helpers_1.ANSI.RESET} Check configuration`,
    ].join('\n');
    // Act: Inject mixed content
    await vrtHelper.injectTerminalContent(mixedContent);
    // Assert: Visual comparison
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-mixed-content.png');
  });
  /**
   * Test Scenario: Sample Terminal Output
   * Priority: P1 (Important)
   *
   * Validates a realistic terminal output scenario.
   */
  (0, test_1.test)('should render sample terminal output correctly @P1', async ({ page }) => {
    // Arrange: Sample terminal output
    const sampleContent = helpers_1.VRTHelper.generateSampleANSIContent();
    // Act: Inject sample content
    await vrtHelper.injectTerminalContent(sampleContent);
    // Assert: Visual comparison
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-sample-output.png');
  });
});
/**
 * Theme Variation Tests for ANSI Colors
 * Validates that colors adapt correctly to different themes.
 */
test_1.test.describe('ANSI Colors - Theme Variations @visual-regression', () => {
  let vrtHelper;
  test_1.test.beforeEach(async ({ page }) => {
    vrtHelper = new helpers_1.VRTHelper(page);
    await page.goto('/standalone-webview.html');
    await vrtHelper.prepareForVRT();
  });
  (0, test_1.test)('should render colors correctly in dark theme @P1', async ({ page }) => {
    // Set dark theme
    await vrtHelper.setTheme('dark');
    // Inject sample content
    const content = helpers_1.VRTHelper.generate16ColorPalette();
    await vrtHelper.injectTerminalContent(content);
    // Assert
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-colors-dark-theme.png');
  });
  (0, test_1.test)('should render colors correctly in light theme @P1', async ({ page }) => {
    // Set light theme
    await vrtHelper.setTheme('light');
    // Inject sample content
    const content = helpers_1.VRTHelper.generate16ColorPalette();
    await vrtHelper.injectTerminalContent(content);
    // Assert
    const terminalOutput = page.locator('.terminal-output');
    await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-colors-light-theme.png');
  });
  (0, test_1.test)(
    'should render colors correctly in high contrast theme @P2',
    async ({ page }) => {
      // Set high contrast theme
      await vrtHelper.setTheme('high-contrast');
      // Inject sample content
      const content = helpers_1.VRTHelper.generate16ColorPalette();
      await vrtHelper.injectTerminalContent(content);
      // Assert
      const terminalOutput = page.locator('.terminal-output');
      await (0, test_1.expect)(terminalOutput).toHaveScreenshot('ansi-colors-high-contrast.png');
    }
  );
});
//# sourceMappingURL=ansi-colors.spec.js.map
