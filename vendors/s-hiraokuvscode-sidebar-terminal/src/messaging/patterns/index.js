'use strict';
/**
 * Message Handling Patterns - Public API
 *
 * Unified message handling system implementing Command and Chain of Responsibility patterns.
 * This consolidates and replaces:
 * - ConsolidatedMessageManager
 * - SecondaryTerminalMessageRouter
 * - MessageRouter
 * - UnifiedMessageDispatcher
 * - ConsolidatedMessageService
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.SettingsCommandHandler =
  exports.SessionCommandHandler =
  exports.TerminalCommandHandler =
  exports.createMessageProcessor =
  exports.MessageProcessor =
  exports.MessageHandlerRegistry =
  exports.messageLogger =
  exports.createMessageLogger =
  exports.LogLevel =
  exports.ChildMessageLogger =
  exports.MessageLogger =
  exports.createMessageValidator =
  exports.DEFAULT_VALIDATION_RULES =
  exports.MessageValidationError =
  exports.MessageValidator =
  exports.BaseCommandHandler =
    void 0;
// Core interfaces and base classes
var IMessageHandler_1 = require('./core/IMessageHandler');
Object.defineProperty(exports, 'BaseCommandHandler', {
  enumerable: true,
  get: function () {
    return IMessageHandler_1.BaseCommandHandler;
  },
});
// Message validation
var MessageValidator_1 = require('./core/MessageValidator');
Object.defineProperty(exports, 'MessageValidator', {
  enumerable: true,
  get: function () {
    return MessageValidator_1.MessageValidator;
  },
});
Object.defineProperty(exports, 'MessageValidationError', {
  enumerable: true,
  get: function () {
    return MessageValidator_1.MessageValidationError;
  },
});
Object.defineProperty(exports, 'DEFAULT_VALIDATION_RULES', {
  enumerable: true,
  get: function () {
    return MessageValidator_1.DEFAULT_VALIDATION_RULES;
  },
});
Object.defineProperty(exports, 'createMessageValidator', {
  enumerable: true,
  get: function () {
    return MessageValidator_1.createMessageValidator;
  },
});
// Message logging
var MessageLogger_1 = require('./core/MessageLogger');
Object.defineProperty(exports, 'MessageLogger', {
  enumerable: true,
  get: function () {
    return MessageLogger_1.MessageLogger;
  },
});
Object.defineProperty(exports, 'ChildMessageLogger', {
  enumerable: true,
  get: function () {
    return MessageLogger_1.ChildMessageLogger;
  },
});
Object.defineProperty(exports, 'LogLevel', {
  enumerable: true,
  get: function () {
    return MessageLogger_1.LogLevel;
  },
});
Object.defineProperty(exports, 'createMessageLogger', {
  enumerable: true,
  get: function () {
    return MessageLogger_1.createMessageLogger;
  },
});
Object.defineProperty(exports, 'messageLogger', {
  enumerable: true,
  get: function () {
    return MessageLogger_1.messageLogger;
  },
});
// Message handler registry
var MessageHandlerRegistry_1 = require('./core/MessageHandlerRegistry');
Object.defineProperty(exports, 'MessageHandlerRegistry', {
  enumerable: true,
  get: function () {
    return MessageHandlerRegistry_1.MessageHandlerRegistry;
  },
});
// Message processor facade
var MessageProcessor_1 = require('./core/MessageProcessor');
Object.defineProperty(exports, 'MessageProcessor', {
  enumerable: true,
  get: function () {
    return MessageProcessor_1.MessageProcessor;
  },
});
Object.defineProperty(exports, 'createMessageProcessor', {
  enumerable: true,
  get: function () {
    return MessageProcessor_1.createMessageProcessor;
  },
});
// Specialized handlers
var TerminalCommandHandler_1 = require('./handlers/TerminalCommandHandler');
Object.defineProperty(exports, 'TerminalCommandHandler', {
  enumerable: true,
  get: function () {
    return TerminalCommandHandler_1.TerminalCommandHandler;
  },
});
var SessionCommandHandler_1 = require('./handlers/SessionCommandHandler');
Object.defineProperty(exports, 'SessionCommandHandler', {
  enumerable: true,
  get: function () {
    return SessionCommandHandler_1.SessionCommandHandler;
  },
});
var SettingsCommandHandler_1 = require('./handlers/SettingsCommandHandler');
Object.defineProperty(exports, 'SettingsCommandHandler', {
  enumerable: true,
  get: function () {
    return SettingsCommandHandler_1.SettingsCommandHandler;
  },
});
//# sourceMappingURL=index.js.map
