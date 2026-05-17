'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
// Mock common utility FIRST
vitest_1.vi.mock('../../../../../utils/common', () => ({
  getTerminalConfig: vitest_1.vi.fn(() => ({ maxTerminals: 5 })),
  ActiveTerminalManager: class {
    constructor() {
      this._active = undefined;
      this.getActive = vitest_1.vi.fn(function () {
        return this._active;
      });
      this.setActive = vitest_1.vi.fn(function (id) {
        this._active = id;
      });
      this.clearActive = vitest_1.vi.fn(function () {
        this._active = undefined;
      });
      this.hasActive = vitest_1.vi.fn(function () {
        return !!this._active;
      });
      this.isActive = vitest_1.vi.fn(function (id) {
        return this._active === id;
      });
    }
  },
}));
const TerminalStateManagementService_1 = require('../../../../../services/terminal/TerminalStateManagementService');
// Mock VS Code
vitest_1.vi.mock('vscode', () => ({
  EventEmitter: class {
    constructor() {
      this.fire = vitest_1.vi.fn();
      this.event = vitest_1.vi.fn();
      this.dispose = vitest_1.vi.fn();
    }
  },
}));
vitest_1.vi.mock('../../../../../utils/logger');
(0, vitest_1.describe)('TerminalStateManagementService', () => {
  let service;
  let mockTerminal;
  beforeEach(() => {
    vitest_1.vi.resetAllMocks();
    service = new TerminalStateManagementService_1.TerminalStateManagementService();
    mockTerminal = {
      id: 'term-1',
      name: 'Terminal 1',
      isActive: false,
    };
  });
  afterEach(() => {
    service.dispose();
  });
  (0, vitest_1.describe)('addTerminal', () => {
    (0, vitest_1.it)('should add terminal to map and notify', () => {
      service.addTerminal(mockTerminal);
      (0, vitest_1.expect)(service.hasTerminal('term-1')).toBe(true);
      (0, vitest_1.expect)(service.getTerminal('term-1')).toBe(mockTerminal);
      (0, vitest_1.expect)(service.getTerminalCount()).toBe(1);
    });
  });
  (0, vitest_1.describe)('removeTerminal', () => {
    (0, vitest_1.it)('should remove terminal and notify', () => {
      service.addTerminal(mockTerminal);
      service.removeTerminal('term-1');
      (0, vitest_1.expect)(service.hasTerminal('term-1')).toBe(false);
      (0, vitest_1.expect)(service.getTerminalCount()).toBe(0);
    });
  });
  (0, vitest_1.describe)('active terminal management', () => {
    beforeEach(() => {
      service.addTerminal(mockTerminal);
      service.addTerminal({ ...mockTerminal, id: 'term-2', name: 'Terminal 2' });
    });
    (0, vitest_1.it)('should set active terminal', () => {
      const success = service.setActiveTerminal('term-2');
      (0, vitest_1.expect)(success).toBe(true);
      (0, vitest_1.expect)(service.getActiveTerminalId()).toBe('term-2');
      (0, vitest_1.expect)(service.getTerminal('term-2')?.isActive).toBe(true);
      (0, vitest_1.expect)(service.getTerminal('term-1')?.isActive).toBe(false);
    });
    (0, vitest_1.it)('should return false for non-existent terminal', () => {
      const success = service.setActiveTerminal('non-existent');
      (0, vitest_1.expect)(success).toBe(false);
    });
    (0, vitest_1.it)('should clear active terminal', () => {
      service.setActiveTerminal('term-1');
      service.clearActiveTerminal();
      (0, vitest_1.expect)(service.getActiveTerminalId()).toBeUndefined();
      (0, vitest_1.expect)(mockTerminal.isActive).toBe(false);
    });
  });
  (0, vitest_1.describe)('getCurrentState', () => {
    (0, vitest_1.it)('should return combined state', () => {
      service.addTerminal(mockTerminal);
      service.setActiveTerminal('term-1');
      const state = service.getCurrentState();
      (0, vitest_1.expect)(state.terminals.length).toBe(1);
      (0, vitest_1.expect)(state.activeTerminalId).toBe('term-1');
      (0, vitest_1.expect)(state.terminals[0].id).toBe('term-1');
    });
  });
  (0, vitest_1.describe)('validateDeletion', () => {
    (0, vitest_1.it)('should allow deletion if multiple terminals exist', () => {
      service.addTerminal(mockTerminal);
      service.addTerminal({ id: 't2', name: 'T2' });
      const result = service.validateDeletion('term-1');
      (0, vitest_1.expect)(result.canDelete).toBe(true);
    });
    (0, vitest_1.it)('should block deletion if only one terminal exists', () => {
      service.addTerminal(mockTerminal);
      const result = service.validateDeletion('term-1');
      (0, vitest_1.expect)(result.canDelete).toBe(false);
      (0, vitest_1.expect)(result.reason).toContain('at least 1 terminal');
    });
  });
});
//# sourceMappingURL=TerminalStateManagementService.test.js.map
