"use strict";
/**
 * FindInTerminalManager Unit Tests
 *
 * Tests for VS Code-style search functionality in terminal
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const FindInTerminalManager_1 = require("../../../../../webview/managers/FindInTerminalManager");
// Mock the logger
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
(0, vitest_1.describe)('FindInTerminalManager', () => {
    let manager;
    let mockCoordinator;
    let mockSearchAddon;
    let mockTerminalInstance;
    beforeEach(() => {
        // Setup JSDOM elements
        document.body.innerHTML = '<div id="terminal-container"></div>';
        // Create mock search addon
        mockSearchAddon = {
            findNext: vi.fn().mockReturnValue(true),
            findPrevious: vi.fn().mockReturnValue(true),
            clearDecorations: vi.fn(),
        };
        // Create mock terminal instance
        mockTerminalInstance = {
            terminal: {},
            searchAddon: mockSearchAddon,
        };
        // Create mock coordinator
        mockCoordinator = {
            getActiveTerminalId: vi.fn().mockReturnValue('terminal-1'),
            getTerminalInstance: vi.fn().mockReturnValue(mockTerminalInstance),
            getTerminalElement: vi.fn().mockReturnValue(document.getElementById('terminal-container')),
            postMessageToExtension: vi.fn(),
            setActiveTerminalId: vi.fn(),
        };
        // Create manager
        manager = new FindInTerminalManager_1.FindInTerminalManager();
        manager.setCoordinator(mockCoordinator);
    });
    afterEach(() => {
        manager.dispose();
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('initialization', () => {
        (0, vitest_1.it)('should create manager without coordinator', () => {
            const newManager = new FindInTerminalManager_1.FindInTerminalManager();
            (0, vitest_1.expect)(newManager).toBeDefined();
            newManager.dispose();
        });
        (0, vitest_1.it)('should set coordinator', () => {
            const newManager = new FindInTerminalManager_1.FindInTerminalManager();
            newManager.setCoordinator(mockCoordinator);
            // Coordinator should be set (verified by subsequent operations working)
            newManager.dispose();
        });
        (0, vitest_1.it)('should setup styles on construction', () => {
            // Check that style element was added to head
            const styles = document.head.querySelectorAll('style');
            const hasSearchStyles = Array.from(styles).some((style) => style.textContent?.includes('.find-in-terminal-panel'));
            (0, vitest_1.expect)(hasSearchStyles).toBe(true);
        });
    });
    (0, vitest_1.describe)('showSearch', () => {
        (0, vitest_1.it)('should show search panel for active terminal', () => {
            manager.showSearch();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(true);
        });
        (0, vitest_1.it)('should not show search if no active terminal', () => {
            vi.mocked(mockCoordinator.getActiveTerminalId).mockReturnValue(null);
            manager.showSearch();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
        });
        (0, vitest_1.it)('should focus search input after showing', async () => {
            manager.showSearch();
            // Wait for setTimeout to execute
            await new Promise((resolve) => setTimeout(resolve, 20));
            // The search input should be created and focused
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            (0, vitest_1.expect)(searchPanel).toBeTruthy();
        });
        (0, vitest_1.it)('should reuse existing search panel', () => {
            manager.showSearch();
            manager.hideSearch();
            manager.showSearch();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(true);
        });
    });
    (0, vitest_1.describe)('hideSearch', () => {
        (0, vitest_1.it)('should hide search panel', () => {
            manager.showSearch();
            manager.hideSearch();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
        });
        (0, vitest_1.it)('should clear search highlights on hide', () => {
            manager.showSearch();
            manager.hideSearch();
            (0, vitest_1.expect)(mockSearchAddon.clearDecorations).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle hide when not visible', () => {
            // Should not throw
            (0, vitest_1.expect)(() => manager.hideSearch()).not.toThrow();
        });
    });
    (0, vitest_1.describe)('findNext', () => {
        (0, vitest_1.it)('should call searchAddon.findNext with correct options', () => {
            manager.showSearch();
            // Simulate typing in search input
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            // Wait for debounce and trigger findNext
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            manager.findNext();
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not search if no search term', () => {
            manager.showSearch();
            manager.findNext();
            // Should not call findNext without a search term
            (0, vitest_1.expect)(mockSearchAddon.findNext).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not search if no coordinator', () => {
            const isolatedManager = new FindInTerminalManager_1.FindInTerminalManager();
            isolatedManager.findNext();
            // Should not throw
            isolatedManager.dispose();
        });
    });
    (0, vitest_1.describe)('findPrevious', () => {
        (0, vitest_1.it)('should call searchAddon.findPrevious', () => {
            manager.showSearch();
            // Set up a search term by directly manipulating state
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            manager.findPrevious();
            (0, vitest_1.expect)(mockSearchAddon.findPrevious).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not search backwards if no search term', () => {
            manager.showSearch();
            manager.findPrevious();
            (0, vitest_1.expect)(mockSearchAddon.findPrevious).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getSearchState', () => {
        (0, vitest_1.it)('should return initial state', () => {
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
            (0, vitest_1.expect)(state.searchTerm).toBe('');
            (0, vitest_1.expect)(state.options).toEqual({
                caseSensitive: false,
                wholeWord: false,
                regex: false,
                backwards: false,
            });
            (0, vitest_1.expect)(state.matches).toEqual({
                current: 0,
                total: 0,
            });
        });
        (0, vitest_1.it)('should return visible state after showSearch', () => {
            manager.showSearch();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(true);
        });
        (0, vitest_1.it)('should return correct options after toggling', () => {
            manager.showSearch();
            // Find and click the case sensitive button
            const optionButtons = document.querySelectorAll('.find-option-button');
            if (optionButtons[0]) {
                optionButtons[0].click();
            }
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.options.caseSensitive).toBe(true);
        });
    });
    (0, vitest_1.describe)('keyboard shortcuts', () => {
        (0, vitest_1.it)('should open search on Ctrl+F', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'f',
                ctrlKey: true,
                bubbles: true,
            });
            document.dispatchEvent(event);
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(true);
        });
        (0, vitest_1.it)('should open search on Cmd+F (Mac)', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'f',
                metaKey: true,
                bubbles: true,
            });
            document.dispatchEvent(event);
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(true);
        });
        (0, vitest_1.it)('should close search on Escape', () => {
            manager.showSearch();
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
            });
            document.dispatchEvent(event);
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
        });
        (0, vitest_1.it)('should not close on Escape if search not visible', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
            });
            // Should not throw
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
        });
        (0, vitest_1.it)('should find next on F3', () => {
            manager.showSearch();
            // Set up search term
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            const event = new KeyboardEvent('keydown', {
                key: 'F3',
                bubbles: true,
            });
            document.dispatchEvent(event);
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should find previous on Shift+F3', () => {
            manager.showSearch();
            // Set up search term
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            const event = new KeyboardEvent('keydown', {
                key: 'F3',
                shiftKey: true,
                bubbles: true,
            });
            document.dispatchEvent(event);
            (0, vitest_1.expect)(mockSearchAddon.findPrevious).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('search options', () => {
        (0, vitest_1.it)('should toggle case sensitive option', () => {
            manager.showSearch();
            const caseSensitiveBtn = document.querySelector('.find-option-button');
            if (caseSensitiveBtn) {
                caseSensitiveBtn.click();
            }
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.options.caseSensitive).toBe(true);
        });
        (0, vitest_1.it)('should toggle whole word option', () => {
            manager.showSearch();
            const buttons = document.querySelectorAll('.find-option-button');
            if (buttons[1]) {
                buttons[1].click();
            }
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.options.wholeWord).toBe(true);
        });
        (0, vitest_1.it)('should toggle regex option', () => {
            manager.showSearch();
            const buttons = document.querySelectorAll('.find-option-button');
            if (buttons[2]) {
                buttons[2].click();
            }
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.options.regex).toBe(true);
        });
        (0, vitest_1.it)('should re-run search when option toggled with existing term', () => {
            manager.showSearch();
            // Set search term
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            mockSearchAddon.findNext.mockClear();
            // Toggle an option
            const caseSensitiveBtn = document.querySelector('.find-option-button');
            if (caseSensitiveBtn) {
                caseSensitiveBtn.click();
            }
            vi.useRealTimers();
            // Should re-run search
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('search input handling', () => {
        (0, vitest_1.it)('should debounce search input', () => {
            vi.useFakeTimers();
            manager.showSearch();
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            // Should not search immediately
            (0, vitest_1.expect)(mockSearchAddon.findNext).not.toHaveBeenCalled();
            // After debounce delay
            vi.advanceTimersByTime(200);
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalled();
            vi.useRealTimers();
        });
        (0, vitest_1.it)('should clear highlights when search term is empty', () => {
            manager.showSearch();
            // First, search for something
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            mockSearchAddon.clearDecorations.mockClear();
            // Then clear the search
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useRealTimers();
            (0, vitest_1.expect)(mockSearchAddon.clearDecorations).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle no matches', async () => {
            mockSearchAddon.findNext.mockReturnValue(false);
            manager.showSearch();
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            vi.useFakeTimers();
            if (searchInput) {
                searchInput.value = 'nonexistent';
                searchInput.dispatchEvent(new Event('input'));
            }
            // Advance timer to trigger debounced search
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            // Give time for the search to complete and class to be added
            await new Promise((resolve) => setTimeout(resolve, 10));
            // Input should have no-matches class
            (0, vitest_1.expect)(searchInput?.classList.contains('no-matches')).toBe(true);
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.matches.total).toBe(0);
        });
    });
    (0, vitest_1.describe)('navigation buttons', () => {
        (0, vitest_1.it)('should find previous on button click', () => {
            manager.showSearch();
            // Set search term
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            // Click prev button (first find-button)
            const buttons = document.querySelectorAll('.find-button');
            if (buttons[0]) {
                buttons[0].click();
            }
            (0, vitest_1.expect)(mockSearchAddon.findPrevious).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should find next on button click', () => {
            manager.showSearch();
            // Set search term
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            mockSearchAddon.findNext.mockClear();
            vi.useRealTimers();
            // Click next button (second find-button)
            const buttons = document.querySelectorAll('.find-button');
            if (buttons[1]) {
                buttons[1].click();
            }
            (0, vitest_1.expect)(mockSearchAddon.findNext).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should close on close button click', () => {
            manager.showSearch();
            const closeButton = document.querySelector('.find-close-button');
            if (closeButton) {
                closeButton.click();
            }
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clean up resources on dispose', () => {
            manager.showSearch();
            manager.dispose();
            // Should not throw on subsequent operations
            (0, vitest_1.expect)(() => manager.showSearch()).not.toThrow();
        });
        (0, vitest_1.it)('should hide search on dispose', () => {
            manager.showSearch();
            manager.dispose();
            const state = manager.getSearchState();
            (0, vitest_1.expect)(state.isVisible).toBe(false);
        });
        (0, vitest_1.it)('Bug #8: should remove document keydown listener on dispose', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            manager.dispose();
            // Should have called removeEventListener for 'keydown'
            const keydownRemoveCalls = removeEventListenerSpy.mock.calls.filter((call) => call[0] === 'keydown');
            (0, vitest_1.expect)(keydownRemoveCalls.length).toBe(1);
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should handle missing searchAddon gracefully', () => {
            vi.mocked(mockCoordinator.getTerminalInstance).mockReturnValue({
                terminal: {},
                searchAddon: null,
            });
            manager.showSearch();
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            vi.advanceTimersByTime(200);
            vi.useRealTimers();
            // Should not throw
            (0, vitest_1.expect)(() => manager.findNext()).not.toThrow();
        });
        (0, vitest_1.it)('should handle search error gracefully', () => {
            mockSearchAddon.findNext.mockImplementation(() => {
                throw new Error('Search failed');
            });
            manager.showSearch();
            const searchPanel = document.querySelector('.find-in-terminal-panel');
            const searchInput = searchPanel?.querySelector('.find-input');
            if (searchInput) {
                searchInput.value = 'test';
                searchInput.dispatchEvent(new Event('input'));
            }
            vi.useFakeTimers();
            // Should not throw
            (0, vitest_1.expect)(() => vi.advanceTimersByTime(200)).not.toThrow();
            vi.useRealTimers();
        });
    });
});
//# sourceMappingURL=FindInTerminalManager.test.js.map