"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const EventHandlerRegistry_1 = require("../../../../../webview/utils/EventHandlerRegistry");
// Mock logger
vitest_1.vi.mock('../../../../../utils/logger', () => ({
    webview: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('EventHandlerRegistry', () => {
    let dom;
    let registry;
    let element;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body><div id="test" class="test-class"></div></body></html>');
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
        vitest_1.vi.stubGlobal('Element', dom.window.Element);
        registry = new EventHandlerRegistry_1.EventHandlerRegistry();
        element = dom.window.document.getElementById('test');
        vitest_1.vi.spyOn(element, 'addEventListener');
        vitest_1.vi.spyOn(element, 'removeEventListener');
    });
    (0, vitest_1.afterEach)(() => {
        registry.dispose();
        vitest_1.vi.restoreAllMocks();
        vitest_1.vi.unstubAllGlobals();
        dom.window.close();
    });
    (0, vitest_1.describe)('Basic Operations', () => {
        (0, vitest_1.it)('should register and trigger an event listener', () => {
            const handler = vitest_1.vi.fn();
            registry.register('test-click', element, 'click', handler);
            (0, vitest_1.expect)(registry.isRegistered('test-click')).toBe(true);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
            // Trigger event
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            (0, vitest_1.expect)(handler).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should add event listener and track it', () => {
            const listener = vitest_1.vi.fn();
            registry.register('key1', element, 'click', listener);
            (0, vitest_1.expect)(element.addEventListener).toHaveBeenCalledWith('click', listener, undefined);
            (0, vitest_1.expect)(registry.isRegistered('key1')).toBe(true);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
        });
        (0, vitest_1.it)('should unregister a listener', () => {
            const handler = vitest_1.vi.fn();
            registry.register('test-click', element, 'click', handler);
            const result = registry.unregister('test-click');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(registry.isRegistered('test-click')).toBe(false);
            // Trigger event - should not call handler
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            (0, vitest_1.expect)(handler).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should remove event listener and stop tracking', () => {
            const listener = vitest_1.vi.fn();
            registry.register('key1', element, 'click', listener);
            const result = registry.unregister('key1');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(element.removeEventListener).toHaveBeenCalledWith('click', listener, undefined);
            (0, vitest_1.expect)(registry.isRegistered('key1')).toBe(false);
        });
        (0, vitest_1.it)('should return false if key not found', () => {
            (0, vitest_1.expect)(registry.unregister('non-existent')).toBe(false);
        });
        (0, vitest_1.it)('should overwrite existing listener with same key', () => {
            const handler1 = vitest_1.vi.fn();
            const handler2 = vitest_1.vi.fn();
            registry.register('k1', element, 'click', handler1);
            registry.register('k1', element, 'click', handler2);
            (0, vitest_1.expect)(element.removeEventListener).toHaveBeenCalled();
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
            element.dispatchEvent(new dom.window.MouseEvent('click'));
            (0, vitest_1.expect)(handler1).not.toHaveBeenCalled();
            (0, vitest_1.expect)(handler2).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should unregister existing listener with same key before registering new one', () => {
            const listener1 = vitest_1.vi.fn();
            const listener2 = vitest_1.vi.fn();
            registry.register('key1', element, 'click', listener1);
            registry.register('key1', element, 'click', listener2);
            (0, vitest_1.expect)(element.removeEventListener).toHaveBeenCalledWith('click', listener1, undefined);
            (0, vitest_1.expect)(element.addEventListener).toHaveBeenCalledWith('click', listener2, undefined);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
        });
        (0, vitest_1.it)('should not register if disposed', () => {
            registry.dispose();
            const listener = vitest_1.vi.fn();
            registry.register('key1', element, 'click', listener);
            (0, vitest_1.expect)(registry.isRegistered('key1')).toBe(false);
        });
    });
    (0, vitest_1.describe)('Bulk Operations', () => {
        (0, vitest_1.it)('should register multiple listeners', () => {
            const h1 = vitest_1.vi.fn();
            const h2 = vitest_1.vi.fn();
            registry.registerMultiple([
                { key: 'e1', element, type: 'click', listener: h1 },
                { key: 'e2', element, type: 'keydown', listener: h2 },
            ]);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(2);
            (0, vitest_1.expect)(registry.getRegisteredKeys()).toContain('e1');
            (0, vitest_1.expect)(registry.getRegisteredKeys()).toContain('e2');
        });
        (0, vitest_1.it)('should unregister by pattern', () => {
            registry.register('ui:btn1', element, 'click', vitest_1.vi.fn());
            registry.register('ui:btn2', element, 'click', vitest_1.vi.fn());
            registry.register('term:data', element, 'click', vitest_1.vi.fn());
            const removed = registry.unregisterByPattern(/^ui:/);
            (0, vitest_1.expect)(removed).toBe(2);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
            (0, vitest_1.expect)(registry.isRegistered('term:data')).toBe(true);
        });
        (0, vitest_1.it)('should remove all matching listeners', () => {
            registry.register('prefix:key1', element, 'click', vitest_1.vi.fn());
            registry.register('prefix:key2', element, 'click', vitest_1.vi.fn());
            registry.register('other:key1', element, 'click', vitest_1.vi.fn());
            const removed = registry.unregisterByPattern(/^prefix:/);
            (0, vitest_1.expect)(removed).toBe(2);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
            (0, vitest_1.expect)(registry.isRegistered('other:key1')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Scoped Registry', () => {
        (0, vitest_1.it)('should prefix keys in scope', () => {
            const scope = registry.createScope('my-comp');
            const handler = vitest_1.vi.fn();
            scope.register('btn-click', element, 'click', handler);
            (0, vitest_1.expect)(registry.isRegistered('my-comp:btn-click')).toBe(true);
            (0, vitest_1.expect)(scope.isRegistered('btn-click')).toBe(true);
            (0, vitest_1.expect)(scope.getRegisteredKeys()).toEqual(['btn-click']);
            scope.unregister('btn-click');
            (0, vitest_1.expect)(registry.isRegistered('my-comp:btn-click')).toBe(false);
        });
        (0, vitest_1.it)('should create a scoped registry that prefixes keys', () => {
            const scope = registry.createScope('my-scope');
            const listener = vitest_1.vi.fn();
            scope.register('key1', element, 'click', listener);
            (0, vitest_1.expect)(registry.isRegistered('my-scope:key1')).toBe(true);
            (0, vitest_1.expect)(scope.isRegistered('key1')).toBe(true);
            scope.unregister('key1');
            (0, vitest_1.expect)(registry.isRegistered('my-scope:key1')).toBe(false);
        });
        (0, vitest_1.it)('should unregister all in scope', () => {
            const scope = registry.createScope('s1');
            scope.register('k1', element, 'click', vitest_1.vi.fn());
            scope.register('k2', element, 'click', vitest_1.vi.fn());
            registry.register('other', element, 'click', vitest_1.vi.fn());
            const removed = scope.unregisterAll();
            (0, vitest_1.expect)(removed).toBe(2);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
        });
        (0, vitest_1.it)('should allow unregistering all scoped listeners', () => {
            const scope = registry.createScope('my-scope');
            scope.register('key1', element, 'click', vitest_1.vi.fn());
            scope.register('key2', element, 'click', vitest_1.vi.fn());
            registry.register('other:key', element, 'click', vitest_1.vi.fn());
            const removed = scope.unregisterAll();
            (0, vitest_1.expect)(removed).toBe(2);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(1);
        });
    });
    (0, vitest_1.describe)('Stats & Info', () => {
        (0, vitest_1.it)('should provide accurate stats', () => {
            registry.register('k1', element, 'click', vitest_1.vi.fn());
            registry.register('k2', dom.window, 'resize', vitest_1.vi.fn());
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalListeners).toBe(2);
            (0, vitest_1.expect)(stats.eventTypes).toContain('click');
            (0, vitest_1.expect)(stats.eventTypes).toContain('resize');
            (0, vitest_1.expect)(stats.elements).toContain('div#test.test-class');
            (0, vitest_1.expect)(stats.elements).toContain('window');
        });
        (0, vitest_1.it)('should return correct statistics', () => {
            registry.register('key1', element, 'click', vitest_1.vi.fn());
            registry.register('key2', element, 'keydown', vitest_1.vi.fn());
            const stats = registry.getStats();
            (0, vitest_1.expect)(stats.totalListeners).toBe(2);
            (0, vitest_1.expect)(stats.eventTypes).toContain('click');
            (0, vitest_1.expect)(stats.eventTypes).toContain('keydown');
        });
        (0, vitest_1.it)('should return null for non-existent listener info', () => {
            (0, vitest_1.expect)(registry.getListenerInfo('ghost')).toBeNull();
        });
    });
    (0, vitest_1.describe)('Lifecycle', () => {
        (0, vitest_1.it)('should remove all listeners on dispose', () => {
            const h1 = vitest_1.vi.fn();
            const removeSpy = vitest_1.vi.spyOn(element, 'removeEventListener');
            registry.register('k1', element, 'click', h1);
            registry.dispose();
            (0, vitest_1.expect)(removeSpy).toHaveBeenCalled();
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(0);
        });
        (0, vitest_1.it)('should unregister all listeners', () => {
            registry.register('key1', element, 'click', vitest_1.vi.fn());
            registry.register('key2', element, 'click', vitest_1.vi.fn());
            registry.dispose();
            (0, vitest_1.expect)(element.removeEventListener).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(0);
        });
        (0, vitest_1.it)('should reject registration after dispose', () => {
            registry.dispose();
            registry.register('k1', element, 'click', vitest_1.vi.fn());
            (0, vitest_1.expect)(registry.getRegisteredCount()).toBe(0);
        });
    });
});
//# sourceMappingURL=EventHandlerRegistry.test.js.map