'use strict';
/**
 * HeaderFactory Unit Tests
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const HeaderFactory_1 = require('../../../../../webview/factories/HeaderFactory');
// Mock logger
vitest_1.vi.mock('../../../../../src/utils/logger', () => ({
  webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('HeaderFactory', () => {
  (0, vitest_1.beforeEach)(() => {
    document.body.innerHTML = '';
  });
  (0, vitest_1.describe)('createTerminalHeader', () => {
    (0, vitest_1.it)('should create header structure with name', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'My Terminal',
      });
      (0, vitest_1.expect)(elements.container.getAttribute('data-terminal-id')).toBe('t1');
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('My Terminal');
      (0, vitest_1.expect)(elements.container.className).toContain('terminal-header');
    });
    (0, vitest_1.it)('should include split button if requested', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Split Test',
        showSplitButton: true,
      });
      (0, vitest_1.expect)(elements.splitButton).toBeTruthy();
      (0, vitest_1.expect)(elements.splitButton?.className).toContain('split-btn');
    });
    (0, vitest_1.it)('should handle click events', () => {
      const onHeaderClick = vitest_1.vi.fn();
      const onCloseClick = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Event Test',
        onHeaderClick,
        onCloseClick,
      });
      // Click header
      elements.container.click();
      (0, vitest_1.expect)(onHeaderClick).toHaveBeenCalledWith('t1');
      // Click close button
      elements.closeButton.click();
      (0, vitest_1.expect)(onCloseClick).toHaveBeenCalledWith('t1');
    });
    (0, vitest_1.it)('should handle hover effects', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Hover Test',
      });
      const btn = elements.closeButton;
      btn.dispatchEvent(new MouseEvent('mouseenter'));
      (0, vitest_1.expect)(btn.style.opacity).toBe('1');
      btn.dispatchEvent(new MouseEvent('mouseleave'));
      (0, vitest_1.expect)(btn.style.opacity).toBe('0.7');
    });
  });
  (0, vitest_1.describe)('Status Management', () => {
    let elements;
    (0, vitest_1.beforeEach)(() => {
      elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Status Test',
      });
    });
    (0, vitest_1.it)('should insert CLI Agent status', () => {
      HeaderFactory_1.HeaderFactory.insertCliAgentStatus(elements, 'connected', 'claude');
      (0, vitest_1.expect)(elements.statusSpan.textContent).toContain('AI Agent Connected');
      (0, vitest_1.expect)(elements.indicator.style.color.toLowerCase()).toBe('#4caf50');
    });
    (0, vitest_1.it)('should update status when called multiple times', () => {
      HeaderFactory_1.HeaderFactory.insertCliAgentStatus(elements, 'connected');
      HeaderFactory_1.HeaderFactory.insertCliAgentStatus(elements, 'disconnected');
      (0, vitest_1.expect)(elements.statusSpan.textContent).toContain('AI Agent Disconnected');
      (0, vitest_1.expect)(elements.statusSection.querySelectorAll('.ai-agent-status').length).toBe(
        1
      );
    });
    (0, vitest_1.it)('should remove status', () => {
      HeaderFactory_1.HeaderFactory.insertCliAgentStatus(elements, 'connected');
      HeaderFactory_1.HeaderFactory.removeCliAgentStatus(elements);
      (0, vitest_1.expect)(elements.statusSpan).toBeNull();
      (0, vitest_1.expect)(elements.statusSection.children.length).toBe(0);
    });
  });
  (0, vitest_1.describe)('UI Updates', () => {
    (0, vitest_1.it)('should update terminal name', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Old',
      });
      HeaderFactory_1.HeaderFactory.updateTerminalName(elements, 'New');
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('New');
    });
    (0, vitest_1.it)('should update active state styles', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Active Test',
      });
      HeaderFactory_1.HeaderFactory.setActiveState(elements, true);
      (0, vitest_1.expect)(elements.container.style.backgroundColor).toContain('activeBackground');
      HeaderFactory_1.HeaderFactory.setActiveState(elements, false);
      (0, vitest_1.expect)(elements.container.style.backgroundColor).toContain(
        'inactiveBackground'
      );
    });
    (0, vitest_1.it)('should toggle AI Agent button visibility', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Button Test',
      });
      HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(elements, false);
      (0, vitest_1.expect)(elements.aiAgentToggleButton?.style.display).toBe('none');
      HeaderFactory_1.HeaderFactory.setAiAgentToggleButtonVisibility(elements, true, 'connected');
      (0, vitest_1.expect)(elements.aiAgentToggleButton?.style.display).toBe('flex');
      (0, vitest_1.expect)(elements.aiAgentToggleButton?.title).toContain('Connected');
    });
  });
  (0, vitest_1.describe)('Terminal Name Editing', () => {
    (0, vitest_1.it)(
      'should not trigger header activation on second click of terminal-name double click',
      () => {
        const onRenameSubmit = vitest_1.vi.fn();
        const onHeaderClick = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onRenameSubmit,
          onHeaderClick,
        });
        elements.nameSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
        elements.nameSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
        elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
        const input = elements.titleSection.querySelector('.terminal-name-edit-input');
        (0, vitest_1.expect)(onHeaderClick).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(input).toBeTruthy();
      }
    );
    (0, vitest_1.it)('should enter rename mode on terminal name double click', () => {
      const onRenameSubmit = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onRenameSubmit,
      });
      elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      (0, vitest_1.expect)(input).toBeTruthy();
      (0, vitest_1.expect)(onRenameSubmit).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should submit rename on Enter', () => {
      const onRenameSubmit = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onRenameSubmit,
      });
      elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      input.value = 'Renamed';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      (0, vitest_1.expect)(onRenameSubmit).toHaveBeenCalledWith('t1', 'Renamed');
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('Renamed');
    });
    (0, vitest_1.it)('should cancel rename on Escape', () => {
      const onRenameSubmit = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onRenameSubmit,
      });
      elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      input.value = 'Renamed';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      (0, vitest_1.expect)(onRenameSubmit).not.toHaveBeenCalled();
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('Original');
    });
    (0, vitest_1.it)('should submit rename on blur', async () => {
      const onRenameSubmit = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onRenameSubmit,
      });
      elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      input.value = 'Renamed By Blur';
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      // blur handler uses requestAnimationFrame
      await new Promise((resolve) => requestAnimationFrame(resolve));
      (0, vitest_1.expect)(onRenameSubmit).toHaveBeenCalledWith('t1', 'Renamed By Blur');
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('Renamed By Blur');
    });
    (0, vitest_1.it)('should keep original name when submitting empty value', () => {
      const onRenameSubmit = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onRenameSubmit,
      });
      elements.nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      input.value = '   ';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      (0, vitest_1.expect)(onRenameSubmit).not.toHaveBeenCalled();
      (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('Original');
    });
    (0, vitest_1.it)('should NOT close editor when clicking a color palette button', async () => {
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      (0, vitest_1.expect)(
        elements.titleSection.querySelector('.terminal-header-editor')
      ).toBeTruthy();
      const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      // Simulate: mousedown sets flag, focusout fires, click fires and re-focuses input
      pinkOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      pinkOption.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      (0, vitest_1.expect)(
        elements.titleSection.querySelector('.terminal-header-editor')
      ).toBeTruthy();
      // Do not commit updates while the editor is still open.
      (0, vitest_1.expect)(onHeaderUpdate).not.toHaveBeenCalledWith('t1', {
        indicatorColor: '#FF69B4',
      });
    });
    (0, vitest_1.it)(
      'should NOT close editor when focus moves from input to a palette button (blur path)',
      async () => {
        const onHeaderUpdate = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onHeaderUpdate,
        });
        document.body.appendChild(elements.container);
        elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const editor = elements.titleSection.querySelector('.terminal-header-editor');
        (0, vitest_1.expect)(editor).toBeTruthy();
        const input = elements.titleSection.querySelector('.terminal-name-edit-input');
        const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
        (0, vitest_1.expect)(input).toBeTruthy();
        (0, vitest_1.expect)(pinkOption).toBeTruthy();
        input.focus();
        pinkOption.focus(); // activeElement moves within editor
        input.dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: pinkOption })
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        (0, vitest_1.expect)(
          elements.titleSection.querySelector('.terminal-header-editor')
        ).toBeTruthy();
      }
    );
    (0, vitest_1.it)(
      'should NOT close editor when clicking the color palette area (non-button)',
      async () => {
        const onHeaderUpdate = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onHeaderUpdate,
        });
        elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        (0, vitest_1.expect)(
          elements.titleSection.querySelector('.terminal-header-editor')
        ).toBeTruthy();
        const palette = elements.titleSection.querySelector('.terminal-header-color-palette');
        const input = elements.titleSection.querySelector('.terminal-name-edit-input');
        // Simulate: clicking within palette background triggers input blur.
        palette.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        palette.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        (0, vitest_1.expect)(
          elements.titleSection.querySelector('.terminal-header-editor')
        ).toBeTruthy();
      }
    );
    (0, vitest_1.it)(
      'should close editor when double-clicking the color palette area (non-button)',
      () => {
        const onHeaderUpdate = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onHeaderUpdate,
        });
        elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        (0, vitest_1.expect)(
          elements.titleSection.querySelector('.terminal-header-editor')
        ).toBeTruthy();
        const palette = elements.titleSection.querySelector('.terminal-header-color-palette');
        palette.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        (0, vitest_1.expect)(
          elements.titleSection.querySelector('.terminal-header-editor')
        ).toBeNull();
        (0, vitest_1.expect)(elements.nameSpan.textContent).toBe('Original');
      }
    );
    (0, vitest_1.it)(
      'should commit indicator color when closing the editor (palette dblclick)',
      () => {
        const onHeaderUpdate = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onHeaderUpdate,
        });
        elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
        pinkOption.click();
        const palette = elements.titleSection.querySelector('.terminal-header-color-palette');
        palette.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        (0, vitest_1.expect)(onHeaderUpdate).toHaveBeenCalledWith('t1', {
          indicatorColor: '#FF69B4',
        });
      }
    );
    (0, vitest_1.it)('should apply enhanced visual styles to selected color option', () => {
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
      pinkOption.click();
      (0, vitest_1.expect)(pinkOption.style.outline).toContain('var(--vscode-focusBorder)');
      (0, vitest_1.expect)(pinkOption.style.outlineOffset).toBe('1px');
      (0, vitest_1.expect)(pinkOption.style.transform).toBe('scale(1)');
      (0, vitest_1.expect)(pinkOption.style.opacity).toBe('1');
      const redOption = elements.titleSection.querySelector('[data-indicator-color="#FF0000"]');
      (0, vitest_1.expect)(redOption.style.outline).toContain('none');
      (0, vitest_1.expect)(redOption.style.transform).toBe('scale(1)');
      (0, vitest_1.expect)(redOption.style.opacity).toBe('0.6');
    });
    (0, vitest_1.it)('should flash processing indicator when color is selected', () => {
      vitest_1.vi.useFakeTimers();
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      document.body.appendChild(elements.container);
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const indicator = elements.container.querySelector('.terminal-processing-indicator');
      const flow = elements.container.querySelector('.terminal-processing-indicator-flow');
      (0, vitest_1.expect)(indicator.style.opacity).toBe('0');
      (0, vitest_1.expect)(flow.style.animation).toContain('infinite');
      const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
      pinkOption.click();
      (0, vitest_1.expect)(indicator.style.opacity).toBe('1');
      // Palette click should provide a single-run animation for quick color confirmation.
      (0, vitest_1.expect)(flow.style.animation).not.toContain('infinite');
      vitest_1.vi.advanceTimersByTime(600);
      (0, vitest_1.expect)(indicator.style.opacity).toBe('0');
      (0, vitest_1.expect)(flow.style.animation).toContain('infinite');
      vitest_1.vi.useRealTimers();
    });
    (0, vitest_1.it)('should open unified editor on header double click with color palette', () => {
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const editor = elements.titleSection.querySelector('.terminal-header-editor');
      const input = elements.titleSection.querySelector('.terminal-name-edit-input');
      const colorOptions = elements.titleSection.querySelectorAll('.terminal-header-color-option');
      (0, vitest_1.expect)(editor).toBeTruthy();
      (0, vitest_1.expect)(input).toBeTruthy();
      (0, vitest_1.expect)(colorOptions).toHaveLength(
        HeaderFactory_1.HEADER_INDICATOR_COLOR_PALETTE.length
      );
      (0, vitest_1.expect)(onHeaderUpdate).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should update indicator color immediately from unified editor', () => {
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const pinkOption = elements.titleSection.querySelector('[data-indicator-color="#FF69B4"]');
      pinkOption.click();
      (0, vitest_1.expect)(onHeaderUpdate).not.toHaveBeenCalledWith('t1', {
        indicatorColor: '#FF69B4',
      });
      (0, vitest_1.expect)(
        elements.container.style.getPropertyValue('--terminal-indicator-color')
      ).toBe('#FF69B4');
    });
    (0, vitest_1.it)('should provide OFF option and emit transparent indicator color', () => {
      const onHeaderUpdate = vitest_1.vi.fn();
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Original',
        onHeaderUpdate,
      });
      elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      const offOption = elements.titleSection.querySelector('[data-indicator-color="transparent"]');
      (0, vitest_1.expect)(offOption).toBeTruthy();
      (0, vitest_1.expect)(offOption?.textContent).toBe('OFF');
      offOption?.click();
      (0, vitest_1.expect)(onHeaderUpdate).not.toHaveBeenCalledWith('t1', {
        indicatorColor: 'transparent',
      });
      (0, vitest_1.expect)(
        elements.container.style.getPropertyValue('--terminal-indicator-color')
      ).toBe('transparent');
    });
  });
  (0, vitest_1.describe)('Processing Indicator', () => {
    (0, vitest_1.it)('should toggle processing indicator visibility', () => {
      const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
        terminalId: 't1',
        terminalName: 'Indicator Test',
      });
      const flow = elements.container.querySelector('.terminal-processing-indicator');
      (0, vitest_1.expect)(flow).toBeTruthy();
      (0, vitest_1.expect)(flow.style.opacity).toBe('0');
      HeaderFactory_1.HeaderFactory.setProcessingIndicatorActive(elements, true);
      (0, vitest_1.expect)(flow.style.opacity).toBe('1');
      HeaderFactory_1.HeaderFactory.setProcessingIndicatorActive(elements, false);
      (0, vitest_1.expect)(flow.style.opacity).toBe('0');
    });
    (0, vitest_1.it)('should expose agreed color palette including white', () => {
      (0, vitest_1.expect)(HeaderFactory_1.HEADER_INDICATOR_COLOR_PALETTE).toContain('#FFFFFF');
      (0, vitest_1.expect)(HeaderFactory_1.HEADER_INDICATOR_COLOR_PALETTE).toContain('transparent');
      (0, vitest_1.expect)(HeaderFactory_1.HEADER_INDICATOR_COLOR_PALETTE).toHaveLength(15);
    });
    (0, vitest_1.it)(
      'should keep processing indicator hidden when header enhancements are disabled',
      () => {
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Indicator Disabled Test',
          headerEnhancementsEnabled: false,
        });
        const flow = elements.container.querySelector('.terminal-processing-indicator');
        (0, vitest_1.expect)(flow).toBeTruthy();
        HeaderFactory_1.HeaderFactory.setProcessingIndicatorActive(elements, true);
        (0, vitest_1.expect)(flow.style.opacity).toBe('0');
      }
    );
  });
  (0, vitest_1.describe)('Header Enhancements Toggle', () => {
    (0, vitest_1.it)(
      'should open rename editor without color palette when header enhancements are disabled',
      () => {
        const onHeaderUpdate = vitest_1.vi.fn();
        const elements = HeaderFactory_1.HeaderFactory.createTerminalHeader({
          terminalId: 't1',
          terminalName: 'Original',
          onHeaderUpdate,
          headerEnhancementsEnabled: false,
        });
        elements.container.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        const input = elements.titleSection.querySelector('.terminal-name-edit-input');
        const colorOptions = elements.titleSection.querySelectorAll(
          '.terminal-header-color-option'
        );
        (0, vitest_1.expect)(input).toBeTruthy();
        (0, vitest_1.expect)(colorOptions).toHaveLength(0);
        (0, vitest_1.expect)(onHeaderUpdate).not.toHaveBeenCalledWith(
          't1',
          vitest_1.expect.objectContaining({ indicatorColor: vitest_1.expect.any(String) })
        );
      }
    );
  });
});
//# sourceMappingURL=HeaderFactory.test.js.map
