"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LRUCache_1 = require("../../../../utils/LRUCache");
(0, vitest_1.describe)('LRUCache', () => {
    (0, vitest_1.it)('should store and retrieve values', () => {
        const cache = new LRUCache_1.LRUCache(3);
        cache.set('a', 1);
        (0, vitest_1.expect)(cache.get('a')).toBe(1);
    });
    (0, vitest_1.it)('should respect maxSize and evict least recently used items', () => {
        const cache = new LRUCache_1.LRUCache(2);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3); // 'a' should be evicted
        (0, vitest_1.expect)(cache.has('a')).toBe(false);
        (0, vitest_1.expect)(cache.has('b')).toBe(true);
        (0, vitest_1.expect)(cache.has('c')).toBe(true);
    });
    (0, vitest_1.it)('should update item "freshness" on get', () => {
        const cache = new LRUCache_1.LRUCache(2);
        cache.set('a', 1);
        cache.set('b', 2);
        // Access 'a', making it MRU
        cache.get('a');
        cache.set('c', 3); // 'b' should be evicted instead of 'a'
        (0, vitest_1.expect)(cache.has('b')).toBe(false);
        (0, vitest_1.expect)(cache.has('a')).toBe(true);
        (0, vitest_1.expect)(cache.has('c')).toBe(true);
    });
    (0, vitest_1.it)('should support delete and clear', () => {
        const cache = new LRUCache_1.LRUCache(10);
        cache.set('a', 1);
        cache.delete('a');
        (0, vitest_1.expect)(cache.has('a')).toBe(false);
        cache.set('b', 2);
        cache.clear();
        (0, vitest_1.expect)(cache.size).toBe(0);
    });
    (0, vitest_1.it)('should overwrite existing keys', () => {
        const cache = new LRUCache_1.LRUCache(10);
        cache.set('a', 1);
        cache.set('a', 2);
        (0, vitest_1.expect)(cache.get('a')).toBe(2);
        (0, vitest_1.expect)(cache.size).toBe(1);
    });
});
//# sourceMappingURL=LRUCache.test.js.map