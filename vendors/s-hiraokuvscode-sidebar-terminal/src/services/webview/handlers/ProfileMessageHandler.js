'use strict';
/**
 * Profile Message Handler
 * Handles terminal profile-related messages from WebView
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProfileMessageHandler = void 0;
const logger_1 = require('../../../utils/logger');
class ProfileMessageHandler {
  constructor() {
    this.supportedCommands = [
      'getProfiles',
      'createTerminalWithProfile',
      'selectProfile',
      'createProfile',
      'updateProfile',
      'deleteProfile',
      'setDefaultProfile',
    ];
  }
  canHandle(message) {
    return this.supportedCommands.includes(message.command);
  }
  async handle(message, context) {
    await this.handleMessage(message, context);
  }
  async handleMessage(message, context) {
    const { profileManager } = context;
    if (!profileManager) {
      (0, logger_1.provider)('⚠️ [PROFILE-HANDLER] Profile Manager not available');
      return false;
    }
    switch (message.command) {
      case 'getProfiles':
        return this._handleGetProfiles(message, context);
      case 'createTerminalWithProfile':
        return this._handleCreateTerminalWithProfile(message, context);
      case 'selectProfile':
        return this._handleSelectProfile(message, context);
      case 'createProfile':
        return this._handleCreateProfile(message, context);
      case 'updateProfile':
        return this._handleUpdateProfile(message, context);
      case 'deleteProfile':
        return this._handleDeleteProfile(message, context);
      case 'setDefaultProfile':
        return this._handleSetDefaultProfile(message, context);
      default:
        return false;
    }
  }
  async _handleGetProfiles(_message, context) {
    try {
      const { profileManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      const profiles = profileManager.getProfiles();
      const defaultProfile = profileManager.getDefaultProfile();
      await sendMessage({
        command: 'profilesResponse',
        profiles: profiles,
        profileId: defaultProfile.id,
      });
      (0, logger_1.provider)(`🎯 [PROFILE-HANDLER] Sent ${profiles.length} profiles to WebView`);
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error getting profiles:', error);
      await this._sendErrorResponse(context, 'Failed to get profiles', error);
      return true;
    }
  }
  async _handleCreateTerminalWithProfile(message, context) {
    try {
      const { profileManager, terminalManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      const profileId = message.profileId;
      if (!profileId) {
        throw new Error('Profile ID is required');
      }
      // Create terminal with profile
      const result = profileManager.createTerminalWithProfile(profileId, message.profileOptions);
      // Use terminal manager to create actual terminal
      const terminalId = await terminalManager.createTerminal();
      // Set as active terminal
      terminalManager.setActiveTerminal(terminalId);
      // Send success response
      await sendMessage({
        command: 'terminalCreated',
        terminalId: terminalId,
        terminalName: result.config.name || 'Terminal',
        profile: result.profile,
      });
      (0, logger_1.provider)(
        `🎯 [PROFILE-HANDLER] Created terminal with profile: ${result.profile.name}`
      );
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error creating terminal with profile:', error);
      await this._sendErrorResponse(context, 'Failed to create terminal with profile', error);
      return true;
    }
  }
  async _handleSelectProfile(message, context) {
    try {
      const profileId = message.profileId;
      if (!profileId) {
        throw new Error('Profile ID is required');
      }
      // For select profile, we'll create a terminal with the selected profile
      return this._handleCreateTerminalWithProfile(
        {
          ...message,
          command: 'createTerminalWithProfile',
        },
        context
      );
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error selecting profile:', error);
      await this._sendErrorResponse(context, 'Failed to select profile', error);
      return true;
    }
  }
  async _handleCreateProfile(message, context) {
    try {
      const { profileManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      if (!message.profile) {
        throw new Error('Profile data is required');
      }
      const newProfile = profileManager.createProfile(message.profile);
      await sendMessage({
        command: 'profilesResponse',
        profiles: profileManager.getProfiles(),
        profileId: newProfile.id,
      });
      (0, logger_1.provider)(`🎯 [PROFILE-HANDLER] Created new profile: ${newProfile.name}`);
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error creating profile:', error);
      await this._sendErrorResponse(context, 'Failed to create profile', error);
      return true;
    }
  }
  async _handleUpdateProfile(message, context) {
    try {
      const { profileManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      if (!message.profileId || !message.profile) {
        throw new Error('Profile ID and data are required');
      }
      profileManager.updateProfile(message.profileId, message.profile);
      await sendMessage({
        command: 'profilesResponse',
        profiles: profileManager.getProfiles(),
        profileId: message.profileId,
      });
      (0, logger_1.provider)(`🎯 [PROFILE-HANDLER] Updated profile: ${message.profileId}`);
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error updating profile:', error);
      await this._sendErrorResponse(context, 'Failed to update profile', error);
      return true;
    }
  }
  async _handleDeleteProfile(message, context) {
    try {
      const { profileManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      if (!message.profileId) {
        throw new Error('Profile ID is required');
      }
      profileManager.deleteProfile(message.profileId);
      await sendMessage({
        command: 'profilesResponse',
        profiles: profileManager.getProfiles(),
        profileId: profileManager.getDefaultProfile().id,
      });
      (0, logger_1.provider)(`🎯 [PROFILE-HANDLER] Deleted profile: ${message.profileId}`);
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error deleting profile:', error);
      await this._sendErrorResponse(context, 'Failed to delete profile', error);
      return true;
    }
  }
  async _handleSetDefaultProfile(message, context) {
    try {
      const { profileManager, sendMessage } = context;
      if (!profileManager) {
        throw new Error('Profile Manager not available');
      }
      if (!message.profileId) {
        throw new Error('Profile ID is required');
      }
      profileManager.setDefaultProfile(message.profileId);
      await sendMessage({
        command: 'profilesResponse',
        profiles: profileManager.getProfiles(),
        profileId: message.profileId,
      });
      (0, logger_1.provider)(`🎯 [PROFILE-HANDLER] Set default profile: ${message.profileId}`);
      return true;
    } catch (error) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Error setting default profile:', error);
      await this._sendErrorResponse(context, 'Failed to set default profile', error);
      return true;
    }
  }
  async _sendErrorResponse(context, message, error) {
    try {
      await context.sendMessage({
        command: 'error',
        message: message,
        context: 'ProfileMessageHandler',
        stack: error?.stack || String(error),
      });
    } catch (sendError) {
      (0, logger_1.provider)('❌ [PROFILE-HANDLER] Failed to send error response:', sendError);
    }
  }
}
exports.ProfileMessageHandler = ProfileMessageHandler;
//# sourceMappingURL=ProfileMessageHandler.js.map
