'use strict';
/**
 * Base Agent Plugin
 *
 * Abstract base class for AI agent detection plugins.
 * Provides common functionality for agent detection and lifecycle management.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.BaseAgentPlugin = void 0;
const IPlugin_1 = require('../../core/plugins/IPlugin');
const logger_1 = require('../../utils/logger');
class BaseAgentPlugin {
  constructor(metadata) {
    this.metadata = metadata;
    this._state = IPlugin_1.PluginState.Registered;
    this._config = {
      enabled: true,
      confidenceThreshold: 0.7,
      debounceMs: 100,
    };
  }
  get state() {
    return this._state;
  }
  async activate() {
    if (this._state === IPlugin_1.PluginState.Active) {
      return;
    }
    try {
      (0, logger_1.terminal)(`▶️ [PLUGIN] Activating ${this.metadata.name} plugin`);
      this._state = IPlugin_1.PluginState.Active;
      await this.onActivate();
      (0, logger_1.terminal)(`✅ [PLUGIN] ${this.metadata.name} activated`);
    } catch (error) {
      (0, logger_1.terminal)(`❌ [PLUGIN] Failed to activate ${this.metadata.name}:`, error);
      this._state = IPlugin_1.PluginState.Error;
      throw error;
    }
  }
  async deactivate() {
    if (this._state !== IPlugin_1.PluginState.Active) {
      return;
    }
    try {
      (0, logger_1.terminal)(`⏸️ [PLUGIN] Deactivating ${this.metadata.name} plugin`);
      await this.onDeactivate();
      this._state = IPlugin_1.PluginState.Deactivated;
      (0, logger_1.terminal)(`✅ [PLUGIN] ${this.metadata.name} deactivated`);
    } catch (error) {
      (0, logger_1.terminal)(`❌ [PLUGIN] Failed to deactivate ${this.metadata.name}:`, error);
      throw error;
    }
  }
  configure(config) {
    this._config = {
      ...this._config,
      ...config,
    };
    (0, logger_1.terminal)(`⚙️ [PLUGIN] ${this.metadata.name} configured:`, this._config);
  }
  dispose() {
    if (this._state === IPlugin_1.PluginState.Active) {
      this.deactivate().catch((error) => {
        (0, logger_1.terminal)(
          `⚠️ [PLUGIN] Error during disposal of ${this.metadata.name}:`,
          error
        );
      });
    }
    (0, logger_1.terminal)(`🗑️ [PLUGIN] ${this.metadata.name} disposed`);
  }
  detect(terminalId, output) {
    if (!this._config.enabled || this._state !== IPlugin_1.PluginState.Active) {
      return {
        detected: false,
        agentType: null,
        confidence: 0,
      };
    }
    // Check detection patterns
    const patterns = this.getDetectionPatterns();
    for (const pattern of patterns) {
      if (pattern.test(output)) {
        const confidence = 0.9; // High confidence for pattern match
        if (confidence >= (this._config.confidenceThreshold || 0.7)) {
          return {
            detected: true,
            agentType: this.getAgentType(),
            confidence,
            metadata: {
              pattern: pattern.source,
            },
          };
        }
      }
    }
    // Check for command prefixes
    const lowerOutput = output.toLowerCase();
    const commandPrefixes = this.getCommandPrefixes();
    for (const prefix of commandPrefixes) {
      if (lowerOutput.includes(prefix.toLowerCase())) {
        const confidence = 0.8; // Medium-high confidence for command prefix
        if (confidence >= (this._config.confidenceThreshold || 0.7)) {
          return {
            detected: true,
            agentType: this.getAgentType(),
            confidence,
            metadata: {
              commandPrefix: prefix,
            },
          };
        }
      }
    }
    // Check for activity keywords
    const keywords = this.getActivityKeywords();
    for (const keyword of keywords) {
      if (lowerOutput.includes(keyword.toLowerCase())) {
        const confidence = 0.6; // Lower confidence for keyword match
        if (confidence >= (this._config.confidenceThreshold || 0.7)) {
          return {
            detected: true,
            agentType: this.getAgentType(),
            confidence,
            metadata: {
              keyword,
            },
          };
        }
      }
    }
    return {
      detected: false,
      agentType: null,
      confidence: 0,
    };
  }
  onAgentActivated(terminalId) {
    (0, logger_1.terminal)(
      `🤖 [PLUGIN] ${this.metadata.name} activated in terminal: ${terminalId}`
    );
  }
  onAgentDeactivated(terminalId) {
    (0, logger_1.terminal)(
      `🤖 [PLUGIN] ${this.metadata.name} deactivated in terminal: ${terminalId}`
    );
  }
  /**
   * Hook for subclass-specific activation logic
   */
  async onActivate() {
    // Subclasses can override
  }
  /**
   * Hook for subclass-specific deactivation logic
   */
  async onDeactivate() {
    // Subclasses can override
  }
}
exports.BaseAgentPlugin = BaseAgentPlugin;
//# sourceMappingURL=BaseAgentPlugin.js.map
