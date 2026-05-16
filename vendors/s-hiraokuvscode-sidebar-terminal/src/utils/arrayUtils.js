"use strict";
/**
 * Array Utility Functions
 * Common array operations to eliminate code duplication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.arraysEqual = arraysEqual;
exports.isArrayEqual = isArrayEqual;
exports.haveSameElements = haveSameElements;
exports.unique = unique;
exports.chunk = chunk;
/**
 * Compare two arrays for equality
 * Checks if arrays have the same length and elements in the same order
 *
 * @param a First array
 * @param b Second array
 * @returns true if arrays are equal, false otherwise
 */
function arraysEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((val, index) => val === b[index]);
}
/**
 * Compare two arrays for equality (shallow comparison)
 * Alias for arraysEqual for backward compatibility
 *
 * @param a First array
 * @param b Second array
 * @returns true if arrays are equal, false otherwise
 */
function isArrayEqual(a, b) {
    return arraysEqual(a, b);
}
/**
 * Check if two arrays have the same elements (order-independent)
 *
 * @param a First array
 * @param b Second array
 * @returns true if arrays contain the same elements
 */
function haveSameElements(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const setA = new Set(a);
    const setB = new Set(b);
    if (setA.size !== setB.size) {
        return false;
    }
    for (const item of setA) {
        if (!setB.has(item)) {
            return false;
        }
    }
    return true;
}
/**
 * Remove duplicates from an array
 *
 * @param array Source array
 * @returns Array with unique elements
 */
function unique(array) {
    return [...new Set(array)];
}
/**
 * Partition array into chunks
 *
 * @param array Source array
 * @param size Chunk size
 * @returns Array of chunks
 */
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
//# sourceMappingURL=arrayUtils.js.map