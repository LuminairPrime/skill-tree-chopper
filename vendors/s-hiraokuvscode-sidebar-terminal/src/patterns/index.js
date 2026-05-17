'use strict';
/**
 * Design Patterns
 *
 * This module exports reusable design pattern implementations
 * for consistent code structure across the extension.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.withLazyInitialization =
  exports.InitializationError =
  exports.InitializationState =
  exports.LazyInitializable =
  exports.toDisposable =
  exports.DisposableCallback =
  exports.DisposableBase =
  exports.Singleton =
    void 0;
var Singleton_1 = require('./Singleton');
Object.defineProperty(exports, 'Singleton', {
  enumerable: true,
  get: function () {
    return Singleton_1.Singleton;
  },
});
var DisposableBase_1 = require('./DisposableBase');
Object.defineProperty(exports, 'DisposableBase', {
  enumerable: true,
  get: function () {
    return DisposableBase_1.DisposableBase;
  },
});
Object.defineProperty(exports, 'DisposableCallback', {
  enumerable: true,
  get: function () {
    return DisposableBase_1.DisposableCallback;
  },
});
Object.defineProperty(exports, 'toDisposable', {
  enumerable: true,
  get: function () {
    return DisposableBase_1.toDisposable;
  },
});
var LazyInitializable_1 = require('./LazyInitializable');
Object.defineProperty(exports, 'LazyInitializable', {
  enumerable: true,
  get: function () {
    return LazyInitializable_1.LazyInitializable;
  },
});
Object.defineProperty(exports, 'InitializationState', {
  enumerable: true,
  get: function () {
    return LazyInitializable_1.InitializationState;
  },
});
Object.defineProperty(exports, 'InitializationError', {
  enumerable: true,
  get: function () {
    return LazyInitializable_1.InitializationError;
  },
});
Object.defineProperty(exports, 'withLazyInitialization', {
  enumerable: true,
  get: function () {
    return LazyInitializable_1.withLazyInitialization;
  },
});
//# sourceMappingURL=index.js.map
