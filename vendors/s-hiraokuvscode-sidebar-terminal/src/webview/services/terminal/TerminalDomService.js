"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalDomService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
const TerminalContainerFactory_1 = require("../../factories/TerminalContainerFactory");
const ElementIds = {
    TERMINAL_BODY: 'terminal-body',
    TERMINAL_VIEW: 'terminal-view',
    TERMINALS_WRAPPER: 'terminals-wrapper',
};
const CssClasses = {
    TERMINAL_CONTAINER: 'terminal-container',
};
const Limits = {
    MAX_TERMINAL_NUMBER: 5,
};
class TerminalDomService {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    ensureDomReady() {
        const terminalBody = document.getElementById(ElementIds.TERMINAL_BODY);
        if (terminalBody) {
            return;
        }
        ManagerLogger_1.terminalLogger.error('Main terminal container not found');
        const mainDiv = document.querySelector(`#${ElementIds.TERMINAL_VIEW}`) || document.body;
        if (!mainDiv) {
            throw new Error('Cannot find parent container for terminal-body');
        }
        const newTerminalBody = document.createElement('div');
        newTerminalBody.id = ElementIds.TERMINAL_BODY;
        newTerminalBody.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #000000;
    `;
        mainDiv.appendChild(newTerminalBody);
        ManagerLogger_1.terminalLogger.info('✅ Created missing terminal-body container');
    }
    createAndInsertContainer(params) {
        const { terminalId, terminalName, config, terminalNumber, currentSettings, uiManager } = params;
        const terminalNumberToUse = terminalNumber ?? this.extractTerminalNumber(terminalId);
        const isActiveFromConfig = config?.isActive ?? false;
        const containerConfig = {
            id: terminalId,
            name: terminalName,
            className: CssClasses.TERMINAL_CONTAINER,
            isSplit: false,
            isActive: isActiveFromConfig,
        };
        const headerConfig = this.buildHeaderConfig(terminalId, terminalName, config, currentSettings);
        const containerElements = TerminalContainerFactory_1.TerminalContainerFactory.createContainer(containerConfig, headerConfig);
        if (!containerElements?.container || !containerElements?.body) {
            throw new Error('Invalid container elements created');
        }
        const container = containerElements.container;
        const terminalContent = containerElements.body;
        ManagerLogger_1.terminalLogger.info(`✅ Container created: ${terminalId} with terminal number: ${terminalNumberToUse}`);
        this.insertContainerIntoDom(terminalId, container);
        try {
            uiManager?.applyVSCodeStyling?.(container);
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn('⚠️ Container styling application failed; continuing without styling', error);
        }
        container.style.display = 'flex';
        container.style.visibility = 'visible';
        if (isActiveFromConfig) {
            try {
                uiManager?.updateSingleTerminalBorder?.(container, true);
                ManagerLogger_1.terminalLogger.info(`✅ Active border applied to container: ${terminalId}`);
            }
            catch (error) {
                ManagerLogger_1.terminalLogger.warn('⚠️ Active border application failed; continuing', error);
            }
        }
        return { container, terminalContent, containerElements, terminalNumberToUse };
    }
    buildHeaderConfig(terminalId, terminalName, config, currentSettings) {
        return {
            showHeader: true,
            showCloseButton: true,
            showSplitButton: false,
            customTitle: terminalName,
            indicatorColor: config?.indicatorColor,
            headerEnhancementsEnabled: currentSettings?.enableTerminalHeaderEnhancements !== false,
            onHeaderUpdate: (clickedTerminalId, updates) => {
                if (updates.newName) {
                    ManagerLogger_1.terminalLogger.info(`✏️ Header rename submitted: ${clickedTerminalId} -> ${updates.newName}`);
                    const terminalContainer = document.querySelector(`[data-terminal-id="${clickedTerminalId}"]`);
                    if (terminalContainer) {
                        terminalContainer.setAttribute('data-terminal-name', updates.newName);
                    }
                    const tabManager = this.dependencies.coordinator.getManagers?.()?.tabs;
                    if (tabManager) {
                        if (typeof tabManager.handleTerminalRenamed === 'function') {
                            tabManager.handleTerminalRenamed(clickedTerminalId, updates.newName);
                        }
                        else {
                            tabManager.addTab(clickedTerminalId, updates.newName);
                        }
                    }
                }
                this.dependencies.coordinator.postMessageToExtension({
                    command: 'updateTerminalHeader',
                    terminalId: clickedTerminalId,
                    ...(updates.newName ? { newName: updates.newName } : {}),
                    ...(updates.indicatorColor ? { indicatorColor: updates.indicatorColor } : {}),
                });
            },
            onHeaderClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`🎯 Header clicked for terminal: ${clickedTerminalId}`);
                this.dependencies.coordinator.setActiveTerminalId(clickedTerminalId);
            },
            onCloseClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`🗑️ Header close button clicked: ${clickedTerminalId}`);
                if (this.dependencies.coordinator.deleteTerminalSafely) {
                    void this.dependencies.coordinator.deleteTerminalSafely(clickedTerminalId);
                }
                else {
                    this.dependencies.coordinator.closeTerminal(clickedTerminalId);
                }
            },
            onSplitClick: () => {
                ManagerLogger_1.terminalLogger.info('⊞ Split button clicked, creating new terminal');
                void this.dependencies.coordinator.profileManager?.createTerminalWithDefaultProfile?.();
            },
            onAiAgentToggleClick: (clickedTerminalId) => {
                ManagerLogger_1.terminalLogger.info(`📎 AI Agent toggle clicked for terminal: ${clickedTerminalId}`);
                this.dependencies.coordinator.handleAiAgentToggle?.(clickedTerminalId);
            },
        };
    }
    insertContainerIntoDom(terminalId, container) {
        const bodyElement = document.getElementById(ElementIds.TERMINAL_BODY);
        if (!bodyElement) {
            ManagerLogger_1.terminalLogger.error(`❌ ${ElementIds.TERMINAL_BODY} not found, cannot append container: ${terminalId}`);
            throw new Error(`${ElementIds.TERMINAL_BODY} element not found`);
        }
        let terminalsWrapper = document.getElementById(ElementIds.TERMINALS_WRAPPER);
        if (!terminalsWrapper) {
            ManagerLogger_1.terminalLogger.info(`🆕 Creating ${ElementIds.TERMINALS_WRAPPER} (not yet initialized)`);
            terminalsWrapper = document.createElement('div');
            terminalsWrapper.id = ElementIds.TERMINALS_WRAPPER;
            terminalsWrapper.style.cssText = `
        display: flex;
        flex: 1 1 auto;
        gap: 4px;
        padding: 4px;
      `;
            bodyElement.appendChild(terminalsWrapper);
        }
        terminalsWrapper.appendChild(container);
        ManagerLogger_1.terminalLogger.info(`✅ Container appended to terminals-wrapper: ${terminalId}`);
    }
    extractTerminalNumber(terminalId) {
        if (!terminalId) {
            return 1;
        }
        const match = terminalId.match(/terminal-(\d+)/);
        if (match?.[1]) {
            return parseInt(match[1], 10);
        }
        const existingNumbers = new Set();
        this.dependencies.splitManager.getTerminals().forEach((terminal) => {
            if (terminal.number) {
                existingNumbers.add(terminal.number);
            }
        });
        for (let i = 1; i <= Limits.MAX_TERMINAL_NUMBER; i++) {
            if (!existingNumbers.has(i)) {
                return i;
            }
        }
        ManagerLogger_1.terminalLogger.warn(`Could not extract terminal number from ID: ${terminalId}, defaulting to 1`);
        return 1;
    }
}
exports.TerminalDomService = TerminalDomService;
//# sourceMappingURL=TerminalDomService.js.map