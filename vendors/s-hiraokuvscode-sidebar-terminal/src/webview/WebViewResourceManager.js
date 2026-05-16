"use strict";
/**
 * WebView Resource Manager
 *
 * Manages resources for WebView components including CSS, assets, and external resources.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewResourceManager = void 0;
class WebViewResourceManager {
    constructor() {
        this.resources = new Map();
        this.loadingPromises = new Map();
        this.disposed = false;
    }
    async initialize() {
        // Initialize default resources if needed
    }
    /**
     * Load a CSS resource
     */
    async loadCSS(id, url, options) {
        return this.loadResource({
            id,
            type: 'css',
            url,
            loaded: false,
        }, options);
    }
    /**
     * Load a JavaScript resource
     */
    async loadJS(id, url, options) {
        return this.loadResource({
            id,
            type: 'js',
            url,
            loaded: false,
        }, options);
    }
    /**
     * Load an image resource
     */
    async loadImage(id, url, options) {
        return this.loadResource({
            id,
            type: 'image',
            url,
            loaded: false,
        }, options);
    }
    /**
     * Load a font resource
     */
    async loadFont(id, url, options) {
        return this.loadResource({
            id,
            type: 'font',
            url,
            loaded: false,
        }, options);
    }
    /**
     * Generic resource loading method
     */
    async loadResource(resource, options) {
        if (this.disposed) {
            throw new Error('WebViewResourceManager has been disposed');
        }
        // Check if resource is already loaded
        const existing = this.resources.get(resource.id);
        if (existing && existing.loaded) {
            return existing;
        }
        // Check if loading is already in progress
        const loadingPromise = this.loadingPromises.get(resource.id);
        if (loadingPromise) {
            return loadingPromise;
        }
        // Start loading
        const promise = this.performLoad(resource, options);
        this.loadingPromises.set(resource.id, promise);
        try {
            const loadedResource = await promise;
            this.resources.set(resource.id, loadedResource);
            this.loadingPromises.delete(resource.id);
            return loadedResource;
        }
        catch (error) {
            this.loadingPromises.delete(resource.id);
            throw error;
        }
    }
    /**
     * Perform the actual resource loading
     */
    async performLoad(resource, options = {}) {
        const { timeout = 5000, retries = 3 } = options;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                switch (resource.type) {
                    case 'css':
                        await this.loadCSSResource(resource, timeout);
                        break;
                    case 'js':
                        await this.loadJSResource(resource, timeout);
                        break;
                    case 'image':
                        await this.loadImageResource(resource, timeout);
                        break;
                    case 'font':
                        await this.loadFontResource(resource, timeout);
                        break;
                    default:
                        await this.loadGenericResource(resource, timeout);
                }
                resource.loaded = true;
                return resource;
            }
            catch (error) {
                if (attempt === retries - 1) {
                    resource.error = error;
                    throw error;
                }
                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        throw new Error(`Failed to load resource ${resource.id} after ${retries} attempts`);
    }
    /**
     * Load CSS resource
     */
    async loadCSSResource(resource, timeout) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = resource.url;
            const timeoutId = setTimeout(() => {
                reject(new Error(`CSS load timeout: ${resource.url}`));
            }, timeout);
            link.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            link.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(`Failed to load CSS: ${resource.url}`));
            };
            document.head.appendChild(link);
        });
    }
    /**
     * Load JavaScript resource
     */
    async loadJSResource(resource, timeout) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = resource.url;
            const timeoutId = setTimeout(() => {
                reject(new Error(`JS load timeout: ${resource.url}`));
            }, timeout);
            script.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            script.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(`Failed to load JS: ${resource.url}`));
            };
            document.head.appendChild(script);
        });
    }
    /**
     * Load image resource
     */
    async loadImageResource(resource, timeout) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                reject(new Error(`Image load timeout: ${resource.url}`));
            }, timeout);
            img.onload = () => {
                clearTimeout(timeoutId);
                resolve();
            };
            img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error(`Failed to load image: ${resource.url}`));
            };
            img.src = resource.url;
        });
    }
    /**
     * Load font resource
     */
    async loadFontResource(resource, timeout) {
        if ('fonts' in document) {
            try {
                await document.fonts.load(`1em ${resource.url}`);
            }
            catch {
                throw new Error(`Failed to load font: ${resource.url}`);
            }
        }
        else {
            // Fallback for older browsers
            await this.loadCSSResource(resource, timeout);
        }
    }
    /**
     * Load generic resource via fetch
     */
    async loadGenericResource(resource, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(resource.url, {
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            resource.content = await response.text();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Get a loaded resource
     */
    getResource(id) {
        return this.resources.get(id);
    }
    /**
     * Check if a resource is loaded
     */
    isResourceLoaded(id) {
        const resource = this.resources.get(id);
        return resource?.loaded ?? false;
    }
    /**
     * Get all loaded resources
     */
    getAllResources() {
        return Array.from(this.resources.values());
    }
    /**
     * Unload a resource
     */
    unloadResource(id) {
        const resource = this.resources.get(id);
        if (resource) {
            // Remove from DOM if applicable
            if (resource.type === 'css') {
                const links = document.querySelectorAll(`link[href="${resource.url}"]`);
                links.forEach((link) => link.remove());
            }
            else if (resource.type === 'js') {
                const scripts = document.querySelectorAll(`script[src="${resource.url}"]`);
                scripts.forEach((script) => script.remove());
            }
            this.resources.delete(id);
        }
    }
    /**
     * Clear all resources
     */
    clearAllResources() {
        for (const id of this.resources.keys()) {
            this.unloadResource(id);
        }
    }
    /**
     * Check if resource manager is ready
     */
    isReady() {
        return !this.disposed;
    }
    dispose() {
        if (this.disposed)
            return;
        this.clearAllResources();
        this.loadingPromises.clear();
        this.disposed = true;
    }
}
exports.WebViewResourceManager = WebViewResourceManager;
//# sourceMappingURL=WebViewResourceManager.js.map