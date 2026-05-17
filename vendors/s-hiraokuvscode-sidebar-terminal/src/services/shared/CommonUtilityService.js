'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CommonUtilityService = void 0;
const logger_1 = require('../../utils/logger');
/**
 * Common Utility Service
 *
 * Extracts common patterns used throughout the codebase:
 * - Async operations with retry logic
 * - Debouncing and throttling utilities
 * - Validation and error handling patterns
 * - Resource cleanup and lifecycle management
 * - Performance monitoring utilities
 * - Type-safe event handling patterns
 *
 * This service reduces code duplication by centralizing frequently
 * used utility functions across terminal services, WebView managers,
 * and configuration management.
 */
class CommonUtilityService {
  constructor() {
    this._debounceTimers = new Map();
    this._throttleLastExecution = new Map();
    (0, logger_1.terminal)('🛠️ [CommonUtility] Common utility service initialized');
  }
  /**
   * Execute operation with retry logic
   */
  async withRetry(operation, config = {}) {
    const { maxAttempts = 3, delayMs = 1000, exponentialBackoff = true, onRetry } = config;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          (0, logger_1.terminal)(
            `✅ [CommonUtility] Operation succeeded on attempt ${attempt}/${maxAttempts}`
          );
        }
        return result;
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) {
          (0, logger_1.terminal)(
            `❌ [CommonUtility] Operation failed after ${maxAttempts} attempts:`,
            lastError
          );
          break;
        }
        const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        (0, logger_1.terminal)(
          `⚠️ [CommonUtility] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`,
          lastError.message
        );
        if (onRetry) {
          onRetry(attempt, lastError);
        }
        await this.delay(delay);
      }
    }
    throw lastError;
  }
  /**
   * Debounce function execution
   */
  debounce(key, func, config) {
    const { delayMs, immediate = false, maxWait } = config;
    return (...args) => {
      const existingTimer = this._debounceTimers.get(key);
      const callNow = immediate && !existingTimer;
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        this._debounceTimers.delete(key);
        if (!immediate) {
          func.apply(this, args);
        }
      }, delayMs);
      this._debounceTimers.set(key, timer);
      if (callNow) {
        func.apply(this, args);
      }
      // Handle maxWait option
      if (maxWait && !immediate) {
        setTimeout(() => {
          if (this._debounceTimers.has(key)) {
            clearTimeout(this._debounceTimers.get(key));
            this._debounceTimers.delete(key);
            func.apply(this, args);
          }
        }, maxWait);
      }
    };
  }
  /**
   * Throttle function execution
   */
  throttle(key, func, delayMs) {
    return (...args) => {
      const lastExecution = this._throttleLastExecution.get(key) || 0;
      const now = Date.now();
      if (now - lastExecution >= delayMs) {
        this._throttleLastExecution.set(key, now);
        func.apply(this, args);
      }
    };
  }
  /**
   * Safe async execution with error boundaries
   */
  async safeExecute(operation, errorHandler, context) {
    try {
      return await operation();
    } catch (error) {
      const err = error;
      (0, logger_1.terminal)(
        `❌ [CommonUtility] Safe execution failed${context ? ` in ${context}` : ''}:`,
        err
      );
      if (errorHandler) {
        try {
          return errorHandler(err);
        } catch (handlerError) {
          (0, logger_1.terminal)(`❌ [CommonUtility] Error handler also failed:`, handlerError);
        }
      }
      return undefined;
    }
  }
  /**
   * Generic validation with configurable rules
   */
  validate(data, rules, context) {
    const errors = [];
    const warnings = [];
    for (const rule of rules) {
      try {
        const result = rule.validator(data);
        if (result === false) {
          const message = `Validation failed: ${rule.name}`;
          if (rule.level === 'error') {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        } else if (typeof result === 'string') {
          if (rule.level === 'error') {
            errors.push(result);
          } else {
            warnings.push(result);
          }
        }
      } catch (error) {
        const message = `Validation rule '${rule.name}' threw error: ${error}`;
        errors.push(message);
      }
    }
    const isValid = errors.length === 0;
    if (context && (errors.length > 0 || warnings.length > 0)) {
      (0, logger_1.terminal)(
        `🔍 [CommonUtility] Validation result for ${context}: ${errors.length} errors, ${warnings.length} warnings`
      );
    }
    return {
      isValid,
      errors,
      warnings,
      data: isValid ? data : undefined,
    };
  }
  /**
   * Resource cleanup with timeout
   */
  async cleanupWithTimeout(resources, timeoutMs = 5000) {
    const cleanupPromises = resources.map(async (resource, index) => {
      try {
        if (resource && typeof resource.dispose === 'function') {
          await resource.dispose();
          (0, logger_1.terminal)(
            `✅ [CommonUtility] Cleaned up resource ${index + 1}/${resources.length}`
          );
        }
      } catch (error) {
        (0, logger_1.terminal)(
          `⚠️ [CommonUtility] Error cleaning up resource ${index + 1}:`,
          error
        );
      }
    });
    try {
      await Promise.race([
        Promise.all(cleanupPromises),
        this.timeout(timeoutMs, `Resource cleanup timed out after ${timeoutMs}ms`),
      ]);
      (0, logger_1.terminal)(
        `✅ [CommonUtility] All ${resources.length} resources cleaned up successfully`
      );
    } catch (error) {
      (0, logger_1.terminal)(`⚠️ [CommonUtility] Resource cleanup completed with warnings:`, error);
    }
  }
  /**
   * Create a timeout promise that rejects after specified time
   */
  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message || `Operation timed out after ${ms}ms`));
      }, ms);
    });
  }
  /**
   * Promise-based delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Create a cancelable promise
   */
  createCancelablePromise(promise) {
    let isCanceled = false;
    const cancelablePromise = new Promise((resolve, reject) => {
      promise.then(
        (value) => (isCanceled ? reject(new Error('Operation canceled')) : resolve(value)),
        (error) => (isCanceled ? reject(new Error('Operation canceled')) : reject(error))
      );
    });
    return {
      promise: cancelablePromise,
      cancel: () => {
        isCanceled = true;
      },
    };
  }
  /**
   * Measure execution time of operations
   */
  async measureTime(operation, label) {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      if (label) {
        (0, logger_1.terminal)(`⏱️ [CommonUtility] ${label} completed in ${duration.toFixed(2)}ms`);
      }
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      if (label) {
        (0, logger_1.terminal)(`⏱️ [CommonUtility] ${label} failed after ${duration.toFixed(2)}ms`);
      }
      throw error;
    }
  }
  /**
   * Deep clone object (simple implementation)
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item));
    }
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }
  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   */
  isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
  /**
   * Flatten nested arrays
   */
  flatten(arr) {
    return arr.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? this.flatten(item) : item);
    }, []);
  }
  /**
   * Group array items by a key function
   */
  groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
  /**
   * Clear all debounce timers for cleanup
   */
  clearAllTimers() {
    for (const timer of this._debounceTimers.values()) {
      clearTimeout(timer);
    }
    this._debounceTimers.clear();
    this._throttleLastExecution.clear();
    (0, logger_1.terminal)('🧹 [CommonUtility] All timers cleared');
  }
  /**
   * Get utility service statistics
   */
  getStats() {
    return {
      activeDebounceTimers: this._debounceTimers.size,
      activeThrottles: this._throttleLastExecution.size,
    };
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    (0, logger_1.terminal)('🧹 [CommonUtility] Disposing common utility service');
    try {
      this.clearAllTimers();
      (0, logger_1.terminal)('✅ [CommonUtility] Common utility service disposed');
    } catch (error) {
      (0, logger_1.terminal)('❌ [CommonUtility] Error disposing common utility service:', error);
    }
  }
}
exports.CommonUtilityService = CommonUtilityService;
//# sourceMappingURL=CommonUtilityService.js.map
