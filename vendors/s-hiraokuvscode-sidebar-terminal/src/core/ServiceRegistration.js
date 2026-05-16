"use strict";
/**
 * Service Registration for DIContainer
 *
 * This module provides service registration helpers for the DI container.
 * Services are registered here and will be bootstrapped in ExtensionLifecycle (Phase 2 Week 3).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFactory = void 0;
exports.registerPhase2Services = registerPhase2Services;
exports.registerPhase3Plugins = registerPhase3Plugins;
const DIContainer_1 = require("./DIContainer");
const logger_1 = require("../utils/logger");
const BufferManagementService_1 = require("../services/buffer/BufferManagementService");
const IBufferManagementService_1 = require("../services/buffer/IBufferManagementService");
const TerminalStateService_1 = require("../services/state/TerminalStateService");
const ITerminalStateService_1 = require("../services/state/ITerminalStateService");
const PluginManager_1 = require("./plugins/PluginManager");
const PluginConfigurationService_1 = require("./plugins/PluginConfigurationService");
const ClaudePlugin_1 = require("../plugins/agents/ClaudePlugin");
const CopilotPlugin_1 = require("../plugins/agents/CopilotPlugin");
const GeminiPlugin_1 = require("../plugins/agents/GeminiPlugin");
const CodexPlugin_1 = require("../plugins/agents/CodexPlugin");
/**
 * Register Phase 2 services in the DI container
 *
 * This function will be called from ExtensionLifecycle.activate() in Phase 2 Week 3.
 * For now, it serves as documentation of service dependencies.
 *
 * @param container DI container instance
 * @param eventBus Shared EventBus instance
 */
function registerPhase2Services(container, eventBus) {
    // Register BufferManagementService (Phase 2 Week 1)
    container.register(IBufferManagementService_1.IBufferManagementService, () => new BufferManagementService_1.BufferManagementService(eventBus), DIContainer_1.ServiceLifetime.Singleton);
    // Register TerminalStateService (Phase 2 Week 2)
    container.register(ITerminalStateService_1.ITerminalStateService, () => new TerminalStateService_1.TerminalStateService(eventBus), DIContainer_1.ServiceLifetime.Singleton);
    // Future Phase 2 services will be registered here:
    // - Additional services as needed
}
/**
 * Register Phase 3 plugins in the DI container
 *
 * This function registers the PluginManager and all agent plugins.
 * It will be called from ExtensionLifecycle.activate() in Phase 3.
 *
 * @param container DI container instance
 * @param eventBus Shared EventBus instance
 * @returns PluginManager and PluginConfigurationService instances
 */
async function registerPhase3Plugins(container, eventBus) {
    try {
        // Create PluginManager instance
        const pluginManager = new PluginManager_1.PluginManager(eventBus);
        // Register agent plugins (without immediate activation)
        const claudePlugin = new ClaudePlugin_1.ClaudePlugin();
        const copilotPlugin = new CopilotPlugin_1.CopilotPlugin();
        const geminiPlugin = new GeminiPlugin_1.GeminiPlugin();
        const codexPlugin = new CodexPlugin_1.CodexPlugin();
        // Register plugins - activation will be handled by PluginConfigurationService
        await pluginManager.registerPlugin(claudePlugin, {
            activateImmediately: false,
            config: { enabled: true },
        });
        await pluginManager.registerPlugin(copilotPlugin, {
            activateImmediately: false,
            config: { enabled: true },
        });
        await pluginManager.registerPlugin(geminiPlugin, {
            activateImmediately: false,
            config: { enabled: true },
        });
        await pluginManager.registerPlugin(codexPlugin, {
            activateImmediately: false,
            config: { enabled: true },
        });
        // Create and initialize PluginConfigurationService
        const configService = new PluginConfigurationService_1.PluginConfigurationService(pluginManager);
        configService.initialize();
        return { pluginManager, configService };
    }
    catch (error) {
        // 🔧 FIX: Log detailed error information for plugin registration failures
        (0, logger_1.error)('[PLUGIN-REGISTRATION] Failed to register Phase 3 plugins:', error);
        (0, logger_1.error)('[PLUGIN-REGISTRATION] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}
/**
 * Service resolution helper for testing and gradual migration
 *
 * Provides a way to manually create services with proper dependencies
 * before full DI integration in Phase 2 Week 3.
 */
class ServiceFactory {
    /**
     * Create a BufferManagementService instance
     *
     * @param eventBus EventBus instance for event publishing
     * @returns BufferManagementService instance
     */
    static createBufferManagementService(eventBus) {
        return new BufferManagementService_1.BufferManagementService(eventBus);
    }
    /**
     * Create a TerminalStateService instance
     *
     * @param eventBus EventBus instance for event publishing
     * @returns TerminalStateService instance
     */
    static createTerminalStateService(eventBus) {
        return new TerminalStateService_1.TerminalStateService(eventBus);
    }
}
exports.ServiceFactory = ServiceFactory;
//# sourceMappingURL=ServiceRegistration.js.map