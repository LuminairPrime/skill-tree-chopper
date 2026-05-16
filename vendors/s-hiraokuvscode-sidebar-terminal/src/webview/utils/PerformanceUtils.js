"use strict";
/**
 * パフォーマンス最適化のためのユーティリティクラス
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceUtils = void 0;
const logger_1 = require("../../utils/logger");
/* eslint-disable @typescript-eslint/no-namespace */
var PerformanceUtils;
(function (PerformanceUtils) {
    /**
     * 関数の実行を指定時間遅延させる（デバウンス）
     */
    function debounce(func, delay) {
        let timeoutId = null;
        return (...args) => {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            timeoutId = window.setTimeout(() => {
                func(...args);
                timeoutId = null;
            }, delay);
        };
    }
    PerformanceUtils.debounce = debounce;
    /**
     * 関数の実行頻度を制限する（スロットル）
     */
    function throttle(func, delay) {
        let lastCall = 0;
        let timeoutId = null;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            }
            else if (timeoutId === null) {
                timeoutId = window.setTimeout(() => {
                    lastCall = Date.now();
                    func(...args);
                    timeoutId = null;
                }, delay - (now - lastCall));
            }
        };
    }
    PerformanceUtils.throttle = throttle;
    /**
     * アイドル時間での実行
     */
    function requestIdleCallback(callback, timeout = 5000) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(callback, { timeout });
        }
        else {
            // フォールバック：setTimeout を使用
            setTimeout(callback, 1);
        }
    }
    PerformanceUtils.requestIdleCallback = requestIdleCallback;
    /**
     * RAF（requestAnimationFrame）での実行
     */
    function requestAnimationFrame(callback) {
        return window.requestAnimationFrame(callback);
    }
    PerformanceUtils.requestAnimationFrame = requestAnimationFrame;
    /**
     * 複数のRAFを連続実行
     */
    function doubleRequestAnimationFrame(callback) {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(callback);
        });
    }
    PerformanceUtils.doubleRequestAnimationFrame = doubleRequestAnimationFrame;
    /**
     * パフォーマンス測定
     */
    function measurePerformance(label, fn) {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        (0, logger_1.webview)(`⚡ [PERFORMANCE] ${label}: ${(endTime - startTime).toFixed(2)}ms`);
        return result;
    }
    PerformanceUtils.measurePerformance = measurePerformance;
    /**
     * 非同期関数のパフォーマンス測定
     */
    async function measurePerformanceAsync(label, fn) {
        const startTime = performance.now();
        const result = await fn();
        const endTime = performance.now();
        (0, logger_1.webview)(`⚡ [PERFORMANCE] ${label}: ${(endTime - startTime).toFixed(2)}ms`);
        return result;
    }
    PerformanceUtils.measurePerformanceAsync = measurePerformanceAsync;
    /**
     * メモリ使用量の取得
     */
    function getMemoryUsage() {
        const perfWithMemory = performance;
        if (perfWithMemory.memory) {
            const memory = perfWithMemory.memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
            };
        }
        return null;
    }
    PerformanceUtils.getMemoryUsage = getMemoryUsage;
    /**
     * メモリ使用量をログ出力
     */
    function logMemoryUsage(label) {
        const memory = getMemoryUsage();
        if (memory) {
            (0, logger_1.webview)(`🧠 [MEMORY] ${label}:`, {
                used: `${((memory.usedJSHeapSize ?? 0) / 1024 / 1024).toFixed(2)}MB`,
                total: `${((memory.totalJSHeapSize ?? 0) / 1024 / 1024).toFixed(2)}MB`,
                limit: `${((memory.jsHeapSizeLimit ?? 0) / 1024 / 1024).toFixed(2)}MB`,
            });
        }
    }
    PerformanceUtils.logMemoryUsage = logMemoryUsage;
    /**
     * 長い処理を分割して実行
     */
    async function processInChunks(items, processor, chunkSize = 100, delay = 0) {
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            chunk.forEach(processor);
            // 次のチャンクまで待機
            if (i + chunkSize < items.length && delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    PerformanceUtils.processInChunks = processInChunks;
    /**
     * プロミスの並列処理（制限付き）
     */
    async function processInParallel(items, processor, concurrency = 3) {
        const results = [];
        const executing = [];
        for (const item of items) {
            const promise = processor(item).then((result) => {
                results.push(result);
            });
            executing.push(promise);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
                void executing.splice(executing.findIndex((p) => p === promise), 1);
            }
        }
        await Promise.all(executing);
        return results;
    }
    PerformanceUtils.processInParallel = processInParallel;
    /**
     * オブジェクトのディープクローン（パフォーマンス重視）
     */
    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map((item) => deepClone(item));
        }
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach((key) => {
                cloned[key] = deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    }
    PerformanceUtils.deepClone = deepClone;
    /**
     * 配列の高速検索（バイナリサーチ）
     */
    function binarySearch(arr, target, compareFn) {
        const compare = compareFn || ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const midValue = arr[mid];
            if (midValue === undefined) {
                return -1;
            }
            const comparison = compare(midValue, target);
            if (comparison === 0) {
                return mid;
            }
            else if (comparison < 0) {
                left = mid + 1;
            }
            else {
                right = mid - 1;
            }
        }
        return -1;
    }
    PerformanceUtils.binarySearch = binarySearch;
})(PerformanceUtils || (exports.PerformanceUtils = PerformanceUtils = {}));
//# sourceMappingURL=PerformanceUtils.js.map