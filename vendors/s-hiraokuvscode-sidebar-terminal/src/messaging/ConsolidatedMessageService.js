'use strict';
/**
 * Consolidated Message Service
 *
 * This service replaces and consolidates the functionality of:
 * - WebViewMessageHandlerService (Command pattern)
 * - RefactoredMessageManager (Queue-based message handling)
 * - WebViewMessageRouter (Router pattern)
 *
 * Provides a single, unified message handling system that eliminates
 * the 394 duplicate message handling occurrences across 56 files.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConsolidatedMessageServiceFactory = exports.ConsolidatedMessageService = void 0;
const UnifiedMessageDispatcher_1 = require('./UnifiedMessageDispatcher');
const ManagerLogger_1 = require('../webview/utils/ManagerLogger');
// Import unified message handlers
const SystemMessageHandler_1 = require('./handlers/SystemMessageHandler');
const TerminalOutputHandler_1 = require('./handlers/TerminalOutputHandler');
const TerminalLifecycleHandler_1 = require('./handlers/TerminalLifecycleHandler');
const CliAgentHandler_1 = require('./handlers/CliAgentHandler');
const SessionHandler_1 = require('./handlers/SessionHandler');
class ConsolidatedMessageService {
  constructor(coordinator) {
    this.logger = ManagerLogger_1.messageLogger;
    this.initialized = false;
    this.logger.info('ConsolidatedMessageService initializing');
    this.coordinator = coordinator;
    this.dispatcher = new UnifiedMessageDispatcher_1.UnifiedMessageDispatcher(coordinator);
    this.initializeHandlers();
    this.logger.info('ConsolidatedMessageService created');
  }
  /**
   * Initialize all unified message handlers
   */
  initializeHandlers() {
    // Register all unified handlers with the dispatcher
    this.dispatcher.registerHandler(new SystemMessageHandler_1.SystemMessageHandler());
    this.dispatcher.registerHandler(new TerminalOutputHandler_1.TerminalOutputHandler());
    this.dispatcher.registerHandler(new TerminalLifecycleHandler_1.TerminalLifecycleHandler());
    this.dispatcher.registerHandler(new CliAgentHandler_1.CliAgentHandler());
    this.dispatcher.registerHandler(new SessionHandler_1.SessionHandler());
    this.logger.info(
      `📨 [ConsolidatedMessageService] Registered ${this.dispatcher.getSupportedCommands().length} command handlers`
    );
  }
  // =================================================================
  // LIFECYCLE MANAGEMENT
  // =================================================================
  async initialize(coordinator) {
    if (this.initialized) {
      this.logger.warn('ConsolidatedMessageService already initialized');
      return;
    }
    if (coordinator) {
      this.coordinator = coordinator;
    }
    await this.dispatcher.initialize(this.coordinator);
    this.initialized = true;
    this.logger.info('ConsolidatedMessageService fully initialized');
  }
  dispose() {
    this.logger.info('Disposing ConsolidatedMessageService');
    this.dispatcher.dispose();
    this.coordinator = undefined;
    this.initialized = false;
    this.logger.info('ConsolidatedMessageService disposed');
  }
  // =================================================================
  // IMESSAGEMANAGER INTERFACE IMPLEMENTATION
  // =================================================================
  /**
   * Handle incoming messages (replaces RefactoredMessageManager functionality)
   */
  async receiveMessage(message, coordinator) {
    const msg = message;
    this.logger.debug('receiveMessage called', {
      messageType: typeof message,
      command: msg?.command,
      timestamp: Date.now(),
    });
    // Set coordinator if not already set
    if (!this.coordinator) {
      this.coordinator = coordinator;
    }
    // Convert to WebviewMessage format and process
    const webviewMessage = this.normalizeMessage(message);
    const result = await this.dispatcher.processMessage(webviewMessage);
    if (!result.success) {
      this.logger.error(`Message processing failed: ${result.error}`);
    } else {
      this.logger.debug(
        `Message processed successfully by ${result.handledBy} in ${result.processingTime}ms`
      );
    }
  }
  /**
   * Handle MessageEvent format (for compatibility)
   */
  async handleMessage(message, coordinator) {
    const webviewMessage = message.data;
    await this.receiveMessage(webviewMessage, coordinator);
  }
  /**
   * Send ready message to extension
   */
  sendReadyMessage(_coordinator) {
    this.dispatcher.sendMessage(
      {
        command: 'ready',
        timestamp: Date.now(),
      },
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.info('Ready message sent');
  }
  /**
   * Post message to extension
   */
  postMessage(message) {
    this.dispatcher.sendMessage(message, UnifiedMessageDispatcher_1.MessagePriority.NORMAL);
    this.logger.debug('Message posted to queue', { message });
  }
  /**
   * Emit terminal interaction event
   */
  emitTerminalInteractionEvent(type, terminalId, data, coordinator) {
    // Update coordinator if provided
    if (coordinator && !this.coordinator) {
      this.coordinator = coordinator;
    }
    this.dispatcher.sendTerminalInteractionEvent(
      type,
      terminalId,
      data,
      UnifiedMessageDispatcher_1.MessagePriority.NORMAL
    );
    this.logger.debug(`Terminal interaction event sent: ${type} for ${terminalId}`);
  }
  /**
   * Get message queue statistics
   */
  getQueueStats() {
    const stats = this.dispatcher.getStats();
    return {
      queueSize: stats.queueSize,
      isProcessing: stats.isProcessing,
      highPriorityQueueSize: stats.highPriorityQueueSize,
      isLocked: false, // Unified dispatcher doesn't use locking
    };
  }
  /**
   * Send input to terminal
   */
  sendInput(input, terminalId, coordinator) {
    if (coordinator && !this.coordinator) {
      this.coordinator = coordinator;
    }
    if (!this.coordinator) {
      this.logger.error('No coordinator available for sendInput');
      return;
    }
    // Use dispatcher's optimized input handling
    this.dispatcher.sendInput(input, terminalId, UnifiedMessageDispatcher_1.MessagePriority.HIGH);
    this.logger.info(`Input sent: ${input.length} chars to terminal ${terminalId || 'active'}`);
  }
  /**
   * Send resize command
   */
  sendResize(cols, rows, terminalId, coordinator) {
    if (coordinator && !this.coordinator) {
      this.coordinator = coordinator;
    }
    this.dispatcher.sendResize(
      cols,
      rows,
      terminalId,
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.debug(`Resize sent: ${cols}x${rows} to terminal ${terminalId || 'active'}`);
  }
  /**
   * Send delete terminal message
   */
  sendDeleteTerminalMessage(terminalId, requestSource, coordinator) {
    if (!this.coordinator) {
      this.coordinator = coordinator;
    }
    this.dispatcher.sendDeleteTerminalMessage(
      terminalId,
      requestSource,
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.info(`Delete terminal message sent: ${terminalId} from ${requestSource}`);
  }
  /**
   * Send switch AI agent message
   */
  sendSwitchAiAgentMessage(terminalId, coordinator) {
    if (!this.coordinator) {
      this.coordinator = coordinator;
    }
    this.dispatcher.sendMessage(
      {
        command: 'switchAiAgent',
        terminalId,
        timestamp: Date.now(),
      },
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.info(`Switch AI agent message sent for terminal: ${terminalId}`);
  }
  /**
   * Send kill terminal message
   */
  sendKillTerminalMessage(_coordinator) {
    this.dispatcher.sendMessage(
      {
        command: 'killTerminal',
        timestamp: Date.now(),
      },
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.info('Kill terminal message sent');
  }
  /**
   * Send kill specific terminal message
   */
  sendKillSpecificTerminalMessage(terminalId, _coordinator) {
    this.dispatcher.sendMessage(
      {
        command: 'killTerminal',
        terminalId,
        timestamp: Date.now(),
      },
      UnifiedMessageDispatcher_1.MessagePriority.HIGH
    );
    this.logger.info(`Kill specific terminal message sent for: ${terminalId}`);
  }
  /**
   * Request settings from extension
   */
  requestSettings(_coordinator) {
    this.dispatcher.requestSettings(UnifiedMessageDispatcher_1.MessagePriority.NORMAL);
    this.logger.info('Settings requested');
  }
  /**
   * Update settings
   */
  updateSettings(settings, _coordinator) {
    this.dispatcher.updateSettings(settings, UnifiedMessageDispatcher_1.MessagePriority.NORMAL);
    this.logger.info('Settings update sent');
  }
  /**
   * Request new terminal creation
   */
  requestNewTerminal(_coordinator) {
    this.dispatcher.requestNewTerminal(UnifiedMessageDispatcher_1.MessagePriority.HIGH);
    this.logger.info('New terminal requested');
  }
  /**
   * Clear message queue
   */
  clearQueue() {
    this.dispatcher.clearQueue();
    this.logger.info('All message queues cleared');
  }
  /**
   * Queue message manually (for testing)
   */
  queueMessage(message, coordinator) {
    if (!this.coordinator) {
      this.coordinator = coordinator;
    }
    this.postMessage(message);
  }
  /**
   * Process message queue manually (for testing)
   */
  async processMessageQueue(coordinator) {
    if (coordinator && !this.coordinator) {
      this.coordinator = coordinator;
    }
    await this.dispatcher.flush();
  }
  // =================================================================
  // UTILITY METHODS
  // =================================================================
  /**
   * Normalize different message formats to WebviewMessage
   */
  normalizeMessage(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format');
    }
    const msg = message;
    // Handle MessageEvent wrapper
    if (msg.data && typeof msg.data === 'object') {
      return msg.data;
    }
    // Handle direct WebviewMessage
    if (typeof msg.command === 'string') {
      return msg;
    }
    throw new Error('Unable to normalize message to WebviewMessage format');
  }
  /**
   * Get comprehensive statistics
   */
  getDetailedStats() {
    return {
      dispatcher: this.dispatcher.getStats(),
      supportedCommands: this.dispatcher.getSupportedCommands(),
      isReady: this.dispatcher.isReady(),
      initialized: this.initialized,
    };
  }
  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.dispatcher.isReady();
  }
}
exports.ConsolidatedMessageService = ConsolidatedMessageService;
/**
 * Factory for creating ConsolidatedMessageService instances
 * (Maintains compatibility with existing factory patterns)
 */
class ConsolidatedMessageServiceFactory {
  /**
   * Create ConsolidatedMessageService instance
   */
  static create(coordinator) {
    return new ConsolidatedMessageService(coordinator);
  }
  /**
   * Create test instance
   */
  static createForTesting() {
    const service = new ConsolidatedMessageService();
    ManagerLogger_1.messageLogger.info('🧪 Test ConsolidatedMessageService created');
    return service;
  }
}
exports.ConsolidatedMessageServiceFactory = ConsolidatedMessageServiceFactory;
//# sourceMappingURL=ConsolidatedMessageService.js.map
