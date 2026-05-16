"use strict";
/**
 * Terminal Coordinator Service Implementation
 * Extracted from RefactoredTerminalWebviewManager to handle pure terminal coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalCoordinatorFactory = exports.TerminalCoordinator = void 0;
const xterm_1 = require("@xterm/xterm");
const addon_fit_1 = require("@xterm/addon-fit");
const BaseManager_1 = require("../managers/BaseManager");
const webview_1 = require("../constants/webview");
const common_1 = require("../../utils/common");
const DOMUtils_1 = require("../utils/DOMUtils");
/**
 * Core terminal coordination service
 * Handles terminal lifecycle without UI concerns
 */
class TerminalCoordinator extends BaseManager_1.BaseManager {
    constructor(config) {
        super('TerminalCoordinator', {
            enableLogging: config.debugMode,
            enableValidation: true,
            enableErrorRecovery: true,
        });
        this.terminals = new Map();
        this.eventListeners = new Map();
        this.terminalCounter = 0;
        this.config = config;
        this.initializeEventListeners();
    }
    /**
     * Public initialize method to satisfy interface
     */
    async initialize() {
        // Call the base manager initialization
        this.doInitialize();
    }
    doInitialize() {
        this.logger('Terminal coordinator initialized');
    }
    doDispose() {
        // Dispose all terminals
        for (const [terminalId] of this.terminals) {
            this.removeTerminal(terminalId);
        }
        this.terminals.clear();
        this.eventListeners.clear();
        this.activeTerminalId = undefined;
        this.logger('Terminal coordinator disposed');
    }
    initializeEventListeners() {
        const eventTypes = [
            'onTerminalCreated',
            'onTerminalRemoved',
            'onTerminalActivated',
            'onTerminalOutput',
            'onTerminalResize',
        ];
        for (const eventType of eventTypes) {
            this.eventListeners.set(eventType, new Set());
        }
    }
    emitEvent(event, ...args) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(...args);
                }
                catch (error) {
                    this.logger(`Error in event listener for ${event}: ${error}`);
                }
            }
        }
    }
    // Terminal lifecycle management
    async createTerminal(_options = {}) {
        if (!this.canCreateTerminal()) {
            throw new Error(`Cannot create terminal: maximum of ${this.config.maxTerminals} terminals reached`);
        }
        const terminalId = `terminal-${++this.terminalCounter}`;
        try {
            // Create terminal instance
            const terminal = new xterm_1.Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                theme: {
                    background: 'var(--vscode-terminal-background)',
                    foreground: 'var(--vscode-terminal-foreground)',
                },
                scrollback: 10000,
                allowProposedApi: true,
            });
            // Create fit addon
            const fitAddon = new addon_fit_1.FitAddon();
            terminal.loadAddon(fitAddon);
            // Create container
            const container = document.createElement('div');
            container.id = `terminal-container-${terminalId}`;
            container.className = 'terminal-container';
            container.style.display = 'none'; // Hidden by default
            // Open terminal in container
            terminal.open(container);
            // Reset xterm.js inline styles before fit to allow terminal expansion
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
            fitAddon.fit();
            // 🔧 FIX: Refresh to ensure cursor and decorations are rendered
            // Do NOT call terminal.clear() as it interferes with shell prompt
            terminal.refresh(0, terminal.rows - 1);
            // Setup terminal event handlers
            this.setupTerminalEventHandlers(terminal, terminalId);
            // Create terminal info
            const terminalInfo = {
                id: terminalId,
                terminal,
                fitAddon,
                container,
                number: this.terminalCounter,
                isActive: false,
            };
            // Store terminal
            this.terminals.set(terminalId, terminalInfo);
            // Set as active if it's the first terminal
            if (this.terminals.size === 1) {
                this.activateTerminal(terminalId);
            }
            // Emit creation event
            this.emitEvent('onTerminalCreated', terminalInfo);
            this.logger(`Terminal created: ${terminalId}`);
            return terminalId;
        }
        catch (error) {
            this.logger(`Failed to create terminal: ${error}`);
            throw error;
        }
    }
    async removeTerminal(terminalId) {
        const terminalInfo = this.terminals.get(terminalId);
        if (!terminalInfo) {
            return false;
        }
        try {
            // Dispose terminal
            terminalInfo.terminal.dispose();
            // Remove container from DOM
            if (terminalInfo.container.parentNode) {
                terminalInfo.container.parentNode.removeChild(terminalInfo.container);
            }
            // Remove from map
            this.terminals.delete(terminalId);
            // Update active terminal if necessary
            if (this.activeTerminalId === terminalId) {
                this.selectNewActiveTerminal();
            }
            // Emit removal event
            this.emitEvent('onTerminalRemoved', terminalId);
            this.logger(`Terminal removed: ${terminalId}`);
            return true;
        }
        catch (error) {
            this.logger(`Failed to remove terminal ${terminalId}: ${error}`);
            return false;
        }
    }
    activateTerminal(terminalId) {
        const terminalInfo = this.terminals.get(terminalId);
        if (!terminalInfo) {
            this.logger(`Cannot activate terminal: ${terminalId} not found`);
            return;
        }
        // Deactivate current active terminal
        if (this.activeTerminalId) {
            const currentActive = this.terminals.get(this.activeTerminalId);
            if (currentActive) {
                currentActive.isActive = false;
                currentActive.container.style.display = 'none';
            }
        }
        // Activate new terminal
        this.activeTerminalId = terminalId;
        terminalInfo.isActive = true;
        terminalInfo.container.style.display = 'block';
        terminalInfo.terminal.focus();
        // Reset xterm.js inline styles before fit to allow terminal expansion
        DOMUtils_1.DOMUtils.resetXtermInlineStyles(terminalInfo.container);
        terminalInfo.fitAddon.fit();
        // Emit activation event
        this.emitEvent('onTerminalActivated', terminalId);
        this.logger(`Terminal activated: ${terminalId}`);
    }
    selectNewActiveTerminal() {
        if (this.terminals.size === 0) {
            this.activeTerminalId = undefined;
            return;
        }
        // Select the first available terminal
        const firstTerminalId = this.terminals.keys().next().value;
        if (firstTerminalId) {
            this.activateTerminal(firstTerminalId);
        }
    }
    setupTerminalEventHandlers(terminal, terminalId) {
        // Resize handler
        terminal.onResize((dimensions) => {
            this.emitEvent('onTerminalResize', terminalId, dimensions.cols, dimensions.rows);
        });
    }
    // Terminal access methods
    getTerminal(terminalId) {
        return this.terminals.get(terminalId)?.terminal;
    }
    getTerminalInfo(terminalId) {
        return this.terminals.get(terminalId);
    }
    getAllTerminalInfos() {
        return Array.from(this.terminals.values());
    }
    getActiveTerminalId() {
        return this.activeTerminalId;
    }
    // Terminal operations
    writeToTerminal(terminalId, data) {
        const terminal = this.getTerminal(terminalId);
        if (terminal) {
            const shouldFollowOutput = this.isAtBottom(terminal);
            terminal.write(data, () => {
                if (!shouldFollowOutput) {
                    return;
                }
                try {
                    terminal.scrollToBottom();
                }
                catch {
                    // Best-effort; avoid throwing during output streaming.
                }
            });
        }
        else {
            this.logger(`Cannot write to terminal: ${terminalId} not found`);
        }
    }
    isAtBottom(terminal) {
        try {
            const buffer = terminal.buffer.active;
            return Math.abs(buffer.baseY - buffer.viewportY) <= 1;
        }
        catch {
            return true;
        }
    }
    resizeTerminal(terminalId, cols, rows) {
        const terminalInfo = this.terminals.get(terminalId);
        if (terminalInfo) {
            terminalInfo.terminal.resize(cols, rows);
            // Reset xterm.js inline styles before fit to allow terminal expansion
            DOMUtils_1.DOMUtils.resetXtermInlineStyles(terminalInfo.container);
            terminalInfo.fitAddon.fit();
            this.emitEvent('onTerminalResize', terminalId, cols, rows);
        }
        else {
            this.logger(`Cannot resize terminal: ${terminalId} not found`);
        }
    }
    async switchToTerminal(terminalId) {
        if (this.terminals.has(terminalId)) {
            this.activateTerminal(terminalId);
        }
        else {
            throw new Error(`Terminal ${terminalId} not found`);
        }
    }
    // State queries
    hasTerminals() {
        return this.terminals.size > 0;
    }
    canCreateTerminal() {
        return this.terminals.size < this.config.maxTerminals;
    }
    getTerminalCount() {
        return this.terminals.size;
    }
    getAvailableSlots() {
        return Math.max(0, this.config.maxTerminals - this.terminals.size);
    }
    // Event management
    addEventListener(event, listener) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.add(listener);
        }
    }
    removeEventListener(event, listener) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }
}
exports.TerminalCoordinator = TerminalCoordinator;
/**
 * Factory for creating terminal coordinators
 */
class TerminalCoordinatorFactory {
    static create(config) {
        return new TerminalCoordinator(config);
    }
    static createDefault() {
        const defaultConfig = {
            maxTerminals: webview_1.SPLIT_CONSTANTS.MAX_TERMINALS,
            defaultShell: '/bin/bash',
            workingDirectory: (0, common_1.safeProcessCwd)(),
            enablePerformanceOptimization: true,
            bufferSize: 1000,
            debugMode: false,
        };
        return new TerminalCoordinator(defaultConfig);
    }
}
exports.TerminalCoordinatorFactory = TerminalCoordinatorFactory;
//# sourceMappingURL=TerminalCoordinator.js.map