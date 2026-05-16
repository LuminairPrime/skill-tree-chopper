"use strict";
/**
 * Shell Integration Message Handler
 *
 * Handles shell integration features like status, CWD, history, and search
 *
 * Uses registry-based dispatch pattern instead of switch-case
 * for better maintainability and extensibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellIntegrationMessageHandler = void 0;
const type_guards_1 = require("../../../types/type-guards");
/**
 * Shell Integration Message Handler
 *
 * Responsibilities:
 * - Shell status updates
 * - Working directory (CWD) tracking
 * - Command history management
 * - Terminal search functionality
 */
class ShellIntegrationMessageHandler {
    constructor(logger) {
        this.logger = logger;
        this.handlers = this.buildHandlerRegistry();
    }
    /**
     * Build handler registry - replaces switch-case pattern
     */
    buildHandlerRegistry() {
        const registry = new Map();
        registry.set('shellStatus', (msg, coord) => this.handleShellStatus(msg, coord));
        registry.set('cwdUpdate', (msg, coord) => this.handleCwdUpdate(msg, coord));
        registry.set('commandHistory', (msg, coord) => this.handleCommandHistory(msg, coord));
        registry.set('find', (msg, coord) => this.handleFind(msg, coord));
        return registry;
    }
    /**
     * Handle shell integration related messages using registry dispatch
     */
    handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        const handler = this.handlers.get(command);
        if (handler) {
            handler(msg, coordinator);
        }
        else {
            this.logger.warn(`Unknown shell integration command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Handle shell status message
     */
    handleShellStatus(msg, coordinator) {
        const terminalId = msg.terminalId;
        const status = msg.status;
        if (!terminalId || !status) {
            this.logger.warn('Invalid shell status message', { terminalId, status });
            return;
        }
        // Forward to shell integration manager
        if ((0, type_guards_1.hasProperty)(coordinator, 'shellIntegrationManager', (value) => (0, type_guards_1.isNonNullObject)(value) && 'updateShellStatus' in value)) {
            coordinator.shellIntegrationManager.updateShellStatus(terminalId, status);
        }
    }
    /**
     * Handle CWD update message
     */
    handleCwdUpdate(msg, coordinator) {
        const terminalId = msg.terminalId;
        const cwd = msg.cwd;
        if (!terminalId || !cwd) {
            this.logger.warn('Invalid CWD update message', { terminalId, cwd });
            return;
        }
        // Forward to shell integration manager
        if ((0, type_guards_1.hasProperty)(coordinator, 'shellIntegrationManager', (value) => (0, type_guards_1.isNonNullObject)(value) && 'updateWorkingDirectory' in value)) {
            coordinator.shellIntegrationManager?.updateWorkingDirectory?.(terminalId, cwd);
        }
    }
    /**
     * Handle command history message
     */
    handleCommandHistory(msg, coordinator) {
        const terminalId = msg.terminalId;
        const history = msg.history;
        if (!terminalId || !history) {
            this.logger.warn('Invalid command history message', { terminalId, history });
            return;
        }
        // Forward to shell integration manager
        if ((0, type_guards_1.hasProperty)(coordinator, 'shellIntegrationManager', (value) => (0, type_guards_1.isNonNullObject)(value) && 'showCommandHistory' in value)) {
            coordinator.shellIntegrationManager.showCommandHistory(terminalId, history);
        }
    }
    /**
     * Handle find/search message
     */
    handleFind(msg, coordinator) {
        const action = msg.action;
        this.logger.info('Handling find message', { action });
        // Get the active terminal and show search interface
        if ((0, type_guards_1.hasProperty)(coordinator, 'terminalLifecycleManager', (value) => (0, type_guards_1.isNonNullObject)(value) && 'getActiveTerminal' in value)) {
            const activeTerminalId = coordinator.getActiveTerminalId();
            if (activeTerminalId) {
                const terminalInstance = coordinator.getAllTerminalInstances().get(activeTerminalId);
                if (terminalInstance?.terminal) {
                    this.showSearchInterface(terminalInstance.terminal);
                }
                else {
                    this.logger.warn('No terminal instance found for active terminal');
                }
            }
            else {
                this.logger.warn('No active terminal found for search');
            }
        }
    }
    /**
     * Show search interface for terminal
     */
    showSearchInterface(terminal) {
        // Get or create search addon
        const terminalWithAddons = terminal;
        const searchAddon = terminalWithAddons._addonManager?._addons?.find((addon) => addon.addon && addon.addon.findNext)?.addon;
        if (searchAddon) {
            // Create search UI
            this.createSearchUI(terminal, searchAddon);
        }
        else {
            this.logger.error('Search addon not found on terminal');
        }
    }
    /**
     * Create search UI elements
     */
    createSearchUI(terminal, searchAddon) {
        // Add CSS styles if not already added
        this.addSearchStyles();
        // Find or create search container
        let searchContainer = document.getElementById('terminal-search-container');
        if (!searchContainer) {
            searchContainer = document.createElement('div');
            searchContainer.id = 'terminal-search-container';
            searchContainer.className = 'terminal-search-container';
            searchContainer.innerHTML = `
        <div class="search-box">
          <input type="text" class="search-input" placeholder="Search..." />
          <button class="search-btn search-next" title="Find Next">↓</button>
          <button class="search-btn search-prev" title="Find Previous">↑</button>
          <button class="search-btn search-close" title="Close">×</button>
        </div>
      `;
            // Insert search container at the top of terminal container
            const terminalContainer = document.querySelector('.terminal-container');
            if (terminalContainer) {
                terminalContainer.insertBefore(searchContainer, terminalContainer.firstChild);
            }
            // Add search functionality
            this.setupSearchEventListeners(searchContainer, searchAddon);
        }
        // Show search container
        searchContainer.style.display = 'block';
        // Focus search input
        const searchInput = searchContainer.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
    /**
     * Add search CSS styles to document
     */
    addSearchStyles() {
        if (document.getElementById('terminal-search-styles')) {
            return; // Styles already added
        }
        const style = document.createElement('style');
        style.id = 'terminal-search-styles';
        style.textContent = `
      .terminal-search-container {
        display: none;
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
        background-color: var(--vscode-editor-background, #1e1e1e);
        border: 1px solid var(--vscode-panel-border, #454545);
        border-radius: 4px;
        padding: 4px;
        margin: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .search-input {
        background-color: var(--vscode-input-background, #3c3c3c);
        border: 1px solid var(--vscode-input-border, #454545);
        color: var(--vscode-input-foreground, #cccccc);
        padding: 4px 8px;
        font-size: 13px;
        font-family: var(--vscode-editor-font-family, monospace);
        border-radius: 2px;
        width: 200px;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder, #007acc);
      }

      .search-btn {
        background-color: var(--vscode-button-background, #0e639c);
        border: none;
        color: var(--vscode-button-foreground, #ffffff);
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
      }

      .search-btn:hover {
        background-color: var(--vscode-button-hoverBackground, #1177bb);
      }

      .search-btn:active {
        background-color: var(--vscode-button-background, #0e639c);
      }

      .search-close {
        background-color: var(--vscode-button-secondaryBackground, #5a5d5e);
      }

      .search-close:hover {
        background-color: var(--vscode-button-secondaryHoverBackground, #656565);
      }
    `;
        document.head.appendChild(style);
    }
    /**
     * Setup search event listeners
     */
    setupSearchEventListeners(container, searchAddon) {
        const searchInput = container.querySelector('.search-input');
        const nextBtn = container.querySelector('.search-next');
        const prevBtn = container.querySelector('.search-prev');
        const closeBtn = container.querySelector('.search-close');
        if (!searchInput || !nextBtn || !prevBtn || !closeBtn) {
            this.logger.error('Search UI elements not found');
            return;
        }
        // Search on input change
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            if (searchTerm) {
                searchAddon.findNext?.();
            }
            else {
                searchAddon.clearDecorations?.();
            }
        });
        // Search on Enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value;
                if (searchTerm) {
                    if (e.shiftKey && searchAddon.findPrevious) {
                        searchAddon.findPrevious();
                    }
                    else {
                        searchAddon.findNext?.();
                    }
                }
            }
            else if (e.key === 'Escape') {
                this.hideSearchInterface();
            }
        });
        // Next button
        nextBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value;
            if (searchTerm) {
                searchAddon.findNext?.();
            }
        });
        // Previous button
        prevBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value;
            if (searchTerm && searchAddon.findPrevious) {
                searchAddon.findPrevious();
            }
        });
        // Close button
        closeBtn.addEventListener('click', () => {
            this.hideSearchInterface();
        });
    }
    /**
     * Hide search interface
     */
    hideSearchInterface() {
        const searchContainer = document.getElementById('terminal-search-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
            // Clear search input
            const searchInput = searchContainer.querySelector('.search-input');
            if (searchInput) {
                searchInput.value = '';
            }
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        // Clear handler registry
        this.handlers.clear();
        // Remove search UI if exists
        const searchContainer = document.getElementById('terminal-search-container');
        if (searchContainer) {
            searchContainer.remove();
        }
        // Remove search styles if exists
        const searchStyles = document.getElementById('terminal-search-styles');
        if (searchStyles) {
            searchStyles.remove();
        }
    }
}
exports.ShellIntegrationMessageHandler = ShellIntegrationMessageHandler;
//# sourceMappingURL=ShellIntegrationMessageHandler.js.map