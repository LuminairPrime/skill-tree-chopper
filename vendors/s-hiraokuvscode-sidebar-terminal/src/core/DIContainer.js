"use strict";
/**
 * Lightweight Dependency Injection Container
 *
 * Provides service registration, resolution, and lifecycle management without
 * external dependencies. Supports singleton, transient, and scoped lifetimes.
 *
 * @example
 * ```typescript
 * const container = new DIContainer();
 * container.register(IMyService, () => new MyService(), ServiceLifetime.Singleton);
 * const service = container.resolve(IMyService);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIContainer = exports.ServiceNotRegisteredError = exports.CircularDependencyError = exports.ServiceToken = exports.ServiceLifetime = void 0;
exports.createServiceToken = createServiceToken;
const logger_1 = require("../utils/logger");
/**
 * Service lifetime options
 */
var ServiceLifetime;
(function (ServiceLifetime) {
    /** Single instance per container */
    ServiceLifetime[ServiceLifetime["Singleton"] = 0] = "Singleton";
    /** New instance per resolve */
    ServiceLifetime[ServiceLifetime["Transient"] = 1] = "Transient";
    /** Single instance per scope */
    ServiceLifetime[ServiceLifetime["Scoped"] = 2] = "Scoped";
})(ServiceLifetime || (exports.ServiceLifetime = ServiceLifetime = {}));
/**
 * Service token for type-safe registration and resolution
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ServiceToken {
    constructor(id) {
        this.id = id;
    }
}
exports.ServiceToken = ServiceToken;
/**
 * Error thrown when circular dependencies are detected
 */
class CircularDependencyError extends Error {
    constructor(dependencyChain) {
        super(`Circular dependency detected: ${dependencyChain.join(' -> ')}`);
        this.dependencyChain = dependencyChain;
        this.name = 'CircularDependencyError';
    }
}
exports.CircularDependencyError = CircularDependencyError;
/**
 * Error thrown when a service is not registered
 */
class ServiceNotRegisteredError extends Error {
    constructor(serviceId) {
        super(`Service not registered: ${serviceId}`);
        this.serviceId = serviceId;
        this.name = 'ServiceNotRegisteredError';
    }
}
exports.ServiceNotRegisteredError = ServiceNotRegisteredError;
/**
 * Lightweight Dependency Injection Container
 */
class DIContainer {
    constructor(parentContainer) {
        this._services = new Map();
        this._singletons = new Map();
        this._resolutionStack = [];
        this._scopes = [];
        this._isDisposed = false;
        this._parentContainer = parentContainer;
    }
    /**
     * Register a service with the container
     *
     * @param token Service token for type-safe resolution
     * @param factory Factory function to create service instances
     * @param lifetime Service lifetime (Singleton, Transient, or Scoped)
     *
     * @example
     * ```typescript
     * container.register(ILogger, () => new ConsoleLogger(), ServiceLifetime.Singleton);
     * ```
     */
    register(token, factory, lifetime = ServiceLifetime.Singleton) {
        this._ensureNotDisposed();
        if (this._services.has(token.id)) {
            throw new Error(`Service already registered: ${token.id}`);
        }
        this._services.set(token.id, { factory, lifetime });
    }
    /**
     * Resolve a service from the container
     *
     * @param token Service token to resolve
     * @returns Service instance
     * @throws {ServiceNotRegisteredError} If service is not registered
     * @throws {CircularDependencyError} If circular dependency is detected
     *
     * @example
     * ```typescript
     * const logger = container.resolve(ILogger);
     * ```
     */
    resolve(token) {
        this._ensureNotDisposed();
        // Check if already in resolution stack (circular dependency)
        if (this._resolutionStack.includes(token.id)) {
            throw new CircularDependencyError([...this._resolutionStack, token.id]);
        }
        // Try to resolve from current container
        const registration = this._services.get(token.id);
        // If not found in current container, check parent
        if (!registration && this._parentContainer) {
            // Get registration from parent
            const parentRegistration = this._parentContainer._services.get(token.id);
            // For scoped services, handle them in the current scope (not delegate to parent)
            if (parentRegistration?.lifetime === ServiceLifetime.Scoped) {
                return this._resolveScoped(token.id, parentRegistration);
            }
            // For other lifetimes, delegate to parent
            return this._parentContainer.resolve(token);
        }
        if (!registration) {
            throw new ServiceNotRegisteredError(token.id);
        }
        // Handle different lifetimes
        switch (registration.lifetime) {
            case ServiceLifetime.Singleton:
                return this._resolveSingleton(token.id, registration);
            case ServiceLifetime.Transient:
                return this._resolveTransient(token.id, registration);
            case ServiceLifetime.Scoped:
                return this._resolveScoped(token.id, registration);
            default:
                throw new Error(`Unknown service lifetime: ${registration.lifetime}`);
        }
    }
    /**
     * Try to resolve a service, returning undefined if not registered
     *
     * @param token Service token to resolve
     * @returns Service instance or undefined
     */
    tryResolve(token) {
        try {
            return this.resolve(token);
        }
        catch (error) {
            if (error instanceof ServiceNotRegisteredError) {
                return undefined;
            }
            throw error;
        }
    }
    /**
     * Check if a service is registered
     *
     * @param token Service token to check
     * @returns True if service is registered
     */
    isRegistered(token) {
        if (this._services.has(token.id)) {
            return true;
        }
        if (this._parentContainer) {
            return this._parentContainer.isRegistered(token);
        }
        return false;
    }
    /**
     * Create a scoped container for scoped service lifetimes
     *
     * @returns New scoped container
     *
     * @example
     * ```typescript
     * const scope = container.createScope();
     * const scopedService = scope.resolve(IScopedService);
     * scope.dispose(); // Cleanup scoped instances
     * ```
     */
    createScope() {
        this._ensureNotDisposed();
        const scope = new DIContainer(this);
        this._scopes.push(scope);
        return scope;
    }
    /**
     * Dispose the container and cleanup all singletons
     * Singletons are disposed in reverse registration order
     */
    dispose() {
        if (this._isDisposed) {
            return;
        }
        // Dispose all scopes first
        for (const scope of this._scopes) {
            scope.dispose();
        }
        this._scopes.length = 0;
        // Dispose all singletons in reverse order
        const singletons = Array.from(this._singletons.entries()).reverse();
        for (const [, instance] of singletons) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                }
                catch (error) {
                    (0, logger_1.error)('Error disposing singleton:', error);
                }
            }
        }
        this._singletons.clear();
        this._services.clear();
        this._isDisposed = true;
    }
    /**
     * Get the number of registered services
     */
    get serviceCount() {
        return this._services.size;
    }
    /**
     * Get all registered service tokens
     */
    getRegisteredTokens() {
        return Array.from(this._services.keys());
    }
    _resolveSingleton(id, registration) {
        // Check if singleton already exists
        let instance = this._singletons.get(id);
        if (!instance) {
            // Create singleton instance
            this._resolutionStack.push(id);
            try {
                instance = registration.factory(this);
                this._singletons.set(id, instance);
            }
            finally {
                this._resolutionStack.pop();
            }
        }
        return instance;
    }
    _resolveTransient(id, registration) {
        // Always create new instance
        this._resolutionStack.push(id);
        try {
            return registration.factory(this);
        }
        finally {
            this._resolutionStack.pop();
        }
    }
    _resolveScoped(id, registration) {
        // Scoped services are singletons within a scope
        // Check if instance already exists in this scope's cache
        let instance = this._singletons.get(id);
        if (!instance) {
            // Create new instance for this scope
            this._resolutionStack.push(id);
            try {
                instance = registration.factory(this);
                this._singletons.set(id, instance);
            }
            finally {
                this._resolutionStack.pop();
            }
        }
        return instance;
    }
    _ensureNotDisposed() {
        if (this._isDisposed) {
            throw new Error('Cannot use disposed DIContainer');
        }
    }
}
exports.DIContainer = DIContainer;
/**
 * Create a strongly-typed service token
 *
 * @param id Unique identifier for the service
 * @returns Service token
 *
 * @example
 * ```typescript
 * const ILogger = createServiceToken<ILogger>('ILogger');
 * container.register(ILogger, () => new ConsoleLogger(), ServiceLifetime.Singleton);
 * ```
 */
function createServiceToken(id) {
    return new ServiceToken(id);
}
//# sourceMappingURL=DIContainer.js.map