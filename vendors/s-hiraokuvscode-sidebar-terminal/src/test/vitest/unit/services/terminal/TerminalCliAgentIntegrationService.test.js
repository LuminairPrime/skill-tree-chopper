"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
const vitest_1 = require("vitest");
const TerminalCliAgentIntegrationService_1 = require("../../../../../services/terminal/TerminalCliAgentIntegrationService");
(0, vitest_1.describe)('TerminalCliAgentIntegrationService', () => {
    let service;
    let mockCliAgentService;
    (0, vitest_1.beforeEach)(() => {
        // Create mock CLI Agent service
        mockCliAgentService = {
            startHeartbeat: vitest_1.vi.fn(),
            onCliAgentStatusChange: {},
            getAgentState: vitest_1.vi.fn(),
            getConnectedAgent: vitest_1.vi.fn(),
            refreshAgentState: vitest_1.vi.fn(),
            detectFromOutput: vitest_1.vi.fn(),
            detectFromInput: vitest_1.vi.fn(),
            getDisconnectedAgents: vitest_1.vi.fn(),
            switchAgentConnection: vitest_1.vi.fn(),
            handleTerminalRemoved: vitest_1.vi.fn(),
            dispose: vitest_1.vi.fn(),
            detectTermination: vitest_1.vi.fn(),
            forceReconnectAgent: vitest_1.vi.fn(),
            clearDetectionError: vitest_1.vi.fn(),
            setAgentConnected: vitest_1.vi.fn(),
        };
        service = new TerminalCliAgentIntegrationService_1.TerminalCliAgentIntegrationService(mockCliAgentService);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('Constructor', () => {
        (0, vitest_1.it)('should initialize with provided CLI agent service', () => {
            (0, vitest_1.expect)(service).toBeDefined();
        });
        (0, vitest_1.it)('should initialize with default CLI agent service', () => {
            const defaultService = new TerminalCliAgentIntegrationService_1.TerminalCliAgentIntegrationService();
            (0, vitest_1.expect)(defaultService).toBeDefined();
            defaultService.dispose();
        });
    });
    (0, vitest_1.describe)('startHeartbeat', () => {
        (0, vitest_1.it)('should start CLI Agent heartbeat', () => {
            service.startHeartbeat();
            (0, vitest_1.expect)(mockCliAgentService.startHeartbeat).toHaveBeenCalledOnce();
        });
    });
    (0, vitest_1.describe)('isCliAgentConnected', () => {
        (0, vitest_1.it)('should return true when agent is connected', () => {
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'connected',
                agentType: 'claude',
            });
            const result = service.isCliAgentConnected('terminal1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockCliAgentService.getAgentState).toHaveBeenCalledWith('terminal1');
        });
        (0, vitest_1.it)('should return false when agent is disconnected', () => {
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'disconnected',
                agentType: 'claude',
            });
            const result = service.isCliAgentConnected('terminal1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should return false when agent is none', () => {
            mockCliAgentService.getAgentState.mockReturnValue({ status: 'none', agentType: null });
            const result = service.isCliAgentConnected('terminal1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getAgentState.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.isCliAgentConnected('terminal1');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('isCliAgentRunning', () => {
        (0, vitest_1.it)('should return true when agent is connected', () => {
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'connected',
                agentType: 'claude',
            });
            const result = service.isCliAgentRunning('terminal1');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return true when agent is disconnected but running', () => {
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'disconnected',
                agentType: 'claude',
            });
            const result = service.isCliAgentRunning('terminal1');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when agent is none', () => {
            mockCliAgentService.getAgentState.mockReturnValue({ status: 'none', agentType: null });
            const result = service.isCliAgentRunning('terminal1');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getAgentState.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.isCliAgentRunning('terminal1');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('getCurrentGloballyActiveAgent', () => {
        (0, vitest_1.it)('should return active agent info', () => {
            const agentInfo = { terminalId: 'terminal1', type: 'claude' };
            mockCliAgentService.getConnectedAgent.mockReturnValue(agentInfo);
            const result = service.getCurrentGloballyActiveAgent();
            (0, vitest_1.expect)(result).toEqual(agentInfo);
        });
        (0, vitest_1.it)('should return null when no agent is connected', () => {
            mockCliAgentService.getConnectedAgent.mockReturnValue(null);
            const result = service.getCurrentGloballyActiveAgent();
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getConnectedAgent.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getCurrentGloballyActiveAgent();
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('refreshCliAgentState', () => {
        (0, vitest_1.it)('should refresh CLI Agent state successfully', () => {
            mockCliAgentService.refreshAgentState.mockReturnValue(true);
            const result = service.refreshCliAgentState();
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockCliAgentService.refreshAgentState).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should handle refresh failure', () => {
            mockCliAgentService.refreshAgentState.mockReturnValue(false);
            const result = service.refreshCliAgentState();
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.refreshAgentState.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.refreshCliAgentState();
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('handleTerminalOutputForCliAgent', () => {
        (0, vitest_1.it)('should detect from output', () => {
            service.handleTerminalOutputForCliAgent('terminal1', 'output data');
            (0, vitest_1.expect)(mockCliAgentService.detectFromOutput).toHaveBeenCalledWith('terminal1', 'output data');
        });
        (0, vitest_1.it)('should handle detection errors gracefully', () => {
            mockCliAgentService.detectFromOutput.mockImplementation(() => {
                throw new Error('Detection error');
            });
            // Should not throw
            service.handleTerminalOutputForCliAgent('terminal1', 'output data');
        });
    });
    (0, vitest_1.describe)('handleTerminalInputForCliAgent', () => {
        (0, vitest_1.it)('should detect from input', () => {
            service.handleTerminalInputForCliAgent('terminal1', 'input data');
            (0, vitest_1.expect)(mockCliAgentService.detectFromInput).toHaveBeenCalledWith('terminal1', 'input data');
        });
        (0, vitest_1.it)('should handle detection errors gracefully', () => {
            mockCliAgentService.detectFromInput.mockImplementation(() => {
                throw new Error('Detection error');
            });
            // Should not throw
            service.handleTerminalInputForCliAgent('terminal1', 'input data');
        });
    });
    (0, vitest_1.describe)('getAgentType', () => {
        (0, vitest_1.it)('should return agent type', () => {
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'connected',
                agentType: 'claude',
            });
            const result = service.getAgentType('terminal1');
            (0, vitest_1.expect)(result).toBe('claude');
        });
        (0, vitest_1.it)('should return null when no agent', () => {
            mockCliAgentService.getAgentState.mockReturnValue({ status: 'none', agentType: null });
            const result = service.getAgentType('terminal1');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getAgentState.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getAgentType('terminal1');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('getConnectedAgents', () => {
        (0, vitest_1.it)('should return connected agents', () => {
            const connectedAgent = { terminalId: 'terminal1', type: 'claude' };
            mockCliAgentService.getConnectedAgent.mockReturnValue(connectedAgent);
            const result = service.getConnectedAgents();
            (0, vitest_1.expect)(result.length).toBe(1);
            (0, vitest_1.expect)(result[0]?.terminalId).toBe('terminal1');
            (0, vitest_1.expect)(result[0]?.agentInfo.type).toBe('claude');
        });
        (0, vitest_1.it)('should return empty array when no agents connected', () => {
            mockCliAgentService.getConnectedAgent.mockReturnValue(null);
            const result = service.getConnectedAgents();
            (0, vitest_1.expect)(result.length).toBe(0);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getConnectedAgent.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getConnectedAgents();
            (0, vitest_1.expect)(result.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('getDisconnectedAgents', () => {
        (0, vitest_1.it)('should return disconnected agents map', () => {
            const disconnectedMap = new Map([
                [
                    'terminal1',
                    { type: 'claude', startTime: new Date(), terminalName: 'Terminal 1' },
                ],
            ]);
            mockCliAgentService.getDisconnectedAgents.mockReturnValue(disconnectedMap);
            const result = service.getDisconnectedAgents();
            (0, vitest_1.expect)(result.size).toBe(1);
            (0, vitest_1.expect)(result.has('terminal1')).toBe(true);
        });
        (0, vitest_1.it)('should preserve copilot and opencode in disconnected agents', () => {
            const disconnectedMap = new Map([
                [
                    'terminal-copilot',
                    { type: 'copilot', startTime: new Date(), terminalName: 'Terminal Copilot' },
                ],
                [
                    'terminal-opencode',
                    { type: 'opencode', startTime: new Date(), terminalName: 'Terminal OpenCode' },
                ],
            ]);
            mockCliAgentService.getDisconnectedAgents.mockReturnValue(disconnectedMap);
            const result = service.getDisconnectedAgents();
            (0, vitest_1.expect)(result.get('terminal-copilot')?.type).toBe('copilot');
            (0, vitest_1.expect)(result.get('terminal-opencode')?.type).toBe('opencode');
        });
        (0, vitest_1.it)('should return empty map when no disconnected agents', () => {
            mockCliAgentService.getDisconnectedAgents.mockReturnValue(new Map());
            const result = service.getDisconnectedAgents();
            (0, vitest_1.expect)(result.size).toBe(0);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getDisconnectedAgents.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getDisconnectedAgents();
            (0, vitest_1.expect)(result.size).toBe(0);
        });
    });
    (0, vitest_1.describe)('getConnectedAgentTerminalId', () => {
        (0, vitest_1.it)('should return connected agent terminal ID', () => {
            const connectedAgent = { terminalId: 'terminal1', type: 'claude' };
            mockCliAgentService.getConnectedAgent.mockReturnValue(connectedAgent);
            const result = service.getConnectedAgentTerminalId();
            (0, vitest_1.expect)(result).toBe('terminal1');
        });
        (0, vitest_1.it)('should return null when no agent connected', () => {
            mockCliAgentService.getConnectedAgent.mockReturnValue(null);
            const result = service.getConnectedAgentTerminalId();
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getConnectedAgent.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getConnectedAgentTerminalId();
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('getConnectedAgentType', () => {
        (0, vitest_1.it)('should return connected agent type', () => {
            const connectedAgent = { terminalId: 'terminal1', type: 'gemini' };
            mockCliAgentService.getConnectedAgent.mockReturnValue(connectedAgent);
            const result = service.getConnectedAgentType();
            (0, vitest_1.expect)(result).toBe('gemini');
        });
        (0, vitest_1.it)('should return null when no agent connected', () => {
            mockCliAgentService.getConnectedAgent.mockReturnValue(null);
            const result = service.getConnectedAgentType();
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.getConnectedAgent.mockImplementation(() => {
                throw new Error('Test error');
            });
            const result = service.getConnectedAgentType();
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should return copilot and opencode types', () => {
            mockCliAgentService.getConnectedAgent.mockReturnValue({
                terminalId: 'terminal1',
                type: 'copilot',
            });
            (0, vitest_1.expect)(service.getConnectedAgentType()).toBe('copilot');
            mockCliAgentService.getConnectedAgent.mockReturnValue({
                terminalId: 'terminal2',
                type: 'opencode',
            });
            (0, vitest_1.expect)(service.getConnectedAgentType()).toBe('opencode');
        });
    });
    (0, vitest_1.describe)('handleTerminalRemoved', () => {
        (0, vitest_1.it)('should handle terminal removal', () => {
            service.handleTerminalRemoved('terminal1');
            (0, vitest_1.expect)(mockCliAgentService.handleTerminalRemoved).toHaveBeenCalledWith('terminal1');
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.handleTerminalRemoved.mockImplementation(() => {
                throw new Error('Test error');
            });
            // Should not throw
            service.handleTerminalRemoved('terminal1');
        });
    });
    (0, vitest_1.describe)('switchAiAgentConnection', () => {
        (0, vitest_1.it)('should switch connection successfully', () => {
            const switchResult = {
                success: true,
                newStatus: 'connected',
                agentType: 'claude',
            };
            mockCliAgentService.switchAgentConnection.mockReturnValue(switchResult);
            const result = service.switchAiAgentConnection('terminal1');
            (0, vitest_1.expect)(result).toEqual(switchResult);
            (0, vitest_1.expect)(mockCliAgentService.switchAgentConnection).toHaveBeenCalledWith('terminal1');
        });
        (0, vitest_1.it)('should handle switch failure', () => {
            const switchResult = {
                success: false,
                reason: 'Test failure',
                newStatus: 'none',
                agentType: null,
            };
            mockCliAgentService.switchAgentConnection.mockReturnValue(switchResult);
            const result = service.switchAiAgentConnection('terminal1');
            (0, vitest_1.expect)(result).toEqual(switchResult);
        });
        (0, vitest_1.it)('should handle errors gracefully', () => {
            mockCliAgentService.switchAgentConnection.mockImplementation(() => {
                throw new Error('Switch error');
            });
            const result = service.switchAiAgentConnection('terminal1');
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.reason).toContain('Switch failed');
            (0, vitest_1.expect)(result.newStatus).toBe('none');
            (0, vitest_1.expect)(result.agentType).toBeNull();
        });
    });
    (0, vitest_1.describe)('dispose', () => {
        (0, vitest_1.it)('should dispose CLI Agent service', () => {
            service.dispose();
            (0, vitest_1.expect)(mockCliAgentService.dispose).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should handle disposal errors gracefully', () => {
            mockCliAgentService.dispose.mockImplementation(() => {
                throw new Error('Dispose error');
            });
            // Should not throw
            service.dispose();
        });
    });
    (0, vitest_1.describe)('Event Emitter Integration', () => {
        (0, vitest_1.it)('should expose onCliAgentStatusChange event', () => {
            const eventEmitter = service.onCliAgentStatusChange;
            (0, vitest_1.expect)(eventEmitter).toBe(mockCliAgentService.onCliAgentStatusChange);
        });
    });
    (0, vitest_1.describe)('Integration Tests', () => {
        (0, vitest_1.it)('should handle complete CLI Agent lifecycle', () => {
            // Start heartbeat
            service.startHeartbeat();
            (0, vitest_1.expect)(mockCliAgentService.startHeartbeat).toHaveBeenCalledOnce();
            // Detect from input
            service.handleTerminalInputForCliAgent('terminal1', 'claude-code "test"');
            (0, vitest_1.expect)(mockCliAgentService.detectFromInput).toHaveBeenCalled();
            // Check connection status
            mockCliAgentService.getAgentState.mockReturnValue({
                status: 'connected',
                agentType: 'claude',
            });
            (0, vitest_1.expect)(service.isCliAgentConnected('terminal1')).toBe(true);
            // Handle terminal removal
            service.handleTerminalRemoved('terminal1');
            (0, vitest_1.expect)(mockCliAgentService.handleTerminalRemoved).toHaveBeenCalledWith('terminal1');
            // Dispose
            service.dispose();
            (0, vitest_1.expect)(mockCliAgentService.dispose).toHaveBeenCalledOnce();
        });
        (0, vitest_1.it)('should handle error scenarios throughout lifecycle', () => {
            // Make all methods throw errors
            Object.keys(mockCliAgentService).forEach((key) => {
                try {
                    const method = mockCliAgentService[key];
                    if (method && typeof method === 'function' && 'mockImplementation' in method) {
                        method.mockImplementation(() => {
                            throw new Error('Test error');
                        });
                    }
                }
                catch (_e) {
                    // Ignore errors when setting up error scenarios
                }
            });
            // All operations should handle errors gracefully
            service.startHeartbeat();
            (0, vitest_1.expect)(service.isCliAgentConnected('terminal1')).toBe(false);
            (0, vitest_1.expect)(service.isCliAgentRunning('terminal1')).toBe(false);
            (0, vitest_1.expect)(service.getCurrentGloballyActiveAgent()).toBeNull();
            (0, vitest_1.expect)(service.refreshCliAgentState()).toBe(false);
            service.handleTerminalOutputForCliAgent('terminal1', 'data');
            service.handleTerminalInputForCliAgent('terminal1', 'data');
            (0, vitest_1.expect)(service.getAgentType('terminal1')).toBeNull();
            (0, vitest_1.expect)(service.getConnectedAgents().length).toBe(0);
            (0, vitest_1.expect)(service.getDisconnectedAgents().size).toBe(0);
            (0, vitest_1.expect)(service.getConnectedAgentTerminalId()).toBeNull();
            (0, vitest_1.expect)(service.getConnectedAgentType()).toBeNull();
            service.handleTerminalRemoved('terminal1');
            const switchResult = service.switchAiAgentConnection('terminal1');
            (0, vitest_1.expect)(switchResult.success).toBe(false);
            service.dispose();
        });
    });
});
//# sourceMappingURL=TerminalCliAgentIntegrationService.test.js.map