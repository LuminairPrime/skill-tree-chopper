"use strict";
/**
 * Terminal Lifecycle Message Handler
 *
 * Handles terminal creation, deletion, focus, and state management
 *
 * Uses registry-based dispatch pattern instead of switch-case
 * for better maintainability and extensibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalLifecycleMessageHandler = void 0;
const type_guards_1 = require("../../../types/type-guards");
const TerminalCreationService_1 = require("../../services/TerminalCreationService");
/**
 * Terminal Lifecycle Message Handler
 *
 * Responsibilities:
 * - Terminal initialization and creation
 * - Terminal removal and cleanup
 * - Terminal focus management
 * - Active terminal state tracking
 * - Terminal deletion response handling
 */
class TerminalLifecycleMessageHandler {
    constructor(messageQueue, logger) {
        this.messageQueue = messageQueue;
        this.logger = logger;
        this.outputGates = new Map();
        this.initAckTrackers = new Map();
        this.processingTimers = new Map();
        this.handlers = this.buildHandlerRegistry();
    }
    /**
     * Build handler registry - replaces switch-case pattern
     */
    buildHandlerRegistry() {
        const registry = new Map();
        // Lifecycle commands
        registry.set('init', (msg, coord) => this.handleInit(msg, coord));
        registry.set('terminalCreated', (msg, coord) => this.handleTerminalCreated(msg, coord));
        registry.set('newTerminal', (msg, coord) => this.handleNewTerminal(msg, coord));
        registry.set('focusTerminal', (msg, coord) => this.handleFocusTerminal(msg, coord));
        registry.set('panelNavigationMode', (msg, coord) => this.handlePanelNavigationMode(msg, coord));
        registry.set('panelNavigationEnabledChanged', (msg, coord) => this.handlePanelNavigationEnabledChanged(msg, coord));
        registry.set('terminalRemoved', (msg, coord) => this.handleTerminalRemoved(msg, coord));
        registry.set('setRestoringSession', (msg, coord) => this.handleSetRestoringSession(msg, coord));
        // Clear commands (aliases)
        const clearHandler = (msg, coord) => this.handleClearTerminal(msg, coord);
        registry.set('clear', clearHandler);
        registry.set('clearTerminal', clearHandler);
        // State and response commands
        registry.set('setActiveTerminal', (msg, coord) => this.handleSetActiveTerminal(msg, coord));
        registry.set('deleteTerminalResponse', (msg, coord) => this.handleDeleteTerminalResponse(msg, coord));
        // Output commands
        registry.set('output', (msg, coord) => this.handleOutput(msg, coord));
        registry.set('startOutput', (msg, coord) => this.handleStartOutput(msg, coord));
        return registry;
    }
    /**
     * Handle terminal lifecycle related messages using registry dispatch
     */
    async handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        const handler = this.handlers.get(command);
        if (handler) {
            await handler(msg, coordinator);
        }
        else {
            this.logger.warn(`Unknown terminal lifecycle command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Handle init message - WebView initialization
     */
    handleInit(msg, coordinator) {
        this.logger.info('Handling init message');
        try {
            // Request current settings
            void this.messageQueue.enqueue({
                command: 'getSettings',
            });
            // Emit ready event
            this.emitTerminalInteractionEvent('webview-ready', '', undefined, coordinator);
            // Send confirmation back to extension
            coordinator.postMessageToExtension({
                command: 'test',
                type: 'initComplete',
                data: 'WebView processed INIT message',
                timestamp: Date.now(),
            });
            this.logger.info('INIT processing completed');
        }
        catch (error) {
            this.logger.error('Error processing INIT message', error);
        }
    }
    handlePanelNavigationMode(msg, coordinator) {
        const enabled = Boolean(msg.enabled);
        coordinator.inputManager?.setPanelNavigationMode?.(enabled);
    }
    handlePanelNavigationEnabledChanged(msg, coordinator) {
        const enabled = Boolean(msg.enabled);
        coordinator.inputManager?.setPanelNavigationEnabled?.(enabled);
    }
    /**
     * Handle terminal created message from extension
     */
    async handleTerminalCreated(msg, coordinator) {
        // 🔧 FIX: Support both msg.terminalId and msg.terminal.id formats
        // Extension sends terminal: { id, name, ... } but handler expected terminalId
        const terminal = msg.terminal;
        const terminalId = msg.terminalId || terminal?.id;
        const terminalName = msg.terminalName || terminal?.name;
        const terminalNumber = msg.terminalNumber;
        const config = msg.config;
        const isActive = terminal?.isActive ?? false;
        if (terminalId && terminalName) {
            this.logger.info(`🔍 TERMINAL_CREATED message received: ${terminalId} (${terminalName}) #${terminalNumber || 'unknown'}${isActive ? ' [ACTIVE]' : ''}`);
            this.logger.info(`🔍 Current terminal count before creation: ${coordinator.getAllTerminalInstances().size}`);
            const displayModeOverride = config
                ?.displayModeOverride;
            if (displayModeOverride === 'normal') {
                if ('setForceNormalModeForNextCreate' in coordinator) {
                    coordinator.setForceNormalModeForNextCreate(true);
                }
                coordinator.getDisplayModeManager?.()?.setDisplayMode('normal');
            }
            else if (displayModeOverride === 'fullscreen') {
                if ('setForceFullscreenModeForNextCreate' in coordinator) {
                    coordinator.setForceFullscreenModeForNextCreate(true);
                }
            }
            // 🔧 FIX: Include isActive in config so container is created with correct initial styling
            const indicatorColor = terminal?.indicatorColor;
            const configWithActive = config
                ? { ...config, isActive, ...(indicatorColor ? { indicatorColor } : {}) }
                : { isActive, ...(indicatorColor ? { indicatorColor } : {}) };
            const result = await coordinator.createTerminal(terminalId, terminalName, configWithActive, terminalNumber, 'extension');
            this.logger.info(`🔍 Terminal creation result: ${result ? 'SUCCESS' : 'FAILED'}`);
            this.logger.info(`🔍 Current terminal count after creation: ${coordinator.getAllTerminalInstances().size}`);
            this.logger.debug('createTerminal result', {
                terminalId,
                terminalName,
                terminalNumber,
                success: !!result,
                isActive,
                existingTerminals: Array.from(coordinator.getAllTerminalInstances().keys()),
            });
            this.outputGates.set(terminalId, { enabled: false, buffer: [] });
            if (result) {
                this.scheduleInitializationAck(terminalId, coordinator);
                // 🎯 FIX: Activate terminal if Extension marked it as active
                if (isActive) {
                    this.logger.info(`🎯 Activating terminal as requested by Extension: ${terminalId}`);
                    coordinator.setActiveTerminalId(terminalId);
                }
                if (displayModeOverride === 'fullscreen') {
                    // Ensure the new terminal is active before switching to fullscreen
                    coordinator.setActiveTerminalId(terminalId);
                    const displayModeManager = coordinator.getDisplayModeManager?.();
                    // 🔧 CRITICAL FIX: Increase delay to ensure DOM operations complete
                    // The createTerminal() has internal setTimeout(150) that was overriding fullscreen
                    // Use 200ms to ensure fullscreen is applied AFTER all createTerminal() side effects
                    setTimeout(() => {
                        this.logger.info(`🔍 [FULLSCREEN-DEBUG] Applying fullscreen for ${terminalId} after delay`);
                        displayModeManager?.showTerminalFullscreen?.(terminalId);
                    }, 200);
                }
            }
            else {
                this.logger.warn(`⚠️ [HANDSHAKE] Terminal ${terminalId} creation reported failure; skipping initialization ack`);
            }
        }
        else {
            this.logger.error('Invalid terminalCreated message', {
                hasTerminalId: !!terminalId,
                hasTerminalName: !!terminalName,
                hasTerminalNumber: !!terminalNumber,
                hasConfig: !!config,
            });
        }
    }
    /**
     * Handle new terminal creation request
     */
    handleNewTerminal(msg, coordinator) {
        const terminalId = msg.terminalId;
        const terminalName = msg.terminalName;
        const config = msg.config;
        if (terminalId && terminalName) {
            this.logger.info(`New terminal request: ${terminalId} (${terminalName})`);
            this.emitTerminalInteractionEvent('new-terminal', terminalId, { terminalName, config }, coordinator);
        }
    }
    /**
     * Handle focus terminal request
     */
    handleFocusTerminal(msg, coordinator) {
        const terminalId = msg.terminalId;
        if (terminalId) {
            coordinator.ensureTerminalFocus(terminalId);
            this.logger.info(`Terminal focused: ${terminalId}`);
        }
    }
    /**
     * Handle terminal removed message from extension
     */
    async handleTerminalRemoved(msg, coordinator) {
        const terminalId = msg.terminalId;
        if (terminalId) {
            this.logger.info(`Terminal removed from extension: ${terminalId}`);
            // ✅ await で削除完了を待つ
            await this.handleTerminalRemovedFromExtension(terminalId, coordinator);
            this.outputGates.delete(terminalId);
            this.clearProcessingTimer(terminalId);
            this.setProcessingIndicator(terminalId, false, coordinator);
            this.clearAckTracker(terminalId);
            this.logger.info(`✅ Cleanup completed for ${terminalId}`);
        }
    }
    /**
     * Handle terminal removed from extension - clean up UI
     */
    async handleTerminalRemovedFromExtension(terminalId, coordinator) {
        this.logger.info(`Handling terminal removal from extension: ${terminalId}`);
        if ('handleTerminalRemovedFromExtension' in coordinator &&
            typeof coordinator.handleTerminalRemovedFromExtension === 'function') {
            // ✅ await して完了を待つ
            await coordinator.handleTerminalRemovedFromExtension(terminalId);
            this.logger.info(`✅ Terminal removal completed: ${terminalId}`);
        }
        else {
            this.logger.warn('handleTerminalRemovedFromExtension method not found on coordinator');
        }
    }
    /**
     * Handle set restoring session flag
     */
    handleSetRestoringSession(msg, coordinator) {
        const isRestoring = msg.isRestoring || false;
        if (typeof coordinator.setRestoringSession === 'function') {
            coordinator.setRestoringSession(isRestoring);
            this.logger.info(`🔄 [SESSION-RESTORE] isRestoringSession flag set to: ${isRestoring}`);
        }
    }
    /**
     * Handle clear terminal request
     */
    handleClearTerminal(msg, coordinator) {
        // 🎯 FIX: Block terminal clear during session restore
        if (typeof coordinator.isRestoringSession === 'function' && coordinator.isRestoringSession()) {
            const terminalId = msg.terminalId;
            this.logger.warn(`⚠️ [SESSION-RESTORE] Terminal clear blocked during restore: ${terminalId || 'all'}`);
            return;
        }
        const terminalId = msg.terminalId;
        if (terminalId) {
            const terminal = coordinator.getTerminalInstance(terminalId);
            if (terminal) {
                terminal.terminal.clear();
                this.logger.info(`Terminal cleared: ${terminalId}`);
            }
        }
    }
    /**
     * Handle set active terminal request
     */
    handleSetActiveTerminal(msg, coordinator) {
        const terminalId = msg.terminalId;
        if (!terminalId) {
            this.logger.error('No terminalId provided for setActiveTerminal');
            return;
        }
        this.logger.info(`🔥 [RESTORE-DEBUG] Setting active terminal: ${terminalId}`);
        try {
            coordinator.setActiveTerminalId(terminalId);
            this.logger.info(`✅ [RESTORE-DEBUG] Active terminal set successfully: ${terminalId}`);
        }
        catch (error) {
            this.logger.error(`❌ [RESTORE-DEBUG] Failed to set active terminal ${terminalId}:`, error);
        }
    }
    /**
     * Handle delete terminal response from extension
     */
    handleDeleteTerminalResponse(msg, coordinator) {
        const terminalId = msg.terminalId;
        const success = msg.success;
        const reason = msg.reason;
        this.logger.info(`Delete terminal response: ${terminalId}, success: ${success}, reason: ${reason || 'none'}`);
        if (!success) {
            // Delete failed - restore terminal in WebView if it was removed prematurely
            this.logger.warn(`Terminal deletion failed: ${reason}`);
            // Clear deletion tracking since operation failed
            if ('clearTerminalDeletionTracking' in coordinator &&
                typeof coordinator.clearTerminalDeletionTracking === 'function') {
                coordinator.clearTerminalDeletionTracking(terminalId);
            }
            // Show user notification
            if (coordinator.getManagers && coordinator.getManagers().notification) {
                const notificationManager = coordinator.getManagers().notification;
                if ((0, type_guards_1.hasProperty)(notificationManager, 'showWarning', (value) => typeof value === 'function')) {
                    notificationManager.showWarning(reason || 'Terminal deletion failed');
                }
            }
        }
        else {
            // Delete succeeded - terminal should already be removed from WebView via terminalRemoved message
            this.logger.info(`Terminal deletion confirmed by Extension: ${terminalId}`);
            // 🔧 FIX: Do NOT call removeTerminal here - terminalRemoved message already handles removal
            // Calling removeTerminal here caused duplicate tab removal and state inconsistency
            // Just clear deletion tracking to allow future operations
            if ('clearTerminalDeletionTracking' in coordinator &&
                typeof coordinator.clearTerminalDeletionTracking === 'function') {
                coordinator.clearTerminalDeletionTracking(terminalId);
                this.logger.info(`🔧 Cleared deletion tracking for: ${terminalId}`);
            }
        }
    }
    /**
     * Handle output message from extension with robust validation
     */
    handleOutput(msg, coordinator) {
        const data = msg.data;
        const terminalId = msg.terminalId;
        // Critical validation for output message handling
        if (!data || !terminalId) {
            this.logger.error('Invalid output message - missing data or terminalId', {
                hasData: !!data,
                hasTerminalId: !!terminalId,
                terminalId: terminalId,
            });
            return;
        }
        if (typeof terminalId !== 'string' || terminalId.trim() === '') {
            this.logger.error('Invalid terminalId format', terminalId);
            return;
        }
        this.logger.debug(`[OUTPUT-DEBUG] Received output for ${terminalId}: length=${data.length}`);
        const gate = this.ensureOutputGate(terminalId);
        this.markTerminalProcessing(terminalId, coordinator);
        if (!gate.enabled) {
            gate.buffer.push(data);
            this.logger.info(`⏸️ [OUTPUT-GATE] Buffering output for ${terminalId} (chunks=${gate.buffer.length}, length=${data.length})`);
            return;
        }
        this.writeOutputToTerminal(terminalId, data, coordinator);
    }
    handleStartOutput(msg, coordinator) {
        const terminalId = msg.terminalId;
        if (!terminalId) {
            this.logger.warn('startOutput message missing terminalId');
            return;
        }
        this.markAckReceived(terminalId);
        const gate = this.ensureOutputGate(terminalId);
        if (gate.enabled) {
            this.logger.info(`⏭️ [OUTPUT-GATE] startOutput already processed for ${terminalId}`);
            return;
        }
        gate.enabled = true;
        this.logger.info(`▶️ [OUTPUT-GATE] Output enabled for ${terminalId}, flushing ${gate.buffer.length} buffered chunks`);
        while (gate.buffer.length > 0) {
            const chunk = gate.buffer.shift();
            if (chunk) {
                this.writeOutputToTerminal(terminalId, chunk, coordinator);
            }
        }
    }
    scheduleInitializationAck(terminalId, coordinator) {
        this.clearAckTracker(terminalId);
        const tracker = {
            attempt: 0,
            acked: false,
            delay: TerminalLifecycleMessageHandler.ACK_INITIAL_DELAY_MS,
        };
        this.initAckTrackers.set(terminalId, tracker);
        this.dispatchInitializationComplete(terminalId, coordinator, tracker);
    }
    dispatchInitializationComplete(terminalId, coordinator, tracker) {
        tracker.attempt += 1;
        this.logger.info(`📡 [HANDSHAKE] Sending terminalInitializationComplete for ${terminalId} (attempt #${tracker.attempt})`);
        coordinator.postMessageToExtension({
            command: 'terminalInitializationComplete',
            terminalId,
            timestamp: Date.now(),
            attempt: tracker.attempt,
        });
        tracker.timer = setTimeout(() => {
            if (tracker.acked) {
                return;
            }
            if (tracker.attempt >= TerminalLifecycleMessageHandler.ACK_MAX_ATTEMPTS) {
                this.logger.error(`❌ [HANDSHAKE] startOutput ack not received for ${terminalId} after ${tracker.attempt} attempts`);
                this.initAckTrackers.delete(terminalId);
                return;
            }
            tracker.delay *= 2;
            this.logger.warn(`⏳ [HANDSHAKE] No startOutput ack yet for ${terminalId}. Retrying in ${tracker.delay}ms`);
            this.dispatchInitializationComplete(terminalId, coordinator, tracker);
        }, tracker.delay);
    }
    markAckReceived(terminalId) {
        const tracker = this.initAckTrackers.get(terminalId);
        if (!tracker) {
            this.logger.info(`📨 [HANDSHAKE] startOutput ack received for ${terminalId} (no tracker)`);
            return;
        }
        tracker.acked = true;
        if (tracker.timer) {
            clearTimeout(tracker.timer);
            tracker.timer = undefined;
        }
        this.logger.info(`📨 [HANDSHAKE] startOutput ack received for ${terminalId} (attempt #${tracker.attempt})`);
        this.initAckTrackers.delete(terminalId);
    }
    clearAckTracker(terminalId) {
        const tracker = this.initAckTrackers.get(terminalId);
        if (!tracker) {
            return;
        }
        if (tracker.timer) {
            clearTimeout(tracker.timer);
        }
        this.initAckTrackers.delete(terminalId);
    }
    markTerminalProcessing(terminalId, coordinator) {
        if (!this.canShowProcessingIndicator(terminalId, coordinator)) {
            this.clearProcessingTimer(terminalId);
            this.setProcessingIndicator(terminalId, false, coordinator);
            return;
        }
        this.setProcessingIndicator(terminalId, true, coordinator);
        this.clearProcessingTimer(terminalId);
        const timer = setTimeout(() => {
            this.processingTimers.delete(terminalId);
            this.setProcessingIndicator(terminalId, false, coordinator);
        }, TerminalLifecycleMessageHandler.PROCESSING_IDLE_TIMEOUT_MS);
        this.processingTimers.set(terminalId, timer);
    }
    clearProcessingTimer(terminalId) {
        const timer = this.processingTimers.get(terminalId);
        if (!timer) {
            return;
        }
        clearTimeout(timer);
        this.processingTimers.delete(terminalId);
    }
    setProcessingIndicator(terminalId, isProcessing, coordinator) {
        if (isProcessing && !this.canShowProcessingIndicator(terminalId, coordinator)) {
            return;
        }
        const managers = coordinator.getManagers?.();
        const uiManager = managers?.ui;
        uiManager?.setTerminalProcessingIndicator?.(terminalId, isProcessing);
    }
    isHeaderEnhancementsEnabled(coordinator) {
        const managers = coordinator.getManagers?.();
        const configManager = managers?.config;
        const settings = configManager?.getCurrentSettings?.();
        return settings?.enableTerminalHeaderEnhancements !== false;
    }
    canShowProcessingIndicator(terminalId, coordinator) {
        if (!this.isHeaderEnhancementsEnabled(coordinator)) {
            return false;
        }
        const state = coordinator.getCliAgentState?.(terminalId);
        if (!state || state.status === 'none') {
            return false;
        }
        const agentType = state.agentType?.toLowerCase() || '';
        return TerminalLifecycleMessageHandler.SUPPORTED_AGENT_TYPES.has(agentType);
    }
    ensureOutputGate(terminalId) {
        let gate = this.outputGates.get(terminalId);
        if (!gate) {
            gate = { enabled: false, buffer: [] };
            this.outputGates.set(terminalId, gate);
        }
        return gate;
    }
    writeOutputToTerminal(terminalId, data, coordinator) {
        const terminal = coordinator.getTerminalInstance(terminalId);
        if (!terminal) {
            this.logger.error(`Output for non-existent terminal: ${terminalId}`, {
                availableTerminals: Array.from(coordinator.getAllTerminalInstances().keys()),
            });
            return;
        }
        // 🔒 Block ALL PTY output during restoration protection period
        // Shell initialization sends prompts, clear sequences, etc. that would overwrite restored scrollback
        // Instead of filtering specific sequences, we discard ALL output during the 5-second protection window
        if (TerminalCreationService_1.TerminalCreationService.isTerminalRestoring(terminalId)) {
            this.logger.debug(`[OUTPUT-BLOCK] ⏭️ Blocking ALL output during restoration: ${terminalId}, length=${data.length}`);
            this.logger.info(`🛡️ [OUTPUT-BLOCK] Blocking output during restoration for: ${terminalId} (${data.length} chars)`);
            return; // Discard all PTY output during restoration protection period
        }
        if (data.length > 2000 &&
            (data.includes('Gemini') || data.includes('gemini') || data.includes('Claude'))) {
            this.logger.info(`CLI Agent output detected for terminal ${terminal.name}`, {
                terminalId,
                terminalName: terminal.name,
                dataLength: data.length,
                containsGeminiPattern: data.includes('Gemini') || data.includes('gemini'),
                containsClaudePattern: data.includes('Claude') || data.includes('claude'),
            });
        }
        try {
            const managers = coordinator.getManagers();
            if (managers && managers.performance) {
                managers.performance.bufferedWrite(data, terminal.terminal, terminalId);
                this.logger.debug(`Output buffered via PerformanceManager for ${terminal.name}: ${data.length} chars`);
            }
            else {
                // Handle DSR query before direct write (fallback path)
                // DSR is normally handled by PerformanceManager, but we need to handle it here too
                // Wrapped in try-catch to ensure DSR handling errors don't break output
                try {
                    this.handleDSRQueryFallback(data, terminal.terminal, terminalId, coordinator);
                }
                catch (error) {
                    this.logger.warn('Error handling DSR query fallback', error);
                }
                terminal.terminal.write(data);
                this.logger.debug(`Output written directly to ${terminal.name}: ${data.length} chars`);
            }
        }
        catch (error) {
            this.logger.error(`Error writing output to terminal ${terminal.name}`, error);
        }
    }
    /**
     * Handle DSR (Device Status Report) escape sequence in fallback path
     *
     * When CLI tools send \x1b[6n to query cursor position,
     * we respond with \x1b[row;colR format.
     *
     * This is a fallback for when PerformanceManager is not available.
     * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/341
     */
    handleDSRQueryFallback(data, terminal, terminalId, coordinator) {
        // DSR pattern: \x1b[6n
        if (!data.includes('\x1b[6n')) {
            return;
        }
        // Defensive check: ensure terminal buffer is available
        if (!terminal?.buffer?.active) {
            this.logger.warn('DSR query detected but terminal buffer not available');
            return;
        }
        // Get cursor position from xterm.js buffer
        // Note: cursorY is 0-based but DSR response expects 1-based row number
        const buffer = terminal.buffer.active;
        const row = (buffer.cursorY ?? 0) + 1; // Convert to 1-based
        const col = (buffer.cursorX ?? 0) + 1; // Convert to 1-based
        // Send DSR response back to PTY via input channel
        // Format: \x1b[row;colR (e.g., \x1b[1;1R for row 1, column 1)
        const response = `\x1b[${row};${col}R`;
        this.logger.info(`DSR query detected (fallback), responding: row=${row}, col=${col}`);
        coordinator.postMessageToExtension({
            command: 'input',
            terminalId,
            data: response,
            timestamp: Date.now(),
        });
    }
    /**
     * Emit terminal interaction event
     */
    emitTerminalInteractionEvent(eventType, terminalId, data, coordinator) {
        if ('emitTerminalInteractionEvent' in coordinator &&
            typeof coordinator.emitTerminalInteractionEvent === 'function') {
            coordinator.emitTerminalInteractionEvent(eventType, terminalId, data);
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        // Clear all pending ack trackers
        for (const tracker of this.initAckTrackers.values()) {
            if (tracker.timer) {
                clearTimeout(tracker.timer);
            }
        }
        this.initAckTrackers.clear();
        // Clear output gates
        this.outputGates.clear();
        // Clear processing timers
        for (const timer of this.processingTimers.values()) {
            clearTimeout(timer);
        }
        this.processingTimers.clear();
        // Clear handler registry
        this.handlers.clear();
    }
}
exports.TerminalLifecycleMessageHandler = TerminalLifecycleMessageHandler;
TerminalLifecycleMessageHandler.ACK_INITIAL_DELAY_MS = 200;
TerminalLifecycleMessageHandler.ACK_MAX_ATTEMPTS = 4;
TerminalLifecycleMessageHandler.PROCESSING_IDLE_TIMEOUT_MS = 1000;
TerminalLifecycleMessageHandler.SUPPORTED_AGENT_TYPES = new Set([
    'claude',
    'gemini',
    'codex',
    'copilot',
    'opencode',
]);
//# sourceMappingURL=TerminalLifecycleMessageHandler.js.map