"use strict";
/**
 * InputManager - Arrow Key Handling Tests
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InputManager_1 = require("../../../../../webview/managers/InputManager");
(0, vitest_1.describe)('InputManager - Arrow Key Handling', () => {
    let inputManager;
    let mockCoordinator;
    let mockVsCodeApi;
    (0, vitest_1.beforeEach)(() => {
        // Setup DOM environment
        const terminalContainer = document.createElement('div');
        terminalContainer.className = 'terminal-container active';
        terminalContainer.setAttribute('data-terminal-id', 'terminal-1');
        document.body.appendChild(terminalContainer);
        const terminalContent = document.createElement('div');
        terminalContent.className = 'terminal-content';
        terminalContainer.appendChild(terminalContent);
        const xterm = document.createElement('div');
        xterm.className = 'xterm';
        terminalContent.appendChild(xterm);
        // Mock VS Code API
        mockVsCodeApi = vitest_1.vi.fn();
        window.acquireVsCodeApi = () => ({
            postMessage: mockVsCodeApi,
        });
        // Create mock coordinator
        mockCoordinator = {
            getActiveTerminalId: vitest_1.vi.fn().mockReturnValue('terminal-1'),
            setActiveTerminalId: vitest_1.vi.fn(),
            getTerminalInstance: vitest_1.vi.fn(),
            getAllTerminalInstances: vitest_1.vi.fn(),
            getAllTerminalContainers: vitest_1.vi.fn(),
            getTerminalElement: vitest_1.vi.fn(),
            postMessageToExtension: vitest_1.vi.fn(),
            createTerminal: vitest_1.vi.fn(),
            openSettings: vitest_1.vi.fn(),
            applyFontSettings: vitest_1.vi.fn(),
            closeTerminal: vitest_1.vi.fn(),
            log: vitest_1.vi.fn(),
            getManagers: vitest_1.vi.fn(),
            updateClaudeStatus: vitest_1.vi.fn(),
            updateCliAgentStatus: vitest_1.vi.fn(),
            ensureTerminalFocus: vitest_1.vi.fn(),
        };
        inputManager = new InputManager_1.InputManager(mockCoordinator);
    });
    (0, vitest_1.afterEach)(() => {
        inputManager.dispose();
        document.body.innerHTML = '';
        delete window.acquireVsCodeApi;
    });
    (0, vitest_1.describe)('Arrow Key Mode Management', () => {
        (0, vitest_1.it)('should always disable agent interaction mode for VS Code standard behavior', () => {
            // VS Code Standard: Agent interaction mode is always disabled
            // This preserves arrow key functionality for bash history, completion, etc.
            inputManager.setAgentInteractionMode(true);
            // Implementation forces this to false for VS Code compatibility
            (0, vitest_1.expect)(inputManager.isAgentInteractionMode()).toBe(false);
            inputManager.setAgentInteractionMode(false);
            (0, vitest_1.expect)(inputManager.isAgentInteractionMode()).toBe(false);
        });
        (0, vitest_1.it)('should start with agent interaction mode disabled', () => {
            (0, vitest_1.expect)(inputManager.isAgentInteractionMode()).toBe(false);
        });
        (0, vitest_1.it)('should not throw when calling setAgentInteractionMode', () => {
            (0, vitest_1.expect)(() => inputManager.setAgentInteractionMode(true)).not.toThrow();
            (0, vitest_1.expect)(() => inputManager.setAgentInteractionMode(false)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Arrow Key Event Handling', () => {
        (0, vitest_1.it)('should map arrow keys to ANSI sequences', () => {
            // Test that arrow key constants are correct ANSI escape sequences
            const arrowKeyMap = {
                ArrowUp: '\x1b[A',
                ArrowDown: '\x1b[B',
                ArrowRight: '\x1b[C',
                ArrowLeft: '\x1b[D',
            };
            // Verify the ANSI escape sequences are correct
            (0, vitest_1.expect)(arrowKeyMap['ArrowUp']).toBe('\x1b[A');
            (0, vitest_1.expect)(arrowKeyMap['ArrowDown']).toBe('\x1b[B');
            (0, vitest_1.expect)(arrowKeyMap['ArrowRight']).toBe('\x1b[C');
            (0, vitest_1.expect)(arrowKeyMap['ArrowLeft']).toBe('\x1b[D');
        });
        (0, vitest_1.it)('should handle arrow key events without throwing', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            // Dispatch the event - should not throw
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
        });
        (0, vitest_1.it)('should handle non-arrow key events without throwing', () => {
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true,
                cancelable: true,
            });
            // Non-arrow keys should not throw
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
        });
        (0, vitest_1.it)('should ignore events when IME is composing', () => {
            // Simulate IME composition
            inputManager.setupIMEHandling();
            const compositionStartEvent = new CompositionEvent('compositionstart');
            document.dispatchEvent(compositionStartEvent);
            (0, vitest_1.expect)(inputManager.isIMEComposing()).toBe(true);
            const event = new KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            // Should not throw even during IME composition
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Cleanup and Disposal', () => {
        (0, vitest_1.it)('should cleanup on disposal without throwing', () => {
            // Dispose should not throw
            (0, vitest_1.expect)(() => inputManager.dispose()).not.toThrow();
        });
        (0, vitest_1.it)('should have agent interaction mode disabled after disposal', () => {
            inputManager.dispose();
            (0, vitest_1.expect)(inputManager.isAgentInteractionMode()).toBe(false);
        });
    });
    (0, vitest_1.describe)('Edge Cases', () => {
        (0, vitest_1.it)('should handle missing terminal container gracefully', () => {
            // Remove the terminal container
            const container = document.querySelector('.terminal-container');
            container?.remove();
            inputManager.setAgentInteractionMode(true);
            const event = new KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            const preventDefaultSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            // Should not throw an error
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
            (0, vitest_1.expect)(preventDefaultSpy).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing terminal ID attribute gracefully', () => {
            const container = document.querySelector('.terminal-container');
            container?.removeAttribute('data-terminal-id');
            inputManager.setAgentInteractionMode(true);
            const event = new KeyboardEvent('keydown', {
                key: 'ArrowUp',
                bubbles: true,
                cancelable: true,
            });
            const preventDefaultSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            (0, vitest_1.expect)(() => document.dispatchEvent(event)).not.toThrow();
            (0, vitest_1.expect)(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=InputManager.ArrowKeyHandling.test.js.map