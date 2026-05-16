"use strict";
/**
 * Input Manager - Handles keyboard shortcuts, IME composition, Alt+Click interactions, and mouse events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputManager = void 0;
const BaseManager_1 = require("./BaseManager");
const EventHandlerRegistry_1 = require("../utils/EventHandlerRegistry");
// import { inputLogger } from '../utils/ManagerLogger';
const IMEHandler_1 = require("./input/handlers/IMEHandler");
const InputStateManager_1 = require("./input/services/InputStateManager");
const InputEventService_1 = require("./input/services/InputEventService");
const KeybindingService_1 = require("./input/services/KeybindingService");
const TerminalOperationsService_1 = require("./input/services/TerminalOperationsService");
const VSCodeCommandDispatcher_1 = require("./input/handlers/VSCodeCommandDispatcher");
const AltClickCoordinator_1 = require("./input/handlers/AltClickCoordinator");
const InputFlushingService_1 = require("./input/services/InputFlushingService");
const PanelNavigationHandler_1 = require("./input/handlers/PanelNavigationHandler");
const TerminalClipboardHandler_1 = require("./input/handlers/TerminalClipboardHandler");
const KeyboardShortcutSetupHandler_1 = require("./input/handlers/KeyboardShortcutSetupHandler");
const SpecialKeysHandler_1 = require("./input/handlers/SpecialKeysHandler");
/**
 * Timing constants for input handling
 */
const InputTimings = {
    /** Debounce delay for input events (ms) */
    INPUT_DEBOUNCE_DELAY_MS: 50,
};
class InputManager extends BaseManager_1.BaseManager {
    constructor(coordinator) {
        super('InputManager', {
            enableLogging: true,
            enableValidation: true,
            enableErrorRecovery: true,
        });
        // Event handler registry for centralized event management
        this.eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Debounce timers for events
        this.eventDebounceTimers = new Map();
        // Terminal-specific disposables for xterm.js events (memory leak prevention)
        this.terminalDisposables = new Map();
        this.coordinator = coordinator;
        // Initialize new architecture services
        this.stateManager = new InputStateManager_1.InputStateManager((message) => this.logger(message));
        this.eventService = new InputEventService_1.InputEventService((message) => this.logger(message));
        this.keybindingService = new KeybindingService_1.KeybindingService((message) => this.logger(message));
        this.terminalOperationsService = new TerminalOperationsService_1.TerminalOperationsService((message) => this.logger(message), (type, terminalId, data, manager) => this.emitTerminalInteractionEvent(type, terminalId, data, manager));
        // Initialize TerminalClipboardHandler
        this.terminalClipboardHandler = new TerminalClipboardHandler_1.TerminalClipboardHandler({
            logger: (message) => this.logger(message),
            terminalOperationsService: this.terminalOperationsService,
        });
        // Initialize VSCodeCommandDispatcher
        this.vsCodeCommandDispatcher = new VSCodeCommandDispatcher_1.VSCodeCommandDispatcher({
            logger: (message) => this.logger(message),
            emitTerminalInteractionEvent: (type, terminalId, data, manager) => this.emitTerminalInteractionEvent(type, terminalId, data, manager),
            terminalOperationsService: this.terminalOperationsService,
            handleTerminalCopy: (manager) => this.terminalClipboardHandler.handleTerminalCopy(manager),
            handleTerminalPaste: (manager) => this.terminalClipboardHandler.handleTerminalPaste(manager),
            handleTerminalSelectAll: (manager) => this.terminalClipboardHandler.handleTerminalSelectAll(manager),
            handleTerminalFind: (manager) => this.terminalClipboardHandler.handleTerminalFind(manager),
            handleTerminalFindNext: (manager) => this.terminalClipboardHandler.handleTerminalFindNext(manager),
            handleTerminalFindPrevious: (manager) => this.terminalClipboardHandler.handleTerminalFindPrevious(manager),
            handleTerminalHideFind: (manager) => this.terminalClipboardHandler.handleTerminalHideFind(manager),
            handleTerminalClear: (manager) => this.terminalClipboardHandler.handleTerminalClear(manager),
        });
        // Initialize InputFlushingService
        this.inputFlushingService = new InputFlushingService_1.InputFlushingService({
            logger: (message) => this.logger(message),
            sendInput: (data, terminalId) => {
                const messageManager = this.coordinator.getMessageManager?.();
                if (messageManager && typeof messageManager.sendInput === 'function') {
                    messageManager.sendInput(data, terminalId);
                    return;
                }
                this.coordinator.postMessageToExtension({
                    command: 'input',
                    terminalId,
                    data,
                    timestamp: Date.now(),
                });
            },
        });
        // Initialize AltClickCoordinator
        this.altClickCoordinator = new AltClickCoordinator_1.AltClickCoordinator({
            logger: (message) => this.logger(message),
            eventRegistry: this.eventRegistry,
            stateManager: this.stateManager,
        });
        // Initialize PanelNavigationHandler
        this.panelNavigationHandler = new PanelNavigationHandler_1.PanelNavigationHandler({
            logger: (message) => this.logger(message),
            getActiveTerminalId: () => this.coordinator.getActiveTerminalId?.() || null,
            emitTerminalInteractionEvent: (type, terminalId, data) => this.emitTerminalInteractionEvent(type, terminalId, data, this.coordinator),
        });
        // Initialize SpecialKeysHandler
        this.specialKeysHandler = new SpecialKeysHandler_1.SpecialKeysHandler({
            logger: (message) => this.logger(message),
            isIMEComposing: () => this.imeHandler.isIMEComposing(),
            handleTerminalCopy: (manager) => this.terminalClipboardHandler.handleTerminalCopy(manager),
            handleTerminalPaste: (manager) => this.terminalClipboardHandler.handleTerminalPaste(manager),
            emitTerminalInteractionEvent: (type, terminalId, data, manager) => this.emitTerminalInteractionEvent(type, terminalId, data, manager),
            queueInputData: (terminalId, data, flushImmediately) => this.queueInputData(terminalId, data, flushImmediately),
            getTerminalInstance: (terminalId) => {
                // This will be called with manager context; use coordinator
                return this.coordinator.getTerminalInstance?.(terminalId);
            },
        });
        // Initialize KeyboardShortcutSetupHandler
        this.keyboardShortcutSetupHandler = new KeyboardShortcutSetupHandler_1.KeyboardShortcutSetupHandler({
            logger: (message) => this.logger(message),
            eventRegistry: this.eventRegistry,
            isIMEComposing: () => this.imeHandler.isIMEComposing(),
            resolveKeybinding: (event) => this.resolveKeybinding(event),
            shouldSkipShell: (event, resolvedCommand) => this.shouldSkipShell(event, resolvedCommand),
            handleVSCodeCommand: (command, manager) => this.handleVSCodeCommand(command, manager),
            handlePanelNavigationKey: (event) => this.panelNavigationHandler.handlePanelNavigationKey(event),
            handleSpecialKeys: (event, terminalId, manager) => this.handleSpecialKeys(event, terminalId, manager),
            getActiveTerminalId: () => this.coordinator.getActiveTerminalId?.() || null,
        });
        // Initialize IME handler with new architecture
        this.imeHandler = new IMEHandler_1.IMEHandler(this.eventDebounceTimers, this.stateManager, this.eventService);
        this.logger('initialization', 'starting');
    }
    /**
     * Set the notification manager for Alt+Click feedback
     */
    setNotificationManager(notificationManager) {
        this.altClickCoordinator.setNotificationManager(notificationManager);
    }
    /**
     * Update VS Code keybinding system settings
     * Delegates to KeybindingService for settings management
     */
    updateKeybindingSettings(settings) {
        this.keybindingService.updateSettings(settings);
    }
    /**
     * VS Code keybinding resolution system - determines if keybinding should be handled by VS Code or shell
     * Delegates to KeybindingService
     */
    shouldSkipShell(event, resolvedCommand) {
        return this.keybindingService.shouldSkipShell(event, resolvedCommand);
    }
    /**
     * Resolve keyboard event to VS Code command
     * Delegates to KeybindingService
     */
    resolveKeybinding(event) {
        return this.keybindingService.resolveKeybinding(event);
    }
    /**
     * Setup IME composition handling with improved processing
     */
    setupIMEHandling() {
        // Delegate to IME handler
        this.imeHandler.initialize();
    }
    /**
     * Clear any pending input events that might conflict with IME
     */
    clearPendingInputEvents() {
        // Delegate to IME handler
        this.imeHandler.clearPendingInputEvents();
    }
    /**
     * Setup Alt key visual feedback for terminals
     * Delegates to AltClickCoordinator
     */
    setupAltKeyVisualFeedback() {
        this.altClickCoordinator.setupAltKeyVisualFeedback();
    }
    /**
     * Setup keyboard shortcuts for terminal navigation with VS Code keybinding system
     * Delegates to KeyboardShortcutSetupHandler
     */
    setupKeyboardShortcuts(manager) {
        this.keyboardShortcutSetupHandler.setupKeyboardShortcuts(manager);
    }
    /**
     * Handle VS Code commands resolved from keybindings
     * Delegates to VSCodeCommandDispatcher
     */
    handleVSCodeCommand(command, manager) {
        this.vsCodeCommandDispatcher.handleVSCodeCommand(command, manager);
    }
    /**
     * Handle legacy shortcuts for backward compatibility
     * Delegates to KeyboardShortcutSetupHandler
     */
    handleLegacyShortcuts(event, manager) {
        this.keyboardShortcutSetupHandler.handleLegacyShortcuts(event, manager);
    }
    /**
     * Add complete input handling to xterm.js terminal (click, keyboard, focus)
     * Enhanced with VS Code standard IME handling pattern
     */
    addXtermClickHandler(terminal, terminalId, container, manager) {
        this.logger(`Setting up VS Code standard input handling for terminal ${terminalId}`);
        // Clean up any existing handlers if this terminal is re-initialized
        this.removeTerminalHandlers(terminalId);
        const disposables = [];
        // CRITICAL: Set up keyboard input handling with IME awareness
        // Use onKey for regular keyboard input (non-IME)
        const onKeyDisposable = terminal.onKey((event) => {
            // VS Code standard: Check IME composition state before processing
            if (this.imeHandler.isIMEComposing()) {
                this.logger(`Terminal ${terminalId} key during IME composition - allowing xterm.js to handle`);
                // Let xterm.js handle IME composition internally
                // Don't send to extension during composition to avoid duplicate input
                return;
            }
            // Send only user keyboard input to extension (not PTY echo)
            this.logger(`Terminal ${terminalId} user input: ${event.key.length} chars`);
            const needsImmediateFlush = this.shouldFlushImmediately(event.key, event.domEvent);
            this.queueInputData(terminalId, event.key, needsImmediateFlush);
        });
        disposables.push(onKeyDisposable);
        // Handle mouse tracking escape sequences from TUI apps
        // onKey handles keyboard input; onData forwards mouse sequences to PTY
        const onDataDisposable = terminal.onData((data) => {
            const isMouseTracking = data.startsWith('\x1b[<') || data.startsWith('\x1b[M');
            if (isMouseTracking) {
                this.logger(`Terminal ${terminalId} mouse tracking: ${data.length} bytes`);
                this.queueInputData(terminalId, data, true);
                return;
            }
            // Ignore regular keyboard input - handled by onKey
        });
        disposables.push(onDataDisposable);
        // CRITICAL: Add compositionend listener for IME final text
        // This is the most reliable way to capture Japanese/Chinese/Korean input
        // The compositionend event fires with the final composed text
        const compositionEndHandler = (event) => {
            const finalText = event.data;
            if (finalText) {
                this.logger(`Terminal ${terminalId} IME compositionend - final text: "${finalText}"`);
                this.queueInputData(terminalId, finalText, true);
            }
        };
        container.addEventListener('compositionend', compositionEndHandler);
        // Wrap in disposable for cleanup
        const compositionEndDisposable = {
            dispose: () => {
                container.removeEventListener('compositionend', compositionEndHandler);
            },
        };
        disposables.push(compositionEndDisposable);
        // Save disposables for terminal-specific cleanup
        this.terminalDisposables.set(terminalId, disposables);
        // Focus/blur handling via DOM events on the terminal container
        // Sends terminalFocused/terminalBlurred messages to extension for context key management
        const focusInHandler = () => {
            this.logger(`Terminal ${terminalId} focused (focusin)`);
            manager.postMessageToExtension({
                command: 'terminalFocused',
                terminalId,
                timestamp: Date.now(),
            });
        };
        const focusOutHandler = (event) => {
            // Only send blur if focus moves outside this terminal container
            if (!container.contains(event.relatedTarget)) {
                this.logger(`Terminal ${terminalId} blurred (focusout)`);
                manager.postMessageToExtension({
                    command: 'terminalBlurred',
                    terminalId,
                    timestamp: Date.now(),
                });
            }
        };
        container.addEventListener('focusin', focusInHandler);
        container.addEventListener('focusout', focusOutHandler);
        disposables.push({
            dispose: () => {
                container.removeEventListener('focusin', focusInHandler);
                container.removeEventListener('focusout', focusOutHandler);
            },
        });
        const shouldIgnoreActivationTarget = (event) => {
            const target = event.target;
            return Boolean(target?.closest('.terminal-control') || target?.closest('.terminal-header'));
        };
        const pointerDownHandler = (event) => {
            if (shouldIgnoreActivationTarget(event)) {
                return;
            }
            if (event.button !== 0) {
                return;
            }
            // Ensure activation even when click is suppressed by canvas/selection behavior
            manager.setActiveTerminalId(terminalId);
            terminal.focus();
        };
        const clickHandler = (event) => {
            if (shouldIgnoreActivationTarget(event)) {
                return;
            }
            // Regular click: Focus terminal
            if (!event.altKey) {
                this.logger(`Regular click on terminal ${terminalId}`);
                manager.setActiveTerminalId(terminalId);
                terminal.focus(); // Ensure terminal gets focus for keyboard input
                this.emitTerminalInteractionEvent('focus', terminalId, undefined, manager);
                return;
            }
            // Alt+Click handling - delegate to AltClickCoordinator
            if (event.altKey &&
                this.altClickCoordinator.handleAltClick(event.clientX, event.clientY, terminalId)) {
                // Let xterm.js handle the actual cursor positioning
                // No need to prevent default - xterm.js will handle it
                this.emitTerminalInteractionEvent('alt-click', terminalId, {
                    x: event.clientX,
                    y: event.clientY,
                }, manager);
            }
        };
        // Register click handler using EventHandlerRegistry
        this.eventRegistry.register(`terminal-click-${terminalId}`, container, 'click', clickHandler, { capture: true });
        this.eventRegistry.register(`terminal-pointerdown-${terminalId}`, container, 'pointerdown', pointerDownHandler, { capture: true });
        this.logger(`Complete input handling configured for terminal ${terminalId}`);
    }
    /**
     * Update terminal cursor styles based on Alt key state
     * Delegates to AltClickCoordinator
     */
    updateTerminalCursors() {
        this.altClickCoordinator.updateTerminalCursors();
    }
    /**
     * Check if VS Code Alt+Click is enabled based on settings
     * Delegates to AltClickCoordinator
     */
    isVSCodeAltClickEnabled(settings) {
        return this.altClickCoordinator.isVSCodeAltClickEnabled(settings);
    }
    /**
     * Remove all handlers and event listeners for a specific terminal
     * This prevents memory leaks when terminals are destroyed
     */
    removeTerminalHandlers(terminalId) {
        this.logger(`Removing terminal handlers for ${terminalId}`);
        // Clear pending input buffers and timers for this terminal
        this.inputFlushingService.clearTerminalBuffer(terminalId);
        // Dispose xterm.js event subscriptions (onKey, onData, compositionend)
        const disposables = this.terminalDisposables.get(terminalId);
        if (disposables) {
            for (const disposable of disposables) {
                try {
                    disposable.dispose();
                }
                catch (error) {
                    this.logger(`Error disposing handler for terminal ${terminalId}: ${error}`);
                }
            }
            this.terminalDisposables.delete(terminalId);
        }
        // Unregister DOM event handlers
        this.eventRegistry.unregister(`terminal-click-${terminalId}`);
        this.eventRegistry.unregister(`terminal-pointerdown-${terminalId}`);
        this.logger(`Terminal handlers removed for ${terminalId}`);
    }
    /**
     * Update Alt+Click settings and state
     * Delegates to AltClickCoordinator
     */
    updateAltClickSettings(settings) {
        this.altClickCoordinator.updateAltClickSettings(settings);
    }
    /**
     * Get current Alt+Click state
     * Delegates to AltClickCoordinator
     */
    getAltClickState() {
        return this.altClickCoordinator.getAltClickState();
    }
    /**
     * Check if IME is currently composing
     */
    /**
     * Check if IME is currently composing using unified state management
     */
    isIMEComposing() {
        return this.stateManager.getStateSection('ime').isActive;
    }
    /**
     * Enable/disable agent interaction mode
     * Delegates to KeyboardShortcutSetupHandler
     */
    setAgentInteractionMode(enabled) {
        this.keyboardShortcutSetupHandler.setAgentInteractionMode(enabled);
    }
    /**
     * Check if agent interaction mode is enabled
     * Delegates to KeyboardShortcutSetupHandler
     */
    isAgentInteractionMode() {
        return this.keyboardShortcutSetupHandler.isAgentInteractionMode();
    }
    setPanelNavigationEnabled(enabled) {
        this.panelNavigationHandler.setPanelNavigationEnabled(enabled);
    }
    setPanelNavigationMode(enabled) {
        this.panelNavigationHandler.setPanelNavigationMode(enabled);
    }
    /**
     * Emit terminal interaction event with debouncing for frequent events
     */
    emitTerminalInteractionEvent(type, terminalId, data, manager) {
        try {
            // Debounce focus events to prevent spam
            if (type === 'focus') {
                // Use a generic key for focus events to debounce across all terminals
                // This ensures that rapid switching (T1 -> T2 -> T3) only sends the final focus (T3)
                const key = `${type}-event`;
                if (this.eventDebounceTimers.has(key)) {
                    clearTimeout(this.eventDebounceTimers.get(key));
                }
                const timer = setTimeout(() => {
                    manager.postMessageToExtension({
                        command: 'terminalInteraction',
                        type,
                        terminalId,
                        data,
                        timestamp: Date.now(),
                    });
                    this.eventDebounceTimers.delete(key);
                }, InputTimings.INPUT_DEBOUNCE_DELAY_MS); // Reduced from 200ms to 50ms for better responsiveness
                this.eventDebounceTimers.set(key, timer);
            }
            else {
                // Emit other events immediately
                manager.postMessageToExtension({
                    command: 'terminalInteraction',
                    type,
                    terminalId,
                    data,
                    timestamp: Date.now(),
                });
            }
        }
        catch (error) {
            this.logger(`Error emitting terminal interaction event: ${error}`);
        }
    }
    /**
     * Handle special key combinations for terminal operations with IME awareness
     * Delegates to SpecialKeysHandler
     */
    handleSpecialKeys(event, terminalId, manager) {
        return this.specialKeysHandler.handleSpecialKeys(event, terminalId, manager);
    }
    shouldFlushImmediately(data, domEvent) {
        return this.inputFlushingService.shouldFlushImmediately(data, domEvent);
    }
    /**
     * VS Code Standard: Determine if a key should be intercepted for VS Code handling
     * Delegates to VSCodeCommandDispatcher
     */
    shouldInterceptKeyForVSCode(event, terminal, manager) {
        return this.vsCodeCommandDispatcher.shouldInterceptKeyForVSCode(event, terminal, manager);
    }
    queueInputData(terminalId, data, flushImmediately) {
        this.inputFlushingService.queueInputData(terminalId, data, flushImmediately);
    }
    /**
     * Initialize the InputManager (BaseManager abstract method implementation)
     */
    doInitialize() {
        this.logger('initialization', 'starting');
        // Set up keyboard event listener for global shortcuts
        this.keyboardShortcutSetupHandler.setupGlobalKeyboardListener();
        // Set up agent arrow key handler (VS Code standard)
        this.keyboardShortcutSetupHandler.setupAgentArrowKeyHandler();
        this.logger('initialization', 'completed');
    }
    /**
     * Dispose InputManager resources (BaseManager abstract method implementation)
     */
    /**
     * Dispose InputManager resources (BaseManager abstract method implementation)
     */
    doDispose() {
        this.logger('disposal', 'starting');
        // Dispose EventHandlerRegistry - this will clean up all registered event listeners
        this.eventRegistry.dispose();
        // Clear debounce timers
        for (const timer of this.eventDebounceTimers.values()) {
            clearTimeout(timer);
        }
        this.eventDebounceTimers.clear();
        // Dispose input flushing service (clears all pending buffers and timers)
        this.inputFlushingService.dispose();
        // Dispose all terminal-specific xterm.js subscriptions
        for (const [terminalId, disposables] of this.terminalDisposables) {
            for (const disposable of disposables) {
                try {
                    disposable.dispose();
                }
                catch (error) {
                    this.logger(`Error disposing handler for terminal ${terminalId}: ${error}`);
                }
            }
        }
        this.terminalDisposables.clear();
        // Dispose AltClickCoordinator
        this.altClickCoordinator.dispose();
        // Dispose PanelNavigationHandler
        this.panelNavigationHandler.dispose();
        // Dispose KeyboardShortcutSetupHandler
        this.keyboardShortcutSetupHandler.dispose();
        // Dispose IME handler
        this.imeHandler.dispose();
        // Dispose new architecture services
        if (this.eventService) {
            this.eventService.dispose();
        }
        if (this.stateManager) {
            this.stateManager.dispose();
        }
        // Note: KeybindingService and TerminalOperationsService don't need explicit dispose
        // as they don't hold any event listeners or timers
        this.logger('disposal', 'completed');
    }
    /**
     * Dispose of all event listeners and cleanup resources
     */
    dispose() {
        this.logger('Disposing input manager');
        // Call parent dispose which will call doDispose()
        super.dispose();
        this.logger('InputManager', 'completed');
    }
}
exports.InputManager = InputManager;
//# sourceMappingURL=InputManager.js.map