'use strict';
/**
 * LifecycleController Unit Tests
 *
 * Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const LifecycleController_1 = require('../../../../../webview/controllers/LifecycleController');
(0, vitest_1.describe)('LifecycleController', () => {
  let lifecycleController;
  let mockTerminal;
  let _mockAddon;
  (0, vitest_1.beforeEach)(() => {
    lifecycleController = new LifecycleController_1.LifecycleController();
    // Create mock terminal
    mockTerminal = {
      loadAddon: vitest_1.vi.fn(),
      dispose: vitest_1.vi.fn(),
    };
    // Create mock addon
    _mockAddon = {
      dispose: vitest_1.vi.fn(),
    };
  });
  (0, vitest_1.afterEach)(() => {
    if (lifecycleController && !lifecycleController.getStats) {
      lifecycleController.dispose();
    }
    vitest_1.vi.restoreAllMocks();
  });
  (0, vitest_1.describe)('Terminal Attachment', () => {
    (0, vitest_1.it)('should attach terminal successfully', () => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(1);
      (0, vitest_1.expect)(stats.terminals).toContain('test-1');
    });
    (0, vitest_1.it)('should handle multiple terminals', () => {
      const mockTerminal2 = { ...mockTerminal };
      lifecycleController.attachTerminal('test-1', mockTerminal);
      lifecycleController.attachTerminal('test-2', mockTerminal2);
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(2);
      (0, vitest_1.expect)(stats.terminals).toContain('test-1');
      (0, vitest_1.expect)(stats.terminals).toContain('test-2');
    });
    (0, vitest_1.it)('should detach existing terminal when attaching duplicate', () => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
      lifecycleController.attachTerminal('test-1', mockTerminal); // Duplicate
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(1);
    });
    (0, vitest_1.it)('should check terminal attachment status', () => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
      (0, vitest_1.expect)(lifecycleController.hasTerminal('test-1')).toBe(true);
      (0, vitest_1.expect)(lifecycleController.hasTerminal('non-existent')).toBe(false);
    });
  });
  (0, vitest_1.describe)('Terminal Detachment', () => {
    (0, vitest_1.beforeEach)(() => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
    });
    (0, vitest_1.it)('should detach terminal successfully', () => {
      lifecycleController.detachTerminal('test-1');
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(0);
      (0, vitest_1.expect)(lifecycleController.hasTerminal('test-1')).toBe(false);
    });
    (0, vitest_1.it)('should handle detaching non-existent terminal', () => {
      (0, vitest_1.expect)(() => {
        lifecycleController.detachTerminal('non-existent');
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Lazy Addon Loading', () => {
    (0, vitest_1.beforeEach)(() => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
    });
    (0, vitest_1.it)('should load addon lazily', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      const addon = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon, {
        lazy: true,
      });
      (0, vitest_1.expect)(addon).not.toBeNull();
      (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should reuse existing addon for same terminal', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      const addon1 = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      const addon2 = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      (0, vitest_1.expect)(addon1).toBe(addon2);
      (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalledTimes(1); // Only loaded once
    });
    (0, vitest_1.it)('should cache addon globally when enabled', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      // Load for first terminal
      lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon, {
        cache: true,
      });
      // Attach second terminal
      const mockTerminal2 = { ...mockTerminal, loadAddon: vitest_1.vi.fn() };
      lifecycleController.attachTerminal('test-2', mockTerminal2);
      // Load for second terminal (should reuse from cache)
      lifecycleController.loadAddonLazy('test-2', 'MockAddon', MockAddon, {
        cache: true,
      });
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.cachedAddons).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should not cache addon when cache disabled', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon, {
        cache: false,
      });
      // Just verify addon was loaded
      (0, vitest_1.expect)(mockTerminal.loadAddon).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should return null for non-existent terminal', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      const addon = lifecycleController.loadAddonLazy('non-existent', 'MockAddon', MockAddon);
      (0, vitest_1.expect)(addon).toBeNull();
    });
    (0, vitest_1.it)('should throw error for required addon failure', () => {
      class FailingAddon {
        constructor() {
          throw new Error('Addon initialization failed');
        }
        activate() {}
        dispose() {}
      }
      (0, vitest_1.expect)(() => {
        lifecycleController.loadAddonLazy('test-1', 'FailingAddon', FailingAddon, {
          required: true,
        });
      }).toThrow();
    });
    (0, vitest_1.it)('should return null for optional addon failure', () => {
      class FailingAddon {
        constructor() {
          throw new Error('Addon initialization failed');
        }
        activate() {}
        dispose() {}
      }
      const addon = lifecycleController.loadAddonLazy('test-1', 'FailingAddon', FailingAddon, {
        required: false,
      });
      (0, vitest_1.expect)(addon).toBeNull();
    });
  });
  (0, vitest_1.describe)('Addon Retrieval', () => {
    (0, vitest_1.beforeEach)(() => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
    });
    (0, vitest_1.it)('should get loaded addon', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      const loadedAddon = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      const retrievedAddon = lifecycleController.getAddon('test-1', 'MockAddon');
      (0, vitest_1.expect)(retrievedAddon).toBe(loadedAddon);
    });
    (0, vitest_1.it)('should return null for non-existent addon', () => {
      const addon = lifecycleController.getAddon('test-1', 'NonExistentAddon');
      (0, vitest_1.expect)(addon).toBeNull();
    });
    (0, vitest_1.it)('should return null for non-existent terminal', () => {
      const addon = lifecycleController.getAddon('non-existent', 'MockAddon');
      (0, vitest_1.expect)(addon).toBeNull();
    });
  });
  (0, vitest_1.describe)('Event Listeners', () => {
    (0, vitest_1.beforeEach)(() => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
    });
    (0, vitest_1.it)('should add event listener', () => {
      const handler = vitest_1.vi.fn();
      (0, vitest_1.expect)(() => {
        lifecycleController.addEventListener('test-1', 'data', handler);
      }).not.toThrow();
    });
    (0, vitest_1.it)('should remove event listener', () => {
      const handler = vitest_1.vi.fn();
      lifecycleController.addEventListener('test-1', 'data', handler);
      lifecycleController.removeEventListener('test-1', 'data');
      // Should not throw
      (0, vitest_1.expect)(() => {
        lifecycleController.removeEventListener('test-1', 'data');
      }).not.toThrow();
    });
    (0, vitest_1.it)('should handle adding listener to non-existent terminal', () => {
      const handler = vitest_1.vi.fn();
      (0, vitest_1.expect)(() => {
        lifecycleController.addEventListener('non-existent', 'data', handler);
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Terminal Disposal', () => {
    (0, vitest_1.beforeEach)(() => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
    });
    (0, vitest_1.it)('should dispose terminal and all resources', () => {
      class MockAddon {
        constructor() {
          this.dispose = vitest_1.vi.fn();
        }
        activate() {}
      }
      const addon = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      lifecycleController.disposeTerminal('test-1');
      (0, vitest_1.expect)(addon.dispose).toHaveBeenCalled();
      (0, vitest_1.expect)(lifecycleController.hasTerminal('test-1')).toBe(false);
    });
    (0, vitest_1.it)('should handle disposing non-existent terminal', () => {
      (0, vitest_1.expect)(() => {
        lifecycleController.disposeTerminal('non-existent');
      }).not.toThrow();
    });
    (0, vitest_1.it)('should dispose in reasonable time (<100ms)', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      const startTime = performance.now();
      lifecycleController.disposeTerminal('test-1');
      const elapsed = performance.now() - startTime;
      (0, vitest_1.expect)(elapsed).toBeLessThan(100);
    });
    (0, vitest_1.it)('should dispose multiple addons', () => {
      class MockAddon1 {
        constructor() {
          this.dispose = vitest_1.vi.fn();
        }
        activate() {}
      }
      class MockAddon2 {
        constructor() {
          this.dispose = vitest_1.vi.fn();
        }
        activate() {}
      }
      const addon1 = lifecycleController.loadAddonLazy('test-1', 'MockAddon1', MockAddon1);
      const addon2 = lifecycleController.loadAddonLazy('test-1', 'MockAddon2', MockAddon2);
      lifecycleController.disposeTerminal('test-1');
      (0, vitest_1.expect)(addon1.dispose).toHaveBeenCalled();
      (0, vitest_1.expect)(addon2.dispose).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Controller Disposal', () => {
    (0, vitest_1.it)('should dispose all terminals', () => {
      class MockAddon {
        constructor() {
          this.dispose = vitest_1.vi.fn();
        }
        activate() {}
      }
      const mockTerminal2 = { ...mockTerminal, loadAddon: vitest_1.vi.fn() };
      lifecycleController.attachTerminal('test-1', mockTerminal);
      lifecycleController.attachTerminal('test-2', mockTerminal2);
      const addon1 = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      const addon2 = lifecycleController.loadAddonLazy('test-2', 'MockAddon', MockAddon);
      lifecycleController.dispose();
      (0, vitest_1.expect)(addon1.dispose).toHaveBeenCalled();
      (0, vitest_1.expect)(addon2.dispose).toHaveBeenCalled();
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(0);
      (0, vitest_1.expect)(stats.cachedAddons).toBe(0);
    });
    (0, vitest_1.it)('should not throw on double dispose', () => {
      (0, vitest_1.expect)(() => {
        lifecycleController.dispose();
        lifecycleController.dispose();
      }).not.toThrow();
    });
    (0, vitest_1.it)('should prevent operations after disposal', () => {
      lifecycleController.dispose();
      // Should not attach after disposal
      lifecycleController.attachTerminal('test-1', mockTerminal);
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(0);
    });
  });
  (0, vitest_1.describe)('Statistics', () => {
    (0, vitest_1.it)('should return accurate stats', () => {
      lifecycleController.attachTerminal('test-1', mockTerminal);
      lifecycleController.attachTerminal('test-2', mockTerminal);
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(2);
      (0, vitest_1.expect)(stats.terminals).toHaveLength(2);
      (0, vitest_1.expect)(stats.terminals).toContain('test-1');
      (0, vitest_1.expect)(stats.terminals).toContain('test-2');
    });
    (0, vitest_1.it)('should return empty stats when no terminals attached', () => {
      const stats = lifecycleController.getStats();
      (0, vitest_1.expect)(stats.attachedTerminals).toBe(0);
      (0, vitest_1.expect)(stats.terminals).toHaveLength(0);
    });
  });
  (0, vitest_1.describe)('Memory Leak Prevention', () => {
    (0, vitest_1.it)('should clear all references on dispose', () => {
      class MockAddon {
        activate() {}
        dispose() {}
      }
      lifecycleController.attachTerminal('test-1', mockTerminal);
      lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon);
      lifecycleController.addEventListener('test-1', 'data', () => {});
      lifecycleController.disposeTerminal('test-1');
      (0, vitest_1.expect)(lifecycleController.hasTerminal('test-1')).toBe(false);
      (0, vitest_1.expect)(lifecycleController.getAddon('test-1', 'MockAddon')).toBeNull();
    });
  });
  (0, vitest_1.describe)('Bug #4: Addon cache serves disposed addons', () => {
    (0, vitest_1.it)(
      'should not serve cached addon from a disposed terminal to a new terminal',
      () => {
        class MockAddon {
          constructor() {
            this.dispose = vitest_1.vi.fn();
          }
          activate() {}
        }
        // Load addon for terminal-1 with caching enabled
        lifecycleController.attachTerminal('test-1', mockTerminal);
        const addon1 = lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon, {
          cache: true,
        });
        // Dispose terminal-1 (addon gets disposed)
        lifecycleController.disposeTerminal('test-1');
        // The addon's dispose should have been called
        (0, vitest_1.expect)(addon1.dispose).toHaveBeenCalled();
        // Attach a new terminal
        const mockTerminal2 = { loadAddon: vitest_1.vi.fn(), dispose: vitest_1.vi.fn() };
        // @ts-expect-error - test mock type
        lifecycleController.attachTerminal('test-2', mockTerminal2);
        // Load same addon for terminal-2 — should NOT get the disposed cached addon
        const addon2 = lifecycleController.loadAddonLazy('test-2', 'MockAddon', MockAddon, {
          cache: true,
        });
        // addon2 should be a fresh instance, not the disposed one
        (0, vitest_1.expect)(addon2).not.toBe(addon1);
        (0, vitest_1.expect)(mockTerminal2.loadAddon).toHaveBeenCalled();
      }
    );
    (0, vitest_1.it)(
      'should clear cache entries belonging to disposed terminal on disposeTerminal',
      () => {
        class MockAddon {
          constructor() {
            this.dispose = vitest_1.vi.fn();
          }
          activate() {}
        }
        lifecycleController.attachTerminal('test-1', mockTerminal);
        lifecycleController.loadAddonLazy('test-1', 'MockAddon', MockAddon, {
          cache: true,
        });
        // Before dispose, cache should have the addon
        (0, vitest_1.expect)(lifecycleController.getStats().cachedAddons).toBeGreaterThan(0);
        // Dispose terminal
        lifecycleController.disposeTerminal('test-1');
        // After dispose, cache entries for that terminal's addons should be cleared
        (0, vitest_1.expect)(lifecycleController.getStats().cachedAddons).toBe(0);
      }
    );
  });
});
//# sourceMappingURL=LifecycleController.test.js.map
