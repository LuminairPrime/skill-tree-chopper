"use strict";
/**
 * Communication Layer - Public API
 *
 * Exports all public interfaces, protocols, and DTOs for the Communication Layer.
 * This layer provides clean separation between Extension and WebView layers.
 *
 * @see Issue #223 - Clean Architecture Refactoring
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Protocols
__exportStar(require("./protocols/MessageProtocol"), exports);
// DTOs
__exportStar(require("./dto/TerminalDTO"), exports);
__exportStar(require("./dto/SettingsDTO"), exports);
__exportStar(require("./dto/SessionDTO"), exports);
// Interfaces
__exportStar(require("./interfaces/ICommunicationBridge"), exports);
__exportStar(require("./interfaces/IPersistencePort"), exports);
//# sourceMappingURL=index.js.map