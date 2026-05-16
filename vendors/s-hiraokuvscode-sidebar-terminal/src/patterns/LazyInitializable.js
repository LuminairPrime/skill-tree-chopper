"use strict";
/**
 * LazyInitializable Base Class
 *
 * Provides a consistent lazy initialization pattern across the extension.
 * This base class ensures:
 * - Single initialization guarantee
 * - Support for both sync and async initialization
 * - Initialization state tracking
 * - Error handling during initialization
 *
 * Usage:
 * ```typescript
 * export class MyService extends LazyInitializable {
 *   protected async doInitialize(): Promise<void> {
 *     // Setup watchers, connections, etc.
 *     await this.connectToServer();
 *   }
 *
 *   public async performAction(): Promise<void> {
 *     this.ensureInitialized(); // Triggers initialization if needed
 *     // ... actual work
 *   }
 * }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyInitializable = exports.InitializationError = exports.InitializationState = void 0;
exports.withLazyInitialization = withLazyInitialization;
/**
 * Initialization state enum
 */
var InitializationState;
(function (InitializationState) {
    /** Not yet initialized */
    InitializationState["UNINITIALIZED"] = "uninitialized";
    /** Currently initializing */
    InitializationState["INITIALIZING"] = "initializing";
    /** Successfully initialized */
    InitializationState["INITIALIZED"] = "initialized";
    /** Initialization failed */
    InitializationState["FAILED"] = "failed";
})(InitializationState || (exports.InitializationState = InitializationState = {}));
/**
 * Error thrown when initialization fails
 */
class InitializationError extends Error {
    constructor(serviceName, cause) {
        super(`Failed to initialize ${serviceName}: ${cause?.message || 'Unknown error'}`);
        this.serviceName = serviceName;
        this.cause = cause;
        this.name = 'InitializationError';
    }
}
exports.InitializationError = InitializationError;
/**
 * Abstract base class for lazy initialization pattern.
 * Ensures services are initialized only when first needed.
 */
class LazyInitializable {
    constructor() {
        this._state = InitializationState.UNINITIALIZED;
        this._initPromise = null;
        this._initError = null;
        // Protected constructor to ensure proper inheritance
    }
    /**
     * Get the current initialization state.
     */
    get initializationState() {
        return this._state;
    }
    /**
     * Check if the service has been successfully initialized.
     */
    get isInitialized() {
        return this._state === InitializationState.INITIALIZED;
    }
    /**
     * Check if the service is currently initializing.
     */
    get isInitializing() {
        return this._state === InitializationState.INITIALIZING;
    }
    /**
     * Ensure the service is initialized.
     * If not initialized, this will trigger initialization synchronously.
     * For async initialization, use ensureInitializedAsync().
     *
     * @throws InitializationError if initialization fails
     */
    ensureInitialized() {
        if (this._state === InitializationState.INITIALIZED) {
            return;
        }
        if (this._state === InitializationState.FAILED) {
            throw new InitializationError(this.constructor.name, this._initError ?? undefined);
        }
        if (this._state === InitializationState.INITIALIZING) {
            // Already initializing - this is fine for sync access
            return;
        }
        // Start initialization
        this._state = InitializationState.INITIALIZING;
        try {
            const result = this.doInitialize();
            // If doInitialize returns a Promise, handle it
            if (result instanceof Promise) {
                this._initPromise = result.then(() => {
                    this._state = InitializationState.INITIALIZED;
                    this._initPromise = null;
                }, (error) => {
                    this._state = InitializationState.FAILED;
                    this._initError = error;
                    this._initPromise = null;
                });
                // Note: For sync access during async init, we return immediately
                // The state remains INITIALIZING
            }
            else {
                this._state = InitializationState.INITIALIZED;
            }
        }
        catch (error) {
            this._state = InitializationState.FAILED;
            this._initError = error instanceof Error ? error : new Error(String(error));
            throw new InitializationError(this.constructor.name, this._initError);
        }
    }
    /**
     * Ensure the service is initialized asynchronously.
     * Waits for any pending initialization to complete.
     *
     * @throws InitializationError if initialization fails
     */
    async ensureInitializedAsync() {
        if (this._state === InitializationState.INITIALIZED) {
            return;
        }
        if (this._state === InitializationState.FAILED) {
            throw new InitializationError(this.constructor.name, this._initError ?? undefined);
        }
        // If already initializing, wait for the existing promise
        if (this._initPromise) {
            await this._initPromise;
            // Re-check state after await (state may have changed during initialization)
            const currentState = this._state;
            if (currentState === InitializationState.FAILED) {
                throw new InitializationError(this.constructor.name, this._initError ?? undefined);
            }
            return;
        }
        // Start initialization
        this._state = InitializationState.INITIALIZING;
        try {
            const result = this.doInitialize();
            if (result instanceof Promise) {
                this._initPromise = result;
                await this._initPromise;
            }
            this._state = InitializationState.INITIALIZED;
            this._initPromise = null;
        }
        catch (error) {
            this._state = InitializationState.FAILED;
            this._initError = error instanceof Error ? error : new Error(String(error));
            this._initPromise = null;
            throw new InitializationError(this.constructor.name, this._initError);
        }
    }
    /**
     * Reset initialization state.
     * Use this for testing or to force re-initialization.
     *
     * WARNING: This may leave the service in an inconsistent state
     * if called while initialization is in progress.
     */
    resetInitialization() {
        this._state = InitializationState.UNINITIALIZED;
        this._initPromise = null;
        this._initError = null;
    }
}
exports.LazyInitializable = LazyInitializable;
/**
 * Mixin version of LazyInitializable for classes that can't extend it directly.
 * Use this when you need to apply lazy initialization to a class that already
 * has a base class.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withLazyInitialization(Base) {
    return class extends Base {
        constructor() {
            super(...arguments);
            this._initState = InitializationState.UNINITIALIZED;
            this._initPromise = null;
            this._initError = null;
        }
        get initializationState() {
            return this._initState;
        }
        get isInitialized() {
            return this._initState === InitializationState.INITIALIZED;
        }
        ensureInitialized() {
            if (this._initState === InitializationState.INITIALIZED) {
                return;
            }
            if (this._initState === InitializationState.FAILED) {
                throw new InitializationError(this.constructor.name, this._initError ?? undefined);
            }
            if (this._initState !== InitializationState.INITIALIZING) {
                this._initState = InitializationState.INITIALIZING;
                try {
                    if ('doInitialize' in this && typeof this.doInitialize === 'function') {
                        const result = this.doInitialize();
                        if (!(result instanceof Promise)) {
                            this._initState = InitializationState.INITIALIZED;
                        }
                    }
                    else {
                        this._initState = InitializationState.INITIALIZED;
                    }
                }
                catch (error) {
                    this._initState = InitializationState.FAILED;
                    this._initError = error instanceof Error ? error : new Error(String(error));
                    throw new InitializationError(this.constructor.name, this._initError);
                }
            }
        }
        async ensureInitializedAsync() {
            if (this._initState === InitializationState.INITIALIZED) {
                return;
            }
            if (this._initState === InitializationState.FAILED) {
                throw new InitializationError(this.constructor.name, this._initError ?? undefined);
            }
            if (this._initPromise) {
                await this._initPromise;
                return;
            }
            this._initState = InitializationState.INITIALIZING;
            try {
                if ('doInitialize' in this && typeof this.doInitialize === 'function') {
                    const result = this.doInitialize();
                    if (result instanceof Promise) {
                        this._initPromise = result;
                        await result;
                    }
                }
                this._initState = InitializationState.INITIALIZED;
                this._initPromise = null;
            }
            catch (error) {
                this._initState = InitializationState.FAILED;
                this._initError = error instanceof Error ? error : new Error(String(error));
                this._initPromise = null;
                throw new InitializationError(this.constructor.name, this._initError);
            }
        }
        resetInitialization() {
            this._initState = InitializationState.UNINITIALIZED;
            this._initPromise = null;
            this._initError = null;
        }
    };
}
//# sourceMappingURL=LazyInitializable.js.map