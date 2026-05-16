"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_DISPLAY_NAMES = exports.NOTIFICATION_TITLE = void 0;
exports.getAgentDisplayName = getAgentDisplayName;
exports.NOTIFICATION_TITLE = 'Sidebar Terminal';
exports.AGENT_DISPLAY_NAMES = {
    claude: 'Claude',
    copilot: 'GitHub Copilot',
    gemini: 'Gemini',
    codex: 'Codex',
    opencode: 'OpenCode',
};
function getAgentDisplayName(agentType) {
    if (!agentType) {
        return 'CLI Agent';
    }
    return exports.AGENT_DISPLAY_NAMES[agentType] ?? 'CLI Agent';
}
//# sourceMappingURL=agentConstants.js.map