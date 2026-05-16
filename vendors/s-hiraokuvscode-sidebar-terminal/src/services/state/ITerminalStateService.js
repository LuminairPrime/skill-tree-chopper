"use strict";
/**
 * Terminal State Service Interface
 *
 * Manages terminal lifecycle states and metadata.
 * Responsible for tracking terminal registration, process states, and active terminal management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITerminalStateService = void 0;
/**
 * Service token for dependency injection
 */
const DIContainer_1 = require("../../core/DIContainer");
exports.ITerminalStateService = (0, DIContainer_1.createServiceToken)('ITerminalStateService');
//# sourceMappingURL=ITerminalStateService.js.map