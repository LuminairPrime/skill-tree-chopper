"use strict";
/**
 * TerminalBorderService Test Suite - Border styling and active state management
 *
 * TDD Pattern: Covers border updates, mode handling, and theme integration
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const TerminalBorderService_1 = require("../../../../../../webview/managers/ui/TerminalBorderService");
(0, vitest_1.describe)('TerminalBorderService', () => {
    let borderService;
    let dom;
    (0, vitest_1.beforeEach)(() => {
        // CRITICAL: Create JSDOM in beforeEach to prevent test pollution
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="terminal-body"></div></body></html>', {
            url: 'http://localhost',
        });
        // Set up global DOM
        global.document = dom.window.document;
        global.window = dom.window;
        global.HTMLElement = dom.window.HTMLElement;
        borderService = new TerminalBorderService_1.TerminalBorderService();
    });
    (0, vitest_1.afterEach)(() => {
        // CRITICAL: Use try-finally to ensure all cleanup happens
        try {
            vitest_1.vi.restoreAllMocks();
        }
        finally {
            try {
                // CRITICAL: Close JSDOM window to prevent memory leaks
                dom.window.close();
            }
            finally {
                // CRITICAL: Clean up global DOM state to prevent test pollution
                delete global.document;
                delete global.window;
                delete global.HTMLElement;
            }
        }
    });
    (0, vitest_1.describe)('Initialization', () => {
        (0, vitest_1.it)('should create instance correctly', () => {
            (0, vitest_1.expect)(borderService).toBeInstanceOf(TerminalBorderService_1.TerminalBorderService);
        });
        (0, vitest_1.it)('should default to multipleOnly mode', () => {
            (0, vitest_1.expect)(borderService.getActiveBorderMode()).toBe('multipleOnly');
        });
    });
    (0, vitest_1.describe)('Border Mode Management', () => {
        (0, vitest_1.it)('should set active border mode to always', () => {
            borderService.setActiveBorderMode('always');
            (0, vitest_1.expect)(borderService.getActiveBorderMode()).toBe('always');
        });
        (0, vitest_1.it)('should set active border mode to none', () => {
            borderService.setActiveBorderMode('none');
            (0, vitest_1.expect)(borderService.getActiveBorderMode()).toBe('none');
        });
        (0, vitest_1.it)('should set active border mode to multipleOnly', () => {
            borderService.setActiveBorderMode('always');
            borderService.setActiveBorderMode('multipleOnly');
            (0, vitest_1.expect)(borderService.getActiveBorderMode()).toBe('multipleOnly');
        });
    });
    (0, vitest_1.describe)('Single Terminal Border Update', () => {
        (0, vitest_1.it)('should add active class when terminal is active', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setTerminalCount(2);
            borderService.setActiveBorderMode('always');
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.classList.contains('active')).toBe(true);
            (0, vitest_1.expect)(container.classList.contains('inactive')).toBe(false);
        });
        (0, vitest_1.it)('should add inactive class when terminal is not active', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.updateSingleTerminalBorder(container, false);
            (0, vitest_1.expect)(container.classList.contains('active')).toBe(false);
            (0, vitest_1.expect)(container.classList.contains('inactive')).toBe(true);
        });
        (0, vitest_1.it)('should set border width and style', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.style.borderWidth).toBe('2px');
            (0, vitest_1.expect)(container.style.borderStyle).toBe('solid');
        });
        (0, vitest_1.it)('should set border radius', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.style.borderRadius).toBe('4px');
        });
        (0, vitest_1.it)('should set z-index higher for active container', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setActiveBorderMode('always');
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.style.zIndex).toBe('2');
        });
        (0, vitest_1.it)('should set lower z-index for inactive container', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.updateSingleTerminalBorder(container, false);
            (0, vitest_1.expect)(container.style.zIndex).toBe('1');
        });
    });
    (0, vitest_1.describe)('Multiple Terminals Border Update', () => {
        (0, vitest_1.it)('should update borders for all containers', () => {
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            const allContainers = new Map([
                ['terminal-1', container1],
                ['terminal-2', container2],
            ]);
            borderService.setActiveBorderMode('always');
            borderService.updateTerminalBorders('terminal-1', allContainers);
            (0, vitest_1.expect)(container1.classList.contains('active')).toBe(true);
            (0, vitest_1.expect)(container2.classList.contains('inactive')).toBe(true);
        });
        (0, vitest_1.it)('should handle missing active container gracefully', () => {
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            const allContainers = new Map([['terminal-1', container1]]);
            // Should not throw
            (0, vitest_1.expect)(() => {
                borderService.updateTerminalBorders('nonexistent', allContainers);
            }).not.toThrow();
        });
        (0, vitest_1.it)('should reset terminal-body border', () => {
            const terminalBody = document.getElementById('terminal-body');
            terminalBody.style.borderColor = 'red';
            terminalBody.classList.add('active');
            const container = document.createElement('div');
            const allContainers = new Map([['terminal-1', container]]);
            borderService.updateTerminalBorders('terminal-1', allContainers);
            (0, vitest_1.expect)(terminalBody.style.borderColor).toBe('transparent');
            (0, vitest_1.expect)(terminalBody.classList.contains('active')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Split Terminal Borders', () => {
        (0, vitest_1.it)('should update borders for split terminals in DOM', () => {
            // Create containers in DOM
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.dataset.terminalId = 'terminal-2';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            borderService.setActiveBorderMode('always');
            borderService.updateSplitTerminalBorders('terminal-1');
            (0, vitest_1.expect)(container1.classList.contains('active')).toBe(true);
            (0, vitest_1.expect)(container2.classList.contains('inactive')).toBe(true);
            // Cleanup
            container1.remove();
            container2.remove();
        });
    });
    (0, vitest_1.describe)('Border Mode - Always', () => {
        (0, vitest_1.it)('should show active border when mode is always', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setActiveBorderMode('always');
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.classList.contains('no-highlight-border')).toBe(false);
            (0, vitest_1.expect)(container.style.borderColor).not.toBe('transparent');
        });
    });
    (0, vitest_1.describe)('Border Mode - None', () => {
        (0, vitest_1.it)('should hide active border when mode is none', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setActiveBorderMode('none');
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.classList.contains('no-highlight-border')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Border Mode - MultipleOnly', () => {
        (0, vitest_1.it)('should hide border when only one terminal exists', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setActiveBorderMode('multipleOnly');
            borderService.setTerminalCount(1);
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.classList.contains('no-highlight-border')).toBe(true);
        });
        (0, vitest_1.it)('should show border when multiple terminals exist', () => {
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.dataset.terminalId = 'terminal-2';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            borderService.setActiveBorderMode('multipleOnly');
            borderService.setTerminalCount(2);
            borderService.updateSingleTerminalBorder(container1, true);
            (0, vitest_1.expect)(container1.classList.contains('no-highlight-border')).toBe(false);
            // Cleanup
            container1.remove();
            container2.remove();
        });
        (0, vitest_1.it)('should hide border when in fullscreen mode', () => {
            // Add containers to DOM first
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.dataset.terminalId = 'terminal-2';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            borderService.setActiveBorderMode('multipleOnly');
            borderService.setTerminalCount(3);
            borderService.setFullscreenMode(true);
            borderService.updateSingleTerminalBorder(container1, true);
            (0, vitest_1.expect)(container1.classList.contains('no-highlight-border')).toBe(true);
            // Cleanup
            container1.remove();
            container2.remove();
        });
        (0, vitest_1.it)('should show border when not in fullscreen with multiple terminals', () => {
            // Add containers to DOM first
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.dataset.terminalId = 'terminal-2';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            borderService.setActiveBorderMode('multipleOnly');
            borderService.setTerminalCount(3);
            borderService.setFullscreenMode(false);
            borderService.updateSingleTerminalBorder(container1, true);
            (0, vitest_1.expect)(container1.classList.contains('no-highlight-border')).toBe(false);
            // Cleanup
            container1.remove();
            container2.remove();
        });
    });
    (0, vitest_1.describe)('Terminal Count Management', () => {
        (0, vitest_1.it)('should update terminal count', () => {
            // Create containers in DOM to test refresh
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            document.body.appendChild(container1);
            borderService.setTerminalCount(5);
            // Should not throw
            (0, vitest_1.expect)(() => borderService.setTerminalCount(3)).not.toThrow();
            // Cleanup
            container1.remove();
        });
    });
    (0, vitest_1.describe)('Fullscreen Mode', () => {
        (0, vitest_1.it)('should set fullscreen mode', () => {
            (0, vitest_1.expect)(() => borderService.setFullscreenMode(true)).not.toThrow();
            (0, vitest_1.expect)(() => borderService.setFullscreenMode(false)).not.toThrow();
        });
        (0, vitest_1.it)('should affect multipleOnly border visibility', () => {
            // Add multiple containers to DOM so count is preserved
            const container1 = document.createElement('div');
            container1.className = 'terminal-container';
            container1.dataset.terminalId = 'terminal-1';
            const container2 = document.createElement('div');
            container2.className = 'terminal-container';
            container2.dataset.terminalId = 'terminal-2';
            const container3 = document.createElement('div');
            container3.className = 'terminal-container';
            container3.dataset.terminalId = 'terminal-3';
            document.body.appendChild(container1);
            document.body.appendChild(container2);
            document.body.appendChild(container3);
            borderService.setActiveBorderMode('multipleOnly');
            // Before fullscreen - should show (3 terminals)
            borderService.setFullscreenMode(false);
            borderService.updateSingleTerminalBorder(container1, true);
            (0, vitest_1.expect)(container1.classList.contains('no-highlight-border')).toBe(false);
            // After fullscreen - should hide
            borderService.setFullscreenMode(true);
            borderService.updateSingleTerminalBorder(container1, true);
            (0, vitest_1.expect)(container1.classList.contains('no-highlight-border')).toBe(true);
            // Cleanup
            container1.remove();
            container2.remove();
            container3.remove();
        });
    });
    (0, vitest_1.describe)('Theme Integration', () => {
        (0, vitest_1.it)('should set light theme mode', () => {
            (0, vitest_1.expect)(() => borderService.setLightTheme(true)).not.toThrow();
            (0, vitest_1.expect)(() => borderService.setLightTheme(false)).not.toThrow();
        });
        (0, vitest_1.it)('should use gray border for inactive terminals in light theme', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setLightTheme(true);
            borderService.updateSingleTerminalBorder(container, false);
            // Browser may convert #999 to rgb(153, 153, 153)
            const borderColor = container.style.borderColor;
            (0, vitest_1.expect)(borderColor === '#999' || borderColor === 'rgb(153, 153, 153)').toBe(true);
        });
        (0, vitest_1.it)('should use transparent border for inactive terminals in dark theme', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setLightTheme(false);
            borderService.updateSingleTerminalBorder(container, false);
            (0, vitest_1.expect)(container.style.borderColor).toBe('transparent');
        });
        (0, vitest_1.it)('should use gray border for active terminal when highlight is disabled in light theme', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setLightTheme(true);
            borderService.setActiveBorderMode('none');
            borderService.updateSingleTerminalBorder(container, true);
            // Browser may convert #999 to rgb(153, 153, 153)
            const borderColor = container.style.borderColor;
            (0, vitest_1.expect)(borderColor === '#999' || borderColor === 'rgb(153, 153, 153)').toBe(true);
        });
        (0, vitest_1.it)('should use transparent border for active terminal when highlight is disabled in dark theme', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            borderService.setLightTheme(false);
            borderService.setActiveBorderMode('none');
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.style.borderColor).toBe('transparent');
        });
    });
    (0, vitest_1.describe)('Border Styling', () => {
        (0, vitest_1.it)('should disable box-shadow for clean appearance', () => {
            const container = document.createElement('div');
            container.className = 'terminal-container';
            container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
            borderService.updateSingleTerminalBorder(container, true);
            (0, vitest_1.expect)(container.style.boxShadow).toBe('none');
        });
    });
});
//# sourceMappingURL=TerminalBorderService.test.js.map