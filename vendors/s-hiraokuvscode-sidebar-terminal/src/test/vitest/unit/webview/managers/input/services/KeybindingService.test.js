"use strict";
/**
 * KeybindingService Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const KeybindingService_1 = require("../../../../../../../webview/managers/input/services/KeybindingService");
(0, vitest_1.describe)('KeybindingService', () => {
    let service;
    let logger;
    (0, vitest_1.beforeEach)(() => {
        logger = vitest_1.vi.fn();
        service = new KeybindingService_1.KeybindingService(logger);
        // Stub navigator
        vitest_1.vi.stubGlobal('navigator', {
            platform: 'MacIntel',
            clipboard: { readText: vitest_1.vi.fn() },
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('Settings Management', () => {
        (0, vitest_1.it)('should update sendKeybindingsToShell', () => {
            service.updateSettings({ sendKeybindingsToShell: true });
            // Implicitly check via logger or behavior
            // We can't access private property easily, but behavior test covers it
            (0, vitest_1.expect)(logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('sendKeybindingsToShell updated: true'));
        });
        (0, vitest_1.it)('should update commandsToSkipShell', () => {
            service.updateSettings({
                commandsToSkipShell: ['test.command', '-workbench.action.quickOpen'],
            });
            (0, vitest_1.expect)(logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Added command'));
            (0, vitest_1.expect)(logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('Removed command'));
        });
        (0, vitest_1.it)('should update allowChords', () => {
            service.updateSettings({ allowChords: false });
            (0, vitest_1.expect)(logger).toHaveBeenCalledWith(vitest_1.expect.stringContaining('allowChords updated: false'));
        });
    });
    (0, vitest_1.describe)('Keybinding Resolution', () => {
        (0, vitest_1.it)('should resolve mac keybindings', () => {
            vitest_1.vi.stubGlobal('navigator', { platform: 'MacIntel' });
            const event = new KeyboardEvent('keydown', { key: 'p', metaKey: true });
            const command = service.resolveKeybinding(event);
            (0, vitest_1.expect)(command).toBe('workbench.action.quickOpen');
        });
        (0, vitest_1.it)('should resolve windows/linux keybindings', () => {
            vitest_1.vi.stubGlobal('navigator', { platform: 'Win32' });
            const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true });
            const command = service.resolveKeybinding(event);
            (0, vitest_1.expect)(command).toBe('workbench.action.quickOpen');
        });
        (0, vitest_1.it)('should resolve complex combinations', () => {
            vitest_1.vi.stubGlobal('navigator', { platform: 'MacIntel' });
            const event = new KeyboardEvent('keydown', { key: '5', metaKey: true, shiftKey: true });
            const command = service.resolveKeybinding(event);
            (0, vitest_1.expect)(command).toBe('workbench.action.terminal.split');
        });
        (0, vitest_1.it)('should return null for unknown combinations', () => {
            const event = new KeyboardEvent('keydown', { key: 'unknown' });
            const command = service.resolveKeybinding(event);
            (0, vitest_1.expect)(command).toBeNull();
        });
    });
    (0, vitest_1.describe)('shouldSkipShell', () => {
        (0, vitest_1.it)('should skip shell for commands in skip list', () => {
            service.updateSettings({ sendKeybindingsToShell: false });
            const event = new KeyboardEvent('keydown', { key: 'p', metaKey: true });
            const skip = service.shouldSkipShell(event, 'workbench.action.quickOpen');
            (0, vitest_1.expect)(skip).toBe(true);
        });
        (0, vitest_1.it)('should NOT skip shell if sendKeybindingsToShell is true', () => {
            service.updateSettings({ sendKeybindingsToShell: true });
            const event = new KeyboardEvent('keydown', { key: 'p', metaKey: true });
            const skip = service.shouldSkipShell(event, 'workbench.action.quickOpen');
            (0, vitest_1.expect)(skip).toBe(false);
        });
        (0, vitest_1.it)('should skip shell in chord mode', () => {
            service.setChordMode(true);
            service.updateSettings({ allowChords: true });
            const event = new KeyboardEvent('keydown', { key: 'a' });
            const skip = service.shouldSkipShell(event);
            (0, vitest_1.expect)(skip).toBe(true);
        });
        (0, vitest_1.it)('should NOT skip shell in chord mode if escape pressed', () => {
            service.setChordMode(true);
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            const skip = service.shouldSkipShell(event);
            (0, vitest_1.expect)(skip).toBe(false);
        });
        (0, vitest_1.it)('should detect system keybindings (Windows Alt+F4)', () => {
            vitest_1.vi.stubGlobal('navigator', { platform: 'Win32' });
            const event = new KeyboardEvent('keydown', { key: 'F4', altKey: true });
            const skip = service.shouldSkipShell(event);
            (0, vitest_1.expect)(skip).toBe(true);
        });
        (0, vitest_1.it)('should detect mnemonics on Windows', () => {
            vitest_1.vi.stubGlobal('navigator', { platform: 'Win32' });
            service.updateSettings({ allowMnemonics: true });
            const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
            const skip = service.shouldSkipShell(event);
            (0, vitest_1.expect)(skip).toBe(true);
        });
    });
    (0, vitest_1.describe)('State Management', () => {
        (0, vitest_1.it)('should manage chord mode', () => {
            service.setChordMode(true);
            (0, vitest_1.expect)(service.isChordMode()).toBe(true);
            service.setChordMode(false);
            (0, vitest_1.expect)(service.isChordMode()).toBe(false);
        });
    });
});
//# sourceMappingURL=KeybindingService.test.js.map