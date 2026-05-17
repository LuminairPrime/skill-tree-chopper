'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CliAgentStateStore =
  exports.CliAgentDetectionEngine =
  exports.CliAgentPatternRegistry =
  exports.CliAgentDetectionService =
    void 0;
const logger_1 = require('../utils/logger');
const CliAgentDetectionEngine_1 = require('./CliAgentDetectionEngine');
const CliAgentStateStore_1 = require('./CliAgentStateStore');
const ToastNotificationService_1 = require('./ToastNotificationService');
const NativeNotificationService_1 = require('./NativeNotificationService');
const NotificationCoordinator_1 = require('./NotificationCoordinator');
const CliAgentInputAccumulator_1 = require('./CliAgentInputAccumulator');
class CliAgentDetectionService {
  constructor() {
    this.previousAgentInfo = new Map();
    this.removingTerminals = new Set();
    this.detectionEngine = new CliAgentDetectionEngine_1.CliAgentDetectionEngine();
    this.stateStore = new CliAgentStateStore_1.CliAgentStateStore();
    this.notificationCoordinator = new NotificationCoordinator_1.NotificationCoordinator(
      new ToastNotificationService_1.ToastNotificationService(),
      new NativeNotificationService_1.NativeNotificationService()
    );
    this.inputAccumulator = new CliAgentInputAccumulator_1.CliAgentInputAccumulator();
    this.statusChangeSubscription = this.stateStore.onStatusChange((event) => {
      const previous = this.previousAgentInfo.get(event.terminalId);
      this.previousAgentInfo.set(event.terminalId, { status: event.status, agentType: event.type });
      if (
        event.status === 'none' &&
        (previous?.status === 'connected' || previous?.status === 'disconnected')
      ) {
        if (this.removingTerminals.has(event.terminalId)) {
          this.removingTerminals.delete(event.terminalId);
          return;
        }
        this.notificationCoordinator.clearTerminal(event.terminalId);
        this.notificationCoordinator.notifyCompleted(event.terminalId, previous.agentType);
      }
    });
  }
  detectFromInput(terminalId, input) {
    try {
      const result = this.detectionEngine.detectFromInput(terminalId, input);
      if (/\x03/.test(input)) {
        const terminalState = this.stateStore.getAgentState(terminalId);
        if (terminalState && terminalState.status !== 'none') {
          const immediateTermination = this.detectionEngine.detectImmediateInterruptTermination(
            terminalId,
            terminalState.agentType ?? undefined
          );
          if (immediateTermination?.isTerminated) {
            this.stateStore.setAgentTerminated(terminalId);
            return null;
          }
        }
      }
      if (result.isDetected && result.agentType) {
        this.stateStore.setConnectedAgent(terminalId, result.agentType);
        return {
          type: result.agentType,
          confidence: result.confidence,
          source: 'input',
          detectedLine: result.detectedLine,
        };
      }
      return null;
    } catch (error) {
      (0, logger_1.terminal)('ERROR: Input detection failed:', error);
      return null;
    }
  }
  handleInputChunk(terminalId, input) {
    if (!input) {
      return null;
    }
    const { submittedCommands, sawInterrupt } = this.inputAccumulator.consume(terminalId, input);
    if (sawInterrupt) {
      this.detectFromInput(terminalId, '\x03');
    }
    let lastDetection = null;
    for (const command of submittedCommands) {
      const detection = this.detectFromInput(terminalId, command);
      if (detection) {
        lastDetection = detection;
      }
    }
    return lastDetection;
  }
  detectFromOutput(terminalId, data) {
    try {
      const result = this.detectionEngine.detectFromOutput(terminalId, data);
      if (result.isDetected && result.agentType) {
        this.stateStore.setConnectedAgent(terminalId, result.agentType);
        return {
          type: result.agentType,
          confidence: result.confidence,
          source: 'output',
          detectedLine: result.detectedLine,
        };
      }
      return null;
    } catch (error) {
      (0, logger_1.terminal)('ERROR: Output detection failed:', error);
      return null;
    }
  }
  handleOutputChunk(terminalId, data) {
    let detection = null;
    let termination = null;
    let state = this.getAgentState(terminalId);
    if (state.status === 'none') {
      detection = this.detectFromOutput(terminalId, data);
      state = this.getAgentState(terminalId);
    }
    if (state.status !== 'none') {
      const terminationResult = this.detectTermination(terminalId, data);
      if (terminationResult.isTerminated) {
        termination = terminationResult;
      }
      state = this.getAgentState(terminalId);
    }
    return {
      detection,
      termination,
      state,
    };
  }
  detectTermination(terminalId, data) {
    try {
      const terminalState = this.stateStore.getAgentState(terminalId);
      const currentAgentType = terminalState?.agentType ?? undefined;
      const result = this.detectionEngine.detectTermination(terminalId, data, currentAgentType);
      if (result.isTerminated) {
        this.stateStore.setAgentTerminated(terminalId);
      }
      return result;
    } catch (error) {
      (0, logger_1.terminal)('ERROR: Termination detection failed:', error);
      return {
        isTerminated: false,
        confidence: 0,
        detectedLine: '',
        reason: 'Detection error',
      };
    }
  }
  getAgentState(terminalId) {
    const state = this.stateStore.getAgentState(terminalId);
    return {
      status: state?.status ?? 'none',
      agentType: state?.agentType ?? null,
    };
  }
  getConnectedAgent() {
    const terminalId = this.stateStore.getConnectedAgentTerminalId();
    const type = this.stateStore.getConnectedAgentType();
    return terminalId && type ? { terminalId, type } : null;
  }
  getDisconnectedAgents() {
    return this.stateStore.getDisconnectedAgents();
  }
  switchAgentConnection(terminalId) {
    try {
      const existingState = this.stateStore.getAgentState(terminalId);
      const agentType = existingState?.agentType;
      if (!existingState || existingState.status === 'none' || !agentType) {
        return {
          success: false,
          reason: 'No detected AI agent found for this terminal',
          newStatus: 'none',
          agentType: null,
        };
      }
      this.stateStore.setConnectedAgent(terminalId, agentType, existingState.terminalName);
      return {
        success: true,
        newStatus: 'connected',
        agentType,
      };
    } catch (error) {
      (0, logger_1.terminal)('ERROR: Connection switch failed:', error);
      return {
        success: false,
        reason: 'Connection switch failed',
        newStatus: 'none',
        agentType: null,
      };
    }
  }
  handleTerminalRemoved(terminalId) {
    this.removingTerminals.add(terminalId);
    this.detectionEngine.clearTerminalCache(terminalId);
    this.inputAccumulator.clear(terminalId);
    this.stateStore.removeTerminalCompletely(terminalId);
    this.previousAgentInfo.delete(terminalId);
    this.notificationCoordinator.clearTerminal(terminalId);
  }
  forceReconnectAgent(terminalId, agentType = 'claude', terminalName) {
    this.detectionEngine.clearTerminalCache(terminalId);
    return this.stateStore.forceReconnectAgent(terminalId, agentType, terminalName);
  }
  clearDetectionError(terminalId) {
    this.detectionEngine.clearTerminalCache(terminalId);
    return this.stateStore.clearDetectionError(terminalId);
  }
  get onCliAgentStatusChange() {
    return this.stateStore.onStatusChange;
  }
  dispose() {
    this.clearHeartbeatTimer();
    this.statusChangeSubscription?.dispose();
    this.notificationCoordinator.dispose();
    this.stateStore.dispose();
  }
  startHeartbeat() {
    this.clearHeartbeatTimer();
    this.scheduleHeartbeat();
  }
  refreshAgentState() {
    return this.stateStore.getConnectedAgentTerminalId() !== null;
  }
  setAgentConnected(terminalId, type, terminalName) {
    this.stateStore.setConnectedAgent(terminalId, type, terminalName);
  }
  get patternDetector() {
    return this.detectionEngine.getPatternRegistry();
  }
  get stateManager() {
    return this.stateStore;
  }
  get configManager() {
    return {
      getConfig: () => ({
        debounceMs: 25,
        cacheTtlMs: 1000,
        maxBufferSize: 50,
        skipMinimalData: true,
      }),
      updateConfig: () => {},
    };
  }
  scheduleHeartbeat() {
    this.heartbeatTimer = globalThis.setTimeout(() => {
      this.stateStore.getStateStats();
      this.scheduleHeartbeat();
    }, CliAgentDetectionService.HEARTBEAT_INTERVAL_MS);
  }
  clearHeartbeatTimer() {
    if (this.heartbeatTimer) {
      globalThis.clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}
exports.CliAgentDetectionService = CliAgentDetectionService;
CliAgentDetectionService.HEARTBEAT_INTERVAL_MS = 30000;
var CliAgentPatternRegistry_1 = require('./CliAgentPatternRegistry');
Object.defineProperty(exports, 'CliAgentPatternRegistry', {
  enumerable: true,
  get: function () {
    return CliAgentPatternRegistry_1.CliAgentPatternRegistry;
  },
});
var CliAgentDetectionEngine_2 = require('./CliAgentDetectionEngine');
Object.defineProperty(exports, 'CliAgentDetectionEngine', {
  enumerable: true,
  get: function () {
    return CliAgentDetectionEngine_2.CliAgentDetectionEngine;
  },
});
var CliAgentStateStore_2 = require('./CliAgentStateStore');
Object.defineProperty(exports, 'CliAgentStateStore', {
  enumerable: true,
  get: function () {
    return CliAgentStateStore_2.CliAgentStateStore;
  },
});
//# sourceMappingURL=CliAgentDetectionService.js.map
