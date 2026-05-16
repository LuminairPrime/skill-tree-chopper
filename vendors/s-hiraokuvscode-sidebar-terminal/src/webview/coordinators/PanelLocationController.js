"use strict";
/**
 * PanelLocationController
 *
 * Panel location management methods extracted from LightweightTerminalWebviewManager.
 * Handles panel location detection, sync, flex-direction queries, and event-driven updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelLocationController = void 0;
class PanelLocationController {
    constructor(deps) {
        this.deps = deps;
        this.eventHandler = this.handlePanelLocationChanged.bind(this);
        this.setupPanelLocationSync();
    }
    /**
     * Update panel location and flex-direction if changed.
     * Delegates to ConsolidatedMessageManager -> PanelLocationHandler.
     * Single entry point for layout updates (VS Code pattern).
     *
     * @returns true if layout was updated, false if no change
     */
    updatePanelLocationIfNeeded() {
        return this.deps.messageManagerUpdatePanelLocationIfNeeded();
    }
    /**
     * Get current panel location
     */
    getCurrentPanelLocation() {
        return this.deps.messageManagerGetCurrentPanelLocation();
    }
    /**
     * Get current flex-direction
     */
    getCurrentFlexDirection() {
        return this.deps.messageManagerGetCurrentFlexDirection();
    }
    /**
     * Clean up event listeners
     */
    dispose() {
        window.removeEventListener('terminal-panel-location-changed', this.eventHandler);
    }
    setupPanelLocationSync() {
        // Panel location (sidebar/panel) changes - keep split layout direction in sync
        window.addEventListener('terminal-panel-location-changed', this.eventHandler);
        // Best-effort sync: apply the current location even if the first event fired before full UI was ready
        setTimeout(() => {
            try {
                const terminalsWrapper = document.getElementById('terminals-wrapper');
                if (!terminalsWrapper) {
                    return;
                }
                const location = terminalsWrapper.classList.contains('terminal-split-horizontal')
                    ? 'panel'
                    : 'sidebar';
                this.deps.splitManagerSetPanelLocation(location);
                const terminalCount = this.deps.splitManagerGetTerminalCount();
                const currentMode = this.deps.displayModeManagerGetCurrentMode();
                if (location === 'panel' && terminalCount > 1 && currentMode !== 'fullscreen') {
                    this.deps.displayModeManagerShowAllTerminalsSplit();
                }
                else if (location === 'sidebar' && currentMode === 'split') {
                    this.deps.displayModeManagerShowAllTerminalsSplit();
                }
            }
            catch {
                // ignore
            }
        }, 250);
    }
    handlePanelLocationChanged(event) {
        const customEvent = event;
        const location = customEvent.detail?.location;
        if (location !== 'sidebar' && location !== 'panel') {
            return;
        }
        this.deps.splitManagerSetPanelLocation(location);
        const direction = location === 'panel' ? 'horizontal' : 'vertical';
        try {
            const terminalCount = this.deps.splitManagerGetTerminalCount();
            const currentMode = this.deps.displayModeManagerGetCurrentMode();
            // Bottom panel: if multiple terminals are visible (i.e. not fullscreen), enforce split layout immediately
            if (location === 'panel' && terminalCount > 1 && currentMode !== 'fullscreen') {
                this.deps.displayModeManagerShowAllTerminalsSplit();
                return;
            }
            // Sidebar: if already in split mode, rebuild layout to ensure vertical stacking
            if (location === 'sidebar' && currentMode === 'split') {
                this.deps.displayModeManagerShowAllTerminalsSplit();
                return;
            }
        }
        catch {
            // fall through
        }
        // Otherwise, just update split direction for the next activation
        this.deps.splitManagerUpdateSplitDirection(direction, location);
    }
}
exports.PanelLocationController = PanelLocationController;
//# sourceMappingURL=PanelLocationController.js.map