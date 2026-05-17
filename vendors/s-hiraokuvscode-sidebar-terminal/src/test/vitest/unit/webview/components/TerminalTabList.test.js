'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const jsdom_1 = require('jsdom');
const TerminalTabList_1 = require('../../../../../webview/components/TerminalTabList');
(0, vitest_1.describe)('TerminalTabList', () => {
  let dom;
  let container;
  let tabList;
  let mockEvents;
  (0, vitest_1.beforeEach)(() => {
    dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>');
    vitest_1.vi.stubGlobal('window', dom.window);
    vitest_1.vi.stubGlobal('document', dom.window.document);
    vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
    vitest_1.vi.stubGlobal('getComputedStyle', dom.window.getComputedStyle);
    container = dom.window.document.getElementById('container');
    mockEvents = {
      onTabClick: vitest_1.vi.fn(),
      onTabClose: vitest_1.vi.fn(),
      onTabRename: vitest_1.vi.fn(),
      onTabReorder: vitest_1.vi.fn(),
      onNewTab: vitest_1.vi.fn(),
      onModeToggle: vitest_1.vi.fn(),
    };
    tabList = new TerminalTabList_1.TerminalTabList(container, mockEvents);
  });
  (0, vitest_1.afterEach)(() => {
    tabList.dispose();
    vitest_1.vi.unstubAllGlobals();
    dom.window.close();
  });
  (0, vitest_1.describe)('UI Construction', () => {
    (0, vitest_1.it)('should initialize with correct classes and structure', () => {
      (0, vitest_1.expect)(container.className).toBe('terminal-tabs-container');
      (0, vitest_1.expect)(container.querySelector('.terminal-tabs-wrapper')).not.toBeNull();
    });
  });
  (0, vitest_1.describe)('Tab Management', () => {
    (0, vitest_1.it)('should add a tab element to the wrapper', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      (0, vitest_1.expect)(tabEl).not.toBeNull();
      (0, vitest_1.expect)(tabEl?.textContent).toContain('Terminal 1');
    });
    (0, vitest_1.it)('should update active state correctly', () => {
      tabList.addTab({ id: 't1', name: 'T1', isActive: false, isClosable: true });
      tabList.addTab({ id: 't2', name: 'T2', isActive: false, isClosable: true });
      tabList.setActiveTab('t2');
      const t1El = container.querySelector('[data-tab-id="t1"]');
      const t2El = container.querySelector('[data-tab-id="t2"]');
      (0, vitest_1.expect)(t1El?.classList.contains('active')).toBe(false);
      (0, vitest_1.expect)(t2El?.classList.contains('active')).toBe(true);
      (0, vitest_1.expect)(t2El?.getAttribute('aria-selected')).toBe('true');
    });
    (0, vitest_1.it)('should remove a tab element', () => {
      tabList.addTab({ id: 't1', name: 'T1', isActive: false, isClosable: true });
      tabList.removeTab('t1');
      (0, vitest_1.expect)(container.querySelector('[data-tab-id="t1"]')).toBeNull();
    });
  });
  (0, vitest_1.describe)('Event Interaction', () => {
    (0, vitest_1.it)('should trigger onTabClick when a tab is clicked', () => {
      tabList.addTab({ id: 't1', name: 'T1', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Simulate click
      tabEl.click();
      (0, vitest_1.expect)(mockEvents.onTabClick).toHaveBeenCalledWith('t1');
    });
    (0, vitest_1.it)('should trigger onTabClose when close button is clicked', () => {
      tabList.addTab({ id: 't1', name: 'T1', isActive: false, isClosable: true });
      const closeBtn = container.querySelector('.terminal-tab-close');
      // Use MouseEvent to ensure delegation picks it up
      const event = new dom.window.MouseEvent('click', { bubbles: true });
      closeBtn.dispatchEvent(event);
      (0, vitest_1.expect)(mockEvents.onTabClose).toHaveBeenCalledWith('t1');
    });
    (0, vitest_1.it)('should trigger onModeToggle when indicator is clicked', () => {
      const indicator = container.querySelector('.terminal-mode-indicator');
      indicator.click();
      (0, vitest_1.expect)(mockEvents.onModeToggle).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Drag and Drop', () => {
    (0, vitest_1.it)(
      'should compute reorder based on current DOM order after previous reorders',
      () => {
        tabList.addTab({ id: 't1', name: 'T1', isActive: false, isClosable: true });
        tabList.addTab({ id: 't2', name: 'T2', isActive: false, isClosable: true });
        tabList.addTab({ id: 't3', name: 'T3', isActive: false, isClosable: true });
        // Simulate a prior reorder so DOM order differs from insertion order
        tabList.reorderTabs(['t2', 't3', 't1']);
        const tabsWrapper = container.querySelector('.terminal-tabs-wrapper');
        const tab2 = container.querySelector('[data-tab-id="t2"]');
        const tab3 = container.querySelector('[data-tab-id="t3"]');
        const rect = {
          left: 0,
          right: 100,
          width: 100,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
        tab3.getBoundingClientRect = () => rect;
        tabsWrapper.getBoundingClientRect = () => rect;
        const dataTransfer = {
          effectAllowed: '',
          setData: vitest_1.vi.fn(),
          getData: vitest_1.vi.fn(),
        };
        const dragStart = new dom.window.Event('dragstart', {
          bubbles: true,
          cancelable: true,
        });
        dragStart.dataTransfer = dataTransfer;
        tab2.dispatchEvent(dragStart);
        const dragOver = new dom.window.MouseEvent('dragover', { bubbles: true, clientX: 80 });
        dragOver.dataTransfer = dataTransfer;
        tab3.dispatchEvent(dragOver);
        const drop = new dom.window.Event('drop', { bubbles: true, cancelable: true });
        drop.dataTransfer = dataTransfer;
        tab3.dispatchEvent(drop);
        (0, vitest_1.expect)(mockEvents.onTabReorder).toHaveBeenCalledWith(0, 1, [
          't3',
          't2',
          't1',
        ]);
      }
    );
  });
  (0, vitest_1.describe)('Double-Click Rename', () => {
    (0, vitest_1.it)('should show rename input when tab label is double-clicked', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      // Need 2+ tabs for tabs to be visible
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).not.toBeNull();
      (0, vitest_1.expect)(input.value).toBe('Terminal 1');
    });
    (0, vitest_1.it)('should NOT trigger rename when close button is double-clicked', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const closeBtn = container.querySelector('.terminal-tab-close');
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      closeBtn.dispatchEvent(dblclickEvent);
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).toBeNull();
    });
    (0, vitest_1.it)('should call onTabRename when Enter is pressed in rename input', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Trigger rename mode
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).not.toBeNull();
      // Type new name and press Enter
      input.value = 'New Name';
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(enterEvent);
      (0, vitest_1.expect)(mockEvents.onTabRename).toHaveBeenCalledWith('t1', 'New Name');
    });
    (0, vitest_1.it)('should restore original name when Escape is pressed in rename input', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Trigger rename mode
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      input.value = 'Changed Name';
      const escapeEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      input.dispatchEvent(escapeEvent);
      (0, vitest_1.expect)(mockEvents.onTabRename).not.toHaveBeenCalled();
      // Label should be restored
      const label = tabEl.querySelector('.terminal-tab-label');
      (0, vitest_1.expect)(label?.textContent).toBe('Terminal 1');
    });
    (0, vitest_1.it)('should save name on blur from rename input after delay', () => {
      vitest_1.vi.useFakeTimers();
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Trigger rename mode
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      input.value = 'Blurred Name';
      const blurEvent = new dom.window.Event('blur', { bubbles: false });
      input.dispatchEvent(blurEvent);
      // Not called immediately due to delayed blur pattern
      (0, vitest_1.expect)(mockEvents.onTabRename).not.toHaveBeenCalled();
      // After the delay expires, the rename should be committed
      vitest_1.vi.advanceTimersByTime(60);
      (0, vitest_1.expect)(mockEvents.onTabRename).toHaveBeenCalledWith('t1', 'Blurred Name');
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should survive focus steal from terminal.focus() during rename', () => {
      vitest_1.vi.useFakeTimers();
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Trigger rename mode
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).not.toBeNull();
      input.value = 'New Name';
      // Simulate terminal.focus() stealing focus (triggers blur on the input)
      const blurEvent = new dom.window.Event('blur', { bubbles: false });
      input.dispatchEvent(blurEvent);
      // Before the delay expires, re-focus the input (simulating the re-assert timeout).
      // In JSDOM, focus() alone may not fire the 'focus' event, so dispatch it explicitly.
      vitest_1.vi.advanceTimersByTime(30);
      input.focus();
      input.dispatchEvent(new dom.window.Event('focus', { bubbles: false }));
      // Now advance past the full delay
      vitest_1.vi.advanceTimersByTime(30);
      // Rename should NOT have been committed because input regained focus
      (0, vitest_1.expect)(mockEvents.onTabRename).not.toHaveBeenCalled();
      // Input should still be present in the DOM
      (0, vitest_1.expect)(tabEl.querySelector('input.terminal-tab-rename-input')).not.toBeNull();
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should NOT trigger rename when input element is double-clicked', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Enter rename mode first
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).not.toBeNull();
      // Double-click the input itself should not cause issues
      const dblclickInput = new dom.window.MouseEvent('dblclick', { bubbles: true });
      input.dispatchEvent(dblclickInput);
      // Input should still be present (no error, no duplicate rename)
      (0, vitest_1.expect)(tabEl.querySelector('input.terminal-tab-rename-input')).not.toBeNull();
    });
    (0, vitest_1.it)('should call onTabRename exactly once when Enter triggers blur', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      input.value = 'New Name';
      // Enter calls finishRename, which removes input and triggers blur
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(enterEvent);
      // blur fires after replaceWith but finishRename guard prevents double call
      const blurEvent = new dom.window.Event('blur', { bubbles: false });
      input.dispatchEvent(blurEvent);
      (0, vitest_1.expect)(mockEvents.onTabRename).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should NOT call onTabRename when name is empty or whitespace', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      input.value = '   ';
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(enterEvent);
      (0, vitest_1.expect)(mockEvents.onTabRename).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should NOT call onTabRename when name is unchanged', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      // Name unchanged
      (0, vitest_1.expect)(input.value).toBe('Terminal 1');
      const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(enterEvent);
      (0, vitest_1.expect)(mockEvents.onTabRename).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should preserve rename input when updateTab is called during rename', () => {
      tabList.addTab({ id: 't1', name: 'Terminal 1', isActive: true, isClosable: true });
      tabList.addTab({ id: 't2', name: 'Terminal 2', isActive: false, isClosable: true });
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Enter rename mode
      const dblclickEvent = new dom.window.MouseEvent('dblclick', { bubbles: true });
      tabEl.dispatchEvent(dblclickEvent);
      const input = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(input).not.toBeNull();
      input.value = 'Editing...';
      // Simulate a concurrent update (e.g., theme change triggers updateTab)
      tabList.updateTab('t1', { isDirty: true });
      // Input should still be present
      const inputAfterUpdate = tabEl.querySelector('input.terminal-tab-rename-input');
      (0, vitest_1.expect)(inputAfterUpdate).not.toBeNull();
      (0, vitest_1.expect)(inputAfterUpdate.value).toBe('Editing...');
    });
  });
  (0, vitest_1.describe)('Visual State', () => {
    (0, vitest_1.it)('should update mode indicator', () => {
      tabList.setModeIndicator('fullscreen');
      const indicator = container.querySelector('.terminal-mode-indicator');
      (0, vitest_1.expect)(indicator?.getAttribute('data-mode')).toBe('fullscreen');
      (0, vitest_1.expect)(indicator?.getAttribute('aria-label')).toBe('Show all terminals');
    });
    (0, vitest_1.it)('should apply theme styles to tabs', () => {
      tabList.addTab({ id: 't1', name: 'T1', isActive: true, isClosable: true });
      const theme = { background: '#123456', foreground: '#ffffff', cursor: '#ffffff' };
      // @ts-expect-error - test mock type
      tabList.updateTheme(theme);
      const tabEl = container.querySelector('[data-tab-id="t1"]');
      // Note: jsdom might not normalize colors, checking the set value
      (0, vitest_1.expect)(tabEl.style.backgroundColor).toBe('rgb(18, 52, 86)'); // #123456 in RGB
    });
  });
});
//# sourceMappingURL=TerminalTabList.test.js.map
