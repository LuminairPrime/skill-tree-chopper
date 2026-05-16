"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
/**
 * Simple LRU (Least Recently Used) Cache implementation
 * Useful for caching detection results and other temporary data
 */
class LRUCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    set(key, value) {
        // Remove old entry if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Add new entry
        this.cache.set(key, value);
        // Remove least recently used if over capacity
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    get size() {
        return this.cache.size;
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=LRUCache.js.map