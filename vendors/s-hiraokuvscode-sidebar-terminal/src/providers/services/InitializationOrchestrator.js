"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializationOrchestrator = exports.InitializationPhase = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Initialization phase tracking
 */
var InitializationPhase;
(function (InitializationPhase) {
    InitializationPhase["NOT_STARTED"] = "not_started";
    InitializationPhase["WEBVIEW_SETUP"] = "webview_setup";
    InitializationPhase["MESSAGE_HANDLERS"] = "message_handlers";
    InitializationPhase["TERMINAL_SETUP"] = "terminal_setup";
    InitializationPhase["SERVICES_READY"] = "services_ready";
    InitializationPhase["COMPLETED"] = "completed";
    InitializationPhase["FAILED"] = "failed";
})(InitializationPhase || (exports.InitializationPhase = InitializationPhase = {}));
/**
 * InitializationOrchestrator
 *
 * Orchestrates the complete initialization sequence for the SecondaryTerminalProvider.
 * This service coordinates multiple initialization phases including WebView setup,
 * message handler registration, terminal initialization, and service configuration.
 *
 * Responsibilities:
 * - Coordinate initialization phases
 * - Track initialization state and progress
 * - Handle initialization errors gracefully
 * - Provide initialization metrics
 * - Ensure proper initialization order
 * - Prevent duplicate initialization
 *
 * Part of Issue #214 refactoring to apply Facade pattern
 */
class InitializationOrchestrator {
    constructor(_terminalCoordinator, _lifecycleManager, _messageRouter) {
        this._terminalCoordinator = _terminalCoordinator;
        this._lifecycleManager = _lifecycleManager;
        this._messageRouter = _messageRouter;
        this._currentPhase = InitializationPhase.NOT_STARTED;
        this._isInitialized = false;
        this._initializationStartTime = 0;
        this._phaseTimings = new Map();
    }
    /**
     * Get current initialization phase
     */
    getCurrentPhase() {
        return this._currentPhase;
    }
    /**
     * Check if initialization is complete
     */
    isInitialized() {
        return this._isInitialized;
    }
    /**
     * Get initialization phase timings
     */
    getPhaseTimings() {
        return new Map(this._phaseTimings);
    }
    /**
     * Get total initialization duration
     */
    getTotalDuration() {
        if (this._initializationStartTime === 0) {
            return 0;
        }
        return Date.now() - this._initializationStartTime;
    }
    /**
     * Execute the complete initialization sequence
     *
     * This method orchestrates all initialization phases:
     * 1. WebView setup (if lifecycle manager provided)
     * 2. Message handler initialization (if message router provided)
     * 3. Terminal initialization
     * 4. Services ready notification
     *
     * @returns Promise<InitializationResult> Result of initialization
     */
    async initialize() {
        if (this._isInitialized) {
            (0, logger_1.provider)('⚠️ [INIT] Already initialized, skipping duplicate initialization');
            return {
                success: true,
                phase: InitializationPhase.COMPLETED,
            };
        }
        this._initializationStartTime = Date.now();
        (0, logger_1.provider)('🚀 [INIT] === Starting Initialization Orchestration ===');
        try {
            // Phase 1: WebView Setup
            await this._executePhase(InitializationPhase.WEBVIEW_SETUP, async () => {
                if (this._lifecycleManager) {
                    (0, logger_1.provider)('🔧 [INIT] Phase 1: WebView setup');
                    // WebView setup is handled by lifecycle manager
                    // No additional work needed here
                }
            });
            // Phase 2: Message Handlers
            await this._executePhase(InitializationPhase.MESSAGE_HANDLERS, async () => {
                if (this._messageRouter) {
                    (0, logger_1.provider)('🔧 [INIT] Phase 2: Message handlers initialization');
                    this._messageRouter.setInitialized(true);
                    this._messageRouter.logRegisteredHandlers();
                }
            });
            // Phase 3: Terminal Setup
            await this._executePhase(InitializationPhase.TERMINAL_SETUP, async () => {
                (0, logger_1.provider)('🔧 [INIT] Phase 3: Terminal initialization');
                await this._terminalCoordinator.initialize();
            });
            // Phase 4: Services Ready
            await this._executePhase(InitializationPhase.SERVICES_READY, async () => {
                (0, logger_1.provider)('🔧 [INIT] Phase 4: Services ready');
                // All services are now ready
            });
            // Mark as completed
            this._currentPhase = InitializationPhase.COMPLETED;
            this._isInitialized = true;
            const totalDuration = this.getTotalDuration();
            (0, logger_1.provider)(`✅ [INIT] === Initialization Completed (${totalDuration}ms) ===`);
            this._logPhaseTimings();
            return {
                success: true,
                phase: InitializationPhase.COMPLETED,
                durationMs: totalDuration,
            };
        }
        catch (error) {
            this._currentPhase = InitializationPhase.FAILED;
            const totalDuration = this.getTotalDuration();
            (0, logger_1.provider)(`❌ [INIT] === Initialization Failed (${totalDuration}ms) ===`);
            (0, logger_1.provider)('❌ [INIT] Error:', error);
            this._logPhaseTimings();
            return {
                success: false,
                phase: this._currentPhase,
                error: error instanceof Error ? error : new Error(String(error)),
                durationMs: totalDuration,
            };
        }
    }
    /**
     * Initialize terminals only (lightweight initialization)
     *
     * This method can be called independently to initialize just the terminal
     * coordination without going through the full initialization sequence
     */
    async initializeTerminals() {
        (0, logger_1.provider)('🔧 [INIT] Initializing terminals only...');
        await this._terminalCoordinator.initialize();
        (0, logger_1.provider)('✅ [INIT] Terminal initialization completed');
    }
    /**
     * Reset initialization state
     *
     * This method clears initialization state and allows re-initialization.
     * Use with caution - typically only needed during testing or recovery.
     */
    reset() {
        (0, logger_1.provider)('🔄 [INIT] Resetting initialization state');
        this._currentPhase = InitializationPhase.NOT_STARTED;
        this._isInitialized = false;
        this._initializationStartTime = 0;
        this._phaseTimings.clear();
        (0, logger_1.provider)('✅ [INIT] Initialization state reset');
    }
    /**
     * Execute a single initialization phase with timing
     */
    async _executePhase(phase, executor) {
        this._currentPhase = phase;
        const phaseStart = Date.now();
        try {
            await executor();
            const phaseDuration = Date.now() - phaseStart;
            this._phaseTimings.set(phase, phaseDuration);
            (0, logger_1.provider)(`✅ [INIT] ${phase} completed (${phaseDuration}ms)`);
        }
        catch (error) {
            const phaseDuration = Date.now() - phaseStart;
            this._phaseTimings.set(phase, phaseDuration);
            (0, logger_1.provider)(`❌ [INIT] ${phase} failed (${phaseDuration}ms):`, error);
            throw error;
        }
    }
    /**
     * Log timing information for all phases
     */
    _logPhaseTimings() {
        (0, logger_1.provider)('📊 [INIT] === Phase Timings ===');
        for (const [phase, duration] of this._phaseTimings) {
            (0, logger_1.provider)(`📊 [INIT] ${phase}: ${duration}ms`);
        }
        (0, logger_1.provider)(`📊 [INIT] Total: ${this.getTotalDuration()}ms`);
    }
}
exports.InitializationOrchestrator = InitializationOrchestrator;
//# sourceMappingURL=InitializationOrchestrator.js.map