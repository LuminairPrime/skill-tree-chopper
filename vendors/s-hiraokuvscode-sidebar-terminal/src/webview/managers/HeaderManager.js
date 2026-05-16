"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderManager = void 0;
const constants_1 = require("../constants");
const webview_1 = require("../constants/webview");
const DOMUtils_1 = require("../utils/DOMUtils");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const logger_1 = require("../../utils/logger");
/**
 * WebViewヘッダーの管理を担当するクラス
 */
class HeaderManager {
    constructor() {
        this.headerElement = null;
        this.coordinator = null;
        this.config = {
            showHeader: true,
            title: 'Terminal',
            showIcons: true,
            iconSize: constants_1.UI_CONSTANTS.SIZES.SAMPLE_ICON_SIZE,
            fontSize: constants_1.UI_CONSTANTS.SIZES.TITLE_FONT_SIZE,
        };
    }
    /**
     * コーディネーターを設定
     */
    setCoordinator(coordinator) {
        this.coordinator = coordinator;
    }
    /**
     * ヘッダー設定を更新
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        if (this.headerElement) {
            this.recreateHeader();
        }
    }
    /**
     * WebViewヘッダーを作成
     */
    createWebViewHeader() {
        try {
            (0, logger_1.webview)('🎯 [HEADER] Creating WebView header');
            if (!this.config.showHeader) {
                (0, logger_1.webview)('🎯 [HEADER] WebView header disabled by configuration');
                return;
            }
            this.removeExistingHeader();
            this.createHeaderContainer();
            this.createHeaderContent();
            this.insertHeaderIntoDOM();
            this.updateTerminalCountBadge();
            (0, logger_1.webview)('✅ [HEADER] WebView header created successfully');
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handleOperationError('HeaderManager.createWebViewHeader', error);
        }
    }
    /**
     * ターミナル数バッジを更新
     */
    updateTerminalCountBadge() {
        try {
            const badge = DOMUtils_1.DOMUtils.getElement('#terminal-count-badge');
            if (!badge)
                return;
            const terminalTabs = DOMUtils_1.DOMUtils.getElement('#terminal-tabs');
            const terminalCount = terminalTabs ? terminalTabs.childElementCount : 0;
            badge.textContent = terminalCount.toString();
            // カウントに基づいて色を変更
            let backgroundColor = 'var(--vscode-badge-background, #007acc)';
            if (terminalCount === 0) {
                backgroundColor = 'var(--vscode-errorBackground, #f14c4c)';
            }
            else if (terminalCount >= webview_1.HEADER_MANAGER_CONSTANTS.TERMINAL_COUNT_WARNING_THRESHOLD) {
                backgroundColor = 'var(--vscode-notificationWarning-background, #ffcc02)';
            }
            else if (terminalCount >= webview_1.HEADER_MANAGER_CONSTANTS.TERMINAL_COUNT_ORANGE_THRESHOLD) {
                backgroundColor = 'var(--vscode-charts-orange, #ff8c00)';
            }
            badge.style.background = backgroundColor;
            (0, logger_1.webview)(`🎯 [HEADER] Terminal count badge updated: ${terminalCount}`);
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handleOperationError('HeaderManager.updateTerminalCountBadge', error);
        }
    }
    /**
     * 既存のヘッダーを削除
     */
    removeExistingHeader() {
        if (this.headerElement) {
            DOMUtils_1.DOMUtils.safeRemove(this.headerElement);
            this.headerElement = null;
        }
    }
    /**
     * ヘッダーコンテナを作成
     */
    createHeaderContainer() {
        this.headerElement = DOMUtils_1.DOMUtils.createElement('div', {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${constants_1.UI_CONSTANTS.SPACING.HEADER_PADDING / 2}px ${constants_1.UI_CONSTANTS.SPACING.HEADER_PADDING}px`,
            background: 'var(--vscode-titleBar-activeBackground, #3c3c3c)',
            borderBottom: '1px solid var(--vscode-titleBar-border, #454545)',
            color: 'var(--vscode-titleBar-activeForeground, #cccccc)',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            userSelect: 'none',
            minHeight: `${constants_1.UI_CONSTANTS.SIZES.HEADER_HEIGHT}px`,
            flexShrink: '0',
            boxSizing: 'border-box',
        }, {
            id: 'webview-header',
        });
    }
    /**
     * ヘッダーコンテンツを作成
     */
    createHeaderContent() {
        if (!this.headerElement)
            return;
        const titleSection = this.createTitleSection();
        const commandSection = this.createCommandSection();
        DOMUtils_1.DOMUtils.appendChildren(this.headerElement, titleSection, commandSection);
    }
    /**
     * タイトルセクションを作成
     */
    createTitleSection() {
        const titleSection = DOMUtils_1.DOMUtils.createElement('div', {
            display: 'flex',
            alignItems: 'center',
            gap: `${constants_1.UI_CONSTANTS.SPACING.TITLE_GAP}px`,
            flex: '1 1 auto',
            minWidth: '0',
            overflow: 'hidden',
        });
        const terminalIcon = this.createTerminalIcon();
        const titleText = this.createTitleText();
        const countBadge = this.createCountBadge();
        DOMUtils_1.DOMUtils.appendChildren(titleSection, terminalIcon, titleText, countBadge);
        return titleSection;
    }
    /**
     * ターミナルアイコンを作成
     */
    createTerminalIcon() {
        return DOMUtils_1.DOMUtils.createElement('span', {
            fontSize: `${constants_1.UI_CONSTANTS.SIZES.TERMINAL_ICON_SIZE}px`,
            opacity: '0.8',
            lineHeight: '1',
            flexShrink: '0',
        }, {
            textContent: '🖥️',
        });
    }
    /**
     * タイトルテキストを作成
     */
    createTitleText() {
        return DOMUtils_1.DOMUtils.createElement('span', {
            fontSize: `${this.config.fontSize}px`,
            fontWeight: '600',
            letterSpacing: '0.02em',
            lineHeight: '1.2',
            flex: '0 1 auto',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }, {
            textContent: this.config.title,
        });
    }
    /**
     * カウントバッジを作成
     */
    createCountBadge() {
        return DOMUtils_1.DOMUtils.createElement('span', {
            background: 'var(--vscode-badge-background, #007acc)',
            color: 'var(--vscode-badge-foreground, #ffffff)',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: '500',
            minWidth: '20px',
            textAlign: 'center',
            lineHeight: '18px',
            flexShrink: '0',
        }, {
            id: 'terminal-count-badge',
            textContent: '1',
        });
    }
    /**
     * コマンドセクションを作成
     */
    createCommandSection() {
        const commandSection = DOMUtils_1.DOMUtils.createElement('div', {
            display: 'flex',
            alignItems: 'center',
            gap: `${constants_1.UI_CONSTANTS.SPACING.ICON_GAP}px`,
            position: 'relative',
            flex: '0 0 auto',
        }, {
            className: 'sample-icons',
        });
        if (this.config.showIcons) {
            // Existing sample icons
            this.addSampleIcons(commandSection);
            this.addHelpTooltip(commandSection);
        }
        return commandSection;
    }
    /**
     * サンプルアイコンを追加
     */
    addSampleIcons(container) {
        constants_1.SAMPLE_ICONS.forEach((sample) => {
            const iconElement = this.createSampleIcon(sample, constants_1.UI_CONSTANTS.OPACITY.SAMPLE_ICON);
            container.appendChild(iconElement);
        });
    }
    /**
     * サンプルアイコンを作成
     */
    createSampleIcon(sample, opacity) {
        const iconElement = DOMUtils_1.DOMUtils.createElement('div', {
            background: 'transparent',
            color: 'var(--vscode-descriptionForeground, #969696)',
            fontSize: `${this.config.iconSize}px`,
            padding: `${constants_1.UI_CONSTANTS.SPACING.ICON_PADDING}px`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: `${constants_1.UI_CONSTANTS.SIZES.ICON_BUTTON_SIZE}px`,
            height: `${constants_1.UI_CONSTANTS.SIZES.ICON_BUTTON_SIZE}px`,
            opacity: opacity.toString(),
            cursor: 'default',
            userSelect: 'none',
            filter: 'grayscale(30%)',
            transition: 'opacity 0.2s ease',
            boxSizing: 'border-box',
        }, {
            className: 'sample-icon',
            textContent: sample.icon,
            title: sample.title,
        });
        this.addSampleIconInteraction(iconElement, opacity);
        return iconElement;
    }
    /**
     * サンプルアイコンのインタラクションを追加
     */
    addSampleIconInteraction(iconElement, baseOpacity) {
        DOMUtils_1.DOMUtils.addEventListenerSafe(iconElement, 'mouseenter', () => {
            iconElement.style.opacity = '0.6';
        });
        DOMUtils_1.DOMUtils.addEventListenerSafe(iconElement, 'mouseleave', () => {
            iconElement.style.opacity = baseOpacity.toString();
        });
    }
    /**
     * ヘルプツールチップを追加
     */
    addHelpTooltip(container) {
        const helpTooltip = DOMUtils_1.DOMUtils.createElement('div', {
            position: 'absolute',
            bottom: '-35px',
            right: '0',
            background: 'var(--vscode-tooltip-background, #2c2c2c)',
            border: '1px solid var(--vscode-tooltip-border, #454545)',
            borderRadius: '3px',
            padding: '6px 8px',
            fontSize: '10px',
            color: 'var(--vscode-tooltip-foreground, #cccccc)',
            whiteSpace: 'nowrap',
            zIndex: '1001',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
        }, {
            className: 'help-tooltip',
        });
        // SECURITY: Build DOM structure safely to prevent XSS
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; align-items: center; gap: 4px;';
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '📌';
        const textSpan = document.createElement('span');
        textSpan.textContent = 'Sample Icons (Display Only)';
        headerDiv.appendChild(iconSpan);
        headerDiv.appendChild(textSpan);
        const descriptionDiv = document.createElement('div');
        descriptionDiv.style.cssText =
            'margin-top: 2px; color: var(--vscode-descriptionForeground, #969696);';
        descriptionDiv.textContent = 'Use VS Code panel buttons for actions';
        helpTooltip.appendChild(headerDiv);
        helpTooltip.appendChild(descriptionDiv);
        this.addTooltipInteraction(container, helpTooltip);
        container.appendChild(helpTooltip);
    }
    /**
     * ツールチップのインタラクションを追加
     */
    addTooltipInteraction(container, tooltip) {
        DOMUtils_1.DOMUtils.addEventListenerSafe(container, 'mouseenter', () => {
            tooltip.style.opacity = '1';
        });
        DOMUtils_1.DOMUtils.addEventListenerSafe(container, 'mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    }
    /**
     * ヘッダーをDOMに挿入
     */
    insertHeaderIntoDOM() {
        if (!this.headerElement)
            return;
        const mainContainer = DOMUtils_1.DOMUtils.getElement('#terminal');
        if (mainContainer && mainContainer.firstChild) {
            mainContainer.insertBefore(this.headerElement, mainContainer.firstChild);
        }
        else if (mainContainer) {
            mainContainer.appendChild(this.headerElement);
        }
    }
    /**
     * ヘッダーを再作成
     */
    recreateHeader() {
        this.createWebViewHeader();
    }
    /**
     * クリーンアップ
     */
    dispose() {
        try {
            this.removeExistingHeader();
            this.coordinator = null;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handleOperationError('HeaderManager.dispose', error);
        }
    }
}
exports.HeaderManager = HeaderManager;
//# sourceMappingURL=HeaderManager.js.map