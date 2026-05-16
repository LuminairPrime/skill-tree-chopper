"use strict";
/**
 * Interface definitions for the Unified Configuration Service
 *
 * These interfaces define the contract for configuration management
 * following VS Code's established patterns and ensure type safety
 * across the entire configuration system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationTarget = void 0;
/**
 * Configuration target enumeration
 * Matches VS Code's configuration hierarchy
 */
var ConfigurationTarget;
(function (ConfigurationTarget) {
    ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 0] = "DEFAULT";
    ConfigurationTarget[ConfigurationTarget["APPLICATION"] = 1] = "APPLICATION";
    ConfigurationTarget[ConfigurationTarget["USER"] = 2] = "USER";
    ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 3] = "WORKSPACE";
    ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 4] = "WORKSPACE_FOLDER";
    ConfigurationTarget[ConfigurationTarget["MEMORY"] = 5] = "MEMORY";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
//# sourceMappingURL=IUnifiedConfigurationService.js.map