"use strict";
/**
 * MessageQueue Utility
 *
 * Extracted from ConsolidatedMessageManager to provide centralized
 * message queuing with priority handling and race condition protection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueue = void 0;
const ManagerLogger_1 = require("./ManagerLogger");
/**
 * Centralized message queue with priority handling and reliability features
 */
class MessageQueue {
    constructor(sender, config = {}) {
        this.sender = sender;
        this.highPriorityQueue = [];
        this.normalQueue = [];
        this.queueLock = false;
        this.isProcessing = false;
        this.messageIdCounter = 0;
        this.config = {
            maxRetries: config.maxRetries ?? 3,
            processingDelay: config.processingDelay ?? 1,
            maxQueueSize: config.maxQueueSize ?? 1000,
            enablePriority: config.enablePriority ?? true,
        };
        ManagerLogger_1.messageLogger.debug('MessageQueue initialized', this.config);
    }
    /**
     * Add message to queue with priority detection
     * @param message Message data to queue
     * @param priority Optional priority override
     */
    async enqueue(message, priority) {
        try {
            // Check queue size limits
            if (this.getTotalQueueSize() >= this.config.maxQueueSize) {
                ManagerLogger_1.messageLogger.warn(`Queue size limit reached (${this.config.maxQueueSize})`);
                this.clearOldestMessages(Math.floor(this.config.maxQueueSize * 0.1));
            }
            const detectedPriority = priority || this.detectMessagePriority(message);
            const queuedMessage = {
                id: this.generateMessageId(),
                data: message,
                priority: detectedPriority,
                timestamp: Date.now(),
                retryCount: 0,
                maxRetries: this.config.maxRetries,
            };
            if (detectedPriority === 'high') {
                this.highPriorityQueue.push(queuedMessage);
                ManagerLogger_1.messageLogger.debug(`⚡ High priority message queued: ${queuedMessage.id} (hp queue: ${this.highPriorityQueue.length})`);
            }
            else {
                this.normalQueue.push(queuedMessage);
                ManagerLogger_1.messageLogger.debug(`📤 Normal message queued: ${queuedMessage.id} (normal queue: ${this.normalQueue.length})`);
            }
            // Start processing if not already running
            void this.processQueue();
        }
        catch (error) {
            ManagerLogger_1.messageLogger.error('Failed to enqueue message:', error);
        }
    }
    /**
     * Process queued messages with error handling and retry logic
     */
    async processQueue() {
        if (this.queueLock || this.isProcessing) {
            return;
        }
        if (this.highPriorityQueue.length === 0 && this.normalQueue.length === 0) {
            return;
        }
        this.queueLock = true;
        this.isProcessing = true;
        try {
            let processed = 0;
            const startTime = Date.now();
            // Continue processing as long as there are messages in either queue
            while (this.highPriorityQueue.length > 0 || this.normalQueue.length > 0) {
                let message;
                // Always check high priority first in every iteration
                if (this.highPriorityQueue.length > 0) {
                    message = this.highPriorityQueue.shift();
                }
                else {
                    message = this.normalQueue.shift();
                }
                const success = await this.sendMessage(message);
                if (!success) {
                    if (message.retryCount < message.maxRetries) {
                        message.retryCount++;
                        // Re-queue at the front of the appropriate queue
                        if (message.priority === 'high') {
                            this.highPriorityQueue.unshift(message);
                        }
                        else {
                            this.normalQueue.unshift(message);
                        }
                        ManagerLogger_1.messageLogger.warn(`Retrying ${message.priority} priority message ${message.id} (attempt ${message.retryCount})`);
                    }
                    else {
                        ManagerLogger_1.messageLogger.error(`${message.priority} priority message ${message.id} failed after ${message.maxRetries} attempts`);
                    }
                    // Stop processing on failure to preserve order (or we could continue?)
                    // Current logic breaks.
                    break;
                }
                processed++;
                // Add small delay between normal messages to prevent overwhelming
                // Only apply if we just processed a normal message and there are more normal messages
                if (message.priority === 'normal' &&
                    this.config.processingDelay > 0 &&
                    this.normalQueue.length > 0 &&
                    this.highPriorityQueue.length === 0) {
                    await this.delay(this.config.processingDelay);
                }
            }
            if (processed > 0) {
                const duration = Date.now() - startTime;
                ManagerLogger_1.messageLogger.performance('Queue processing', duration, { processed });
            }
        }
        finally {
            this.isProcessing = false;
            this.queueLock = false;
        }
    }
    /**
     * Send individual message with error handling
     */
    async sendMessage(queuedMessage) {
        try {
            await this.sender(queuedMessage.data);
            const age = Date.now() - queuedMessage.timestamp;
            ManagerLogger_1.messageLogger.debug(`✅ Message sent: ${queuedMessage.id} (age: ${age}ms)`);
            return true;
        }
        catch (error) {
            ManagerLogger_1.messageLogger.error(`Failed to send message ${queuedMessage.id}:`, error);
            return false;
        }
    }
    /**
     * Detect message priority based on content
     */
    detectMessagePriority(message) {
        if (!this.config.enablePriority) {
            return 'normal';
        }
        try {
            const msgObj = message;
            const messageType = msgObj?.command || msgObj?.type || 'unknown';
            // High priority message types (user input, interactions)
            const highPriorityTypes = [
                'input',
                'terminalInteraction',
                'keydown',
                'paste',
                'interrupt',
                'kill',
            ];
            return highPriorityTypes.includes(messageType) ? 'high' : 'normal';
        }
        catch {
            return 'normal';
        }
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${++this.messageIdCounter}`;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Clear oldest messages to free up queue space
     */
    clearOldestMessages(count) {
        let cleared = 0;
        // Clear from normal queue first
        while (cleared < count && this.normalQueue.length > 0) {
            const removed = this.normalQueue.shift();
            if (removed) {
                ManagerLogger_1.messageLogger.debug(`Cleared old message: ${removed.id}`);
                cleared++;
            }
        }
        // Clear from high priority if needed (less aggressive)
        while (cleared < count && this.highPriorityQueue.length > 10) {
            const removed = this.highPriorityQueue.shift();
            if (removed) {
                ManagerLogger_1.messageLogger.warn(`Cleared old high priority message: ${removed.id}`);
                cleared++;
            }
        }
        if (cleared > 0) {
            ManagerLogger_1.messageLogger.info(`Cleared ${cleared} old messages from queue`);
        }
    }
    // Public API methods
    /**
     * Get current queue sizes
     */
    getQueueStats() {
        return {
            highPriority: this.highPriorityQueue.length,
            normal: this.normalQueue.length,
            total: this.getTotalQueueSize(),
            isProcessing: this.isProcessing,
        };
    }
    /**
     * Get total queue size
     */
    getTotalQueueSize() {
        return this.highPriorityQueue.length + this.normalQueue.length;
    }
    /**
     * Force flush all queues immediately
     */
    async flush() {
        ManagerLogger_1.messageLogger.info('Flushing message queues...');
        // Temporarily disable processing delay for fast flush
        const originalDelay = this.config.processingDelay;
        this.config.processingDelay = 0;
        try {
            await this.processQueue();
        }
        finally {
            this.config.processingDelay = originalDelay;
        }
    }
    /**
     * Clear all queued messages
     */
    clear() {
        const totalCleared = this.getTotalQueueSize();
        this.highPriorityQueue = [];
        this.normalQueue = [];
        ManagerLogger_1.messageLogger.info(`Cleared ${totalCleared} messages from queues`);
    }
    /**
     * Check if queues are empty
     */
    isEmpty() {
        return this.getTotalQueueSize() === 0;
    }
    /**
     * Get pending messages (for debugging)
     */
    getPendingMessages() {
        return {
            highPriority: [...this.highPriorityQueue],
            normal: [...this.normalQueue],
        };
    }
    /**
     * Update queue configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        ManagerLogger_1.messageLogger.info('Queue configuration updated', newConfig);
    }
    /**
     * Dispose and clean up resources
     */
    dispose() {
        this.clear();
        this.queueLock = false;
        this.isProcessing = false;
        ManagerLogger_1.messageLogger.lifecycle('MessageQueue', 'completed');
    }
}
exports.MessageQueue = MessageQueue;
//# sourceMappingURL=MessageQueue.js.map