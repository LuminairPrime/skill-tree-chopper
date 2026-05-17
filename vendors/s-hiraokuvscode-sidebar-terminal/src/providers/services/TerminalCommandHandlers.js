'use strict';
/**
 * Terminal Command Handlers Service
 *
 * Handles terminal-specific WebView message commands.
 * Extracted from SecondaryTerminalProvider for better separation of concerns.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TerminalCommandHandlers = void 0;
const vscode = require('vscode');
const common_1 = require('../../utils/common');
const feedback_1 = require('../../utils/feedback');
const logger_1 = require('../../utils/logger');
const type_guards_1 = require('../../types/type-guards');
const UnifiedConfigurationService_1 = require('../../config/UnifiedConfigurationService');
/**
 * TerminalCommandHandlers
 *
 * Consolidates all terminal-related message handlers:
 * - Focus terminal
 * - Split terminal
 * - Create terminal
 * - Kill/Delete terminal
 * - Terminal input
 * - Terminal resize
 * - Terminal reorder
 * - Terminal link handling
 * - Clipboard operations
 * - AI Agent switching
 */
class TerminalCommandHandlers {
  constructor(deps) {
    this.deps = deps;
  }
  /**
   * Handle focus terminal command
   */
  async handleFocusTerminal(message) {
    (0, logger_1.provider)('🎯 [HANDLER] ========== FOCUS TERMINAL COMMAND RECEIVED ==========');
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('❌ [HANDLER] No terminal ID provided for focusTerminal');
      return;
    }
    try {
      const currentActive = this.deps.terminalManager.getActiveTerminalId();
      (0, logger_1.provider)(`🔍 [HANDLER] Current active terminal: ${currentActive}`);
      (0, logger_1.provider)(`🔍 [HANDLER] Requested active terminal: ${message.terminalId}`);
      this.deps.terminalManager.setActiveTerminal(message.terminalId);
      const newActive = this.deps.terminalManager.getActiveTerminalId();
      (0, logger_1.provider)(`🔍 [HANDLER] Verified active terminal after update: ${newActive}`);
      if (newActive === message.terminalId) {
        (0, logger_1.provider)(
          `✅ [HANDLER] Active terminal successfully updated to: ${message.terminalId}`
        );
      } else {
        (0, logger_1.provider)(
          `❌ [HANDLER] Active terminal update failed. Expected: ${message.terminalId}, Got: ${newActive}`
        );
      }
    } catch (error) {
      (0, logger_1.provider)(`❌ [HANDLER] Error setting active terminal:`, error);
    }
  }
  /**
   * Handle split terminal command
   */
  handleSplitTerminal(message) {
    (0, logger_1.provider)('🔀 [HANDLER] Splitting terminal from webview...');
    const direction = (0, type_guards_1.hasDirection)(message) ? message.direction : undefined;
    try {
      this.performSplit(direction);
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to split terminal:', error);
      feedback_1.TerminalErrorHandler.handleWebviewError(error);
    }
  }
  /**
   * Perform terminal split operation
   */
  performSplit(direction) {
    const effectiveDirection = direction || this.deps.getSplitDirection();
    (0, logger_1.provider)(`🔀 [HANDLER] Splitting terminal in direction: ${effectiveDirection}`);
    const newTerminalId = this.deps.terminalManager.createTerminal();
    this.deps.terminalManager.setActiveTerminal(newTerminalId);
    void this.deps.communicationService.sendMessage({
      command: 'split',
      terminalId: newTerminalId,
      direction: effectiveDirection,
    });
    void this.deps.communicationService.sendMessage({
      command: 'stateUpdate',
      state: this.deps.terminalManager.getCurrentState(),
    });
    (0, logger_1.provider)(`✅ [HANDLER] Terminal split complete: ${newTerminalId}`);
  }
  /**
   * Handle create terminal command
   */
  async handleCreateTerminal(_message) {
    (0, logger_1.provider)('🎨 [HANDLER] Creating new terminal from WebView request');
    try {
      const terminalId = this.deps.terminalManager.createTerminal();
      (0, logger_1.provider)(`✅ [HANDLER] Terminal created: ${terminalId}`);
      this.deps.terminalManager.setActiveTerminal(terminalId);
      await this.sendStateUpdate();
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to create terminal:', error);
      feedback_1.TerminalErrorHandler.handleWebviewError(error);
    }
  }
  /**
   * Handle request initial terminal command
   */
  async handleRequestInitialTerminal(_message) {
    (0, logger_1.provider)('🎯 [HANDLER] Initial terminal requested by WebView');
    try {
      const currentTerminals = this.deps.terminalManager.getTerminals();
      if (currentTerminals.length === 0) {
        const terminalId = this.deps.terminalManager.createTerminal();
        this.deps.terminalManager.setActiveTerminal(terminalId);
        (0, logger_1.provider)(`✅ [HANDLER] Initial terminal created: ${terminalId}`);
      } else {
        (0, logger_1.provider)(
          `📊 [HANDLER] Terminals already exist (${currentTerminals.length}), skipping creation`
        );
      }
      await this.sendStateUpdate();
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to handle initial terminal request:', error);
    }
  }
  /**
   * Handle terminal input
   */
  handleTerminalInput(message) {
    if (!(0, type_guards_1.hasTerminalId)(message) || !(0, type_guards_1.hasInputData)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] Invalid terminal input message');
      return;
    }
    this.deps.terminalManager.sendInput(message.data, message.terminalId);
  }
  /**
   * Handle terminal resize
   */
  handleTerminalResize(message) {
    if (
      !(0, type_guards_1.hasTerminalId)(message) ||
      !(0, type_guards_1.hasResizeParams)(message)
    ) {
      (0, logger_1.provider)('⚠️ [HANDLER] Invalid terminal resize message');
      return;
    }
    this.deps.terminalManager.resize(message.cols, message.rows, message.terminalId);
  }
  /**
   * Handle terminal interaction events (switch-next / switch-previous / create-terminal / kill-terminal)
   */
  async handleTerminalInteraction(message) {
    const interactionType = message.type;
    if (interactionType === 'create-terminal') {
      await this.handleCreateTerminal(message);
      return;
    }
    if (interactionType === 'kill-terminal') {
      const targetTerminalId =
        message.terminalId || this.deps.terminalManager.getActiveTerminalId();
      if (!targetTerminalId) {
        return;
      }
      await this.performKillTerminal(targetTerminalId);
      return;
    }
    if (!this.isNavigationInteraction(interactionType)) {
      return;
    }
    const targetTerminalId = this.getNavigationTargetTerminalId(message, interactionType);
    if (!targetTerminalId) {
      return;
    }
    try {
      await this.focusTerminal(targetTerminalId);
    } catch (error) {
      feedback_1.TerminalErrorHandler.handleWebviewError(error);
    }
  }
  /**
   * Handle terminal closed event
   */
  async handleTerminalClosed(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] Terminal closed message missing terminalId');
      return;
    }
    try {
      (0, logger_1.provider)(`🗑️ [HANDLER] Terminal closed by WebView: ${message.terminalId}`);
      this.deps.terminalManager.removeTerminal(message.terminalId);
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to handle terminal closed:', error);
    }
  }
  /**
   * Handle kill terminal command
   */
  async handleKillTerminal(message) {
    await this.handleTerminalRemoval(message, 'Kill');
  }
  /**
   * Handle delete terminal command
   */
  async handleDeleteTerminal(message) {
    await this.handleTerminalRemoval(message, 'Delete');
  }
  /**
   * Perform kill terminal operation
   */
  async performKillTerminal(terminalId) {
    (0, logger_1.provider)(`🗑️ [HANDLER] Killing terminal: ${terminalId}`);
    // 🔧 FIX: await killTerminal to ensure deletion completes before sending messages
    try {
      await this.deps.terminalManager.killTerminal(terminalId);
    } catch (error) {
      // killTerminal throws if it fails (e.g., last terminal protection)
      (0, logger_1.provider)(`⚠️ [HANDLER] killTerminal failed:`, error);
      // Send failure response to WebView
      await this.deps.communicationService.sendMessage({
        command: 'deleteTerminalResponse',
        terminalId: terminalId,
        success: false,
        reason: error instanceof Error ? error.message : 'Terminal deletion failed',
      });
      return;
    }
    await this.deps.communicationService.sendMessage({
      command: 'terminalRemoved',
      terminalId: terminalId,
    });
    await this.sendStateUpdate();
    (0, logger_1.provider)(`✅ [HANDLER] Terminal killed: ${terminalId}`);
  }
  /**
   * Handle reorder terminals command
   */
  async handleReorderTerminals(message) {
    const order = Array.isArray(message.order)
      ? message.order.filter((id) => typeof id === 'string' && id.length > 0)
      : [];
    if (order.length === 0) {
      (0, logger_1.provider)('🔁 [HANDLER] Reorder request missing valid order array');
      return;
    }
    try {
      (0, logger_1.provider)('🔁 [HANDLER] Applying terminal reorder:', order);
      this.deps.terminalManager.reorderTerminals(order);
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to reorder terminals:', error);
    }
  }
  /**
   * Handle rename terminal command
   */
  async handleRenameTerminal(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] renameTerminal missing terminalId');
      return;
    }
    const nextName = message?.newName;
    if (typeof nextName !== 'string' || nextName.trim().length === 0) {
      (0, logger_1.provider)('⚠️ [HANDLER] renameTerminal called without valid newName');
      return;
    }
    try {
      const renamed = this.deps.terminalManager.renameTerminal(message.terminalId, nextName.trim());
      if (!renamed) {
        (0, logger_1.provider)(
          `⚠️ [HANDLER] renameTerminal failed for terminalId=${message.terminalId}`
        );
        return;
      }
      await this.sendStateUpdate();
      (0, logger_1.provider)(
        `✅ [HANDLER] Terminal renamed: ${message.terminalId} -> ${nextName.trim()}`
      );
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to rename terminal:', error);
    }
  }
  /**
   * Handle unified terminal header update command (name/color)
   */
  async handleUpdateTerminalHeader(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] updateTerminalHeader missing terminalId');
      return;
    }
    const updates = this.getTerminalHeaderUpdates(message);
    if (!updates) {
      (0, logger_1.provider)('⚠️ [HANDLER] updateTerminalHeader called without valid updates');
      return;
    }
    try {
      const updated = this.applyTerminalHeaderUpdates(message.terminalId, updates);
      if (!updated) {
        (0, logger_1.provider)(
          `⚠️ [HANDLER] updateTerminalHeader failed for terminalId=${message.terminalId}`
        );
        return;
      }
      await this.sendStateUpdate();
      (0, logger_1.provider)(
        `✅ [HANDLER] Terminal header updated: ${message.terminalId} (name=${updates.newName ?? 'unchanged'}, color=${updates.indicatorColor ?? 'unchanged'})`
      );
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to update terminal header:', error);
    }
  }
  /**
   * Handle open terminal link command
   */
  async handleOpenTerminalLink(message) {
    (0, logger_1.provider)(
      `🔗 [HANDLER] openTerminalLink received: type=${message.linkType} url=${message.url ?? ''} file=${message.filePath ?? ''} terminal=${message.terminalId ?? ''}`
    );
    await this.deps.linkResolver.handleOpenTerminalLink(message);
  }
  /**
   * Handle get terminal profiles command
   */
  async handleGetTerminalProfiles() {
    try {
      const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
      const profilesConfig = configService.getTerminalProfilesConfig();
      const platform =
        process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
      const platformProfiles = profilesConfig.profiles[platform] || {};
      const defaultProfileId = profilesConfig.defaultProfiles[platform];
      const profiles = Object.entries(platformProfiles).map(([id, profile]) => {
        const normalized = profile;
        return {
          id,
          name: normalized?.name ?? id,
          description: normalized?.description,
          icon: normalized?.icon,
          path: normalized?.path ?? '',
          args: normalized?.args,
          env: normalized?.env,
          cwd: normalized?.cwd,
          color: normalized?.color,
          isDefault: defaultProfileId ? defaultProfileId === id : Boolean(normalized?.isDefault),
          hidden: normalized?.hidden,
          source: normalized?.source,
        };
      });
      await this.deps.communicationService.sendMessage({
        command: 'profilesUpdated',
        profiles,
        defaultProfileId: defaultProfileId ?? profiles.find((p) => p.isDefault)?.id ?? null,
      });
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to fetch terminal profiles:', error);
      await this.deps.communicationService.sendMessage({
        command: 'profilesUpdated',
        profiles: [],
        defaultProfileId: null,
        error: error.message ?? String(error),
      });
    }
  }
  /**
   * Handle clipboard request (paste)
   */
  async handleClipboardRequest(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] Clipboard request missing terminalId');
      return;
    }
    try {
      (0, logger_1.provider)('📋 [HANDLER] Reading clipboard content...');
      const clipboardText = await vscode.env.clipboard.readText();
      if (!clipboardText) {
        (0, logger_1.provider)('⚠️ [HANDLER] Clipboard is empty');
        return;
      }
      (0, logger_1.provider)(
        `📋 [HANDLER] Clipboard content length: ${clipboardText.length} characters`
      );
      // Normalize line endings to carriage return (VS Code standard terminal behavior)
      let processedText = clipboardText.replace(/\r?\n/g, '\r');
      // Wrap with bracketed paste mode escape sequences (VS Code standard terminal behavior)
      processedText = `\x1b[200~${processedText}\x1b[201~`;
      // Send to terminal using sendInput
      // Note: VS Code standard terminal does NOT escape special characters on paste.
      // Text is written directly to PTY, matching VS Code's behavior.
      (0, logger_1.provider)(`📋 [HANDLER] Pasting to terminal ${message.terminalId}`);
      this.deps.terminalManager.sendInput(processedText, message.terminalId);
      (0, logger_1.provider)('✅ [HANDLER] Clipboard content pasted successfully');
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to handle clipboard request:', error);
      await vscode.window.showErrorMessage('Failed to paste clipboard content into terminal');
    }
  }
  /**
   * Handle copy to clipboard command
   */
  async handleCopyToClipboard(message) {
    const text = message?.text;
    if (typeof text !== 'string' || text.length === 0) {
      (0, logger_1.provider)('⚠️ [HANDLER] copyToClipboard called without text');
      return;
    }
    try {
      await vscode.env.clipboard.writeText(text);
      (0, logger_1.provider)(
        `📋 [HANDLER] Copied ${text.length} chars from terminal ${message.terminalId ?? 'unknown'}`
      );
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to copy text to clipboard:', error);
    }
  }
  /**
   * Handle image paste for Claude Code
   * Saves the image to a temp file and sends the file path to the terminal
   */
  async handlePasteImage(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] pasteImage missing terminalId');
      return;
    }
    const imageData = message?.imageData;
    const imageType = message?.imageType;
    if (!imageData || !imageType) {
      (0, logger_1.provider)('⚠️ [HANDLER] pasteImage missing imageData or imageType');
      return;
    }
    try {
      (0, logger_1.provider)(
        `🖼️ [HANDLER] Processing image paste for terminal ${message.terminalId}`
      );
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64Match = imageData.match(/^data:image\/[a-z]+;base64,(.+)$/i);
      if (!base64Match || !base64Match[1]) {
        (0, logger_1.provider)('⚠️ [HANDLER] Invalid base64 image data format');
        return;
      }
      const base64Content = base64Match[1];
      // Determine file extension from MIME type (sanitized for security)
      const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
      const rawExtension = imageType.replace('image/', '').toLowerCase();
      const extension = validExtensions.includes(rawExtension) ? rawExtension : 'png';
      // Create temp file path
      const os = await Promise.resolve().then(() => require('os'));
      const path = await Promise.resolve().then(() => require('path'));
      const fs = await Promise.resolve().then(() => require('fs'));
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const filename = `claude-paste-${timestamp}.${extension}`;
      const tempFilePath = path.join(tempDir, filename);
      // Write image to temp file (async to avoid blocking event loop)
      const imageBuffer = Buffer.from(base64Content, 'base64');
      await fs.promises.writeFile(tempFilePath, imageBuffer);
      // Schedule cleanup after 5 minutes (Claude Code should have read it by then)
      setTimeout(
        () => {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
              (0, logger_1.provider)(`🧹 [HANDLER] Cleaned up temp image: ${tempFilePath}`);
            }
          } catch {
            // Ignore cleanup errors
          }
        },
        5 * 60 * 1000
      );
      (0, logger_1.provider)(`🖼️ [HANDLER] Saved image to temp file: ${tempFilePath}`);
      // Send the file path to the terminal PTY
      // Claude Code expects the file path as input
      this.deps.terminalManager.sendInput(tempFilePath, message.terminalId);
      (0, logger_1.provider)(`🖼️ [HANDLER] Sent image path to terminal ${message.terminalId}`);
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to handle image paste:', error);
    }
  }
  /**
   * Handle AI Agent connection switch
   * Issue #122: AI Agent connection toggle button functionality
   */
  async handleSwitchAiAgent(message) {
    const terminalId = message.terminalId;
    const action = message?.action || 'activate';
    (0, logger_1.provider)(
      `📎 [HANDLER] switchAiAgent received: terminalId=${terminalId}, action=${action}`
    );
    if (!terminalId) {
      (0, logger_1.provider)('⚠️ [HANDLER] switchAiAgent called without terminalId');
      return;
    }
    try {
      const forceReconnect = action === 'force-reconnect' || message?.forceReconnect;
      const agentType = message?.agentType || 'claude';
      let result;
      if (forceReconnect) {
        // Force reconnect: works even in 'none' state
        const success = this.deps.terminalManager.forceReconnectAiAgent(terminalId, agentType);
        result = {
          success,
          newStatus: success ? 'connected' : 'none',
          agentType: success ? agentType : null,
          reason: success ? undefined : 'Force reconnect failed',
        };
      } else {
        // Normal activate: only works when agent was previously detected
        result = this.deps.terminalManager.switchAiAgentConnection(terminalId);
      }
      (0, logger_1.provider)(
        `⏻ [HANDLER] switchAiAgent result: success=${result.success}, newStatus=${result.newStatus}, agentType=${result.agentType}`
      );
      // Send response back to WebView
      this.deps.communicationService.sendMessage({
        command: 'switchAiAgentResponse',
        terminalId,
        success: result.success,
        newStatus: result.newStatus,
        agentType: result.agentType,
        reason: result.reason,
        isForceReconnect: forceReconnect,
      });
      if (result.success) {
        (0, logger_1.provider)(
          `✅ [HANDLER] AI Agent switch succeeded: ${terminalId} -> ${result.newStatus}`
        );
      } else {
        (0, logger_1.provider)(
          `⚠️ [HANDLER] AI Agent switch failed: ${terminalId}, reason: ${result.reason}`
        );
      }
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Error handling switchAiAgent:', error);
      // Send error response to WebView
      this.deps.communicationService.sendMessage({
        command: 'switchAiAgentResponse',
        terminalId,
        success: false,
        reason: 'Internal error occurred',
      });
    }
  }
  /**
   * Handle text paste from WebView
   * Used when clipboard text is read in WebView and sent to extension for terminal input
   */
  async handlePasteText(message) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)('⚠️ [HANDLER] pasteText missing terminalId');
      return;
    }
    const text = message?.text;
    if (typeof text !== 'string' || text.length === 0) {
      (0, logger_1.provider)('⚠️ [HANDLER] pasteText called without text');
      return;
    }
    try {
      (0, logger_1.provider)(
        `📋 [HANDLER] Processing text paste for terminal ${message.terminalId}`
      );
      (0, logger_1.provider)(`📋 [HANDLER] Text length: ${text.length} characters`);
      // Normalize line endings to carriage return (VS Code standard terminal behavior)
      // This ensures consistent behavior across platforms
      let processedText = text.replace(/\r?\n/g, '\r');
      // Wrap with bracketed paste mode escape sequences (VS Code standard terminal behavior)
      // This tells the shell that this is pasted content, preventing each line from being
      // executed as a separate command. Most modern shells support this mode.
      // \x1b[200~ = start bracketed paste, \x1b[201~ = end bracketed paste
      processedText = `\x1b[200~${processedText}\x1b[201~`;
      // Send to terminal using sendInput
      // Note: VS Code standard terminal does NOT escape special characters on paste.
      // Text is written directly to PTY, matching VS Code's behavior.
      this.deps.terminalManager.sendInput(processedText, message.terminalId);
      (0, logger_1.provider)('✅ [HANDLER] Text pasted successfully');
    } catch (error) {
      (0, logger_1.provider)('❌ [HANDLER] Failed to paste text:', error);
    }
  }
  /**
   * Initialize terminal state and send to WebView
   */
  async initializeTerminals() {
    (0, logger_1.provider)('🔧 [HANDLER] Initializing terminals...');
    // Include font settings in terminalCreated message
    const configService = (0, UnifiedConfigurationService_1.getUnifiedConfigurationService)();
    const fontSettings = configService.getWebViewFontSettings();
    const terminals = this.deps.terminalManager.getTerminals();
    for (const terminal of terminals) {
      const displayModeOverride =
        'consumeCreationDisplayModeOverride' in this.deps.terminalManager &&
        typeof this.deps.terminalManager.consumeCreationDisplayModeOverride === 'function'
          ? this.deps.terminalManager.consumeCreationDisplayModeOverride(terminal.id)
          : null;
      await this.deps.communicationService.sendMessage({
        command: 'terminalCreated',
        terminal: {
          id: terminal.id,
          name: terminal.name,
          cwd: terminal.cwd || (0, common_1.safeProcessCwd)(),
          isActive: terminal.id === this.deps.terminalManager.getActiveTerminalId(),
        },
        // 🔧 Include font settings directly in the message
        config: {
          fontSettings,
          ...(displayModeOverride ? { displayModeOverride } : {}),
        },
      });
    }
    await this.deps.communicationService.sendMessage({
      command: 'stateUpdate',
      state: this.deps.terminalManager.getCurrentState(),
    });
    (0, logger_1.provider)('✅ [HANDLER] Terminal initialization complete');
  }
  isNavigationInteraction(interactionType) {
    return interactionType === 'switch-next' || interactionType === 'switch-previous';
  }
  getNavigationTargetTerminalId(message, interactionType) {
    const terminalIds = this.deps.terminalManager.getTerminals().map((terminal) => terminal.id);
    if (terminalIds.length === 0) {
      return undefined;
    }
    const currentTerminalId = this.deps.terminalManager.getActiveTerminalId() ?? message.terminalId;
    const currentIndex = currentTerminalId ? terminalIds.indexOf(currentTerminalId) : -1;
    const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
    const offset = interactionType === 'switch-next' ? 1 : -1;
    const targetIndex = (normalizedIndex + offset + terminalIds.length) % terminalIds.length;
    return terminalIds[targetIndex];
  }
  async focusTerminal(terminalId) {
    this.deps.terminalManager.setActiveTerminal(terminalId);
    await this.deps.communicationService.sendMessage({
      command: 'focusTerminal',
      terminalId,
      timestamp: Date.now(),
    });
    await this.sendStateUpdate();
  }
  async handleTerminalRemoval(message, action) {
    if (!(0, type_guards_1.hasTerminalId)(message)) {
      (0, logger_1.provider)(`⚠️ [HANDLER] ${action} terminal message missing terminalId`);
      return;
    }
    const presentTenseAction = action === 'Delete' ? 'deleting' : 'killing';
    const failureAction = action === 'Delete' ? 'delete' : 'kill';
    try {
      (0, logger_1.provider)(`🗑️ [HANDLER] ${presentTenseAction} terminal: ${message.terminalId}`);
      await this.performKillTerminal(message.terminalId);
    } catch (error) {
      (0, logger_1.provider)(`❌ [HANDLER] Failed to ${failureAction} terminal:`, error);
      feedback_1.TerminalErrorHandler.handleWebviewError(error);
    }
  }
  getTerminalHeaderUpdates(message) {
    const rawName = message.newName;
    const newName =
      typeof rawName === 'string' && rawName.trim().length > 0 ? rawName.trim() : undefined;
    const indicatorColor = this.normalizeIndicatorColor(message.indicatorColor);
    if (!newName && !indicatorColor) {
      return undefined;
    }
    return {
      ...(newName ? { newName } : {}),
      ...(indicatorColor ? { indicatorColor } : {}),
    };
  }
  normalizeIndicatorColor(rawIndicatorColor) {
    if (typeof rawIndicatorColor !== 'string') {
      return undefined;
    }
    const normalizedIndicatorColor = rawIndicatorColor.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedIndicatorColor)) {
      return normalizedIndicatorColor.toUpperCase();
    }
    return normalizedIndicatorColor.toLowerCase() === 'transparent' ? 'transparent' : undefined;
  }
  applyTerminalHeaderUpdates(terminalId, updates) {
    const manager = this.deps.terminalManager;
    if (typeof manager.updateTerminalHeader === 'function') {
      return manager.updateTerminalHeader(terminalId, updates);
    }
    return updates.newName
      ? this.deps.terminalManager.renameTerminal(terminalId, updates.newName)
      : false;
  }
  async sendStateUpdate() {
    await this.deps.communicationService.sendMessage({
      command: 'stateUpdate',
      state: this.deps.terminalManager.getCurrentState(),
    });
  }
}
exports.TerminalCommandHandlers = TerminalCommandHandlers;
//# sourceMappingURL=TerminalCommandHandlers.js.map
