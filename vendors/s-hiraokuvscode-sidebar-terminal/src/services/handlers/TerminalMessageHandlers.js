'use strict';
/**
 * Terminal Message Handlers
 * Specific handlers for terminal operations extracted from SecondaryTerminalProvider
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalMessageHandlerFactory =
  exports.SplitTerminalHandler =
  exports.SessionRestorationHandler =
  exports.UpdateSettingsHandler =
  exports.GetSettingsHandler =
  exports.FocusTerminalHandler =
  exports.TerminalResizeHandler =
  exports.TerminalInputHandler =
  exports.DeleteTerminalHandler =
  exports.CreateTerminalHandler =
    void 0;
const MessageRouter_1 = require('../MessageRouter');
const common_1 = require('../../utils/common');
/**
 * Handler for creating new terminals
 */
class CreateTerminalHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('CreateTerminalHandler');
    this.dependencies = dependencies;
  }
  async handle(data) {
    this.log('Creating new terminal');
    try {
      const terminalId = await this.dependencies.terminalManager.createTerminal({
        profile: data.profile,
        workingDirectory: data.workingDirectory,
        environmentVariables: data.environmentVariables,
      });
      this.log(`Terminal created successfully: ${terminalId}`);
      return { terminalId };
    } catch (error) {
      this.log(`Failed to create terminal: ${error}`);
      throw new Error(`Terminal creation failed: ${error}`);
    }
  }
}
exports.CreateTerminalHandler = CreateTerminalHandler;
/**
 * Handler for deleting terminals
 */
class DeleteTerminalHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('DeleteTerminalHandler');
    this.dependencies = dependencies;
  }
  async handle(data) {
    this.validateRequired(data, ['terminalId']);
    this.log(`Deleting terminal: ${data.terminalId}`);
    try {
      const success = await this.dependencies.terminalManager.deleteTerminal(
        data.terminalId,
        data.force || false
      );
      if (success) {
        this.log(`Terminal deleted successfully: ${data.terminalId}`);
      } else {
        this.log(`Failed to delete terminal: ${data.terminalId}`);
      }
      return { success };
    } catch (error) {
      this.log(`Error deleting terminal: ${error}`);
      throw new Error(`Terminal deletion failed: ${error}`);
    }
  }
}
exports.DeleteTerminalHandler = DeleteTerminalHandler;
/**
 * Handler for terminal input
 */
class TerminalInputHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('TerminalInputHandler');
    this.dependencies = dependencies;
  }
  handle(data) {
    this.validateRequired(data, ['terminalId', 'input']);
    try {
      // Fix: sendInput signature is (data, terminalId), not (terminalId, data)
      this.dependencies.terminalManager.sendInput(data.input, data.terminalId);
      return { success: true };
    } catch (error) {
      this.log(`Error sending input to terminal ${data.terminalId}: ${error}`);
      throw new Error(`Input sending failed: ${error}`);
    }
  }
}
exports.TerminalInputHandler = TerminalInputHandler;
/**
 * Handler for terminal resize operations
 */
class TerminalResizeHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('TerminalResizeHandler');
    this.dependencies = dependencies;
  }
  handle(data) {
    this.validateRequired(data, ['terminalId', 'cols', 'rows']);
    if (data.cols <= 0 || data.rows <= 0) {
      throw new Error('Invalid resize dimensions: cols and rows must be positive');
    }
    try {
      this.dependencies.terminalManager.resize(data.cols, data.rows, data.terminalId);
      this.log(`Terminal resized: ${data.terminalId} (${data.cols}x${data.rows})`);
      return { success: true };
    } catch (error) {
      this.log(`Error resizing terminal ${data.terminalId}: ${error}`);
      throw new Error(`Terminal resize failed: ${error}`);
    }
  }
}
exports.TerminalResizeHandler = TerminalResizeHandler;
/**
 * Handler for focusing terminals
 */
class FocusTerminalHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('FocusTerminalHandler');
    this.dependencies = dependencies;
  }
  handle(data) {
    this.validateRequired(data, ['terminalId']);
    try {
      this.dependencies.terminalManager.focusTerminal(data.terminalId);
      this.log(`Terminal focused: ${data.terminalId}`);
      return { success: true };
    } catch (error) {
      this.log(`Error focusing terminal ${data.terminalId}: ${error}`);
      throw new Error(`Terminal focus failed: ${error}`);
    }
  }
}
exports.FocusTerminalHandler = FocusTerminalHandler;
/**
 * Handler for getting terminal settings
 */
class GetSettingsHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('GetSettingsHandler');
    this.dependencies = dependencies;
  }
  handle() {
    try {
      const settings = this.dependencies.configService.getCurrentSettings();
      return { settings };
    } catch (error) {
      this.log(`Error getting settings: ${error}`);
      throw new Error(`Failed to get settings: ${error}`);
    }
  }
}
exports.GetSettingsHandler = GetSettingsHandler;
/**
 * Handler for updating settings
 */
class UpdateSettingsHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('UpdateSettingsHandler');
    this.dependencies = dependencies;
  }
  async handle(data) {
    this.validateRequired(data, ['settings']);
    try {
      await this.dependencies.configService.updateSettings(data.settings);
      this.log('Settings updated successfully');
      return { success: true };
    } catch (error) {
      this.log(`Error updating settings: ${error}`);
      throw new Error(`Settings update failed: ${error}`);
    }
  }
}
exports.UpdateSettingsHandler = UpdateSettingsHandler;
/**
 * Handler for session restoration requests
 */
class SessionRestorationHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('SessionRestorationHandler');
    this.dependencies = dependencies;
  }
  async handle() {
    try {
      const sessionData = await this.dependencies.persistenceService.getLastSession();
      this.log('Session data retrieved successfully');
      return { sessionData };
    } catch (error) {
      this.log(`Error retrieving session data: ${error}`);
      throw new Error(`Session retrieval failed: ${error}`);
    }
  }
}
exports.SessionRestorationHandler = SessionRestorationHandler;
/**
 * Handler for split terminal operations
 */
class SplitTerminalHandler extends MessageRouter_1.BaseMessageHandler {
  constructor(dependencies) {
    super('SplitTerminalHandler');
    this.dependencies = dependencies;
  }
  async handle(data) {
    try {
      // Create a new terminal for the split
      const terminalId = await this.dependencies.terminalManager.createTerminal({
        // Split terminal inherits current working directory
        workingDirectory: await this.getCurrentWorkingDirectory(),
      });
      this.log(`Split terminal created: ${terminalId} (${data.direction || 'default'})`);
      return { terminalId };
    } catch (error) {
      this.log(`Error creating split terminal: ${error}`);
      throw new Error(`Split terminal creation failed: ${error}`);
    }
  }
  async getCurrentWorkingDirectory() {
    // Get current working directory from active terminal or default
    try {
      const activeTerminalId = this.dependencies.terminalManager.getActiveTerminalId();
      if (activeTerminalId) {
        return await this.dependencies.terminalManager.getWorkingDirectory(activeTerminalId);
      }
    } catch (error) {
      this.log(`Could not get working directory: ${error}`);
    }
    return (0, common_1.safeProcessCwd)(); // Fallback to process working directory
  }
}
exports.SplitTerminalHandler = SplitTerminalHandler;
/**
 * Factory for creating terminal message handlers
 */
class TerminalMessageHandlerFactory {
  static createAllHandlers(dependencies) {
    const handlers = new Map();
    handlers.set('createTerminal', new CreateTerminalHandler(dependencies));
    handlers.set('deleteTerminal', new DeleteTerminalHandler(dependencies));
    handlers.set('terminalInput', new TerminalInputHandler(dependencies));
    handlers.set('terminalResize', new TerminalResizeHandler(dependencies));
    handlers.set('focusTerminal', new FocusTerminalHandler(dependencies));
    handlers.set('getSettings', new GetSettingsHandler(dependencies));
    handlers.set('updateSettings', new UpdateSettingsHandler(dependencies));
    handlers.set('sessionRestore', new SessionRestorationHandler(dependencies));
    handlers.set('splitTerminal', new SplitTerminalHandler(dependencies));
    return handlers;
  }
  static registerAllHandlers(messageRouter, dependencies) {
    const handlers = TerminalMessageHandlerFactory.createAllHandlers(dependencies);
    for (const [command, handler] of handlers) {
      messageRouter.registerHandler(command, handler);
    }
  }
}
exports.TerminalMessageHandlerFactory = TerminalMessageHandlerFactory;
//# sourceMappingURL=TerminalMessageHandlers.js.map
