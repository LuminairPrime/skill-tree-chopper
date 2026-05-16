"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const arrayUtils_1 = require("../../../../utils/arrayUtils");
(0, vitest_1.describe)('arraysEqual', () => {
    (0, vitest_1.describe)('with primitive values', () => {
        (0, vitest_1.it)('should return true for empty arrays', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([], [])).toBe(true);
        });
        (0, vitest_1.it)('should return true for equal arrays of numbers', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([1, 2, 3], [1, 2, 3])).toBe(true);
        });
        (0, vitest_1.it)('should return true for equal arrays of strings', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
        });
        (0, vitest_1.it)('should return false for arrays with different lengths', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([1, 2], [1, 2, 3])).toBe(false);
        });
        (0, vitest_1.it)('should return false for arrays with different values', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([1, 2, 3], [1, 2, 4])).toBe(false);
        });
        (0, vitest_1.it)('should return false for arrays with same values in different order', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([1, 2, 3], [3, 2, 1])).toBe(false);
        });
        (0, vitest_1.it)('should return true for single-element arrays', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([1], [1])).toBe(true);
        });
        (0, vitest_1.it)('should handle arrays with null and undefined', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([null, undefined], [null, undefined])).toBe(true);
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([null], [undefined])).toBe(false);
        });
        (0, vitest_1.it)('should handle arrays with boolean values', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([true, false], [true, false])).toBe(true);
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([true, false], [false, true])).toBe(false);
        });
    });
    (0, vitest_1.describe)('with objects', () => {
        (0, vitest_1.it)('should return false for arrays with same object values but different references', () => {
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([{ a: 1 }], [{ a: 1 }])).toBe(false);
        });
        (0, vitest_1.it)('should return true for arrays with same object references', () => {
            const obj = { a: 1 };
            (0, vitest_1.expect)((0, arrayUtils_1.arraysEqual)([obj], [obj])).toBe(true);
        });
    });
});
(0, vitest_1.describe)('isArrayEqual', () => {
    (0, vitest_1.it)('should be an alias for arraysEqual', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.isArrayEqual)([1, 2, 3], [1, 2, 3])).toBe(true);
        (0, vitest_1.expect)((0, arrayUtils_1.isArrayEqual)([1, 2], [1, 2, 3])).toBe(false);
        (0, vitest_1.expect)((0, arrayUtils_1.isArrayEqual)([1, 2, 3], [3, 2, 1])).toBe(false);
    });
});
(0, vitest_1.describe)('haveSameElements', () => {
    (0, vitest_1.it)('should return true for empty arrays', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([], [])).toBe(true);
    });
    (0, vitest_1.it)('should return true for arrays with same elements in same order', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 2, 3], [1, 2, 3])).toBe(true);
    });
    (0, vitest_1.it)('should return true for arrays with same elements in different order', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 2, 3], [3, 2, 1])).toBe(true);
    });
    (0, vitest_1.it)('should return false for arrays with different lengths', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 2], [1, 2, 3])).toBe(false);
    });
    (0, vitest_1.it)('should return false for arrays with different elements', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 2, 3], [1, 2, 4])).toBe(false);
    });
    (0, vitest_1.it)('should handle arrays with duplicates by Set conversion', () => {
        // Set conversion means duplicates are counted differently
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 1, 2], [1, 2, 2])).toBe(true); // Both sets are {1, 2}
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 1, 2], [1, 2, 3])).toBe(false);
    });
    (0, vitest_1.it)('should return false when set sizes differ', () => {
        // Different unique element counts
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 1, 1], [1, 2, 3])).toBe(false);
    });
    (0, vitest_1.it)('should handle strings', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)(['a', 'b', 'c'], ['c', 'b', 'a'])).toBe(true);
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)(['a', 'b'], ['a', 'c'])).toBe(false);
    });
    (0, vitest_1.it)('should handle mixed types', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 'a', true], ['a', true, 1])).toBe(true);
        (0, vitest_1.expect)((0, arrayUtils_1.haveSameElements)([1, 'a', true], [1, 'a', false])).toBe(false);
    });
});
(0, vitest_1.describe)('unique', () => {
    (0, vitest_1.it)('should return empty array for empty input', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([])).toEqual([]);
    });
    (0, vitest_1.it)('should return same array when no duplicates', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([1, 2, 3])).toEqual([1, 2, 3]);
    });
    (0, vitest_1.it)('should remove duplicate numbers', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });
    (0, vitest_1.it)('should remove duplicate strings', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
    });
    (0, vitest_1.it)('should preserve order of first occurrence', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([3, 1, 2, 1, 3, 2])).toEqual([3, 1, 2]);
    });
    (0, vitest_1.it)('should handle single-element arrays', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([1])).toEqual([1]);
    });
    (0, vitest_1.it)('should handle arrays with only duplicates', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([1, 1, 1, 1])).toEqual([1]);
    });
    (0, vitest_1.it)('should handle null and undefined', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([null, undefined, null, undefined])).toEqual([null, undefined]);
    });
    (0, vitest_1.it)('should not deduplicate objects by value', () => {
        const result = (0, arrayUtils_1.unique)([{ a: 1 }, { a: 1 }]);
        (0, vitest_1.expect)(result).toHaveLength(2); // Different object references
    });
    (0, vitest_1.it)('should deduplicate same object references', () => {
        const obj = { a: 1 };
        (0, vitest_1.expect)((0, arrayUtils_1.unique)([obj, obj, obj])).toEqual([obj]);
    });
});
(0, vitest_1.describe)('chunk', () => {
    (0, vitest_1.it)('should return empty array for empty input', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([], 2)).toEqual([]);
    });
    (0, vitest_1.it)('should split array into chunks of specified size', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 2, 3, 4, 5, 6], 2)).toEqual([
            [1, 2],
            [3, 4],
            [5, 6],
        ]);
    });
    (0, vitest_1.it)('should handle array with length not divisible by chunk size', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
    (0, vitest_1.it)('should handle chunk size of 1', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });
    (0, vitest_1.it)('should handle chunk size larger than array', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    });
    (0, vitest_1.it)('should handle chunk size equal to array length', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });
    (0, vitest_1.it)('should handle single-element array', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1], 1)).toEqual([[1]]);
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1], 5)).toEqual([[1]]);
    });
    (0, vitest_1.it)('should work with string arrays', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)(['a', 'b', 'c', 'd'], 2)).toEqual([
            ['a', 'b'],
            ['c', 'd'],
        ]);
    });
    (0, vitest_1.it)('should work with mixed-type arrays', () => {
        (0, vitest_1.expect)((0, arrayUtils_1.chunk)([1, 'a', true, null], 2)).toEqual([
            [1, 'a'],
            [true, null],
        ]);
    });
    (0, vitest_1.it)('should handle large arrays efficiently', () => {
        const largeArray = Array.from({ length: 100 }, (_, i) => i);
        const result = (0, arrayUtils_1.chunk)(largeArray, 10);
        (0, vitest_1.expect)(result).toHaveLength(10);
        (0, vitest_1.expect)(result[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        (0, vitest_1.expect)(result[9]).toEqual([90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
    });
});
//# sourceMappingURL=arrayUtils.test.js.map