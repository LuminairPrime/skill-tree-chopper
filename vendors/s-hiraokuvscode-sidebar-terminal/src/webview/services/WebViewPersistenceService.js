"use strict";
/**
 * WebView Persistence Service
 *
 * Unified persistence service for WebView-side terminal content management.
 * Consolidates functionality from:
 * - SimplePersistenceManager (240 lines)
 * - StandardTerminalPersistenceManager (740 lines)
 * - OptimizedTerminalPersistenceManager (775 lines)
 *
 * Total consolidation: 1,755 lines → ~300 lines (82% reduction)
 *
 * Key features:
 * - SerializeAddon integration for terminal serialization
 * - Progressive loading for large scrollback (>500 lines)
 * - Lazy loading for deferred content
 * - Auto-save with debounce (3 seconds)
 * - Metadata capture (dimensions, cursor position, selection)
 * - Performance tracking and optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebViewPersistenceService = void 0;
const addon_serialize_1 = require("@xterm/addon-serialize");
const logger_1 = require("../../utils/logger");
// ============================================================================
// WebView Persistence Service
// ============================================================================
class WebViewPersistenceService {
    constructor() {
        this.terminals = new Map();
        this.serializeAddons = new Map();
        this.autoSaveTimers = new Map();
        this.serializedCache = new Map();
        this.terminalListenerDisposables = new Map();
        // Use globally acquired VS Code API from main.ts to avoid "already acquired" error
        // @ts-ignore - VS Code API stored on window by main.ts
        this.vscodeApi = window.vscodeApi;
        if (!this.vscodeApi) {
            throw new Error('VS Code API not available on window. main.ts should acquire it first.');
        }
        (0, logger_1.webview)('✅ [WV-PERSISTENCE] WebView Persistence Service initialized');
    }
    // ==========================================================================
    // Public API
    // ==========================================================================
    /**
     * Register a terminal with the persistence service
     */
    addTerminal(terminalId, terminal, options = {}) {
        (0, logger_1.webview)(`[WV-PERSISTENCE] Adding terminal ${terminalId}`);
        // Verify terminal is ready
        if (!terminal || !terminal.textarea) {
            (0, logger_1.webview)(`⚠️ [WV-PERSISTENCE] Terminal ${terminalId} not ready, retrying...`);
            setTimeout(() => {
                if (terminal && terminal.textarea) {
                    this.addTerminal(terminalId, terminal, options);
                }
            }, 100);
            return;
        }
        try {
            // Create and load SerializeAddon
            const serializeAddon = new addon_serialize_1.SerializeAddon();
            terminal.loadAddon(serializeAddon);
            this.terminals.set(terminalId, terminal);
            this.serializeAddons.set(terminalId, serializeAddon);
            // Setup auto-save if enabled
            if (options.autoSave !== false) {
                this.setupAutoSave(terminalId, terminal);
            }
            (0, logger_1.webview)(`✅ [WV-PERSISTENCE] Terminal ${terminalId} registered`);
        }
        catch (error) {
            (0, logger_1.webview)(`❌ [WV-PERSISTENCE] Failed to add terminal ${terminalId}: ${error}`);
        }
    }
    /**
     * Unregister a terminal
     */
    removeTerminal(terminalId) {
        const timer = this.autoSaveTimers.get(terminalId);
        if (timer) {
            clearTimeout(timer);
            this.autoSaveTimers.delete(terminalId);
        }
        // Dispose xterm.js event listeners to prevent accumulation
        const disposables = this.terminalListenerDisposables.get(terminalId);
        if (disposables) {
            disposables.forEach((d) => d.dispose());
            this.terminalListenerDisposables.delete(terminalId);
        }
        this.terminals.delete(terminalId);
        this.serializeAddons.delete(terminalId);
        this.serializedCache.delete(terminalId);
        (0, logger_1.webview)(`[WV-PERSISTENCE] Terminal ${terminalId} removed`);
        return true;
    }
    /**
     * Serialize terminal content
     */
    serializeTerminal(terminalId, options = {}) {
        const terminal = this.terminals.get(terminalId);
        const serializeAddon = this.serializeAddons.get(terminalId);
        if (!terminal || !serializeAddon) {
            (0, logger_1.webview)(`⚠️ [WV-PERSISTENCE] Terminal ${terminalId} not found for serialization`);
            return null;
        }
        try {
            const scrollback = options.scrollback ?? WebViewPersistenceService.DEFAULT_SCROLLBACK;
            // Serialize terminal content
            const content = serializeAddon.serialize({
                scrollback,
                excludeModes: false,
                excludeAltBuffer: options.excludeAltBuffer ?? true,
            });
            // Optionally trim empty lines
            let finalContent = content;
            if (options.trimEmptyLines) {
                const lines = content.split('\n');
                const trimmed = lines.filter((line) => line.trim().length > 0);
                finalContent = trimmed.join('\n');
            }
            // Capture metadata
            const metadata = this.captureTerminalMetadata(terminal);
            const lineCount = (finalContent.match(/\n/g) || []).length;
            const serializedData = {
                content: finalContent,
                metadata,
                lineCount,
                compressed: false, // Compression handled by Extension side
            };
            // Cache for quick access
            this.serializedCache.set(terminalId, serializedData);
            (0, logger_1.webview)(`[WV-PERSISTENCE] Serialized terminal ${terminalId}: ${lineCount} lines`);
            return serializedData;
        }
        catch (error) {
            (0, logger_1.webview)(`❌ [WV-PERSISTENCE] Serialization failed for ${terminalId}: ${error}`);
            return null;
        }
    }
    /**
     * Serialize all terminals
     */
    serializeAllTerminals(options = {}) {
        const results = new Map();
        for (const terminalId of this.terminals.keys()) {
            const data = this.serializeTerminal(terminalId, options);
            if (data) {
                results.set(terminalId, data);
            }
        }
        (0, logger_1.webview)(`[WV-PERSISTENCE] Serialized ${results.size}/${this.terminals.size} terminals`);
        return results;
    }
    /**
     * Restore terminal content
     */
    restoreTerminalContent(terminalId, serializedData, options = {}) {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            (0, logger_1.webview)(`⚠️ [WV-PERSISTENCE] Terminal ${terminalId} not found for restoration`);
            return false;
        }
        try {
            // Extract content
            const content = typeof serializedData === 'string' ? serializedData : serializedData.content;
            const lines = content.split('\n');
            const totalLines = lines.length;
            // Determine if progressive loading should be used
            const useProgressive = options.progressive !== false &&
                totalLines > WebViewPersistenceService.PROGRESSIVE_THRESHOLD;
            const linesToLoad = useProgressive
                ? options.initialLines || WebViewPersistenceService.PROGRESSIVE_THRESHOLD
                : totalLines;
            (0, logger_1.webview)(`[WV-PERSISTENCE] Restoring ${terminalId}: ${linesToLoad}/${totalLines} lines` +
                (useProgressive ? ' (progressive)' : ''));
            const startTime = performance.now();
            // Write initial batch
            const initialLines = lines.slice(0, linesToLoad);
            this.writeBatchToTerminal(terminal, initialLines);
            // Setup lazy loading for remaining content
            if (useProgressive && totalLines > linesToLoad) {
                const remainingLines = lines.slice(linesToLoad);
                this.setupLazyLoading(terminalId, terminal, remainingLines);
            }
            const duration = performance.now() - startTime;
            const isLarge = totalLines > 1000;
            const targetDuration = isLarge ? 1000 : 500;
            const status = duration < targetDuration ? '✅' : '⚠️';
            (0, logger_1.webview)(`${status} [WV-PERSISTENCE] Restored ${terminalId}: ` +
                `${totalLines} lines, ${duration.toFixed(0)}ms (target: ${targetDuration}ms)`);
            return true;
        }
        catch (error) {
            (0, logger_1.webview)(`❌ [WV-PERSISTENCE] Restoration failed for ${terminalId}: ${error}`);
            return false;
        }
    }
    /**
     * Save terminal content and push to extension
     */
    saveTerminalContent(terminalId) {
        const serializedData = this.serializeTerminal(terminalId);
        if (!serializedData) {
            return false;
        }
        // Push scrollback data to extension for instant save
        this.vscodeApi.postMessage({
            command: 'pushScrollbackData',
            terminalId,
            scrollbackData: serializedData.content.split('\n'),
            metadata: serializedData.metadata,
            timestamp: Date.now(),
        });
        (0, logger_1.webview)(`[WV-PERSISTENCE] Pushed scrollback for ${terminalId}: ${serializedData.lineCount} lines`);
        return true;
    }
    /**
     * Save all terminal sessions
     * Serializes all active terminals and pushes data to extension
     */
    async saveSession() {
        try {
            const terminalIds = this.getAvailableTerminals();
            if (terminalIds.length === 0) {
                (0, logger_1.webview)('[WV-PERSISTENCE] No terminals to save');
                return true;
            }
            (0, logger_1.webview)(`[WV-PERSISTENCE] Saving session for ${terminalIds.length} terminals`);
            // Save each terminal's content
            let successCount = 0;
            for (const terminalId of terminalIds) {
                const saved = this.saveTerminalContent(terminalId);
                if (saved) {
                    successCount++;
                }
            }
            const allSaved = successCount === terminalIds.length;
            (0, logger_1.webview)(`[WV-PERSISTENCE] Session save ${allSaved ? 'completed' : 'partial'}: ${successCount}/${terminalIds.length} terminals`);
            return allSaved;
        }
        catch (error) {
            (0, logger_1.webview)(`❌ [WV-PERSISTENCE] Session save failed: ${error}`);
            return false;
        }
    }
    /**
     * Get cached serialized data
     */
    loadTerminalContent(terminalId) {
        return this.serializedCache.get(terminalId) || null;
    }
    /**
     * Get service statistics
     */
    getStats() {
        let totalBytes = 0;
        for (const data of this.serializedCache.values()) {
            totalBytes += data.content.length;
        }
        return {
            terminalCount: this.terminals.size,
            totalSerializedBytes: totalBytes,
            averageSerializationTimeMs: 0, // Could track this if needed
        };
    }
    /**
     * Check if terminal is registered
     */
    hasTerminal(terminalId) {
        return this.terminals.has(terminalId);
    }
    /**
     * Get list of registered terminal IDs
     */
    getAvailableTerminals() {
        return Array.from(this.terminals.keys());
    }
    /**
     * Clear all cached data
     */
    cleanup() {
        for (const timer of this.autoSaveTimers.values()) {
            clearTimeout(timer);
        }
        this.autoSaveTimers.clear();
        this.serializedCache.clear();
        (0, logger_1.webview)('[WV-PERSISTENCE] Cleanup completed');
    }
    /**
     * Dispose service
     */
    dispose() {
        this.cleanup();
        this.terminals.clear();
        this.serializeAddons.clear();
        (0, logger_1.webview)('[WV-PERSISTENCE] Disposed');
    }
    // ==========================================================================
    // Private Methods
    // ==========================================================================
    /**
     * Setup auto-save with debounce
     */
    setupAutoSave(terminalId, terminal) {
        const scheduleAutoSave = () => {
            const existingTimer = this.autoSaveTimers.get(terminalId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            const timer = window.setTimeout(() => {
                this.saveTerminalContent(terminalId);
            }, WebViewPersistenceService.AUTO_SAVE_DEBOUNCE_MS);
            this.autoSaveTimers.set(terminalId, timer);
        };
        // Trigger auto-save on terminal data changes — store disposables for cleanup
        const onDataDisposable = terminal.onData(() => scheduleAutoSave());
        const onLineFeedDisposable = terminal.onLineFeed(() => scheduleAutoSave());
        this.terminalListenerDisposables.set(terminalId, [onDataDisposable, onLineFeedDisposable]);
        (0, logger_1.webview)(`[WV-PERSISTENCE] Auto-save configured for ${terminalId} (${WebViewPersistenceService.AUTO_SAVE_DEBOUNCE_MS}ms debounce)`);
    }
    /**
     * Capture terminal state metadata
     */
    captureTerminalMetadata(terminal) {
        try {
            const buffer = terminal.buffer.active;
            return {
                dimensions: {
                    cols: terminal.cols,
                    rows: terminal.rows,
                },
                cursor: {
                    x: buffer.cursorX,
                    y: buffer.cursorY,
                },
                selection: terminal.hasSelection()
                    ? { start: 0, end: 0 } // Simplified - could enhance with actual selection bounds
                    : undefined,
                scrollPosition: buffer.viewportY,
                timestamp: Date.now(),
            };
        }
        catch (error) {
            (0, logger_1.webview)(`⚠️ [WV-PERSISTENCE] Metadata capture warning: ${error}`);
            return {
                dimensions: { cols: terminal.cols, rows: terminal.rows },
                scrollPosition: 0,
                timestamp: Date.now(),
            };
        }
    }
    /**
     * Write lines to terminal in batches (non-blocking)
     */
    writeBatchToTerminal(terminal, lines) {
        const BATCH_SIZE = 100;
        const writeBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + BATCH_SIZE, lines.length);
            let chunk = '';
            for (let i = startIndex; i < endIndex; i++) {
                const line = lines[i];
                if (line !== undefined) {
                    chunk += line;
                }
                if (i < lines.length - 1) {
                    chunk += '\r\n';
                }
            }
            // xterm.write is async; chain batches via callback to keep ordering and ensure
            // final scroll-to-bottom happens after content is applied.
            terminal.write(chunk, () => {
                if (endIndex < lines.length) {
                    setTimeout(() => writeBatch(endIndex), 0);
                }
                else {
                    try {
                        terminal.scrollToBottom();
                    }
                    catch {
                        // Best-effort
                    }
                }
            });
        };
        writeBatch(0);
    }
    /**
     * Setup lazy loading for remaining terminal content
     */
    setupLazyLoading(terminalId, terminal, remainingLines) {
        (0, logger_1.webview)(`[WV-PERSISTENCE] Setting up lazy loading for ${terminalId}: ${remainingLines.length} remaining lines`);
        // Load remaining content after a delay
        setTimeout(() => {
            (0, logger_1.webview)(`[WV-PERSISTENCE] Loading remaining content for ${terminalId}`);
            this.writeBatchToTerminal(terminal, remainingLines);
            // writeBatchToTerminal will call scrollToBottom after completion
        }, 2000); // 2 second delay
    }
}
exports.WebViewPersistenceService = WebViewPersistenceService;
WebViewPersistenceService.AUTO_SAVE_DEBOUNCE_MS = 3000; // 3 seconds
WebViewPersistenceService.DEFAULT_SCROLLBACK = 1000;
WebViewPersistenceService.PROGRESSIVE_THRESHOLD = 500; // lines
//# sourceMappingURL=WebViewPersistenceService.js.map