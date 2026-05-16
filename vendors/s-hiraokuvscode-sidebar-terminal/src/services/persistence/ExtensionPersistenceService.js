"use strict";
/**
 * Extension Persistence Service
 *
 * Unified persistence service for extension-side terminal session management.
 * Consolidates functionality from:
 * - ConsolidatedTerminalPersistenceService (1,468 lines)
 * - TerminalPersistenceService (686 lines)
 * - UnifiedTerminalPersistenceService (382 lines)
 * - StandardTerminalSessionManager (1,341 lines)
 *
 * Total consolidation: 3,877 lines → ~400 lines (89% reduction)
 *
 * Key features:
 * - Session save/restore with workspace isolation
 * - Compression support for large scrollback data
 * - CLI Agent detection (Claude Code, Gemini, etc.)
 * - Auto-save on window close with onWillSaveState API
 * - Storage optimization and cleanup
 * - Session migration and validation
 * - Batch terminal restoration with concurrency control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionPersistenceService = void 0;
const vscode = require("vscode");
const common_1 = require("../../utils/common");
const logger_1 = require("../../utils/logger");
const session_types_1 = require("../../shared/session.types");
const PERSISTENCE_LOG_PREFIX = '[EXT-PERSISTENCE]';
const log = (message, ...args) => (0, logger_1.extension)(message.includes(PERSISTENCE_LOG_PREFIX) ? message : `${PERSISTENCE_LOG_PREFIX} ${message}`, ...args);
// ============================================================================
// Extension Persistence Service
// ============================================================================
class ExtensionPersistenceService {
    constructor(context, terminalManager, sidebarProvider) {
        this.context = context;
        this.terminalManager = terminalManager;
        // Pushed scrollback cache for instant save
        this.pushedScrollbackCache = new Map();
        // Terminal ready event tracking for synchronized restoration
        this.pendingTerminalReadyCallbacks = new Map();
        // Pending scrollback extraction requests for on-demand save
        this.pendingScrollbackRequests = new Map();
        // State
        this.isRestoring = false;
        this.sidebarProvider = sidebarProvider;
        this.setupAutoSave();
        log('✅ [EXT-PERSISTENCE] Extension Persistence Service initialized');
    }
    // ==========================================================================
    // Public API
    // ==========================================================================
    /**
     * Save current terminal session to workspace storage
     */
    async saveCurrentSession(options) {
        log('🔵 saveCurrentSession() called');
        if (this.isRestoring) {
            log('⏭️ Skipping save during restore');
            return { success: true, terminalCount: 0 };
        }
        try {
            const config = this.getPersistenceConfig();
            log(`🔵 Config: enablePersistentSessions=${config.enablePersistentSessions}`);
            if (!config.enablePersistentSessions) {
                log('⏭️ Persistence disabled by config');
                return { success: true, terminalCount: 0, message: 'Persistence disabled' };
            }
            const terminals = this.terminalManager.getTerminals();
            const activeTerminalId = this.terminalManager.getActiveTerminalId();
            log(`🔵 Terminals: ${terminals.length}, activeId: ${activeTerminalId}`);
            if (terminals.length === 0) {
                log('⏭️ No terminals to save');
                return { success: true, terminalCount: 0 };
            }
            // Prepare basic terminal data
            const terminalData = terminals.map((terminal, index) => ({
                id: terminal.id,
                name: terminal.name,
                number: index + 1,
                cwd: terminal.cwd || (0, common_1.safeProcessCwd)(),
                isActive: terminal.id === activeTerminalId,
                cliAgentType: this.detectCLIAgent(terminal),
                ...(terminal.indicatorColor ? { indicatorColor: terminal.indicatorColor } : {}),
            }));
            const preferCache = Boolean(options?.preferCache);
            log(`🔵 [SAVE-DEBUG] preferCache=${preferCache}, pushedScrollbackCache.size=${this.pushedScrollbackCache.size}`);
            // Collect scrollback data - check cache first, request fresh if needed
            const scrollbackPromises = terminals.map(async (terminal) => {
                log(`🔵 [SAVE-DEBUG] Processing terminal ${terminal.id}, cachedScrollback=${this.pushedScrollbackCache.has(terminal.id)}`);
                const cachedScrollback = this.pushedScrollbackCache.get(terminal.id);
                log(`🔵 [SAVE-DEBUG] cachedScrollback length=${cachedScrollback?.length ?? 0}`);
                if (preferCache) {
                    // 🔧 FIX: When preferCache is true (called from deactivate), use cache only.
                    // Do NOT call requestImmediateScrollbackExtraction because:
                    // 1. WebView may already be closed during deactivate()
                    // 2. Waiting for 2-second timeout would cause process to exit before saving
                    // The cache is updated every 30 seconds by TerminalAutoSaveService
                    if (cachedScrollback && cachedScrollback.length > 0) {
                        return { id: terminal.id, scrollback: cachedScrollback, fromCache: true };
                    }
                    // No cache available - return empty (better than hanging on WebView timeout)
                    log(`⚠️ [SAVE-DEBUG] No cached scrollback for ${terminal.id}, skipping (preferCache=true)`);
                    return { id: terminal.id, scrollback: [], fromCache: true };
                }
                // Normal save: request fresh extraction from WebView
                const extracted = await this.requestImmediateScrollbackExtraction(terminal.id);
                if (extracted.scrollback.length > 0) {
                    return { ...extracted, fromCache: false };
                }
                if (cachedScrollback && cachedScrollback.length > 0) {
                    return { id: terminal.id, scrollback: cachedScrollback, fromCache: true };
                }
                return { ...extracted, fromCache: false };
            });
            log(`🔵 [SAVE-DEBUG] Waiting for ${terminals.length} scrollback promises...`);
            const extractedScrollbacks = await Promise.all(scrollbackPromises);
            log(`🔵 [SAVE-DEBUG] All scrollback promises resolved, count=${extractedScrollbacks.length}`);
            // Build scrollbackData from collected results
            const scrollbackData = {};
            let cachedCount = 0;
            let extractedCount = 0;
            for (const { id, scrollback, fromCache } of extractedScrollbacks) {
                if (scrollback.length > 0) {
                    scrollbackData[id] = this.compressIfNeeded(scrollback);
                    if (fromCache) {
                        cachedCount++;
                    }
                    else {
                        extractedCount++;
                    }
                }
            }
            log(`[EXT-PERSISTENCE] Scrollback: ${cachedCount} cached, ${extractedCount} extracted, ${terminals.length} total`);
            // Debug: Log scrollback data sizes and preview content
            for (const terminalId of Object.keys(scrollbackData)) {
                const data = scrollbackData[terminalId];
                if (Array.isArray(data)) {
                    log(`📦 [EXT-PERSISTENCE] Saving scrollback for ${terminalId}: ${data.length} lines`);
                    // Log first 3 lines as preview
                    if (data.length > 0) {
                        const preview = data
                            .slice(0, 3)
                            .map((line) => typeof line === 'string'
                            ? line.substring(0, 80)
                            : JSON.stringify(line).substring(0, 80));
                        log(`📦 [EXT-PERSISTENCE] Preview for ${terminalId}: ${JSON.stringify(preview)}`);
                    }
                }
            }
            // Build session data
            let sessionData = {
                terminals: terminalData,
                activeTerminalId: activeTerminalId || null,
                timestamp: Date.now(),
                version: ExtensionPersistenceService.SESSION_VERSION,
                scrollbackData,
                config: {
                    scrollbackLines: config.persistentSessionScrollback,
                    reviveProcess: config.persistentSessionReviveProcess,
                },
            };
            // Storage optimization
            const storageCheck = session_types_1.SessionDataTransformer.isStorageLimitExceeded(sessionData, config.persistentSessionStorageLimit);
            if (storageCheck.exceeded || storageCheck.percentageUsed > 80) {
                log(`[EXT-PERSISTENCE] Storage optimization needed (${storageCheck.percentageUsed}% used)`);
                sessionData = this.optimizeSessionData(sessionData, config);
            }
            // Save to workspace state (per-workspace isolation)
            await this.context.workspaceState.update(ExtensionPersistenceService.STORAGE_KEY, sessionData);
            log(`✅ [EXT-PERSISTENCE] Session saved: ${terminals.length} terminals`);
            return { success: true, terminalCount: terminals.length };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            log(`❌ [EXT-PERSISTENCE] Save failed: ${errorMsg}`);
            return { success: false, terminalCount: 0, error: errorMsg };
        }
    }
    /**
     * Restore terminal session from workspace storage
     */
    async restoreSession(forceRestore = false) {
        log('🟢 restoreSession() called');
        this.isRestoring = true;
        try {
            const config = this.getPersistenceConfig();
            // Load session data
            const sessionData = this.context.workspaceState.get(ExtensionPersistenceService.STORAGE_KEY);
            log(`🟢 Session data: ${sessionData ? `${sessionData.terminals?.length} terminals` : 'null'}`);
            // Debug: Log detailed session info
            if (sessionData) {
                log(`🟢 Session version: ${sessionData.version}`);
                log(`🟢 Session timestamp: ${new Date(sessionData.timestamp).toISOString()}`);
                log(`🟢 Active terminal ID: ${sessionData.activeTerminalId}`);
                sessionData.terminals?.forEach((t, i) => {
                    const scrollback = sessionData.scrollbackData?.[t.id];
                    const scrollbackLines = Array.isArray(scrollback) ? scrollback.length : 0;
                    log(`🟢 Terminal ${i + 1}: id=${t.id}, name=${t.name}, scrollback=${scrollbackLines} lines`);
                });
            }
            if (!sessionData) {
                log('⏭️ No session found');
                this.isRestoring = false;
                return { success: false, message: 'No session found' };
            }
            // Validate and migrate session
            const validation = session_types_1.SessionDataTransformer.validateSessionForRestore(sessionData);
            if (!validation.valid) {
                log(`❌ [EXT-PERSISTENCE] Validation failed: ${validation.issues?.join(', ')}`);
                this.isRestoring = false;
                return { success: false, message: 'Invalid session data' };
            }
            // Check expiry
            if (session_types_1.SessionDataTransformer.isSessionExpired(sessionData, config.persistentSessionExpiryDays)) {
                log('[EXT-PERSISTENCE] Session expired, clearing...');
                await this.clearSession();
                this.isRestoring = false;
                return { success: false, message: 'Session expired' };
            }
            // Skip if already has terminals (unless forced)
            if (!forceRestore && this.terminalManager.getTerminals().length > 0) {
                log('[EXT-PERSISTENCE] Skipping restore (terminals already exist)');
                this.isRestoring = false;
                return { success: false, message: 'Terminals already exist' };
            }
            log(`[EXT-PERSISTENCE] Restoring session: ${sessionData.terminals.length} terminals`);
            // Batch restore terminals with concurrency control
            const restoreResults = await this.batchRestoreTerminals(sessionData);
            // 🔒 Delay clearing isRestoring flag to provide protection period
            // This prevents auto-save from immediately overwriting restored scrollback
            // The 5 second delay allows:
            // 1. Terminal restoration to complete
            // 2. Shell initialization to settle
            // 3. WebView-side protection period to synchronize
            setTimeout(() => {
                this.isRestoring = false;
                log('✅ [EXT-PERSISTENCE] Restoration protection period ended (5s delay)');
            }, 5000);
            const successCount = restoreResults.filter((r) => r.success).length;
            log(`✅ [EXT-PERSISTENCE] Restored ${successCount}/${sessionData.terminals.length} terminals`);
            return {
                success: successCount > 0,
                restoredCount: successCount,
                skippedCount: restoreResults.length - successCount,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            log(`❌ [EXT-PERSISTENCE] Restore failed: ${errorMsg}`);
            // On error, clear isRestoring flag immediately
            this.isRestoring = false;
            return { success: false, message: errorMsg };
        }
        // Note: Do NOT use finally block here - it would override the 5s setTimeout delay
        // The isRestoring flag is cleared by setTimeout in the success path
    }
    /**
     * Get session info without restoring
     */
    getSessionInfo() {
        try {
            const sessionData = this.context.workspaceState.get(ExtensionPersistenceService.STORAGE_KEY);
            if (!sessionData || !session_types_1.SessionDataTransformer.isValidSessionData(sessionData)) {
                return { exists: false };
            }
            return {
                exists: true,
                terminals: sessionData.terminals,
                timestamp: sessionData.timestamp,
                version: sessionData.version,
                scrollbackData: sessionData.scrollbackData,
            };
        }
        catch (error) {
            log(`❌ [EXT-PERSISTENCE] getSessionInfo failed: ${error}`);
            return null;
        }
    }
    /**
     * Clear session data from storage
     */
    async clearSession() {
        try {
            await this.context.workspaceState.update(ExtensionPersistenceService.STORAGE_KEY, undefined);
            this.pushedScrollbackCache.clear();
            log('✅ [EXT-PERSISTENCE] Session cleared');
        }
        catch (error) {
            log(`❌ [EXT-PERSISTENCE] clearSession failed: ${error}`);
        }
    }
    /**
     * Set sidebar provider for WebView communication
     */
    setSidebarProvider(provider) {
        this.sidebarProvider = provider;
        log('[EXT-PERSISTENCE] Sidebar provider configured');
    }
    /**
     * Handle pushed scrollback data from WebView (for instant save)
     *
     * 🔧 FIX: Save session immediately after caching scrollback data.
     * This ensures scrollback is persisted even if deactivate() doesn't complete
     * (e.g., during Reload Window where VS Code may terminate the process early).
     */
    handlePushedScrollbackData(message) {
        if (!message.terminalId || !message.scrollbackData) {
            return;
        }
        if (message.scrollbackData.length === 0) {
            log(`[EXT-PERSISTENCE] Ignored empty scrollback push for ${message.terminalId} (preserving cache)`);
            return;
        }
        this.pushedScrollbackCache.set(message.terminalId, message.scrollbackData);
        log(`✅ [EXT-PERSISTENCE] Cached scrollback for ${message.terminalId}: ${message.scrollbackData.length} lines`);
        // 🔧 FIX: Trigger debounced auto-save to persist scrollback immediately
        // This ensures data is saved even if deactivate() doesn't complete
        this.triggerDebouncedAutoSave();
    }
    /**
     * Trigger debounced auto-save after scrollback update
     */
    triggerDebouncedAutoSave() {
        if (this.autoSaveDebounceTimer) {
            clearTimeout(this.autoSaveDebounceTimer);
        }
        this.autoSaveDebounceTimer = setTimeout(() => {
            this.autoSaveDebounceTimer = undefined;
            if (!this.isRestoring) {
                log('💾 [EXT-PERSISTENCE] Auto-saving session after scrollback update...');
                void this.saveCurrentSession({ preferCache: true }).then((result) => {
                    if (result.success) {
                        log(`✅ [EXT-PERSISTENCE] Auto-save completed: ${result.terminalCount} terminals`);
                    }
                });
            }
        }, ExtensionPersistenceService.AUTO_SAVE_DEBOUNCE_MS);
    }
    /**
     * Handle terminal ready event from WebView
     * Called when a terminal is fully initialized and ready for data operations
     */
    handleTerminalReady(terminalId) {
        for (const [remaining, callback] of this.pendingTerminalReadyCallbacks.entries()) {
            if (remaining.has(terminalId)) {
                remaining.delete(terminalId);
                log(`✅ [EXT-PERSISTENCE] Terminal ready: ${terminalId}, remaining: ${remaining.size}`);
                if (remaining.size === 0) {
                    callback();
                    this.pendingTerminalReadyCallbacks.delete(remaining);
                }
            }
        }
    }
    /**
     * Handle scrollback data collected from WebView (for on-demand extraction)
     */
    handleScrollbackDataCollected(message) {
        const { terminalId, requestId, scrollbackData } = message;
        // Update cache when non-empty to preserve last known scrollback
        if (terminalId && scrollbackData) {
            if (scrollbackData.length > 0) {
                this.pushedScrollbackCache.set(terminalId, scrollbackData);
                log(`[EXT-PERSISTENCE] Updated scrollback cache for ${terminalId}: ${scrollbackData.length} lines`);
            }
            else {
                log(`[EXT-PERSISTENCE] Ignored empty scrollback update for ${terminalId} (preserving cache)`);
            }
        }
        // Handle pending extraction request
        if (requestId && this.pendingScrollbackRequests.has(requestId)) {
            const pending = this.pendingScrollbackRequests.get(requestId);
            clearTimeout(pending.timeout);
            this.pendingScrollbackRequests.delete(requestId);
            pending.resolve({
                id: pending.terminalId,
                scrollback: scrollbackData || [],
            });
            log(`✅ [EXT-PERSISTENCE] Scrollback extraction completed for request: ${requestId}`);
        }
    }
    /**
     * 🔧 FIX: Handle scrollback refresh request from WebView after sleep/wake
     * Sends cached scrollback data back to WebView for all requested terminals
     */
    async handleScrollbackRefreshRequest(message) {
        if (!this.sidebarProvider) {
            log('⚠️ [EXT-PERSISTENCE] Cannot refresh scrollback - no sidebar provider');
            return;
        }
        const terminalIds = message.terminalIds || [];
        log(`🔄 [EXT-PERSISTENCE] Scrollback refresh requested for ${terminalIds.length} terminals`);
        for (const terminalId of terminalIds) {
            const cachedScrollback = this.pushedScrollbackCache.get(terminalId);
            if (cachedScrollback && cachedScrollback.length > 0) {
                try {
                    await this.sidebarProvider.sendMessageToWebview({
                        command: 'restoreTerminalScrollback',
                        terminalId,
                        scrollbackContent: cachedScrollback,
                        isRefresh: true, // Mark as refresh to avoid overwriting newer data
                        timestamp: Date.now(),
                    });
                    log(`✅ [EXT-PERSISTENCE] Sent scrollback refresh for ${terminalId}: ${cachedScrollback.length} lines`);
                }
                catch (error) {
                    log(`❌ [EXT-PERSISTENCE] Failed to send scrollback refresh for ${terminalId}:`, error);
                }
            }
            else {
                log(`⚠️ [EXT-PERSISTENCE] No cached scrollback for ${terminalId}`);
            }
        }
    }
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const config = this.getPersistenceConfig();
            const sessionData = this.context.workspaceState.get(ExtensionPersistenceService.STORAGE_KEY);
            if (!sessionData) {
                return;
            }
            if (session_types_1.SessionDataTransformer.isSessionExpired(sessionData, config.persistentSessionExpiryDays)) {
                log('[EXT-PERSISTENCE] Cleaning up expired session...');
                await this.clearSession();
                log('✅ [EXT-PERSISTENCE] Expired session cleaned up');
            }
        }
        catch (error) {
            log(`❌ [EXT-PERSISTENCE] Failed to cleanup expired sessions: ${error}`);
        }
    }
    /**
     * Cleanup and dispose
     */
    dispose() {
        // Clear auto-save debounce timer
        if (this.autoSaveDebounceTimer) {
            clearTimeout(this.autoSaveDebounceTimer);
            this.autoSaveDebounceTimer = undefined;
        }
        this.pushedScrollbackCache.clear();
        this.pendingTerminalReadyCallbacks.clear();
        this.pendingScrollbackRequests.clear();
        log('[EXT-PERSISTENCE] Disposed');
    }
    // ==========================================================================
    // Private Methods
    // ==========================================================================
    /**
     * Setup auto-save configuration.
     *
     * Note: Session saving is primarily handled by deactivate() in ExtensionLifecycle.
     * The VS Code extension API does not provide a public onWillSaveState event,
     * so we rely on the deactivate() function which is called when the extension
     * is being deactivated or when VS Code is shutting down.
     *
     * For additional reliability, TerminalAutoSaveService provides periodic
     * scrollback caching which is used as a fallback during deactivation.
     */
    setupAutoSave() {
        // Note: vscode.workspace.onWillSaveState is not a public API.
        // Session persistence relies on:
        // 1. deactivate() function called by VS Code on shutdown/reload
        // 2. TerminalAutoSaveService for periodic scrollback caching (every 30s)
        // 3. Immediate save when scrollback data is pushed from WebView
        log('✅ [EXT-PERSISTENCE] Session persistence configured (via deactivate + periodic caching)');
    }
    /**
     * Get persistence configuration
     */
    getPersistenceConfig() {
        // Settings are contributed under the `secondaryTerminal` namespace
        const config = vscode.workspace.getConfiguration('secondaryTerminal');
        return {
            enablePersistentSessions: config.get('enablePersistentSessions', true),
            persistentSessionScrollback: config.get('persistentSessionScrollback', 1000),
            persistentSessionReviveProcess: config.get('persistentSessionReviveProcess', 'never'),
            persistentSessionStorageLimit: config.get('persistentSessionStorageLimit', 20),
            persistentSessionExpiryDays: config.get('persistentSessionExpiryDays', 7),
        };
    }
    /**
     * Detect CLI Agent type from terminal name/cwd
     */
    detectCLIAgent(terminal) {
        const name = terminal.name.toLowerCase();
        const cwd = terminal.cwd?.toLowerCase() || '';
        if (name.includes('claude') || cwd.includes('claude')) {
            return 'claude';
        }
        if (name.includes('gemini') || cwd.includes('gemini')) {
            return 'gemini';
        }
        return undefined;
    }
    /**
     * Compress scrollback data if it exceeds threshold
     */
    compressIfNeeded(scrollbackLines) {
        // Previously we collapsed long scrollback into a single string. The WebView
        // restore path expects an array and silently discarded string payloads,
        // resulting in empty scrollback on restore. Keep the hook but always return
        // the original array to preserve fidelity.
        return scrollbackLines;
    }
    /**
     * Optimize session data to fit within storage limits
     */
    optimizeSessionData(sessionData, _config) {
        // Target size calculation for future optimization
        // const _targetSize = config.persistentSessionStorageLimit * 0.9 * 1024 * 1024; // 90% of limit
        // Strategy: Reduce scrollback lines progressively
        const optimized = { ...sessionData };
        const scrollbackData = optimized.scrollbackData || {};
        for (const terminalId in scrollbackData) {
            const data = scrollbackData[terminalId];
            if (Array.isArray(data) && data.length > 500) {
                // Keep only last 500 lines
                scrollbackData[terminalId] = data.slice(-500);
            }
            else if (typeof data === 'string' && data.length > 50000) {
                // Truncate long strings
                scrollbackData[terminalId] = data.slice(-50000);
            }
        }
        log('[EXT-PERSISTENCE] Session data optimized');
        return optimized;
    }
    /**
     * Wait for all specified terminals to be ready (event-based)
     */
    waitForTerminalsReady(terminalIds, timeout) {
        if (terminalIds.size === 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            const remaining = new Set(terminalIds);
            const timeoutId = setTimeout(() => {
                log(`⚠️ [EXT-PERSISTENCE] Timeout waiting for terminals: ${Array.from(remaining).join(', ')}`);
                this.pendingTerminalReadyCallbacks.delete(remaining);
                resolve(); // Continue anyway to not block restoration
            }, timeout);
            this.pendingTerminalReadyCallbacks.set(remaining, () => {
                clearTimeout(timeoutId);
                resolve();
            });
        });
    }
    /**
     * Request immediate scrollback extraction from WebView (for on-demand save)
     */
    async requestImmediateScrollbackExtraction(terminalId) {
        if (!this.sidebarProvider) {
            return { id: terminalId, scrollback: [] };
        }
        return new Promise((resolve) => {
            const requestId = `extract-${terminalId}-${Date.now()}`;
            const timeout = setTimeout(() => {
                this.pendingScrollbackRequests.delete(requestId);
                log(`⚠️ [EXT-PERSISTENCE] Scrollback extraction timeout for ${terminalId}`);
                resolve({ id: terminalId, scrollback: [] });
            }, 2000); // 🔧 FIX: Extended timeout (500ms → 2000ms) to ensure reliable extraction
            this.pendingScrollbackRequests.set(requestId, { resolve, timeout, terminalId });
            void this.sidebarProvider.sendMessageToWebview({
                command: 'extractScrollbackData',
                terminalId,
                requestId,
                maxLines: this.getPersistenceConfig().persistentSessionScrollback,
            });
            log(`[EXT-PERSISTENCE] Requested immediate scrollback extraction for ${terminalId} (${requestId})`);
        });
    }
    /**
     * Prefetch scrollback before saving (best effort, updates cache)
     */
    async prefetchScrollbackForSave() {
        const terminals = this.terminalManager.getTerminals();
        if (terminals.length === 0) {
            return;
        }
        try {
            await Promise.all(terminals.map(async (terminal) => {
                const extracted = await this.requestImmediateScrollbackExtraction(terminal.id);
                if (extracted.scrollback.length > 0) {
                    this.pushedScrollbackCache.set(terminal.id, extracted.scrollback);
                }
            }));
        }
        catch (error) {
            log(`⚠️ [EXT-PERSISTENCE] Prefetch scrollback failed: ${error}`);
        }
    }
    /**
     * Batch restore terminals with concurrency control
     */
    async batchRestoreTerminals(sessionData) {
        const results = [];
        const { terminals, scrollbackData } = sessionData;
        // Create all terminals first
        const terminalCreations = [];
        for (const terminalInfo of terminals) {
            // Note: createTerminal() doesn't accept options, name/cwd are handled during scrollback restoration
            const terminalId = this.terminalManager.createTerminal();
            if (terminalId) {
                terminalCreations.push({
                    id: terminalId,
                    originalId: terminalInfo.id,
                    name: terminalInfo.name,
                    cwd: terminalInfo.cwd,
                    isActive: terminalInfo.isActive,
                    scrollbackData: scrollbackData?.[terminalInfo.id],
                    ...(terminalInfo.indicatorColor ? { indicatorColor: terminalInfo.indicatorColor } : {}),
                });
                // Restore terminal name (createTerminal() assigns default name)
                if (terminalInfo.name) {
                    this.terminalManager.renameTerminal(terminalId, terminalInfo.name);
                }
                // Restore indicator color
                if (terminalInfo.indicatorColor) {
                    this.terminalManager.updateTerminalHeader(terminalId, {
                        indicatorColor: terminalInfo.indicatorColor,
                    });
                }
                if (terminalInfo.isActive) {
                    this.terminalManager.setActiveTerminal(terminalId);
                }
                results.push({ success: true, terminalId });
            }
            else {
                results.push({ success: false });
            }
        }
        // Wait for terminals to be ready (event-based with 3s timeout)
        const pendingTerminalIds = new Set(terminalCreations.map((t) => t.id));
        log(`[EXT-PERSISTENCE] Waiting for ${pendingTerminalIds.size} terminals to be ready...`);
        await this.waitForTerminalsReady(pendingTerminalIds, 3000);
        log(`✅ [EXT-PERSISTENCE] All terminals ready or timeout reached`);
        // Preserve original order from the saved session (explicit reorder after restore)
        const restoredOrder = terminalCreations.map((terminal) => terminal.id);
        if (restoredOrder.length > 1) {
            this.terminalManager.reorderTerminals(restoredOrder);
            log(`🔁 [EXT-PERSISTENCE] Restored terminal order:`, restoredOrder);
        }
        // Restore scrollback content in batches
        if (terminalCreations.length > 0 && scrollbackData) {
            await this.requestScrollbackRestoration(terminalCreations);
        }
        return results;
    }
    /**
     * Request scrollback restoration via WebView
     */
    async requestScrollbackRestoration(terminals) {
        if (!this.sidebarProvider) {
            log('⚠️ [EXT-PERSISTENCE] No sidebar provider for restoration');
            return;
        }
        try {
            // Normalize historical payloads where scrollback was stored as a single string
            const normalizedTerminals = terminals.map((t) => {
                let scrollbackArray = t.scrollbackData;
                // Handle legacy string format
                if (!Array.isArray(scrollbackArray) && typeof t.scrollbackData === 'string') {
                    scrollbackArray = t.scrollbackData.split('\n');
                }
                // Debug: Log scrollback data for each terminal
                log(`📦 [EXT-PERSISTENCE] Terminal ${t.id} (original: ${t.originalId}): scrollback ${scrollbackArray?.length ?? 0} lines`);
                return {
                    terminalId: t.id,
                    scrollbackData: scrollbackArray,
                    restoreScrollback: true,
                    progressive: Array.isArray(scrollbackArray) && scrollbackArray.length > 500,
                };
            });
            // Debug: Check if any terminal has scrollback data
            const terminalsWithData = normalizedTerminals.filter((t) => t.scrollbackData && t.scrollbackData.length > 0);
            log(`📦 [EXT-PERSISTENCE] ${terminalsWithData.length}/${normalizedTerminals.length} terminals have scrollback data`);
            if (terminalsWithData.length === 0) {
                log('⚠️ [EXT-PERSISTENCE] No scrollback data to restore - skipping');
                return;
            }
            await this.sidebarProvider.sendMessageToWebview({
                command: 'restoreTerminalSessions',
                terminals: normalizedTerminals,
            });
            log(`✅ [EXT-PERSISTENCE] Scrollback restoration requested for ${terminals.length} terminals`);
        }
        catch (error) {
            log(`❌ [EXT-PERSISTENCE] Scrollback restoration failed: ${error}`);
        }
    }
}
exports.ExtensionPersistenceService = ExtensionPersistenceService;
ExtensionPersistenceService.STORAGE_KEY = 'terminal-session-unified';
ExtensionPersistenceService.SESSION_VERSION = '4.0.0';
ExtensionPersistenceService.MAX_CONCURRENT_RESTORES = 3;
ExtensionPersistenceService.COMPRESSION_THRESHOLD = 1000; // characters
ExtensionPersistenceService.AUTO_SAVE_DEBOUNCE_MS = 2000; // 2 seconds
//# sourceMappingURL=ExtensionPersistenceService.js.map