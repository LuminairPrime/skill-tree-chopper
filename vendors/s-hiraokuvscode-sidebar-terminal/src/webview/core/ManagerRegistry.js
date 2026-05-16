"use strict";
/**
 * Manager Registry - Unified Lifecycle Management
 *
 * Provides centralized registration, initialization, and disposal of managers.
 * Eliminates duplicate initialization/disposal code across 27+ managers.
 *
 * Key Features:
 * - Dependency-ordered initialization
 * - LIFO (Last-In-First-Out) disposal for safe cleanup
 * - Lazy initialization support
 * - Type-safe manager retrieval
 *
 * @example
 * ```typescript
 * const registry = new ManagerRegistry();
 *
 * // Register managers
 * registry.register('notification', () => new NotificationManager());
 * registry.register('ui', () => new UIManager(), { dependsOn: ['notification'] });
 *
 * // Initialize all
 * await registry.initializeAll();
 *
 * // Get manager
 * const ui = registry.get<UIManager>('ui');
 *
 * // Dispose all (LIFO order)
 * registry.disposeAll();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerRegistry = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Manager Registry for unified lifecycle management
 */
class ManagerRegistry {
    constructor() {
        this.managers = new Map();
        this.initOrder = [];
        this.isDisposed = false;
    }
    /**
     * Register a manager with optional configuration
     *
     * @param name Unique identifier for the manager
     * @param factory Function that creates the manager instance
     * @param options Registration options (lazy, dependencies, priority)
     * @returns The manager instance (unless lazy)
     */
    register(name, factory, options = {}) {
        if (this.managers.has(name)) {
            (0, logger_1.webview)(`[ManagerRegistry] ⚠️ Manager '${name}' already registered, skipping`);
            return this.get(name) ?? null;
        }
        const registered = {
            factory,
            instance: options.lazy ? null : factory(),
            options,
            initialized: false,
        };
        this.managers.set(name, registered);
        if (!options.lazy && registered.instance) {
            this.initOrder.push(name);
        }
        (0, logger_1.webview)(`[ManagerRegistry] ✅ Registered manager: ${name}${options.lazy ? ' (lazy)' : ''}`);
        return registered.instance;
    }
    /**
     * Get a registered manager by name
     *
     * @param name Manager identifier
     * @returns The manager instance or undefined
     */
    get(name) {
        const registered = this.managers.get(name);
        if (!registered) {
            (0, logger_1.webview)(`[ManagerRegistry] ⚠️ Manager '${name}' not found`);
            return undefined;
        }
        // Lazy instantiation
        if (!registered.instance) {
            registered.instance = registered.factory();
            this.initOrder.push(name);
            (0, logger_1.webview)(`[ManagerRegistry] 🔧 Lazy-created manager: ${name}`);
        }
        return registered.instance;
    }
    /**
     * Check if a manager is registered
     */
    has(name) {
        return this.managers.has(name);
    }
    /**
     * Initialize all registered managers in dependency order
     */
    async initializeAll() {
        if (this.isDisposed) {
            throw new Error('[ManagerRegistry] Cannot initialize after disposal');
        }
        (0, logger_1.webview)('[ManagerRegistry] 🚀 Initializing all managers...');
        const startTime = performance.now();
        // Sort by priority and dependencies
        const sortedNames = this.getSortedInitOrder();
        for (const name of sortedNames) {
            await this.initializeManager(name);
        }
        const elapsed = performance.now() - startTime;
        (0, logger_1.webview)(`[ManagerRegistry] ✅ All managers initialized (${elapsed.toFixed(2)}ms)`);
    }
    /**
     * Initialize a single manager
     */
    async initializeManager(name) {
        const registered = this.managers.get(name);
        if (!registered || registered.initialized) {
            return;
        }
        // Initialize dependencies first
        for (const dep of registered.options.dependsOn || []) {
            await this.initializeManager(dep);
        }
        // Create instance if lazy
        if (!registered.instance) {
            registered.instance = registered.factory();
            this.initOrder.push(name);
        }
        // Call initialize if available
        if (registered.instance.initialize) {
            try {
                await registered.instance.initialize();
                (0, logger_1.webview)(`[ManagerRegistry] ✅ Initialized: ${name}`);
            }
            catch (error) {
                (0, logger_1.webview)(`[ManagerRegistry] ❌ Failed to initialize ${name}:`, error);
                throw error;
            }
        }
        registered.initialized = true;
    }
    /**
     * Get initialization order sorted by priority and dependencies
     */
    getSortedInitOrder() {
        const entries = Array.from(this.managers.entries());
        // Sort by priority (higher first), then by registration order
        entries.sort((a, b) => {
            const priorityA = a[1].options.priority ?? 0;
            const priorityB = b[1].options.priority ?? 0;
            return priorityB - priorityA;
        });
        // Topological sort for dependencies
        const result = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (name) => {
            if (visited.has(name))
                return;
            if (visiting.has(name)) {
                throw new Error(`[ManagerRegistry] Circular dependency detected: ${name}`);
            }
            visiting.add(name);
            const registered = this.managers.get(name);
            for (const dep of registered?.options.dependsOn || []) {
                visit(dep);
            }
            visiting.delete(name);
            visited.add(name);
            result.push(name);
        };
        for (const [name] of entries) {
            visit(name);
        }
        return result;
    }
    /**
     * Dispose all managers in reverse order (LIFO)
     */
    disposeAll() {
        if (this.isDisposed) {
            (0, logger_1.webview)('[ManagerRegistry] ⚠️ Already disposed');
            return;
        }
        (0, logger_1.webview)('[ManagerRegistry] 🧹 Disposing all managers...');
        const startTime = performance.now();
        // Dispose in reverse order (LIFO)
        const disposeOrder = [...this.initOrder].reverse();
        for (const name of disposeOrder) {
            this.disposeManager(name);
        }
        this.managers.clear();
        this.initOrder = [];
        this.isDisposed = true;
        const elapsed = performance.now() - startTime;
        (0, logger_1.webview)(`[ManagerRegistry] ✅ All managers disposed (${elapsed.toFixed(2)}ms)`);
    }
    /**
     * Dispose a single manager
     */
    disposeManager(name) {
        const registered = this.managers.get(name);
        if (!registered?.instance) {
            return;
        }
        try {
            registered.instance.dispose();
            (0, logger_1.webview)(`[ManagerRegistry] 🧹 Disposed: ${name}`);
        }
        catch (error) {
            (0, logger_1.webview)(`[ManagerRegistry] ❌ Error disposing ${name}:`, error);
        }
        registered.instance = null;
        registered.initialized = false;
    }
    /**
     * Get statistics about registered managers
     */
    getStats() {
        let initialized = 0;
        let lazy = 0;
        const names = [];
        for (const [name, registered] of this.managers.entries()) {
            names.push(name);
            if (registered.initialized)
                initialized++;
            if (registered.options.lazy)
                lazy++;
        }
        return {
            total: this.managers.size,
            initialized,
            lazy,
            names,
        };
    }
}
exports.ManagerRegistry = ManagerRegistry;
//# sourceMappingURL=ManagerRegistry.js.map