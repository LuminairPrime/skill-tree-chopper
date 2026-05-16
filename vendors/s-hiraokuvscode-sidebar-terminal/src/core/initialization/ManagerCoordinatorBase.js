"use strict";
/**
 * Manager Coordinator Base
 *
 * Abstract base class for coordinating multiple managers/services.
 * Consolidates manager initialization patterns from:
 * - LightweightTerminalWebviewManager (15+ specialized managers)
 * - SecondaryTerminalProvider (event coordinator, services)
 *
 * Provides:
 * - Centralized manager lifecycle management
 * - Coordinator relationship setup
 * - Manager initialization ordering
 * - Manager disposal coordination
 *
 * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/218
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerCoordinatorBase = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Abstract base class for manager coordination
 */
class ManagerCoordinatorBase {
    constructor() {
        this.managers = new Map();
        this._initializationMetrics = {
            totalManagers: 0,
            initializedManagers: 0,
            failedInitializations: 0,
            initializationTime: 0,
        };
    }
    /**
     * Template Method - Initialize all managers
     *
     * This method should NOT be overridden by subclasses.
     * Instead, implement createCoreManagers() and createSpecializedManagers().
     */
    async initializeAllManagers() {
        const startTime = Date.now();
        try {
            this.logInitialization('Starting manager initialization...');
            // Step 1: Create core managers (required)
            await this.createCoreManagers();
            // Step 2: Create specialized managers (optional)
            await this.createSpecializedManagers();
            // Step 3: Set coordinator references
            this.setCoordinatorReferences();
            // Step 4: Initialize manager instances
            await this.initializeManagerInstances();
            // Update metrics
            this._initializationMetrics.totalManagers = this.managers.size;
            this._initializationMetrics.initializationTime = Date.now() - startTime;
            this.logInitialization(`Manager initialization complete: ${this._initializationMetrics.initializedManagers}/${this._initializationMetrics.totalManagers} managers in ${this._initializationMetrics.initializationTime}ms`);
        }
        catch (error) {
            this.logError('Manager initialization failed', error);
            throw error;
        }
    }
    /**
     * Dispose all managers
     */
    disposeAllManagers() {
        this.logInitialization('Disposing managers...');
        let disposedCount = 0;
        this.managers.forEach((manager, key) => {
            try {
                if (manager.dispose) {
                    manager.dispose();
                    disposedCount++;
                }
            }
            catch (error) {
                this.logError(`Failed to dispose manager '${String(key)}'`, error);
            }
        });
        this.managers.clear();
        this.logInitialization(`Disposed ${disposedCount} managers`);
    }
    /**
     * Get a manager by key
     */
    getManager(key) {
        return this.managers.get(key);
    }
    /**
     * Check if a manager exists
     */
    hasManager(key) {
        return this.managers.has(key);
    }
    /**
     * Get all manager keys
     */
    getManagerKeys() {
        return Array.from(this.managers.keys());
    }
    /**
     * Get manager metrics
     */
    getMetrics() {
        return { ...this._initializationMetrics };
    }
    // ============================================================================
    // HOOK METHODS - Optional overrides with default implementations
    // ============================================================================
    /**
     * Create specialized managers (optional)
     *
     * Override to add context-specific managers.
     *
     * Example:
     * - LightweightTerminalWebviewManager: Create FindInTerminalManager, ProfileManager
     */
    async createSpecializedManagers() {
        // Default: No-op
    }
    /**
     * Set coordinator references on all managers
     *
     * Override to customize coordinator setup.
     *
     * Default behavior: Call setCoordinator(this) on all managers that support it.
     */
    setCoordinatorReferences() {
        this.managers.forEach((manager, key) => {
            try {
                if (manager.setCoordinator) {
                    manager.setCoordinator(this);
                    this.logInitialization(`Set coordinator for '${String(key)}'`);
                }
            }
            catch (error) {
                this.logError(`Failed to set coordinator for '${String(key)}'`, error);
            }
        });
    }
    /**
     * Initialize all manager instances
     *
     * Override to customize initialization order or logic.
     *
     * Default behavior: Call initialize() on all managers that support it.
     */
    async initializeManagerInstances() {
        for (const [key, manager] of this.managers.entries()) {
            try {
                if (manager.initialize) {
                    await manager.initialize();
                    this._initializationMetrics.initializedManagers++;
                    this.logInitialization(`Initialized '${String(key)}'`);
                }
            }
            catch (error) {
                this._initializationMetrics.failedInitializations++;
                this.handleManagerInitializationError(key, manager, error);
            }
        }
    }
    /**
     * Handle manager initialization error
     *
     * Override to implement custom error handling (e.g., fallback managers).
     *
     * Example:
     * - LightweightTerminalWebviewManager: Use NOOP_SHELL_INTEGRATION_MANAGER on error
     */
    handleManagerInitializationError(key, manager, error) {
        this.logError(`Failed to initialize manager '${String(key)}'`, error);
        throw error;
    }
    // ============================================================================
    // CONCRETE UTILITY METHODS - Reusable (DO NOT override)
    // ============================================================================
    /**
     * Register a manager
     */
    registerManager(key, manager) {
        if (this.managers.has(key)) {
            this.logWarning(`Manager '${String(key)}' already registered (overwriting)`);
        }
        this.managers.set(key, manager);
        this.logInitialization(`Registered manager '${String(key)}'`);
    }
    /**
     * Register multiple managers at once
     */
    registerManagers(managers) {
        Object.entries(managers).forEach(([key, manager]) => {
            this.registerManager(key, manager);
        });
    }
    /**
     * Unregister a manager
     */
    unregisterManager(key) {
        const manager = this.managers.get(key);
        if (manager) {
            try {
                if (manager.dispose) {
                    manager.dispose();
                }
            }
            catch (error) {
                this.logError(`Error disposing manager '${String(key)}'`, error);
            }
            return this.managers.delete(key);
        }
        return false;
    }
    /**
     * Log initialization information
     */
    logInitialization(message) {
        (0, logger_1.info)(`[ManagerCoordinator] ${message}`);
    }
    /**
     * Log warning
     */
    logWarning(message) {
        (0, logger_1.warn)(`[ManagerCoordinator] ${message}`);
    }
    /**
     * Log error
     */
    logError(message, error) {
        (0, logger_1.error)(`[ManagerCoordinator] ${message}:`, error);
    }
}
exports.ManagerCoordinatorBase = ManagerCoordinatorBase;
//# sourceMappingURL=ManagerCoordinatorBase.js.map