"use strict";
/**
 * Keyboard Shortcut Service - VS Code標準キーボードショートカット管理
 * VS Code の標準ターミナルキーボードショートカットに準拠した実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardShortcutService = void 0;
const vscode = require("vscode");
const logger_1 = require("../utils/logger");
const DisposableStore_1 = require("../utils/DisposableStore");
class KeyboardShortcutService {
    constructor(terminalManager) {
        this._disposables = new DisposableStore_1.DisposableStore();
        this._commandHistory = [];
        this._currentHistoryIndex = -1;
        this._searchBox = null;
        this._panelNavigationMode = false;
        /**
         * Set the webview provider for sending commands
         */
        this._webviewProvider = null;
        this._terminalManager = terminalManager;
        this.registerCommands();
        this._initializePanelNavigationEnabled();
    }
    /**
     * Initialize panel navigation enabled context key from settings and watch for changes
     */
    _initializePanelNavigationEnabled() {
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const enabled = config.get('panelNavigation.enabled', false);
        void vscode.commands.executeCommand('setContext', 'secondaryTerminal.panelNavigation.enabled', enabled);
        (0, logger_1.terminal)(`🧭 [KEYBOARD] Panel navigation enabled: ${enabled}`);
        this._disposables.add(vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('secondaryTerminal.panelNavigation.enabled')) {
                const newConfig = vscode.workspace.getConfiguration('secondaryTerminal');
                const newEnabled = newConfig.get('panelNavigation.enabled', false);
                void vscode.commands.executeCommand('setContext', 'secondaryTerminal.panelNavigation.enabled', newEnabled);
                // Send to WebView so InputManager knows
                this.sendWebviewMessage({
                    command: 'panelNavigationEnabledChanged',
                    enabled: newEnabled,
                });
                (0, logger_1.terminal)(`🧭 [KEYBOARD] Panel navigation enabled changed: ${newEnabled}`);
            }
        }));
    }
    /**
     * Register all keyboard shortcut commands
     */
    registerCommands() {
        // Terminal Focus & Creation
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.focusTerminal', () => {
            this.focusTerminal();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.createTerminal', () => {
            this.createTerminal();
        }));
        // Terminal Navigation
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.focusNextTerminal', () => {
            this.focusNextTerminal();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.focusPreviousTerminal', () => {
            this.focusPreviousTerminal();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.togglePanelNavigationMode', () => {
            void this.togglePanelNavigationMode();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.exitPanelNavigationMode', () => {
            void this.exitPanelNavigationMode();
        }));
        // Terminal Operations
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.clearTerminal', () => {
            this.clearTerminal();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.scrollToPreviousCommand', () => {
            this.scrollToPreviousCommand();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.scrollToNextCommand', () => {
            this.scrollToNextCommand();
        }));
        // Text Operations
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.selectAll', () => {
            this.selectAll();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.copy', () => {
            this.copy();
        }));
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.paste', () => {
            this.paste();
        }));
        // Search Operations - Note: 'secondaryTerminal.find' is registered in ExtensionLifecycle.ts
        this._disposables.add(vscode.commands.registerCommand('secondaryTerminal.runRecentCommand', () => {
            this.runRecentCommand();
        }));
        // Terminal Number Direct Focus (Alt+1~5)
        for (let i = 1; i <= 5; i++) {
            this._disposables.add(vscode.commands.registerCommand(`secondaryTerminal.focusTerminal${i}`, () => {
                this.focusTerminalByNumber(i);
            }));
        }
    }
    /**
     * Focus the terminal view
     */
    async focusTerminal() {
        try {
            // Focus the secondary terminal view
            await vscode.commands.executeCommand('secondaryTerminal.focus');
            // Get the active terminal and focus it
            const activeTerminal = this._terminalManager.getActiveTerminalId();
            if (activeTerminal) {
                // Send focus event to webview
                this.sendWebviewCommand('focus', { terminalId: activeTerminal });
            }
            (0, logger_1.terminal)('🎯 [KEYBOARD] Terminal focused');
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [KEYBOARD] Failed to focus terminal: ${error}`);
        }
    }
    /**
     * Create a new terminal with default profile
     */
    async createTerminal() {
        try {
            const creationOverrides = { displayModeOverride: 'fullscreen' };
            this.sendWebviewMessage({
                command: 'setDisplayMode',
                mode: 'fullscreen',
                forceNextCreate: true,
            });
            // Check if we can use profile-based creation
            const defaultProfile = this._terminalManager.getDefaultProfile();
            let terminalId;
            if (defaultProfile && 'createTerminalWithProfile' in this._terminalManager) {
                // Use profile-based creation if available
                terminalId = await this._terminalManager.createTerminalWithProfile(defaultProfile, creationOverrides);
            }
            else {
                // Fallback to standard creation
                terminalId = this._terminalManager.createTerminal(creationOverrides);
            }
            if (terminalId) {
                (0, logger_1.terminal)(`✅ [KEYBOARD] Created new terminal: ${terminalId}`);
                this._terminalManager.setActiveTerminal(terminalId);
            }
            else {
                vscode.window.showWarningMessage('Maximum number of terminals reached');
            }
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [KEYBOARD] Failed to create terminal: ${error}`);
            vscode.window.showErrorMessage(`Failed to create terminal: ${error}`);
        }
    }
    /**
     * Focus the next terminal in the list
     */
    focusNextTerminal() {
        const terminals = this._terminalManager.getTerminals();
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (terminals.length === 0)
            return;
        const terminalIds = terminals.map((t) => t.id);
        const currentIndex = activeTerminal ? terminalIds.indexOf(activeTerminal) : -1;
        const nextIndex = (currentIndex + 1) % terminalIds.length;
        const nextTerminalId = terminalIds[nextIndex];
        if (nextTerminalId) {
            this._terminalManager.setActiveTerminal(nextTerminalId);
            this.sendWebviewCommand('focusTerminal', { terminalId: nextTerminalId });
            (0, logger_1.terminal)(`🎯 [KEYBOARD] Focused next terminal: ${nextTerminalId}`);
        }
    }
    /**
     * Focus the previous terminal in the list
     */
    focusPreviousTerminal() {
        const terminals = this._terminalManager.getTerminals();
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (terminals.length === 0)
            return;
        const terminalIds = terminals.map((t) => t.id);
        const currentIndex = activeTerminal ? terminalIds.indexOf(activeTerminal) : 0;
        const prevIndex = (currentIndex - 1 + terminalIds.length) % terminalIds.length;
        const prevTerminalId = terminalIds[prevIndex];
        if (prevTerminalId) {
            this._terminalManager.setActiveTerminal(prevTerminalId);
            this.sendWebviewCommand('focusTerminal', { terminalId: prevTerminalId });
            (0, logger_1.terminal)(`🎯 [KEYBOARD] Focused previous terminal: ${prevTerminalId}`);
        }
    }
    /**
     * Focus terminal by number (1-5)
     * If terminal with specified number does not exist, do nothing
     */
    focusTerminalByNumber(number) {
        const terminals = this._terminalManager.getTerminals();
        // Find terminal with matching number
        const targetTerminal = terminals.find((t) => t.number === number);
        if (!targetTerminal) {
            // Terminal does not exist - silently ignore
            (0, logger_1.terminal)(`ℹ️ [KEYBOARD] No terminal with number ${number} exists`);
            return;
        }
        // Already active - no action needed
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (activeTerminal === targetTerminal.id) {
            return;
        }
        // Set active and notify WebView
        this._terminalManager.setActiveTerminal(targetTerminal.id);
        this.sendWebviewCommand('focusTerminal', { terminalId: targetTerminal.id });
        (0, logger_1.terminal)(`🎯 [KEYBOARD] Focused terminal ${number}: ${targetTerminal.id}`);
    }
    /**
     * Clear the active terminal
     */
    clearTerminal() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        this.sendWebviewCommand('clearTerminal', { terminalId: activeTerminal });
        (0, logger_1.terminal)(`🧹 [KEYBOARD] Cleared terminal: ${activeTerminal}`);
    }
    /**
     * Scroll to previous command (VS Code standard: Ctrl+Up)
     */
    scrollToPreviousCommand() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        this.sendWebviewCommand('scrollToPreviousCommand', { terminalId: activeTerminal });
        (0, logger_1.terminal)(`⬆️ [KEYBOARD] Scrolled to previous command: ${activeTerminal}`);
    }
    /**
     * Scroll to next command (VS Code standard: Ctrl+Down)
     */
    scrollToNextCommand() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        this.sendWebviewCommand('scrollToNextCommand', { terminalId: activeTerminal });
        (0, logger_1.terminal)(`⬇️ [KEYBOARD] Scrolled to next command: ${activeTerminal}`);
    }
    /**
     * Select all text in terminal
     */
    selectAll() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        this.sendWebviewCommand('selectAll', { terminalId: activeTerminal });
        (0, logger_1.terminal)(`📋 [KEYBOARD] Selected all text: ${activeTerminal}`);
    }
    /**
     * Copy selected text
     */
    copy() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        this.sendWebviewCommand('copy', { terminalId: activeTerminal });
        (0, logger_1.terminal)(`📋 [KEYBOARD] Copied text: ${activeTerminal}`);
    }
    /**
     * Paste from clipboard
     */
    async paste() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        try {
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText && activeTerminal) {
                // Fix: sendInput signature is (data, terminalId), not (terminalId, data)
                this._terminalManager.sendInput(clipboardText, activeTerminal);
                (0, logger_1.terminal)(`📋 [KEYBOARD] Pasted ${clipboardText.length} chars to terminal ${activeTerminal}`);
            }
        }
        catch (error) {
            (0, logger_1.terminal)(`❌ [KEYBOARD] Failed to paste: ${error}`);
        }
    }
    /**
     * Open find box (VS Code standard: Ctrl+F)
     */
    async find() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        const searchTerm = await vscode.window.showInputBox({
            placeHolder: 'Search in terminal...',
            prompt: 'Enter text to search',
        });
        if (searchTerm) {
            this.sendWebviewCommand('find', {
                terminalId: activeTerminal,
                searchTerm,
            });
            (0, logger_1.terminal)(`🔍 [KEYBOARD] Searching for: ${searchTerm}`);
        }
    }
    /**
     * Run recent command (VS Code standard: Ctrl+R)
     */
    async runRecentCommand() {
        const activeTerminal = this._terminalManager.getActiveTerminalId();
        if (!activeTerminal)
            return;
        // Show quick pick with command history
        const recentCommands = this.getRecentCommands();
        if (recentCommands.length === 0) {
            vscode.window.showInformationMessage('No command history available');
            return;
        }
        const selected = await vscode.window.showQuickPick(recentCommands, {
            placeHolder: 'Select a recent command to run',
        });
        if (selected && activeTerminal) {
            // Fix: sendInput signature is (data, terminalId), not (terminalId, data)
            this._terminalManager.sendInput(selected + '\n', activeTerminal);
            (0, logger_1.terminal)(`🔄 [KEYBOARD] Running recent command: ${selected}`);
        }
    }
    /**
     * Get recent commands from history
     */
    getRecentCommands() {
        // This would be integrated with shell integration to get real command history
        // For now, return a placeholder array
        return this._commandHistory.slice(-20).reverse();
    }
    /**
     * Add command to history
     */
    addToHistory(command) {
        if (command && command.trim()) {
            this._commandHistory.push(command.trim());
            // Keep only last 100 commands
            if (this._commandHistory.length > 100) {
                this._commandHistory = this._commandHistory.slice(-100);
            }
        }
    }
    /**
     * Send command to webview
     */
    sendWebviewCommand(command, data) {
        this.sendWebviewMessage({ command, ...data });
    }
    /**
     * Send message to webview with backward compatibility.
     */
    sendWebviewMessage(message) {
        if (this._webviewProvider &&
            'sendMessageToWebview' in this._webviewProvider &&
            typeof this._webviewProvider.sendMessageToWebview === 'function') {
            this._webviewProvider.sendMessageToWebview(message);
            (0, logger_1.terminal)(`📨 [KEYBOARD] Sent to webview: ${String(message.command)}`, message);
            return;
        }
        if (this._webviewProvider &&
            'sendMessage' in this._webviewProvider &&
            typeof this._webviewProvider.sendMessage === 'function') {
            this._webviewProvider.sendMessage(message);
            (0, logger_1.terminal)(`📨 [KEYBOARD] Sent to webview: ${String(message.command)}`, message);
            return;
        }
        (0, logger_1.terminal)(`⚠️ [KEYBOARD] No webview provider available for command: ${String(message.command)}`, message);
    }
    setWebviewProvider(provider) {
        this._webviewProvider = provider;
        (0, logger_1.terminal)('🔗 [KEYBOARD] Webview provider connected');
        // Send initial panel navigation enabled state to WebView
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        const enabled = config.get('panelNavigation.enabled', false);
        this.sendWebviewMessage({
            command: 'panelNavigationEnabledChanged',
            enabled,
        });
    }
    /**
     * Dispose of resources
     */
    dispose() {
        if (this._panelNavigationMode) {
            void vscode.commands.executeCommand('setContext', 'secondaryTerminal.panelNavigationMode', false);
            this._panelNavigationMode = false;
        }
        void vscode.commands.executeCommand('setContext', 'secondaryTerminal.panelNavigation.enabled', false);
        this._disposables.dispose();
        this._searchBox?.dispose();
        (0, logger_1.terminal)('🧹 [KEYBOARD] Service disposed');
    }
    async togglePanelNavigationMode() {
        await this.setPanelNavigationMode(!this._panelNavigationMode);
    }
    async exitPanelNavigationMode() {
        if (!this._panelNavigationMode) {
            return;
        }
        await this.setPanelNavigationMode(false);
    }
    async setPanelNavigationMode(enabled) {
        this._panelNavigationMode = enabled;
        await vscode.commands.executeCommand('setContext', 'secondaryTerminal.panelNavigationMode', enabled);
        this.sendWebviewMessage({
            command: 'panelNavigationMode',
            enabled,
        });
        (0, logger_1.terminal)(`🧭 [KEYBOARD] Panel navigation mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
}
exports.KeyboardShortcutService = KeyboardShortcutService;
//# sourceMappingURL=KeyboardShortcutService.js.map