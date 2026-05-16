"use strict";
/**
 * Terminal Addon Manager
 *
 * Extracted from TerminalLifecycleCoordinator to centralize addon management.
 *
 * Responsibilities:
 * - Loading and initializing xterm.js addons
 * - Managing addon lifecycle and disposal
 * - Providing typed access to loaded addons
 * - Handling optional vs required addons gracefully
 *
 * @see openspec/changes/refactor-terminal-foundation/specs/split-lifecycle-manager/spec.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalAddonManager = void 0;
const addon_fit_1 = require("@xterm/addon-fit");
const addon_web_links_1 = require("@xterm/addon-web-links");
const addon_search_1 = require("@xterm/addon-search");
const addon_serialize_1 = require("@xterm/addon-serialize");
const addon_unicode11_1 = require("@xterm/addon-unicode11");
const ManagerLogger_1 = require("../utils/ManagerLogger");
const AddonLoader_1 = require("../utils/AddonLoader");
const ErrorHandler_1 = require("../utils/ErrorHandler");
/**
 * Service responsible for managing xterm.js addons
 */
class TerminalAddonManager {
    /**
     * Load all addons for a terminal instance using AddonLoader utility
     *
     * Refactored to use generic AddonLoader, eliminating 60+ lines of duplicated code.
     * @see AddonLoader for generic loading implementation
     */
    async loadAllAddons(terminal, terminalId, config) {
        const addons = {};
        try {
            // Load essential addons (required - throws on error)
            const fitAddon = await AddonLoader_1.AddonLoader.loadAddon(terminal, terminalId, addon_fit_1.FitAddon, {
                required: true,
            });
            if (!fitAddon) {
                throw new Error(`FitAddon failed to load for terminal: ${terminalId}`);
            }
            addons.fitAddon = fitAddon;
            this.patchFitAddonForScrollbar(terminal, fitAddon);
            if (config.linkHandler) {
                // Use custom handler so links are opened by the extension (vscode.env.openExternal)
                // VS Code standard: links require modifier key + click to activate
                // This follows editor.multiCursorModifier setting:
                // - 'alt': Alt+Click activates links (VS Code default when multiCursorModifier is 'alt')
                // - 'ctrlCmd': Cmd/Ctrl+Click activates links (when multiCursorModifier is 'ctrlCmd')
                const linkModifier = config.linkModifier ?? 'ctrlCmd'; // Default to Cmd/Ctrl for link activation
                const webLinksAddon = new addon_web_links_1.WebLinksAddon((event, uri) => {
                    try {
                        ManagerLogger_1.terminalLogger.info(`🔗 [WEBVIEW] Link clicked in terminal ${terminalId}: ${uri} (meta=${Boolean(event?.metaKey)}, ctrl=${Boolean(event?.ctrlKey)}, alt=${Boolean(event?.altKey)})`);
                        // Forward to extension
                        config.linkHandler?.(event, uri);
                    }
                    catch (error) {
                        ManagerLogger_1.terminalLogger.warn(`⚠️ WebLinksAddon handler failed for ${terminalId}:`, error);
                    }
                }, 
                // VS Code standard: willLinkActivate checks for modifier key
                // When modifier is pressed + left click, activate the link
                // This allows normal text selection without triggering links
                {
                    willLinkActivate: (event) => {
                        if (!event || event.button !== 0)
                            return false;
                        // Check for the appropriate modifier key based on VS Code settings
                        // VS Code's terminal uses the OPPOSITE modifier for links:
                        // - When multiCursorModifier is 'alt', Cmd/Ctrl+Click opens links
                        // - When multiCursorModifier is 'ctrlCmd', Alt+Click opens links
                        if (linkModifier === 'alt') {
                            // Alt is used for multi-cursor, so Cmd/Ctrl opens links
                            return event.metaKey || event.ctrlKey;
                        }
                        else {
                            // Cmd/Ctrl is used for multi-cursor, so Alt opens links
                            return event.altKey;
                        }
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                });
                terminal.loadAddon(webLinksAddon);
                addons.webLinksAddon = webLinksAddon;
                ManagerLogger_1.terminalLogger.info(`✅ WebLinksAddon loaded with custom handler for terminal: ${terminalId}`);
            }
            else {
                addons.webLinksAddon = await AddonLoader_1.AddonLoader.loadAddon(terminal, terminalId, addon_web_links_1.WebLinksAddon, {
                    required: true,
                });
            }
            addons.serializeAddon = await AddonLoader_1.AddonLoader.loadAddon(terminal, terminalId, addon_serialize_1.SerializeAddon, {
                required: true,
                addonName: 'SerializeAddon (scrollback)',
            });
            // Load optional addons (graceful degradation - returns undefined on error)
            if (config.enableSearchAddon) {
                addons.searchAddon = await AddonLoader_1.AddonLoader.loadAddon(terminal, terminalId, addon_search_1.SearchAddon, {
                    required: false,
                });
            }
            // 🔧 FIX: WebGL addon is now loaded ONLY by RenderingOptimizer
            // to avoid duplicate loading which causes rendering issues on macOS.
            // RenderingOptimizer has better error handling and automatic DOM fallback.
            if (config.enableUnicode11) {
                addons.unicode11Addon = await AddonLoader_1.AddonLoader.loadAddon(terminal, terminalId, addon_unicode11_1.Unicode11Addon, {
                    required: false,
                    onLoaded: (_addon, term) => {
                        term.unicode.activeVersion = '11';
                    },
                });
            }
            ManagerLogger_1.terminalLogger.info(`✅ All addons loaded successfully for terminal: ${terminalId}`);
            return addons;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handleOperationError(`Addon loading for ${terminalId}`, error, {
                severity: 'error',
                rethrow: true,
                context: { terminalId },
            });
            // TypeScript requires return statement after rethrow (unreachable code)
            throw error;
        }
    }
    /**
     * Get specific addon from loaded addons
     */
    getAddon(addons, addonName) {
        return addons[addonName];
    }
    /**
     * Dispose all addons
     */
    disposeAddons(addons) {
        if (!addons) {
            return;
        }
        try {
            // Dispose optional addons
            if (addons.searchAddon) {
                addons.searchAddon.dispose();
            }
            if (addons.webglAddon) {
                addons.webglAddon.dispose();
            }
            if (addons.unicode11Addon) {
                addons.unicode11Addon.dispose?.();
            }
            // Note: FitAddon, WebLinksAddon, and SerializeAddon are disposed
            // automatically when the terminal is disposed
            ManagerLogger_1.terminalLogger.info('✅ Addons disposed successfully');
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handleOperationError('Addon disposal', error, {
                severity: 'warn',
                rethrow: false,
            });
        }
    }
    /**
     * Dispose cleanup
     */
    dispose() {
        ManagerLogger_1.terminalLogger.info('TerminalAddonManager disposed');
    }
    patchFitAddonForScrollbar(terminal, fitAddon) {
        const originalPropose = fitAddon.proposeDimensions.bind(fitAddon);
        fitAddon.proposeDimensions = () => {
            const element = terminal.element;
            const parent = element?.parentElement;
            const core = terminal._core;
            const dimensions = core?._renderService?.dimensions;
            if (!element || !parent || !dimensions) {
                return originalPropose();
            }
            const cellWidth = dimensions.css.cell.width;
            const cellHeight = dimensions.css.cell.height;
            if (cellWidth === 0 || cellHeight === 0) {
                return originalPropose();
            }
            const parentStyle = window.getComputedStyle(parent);
            const elementStyle = window.getComputedStyle(element);
            const height = parseInt(parentStyle.getPropertyValue('height'), 10);
            const width = Math.max(0, parseInt(parentStyle.getPropertyValue('width'), 10));
            if (Number.isNaN(height) || Number.isNaN(width)) {
                return originalPropose();
            }
            const paddingVertical = (parseInt(elementStyle.getPropertyValue('padding-top'), 10) || 0) +
                (parseInt(elementStyle.getPropertyValue('padding-bottom'), 10) || 0);
            const paddingHorizontal = (parseInt(elementStyle.getPropertyValue('padding-left'), 10) || 0) +
                (parseInt(elementStyle.getPropertyValue('padding-right'), 10) || 0);
            const parentPaddingVertical = (parseInt(parentStyle.getPropertyValue('padding-top'), 10) || 0) +
                (parseInt(parentStyle.getPropertyValue('padding-bottom'), 10) || 0);
            const parentPaddingHorizontal = (parseInt(parentStyle.getPropertyValue('padding-left'), 10) || 0) +
                (parseInt(parentStyle.getPropertyValue('padding-right'), 10) || 0);
            const viewport = element.querySelector('.xterm-viewport');
            const actualScrollbarWidth = viewport
                ? Math.max(0, viewport.offsetWidth - viewport.clientWidth)
                : 0;
            const scrollbarWidth = actualScrollbarWidth || core?.viewport?.scrollBarWidth || 0;
            const availableHeight = height - paddingVertical - parentPaddingVertical;
            const availableWidth = width - paddingHorizontal - parentPaddingHorizontal - scrollbarWidth;
            const safetyPaddingPx = 0; // Remove safety padding to maximize visible area
            return {
                cols: Math.max(2, Math.floor((availableWidth - safetyPaddingPx) / cellWidth)),
                rows: Math.max(1, Math.floor(availableHeight / cellHeight)),
            };
        };
    }
}
exports.TerminalAddonManager = TerminalAddonManager;
//# sourceMappingURL=TerminalAddonManager.js.map