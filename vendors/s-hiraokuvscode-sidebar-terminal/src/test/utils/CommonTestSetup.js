"use strict";
/**
 * Common test setup utilities to reduce code duplication across test files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMockTerminalManagerForCliAgent = exports.safeStub = exports.createMockCliAgentDetectionService = exports.setupCliAgentTestPatterns = exports.setupTerminalTestMocks = exports.setupCliAgentTestMocks = exports.cleanupTestEnvironment = exports.setupTestEnvironment = exports.cleanupGlobalDOM = exports.setupGlobalDOM = exports.createTestDOMEnvironment = exports.setupProcessMock = exports.setupVSCodeMock = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const sinon = require("sinon");
const jsdom_1 = require("jsdom");
/**
 * Standard VS Code API mock setup
 * IMPORTANT: Always reset vscode mock to avoid conflicts with global TestSetup stubs
 */
const setupVSCodeMock = () => {
    // Delete existing vscode mock to avoid "already stubbed" errors
    delete global.vscode;
    // Create fresh mock
    global.vscode = {
        workspace: {
            getConfiguration: () => ({ get: () => undefined }),
        },
    };
};
exports.setupVSCodeMock = setupVSCodeMock;
/**
 * Standard process mock setup for test environment
 * IMPORTANT: Don't overwrite process completely to preserve EventEmitter methods
 */
const setupProcessMock = () => {
    const originalProcess = global.process;
    // Don't overwrite process - just modify properties to avoid breaking EventEmitter methods
    if (!originalProcess.nextTick || typeof originalProcess.nextTick !== 'function') {
        originalProcess.nextTick = (callback) => setImmediate(callback);
    }
    if (!originalProcess.env.NODE_ENV) {
        originalProcess.env.NODE_ENV = 'test';
    }
};
exports.setupProcessMock = setupProcessMock;
/**
 * Create a standard JSDOM environment with notification container
 */
const createTestDOMEnvironment = (withNotificationContainer = false) => {
    const htmlContent = withNotificationContainer
        ? `<!DOCTYPE html>
       <html>
         <body>
           <div id="notification-container"></div>
         </body>
       </html>`
        : '<!DOCTYPE html><html><body></body></html>';
    return new jsdom_1.JSDOM(htmlContent);
};
exports.createTestDOMEnvironment = createTestDOMEnvironment;
/**
 * Setup global DOM objects
 */
const setupGlobalDOM = (dom) => {
    const document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.getComputedStyle = dom.window.getComputedStyle;
};
exports.setupGlobalDOM = setupGlobalDOM;
/**
 * Cleanup global DOM objects
 */
const cleanupGlobalDOM = () => {
    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.getComputedStyle;
};
exports.cleanupGlobalDOM = cleanupGlobalDOM;
/**
 * Complete test environment setup
 */
const setupTestEnvironment = (options = {}) => {
    const { withClock = false, withNotificationContainer = false } = options;
    // Setup mocks
    (0, exports.setupVSCodeMock)();
    (0, exports.setupProcessMock)();
    // Create DOM environment
    const dom = (0, exports.createTestDOMEnvironment)(withNotificationContainer);
    (0, exports.setupGlobalDOM)(dom);
    // Create sandbox and optional clock
    const sandbox = sinon.createSandbox();
    const clock = withClock ? sinon.useFakeTimers() : undefined;
    return {
        dom,
        document: dom.window.document,
        sandbox,
        clock,
    };
};
exports.setupTestEnvironment = setupTestEnvironment;
/**
 * Complete test environment cleanup
 */
const cleanupTestEnvironment = (env) => {
    if (env.clock) {
        env.clock.restore();
    }
    env.sandbox.restore();
    (0, exports.cleanupGlobalDOM)();
};
exports.cleanupTestEnvironment = cleanupTestEnvironment;
/**
 * Common CLI Agent test setup - Mock CLI Agent detection patterns
 */
const setupCliAgentTestMocks = (sandbox) => {
    // Mock data patterns for CLI Agent tests
    const mockCliAgentPatterns = {
        claudePrompt: '> claude-code "',
        geminiPrompt: '> gemini code "',
        claudeComplete: 'Claude Code task completed successfully',
        geminiComplete: 'Gemini Code task completed successfully',
    };
    // Common CLI Agent status mock
    const mockCliAgentStatus = {
        isActive: false,
        activeAgent: null,
        lastActivity: Date.now(),
    };
    return {
        mockCliAgentPatterns,
        mockCliAgentStatus,
    };
};
exports.setupCliAgentTestMocks = setupCliAgentTestMocks;
/**
 * Common terminal test setup - Mock terminal states and data
 */
const setupTerminalTestMocks = (sandbox) => {
    // Mock terminal data
    const mockTerminalData = {
        terminalId: 'test-terminal-1',
        processId: 12345,
        title: 'Test Terminal',
        isActive: true,
        scrollbackBuffer: ['test line 1', 'test line 2', 'test line 3'],
    };
    // Mock terminal manager state
    const mockTerminalManagerState = {
        terminals: new Map(),
        activeTerminalId: 'test-terminal-1',
        terminalCount: 1,
    };
    return {
        mockTerminalData,
        mockTerminalManagerState,
    };
};
exports.setupTerminalTestMocks = setupTerminalTestMocks;
/**
 * CLI Agent specific test patterns and mocks
 */
const setupCliAgentTestPatterns = () => {
    // Standard shell prompts for termination detection
    const validPromptPatterns = [
        // Standard bash/zsh prompts
        'user@hostname:~/path$',
        'user@hostname:~/path$  ',
        'user@hostname:~/workspace/project$',
        'root@server:/home#',
        // Oh-My-Zsh themes
        '➜ myproject',
        '➜  workspace',
        // Starship prompt
        '❯',
        '❯ ',
        '❯   ',
        // PowerShell
        'PS C:\\Users\\User>',
        'PS /home/user>',
        // Fish shell
        'user workspace>',
        'user ~/Documents/projects>',
        // Simple prompts
        '$',
        '$ ',
        '#',
        '# ',
        '>',
        '> ',
    ];
    // CLI Agent command patterns
    const cliAgentCommands = {
        claude: [
            'claude-code "help"',
            'claude-code "fix the bug"',
            'claude-code "refactor this function"',
        ],
        gemini: ['gemini code "analyze"', 'gemini code "optimize"', 'gemini code "test"'],
    };
    // CLI Agent completion patterns
    const completionPatterns = [
        'Claude Code task completed successfully',
        'Gemini Code task completed successfully',
        'Task completed.',
        'Done.',
    ];
    // False positive patterns that should NOT trigger CLI Agent detection
    const falsePositivePatterns = [
        'echo "claude-code test"',
        'cat file_with_claude_in_name.txt',
        'grep "gemini" logs.txt',
        'ls -la',
        'npm install',
        'git status',
    ];
    return {
        validPromptPatterns,
        cliAgentCommands,
        completionPatterns,
        falsePositivePatterns,
    };
};
exports.setupCliAgentTestPatterns = setupCliAgentTestPatterns;
/**
 * Mock CLI Agent detection service for testing
 */
const createMockCliAgentDetectionService = (sandbox) => {
    const mockService = {
        isCliAgentActive: sandbox.stub(),
        detectCliAgentActivity: sandbox.stub(),
        getActiveAgent: sandbox.stub(),
        resetDetection: sandbox.stub(),
        getDetectionStats: sandbox.stub(),
    };
    // Default behavior
    mockService.isCliAgentActive.returns(false);
    mockService.getActiveAgent.returns(null);
    mockService.getDetectionStats.returns({
        totalDetections: 0,
        falsePositives: 0,
        successfulTerminations: 0,
    });
    return mockService;
};
exports.createMockCliAgentDetectionService = createMockCliAgentDetectionService;
/**
 * Safe stub creation that handles already-stubbed objects
 * Prevents "Attempted to wrap X which is already stubbed" errors
 */
const safeStub = (sandbox, obj, method) => {
    // If already stubbed, restore it first
    if (obj[method] && typeof obj[method].restore === 'function') {
        obj[method].restore();
    }
    return sandbox.stub(obj, method);
};
exports.safeStub = safeStub;
/**
 * Setup mock terminal manager for CLI Agent tests
 */
const setupMockTerminalManagerForCliAgent = (sandbox) => {
    const mockTerminalManager = {
        createTerminal: sandbox.stub(),
        killTerminal: sandbox.stub(),
        deleteTerminal: sandbox.stub(),
        getActiveTerminal: sandbox.stub(),
        getAllTerminals: sandbox.stub(),
        focusTerminal: sandbox.stub(),
        sendData: sandbox.stub(),
        dispose: sandbox.stub(),
        // CLI Agent specific methods
        getTerminalById: sandbox.stub(),
        isTerminalActive: sandbox.stub(),
        getTerminalCount: sandbox.stub(),
    };
    // Default return values
    mockTerminalManager.getActiveTerminal.returns({
        id: 'test-terminal-1',
        title: 'Terminal 1',
        isActive: true,
    });
    mockTerminalManager.getAllTerminals.returns([
        {
            id: 'test-terminal-1',
            title: 'Terminal 1',
            isActive: true,
        },
    ]);
    mockTerminalManager.getTerminalCount.returns(1);
    mockTerminalManager.isTerminalActive.returns(true);
    return mockTerminalManager;
};
exports.setupMockTerminalManagerForCliAgent = setupMockTerminalManagerForCliAgent;
//# sourceMappingURL=CommonTestSetup.js.map