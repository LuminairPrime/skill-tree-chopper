"use strict";
/**
 * IMEHandler Cursor Visibility TDD Test Suite
 * Ensures VS Code parity for IME composition cursor behavior
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const IMEHandler_1 = require("../../../../../../../webview/managers/input/handlers/IMEHandler");
const InputStateManager_1 = require("../../../../../../../webview/managers/input/services/InputStateManager");
const InputEventService_1 = require("../../../../../../../webview/managers/input/services/InputEventService");
(0, vitest_1.describe)('IMEHandler Cursor Visibility', () => {
    let jsdom;
    let handler;
    let stateManager;
    let eventService;
    let sharedTimers;
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.useFakeTimers();
        jsdom = new jsdom_1.JSDOM(`<!DOCTYPE html>
       <html>
         <head></head>
         <body>
           <div class="terminal-container">
             <div class="xterm">
               <div class="xterm-cursor-layer"><canvas></canvas></div>
               <span class="xterm-cursor"></span>
             </div>
           </div>
         </body>
       </html>`, {
            url: 'http://localhost',
            pretendToBeVisual: true,
        });
        // Setup globals for handler
        global.window = jsdom.window;
        global.document = jsdom.window.document;
        global.Event = jsdom.window.Event;
        global.CompositionEvent = jsdom.window.CompositionEvent;
        global.InputEvent = jsdom.window.InputEvent;
        sharedTimers = new Map();
        stateManager = new InputStateManager_1.InputStateManager(() => { });
        eventService = new InputEventService_1.InputEventService(() => { });
        handler = new IMEHandler_1.IMEHandler(sharedTimers, stateManager, eventService);
        await handler.initialize();
    });
    (0, vitest_1.afterEach)(() => {
        // CRITICAL: Use try-finally to ensure all cleanup happens
        try {
            handler.dispose();
        }
        finally {
            try {
                eventService.dispose();
            }
            finally {
                try {
                    stateManager.dispose();
                }
                finally {
                    try {
                        vitest_1.vi.useRealTimers();
                    }
                    finally {
                        try {
                            // CRITICAL: Close JSDOM window to prevent memory leaks
                            jsdom.window.close();
                        }
                        finally {
                            // CRITICAL: Clean up global DOM state to prevent test pollution
                            delete global.window;
                            delete global.document;
                            delete global.Event;
                            delete global.CompositionEvent;
                            delete global.InputEvent;
                        }
                    }
                }
            }
        }
    });
    (0, vitest_1.it)('toggles IME cursor class during composition lifecycle', () => {
        const startEvent = new global.CompositionEvent('compositionstart', {
            data: 'あ',
        });
        global.document.dispatchEvent(startEvent);
        (0, vitest_1.expect)(global.document.body.classList.contains('terminal-ime-composing')).toBe(true);
        const endEvent = new global.CompositionEvent('compositionend', {
            data: 'あ',
        });
        global.document.dispatchEvent(endEvent);
        vitest_1.vi.advanceTimersByTime(1);
        (0, vitest_1.expect)(global.document.body.classList.contains('terminal-ime-composing')).toBe(false);
    });
    (0, vitest_1.it)('injects cursor style once for IME composition handling', () => {
        const styleElement = global.document.getElementById('terminal-ime-cursor-style');
        (0, vitest_1.expect)(styleElement).not.toBeNull();
        (0, vitest_1.expect)(styleElement.textContent).toContain('width: 0');
        const startEvent = new global.CompositionEvent('compositionstart', {
            data: '候補',
        });
        global.document.dispatchEvent(startEvent);
        const duplicateCheck = global.document.querySelectorAll('#terminal-ime-cursor-style');
        (0, vitest_1.expect)(duplicateCheck.length).toBe(1);
        const endEvent = new global.CompositionEvent('compositionend', {
            data: '候補',
        });
        global.document.dispatchEvent(endEvent);
        vitest_1.vi.advanceTimersByTime(1);
        (0, vitest_1.expect)(global.document.querySelectorAll('#terminal-ime-cursor-style').length).toBe(1);
    });
    (0, vitest_1.it)('clears IME cursor class on dispose', () => {
        global.document.body.classList.add('terminal-ime-composing');
        handler.dispose();
        (0, vitest_1.expect)(global.document.body.classList.contains('terminal-ime-composing')).toBe(false);
    });
    (0, vitest_1.it)('recovers from stuck composition when compositionend is missing', () => {
        const startEvent = new global.CompositionEvent('compositionstart', {
            data: 'あ',
        });
        global.document.dispatchEvent(startEvent);
        (0, vitest_1.expect)(handler.isIMEComposing()).toBe(true);
        // Simulate missing compositionend from IME/browser edge case.
        vitest_1.vi.advanceTimersByTime(5000);
        (0, vitest_1.expect)(handler.isIMEComposing()).toBe(false);
        (0, vitest_1.expect)(global.document.body.classList.contains('terminal-ime-composing')).toBe(false);
    });
    (0, vitest_1.it)('clears composition state on window blur', () => {
        const startEvent = new global.CompositionEvent('compositionstart', {
            data: '候補',
        });
        global.document.dispatchEvent(startEvent);
        (0, vitest_1.expect)(handler.isIMEComposing()).toBe(true);
        global.window.dispatchEvent(new global.Event('blur'));
        (0, vitest_1.expect)(handler.isIMEComposing()).toBe(false);
        (0, vitest_1.expect)(global.document.body.classList.contains('terminal-ime-composing')).toBe(false);
    });
});
//# sourceMappingURL=IMEHandler.test.js.map