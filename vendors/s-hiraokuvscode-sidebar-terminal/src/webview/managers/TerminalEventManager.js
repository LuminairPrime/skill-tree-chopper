"use strict";
/**
 * Terminal Event Manager
 *
 * Extracted from TerminalLifecycleCoordinator to centralize event handling.
 *
 * Responsibilities:
 * - Terminal click event handling for activation
 * - Focus management and optimization
 * - Mouse and keyboard event coordination
 * - Event handler registration and cleanup
 *
 * Extended BaseManager for consistent lifecycle management (Issue #216)
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/split-lifecycle-manager/spec.md
 * @see docs/refactoring/issue-216-manager-standardization.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalEventManager = void 0;
const ManagerLogger_1 = require("../utils/ManagerLogger");
const BaseManager_1 = require("./BaseManager");
/**
 * Service responsible for managing terminal events
 * Uses constructor injection pattern for dependencies
 */
class TerminalEventManager extends BaseManager_1.BaseManager {
    constructor(coordinator, eventRegistry) {
        super('TerminalEventManager', {
            enableLogging: false, // Use terminalLogger instead
            enablePerformanceTracking: true,
            enableErrorRecovery: true,
        });
        this.disposables = [];
        this.coordinator = coordinator;
        this.eventRegistry = eventRegistry;
    }
    /**
     * Initialize manager
     */
    doInitialize() {
        this.logger('TerminalEventManager initialized');
        ManagerLogger_1.terminalLogger.info('✅ TerminalEventManager ready');
    }
    /**
     * Setup all event handlers for a terminal
     */
    setupTerminalEvents(terminal, terminalId, container) {
        if (this.shouldUseLegacyInputHandler()) {
            // Setup user input handler (send to Extension) when InputManager is unavailable
            this.setupInputHandler(terminal, terminalId);
        }
        else {
            ManagerLogger_1.terminalLogger.debug(`⏭️ Skipping legacy onData handler for ${terminalId}; InputManager controls keyboard input`);
        }
        // Setup click handler for terminal activation
        this.setupTerminalClickHandler(terminal, terminalId, container);
        // Setup focus optimization
        this.setupFocusOptimization(terminal, terminalId);
        ManagerLogger_1.terminalLogger.info(`✅ Event handlers setup for terminal: ${terminalId}`);
    }
    shouldUseLegacyInputHandler() {
        try {
            if (this.coordinator?.inputManager) {
                return false;
            }
            const managers = this.coordinator?.getManagers?.();
            if (managers?.input) {
                return false;
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn('⚠️ Failed to detect InputManager availability, defaulting to legacy handler', error);
        }
        return true;
    }
    /**
     * Setup input handler to send user input to Extension
     */
    setupInputHandler(terminal, terminalId) {
        try {
            ManagerLogger_1.terminalLogger.info(`🔧 Setting up input handler for ${terminalId}...`);
            const inputDisposable = terminal.onData((data) => {
                ManagerLogger_1.terminalLogger.debug(`🔍 [INPUT-DEBUG] onData fired for ${terminalId}`, {
                    dataLength: data.length,
                    timestamp: Date.now(),
                });
                // Send input to Extension
                const message = {
                    command: 'input',
                    data,
                    terminalId,
                };
                ManagerLogger_1.terminalLogger.debug(`🔍 [INPUT-DEBUG] Sending input to Extension`, {
                    terminalId,
                    dataLength: data.length,
                });
                this.coordinator?.postMessageToExtension(message);
            });
            this.disposables.push(inputDisposable);
            ManagerLogger_1.terminalLogger.debug(`🔍 [INPUT-DEBUG] Input handler registered for ${terminalId}`, {
                hasCoordinator: !!this.coordinator,
                disposableCount: this.disposables.length,
            });
            ManagerLogger_1.terminalLogger.info(`✅ Input handler enabled for terminal: ${terminalId}`);
        }
        catch (error) {
            console.error(`🔍 [INPUT-DEBUG] FAILED to setup input handler:`, error);
            ManagerLogger_1.terminalLogger.error(`Failed to setup input handler for ${terminalId}:`, error);
        }
    }
    /**
     * Setup click handler for terminal activation (VS Code standard behavior)
     */
    setupTerminalClickHandler(terminal, terminalId, container) {
        try {
            const xtermElement = container.querySelector('.xterm');
            if (!xtermElement) {
                ManagerLogger_1.terminalLogger.warn(`xterm element not found for terminal: ${terminalId}`);
                return;
            }
            // VS Code standard: Click activates terminal only if no text is selected
            const clickHandler = (_event) => {
                try {
                    if (!terminal.hasSelection()) {
                        ManagerLogger_1.terminalLogger.debug(`🎯 Terminal clicked for activation (no selection): ${terminalId}`);
                        this.coordinator?.setActiveTerminalId(terminalId);
                    }
                    else {
                        ManagerLogger_1.terminalLogger.debug(`🎯 Click ignored due to text selection in terminal: ${terminalId}`);
                    }
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn(`Failed to handle terminal click for ${terminalId}:`, error);
                }
            };
            xtermElement.addEventListener('click', clickHandler);
            this.eventRegistry.register(`terminal-${terminalId}-click`, xtermElement, 'click', clickHandler);
            ManagerLogger_1.terminalLogger.info(`✅ VS Code standard click handling enabled for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to setup click handler for ${terminalId}:`, error);
        }
    }
    /**
     * Setup focus optimization to avoid redundant focus calls
     */
    setupFocusOptimization(terminal, terminalId) {
        try {
            const textArea = terminal.textarea;
            if (!textArea) {
                ManagerLogger_1.terminalLogger.warn(`Terminal textarea not found for: ${terminalId}`);
                return;
            }
            // Track focus state to avoid redundant focus operations
            const focusHandler = () => {
                ManagerLogger_1.terminalLogger.debug(`🎯 Terminal focused: ${terminalId}`);
            };
            const blurHandler = () => {
                ManagerLogger_1.terminalLogger.debug(`🎯 Terminal blurred: ${terminalId}`);
            };
            textArea.addEventListener('focus', focusHandler);
            textArea.addEventListener('blur', blurHandler);
            this.eventRegistry.register(`terminal-${terminalId}-focus`, textArea, 'focus', focusHandler);
            this.eventRegistry.register(`terminal-${terminalId}-blur`, textArea, 'blur', blurHandler);
            ManagerLogger_1.terminalLogger.debug(`✅ Focus optimization enabled for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`Failed to setup focus optimization for ${terminalId}:`, error);
        }
    }
    /**
     * Create container event callbacks that delegate to coordinator
     */
    createContainerCallbacks(_terminalId) {
        return {
            onHeaderClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`🎯 Header clicked for terminal: ${clickedTerminalId}`);
                this.coordinator?.setActiveTerminalId(clickedTerminalId);
            },
            onContainerClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`🎯 Container clicked for terminal: ${clickedTerminalId}`);
                this.coordinator?.setActiveTerminalId(clickedTerminalId);
            },
            onCloseClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`🗑️ Header close button clicked, using safe deletion: ${clickedTerminalId}`);
                void this.coordinator.deleteTerminalSafely?.(clickedTerminalId);
            },
            onAiAgentToggleClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`📎 AI Agent toggle clicked for terminal: ${clickedTerminalId}`);
                this.coordinator.handleAiAgentToggle?.(clickedTerminalId);
            },
        };
    }
    /**
     * Focus terminal with optimization to avoid redundant calls
     */
    focusTerminal(terminal, terminalId) {
        try {
            const textArea = terminal.textarea;
            if (!textArea) {
                ManagerLogger_1.terminalLogger.warn(`Cannot focus terminal ${terminalId}: textarea not found`);
                return;
            }
            // Check if terminal actually needs focus (avoid redundant focus calls)
            const needsFocus = textArea && !textArea.hasAttribute('focused') && document.activeElement !== textArea;
            if (needsFocus) {
                // Reduced delay from 10ms to 5ms for faster response
                setTimeout(() => {
                    terminal.focus();
                    ManagerLogger_1.terminalLogger.info(`🎯 Focused xterm.js terminal: ${terminalId}`);
                }, 5);
            }
            else {
                ManagerLogger_1.terminalLogger.debug(`🎯 Terminal ${terminalId} already focused, skipping focus call`);
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to focus terminal ${terminalId}:`, error);
        }
    }
    /**
     * Blur terminal (remove focus)
     */
    blurTerminal(terminal, terminalId) {
        try {
            if (terminal.textarea) {
                terminal.textarea.blur();
                ManagerLogger_1.terminalLogger.debug(`🎯 Blurred terminal: ${terminalId}`);
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`Failed to blur terminal ${terminalId}:`, error);
        }
    }
    /**
     * Setup wheel event handling for custom scrolling behavior
     */
    setupWheelHandler(terminal, terminalId, container, onWheel) {
        try {
            const xtermElement = container.querySelector('.xterm');
            if (!xtermElement) {
                ManagerLogger_1.terminalLogger.warn(`xterm element not found for wheel handler: ${terminalId}`);
                return;
            }
            const wheelHandler = (event) => {
                try {
                    if (onWheel) {
                        onWheel(event);
                    }
                    // Default xterm.js wheel behavior is preserved
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn(`Wheel handler error for ${terminalId}:`, error);
                }
            };
            xtermElement.addEventListener('wheel', wheelHandler);
            this.eventRegistry.register(`terminal-${terminalId}-wheel`, xtermElement, 'wheel', wheelHandler);
            ManagerLogger_1.terminalLogger.debug(`✅ Wheel handler setup for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to setup wheel handler for ${terminalId}:`, error);
        }
    }
    /**
     * Setup keyboard event handling
     */
    setupKeyboardHandler(terminal, terminalId, container, onKey) {
        try {
            const keyHandler = (event) => {
                try {
                    if (onKey) {
                        onKey(event);
                    }
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn(`Keyboard handler error for ${terminalId}:`, error);
                }
            };
            const textArea = terminal.textarea;
            if (textArea) {
                textArea.addEventListener('keydown', keyHandler);
                this.eventRegistry.register(`terminal-${terminalId}-keydown`, textArea, 'keydown', keyHandler);
                ManagerLogger_1.terminalLogger.debug(`✅ Keyboard handler setup for terminal: ${terminalId}`);
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to setup keyboard handler for ${terminalId}:`, error);
        }
    }
    /**
     * Setup mouse event handling (beyond click)
     */
    setupMouseHandlers(terminal, terminalId, container, handlers) {
        try {
            const xtermElement = container.querySelector('.xterm');
            if (!xtermElement) {
                ManagerLogger_1.terminalLogger.warn(`xterm element not found for mouse handlers: ${terminalId}`);
                return;
            }
            if (handlers?.onMouseEnter) {
                const enterHandler = (event) => handlers.onMouseEnter(event);
                xtermElement.addEventListener('mouseenter', enterHandler);
                this.eventRegistry.register(`terminal-${terminalId}-mouseenter`, xtermElement, 'mouseenter', enterHandler);
            }
            if (handlers?.onMouseLeave) {
                const leaveHandler = (event) => handlers.onMouseLeave(event);
                xtermElement.addEventListener('mouseleave', leaveHandler);
                this.eventRegistry.register(`terminal-${terminalId}-mouseleave`, xtermElement, 'mouseleave', leaveHandler);
            }
            if (handlers?.onMouseMove) {
                const moveHandler = (event) => handlers.onMouseMove(event);
                xtermElement.addEventListener('mousemove', moveHandler);
                this.eventRegistry.register(`terminal-${terminalId}-mousemove`, xtermElement, 'mousemove', moveHandler);
            }
            ManagerLogger_1.terminalLogger.debug(`✅ Mouse handlers setup for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to setup mouse handlers for ${terminalId}:`, error);
        }
    }
    /**
     * Remove all event handlers for a terminal
     */
    removeTerminalEvents(terminalId) {
        try {
            // Escape regex metacharacters to prevent ReDoS attacks (CWE-1333)
            const escapedId = terminalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Unregister all listeners with terminal-specific prefix
            this.eventRegistry.unregisterByPattern(new RegExp(`^terminal-${escapedId}`));
            ManagerLogger_1.terminalLogger.info(`✅ Event handlers removed for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to remove event handlers for ${terminalId}:`, error);
        }
    }
    /**
     * Cleanup and dispose
     * Called by BaseManager.dispose() for cleanup
     */
    doDispose() {
        // Dispose all input handlers
        while (this.disposables.length > 0) {
            const disposable = this.disposables.pop();
            if (disposable) {
                try {
                    disposable.dispose();
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn('⚠️ Error disposing input handler:', error);
                }
            }
        }
        ManagerLogger_1.terminalLogger.info('🧹 TerminalEventManager disposed');
        // Event registry cleanup handled by caller
    }
}
exports.TerminalEventManager = TerminalEventManager;
//# sourceMappingURL=TerminalEventManager.js.map