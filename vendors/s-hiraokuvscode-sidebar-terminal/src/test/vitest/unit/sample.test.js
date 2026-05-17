'use strict';
/**
 * Sample test to verify Vitest setup
 */
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const vscode = require('vscode');
(0, vitest_1.describe)('Vitest Setup Verification', () => {
  (0, vitest_1.describe)('Basic Assertions', () => {
    (0, vitest_1.it)('should pass basic equality checks', () => {
      (0, vitest_1.expect)(1 + 1).toBe(2);
      (0, vitest_1.expect)('hello').toBe('hello');
      (0, vitest_1.expect)({ a: 1 }).toEqual({ a: 1 });
    });
    (0, vitest_1.it)('should support async/await', async () => {
      const result = await Promise.resolve(42);
      (0, vitest_1.expect)(result).toBe(42);
    });
    (0, vitest_1.it)('should support array matchers', () => {
      const arr = [1, 2, 3];
      (0, vitest_1.expect)(arr).toContain(2);
      (0, vitest_1.expect)(arr).toHaveLength(3);
    });
  });
  (0, vitest_1.describe)('Mock Functions', () => {
    (0, vitest_1.it)('should create mock functions', () => {
      const mockFn = vitest_1.vi.fn();
      mockFn('arg1', 'arg2');
      (0, vitest_1.expect)(mockFn).toHaveBeenCalled();
      (0, vitest_1.expect)(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      (0, vitest_1.expect)(mockFn).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('should support mock return values', async () => {
      const mockFn = vitest_1.vi.fn().mockReturnValue(42);
      (0, vitest_1.expect)(mockFn()).toBe(42);
      const asyncMock = vitest_1.vi.fn().mockResolvedValue('async result');
      await (0, vitest_1.expect)(asyncMock()).resolves.toBe('async result');
    });
    (0, vitest_1.it)('should support mock implementations', () => {
      const mockFn = vitest_1.vi.fn((a, b) => a + b);
      (0, vitest_1.expect)(mockFn(2, 3)).toBe(5);
    });
  });
  (0, vitest_1.describe)('VS Code Mock', () => {
    (0, vitest_1.it)('should have workspace mock', () => {
      (0, vitest_1.expect)(vscode.workspace).toBeDefined();
      (0, vitest_1.expect)(vscode.workspace.getConfiguration).toBeDefined();
    });
    (0, vitest_1.it)('should have window mock', () => {
      (0, vitest_1.expect)(vscode.window).toBeDefined();
      (0, vitest_1.expect)(vscode.window.showInformationMessage).toBeDefined();
    });
    (0, vitest_1.it)('should have commands mock', () => {
      (0, vitest_1.expect)(vscode.commands).toBeDefined();
      (0, vitest_1.expect)(vscode.commands.registerCommand).toBeDefined();
    });
    (0, vitest_1.it)('should have Uri class', () => {
      const uri = vscode.Uri.file('/test/path');
      (0, vitest_1.expect)(uri.scheme).toBe('file');
      (0, vitest_1.expect)(uri.path).toBe('/test/path');
    });
    (0, vitest_1.it)('should have EventEmitter class', () => {
      const emitter = new vscode.EventEmitter();
      const listener = vitest_1.vi.fn();
      emitter.event(listener);
      emitter.fire('test');
      (0, vitest_1.expect)(listener).toHaveBeenCalledWith('test');
    });
    (0, vitest_1.it)('should have Disposable class', () => {
      const disposeFn = vitest_1.vi.fn();
      const disposable = new vscode.Disposable(disposeFn);
      disposable.dispose();
      (0, vitest_1.expect)(disposeFn).toHaveBeenCalled();
    });
  });
  (0, vitest_1.describe)('Browser API Mocks', () => {
    (0, vitest_1.it)('should have performance API', () => {
      (0, vitest_1.expect)(performance).toBeDefined();
      (0, vitest_1.expect)(performance.now).toBeDefined();
      (0, vitest_1.expect)(typeof performance.now()).toBe('number');
    });
    (0, vitest_1.it)('should have ResizeObserver', () => {
      (0, vitest_1.expect)(ResizeObserver).toBeDefined();
      const callback = vitest_1.vi.fn();
      const observer = new ResizeObserver(callback);
      const element = document.createElement('div');
      observer.observe(element);
      observer.disconnect();
    });
    (0, vitest_1.it)('should have MessageEvent', () => {
      (0, vitest_1.expect)(MessageEvent).toBeDefined();
      const event = new MessageEvent('message', {
        data: { test: 'data' },
        origin: 'http://localhost',
      });
      (0, vitest_1.expect)(event.data).toEqual({ test: 'data' });
      (0, vitest_1.expect)(event.origin).toBe('http://localhost');
    });
    (0, vitest_1.it)('should have CustomEvent', () => {
      (0, vitest_1.expect)(CustomEvent).toBeDefined();
      const event = new CustomEvent('custom', {
        detail: { custom: 'detail' },
      });
      (0, vitest_1.expect)(event.detail).toEqual({ custom: 'detail' });
    });
    (0, vitest_1.it)('should have requestAnimationFrame', () => {
      (0, vitest_1.expect)(requestAnimationFrame).toBeDefined();
      (0, vitest_1.expect)(cancelAnimationFrame).toBeDefined();
      const callback = vitest_1.vi.fn();
      const id = requestAnimationFrame(callback);
      cancelAnimationFrame(id);
    });
  });
  (0, vitest_1.describe)('DOM Operations', () => {
    let container;
    (0, vitest_1.beforeEach)(() => {
      container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
    });
    (0, vitest_1.afterEach)(() => {
      container.remove();
    });
    (0, vitest_1.it)('should create and manipulate DOM elements', () => {
      const element = document.createElement('span');
      element.textContent = 'Hello';
      element.className = 'test-class';
      container.appendChild(element);
      (0, vitest_1.expect)(container.querySelector('.test-class')).toBe(element);
      (0, vitest_1.expect)(element.textContent).toBe('Hello');
    });
    (0, vitest_1.it)('should handle events', () => {
      const button = document.createElement('button');
      const clickHandler = vitest_1.vi.fn();
      button.addEventListener('click', clickHandler);
      container.appendChild(button);
      button.click();
      (0, vitest_1.expect)(clickHandler).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle classList operations', () => {
      const element = document.createElement('div');
      element.classList.add('class1', 'class2');
      (0, vitest_1.expect)(element.classList.contains('class1')).toBe(true);
      (0, vitest_1.expect)(element.classList.contains('class2')).toBe(true);
      element.classList.remove('class1');
      (0, vitest_1.expect)(element.classList.contains('class1')).toBe(false);
      element.classList.toggle('class3');
      (0, vitest_1.expect)(element.classList.contains('class3')).toBe(true);
    });
  });
  (0, vitest_1.describe)('Lifecycle Hooks', () => {
    let setupValue;
    (0, vitest_1.beforeEach)(() => {
      setupValue = 'initialized';
    });
    (0, vitest_1.afterEach)(() => {
      setupValue = '';
    });
    (0, vitest_1.it)('should run beforeEach hook', () => {
      (0, vitest_1.expect)(setupValue).toBe('initialized');
    });
    (0, vitest_1.it)('should isolate test state', () => {
      setupValue = 'modified';
      (0, vitest_1.expect)(setupValue).toBe('modified');
    });
    (0, vitest_1.it)('should reset state between tests', () => {
      (0, vitest_1.expect)(setupValue).toBe('initialized');
    });
  });
});
//# sourceMappingURL=sample.test.js.map
