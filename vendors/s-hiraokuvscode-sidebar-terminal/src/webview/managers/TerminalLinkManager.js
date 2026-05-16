"use strict";
/**
 * Terminal Link Manager
 *
 * Handles file path and URL link detection in terminal output.
 * Follows VS Code standard terminal link behavior:
 * - Links require modifier key + click to activate (Cmd/Ctrl or Alt depending on settings)
 * - Hover shows underline and pointer cursor when modifier key is pressed
 * - Supports file paths with line:column navigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalLinkManager = void 0;
const ManagerLogger_1 = require("../utils/ManagerLogger");
const BaseManager_1 = require("./BaseManager");
/**
 * Terminal Link Manager
 *
 * Detects clickable file paths in terminal output and opens them in the editor.
 * URL links are handled separately by WebLinksAddon.
 *
 * VS Code Standard Behavior:
 * - When multiCursorModifier is 'alt', Cmd/Ctrl+Click opens links
 * - When multiCursorModifier is 'ctrlCmd', Alt+Click opens links
 * - Hover shows underline when modifier key is pressed
 */
class TerminalLinkManager extends BaseManager_1.BaseManager {
    constructor(coordinator) {
        super('TerminalLinkManager', {
            enableLogging: false,
            enablePerformanceTracking: true,
            enableErrorRecovery: true,
        });
        this.linkProviderDisposables = new Map();
        // Current link modifier setting (updated when settings change)
        // 'alt' means Alt is for multi-cursor, so Cmd/Ctrl opens links
        // 'ctrlCmd' means Cmd/Ctrl is for multi-cursor, so Alt opens links
        this.linkModifier = 'alt';
        // Simple regex to match file paths
        // Matches: /path/to/file, ./relative/path, ../parent/path, C:\windows\path
        this.filePathRegex = /(?:\.{0,2}\/|[A-Za-z]:\\)[^\s"'<>()[\]{}|]+/g;
        this.coordinator = coordinator;
    }
    /**
     * Update link modifier setting
     * Called when VS Code settings change
     */
    setLinkModifier(modifier) {
        this.linkModifier = modifier;
        ManagerLogger_1.terminalLogger.info(`Link modifier updated to: ${modifier}`);
    }
    /**
     * Check if the event has the required modifier key for link activation
     * VS Code uses the OPPOSITE modifier for links:
     * - When multiCursorModifier is 'alt', Cmd/Ctrl+Click opens links
     * - When multiCursorModifier is 'ctrlCmd', Alt+Click opens links
     */
    isValidLinkActivation(event) {
        if (!event)
            return false;
        if (this.linkModifier === 'alt') {
            // Alt is for multi-cursor, so Cmd/Ctrl opens links
            return event.metaKey || event.ctrlKey;
        }
        else {
            // Cmd/Ctrl is for multi-cursor, so Alt opens links
            return event.altKey;
        }
    }
    doInitialize() {
        ManagerLogger_1.terminalLogger.info('TerminalLinkManager initialized');
    }
    /**
     * Register link provider for a terminal
     */
    registerTerminalLinkHandlers(terminal, terminalId) {
        try {
            // Dispose existing provider if any
            this.linkProviderDisposables.get(terminalId)?.dispose();
            const disposable = terminal.registerLinkProvider({
                provideLinks: (lineNumber, callback) => {
                    const links = this.findLinksInLine(terminal, lineNumber, terminalId);
                    callback(links);
                },
            });
            this.linkProviderDisposables.set(terminalId, disposable);
            ManagerLogger_1.terminalLogger.debug(`Link provider registered for ${terminalId}`);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`Failed to register link provider for ${terminalId}:`, error);
        }
    }
    /**
     * Find all file links in a terminal line
     */
    findLinksInLine(terminal, lineNumber, terminalId) {
        try {
            const line = terminal.buffer.active.getLine(lineNumber - 1);
            if (!line)
                return [];
            const text = line.translateToString(false);
            return this.extractFileLinks(text, lineNumber, terminalId);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn('Error finding links:', error);
            return [];
        }
    }
    /**
     * Extract file links from text
     * Returns ILink objects with VS Code standard behavior:
     * - activate: Opens file only when modifier key is pressed
     * - decorations: Shows underline and pointer cursor
     * - hover/leave: Visual feedback for link state
     */
    extractFileLinks(text, lineNumber, terminalId) {
        const links = [];
        const seen = new Set();
        this.filePathRegex.lastIndex = 0;
        let match;
        while ((match = this.filePathRegex.exec(text)) !== null) {
            const raw = match[0];
            const cleaned = this.cleanLinkText(raw);
            if (!cleaned)
                continue;
            // Avoid duplicates
            const key = `${match.index}:${cleaned}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            // Parse path and optional line:column
            const parsed = this.parseFileLink(cleaned);
            if (!parsed)
                continue;
            // Calculate link position
            const startX = match.index + 1;
            const endX = startX + cleaned.length;
            // Create link with VS Code standard behavior
            const link = {
                text: cleaned,
                range: {
                    start: { x: startX, y: lineNumber },
                    end: { x: endX, y: lineNumber },
                },
                // VS Code standard: show underline and pointer cursor when hovering
                decorations: {
                    pointerCursor: true,
                    underline: true,
                },
                // Activate only when modifier key is pressed (VS Code standard)
                activate: (event, linkText) => {
                    // Check if the correct modifier key is pressed
                    if (!this.isValidLinkActivation(event)) {
                        ManagerLogger_1.terminalLogger.debug(`Link activation blocked - modifier key not pressed: ${linkText}`);
                        return;
                    }
                    ManagerLogger_1.terminalLogger.info(`🔗 File link activated: ${linkText} (meta=${event.metaKey}, ctrl=${event.ctrlKey}, alt=${event.altKey})`);
                    this.openFile(parsed, terminalId);
                },
                // Optional: hover callback for additional visual feedback
                hover: (_event, _linkText) => {
                    // xterm.js handles the visual decorations automatically
                    // This callback can be used for additional hover effects if needed
                },
                // Optional: leave callback for cleanup
                leave: (_event, _linkText) => {
                    // Cleanup any additional hover effects if needed
                },
            };
            links.push(link);
        }
        return links;
    }
    /**
     * Clean trailing punctuation and brackets from link text
     */
    cleanLinkText(text) {
        if (!text)
            return null;
        // Remove trailing punctuation that's likely not part of the path
        let cleaned = text.replace(/[,;:.'"`)\]}>]+$/, '');
        // Handle matched brackets/quotes at the end
        const brackets = { ')': '(', ']': '[', '}': '{', '>': '<' };
        while (cleaned.length > 0) {
            const lastChar = cleaned[cleaned.length - 1];
            if (lastChar === undefined)
                break;
            const openChar = brackets[lastChar];
            if (openChar && !cleaned.includes(openChar)) {
                cleaned = cleaned.slice(0, -1);
            }
            else {
                break;
            }
        }
        return cleaned || null;
    }
    /**
     * Parse file path with optional :line:column suffix
     *
     * Examples:
     *   /path/to/file.ts        -> { path: '/path/to/file.ts' }
     *   /path/to/file.ts:10     -> { path: '/path/to/file.ts', line: 10 }
     *   /path/to/file.ts:10:5   -> { path: '/path/to/file.ts', line: 10, column: 5 }
     *   C:\path\file.ts         -> { path: 'C:\path\file.ts' }
     */
    parseFileLink(text) {
        // Skip URLs
        if (text.includes('://'))
            return null;
        // Match path with optional :line:column at the end
        const match = text.match(/^(.+?)(?::(\d+)(?::(\d+))?)?$/);
        if (!match || !match[1])
            return null;
        const path = match[1];
        // Validate it looks like a file path
        if (!this.isValidFilePath(path))
            return null;
        return {
            path,
            line: match[2] ? parseInt(match[2], 10) : undefined,
            column: match[3] ? parseInt(match[3], 10) : undefined,
        };
    }
    /**
     * Check if a string looks like a valid file path
     */
    isValidFilePath(path) {
        // Must start with /, ./, ../, or drive letter
        const hasPathPrefix = /^(\/|\.\.?\/|[A-Za-z]:\\)/.test(path);
        if (!hasPathPrefix)
            return false;
        // Must have at least one path separator
        const hasPathSeparator = path.includes('/') || path.includes('\\');
        return hasPathSeparator;
    }
    /**
     * Open a file in the editor
     */
    openFile(link, terminalId) {
        this.coordinator?.postMessageToExtension({
            command: 'openTerminalLink',
            linkType: 'file',
            filePath: link.path,
            lineNumber: link.line,
            columnNumber: link.column,
            terminalId,
            timestamp: Date.now(),
        });
    }
    /**
     * Open a URL in the browser (kept for compatibility)
     */
    openUrlFromTerminal(url, terminalId) {
        this.coordinator?.postMessageToExtension({
            command: 'openTerminalLink',
            linkType: 'url',
            url,
            terminalId,
            timestamp: Date.now(),
        });
    }
    /**
     * Unregister link provider for a terminal
     */
    unregisterTerminalLinkProvider(terminalId) {
        const disposable = this.linkProviderDisposables.get(terminalId);
        if (disposable) {
            disposable.dispose();
            this.linkProviderDisposables.delete(terminalId);
        }
    }
    /**
     * Get all registered terminal IDs
     */
    getRegisteredTerminals() {
        return Array.from(this.linkProviderDisposables.keys());
    }
    doDispose() {
        this.linkProviderDisposables.forEach((d) => d.dispose());
        this.linkProviderDisposables.clear();
        ManagerLogger_1.terminalLogger.info('TerminalLinkManager disposed');
    }
}
exports.TerminalLinkManager = TerminalLinkManager;
//# sourceMappingURL=TerminalLinkManager.js.map