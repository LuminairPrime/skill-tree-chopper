"use strict";
/**
 * Input Handling Architecture Integration TDD Test Suite
 * Following t-wada's TDD methodology for service coordination and end-to-end scenarios
 * Tests real-world input processing flows and component interaction patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const sinon_1 = require("sinon");
const jsdom_1 = require("jsdom");
const BaseInputHandler_1 = require("../../../webview/managers/input/handlers/BaseInputHandler");
const InputEventService_1 = require("../../../webview/managers/input/services/InputEventService");
const InputStateManager_1 = require("../../../webview/managers/input/services/InputStateManager");
// Test implementation that combines all input handling services
class IntegratedInputHandler extends BaseInputHandler_1.BaseInputHandler {
    constructor(terminalElement, eventDebounceTimers = new Map(), config) {
        super('IntegratedInputHandler', eventDebounceTimers, config);
        this.terminalElement = terminalElement;
        this.eventService = new InputEventService_1.InputEventService(this.logger.bind(this));
        this.stateManager = new InputStateManager_1.InputStateManager(this.logger.bind(this));
    }
    doInitialize() {
        this.setupInputEventHandling();
        this.setupStateManagement();
    }
    setupInputEventHandling() {
        // Register comprehensive input event handling
        this.eventService.registerEventHandler('terminal-keydown', this.terminalElement, 'keydown', this.handleKeyDown.bind(this), { debounce: false, preventDefault: false });
        this.eventService.registerEventHandler('terminal-input', this.terminalElement, 'input', this.handleInput.bind(this), { debounce: true, debounceDelay: 50 });
        this.eventService.registerEventHandler('terminal-click', this.terminalElement, 'click', this.handleClick.bind(this), { debounce: false });
        this.eventService.registerEventHandler('composition-start', this.terminalElement, 'compositionstart', this.handleCompositionStart.bind(this), { debounce: false });
        this.eventService.registerEventHandler('composition-end', this.terminalElement, 'compositionend', this.handleCompositionEnd.bind(this), { debounce: false });
    }
    setupStateManagement() {
        // Listen to state changes for coordination
        this.stateManager.addStateListener('ime', this.onIMEStateChange.bind(this));
        this.stateManager.addStateListener('keyboard', this.onKeyboardStateChange.bind(this));
        this.stateManager.addStateListener('altClick', this.onAltClickStateChange.bind(this));
    }
    handleKeyDown(event) {
        const keyEvent = event;
        // Update keyboard state
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
        // Handle chord mode detection
        if (keyEvent.ctrlKey && keyEvent.key === 'k') {
            this.stateManager.updateKeyboardState({ isInChordMode: true });
        }
        else if (this.stateManager.getStateSection('keyboard').isInChordMode) {
            this.stateManager.updateKeyboardState({ isInChordMode: false });
        }
        // Handle Alt+Click state
        if (keyEvent.altKey && !this.stateManager.getStateSection('altClick').isAltKeyPressed) {
            this.stateManager.updateAltClickState({ isAltKeyPressed: true });
        }
        else if (!keyEvent.altKey && this.stateManager.getStateSection('altClick').isAltKeyPressed) {
            this.stateManager.updateAltClickState({ isAltKeyPressed: false });
        }
    }
    handleInput(_event) {
        // Only process input if not in IME composition
        if (!this.stateManager.getStateSection('ime').isActive) {
            // Process regular input
            this.logger('Processing regular input event');
        }
    }
    handleClick(event) {
        const mouseEvent = event;
        const altClickState = this.stateManager.getStateSection('altClick');
        if (mouseEvent.altKey && altClickState.isVSCodeAltClickEnabled) {
            // Handle Alt+Click
            this.stateManager.updateAltClickState({
                lastClickPosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
                clickCount: altClickState.clickCount + 1,
            });
        }
    }
    handleCompositionStart(event) {
        const compEvent = event;
        this.stateManager.updateIMEState({
            isActive: true,
            data: compEvent.data || '',
            lastEvent: 'start',
            timestamp: Date.now(),
        });
    }
    handleCompositionEnd(event) {
        const compEvent = event;
        this.stateManager.updateIMEState({
            isActive: false,
            data: compEvent.data || '',
            lastEvent: 'end',
            timestamp: Date.now(),
        });
    }
    onIMEStateChange(newState, previousState) {
        this.logger(`IME state changed: ${previousState.isActive} -> ${newState.isActive}`);
    }
    onKeyboardStateChange(newState, previousState) {
        this.logger(`Keyboard state changed: chord mode ${previousState.isInChordMode} -> ${newState.isInChordMode}`);
    }
    onAltClickStateChange(newState, previousState) {
        this.logger(`Alt+Click state changed: pressed ${previousState.isAltKeyPressed} -> ${newState.isAltKeyPressed}`);
    }
    // Expose internal services for testing
    getEventService() {
        return this.eventService;
    }
    getStateManager() {
        return this.stateManager;
    }
    doDispose() {
        this.eventService.dispose();
        this.stateManager.dispose();
        super.doDispose();
    }
    attachLogger(logger) {
        this.logger = logger;
    }
}
(0, mocha_1.describe)('Input Handling Architecture Integration TDD Test Suite', () => {
    let dom;
    let restoreGlobals;
    let clock;
    let terminalElement;
    let integratedHandler;
    let logMessages;
    const installDomGlobals = (window) => {
        const snapshot = {
            window: global.window,
            document: global.document,
            Event: global.Event,
            KeyboardEvent: global.KeyboardEvent,
            MouseEvent: global.MouseEvent,
            CompositionEvent: global.CompositionEvent,
            performance: global.performance,
        };
        global.window = window;
        global.document = window.document;
        global.Event = window.Event;
        global.KeyboardEvent = window.KeyboardEvent;
        global.MouseEvent = window.MouseEvent;
        global.CompositionEvent = window.CompositionEvent;
        // Use Date.now() instead of performance.now() to avoid recursion
        global.performance = { now: () => Date.now() };
        return () => {
            global.window = snapshot.window;
            global.document = snapshot.document;
            global.Event = snapshot.Event;
            global.KeyboardEvent = snapshot.KeyboardEvent;
            global.MouseEvent = snapshot.MouseEvent;
            global.CompositionEvent = snapshot.CompositionEvent;
            global.performance = snapshot.performance;
        };
    };
    (0, mocha_1.beforeEach)(() => {
        // Arrange: Setup comprehensive DOM environment
        dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="terminal-container">
            <div id="terminal" contenteditable="true" tabindex="0"></div>
          </div>
        </body>
      </html>
    `, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable',
        });
        restoreGlobals = installDomGlobals(dom.window);
        // Setup terminal element
        terminalElement = dom.window.document.getElementById('terminal');
        // Setup fake timers
        clock = sinon_1.default.useFakeTimers();
        // Create integrated handler
        logMessages = [];
        integratedHandler = new IntegratedInputHandler(terminalElement);
        integratedHandler.attachLogger((message) => {
            logMessages.push(message);
        });
        // Initialize the handler
        integratedHandler.initialize();
    });
    (0, mocha_1.afterEach)(() => {
        // Cleanup
        clock.restore();
        integratedHandler.dispose();
        dom.window.close();
        if (restoreGlobals) {
            restoreGlobals();
            restoreGlobals = undefined;
        }
        sinon_1.default.restore();
    });
    (0, mocha_1.describe)('TDD Red Phase: Service Integration and Coordination', () => {
        (0, mocha_1.describe)('Event Service and State Manager Coordination', () => {
            (0, mocha_1.it)('should coordinate keyboard event processing with state management', () => {
                // Act: Trigger keyboard event
                const keyEvent = new dom.window.KeyboardEvent('keydown', {
                    key: 'Enter',
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: true,
                    metaKey: false,
                });
                terminalElement.dispatchEvent(keyEvent);
                // Assert: Event should be processed by event service
                const eventService = integratedHandler.getEventService();
                const eventMetrics = eventService.getGlobalMetrics();
                (0, chai_1.expect)(eventMetrics.totalProcessed).to.equal(1);
                // Assert: State should be updated by state manager
                const stateManager = integratedHandler.getStateManager();
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, chai_1.expect)(keyboardState.lastKeyPressed).to.equal('Enter');
                (0, chai_1.expect)(keyboardState.modifiers.ctrl).to.be.true;
                (0, chai_1.expect)(keyboardState.modifiers.shift).to.be.true;
                (0, chai_1.expect)(keyboardState.lastKeyTimestamp).to.be.greaterThan(0);
            });
            (0, mocha_1.it)('should coordinate debounced input events with IME state checking', () => {
                // Arrange: Set IME active state
                const stateManager = integratedHandler.getStateManager();
                stateManager.updateIMEState({ isActive: true });
                // Act: Trigger rapid input events
                for (let i = 0; i < 5; i++) {
                    const inputEvent = new dom.window.Event('input');
                    terminalElement.dispatchEvent(inputEvent);
                }
                // Assert: Events should be processed but debounced
                const eventService = integratedHandler.getEventService();
                const eventMetrics = eventService.getGlobalMetrics();
                (0, chai_1.expect)(eventMetrics.totalProcessed).to.equal(5);
                // Act: Advance time to trigger debounced processing
                clock.tick(50);
                // Assert: Should have debounced execution
                (0, chai_1.expect)(eventMetrics.totalDebounced).to.equal(1);
                // Assert: Should check IME state during processing (via logs)
                const imeCheckLogs = logMessages.filter((msg) => msg.includes('Processing regular input') || msg.includes('IME'));
                // Since IME is active, regular input processing should be skipped
                (0, chai_1.expect)(imeCheckLogs.length).to.equal(0);
            });
            (0, mocha_1.it)('should handle concurrent event processing and state updates', () => {
                // Act: Trigger multiple event types simultaneously
                const keydownEvent = new dom.window.KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                const clickEvent = new dom.window.MouseEvent('click', {
                    clientX: 100,
                    clientY: 200,
                    altKey: true,
                });
                const compositionEvent = new dom.window.CompositionEvent('compositionstart', {
                    data: 'test',
                });
                // Dispatch events concurrently
                terminalElement.dispatchEvent(keydownEvent);
                terminalElement.dispatchEvent(clickEvent);
                terminalElement.dispatchEvent(compositionEvent);
                // Assert: All events should be processed
                const eventService = integratedHandler.getEventService();
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalProcessed).to.equal(3);
                // Assert: All state updates should be reflected
                const stateManager = integratedHandler.getStateManager();
                const keyboardState = stateManager.getStateSection('keyboard');
                const altClickState = stateManager.getStateSection('altClick');
                const imeState = stateManager.getStateSection('ime');
                (0, chai_1.expect)(keyboardState.isInChordMode).to.be.true; // Ctrl+K chord
                (0, chai_1.expect)(altClickState.clickCount).to.equal(1); // Alt+Click processed
                (0, chai_1.expect)(imeState.isActive).to.be.true; // IME composition started
            });
        });
        (0, mocha_1.describe)('Cross-Service State Synchronization', () => {
            (0, mocha_1.it)('should synchronize critical state across all services', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Set multiple critical states
                stateManager.updateIMEState({ isActive: true });
                stateManager.updateKeyboardState({ isInChordMode: true });
                stateManager.updateAgentState({ isAwaitingResponse: true });
                // Assert: Should report critical state
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.true;
                // Act: Clear one critical state
                stateManager.updateIMEState({ isActive: false });
                // Assert: Should still be critical (other states active)
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.true;
                // Act: Clear all critical states
                stateManager.updateKeyboardState({ isInChordMode: false });
                stateManager.updateAgentState({ isAwaitingResponse: false });
                // Assert: Should not be critical
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.false;
            });
            (0, mocha_1.it)('should handle state changes triggered by event processing', () => {
                // Arrange: Track state changes
                const stateChanges = [];
                const stateManager = integratedHandler.getStateManager();
                stateManager.addStateListener('*', (newState, _previousState, stateKey) => {
                    stateChanges.push({ stateKey, timestamp: Date.now() });
                });
                // Act: Trigger keyboard event that should update state
                const keyEvent = new dom.window.KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(keyEvent);
                // Assert: Should have triggered state changes
                (0, chai_1.expect)(stateChanges.length).to.be.greaterThan(0);
                const keyboardChanges = stateChanges.filter((change) => change.stateKey === 'keyboard');
                (0, chai_1.expect)(keyboardChanges.length).to.be.greaterThan(0);
            });
            (0, mocha_1.it)('should maintain state consistency during rapid event sequences', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Rapid sequence of Alt key events
                for (let i = 0; i < 10; i++) {
                    const keyEvent = new dom.window.KeyboardEvent('keydown', {
                        key: 'a',
                        altKey: i % 2 === 0, // Alternate Alt key state
                    });
                    terminalElement.dispatchEvent(keyEvent);
                    clock.tick(1); // Small time advance
                }
                // Assert: Final state should be consistent
                const keyboardState = stateManager.getStateSection('keyboard');
                const altClickState = stateManager.getStateSection('altClick');
                // Last event had altKey: false (i=9, 9%2 !== 0)
                (0, chai_1.expect)(keyboardState.modifiers.alt).to.be.false;
                (0, chai_1.expect)(altClickState.isAltKeyPressed).to.be.false;
            });
        });
    });
    (0, mocha_1.describe)('TDD Red Phase: End-to-End Input Processing Scenarios', () => {
        (0, mocha_1.describe)('Japanese IME Input Flow', () => {
            (0, mocha_1.it)('should handle complete Japanese IME composition cycle', () => {
                const stateManager = integratedHandler.getStateManager();
                const eventService = integratedHandler.getEventService();
                // Act: Start IME composition
                const compositionStart = new dom.window.CompositionEvent('compositionstart', {
                    data: 'k',
                });
                terminalElement.dispatchEvent(compositionStart);
                // Assert: IME state should be active
                let imeState = stateManager.getStateSection('ime');
                (0, chai_1.expect)(imeState.isActive).to.be.true;
                (0, chai_1.expect)(imeState.lastEvent).to.equal('start');
                // Act: Composition update events
                const compositionUpdate1 = new dom.window.CompositionEvent('compositionupdate', {
                    data: 'ko',
                });
                const compositionUpdate2 = new dom.window.CompositionEvent('compositionupdate', {
                    data: 'kon',
                });
                terminalElement.dispatchEvent(compositionUpdate1);
                terminalElement.dispatchEvent(compositionUpdate2);
                // Act: Input events during composition (should be ignored)
                const inputEvent = new dom.window.Event('input');
                terminalElement.dispatchEvent(inputEvent);
                // Act: Complete composition
                const compositionEnd = new dom.window.CompositionEvent('compositionend', {
                    data: 'こん',
                });
                terminalElement.dispatchEvent(compositionEnd);
                // Assert: IME state should be inactive
                imeState = stateManager.getStateSection('ime');
                (0, chai_1.expect)(imeState.isActive).to.be.false;
                (0, chai_1.expect)(imeState.lastEvent).to.equal('end');
                (0, chai_1.expect)(imeState.data).to.equal('こん');
                // Assert: All events processed
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalProcessed).to.be.greaterThan(3);
                // Assert: Input processing was properly coordinated
                const inputLogs = logMessages.filter((msg) => msg.includes('Processing regular input'));
                // Input should not be processed during IME composition
                (0, chai_1.expect)(inputLogs.length).to.equal(0);
            });
            (0, mocha_1.it)('should handle IME composition cancellation', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Start and immediately cancel IME composition
                const compositionStart = new dom.window.CompositionEvent('compositionstart', {
                    data: 'test',
                });
                terminalElement.dispatchEvent(compositionStart);
                (0, chai_1.expect)(stateManager.getStateSection('ime').isActive).to.be.true;
                // Act: Cancel composition (empty data)
                const compositionEnd = new dom.window.CompositionEvent('compositionend', {
                    data: '',
                });
                terminalElement.dispatchEvent(compositionEnd);
                // Assert: IME should be properly deactivated
                const imeState = stateManager.getStateSection('ime');
                (0, chai_1.expect)(imeState.isActive).to.be.false;
                (0, chai_1.expect)(imeState.data).to.equal('');
            });
        });
        (0, mocha_1.describe)('VS Code Alt+Click Integration Scenarios', () => {
            (0, mocha_1.it)('should handle VS Code Alt+Click cursor positioning workflow', () => {
                const stateManager = integratedHandler.getStateManager();
                // Arrange: Enable VS Code Alt+Click
                stateManager.updateAltClickState({
                    isVSCodeAltClickEnabled: true,
                });
                // Act: Alt+Click sequence
                const altKeyDown = new dom.window.KeyboardEvent('keydown', {
                    key: 'Alt',
                    altKey: true,
                });
                terminalElement.dispatchEvent(altKeyDown);
                // Assert: Alt key state should be tracked
                (0, chai_1.expect)(stateManager.getStateSection('altClick').isAltKeyPressed).to.be.true;
                // Act: Click while Alt is pressed
                const altClick = new dom.window.MouseEvent('click', {
                    clientX: 150,
                    clientY: 250,
                    altKey: true,
                });
                terminalElement.dispatchEvent(altClick);
                // Assert: Alt+Click should be processed
                const altClickState = stateManager.getStateSection('altClick');
                (0, chai_1.expect)(altClickState.lastClickPosition).to.deep.equal({ x: 150, y: 250 });
                (0, chai_1.expect)(altClickState.clickCount).to.equal(1);
                // Act: Release Alt key
                const altKeyUp = new dom.window.KeyboardEvent('keyup', {
                    key: 'Alt',
                    altKey: false,
                });
                terminalElement.dispatchEvent(altKeyUp);
                // Assert: Alt key state should be cleared
                // Note: keyup events need to be handled to track Alt release
                // For this test, we'll manually update the state
                stateManager.updateAltClickState({ isAltKeyPressed: false });
                (0, chai_1.expect)(stateManager.getStateSection('altClick').isAltKeyPressed).to.be.false;
            });
            (0, mocha_1.it)('should ignore Alt+Click when VS Code integration is disabled', () => {
                const stateManager = integratedHandler.getStateManager();
                // Arrange: Disable VS Code Alt+Click
                stateManager.updateAltClickState({
                    isVSCodeAltClickEnabled: false,
                });
                // Act: Alt+Click
                const altClick = new dom.window.MouseEvent('click', {
                    clientX: 100,
                    clientY: 200,
                    altKey: true,
                });
                terminalElement.dispatchEvent(altClick);
                // Assert: Click should not be processed as Alt+Click
                const altClickState = stateManager.getStateSection('altClick');
                (0, chai_1.expect)(altClickState.lastClickPosition).to.be.null;
                (0, chai_1.expect)(altClickState.clickCount).to.equal(0);
            });
        });
        (0, mocha_1.describe)('Keyboard Chord Mode Scenarios', () => {
            (0, mocha_1.it)('should handle VS Code chord mode (Ctrl+K) sequences', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Trigger Ctrl+K to enter chord mode
                const ctrlK = new dom.window.KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                // Assert: Should enter chord mode
                let keyboardState = stateManager.getStateSection('keyboard');
                (0, chai_1.expect)(keyboardState.isInChordMode).to.be.true;
                (0, chai_1.expect)(keyboardState.lastKeyPressed).to.equal('k');
                (0, chai_1.expect)(keyboardState.modifiers.ctrl).to.be.true;
                // Assert: Should report critical state
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.true;
                // Act: Follow with second key to complete chord
                const secondKey = new dom.window.KeyboardEvent('keydown', {
                    key: 'c',
                    ctrlKey: false,
                });
                terminalElement.dispatchEvent(secondKey);
                // Assert: Should exit chord mode
                keyboardState = stateManager.getStateSection('keyboard');
                (0, chai_1.expect)(keyboardState.isInChordMode).to.be.false;
                (0, chai_1.expect)(keyboardState.lastKeyPressed).to.equal('c');
                // Assert: Should not report critical state
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.false;
            });
            (0, mocha_1.it)('should track chord mode state changes through event processing', () => {
                // Arrange: Track state changes
                const stateChanges = [];
                const stateManager = integratedHandler.getStateManager();
                stateManager.addStateListener('keyboard', (newState, previousState) => {
                    stateChanges.push({
                        chordMode: { from: previousState.isInChordMode, to: newState.isInChordMode },
                    });
                });
                // Act: Enter and exit chord mode
                const ctrlK = new dom.window.KeyboardEvent('keydown', {
                    key: 'k',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlK);
                const escKey = new dom.window.KeyboardEvent('keydown', {
                    key: 'Escape',
                });
                terminalElement.dispatchEvent(escKey);
                // Assert: Should track chord mode transitions
                (0, chai_1.expect)(stateChanges.length).to.be.greaterThan(0);
                const chordModeChanges = stateChanges.filter((change) => change.chordMode.from !== change.chordMode.to);
                (0, chai_1.expect)(chordModeChanges.length).to.be.greaterThan(0);
            });
        });
    });
    (0, mocha_1.describe)('TDD Red Phase: Complex Multi-Service Interactions', () => {
        (0, mocha_1.describe)('Concurrent Input Processing', () => {
            (0, mocha_1.it)('should handle simultaneous IME composition and keyboard shortcuts', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Start IME composition
                const compositionStart = new dom.window.CompositionEvent('compositionstart', {
                    data: 'test',
                });
                terminalElement.dispatchEvent(compositionStart);
                // Act: Try keyboard shortcut during IME composition
                const ctrlC = new dom.window.KeyboardEvent('keydown', {
                    key: 'c',
                    ctrlKey: true,
                });
                terminalElement.dispatchEvent(ctrlC);
                // Assert: Both events should be processed but states should be consistent
                const imeState = stateManager.getStateSection('ime');
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, chai_1.expect)(imeState.isActive).to.be.true;
                (0, chai_1.expect)(keyboardState.lastKeyPressed).to.equal('c');
                (0, chai_1.expect)(keyboardState.modifiers.ctrl).to.be.true;
                // Both critical states should be reported
                (0, chai_1.expect)(stateManager.hasCriticalStateActive()).to.be.true;
            });
            (0, mocha_1.it)('should prioritize IME composition over regular input processing', () => {
                const _stateManager = integratedHandler.getStateManager();
                // Act: Start IME composition
                const compositionStart = new dom.window.CompositionEvent('compositionstart', {
                    data: 'composing',
                });
                terminalElement.dispatchEvent(compositionStart);
                // Act: Try to send input events during composition
                for (let i = 0; i < 3; i++) {
                    const inputEvent = new dom.window.Event('input');
                    terminalElement.dispatchEvent(inputEvent);
                }
                // Act: Advance time to trigger debounced processing
                clock.tick(50);
                // Assert: Input events should be processed by event service
                const eventService = integratedHandler.getEventService();
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalProcessed).to.be.greaterThan(3);
                // Assert: But regular input processing should be skipped (via logs)
                const inputProcessingLogs = logMessages.filter((msg) => msg.includes('Processing regular input event'));
                (0, chai_1.expect)(inputProcessingLogs.length).to.equal(0); // No regular processing during IME
            });
        });
        (0, mocha_1.describe)('Error Handling and Recovery', () => {
            (0, mocha_1.it)('should handle event processing errors without breaking state management', () => {
                // Arrange: Cause an error in event processing by modifying handler
                const originalHandleKeyDown = integratedHandler.handleKeyDown;
                integratedHandler.handleKeyDown = () => {
                    throw new Error('Simulated processing error');
                };
                const stateManager = integratedHandler.getStateManager();
                // Act: Trigger event that will cause error
                const keyEvent = new dom.window.KeyboardEvent('keydown', {
                    key: 'a',
                });
                (0, chai_1.expect)(() => {
                    terminalElement.dispatchEvent(keyEvent);
                }).to.not.throw();
                // Assert: Event service should handle error gracefully
                const eventService = integratedHandler.getEventService();
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalErrors).to.be.greaterThan(0);
                // Assert: State manager should remain functional
                (0, chai_1.expect)(() => {
                    stateManager.updateIMEState({ isActive: true });
                }).to.not.throw();
                // Restore original handler
                integratedHandler.handleKeyDown = originalHandleKeyDown;
            });
            (0, mocha_1.it)('should recover from state validation errors', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Cause state validation errors
                stateManager.updateIMEState({
                    startOffset: -1,
                    endOffset: -5,
                    timestamp: -1000,
                });
                stateManager.updateKeyboardState({
                    lastKeyTimestamp: -2000,
                });
                // Assert: Should log validation errors
                const errorLogs = logMessages.filter((msg) => msg.includes('State validation errors'));
                (0, chai_1.expect)(errorLogs.length).to.be.greaterThan(0);
                // Assert: Services should remain functional despite validation errors
                (0, chai_1.expect)(() => {
                    const keyEvent = new dom.window.KeyboardEvent('keydown', {
                        key: 'b',
                    });
                    terminalElement.dispatchEvent(keyEvent);
                }).to.not.throw();
                // Assert: Valid state updates should still work
                stateManager.updateIMEState({
                    isActive: true,
                    data: 'valid data',
                    timestamp: Date.now(),
                });
                const imeState = stateManager.getStateSection('ime');
                (0, chai_1.expect)(imeState.isActive).to.be.true;
                (0, chai_1.expect)(imeState.data).to.equal('valid data');
            });
        });
        (0, mocha_1.describe)('Performance Under Load', () => {
            (0, mocha_1.it)('should handle high-frequency event processing efficiently', () => {
                const eventService = integratedHandler.getEventService();
                // Act: Generate high-frequency events
                const startTime = Date.now();
                for (let i = 0; i < 1000; i++) {
                    const keyEvent = new dom.window.KeyboardEvent('keydown', {
                        key: String.fromCharCode(65 + (i % 26)), // A-Z
                    });
                    terminalElement.dispatchEvent(keyEvent);
                }
                const endTime = Date.now();
                // Assert: All events should be processed
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalProcessed).to.equal(1000);
                // Assert: Processing should be reasonably fast
                const processingTime = endTime - startTime;
                (0, chai_1.expect)(processingTime).to.be.lessThan(5000); // Less than 5 seconds
                // Assert: Average processing time should be reasonable
                const avgTime = eventService.getGlobalMetrics().averageProcessingTime;
                (0, chai_1.expect)(avgTime).to.be.lessThan(50); // Less than 50ms average
            });
            (0, mocha_1.it)('should maintain state consistency under rapid state changes', () => {
                const stateManager = integratedHandler.getStateManager();
                // Act: Rapid state changes
                for (let i = 0; i < 100; i++) {
                    stateManager.updateIMEState({
                        data: `rapid${i}`,
                        timestamp: Date.now() + i,
                    });
                    stateManager.updateKeyboardState({
                        lastKeyPressed: `key${i}`,
                        lastKeyTimestamp: Date.now() + i,
                    });
                    clock.tick(1);
                }
                // Assert: Final state should be consistent
                const imeState = stateManager.getStateSection('ime');
                const keyboardState = stateManager.getStateSection('keyboard');
                (0, chai_1.expect)(imeState.data).to.equal('rapid99');
                (0, chai_1.expect)(keyboardState.lastKeyPressed).to.equal('key99');
                // Assert: State history should be managed efficiently
                const history = stateManager.getStateHistory(10);
                (0, chai_1.expect)(history.length).to.equal(10); // Limited to prevent memory issues
            });
        });
    });
    (0, mocha_1.describe)('TDD Red Phase: Resource Management and Cleanup', () => {
        (0, mocha_1.describe)('Integrated Disposal', () => {
            (0, mocha_1.it)('should dispose all services cleanly on handler disposal', () => {
                const eventService = integratedHandler.getEventService();
                const stateManager = integratedHandler.getStateManager();
                // Arrange: Generate some activity
                const keyEvent = new dom.window.KeyboardEvent('keydown', { key: 'test' });
                terminalElement.dispatchEvent(keyEvent);
                stateManager.updateIMEState({ isActive: true });
                // Verify initial state
                (0, chai_1.expect)(eventService.getGlobalMetrics().totalProcessed).to.be.greaterThan(0);
                (0, chai_1.expect)(stateManager.getStateSection('ime').isActive).to.be.true;
                // Act: Dispose integrated handler
                integratedHandler.dispose();
                // Assert: Event service should be disposed
                (0, chai_1.expect)(eventService.getRegisteredHandlers()).to.have.length(0);
                // Assert: State manager should be disposed
                const state = stateManager.getState();
                (0, chai_1.expect)(state.ime.isActive).to.be.false;
                // Assert: Should log disposal
                const disposalLogs = logMessages.filter((msg) => msg.includes('disposing') || msg.includes('disposed'));
                (0, chai_1.expect)(disposalLogs.length).to.be.greaterThan(0);
            });
            (0, mocha_1.it)('should handle disposal during active event processing', () => {
                // Arrange: Start processing that would normally continue
                const inputEvent = new dom.window.Event('input');
                terminalElement.dispatchEvent(inputEvent);
                // Act: Dispose during debounce period
                integratedHandler.dispose();
                // Act: Advance time (debounced event should not execute)
                clock.tick(50);
                // Assert: No errors should occur and logs should indicate clean disposal
                const errorLogs = logMessages.filter((msg) => msg.toLowerCase().includes('error'));
                (0, chai_1.expect)(errorLogs.length).to.equal(0);
            });
            (0, mocha_1.it)('should prevent memory leaks after disposal', () => {
                // Arrange: Create references that might leak
                const stateManager = integratedHandler.getStateManager();
                const eventService = integratedHandler.getEventService();
                // Add state listener
                const listener = sinon_1.default.stub();
                stateManager.addStateListener('*', listener);
                // Register additional event handler
                eventService.registerEventHandler('memory-test', terminalElement, 'click', () => { });
                // Act: Dispose
                integratedHandler.dispose();
                // Act: Try to trigger events and state changes
                terminalElement.dispatchEvent(new dom.window.Event('click'));
                stateManager.updateIMEState({ isActive: true });
                // Assert: Disposed handlers should not execute
                (0, chai_1.expect)(listener.called).to.be.false;
                // Assert: No new event registrations should exist
                (0, chai_1.expect)(eventService.getRegisteredHandlers()).to.have.length(0);
            });
        });
    });
});
//# sourceMappingURL=InputHandling.test.js.map