"use strict";
/**
 * CliAgentStateManager Unit Tests
 *
 * Tests for CLI Agent state management including:
 * - Agent state CRUD operations
 * - Agent activity detection
 * - Connection state management
 * - State synchronization
 * - Statistics and reporting
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const CliAgentStateManager_1 = require("../../../../../webview/managers/CliAgentStateManager");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('CliAgentStateManager', () => {
    let manager;
    (0, vitest_1.beforeEach)(() => {
        manager = new CliAgentStateManager_1.CliAgentStateManager();
    });
    (0, vitest_1.afterEach)(() => {
        manager.dispose();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('getAgentState', () => {
        (0, vitest_1.it)('should return null for unknown terminal', () => {
            (0, vitest_1.expect)(manager.getAgentState('unknown-terminal')).toBeNull();
        });
        (0, vitest_1.it)('should return state for known terminal', () => {
            manager.setAgentState('terminal-1', { status: 'connected', agentType: 'claude' });
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state).not.toBeNull();
            (0, vitest_1.expect)(state?.status).toBe('connected');
            (0, vitest_1.expect)(state?.agentType).toBe('claude');
        });
    });
    (0, vitest_1.describe)('setAgentState', () => {
        (0, vitest_1.it)('should create new state with defaults', () => {
            manager.setAgentState('terminal-1', {});
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('none');
            (0, vitest_1.expect)(state?.agentType).toBeNull();
            (0, vitest_1.expect)(state?.preserveScrollPosition).toBe(false);
            (0, vitest_1.expect)(state?.isDisplayingChoices).toBe(false);
        });
        (0, vitest_1.it)('should merge partial state with existing', () => {
            manager.setAgentState('terminal-1', { status: 'connected', agentType: 'claude' });
            manager.setAgentState('terminal-1', { preserveScrollPosition: true });
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('connected');
            (0, vitest_1.expect)(state?.agentType).toBe('claude');
            (0, vitest_1.expect)(state?.preserveScrollPosition).toBe(true);
        });
        (0, vitest_1.it)('should update currentConnectedAgentId when status is connected', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-1');
        });
        (0, vitest_1.it)('should clear currentConnectedAgentId when disconnected', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            manager.setAgentState('terminal-1', { status: 'disconnected' });
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBeNull();
        });
        (0, vitest_1.it)('should not clear currentConnectedAgentId for different terminal', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            manager.setAgentState('terminal-2', { status: 'disconnected' });
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-1');
        });
    });
    (0, vitest_1.describe)('getCurrentConnectedAgentId', () => {
        (0, vitest_1.it)('should return null when no agent is connected', () => {
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBeNull();
        });
        (0, vitest_1.it)('should return the connected agent ID', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-1');
        });
        (0, vitest_1.it)('should update when a new agent connects', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            manager.setAgentState('terminal-2', { status: 'connected' });
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-2');
        });
    });
    (0, vitest_1.describe)('getAllAgentStates', () => {
        (0, vitest_1.it)('should return empty map when no agents', () => {
            const states = manager.getAllAgentStates();
            (0, vitest_1.expect)(states.size).toBe(0);
        });
        (0, vitest_1.it)('should return copy of all states', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            manager.setAgentState('terminal-2', { status: 'disconnected' });
            const states = manager.getAllAgentStates();
            (0, vitest_1.expect)(states.size).toBe(2);
            (0, vitest_1.expect)(states.get('terminal-1')?.status).toBe('connected');
            (0, vitest_1.expect)(states.get('terminal-2')?.status).toBe('disconnected');
        });
        (0, vitest_1.it)('should return a copy, not the original map', () => {
            manager.setAgentState('terminal-1', { status: 'connected' });
            const states1 = manager.getAllAgentStates();
            const states2 = manager.getAllAgentStates();
            (0, vitest_1.expect)(states1).not.toBe(states2);
        });
    });
    (0, vitest_1.describe)('detectAgentActivity', () => {
        (0, vitest_1.it)('should detect Claude Code output', () => {
            const result = manager.detectAgentActivity('Welcome to Claude Code!', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
            (0, vitest_1.expect)(result.agentType).toBe('claude');
        });
        (0, vitest_1.it)('should detect Gemini Code output (case insensitive)', () => {
            const result = manager.detectAgentActivity('Gemini Code Assistant', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
            (0, vitest_1.expect)(result.agentType).toBe('gemini');
        });
        (0, vitest_1.it)('should detect generic AI type but not as agent output', () => {
            // AGENT_TYPE_PATTERNS matches AI|Assistant|Agent for agentType detection
            // But AGENT_OUTPUT_PATTERNS doesn't include these generic patterns
            // So the text is categorized but not detected as "agent output"
            const result = manager.detectAgentActivity('AI Assistant is ready', 'terminal-1');
            // isAgentOutput is false because it doesn't match AGENT_OUTPUT_PATTERNS
            (0, vitest_1.expect)(result.isAgentOutput).toBe(false);
            // agentType is detected because it matches AGENT_TYPE_PATTERNS
            (0, vitest_1.expect)(result.agentType).toBe('generic');
        });
        (0, vitest_1.it)('should detect Thinking/Processing patterns', () => {
            const result = manager.detectAgentActivity('Thinking about your request...', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
        });
        (0, vitest_1.it)('should detect choice display patterns', () => {
            const result = manager.detectAgentActivity('Select an option:\n[1] Option A\n[2] Option B', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
            (0, vitest_1.expect)(result.isDisplayingChoices).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-agent output', () => {
            const result = manager.detectAgentActivity('$ ls -la', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(false);
            (0, vitest_1.expect)(result.agentType).toBeNull();
            (0, vitest_1.expect)(result.isDisplayingChoices).toBe(false);
        });
        (0, vitest_1.it)('should update terminal state when agent detected', () => {
            manager.detectAgentActivity('Claude Code starting...', 'terminal-1');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('connected');
            (0, vitest_1.expect)(state?.agentType).toBe('claude');
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            // Even with unusual input, should not throw
            const result = manager.detectAgentActivity('', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(false);
        });
    });
    (0, vitest_1.describe)('setAgentConnected', () => {
        (0, vitest_1.it)('should set connected state with agent type', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('connected');
            (0, vitest_1.expect)(state?.agentType).toBe('claude');
            (0, vitest_1.expect)(state?.preserveScrollPosition).toBe(true);
        });
        (0, vitest_1.it)('should use custom terminal name if provided', () => {
            manager.setAgentConnected('terminal-1', 'claude', 'My Custom Terminal');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.terminalName).toBe('My Custom Terminal');
        });
        (0, vitest_1.it)('should use default terminal name if not provided', () => {
            manager.setAgentConnected('terminal-1', 'gemini');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.terminalName).toBe('Terminal terminal-1');
        });
    });
    (0, vitest_1.describe)('setAgentDisconnected', () => {
        (0, vitest_1.it)('should set disconnected state', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentDisconnected('terminal-1');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('disconnected');
            (0, vitest_1.expect)(state?.preserveScrollPosition).toBe(false);
            (0, vitest_1.expect)(state?.isDisplayingChoices).toBe(false);
        });
        (0, vitest_1.it)('should do nothing for unknown terminal', () => {
            // Should not throw
            (0, vitest_1.expect)(() => manager.setAgentDisconnected('unknown-terminal')).not.toThrow();
        });
        (0, vitest_1.it)('should preserve agent type after disconnect', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentDisconnected('terminal-1');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.agentType).toBe('claude');
        });
    });
    (0, vitest_1.describe)('clearAgentState', () => {
        (0, vitest_1.it)('should reset state to defaults', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.clearAgentState('terminal-1');
            const state = manager.getAgentState('terminal-1');
            (0, vitest_1.expect)(state?.status).toBe('none');
            (0, vitest_1.expect)(state?.agentType).toBeNull();
            (0, vitest_1.expect)(state?.preserveScrollPosition).toBe(false);
            (0, vitest_1.expect)(state?.isDisplayingChoices).toBe(false);
            (0, vitest_1.expect)(state?.lastChoiceDetected).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('removeTerminalState', () => {
        (0, vitest_1.it)('should remove state completely', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.removeTerminalState('terminal-1');
            (0, vitest_1.expect)(manager.getAgentState('terminal-1')).toBeNull();
        });
        (0, vitest_1.it)('should clear currentConnectedAgentId if removing connected terminal', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.removeTerminalState('terminal-1');
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBeNull();
        });
        (0, vitest_1.it)('should not affect currentConnectedAgentId for other terminals', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentState('terminal-2', { status: 'disconnected' });
            manager.removeTerminalState('terminal-2');
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-1');
        });
    });
    (0, vitest_1.describe)('isAgentDisplayingChoices', () => {
        (0, vitest_1.it)('should return false for unknown terminal', () => {
            (0, vitest_1.expect)(manager.isAgentDisplayingChoices('unknown')).toBe(false);
        });
        (0, vitest_1.it)('should return true when displaying choices', () => {
            manager.setAgentState('terminal-1', { isDisplayingChoices: true });
            (0, vitest_1.expect)(manager.isAgentDisplayingChoices('terminal-1')).toBe(true);
        });
        (0, vitest_1.it)('should return false when not displaying choices', () => {
            manager.setAgentState('terminal-1', { isDisplayingChoices: false });
            (0, vitest_1.expect)(manager.isAgentDisplayingChoices('terminal-1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('shouldPreserveScrollPosition', () => {
        (0, vitest_1.it)('should return false for unknown terminal', () => {
            (0, vitest_1.expect)(manager.shouldPreserveScrollPosition('unknown')).toBe(false);
        });
        (0, vitest_1.it)('should return true when preserveScrollPosition is true', () => {
            manager.setAgentState('terminal-1', { preserveScrollPosition: true });
            (0, vitest_1.expect)(manager.shouldPreserveScrollPosition('terminal-1')).toBe(true);
        });
        (0, vitest_1.it)('should return false when preserveScrollPosition is false', () => {
            manager.setAgentState('terminal-1', { preserveScrollPosition: false });
            (0, vitest_1.expect)(manager.shouldPreserveScrollPosition('terminal-1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('getAgentStats', () => {
        (0, vitest_1.it)('should return zeros for empty manager', () => {
            const stats = manager.getAgentStats();
            (0, vitest_1.expect)(stats.totalAgents).toBe(0);
            (0, vitest_1.expect)(stats.connectedAgents).toBe(0);
            (0, vitest_1.expect)(stats.disconnectedAgents).toBe(0);
            (0, vitest_1.expect)(stats.currentConnectedId).toBeNull();
            (0, vitest_1.expect)(stats.agentTypes).toEqual([]);
        });
        (0, vitest_1.it)('should count agents correctly', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentConnected('terminal-2', 'gemini');
            manager.setAgentDisconnected('terminal-2');
            manager.setAgentState('terminal-3', { status: 'none' });
            const stats = manager.getAgentStats();
            (0, vitest_1.expect)(stats.totalAgents).toBe(3);
            (0, vitest_1.expect)(stats.connectedAgents).toBe(1);
            (0, vitest_1.expect)(stats.disconnectedAgents).toBe(1);
        });
        (0, vitest_1.it)('should list unique agent types', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentConnected('terminal-2', 'gemini');
            manager.setAgentConnected('terminal-3', 'claude');
            const stats = manager.getAgentStats();
            (0, vitest_1.expect)(stats.agentTypes).toContain('claude');
            (0, vitest_1.expect)(stats.agentTypes).toContain('gemini');
            (0, vitest_1.expect)(stats.agentTypes.length).toBe(2);
        });
        (0, vitest_1.it)('should return current connected ID', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            const stats = manager.getAgentStats();
            (0, vitest_1.expect)(stats.currentConnectedId).toBe('terminal-1');
        });
    });
    (0, vitest_1.describe)('getStateForExtension', () => {
        (0, vitest_1.it)('should return null for unknown terminal', () => {
            (0, vitest_1.expect)(manager.getStateForExtension('unknown')).toBeNull();
        });
        (0, vitest_1.it)('should return extension-friendly state', () => {
            manager.setAgentConnected('terminal-1', 'claude', 'My Terminal');
            const state = manager.getStateForExtension('terminal-1');
            (0, vitest_1.expect)(state).toEqual({
                activeTerminalName: 'My Terminal',
                status: 'connected',
                agentType: 'claude',
                terminalId: 'terminal-1',
            });
        });
    });
    (0, vitest_1.describe)('getFullStateSync', () => {
        (0, vitest_1.it)('should return complete state snapshot', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentState('terminal-2', { status: 'disconnected', agentType: 'gemini' });
            const sync = manager.getFullStateSync();
            (0, vitest_1.expect)(sync.allAgents.size).toBe(2);
            (0, vitest_1.expect)(sync.currentConnectedId).toBe('terminal-1');
            (0, vitest_1.expect)(sync.timestamp).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return a copy of the state', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            const sync1 = manager.getFullStateSync();
            const sync2 = manager.getFullStateSync();
            (0, vitest_1.expect)(sync1.allAgents).not.toBe(sync2.allAgents);
        });
    });
    (0, vitest_1.describe)('applyFullStateSync', () => {
        (0, vitest_1.it)('should apply synced state', () => {
            const syncData = {
                allAgents: new Map([
                    [
                        'terminal-1',
                        {
                            status: 'connected',
                            terminalName: 'Terminal 1',
                            agentType: 'claude',
                            preserveScrollPosition: true,
                            isDisplayingChoices: false,
                        },
                    ],
                    [
                        'terminal-2',
                        {
                            status: 'disconnected',
                            terminalName: 'Terminal 2',
                            agentType: 'gemini',
                            preserveScrollPosition: false,
                            isDisplayingChoices: false,
                        },
                    ],
                ]),
                currentConnectedId: 'terminal-1',
            };
            manager.applyFullStateSync(syncData);
            (0, vitest_1.expect)(manager.getAllAgentStates().size).toBe(2);
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBe('terminal-1');
            (0, vitest_1.expect)(manager.getAgentState('terminal-1')?.agentType).toBe('claude');
        });
        (0, vitest_1.it)('should clear existing state before applying', () => {
            manager.setAgentConnected('terminal-old', 'old-agent');
            const syncData = {
                allAgents: new Map([
                    [
                        'terminal-new',
                        {
                            status: 'connected',
                            terminalName: 'Terminal New',
                            agentType: 'new-agent',
                            preserveScrollPosition: true,
                            isDisplayingChoices: false,
                        },
                    ],
                ]),
                currentConnectedId: 'terminal-new',
            };
            manager.applyFullStateSync(syncData);
            (0, vitest_1.expect)(manager.getAgentState('terminal-old')).toBeNull();
            (0, vitest_1.expect)(manager.getAgentState('terminal-new')).not.toBeNull();
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should clear all states', () => {
            manager.setAgentConnected('terminal-1', 'claude');
            manager.setAgentConnected('terminal-2', 'gemini');
            manager.dispose();
            (0, vitest_1.expect)(manager.getAllAgentStates().size).toBe(0);
            (0, vitest_1.expect)(manager.getCurrentConnectedAgentId()).toBeNull();
        });
    });
    (0, vitest_1.describe)('Agent Detection Patterns', () => {
        (0, vitest_1.it)('should detect Claude Code with proper capitalization', () => {
            const result = manager.detectAgentActivity('Claude Code is running', 'terminal-1');
            (0, vitest_1.expect)(result.agentType).toBe('claude');
        });
        (0, vitest_1.it)('should not detect "claude code" in lowercase', () => {
            const result = manager.detectAgentActivity('claude code is running', 'terminal-1');
            // Pattern requires "Claude Code" with capitals
            (0, vitest_1.expect)(result.agentType).not.toBe('claude');
        });
        (0, vitest_1.it)('should detect gemini code case-insensitively', () => {
            const result1 = manager.detectAgentActivity('GEMINI CODE', 'terminal-1');
            const result2 = manager.detectAgentActivity('gemini code', 'terminal-2');
            (0, vitest_1.expect)(result1.agentType).toBe('gemini');
            (0, vitest_1.expect)(result2.agentType).toBe('gemini');
        });
        (0, vitest_1.it)('should detect Analyzing pattern', () => {
            const result = manager.detectAgentActivity('Analyzing your code...', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
        });
        (0, vitest_1.it)('should detect Processing pattern', () => {
            const result = manager.detectAgentActivity('Processing request...', 'terminal-1');
            (0, vitest_1.expect)(result.isAgentOutput).toBe(true);
        });
        (0, vitest_1.it)('should detect Choice patterns with numbers', () => {
            const result = manager.detectAgentActivity('[1] First option\n[2] Second option', 'terminal-1');
            (0, vitest_1.expect)(result.isDisplayingChoices).toBe(true);
        });
    });
});
//# sourceMappingURL=CliAgentStateManager.test.js.map