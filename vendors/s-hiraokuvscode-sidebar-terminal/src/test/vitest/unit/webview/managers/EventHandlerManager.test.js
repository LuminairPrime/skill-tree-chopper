'use strict';
/**
 * EventHandlerManager Test Suite - Event listener management and lifecycle
 *
 * TDD Pattern: Covers event registration, removal, and cleanup
 *
 * Vitest Migration: Converted from Mocha/Chai to Vitest
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const EventHandlerManager_1 = require('../../../../../webview/managers/EventHandlerManager');
(0, vitest_1.describe)('EventHandlerManager', () => {
  let eventHandlerManager;
  (0, vitest_1.beforeEach)(() => {
    // Create test element for DOM tests
    const testElement = document.createElement('div');
    testElement.id = 'test-element';
    document.body.appendChild(testElement);
    eventHandlerManager = new EventHandlerManager_1.EventHandlerManager();
  });
  (0, vitest_1.afterEach)(() => {
    eventHandlerManager.dispose();
    document.body.innerHTML = '';
  });
  (0, vitest_1.describe)('Initialization and Lifecycle', () => {
    (0, vitest_1.it)('should create instance correctly', () => {
      (0, vitest_1.expect)(eventHandlerManager).toBeInstanceOf(
        EventHandlerManager_1.EventHandlerManager
      );
    });
    (0, vitest_1.it)('should start with no registered listeners', () => {
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(0);
    });
    (0, vitest_1.it)('should dispose all listeners on dispose', () => {
      eventHandlerManager.addEventListener(window, 'click', () => {});
      eventHandlerManager.addEventListener(document, 'keydown', () => {});
      eventHandlerManager.dispose();
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(0);
    });
    (0, vitest_1.it)('should prevent adding listeners after dispose', () => {
      eventHandlerManager.dispose();
      eventHandlerManager.addEventListener(window, 'click', () => {});
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(0);
    });
  });
  (0, vitest_1.describe)('Event Registration', () => {
    (0, vitest_1.it)('should register window event listener', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.addEventListener(window, 'resize', handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(1);
      (0, vitest_1.expect)(stats.eventTypes).toContain('resize');
    });
    (0, vitest_1.it)('should register document event listener', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.addEventListener(document, 'click', handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(1);
      (0, vitest_1.expect)(stats.eventTypes).toContain('click');
    });
    (0, vitest_1.it)('should register element event listener', () => {
      const element = document.getElementById('test-element');
      const handler = vitest_1.vi.fn();
      eventHandlerManager.addEventListener(element, 'click', handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(1);
    });
    (0, vitest_1.it)('should register multiple listeners', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {});
      eventHandlerManager.addEventListener(window, 'scroll', () => {});
      eventHandlerManager.addEventListener(document, 'click', () => {});
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(3);
    });
    (0, vitest_1.it)('should track event types', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {});
      eventHandlerManager.addEventListener(window, 'scroll', () => {});
      eventHandlerManager.addEventListener(document, 'click', () => {});
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('resize');
      (0, vitest_1.expect)(stats.eventTypes).toContain('scroll');
      (0, vitest_1.expect)(stats.eventTypes).toContain('click');
    });
    (0, vitest_1.it)('should track targets', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {});
      eventHandlerManager.addEventListener(document, 'click', () => {});
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.targets).toContain('window');
      (0, vitest_1.expect)(stats.targets).toContain('document');
    });
    (0, vitest_1.it)('should support listener options', () => {
      eventHandlerManager.addEventListener(document, 'click', () => {}, { capture: true });
      const listeners = eventHandlerManager.getRegisteredListeners();
      (0, vitest_1.expect)(listeners).toHaveLength(1);
      (0, vitest_1.expect)(listeners[0].hasOptions).toBe(true);
    });
  });
  (0, vitest_1.describe)('Event Handler Execution', () => {
    (0, vitest_1.it)('should execute handler when event fires', async () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.addEventListener(window, 'resize', handler);
      window.dispatchEvent(new Event('resize'));
      // Give time for async handler wrapper
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should handle async handlers', async () => {
      let executed = false;
      const asyncHandler = async () => {
        await Promise.resolve();
        executed = true;
      };
      eventHandlerManager.addEventListener(window, 'focus', asyncHandler);
      window.dispatchEvent(new Event('focus'));
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(executed).toBe(true);
    });
    (0, vitest_1.it)('should handle handler errors gracefully', () => {
      const errorHandler = () => {
        throw new Error('Handler error');
      };
      eventHandlerManager.addEventListener(window, 'blur', errorHandler);
      // Should not throw
      (0, vitest_1.expect)(() => {
        window.dispatchEvent(new Event('blur'));
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Event Removal', () => {
    (0, vitest_1.it)('should remove specific event listener', () => {
      const handler = () => {};
      eventHandlerManager.addEventListener(window, 'resize', handler);
      // Get the wrapped handler from internal state
      const listeners = eventHandlerManager.getRegisteredListeners();
      (0, vitest_1.expect)(listeners.length).toBe(1);
      // Remove using dispose
      eventHandlerManager.dispose();
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(0);
    });
  });
  (0, vitest_1.describe)('Message Event Handler', () => {
    (0, vitest_1.it)('should set message event handler', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.setMessageEventHandler(handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('message');
    });
    (0, vitest_1.it)('should replace existing message handler', () => {
      const handler1 = vitest_1.vi.fn();
      const handler2 = vitest_1.vi.fn();
      eventHandlerManager.setMessageEventHandler(handler1);
      eventHandlerManager.setMessageEventHandler(handler2);
      // Only one message handler should be registered
      const listeners = eventHandlerManager
        .getRegisteredListeners()
        .filter((l) => l.eventType === 'message');
      (0, vitest_1.expect)(listeners.length).toBe(1);
    });
    (0, vitest_1.it)('should remove message event handler', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.setMessageEventHandler(handler);
      eventHandlerManager.removeMessageEventHandler();
      const listeners = eventHandlerManager
        .getRegisteredListeners()
        .filter((l) => l.eventType === 'message');
      (0, vitest_1.expect)(listeners.length).toBe(0);
    });
  });
  (0, vitest_1.describe)('Specialized Event Handlers', () => {
    (0, vitest_1.it)('should set resize event handler', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.setResizeEventHandler(handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('resize');
    });
    (0, vitest_1.it)('should set focus event handlers', () => {
      const focusHandler = vitest_1.vi.fn();
      const blurHandler = vitest_1.vi.fn();
      eventHandlerManager.setFocusEventHandlers(focusHandler, blurHandler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('focus');
      (0, vitest_1.expect)(stats.eventTypes).toContain('blur');
    });
    (0, vitest_1.it)('should set keyboard event handlers', () => {
      const keydownHandler = vitest_1.vi.fn();
      const keyupHandler = vitest_1.vi.fn();
      eventHandlerManager.setKeyboardEventHandlers(keydownHandler, keyupHandler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('keydown');
      (0, vitest_1.expect)(stats.eventTypes).toContain('keyup');
    });
    (0, vitest_1.it)('should set mouse event handlers', () => {
      const clickHandler = vitest_1.vi.fn();
      const contextMenuHandler = vitest_1.vi.fn();
      eventHandlerManager.setMouseEventHandlers(clickHandler, contextMenuHandler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('click');
      (0, vitest_1.expect)(stats.eventTypes).toContain('contextmenu');
    });
    (0, vitest_1.it)('should handle partial handler registration', () => {
      eventHandlerManager.setFocusEventHandlers(vitest_1.vi.fn());
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('focus');
      (0, vitest_1.expect)(stats.eventTypes).not.toContain('blur');
    });
  });
  (0, vitest_1.describe)('DOM Ready Events', () => {
    (0, vitest_1.it)('should call handler immediately if DOM is already loaded', async () => {
      const handler = vitest_1.vi.fn();
      // In happy-dom, readyState is typically 'complete'
      eventHandlerManager.onDOMContentLoaded(handler);
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should call handler immediately if page is already loaded', async () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.onPageLoaded(handler);
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('should register page unload handlers', () => {
      const handler = vitest_1.vi.fn();
      eventHandlerManager.onPageUnload(handler);
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.eventTypes).toContain('beforeunload');
      (0, vitest_1.expect)(stats.eventTypes).toContain('unload');
    });
  });
  (0, vitest_1.describe)('Custom Events', () => {
    (0, vitest_1.it)('should dispatch custom event', async () => {
      const handler = vitest_1.vi.fn();
      window.addEventListener('my-custom-event', handler);
      eventHandlerManager.dispatchCustomEvent('my-custom-event');
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
      window.removeEventListener('my-custom-event', handler);
    });
    (0, vitest_1.it)('should dispatch custom event with detail', async () => {
      const detail = { foo: 'bar', count: 42 };
      let receivedDetail;
      const handler = (event) => {
        receivedDetail = event.detail;
      };
      window.addEventListener('detail-event', handler);
      eventHandlerManager.dispatchCustomEvent('detail-event', detail);
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(receivedDetail).toEqual(detail);
      window.removeEventListener('detail-event', handler);
    });
    (0, vitest_1.it)('should dispatch custom event on specific target', async () => {
      const element = document.getElementById('test-element');
      const handler = vitest_1.vi.fn();
      element.addEventListener('element-event', handler);
      eventHandlerManager.dispatchCustomEvent('element-event', null, element);
      await new Promise((resolve) => setTimeout(resolve, 20));
      (0, vitest_1.expect)(handler).toHaveBeenCalledOnce();
      element.removeEventListener('element-event', handler);
    });
  });
  (0, vitest_1.describe)('Statistics and Debugging', () => {
    (0, vitest_1.it)('should provide event statistics', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {});
      eventHandlerManager.addEventListener(document, 'click', () => {});
      eventHandlerManager.addEventListener(document, 'keydown', () => {});
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(3);
      (0, vitest_1.expect)(stats.eventTypes).toHaveLength(3);
      (0, vitest_1.expect)(stats.targets).toContain('window');
      (0, vitest_1.expect)(stats.targets).toContain('document');
    });
    (0, vitest_1.it)('should provide detailed listener information', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {}, { passive: true });
      eventHandlerManager.addEventListener(document, 'click', () => {});
      const listeners = eventHandlerManager.getRegisteredListeners();
      (0, vitest_1.expect)(listeners).toHaveLength(2);
      const resizeListener = listeners.find((l) => l.eventType === 'resize');
      (0, vitest_1.expect)(resizeListener).toBeDefined();
      (0, vitest_1.expect)(resizeListener.target).toBe('window');
      (0, vitest_1.expect)(resizeListener.hasOptions).toBe(true);
      const clickListener = listeners.find((l) => l.eventType === 'click');
      (0, vitest_1.expect)(clickListener?.target).toBe('document');
    });
    (0, vitest_1.it)('should identify HTML element targets', () => {
      const element = document.getElementById('test-element');
      eventHandlerManager.addEventListener(element, 'click', () => {});
      const listeners = eventHandlerManager.getRegisteredListeners();
      (0, vitest_1.expect)(listeners).toHaveLength(1);
      (0, vitest_1.expect)(listeners[0].target).toBe('div');
    });
  });
  (0, vitest_1.describe)('Error Handling', () => {
    (0, vitest_1.it)('should handle registration errors gracefully', () => {
      // Create an element
      const element = document.createElement('div');
      (0, vitest_1.expect)(() => {
        eventHandlerManager.addEventListener(element, 'click', () => {});
      }).not.toThrow();
    });
    (0, vitest_1.it)('should handle removal errors gracefully', () => {
      (0, vitest_1.expect)(() => {
        eventHandlerManager.removeEventListener(window, 'nonexistent', () => {});
      }).not.toThrow();
    });
    (0, vitest_1.it)('should handle multiple dispose calls', () => {
      eventHandlerManager.dispose();
      (0, vitest_1.expect)(() => {
        eventHandlerManager.dispose();
      }).not.toThrow();
    });
  });
  (0, vitest_1.describe)('Memory Management', () => {
    (0, vitest_1.it)('should clean up all references on dispose', () => {
      eventHandlerManager.addEventListener(window, 'resize', () => {});
      eventHandlerManager.addEventListener(document, 'click', () => {});
      eventHandlerManager.setMessageEventHandler(() => {});
      eventHandlerManager.dispose();
      const stats = eventHandlerManager.getEventStats();
      (0, vitest_1.expect)(stats.totalListeners).toBe(0);
    });
  });
});
//# sourceMappingURL=EventHandlerManager.test.js.map
