"use strict";
/**
 * Container Visibility Service
 *
 * Extracted from TerminalContainerManager for better maintainability.
 * Handles container visibility control and display state enforcement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerVisibilityService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
/**
 * Service for managing terminal container visibility
 */
class ContainerVisibilityService {
    constructor() {
        /** Hidden container storage element */
        this.hiddenContainerStorage = null;
    }
    /**
     * Check if an element is visible
     */
    isElementVisible(element) {
        if (!element) {
            return false;
        }
        return element.style.display !== 'none' && !element.classList.contains('hidden-mode');
    }
    /**
     * Enforce fullscreen state for containers
     */
    enforceFullscreenState(activeTerminalId, terminalBody, _containerCache) {
        const containers = terminalBody.querySelectorAll('.terminal-container');
        const hiddenStorage = this.getHiddenStorage(terminalBody, true);
        containers.forEach((container) => {
            const containerId = container.getAttribute('data-terminal-id');
            const isActive = containerId !== null && containerId === activeTerminalId;
            if (isActive) {
                container.style.display = 'flex';
                container.style.width = '100%';
                container.style.height = '100%';
                container.classList.remove('hidden-mode');
                container.classList.add('terminal-container--fullscreen');
                // 🔧 FIX: Append to terminals-wrapper instead of terminal-body
                const terminalsWrapper = document.getElementById('terminals-wrapper') || terminalBody;
                terminalsWrapper.appendChild(container);
            }
            else {
                container.style.display = 'none';
                container.classList.add('hidden-mode');
                container.classList.remove('terminal-container--fullscreen', 'terminal-container--split');
                if (hiddenStorage && container.parentElement !== hiddenStorage) {
                    hiddenStorage.appendChild(container);
                }
            }
        });
        // Remove split artifacts
        terminalBody.querySelectorAll('[data-terminal-wrapper-id]').forEach((wrapper) => {
            wrapper.remove();
        });
        terminalBody.querySelectorAll('.split-resizer').forEach((resizer) => {
            resizer.remove();
        });
    }
    /**
     * Normalize terminal body by moving all containers back
     */
    normalizeTerminalBody(terminalBody, containerCache) {
        const storage = this.getHiddenStorage(terminalBody, false);
        if (storage) {
            containerCache.forEach((container) => {
                if (container.parentElement === storage) {
                    // 🔧 FIX: Append to terminals-wrapper instead of terminal-body
                    const terminalsWrapper = document.getElementById('terminals-wrapper') || terminalBody;
                    terminalsWrapper.appendChild(container);
                }
            });
            storage.textContent = ''; // Safe: clearing content
        }
        containerCache.forEach((container) => {
            container.classList.remove('terminal-container--fullscreen');
            container.style.removeProperty('height');
            container.style.removeProperty('width');
            if (container.classList.contains('hidden-mode')) {
                container.style.display = 'none';
            }
            else {
                container.style.removeProperty('display');
            }
        });
    }
    /**
     * Get or create hidden storage element
     */
    getHiddenStorage(terminalBody, createIfMissing) {
        if (this.hiddenContainerStorage && document.contains(this.hiddenContainerStorage)) {
            return this.hiddenContainerStorage;
        }
        if (!createIfMissing) {
            return null;
        }
        const storage = document.createElement('div');
        storage.id = 'terminal-hidden-storage';
        storage.style.display = 'none';
        terminalBody.appendChild(storage);
        this.hiddenContainerStorage = storage;
        return storage;
    }
    /**
     * Get the terminals-wrapper element or fallback to terminal-body
     */
    getTerminalsWrapper(terminalBody) {
        return document.getElementById('terminals-wrapper') || terminalBody;
    }
    /**
     * Ensure container is in the terminal body
     */
    ensureContainerInBody(container, terminalBody) {
        const terminalsWrapper = this.getTerminalsWrapper(terminalBody);
        if (container.parentElement !== terminalsWrapper) {
            terminalsWrapper.appendChild(container);
        }
    }
    /**
     * Show a container
     */
    showContainer(container) {
        container.style.display = 'flex';
        container.classList.remove('hidden-mode');
        ManagerLogger_1.containerLogger.debug(`Container shown: ${container.dataset.terminalId}`);
    }
    /**
     * Hide a container
     */
    hideContainer(container, terminalBody) {
        container.style.display = 'none';
        container.classList.add('hidden-mode');
        const hiddenStorage = this.getHiddenStorage(terminalBody, true);
        if (hiddenStorage && container.parentElement !== hiddenStorage) {
            hiddenStorage.appendChild(container);
        }
        ManagerLogger_1.containerLogger.debug(`Container hidden: ${container.dataset.terminalId}`);
    }
    /**
     * Restore a container from hidden storage back to visible DOM.
     * After moving, refreshes the xterm.js canvas layers so they render correctly.
     */
    restoreFromHiddenStorage(container, terminalBody, terminal) {
        const terminalsWrapper = this.getTerminalsWrapper(terminalBody);
        if (container.parentElement !== terminalsWrapper) {
            terminalsWrapper.appendChild(container);
        }
        // After restoring from hidden storage, xterm.js canvas layers need a refresh
        if (terminal) {
            try {
                terminal.refresh(0, terminal.rows - 1);
                ManagerLogger_1.containerLogger.debug(`Terminal canvas refreshed after restore: ${container.dataset.terminalId}`);
            }
            catch (error) {
                ManagerLogger_1.containerLogger.warn(`Failed to refresh terminal after restore: ${container.dataset.terminalId}`, error);
            }
        }
    }
    /**
     * Clear hidden storage reference
     */
    clearHiddenStorage() {
        this.hiddenContainerStorage = null;
    }
}
exports.ContainerVisibilityService = ContainerVisibilityService;
//# sourceMappingURL=ContainerVisibilityService.js.map