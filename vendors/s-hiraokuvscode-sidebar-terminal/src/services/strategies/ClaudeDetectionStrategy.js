"use strict";
/**
 * Claude Code Detection Strategy
 *
 * Implements agent-specific detection logic for Claude Code CLI.
 * Extends BaseDetectionStrategy to inherit common validation logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeDetectionStrategy = void 0;
const BaseDetectionStrategy_1 = require("./BaseDetectionStrategy");
class ClaudeDetectionStrategy extends BaseDetectionStrategy_1.BaseDetectionStrategy {
    constructor() {
        super(...arguments);
        this.agentType = 'claude';
    }
    getCommandPrefixes() {
        return ['claude ', 'claude'];
    }
    getStartupPatterns() {
        return []; // Using regex instead
    }
    getStartupRegexPatterns() {
        return [/Claude\s*Code/i];
    }
    getActivityKeywords() {
        return ['claude', 'anthropic'];
    }
}
exports.ClaudeDetectionStrategy = ClaudeDetectionStrategy;
//# sourceMappingURL=ClaudeDetectionStrategy.js.map