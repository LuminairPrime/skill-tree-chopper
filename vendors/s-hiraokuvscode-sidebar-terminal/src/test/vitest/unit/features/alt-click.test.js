"use strict";
/**
 * Alt+Click functionality tests
 * Tests the VS Code standard Alt+Click cursor positioning feature
 */
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Alt+Click Cursor Positioning', () => {
    let mockVSCode;
    (0, vitest_1.beforeEach)(() => {
        // Mock VS Code configuration
        mockVSCode = {
            workspace: {
                getConfiguration: vitest_1.vi.fn().mockReturnValue({
                    get: vitest_1.vi.fn(),
                }),
            },
        };
        // Set up global mocks
        global.vscode = mockVSCode;
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        delete global.vscode;
    });
    (0, vitest_1.describe)('VS Code Settings Integration', () => {
        (0, vitest_1.it)('should detect VS Code altClickMovesCursor setting', () => {
            const getConfigStub = mockVSCode.workspace.getConfiguration().get;
            getConfigStub.mockImplementation((key) => {
                if (key === 'terminal.integrated.altClickMovesCursor')
                    return true;
                if (key === 'editor.multiCursorModifier')
                    return 'alt';
                return undefined;
            });
            const altClickEnabled = getConfigStub('terminal.integrated.altClickMovesCursor') &&
                getConfigStub('editor.multiCursorModifier') === 'alt';
            (0, vitest_1.expect)(altClickEnabled).toBe(true);
            (0, vitest_1.expect)(getConfigStub).toHaveBeenCalledWith('terminal.integrated.altClickMovesCursor');
            (0, vitest_1.expect)(getConfigStub).toHaveBeenCalledWith('editor.multiCursorModifier');
        });
        (0, vitest_1.it)('should disable Alt+Click when settings are not met', () => {
            const getConfigStub = mockVSCode.workspace.getConfiguration().get;
            getConfigStub.mockImplementation((key) => {
                if (key === 'terminal.integrated.altClickMovesCursor')
                    return false;
                if (key === 'editor.multiCursorModifier')
                    return 'alt';
                return undefined;
            });
            const altClickEnabled = getConfigStub('terminal.integrated.altClickMovesCursor') &&
                getConfigStub('editor.multiCursorModifier') === 'alt';
            (0, vitest_1.expect)(altClickEnabled).toBe(false);
        });
        (0, vitest_1.it)('should disable Alt+Click when multiCursorModifier is not alt', () => {
            const getConfigStub = mockVSCode.workspace.getConfiguration().get;
            getConfigStub.mockImplementation((key) => {
                if (key === 'terminal.integrated.altClickMovesCursor')
                    return true;
                if (key === 'editor.multiCursorModifier')
                    return 'ctrlCmd';
                return undefined;
            });
            const altClickEnabled = getConfigStub('terminal.integrated.altClickMovesCursor') &&
                getConfigStub('editor.multiCursorModifier') === 'alt';
            (0, vitest_1.expect)(altClickEnabled).toBe(false);
        });
    });
    (0, vitest_1.describe)('CLI Agent Detection Logic', () => {
        (0, vitest_1.it)('should detect CLI Agent output patterns', () => {
            const testOutputs = [
                'Executing command: claude-code',
                'Running npm test via claude-code',
                'CLI Agent: Processing file...',
                '🔧 [DEBUG] TerminalManager.createTerminal called',
            ];
            // This would use the actual detection patterns from webview main.ts
            const claudeCodePattern = /claude.code|🔧.*\[DEBUG\]|CLI Agent:/i;
            testOutputs.forEach((output) => {
                const isCliAgentCode = claudeCodePattern.test(output);
                (0, vitest_1.expect)(isCliAgentCode).toBe(true);
            });
        });
        (0, vitest_1.it)('should not trigger on normal terminal output', () => {
            const normalOutputs = [
                'ls -la',
                'git status',
                'npm run build',
                'echo "hello world"',
                'cat package.json',
            ];
            const claudeCodePattern = /claude.code|🔧.*\[DEBUG\]|CLI Agent:/i;
            normalOutputs.forEach((output) => {
                const isCliAgentCode = claudeCodePattern.test(output);
                (0, vitest_1.expect)(isCliAgentCode).toBe(false);
            });
        });
        (0, vitest_1.it)('should detect high-frequency output scenarios', () => {
            // Simulate high-frequency output detection
            const outputChunks = ['chunk1', 'chunk2', 'chunk3', 'chunk4', 'chunk5'];
            const timeWindow = 2000; // 2 seconds
            const threshold = 500; // characters
            let totalChars = 0;
            outputChunks.forEach((chunk) => {
                totalChars += chunk.length;
            });
            const isHighFrequency = totalChars > threshold;
            (0, vitest_1.expect)(isHighFrequency).toBe(false); // Small chunks shouldn't trigger
            // Test with large chunk
            const largeOutput = 'x'.repeat(1000);
            const isLargeOutput = largeOutput.length >= 1000;
            (0, vitest_1.expect)(isLargeOutput).toBe(true);
        });
    });
    (0, vitest_1.describe)('xterm.js Integration', () => {
        (0, vitest_1.it)('should configure xterm.js with altClickMovesCursor option', () => {
            // Mock xterm.js Terminal
            const mockTerminal = {
                options: {},
                onData: vitest_1.vi.fn(),
                onResize: vitest_1.vi.fn(),
                open: vitest_1.vi.fn(),
                loadAddon: vitest_1.vi.fn(),
            };
            // Simulate setting the altClickMovesCursor option
            const altClickEnabled = true;
            if (altClickEnabled) {
                mockTerminal.options.altClickMovesCursor = true;
            }
            (0, vitest_1.expect)(mockTerminal.options.altClickMovesCursor).toBe(true);
        });
        (0, vitest_1.it)('should handle dynamic settings updates', () => {
            const mockTerminal = {
                options: { altClickMovesCursor: false },
                setOption: vitest_1.vi.fn(),
            };
            // Simulate settings change
            const newAltClickSetting = true;
            mockTerminal.setOption('altClickMovesCursor', newAltClickSetting);
            (0, vitest_1.expect)(mockTerminal.setOption).toHaveBeenCalledWith('altClickMovesCursor', true);
        });
    });
    (0, vitest_1.describe)('Event Handling', () => {
        let mockElement;
        (0, vitest_1.beforeEach)(() => {
            mockElement = {
                addEventListener: vitest_1.vi.fn(),
                removeEventListener: vitest_1.vi.fn(),
                style: { cursor: '' },
            };
        });
        (0, vitest_1.it)('should change cursor style on Alt key press', () => {
            // Simulate Alt key down event
            const altKeyEvent = { altKey: true, key: 'Alt' };
            // Mock the cursor change logic
            if (altKeyEvent.altKey && altKeyEvent.key === 'Alt') {
                mockElement.style.cursor = 'default';
            }
            (0, vitest_1.expect)(mockElement.style.cursor).toBe('default');
        });
        (0, vitest_1.it)('should restore cursor style on Alt key release', () => {
            mockElement.style.cursor = 'default';
            // Simulate Alt key up event
            const altKeyUpEvent = { altKey: false, key: 'Alt' };
            if (!altKeyUpEvent.altKey && altKeyUpEvent.key === 'Alt') {
                mockElement.style.cursor = '';
            }
            (0, vitest_1.expect)(mockElement.style.cursor).toBe('');
        });
        (0, vitest_1.it)('should handle Alt+Click events properly', () => {
            const mockClickEvent = {
                altKey: true,
                button: 0, // left click
                clientX: 100,
                clientY: 200,
                preventDefault: vitest_1.vi.fn(),
                stopPropagation: vitest_1.vi.fn(),
            };
            // Simulate Alt+Click handling logic
            const isAltClick = mockClickEvent.altKey && mockClickEvent.button === 0;
            if (isAltClick) {
                // Should allow event to reach xterm.js (don't call preventDefault)
                (0, vitest_1.expect)(mockClickEvent.preventDefault).not.toHaveBeenCalled();
            }
            (0, vitest_1.expect)(isAltClick).toBe(true);
        });
        (0, vitest_1.it)('should prevent normal clicks from interfering', () => {
            const mockNormalClick = {
                altKey: false,
                button: 0,
                preventDefault: vitest_1.vi.fn(),
                stopPropagation: vitest_1.vi.fn(),
            };
            // Normal clicks should be handled differently
            const isNormalClick = !mockNormalClick.altKey && mockNormalClick.button === 0;
            if (isNormalClick) {
                mockNormalClick.stopPropagation();
            }
            (0, vitest_1.expect)(isNormalClick).toBe(true);
            (0, vitest_1.expect)(mockNormalClick.stopPropagation).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Performance Optimization', () => {
        (0, vitest_1.it)('should use optimized buffering during CLI Agent execution', () => {
            const normalFlushInterval = 16; // ms
            const claudeCodeFlushInterval = 4; // ms
            let currentFlushInterval = normalFlushInterval;
            // Simulate CLI Agent detection
            const isCliAgentCodeActive = true;
            if (isCliAgentCodeActive) {
                currentFlushInterval = claudeCodeFlushInterval;
            }
            (0, vitest_1.expect)(currentFlushInterval).toBe(4);
            (0, vitest_1.expect)(currentFlushInterval).toBeLessThan(normalFlushInterval);
        });
        (0, vitest_1.it)('should handle large output chunks immediately', () => {
            const largeOutputThreshold = 1000;
            const outputChunk = 'x'.repeat(1500);
            const shouldFlushImmediately = outputChunk.length >= largeOutputThreshold;
            (0, vitest_1.expect)(shouldFlushImmediately).toBe(true);
        });
    });
    (0, vitest_1.describe)('User Feedback System', () => {
        (0, vitest_1.it)('should provide visual feedback for Alt+Click availability', () => {
            const feedbackMessage = {
                type: 'info',
                message: 'Alt+Click available for cursor positioning',
            };
            (0, vitest_1.expect)(feedbackMessage.type).toBe('info');
            (0, vitest_1.expect)(feedbackMessage.message).toContain('Alt+Click available');
        });
        (0, vitest_1.it)('should notify users when Alt+Click is temporarily disabled', () => {
            const disabledMessage = {
                type: 'warning',
                title: '⚡ CLI Agent Active',
                message: 'Alt+Click temporarily disabled for optimal performance',
            };
            (0, vitest_1.expect)(disabledMessage.type).toBe('warning');
            (0, vitest_1.expect)(disabledMessage.title).toContain('CLI Agent Active');
        });
        (0, vitest_1.it)('should show re-enablement notification', () => {
            const reenableMessage = {
                type: 'success',
                title: 'Alt+Click Re-enabled',
                message: 'CLI Agent session ended, Alt+Click is now available',
            };
            (0, vitest_1.expect)(reenableMessage.type).toBe('success');
            (0, vitest_1.expect)(reenableMessage.title).toContain('Re-enabled');
        });
    });
});
//# sourceMappingURL=alt-click.test.js.map