'use strict';
/**
 * Test utilities module
 *
 * Exports all test base classes and helper utilities
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.expect =
  exports.TerminalTest =
  exports.WebViewTest =
  exports.AsyncTest =
  exports.ConfigurationTest =
  exports.BaseTest =
    void 0;
// Base test classes
var BaseTest_1 = require('./BaseTest');
Object.defineProperty(exports, 'BaseTest', {
  enumerable: true,
  get: function () {
    return BaseTest_1.BaseTest;
  },
});
var ConfigurationTest_1 = require('./ConfigurationTest');
Object.defineProperty(exports, 'ConfigurationTest', {
  enumerable: true,
  get: function () {
    return ConfigurationTest_1.ConfigurationTest;
  },
});
var AsyncTest_1 = require('./AsyncTest');
Object.defineProperty(exports, 'AsyncTest', {
  enumerable: true,
  get: function () {
    return AsyncTest_1.AsyncTest;
  },
});
var WebViewTest_1 = require('./WebViewTest');
Object.defineProperty(exports, 'WebViewTest', {
  enumerable: true,
  get: function () {
    return WebViewTest_1.WebViewTest;
  },
});
var TerminalTest_1 = require('./TerminalTest');
Object.defineProperty(exports, 'TerminalTest', {
  enumerable: true,
  get: function () {
    return TerminalTest_1.TerminalTest;
  },
});
// Helper utilities
__exportStar(require('./test-helpers'), exports);
// Re-export commonly used test dependencies
// Note: For vitest tests, import { expect } from 'vitest' directly
var chai_1 = require('chai'); // Legacy: used by Mocha-based tests only
Object.defineProperty(exports, 'expect', {
  enumerable: true,
  get: function () {
    return chai_1.expect;
  },
});
//# sourceMappingURL=index.js.map
