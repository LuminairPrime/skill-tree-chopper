'use strict';
/**
 * SplitLayoutService Grid Layout Tests
 *
 * Tests for the 2-row grid layout functionality for 6-10 terminals.
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const SplitLayoutService_1 = require('../../../../../../webview/managers/container/SplitLayoutService');
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger');
(0, vitest_1.describe)('SplitLayoutService - Grid Layout', () => {
  let service;
  let terminalBody;
  function createContainers(count) {
    const containers = new Map();
    for (let i = 1; i <= count; i++) {
      const el = document.createElement('div');
      el.id = `container-${i}`;
      containers.set(`term-${i}`, el);
    }
    return containers;
  }
  function getTerminalIds(count) {
    return Array.from({ length: count }, (_, i) => `term-${i + 1}`);
  }
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.resetAllMocks();
    service = new SplitLayoutService_1.SplitLayoutService();
    terminalBody = document.createElement('div');
    terminalBody.id = 'terminal-body';
    document.body.appendChild(terminalBody);
  });
  (0, vitest_1.afterEach)(() => {
    document.body.innerHTML = '';
  });
  (0, vitest_1.describe)('activateGridLayout', () => {
    (0, vitest_1.it)('should use fixed 5 columns for 6 terminals in 2x5 mode', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    });
    (0, vitest_1.it)(
      'should place the 6th terminal on second row spanning full width in 2x5 mode',
      () => {
        const containers = createContainers(6);
        service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
        const sixthWrapper = document.querySelector('[data-terminal-wrapper-id="term-6"]');
        (0, vitest_1.expect)(sixthWrapper.style.gridRow).toBe('3');
        (0, vitest_1.expect)(sixthWrapper.style.gridColumn).toBe('1 / -1');
      }
    );
    (0, vitest_1.it)(
      'should force inline display:grid on terminals-wrapper when activating grid',
      () => {
        const terminalsWrapper = document.createElement('div');
        terminalsWrapper.id = 'terminals-wrapper';
        terminalsWrapper.style.display = 'flex';
        terminalBody.appendChild(terminalsWrapper);
        const containers = createContainers(6);
        service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
        (0, vitest_1.expect)(terminalsWrapper.style.display).toBe('grid');
      }
    );
    (0, vitest_1.it)('should add terminal-grid-layout class to terminals-wrapper', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.classList.contains('terminal-grid-layout')).toBe(true);
    });
    (0, vitest_1.it)('should not have terminal-split-horizontal class in grid mode', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.classList.contains('terminal-split-horizontal')).toBe(false);
    });
    (0, vitest_1.it)('should set gridMode to true', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      (0, vitest_1.expect)(service.isGridMode()).toBe(true);
    });
    (0, vitest_1.it)('should create wrappers for all 6 terminals', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrappers = document.querySelectorAll('[data-terminal-wrapper-id]');
      (0, vitest_1.expect)(wrappers.length).toBe(6);
    });
    (0, vitest_1.it)('should create wrappers for all 10 terminals', () => {
      const containers = createContainers(10);
      service.activateGridLayout(terminalBody, getTerminalIds(10), (id) => containers.get(id));
      const wrappers = document.querySelectorAll('[data-terminal-wrapper-id]');
      (0, vitest_1.expect)(wrappers.length).toBe(10);
    });
    (0, vitest_1.it)('should create a grid-row-resizer element', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const resizer = document.querySelector('.grid-row-resizer');
      (0, vitest_1.expect)(resizer).not.toBeNull();
    });
    (0, vitest_1.it)('should set fixed 5 columns for 6 terminals', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    });
    (0, vitest_1.it)('should set fixed 5 columns for 7 terminals', () => {
      const containers = createContainers(7);
      service.activateGridLayout(terminalBody, getTerminalIds(7), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    });
    (0, vitest_1.it)('should set grid-template-columns for 10 terminals (5+5)', () => {
      const containers = createContainers(10);
      service.activateGridLayout(terminalBody, getTerminalIds(10), (id) => containers.get(id));
      const wrapper = document.getElementById('terminals-wrapper');
      // 10 terminals → 5+5, so max columns is 5
      (0, vitest_1.expect)(wrapper?.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    });
    (0, vitest_1.it)('should assign grid-row 1 to first 5 terminals', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      for (let i = 1; i <= 5; i++) {
        const wrapper = document.querySelector(`[data-terminal-wrapper-id="term-${i}"]`);
        (0, vitest_1.expect)(wrapper?.style.gridRow).toBe('1');
      }
    });
    (0, vitest_1.it)('should assign grid-row 3 to remaining terminals', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const wrapper = document.querySelector('[data-terminal-wrapper-id="term-6"]');
      (0, vitest_1.expect)(wrapper?.style.gridRow).toBe('3');
    });
    (0, vitest_1.it)('should not create any .split-resizer elements', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      const resizers = document.querySelectorAll('.split-resizer');
      (0, vitest_1.expect)(resizers.length).toBe(0);
    });
    (0, vitest_1.it)('should handle empty terminal list', () => {
      service.activateGridLayout(terminalBody, [], () => undefined);
      (0, vitest_1.expect)(service.isGridMode()).toBe(false);
    });
    (0, vitest_1.it)('should cache wrappers', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      (0, vitest_1.expect)(service.getSplitWrapperCache().size).toBe(6);
    });
  });
  (0, vitest_1.describe)('deactivateGridLayout', () => {
    (0, vitest_1.it)('should remove terminal-grid-layout class', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      service.deactivateGridLayout();
      const wrapper = document.getElementById('terminals-wrapper');
      (0, vitest_1.expect)(wrapper?.classList.contains('terminal-grid-layout')).toBe(false);
    });
    (0, vitest_1.it)('should set gridMode to false', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      service.deactivateGridLayout();
      (0, vitest_1.expect)(service.isGridMode()).toBe(false);
    });
    (0, vitest_1.it)('should remove grid-row-resizer from DOM', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      service.deactivateGridLayout();
      const resizer = document.querySelector('.grid-row-resizer');
      (0, vitest_1.expect)(resizer).toBeNull();
    });
    (0, vitest_1.it)('should clear grid inline styles from wrappers', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      service.deactivateGridLayout();
      service.getSplitWrapperCache().forEach((wrapper) => {
        (0, vitest_1.expect)(wrapper.style.gridRow).toBe('');
        (0, vitest_1.expect)(wrapper.style.gridColumn).toBe('');
      });
    });
    (0, vitest_1.it)('should be a no-op when grid mode is not active', () => {
      (0, vitest_1.expect)(service.isGridMode()).toBe(false);
      service.deactivateGridLayout();
      (0, vitest_1.expect)(service.isGridMode()).toBe(false);
    });
  });
  (0, vitest_1.describe)('Grid → Flex transition', () => {
    (0, vitest_1.it)(
      'should cleanly transition from grid to flex when removeSplitArtifacts is called',
      () => {
        const containers = createContainers(6);
        service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
        (0, vitest_1.expect)(service.isGridMode()).toBe(true);
        service.removeSplitArtifacts(terminalBody);
        (0, vitest_1.expect)(service.isGridMode()).toBe(false);
        (0, vitest_1.expect)(document.querySelectorAll('.grid-row-resizer').length).toBe(0);
        (0, vitest_1.expect)(document.querySelectorAll('[data-terminal-wrapper-id]').length).toBe(
          0
        );
      }
    );
  });
  (0, vitest_1.describe)('createGridWrapper', () => {
    (0, vitest_1.it)('should create wrapper with correct grid-row for row 1', () => {
      const wrapper = service.createGridWrapper('t1', 0, 3, 3);
      (0, vitest_1.expect)(wrapper.style.gridRow).toBe('1');
      (0, vitest_1.expect)(wrapper.style.gridColumn).toBe('1');
    });
    (0, vitest_1.it)('should create wrapper with correct grid-row for row 2', () => {
      // index=3, row1Count=3 → row 2 (grid-row: 3), col 1
      const wrapper = service.createGridWrapper('t4', 3, 3, 3);
      (0, vitest_1.expect)(wrapper.style.gridRow).toBe('3');
      (0, vitest_1.expect)(wrapper.style.gridColumn).toBe('1 / span 1');
    });
    (0, vitest_1.it)('should assign correct column indices', () => {
      // 7 terminals → row1=4, row2=3, maxColumns=4
      const w0 = service.createGridWrapper('t1', 0, 4, 4);
      const w1 = service.createGridWrapper('t2', 1, 4, 4);
      const w2 = service.createGridWrapper('t3', 2, 4, 4);
      const w3 = service.createGridWrapper('t4', 3, 4, 4);
      const w4 = service.createGridWrapper('t5', 4, 4, 4); // row 2, col 1
      const w5 = service.createGridWrapper('t6', 5, 4, 4); // row 2, col 2
      const w6 = service.createGridWrapper('t7', 6, 4, 4); // row 2, col 3
      (0, vitest_1.expect)(w0.style.gridColumn).toBe('1');
      (0, vitest_1.expect)(w1.style.gridColumn).toBe('2');
      (0, vitest_1.expect)(w2.style.gridColumn).toBe('3');
      (0, vitest_1.expect)(w3.style.gridColumn).toBe('4');
      (0, vitest_1.expect)(w4.style.gridColumn).toBe('1 / span 1');
      (0, vitest_1.expect)(w5.style.gridColumn).toBe('2 / span 1');
      (0, vitest_1.expect)(w6.style.gridColumn).toBe('3 / span 1');
    });
  });
  (0, vitest_1.describe)('createGridRowResizer', () => {
    (0, vitest_1.it)('should create element with grid-row-resizer class', () => {
      const resizer = service.createGridRowResizer();
      (0, vitest_1.expect)(resizer.className).toBe('grid-row-resizer');
    });
    (0, vitest_1.it)('should have row-resize cursor', () => {
      const resizer = service.createGridRowResizer();
      (0, vitest_1.expect)(resizer.style.cursor).toBe('row-resize');
    });
    (0, vitest_1.it)('should span all columns', () => {
      const resizer = service.createGridRowResizer();
      (0, vitest_1.expect)(resizer.style.gridColumn).toBe('1 / -1');
    });
    (0, vitest_1.it)('should be placed on grid-row 2', () => {
      const resizer = service.createGridRowResizer();
      (0, vitest_1.expect)(resizer.style.gridRow).toBe('2');
    });
  });
  (0, vitest_1.describe)('clear', () => {
    (0, vitest_1.it)('should reset gridMode and gridRowResizer', () => {
      const containers = createContainers(6);
      service.activateGridLayout(terminalBody, getTerminalIds(6), (id) => containers.get(id));
      service.clear();
      (0, vitest_1.expect)(service.isGridMode()).toBe(false);
      (0, vitest_1.expect)(service.getGridRowResizer()).toBeNull();
    });
  });
});
//# sourceMappingURL=SplitLayoutService-Grid.test.js.map
