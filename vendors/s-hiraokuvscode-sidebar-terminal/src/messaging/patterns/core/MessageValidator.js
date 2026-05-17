'use strict';
/**
 * Message Validator
 *
 * Centralized validation logic for all message types.
 * Consolidates validation patterns from:
 * - MessageRouter.validateMessageData
 * - BaseMessageHandler validation methods
 * - Inline validation across multiple files
 *
 * Related to: GitHub Issue #219
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DEFAULT_VALIDATION_RULES =
  exports.MessageValidator =
  exports.MessageValidationError =
    void 0;
exports.createMessageValidator = createMessageValidator;
/**
 * Validation error with details
 */
class MessageValidationError extends Error {
  constructor(message, field, command) {
    super(message);
    this.field = field;
    this.command = command;
    this.name = 'MessageValidationError';
  }
}
exports.MessageValidationError = MessageValidationError;
/**
 * Centralized message validator
 */
class MessageValidator {
  constructor() {
    this.rules = new Map();
  }
  /**
   * Register validation rules for a command
   */
  registerRule(command, rule) {
    this.rules.set(command, rule);
  }
  /**
   * Register multiple validation rules
   */
  registerRules(rules) {
    for (const [command, rule] of Object.entries(rules)) {
      this.registerRule(command, rule);
    }
  }
  /**
   * Validate a message
   * @throws MessageValidationError if validation fails
   */
  validate(message) {
    const result = this.validateMessage(message);
    if (!result.valid) {
      throw new MessageValidationError(result.errors.join('; '), undefined, message.command);
    }
  }
  /**
   * Validate a message and return result without throwing
   */
  validateMessage(message) {
    const errors = [];
    // Basic structure validation
    if (!message || typeof message !== 'object') {
      errors.push('Message must be an object');
      return { valid: false, errors };
    }
    if (!message.command || typeof message.command !== 'string') {
      errors.push('Message must have a command string');
      return { valid: false, errors };
    }
    // Command-specific validation
    const rule = this.rules.get(message.command);
    if (rule) {
      this.validateWithRule(message, rule, errors);
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  /**
   * Validate required fields
   */
  validateRequired(message, fields) {
    for (const field of fields) {
      if (!(field in message) || message[field] === undefined) {
        throw new MessageValidationError(
          `Missing required field: ${field}`,
          field,
          message.command
        );
      }
    }
  }
  /**
   * Validate field type
   */
  validateType(value, expectedType, fieldName) {
    const actualType = typeof value;
    // Special handling for arrays
    if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        throw new MessageValidationError(
          `Field '${fieldName}' must be an array, got ${actualType}`
        );
      }
      return true;
    }
    if (actualType !== expectedType) {
      throw new MessageValidationError(
        `Field '${fieldName}' must be of type ${expectedType}, got ${actualType}`
      );
    }
    return true;
  }
  /**
   * Validate message has terminal ID
   */
  hasTerminalId(message) {
    return typeof message.terminalId === 'string' && message.terminalId.length > 0;
  }
  /**
   * Validate message has resize parameters
   */
  hasResizeParams(message) {
    const { cols, rows } = message;
    return typeof cols === 'number' && typeof rows === 'number' && cols > 0 && rows > 0;
  }
  /**
   * Validate message has input data
   */
  hasInputData(message) {
    return typeof message.data === 'string';
  }
  /**
   * Validate message has settings
   */
  hasSettings(message) {
    return message.settings !== undefined && typeof message.settings === 'object';
  }
  /**
   * Validate with rule
   */
  validateWithRule(message, rule, errors) {
    // Check required fields
    if (rule.required) {
      for (const field of rule.required) {
        if (!(field in message) || message[field] === undefined) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    // Check field types
    if (rule.types) {
      for (const [field, expectedType] of Object.entries(rule.types)) {
        if (field in message) {
          const value = message[field];
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== expectedType) {
            errors.push(`Field '${field}' must be of type ${expectedType}, got ${actualType}`);
          }
        }
      }
    }
    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(message);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (customResult === false) {
        errors.push('Custom validation failed');
      }
    }
  }
}
exports.MessageValidator = MessageValidator;
/**
 * Default validation rules for common message types
 */
exports.DEFAULT_VALIDATION_RULES = {
  input: {
    required: ['data'],
    types: { data: 'string', terminalId: 'string' },
  },
  resize: {
    required: ['cols', 'rows'],
    types: { cols: 'number', rows: 'number', terminalId: 'string' },
    custom: (msg) => {
      const { cols, rows } = msg;
      if (cols <= 0 || rows <= 0) {
        return 'Resize dimensions must be positive';
      }
      return true;
    },
  },
  createTerminal: {
    types: { name: 'string', cwd: 'string' },
  },
  deleteTerminal: {
    required: ['terminalId'],
    types: { terminalId: 'string', requestSource: 'string' },
  },
  killTerminal: {
    types: { terminalId: 'string' },
  },
  output: {
    required: ['data', 'terminalId'],
    types: { data: 'string', terminalId: 'string' },
  },
  setActiveTerminal: {
    required: ['terminalId'],
    types: { terminalId: 'string' },
  },
  focusTerminal: {
    required: ['terminalId'],
    types: { terminalId: 'string' },
  },
  cliAgentStatusUpdate: {
    required: ['status'],
    types: { status: 'object', terminalId: 'string' },
  },
  sessionRestore: {
    required: ['terminals'],
    types: { terminals: 'array', activeTerminalId: 'string' },
  },
};
/**
 * Create a configured message validator instance
 */
function createMessageValidator() {
  const validator = new MessageValidator();
  validator.registerRules(exports.DEFAULT_VALIDATION_RULES);
  return validator;
}
//# sourceMappingURL=MessageValidator.js.map
