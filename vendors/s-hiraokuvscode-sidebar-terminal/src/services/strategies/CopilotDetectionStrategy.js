'use strict';
/**
 * GitHub Copilot CLI Detection Strategy
 *
 * Implements agent-specific detection logic for GitHub Copilot CLI.
 * Extends BaseDetectionStrategy to inherit common validation logic.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CopilotDetectionStrategy = void 0;
const BaseDetectionStrategy_1 = require('./BaseDetectionStrategy');
class CopilotDetectionStrategy extends BaseDetectionStrategy_1.BaseDetectionStrategy {
  constructor() {
    super(...arguments);
    this.agentType = 'copilot';
  }
  getCommandPrefixes() {
    return ['copilot ', 'copilot', 'gh copilot '];
  }
  getStartupPatterns() {
    return ['Welcome to GitHub Copilot CLI'];
  }
  getActivityKeywords() {
    return ['copilot', 'github'];
  }
}
exports.CopilotDetectionStrategy = CopilotDetectionStrategy;
//# sourceMappingURL=CopilotDetectionStrategy.js.map
