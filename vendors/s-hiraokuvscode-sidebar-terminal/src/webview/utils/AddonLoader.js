"use strict";
/**
 * AddonLoader Utility
 *
 * Generic utility for loading xterm.js addons with consistent error handling,
 * logging, and support for optional vs required addons.
 *
 * Eliminates code duplication across addon loading operations.
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/unify-addon-loading/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddonLoader = void 0;
const ManagerLogger_1 = require("./ManagerLogger");
/**
 * Generic addon loader with consistent error handling and logging
 */
class AddonLoader {
    /**
     * Load an addon with consistent error handling and logging
     *
     * @param terminal - The terminal instance to load the addon into
     * @param terminalId - Terminal ID for logging
     * @param AddonClass - The addon constructor class
     * @param options - Loading options (required/optional, custom name, post-load callback)
     * @returns The loaded addon instance or undefined (for optional addons that fail)
     *
     * @example
     * // Load required addon
     * const fitAddon = await AddonLoader.loadAddon(
     *   terminal,
     *   'terminal-1',
     *   FitAddon,
     *   { required: true }
     * );
     *
     * @example
     * // Load optional addon with custom initialization
     * const unicode11Addon = await AddonLoader.loadAddon(
     *   terminal,
     *   'terminal-1',
     *   Unicode11Addon,
     *   {
     *     required: false,
     *     onLoaded: (addon, term) => {
     *       term.unicode.activeVersion = '11';
     *     }
     *   }
     * );
     */
    static async loadAddon(terminal, terminalId, AddonClass, options = {}) {
        const { required = true, addonName, onLoaded } = options;
        const name = addonName || AddonClass.name;
        try {
            // Instantiate the addon
            const addon = new AddonClass();
            // Load into terminal
            terminal.loadAddon(addon);
            // Execute post-load initialization if provided
            if (onLoaded) {
                onLoaded(addon, terminal);
            }
            // Log success
            ManagerLogger_1.terminalLogger.info(`✅ ${name} loaded: ${terminalId}`);
            return addon;
        }
        catch (error) {
            // Handle errors based on required/optional
            if (required) {
                ManagerLogger_1.terminalLogger.error(`❌ Failed to load ${name} for ${terminalId}:`, error);
                throw error;
            }
            else {
                ManagerLogger_1.terminalLogger.warn(`⚠️ ${name} failed to load for ${terminalId}:`, error);
                return undefined;
            }
        }
    }
    /**
     * Load addon with detailed result information (useful for testing/debugging)
     *
     * @param terminal - The terminal instance
     * @param terminalId - Terminal ID for logging
     * @param AddonClass - The addon constructor class
     * @param options - Loading options
     * @returns Detailed result with addon, success status, and error if any
     */
    static async loadAddonWithResult(terminal, terminalId, AddonClass, options = {}) {
        try {
            const addon = await this.loadAddon(terminal, terminalId, AddonClass, options);
            return {
                addon,
                success: addon !== undefined,
            };
        }
        catch (error) {
            return {
                addon: undefined,
                success: false,
                error,
            };
        }
    }
    /**
     * Load multiple addons in parallel
     *
     * @param terminal - The terminal instance
     * @param terminalId - Terminal ID for logging
     * @param addons - Array of addon specifications
     * @returns Map of addon names to loaded addon instances
     *
     * @example
     * const loadedAddons = await AddonLoader.loadMultipleAddons(
     *   terminal,
     *   'terminal-1',
     *   [
     *     { AddonClass: FitAddon, options: { required: true } },
     *     { AddonClass: SearchAddon, options: { required: false } },
     *   ]
     * );
     */
    static async loadMultipleAddons(terminal, terminalId, addons) {
        const results = await Promise.all(addons.map(async ({ AddonClass, options }) => {
            const addon = await this.loadAddon(terminal, terminalId, AddonClass, options);
            const name = options?.addonName || AddonClass.name;
            return { name, addon };
        }));
        const addonMap = new Map();
        for (const { name, addon } of results) {
            if (addon !== undefined) {
                addonMap.set(name, addon);
            }
        }
        return addonMap;
    }
}
exports.AddonLoader = AddonLoader;
//# sourceMappingURL=AddonLoader.js.map