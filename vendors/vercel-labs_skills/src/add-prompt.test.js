"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const add_js_1 = require("./add.js");
const skillLock = require("./skill-lock.js");
const searchMultiselectModule = require("./prompts/search-multiselect.js");
// Mock dependencies
vitest_1.vi.mock('./skill-lock.js');
vitest_1.vi.mock('./prompts/search-multiselect.js');
vitest_1.vi.mock('./telemetry.js', () => ({
    setVersion: vitest_1.vi.fn(),
    track: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../package.json', () => ({
    default: { version: '1.0.0' },
}));
(0, vitest_1.describe)('promptForAgents', () => {
    // Cast to any to avoid AgentType validation in tests
    const choices = [
        { value: 'opencode', label: 'OpenCode' },
        { value: 'cursor', label: 'Cursor' },
        { value: 'claude-code', label: 'Claude Code' },
    ];
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should use default agents (claude-code, opencode, codex) when no history exists', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(undefined);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(['opencode']);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        // Should default to claude-code, opencode, codex (filtered by available choices)
        (0, vitest_1.expect)(searchMultiselectModule.searchMultiselect).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            initialSelected: ['claude-code', 'opencode'],
        }));
    });
    (0, vitest_1.it)('should use last selected agents when history exists', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(['cursor']);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(['cursor']);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        (0, vitest_1.expect)(searchMultiselectModule.searchMultiselect).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            initialSelected: ['cursor'],
        }));
    });
    (0, vitest_1.it)('should filter out invalid agents from history', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(['cursor', 'invalid-agent']);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(['cursor']);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        (0, vitest_1.expect)(searchMultiselectModule.searchMultiselect).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            initialSelected: ['cursor'],
        }));
    });
    (0, vitest_1.it)('should use default agents if all history agents are invalid', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(['invalid-agent']);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(['opencode']);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        // When history is invalid, should fall back to defaults (claude-code, opencode, codex)
        // filtered by available choices
        (0, vitest_1.expect)(searchMultiselectModule.searchMultiselect).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            initialSelected: ['claude-code', 'opencode'],
        }));
    });
    (0, vitest_1.it)('should save selected agents if not cancelled', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(undefined);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(['opencode']);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        (0, vitest_1.expect)(skillLock.saveSelectedAgents).toHaveBeenCalledWith(['opencode']);
    });
    (0, vitest_1.it)('should not save agents if cancelled', async () => {
        vitest_1.vi.mocked(skillLock.getLastSelectedAgents).mockResolvedValue(undefined);
        vitest_1.vi.mocked(searchMultiselectModule.searchMultiselect).mockResolvedValue(searchMultiselectModule.cancelSymbol);
        await (0, add_js_1.promptForAgents)('Select agents', choices);
        (0, vitest_1.expect)(skillLock.saveSelectedAgents).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=add-prompt.test.js.map