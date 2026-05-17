'use strict';
/**
 * TelemetryService
 *
 * Privacy-respecting telemetry service using VS Code's native TelemetryLogger API.
 *
 * Key Features:
 * - Respects VS Code's telemetry opt-out settings
 * - No collection of terminal content, file paths, or credentials
 * - Anonymous data only
 * - HTTPS encryption in transit
 * - Minimal data collection approach
 *
 * Implementation based on Issue #241
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TelemetryService = exports.TelemetryEventType = void 0;
const vscode = require('vscode');
const logger_1 = require('../utils/logger');
/**
 * Telemetry event types
 */
var TelemetryEventType;
(function (TelemetryEventType) {
  // Extension lifecycle
  TelemetryEventType['ExtensionActivated'] = 'extension.activated';
  TelemetryEventType['ExtensionDeactivated'] = 'extension.deactivated';
  // Terminal operations
  TelemetryEventType['TerminalCreated'] = 'terminal.created';
  TelemetryEventType['TerminalDeleted'] = 'terminal.deleted';
  TelemetryEventType['TerminalFocused'] = 'terminal.focused';
  TelemetryEventType['TerminalSplit'] = 'terminal.split';
  // CLI Agent detection
  TelemetryEventType['CliAgentDetected'] = 'cliAgent.detected';
  TelemetryEventType['CliAgentDisconnected'] = 'cliAgent.disconnected';
  // Command execution
  TelemetryEventType['CommandExecuted'] = 'command.executed';
  // Errors
  TelemetryEventType['ErrorOccurred'] = 'error.occurred';
  // Settings changes
  TelemetryEventType['SettingsChanged'] = 'settings.changed';
  // Session management
  TelemetryEventType['SessionSaved'] = 'session.saved';
  TelemetryEventType['SessionRestored'] = 'session.restored';
  // Performance metrics
  TelemetryEventType['PerformanceMetric'] = 'performance.metric';
})(TelemetryEventType || (exports.TelemetryEventType = TelemetryEventType = {}));
/**
 * TelemetryService class
 *
 * Provides privacy-respecting telemetry tracking using VS Code's TelemetryLogger API
 */
class TelemetryService {
  constructor(context, extensionId = 'vscode-sidebar-terminal', extensionVersion = '0.1.138') {
    this.extensionId = extensionId;
    this.extensionVersion = extensionVersion;
    // Create telemetry logger with sender configuration
    this.telemetryLogger = vscode.env.createTelemetryLogger({
      sendEventData: (eventName, data) => {
        // TelemetryLogger automatically respects VS Code telemetry settings
        // Data is only sent if user has not opted out of telemetry
        this.sendTelemetryData(eventName, data);
      },
      sendErrorData: (error, data) => {
        // Send error telemetry
        this.sendErrorTelemetry(error, data);
      },
    });
    // Register disposal
    context.subscriptions.push(this.telemetryLogger);
  }
  /**
   * Send telemetry data (internal implementation)
   */
  sendTelemetryData(eventName, data = {}) {
    // VS Code's TelemetryLogger automatically handles:
    // - Checking user's telemetry opt-out settings
    // - HTTPS encryption
    // - Anonymous data collection
    //
    // We don't need to implement these checks ourselves
    // For development/debugging, you can log to output channel
    // In production, this would send to your telemetry backend
    if (process.env.NODE_ENV === 'development') {
      (0, logger_1.debug)(`[Telemetry] ${eventName}:`, data);
    }
  }
  /**
   * Send error telemetry (internal implementation)
   */
  sendErrorTelemetry(error, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Telemetry Error] ${error.message}:`, data);
    }
  }
  /**
   * Track extension activation
   */
  trackActivation(activationTime) {
    this.activationTime = activationTime;
    this.telemetryLogger.logUsage(TelemetryEventType.ExtensionActivated, {
      extensionId: this.extensionId,
      version: this.extensionVersion,
      platform: process.platform,
      nodeVersion: process.version,
      activationTime,
    });
  }
  /**
   * Track extension deactivation
   */
  trackDeactivation() {
    const sessionDuration = this.activationTime ? Date.now() - this.activationTime : 0;
    this.telemetryLogger.logUsage(TelemetryEventType.ExtensionDeactivated, {
      extensionId: this.extensionId,
      version: this.extensionVersion,
      sessionDuration,
    });
  }
  /**
   * Track terminal creation
   */
  trackTerminalCreated(terminalId, profileName) {
    this.telemetryLogger.logUsage(TelemetryEventType.TerminalCreated, {
      hasProfile: !!profileName,
      // Note: We don't send terminalId or profileName to respect privacy
    });
  }
  /**
   * Track terminal deletion
   */
  trackTerminalDeleted(_terminalId) {
    this.telemetryLogger.logUsage(TelemetryEventType.TerminalDeleted, {
      // Note: We don't send terminalId to respect privacy
    });
  }
  /**
   * Track terminal focus
   */
  trackTerminalFocused(_terminalId) {
    this.telemetryLogger.logUsage(TelemetryEventType.TerminalFocused, {
      // Note: We don't send terminalId to respect privacy
    });
  }
  /**
   * Track terminal split
   */
  trackTerminalSplit(direction) {
    this.telemetryLogger.logUsage(TelemetryEventType.TerminalSplit, {
      direction,
    });
  }
  /**
   * Track CLI agent detection
   */
  trackCliAgentDetected(agentType) {
    this.telemetryLogger.logUsage(TelemetryEventType.CliAgentDetected, {
      agentType, // e.g., 'claude', 'gemini', 'copilot'
    });
  }
  /**
   * Track CLI agent disconnection
   */
  trackCliAgentDisconnected(agentType, sessionDuration) {
    this.telemetryLogger.logUsage(TelemetryEventType.CliAgentDisconnected, {
      agentType,
      sessionDuration,
    });
  }
  /**
   * Track command execution
   */
  trackCommandExecuted(commandId, success = true) {
    this.telemetryLogger.logUsage(TelemetryEventType.CommandExecuted, {
      commandId,
      success,
    });
  }
  /**
   * Track error occurrence
   */
  trackError(error, context) {
    this.telemetryLogger.logError(TelemetryEventType.ErrorOccurred, {
      errorMessage: error.message,
      errorName: error.name,
      context: context || 'unknown',
      stack: error.stack || 'no-stack',
    });
  }
  /**
   * Track settings changes
   */
  trackSettingsChanged(settingKey) {
    this.telemetryLogger.logUsage(TelemetryEventType.SettingsChanged, {
      settingKey,
      // Note: We don't send the actual value to respect privacy
    });
  }
  /**
   * Track session save
   */
  trackSessionSaved(terminalCount, success) {
    this.telemetryLogger.logUsage(TelemetryEventType.SessionSaved, {
      success,
      terminalCount,
    });
  }
  /**
   * Track session restore
   */
  trackSessionRestored(terminalCount, success) {
    this.telemetryLogger.logUsage(TelemetryEventType.SessionRestored, {
      success,
      terminalCount,
    });
  }
  /**
   * Track performance metric
   */
  trackPerformance(metric) {
    this.telemetryLogger.logUsage(TelemetryEventType.PerformanceMetric, {
      operation: metric.operation,
      success: metric.success,
      duration: metric.duration,
      ...metric.metadata,
    });
  }
  /**
   * Measure async operation performance
   */
  async measureAsync(operation, fn, metadata) {
    const startTime = Date.now();
    let success = true;
    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.trackPerformance({
        operation,
        duration,
        success,
        metadata,
      });
    }
  }
  /**
   * Measure sync operation performance
   */
  measure(operation, fn, metadata) {
    const startTime = Date.now();
    let success = true;
    try {
      const result = fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.trackPerformance({
        operation,
        duration,
        success,
        metadata,
      });
    }
  }
  /**
   * Dispose telemetry service
   */
  dispose() {
    this.telemetryLogger.dispose();
  }
}
exports.TelemetryService = TelemetryService;
//# sourceMappingURL=TelemetryService.js.map
