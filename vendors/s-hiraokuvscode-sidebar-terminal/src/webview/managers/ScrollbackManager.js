"use strict";
/**
 * Manages terminal scrollback buffer with ANSI color preservation,
 * wrapped line processing, and empty line trimming.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollbackManager = void 0;
const ManagerLogger_1 = require("../utils/ManagerLogger");
const BaseManager_1 = require("./BaseManager");
class ScrollbackManager extends BaseManager_1.BaseManager {
    constructor() {
        super('ScrollbackManager', {
            enableLogging: false, // Use terminalLogger instead
            enablePerformanceTracking: true,
            enableErrorRecovery: true,
        });
        this.serializeAddons = new Map();
        this.terminals = new Map();
    }
    doInitialize() {
        this.logger('ScrollbackManager initialized');
    }
    registerTerminal(terminalId, terminal, serializeAddon) {
        this.terminals.set(terminalId, terminal);
        this.serializeAddons.set(terminalId, serializeAddon);
        ManagerLogger_1.terminalLogger.info(`📋 ScrollbackManager: Registered terminal ${terminalId}`);
    }
    unregisterTerminal(terminalId) {
        this.terminals.delete(terminalId);
        this.serializeAddons.delete(terminalId);
        ManagerLogger_1.terminalLogger.info(`🗑️ ScrollbackManager: Unregistered terminal ${terminalId}`);
    }
    saveScrollback(terminalId, options) {
        ManagerLogger_1.terminalLogger.debug(`💾 ScrollbackManager: Saving scrollback for ${terminalId}`);
        const terminal = this.terminals.get(terminalId);
        const serializeAddon = this.serializeAddons.get(terminalId);
        if (!terminal || !serializeAddon) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Terminal or addon not found for ${terminalId}`);
            return null;
        }
        try {
            const defaultOptions = {
                scrollback: 1000,
                excludeModes: false,
                excludeAltBuffer: true,
                trimEmptyLines: true,
                preserveWrappedLines: true,
            };
            const mergedOptions = { ...defaultOptions, ...options };
            // Serialize terminal content with ANSI colors
            const serializedContent = serializeAddon.serialize({
                scrollback: mergedOptions.scrollback,
                excludeModes: mergedOptions.excludeModes,
                excludeAltBuffer: mergedOptions.excludeAltBuffer,
            });
            const originalSize = serializedContent.length;
            let processedContent = serializedContent;
            // Process wrapped lines if enabled
            if (mergedOptions.preserveWrappedLines) {
                processedContent = this.processWrappedLines(terminal, processedContent);
            }
            // Trim empty lines if enabled
            if (mergedOptions.trimEmptyLines) {
                processedContent = this.trimEmptyLines(processedContent);
            }
            const trimmedSize = processedContent.length;
            const lineCount = processedContent.split('\n').length;
            ManagerLogger_1.terminalLogger.info(`✅ ScrollbackManager: Saved ${terminalId} - ${lineCount} lines, ` +
                `${originalSize} → ${trimmedSize} chars (${((1 - trimmedSize / originalSize) * 100).toFixed(1)}% reduction)`);
            return {
                content: processedContent,
                lineCount,
                originalSize,
                trimmedSize,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`❌ ScrollbackManager: Failed to save scrollback for ${terminalId}:`, error);
            return null;
        }
    }
    restoreScrollback(terminalId, content) {
        ManagerLogger_1.terminalLogger.debug(`🔄 ScrollbackManager: Restoring scrollback for ${terminalId}`);
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Terminal not found for restore: ${terminalId}`);
            return false;
        }
        try {
            // Clear terminal before restore
            terminal.clear();
            // Write content line by line for better control
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.length > 0) {
                    terminal.writeln(line);
                }
            }
            ManagerLogger_1.terminalLogger.info(`✅ ScrollbackManager: Restored ${terminalId} - ${lines.length} lines`);
            return true;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.error(`❌ ScrollbackManager: Failed to restore scrollback for ${terminalId}:`, error);
            return false;
        }
    }
    /**
     * Get full buffer line including wrapped continuation lines.
     * Detects wrapped lines using line.isWrapped and joins them backwards.
     */
    getFullBufferLine(line, lineIndex, buffer) {
        try {
            let fullLine = line.translateToString(true);
            let currentIndex = lineIndex;
            let currentLine = line;
            while (currentIndex > 0 && currentLine.isWrapped) {
                currentIndex--;
                const prevLine = buffer.getLine(currentIndex);
                if (prevLine) {
                    fullLine = prevLine.translateToString(true) + fullLine;
                    currentLine = prevLine;
                }
                else {
                    break;
                }
            }
            return fullLine;
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Failed to get full buffer line at index ${lineIndex}:`, error);
            return '';
        }
    }
    /** Iterates buffer from startLine backwards to 0. */
    *getBufferReverseIterator(buffer, startLine) {
        try {
            for (let i = startLine; i >= 0; i--) {
                const line = buffer.getLine(i);
                if (line) {
                    yield line;
                }
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Error during buffer reverse iteration:`, error);
        }
    }
    processWrappedLines(terminal, content) {
        try {
            const buffer = terminal.buffer.active;
            const lines = [];
            let currentLine = '';
            let skipNextWrapped = false;
            const baseRow = buffer.baseY;
            const cursorRow = buffer.cursorY;
            const totalLines = baseRow + cursorRow + 1;
            for (let i = 0; i < totalLines; i++) {
                const line = buffer.getLine(i);
                if (!line)
                    continue;
                const lineText = line.translateToString(true);
                if (line.isWrapped && !skipNextWrapped) {
                    // This line is wrapped from previous - append to current
                    currentLine += lineText;
                }
                else {
                    // Start of new logical line
                    if (currentLine.length > 0) {
                        lines.push(currentLine);
                    }
                    currentLine = lineText;
                    skipNextWrapped = false;
                }
            }
            // Add final line
            if (currentLine.length > 0) {
                lines.push(currentLine);
            }
            return lines.join('\n');
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Failed to process wrapped lines, using original content:`, error);
            return content;
        }
    }
    /** Removes leading and trailing empty lines while preserving meaningful whitespace. */
    trimEmptyLines(content) {
        try {
            const lines = content.split('\n');
            while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
                lines.pop();
            }
            while (lines.length > 0 && lines[0].trim().length === 0) {
                lines.shift();
            }
            return lines.join('\n');
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn(`⚠️ ScrollbackManager: Failed to trim empty lines, using original content:`, error);
            return content;
        }
    }
    getStats() {
        return {
            registeredTerminals: this.terminals.size,
            terminals: Array.from(this.terminals.keys()),
        };
    }
    doDispose() {
        this.terminals.clear();
        this.serializeAddons.clear();
        ManagerLogger_1.terminalLogger.info('🧹 ScrollbackManager: Disposed');
    }
}
exports.ScrollbackManager = ScrollbackManager;
//# sourceMappingURL=ScrollbackManager.js.map