'use strict';
/**
 * Claude Agent Plugin
 *
 * Detects Claude Code CLI agent activity in terminals.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ClaudePlugin = void 0;
const BaseAgentPlugin_1 = require('./BaseAgentPlugin');
class ClaudePlugin extends BaseAgentPlugin_1.BaseAgentPlugin {
  constructor() {
    super({
      id: 'claude-agent',
      name: 'Claude Agent Plugin',
      version: '1.0.0',
      description: 'Detects Claude Code CLI agent',
      author: 'Sidebar Terminal',
    });
  }
  getDetectionPatterns() {
    return [/Claude\s+Code/i, /Anthropic/i];
  }
  getCommandPrefixes() {
    return ['claude ', 'claude'];
  }
  getActivityKeywords() {
    return ['claude', 'anthropic', 'claude code'];
  }
  getAgentType() {
    return 'claude';
  }
}
exports.ClaudePlugin = ClaudePlugin;
//# sourceMappingURL=ClaudePlugin.js.map
