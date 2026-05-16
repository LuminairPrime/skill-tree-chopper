"use strict";
/**
 * Performance Optimization Utilities
 * Phase 3: System performance improvements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryMonitor = exports.PerformanceMonitor = exports.DOMBatcher = exports.Debouncer = void 0;
const logger_1 = require("./logger");
/**
 * Debounce function for reducing frequent function calls
 */
class Debouncer {
    constructor(func, delay) {
        this.func = func;
        this.delay = delay;
        this.timeoutId = null;
    }
    execute(...args) {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(async () => {
            try {
                await this.func(...args);
            }
            catch (error) {
                console.error('Debounced function execution failed:', error);
            }
            this.timeoutId = null;
        }, this.delay);
    }
    cancel() {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
    isScheduled() {
        return this.timeoutId !== null;
    }
}
exports.Debouncer = Debouncer;
/**
 * Batch DOM operations for better performance
 */
class DOMBatcher {
    constructor() {
        this.operations = [];
        this.scheduled = false;
    }
    add(operation) {
        this.operations.push(operation);
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => {
                this.flush();
            });
        }
    }
    flush() {
        const operations = [...this.operations];
        this.operations = [];
        this.scheduled = false;
        // Execute all operations in a single frame
        operations.forEach((operation) => {
            try {
                operation();
            }
            catch (error) {
                console.error('DOM batch operation failed:', error);
            }
        });
    }
    clear() {
        this.operations = [];
        this.scheduled = false;
    }
}
exports.DOMBatcher = DOMBatcher;
/**
 * Performance monitoring utilities
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    startTimer(name) {
        if (!this.metrics.has(name) && this.metrics.size >= PerformanceMonitor.MAX_METRICS_SIZE) {
            const firstKey = this.metrics.keys().next().value;
            if (firstKey !== undefined) {
                this.metrics.delete(firstKey);
            }
        }
        this.metrics.set(name, { start: performance.now() });
    }
    endTimer(name) {
        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`Timer "${name}" was not started`);
            return null;
        }
        const duration = performance.now() - metric.start;
        metric.duration = duration;
        (0, logger_1.log)(`⏱️ [PERFORMANCE] ${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }
    getMetrics() {
        const result = {};
        this.metrics.forEach((metric, name) => {
            if (metric.duration !== undefined) {
                result[name] = metric.duration;
            }
        });
        return result;
    }
    clearMetrics() {
        this.metrics.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
PerformanceMonitor.MAX_METRICS_SIZE = 1000;
/**
 * Memory usage monitoring
 */
class MemoryMonitor {
    static getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
                percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
            };
        }
        return null;
    }
    static logMemoryUsage(context) {
        const usage = this.getMemoryUsage();
        if (usage) {
            (0, logger_1.log)(`🧠 [MEMORY] ${context}: ${usage.used}MB/${usage.total}MB (${usage.percentage}%)`);
        }
    }
}
exports.MemoryMonitor = MemoryMonitor;
//# sourceMappingURL=PerformanceOptimizer.js.map