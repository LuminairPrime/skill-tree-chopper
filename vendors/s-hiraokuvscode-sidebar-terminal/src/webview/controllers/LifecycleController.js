"use strict";
/**
 * Manages terminal lifecycle with proper resource management and lazy addon loading.
 * Uses DisposableStore pattern for unified resource management and LIFO disposal.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleController = void 0;
const ManagerLogger_1 = require("../utils/ManagerLogger");
/** Collects disposables and disposes them all at once in LIFO order. */
class DisposableStore {
    constructor() {
        this.disposables = [];
        this.disposed = false;
    }
    add(disposable) {
        if (this.disposed) {
            ManagerLogger_1.terminalLogger.warn('⚠️ Attempting to add to disposed DisposableStore');
            disposable.dispose();
            return disposable;
        }
        this.disposables.push(disposable);
        return disposable;
    }
    dispose() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        while (this.disposables.length > 0) {
            const disposable = this.disposables.pop();
            if (disposable) {
                try {
                    disposable.dispose();
                }
                catch (error) {
                    ManagerLogger_1.terminalLogger.warn('⚠️ Error disposing resource:', error);
                }
            }
        }
    }
    clear() {
        this.dispose();
        this.disposables = [];
        this.disposed = false;
    }
    get isDisposed() {
        return this.disposed;
    }
}
class LifecycleController {
    constructor() {
        this.terminals = new Map();
        this.addonCache = new Map();
        this.disposed = false;
    }
    attachTerminal(terminalId, terminal) {
        if (this.disposed) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ LifecycleController disposed, cannot attach terminal: ${terminalId}`);
            return;
        }
        if (this.terminals.has(terminalId)) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ Terminal ${terminalId} already attached, detaching first`);
            this.detachTerminal(terminalId);
        }
        const resources = {
            terminal,
            disposables: new DisposableStore(),
            addons: new Map(),
            eventListeners: new Map(),
        };
        this.terminals.set(terminalId, resources);
        ManagerLogger_1.terminalLogger.info(`✅ LifecycleController: Attached terminal ${terminalId}`);
    }
    detachTerminal(terminalId) {
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ Terminal ${terminalId} not found for detachment`);
            return;
        }
        resources.disposables.dispose();
        resources.addons.clear();
        resources.eventListeners.clear();
        this.terminals.delete(terminalId);
        ManagerLogger_1.terminalLogger.info(`✅ LifecycleController: Detached terminal ${terminalId}`);
    }
    /** Load addon lazily (only when needed), reducing initial memory usage. */
    loadAddonLazy(terminalId, addonName, AddonClass, options = {}) {
        const { lazy = true, cache = true, required = false } = options;
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ Terminal ${terminalId} not found for addon loading: ${addonName}`);
            return null;
        }
        // Check if addon already loaded for this terminal
        if (resources.addons.has(addonName)) {
            ManagerLogger_1.terminalLogger.debug(`♻️ Reusing existing addon for ${terminalId}: ${addonName}`);
            return resources.addons.get(addonName);
        }
        // Check global cache if caching enabled
        const cacheKey = `${addonName}`;
        if (cache && this.addonCache.has(cacheKey)) {
            ManagerLogger_1.terminalLogger.debug(`♻️ Reusing cached addon: ${addonName}`);
            const cachedAddon = this.addonCache.get(cacheKey);
            resources.addons.set(addonName, cachedAddon);
            return cachedAddon;
        }
        try {
            // Create new addon instance
            const addon = new AddonClass();
            // Load addon to terminal
            resources.terminal.loadAddon(addon);
            // Add to disposables
            resources.disposables.add(addon);
            // Store in terminal addons
            resources.addons.set(addonName, addon);
            // Cache globally if enabled
            if (cache) {
                this.addonCache.set(cacheKey, addon);
            }
            ManagerLogger_1.terminalLogger.info(`✅ Loaded addon${lazy ? ' (lazy)' : ''} for ${terminalId}: ${addonName}`);
            return addon;
        }
        catch (error) {
            const errorMsg = `Failed to load addon ${addonName} for ${terminalId}`;
            if (required) {
                ManagerLogger_1.terminalLogger.error(`❌ ${errorMsg}:`, error);
                throw new Error(errorMsg);
            }
            else {
                ManagerLogger_1.terminalLogger.warn(`⚠️ ${errorMsg}:`, error);
                return null;
            }
        }
    }
    addEventListener(terminalId, eventName, handler) {
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ Terminal ${terminalId} not found for event listener: ${eventName}`);
            return;
        }
        // Store handler for cleanup
        resources.eventListeners.set(eventName, handler);
        ManagerLogger_1.terminalLogger.debug(`✅ Added event listener for ${terminalId}: ${eventName}`);
    }
    removeEventListener(terminalId, eventName) {
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            return;
        }
        resources.eventListeners.delete(eventName);
        ManagerLogger_1.terminalLogger.debug(`🧹 Removed event listener for ${terminalId}: ${eventName}`);
    }
    disposeTerminal(terminalId) {
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ Terminal ${terminalId} not found for disposal`);
            return;
        }
        const startTime = performance.now();
        try {
            // Clear cached addons that belong to this terminal to prevent serving disposed addons
            for (const [addonName, addonInstance] of resources.addons) {
                const cacheKey = `${addonName}`;
                if (this.addonCache.get(cacheKey) === addonInstance) {
                    this.addonCache.delete(cacheKey);
                }
            }
            resources.disposables.dispose();
            resources.addons.clear();
            resources.eventListeners.clear();
            this.terminals.delete(terminalId);
            const elapsed = performance.now() - startTime;
            ManagerLogger_1.terminalLogger.info(`✅ LifecycleController: Disposed terminal ${terminalId} in ${elapsed.toFixed(2)}ms`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`❌ Error disposing terminal ${terminalId}:`, error);
        }
    }
    getAddon(terminalId, addonName) {
        const resources = this.terminals.get(terminalId);
        if (!resources) {
            return null;
        }
        return resources.addons.get(addonName) || null;
    }
    hasTerminal(terminalId) {
        return this.terminals.has(terminalId);
    }
    getStats() {
        return {
            attachedTerminals: this.terminals.size,
            cachedAddons: this.addonCache.size,
            terminals: Array.from(this.terminals.keys()),
        };
    }
    dispose() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        ManagerLogger_1.terminalLogger.info(`🧹 LifecycleController: Disposing ${this.terminals.size} terminals`);
        for (const [terminalId] of this.terminals) {
            this.disposeTerminal(terminalId);
        }
        this.addonCache.clear();
        ManagerLogger_1.terminalLogger.info('✅ LifecycleController: Disposed');
    }
}
exports.LifecycleController = LifecycleController;
//# sourceMappingURL=LifecycleController.js.map