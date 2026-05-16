"use strict";
/**
 * Plugin Configuration Service
 *
 * Manages plugin configuration from VS Code settings with hot-reload support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginConfigurationService = void 0;
const vscode = require("vscode");
const logger_1 = require("../../utils/logger");
class PluginConfigurationService {
    constructor(_pluginManager) {
        this._pluginManager = _pluginManager;
        this._configSection = 'secondaryTerminal.plugins';
        this._disposables = [];
    }
    /**
     * Initialize configuration service and set up hot-reload
     */
    initialize() {
        (0, logger_1.log)('🔧 [PLUGIN-CONFIG] Initializing plugin configuration service...');
        // Apply initial configuration
        this.applyConfiguration();
        // Watch for configuration changes
        const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration(this._configSection)) {
                (0, logger_1.log)('🔄 [PLUGIN-CONFIG] Configuration changed, reloading plugins...');
                this.applyConfiguration();
            }
        });
        this._disposables.push(configWatcher);
        (0, logger_1.log)('✅ [PLUGIN-CONFIG] Plugin configuration service initialized');
    }
    /**
     * Get current plugin system configuration
     */
    getConfiguration() {
        const config = vscode.workspace.getConfiguration();
        return {
            enablePluginSystem: config.get('secondaryTerminal.plugins.enablePluginSystem', true),
            claude: {
                enabled: config.get('secondaryTerminal.plugins.claude.enabled', true),
                confidenceThreshold: config.get('secondaryTerminal.plugins.claude.confidenceThreshold', 0.7),
            },
            copilot: {
                enabled: config.get('secondaryTerminal.plugins.copilot.enabled', true),
                confidenceThreshold: config.get('secondaryTerminal.plugins.copilot.confidenceThreshold', 0.7),
            },
            gemini: {
                enabled: config.get('secondaryTerminal.plugins.gemini.enabled', true),
                confidenceThreshold: config.get('secondaryTerminal.plugins.gemini.confidenceThreshold', 0.7),
            },
            codex: {
                enabled: config.get('secondaryTerminal.plugins.codex.enabled', true),
                confidenceThreshold: config.get('secondaryTerminal.plugins.codex.confidenceThreshold', 0.7),
            },
        };
    }
    /**
     * Apply current configuration to all plugins
     */
    applyConfiguration() {
        const config = this.getConfiguration();
        (0, logger_1.log)(`🔧 [PLUGIN-CONFIG] Plugin system enabled: ${config.enablePluginSystem}`);
        if (!config.enablePluginSystem) {
            (0, logger_1.log)('⚠️ [PLUGIN-CONFIG] Plugin system is disabled');
            return;
        }
        // Apply configuration to each agent plugin
        this.applyPluginConfig('claude-agent', config.claude);
        this.applyPluginConfig('copilot-agent', config.copilot);
        this.applyPluginConfig('gemini-agent', config.gemini);
        this.applyPluginConfig('codex-agent', config.codex);
    }
    /**
     * Apply configuration to a specific plugin
     */
    applyPluginConfig(pluginId, agentConfig) {
        const plugin = this._pluginManager.getPlugin(pluginId);
        if (!plugin) {
            (0, logger_1.log)(`⚠️ [PLUGIN-CONFIG] Plugin not found: ${pluginId}`);
            return;
        }
        // Build plugin configuration
        const pluginConfig = {
            enabled: agentConfig.enabled,
            confidenceThreshold: agentConfig.confidenceThreshold,
        };
        (0, logger_1.log)(`🔧 [PLUGIN-CONFIG] Applying config to ${pluginId}: enabled=${agentConfig.enabled}, threshold=${agentConfig.confidenceThreshold}`);
        // Apply configuration
        plugin.configure(pluginConfig);
        // Handle activation/deactivation based on enabled flag
        if (agentConfig.enabled && plugin.state === 'registered') {
            (0, logger_1.log)(`▶️ [PLUGIN-CONFIG] Activating ${pluginId}...`);
            void this._pluginManager.activatePlugin(pluginId);
        }
        else if (!agentConfig.enabled && plugin.state === 'active') {
            (0, logger_1.log)(`⏸️ [PLUGIN-CONFIG] Deactivating ${pluginId}...`);
            void this._pluginManager.deactivatePlugin(pluginId);
        }
    }
    /**
     * Check if plugin system is enabled
     */
    isPluginSystemEnabled() {
        return this.getConfiguration().enablePluginSystem;
    }
    /**
     * Dispose of configuration service
     */
    dispose() {
        (0, logger_1.log)('🔧 [PLUGIN-CONFIG] Disposing plugin configuration service...');
        this._disposables.forEach((d) => d.dispose());
        this._disposables = [];
    }
}
exports.PluginConfigurationService = PluginConfigurationService;
//# sourceMappingURL=PluginConfigurationService.js.map