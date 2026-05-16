"use strict";
/**
 * Google Gemini Agent Plugin
 *
 * Detects Google Gemini CLI agent activity in terminals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiPlugin = void 0;
const BaseAgentPlugin_1 = require("./BaseAgentPlugin");
class GeminiPlugin extends BaseAgentPlugin_1.BaseAgentPlugin {
    constructor() {
        super({
            id: 'gemini-agent',
            name: 'Gemini Agent Plugin',
            version: '1.0.0',
            description: 'Detects Google Gemini CLI agent',
            author: 'Sidebar Terminal',
        });
    }
    getDetectionPatterns() {
        return [
            // ASCII art patterns
            /███\s+█████████\s+██████████\s+██████\s+██████\s+█████\s+██████\s+█████\s+█████/,
            /░░░███\s+███░░░░░███░░███░░░░░█░░██████\s+██████\s+░░███\s+░░██████\s+░░███\s+░░███/,
            // Gemini-specific patterns
            /\bgemini\s+(is|here)\b/i,
            /\bgoogle\s+ai\b/i,
            /\bbard\s+(response|answer)\b/i,
            /gemini\s+code/i,
            /gemini\s+chat/i,
        ];
    }
    getCommandPrefixes() {
        return ['gemini ', 'gemini'];
    }
    getActivityKeywords() {
        return ['gemini', 'bard', 'google ai'];
    }
    getAgentType() {
        return 'gemini';
    }
}
exports.GeminiPlugin = GeminiPlugin;
//# sourceMappingURL=GeminiPlugin.js.map