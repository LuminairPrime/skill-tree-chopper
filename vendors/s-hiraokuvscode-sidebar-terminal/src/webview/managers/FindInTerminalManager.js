"use strict";
/**
 * Find in Terminal Manager
 * Implements VS Code-style search functionality for terminal content
 * - Ctrl+F search panel
 * - F3/Shift+F3 navigation
 * - Search highlighting and regex support
 * - Case-sensitive search options
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindInTerminalManager = void 0;
const logger_1 = require("../../utils/logger");
// ============================================================================
// Constants
// ============================================================================
/**
 * Timing constants for Find in Terminal operations
 */
const FindTimings = {
    /** Delay before focusing search input after panel opens (ms) */
    FOCUS_DELAY_MS: 10,
    /** Debounce delay for search input changes (ms) */
    SEARCH_DEBOUNCE_MS: 150,
};
/**
 * Find in Terminal Manager
 * Provides VS Code-style find functionality for terminals
 */
class FindInTerminalManager {
    constructor() {
        this.coordinator = null;
        this.searchPanel = null;
        this.searchInput = null;
        this.matchCounter = null;
        this.currentTerminalId = null;
        this.lastSearchTerm = '';
        this.findOptions = {
            caseSensitive: false,
            wholeWord: false,
            regex: false,
            backwards: false,
        };
        // Search state tracking
        this.isSearchVisible = false;
        this.currentMatchIndex = 0;
        this.totalMatches = 0;
        this.boundKeydownHandler = this.handleKeydown.bind(this);
        this.setupStyles();
        this.setupKeyboardShortcuts();
    }
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
    }
    /**
     * Setup CSS styles for search panel
     */
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .find-in-terminal-panel {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--vscode-editor-findMatchBackground);
        border: 1px solid var(--vscode-contrastBorder);
        border-radius: 4px;
        padding: 8px;
        display: none;
        z-index: 1000;
        min-width: 300px;
        box-shadow: 0 2px 8px var(--vscode-widget-shadow);
      }

      .find-in-terminal-panel.visible {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .find-search-row {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .find-input {
        flex: 1;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        color: var(--vscode-input-foreground);
        padding: 4px 8px;
        border-radius: 2px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        outline: none;
      }

      .find-input:focus {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
      }

      .find-input.no-matches {
        border-color: var(--vscode-inputValidation-errorBorder);
        background: var(--vscode-inputValidation-errorBackground);
      }

      .find-button {
        background: var(--vscode-button-secondaryBackground);
        border: 1px solid var(--vscode-button-border);
        color: var(--vscode-button-secondaryForeground);
        padding: 2px 6px;
        border-radius: 2px;
        cursor: pointer;
        font-size: 11px;
        min-width: 24px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .find-button:hover {
        background: var(--vscode-button-secondaryHoverBackground);
      }

      .find-button:active {
        background: var(--vscode-button-background);
      }

      .find-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .find-button.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }

      .find-options-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      }

      .find-match-counter {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        min-width: 60px;
        text-align: center;
      }

      .find-option-button {
        background: transparent;
        border: 1px solid var(--vscode-button-border);
        color: var(--vscode-foreground);
        padding: 2px 6px;
        border-radius: 2px;
        cursor: pointer;
        font-size: 10px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .find-option-button:hover {
        background: var(--vscode-toolbar-hoverBackground);
      }

      .find-option-button.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }

      .find-close-button {
        background: transparent;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        padding: 2px;
        border-radius: 2px;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .find-close-button:hover {
        background: var(--vscode-toolbar-hoverBackground);
      }

      /* Search highlight styles */
      .terminal .xterm-search-highlight {
        background-color: var(--vscode-editor-findMatchBackground) !important;
        color: var(--vscode-editor-foreground) !important;
      }

      .terminal .xterm-search-highlight.current {
        background-color: var(--vscode-editor-findMatchHighlightBackground) !important;
        color: var(--vscode-editor-foreground) !important;
        border: 1px solid var(--vscode-editor-findMatchBorder);
      }
    `;
        document.head.appendChild(style);
    }
    /**
     * Setup keyboard shortcuts for search functionality
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.boundKeydownHandler);
    }
    /**
     * Keyboard event handler for search shortcuts
     */
    handleKeydown(event) {
        // Ctrl+F / Cmd+F - Open search
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            this.showSearch();
            return;
        }
        // Escape - Close search
        if (event.key === 'Escape' && this.isSearchVisible) {
            event.preventDefault();
            this.hideSearch();
            return;
        }
        // F3 - Find next
        if (event.key === 'F3' && this.isSearchVisible) {
            event.preventDefault();
            if (event.shiftKey) {
                this.findPrevious();
            }
            else {
                this.findNext();
            }
            return;
        }
        // Enter in search input - Find next
        if (event.key === 'Enter' && this.isSearchVisible && event.target === this.searchInput) {
            event.preventDefault();
            if (event.shiftKey) {
                this.findPrevious();
            }
            else {
                this.findNext();
            }
            return;
        }
    }
    /**
     * Show search panel for current terminal
     */
    showSearch() {
        const activeTerminalId = this.coordinator?.getActiveTerminalId();
        if (!activeTerminalId) {
            (0, logger_1.webview)('No active terminal for search');
            return;
        }
        this.currentTerminalId = activeTerminalId;
        if (!this.searchPanel) {
            this.createSearchPanel();
        }
        // Position search panel in active terminal container
        const terminalContainer = this.coordinator?.getTerminalElement(activeTerminalId);
        if (terminalContainer) {
            terminalContainer.style.position = 'relative';
            terminalContainer.appendChild(this.searchPanel);
        }
        this.searchPanel.classList.add('visible');
        this.isSearchVisible = true;
        // Focus search input
        setTimeout(() => {
            this.searchInput?.focus();
            this.searchInput?.select();
        }, FindTimings.FOCUS_DELAY_MS);
        (0, logger_1.webview)(`🔍 Search panel opened for terminal: ${activeTerminalId}`);
    }
    /**
     * Hide search panel
     */
    hideSearch() {
        if (!this.searchPanel)
            return;
        this.searchPanel.classList.remove('visible');
        this.isSearchVisible = false;
        // Clear search highlights
        this.clearSearchHighlights();
        // Remove panel from DOM
        if (this.searchPanel.parentNode) {
            this.searchPanel.parentNode.removeChild(this.searchPanel);
        }
        (0, logger_1.webview)('🔍 Search panel closed');
    }
    /**
     * Create search panel UI
     */
    createSearchPanel() {
        this.searchPanel = document.createElement('div');
        this.searchPanel.className = 'find-in-terminal-panel';
        // Search input row
        const searchRow = document.createElement('div');
        searchRow.className = 'find-search-row';
        // Search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'find-input';
        this.searchInput.placeholder = 'Find in terminal...';
        this.searchInput.value = this.lastSearchTerm;
        // Search input event handlers
        this.searchInput.addEventListener('input', () => {
            this.onSearchInputChange();
        });
        // Navigation buttons
        const findPrevButton = this.createButton('⬆', 'Find previous (Shift+F3)', () => this.findPrevious());
        const findNextButton = this.createButton('⬇', 'Find next (F3)', () => this.findNext());
        // Match counter
        this.matchCounter = document.createElement('div');
        this.matchCounter.className = 'find-match-counter';
        this.updateMatchCounter();
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'find-close-button';
        closeButton.textContent = '✕'; // Safe: fixed character
        closeButton.title = 'Close (Escape)';
        closeButton.addEventListener('click', () => this.hideSearch());
        searchRow.appendChild(this.searchInput);
        searchRow.appendChild(findPrevButton);
        searchRow.appendChild(findNextButton);
        searchRow.appendChild(this.matchCounter);
        searchRow.appendChild(closeButton);
        // Options row
        const optionsRow = document.createElement('div');
        optionsRow.className = 'find-options-row';
        const caseSensitiveButton = this.createOptionButton('Aa', 'Match case', 'caseSensitive');
        const wholeWordButton = this.createOptionButton('AB', 'Match whole word', 'wholeWord');
        const regexButton = this.createOptionButton('.*', 'Use regular expression', 'regex');
        optionsRow.appendChild(caseSensitiveButton);
        optionsRow.appendChild(wholeWordButton);
        optionsRow.appendChild(regexButton);
        this.searchPanel.appendChild(searchRow);
        this.searchPanel.appendChild(optionsRow);
    }
    /**
     * Create button element
     */
    createButton(text, title, onClick) {
        const button = document.createElement('button');
        button.className = 'find-button';
        button.textContent = text; // Safe: textContent escapes HTML
        button.title = title;
        button.addEventListener('click', onClick);
        return button;
    }
    /**
     * Create option toggle button
     */
    createOptionButton(text, title, option) {
        const button = document.createElement('button');
        button.className = 'find-option-button';
        button.textContent = text; // Safe: textContent escapes HTML
        button.title = title;
        if (this.findOptions[option]) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            this.findOptions[option] = !this.findOptions[option];
            button.classList.toggle('active', this.findOptions[option]);
            // Re-run search with new options
            if (this.lastSearchTerm) {
                this.performSearch(this.lastSearchTerm);
            }
        });
        return button;
    }
    /**
     * Handle search input changes
     */
    onSearchInputChange() {
        const searchTerm = this.searchInput?.value || '';
        this.lastSearchTerm = searchTerm;
        if (searchTerm.length === 0) {
            this.clearSearchHighlights();
            this.updateMatchCounter();
            return;
        }
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(searchTerm);
        }, FindTimings.SEARCH_DEBOUNCE_MS);
    }
    /**
     * Perform search in current terminal
     */
    performSearch(searchTerm) {
        if (!this.currentTerminalId || !this.coordinator) {
            return;
        }
        const terminalInstance = this.coordinator.getTerminalInstance(this.currentTerminalId);
        if (!terminalInstance?.searchAddon) {
            (0, logger_1.webview)('Search addon not available for terminal:', this.currentTerminalId);
            return;
        }
        try {
            // Prepare search options for xterm.js
            const searchOptions = {
                caseSensitive: this.findOptions.caseSensitive,
                wholeWord: this.findOptions.wholeWord,
                regex: this.findOptions.regex,
            };
            // Perform search
            const found = terminalInstance.searchAddon.findNext(searchTerm, searchOptions);
            if (found) {
                this.searchInput?.classList.remove('no-matches');
                // Note: xterm.js SearchAddon doesn't provide match count directly
                this.currentMatchIndex = 1;
                this.totalMatches = 1; // Approximation
            }
            else {
                this.searchInput?.classList.add('no-matches');
                this.currentMatchIndex = 0;
                this.totalMatches = 0;
            }
            this.updateMatchCounter();
        }
        catch (error) {
            (0, logger_1.webview)('Search failed:', error);
            this.searchInput?.classList.add('no-matches');
            this.updateMatchCounter();
        }
    }
    /**
     * Find next occurrence
     */
    findNext() {
        if (!this.lastSearchTerm || !this.currentTerminalId || !this.coordinator) {
            return;
        }
        const terminalInstance = this.coordinator.getTerminalInstance(this.currentTerminalId);
        if (!terminalInstance?.searchAddon) {
            return;
        }
        const searchOptions = {
            caseSensitive: this.findOptions.caseSensitive,
            wholeWord: this.findOptions.wholeWord,
            regex: this.findOptions.regex,
        };
        const found = terminalInstance.searchAddon.findNext(this.lastSearchTerm, searchOptions);
        if (found) {
            this.currentMatchIndex = Math.min(this.currentMatchIndex + 1, this.totalMatches);
            this.updateMatchCounter();
        }
    }
    /**
     * Find previous occurrence
     */
    findPrevious() {
        if (!this.lastSearchTerm || !this.currentTerminalId || !this.coordinator) {
            return;
        }
        const terminalInstance = this.coordinator.getTerminalInstance(this.currentTerminalId);
        if (!terminalInstance?.searchAddon) {
            return;
        }
        const searchOptions = {
            caseSensitive: this.findOptions.caseSensitive,
            wholeWord: this.findOptions.wholeWord,
            regex: this.findOptions.regex,
        };
        const found = terminalInstance.searchAddon.findPrevious(this.lastSearchTerm, searchOptions);
        if (found) {
            this.currentMatchIndex = Math.max(this.currentMatchIndex - 1, 1);
            this.updateMatchCounter();
        }
    }
    /**
     * Clear search highlights
     */
    clearSearchHighlights() {
        if (!this.currentTerminalId || !this.coordinator) {
            return;
        }
        const terminalInstance = this.coordinator.getTerminalInstance(this.currentTerminalId);
        if (terminalInstance?.searchAddon) {
            terminalInstance.searchAddon.clearDecorations();
        }
    }
    /**
     * Update match counter display
     */
    updateMatchCounter() {
        if (!this.matchCounter)
            return;
        if (this.totalMatches === 0) {
            this.matchCounter.textContent = 'No results';
        }
        else {
            this.matchCounter.textContent = `${this.currentMatchIndex} of ${this.totalMatches}`;
        }
    }
    /**
     * Get current search state
     */
    getSearchState() {
        return {
            isVisible: this.isSearchVisible,
            searchTerm: this.lastSearchTerm,
            options: { ...this.findOptions },
            matches: {
                current: this.currentMatchIndex,
                total: this.totalMatches,
            },
        };
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.hideSearch();
        // Remove keyboard shortcut listener
        document.removeEventListener('keydown', this.boundKeydownHandler);
        if (this.searchPanel) {
            this.searchPanel.remove();
            this.searchPanel = null;
        }
        this.searchInput = null;
        this.matchCounter = null;
        this.coordinator = null;
        this.currentTerminalId = null;
        (0, logger_1.webview)('🔍 Find in Terminal Manager disposed');
    }
}
exports.FindInTerminalManager = FindInTerminalManager;
//# sourceMappingURL=FindInTerminalManager.js.map