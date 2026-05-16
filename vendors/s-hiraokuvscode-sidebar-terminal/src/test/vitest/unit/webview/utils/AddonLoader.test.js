"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AddonLoader_1 = require("../../../../../webview/utils/AddonLoader");
// Mock logger
vitest_1.vi.mock('../../../../../webview/utils/ManagerLogger', () => ({
    terminalLogger: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('AddonLoader', () => {
    let mockTerminal;
    (0, vitest_1.beforeEach)(() => {
        mockTerminal = {
            loadAddon: vitest_1.vi.fn(),
        };
        vitest_1.vi.clearAllMocks();
    });
    class MockAddon {
        constructor() {
            this.activate = vitest_1.vi.fn();
        }
    }
    class FailingAddon {
        constructor() {
            throw new Error('Simulation Failure');
        }
    }
    (0, vitest_1.describe)('loadAddon', () => {
        (0, vitest_1.it)('should successfully load an addon', async () => {
            const addon = await AddonLoader_1.AddonLoader.loadAddon(mockTerminal, 't1', MockAddon);
            (0, vitest_1.expect)(addon).toBeInstanceOf(MockAddon);
            (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalledWith(addon);
        });
        (0, vitest_1.it)('should call onLoaded after loading', async () => {
            const onLoaded = vitest_1.vi.fn();
            const addon = await AddonLoader_1.AddonLoader.loadAddon(mockTerminal, 't1', MockAddon, { onLoaded });
            (0, vitest_1.expect)(onLoaded).toHaveBeenCalledWith(addon, mockTerminal);
        });
        (0, vitest_1.it)('should throw error for required addon failure', async () => {
            await (0, vitest_1.expect)(AddonLoader_1.AddonLoader.loadAddon(mockTerminal, 't1', FailingAddon, { required: true })).rejects.toThrow('Simulation Failure');
        });
        (0, vitest_1.it)('should return undefined for optional addon failure', async () => {
            const addon = await AddonLoader_1.AddonLoader.loadAddon(mockTerminal, 't1', FailingAddon, {
                required: false,
            });
            (0, vitest_1.expect)(addon).toBeUndefined();
            (0, vitest_1.expect)(mockTerminal.loadAddon).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('loadAddonWithResult', () => {
        (0, vitest_1.it)('should return success result', async () => {
            const result = await AddonLoader_1.AddonLoader.loadAddonWithResult(mockTerminal, 't1', MockAddon);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.addon).toBeInstanceOf(MockAddon);
        });
        (0, vitest_1.it)('should return failure result instead of throwing', async () => {
            const result = await AddonLoader_1.AddonLoader.loadAddonWithResult(mockTerminal, 't1', FailingAddon);
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBeDefined();
        });
    });
    (0, vitest_1.describe)('loadMultipleAddons', () => {
        (0, vitest_1.it)('should load multiple addons and return a map', async () => {
            const addons = [
                { AddonClass: MockAddon, options: { addonName: 'Addon1' } },
                { AddonClass: MockAddon, options: { addonName: 'Addon2' } },
            ];
            const resultMap = await AddonLoader_1.AddonLoader.loadMultipleAddons(mockTerminal, 't1', addons);
            (0, vitest_1.expect)(resultMap.size).toBe(2);
            (0, vitest_1.expect)(resultMap.get('Addon1')).toBeInstanceOf(MockAddon);
            (0, vitest_1.expect)(resultMap.get('Addon2')).toBeInstanceOf(MockAddon);
        });
    });
});
//# sourceMappingURL=AddonLoader.test.js.map