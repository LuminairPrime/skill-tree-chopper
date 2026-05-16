"use strict";
/**
 * Profile Message Handler
 *
 * Handles terminal profile management messages
 *
 * Uses registry-based dispatch pattern instead of switch-case
 * for better maintainability and extensibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileMessageHandler = void 0;
/**
 * Profile Message Handler
 *
 * Responsibilities:
 * - Forward profile update messages to ProfileManager
 * - Handle default profile change notifications
 */
class ProfileMessageHandler {
    constructor(logger) {
        this.logger = logger;
        this.handlers = this.buildHandlerRegistry();
    }
    /**
     * Build handler registry - replaces switch-case pattern
     */
    buildHandlerRegistry() {
        const registry = new Map();
        registry.set('showProfileSelector', (msg, coord) => this.handleShowProfileSelector(msg, coord));
        registry.set('profilesUpdated', (msg, coord) => this.handleProfilesUpdated(msg, coord));
        registry.set('defaultProfileChanged', (msg, coord) => this.handleDefaultProfileChanged(msg, coord));
        return registry;
    }
    /**
     * Handle profile related messages using registry dispatch
     */
    handleMessage(msg, coordinator) {
        const command = msg.command;
        if (!command) {
            this.logger.warn('Message received without command property');
            return;
        }
        const handler = this.handlers.get(command);
        if (handler) {
            handler(msg, coordinator);
        }
        else {
            this.logger.warn(`Unknown profile command: ${command}`);
        }
    }
    /**
     * Get supported command types
     */
    getSupportedCommands() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Handle show profile selector message
     */
    handleShowProfileSelector(_msg, coordinator) {
        this.logger.info('Show profile selector');
        // Forward to ProfileManager if it exists
        const managers = coordinator.getManagers ? coordinator.getManagers() : {};
        const profileManager = managers.profile || coordinator.profileManager;
        if (profileManager && typeof profileManager.showProfileSelector === 'function') {
            profileManager.showProfileSelector();
        }
        else {
            this.logger.warn('Profile manager not available to show selector');
        }
    }
    /**
     * Handle profiles updated message
     */
    handleProfilesUpdated(msg, coordinator) {
        this.logger.info('Profiles updated');
        // Forward to ProfileManager if it exists
        const managers = coordinator.getManagers();
        if (managers.profile) {
            managers.profile.handleMessage(msg);
        }
    }
    /**
     * Handle default profile changed message
     */
    handleDefaultProfileChanged(msg, coordinator) {
        this.logger.info('Default profile changed');
        // Forward to ProfileManager if it exists
        const managers = coordinator.getManagers();
        if (managers.profile) {
            managers.profile.handleMessage(msg);
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.handlers.clear();
    }
}
exports.ProfileMessageHandler = ProfileMessageHandler;
//# sourceMappingURL=ProfileMessageHandler.js.map