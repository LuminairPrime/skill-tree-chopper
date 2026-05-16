"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agents = void 0;
exports.getOpenClawGlobalSkillsDir = getOpenClawGlobalSkillsDir;
exports.detectInstalledAgents = detectInstalledAgents;
exports.getAgentConfig = getAgentConfig;
exports.getUniversalAgents = getUniversalAgents;
exports.getNonUniversalAgents = getNonUniversalAgents;
exports.isUniversalAgent = isUniversalAgent;
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
const xdg_basedir_1 = require("xdg-basedir");
const home = (0, os_1.homedir)();
// Use xdg-basedir (not env-paths) to match OpenCode/Amp/Goose behavior on all platforms.
const configHome = xdg_basedir_1.xdgConfig ?? (0, path_1.join)(home, '.config');
const codexHome = process.env.CODEX_HOME?.trim() || (0, path_1.join)(home, '.codex');
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || (0, path_1.join)(home, '.claude');
const vibeHome = process.env.VIBE_HOME?.trim() || (0, path_1.join)(home, '.vibe');
function getOpenClawGlobalSkillsDir(homeDir = home, pathExists = fs_1.existsSync) {
    if (pathExists((0, path_1.join)(homeDir, '.openclaw'))) {
        return (0, path_1.join)(homeDir, '.openclaw/skills');
    }
    if (pathExists((0, path_1.join)(homeDir, '.clawdbot'))) {
        return (0, path_1.join)(homeDir, '.clawdbot/skills');
    }
    if (pathExists((0, path_1.join)(homeDir, '.moltbot'))) {
        return (0, path_1.join)(homeDir, '.moltbot/skills');
    }
    return (0, path_1.join)(homeDir, '.openclaw/skills');
}
exports.agents = {
    'aider-desk': {
        name: 'aider-desk',
        displayName: 'AiderDesk',
        skillsDir: '.aider-desk/skills',
        globalSkillsDir: (0, path_1.join)(home, '.aider-desk/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.aider-desk'));
        },
    },
    amp: {
        name: 'amp',
        displayName: 'Amp',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'agents/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(configHome, 'amp'));
        },
    },
    antigravity: {
        name: 'antigravity',
        displayName: 'Antigravity',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.gemini/antigravity/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.gemini/antigravity'));
        },
    },
    augment: {
        name: 'augment',
        displayName: 'Augment',
        skillsDir: '.augment/skills',
        globalSkillsDir: (0, path_1.join)(home, '.augment/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.augment'));
        },
    },
    bob: {
        name: 'bob',
        displayName: 'IBM Bob',
        skillsDir: '.bob/skills',
        globalSkillsDir: (0, path_1.join)(home, '.bob/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.bob'));
        },
    },
    'claude-code': {
        name: 'claude-code',
        displayName: 'Claude Code',
        skillsDir: '.claude/skills',
        globalSkillsDir: (0, path_1.join)(claudeHome, 'skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)(claudeHome);
        },
    },
    openclaw: {
        name: 'openclaw',
        displayName: 'OpenClaw',
        skillsDir: 'skills',
        globalSkillsDir: getOpenClawGlobalSkillsDir(),
        detectInstalled: async () => {
            return ((0, fs_1.existsSync)((0, path_1.join)(home, '.openclaw')) ||
                (0, fs_1.existsSync)((0, path_1.join)(home, '.clawdbot')) ||
                (0, fs_1.existsSync)((0, path_1.join)(home, '.moltbot')));
        },
    },
    cline: {
        name: 'cline',
        displayName: 'Cline',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.agents', 'skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.cline'));
        },
    },
    'codearts-agent': {
        name: 'codearts-agent',
        displayName: 'CodeArts Agent',
        skillsDir: '.codeartsdoer/skills',
        globalSkillsDir: (0, path_1.join)(home, '.codeartsdoer/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.codeartsdoer'));
        },
    },
    codebuddy: {
        name: 'codebuddy',
        displayName: 'CodeBuddy',
        skillsDir: '.codebuddy/skills',
        globalSkillsDir: (0, path_1.join)(home, '.codebuddy/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), '.codebuddy')) || (0, fs_1.existsSync)((0, path_1.join)(home, '.codebuddy'));
        },
    },
    codemaker: {
        name: 'codemaker',
        displayName: 'Codemaker',
        skillsDir: '.codemaker/skills',
        globalSkillsDir: (0, path_1.join)(home, '.codemaker/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.codemaker'));
        },
    },
    codestudio: {
        name: 'codestudio',
        displayName: 'Code Studio',
        skillsDir: '.codestudio/skills',
        globalSkillsDir: (0, path_1.join)(home, '.codestudio/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.codestudio'));
        },
    },
    codex: {
        name: 'codex',
        displayName: 'Codex',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(codexHome, 'skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)(codexHome) || (0, fs_1.existsSync)('/etc/codex');
        },
    },
    'command-code': {
        name: 'command-code',
        displayName: 'Command Code',
        skillsDir: '.commandcode/skills',
        globalSkillsDir: (0, path_1.join)(home, '.commandcode/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.commandcode'));
        },
    },
    continue: {
        name: 'continue',
        displayName: 'Continue',
        skillsDir: '.continue/skills',
        globalSkillsDir: (0, path_1.join)(home, '.continue/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), '.continue')) || (0, fs_1.existsSync)((0, path_1.join)(home, '.continue'));
        },
    },
    cortex: {
        name: 'cortex',
        displayName: 'Cortex Code',
        skillsDir: '.cortex/skills',
        globalSkillsDir: (0, path_1.join)(home, '.snowflake/cortex/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.snowflake/cortex'));
        },
    },
    crush: {
        name: 'crush',
        displayName: 'Crush',
        skillsDir: '.crush/skills',
        globalSkillsDir: (0, path_1.join)(home, '.config/crush/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.config/crush'));
        },
    },
    cursor: {
        name: 'cursor',
        displayName: 'Cursor',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.cursor/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.cursor'));
        },
    },
    deepagents: {
        name: 'deepagents',
        displayName: 'Deep Agents',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.deepagents/agent/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.deepagents'));
        },
    },
    devin: {
        name: 'devin',
        displayName: 'Devin for Terminal',
        skillsDir: '.devin/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'devin/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(configHome, 'devin'));
        },
    },
    dexto: {
        name: 'dexto',
        displayName: 'Dexto',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.agents/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.dexto'));
        },
    },
    droid: {
        name: 'droid',
        displayName: 'Droid',
        skillsDir: '.factory/skills',
        globalSkillsDir: (0, path_1.join)(home, '.factory/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.factory'));
        },
    },
    firebender: {
        name: 'firebender',
        displayName: 'Firebender',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.firebender/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.firebender'));
        },
    },
    forgecode: {
        name: 'forgecode',
        displayName: 'ForgeCode',
        skillsDir: '.forge/skills',
        globalSkillsDir: (0, path_1.join)(home, '.forge/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.forge'));
        },
    },
    'gemini-cli': {
        name: 'gemini-cli',
        displayName: 'Gemini CLI',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.gemini/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.gemini'));
        },
    },
    'github-copilot': {
        name: 'github-copilot',
        displayName: 'GitHub Copilot',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.copilot/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.copilot'));
        },
    },
    goose: {
        name: 'goose',
        displayName: 'Goose',
        skillsDir: '.goose/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'goose/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(configHome, 'goose'));
        },
    },
    junie: {
        name: 'junie',
        displayName: 'Junie',
        skillsDir: '.junie/skills',
        globalSkillsDir: (0, path_1.join)(home, '.junie/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.junie'));
        },
    },
    'iflow-cli': {
        name: 'iflow-cli',
        displayName: 'iFlow CLI',
        skillsDir: '.iflow/skills',
        globalSkillsDir: (0, path_1.join)(home, '.iflow/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.iflow'));
        },
    },
    kilo: {
        name: 'kilo',
        displayName: 'Kilo Code',
        skillsDir: '.kilocode/skills',
        globalSkillsDir: (0, path_1.join)(home, '.kilocode/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.kilocode'));
        },
    },
    'kimi-cli': {
        name: 'kimi-cli',
        displayName: 'Kimi Code CLI',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.config/agents/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.kimi'));
        },
    },
    'kiro-cli': {
        name: 'kiro-cli',
        displayName: 'Kiro CLI',
        skillsDir: '.kiro/skills',
        globalSkillsDir: (0, path_1.join)(home, '.kiro/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.kiro'));
        },
    },
    kode: {
        name: 'kode',
        displayName: 'Kode',
        skillsDir: '.kode/skills',
        globalSkillsDir: (0, path_1.join)(home, '.kode/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.kode'));
        },
    },
    mcpjam: {
        name: 'mcpjam',
        displayName: 'MCPJam',
        skillsDir: '.mcpjam/skills',
        globalSkillsDir: (0, path_1.join)(home, '.mcpjam/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.mcpjam'));
        },
    },
    'mistral-vibe': {
        name: 'mistral-vibe',
        displayName: 'Mistral Vibe',
        skillsDir: '.vibe/skills',
        globalSkillsDir: (0, path_1.join)(vibeHome, 'skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)(vibeHome);
        },
    },
    mux: {
        name: 'mux',
        displayName: 'Mux',
        skillsDir: '.mux/skills',
        globalSkillsDir: (0, path_1.join)(home, '.mux/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.mux'));
        },
    },
    opencode: {
        name: 'opencode',
        displayName: 'OpenCode',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'opencode/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(configHome, 'opencode'));
        },
    },
    openhands: {
        name: 'openhands',
        displayName: 'OpenHands',
        skillsDir: '.openhands/skills',
        globalSkillsDir: (0, path_1.join)(home, '.openhands/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.openhands'));
        },
    },
    pi: {
        name: 'pi',
        displayName: 'Pi',
        skillsDir: '.pi/skills',
        globalSkillsDir: (0, path_1.join)(home, '.pi/agent/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.pi/agent'));
        },
    },
    qoder: {
        name: 'qoder',
        displayName: 'Qoder',
        skillsDir: '.qoder/skills',
        globalSkillsDir: (0, path_1.join)(home, '.qoder/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.qoder'));
        },
    },
    'qwen-code': {
        name: 'qwen-code',
        displayName: 'Qwen Code',
        skillsDir: '.qwen/skills',
        globalSkillsDir: (0, path_1.join)(home, '.qwen/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.qwen'));
        },
    },
    replit: {
        name: 'replit',
        displayName: 'Replit',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'agents/skills'),
        showInUniversalList: false,
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), '.replit'));
        },
    },
    rovodev: {
        name: 'rovodev',
        displayName: 'Rovo Dev',
        skillsDir: '.rovodev/skills',
        globalSkillsDir: (0, path_1.join)(home, '.rovodev/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.rovodev'));
        },
    },
    roo: {
        name: 'roo',
        displayName: 'Roo Code',
        skillsDir: '.roo/skills',
        globalSkillsDir: (0, path_1.join)(home, '.roo/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.roo'));
        },
    },
    'tabnine-cli': {
        name: 'tabnine-cli',
        displayName: 'Tabnine CLI',
        skillsDir: '.tabnine/agent/skills',
        globalSkillsDir: (0, path_1.join)(home, '.tabnine/agent/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.tabnine'));
        },
    },
    trae: {
        name: 'trae',
        displayName: 'Trae',
        skillsDir: '.trae/skills',
        globalSkillsDir: (0, path_1.join)(home, '.trae/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.trae'));
        },
    },
    'trae-cn': {
        name: 'trae-cn',
        displayName: 'Trae CN',
        skillsDir: '.trae/skills',
        globalSkillsDir: (0, path_1.join)(home, '.trae-cn/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.trae-cn'));
        },
    },
    warp: {
        name: 'warp',
        displayName: 'Warp',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(home, '.agents/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.warp'));
        },
    },
    windsurf: {
        name: 'windsurf',
        displayName: 'Windsurf',
        skillsDir: '.windsurf/skills',
        globalSkillsDir: (0, path_1.join)(home, '.codeium/windsurf/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.codeium/windsurf'));
        },
    },
    zencoder: {
        name: 'zencoder',
        displayName: 'Zencoder',
        skillsDir: '.zencoder/skills',
        globalSkillsDir: (0, path_1.join)(home, '.zencoder/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.zencoder'));
        },
    },
    neovate: {
        name: 'neovate',
        displayName: 'Neovate',
        skillsDir: '.neovate/skills',
        globalSkillsDir: (0, path_1.join)(home, '.neovate/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.neovate'));
        },
    },
    pochi: {
        name: 'pochi',
        displayName: 'Pochi',
        skillsDir: '.pochi/skills',
        globalSkillsDir: (0, path_1.join)(home, '.pochi/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.pochi'));
        },
    },
    adal: {
        name: 'adal',
        displayName: 'AdaL',
        skillsDir: '.adal/skills',
        globalSkillsDir: (0, path_1.join)(home, '.adal/skills'),
        detectInstalled: async () => {
            return (0, fs_1.existsSync)((0, path_1.join)(home, '.adal'));
        },
    },
    universal: {
        name: 'universal',
        displayName: 'Universal',
        skillsDir: '.agents/skills',
        globalSkillsDir: (0, path_1.join)(configHome, 'agents/skills'),
        showInUniversalList: false,
        detectInstalled: async () => false,
    },
};
async function detectInstalledAgents() {
    const results = await Promise.all(Object.entries(exports.agents).map(async ([type, config]) => ({
        type: type,
        installed: await config.detectInstalled(),
    })));
    return results.filter((r) => r.installed).map((r) => r.type);
}
function getAgentConfig(type) {
    return exports.agents[type];
}
/**
 * Returns agents that use the universal .agents/skills directory.
 * These agents share a common skill location and don't need symlinks.
 * Agents with showInUniversalList: false are excluded.
 */
function getUniversalAgents() {
    return Object.entries(exports.agents)
        .filter(([_, config]) => config.skillsDir === '.agents/skills' && config.showInUniversalList !== false)
        .map(([type]) => type);
}
/**
 * Returns agents that use agent-specific skill directories (not universal).
 * These agents need symlinks from the canonical .agents/skills location.
 */
function getNonUniversalAgents() {
    return Object.entries(exports.agents)
        .filter(([_, config]) => config.skillsDir !== '.agents/skills')
        .map(([type]) => type);
}
/**
 * Check if an agent uses the universal .agents/skills directory.
 */
function isUniversalAgent(type) {
    return exports.agents[type].skillsDir === '.agents/skills';
}
//# sourceMappingURL=agents.js.map