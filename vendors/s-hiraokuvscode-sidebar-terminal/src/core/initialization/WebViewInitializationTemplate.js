'use strict';
/**
 * WebView Initialization Template
 *
 * Abstract base class implementing the Template Method pattern for WebView initialization.
 * Consolidates ~200-250 lines of duplicated initialization logic across:
 * - SecondaryTerminalProvider
 * - LightweightTerminalWebviewManager
 * - TerminalInitializationCoordinator
 * - WebviewCoordinator
 *
 * Defines a standardized 7-phase initialization workflow:
 * 1. Pre-Initialization (Performance tracking, duplicate guards)
 * 2. Core Setup (View references, manager instantiation)
 * 3. Configuration (Settings loading/application)
 * 4. Message Infrastructure (Listeners, handlers)
 * 5. Content Initialization (HTML generation, UI)
 * 6. Post-Initialization (Additional listeners)
 * 7. Completion (Flags, performance metrics)
 *
 * @see https://github.com/s-hiraoku/vscode-sidebar-terminal/issues/218
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebViewInitializationTemplate = void 0;
const logger_1 = require('../../utils/logger');
/**
 * Abstract base class for WebView initialization using Template Method pattern
 */
class WebViewInitializationTemplate {
  constructor() {
    this._initializationMetrics = [];
    this._initializationStartTime = 0;
    this._isInitialized = false;
  }
  /**
   * Template Method - Defines the initialization algorithm
   *
   * This method should NOT be overridden by subclasses.
   * Instead, implement the abstract methods and hook methods.
   */
  async initialize(context) {
    const ctx = {
      skipDuplicates: true,
      performanceTracking: true,
      errorRecovery: true,
      ...context,
    };
    try {
      // Phase 1: Pre-Initialization
      this.performanceStart();
      if (ctx.skipDuplicates && this.shouldSkipInitialization()) {
        this.logPhase('Pre-Initialization', 'Skipped (duplicate guard)');
        return;
      }
      // Phase 2: Core Setup
      await this.executePhase('Core Setup', async () => {
        await this.setupViewReference();
        await this.instantiateManagers();
        await this.setupCoordinatorRelationships();
      });
      // Phase 3: Configuration
      await this.executePhase('Configuration', async () => {
        await this.configureWebView();
        await this.loadSettings();
        await this.applySettings();
      });
      // Phase 4: Message Infrastructure
      await this.executePhase('Message Infrastructure', async () => {
        await this.registerMessageHandlers();
        await this.registerEventListeners();
      });
      // Phase 5: Content Initialization
      await this.executePhase('Content Initialization', async () => {
        await this.initializeContent();
        await this.initializeUIComponents();
      });
      // Phase 6: Post-Initialization
      await this.executePhase('Post-Initialization', async () => {
        await this.postInitializationSetup();
      });
      // Phase 7: Completion
      this.markInitializationComplete();
      this.performanceEnd();
      this._isInitialized = true;
      this.logPhase('Completion', 'Initialization complete');
    } catch (error) {
      this.logPhase('Error', `Initialization failed: ${error}`);
      if (ctx.errorRecovery) {
        this.handleInitializationError(error);
      } else {
        throw error;
      }
    }
  }
  // ============================================================================
  // HOOK METHODS - Optional overrides with default implementations
  // ============================================================================
  /**
   * Phase 1: Check if initialization should be skipped (duplicate guard)
   *
   * Override to implement duplicate initialization prevention.
   *
   * Example:
   * - SecondaryTerminalProvider: Check _bodyRendered flag
   *
   * @returns true if initialization should be skipped, false otherwise
   */
  shouldSkipInitialization() {
    return this._isInitialized;
  }
  /**
   * Phase 2: Instantiate managers/services
   *
   * Override to create specialized managers for the context.
   *
   * Example:
   * - LightweightTerminalWebviewManager: Create 15+ specialized managers
   */
  async instantiateManagers() {
    // Default: No-op (not all contexts need managers)
  }
  /**
   * Phase 2: Setup coordinator relationships between managers
   *
   * Override to wire up dependencies between managers.
   *
   * Example:
   * - LightweightTerminalWebviewManager: Call setCoordinator() on all managers
   */
  async setupCoordinatorRelationships() {
    // Default: No-op
  }
  /**
   * Phase 3: Configure webview options
   *
   * Override to set webview-specific options (VS Code only).
   *
   * Example:
   * - SecondaryTerminalProvider: Set enableScripts, localResourceRoots
   */
  async configureWebView() {
    // Default: No-op (only relevant for VS Code provider)
  }
  /**
   * Phase 3: Load settings from storage
   *
   * Override to load settings from appropriate source.
   *
   * Example:
   * - SecondaryTerminalProvider: Load from VS Code configuration
   * - LightweightTerminalWebviewManager: Load from webview state
   */
  async loadSettings() {
    // Default: No-op
  }
  /**
   * Phase 3: Apply loaded settings
   *
   * Override to apply settings to managers/components.
   *
   * Example:
   * - LightweightTerminalWebviewManager: Apply to ConfigManager, terminals
   */
  async applySettings() {
    // Default: No-op
  }
  /**
   * Phase 4: Register event listeners
   *
   * Override to register lifecycle, visibility, or other event listeners.
   *
   * Example:
   * - SecondaryTerminalProvider: Register visibility, panel location listeners
   * - LightweightTerminalWebviewManager: Register page lifecycle listeners
   */
  async registerEventListeners() {
    // Default: No-op
  }
  /**
   * Phase 5: Initialize UI components
   *
   * Override to initialize UI elements beyond basic content.
   *
   * Example:
   * - LightweightTerminalWebviewManager: Initialize input manager, settings panel
   */
  async initializeUIComponents() {
    // Default: No-op
  }
  /**
   * Phase 6: Post-initialization setup (additional listeners, features)
   *
   * Override to perform additional setup after core initialization.
   *
   * Example:
   * - SecondaryTerminalProvider: Setup panel location listener
   * - LightweightTerminalWebviewManager: Setup scrollback listener
   */
  async postInitializationSetup() {
    // Default: No-op
  }
  /**
   * Error Handling: Handle initialization errors
   *
   * Override to implement custom error recovery.
   *
   * Example:
   * - SecondaryTerminalProvider: Generate fallback HTML
   * - TerminalInitializationCoordinator: Emergency terminal creation
   */
  handleInitializationError(error) {
    this.logError('Initialization failed', error);
    throw error;
  }
  // ============================================================================
  // CONCRETE METHODS - Reusable utilities (DO NOT override)
  // ============================================================================
  /**
   * Mark initialization as complete
   *
   * Sets internal flags to indicate successful initialization.
   */
  markInitializationComplete() {
    this._isInitialized = true;
  }
  /**
   * Check if initialization is complete
   */
  isInitialized() {
    return this._isInitialized;
  }
  /**
   * Get initialization metrics
   */
  getInitializationMetrics() {
    return [...this._initializationMetrics];
  }
  /**
   * Get total initialization duration
   */
  getTotalInitializationDuration() {
    if (this._initializationMetrics.length === 0) return 0;
    const last = this._initializationMetrics[this._initializationMetrics.length - 1];
    return last ? last.endTime - this._initializationStartTime : 0;
  }
  // ============================================================================
  // PRIVATE UTILITIES
  // ============================================================================
  /**
   * Start performance tracking
   */
  performanceStart() {
    this._initializationStartTime = Date.now();
  }
  /**
   * End performance tracking
   */
  performanceEnd() {
    const totalDuration = Date.now() - this._initializationStartTime;
    this.logPhase('Performance', `Total initialization time: ${totalDuration}ms`);
  }
  /**
   * Execute a phase with timing and error tracking
   */
  async executePhase(phase, fn) {
    const startTime = Date.now();
    try {
      await fn();
      const endTime = Date.now();
      this._initializationMetrics.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        phase,
        success: true,
      });
      this.logPhase(phase, `Completed in ${endTime - startTime}ms`);
    } catch (error) {
      const endTime = Date.now();
      this._initializationMetrics.push({
        startTime,
        endTime,
        duration: endTime - startTime,
        phase,
        success: false,
        error,
      });
      this.logPhase(phase, `Failed: ${error}`);
      throw error;
    }
  }
  /**
   * Log phase information
   */
  logPhase(phase, message) {
    (0, logger_1.info)(`[${phase}] ${message}`);
  }
  /**
   * Log error information
   */
  logError(message, error) {
    (0, logger_1.error)(`[ERROR] ${message}:`, error);
  }
}
exports.WebViewInitializationTemplate = WebViewInitializationTemplate;
//# sourceMappingURL=WebViewInitializationTemplate.js.map
