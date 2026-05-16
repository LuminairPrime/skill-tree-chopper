"use strict";
/**
 * Dependency Injection Container
 *
 * Addresses the tight coupling issues identified in the analysis by providing
 * a centralized dependency management system with lifecycle support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyContainer = exports.ServiceLifecycle = exports.ServiceType = void 0;
const logger_1 = require("../../utils/logger");
const webview_1 = require("../constants/webview");
/**
 * Service registration types
 */
var ServiceType;
(function (ServiceType) {
    // Coordinator services
    ServiceType["TERMINAL_COORDINATOR"] = "terminal_coordinator";
    ServiceType["EXTENSION_COMMUNICATOR"] = "extension_communicator";
    ServiceType["SETTINGS_COORDINATOR"] = "settings_coordinator";
    ServiceType["CLI_AGENT_COORDINATOR"] = "cli_agent_coordinator";
    ServiceType["SESSION_COORDINATOR"] = "session_coordinator";
    ServiceType["LOGGING_COORDINATOR"] = "logging_coordinator";
    ServiceType["MANAGER_PROVIDER"] = "manager_provider";
    // Manager services
    ServiceType["UI_MANAGER"] = "ui_manager";
    ServiceType["INPUT_MANAGER"] = "input_manager";
    ServiceType["PERFORMANCE_MANAGER"] = "performance_manager";
    ServiceType["CONFIG_MANAGER"] = "config_manager";
    ServiceType["MESSAGE_MANAGER"] = "message_manager";
    ServiceType["NOTIFICATION_MANAGER"] = "notification_manager";
    ServiceType["SPLIT_MANAGER"] = "split_manager";
    // Utility services
    ServiceType["ERROR_MANAGER"] = "error_manager";
    ServiceType["PERFORMANCE_MONITOR"] = "performance_monitor";
    ServiceType["VALIDATION_SERVICE"] = "validation_service";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
/**
 * Service lifecycle states
 */
var ServiceLifecycle;
(function (ServiceLifecycle) {
    ServiceLifecycle["REGISTERED"] = "registered";
    ServiceLifecycle["INITIALIZING"] = "initializing";
    ServiceLifecycle["INITIALIZED"] = "initialized";
    ServiceLifecycle["DISPOSING"] = "disposing";
    ServiceLifecycle["DISPOSED"] = "disposed";
    ServiceLifecycle["ERROR"] = "error";
})(ServiceLifecycle || (exports.ServiceLifecycle = ServiceLifecycle = {}));
/**
 * Dependency injection container with lifecycle management
 */
class DependencyContainer {
    constructor() {
        this.services = new Map();
        this.initializationOrder = [];
        this.disposalOrder = [];
        this.isDisposing = false;
    }
    /**
     * Register a service with its factory and dependencies
     */
    register(serviceType, factory, dependencies = []) {
        if (this.services.has(serviceType)) {
            throw new Error(`Service ${serviceType} is already registered`);
        }
        this.services.set(serviceType, {
            factory,
            lifecycle: ServiceLifecycle.REGISTERED,
            dependencies,
        });
        (0, logger_1.webview)(`🔧 [DI] Registered service: ${serviceType}`);
    }
    /**
     * Register a service with an existing instance
     */
    registerInstance(serviceType, instance, dependencies = []) {
        this.services.set(serviceType, {
            factory: () => instance,
            lifecycle: ServiceLifecycle.INITIALIZED,
            dependencies,
            instance,
        });
        (0, logger_1.webview)(`🔧 [DI] Registered instance: ${serviceType}`);
    }
    /**
     * Resolve a service and its dependencies
     */
    async resolve(serviceType) {
        if (this.isDisposing) {
            throw new Error('Container is disposing, cannot resolve services');
        }
        const registration = this.services.get(serviceType);
        if (!registration) {
            throw new Error(`Service ${serviceType} is not registered`);
        }
        // Return existing instance if available
        if (registration.instance) {
            return registration.instance;
        }
        // Return existing initialization promise if in progress
        if (registration.initializationPromise) {
            return registration.initializationPromise;
        }
        // Start initialization
        registration.lifecycle = ServiceLifecycle.INITIALIZING;
        registration.initializationPromise = this.initializeService(serviceType, registration);
        try {
            const instance = await registration.initializationPromise;
            registration.instance = instance;
            registration.lifecycle = ServiceLifecycle.INITIALIZED;
            // Track initialization order for proper disposal
            if (!this.initializationOrder.includes(serviceType)) {
                this.initializationOrder.push(serviceType);
            }
            (0, logger_1.webview)(`✅ [DI] Resolved service: ${serviceType}`);
            return instance;
        }
        catch (error) {
            registration.lifecycle = ServiceLifecycle.ERROR;
            registration.error = error;
            throw error;
        }
    }
    /**
     * Initialize a service and its dependencies
     */
    async initializeService(serviceType, registration) {
        // Resolve dependencies first
        const resolvedDependencies = [];
        for (const depType of registration.dependencies) {
            const dependency = await this.resolve(depType);
            resolvedDependencies.push(dependency);
        }
        // Create the service instance
        const instance = await registration.factory();
        // If it's an enhanced base manager, initialize it with dependencies
        if (this.isEnhancedBaseManager(instance)) {
            const managerDeps = this.buildManagerDependencies(resolvedDependencies, registration.dependencies);
            await instance.initialize(managerDeps);
        }
        return instance;
    }
    /**
     * Build manager dependencies object from resolved dependencies
     */
    buildManagerDependencies(resolvedDeps, depTypes) {
        const dependencies = {};
        depTypes.forEach((depType, index) => {
            const resolvedDep = resolvedDeps[index];
            switch (depType) {
                case ServiceType.TERMINAL_COORDINATOR:
                    dependencies.terminalCoordinator = resolvedDep;
                    break;
                case ServiceType.EXTENSION_COMMUNICATOR:
                    dependencies.extensionCommunicator = resolvedDep;
                    break;
                case ServiceType.SETTINGS_COORDINATOR:
                    dependencies.settingsCoordinator = resolvedDep;
                    break;
                case ServiceType.CLI_AGENT_COORDINATOR:
                    dependencies.cliAgentCoordinator = resolvedDep;
                    break;
                case ServiceType.SESSION_COORDINATOR:
                    dependencies.sessionCoordinator = resolvedDep;
                    break;
                case ServiceType.LOGGING_COORDINATOR:
                    dependencies.loggingCoordinator = resolvedDep;
                    break;
                case ServiceType.MANAGER_PROVIDER:
                    dependencies.managerProvider = resolvedDep;
                    break;
                default:
                    // Add to custom dependencies
                    dependencies[depType] = resolvedDep;
                    break;
            }
        });
        return dependencies;
    }
    /**
     * Check if an instance is an enhanced base manager
     */
    isEnhancedBaseManager(instance) {
        return (instance &&
            typeof instance.initialize === 'function' &&
            typeof instance.dispose === 'function' &&
            typeof instance.getHealthStatus === 'function');
    }
    /**
     * Get all resolved services of a specific type
     */
    getResolvedServices() {
        const resolved = new Map();
        for (const [type, registration] of this.services) {
            if (registration.instance) {
                resolved.set(type, registration.instance);
            }
        }
        return resolved;
    }
    /**
     * Check if a service is registered
     */
    isRegistered(serviceType) {
        return this.services.has(serviceType);
    }
    /**
     * Check if a service is resolved
     */
    isResolved(serviceType) {
        const registration = this.services.get(serviceType);
        return registration?.instance !== undefined;
    }
    /**
     * Get service health status
     */
    getServiceHealth() {
        const health = new Map();
        for (const [type, registration] of this.services) {
            health.set(type, {
                lifecycle: registration.lifecycle,
                error: registration.error?.message,
            });
        }
        return health;
    }
    /**
     * Get dependency graph for debugging
     */
    getDependencyGraph() {
        const graph = new Map();
        for (const [type, registration] of this.services) {
            graph.set(type, [...registration.dependencies]);
        }
        return graph;
    }
    /**
     * Validate dependency graph for circular dependencies
     */
    validateDependencyGraph() {
        const errors = [];
        const visited = new Set();
        const visiting = new Set();
        const detectCycles = (serviceType) => {
            if (visiting.has(serviceType)) {
                errors.push(`Circular dependency detected involving ${serviceType}`);
                return false;
            }
            if (visited.has(serviceType)) {
                return true;
            }
            visiting.add(serviceType);
            const registration = this.services.get(serviceType);
            if (registration) {
                for (const dependency of registration.dependencies) {
                    if (!this.services.has(dependency)) {
                        errors.push(`Missing dependency: ${serviceType} depends on unregistered ${dependency}`);
                        continue;
                    }
                    if (!detectCycles(dependency)) {
                        return false;
                    }
                }
            }
            visiting.delete(serviceType);
            visited.add(serviceType);
            return true;
        };
        for (const serviceType of this.services.keys()) {
            if (!visited.has(serviceType)) {
                detectCycles(serviceType);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Dispose all services in reverse initialization order
     */
    async dispose() {
        if (this.isDisposing) {
            return;
        }
        this.isDisposing = true;
        (0, logger_1.webview)('🧹 [DI] Starting container disposal...');
        // Dispose in reverse initialization order
        const disposalOrder = [...this.initializationOrder].reverse();
        for (const serviceType of disposalOrder) {
            const registration = this.services.get(serviceType);
            if (registration?.instance) {
                try {
                    registration.lifecycle = ServiceLifecycle.DISPOSING;
                    if (this.isEnhancedBaseManager(registration.instance)) {
                        registration.instance.dispose();
                    }
                    registration.lifecycle = ServiceLifecycle.DISPOSED;
                    registration.instance = undefined;
                    (0, logger_1.webview)(`🧹 [DI] Disposed service: ${serviceType}`);
                }
                catch (error) {
                    (0, logger_1.webview)(`❌ [DI] Error disposing service ${serviceType}: ${error}`);
                    registration.lifecycle = ServiceLifecycle.ERROR;
                    registration.error = error;
                }
            }
        }
        // Clear all registrations
        this.services.clear();
        this.initializationOrder.length = 0;
        this.disposalOrder.length = 0;
        (0, logger_1.webview)('✅ [DI] Container disposal completed');
    }
    /**
     * Create a scoped container for testing
     */
    createScope() {
        const scope = new DependencyContainer();
        // Copy registrations but not instances
        for (const [type, registration] of this.services) {
            scope.register(type, registration.factory, [...registration.dependencies]);
        }
        return scope;
    }
    /**
     * Get container statistics
     */
    getStatistics() {
        let initialized = 0;
        let errors = 0;
        for (const registration of this.services.values()) {
            if (registration.instance) {
                initialized++;
            }
            if (registration.error) {
                errors++;
            }
        }
        return {
            totalServices: this.services.size,
            registeredServices: this.services.size,
            initializedServices: initialized,
            errorServices: errors,
            memoryUsage: this.estimateMemoryUsage(),
        };
    }
    /**
     * Estimate memory usage of the container
     */
    estimateMemoryUsage() {
        // Rough estimation using named constants
        return (this.services.size * webview_1.DEPENDENCY_CONTAINER_CONSTANTS.SERVICE_MEMORY_OVERHEAD_BYTES +
            this.initializationOrder.length *
                webview_1.DEPENDENCY_CONTAINER_CONSTANTS.ORDER_TRACKING_OVERHEAD_BYTES +
            this.getResolvedServices().size * webview_1.DEPENDENCY_CONTAINER_CONSTANTS.INSTANCE_OVERHEAD_BYTES);
    }
}
exports.DependencyContainer = DependencyContainer;
//# sourceMappingURL=DependencyContainer.js.map