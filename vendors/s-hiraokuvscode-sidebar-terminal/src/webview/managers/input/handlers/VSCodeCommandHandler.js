"use strict";
/**
 * VS Code Command Handler
 *
 * Handles VS Code terminal commands resolved from keybindings.
 * Extracted from InputManager for better separation of concerns.
 *
 * Key Features:
 * - Command registration via CommandRegistry pattern
 * - Categorized commands (lifecycle, navigation, scrolling, etc.)
 * - Delegation to specialized services
 * - Clear error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeCommandHandler = void 0;
const CommandRegistry_1 = require("../../../core/CommandRegistry");
/**
 * VS Code Command Handler - manages VS Code terminal command routing
 */
class VSCodeCommandHandler {
    constructor(terminalOperations, emitEvent, logger) {
        this.terminalOperations = terminalOperations;
        this.emitEvent = emitEvent;
        this.logger = logger;
        this.registry = new CommandRegistry_1.CommandRegistry();
        this.registerCommands();
    }
    /**
     * Handle a VS Code command
     *
     * @param command VS Code command string
     * @param manager Manager coordinator
     * @returns true if command was handled
     */
    async handleCommand(command, manager) {
        this.logger(`Handling VS Code command: ${command}`);
        try {
            return await this.registry.dispatch({
                command,
                manager,
            });
        }
        catch (error) {
            this.logger(`Error handling command ${command}:`, error);
            return false;
        }
    }
    /**
     * Register all VS Code terminal commands
     */
    registerCommands() {
        // Terminal Management
        this.registerLifecycleCommands();
        // Navigation
        this.registerNavigationCommands();
        // Scrolling
        this.registerScrollCommands();
        // Copy/Paste/Selection
        this.registerClipboardCommands();
        // Find functionality
        this.registerFindCommands();
        // Word/Line operations
        this.registerEditingCommands();
        // Panel/UI (not available in webview)
        this.registerUnavailableCommands();
    }
    /**
     * Terminal lifecycle commands
     */
    registerLifecycleCommands() {
        this.registry.registerBulk({
            'workbench.action.terminal.new': (msg) => {
                const manager = msg.manager;
                this.emitEvent('create-terminal', '', undefined, manager);
            },
            'workbench.action.terminal.split': (msg) => {
                const manager = msg.manager;
                this.emitEvent('split-terminal', manager.getActiveTerminalId() || '', undefined, manager);
            },
            'workbench.action.terminal.kill': (msg) => {
                const manager = msg.manager;
                this.emitEvent('kill-terminal', manager.getActiveTerminalId() || '', undefined, manager);
            },
            'workbench.action.terminal.clear': (msg) => {
                const manager = msg.manager;
                this.terminalOperations.clearTerminal(manager);
            },
            'workbench.action.terminal.sizeToContentWidth': (msg) => {
                const manager = msg.manager;
                this.handleSizeToContent(manager);
            },
        }, { category: 'lifecycle' });
    }
    /**
     * Terminal navigation commands
     */
    registerNavigationCommands() {
        this.registry.registerBulk({
            'workbench.action.terminal.focusNext': (msg) => {
                const manager = msg.manager;
                this.emitEvent('switch-next', manager.getActiveTerminalId() || '', undefined, manager);
            },
            'workbench.action.terminal.focusPrevious': (msg) => {
                const manager = msg.manager;
                this.emitEvent('switch-previous', manager.getActiveTerminalId() || '', undefined, manager);
            },
            'workbench.action.terminal.toggleTerminal': (msg) => {
                const manager = msg.manager;
                this.emitEvent('toggle-terminal', '', undefined, manager);
            },
        }, { category: 'navigation' });
    }
    /**
     * Terminal scroll commands
     */
    registerScrollCommands() {
        const scrollCommands = {
            'workbench.action.terminal.scrollUp': 'up',
            'workbench.action.terminal.scrollDown': 'down',
            'workbench.action.terminal.scrollToTop': 'top',
            'workbench.action.terminal.scrollToBottom': 'bottom',
            'workbench.action.terminal.scrollToPreviousCommand': 'previousCommand',
            'workbench.action.terminal.scrollToNextCommand': 'nextCommand',
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handlers = {};
        for (const [command, direction] of Object.entries(scrollCommands)) {
            handlers[command] = (msg) => {
                const manager = msg.manager;
                this.terminalOperations.scrollTerminal(direction, manager);
            };
        }
        this.registry.registerBulk(handlers, { category: 'scrolling' });
    }
    /**
     * Clipboard commands (copy/paste/select)
     */
    registerClipboardCommands() {
        this.registry.registerBulk({
            'workbench.action.terminal.copySelection': (msg) => {
                const manager = msg.manager;
                this.handleCopy(manager);
            },
            'workbench.action.terminal.paste': (msg) => {
                const manager = msg.manager;
                this.handlePaste(manager);
            },
            'workbench.action.terminal.selectAll': (msg) => {
                const manager = msg.manager;
                this.handleSelectAll(manager);
            },
        }, { category: 'clipboard' });
    }
    /**
     * Find functionality commands
     */
    registerFindCommands() {
        this.registry.registerBulk({
            'workbench.action.terminal.focusFind': (msg) => {
                const manager = msg.manager;
                this.handleFind(manager);
            },
            'workbench.action.terminal.findNext': (msg) => {
                const manager = msg.manager;
                this.handleFindNext(manager);
            },
            'workbench.action.terminal.findPrevious': (msg) => {
                const manager = msg.manager;
                this.handleFindPrevious(manager);
            },
            'workbench.action.terminal.hideFind': (msg) => {
                const manager = msg.manager;
                this.handleHideFind(manager);
            },
        }, { category: 'find' });
    }
    /**
     * Word/Line editing commands
     */
    registerEditingCommands() {
        this.registry.registerBulk({
            'workbench.action.terminal.deleteWordLeft': (msg) => {
                const manager = msg.manager;
                this.handleDeleteWordLeft(manager);
            },
            'workbench.action.terminal.deleteWordRight': (msg) => {
                const manager = msg.manager;
                this.handleDeleteWordRight(manager);
            },
            'workbench.action.terminal.moveToLineStart': (msg) => {
                const manager = msg.manager;
                this.handleMoveToLineStart(manager);
            },
            'workbench.action.terminal.moveToLineEnd': (msg) => {
                const manager = msg.manager;
                this.handleMoveToLineEnd(manager);
            },
        }, { category: 'editing' });
    }
    /**
     * Commands not available in webview context
     */
    registerUnavailableCommands() {
        const unavailableCommands = [
            'workbench.action.togglePanel',
            'workbench.action.closePanel',
            'workbench.action.toggleSidebarVisibility',
            'workbench.action.toggleDevTools',
            'workbench.action.reloadWindow',
            'workbench.action.reloadWindowWithExtensionsDisabled',
            'workbench.action.zoomIn',
            'workbench.action.zoomOut',
            'workbench.action.zoomReset',
            'workbench.action.quickOpen',
            'workbench.action.showCommands',
            'workbench.action.terminal.openNativeConsole',
        ];
        const handlers = {};
        for (const command of unavailableCommands) {
            handlers[command] = () => {
                this.logger(`${command} not available in webview context`);
            };
        }
        this.registry.registerBulk(handlers, { category: 'unavailable' });
    }
    // ========================================
    // Handler implementations
    // ========================================
    handleSizeToContent(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.fitAddon) {
            instance.fitAddon.fit();
            this.logger('Terminal sized to content');
        }
    }
    handleCopy(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (!instance?.terminal)
            return;
        const terminal = instance.terminal;
        if (terminal.hasSelection()) {
            const selection = terminal.getSelection();
            if (selection) {
                manager.postMessageToExtension({
                    command: 'copyToClipboard',
                    text: selection,
                });
                this.logger('Selection copied to clipboard');
            }
        }
    }
    handlePaste(manager) {
        manager.postMessageToExtension({
            command: 'requestPaste',
        });
        this.logger('Paste requested from Extension');
    }
    handleSelectAll(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.terminal) {
            instance.terminal.selectAll();
            this.logger('Terminal content selected');
        }
    }
    handleFind(manager) {
        const managers = manager.getManagers();
        if (managers.findInTerminal) {
            managers.findInTerminal.show?.();
            this.logger('Find panel opened');
        }
    }
    handleFindNext(manager) {
        const managers = manager.getManagers();
        if (managers.findInTerminal) {
            managers.findInTerminal.findNext?.();
            this.logger('Find next');
        }
    }
    handleFindPrevious(manager) {
        const managers = manager.getManagers();
        if (managers.findInTerminal) {
            managers.findInTerminal.findPrevious?.();
            this.logger('Find previous');
        }
    }
    handleHideFind(manager) {
        const managers = manager.getManagers();
        if (managers.findInTerminal) {
            managers.findInTerminal.hide?.();
            this.logger('Find panel hidden');
        }
    }
    handleDeleteWordLeft(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.terminal) {
            // Send Ctrl+W (delete word backward in most shells)
            instance.terminal.input('\x17');
            this.logger('Delete word left');
        }
    }
    handleDeleteWordRight(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.terminal) {
            // Send Alt+D (delete word forward in most shells)
            instance.terminal.input('\x1bd');
            this.logger('Delete word right');
        }
    }
    handleMoveToLineStart(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.terminal) {
            // Send Ctrl+A (move to line start in most shells)
            instance.terminal.input('\x01');
            this.logger('Move to line start');
        }
    }
    handleMoveToLineEnd(manager) {
        const activeId = manager.getActiveTerminalId();
        if (!activeId)
            return;
        const instance = manager.getTerminalInstance(activeId);
        if (instance?.terminal) {
            // Send Ctrl+E (move to line end in most shells)
            instance.terminal.input('\x05');
            this.logger('Move to line end');
        }
    }
    /**
     * Get command registry stats
     */
    getStats() {
        return this.registry.getStats();
    }
    /**
     * Check if a command is registered
     */
    hasCommand(command) {
        return this.registry.has(command);
    }
}
exports.VSCodeCommandHandler = VSCodeCommandHandler;
//# sourceMappingURL=VSCodeCommandHandler.js.map