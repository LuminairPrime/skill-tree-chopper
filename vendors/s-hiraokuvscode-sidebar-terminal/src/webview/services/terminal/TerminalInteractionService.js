"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalInteractionService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
const PlatformUtils_1 = require("../../utils/PlatformUtils");
class TerminalInteractionService {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    setupTerminalInteraction(params) {
        const { terminalId, terminal, container, terminalContent, currentSettings, currentFontSettings, configManager, uiManager, applyPostOpenSettings, } = params;
        terminal.open(terminalContent);
        ManagerLogger_1.terminalLogger.info(`✅ Terminal opened in container: ${terminalId}`);
        this.setupPasteHandling(terminalId, terminal, terminalContent);
        applyPostOpenSettings({
            terminalId,
            terminal,
            container,
            terminalContent,
            currentSettings,
            currentFontSettings,
            configManager,
            uiManager,
        });
        this.dependencies.lifecycleController.attachTerminal(terminalId, terminal);
        this.dependencies.eventManager.setupTerminalEvents(terminal, terminalId, container);
        this.dependencies.focusService.ensureTerminalFocus(terminal, terminalId, terminalContent);
        this.dependencies.focusService.setupContainerFocusHandler(terminal, terminalId, container, terminalContent);
        this.setupShellIntegration(terminal, terminalId);
    }
    setupPasteHandling(terminalId, terminal, terminalContent) {
        terminal.attachCustomKeyEventHandler((event) => {
            const mac = (0, PlatformUtils_1.isMacPlatform)();
            if ((mac && event.metaKey && event.key === 'v') ||
                (event.ctrlKey && event.key === 'v' && !event.shiftKey)) {
                ManagerLogger_1.terminalLogger.info('📋 Paste keydown - bypassing xterm.js key handler');
                return false;
            }
            if (document.body.classList.contains('panel-navigation-enabled') &&
                event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey &&
                !event.metaKey &&
                event.key.toLowerCase() === 'p') {
                return false;
            }
            if (document.body.classList.contains('panel-navigation-mode')) {
                const key = event.key.toLowerCase();
                if (key === 'h' ||
                    key === 'j' ||
                    key === 'k' ||
                    key === 'l' ||
                    key === 'arrowleft' ||
                    key === 'arrowright' ||
                    key === 'arrowup' ||
                    key === 'arrowdown' ||
                    key === 'escape' ||
                    key === 'r' ||
                    key === 'd' ||
                    key === 'x') {
                    return false;
                }
            }
            return true;
        });
        const pasteHandler = (event) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) {
                ManagerLogger_1.terminalLogger.warn('📋 Paste event has no clipboardData');
                return;
            }
            const hasImage = Array.from(clipboardData.items).some((item) => item.type.startsWith('image/'));
            if (hasImage) {
                ManagerLogger_1.terminalLogger.info('🖼️ Image in paste event - sending Ctrl+V escape for Claude Code');
                event.preventDefault();
                event.stopImmediatePropagation();
                this.dependencies.coordinator.postMessageToExtension({
                    command: 'input',
                    terminalId,
                    data: '\x16',
                });
                return;
            }
            const text = clipboardData.getData('text/plain');
            if (text) {
                ManagerLogger_1.terminalLogger.info(`📋 Text paste (${text.length} chars) - sending to extension`);
                event.preventDefault();
                event.stopImmediatePropagation();
                this.dependencies.coordinator.postMessageToExtension({
                    command: 'pasteText',
                    terminalId,
                    text,
                });
                return;
            }
            ManagerLogger_1.terminalLogger.warn('📋 Paste event has no text or image content');
        };
        this.dependencies.eventRegistry.register(`terminal-${terminalId}-paste`, terminalContent, 'paste', pasteHandler, true);
    }
    setupShellIntegration(terminal, terminalId) {
        try {
            this.dependencies.coordinator.shellIntegrationManager?.decorateTerminalOutput(terminal, terminalId);
            ManagerLogger_1.terminalLogger.info(`Shell integration decorations added for terminal: ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`Failed to setup shell integration for terminal ${terminalId}:`, error);
        }
    }
}
exports.TerminalInteractionService = TerminalInteractionService;
//# sourceMappingURL=TerminalInteractionService.js.map