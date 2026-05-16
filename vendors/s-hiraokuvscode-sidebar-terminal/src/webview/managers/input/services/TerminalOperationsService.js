"use strict";
/**
 * Terminal Operations Service
 *
 * Handles terminal-specific operations like scrolling, copy, paste, etc.
 * Extracted from InputManager for better separation of concerns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalOperationsService = void 0;
/**
 * TerminalOperationsService
 *
 * Responsibilities:
 * - Terminal scrolling operations
 * - Terminal clear operations
 * - Copy/paste operations
 * - Find operations
 * - Word/line navigation operations
 */
class TerminalOperationsService {
    constructor(logger, emitInteractionEvent) {
        this.logger = logger;
        this.emitInteractionEvent = emitInteractionEvent;
    }
    /**
     * Handle terminal scrolling
     */
    scrollTerminal(direction, manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            this.logger('No active terminal for scrolling');
            return;
        }
        const terminalInstance = manager.getTerminalInstance(activeTerminalId);
        if (!terminalInstance) {
            this.logger(`Terminal instance not found: ${activeTerminalId}`);
            return;
        }
        const terminal = terminalInstance.terminal;
        switch (direction) {
            case 'up':
                terminal.scrollLines(-1);
                break;
            case 'down':
                terminal.scrollLines(1);
                break;
            case 'top':
                terminal.scrollToTop();
                break;
            case 'bottom':
                terminal.scrollToBottom();
                break;
            case 'previousCommand':
                const terminalRows = terminal.rows || 24;
                terminal.scrollLines(-Math.floor(terminalRows / 2));
                break;
            case 'nextCommand':
                const rows = terminal.rows || 24;
                terminal.scrollLines(Math.floor(rows / 2));
                break;
        }
        this.logger(`Scrolled terminal ${activeTerminalId} ${direction}`);
    }
    /**
     * Handle terminal clear operation
     */
    clearTerminal(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            this.logger('No active terminal for clear operation');
            return;
        }
        const terminalInstance = manager.getTerminalInstance(activeTerminalId);
        if (terminalInstance) {
            terminalInstance.terminal.clear();
            this.logger(`Cleared terminal ${activeTerminalId}`);
        }
    }
    /**
     * Handle terminal copy selection
     */
    copySelection(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        const terminalInstance = manager.getTerminalInstance(activeTerminalId);
        if (!terminalInstance) {
            return;
        }
        const terminal = terminalInstance.terminal;
        const selection = terminal.getSelection();
        if (selection && selection.length > 0) {
            // Send to Extension for clipboard write via VS Code API
            this.emitInteractionEvent('copy-selection', activeTerminalId, { text: selection }, manager);
            this.logger(`Copy selection: ${selection.length} characters`);
        }
        else {
            this.logger('No selection to copy');
        }
    }
    /**
     * Handle terminal paste
     */
    paste(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        // Request clipboard content from Extension
        this.emitInteractionEvent('paste-request', activeTerminalId, {}, manager);
        this.logger('Paste requested');
    }
    /**
     * Handle terminal select all
     */
    selectAll(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        const terminalInstance = manager.getTerminalInstance(activeTerminalId);
        if (terminalInstance) {
            terminalInstance.terminal.selectAll();
            this.logger(`Selected all in terminal ${activeTerminalId}`);
        }
    }
    /**
     * Handle terminal find focus
     */
    focusFind(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        this.emitInteractionEvent('focus-find', activeTerminalId, {}, manager);
        this.logger('Find focused');
    }
    /**
     * Handle terminal find next
     */
    findNext(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        this.emitInteractionEvent('find-next', activeTerminalId, {}, manager);
        this.logger('Find next');
    }
    /**
     * Handle terminal find previous
     */
    findPrevious(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        this.emitInteractionEvent('find-previous', activeTerminalId, {}, manager);
        this.logger('Find previous');
    }
    /**
     * Handle terminal hide find
     */
    hideFind(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        this.emitInteractionEvent('hide-find', activeTerminalId, {}, manager);
        this.logger('Find hidden');
    }
    /**
     * Handle terminal delete word left
     */
    deleteWordLeft(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        // Send Ctrl+W or equivalent based on shell
        this.emitInteractionEvent('input', activeTerminalId, { data: '\x17' }, manager);
        this.logger('Delete word left');
    }
    /**
     * Handle terminal delete word right
     */
    deleteWordRight(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        // Send Alt+D or equivalent based on shell
        this.emitInteractionEvent('input', activeTerminalId, { data: '\x1bd' }, manager);
        this.logger('Delete word right');
    }
    /**
     * Handle terminal move to line start
     */
    moveToLineStart(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        // Send Ctrl+A (readline home)
        this.emitInteractionEvent('input', activeTerminalId, { data: '\x01' }, manager);
        this.logger('Move to line start');
    }
    /**
     * Handle terminal move to line end
     */
    moveToLineEnd(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        // Send Ctrl+E (readline end)
        this.emitInteractionEvent('input', activeTerminalId, { data: '\x05' }, manager);
        this.logger('Move to line end');
    }
    /**
     * Handle terminal size to content
     */
    sizeToContent(manager) {
        const activeTerminalId = manager.getActiveTerminalId();
        if (!activeTerminalId) {
            return;
        }
        this.emitInteractionEvent('size-to-content', activeTerminalId, {}, manager);
        this.logger('Size to content');
    }
}
exports.TerminalOperationsService = TerminalOperationsService;
//# sourceMappingURL=TerminalOperationsService.js.map