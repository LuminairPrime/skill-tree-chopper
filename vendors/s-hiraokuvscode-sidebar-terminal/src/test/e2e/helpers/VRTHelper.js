'use strict';
/**
 * VRT (Visual Regression Testing) Helper
 *
 * Provides utilities for visual regression testing including:
 * - Animation disabling for deterministic screenshots
 * - Theme switching for multi-theme VRT
 * - Terminal content injection for ANSI color testing
 * - Render wait utilities
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.VRTHelper = exports.ANSI = void 0;
const test_1 = require('@playwright/test');
/**
 * Theme CSS variable definitions
 */
const THEME_VARIABLES = {
  dark: {
    '--vscode-foreground': '#cccccc',
    '--vscode-editor-background': '#1e1e1e',
    '--vscode-panel-background': '#1e1e1e',
    '--vscode-terminal-foreground': '#cccccc',
    '--vscode-terminal-background': '#1e1e1e',
    '--vscode-focusBorder': '#007fd4',
    '--vscode-button-background': '#0e639c',
    '--vscode-button-foreground': '#ffffff',
  },
  light: {
    '--vscode-foreground': '#333333',
    '--vscode-editor-background': '#ffffff',
    '--vscode-panel-background': '#f3f3f3',
    '--vscode-terminal-foreground': '#333333',
    '--vscode-terminal-background': '#ffffff',
    '--vscode-focusBorder': '#0066b8',
    '--vscode-button-background': '#007acc',
    '--vscode-button-foreground': '#ffffff',
  },
  'high-contrast': {
    '--vscode-foreground': '#ffffff',
    '--vscode-editor-background': '#000000',
    '--vscode-panel-background': '#000000',
    '--vscode-terminal-foreground': '#ffffff',
    '--vscode-terminal-background': '#000000',
    '--vscode-focusBorder': '#f38518',
    '--vscode-button-background': '#000000',
    '--vscode-button-foreground': '#ffffff',
  },
};
/**
 * ANSI escape codes for terminal color testing
 */
exports.ANSI = {
  // Reset
  RESET: '\x1b[0m',
  // Basic colors (foreground)
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  // Bright colors (foreground)
  BRIGHT_BLACK: '\x1b[90m',
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
  BRIGHT_WHITE: '\x1b[97m',
  // Background colors
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
  // Styles
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  ITALIC: '\x1b[3m',
  UNDERLINE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  STRIKETHROUGH: '\x1b[9m',
};
/**
 * VRT Helper class for visual regression testing
 */
class VRTHelper {
  constructor(page) {
    this.page = page;
  }
  /**
   * Disable all CSS animations and transitions for deterministic screenshots
   */
  async disableAnimations() {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `,
    });
  }
  /**
   * Set the theme for the WebView
   * @param theme - Theme to apply
   */
  async setTheme(theme) {
    const variables = THEME_VARIABLES[theme];
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
    await this.page.addStyleTag({
      content: `:root { ${cssVars} }`,
    });
    // Wait for style application
    await this.page.waitForTimeout(100);
  }
  /**
   * Wait for terminal to be fully rendered
   * @param timeout - Maximum time to wait in milliseconds
   */
  async waitForTerminalRender(timeout = 5000) {
    // Wait for loading indicator to disappear
    const loadingIndicator = this.page.locator('#loading-indicator');
    await loadingIndicator.waitFor({ state: 'hidden', timeout });
    // Wait for terminal container to be visible
    const terminalContainer = this.page.locator('.terminal-container:not(.hidden)');
    await terminalContainer.waitFor({ state: 'visible', timeout });
    // Small delay for any final rendering
    await this.page.waitForTimeout(100);
  }
  /**
   * Inject terminal content with ANSI formatting
   * @param content - Content to inject (can include ANSI codes)
   * @param terminalId - Target terminal ID (default: 1)
   */
  async injectTerminalContent(content, terminalId = 1) {
    // Create a mock terminal output element if it doesn't exist
    await this.page.evaluate(
      ({ content, terminalId }) => {
        const container = document.querySelector(
          `.terminal-container[data-terminal-id="${terminalId}"]`
        );
        if (!container) return;
        // Remove loading indicator
        const loading = container.querySelector('#loading-indicator');
        if (loading) loading.classList.add('hidden');
        // Create or get terminal output element
        let output = container.querySelector('.terminal-output');
        if (!output) {
          output = document.createElement('div');
          output.className = 'terminal-output';
          output.style.cssText = `
            font-family: 'Courier New', Consolas, monospace;
            font-size: 13px;
            line-height: 1.4;
            padding: 8px;
            white-space: pre-wrap;
            word-wrap: break-word;
            background: var(--vscode-terminal-background);
            color: var(--vscode-terminal-foreground);
            height: 100%;
            overflow: auto;
          `;
          container.appendChild(output);
        }
        // Parse ANSI codes and convert to HTML
        const ansiToHtml = (text) => {
          const ansiColorMap = {
            30: 'var(--vscode-terminal-ansiBlack)',
            31: 'var(--vscode-terminal-ansiRed)',
            32: 'var(--vscode-terminal-ansiGreen)',
            33: 'var(--vscode-terminal-ansiYellow)',
            34: 'var(--vscode-terminal-ansiBlue)',
            35: 'var(--vscode-terminal-ansiMagenta)',
            36: 'var(--vscode-terminal-ansiCyan)',
            37: 'var(--vscode-terminal-ansiWhite)',
            90: 'var(--vscode-terminal-ansiBrightBlack)',
            91: 'var(--vscode-terminal-ansiBrightRed)',
            92: 'var(--vscode-terminal-ansiBrightGreen)',
            93: 'var(--vscode-terminal-ansiBrightYellow)',
            94: 'var(--vscode-terminal-ansiBrightBlue)',
            95: 'var(--vscode-terminal-ansiBrightMagenta)',
            96: 'var(--vscode-terminal-ansiBrightCyan)',
            97: 'var(--vscode-terminal-ansiBrightWhite)',
          };
          const bgColorMap = {
            40: 'var(--vscode-terminal-ansiBlack)',
            41: 'var(--vscode-terminal-ansiRed)',
            42: 'var(--vscode-terminal-ansiGreen)',
            43: 'var(--vscode-terminal-ansiYellow)',
            44: 'var(--vscode-terminal-ansiBlue)',
            45: 'var(--vscode-terminal-ansiMagenta)',
            46: 'var(--vscode-terminal-ansiCyan)',
            47: 'var(--vscode-terminal-ansiWhite)',
          };
          let result = '';
          let currentStyle = [];
          const regex = /\x1b\[([0-9;]+)m/g;
          let lastIndex = 0;
          let match;
          while ((match = regex.exec(text)) !== null) {
            // Add text before the escape sequence
            if (match.index > lastIndex) {
              const textPart = text.substring(lastIndex, match.index);
              if (currentStyle.length > 0) {
                result += `<span style="${currentStyle.join('; ')}">${textPart}</span>`;
              } else {
                result += textPart;
              }
            }
            // Parse the escape codes
            const codes = match[1].split(';');
            for (const code of codes) {
              if (code === '0') {
                currentStyle = [];
              } else if (code === '1') {
                currentStyle.push('font-weight: bold');
              } else if (code === '3') {
                currentStyle.push('font-style: italic');
              } else if (code === '4') {
                currentStyle.push('text-decoration: underline');
              } else if (ansiColorMap[code]) {
                currentStyle.push(`color: ${ansiColorMap[code]}`);
              } else if (bgColorMap[code]) {
                currentStyle.push(`background-color: ${bgColorMap[code]}`);
              }
            }
            lastIndex = regex.lastIndex;
          }
          // Add remaining text
          if (lastIndex < text.length) {
            const textPart = text.substring(lastIndex);
            if (currentStyle.length > 0) {
              result += `<span style="${currentStyle.join('; ')}">${textPart}</span>`;
            } else {
              result += textPart;
            }
          }
          return result;
        };
        output.innerHTML = ansiToHtml(content);
      },
      { content, terminalId }
    );
    // Wait for content to render
    await this.page.waitForTimeout(100);
  }
  /**
   * Set terminal border state
   * @param active - Whether terminal is active
   * @param terminalId - Target terminal ID
   */
  async setTerminalBorderState(active, terminalId = 1) {
    await this.page.evaluate(
      ({ active, terminalId }) => {
        const container = document.querySelector(
          `.terminal-container[data-terminal-id="${terminalId}"]`
        );
        if (container) {
          container.style.border = active
            ? '2px solid var(--vscode-focusBorder)'
            : '1px solid rgba(255, 255, 255, 0.1)';
        }
      },
      { active, terminalId }
    );
  }
  /**
   * Set split terminal layout
   * @param direction - Split direction
   * @param count - Number of terminals
   */
  async setSplitLayout(direction, count = 2) {
    await this.page.evaluate(
      ({ direction, count }) => {
        const body = document.getElementById('terminal-body');
        if (!body) return;
        // Set flex direction
        body.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
        // Create additional terminals
        const existingContainers = body.querySelectorAll('.terminal-container');
        for (let i = existingContainers.length; i < count; i++) {
          // Add resizer before new terminal (except for the first additional terminal
          // if there's already at least one container)
          if (existingContainers.length > 0 || i > existingContainers.length) {
            const resizer = document.createElement('div');
            resizer.className = 'split-resizer';
            resizer.style.cssText =
              direction === 'vertical'
                ? 'height: 4px; cursor: row-resize; background: rgba(255, 255, 255, 0.1);'
                : 'width: 4px; cursor: col-resize; background: rgba(255, 255, 255, 0.1);';
            body.appendChild(resizer);
          }
          const container = document.createElement('div');
          container.className = 'terminal-container';
          container.dataset.terminalId = String(i + 1);
          container.setAttribute('role', 'region');
          container.setAttribute('aria-label', `Terminal ${i + 1}`);
          container.style.flex = '1';
          container.style.minHeight = '0';
          container.style.minWidth = '0';
          container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          // Add mock content
          const output = document.createElement('div');
          output.className = 'terminal-output';
          output.style.cssText = `
            font-family: 'Courier New', Consolas, monospace;
            font-size: 13px;
            line-height: 1.4;
            padding: 8px;
            background: var(--vscode-terminal-background);
            color: var(--vscode-terminal-foreground);
            height: 100%;
          `;
          output.textContent = `Terminal ${i + 1}`;
          container.appendChild(output);
          body.appendChild(container);
        }
      },
      { direction, count }
    );
    await this.page.waitForTimeout(100);
  }
  /**
   * Take a VRT screenshot with standard options
   * @param name - Screenshot name
   * @param options - Additional screenshot options
   */
  async takeScreenshot(name, options = {}) {
    const { element, fullPage = false, mask = [] } = options;
    if (element) {
      await (0, test_1.expect)(element).toHaveScreenshot(name, { mask });
    } else {
      await (0, test_1.expect)(this.page).toHaveScreenshot(name, { fullPage, mask });
    }
  }
  /**
   * Prepare page for VRT by disabling animations and waiting for render
   */
  async prepareForVRT() {
    await this.disableAnimations();
    await this.waitForTerminalRender();
  }
  /**
   * Generate sample ANSI content for testing
   * @returns Sample terminal content with ANSI codes
   */
  static generateSampleANSIContent() {
    return [
      `${exports.ANSI.GREEN}✓${exports.ANSI.RESET} Tests passed`,
      `${exports.ANSI.RED}✗${exports.ANSI.RESET} Tests failed`,
      `${exports.ANSI.YELLOW}⚠${exports.ANSI.RESET} Warning message`,
      `${exports.ANSI.BLUE}ℹ${exports.ANSI.RESET} Info message`,
      `${exports.ANSI.BOLD}Bold text${exports.ANSI.RESET}`,
      `${exports.ANSI.ITALIC}Italic text${exports.ANSI.RESET}`,
      `${exports.ANSI.UNDERLINE}Underlined text${exports.ANSI.RESET}`,
      `${exports.ANSI.BG_BLUE}${exports.ANSI.WHITE}Highlighted${exports.ANSI.RESET}`,
    ].join('\n');
  }
  /**
   * Generate 8-color palette for testing
   * @returns Content showing all 8 basic ANSI colors
   */
  static generate8ColorPalette() {
    const colors = [
      { name: 'Black', code: exports.ANSI.BLACK },
      { name: 'Red', code: exports.ANSI.RED },
      { name: 'Green', code: exports.ANSI.GREEN },
      { name: 'Yellow', code: exports.ANSI.YELLOW },
      { name: 'Blue', code: exports.ANSI.BLUE },
      { name: 'Magenta', code: exports.ANSI.MAGENTA },
      { name: 'Cyan', code: exports.ANSI.CYAN },
      { name: 'White', code: exports.ANSI.WHITE },
    ];
    return colors.map((c) => `${c.code}██ ${c.name}${exports.ANSI.RESET}`).join('\n');
  }
  /**
   * Generate 16-color palette (includes bright colors)
   * @returns Content showing all 16 ANSI colors
   */
  static generate16ColorPalette() {
    const colors = [
      { name: 'Black', code: exports.ANSI.BLACK },
      { name: 'Red', code: exports.ANSI.RED },
      { name: 'Green', code: exports.ANSI.GREEN },
      { name: 'Yellow', code: exports.ANSI.YELLOW },
      { name: 'Blue', code: exports.ANSI.BLUE },
      { name: 'Magenta', code: exports.ANSI.MAGENTA },
      { name: 'Cyan', code: exports.ANSI.CYAN },
      { name: 'White', code: exports.ANSI.WHITE },
      { name: 'Bright Black', code: exports.ANSI.BRIGHT_BLACK },
      { name: 'Bright Red', code: exports.ANSI.BRIGHT_RED },
      { name: 'Bright Green', code: exports.ANSI.BRIGHT_GREEN },
      { name: 'Bright Yellow', code: exports.ANSI.BRIGHT_YELLOW },
      { name: 'Bright Blue', code: exports.ANSI.BRIGHT_BLUE },
      { name: 'Bright Magenta', code: exports.ANSI.BRIGHT_MAGENTA },
      { name: 'Bright Cyan', code: exports.ANSI.BRIGHT_CYAN },
      { name: 'Bright White', code: exports.ANSI.BRIGHT_WHITE },
    ];
    return colors.map((c) => `${c.code}██ ${c.name}${exports.ANSI.RESET}`).join('\n');
  }
}
exports.VRTHelper = VRTHelper;
//# sourceMappingURL=VRTHelper.js.map
