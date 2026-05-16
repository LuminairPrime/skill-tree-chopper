"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const LoadingIndicatorService_1 = require("../../../../../../webview/managers/ui/LoadingIndicatorService");
// Mock dependencies
vitest_1.vi.mock('../../../../../../webview/utils/ManagerLogger');
(0, vitest_1.describe)('LoadingIndicatorService', () => {
    let service;
    let container;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        service = new LoadingIndicatorService_1.LoadingIndicatorService();
        // Setup DOM
        container = document.createElement('div');
        container.id = 'terminal-container';
        document.body.appendChild(container);
    });
    (0, vitest_1.afterEach)(() => {
        document.body.innerHTML = '';
    });
    (0, vitest_1.describe)('showTerminalPlaceholder', () => {
        (0, vitest_1.it)('should create placeholder if not exists', () => {
            service.showTerminalPlaceholder();
            const placeholder = document.getElementById('terminal-placeholder');
            (0, vitest_1.expect)(placeholder).not.toBeNull();
            (0, vitest_1.expect)(placeholder?.style.display).toBe('flex');
            (0, vitest_1.expect)(container.contains(placeholder)).toBe(true);
        });
        (0, vitest_1.it)('should show existing placeholder', () => {
            // Create first
            service.showTerminalPlaceholder();
            const placeholder = document.getElementById('terminal-placeholder');
            placeholder.style.display = 'none';
            // Show again
            service.showTerminalPlaceholder();
            (0, vitest_1.expect)(placeholder.style.display).toBe('flex');
        });
        (0, vitest_1.it)('should set correct content', () => {
            service.showTerminalPlaceholder();
            const title = document.querySelector('.placeholder-title');
            (0, vitest_1.expect)(title?.textContent).toBe('No Terminal Active');
        });
    });
    (0, vitest_1.describe)('hideTerminalPlaceholder', () => {
        (0, vitest_1.it)('should hide existing placeholder', () => {
            service.showTerminalPlaceholder();
            service.hideTerminalPlaceholder();
            const placeholder = document.getElementById('terminal-placeholder');
            (0, vitest_1.expect)(placeholder?.style.display).toBe('none');
        });
        (0, vitest_1.it)('should ignore if not exists', () => {
            service.hideTerminalPlaceholder();
            // No error
        });
    });
    (0, vitest_1.describe)('showLoadingIndicator', () => {
        (0, vitest_1.it)('should create indicator', () => {
            const indicator = service.showLoadingIndicator('Test Loading');
            (0, vitest_1.expect)(indicator.classList.contains('loading-indicator')).toBe(true);
            (0, vitest_1.expect)(indicator.textContent).toContain('Test Loading');
            (0, vitest_1.expect)(container.contains(indicator)).toBe(true);
        });
        (0, vitest_1.it)('should use default message', () => {
            const indicator = service.showLoadingIndicator();
            (0, vitest_1.expect)(indicator.textContent).toContain('Loading...');
        });
    });
    (0, vitest_1.describe)('hideLoadingIndicator', () => {
        (0, vitest_1.it)('should remove specific indicator', () => {
            const indicator = service.showLoadingIndicator();
            (0, vitest_1.expect)(container.contains(indicator)).toBe(true);
            service.hideLoadingIndicator(indicator);
            (0, vitest_1.expect)(container.contains(indicator)).toBe(false);
        });
        (0, vitest_1.it)('should remove all indicators if no argument', () => {
            service.showLoadingIndicator('1');
            service.showLoadingIndicator('2');
            (0, vitest_1.expect)(document.querySelectorAll('.loading-indicator').length).toBe(2);
            service.hideLoadingIndicator();
            (0, vitest_1.expect)(document.querySelectorAll('.loading-indicator').length).toBe(0);
        });
    });
    (0, vitest_1.describe)('state checks', () => {
        (0, vitest_1.it)('isPlaceholderVisible should return true only when displayed', () => {
            (0, vitest_1.expect)(service.isPlaceholderVisible()).toBe(false);
            service.showTerminalPlaceholder();
            (0, vitest_1.expect)(service.isPlaceholderVisible()).toBe(true);
            service.hideTerminalPlaceholder();
            (0, vitest_1.expect)(service.isPlaceholderVisible()).toBe(false);
        });
        (0, vitest_1.it)('hasLoadingIndicator should return true if any exist', () => {
            (0, vitest_1.expect)(service.hasLoadingIndicator()).toBe(false);
            service.showLoadingIndicator();
            (0, vitest_1.expect)(service.hasLoadingIndicator()).toBe(true);
            service.hideLoadingIndicator();
            (0, vitest_1.expect)(service.hasLoadingIndicator()).toBe(false);
        });
    });
});
//# sourceMappingURL=LoadingIndicatorService.test.js.map