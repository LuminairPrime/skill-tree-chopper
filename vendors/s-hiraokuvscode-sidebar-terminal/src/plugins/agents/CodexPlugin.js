"use strict";
/**
 * OpenAI Codex Agent Plugin
 *
 * Detects OpenAI Codex CLI agent activity in terminals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodexPlugin = void 0;
const BaseAgentPlugin_1 = require("./BaseAgentPlugin");
class CodexPlugin extends BaseAgentPlugin_1.BaseAgentPlugin {
    constructor() {
        super({
            id: 'codex-agent',
            name: 'Codex Agent Plugin',
            version: '1.0.0',
            description: 'Detects OpenAI Codex CLI agent',
            author: 'Sidebar Terminal',
        });
    }
    getDetectionPatterns() {
        return [/OpenAI\s+Codex/i, /Codex\s+CLI/i];
    }
    getCommandPrefixes() {
        return ['codex ', 'codex'];
    }
    getActivityKeywords() {
        return ['codex', 'openai'];
    }
    getAgentType() {
        return 'codex';
    }
}
exports.CodexPlugin = CodexPlugin;
//# sourceMappingURL=CodexPlugin.js.map