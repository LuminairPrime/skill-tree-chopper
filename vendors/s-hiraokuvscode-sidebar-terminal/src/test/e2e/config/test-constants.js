'use strict';
/**
 * Test constants and configuration values for E2E tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.AI_AGENT_CONSTANTS =
  exports.VISUAL_TEST_CONSTANTS =
  exports.TERMINAL_CONSTANTS =
  exports.TEST_PATHS =
  exports.TEST_TIMEOUTS =
    void 0;
exports.TEST_TIMEOUTS = {
  /** Default test timeout (30 seconds) */
  DEFAULT: 30000,
  /** Extension activation timeout (5 seconds) */
  EXTENSION_ACTIVATION: 5000,
  /** WebView load timeout (3 seconds) */
  WEBVIEW_LOAD: 3000,
  /** Terminal creation timeout (2 seconds) */
  TERMINAL_CREATION: 2000,
  /** Prompt display timeout (2 seconds) */
  PROMPT_DISPLAY: 2000,
  /** AI agent detection timeout (500ms) */
  AGENT_DETECTION: 500,
};
exports.TEST_PATHS = {
  /** Test fixtures directory */
  FIXTURES: './src/test/fixtures/e2e',
  /** Terminal output fixtures */
  TERMINAL_OUTPUT: './src/test/fixtures/e2e/terminal-output',
  /** AI agent output fixtures */
  AI_AGENT_OUTPUT: './src/test/fixtures/e2e/ai-agent-output',
  /** Configuration fixtures */
  CONFIGURATIONS: './src/test/fixtures/e2e/configurations',
  /** Screenshot baselines */
  SCREENSHOTS: './src/test/fixtures/e2e/screenshots',
};
exports.TERMINAL_CONSTANTS = {
  /** Maximum number of terminals */
  MAX_TERMINALS: 5,
  /** Terminal IDs (recycled 1-5) */
  TERMINAL_IDS: [1, 2, 3, 4, 5],
  /** Maximum scrollback lines for persistent sessions */
  PERSISTENT_SCROLLBACK: 1000,
  /** Maximum scrollback lines in memory */
  MAX_SCROLLBACK: 2000,
};
exports.VISUAL_TEST_CONSTANTS = {
  /** Pixel difference tolerance (0.1%) */
  PIXEL_TOLERANCE: 0.001,
  /** Maximum pixel differences allowed */
  MAX_DIFF_PIXELS: 100,
  /** Threshold for visual comparison */
  THRESHOLD: 0.1,
};
exports.AI_AGENT_CONSTANTS = {
  /** Supported AI agents */
  AGENTS: {
    CLAUDE_CODE: 'Claude Code',
    GITHUB_COPILOT: 'GitHub Copilot',
    GEMINI_CLI: 'Gemini CLI',
    CODEX_CLI: 'Codex CLI',
  },
  /** Agent status states */
  STATUS: {
    NONE: 'None',
    CONNECTED: 'Connected',
    ACTIVE: 'Active',
    DISCONNECTED: 'Disconnected',
  },
};
//# sourceMappingURL=test-constants.js.map
