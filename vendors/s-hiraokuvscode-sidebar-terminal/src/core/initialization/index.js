"use strict";
/**
 * Core Initialization Module
 *
 * Exports Template Method pattern base classes for WebView initialization.
 * These classes consolidate ~200-250 lines of duplicated initialization logic.
 *
 * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/218
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerCoordinatorBase = exports.MessageHandlerRegistryBase = exports.WebViewInitializationTemplate = void 0;
// Base classes
var WebViewInitializationTemplate_1 = require("./WebViewInitializationTemplate");
Object.defineProperty(exports, "WebViewInitializationTemplate", { enumerable: true, get: function () { return WebViewInitializationTemplate_1.WebViewInitializationTemplate; } });
var MessageHandlerRegistryBase_1 = require("./MessageHandlerRegistryBase");
Object.defineProperty(exports, "MessageHandlerRegistryBase", { enumerable: true, get: function () { return MessageHandlerRegistryBase_1.MessageHandlerRegistryBase; } });
var ManagerCoordinatorBase_1 = require("./ManagerCoordinatorBase");
Object.defineProperty(exports, "ManagerCoordinatorBase", { enumerable: true, get: function () { return ManagerCoordinatorBase_1.ManagerCoordinatorBase; } });
//# sourceMappingURL=index.js.map