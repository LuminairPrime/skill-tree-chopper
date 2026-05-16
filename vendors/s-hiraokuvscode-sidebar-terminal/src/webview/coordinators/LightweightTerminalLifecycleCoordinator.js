"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightweightTerminalLifecycleCoordinator = void 0;
const webview_1 = require("../constants/webview");
const logger_1 = require("../../utils/logger");
class LightweightTerminalLifecycleCoordinator {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.pendingSplitTransition = null;
    }
    async createTerminal(params) {
        const { terminalId, terminalName, config, terminalNumber, requestSource } = params;
        try {
            (0, logger_1.webview)(`🔍 [DEBUG] RefactoredTerminalWebviewManager.createTerminal called:`, {
                terminalId,
                terminalName,
                terminalNumber,
                hasConfig: !!config,
                timestamp: Date.now(),
            });
            const checkResult = await this.preTerminalCreationChecks({
                terminalId,
                config,
                terminalNumber,
                requestSource,
            });
            if (checkResult.action === 'skip') {
                return checkResult.terminal;
            }
            const { shouldForceNormal, shouldForceFullscreen } = checkResult;
            (0, logger_1.webview)(`🚀 Creating terminal with header: ${terminalId} (${terminalName}) #${terminalNumber}`);
            this.dependencies.terminalOperations.markTerminalCreationPending(terminalId);
            const terminal = await this.dependencies.terminalLifecycleManager.createTerminal(terminalId, terminalName, config, terminalNumber);
            if (!terminal) {
                (0, logger_1.webview)(`❌ Failed to create terminal instance: ${terminalId}`);
                return null;
            }
            this.postTerminalCreation({
                terminalId,
                terminalName,
                terminal,
                requestSource,
                shouldForceNormal,
                shouldForceFullscreen,
            });
            return terminal;
        }
        catch (error) {
            (0, logger_1.webview)(`❌ Error creating terminal ${terminalId}:`, error);
            return null;
        }
        finally {
            this.dependencies.terminalOperations.clearTerminalCreationPending(terminalId);
        }
    }
    async removeTerminal(terminalId) {
        (0, logger_1.webview)(`🗑️ [REMOVAL] Starting removal for terminal: ${terminalId}`);
        const terminalInstance = this.dependencies.getTerminalInstance(terminalId);
        if (terminalInstance?.terminal) {
            this.dependencies.performanceManager?.removeTerminal(terminalInstance.terminal);
        }
        this.dependencies.cliAgentStateManager.removeTerminalState(terminalId);
        this.dependencies.webViewPersistenceService?.removeTerminal(terminalId);
        if (this.dependencies.webViewPersistenceService) {
            (0, logger_1.webview)(`🗑️ [PERSISTENCE] Terminal ${terminalId} unregistered from persistence service`);
        }
        this.dependencies.terminalTabManager?.removeTab(terminalId);
        const removed = await this.dependencies.terminalLifecycleManager.removeTerminal(terminalId);
        (0, logger_1.webview)(`🗑️ [REMOVAL] Lifecycle removal result for ${terminalId}: ${removed}`);
        setTimeout(() => {
            this.dependencies.webViewPersistenceService
                ?.saveSession()
                .then((success) => {
                if (success) {
                    (0, logger_1.webview)('✅ [SIMPLE-PERSISTENCE] Session updated after removal');
                }
            })
                .catch((error) => {
                console.error('Failed to save session after terminal removal', { terminalId }, error);
            });
        }, 100);
        return removed;
    }
    async switchToTerminal(terminalId) {
        const result = await this.dependencies.terminalLifecycleManager.switchToTerminal(terminalId);
        if (result) {
            this.dependencies.uiManager?.updateTerminalBorders(terminalId, this.dependencies.splitManager.getTerminalContainers());
        }
        return result;
    }
    async ensureSplitModeBeforeCreation() {
        await this.ensureSplitModeBeforeTerminalCreation();
    }
    async handleTerminalRemovedFromExtension(terminalId) {
        const removed = await this.removeTerminal(terminalId);
        if (removed) {
            (0, logger_1.webview)(`✅ Terminal cleanup confirmed for ${terminalId}`);
        }
        else {
            (0, logger_1.webview)(`⚠️ Terminal cleanup may have failed for ${terminalId}`);
        }
    }
    ensureTerminalFocus(terminalId) {
        const targetTerminalId = terminalId ?? this.dependencies.getActiveTerminalId();
        if (!targetTerminalId) {
            return;
        }
        const instance = this.dependencies.getTerminalInstance(targetTerminalId);
        if (!instance?.terminal) {
            return;
        }
        if (terminalId && this.dependencies.getActiveTerminalId() !== terminalId) {
            this.dependencies.setActiveTerminalId(terminalId);
        }
        instance.terminal.focus();
    }
    prepareDisplayForTerminalDeletion(targetTerminalId, stats) {
        try {
            const displayModeManager = this.dependencies.displayModeManager;
            if (!displayModeManager) {
                return;
            }
            if (stats.totalTerminals > 1 && displayModeManager.getCurrentMode() === 'fullscreen') {
                (0, logger_1.webview)(`🖥️ Exiting fullscreen before deleting ${targetTerminalId}`);
                displayModeManager.setDisplayMode('split');
            }
        }
        catch (error) {
            (0, logger_1.webview)('⚠️ Failed to prepare display for deletion:', error);
        }
    }
    async preTerminalCreationChecks(params) {
        const { terminalId, config, terminalNumber, requestSource } = params;
        if (this.dependencies.terminalOperations.isTerminalCreationPending(terminalId)) {
            (0, logger_1.webview)(`⏳ [DEBUG] Terminal ${terminalId} creation already pending (source: ${requestSource}), skipping duplicate request`);
            return {
                action: 'skip',
                terminal: this.dependencies.getTerminalInstance(terminalId)?.terminal ?? null,
            };
        }
        const existingInstance = this.dependencies.getTerminalInstance(terminalId);
        if (existingInstance) {
            (0, logger_1.webview)(`🔁 [DEBUG] Terminal ${terminalId} already exists, reusing existing instance (source: ${requestSource})`);
            this.dependencies.terminalTabManager?.setActiveTab(terminalId);
            return { action: 'skip', terminal: existingInstance.terminal ?? null };
        }
        const displayModeOverride = config
            ?.displayModeOverride;
        const shouldForceNormal = this.dependencies.getForceNormalModeForNextCreate() || displayModeOverride === 'normal';
        const shouldForceFullscreen = this.dependencies.getForceFullscreenModeForNextCreate() ||
            displayModeOverride === 'fullscreen';
        (0, logger_1.webview)(`🔍 [MODE-DEBUG] createTerminal mode check:`, {
            terminalId,
            displayModeOverride,
            forceFullscreenModeForNextCreate: this.dependencies.getForceFullscreenModeForNextCreate(),
            shouldForceFullscreen,
            shouldForceNormal,
            currentMode: this.dependencies.displayModeManager?.getCurrentMode?.() ?? 'unknown',
        });
        if (shouldForceNormal) {
            this.dependencies.setForceNormalModeForNextCreate(false);
            this.dependencies.displayModeManager?.setDisplayMode('normal');
            (0, logger_1.webview)(`🧭 [MODE] Forced normal mode before creating ${terminalId}`);
        }
        else if (shouldForceFullscreen) {
            this.dependencies.displayModeManager?.setDisplayMode('fullscreen');
            this.dependencies.setForceFullscreenModeForNextCreate(false);
            (0, logger_1.webview)(`🧭 [MODE] Forced fullscreen mode before creating ${terminalId}`);
        }
        else {
            await this.ensureSplitModeBeforeTerminalCreation();
        }
        const canCreate = this.dependencies.canCreateTerminal();
        if (!canCreate && requestSource !== 'extension') {
            const localCount = this.dependencies.splitManager.getTerminals().size ?? 0;
            const maxCount = this.dependencies.getCurrentTerminalState()?.maxTerminals ?? webview_1.SPLIT_CONSTANTS.MAX_TERMINALS;
            (0, logger_1.webview)(`❌ [STATE] Terminal creation blocked (local count=${localCount}, max=${maxCount})`);
            this.dependencies.showTerminalLimitMessage(localCount, maxCount);
            return { action: 'skip', terminal: null };
        }
        const currentTerminalState = this.dependencies.getCurrentTerminalState();
        if (currentTerminalState) {
            const availableSlots = currentTerminalState.availableSlots;
            (0, logger_1.webview)(`🎯 [STATE] Terminal creation check: canCreate=${canCreate}, availableSlots=[${availableSlots.join(',')}]`);
            if (terminalNumber && !availableSlots.includes(terminalNumber)) {
                (0, logger_1.webview)(`⚠️ [STATE] Terminal number ${terminalNumber} not in available slots [${availableSlots.join(',')}]`);
                this.dependencies.requestLatestState();
            }
        }
        else {
            (0, logger_1.webview)('⚠️ [STATE] No cached state available, requesting from Extension...');
            this.dependencies.requestLatestState();
        }
        return { action: 'continue', shouldForceNormal, shouldForceFullscreen };
    }
    postTerminalCreation(params) {
        const { terminalId, terminalName, terminal, requestSource, shouldForceNormal, shouldForceFullscreen, } = params;
        this.dependencies.terminalTabManager?.addTab(terminalId, terminalName, terminal);
        this.dependencies.terminalTabManager?.setActiveTab(terminalId);
        if (this.dependencies.webViewPersistenceService) {
            this.dependencies.webViewPersistenceService.addTerminal(terminalId, terminal, {
                autoSave: true,
            });
            (0, logger_1.webview)(`✅ [PERSISTENCE] Terminal ${terminalId} registered with persistence service`);
        }
        setTimeout(() => {
            this.dependencies.webViewPersistenceService
                ?.saveSession()
                .then((success) => {
                if (success) {
                    (0, logger_1.webview)('✅ [SIMPLE-PERSISTENCE] Session saved successfully');
                }
                else {
                    console.warn('⚠️ [SIMPLE-PERSISTENCE] Failed to save session');
                }
            })
                .catch((error) => {
                console.error('Failed to save session after terminal creation', { terminalId }, error);
            });
        }, 100);
        this.dependencies.setActiveTerminalId(terminalId);
        const allContainers = this.dependencies.splitManager.getTerminalContainers();
        this.dependencies.uiManager?.updateTerminalBorders(terminalId, allContainers);
        if (terminal.textarea) {
            setTimeout(() => {
                terminal.focus();
                (0, logger_1.webview)(`🎯 [FIX] Focused new terminal: ${terminalId}`);
            }, 25);
        }
        if (requestSource === 'webview') {
            this.dependencies.postMessageToExtension({
                command: 'createTerminal',
                terminalId,
                terminalName,
                timestamp: Date.now(),
            });
        }
        (0, logger_1.webview)(`✅ Terminal creation completed: ${terminalId}`);
        const currentMode = this.dependencies.displayModeManager?.getCurrentMode?.() ?? 'normal';
        const splitManagerActive = this.dependencies.splitManager.getIsSplitMode();
        const shouldMaintainSplitLayout = !shouldForceNormal &&
            !shouldForceFullscreen &&
            (currentMode === 'split' || splitManagerActive);
        if (shouldMaintainSplitLayout) {
            try {
                (0, logger_1.webview)(`🔄 [SPLIT] Immediately refreshing split layout after creating ${terminalId}`);
                this.dependencies.displayModeManager?.showAllTerminalsSplit();
            }
            catch (layoutError) {
                (0, logger_1.webview)(`⚠️ [SPLIT] Failed to refresh split layout immediately: ${layoutError}`);
            }
        }
        setTimeout(() => {
            this.dependencies.terminalLifecycleManager.resizeAllTerminals();
            this.dependencies.uiManager?.updateTerminalBorders(terminalId, allContainers);
            const currentModeNow = this.dependencies.displayModeManager?.getCurrentMode?.() ?? 'normal';
            if (shouldMaintainSplitLayout && currentModeNow === 'split') {
                try {
                    this.dependencies.displayModeManager?.showAllTerminalsSplit();
                }
                catch (layoutError) {
                    (0, logger_1.webview)(`⚠️ [SPLIT] Failed to refresh split layout after resize: ${layoutError}`);
                }
            }
        }, 150);
    }
    async ensureSplitModeBeforeTerminalCreation() {
        const displayManager = this.dependencies.displayModeManager;
        if (!displayManager) {
            return;
        }
        const currentMode = displayManager.getCurrentMode?.() ?? 'normal';
        let existingCount = 0;
        try {
            existingCount = this.dependencies.splitManager.getTerminals().size;
        }
        catch (error) {
            (0, logger_1.webview)('⚠️ [SPLIT] Failed to inspect existing terminals before creation:', error);
            existingCount = 0;
        }
        if (existingCount === 0) {
            return;
        }
        if (currentMode === 'fullscreen') {
            if (this.pendingSplitTransition) {
                await this.pendingSplitTransition;
                return;
            }
            this.pendingSplitTransition = (async () => {
                try {
                    (0, logger_1.webview)(`🖥️ [SPLIT] Fullscreen detected with ${existingCount} terminals. Switching to split mode before creating new terminal.`);
                    displayManager.showAllTerminalsSplit();
                    await new Promise((resolve) => setTimeout(resolve, 250));
                }
                catch (error) {
                    (0, logger_1.webview)('⚠️ [SPLIT] Failed to trigger split mode before creation:', error);
                }
                finally {
                    this.pendingSplitTransition = null;
                }
            })();
            await this.pendingSplitTransition;
        }
        else if (currentMode === 'split') {
            (0, logger_1.webview)('🖥️ [SPLIT] Split mode detected. New terminal will be added to split layout.');
        }
    }
}
exports.LightweightTerminalLifecycleCoordinator = LightweightTerminalLifecycleCoordinator;
//# sourceMappingURL=LightweightTerminalLifecycleCoordinator.js.map