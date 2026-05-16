"use strict";
/**
 * Terminal Lifecycle Manager
 *
 * Simplified terminal lifecycle management using centralized utilities
 * Responsibilities: terminal creation, deletion, switching, and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalLifecycleCoordinator = void 0;
// Services
const TerminalCreationService_1 = require("../services/TerminalCreationService");
// New utilities
const ResizeManager_1 = require("../utils/ResizeManager");
const EventHandlerRegistry_1 = require("../utils/EventHandlerRegistry");
const ManagerLogger_1 = require("../utils/ManagerLogger");
const DOMUtils_1 = require("../utils/DOMUtils");
// ============================================================================
// Configuration Constants
// ============================================================================
/**
 * Timing constants for terminal lifecycle operations
 */
const LifecycleTimings = {
    /** Delay before focusing terminal after activation (ms) - PHASE 4 optimized */
    FOCUS_DELAY_MS: 5,
    /** Debounce delay for individual terminal resize (ms) */
    RESIZE_DEBOUNCE_DELAY_MS: 100,
    /** Debounce delay for resizeAllTerminals operation (ms) */
    RESIZE_ALL_DEBOUNCE_DELAY_MS: 50,
};
/**
 * Terminal configuration defaults
 */
const TerminalDefaults = {
    /** Default terminal number when ID is undefined */
    DEFAULT_TERMINAL_NUMBER: 1,
    /** Maximum terminal number for ID extraction (1-5 range) */
    MAX_TERMINAL_NUMBER: 5,
    /** Tolerance for isAtBottom scroll position check (lines) */
    SCROLL_BOTTOM_TOLERANCE: 1,
};
/**
 * Container styling constants
 */
const ContainerStyles = {
    /** Minimum height for terminal body container (px) */
    MIN_HEIGHT_PX: 200,
    /** Padding for terminals wrapper (px) */
    WRAPPER_PADDING_PX: 4,
    /** Gap between terminals in wrapper (px) */
    WRAPPER_GAP_PX: 4,
};
/**
 * Terminal Lifecycle Coordinator
 *
 * Refactored from TerminalLifecycleCoordinator to act as a lightweight coordinator.
 * Delegates operations to specialized services while maintaining the public API.
 *
 * Services:
 * - TerminalCreationService: Terminal creation, removal, switching
 * - TerminalAddonManager: Addon loading and disposal (via TerminalCreationService)
 * - TerminalEventManager: Event handling (via TerminalCreationService)
 * - TerminalLinkManager: Link detection and handling (via TerminalCreationService)
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/split-lifecycle-manager/spec.md
 */
class TerminalLifecycleCoordinator {
    // VS Code Standard Terminal Configuration
    constructor(splitManager, coordinator) {
        this.activeTerminalId = null;
        this.terminal = null;
        this.fitAddon = null;
        this.terminalContainer = null;
        this.splitManager = splitManager;
        this.coordinator = coordinator;
        this.eventRegistry = new EventHandlerRegistry_1.EventHandlerRegistry();
        // Initialize TerminalCreationService
        this.terminalCreationService = new TerminalCreationService_1.TerminalCreationService(this.splitManager, this.coordinator, this.eventRegistry);
        ManagerLogger_1.terminalLogger.info('TerminalLifecycleCoordinator initialized with TerminalCreationService');
    }
    /**
     * Get active terminal ID
     */
    getActiveTerminalId() {
        return this.activeTerminalId;
    }
    /**
     * Set active terminal ID
     */
    setActiveTerminalId(terminalId) {
        this.activeTerminalId = terminalId;
        ManagerLogger_1.terminalLogger.info(`Active terminal set to: ${terminalId}`);
        // 🎯 PHASE 4: Optimized focus logic - only focus if truly needed
        // Avoid interrupting terminal output or initialization
        if (terminalId) {
            const terminalInstance = this.splitManager.getTerminals().get(terminalId);
            if (terminalInstance && terminalInstance.terminal) {
                const terminal = terminalInstance.terminal;
                // Check if terminal actually needs focus (avoid redundant focus calls)
                // Use hasAttribute instead of checking document.activeElement for better reliability
                const textArea = terminal.textarea;
                const needsFocus = textArea && !textArea.hasAttribute('focused') && document.activeElement !== textArea;
                if (needsFocus) {
                    // 🎯 PHASE 4: Reduced delay from 10ms to 5ms for faster response
                    setTimeout(() => {
                        terminal.focus();
                        ManagerLogger_1.terminalLogger.info(`🎯 Focused xterm.js terminal: ${terminalId}`);
                    }, LifecycleTimings.FOCUS_DELAY_MS);
                }
                else {
                    ManagerLogger_1.terminalLogger.debug(`🎯 Terminal ${terminalId} already focused, skipping focus call`);
                }
            }
        }
    }
    /**
     * Get terminal instance
     */
    getTerminalInstance(terminalId) {
        return this.splitManager.getTerminals().get(terminalId);
    }
    /**
     * Get all terminal instances
     */
    getAllTerminalInstances() {
        return this.splitManager.getTerminals();
    }
    /**
     * Get all terminal containers
     */
    getAllTerminalContainers() {
        return this.splitManager.getTerminalContainers();
    }
    /**
     * Get terminal element
     */
    getTerminalElement(terminalId) {
        const terminalInstance = this.splitManager.getTerminals().get(terminalId);
        return terminalInstance?.container;
    }
    /**
     * Create new terminal - Delegates to TerminalCreationService
     * @see TerminalCreationService.createTerminal() for implementation details
     */
    async createTerminal(terminalId, terminalName, config, terminalNumber) {
        return this.terminalCreationService.createTerminal(terminalId, terminalName, config, terminalNumber);
    }
    /**
     * Enable VS Code standard scrollbar display
     */
    /**
     * Enable VS Code standard scrollbar display with correct viewport sizing
     */
    /**
     * Handle terminal resize using ResizeManager
     */
    handleTerminalResize(terminalId, terminalInstance) {
        ResizeManager_1.ResizeManager.debounceResize(`resize-${terminalId}`, async () => {
            try {
                if (terminalInstance.fitAddon) {
                    terminalInstance.fitAddon.fit();
                    // Notify extension about new size
                    this.notifyExtensionResize(terminalId, terminalInstance.terminal);
                }
            }
            catch (error) {
                ManagerLogger_1.terminalLogger.error(`Resize failed for ${terminalId}:`, error);
            }
        }, { delay: LifecycleTimings.RESIZE_DEBOUNCE_DELAY_MS });
    }
    /**
     * Notify extension about terminal resize
     */
    notifyExtensionResize(terminalId, terminal) {
        try {
            this.coordinator.postMessageToExtension({
                command: 'resize',
                terminalId: terminalId,
                cols: terminal.cols,
                rows: terminal.rows,
            });
            ManagerLogger_1.terminalLogger.debug(`Sent resize notification: ${terminalId} (${terminal.cols}x${terminal.rows})`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to notify extension of resize for ${terminalId}:`, error);
        }
    }
    /**
     * Remove terminal - Delegates to TerminalCreationService
     * @see TerminalCreationService.removeTerminal() for implementation details
     */
    async removeTerminal(terminalId) {
        return this.terminalCreationService.removeTerminal(terminalId);
    }
    /**
     * Switch to terminal - Delegates to TerminalCreationService
     * @see TerminalCreationService.switchToTerminal() for implementation details
     */
    async switchToTerminal(terminalId) {
        return this.terminalCreationService.switchToTerminal(terminalId, this.activeTerminalId, (id) => {
            this.setActiveTerminalId(id);
            const terminalInstance = this.splitManager.getTerminals().get(id);
            if (terminalInstance) {
                this.terminal = terminalInstance.terminal;
                this.fitAddon = terminalInstance.fitAddon;
                this.terminalContainer = terminalInstance.container;
            }
        });
    }
    /**
     * Write data to terminal
     */
    writeToTerminal(data, terminalId) {
        try {
            const targetId = terminalId || this.activeTerminalId;
            if (!targetId) {
                ManagerLogger_1.terminalLogger.error('No terminal to write to');
                return false;
            }
            const terminalInstance = this.splitManager.getTerminals().get(targetId);
            if (!terminalInstance) {
                ManagerLogger_1.terminalLogger.error(`Terminal not found: ${targetId}`);
                return false;
            }
            const terminal = terminalInstance.terminal;
            const shouldFollowOutput = this.isAtBottom(terminal);
            // Important: xterm.write is async; scroll after the write is applied to avoid
            // ending up "above bottom" during heavy output (common with interactive TUIs).
            terminal.write(data, () => {
                if (!shouldFollowOutput) {
                    return;
                }
                try {
                    terminal.scrollToBottom();
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.debug(`Auto-scroll after write failed for ${targetId}:`, error);
                }
            });
            return true;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`Failed to write to terminal:`, error);
            return false;
        }
    }
    isAtBottom(terminal) {
        try {
            const buffer = terminal.buffer.active;
            // Tolerance of 1 line to avoid jitter during rapid output/reflow.
            return Math.abs(buffer.baseY - buffer.viewportY) <= TerminalDefaults.SCROLL_BOTTOM_TOLERANCE;
        }
        catch {
            // If buffer is unavailable for any reason, default to following output.
            return true;
        }
    }
    /**
     * Initialize terminal body container with theming
     */
    initializeSimpleTerminal() {
        try {
            const container = document.getElementById('terminal-body');
            if (!container) {
                ManagerLogger_1.terminalLogger.error('Terminal container not found');
                return;
            }
            ManagerLogger_1.terminalLogger.info('Initializing terminal body container');
            // 🔧 FIX: terminal-body flex-direction is ALWAYS column
            // This ensures tab bar stays on top when in bottom panel
            container.style.cssText = `
        display: flex;
        flex-direction: column !important;
        width: 100%;
        height: 100%;
        min-height: ${ContainerStyles.MIN_HEIGHT_PX}px;
        overflow: hidden;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        position: relative;
      `;
            container.className = 'terminal-body-container';
            // 🆕 Create terminals-wrapper container for terminal layout control
            // This container's flex-direction will be managed by PanelLocationHandler
            let terminalsWrapper = document.getElementById('terminals-wrapper');
            if (!terminalsWrapper) {
                ManagerLogger_1.terminalLogger.info('Creating terminals-wrapper container');
                terminalsWrapper = document.createElement('div');
                terminalsWrapper.id = 'terminals-wrapper';
                // 🔧 FIX: Set default flex-direction to column (vertical/sidebar)
                // PanelLocationHandler will add terminal-split-horizontal class for bottom panel
                terminalsWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          padding: ${ContainerStyles.WRAPPER_PADDING_PX}px;
          gap: ${ContainerStyles.WRAPPER_GAP_PX}px;
          box-sizing: border-box;
        `;
                // Move existing terminal containers into terminals-wrapper
                const existingTerminals = Array.from(container.querySelectorAll('[data-terminal-container]'));
                container.appendChild(terminalsWrapper);
                existingTerminals.forEach((terminal) => {
                    terminalsWrapper.appendChild(terminal);
                });
                // 🎯 VS Code Pattern: PanelLocationHandler automatically detects via ResizeObserver
                // No manual update needed - this prevents duplicate updates
            }
            ManagerLogger_1.terminalLogger.info('Terminal body container initialized');
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error('Failed to initialize terminal body container:', error);
        }
    }
    /**
     * Resize all terminals using ResizeManager
     */
    resizeAllTerminals() {
        try {
            const terminals = this.splitManager.getTerminals();
            ManagerLogger_1.terminalLogger.info(`Resizing ${terminals.size} terminals`);
            // 🔧 CRITICAL FIX: Reset parent container styles first
            const terminalsWrapper = document.getElementById('terminals-wrapper');
            const terminalBody = document.getElementById('terminal-body');
            if (terminalsWrapper) {
                terminalsWrapper.style.width = '';
                terminalsWrapper.style.maxWidth = '';
            }
            if (terminalBody) {
                terminalBody.style.width = '';
                terminalBody.style.maxWidth = '';
            }
            // 🔧 CRITICAL FIX: Reset ALL terminal container styles first
            terminals.forEach((terminalInstance) => {
                if (terminalInstance.container) {
                    DOMUtils_1.DOMUtils.resetXtermInlineStyles(terminalInstance.container, false);
                }
            });
            // 🔧 CRITICAL FIX: Force a single reflow after all resets
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            document.body.offsetWidth;
            // 🔧 CRITICAL FIX: Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                terminals.forEach((terminalInstance, terminalId) => {
                    if (terminalInstance.terminal &&
                        terminalInstance.fitAddon &&
                        terminalInstance.container) {
                        // Use ResizeManager for consistent resize behavior
                        ResizeManager_1.ResizeManager.debounceResize(`resize-all-${terminalId}`, async () => {
                            try {
                                terminalInstance.fitAddon.fit();
                                this.notifyExtensionResize(terminalId, terminalInstance.terminal);
                            }
                            catch (error) {
                                ManagerLogger_1.terminalLogger.error(`Failed to resize terminal ${terminalId}:`, error);
                            }
                        }, { delay: LifecycleTimings.RESIZE_ALL_DEBOUNCE_DELAY_MS });
                    }
                });
            });
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error('Failed to resize terminals:', error);
        }
    }
    /**
     * Extract terminal number from terminal ID (e.g., "terminal-3" -> 3)
     */
    extractTerminalNumber(terminalId) {
        if (!terminalId) {
            return TerminalDefaults.DEFAULT_TERMINAL_NUMBER; // Default if terminalId is undefined
        }
        const match = terminalId.match(/terminal-(\d+)/);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        // Fallback: find available number
        const existingNumbers = new Set();
        const terminals = this.splitManager.getTerminals();
        terminals.forEach((terminal) => {
            if (terminal.number) {
                existingNumbers.add(terminal.number);
            }
        });
        // Find first available number (1-MAX_TERMINAL_NUMBER)
        for (let i = TerminalDefaults.DEFAULT_TERMINAL_NUMBER; i <= TerminalDefaults.MAX_TERMINAL_NUMBER; i++) {
            if (!existingNumbers.has(i)) {
                return i;
            }
        }
        ManagerLogger_1.terminalLogger.warn(`Could not extract terminal number from ID: ${terminalId}, defaulting to ${TerminalDefaults.DEFAULT_TERMINAL_NUMBER}`);
        return TerminalDefaults.DEFAULT_TERMINAL_NUMBER;
    }
    /**
     * Get terminal statistics
     */
    getTerminalStats() {
        const terminals = this.splitManager.getTerminals();
        return {
            totalTerminals: terminals.size,
            activeTerminalId: this.activeTerminalId,
            terminalIds: Array.from(terminals.keys()),
        };
    }
    /**
     * Dispose all resources using centralized utilities
     */
    dispose() {
        ManagerLogger_1.terminalLogger.info('Disposing TerminalLifecycleCoordinator...');
        try {
            // Clean up all ResizeManager operations
            const terminals = this.splitManager.getTerminals();
            terminals.forEach((_, terminalId) => {
                ResizeManager_1.ResizeManager.unobserveResize(terminalId);
                ResizeManager_1.ResizeManager.clearResize(`resize-${terminalId}`);
                ResizeManager_1.ResizeManager.clearResize(`initial-${terminalId}`);
                ResizeManager_1.ResizeManager.clearResize(`switch-${terminalId}`);
                ResizeManager_1.ResizeManager.clearResize(`resize-all-${terminalId}`);
            });
            // Dispose event registry
            this.eventRegistry.dispose();
            // Remove all terminals
            const terminalKeys = Array.from(terminals.keys());
            terminalKeys.forEach((terminalId) => {
                this.removeTerminal(terminalId);
            });
            // Reset instance variables
            this.activeTerminalId = null;
            this.terminal = null;
            this.fitAddon = null;
            this.terminalContainer = null;
            ManagerLogger_1.terminalLogger.info('TerminalLifecycleCoordinator disposed');
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error('Error disposing TerminalLifecycleCoordinator:', error);
        }
    }
}
exports.TerminalLifecycleCoordinator = TerminalLifecycleCoordinator;
//# sourceMappingURL=TerminalLifecycleCoordinator.js.map