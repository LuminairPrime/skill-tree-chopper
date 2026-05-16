"use strict";
/**
 * Tests for improved CLI Agent detection patterns
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 *
 * Focus on relaxed termination detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CliAgentDetectionService_1 = require("../../../../services/CliAgentDetectionService");
(0, vitest_1.describe)('CLI Agent Detection - Improved Patterns', () => {
    let detectionService;
    (0, vitest_1.beforeEach)(() => {
        detectionService = new CliAgentDetectionService_1.CliAgentDetectionService();
    });
    (0, vitest_1.afterEach)(() => {
        detectionService.dispose();
        vitest_1.vi.restoreAllMocks();
    });
    // Helper to access stateManager via the service's getter
    function getStateManager() {
        return detectionService.stateManager;
    }
    (0, vitest_1.describe)('Relaxed Termination Detection', () => {
        (0, vitest_1.beforeEach)(() => {
            // Setup connected agent for termination testing
            getStateManager().setConnectedAgent('terminal-1', 'claude');
        });
        (0, vitest_1.it)('should detect simple shell prompts more easily', () => {
            const testPrompts = [
                'user@host:~$ ',
                'macbook-pro:~ user$ ',
                'hostname$ ',
                '$ ',
                '% ',
                '> ',
                'john@server:/home/john$ ',
                'PS C:\\Users\\User> ',
            ];
            testPrompts.forEach((prompt) => {
                const result = detectionService.detectTermination('terminal-1', prompt);
                (0, vitest_1.expect)(result.isTerminated).toBe(true);
                (0, vitest_1.expect)(result.confidence).toBeGreaterThan(0.4);
            });
        });
        // SKIP: Internal API setDetectionCacheValue no longer exists
        vitest_1.it.skip('should handle timeout-based detection', async () => {
            // Simulate 30+ seconds without AI output by using the cache setter
            const oldTimestamp = Date.now() - 35000; // 35 seconds ago
            detectionService.setDetectionCacheValue('terminal-1_lastAIOutput', oldTimestamp);
            const result = detectionService.detectTermination('terminal-1', 'user$ ');
            (0, vitest_1.expect)(result.isTerminated).toBe(true);
            (0, vitest_1.expect)(result.reason).toContain('timeout');
        });
        (0, vitest_1.it)('should still avoid false positives from AI output', () => {
            const aiOutputs = [
                "I'll help you with that task",
                'Let me analyze the code for you',
                "Here's what I found in the documentation",
                'Claude Code is analyzing your request',
                'Thinking about the best approach...',
                'I can help you implement this feature',
            ];
            aiOutputs.forEach((output) => {
                const result = detectionService.detectTermination('terminal-1', output);
                (0, vitest_1.expect)(result.isTerminated).toBe(false);
            });
        });
        (0, vitest_1.it)('should detect explicit termination messages', () => {
            const terminationMessages = [
                '[Process completed]',
                '[process exited with code 0]',
                '[process exited with code 130]',
                'Agent powering down. Goodbye!',
                'command not found: claude',
                'command not found: gemini',
            ];
            terminationMessages.forEach((message) => {
                const result = detectionService.detectTermination('terminal-1', message);
                (0, vitest_1.expect)(result.isTerminated).toBe(true);
                (0, vitest_1.expect)(result.confidence).toBeGreaterThan(0.6);
            });
        });
        (0, vitest_1.it)('should NOT detect generic words as termination', () => {
            const nonTerminationMessages = [
                'session ended',
                'goodbye claude',
                'exit',
                'quit',
                'goodbye',
                '[done]',
                'completed',
            ];
            nonTerminationMessages.forEach((message) => {
                const result = detectionService.detectTermination('terminal-1', message);
                (0, vitest_1.expect)(result.isTerminated).toBe(false);
            });
        });
    });
    (0, vitest_1.describe)('Claude Session End Detection', () => {
        (0, vitest_1.it)('should be more lenient with shell prompts', () => {
            // Test the private method indirectly through detectTermination
            const shellPrompts = ['user@macbook:~$ ', 'hostname$ ', 'john@server:/path$ ', '$ ', '% '];
            shellPrompts.forEach((prompt) => {
                const result = detectionService.detectTermination('terminal-1', prompt);
                (0, vitest_1.expect)(result.isTerminated).toBe(true);
            });
        });
        (0, vitest_1.it)('should detect process completion messages', () => {
            const completionMessages = [
                '[Process completed]',
                '[process exited with code 0]',
                '[process exited with code 1]',
                'Agent powering down. Goodbye!',
            ];
            completionMessages.forEach((message) => {
                const result = detectionService.detectTermination('terminal-1', message);
                (0, vitest_1.expect)(result.isTerminated).toBe(true);
            });
        });
        (0, vitest_1.it)('should NOT detect fictional completion patterns', () => {
            const nonCompletionMessages = ['[done]', '[finished]', 'done', 'complete', 'completed'];
            nonCompletionMessages.forEach((message) => {
                const result = detectionService.detectTermination('terminal-1', message);
                (0, vitest_1.expect)(result.isTerminated).toBe(false);
            });
        });
        // SKIP: Internal API setDetectionCacheValue no longer exists
        vitest_1.it.skip('should handle time-based relaxation', () => {
            // Simulate time passing without Claude activity
            const oldTimestamp = Date.now() - 25000; // 25 seconds ago
            detectionService.setDetectionCacheValue('lastClaudeActivity', oldTimestamp);
            const result = detectionService.detectTermination('terminal-1', 'host$ ');
            (0, vitest_1.expect)(result.isTerminated).toBe(true);
        });
    });
    (0, vitest_1.describe)('State Management Improvements', () => {
        // SKIP: Grace period behavior has changed in the implementation
        vitest_1.it.skip('should handle grace period for state changes', async () => {
            getStateManager().setConnectedAgent('terminal-1', 'claude');
            // Trigger termination detection
            detectionService.detectFromOutput('terminal-1', 'user@host:~$ ');
            // State should not change immediately due to grace period
            (0, vitest_1.expect)(getStateManager().isAgentConnected('terminal-1')).toBe(true);
            // Wait for grace period
            await new Promise((resolve) => setTimeout(resolve, 1200)); // Slightly longer than grace period
            (0, vitest_1.expect)(getStateManager().isAgentConnected('terminal-1')).toBe(false);
        });
        // SKIP: Internal API getDetectionCacheValue no longer exists
        vitest_1.it.skip('should track AI activity timestamps', () => {
            const aiOutputs = [
                'Claude is thinking about your request',
                'Let me analyze this code',
                'I can help you with that',
            ];
            aiOutputs.forEach((output) => {
                detectionService.detectFromOutput('terminal-1', output);
            });
            // Verify that activity tracking is working (we'll check that it's recording activity)
            const hasActivity = detectionService.getDetectionCacheValue('terminal-1_lastAIOutput');
            (0, vitest_1.expect)(typeof hasActivity).toBe('number');
        });
    });
    (0, vitest_1.describe)('Edge Cases and Stability', () => {
        (0, vitest_1.it)('should handle rapid state changes gracefully', () => {
            // Rapidly switch between states
            getStateManager().setConnectedAgent('terminal-1', 'claude');
            detectionService.detectFromOutput('terminal-1', 'user$ ');
            getStateManager().setConnectedAgent('terminal-1', 'claude');
            detectionService.detectFromOutput('terminal-1', 'user$ ');
            // Should not crash or throw errors
            (0, vitest_1.expect)(true).toBe(true);
        });
        (0, vitest_1.it)('should handle malformed input gracefully', () => {
            const malformedInputs = [
                '',
                '\n\n\n',
                '\x1b[2J\x1b[H', // ANSI escape sequences
                '���', // Invalid UTF-8
                'a'.repeat(10000), // Very long string
            ];
            malformedInputs.forEach((input) => {
                (0, vitest_1.expect)(() => {
                    detectionService.detectFromOutput('terminal-1', input);
                }).not.toThrow();
            });
        });
        (0, vitest_1.it)('should maintain performance under load', () => {
            const startTime = Date.now();
            // Process many detection calls
            for (let i = 0; i < 1000; i++) {
                detectionService.detectFromOutput('terminal-1', `Line ${i} of output`);
            }
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(1000); // Should complete in under 1 second
        });
    });
});
//# sourceMappingURL=CliAgentDetection.improved.test.js.map