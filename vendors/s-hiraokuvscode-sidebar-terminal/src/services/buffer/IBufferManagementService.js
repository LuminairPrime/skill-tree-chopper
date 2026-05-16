"use strict";
/**
 * Buffer Management Service Interface
 *
 * Manages terminal output buffering and flushing strategies for optimal performance.
 * Provides adaptive buffering based on CLI agent detection and output patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBufferManagementService = void 0;
/**
 * Service token for dependency injection
 */
const DIContainer_1 = require("../../core/DIContainer");
exports.IBufferManagementService = (0, DIContainer_1.createServiceToken)('IBufferManagementService');
//# sourceMappingURL=IBufferManagementService.js.map