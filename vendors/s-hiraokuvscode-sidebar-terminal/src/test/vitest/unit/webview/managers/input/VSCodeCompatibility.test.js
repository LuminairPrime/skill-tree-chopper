"use strict";
/**
 * VS Code Compatibility Pattern TDD Test Suite
 * Following t-wada's TDD methodology for VS Code integration standards
 * RED-GREEN-REFACTOR cycles with focus on VS Code terminal behavior patterns
 * Tests based on VS Code terminal integration requirements and user expectations
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InputEventService_1 = require("../../../../../../webview/managers/input/services/InputEventService");
const InputStateManager_1 = require("../../../../../../webview/managers/input/services/InputStateManager");
// VS Code keybinding patterns that should be respected
const VS_CODE_KEYBINDINGS = {
    // Terminal navigation
    'ctrl+shift+`': 'workbench.action.terminal.new',
    'ctrl+shift+c': 'workbench.action.terminal.openNativeConsole',
    'ctrl+shift+t': 'workbench.action.reopenClosedEditor',
    // Terminal switching
    'ctrl+pagedown': 'workbench.action.terminal.focusNext',
    'ctrl+pageup': 'workbench.action.terminal.focusPrevious',
    'ctrl+1': 'workbench.action.terminal.focusAtIndex1',
    'ctrl+2': 'workbench.action.terminal.focusAtIndex2',
    // Chord commands
    'ctrl+k ctrl+c': 'editor.action.addCommentLine',
    'ctrl+k ctrl+u': 'editor.action.removeCommentLine',
    'ctrl+k ctrl+s': 'workbench.action.openKeyboardShortcuts',
    // Other commands
    'ctrl+,': 'workbench.action.openSettings',
    'ctrl+`': 'workbench.action.terminal.toggleTerminal',
    // Multi-cursor
    'alt+click': 'editor.action.insertCursorAtEndOfEachLineSelected',
    'ctrl+alt+down': 'editor.action.insertCursorBelow',
    'ctrl+alt+up': 'editor.action.insertCursorAbove',
};
// Mock VS Code API patterns
class MockVSCodeTerminalIntegration {
    constructor(eventService, stateManager, element, settings = {}) {
        this.keybindingCallbacks = new Map();
        this.eventService = eventService;
        this.stateManager = stateManager;
        this.element = element;
        this.settings = {
            'terminal.integrated.altClickMovesCursor': true,
            'editor.multiCursorModifier': 'alt',
            'terminal.integrated.sendKeybindingsToShell': false,
            'terminal.integrated.commandsToSkipShell': [],
            'terminal.integrated.allowChords': true,
            'terminal.integrated.allowMnemonics': true,
            'workbench.list.automaticKeyboardNavigation': true,
            'terminal.integrated.macOptionIsMeta': false,
            'terminal.integrated.macOptionClickForcesSelection': false,
            ...settings,
        };
        this.setupVSCodePatterns();
    }
    setupVSCodePatterns() {
        // Alt+Click cursor positioning
        this.eventService.registerEventHandler('vscode-alt-click', this.element, 'click', this.handleAltClick.bind(this), { debounce: false, preventDefault: false });
        // Keyboard navigation patterns
        this.eventService.registerEventHandler('vscode-keydown', this.element, 'keydown', this.handleKeyDown.bind(this), { debounce: false, preventDefault: false });
        // VS Code chord detection
        this.eventService.registerEventHandler('vscode-chord-detection', this.element, 'keydown', this.handleChordDetection.bind(this), { debounce: false });
        // Update state with VS Code settings
        this.stateManager.updateAltClickState({
            isVSCodeAltClickEnabled: this.isAltClickEnabled(),
        });
    }
    isAltClickEnabled() {
        return (this.settings['terminal.integrated.altClickMovesCursor'] === true &&
            this.settings['editor.multiCursorModifier'] === 'alt');
    }
    handleAltClick(event) {
        const mouseEvent = event;
        if (!this.isAltClickEnabled()) {
            return;
        }
        if (mouseEvent.altKey) {
            const altClickState = this.stateManager.getStateSection('altClick');
            this.stateManager.updateAltClickState({
                lastClickPosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
                clickCount: altClickState.clickCount + 1,
            });
            // Simulate cursor positioning
            this.triggerKeybinding('alt+click');
            // Prevent default behavior for Alt+Click
            mouseEvent.preventDefault();
        }
    }
    handleKeyDown(event) {
        const keyEvent = event;
        // Update keyboard state with VS Code patterns
        this.stateManager.updateKeyboardState({
            lastKeyPressed: keyEvent.key,
            modifiers: {
                ctrl: keyEvent.ctrlKey,
                alt: keyEvent.altKey,
                shift: keyEvent.shiftKey,
                meta: keyEvent.metaKey,
            },
            lastKeyTimestamp: Date.now(),
        });
        // Handle VS Code terminal-specific keybindings
        const keybinding = this.getKeybindingString(keyEvent);
        // Check if should send to shell or handle in VS Code
        if (this.shouldSendToShell(keybinding)) {
            // Let terminal handle
            return;
        }
        // Handle VS Code keybinding
        this.handleVSCodeKeybinding(keybinding, keyEvent);
    }
    handleChordDetection(event) {
        const keyEvent = event;
        if (!this.settings['terminal.integrated.allowChords']) {
            return;
        }
        // Detect chord initiation (Ctrl+K)
        if (keyEvent.ctrlKey && keyEvent.key.toLowerCase() === 'k') {
            this.stateManager.updateKeyboardState({
                isInChordMode: true,
            });
            keyEvent.preventDefault();
            return;
        }
        // Handle chord completion
        const keyboardState = this.stateManager.getStateSection('keyboard');
        if (keyboardState.isInChordMode) {
            const chordCommand = `ctrl+k ${keyEvent.key.toLowerCase()}`;
            this.stateManager.updateKeyboardState({
                isInChordMode: false,
            });
            this.handleVSCodeKeybinding(chordCommand, keyEvent);
        }
    }
    getKeybindingString(event) {
        const parts = [];
        if (event.ctrlKey)
            parts.push('ctrl');
        if (event.altKey)
            parts.push('alt');
        if (event.shiftKey)
            parts.push('shift');
        if (event.metaKey)
            parts.push('meta');
        parts.push(event.key.toLowerCase());
        return parts.join('+');
    }
    shouldSendToShell(keybinding) {
        if (!this.settings['terminal.integrated.sendKeybindingsToShell']) {
            return false;
        }
        const skipCommands = this.settings['terminal.integrated.commandsToSkipShell'] || [];
        return !skipCommands.includes(keybinding);
    }
    handleVSCodeKeybinding(keybinding, event) {
        const callback = this.keybindingCallbacks.get(keybinding);
        if (callback) {
            callback();
            event.preventDefault();
        }
    }
    triggerKeybinding(keybinding) {
        const callback = this.keybindingCallbacks.get(keybinding);
        if (callback) {
            callback();
        }
    }
    // Test API methods
    registerKeybindingCallback(keybinding, callback) {
        this.keybindingCallbacks.set(keybinding, callback);
    }
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        // Update state to reflect new settings
        this.stateManager.updateAltClickState({
            isVSCodeAltClickEnabled: this.isAltClickEnabled(),
        });
    }
    getSettings() {
        return { ...this.settings };
    }
    simulateVSCodeCommand(command) {
        // Simulate VS Code command execution
        const keybinding = Object.keys(VS_CODE_KEYBINDINGS).find((key) => VS_CODE_KEYBINDINGS[key] === command);
        if (keybinding) {
            this.triggerKeybinding(keybinding);
        }
    }
}
/**
 * SKIP REASON: These tests rely on timer/debounce behavior that doesn't work correctly
 * with Vitest fake timers + JSDOM event dispatch. The debounce implementation uses
 * real setTimeout calls that don't interact correctly with vi.useFakeTimers().
 * TODO: Investigate using real timers or mocking the debounce implementation directly.
 */
(0, vitest_1.describe)('VS Code Compatibility Pattern TDD Test Suite', () => {
    let terminalElement;
    let eventService;
    let stateManager;
    let vscodeIntegration;
    let logMessages;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        // Set up DOM elements in the existing environment
        document.body.innerHTML = `
      <div class="monaco-workbench">
        <div class="terminal-outer-container">
          <div class="terminal-wrapper">
            <div id="terminal" class="xterm" tabindex="0"></div>
          </div>
        </div>
      </div>
    `;
        // Setup terminal element
        terminalElement = document.getElementById('terminal');
        // Setup services
        logMessages = [];
        const mockLogger = (message) => {
            logMessages.push(message);
        };
        eventService = new InputEventService_1.InputEventService(mockLogger);
        stateManager = new InputStateManager_1.InputStateManager(mockLogger);
        // Setup VS Code integration
        vscodeIntegration = new MockVSCodeTerminalIntegration(eventService, stateManager, terminalElement);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.useRealTimers();
        eventService?.dispose();
        stateManager?.dispose();
        document.body.innerHTML = '';
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('TDD Red Phase: VS Code Alt+Click Integration', () => {
        (0, vitest_1.describe)('Alt+Click Cursor Positioning', () => {
            (0, vitest_1.it)('should enable Alt+Click when VS Code settings are correct', () => {
                // Arrange: Default settings should enable Alt+Click
                const altClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(true);
                // Act: Perform Alt+Click
                const altClickCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('alt+click', altClickCallback);
                const altClickEvent = new MouseEvent('click', {
                    clientX: 100,
                    clientY: 200,
                    altKey: true,
                    bubbles: true,
                    cancelable: true,
                });
                terminalElement.dispatchEvent(altClickEvent);
                // Assert: Should trigger Alt+Click functionality
                (0, vitest_1.expect)(altClickCallback).toHaveBeenCalled();
                const updatedAltClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(updatedAltClickState.lastClickPosition).toEqual({ x: 100, y: 200 });
                (0, vitest_1.expect)(updatedAltClickState.clickCount).toBe(1);
            });
            (0, vitest_1.it)('should disable Alt+Click when VS Code settings are incompatible', () => {
                // Act: Update settings to disable Alt+Click
                vscodeIntegration.updateSettings({
                    'editor.multiCursorModifier': 'ctrlCmd', // Not 'alt'
                });
                // Assert: Should disable Alt+Click
                const altClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(false);
                // Act: Try Alt+Click
                const altClickCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('alt+click', altClickCallback);
                const altClickEvent = new MouseEvent('click', {
                    clientX: 150,
                    clientY: 250,
                    altKey: true,
                });
                terminalElement.dispatchEvent(altClickEvent);
                // Assert: Should not trigger Alt+Click functionality
                (0, vitest_1.expect)(altClickCallback).not.toHaveBeenCalled();
                const updatedAltClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(updatedAltClickState.lastClickPosition).toBeNull();
                (0, vitest_1.expect)(updatedAltClickState.clickCount).toBe(0);
            });
            (0, vitest_1.it)('should handle macOS Option+Click behavior when configured', () => {
                // Act: Configure macOS Option behavior
                vscodeIntegration.updateSettings({
                    'terminal.integrated.macOptionIsMeta': true,
                    'terminal.integrated.macOptionClickForcesSelection': true,
                });
                // Act: Simulate Option+Click on macOS
                const optionClickEvent = new MouseEvent('click', {
                    clientX: 300,
                    clientY: 400,
                    altKey: true, // Alt key represents Option on macOS
                    metaKey: false,
                });
                const selectionCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('alt+click', selectionCallback);
                terminalElement.dispatchEvent(optionClickEvent);
                // Assert: Should handle macOS Option+Click
                (0, vitest_1.expect)(selectionCallback).toHaveBeenCalled();
                const altClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(altClickState.lastClickPosition).toEqual({ x: 300, y: 400 });
            });
            (0, vitest_1.it)('should prevent default Alt+Click behavior when VS Code handles it', () => {
                // Arrange: Mock preventDefault tracking
                let preventDefaultCalled = false;
                const originalPreventDefault = MouseEvent.prototype.preventDefault;
                MouseEvent.prototype.preventDefault = function () {
                    preventDefaultCalled = true;
                    originalPreventDefault.call(this);
                };
                // Act: Perform Alt+Click
                const altClickEvent = new MouseEvent('click', {
                    clientX: 100,
                    clientY: 200,
                    altKey: true,
                    bubbles: true,
                    cancelable: true,
                });
                terminalElement.dispatchEvent(altClickEvent);
                // Assert: Should prevent default behavior
                (0, vitest_1.expect)(preventDefaultCalled).toBe(true);
                // Restore
                MouseEvent.prototype.preventDefault = originalPreventDefault;
            });
        });
        (0, vitest_1.describe)('Multi-Cursor Modifier Integration', () => {
            (0, vitest_1.it)('should respect editor.multiCursorModifier setting', () => {
                // Act: Test different multi-cursor modifiers
                const modifierTests = [
                    { setting: 'alt', expectEnabled: true },
                    { setting: 'ctrlCmd', expectEnabled: false },
                ];
                modifierTests.forEach(({ setting, expectEnabled }) => {
                    vscodeIntegration.updateSettings({
                        'editor.multiCursorModifier': setting,
                    });
                    const altClickState = stateManager.getStateSection('altClick');
                    (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(expectEnabled);
                });
            });
            (0, vitest_1.it)('should handle Alt+Click tracking independent of multi-cursor setting', () => {
                // Act: Disable Alt+Click via multi-cursor setting
                vscodeIntegration.updateSettings({
                    'editor.multiCursorModifier': 'ctrlCmd',
                });
                // Act: Still track Alt key state for other purposes
                const keyEvent = new KeyboardEvent('keydown', {
                    key: 'Alt',
                    altKey: true,
                });
                terminalElement.dispatchEvent(keyEvent);
                // Assert: Should still track Alt key state
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(keyboardState.modifiers.alt).toBe(true);
                // But Alt+Click should be disabled
                const altClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: VS Code Keybinding Integration', () => {
        (0, vitest_1.describe)('Terminal Navigation Keybindings', () => {
            (0, vitest_1.it)('should handle standard VS Code terminal keybindings', () => {
                // Arrange: Register callbacks for terminal commands
                const terminalCallbacks = {
                    newTerminal: vitest_1.vi.fn(),
                    nextTerminal: vitest_1.vi.fn(),
                    prevTerminal: vitest_1.vi.fn(),
                    focusTerminal1: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('ctrl+shift+`', terminalCallbacks.newTerminal);
                vscodeIntegration.registerKeybindingCallback('ctrl+pagedown', terminalCallbacks.nextTerminal);
                vscodeIntegration.registerKeybindingCallback('ctrl+pageup', terminalCallbacks.prevTerminal);
                vscodeIntegration.registerKeybindingCallback('ctrl+1', terminalCallbacks.focusTerminal1);
                // Act: Trigger terminal navigation keys
                const keys = [
                    { key: '`', ctrlKey: true, shiftKey: true, callback: terminalCallbacks.newTerminal },
                    { key: 'PageDown', ctrlKey: true, callback: terminalCallbacks.nextTerminal },
                    { key: 'PageUp', ctrlKey: true, callback: terminalCallbacks.prevTerminal },
                    { key: '1', ctrlKey: true, callback: terminalCallbacks.focusTerminal1 },
                ];
                keys.forEach(({ key, ctrlKey, shiftKey = false, callback }) => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        ctrlKey,
                        shiftKey,
                        bubbles: true,
                        cancelable: true,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    // Assert: Should trigger corresponding callback
                    (0, vitest_1.expect)(callback).toHaveBeenCalled();
                });
            });
            (0, vitest_1.it)('should respect terminal.integrated.sendKeybindingsToShell setting', () => {
                // Act: Configure to send keybindings to shell
                vscodeIntegration.updateSettings({
                    'terminal.integrated.sendKeybindingsToShell': true,
                    'terminal.integrated.commandsToSkipShell': ['ctrl+c', 'ctrl+d'],
                });
                const _shellCallback = vitest_1.vi.fn();
                const vscodeCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('ctrl+l', vscodeCallback);
                // Act: Send Ctrl+L (should go to shell)
                const ctrlL = new KeyboardEvent('keydown', {
                    key: 'l',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlL);
                // Assert: VS Code callback should NOT be triggered (goes to shell)
                (0, vitest_1.expect)(vscodeCallback).not.toHaveBeenCalled();
                // Act: Send Ctrl+C (should be handled by VS Code due to skip list)
                const ctrlC = new KeyboardEvent('keydown', {
                    key: 'c',
                    ctrlKey: true,
                });
                vscodeIntegration.registerKeybindingCallback('ctrl+c', vscodeCallback);
                terminalElement.dispatchEvent(ctrlC);
                // Assert: Should be handled by VS Code (in skip list)
                (0, vitest_1.expect)(vscodeCallback).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should handle keyboard state tracking for VS Code patterns', () => {
                // Act: Trigger various VS Code key combinations
                const keySequences = [
                    { key: 'Tab', shiftKey: true }, // Shift+Tab
                    { key: 'F1', ctrlKey: false }, // F1 (Command palette)
                    { key: 'p', ctrlKey: true, shiftKey: true }, // Ctrl+Shift+P
                    { key: 'Enter', altKey: true }, // Alt+Enter
                ];
                keySequences.forEach(({ key, ctrlKey = false, shiftKey = false, altKey = false }) => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        ctrlKey,
                        shiftKey,
                        altKey,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    // Assert: Keyboard state should be updated correctly
                    const keyboardState = stateManager.getStateSection('keyboard');
                    (0, vitest_1.expect)(keyboardState.lastKeyPressed).toBe(key);
                    (0, vitest_1.expect)(keyboardState.modifiers.ctrl).toBe(ctrlKey);
                    (0, vitest_1.expect)(keyboardState.modifiers.shift).toBe(shiftKey);
                    (0, vitest_1.expect)(keyboardState.modifiers.alt).toBe(altKey);
                });
            });
        });
        (0, vitest_1.describe)('Chord Command Support', () => {
            (0, vitest_1.it)('should handle VS Code chord commands when enabled', () => {
                // Arrange: Enable chord commands
                vscodeIntegration.updateSettings({
                    'terminal.integrated.allowChords': true,
                });
                const chordCallbacks = {
                    addComment: vitest_1.vi.fn(),
                    removeComment: vitest_1.vi.fn(),
                    openKeyboardShortcuts: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('ctrl+k c', chordCallbacks.addComment);
                vscodeIntegration.registerKeybindingCallback('ctrl+k u', chordCallbacks.removeComment);
                vscodeIntegration.registerKeybindingCallback('ctrl+k s', chordCallbacks.openKeyboardShortcuts);
                // Act: Execute chord sequence (Ctrl+K, then C)
                const ctrlK = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                    bubbles: true,
                    cancelable: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                // Assert: Should enter chord mode
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(keyboardState.isInChordMode).toBe(true);
                // Act: Complete chord with 'C'
                const cKey = new KeyboardEvent('keydown', {
                    key: 'c',
                    ctrlKey: false,
                });
                terminalElement.dispatchEvent(cKey);
                // Assert: Should execute chord command and exit chord mode
                (0, vitest_1.expect)(chordCallbacks.addComment).toHaveBeenCalled();
                const finalKeyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(finalKeyboardState.isInChordMode).toBe(false);
            });
            (0, vitest_1.it)('should disable chord commands when setting is false', () => {
                // Act: Disable chord commands
                vscodeIntegration.updateSettings({
                    'terminal.integrated.allowChords': false,
                });
                const chordCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('ctrl+k c', chordCallback);
                // Act: Try chord sequence
                const ctrlK = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                // Assert: Should NOT enter chord mode
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(keyboardState.isInChordMode).toBe(false);
                // Chord callback should not be triggered
                (0, vitest_1.expect)(chordCallback).not.toHaveBeenCalled();
            });
            (0, vitest_1.it)('should handle chord timeout and cancellation', () => {
                // Arrange: Enable chords
                vscodeIntegration.updateSettings({
                    'terminal.integrated.allowChords': true,
                });
                // Act: Start chord sequence
                const ctrlK = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                (0, vitest_1.expect)(stateManager.getStateSection('keyboard').isInChordMode).toBe(true);
                // Act: Press Escape to cancel chord
                const escKey = new KeyboardEvent('keydown', {
                    key: 'Escape',
                });
                terminalElement.dispatchEvent(escKey);
                // Assert: Should exit chord mode
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(keyboardState.isInChordMode).toBe(false);
            });
            (0, vitest_1.it)('should track chord mode as critical state', () => {
                // Act: Enter chord mode
                const ctrlK = new KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                // Assert: Should report critical state
                (0, vitest_1.expect)(stateManager.hasCriticalStateActive()).toBe(true);
                // Act: Exit chord mode
                const cKey = new KeyboardEvent('keydown', {
                    key: 'c',
                });
                terminalElement.dispatchEvent(cKey);
                // Assert: Should not report critical state
                (0, vitest_1.expect)(stateManager.hasCriticalStateActive()).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: VS Code Terminal Behavior Patterns', () => {
        (0, vitest_1.describe)('Terminal Focus and Navigation', () => {
            (0, vitest_1.it)('should handle automatic keyboard navigation when enabled', () => {
                // Act: Enable automatic keyboard navigation
                vscodeIntegration.updateSettings({
                    'workbench.list.automaticKeyboardNavigation': true,
                });
                const navigationCallback = vitest_1.vi.fn();
                vscodeIntegration.registerKeybindingCallback('ctrl+pagedown', navigationCallback);
                // Act: Use navigation keys
                const navigationKey = new KeyboardEvent('keydown', {
                    key: 'PageDown',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(navigationKey);
                // Assert: Should trigger navigation
                (0, vitest_1.expect)(navigationCallback).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should respect terminal focus patterns', () => {
                // Act: Test focus-related keyboard events
                const focusEvents = [
                    { key: 'Tab', expectFocusChange: false }, // Should stay in terminal
                    { key: 'F6', expectFocusChange: true }, // Should change focus area
                    { key: 'Tab', ctrlKey: true, expectFocusChange: true }, // Should change tab/terminal
                ];
                focusEvents.forEach(({ key, ctrlKey = false, expectFocusChange: _expectFocusChange }) => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        ctrlKey,
                        bubbles: true,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    // Check that keyboard state is tracked
                    const keyboardState = stateManager.getStateSection('keyboard');
                    (0, vitest_1.expect)(keyboardState.lastKeyPressed).toBe(key);
                });
            });
            (0, vitest_1.it)('should handle terminal splitting and management keys', () => {
                // Arrange: Register terminal management callbacks
                const managementCallbacks = {
                    splitTerminal: vitest_1.vi.fn(),
                    killTerminal: vitest_1.vi.fn(),
                    renameTerminal: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('ctrl+shift+5', managementCallbacks.splitTerminal);
                vscodeIntegration.registerKeybindingCallback('ctrl+shift+w', managementCallbacks.killTerminal);
                vscodeIntegration.registerKeybindingCallback('f2', managementCallbacks.renameTerminal);
                // Act: Use terminal management keys
                const managementKeys = [
                    { key: '5', ctrlKey: true, shiftKey: true, callback: managementCallbacks.splitTerminal },
                    { key: 'w', ctrlKey: true, shiftKey: true, callback: managementCallbacks.killTerminal },
                    { key: 'F2', callback: managementCallbacks.renameTerminal },
                ];
                managementKeys.forEach(({ key, ctrlKey = false, shiftKey = false, callback }) => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        ctrlKey,
                        shiftKey,
                        bubbles: true,
                        cancelable: true,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    (0, vitest_1.expect)(callback).toHaveBeenCalled();
                });
            });
        });
        (0, vitest_1.describe)('Terminal Settings Integration', () => {
            (0, vitest_1.it)('should dynamically update behavior when settings change', () => {
                // Arrange: Start with Alt+Click enabled
                (0, vitest_1.expect)(stateManager.getStateSection('altClick').isVSCodeAltClickEnabled).toBe(true);
                // Act: Change settings to disable Alt+Click
                vscodeIntegration.updateSettings({
                    'terminal.integrated.altClickMovesCursor': false,
                });
                // Assert: Should immediately reflect setting change
                (0, vitest_1.expect)(stateManager.getStateSection('altClick').isVSCodeAltClickEnabled).toBe(false);
                // Act: Re-enable Alt+Click
                vscodeIntegration.updateSettings({
                    'terminal.integrated.altClickMovesCursor': true,
                });
                // Assert: Should re-enable functionality
                (0, vitest_1.expect)(stateManager.getStateSection('altClick').isVSCodeAltClickEnabled).toBe(true);
            });
            (0, vitest_1.it)('should handle complex setting combinations', () => {
                // Act: Test various setting combinations
                const settingCombinations = [
                    {
                        settings: {
                            'terminal.integrated.altClickMovesCursor': true,
                            'editor.multiCursorModifier': 'alt',
                        },
                        expectAltClick: true,
                    },
                    {
                        settings: {
                            'terminal.integrated.altClickMovesCursor': true,
                            'editor.multiCursorModifier': 'ctrlCmd',
                        },
                        expectAltClick: false,
                    },
                    {
                        settings: {
                            'terminal.integrated.altClickMovesCursor': false,
                            'editor.multiCursorModifier': 'alt',
                        },
                        expectAltClick: false,
                    },
                ];
                settingCombinations.forEach(({ settings, expectAltClick }) => {
                    vscodeIntegration.updateSettings(settings);
                    const altClickState = stateManager.getStateSection('altClick');
                    (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(expectAltClick);
                });
            });
            (0, vitest_1.it)('should validate setting changes through event processing', () => {
                // Arrange: Track setting-related state changes
                const settingChanges = [];
                stateManager.addStateListener('altClick', (newState, previousState) => {
                    settingChanges.push({
                        from: previousState.isVSCodeAltClickEnabled,
                        to: newState.isVSCodeAltClickEnabled,
                    });
                });
                // Act: Toggle Alt+Click setting multiple times
                vscodeIntegration.updateSettings({ 'terminal.integrated.altClickMovesCursor': false });
                vscodeIntegration.updateSettings({ 'terminal.integrated.altClickMovesCursor': true });
                vscodeIntegration.updateSettings({ 'editor.multiCursorModifier': 'ctrlCmd' });
                // Assert: Should track all setting changes
                (0, vitest_1.expect)(settingChanges.length).toBe(3);
                (0, vitest_1.expect)(settingChanges[0].from).toBe(true);
                (0, vitest_1.expect)(settingChanges[0].to).toBe(false);
                (0, vitest_1.expect)(settingChanges[1].from).toBe(false);
                (0, vitest_1.expect)(settingChanges[1].to).toBe(true);
                (0, vitest_1.expect)(settingChanges[2].to).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: VS Code Extension Integration Patterns', () => {
        (0, vitest_1.describe)('Command Execution and Interaction', () => {
            (0, vitest_1.it)('should simulate VS Code command execution patterns', () => {
                // Arrange: Register command callbacks
                const commandCallbacks = {
                    openSettings: vitest_1.vi.fn(),
                    openKeyboardShortcuts: vitest_1.vi.fn(),
                    toggleTerminal: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('ctrl+,', commandCallbacks.openSettings);
                vscodeIntegration.registerKeybindingCallback('ctrl+k ctrl+s', commandCallbacks.openKeyboardShortcuts);
                vscodeIntegration.registerKeybindingCallback('ctrl+`', commandCallbacks.toggleTerminal);
                // Act: Simulate command execution
                vscodeIntegration.simulateVSCodeCommand('workbench.action.openSettings');
                vscodeIntegration.simulateVSCodeCommand('workbench.action.openKeyboardShortcuts');
                vscodeIntegration.simulateVSCodeCommand('workbench.action.terminal.toggleTerminal');
                // Assert: Commands should be executed
                (0, vitest_1.expect)(commandCallbacks.openSettings).toHaveBeenCalled();
                (0, vitest_1.expect)(commandCallbacks.openKeyboardShortcuts).toHaveBeenCalled();
                (0, vitest_1.expect)(commandCallbacks.toggleTerminal).toHaveBeenCalled();
            });
            (0, vitest_1.it)('should handle VS Code extension integration points', () => {
                // Act: Test extension-like behavior patterns
                const extensionCallbacks = {
                    formatDocument: vitest_1.vi.fn(),
                    quickOpen: vitest_1.vi.fn(),
                    commandPalette: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('alt+shift+f', extensionCallbacks.formatDocument);
                vscodeIntegration.registerKeybindingCallback('ctrl+p', extensionCallbacks.quickOpen);
                vscodeIntegration.registerKeybindingCallback('ctrl+shift+p', extensionCallbacks.commandPalette);
                // Simulate extension keybindings
                const extensionKeys = [
                    { key: 'f', shiftKey: true, altKey: true, callback: extensionCallbacks.formatDocument },
                    { key: 'p', ctrlKey: true, callback: extensionCallbacks.quickOpen },
                    { key: 'p', ctrlKey: true, shiftKey: true, callback: extensionCallbacks.commandPalette },
                ];
                extensionKeys.forEach(({ key, ctrlKey = false, shiftKey = false, altKey = false, callback }) => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key,
                        ctrlKey,
                        shiftKey,
                        altKey,
                        bubbles: true,
                        cancelable: true,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    (0, vitest_1.expect)(callback).toHaveBeenCalled();
                });
            });
        });
        (0, vitest_1.describe)('Performance and Resource Management', () => {
            (0, vitest_1.it)('should handle high-frequency VS Code interaction efficiently', () => {
                // Act: Generate high-frequency VS Code-style interactions
                const startTime = Date.now();
                for (let i = 0; i < 1000; i++) {
                    // Simulate rapid key combinations
                    const keyEvent = new KeyboardEvent('keydown', {
                        key: String.fromCharCode(65 + (i % 26)), // A-Z
                        ctrlKey: i % 3 === 0,
                        shiftKey: i % 5 === 0,
                        altKey: i % 7 === 0,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    // Occasional Alt+Click
                    if (i % 50 === 0) {
                        const clickEvent = new MouseEvent('click', {
                            clientX: i % 500,
                            clientY: i % 300,
                            altKey: true,
                        });
                        terminalElement.dispatchEvent(clickEvent);
                    }
                }
                const endTime = Date.now();
                // Assert: Should handle high frequency efficiently
                const metrics = eventService.getGlobalMetrics();
                (0, vitest_1.expect)(metrics.totalProcessed).toBeGreaterThan(1000);
                (0, vitest_1.expect)(endTime - startTime).toBeLessThan(2000); // Less than 2 seconds
                // Assert: State should remain consistent
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, vitest_1.expect)(typeof keyboardState.lastKeyPressed).toBe('string');
            });
            (0, vitest_1.it)('should maintain VS Code compatibility under load', () => {
                // Act: Simulate sustained VS Code usage patterns
                let altClickCount = 0;
                let chordCommandCount = 0;
                vscodeIntegration.registerKeybindingCallback('alt+click', () => altClickCount++);
                vscodeIntegration.registerKeybindingCallback('ctrl+k c', () => chordCommandCount++);
                // Sustained usage simulation
                for (let session = 0; session < 10; session++) {
                    // Alt+Click session
                    for (let i = 0; i < 20; i++) {
                        const clickEvent = new MouseEvent('click', {
                            clientX: 100 + i,
                            clientY: 200 + i,
                            altKey: true,
                        });
                        terminalElement.dispatchEvent(clickEvent);
                    }
                    // Chord command session
                    for (let i = 0; i < 5; i++) {
                        const ctrlK = new KeyboardEvent('keydown', {
                            key: 'k',
                            ctrlKey: true,
                        });
                        const cKey = new KeyboardEvent('keydown', {
                            key: 'c',
                        });
                        terminalElement.dispatchEvent(ctrlK);
                        terminalElement.dispatchEvent(cKey);
                    }
                }
                // Assert: All interactions should be processed correctly
                (0, vitest_1.expect)(altClickCount).toBe(200); // 10 sessions × 20 clicks
                (0, vitest_1.expect)(chordCommandCount).toBe(50); // 10 sessions × 5 chords
                // Assert: Performance metrics should be reasonable
                const health = eventService.getHealthStatus();
                (0, vitest_1.expect)(health.isHealthy).toBe(true);
                (0, vitest_1.expect)(health.errorRate).toBeLessThan(0.01); // Less than 1% error rate
            });
        });
    });
    (0, vitest_1.describe)('TDD Red Phase: Error Handling and Edge Cases', () => {
        (0, vitest_1.describe)('VS Code Integration Error Scenarios', () => {
            (0, vitest_1.it)('should handle malformed VS Code events gracefully', () => {
                // Act: Send malformed events
                const malformedEvents = [
                    new KeyboardEvent('keydown', { key: null }),
                    new KeyboardEvent('keydown', { key: undefined }),
                    new MouseEvent('click', { clientX: NaN, clientY: NaN }),
                ];
                malformedEvents.forEach((event) => {
                    (0, vitest_1.expect)(() => {
                        terminalElement.dispatchEvent(event);
                    }).not.toThrow();
                });
                // Assert: Should handle gracefully without errors
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('error'));
                (0, vitest_1.expect)(errorLogs.length).toBe(0);
            });
            (0, vitest_1.it)('should recover from VS Code setting conflicts', () => {
                // Act: Create conflicting settings
                vscodeIntegration.updateSettings({
                    'terminal.integrated.altClickMovesCursor': true,
                    'editor.multiCursorModifier': 'alt',
                    // Conflicting: send to shell but also handle in VS Code
                    'terminal.integrated.sendKeybindingsToShell': true,
                    'terminal.integrated.commandsToSkipShell': [],
                });
                // Should still maintain consistent state
                const altClickState = stateManager.getStateSection('altClick');
                (0, vitest_1.expect)(altClickState.isVSCodeAltClickEnabled).toBe(true);
                // Should handle events without throwing
                (0, vitest_1.expect)(() => {
                    const keyEvent = new KeyboardEvent('keydown', {
                        key: 'l',
                        ctrlKey: true,
                    });
                    terminalElement.dispatchEvent(keyEvent);
                }).not.toThrow();
            });
        });
        (0, vitest_1.describe)('Resource Cleanup and Disposal', () => {
            (0, vitest_1.it)('should clean up VS Code integration resources on disposal', () => {
                // Arrange: Create active VS Code interactions
                const callbacks = {
                    altClick: vitest_1.vi.fn(),
                    chord: vitest_1.vi.fn(),
                    navigation: vitest_1.vi.fn(),
                };
                vscodeIntegration.registerKeybindingCallback('alt+click', callbacks.altClick);
                vscodeIntegration.registerKeybindingCallback('ctrl+k c', callbacks.chord);
                vscodeIntegration.registerKeybindingCallback('ctrl+pagedown', callbacks.navigation);
                // Generate some activity
                const clickEvent = new MouseEvent('click', {
                    clientX: 100,
                    clientY: 200,
                    altKey: true,
                });
                terminalElement.dispatchEvent(clickEvent);
                // Act: Dispose services
                eventService.dispose();
                stateManager.dispose();
                // Act: Try to trigger events after disposal
                terminalElement.dispatchEvent(clickEvent);
                // Assert: Callbacks should not be triggered after disposal
                (0, vitest_1.expect)(callbacks.altClick).toHaveBeenCalledTimes(1); // Only the initial call
            });
        });
    });
});
//# sourceMappingURL=VSCodeCompatibility.test.js.map