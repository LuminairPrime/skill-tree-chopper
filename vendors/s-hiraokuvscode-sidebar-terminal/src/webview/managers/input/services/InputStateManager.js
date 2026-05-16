"use strict";
/**
 * InputStateManager - Unified state management for input handlers
 * Based on similarity analysis showing fragmented state management patterns
 * Centralizes IME, Alt+Click, keyboard, and agent interaction states
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputStateManager = void 0;
const logger_1 = require("../../../../utils/logger");
/**
 * Centralized input state manager
 * Eliminates duplicate state management patterns found across handlers
 */
class InputStateManager {
    constructor(logger = logger_1.webview) {
        // State change listeners
        this.listeners = new Map();
        // State validation rules
        this.validationRules = new Map();
        // State change history for debugging
        this.stateHistory = [];
        this.logger = logger;
        // Initialize default state
        this.state = this.createDefaultState();
        this.previousState = this.createDefaultState();
        // Set up validation rules
        this.setupValidationRules();
        this.logger('InputStateManager initialized');
    }
    /**
     * Create default input state
     */
    createDefaultState() {
        return {
            ime: {
                isActive: false,
                data: '',
                startOffset: 0,
                endOffset: 0,
                lastEvent: null,
                timestamp: 0,
            },
            altClick: {
                isVSCodeAltClickEnabled: false,
                isAltKeyPressed: false,
                lastClickPosition: null,
                clickCount: 0,
            },
            keyboard: {
                isInChordMode: false,
                lastKeyPressed: null,
                modifiers: {
                    ctrl: false,
                    alt: false,
                    shift: false,
                    meta: false,
                },
                lastKeyTimestamp: 0,
            },
            agent: {
                isAgentMode: false,
                agentType: null,
                isAwaitingResponse: false,
                lastCommand: null,
                commandTimestamp: 0,
            },
        };
    }
    /**
     * Set up state validation rules
     */
    setupValidationRules() {
        // IME state validation
        this.validationRules.set('ime', (state) => {
            const errors = [];
            const warnings = [];
            if (state.isActive && !state.data && state.lastEvent !== 'start') {
                warnings.push('IME active but no composition data');
            }
            if (state.startOffset < 0 || state.endOffset < 0) {
                errors.push('Invalid IME offset values');
            }
            if (state.timestamp < 0) {
                errors.push('Invalid IME timestamp');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        });
        // Alt+Click state validation
        this.validationRules.set('altClick', (state) => {
            const errors = [];
            const warnings = [];
            if (state.clickCount < 0) {
                errors.push('Invalid click count');
            }
            if (state.isAltKeyPressed && !state.isVSCodeAltClickEnabled) {
                warnings.push('Alt key pressed but Alt+Click not enabled');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        });
        // Keyboard state validation
        this.validationRules.set('keyboard', (state) => {
            const errors = [];
            const warnings = [];
            if (state.lastKeyTimestamp < 0) {
                errors.push('Invalid keyboard timestamp');
            }
            if (state.isInChordMode && !state.lastKeyPressed) {
                warnings.push('In chord mode but no last key recorded');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        });
        // Agent state validation
        this.validationRules.set('agent', (state) => {
            const errors = [];
            const warnings = [];
            if (state.isAgentMode && !state.agentType) {
                warnings.push('Agent mode active but no agent type set');
            }
            if (state.commandTimestamp < 0) {
                errors.push('Invalid agent command timestamp');
            }
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        });
    }
    /**
     * Get current input state
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state)); // Deep clone
    }
    /**
     * Get specific state section
     */
    getStateSection(section) {
        return JSON.parse(JSON.stringify(this.state[section])); // Deep clone
    }
    /**
     * Update IME composition state
     */
    updateIMEState(updates) {
        this.updateStateSection('ime', updates);
    }
    /**
     * Update Alt+Click state
     */
    updateAltClickState(updates) {
        this.updateStateSection('altClick', updates);
    }
    /**
     * Update keyboard state
     */
    updateKeyboardState(updates) {
        this.updateStateSection('keyboard', updates);
    }
    /**
     * Update agent interaction state
     */
    updateAgentState(updates) {
        this.updateStateSection('agent', updates);
    }
    /**
     * Update specific state section
     */
    updateStateSection(section, updates) {
        // Store previous state
        this.previousState[section] = JSON.parse(JSON.stringify(this.state[section]));
        // Apply updates
        this.state[section] = {
            ...this.state[section],
            ...updates,
        };
        // Validate new state
        const validationResult = this.validateStateSection(section);
        if (!validationResult.isValid) {
            this.logger(`State validation errors for ${section}: ${validationResult.errors.join(', ')}`);
        }
        if (validationResult.warnings.length > 0) {
            this.logger(`State validation warnings for ${section}: ${validationResult.warnings.join(', ')}`);
        }
        // Record state change
        this.recordStateChange(section, this.previousState[section], this.state[section]);
        // Notify listeners
        this.notifyStateChange(section, this.state[section], this.previousState[section]);
        this.logger(`Updated ${section} state`);
    }
    /**
     * Validate specific state section
     */
    validateStateSection(section) {
        const validator = this.validationRules.get(section);
        if (validator) {
            return validator(this.state[section]);
        }
        return {
            isValid: true,
            errors: [],
            warnings: [],
        };
    }
    /**
     * Record state change in history
     */
    recordStateChange(stateKey, previousValue, newValue) {
        this.stateHistory.push({
            timestamp: Date.now(),
            stateKey,
            previousValue: JSON.parse(JSON.stringify(previousValue)),
            newValue: JSON.parse(JSON.stringify(newValue)),
        });
        // Keep history size manageable
        if (this.stateHistory.length > 100) {
            this.stateHistory.shift();
        }
    }
    /**
     * Notify state change listeners
     */
    notifyStateChange(stateKey, newValue, previousValue) {
        const sectionListeners = this.listeners.get(stateKey);
        if (sectionListeners) {
            for (const listener of sectionListeners) {
                try {
                    listener(newValue, previousValue, stateKey);
                }
                catch (error) {
                    this.logger(`Error in state change listener for ${stateKey}: ${error}`);
                }
            }
        }
        // Also notify global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            for (const listener of globalListeners) {
                try {
                    listener(newValue, previousValue, stateKey);
                }
                catch (error) {
                    this.logger(`Error in global state change listener: ${error}`);
                }
            }
        }
    }
    /**
     * Add state change listener
     */
    addStateListener(section, listener) {
        if (!this.listeners.has(section)) {
            this.listeners.set(section, new Set());
        }
        this.listeners.get(section).add(listener);
        this.logger(`Added state listener for ${section}`);
    }
    /**
     * Remove state change listener
     */
    removeStateListener(section, listener) {
        const sectionListeners = this.listeners.get(section);
        if (sectionListeners) {
            sectionListeners.delete(listener);
            if (sectionListeners.size === 0) {
                this.listeners.delete(section);
            }
            this.logger(`Removed state listener for ${section}`);
        }
    }
    /**
     * Reset specific state section to default
     */
    resetStateSection(section) {
        const defaultState = this.createDefaultState();
        this.updateStateSection(section, defaultState[section]);
        this.logger(`Reset ${section} state to default`);
    }
    /**
     * Reset all state to default
     */
    resetAllState() {
        const defaultState = this.createDefaultState();
        // Update each section individually to trigger proper notifications
        for (const section of Object.keys(defaultState)) {
            this.updateStateSection(section, defaultState[section]);
        }
        this.logger('Reset all state to default');
    }
    /**
     * Get state change history
     */
    getStateHistory(limit = 10) {
        return JSON.parse(JSON.stringify(this.stateHistory.slice(-limit))); // Deep clone history
    }
    /**
     * Check if any critical state is active
     */
    hasCriticalStateActive() {
        return (this.state.ime.isActive ||
            this.state.keyboard.isInChordMode ||
            this.state.agent.isAwaitingResponse);
    }
    /**
     * Get state summary for debugging
     */
    getStateSummary() {
        return {
            ime: {
                active: this.state.ime.isActive,
                hasData: this.state.ime.data.length > 0,
                lastEvent: this.state.ime.lastEvent,
            },
            altClick: {
                enabled: this.state.altClick.isVSCodeAltClickEnabled,
                pressed: this.state.altClick.isAltKeyPressed,
                clickCount: this.state.altClick.clickCount,
            },
            keyboard: {
                chordMode: this.state.keyboard.isInChordMode,
                lastKey: this.state.keyboard.lastKeyPressed,
                modifiersActive: Object.values(this.state.keyboard.modifiers).some(Boolean),
            },
            agent: {
                active: this.state.agent.isAgentMode,
                type: this.state.agent.agentType,
                awaiting: this.state.agent.isAwaitingResponse,
            },
        };
    }
    /**
     * Dispose of state manager and cleanup
     */
    dispose() {
        this.logger('Disposing InputStateManager');
        // Clear all listeners
        this.listeners.clear();
        // Clear state history
        this.stateHistory = [];
        // Reset state
        this.state = this.createDefaultState();
        this.previousState = this.createDefaultState();
        // Clear validation rules
        this.validationRules.clear();
        this.logger('InputStateManager disposed');
    }
}
exports.InputStateManager = InputStateManager;
//# sourceMappingURL=InputStateManager.js.map