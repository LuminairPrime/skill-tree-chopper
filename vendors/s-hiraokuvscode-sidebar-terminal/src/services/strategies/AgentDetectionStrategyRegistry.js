'use strict';
/**
 * Agent Detection Strategy Registry
 *
 * Manages registration and retrieval of agent detection strategies.
 * Provides a centralized way to access strategy implementations for different CLI agents.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentDetectionStrategyRegistry = void 0;
const ClaudeDetectionStrategy_1 = require('./ClaudeDetectionStrategy');
const GeminiDetectionStrategy_1 = require('./GeminiDetectionStrategy');
const CodexDetectionStrategy_1 = require('./CodexDetectionStrategy');
const CopilotDetectionStrategy_1 = require('./CopilotDetectionStrategy');
class AgentDetectionStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.disposed = false;
    this.registerDefaultStrategies();
  }
  /**
   * Register default strategies for all supported agents
   */
  registerDefaultStrategies() {
    this.register(new ClaudeDetectionStrategy_1.ClaudeDetectionStrategy());
    this.register(new GeminiDetectionStrategy_1.GeminiDetectionStrategy());
    this.register(new CodexDetectionStrategy_1.CodexDetectionStrategy());
    this.register(new CopilotDetectionStrategy_1.CopilotDetectionStrategy());
  }
  /**
   * Register a new agent detection strategy
   * @param strategy Strategy implementation to register
   */
  register(strategy) {
    this.strategies.set(strategy.agentType, strategy);
  }
  /**
   * Get strategy for specific agent type
   * @param agentType Agent type to get strategy for
   * @returns Strategy implementation or undefined if not found
   */
  getStrategy(agentType) {
    return this.strategies.get(agentType);
  }
  /**
   * Get all registered strategies
   * @returns Array of all registered strategy implementations
   */
  getAllStrategies() {
    return Array.from(this.strategies.values());
  }
  /**
   * Get all supported agent types
   * @returns Array of supported agent type names
   */
  getSupportedAgentTypes() {
    return Array.from(this.strategies.keys());
  }
  /**
   * Check if an agent type is supported
   * @param agentType Agent type to check
   * @returns True if agent type has a registered strategy
   */
  isSupported(agentType) {
    return this.strategies.has(agentType);
  }
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.strategies.clear();
  }
}
exports.AgentDetectionStrategyRegistry = AgentDetectionStrategyRegistry;
//# sourceMappingURL=AgentDetectionStrategyRegistry.js.map
