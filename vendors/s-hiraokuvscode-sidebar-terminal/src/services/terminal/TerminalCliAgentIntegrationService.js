'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalCliAgentIntegrationService = void 0;
const logger_1 = require('../../utils/logger');
const CliAgentDetectionService_1 = require('../../services/CliAgentDetectionService');
/**
 * Service responsible for CLI Agent integration with terminals
 *
 * This service extracts CLI Agent functionality from TerminalManager to improve:
 * - Single Responsibility: Focus only on CLI Agent integration
 * - Testability: Isolated CLI Agent logic
 * - Maintainability: Clear separation of CLI Agent concerns
 * - Reusability: Can be used by other terminal-related components
 */
class TerminalCliAgentIntegrationService {
  constructor(cliAgentService) {
    this._cliAgentService =
      cliAgentService || new CliAgentDetectionService_1.CliAgentDetectionService();
    (0, logger_1.terminal)('🤖 [CliAgentIntegration] CLI Agent integration service initialized');
  }
  /**
   * Start CLI Agent detection heartbeat
   */
  startHeartbeat() {
    try {
      this._cliAgentService.startHeartbeat();
      (0, logger_1.terminal)('💓 [CliAgentIntegration] CLI Agent heartbeat started');
    } catch (error) {
      (0, logger_1.terminal)('❌ [CliAgentIntegration] Error starting CLI Agent heartbeat:', error);
    }
  }
  /**
   * Get CLI Agent status change event emitter
   */
  get onCliAgentStatusChange() {
    return this._cliAgentService.onCliAgentStatusChange;
  }
  /**
   * Check if CLI Agent is connected in a terminal
   */
  isCliAgentConnected(terminalId) {
    try {
      const agentState = this._cliAgentService.getAgentState(terminalId);
      return agentState.status === 'connected';
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error checking CLI Agent connection:`,
        error
      );
      return false;
    }
  }
  /**
   * Check if CLI Agent is running in a terminal (CONNECTED or DISCONNECTED)
   */
  isCliAgentRunning(terminalId) {
    try {
      const agentState = this._cliAgentService.getAgentState(terminalId);
      return agentState.status !== 'none';
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error checking CLI Agent running status:`,
        error
      );
      return false;
    }
  }
  /**
   * Get currently globally active CLI Agent
   */
  getCurrentGloballyActiveAgent() {
    try {
      return this._cliAgentService.getConnectedAgent();
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error getting current global agent:`, error);
      return null;
    }
  }
  /**
   * Refresh CLI Agent state (fallback for file reference issues)
   */
  refreshCliAgentState() {
    try {
      const result = this._cliAgentService.refreshAgentState();
      (0, logger_1.terminal)(`🔄 [CliAgentIntegration] CLI Agent state refreshed: ${result}`);
      return result;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error refreshing CLI Agent state:`, error);
      return false;
    }
  }
  /**
   * Handle terminal output for CLI Agent detection
   */
  handleTerminalOutputForCliAgent(terminalId, data) {
    try {
      this._cliAgentService.detectFromOutput(terminalId, data);
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error detecting CLI Agent from output:`,
        error
      );
    }
  }
  /**
   * Handle terminal input for CLI Agent detection
   */
  handleTerminalInputForCliAgent(terminalId, data) {
    try {
      this._cliAgentService.detectFromInput(terminalId, data);
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error detecting CLI Agent from input:`,
        error
      );
    }
  }
  /**
   * Get the active CLI Agent type for a terminal
   */
  getAgentType(terminalId) {
    try {
      const agentState = this._cliAgentService.getAgentState(terminalId);
      return agentState.agentType;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error getting agent type:`, error);
      return null;
    }
  }
  /**
   * Get all connected CLI Agents
   */
  getConnectedAgents() {
    try {
      const connectedAgent = this._cliAgentService.getConnectedAgent();
      return connectedAgent
        ? [
            {
              terminalId: connectedAgent.terminalId,
              agentInfo: { type: connectedAgent.type },
            },
          ]
        : [];
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error getting connected agents:`, error);
      return [];
    }
  }
  /**
   * Get the map of disconnected agents for full state sync
   */
  getDisconnectedAgents() {
    try {
      return this._cliAgentService.getDisconnectedAgents();
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error getting disconnected agents:`, error);
      return new Map();
    }
  }
  /**
   * Get the connected agent terminal ID
   */
  getConnectedAgentTerminalId() {
    try {
      const connectedAgent = this._cliAgentService.getConnectedAgent();
      return connectedAgent ? connectedAgent.terminalId : null;
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error getting connected agent terminal ID:`,
        error
      );
      return null;
    }
  }
  /**
   * Get the connected agent type
   */
  getConnectedAgentType() {
    try {
      const connectedAgent = this._cliAgentService.getConnectedAgent();
      if (!connectedAgent) {
        return null;
      }
      const type = connectedAgent.type;
      if (
        type === 'claude' ||
        type === 'gemini' ||
        type === 'codex' ||
        type === 'copilot' ||
        type === 'opencode'
      ) {
        return type;
      }
      return null;
    } catch (error) {
      (0, logger_1.terminal)(`❌ [CliAgentIntegration] Error getting connected agent type:`, error);
      return null;
    }
  }
  /**
   * Handle terminal removal for CLI Agent cleanup
   */
  handleTerminalRemoved(terminalId) {
    try {
      this._cliAgentService.handleTerminalRemoved(terminalId);
      (0, logger_1.terminal)(
        `🧹 [CliAgentIntegration] CLI Agent state cleaned up for terminal: ${terminalId}`
      );
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error handling terminal removal for CLI Agent:`,
        error
      );
    }
  }
  /**
   * Switch AI Agent connection manually
   * Issue #122: AI Agent connection toggle button functionality
   */
  switchAiAgentConnection(terminalId) {
    try {
      const result = this._cliAgentService.switchAgentConnection(terminalId);
      (0, logger_1.terminal)(
        `🔄 [CliAgentIntegration] AI Agent connection switched for terminal ${terminalId}:`,
        result
      );
      return result;
    } catch (error) {
      (0, logger_1.terminal)(
        `❌ [CliAgentIntegration] Error switching AI Agent connection:`,
        error
      );
      return {
        success: false,
        reason: `Switch failed: ${String(error)}`,
        newStatus: 'none',
        agentType: null,
      };
    }
  }
  /**
   * Dispose of all CLI Agent resources
   */
  dispose() {
    try {
      this._cliAgentService.dispose();
      (0, logger_1.terminal)('🧹 [CliAgentIntegration] CLI Agent integration service disposed');
    } catch (error) {
      (0, logger_1.terminal)(
        '❌ [CliAgentIntegration] Error disposing CLI Agent integration service:',
        error
      );
    }
  }
}
exports.TerminalCliAgentIntegrationService = TerminalCliAgentIntegrationService;
//# sourceMappingURL=TerminalCliAgentIntegrationService.js.map
