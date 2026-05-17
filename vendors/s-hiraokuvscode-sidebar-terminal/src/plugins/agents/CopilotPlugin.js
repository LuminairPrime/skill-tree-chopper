'use strict';
/**
 * GitHub Copilot Agent Plugin
 *
 * Detects GitHub Copilot CLI agent activity in terminals.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CopilotPlugin = void 0;
const BaseAgentPlugin_1 = require('./BaseAgentPlugin');
class CopilotPlugin extends BaseAgentPlugin_1.BaseAgentPlugin {
  constructor() {
    super({
      id: 'copilot-agent',
      name: 'Copilot Agent Plugin',
      version: '1.0.0',
      description: 'Detects GitHub Copilot CLI agent',
      author: 'Sidebar Terminal',
    });
  }
  getDetectionPatterns() {
    return [/Welcome\s+to\s+GitHub\s+Copilot\s+CLI/i, /GitHub\s+Copilot/i];
  }
  getCommandPrefixes() {
    return ['copilot ', 'copilot', 'gh copilot '];
  }
  getActivityKeywords() {
    return ['copilot', 'github'];
  }
  getAgentType() {
    return 'copilot';
  }
}
exports.CopilotPlugin = CopilotPlugin;
//# sourceMappingURL=CopilotPlugin.js.map
