'use strict';
/**
 * OpenAI Codex CLI Detection Strategy
 *
 * Implements agent-specific detection logic for OpenAI Codex CLI.
 * Extends BaseDetectionStrategy to inherit common validation logic.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.CodexDetectionStrategy = void 0;
const BaseDetectionStrategy_1 = require('./BaseDetectionStrategy');
class CodexDetectionStrategy extends BaseDetectionStrategy_1.BaseDetectionStrategy {
  constructor() {
    super(...arguments);
    this.agentType = 'codex';
  }
  getCommandPrefixes() {
    return ['codex ', 'codex'];
  }
  getStartupPatterns() {
    return ['OpenAI Codex'];
  }
  getActivityKeywords() {
    return ['codex', 'openai'];
  }
}
exports.CodexDetectionStrategy = CodexDetectionStrategy;
//# sourceMappingURL=CodexDetectionStrategy.js.map
