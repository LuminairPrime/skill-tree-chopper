"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = void 0;
exports.registerProvider = registerProvider;
exports.findProvider = findProvider;
exports.getProviders = getProviders;
class ProviderRegistryImpl {
    constructor() {
        this.providers = [];
    }
    register(provider) {
        // Check for duplicate IDs
        if (this.providers.some((p) => p.id === provider.id)) {
            throw new Error(`Provider with id "${provider.id}" already registered`);
        }
        this.providers.push(provider);
    }
    findProvider(url) {
        for (const provider of this.providers) {
            const match = provider.match(url);
            if (match.matches) {
                return provider;
            }
        }
        return null;
    }
    getProviders() {
        return [...this.providers];
    }
}
// Singleton registry instance
exports.registry = new ProviderRegistryImpl();
/**
 * Register a provider with the global registry.
 */
function registerProvider(provider) {
    exports.registry.register(provider);
}
/**
 * Find a provider that matches the given URL.
 */
function findProvider(url) {
    return exports.registry.findProvider(url);
}
/**
 * Get all registered providers.
 */
function getProviders() {
    return exports.registry.getProviders();
}
//# sourceMappingURL=registry.js.map