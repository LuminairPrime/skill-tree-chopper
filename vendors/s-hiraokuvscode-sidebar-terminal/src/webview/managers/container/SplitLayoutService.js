"use strict";
/**
 * Split Layout Service
 *
 * Extracted from TerminalContainerManager for better maintainability.
 * Handles split layout creation, wrapper management, and resizer handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitLayoutService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
const webview_1 = require("../../constants/webview");
const GridLayoutCalculator_1 = require("../../utils/GridLayoutCalculator");
/**
 * Service for managing split terminal layouts
 */
class SplitLayoutService {
    constructor() {
        this.splitWrapperCache = new Map();
        this.splitResizers = new Set();
        this.coordinator = null;
        this.gridMode = false;
        this.gridRowResizer = null;
    }
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
    }
    getSplitWrapperCache() {
        return this.splitWrapperCache;
    }
    getSplitResizers() {
        return this.splitResizers;
    }
    getWrapper(terminalId) {
        return this.splitWrapperCache.get(terminalId);
    }
    cacheWrapper(terminalId, wrapper) {
        this.splitWrapperCache.set(terminalId, wrapper);
    }
    removeWrapper(terminalId) {
        return this.splitWrapperCache.delete(terminalId);
    }
    refreshSplitArtifacts() {
        const wrappers = document.querySelectorAll('[data-terminal-wrapper-id]');
        wrappers.forEach((wrapper) => {
            const terminalId = wrapper.getAttribute('data-terminal-wrapper-id');
            if (terminalId) {
                this.splitWrapperCache.set(terminalId, wrapper);
            }
        });
        const resizers = document.querySelectorAll('.split-resizer');
        if (resizers.length > 0) {
            this.splitResizers.clear();
            resizers.forEach((resizer) => this.splitResizers.add(resizer));
        }
    }
    /**
     * Activate split layout for terminals
     */
    activateSplitLayout(terminalBody, orderedTerminalIds, splitDirection, getContainer) {
        const terminalCount = orderedTerminalIds.length;
        if (terminalCount === 0) {
            ManagerLogger_1.containerLogger.warn('No terminals to display in split mode');
            return;
        }
        ManagerLogger_1.containerLogger.info('🎨 [LAYOUT] ==================== ACTIVATING SPLIT LAYOUT ====================');
        ManagerLogger_1.containerLogger.info(`🎨 [LAYOUT] Terminal count: ${terminalCount}, direction: ${splitDirection}`);
        // Panel (horizontal) -> row, Sidebar (vertical) -> column
        const flexDirection = splitDirection === 'horizontal' ? 'row' : 'column';
        this.setupTerminalBody(terminalBody);
        const terminalsWrapper = this.ensureTerminalsWrapper(terminalBody);
        terminalsWrapper.classList.toggle('terminal-split-horizontal', splitDirection === 'horizontal');
        terminalsWrapper.style.flexDirection = flexDirection;
        const containersToWrap = this.collectContainers(orderedTerminalIds, getContainer);
        terminalsWrapper.textContent = '';
        this.splitWrapperCache.clear();
        this.splitResizers.clear();
        containersToWrap.forEach(({ id: terminalId, container }, index) => {
            ManagerLogger_1.containerLogger.debug(`🎨 [SPLIT-LAYOUT] Processing terminal ${index + 1}/${terminalCount}: ${terminalId}`);
            const wrapper = this.createSplitWrapper(terminalId, splitDirection);
            const area = this.getWrapperArea(wrapper, terminalId, true);
            if (area) {
                area.appendChild(container);
            }
            this.applyContainerSplitStyles(container);
            terminalsWrapper.appendChild(wrapper);
            this.splitWrapperCache.set(terminalId, wrapper);
            // Add resizer between terminals (not after the last one)
            if (index < containersToWrap.length - 1) {
                const nextTerminalId = containersToWrap[index + 1].id;
                const resizer = this.createSplitResizer(splitDirection);
                resizer.setAttribute('data-resizer-before', terminalId);
                resizer.setAttribute('data-resizer-after', nextTerminalId);
                terminalsWrapper.appendChild(resizer);
                this.splitResizers.add(resizer);
            }
        });
        ManagerLogger_1.containerLogger.info(`Split layout activated: ${containersToWrap.length} wrappers, ${this.splitResizers.size} resizers`);
        this.scheduleResizerInitialization('split');
    }
    /**
     * Create a split wrapper element.
     * Sidebar (vertical): stacked vertically, full width.
     * Panel (horizontal): side-by-side, full height.
     */
    createSplitWrapper(terminalId, splitDirection) {
        const wrapper = document.createElement('div');
        wrapper.className = 'terminal-split-wrapper';
        wrapper.setAttribute('data-terminal-wrapper-id', terminalId);
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.style.flex = '1 1 0';
        wrapper.style.minWidth = '0';
        wrapper.style.minHeight = '0';
        if (splitDirection === 'vertical') {
            wrapper.style.width = '100%';
        }
        else {
            wrapper.style.height = '100%';
        }
        this.getWrapperArea(wrapper, terminalId, true);
        return wrapper;
    }
    /**
     * Create a split resizer element
     */
    createSplitResizer(direction) {
        const resizer = document.createElement('div');
        resizer.className = 'split-resizer';
        const resizerSize = `${webview_1.SPLIT_LAYOUT_CONSTANTS.RESIZER_SIZE_PX}px`;
        if (direction === 'horizontal') {
            resizer.style.width = resizerSize;
            resizer.style.cursor = 'col-resize';
        }
        else {
            resizer.style.height = resizerSize;
            resizer.style.cursor = 'row-resize';
        }
        resizer.style.background = 'var(--vscode-widget-border, #454545)';
        resizer.style.flexShrink = '0';
        return resizer;
    }
    /**
     * Get or create wrapper area for a terminal
     */
    getWrapperArea(wrapper, terminalId, createIfMissing = false) {
        let area = wrapper.querySelector(`[data-terminal-area-id="${terminalId}"]`);
        if (!area && createIfMissing) {
            area = document.createElement('div');
            area.setAttribute('data-terminal-area-id', terminalId);
            area.style.flex = '1 1 auto';
            area.style.display = 'flex';
            area.style.flexDirection = 'column';
            wrapper.appendChild(area);
        }
        return area ?? null;
    }
    /**
     * Ensure terminals-wrapper exists and return it
     */
    ensureTerminalsWrapper(terminalBody) {
        let terminalsWrapper = document.getElementById('terminals-wrapper');
        if (!terminalsWrapper) {
            ManagerLogger_1.containerLogger.warn('⚠️ [LAYOUT] terminals-wrapper not found, creating it');
            terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = 'terminals-wrapper';
            terminalsWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        flex: 1;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        padding: 4px;
        gap: 4px;
        box-sizing: border-box;
      `;
            const existingTerminals = Array.from(terminalBody.querySelectorAll('[data-terminal-container]'));
            terminalBody.appendChild(terminalsWrapper);
            existingTerminals.forEach((terminal) => {
                terminalsWrapper.appendChild(terminal);
            });
        }
        return terminalsWrapper;
    }
    isGridMode() {
        return this.gridMode;
    }
    /**
     * Activate 2-row grid layout for 6-10 terminals in split mode.
     */
    activateGridLayout(terminalBody, orderedTerminalIds, getContainer) {
        const terminalCount = orderedTerminalIds.length;
        if (terminalCount === 0) {
            ManagerLogger_1.containerLogger.warn('No terminals to display in grid mode');
            return;
        }
        ManagerLogger_1.containerLogger.info('🎨 [GRID] ==================== ACTIVATING GRID LAYOUT ====================');
        ManagerLogger_1.containerLogger.info(`🎨 [GRID] Terminal count: ${terminalCount}`);
        const { row1, row2 } = (0, GridLayoutCalculator_1.calculateDistribution)(terminalCount);
        ManagerLogger_1.containerLogger.info(`🎨 [GRID] Distribution: row1=${row1}, row2=${row2}`);
        this.setupTerminalBody(terminalBody);
        const terminalsWrapper = this.ensureTerminalsWrapper(terminalBody);
        // Remove flex classes/styles, apply grid class
        terminalsWrapper.classList.remove('terminal-split-horizontal');
        terminalsWrapper.classList.add('terminal-grid-layout');
        terminalsWrapper.style.display = 'grid';
        terminalsWrapper.style.flexDirection = '';
        terminalsWrapper.style.gap = '4px';
        terminalsWrapper.style.gridAutoFlow = 'row';
        const maxColumns = Math.max(row1, row2);
        terminalsWrapper.style.gridTemplateColumns = (0, GridLayoutCalculator_1.getGridTemplateColumns)(maxColumns);
        terminalsWrapper.style.gridTemplateRows = '1fr auto 1fr';
        const containersToWrap = this.collectContainers(orderedTerminalIds, getContainer);
        terminalsWrapper.textContent = '';
        this.splitWrapperCache.clear();
        this.splitResizers.clear();
        this.gridRowResizer = null;
        containersToWrap.forEach(({ id: terminalId, container }, index) => {
            const wrapper = this.createGridWrapper(terminalId, index, row1, maxColumns, row2);
            const area = this.getWrapperArea(wrapper, terminalId, true);
            if (area) {
                area.appendChild(container);
            }
            this.applyContainerSplitStyles(container);
            terminalsWrapper.appendChild(wrapper);
            this.splitWrapperCache.set(terminalId, wrapper);
        });
        const rowResizer = this.createGridRowResizer();
        terminalsWrapper.appendChild(rowResizer);
        this.gridRowResizer = rowResizer;
        this.gridMode = true;
        ManagerLogger_1.containerLogger.info(`Grid layout activated: ${containersToWrap.length} terminals in ${row1}+${row2} distribution`);
        this.scheduleResizerInitialization('grid');
    }
    /**
     * Create a wrapper element positioned in the grid.
     */
    createGridWrapper(terminalId, index, row1Count, maxColumns, row2Count) {
        const wrapper = document.createElement('div');
        wrapper.className = 'terminal-split-wrapper';
        wrapper.setAttribute('data-terminal-wrapper-id', terminalId);
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.style.minWidth = '0';
        wrapper.style.minHeight = '0';
        // Row 1 -> grid row 1, Row 2 -> grid row 3 (resizer occupies row 2)
        const isRow1 = index < row1Count;
        wrapper.style.gridRow = isRow1 ? '1' : '3';
        const row2Total = row2Count ?? maxColumns;
        if (isRow1) {
            wrapper.style.gridColumn = `${index + 1}`;
        }
        else {
            // Row 2: Calculate span to fill available columns evenly
            const row2Index = index - row1Count;
            const span = Math.floor(maxColumns / row2Total);
            const start = row2Index * span + 1;
            // Last item in row 2 spans to the end to avoid gaps due to division
            const isLastInRow = row2Index === row2Total - 1;
            wrapper.style.gridColumn = isLastInRow ? `${start} / -1` : `${start} / span ${span}`;
        }
        this.getWrapperArea(wrapper, terminalId, true);
        return wrapper;
    }
    /**
     * Create the grid row resizer element (between row 1 and row 2)
     */
    createGridRowResizer() {
        const resizer = document.createElement('div');
        resizer.className = 'grid-row-resizer';
        resizer.style.gridRow = '2';
        resizer.style.gridColumn = '1 / -1';
        resizer.style.height = `${webview_1.SPLIT_LAYOUT_CONSTANTS.RESIZER_SIZE_PX}px`;
        resizer.style.cursor = 'row-resize';
        resizer.style.background = 'var(--vscode-widget-border, #454545)';
        return resizer;
    }
    getGridRowResizer() {
        return this.gridRowResizer;
    }
    /**
     * Deactivate grid layout and restore flex layout
     */
    deactivateGridLayout() {
        if (!this.gridMode) {
            return;
        }
        ManagerLogger_1.containerLogger.info('🎨 [GRID] Deactivating grid layout');
        const terminalsWrapper = document.getElementById('terminals-wrapper');
        if (terminalsWrapper) {
            terminalsWrapper.classList.remove('terminal-grid-layout');
            terminalsWrapper.style.display = '';
            terminalsWrapper.style.gridTemplateColumns = '';
            terminalsWrapper.style.gridTemplateRows = '';
            terminalsWrapper.style.gridAutoFlow = '';
        }
        if (this.gridRowResizer) {
            this.gridRowResizer.remove();
            this.gridRowResizer = null;
        }
        this.splitWrapperCache.forEach((wrapper) => {
            wrapper.style.gridRow = '';
            wrapper.style.gridColumn = '';
        });
        this.gridMode = false;
        ManagerLogger_1.containerLogger.info('🎨 [GRID] Grid layout deactivated');
    }
    /**
     * Remove all split artifacts from DOM
     */
    removeSplitArtifacts(terminalBody) {
        this.deactivateGridLayout();
        terminalBody.querySelectorAll('[data-terminal-wrapper-id]').forEach((wrapper) => {
            wrapper.remove();
        });
        terminalBody.querySelectorAll('.split-resizer').forEach((resizer) => {
            resizer.remove();
        });
        terminalBody.querySelectorAll('.grid-row-resizer').forEach((resizer) => {
            resizer.remove();
        });
        this.splitWrapperCache.clear();
        this.splitResizers.clear();
    }
    clear() {
        this.splitWrapperCache.clear();
        this.splitResizers.clear();
        this.gridMode = false;
        this.gridRowResizer = null;
    }
    // --- Private helpers ---
    /**
     * Apply standard terminal-body styles for layout modes
     */
    setupTerminalBody(terminalBody) {
        terminalBody.style.display = 'flex';
        terminalBody.style.flexDirection = 'column';
        terminalBody.style.height = '100%';
        terminalBody.style.width = '100%';
        terminalBody.style.overflow = 'hidden';
        terminalBody.style.padding = '0';
        terminalBody.style.margin = '0';
    }
    /**
     * Collect valid containers from ordered terminal IDs
     */
    collectContainers(orderedTerminalIds, getContainer) {
        const result = [];
        for (const terminalId of orderedTerminalIds) {
            const container = getContainer(terminalId);
            if (container) {
                result.push({ id: terminalId, container });
            }
            else {
                ManagerLogger_1.containerLogger.error(`Container not found for terminal: ${terminalId}`);
            }
        }
        return result;
    }
    /**
     * Apply split mode styles to a terminal container
     */
    applyContainerSplitStyles(container) {
        container.classList.remove('terminal-container--fullscreen', 'hidden-mode');
        container.classList.add('terminal-container--split');
        container.style.display = 'flex';
        container.style.flex = '1 1 auto';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '0';
    }
    /**
     * Schedule resizer initialization after DOM update
     */
    scheduleResizerInitialization(layoutType) {
        if (this.coordinator?.updateSplitResizers) {
            setTimeout(() => {
                this.coordinator?.updateSplitResizers?.();
                ManagerLogger_1.containerLogger.info(`${layoutType} resizers initialized after layout activation`);
            }, 50);
        }
    }
}
exports.SplitLayoutService = SplitLayoutService;
//# sourceMappingURL=SplitLayoutService.js.map