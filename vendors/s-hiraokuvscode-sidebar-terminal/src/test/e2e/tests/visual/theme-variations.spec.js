"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const helpers_1 = require("../../helpers");
/**
 * Visual Regression Tests - Theme Variations
 *
 * Test Scenarios:
 * - Dark theme rendering
 * - Light theme rendering
 * - High contrast theme rendering
 * - Theme switching effects
 *
 * These tests validate that the terminal WebView renders correctly
 * across different VS Code themes.
 */
test_1.test.describe('Theme Variations @visual-regression', () => {
    let vrtHelper;
    test_1.test.beforeEach(async ({ page }) => {
        vrtHelper = new helpers_1.VRTHelper(page);
        await page.goto('/standalone-webview.html');
        await vrtHelper.prepareForVRT();
    });
    /**
     * Test Scenario: Dark Theme - Full Layout
     * Priority: P1 (Important)
     *
     * Validates the complete WebView layout in dark theme.
     */
    (0, test_1.test)('should render full layout correctly in dark theme @P1', async ({ page }) => {
        // Set dark theme
        await vrtHelper.setTheme('dark');
        // Inject sample content
        await vrtHelper.injectTerminalContent([
            'user@host:~$ npm run build',
            `${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Build completed successfully`,
            'user@host:~$ _',
        ].join('\n'));
        // Assert: Full page screenshot
        await (0, test_1.expect)(page).toHaveScreenshot('theme-dark-full-layout.png', {
            fullPage: true,
        });
    });
    /**
     * Test Scenario: Light Theme - Full Layout
     * Priority: P1 (Important)
     *
     * Validates the complete WebView layout in light theme.
     */
    (0, test_1.test)('should render full layout correctly in light theme @P1', async ({ page }) => {
        // Set light theme
        await vrtHelper.setTheme('light');
        // Inject sample content
        await vrtHelper.injectTerminalContent([
            'user@host:~$ npm run build',
            `${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Build completed successfully`,
            'user@host:~$ _',
        ].join('\n'));
        // Assert: Full page screenshot
        await (0, test_1.expect)(page).toHaveScreenshot('theme-light-full-layout.png', {
            fullPage: true,
        });
    });
    /**
     * Test Scenario: High Contrast Theme - Full Layout
     * Priority: P2 (Nice-to-have)
     *
     * Validates the complete WebView layout in high contrast theme.
     */
    (0, test_1.test)('should render full layout correctly in high contrast theme @P2', async ({ page }) => {
        // Set high contrast theme
        await vrtHelper.setTheme('high-contrast');
        // Inject sample content
        await vrtHelper.injectTerminalContent([
            'user@host:~$ npm run build',
            `${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Build completed successfully`,
            'user@host:~$ _',
        ].join('\n'));
        // Assert: Full page screenshot
        await (0, test_1.expect)(page).toHaveScreenshot('theme-high-contrast-full-layout.png', {
            fullPage: true,
        });
    });
    /**
     * Test Scenario: Dark Theme - Header
     * Priority: P1 (Important)
     *
     * Validates header rendering in dark theme.
     */
    (0, test_1.test)('should render header correctly in dark theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('dark');
        const header = page.locator('#header');
        await (0, test_1.expect)(header).toHaveScreenshot('theme-dark-header.png');
    });
    /**
     * Test Scenario: Light Theme - Header
     * Priority: P1 (Important)
     *
     * Validates header rendering in light theme.
     */
    (0, test_1.test)('should render header correctly in light theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('light');
        const header = page.locator('#header');
        await (0, test_1.expect)(header).toHaveScreenshot('theme-light-header.png');
    });
    /**
     * Test Scenario: Dark Theme - Terminal Container
     * Priority: P1 (Important)
     *
     * Validates terminal container rendering in dark theme.
     */
    (0, test_1.test)('should render terminal container correctly in dark theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('dark');
        await vrtHelper.setTerminalBorderState(true, 1);
        await vrtHelper.injectTerminalContent('user@host:~$ echo "Dark theme test"\nDark theme test');
        const terminalBody = page.locator('#terminal-body');
        await (0, test_1.expect)(terminalBody).toHaveScreenshot('theme-dark-terminal-container.png');
    });
    /**
     * Test Scenario: Light Theme - Terminal Container
     * Priority: P1 (Important)
     *
     * Validates terminal container rendering in light theme.
     */
    (0, test_1.test)('should render terminal container correctly in light theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('light');
        await vrtHelper.setTerminalBorderState(true, 1);
        await vrtHelper.injectTerminalContent('user@host:~$ echo "Light theme test"\nLight theme test');
        const terminalBody = page.locator('#terminal-body');
        await (0, test_1.expect)(terminalBody).toHaveScreenshot('theme-light-terminal-container.png');
    });
});
/**
 * Theme Comparison Tests
 *
 * Tests to ensure visual consistency across themes.
 */
test_1.test.describe('Theme Consistency @visual-regression', () => {
    let vrtHelper;
    test_1.test.beforeEach(async ({ page }) => {
        vrtHelper = new helpers_1.VRTHelper(page);
        await page.goto('/standalone-webview.html');
        await vrtHelper.prepareForVRT();
    });
    /**
     * Test Scenario: Status Indicators Visibility Across Themes
     * Priority: P1 (Important)
     *
     * Validates that status indicators remain visible and readable
     * across all themes.
     */
    (0, test_1.test)('should render status indicators visibly in dark theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('dark');
        const content = [
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Success`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}✗${helpers_1.ANSI.RESET} Error`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.YELLOW}⚠${helpers_1.ANSI.RESET} Warning`,
        ].join('\n');
        await vrtHelper.injectTerminalContent(content);
        const terminalOutput = page.locator('.terminal-output');
        await (0, test_1.expect)(terminalOutput).toHaveScreenshot('theme-dark-status-indicators.png');
    });
    (0, test_1.test)('should render status indicators visibly in light theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('light');
        const content = [
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Success`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}✗${helpers_1.ANSI.RESET} Error`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.YELLOW}⚠${helpers_1.ANSI.RESET} Warning`,
        ].join('\n');
        await vrtHelper.injectTerminalContent(content);
        const terminalOutput = page.locator('.terminal-output');
        await (0, test_1.expect)(terminalOutput).toHaveScreenshot('theme-light-status-indicators.png');
    });
    (0, test_1.test)('should render status indicators visibly in high contrast theme @P2', async ({ page }) => {
        await vrtHelper.setTheme('high-contrast');
        const content = [
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.GREEN}✓${helpers_1.ANSI.RESET} Success`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.RED}✗${helpers_1.ANSI.RESET} Error`,
            `${helpers_1.ANSI.BOLD}${helpers_1.ANSI.YELLOW}⚠${helpers_1.ANSI.RESET} Warning`,
        ].join('\n');
        await vrtHelper.injectTerminalContent(content);
        const terminalOutput = page.locator('.terminal-output');
        await (0, test_1.expect)(terminalOutput).toHaveScreenshot('theme-high-contrast-status-indicators.png');
    });
    /**
     * Test Scenario: Split Layout Across Themes
     * Priority: P2 (Nice-to-have)
     *
     * Validates that split layouts render correctly across themes.
     */
    (0, test_1.test)('should render split layout correctly in dark theme @P2', async ({ page }) => {
        await vrtHelper.setTheme('dark');
        await vrtHelper.setSplitLayout('vertical', 2);
        await vrtHelper.setTerminalBorderState(true, 1);
        await vrtHelper.setTerminalBorderState(false, 2);
        const terminalBody = page.locator('#terminal-body');
        await (0, test_1.expect)(terminalBody).toHaveScreenshot('theme-dark-split-layout.png');
    });
    (0, test_1.test)('should render split layout correctly in light theme @P2', async ({ page }) => {
        await vrtHelper.setTheme('light');
        await vrtHelper.setSplitLayout('vertical', 2);
        await vrtHelper.setTerminalBorderState(true, 1);
        await vrtHelper.setTerminalBorderState(false, 2);
        const terminalBody = page.locator('#terminal-body');
        await (0, test_1.expect)(terminalBody).toHaveScreenshot('theme-light-split-layout.png');
    });
});
/**
 * Focus and Border Theme Tests
 *
 * Validates focus borders and active states across themes.
 */
test_1.test.describe('Focus and Border States @visual-regression', () => {
    let vrtHelper;
    test_1.test.beforeEach(async ({ page }) => {
        vrtHelper = new helpers_1.VRTHelper(page);
        await page.goto('/standalone-webview.html');
        await vrtHelper.prepareForVRT();
    });
    /**
     * Test Scenario: Focus Border in Dark Theme
     * Priority: P1 (Important)
     */
    (0, test_1.test)('should render focus border correctly in dark theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('dark');
        await vrtHelper.setTerminalBorderState(true, 1);
        const container = page.locator('.terminal-container[data-terminal-id="1"]');
        await (0, test_1.expect)(container).toHaveScreenshot('theme-dark-focus-border.png');
    });
    /**
     * Test Scenario: Focus Border in Light Theme
     * Priority: P1 (Important)
     */
    (0, test_1.test)('should render focus border correctly in light theme @P1', async ({ page }) => {
        await vrtHelper.setTheme('light');
        await vrtHelper.setTerminalBorderState(true, 1);
        const container = page.locator('.terminal-container[data-terminal-id="1"]');
        await (0, test_1.expect)(container).toHaveScreenshot('theme-light-focus-border.png');
    });
    /**
     * Test Scenario: Focus Border in High Contrast Theme
     * Priority: P2 (Nice-to-have)
     */
    (0, test_1.test)('should render focus border correctly in high contrast theme @P2', async ({ page }) => {
        await vrtHelper.setTheme('high-contrast');
        await vrtHelper.setTerminalBorderState(true, 1);
        const container = page.locator('.terminal-container[data-terminal-id="1"]');
        await (0, test_1.expect)(container).toHaveScreenshot('theme-high-contrast-focus-border.png');
    });
});
//# sourceMappingURL=theme-variations.spec.js.map