'use strict';
/**
 * Plugin Manager
 *
 * Manages plugin lifecycle, registration, and coordination.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.PluginManager = void 0;
const logger_1 = require('../../utils/logger');
/**
 * Plugin Manager
 *
 * Central registry and lifecycle manager for all plugins.
 */
class PluginManager {
  constructor(_eventBus) {
    this._eventBus = _eventBus;
    this._plugins = new Map();
    this._agentPlugins = new Map();
    this._isDisposed = false;
  }
  /**
   * Register a plugin
   *
   * @param plugin Plugin instance
   * @param options Registration options
   */
  async registerPlugin(plugin, options = {}) {
    this._ensureNotDisposed();
    const { id } = plugin.metadata;
    if (this._plugins.has(id)) {
      (0, logger_1.terminal)(`⚠️ [PLUGIN] Plugin already registered: ${id}`);
      return;
    }
    (0, logger_1.terminal)(`📦 [PLUGIN] Registering plugin: ${id} (${plugin.metadata.name})`);
    this._plugins.set(id, plugin);
    // Check if it's an agent plugin
    if (this._isAgentPlugin(plugin)) {
      this._agentPlugins.set(id, plugin);
      (0, logger_1.terminal)(`🤖 [PLUGIN] Registered as agent plugin: ${id}`);
    }
    // Configure plugin if config provided
    if (options.config) {
      plugin.configure(options.config);
    }
    // Activate immediately if requested
    if (options.activateImmediately && options.config?.enabled !== false) {
      await this.activatePlugin(id);
    }
  }
  /**
   * Activate a plugin
   *
   * @param pluginId Plugin ID
   */
  async activatePlugin(pluginId) {
    this._ensureNotDisposed();
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      (0, logger_1.terminal)(`⚠️ [PLUGIN] Plugin not found: ${pluginId}`);
      return;
    }
    if (plugin.state === 'active') {
      (0, logger_1.terminal)(`ℹ️ [PLUGIN] Plugin already active: ${pluginId}`);
      return;
    }
    try {
      (0, logger_1.terminal)(`▶️ [PLUGIN] Activating plugin: ${pluginId}`);
      await plugin.activate();
      (0, logger_1.terminal)(`✅ [PLUGIN] Plugin activated: ${pluginId}`);
    } catch (error) {
      (0, logger_1.terminal)(`❌ [PLUGIN] Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  /**
   * Deactivate a plugin
   *
   * @param pluginId Plugin ID
   */
  async deactivatePlugin(pluginId) {
    this._ensureNotDisposed();
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      (0, logger_1.terminal)(`⚠️ [PLUGIN] Plugin not found: ${pluginId}`);
      return;
    }
    if (plugin.state !== 'active') {
      (0, logger_1.terminal)(`ℹ️ [PLUGIN] Plugin not active: ${pluginId}`);
      return;
    }
    try {
      (0, logger_1.terminal)(`⏸️ [PLUGIN] Deactivating plugin: ${pluginId}`);
      await plugin.deactivate();
      (0, logger_1.terminal)(`✅ [PLUGIN] Plugin deactivated: ${pluginId}`);
    } catch (error) {
      (0, logger_1.terminal)(`❌ [PLUGIN] Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  /**
   * Configure a plugin
   *
   * @param pluginId Plugin ID
   * @param config Plugin configuration
   */
  configurePlugin(pluginId, config) {
    this._ensureNotDisposed();
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      (0, logger_1.terminal)(`⚠️ [PLUGIN] Plugin not found: ${pluginId}`);
      return;
    }
    (0, logger_1.terminal)(`⚙️ [PLUGIN] Configuring plugin: ${pluginId}`);
    plugin.configure(config);
  }
  /**
   * Get all registered agent plugins
   *
   * @returns Array of agent plugins
   */
  getAgentPlugins() {
    return Array.from(this._agentPlugins.values());
  }
  /**
   * Get active agent plugins
   *
   * @returns Array of active agent plugins
   */
  getActiveAgentPlugins() {
    return this.getAgentPlugins().filter((plugin) => plugin.state === 'active');
  }
  /**
   * Get plugin by ID
   *
   * @param pluginId Plugin ID
   * @returns Plugin instance or undefined
   */
  getPlugin(pluginId) {
    return this._plugins.get(pluginId);
  }
  /**
   * Get all registered plugins
   *
   * @returns Array of all plugins
   */
  getAllPlugins() {
    return Array.from(this._plugins.values());
  }
  /**
   * Check if a plugin is registered
   *
   * @param pluginId Plugin ID
   * @returns True if registered
   */
  hasPlugin(pluginId) {
    return this._plugins.has(pluginId);
  }
  /**
   * Dispose all plugins and cleanup
   */
  dispose() {
    if (this._isDisposed) {
      return;
    }
    (0, logger_1.terminal)('🧹 [PLUGIN] Disposing PluginManager...');
    // Deactivate and dispose all plugins
    for (const [id, plugin] of this._plugins) {
      try {
        if (plugin.state === 'active') {
          plugin.deactivate().catch((error) => {
            (0, logger_1.terminal)(`⚠️ [PLUGIN] Error deactivating plugin ${id}:`, error);
          });
        }
        plugin.dispose();
      } catch (error) {
        (0, logger_1.terminal)(`⚠️ [PLUGIN] Error disposing plugin ${id}:`, error);
      }
    }
    this._plugins.clear();
    this._agentPlugins.clear();
    this._isDisposed = true;
    (0, logger_1.terminal)('✅ [PLUGIN] PluginManager disposed');
  }
  /**
   * Check if an object implements IAgentPlugin
   */
  _isAgentPlugin(plugin) {
    return (
      'detect' in plugin &&
      'onAgentActivated' in plugin &&
      'onAgentDeactivated' in plugin &&
      'getAgentType' in plugin
    );
  }
  /**
   * Ensure manager is not disposed
   */
  _ensureNotDisposed() {
    if (this._isDisposed) {
      throw new Error('PluginManager has been disposed');
    }
  }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginManager.js.map
