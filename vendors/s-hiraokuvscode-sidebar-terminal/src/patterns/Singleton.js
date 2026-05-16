"use strict";
/**
 * Singleton Base Class
 *
 * Provides a consistent singleton pattern implementation across the extension.
 * This base class ensures:
 * - Type-safe singleton instantiation
 * - Testability with resetInstance() for unit tests
 * - Prevention of accidental multiple instantiation
 *
 * Usage:
 * ```typescript
 * export class MyService extends Singleton<MyService> {
 *   private constructor() {
 *     super();
 *     // Initialize...
 *   }
 *
 *   public static getInstance(): MyService {
 *     return Singleton.getInstanceOf(MyService, () => new MyService());
 *   }
 * }
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Singleton = void 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const instances = new Map();
/**
 * Abstract base class for implementing the Singleton pattern.
 * Provides consistent singleton behavior across the codebase.
 */
class Singleton {
    constructor() {
        const ctor = this.constructor;
        if (instances.has(ctor)) {
            throw new Error(`Singleton ${ctor.name} already instantiated. Use getInstance() instead.`);
        }
    }
    /**
     * Get or create an instance of the singleton class.
     * This is the recommended way to implement getInstance() in subclasses.
     *
     * @param ctor - The constructor of the singleton class
     * @param factory - A factory function to create a new instance
     * @returns The singleton instance
     */
    static getInstanceOf(ctor, factory) {
        if (!instances.has(ctor)) {
            const instance = factory();
            instances.set(ctor, instance);
        }
        return instances.get(ctor);
    }
    /**
     * Reset the singleton instance for testing purposes.
     * WARNING: Only use this in test environments.
     *
     * @param ctor - The constructor of the singleton class to reset
     */
    static resetInstance(ctor) {
        instances.delete(ctor);
    }
    /**
     * Check if an instance exists for the given constructor.
     *
     * @param ctor - The constructor to check
     * @returns true if an instance exists
     */
    static hasInstance(ctor) {
        return instances.has(ctor);
    }
    /**
     * Get all registered singleton classes (for debugging).
     *
     * @returns Array of constructor names
     */
    static getRegisteredSingletons() {
        return Array.from(instances.keys()).map((ctor) => ctor.name);
    }
    /**
     * Reset all singleton instances (for testing).
     * WARNING: Only use this in test environments.
     */
    static resetAllInstances() {
        instances.clear();
    }
}
exports.Singleton = Singleton;
//# sourceMappingURL=Singleton.js.map