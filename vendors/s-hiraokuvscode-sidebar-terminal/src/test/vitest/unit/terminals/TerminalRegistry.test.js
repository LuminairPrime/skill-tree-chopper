'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalRegistry_1 = require('../../../../terminals/core/TerminalRegistry');
const common_1 = require('../../../../utils/common');
const TerminalNumberManager_1 = require('../../../../utils/TerminalNumberManager');
(0, vitest_1.describe)('TerminalRegistry', () => {
  let registry;
  let terminals;
  let activeManager;
  let numberManager;
  const createMockTerminal = (id, number, isActive = false) => ({
    id,
    name: `Terminal ${number}`,
    number,
    isActive,
    pid: 1234 + number,
    ptyProcess: {},
    // @ts-expect-error - test mock type
    processState: 'running',
    // @ts-expect-error - test mock type
    interactionState: 'active',
    scrollbackBuffer: [],
    // @ts-expect-error - test mock type
    createdAt: Date.now(),
    cwd: '/test',
  });
  (0, vitest_1.beforeEach)(() => {
    terminals = new Map();
    activeManager = new common_1.ActiveTerminalManager();
    numberManager = new TerminalNumberManager_1.TerminalNumberManager(5);
    registry = new TerminalRegistry_1.TerminalRegistry(terminals, activeManager, numberManager);
  });
  (0, vitest_1.describe)('getAll', () => {
    (0, vitest_1.it)('should return empty array when no terminals exist', () => {
      (0, vitest_1.expect)(registry.getAll()).toEqual([]);
    });
    (0, vitest_1.it)('should return all terminals as array', () => {
      const terminal1 = createMockTerminal('term-1', 1);
      const terminal2 = createMockTerminal('term-2', 2);
      registry.set(terminal1);
      registry.set(terminal2);
      const all = registry.getAll();
      (0, vitest_1.expect)(all).toHaveLength(2);
      (0, vitest_1.expect)(all).toContainEqual(terminal1);
      (0, vitest_1.expect)(all).toContainEqual(terminal2);
    });
  });
  (0, vitest_1.describe)('getById', () => {
    (0, vitest_1.it)('should return undefined for non-existent terminal', () => {
      (0, vitest_1.expect)(registry.getById('non-existent')).toBeUndefined();
    });
    (0, vitest_1.it)('should return terminal by id', () => {
      const terminal = createMockTerminal('term-1', 1);
      registry.set(terminal);
      (0, vitest_1.expect)(registry.getById('term-1')).toBe(terminal);
    });
  });
  (0, vitest_1.describe)('has', () => {
    (0, vitest_1.it)('should return false for non-existent terminal', () => {
      (0, vitest_1.expect)(registry.has('non-existent')).toBe(false);
    });
    (0, vitest_1.it)('should return true for existing terminal', () => {
      registry.set(createMockTerminal('term-1', 1));
      (0, vitest_1.expect)(registry.has('term-1')).toBe(true);
    });
  });
  (0, vitest_1.describe)('set', () => {
    (0, vitest_1.it)('should add terminal to registry', () => {
      const terminal = createMockTerminal('term-1', 1);
      registry.set(terminal);
      (0, vitest_1.expect)(registry.has('term-1')).toBe(true);
      (0, vitest_1.expect)(registry.size()).toBe(1);
    });
    (0, vitest_1.it)('should overwrite existing terminal with same id', () => {
      const terminal1 = createMockTerminal('term-1', 1);
      const terminal2 = createMockTerminal('term-1', 2);
      registry.set(terminal1);
      registry.set(terminal2);
      (0, vitest_1.expect)(registry.size()).toBe(1);
      (0, vitest_1.expect)(registry.getById('term-1')?.number).toBe(2);
    });
  });
  (0, vitest_1.describe)('delete', () => {
    (0, vitest_1.it)('should return false when deleting non-existent terminal', () => {
      (0, vitest_1.expect)(registry.delete('non-existent')).toBe(false);
    });
    (0, vitest_1.it)('should delete terminal and return true', () => {
      registry.set(createMockTerminal('term-1', 1));
      const result = registry.delete('term-1');
      (0, vitest_1.expect)(result).toBe(true);
      (0, vitest_1.expect)(registry.has('term-1')).toBe(false);
    });
  });
  (0, vitest_1.describe)('clear', () => {
    (0, vitest_1.it)('should remove all terminals', () => {
      registry.set(createMockTerminal('term-1', 1));
      registry.set(createMockTerminal('term-2', 2));
      registry.setActiveTerminal('term-1');
      registry.clear();
      (0, vitest_1.expect)(registry.size()).toBe(0);
      (0, vitest_1.expect)(registry.hasActiveTerminal()).toBe(false);
    });
  });
  (0, vitest_1.describe)('size', () => {
    (0, vitest_1.it)('should return 0 for empty registry', () => {
      (0, vitest_1.expect)(registry.size()).toBe(0);
    });
    (0, vitest_1.it)('should return correct count', () => {
      registry.set(createMockTerminal('term-1', 1));
      registry.set(createMockTerminal('term-2', 2));
      (0, vitest_1.expect)(registry.size()).toBe(2);
    });
  });
  (0, vitest_1.describe)('entries', () => {
    (0, vitest_1.it)('should return iterable of entries', () => {
      const terminal1 = createMockTerminal('term-1', 1);
      const terminal2 = createMockTerminal('term-2', 2);
      registry.set(terminal1);
      registry.set(terminal2);
      const entries = Array.from(registry.entries());
      (0, vitest_1.expect)(entries).toHaveLength(2);
      (0, vitest_1.expect)(entries).toContainEqual(['term-1', terminal1]);
      (0, vitest_1.expect)(entries).toContainEqual(['term-2', terminal2]);
    });
  });
  (0, vitest_1.describe)('canCreate', () => {
    (0, vitest_1.it)('should return true when under limit', () => {
      (0, vitest_1.expect)(registry.canCreate()).toBe(true);
    });
    (0, vitest_1.it)('should return false when at limit', () => {
      for (let i = 1; i <= 5; i++) {
        registry.set(createMockTerminal(`term-${i}`, i));
      }
      (0, vitest_1.expect)(registry.canCreate()).toBe(false);
    });
  });
  (0, vitest_1.describe)('findAvailableNumber', () => {
    (0, vitest_1.it)('should return 1 for empty registry', () => {
      (0, vitest_1.expect)(registry.findAvailableNumber()).toBe(1);
    });
    (0, vitest_1.it)('should return next available number', () => {
      registry.set(createMockTerminal('term-1', 1));
      registry.set(createMockTerminal('term-2', 2));
      (0, vitest_1.expect)(registry.findAvailableNumber()).toBe(3);
    });
    (0, vitest_1.it)('should fill gaps in numbering', () => {
      registry.set(createMockTerminal('term-1', 1));
      registry.set(createMockTerminal('term-3', 3));
      (0, vitest_1.expect)(registry.findAvailableNumber()).toBe(2);
    });
  });
  (0, vitest_1.describe)('getAvailableSlots', () => {
    (0, vitest_1.it)('should return all slots for empty registry', () => {
      const slots = registry.getAvailableSlots();
      (0, vitest_1.expect)(slots).toEqual([1, 2, 3, 4, 5]);
    });
    (0, vitest_1.it)('should return remaining slots', () => {
      registry.set(createMockTerminal('term-1', 1));
      registry.set(createMockTerminal('term-3', 3));
      const slots = registry.getAvailableSlots();
      (0, vitest_1.expect)(slots).toEqual([2, 4, 5]);
    });
  });
  (0, vitest_1.describe)('active terminal management', () => {
    (0, vitest_1.describe)('setActiveTerminal', () => {
      (0, vitest_1.it)('should set active terminal', () => {
        registry.set(createMockTerminal('term-1', 1));
        registry.setActiveTerminal('term-1');
        (0, vitest_1.expect)(registry.isActive('term-1')).toBe(true);
      });
    });
    (0, vitest_1.describe)('getActiveTerminalId', () => {
      (0, vitest_1.it)('should return undefined when no active terminal', () => {
        (0, vitest_1.expect)(registry.getActiveTerminalId()).toBeUndefined();
      });
      (0, vitest_1.it)('should return active terminal id', () => {
        registry.set(createMockTerminal('term-1', 1));
        registry.setActiveTerminal('term-1');
        (0, vitest_1.expect)(registry.getActiveTerminalId()).toBe('term-1');
      });
    });
    (0, vitest_1.describe)('hasActiveTerminal', () => {
      (0, vitest_1.it)('should return false when no active terminal', () => {
        (0, vitest_1.expect)(registry.hasActiveTerminal()).toBe(false);
      });
      (0, vitest_1.it)('should return true when terminal is active', () => {
        registry.set(createMockTerminal('term-1', 1));
        registry.setActiveTerminal('term-1');
        (0, vitest_1.expect)(registry.hasActiveTerminal()).toBe(true);
      });
    });
    (0, vitest_1.describe)('isActive', () => {
      (0, vitest_1.it)('should return false for non-active terminal', () => {
        registry.set(createMockTerminal('term-1', 1));
        (0, vitest_1.expect)(registry.isActive('term-1')).toBe(false);
      });
      (0, vitest_1.it)('should return true for active terminal', () => {
        registry.set(createMockTerminal('term-1', 1));
        registry.setActiveTerminal('term-1');
        (0, vitest_1.expect)(registry.isActive('term-1')).toBe(true);
      });
    });
    (0, vitest_1.describe)('clearActive', () => {
      (0, vitest_1.it)('should clear active terminal', () => {
        registry.set(createMockTerminal('term-1', 1));
        registry.setActiveTerminal('term-1');
        registry.clearActive();
        (0, vitest_1.expect)(registry.hasActiveTerminal()).toBe(false);
      });
    });
    (0, vitest_1.describe)('deactivateAll', () => {
      (0, vitest_1.it)('should deactivate all terminals', () => {
        const terminal1 = createMockTerminal('term-1', 1, true);
        const terminal2 = createMockTerminal('term-2', 2, true);
        registry.set(terminal1);
        registry.set(terminal2);
        registry.setActiveTerminal('term-1');
        registry.deactivateAll();
        (0, vitest_1.expect)(terminal1.isActive).toBe(false);
        (0, vitest_1.expect)(terminal2.isActive).toBe(false);
        (0, vitest_1.expect)(registry.hasActiveTerminal()).toBe(false);
      });
    });
  });
  (0, vitest_1.describe)('getTerminalNumber', () => {
    (0, vitest_1.it)('should return undefined for non-existent terminal', () => {
      (0, vitest_1.expect)(registry.getTerminalNumber('non-existent')).toBeUndefined();
    });
    (0, vitest_1.it)('should return terminal number', () => {
      registry.set(createMockTerminal('term-1', 3));
      (0, vitest_1.expect)(registry.getTerminalNumber('term-1')).toBe(3);
    });
  });
});
//# sourceMappingURL=TerminalRegistry.test.js.map
