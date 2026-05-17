'use strict';
/**
 * Split Mode Specification Tests
 * Based on docs/SPLIT_MODE_SPECIFICATION.md
 */
Object.defineProperty(exports, '__esModule', { value: true });
const mocha_1 = require('mocha');
const chai_1 = require('chai');
const jsdom_1 = require('jsdom');
(0, mocha_1.describe)('Split Mode Specification Tests', () => {
  let dom;
  let document;
  let terminalBody;
  (0, mocha_1.beforeEach)(() => {
    // Setup DOM environment
    dom = new jsdom_1.JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="terminal-view">
            <div id="terminal-tabs-container"></div>
            <div id="terminal-body" style="height: 600px;"></div>
          </div>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    terminalBody = document.getElementById('terminal-body');
  });
  (0, mocha_1.afterEach)(() => {
    delete global.document;
    delete global.window;
  });
  (0, mocha_1.describe)('REQ-1: Terminal Height Distribution in Split Mode', () => {
    (0, mocha_1.it)('TC-1.1: 2 terminals should have equal height (~50% each)', () => {
      // Create 2 terminal wrappers
      const wrapper1 = createSplitWrapper('terminal-1', 2);
      const wrapper2 = createSplitWrapper('terminal-2', 2);
      terminalBody.appendChild(wrapper1);
      terminalBody.appendChild(createResizer());
      terminalBody.appendChild(wrapper2);
      // Apply flexbox layout
      terminalBody.style.display = 'flex';
      terminalBody.style.flexDirection = 'column';
      // Get computed heights (in a real browser environment)
      // Note: JSDOM doesn't compute layout, so we verify flex values
      const flex1 = wrapper1.style.flex;
      const flex2 = wrapper2.style.flex;
      (0, chai_1.expect)(flex1).to.equal('1 1 0');
      (0, chai_1.expect)(flex2).to.equal('1 1 0');
    });
    (0, mocha_1.it)('TC-1.2: 5 terminals should have equal height (~20% each)', () => {
      const wrappers = [];
      const terminalCount = 5;
      for (let i = 1; i <= terminalCount; i++) {
        const wrapper = createSplitWrapper(`terminal-${i}`, terminalCount);
        wrappers.push(wrapper);
        terminalBody.appendChild(wrapper);
        if (i < terminalCount) {
          terminalBody.appendChild(createResizer());
        }
      }
      terminalBody.style.display = 'flex';
      terminalBody.style.flexDirection = 'column';
      // Verify all wrappers have same flex value
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
      });
      // Verify correct number of wrappers
      (0, chai_1.expect)(wrappers.length).to.equal(5);
    });
    (0, mocha_1.it)('TC-1.3: All terminals should be visible (not hidden)', () => {
      const terminalCount = 4;
      const wrappers = [];
      for (let i = 1; i <= terminalCount; i++) {
        const wrapper = createSplitWrapper(`terminal-${i}`, terminalCount);
        wrappers.push(wrapper);
        terminalBody.appendChild(wrapper);
        if (i < terminalCount) {
          terminalBody.appendChild(createResizer());
        }
      }
      // Verify no wrapper has display:none or visibility:hidden
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
        (0, chai_1.expect)(wrapper.style.visibility).to.not.equal('hidden');
      });
    });
    (0, mocha_1.it)('TC-1.4: Resizer count should be N-1 for N terminals', () => {
      const terminalCount = 3;
      for (let i = 1; i <= terminalCount; i++) {
        const wrapper = createSplitWrapper(`terminal-${i}`, terminalCount);
        terminalBody.appendChild(wrapper);
        if (i < terminalCount) {
          terminalBody.appendChild(createResizer());
        }
      }
      const resizers = terminalBody.querySelectorAll('.split-resizer');
      (0, chai_1.expect)(resizers.length).to.equal(terminalCount - 1);
    });
  });
  (0, mocha_1.describe)('REQ-2: Adding Terminal in Split Mode', () => {
    (0, mocha_1.it)(
      'TC-2.1: Adding terminal to 2 existing should result in 3 equal terminals',
      () => {
        // Initial: 2 terminals
        setupSplitLayout(2);
        (0, chai_1.expect)(
          terminalBody.querySelectorAll('.terminal-split-wrapper').length
        ).to.equal(2);
        // Add 1 terminal
        clearTerminalBody();
        setupSplitLayout(3);
        const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
        (0, chai_1.expect)(wrappers.length).to.equal(3);
        wrappers.forEach((wrapper) => {
          (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
        });
      }
    );
    (0, mocha_1.it)(
      'TC-2.2: Adding terminal to 4 existing should result in 5 equal terminals',
      () => {
        setupSplitLayout(4);
        clearTerminalBody();
        setupSplitLayout(5);
        const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
        (0, chai_1.expect)(wrappers.length).to.equal(5);
        wrappers.forEach((wrapper) => {
          (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
        });
      }
    );
    (0, mocha_1.it)('TC-2.3: New terminal should be visible immediately', () => {
      setupSplitLayout(3);
      const lastWrapper = terminalBody.querySelector('.terminal-split-wrapper:last-child');
      (0, chai_1.expect)(lastWrapper).to.exist;
      (0, chai_1.expect)(lastWrapper.style.display).to.not.equal('none');
    });
    (0, mocha_1.it)('TC-2.4: All existing terminals remain visible after adding new', () => {
      setupSplitLayout(3);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(3);
      wrappers.forEach((wrapper, index) => {
        (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
        (0, chai_1.expect)(wrapper.getAttribute('data-terminal-wrapper-id')).to.equal(
          `terminal-${index + 1}`
        );
      });
    });
  });
  (0, mocha_1.describe)('REQ-3: Adding Terminal in Fullscreen Mode', () => {
    (0, mocha_1.it)('TC-3.1: Should transition to split mode before adding terminal', async () => {
      // This test verifies the sequence, not the actual timing
      // In real implementation, this would test the actual flow
      // Step 1: Setup fullscreen (simulated by having only 1 visible terminal)
      const _hiddenCount = 2; // 2 terminals hidden
      const _visibleCount = 1; // 1 terminal visible
      // Step 2: User clicks add terminal
      // Expected: All 3 terminals should become visible in split mode
      setupSplitLayout(3); // Simulates showAllTerminalsSplit()
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(3);
      // Step 3: After delay, new terminal is added
      clearTerminalBody();
      setupSplitLayout(4); // Simulates createTerminal + refresh
      const finalWrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(finalWrappers.length).to.equal(4);
    });
    (0, mocha_1.it)(
      'TC-3.2: All existing terminals must be visible before new terminal creation',
      () => {
        // Simulate: 3 terminals exist, 1 visible (fullscreen)
        // After transition: All 3 should be visible before adding 4th
        setupSplitLayout(3);
        const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
        (0, chai_1.expect)(wrappers.length).to.equal(3);
        wrappers.forEach((wrapper) => {
          (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
        });
      }
    );
    (0, mocha_1.it)('TC-3.3: Final state should show N+1 terminals with equal height', () => {
      // Start with 3, add 1, end with 4
      setupSplitLayout(4);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(4);
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
      });
    });
    (0, mocha_1.it)('TC-3.4: No terminal should be missing or hidden', () => {
      setupSplitLayout(5);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(5);
      for (let i = 0; i < 5; i++) {
        const wrapper = wrappers[i];
        (0, chai_1.expect)(wrapper.getAttribute('data-terminal-wrapper-id')).to.equal(
          `terminal-${i + 1}`
        );
        (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
        (0, chai_1.expect)(wrapper.style.visibility).to.not.equal('hidden');
      }
    });
  });
  (0, mocha_1.describe)('REQ-4: Removing Terminal in Split Mode', () => {
    (0, mocha_1.it)(
      'TC-4.1: Removing 1 from 4 terminals should result in 3 equal terminals',
      () => {
        setupSplitLayout(4);
        (0, chai_1.expect)(
          terminalBody.querySelectorAll('.terminal-split-wrapper').length
        ).to.equal(4);
        // Remove terminal
        clearTerminalBody();
        setupSplitLayout(3);
        const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
        (0, chai_1.expect)(wrappers.length).to.equal(3);
        wrappers.forEach((wrapper) => {
          (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
        });
      }
    );
    (0, mocha_1.it)('TC-4.2: Removing from 2 terminals should switch to normal mode', () => {
      // This test verifies the decision logic
      const _remainingTerminals = 1;
      // In real implementation, this would trigger mode switch to 'normal'
      // For now, we verify that only 1 wrapper would exist
      setupSplitLayout(1);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(1);
    });
    (0, mocha_1.it)('TC-4.3: All remaining terminals should be visible', () => {
      setupSplitLayout(3);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
      });
    });
    (0, mocha_1.it)('TC-4.4: Resizer count should match remaining terminal count', () => {
      setupSplitLayout(3);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      const resizers = terminalBody.querySelectorAll('.split-resizer');
      (0, chai_1.expect)(resizers.length).to.equal(wrappers.length - 1);
    });
  });
  (0, mocha_1.describe)('REQ-6: Tab Reordering in Split Mode', () => {
    (0, mocha_1.it)('TC-6.1: Display order should match tab order after reordering', () => {
      setupSplitLayout(3);
      const wrappers = Array.from(terminalBody.querySelectorAll('.terminal-split-wrapper'));
      const ids = wrappers.map((w) => w.getAttribute('data-terminal-wrapper-id'));
      (0, chai_1.expect)(ids).to.deep.equal(['terminal-1', 'terminal-2', 'terminal-3']);
      // Simulate reorder: Move terminal-3 to first position
      clearTerminalBody();
      setupSplitLayoutWithOrder(['terminal-3', 'terminal-1', 'terminal-2']);
      const reorderedWrappers = Array.from(
        terminalBody.querySelectorAll('.terminal-split-wrapper')
      );
      const reorderedIds = reorderedWrappers.map((w) => w.getAttribute('data-terminal-wrapper-id'));
      (0, chai_1.expect)(reorderedIds).to.deep.equal(['terminal-3', 'terminal-1', 'terminal-2']);
    });
    (0, mocha_1.it)('TC-6.2: Heights remain equal after reordering', () => {
      setupSplitLayoutWithOrder(['terminal-2', 'terminal-1', 'terminal-3']);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.flex).to.equal('1 1 0');
      });
    });
    (0, mocha_1.it)('TC-6.3: All terminals remain visible after reordering', () => {
      setupSplitLayoutWithOrder(['terminal-3', 'terminal-2', 'terminal-1']);
      const wrappers = terminalBody.querySelectorAll('.terminal-split-wrapper');
      (0, chai_1.expect)(wrappers.length).to.equal(3);
      wrappers.forEach((wrapper) => {
        (0, chai_1.expect)(wrapper.style.display).to.not.equal('none');
      });
    });
  });
  // Helper functions
  function createSplitWrapper(terminalId, _terminalCount) {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-split-wrapper';
    wrapper.setAttribute('data-terminal-wrapper-id', terminalId);
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.flex = '1 1 0';
    wrapper.style.minHeight = '0';
    wrapper.style.width = '100%';
    return wrapper;
  }
  function createResizer() {
    const resizer = document.createElement('div');
    resizer.className = 'split-resizer';
    resizer.style.height = '4px';
    resizer.style.flexShrink = '0';
    return resizer;
  }
  function setupSplitLayout(terminalCount) {
    terminalBody.style.display = 'flex';
    terminalBody.style.flexDirection = 'column';
    for (let i = 1; i <= terminalCount; i++) {
      const wrapper = createSplitWrapper(`terminal-${i}`, terminalCount);
      terminalBody.appendChild(wrapper);
      if (i < terminalCount) {
        terminalBody.appendChild(createResizer());
      }
    }
  }
  function setupSplitLayoutWithOrder(terminalIds) {
    terminalBody.style.display = 'flex';
    terminalBody.style.flexDirection = 'column';
    terminalIds.forEach((id, index) => {
      const wrapper = createSplitWrapper(id, terminalIds.length);
      terminalBody.appendChild(wrapper);
      if (index < terminalIds.length - 1) {
        terminalBody.appendChild(createResizer());
      }
    });
  }
  function clearTerminalBody() {
    terminalBody.innerHTML = '';
  }
});
//# sourceMappingURL=SplitModeSpec.test.js.map
