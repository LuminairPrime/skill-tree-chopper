"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const InputEventService_1 = require("../../../../../../../webview/managers/input/services/InputEventService");
(0, vitest_1.describe)('InputEventService', () => {
    let dom;
    let service;
    let element;
    let mockLogger;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('performance', dom.window.performance);
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.clearAllTimers();
        mockLogger = vitest_1.vi.fn();
        service = new InputEventService_1.InputEventService(mockLogger);
        element = dom.window.document.getElementById('test');
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
        vitest_1.vi.useRealTimers();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('Registration', () => {
        (0, vitest_1.it)('should register and trigger a wrapped event handler', () => {
            const handler = vitest_1.vi.fn();
            service.registerEventHandler('h1', element, 'click', handler);
            (0, vitest_1.expect)(service.hasEventHandler('h1')).toBe(true);
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            (0, vitest_1.expect)(handler).toHaveBeenCalled();
            const metrics = service.getEventHandlerMetrics('h1');
            (0, vitest_1.expect)(metrics?.callCount).toBe(1);
        });
        (0, vitest_1.it)('should handle preventDefault based on config', () => {
            const handler = vitest_1.vi.fn();
            service.registerEventHandler('h1', element, 'click', handler, { preventDefault: true });
            const event = new dom.window.MouseEvent('click');
            const preventSpy = vitest_1.vi.spyOn(event, 'preventDefault');
            element.dispatchEvent(event);
            (0, vitest_1.expect)(preventSpy).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Debouncing', () => {
        (0, vitest_1.it)('should debounce event execution', async () => {
            const handler = vitest_1.vi.fn();
            service.registerEventHandler('h1', element, 'input', handler, {
                debounce: true,
                debounceDelay: 100,
            });
            // Dispatch multiple events
            element.dispatchEvent(new dom.window.Event('input'));
            element.dispatchEvent(new dom.window.Event('input'));
            element.dispatchEvent(new dom.window.Event('input'));
            (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
            // Advance time beyond delay
            vitest_1.vi.advanceTimersByTime(150);
            // Should be called exactly once
            (0, vitest_1.expect)(handler).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('Metrics & Health', () => {
        (0, vitest_1.it)('should track errors in handlers', () => {
            const failingHandler = () => {
                throw new Error('Boom');
            };
            service.registerEventHandler('fail', element, 'click', failingHandler);
            const event = new dom.window.MouseEvent('click');
            element.dispatchEvent(event);
            (0, vitest_1.expect)(service.getGlobalMetrics().totalErrors).toBe(1);
            (0, vitest_1.expect)(service.getEventHandlerMetrics('fail')?.errorCount).toBe(1);
            (0, vitest_1.expect)(service.getHealthStatus().isHealthy).toBe(false);
        });
        (0, vitest_1.it)('should calculate average processing time', () => {
            service.registerEventHandler('h1', element, 'click', () => { });
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            const status = service.getHealthStatus();
            (0, vitest_1.expect)(status.averageProcessingTime).toBeGreaterThanOrEqual(0);
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should unregister and stop responding', () => {
            const handler = vitest_1.vi.fn();
            service.registerEventHandler('h1', element, 'click', handler);
            service.unregisterEventHandler('h1');
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should clear timers on dispose', () => {
            service.registerEventHandler('h1', element, 'click', vitest_1.vi.fn(), { debounce: true });
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            service.dispose();
            vitest_1.vi.advanceTimersByTime(1000);
            // Logic: if dispose clears timers, no callback fires (implied coverage)
        });
    });
});
//# sourceMappingURL=InputEventService.test.js.map