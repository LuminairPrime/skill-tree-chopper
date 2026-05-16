"use strict";
// Vitest Migration: Converted from Mocha/Chai/Sinon to Vitest
/**
 * TerminalContainerFactory Tests
 * Tests for centralized terminal container creation and styling
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TerminalContainerFactory_1 = require("../../../../../webview/factories/TerminalContainerFactory");
(0, vitest_1.describe)('TerminalContainerFactory', () => {
    (0, vitest_1.beforeEach)(() => {
        // Set up DOM elements in the existing environment
        document.body.innerHTML = '<div id="terminal-main-container"></div>';
    });
    (0, vitest_1.afterEach)(() => {
        document.body.innerHTML = '';
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('createContainer', () => {
        (0, vitest_1.it)('should create basic container with minimal config', () => {
            const config = {
                id: 'test-terminal-1',
                name: 'Test Terminal',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            (0, vitest_1.expect)(elements).not.toBeNull();
            (0, vitest_1.expect)(elements.container).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(elements.body).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(elements.header).toBeUndefined();
            // Close button is undefined when header is not created
            (0, vitest_1.expect)(elements.closeButton).toBeUndefined();
            (0, vitest_1.expect)(elements.splitButton).toBeUndefined();
        });
        (0, vitest_1.it)('should create container with custom className', () => {
            const config = {
                id: 'test-terminal-2',
                name: 'Test Terminal',
                className: 'custom-terminal-container active',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            (0, vitest_1.expect)(elements.container.className).toBe('custom-terminal-container active');
        });
        (0, vitest_1.it)('should create container with header when requested', () => {
            const config = {
                id: 'test-terminal-3',
                name: 'Test Terminal with Header',
            };
            const headerConfig = {
                showHeader: true,
                showCloseButton: true,
                showSplitButton: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            (0, vitest_1.expect)(elements.header).toBeInstanceOf(HTMLElement);
            // HeaderFactory currently always creates close button if header is shown
            (0, vitest_1.expect)(elements.closeButton).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(elements.splitButton).toBeInstanceOf(HTMLElement);
        });
        (0, vitest_1.it)('should set correct data attributes', () => {
            const config = {
                id: 'data-test-terminal',
                name: 'Data Test Terminal',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            (0, vitest_1.expect)(elements.container.getAttribute('data-terminal-id')).toBe('data-test-terminal');
            (0, vitest_1.expect)(elements.container.getAttribute('data-terminal-name')).toBe('Data Test Terminal');
        });
        (0, vitest_1.it)('should apply split-specific styles when isSplit is true', () => {
            const config = {
                id: 'split-terminal',
                name: 'Split Terminal',
                isSplit: true,
                height: 250,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            (0, vitest_1.expect)(elements.container.style.height).toBe('250px');
            // Check for split-specific styles
            (0, vitest_1.expect)(elements.container.style.minHeight).toBe('150px');
        });
        (0, vitest_1.it)('should apply active state styles when isActive is true', () => {
            const config = {
                id: 'active-terminal',
                name: 'Active Terminal',
                isActive: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            // Should have active border style (borderColor may be empty/transparent in happy-dom due to CSS variables)
            (0, vitest_1.expect)(elements.container.style.borderStyle).toBe('solid');
        });
        (0, vitest_1.it)('should apply custom styles when provided', () => {
            const config = {
                id: 'custom-styles-terminal',
                name: 'Custom Styles Terminal',
                customStyles: {
                    backgroundColor: 'rgb(255, 0, 0)',
                    border: '3px solid blue',
                    opacity: '0.8',
                },
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            (0, vitest_1.expect)(elements.container.style.backgroundColor).toBe('rgb(255, 0, 0)');
            (0, vitest_1.expect)(elements.container.style.border).toBe('3px solid blue');
            (0, vitest_1.expect)(elements.container.style.opacity).toBe('0.8');
        });
        (0, vitest_1.it)('should handle width and height configuration', () => {
            const config = {
                id: 'sized-terminal',
                name: 'Sized Terminal',
                width: 800,
                height: 400,
                isSplit: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            // Height should be set for splits
            (0, vitest_1.expect)(elements.container.style.height).toBe('400px');
        });
    });
    (0, vitest_1.describe)('header creation', () => {
        (0, vitest_1.it)('should create header with custom title', () => {
            const config = {
                id: 'header-test',
                name: 'Original Name',
            };
            const headerConfig = {
                showHeader: true,
                customTitle: 'Custom Header Title',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            const titleElement = elements.header.querySelector('.terminal-name');
            (0, vitest_1.expect)(titleElement.textContent).toBe('Custom Header Title');
        });
        (0, vitest_1.it)('should use terminal name when no custom title provided', () => {
            const config = {
                id: 'default-title-test',
                name: 'Default Title Terminal',
            };
            const headerConfig = {
                showHeader: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            const titleElement = elements.header.querySelector('.terminal-name');
            (0, vitest_1.expect)(titleElement.textContent).toBe('Default Title Terminal');
        });
        (0, vitest_1.it)('should create requested buttons (split is optional)', () => {
            const config = {
                id: 'button-test',
                name: 'Button Test',
            };
            // Close button is currently always created by HeaderFactory if header is shown
            const headerConfig1 = {
                showHeader: true,
                showCloseButton: true,
                showSplitButton: false,
            };
            const elements1 = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig1);
            (0, vitest_1.expect)(elements1.closeButton).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(elements1.splitButton).toBeUndefined();
            // Test only split button
            const headerConfig2 = {
                showHeader: true,
                showCloseButton: false,
                showSplitButton: true,
            };
            const elements2 = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig2);
            // Still exists because HeaderFactory always creates it
            (0, vitest_1.expect)(elements2.closeButton).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(elements2.splitButton).toBeInstanceOf(HTMLElement);
        });
        (0, vitest_1.it)('should create header buttons with hover effects', () => {
            const config = {
                id: 'hover-test',
                name: 'Hover Test',
            };
            const headerConfig = {
                showHeader: true,
                showCloseButton: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            const button = elements.closeButton;
            // Simulate mouseenter
            const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
            button.dispatchEvent(mouseEnterEvent);
            // Should have hover styles applied
            (0, vitest_1.expect)(button.style.backgroundColor).not.toBe('');
            (0, vitest_1.expect)(button.style.backgroundColor).not.toBe('transparent');
            // Simulate mouseleave
            const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
            button.dispatchEvent(mouseLeaveEvent);
            // Should revert to original styles
            (0, vitest_1.expect)(button.style.backgroundColor).toBe('transparent');
        });
        (0, vitest_1.it)('should not trigger container activation on second click of terminal-name double click', () => {
            const onContainerClick = vitest_1.vi.fn();
            const config = {
                id: 'rename-click-test',
                name: 'Rename Click Test',
            };
            const headerConfig = {
                showHeader: true,
                onContainerClick,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            const nameSpan = elements.header?.querySelector('.terminal-name');
            nameSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
            nameSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
            nameSpan.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, detail: 2 }));
            (0, vitest_1.expect)(onContainerClick).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('utility methods', () => {
        let container;
        (0, vitest_1.beforeEach)(() => {
            const config = {
                id: 'utility-test',
                name: 'Utility Test',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            container = elements.container;
        });
        (0, vitest_1.it)('should set active state correctly', () => {
            TerminalContainerFactory_1.TerminalContainerFactory.setActiveState(container, true);
            (0, vitest_1.expect)(container.hasAttribute('data-active')).toBe(true);
            (0, vitest_1.expect)(container.style.borderStyle).toBe('solid');
            TerminalContainerFactory_1.TerminalContainerFactory.setActiveState(container, false);
            (0, vitest_1.expect)(container.hasAttribute('data-active')).toBe(false);
            (0, vitest_1.expect)(container.style.borderColor).toBe('transparent');
        });
        (0, vitest_1.it)('should configure split mode correctly', () => {
            TerminalContainerFactory_1.TerminalContainerFactory.configureSplitMode(container, 300);
            (0, vitest_1.expect)(container.style.height).toBe('300px');
            (0, vitest_1.expect)(container.hasAttribute('data-split')).toBe(true);
        });
        (0, vitest_1.it)('should remove from split mode correctly', () => {
            // First configure as split
            TerminalContainerFactory_1.TerminalContainerFactory.configureSplitMode(container, 300);
            // Then remove from split
            TerminalContainerFactory_1.TerminalContainerFactory.removeFromSplitMode(container);
            (0, vitest_1.expect)(container.style.height).toBe('100%');
            (0, vitest_1.expect)(container.hasAttribute('data-split')).toBe(false);
        });
        (0, vitest_1.it)('should apply theme correctly', () => {
            const theme = {
                background: '#1a1a1a',
                borderColor: '#ff0000',
                activeBorderColor: '#00ff00',
            };
            TerminalContainerFactory_1.TerminalContainerFactory.applyTheme(container, theme);
            // Styles are often converted to RGB in DOM mocks
            (0, vitest_1.expect)(container.style.background).toMatch(/#1a1a1a|rgb\(26, 26, 26\)/);
            (0, vitest_1.expect)(container.style.borderColor).toMatch(/#ff0000|rgb\(255, 0, 0\)/);
            // Set as active and apply theme again
            TerminalContainerFactory_1.TerminalContainerFactory.setActiveState(container, true);
            TerminalContainerFactory_1.TerminalContainerFactory.applyTheme(container, theme);
            (0, vitest_1.expect)(container.style.borderColor).toMatch(/#00ff00|rgb\(0, 255, 0\)/);
        });
        (0, vitest_1.it)('should destroy container correctly', () => {
            const parent = document.getElementById('terminal-main-container');
            parent.appendChild(container);
            (0, vitest_1.expect)(parent.contains(container)).toBe(true);
            TerminalContainerFactory_1.TerminalContainerFactory.destroyContainer(container);
            (0, vitest_1.expect)(parent.contains(container)).toBe(false);
        });
    });
    (0, vitest_1.describe)('createSimpleContainer', () => {
        (0, vitest_1.it)('should create lightweight container', () => {
            const container = TerminalContainerFactory_1.TerminalContainerFactory.createSimpleContainer('simple-1', 'Simple Container');
            (0, vitest_1.expect)(container).toBeInstanceOf(HTMLElement);
            (0, vitest_1.expect)(container.className).toBe('terminal-container-simple');
            (0, vitest_1.expect)(container.getAttribute('data-terminal-id')).toBe('simple-1');
            (0, vitest_1.expect)(container.getAttribute('data-terminal-name')).toBe('Simple Container');
        });
        (0, vitest_1.it)('should have basic styles applied', () => {
            const container = TerminalContainerFactory_1.TerminalContainerFactory.createSimpleContainer('simple-2', 'Simple Container 2');
            (0, vitest_1.expect)(container.style.display).toBe('flex');
            (0, vitest_1.expect)(container.style.flexDirection).toBe('column');
            (0, vitest_1.expect)(container.style.background).toMatch(/#000|rgb\(0, 0, 0\)/);
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should handle missing main container gracefully', () => {
            // Remove main container
            const mainContainer = document.getElementById('terminal-main-container');
            if (mainContainer) {
                mainContainer.remove();
            }
            const config = {
                id: 'error-test',
                name: 'Error Test',
            };
            // Should not throw
            (0, vitest_1.expect)(() => {
                TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            }).not.toThrow();
        });
        (0, vitest_1.it)('should handle invalid config gracefully', () => {
            const invalidConfig = {
                id: '',
                name: '',
            };
            (0, vitest_1.expect)(() => {
                TerminalContainerFactory_1.TerminalContainerFactory.createContainer(invalidConfig);
            }).not.toThrow();
        });
        (0, vitest_1.it)('should handle null/undefined custom styles', () => {
            const config = {
                id: 'null-styles-test',
                name: 'Null Styles Test',
                customStyles: undefined,
            };
            (0, vitest_1.expect)(() => {
                TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            }).not.toThrow();
        });
        (0, vitest_1.it)('should handle destroying non-existent container', () => {
            const orphanContainer = document.createElement('div');
            (0, vitest_1.expect)(() => {
                TerminalContainerFactory_1.TerminalContainerFactory.destroyContainer(orphanContainer);
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)('DOM integration', () => {
        (0, vitest_1.it)('should NOT append container to main container by default (intentionally changed)', () => {
            const config = {
                id: 'dom-test',
                name: 'DOM Test',
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config);
            const mainContainer = document.getElementById('terminal-main-container');
            // Factory no longer appends by default
            (0, vitest_1.expect)(mainContainer.contains(elements.container)).toBe(false);
        });
        (0, vitest_1.it)('should create proper DOM hierarchy', () => {
            const config = {
                id: 'hierarchy-test',
                name: 'Hierarchy Test',
            };
            const headerConfig = {
                showHeader: true,
                showCloseButton: true,
            };
            const elements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(config, headerConfig);
            // Check hierarchy: container > header, body
            (0, vitest_1.expect)(elements.container.contains(elements.header)).toBe(true);
            (0, vitest_1.expect)(elements.container.contains(elements.body)).toBe(true);
            (0, vitest_1.expect)(elements.header.contains(elements.closeButton)).toBe(true);
            // Check order: header should come before body
            const children = Array.from(elements.container.children);
            const headerIndex = children.indexOf(elements.header);
            const bodyIndex = children.indexOf(elements.body);
            (0, vitest_1.expect)(headerIndex).toBeLessThan(bodyIndex);
        });
    });
});
//# sourceMappingURL=TerminalContainerFactory.test.js.map