"use strict";
/**
 * Handles output buffering, debouncing, and performance optimizations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceManager = void 0;
const webview_1 = require("../constants/webview");
const BaseManager_1 = require("./BaseManager");
// import { performanceLogger } from '../utils/ManagerLogger';
const ResizeManager_1 = require("../utils/ResizeManager");
const DOMUtils_1 = require("../utils/DOMUtils");
const ENABLE_WEBVIEW_DEBUG_LOGS = Boolean(typeof globalThis !== 'undefined' &&
    (globalThis.SECONDARY_TERMINAL_DEBUG_LOGS === true ||
        (typeof localStorage !== 'undefined' &&
            typeof localStorage.getItem === 'function' &&
            localStorage.getItem('SECONDARY_TERMINAL_DEBUG_LOGS') === 'true')));
class PerformanceManager extends BaseManager_1.BaseManager {
    constructor() {
        super('PerformanceManager', {
            enableLogging: ENABLE_WEBVIEW_DEBUG_LOGS,
            enableValidation: false,
            enableErrorRecovery: true,
            customLogger: ENABLE_WEBVIEW_DEBUG_LOGS ? undefined : () => { },
        });
        this.bufferEntries = new Map();
        this.BUFFER_FLUSH_INTERVAL = webview_1.SPLIT_CONSTANTS.BUFFER_FLUSH_INTERVAL;
        this.MAX_BUFFER_SIZE = webview_1.SPLIT_CONSTANTS.MAX_BUFFER_SIZE;
        this.debugLoggingEnabled = ENABLE_WEBVIEW_DEBUG_LOGS;
        // CLI Agent mode for performance optimization
        this.isCliAgentMode = false;
        this.coordinator = null;
        if (this.debugLoggingEnabled) {
            this.logger('initialization', 'starting');
        }
    }
    scheduleOutputBuffer(data, targetTerminal) {
        const entry = this.getOrCreateBufferEntry(targetTerminal);
        const normalizedData = data.indexOf('\f') === -1 ? data : data.replace(/\f+/g, '\u001b[2J\u001b[H');
        // Enhanced buffering strategy for CLI Agent compatibility
        const isLargeOutput = normalizedData.length >= 500; // Reduced from 1000 to 500 for better responsiveness
        const bufferFull = entry.data.length >= this.MAX_BUFFER_SIZE;
        const isSmallInput = normalizedData.length <= 10; // Immediate flush for small inputs (typing)
        const isModerateOutput = normalizedData.length >= 50; // Reduced from 100 to 50
        // Immediate flush conditions (prioritized for cursor accuracy and input responsiveness)
        const shouldFlushImmediately = isLargeOutput || bufferFull || isSmallInput || (this.isCliAgentMode && isModerateOutput);
        if (shouldFlushImmediately) {
            this.flushEntry(targetTerminal, entry);
            // xterm.js automatically preserves scroll position if user has scrolled up
            try {
                targetTerminal.write(normalizedData);
            }
            catch (error) {
                if (this.debugLoggingEnabled) {
                    this.logger(`Error during immediate write: ${error}`);
                }
                else {
                    console.error('[PerformanceManager] Error during immediate write:', error);
                }
            }
            if (this.debugLoggingEnabled) {
                let reason;
                if (isLargeOutput) {
                    reason = 'large output';
                }
                else if (bufferFull) {
                    reason = 'buffer full';
                }
                else if (isSmallInput) {
                    reason = 'small input (typing)';
                }
                else if (this.isCliAgentMode && isModerateOutput) {
                    reason = 'CLI Agent mode';
                }
                else {
                    reason = 'unknown';
                }
                this.logger(`Immediate write: ${normalizedData.length} chars (${reason})`);
            }
        }
        else {
            entry.data.push(normalizedData);
            this.scheduleEntryFlush(targetTerminal, entry);
            if (this.debugLoggingEnabled) {
                this.logger(`Buffered write: ${normalizedData.length} chars (buffer: ${entry.data.length}, CLI Agent: ${this.isCliAgentMode})`);
            }
        }
    }
    getOrCreateBufferEntry(terminal) {
        let entry = this.bufferEntries.get(terminal);
        if (!entry) {
            entry = { data: [], timer: null, timerType: null };
            this.bufferEntries.set(terminal, entry);
        }
        return entry;
    }
    scheduleEntryFlush(terminal, entry) {
        if (entry.timer === null) {
            // Use requestAnimationFrame for display-synchronized flushing.
            // For CLI Agent mode with very low latency needs, use setTimeout fallback.
            const useRAF = !this.isCliAgentMode;
            if (useRAF) {
                // requestAnimationFrame syncs with display refresh (typically ~16ms at 60Hz)
                entry.timer = requestAnimationFrame(() => {
                    try {
                        this.flushEntryByTerminal(terminal);
                    }
                    catch (error) {
                        if (this.debugLoggingEnabled) {
                            this.logger(`Error during rAF buffer flush: ${error}`);
                        }
                        else {
                            console.error('[PerformanceManager] Error during rAF buffer flush:', error);
                        }
                        const currentEntry = this.bufferEntries.get(terminal);
                        if (currentEntry) {
                            currentEntry.timer = null;
                            currentEntry.timerType = null;
                            currentEntry.data.length = 0;
                        }
                    }
                });
                entry.timerType = 'raf';
            }
            else {
                // CLI Agent mode: use setTimeout with fast interval for lower latency
                const flushInterval = webview_1.SPLIT_CONSTANTS.CLI_AGENT_FLUSH_INTERVAL ?? Math.max(8, this.BUFFER_FLUSH_INTERVAL / 2);
                entry.timer = window.setTimeout(() => {
                    try {
                        this.flushEntryByTerminal(terminal);
                    }
                    catch (error) {
                        if (this.debugLoggingEnabled) {
                            this.logger(`Error during buffer flush: ${error}`);
                        }
                        else {
                            console.error('[PerformanceManager] Error during buffer flush:', error);
                        }
                        const currentEntry = this.bufferEntries.get(terminal);
                        if (currentEntry) {
                            currentEntry.timer = null;
                            currentEntry.timerType = null;
                            currentEntry.data.length = 0;
                        }
                    }
                }, flushInterval);
                entry.timerType = 'timeout';
            }
            if (this.debugLoggingEnabled) {
                this.logger(`Scheduled flush via ${useRAF ? 'rAF' : 'setTimeout'} (CLI Agent: ${this.isCliAgentMode}, buffer size: ${entry.data.length})`);
            }
        }
    }
    flushEntryByTerminal(terminal) {
        const entry = this.bufferEntries.get(terminal);
        if (entry) {
            this.flushEntry(terminal, entry);
        }
    }
    flushEntry(terminal, entry) {
        this.clearEntryTimer(entry);
        if (entry.data.length === 0) {
            return;
        }
        const bufferedData = entry.data.join('');
        entry.data.length = 0;
        try {
            terminal.write(bufferedData);
            if (this.debugLoggingEnabled) {
                this.logger(`Flushed buffer: ${bufferedData.length} chars`);
            }
        }
        catch (error) {
            if (this.debugLoggingEnabled) {
                this.logger(`Error during buffer flush: ${error}`);
            }
            else {
                console.error('[PerformanceManager] Error during buffer flush:', error);
            }
        }
    }
    flushOutputBuffer() {
        this.bufferEntries.forEach((entry, terminal) => {
            this.flushEntry(terminal, entry);
        });
    }
    bufferedWrite(data, targetTerminal, terminalId) {
        try {
            this.handleDSRQuery(data, targetTerminal, terminalId);
        }
        catch (error) {
            // Log error but don't break output flow
            if (this.debugLoggingEnabled) {
                this.logger(`Error handling DSR query: ${error}`);
            }
        }
        this.scheduleOutputBuffer(data, targetTerminal);
    }
    /** Handle DSR (Device Status Report) - respond with cursor position when \x1b[6n is received. */
    handleDSRQuery(data, terminal, terminalId) {
        if (!PerformanceManager.DSR_PATTERN.test(data)) {
            return;
        }
        if (!this.coordinator) {
            if (this.debugLoggingEnabled) {
                this.logger('DSR query detected but coordinator not available');
            }
            return;
        }
        if (!terminal?.buffer?.active) {
            if (this.debugLoggingEnabled) {
                this.logger('DSR query detected but terminal buffer not available');
            }
            return;
        }
        const buffer = terminal.buffer.active;
        const row = (buffer.cursorY ?? 0) + 1;
        const col = (buffer.cursorX ?? 0) + 1;
        const response = `\x1b[${row};${col}R`;
        if (this.debugLoggingEnabled) {
            this.logger(`DSR query detected, responding with cursor position: row=${row}, col=${col}`);
        }
        this.coordinator.postMessageToExtension({
            command: 'input',
            terminalId,
            data: response,
            timestamp: Date.now(),
        });
    }
    doInitialize() {
        if (this.debugLoggingEnabled) {
            this.logger('initialization', 'completed');
        }
    }
    doDispose() {
        if (this.debugLoggingEnabled) {
            this.logger('disposal', 'starting');
        }
        this.bufferEntries.forEach((entry) => {
            this.clearEntryTimer(entry);
            entry.data.length = 0;
        });
        this.bufferEntries.clear();
        this.coordinator = null;
        if (this.debugLoggingEnabled) {
            this.logger('disposal', 'completed');
        }
    }
    initializePerformance(coordinator) {
        this.coordinator = coordinator;
        if (this.debugLoggingEnabled) {
            this.logger('initialization', 'completed');
        }
    }
    debouncedResize(cols, rows, terminal, fitAddon) {
        const resizeKey = `terminal-resize-${cols}x${rows}`;
        if (this.debugLoggingEnabled) {
            this.logger(`Scheduling debounced resize: ${cols}x${rows}`);
        }
        ResizeManager_1.ResizeManager.debounceResize(resizeKey, async () => {
            try {
                terminal.resize(cols, rows);
                const container = terminal.element?.parentElement;
                if (container) {
                    DOMUtils_1.DOMUtils.resetXtermInlineStyles(container);
                }
                fitAddon.fit();
                if (this.debugLoggingEnabled) {
                    this.logger(`Debounced resize applied: ${cols}x${rows}`);
                }
            }
            catch (error) {
                if (this.debugLoggingEnabled) {
                    this.logger(`Error during debounced resize: ${error}`);
                }
                else {
                    console.error('[PerformanceManager] Error during debounced resize:', error);
                }
                throw error; // Let ResizeManager handle the error
            }
        }, {
            delay: webview_1.SPLIT_CONSTANTS.RESIZE_DEBOUNCE_DELAY,
            onStart: () => {
                if (this.debugLoggingEnabled) {
                    this.logger(`Starting resize operation for ${cols}x${rows}`);
                }
            },
            onComplete: () => {
                if (this.debugLoggingEnabled) {
                    this.logger(`Completed resize operation for ${cols}x${rows}`);
                }
            },
        });
    }
    setCliAgentMode(isActive) {
        if (this.isCliAgentMode !== isActive) {
            this.isCliAgentMode = isActive;
            if (this.debugLoggingEnabled) {
                this.logger(`CLI Agent mode: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
            }
            if (!isActive) {
                this.flushOutputBuffer();
            }
        }
    }
    getCliAgentMode() {
        return this.isCliAgentMode;
    }
    getBufferStats() {
        let bufferSize = 0;
        let isFlushScheduled = false;
        this.bufferEntries.forEach((entry) => {
            bufferSize += entry.data.length;
            if (entry.timer !== null) {
                isFlushScheduled = true;
            }
        });
        return {
            bufferSize,
            isFlushScheduled,
            isCliAgentMode: this.isCliAgentMode,
            currentTerminal: this.bufferEntries.size > 0,
        };
    }
    /**
     * Remove a terminal from the buffer entries map to allow GC.
     * Flushes any pending data before removal.
     * Should be called when a terminal is destroyed.
     */
    removeTerminal(terminal) {
        const entry = this.bufferEntries.get(terminal);
        if (entry) {
            this.flushEntry(terminal, entry);
            this.clearEntryTimer(entry);
            this.bufferEntries.delete(terminal);
            if (this.debugLoggingEnabled) {
                this.logger('Removed terminal from buffer entries');
            }
        }
    }
    forceFlush() {
        if (this.debugLoggingEnabled) {
            this.logger('Force flushing all buffers');
        }
        this.flushOutputBuffer();
    }
    clearBuffers() {
        if (this.debugLoggingEnabled) {
            this.logger('Clearing all buffers without writing');
        }
        this.bufferEntries.forEach((entry) => {
            entry.data.length = 0;
            this.clearEntryTimer(entry);
        });
    }
    preloadNextOperation() {
        this.bufferEntries.forEach((entry, terminal) => {
            if (entry.data.length > 0) {
                this.scheduleEntryFlush(terminal, entry);
            }
        });
    }
    dispose() {
        if (this.debugLoggingEnabled) {
            this.logger('Disposing performance manager');
        }
        this.flushOutputBuffer();
        ResizeManager_1.ResizeManager.clearResize('terminal-resize');
        this.isCliAgentMode = false;
        this.bufferEntries.clear();
        super.dispose();
        if (this.debugLoggingEnabled) {
            this.logger('PerformanceManager', 'completed');
        }
    }
    clearEntryTimer(entry) {
        if (entry.timer === null) {
            return;
        }
        if (entry.timerType === 'raf') {
            cancelAnimationFrame(entry.timer);
        }
        else {
            window.clearTimeout(entry.timer);
        }
        entry.timer = null;
        entry.timerType = null;
    }
}
exports.PerformanceManager = PerformanceManager;
/** DSR (Device Status Report) sequence pattern - \x1b[6n queries cursor position */
PerformanceManager.DSR_PATTERN = /\x1b\[6n/;
//# sourceMappingURL=PerformanceManager.js.map