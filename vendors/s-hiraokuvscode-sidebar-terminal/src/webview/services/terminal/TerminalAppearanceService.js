"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalAppearanceService = void 0;
const ManagerLogger_1 = require("../../utils/ManagerLogger");
const WebviewThemeUtils_1 = require("../../utils/WebviewThemeUtils");
const TerminalConfigService_1 = require("./TerminalConfigService");
const FontDefaults = {
    FONT_WEIGHT: 'normal',
    FONT_WEIGHT_BOLD: 'bold',
    LINE_HEIGHT: 1,
    LETTER_SPACING: 0,
};
const CssClasses = {
    XTERM: 'xterm',
    XTERM_VIEWPORT: 'xterm-viewport',
};
const POST_RENDERER_SETUP_DELAY_MS = 200;
class TerminalAppearanceService {
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    prepareTerminalConfig(config, configManager) {
        const { fontSettings: currentFontSettings, fontOverrides } = this.prepareFontSettings(config, configManager);
        const currentSettings = this.resolveCurrentSettings(configManager);
        const resolvedTheme = (0, WebviewThemeUtils_1.getWebviewTheme)(currentSettings);
        ManagerLogger_1.terminalLogger.info(`🎨 [THEME] Creating terminal with theme: ${currentSettings?.theme} -> bg=${resolvedTheme.background}`);
        const configWithFonts = {
            ...config,
            ...fontOverrides,
            theme: resolvedTheme,
        };
        const terminalConfig = TerminalConfigService_1.TerminalConfigService.mergeConfig(configWithFonts);
        const multiCursorModifier = currentSettings?.multiCursorModifier ?? 'alt';
        const linkModifier = multiCursorModifier === 'alt' ? 'alt' : 'ctrlCmd';
        return { terminalConfig, currentSettings, currentFontSettings, linkModifier };
    }
    applyPostOpenSettings(params) {
        const { terminalId, terminal, container, terminalContent, currentSettings, currentFontSettings, configManager, uiManager, } = params;
        try {
            if (!uiManager) {
                return;
            }
            const settingsForVisuals = currentSettings ?? configManager?.getCurrentSettings?.();
            const fontSettingsForApply = currentFontSettings ?? configManager?.getCurrentFontSettings?.();
            ManagerLogger_1.terminalLogger.info(`🎨 [DEBUG] Immediate settings check - theme: ${settingsForVisuals?.theme}`);
            if (settingsForVisuals) {
                uiManager.applyAllVisualSettings?.(terminal, settingsForVisuals);
                ManagerLogger_1.terminalLogger.info(`✅ Visual settings applied to terminal: ${terminalId}`);
                this.updateContainerBackgrounds(terminalId, container, terminalContent, settingsForVisuals);
            }
            if (fontSettingsForApply) {
                uiManager.applyFontSettings?.(terminal, fontSettingsForApply);
                const fontSettings = fontSettingsForApply;
                ManagerLogger_1.terminalLogger.info(`✅ Font settings applied to terminal: ${terminalId} (${fontSettings.fontFamily}, ${fontSettings.fontSize}px)`);
            }
        }
        catch (error) {
            ManagerLogger_1.terminalLogger.warn('⚠️ Terminal settings application failed; continuing with defaults', error);
        }
    }
    schedulePostRendererRefresh(params) {
        const { terminalId, terminal, container, terminalContent, configManager, uiManager } = params;
        setTimeout(() => {
            try {
                const finalSettings = configManager?.getCurrentSettings?.();
                ManagerLogger_1.terminalLogger.info(`🎨 [DEBUG] Final theme check - currentSettings.theme: ${finalSettings?.theme}`);
                if (uiManager && finalSettings) {
                    uiManager.applyTerminalTheme?.(terminal, finalSettings);
                    ManagerLogger_1.terminalLogger.info(`🎨 Final theme re-application for terminal: ${terminalId}`);
                    this.updateContainerBackgrounds(terminalId, container, terminalContent, finalSettings);
                }
                terminal.refresh(0, terminal.rows - 1);
                ManagerLogger_1.terminalLogger.info(`🔄 Final terminal refresh completed: ${terminalId}`);
            }
            catch (error) {
                ManagerLogger_1.terminalLogger.warn(`⚠️ Final refresh failed for terminal ${terminalId}:`, error);
            }
        }, POST_RENDERER_SETUP_DELAY_MS);
    }
    resolveCurrentSettings(configManager) {
        let currentSettings = configManager?.getCurrentSettings?.();
        if (!currentSettings?.theme || currentSettings.theme === 'auto') {
            const coordinatorSettings = this.dependencies.coordinator.currentSettings;
            if (coordinatorSettings?.theme && coordinatorSettings.theme !== 'auto') {
                currentSettings = { ...currentSettings, ...coordinatorSettings };
                ManagerLogger_1.terminalLogger.info(`🎨 [THEME] Using coordinator settings (theme: ${coordinatorSettings.theme})`);
            }
        }
        return currentSettings;
    }
    prepareFontSettings(config, configManager) {
        const configFontSettings = config
            ?.fontSettings;
        const directFontFamily = config?.fontFamily;
        const directFontSize = config?.fontSize;
        let currentFontSettings;
        if (directFontFamily || directFontSize) {
            const fallbackFontSettings = configManager?.getCurrentFontSettings?.();
            currentFontSettings = {
                fontFamily: directFontFamily ||
                    configFontSettings?.fontFamily ||
                    fallbackFontSettings?.fontFamily ||
                    'monospace',
                fontSize: directFontSize || configFontSettings?.fontSize || fallbackFontSettings?.fontSize || 14,
                fontWeight: config?.fontWeight ||
                    configFontSettings?.fontWeight ||
                    FontDefaults.FONT_WEIGHT,
                fontWeightBold: config?.fontWeightBold ||
                    configFontSettings?.fontWeightBold ||
                    FontDefaults.FONT_WEIGHT_BOLD,
                lineHeight: config?.lineHeight ||
                    configFontSettings?.lineHeight ||
                    FontDefaults.LINE_HEIGHT,
                letterSpacing: config?.letterSpacing ??
                    configFontSettings?.letterSpacing ??
                    FontDefaults.LETTER_SPACING,
            };
        }
        else if (configFontSettings) {
            currentFontSettings = configFontSettings;
        }
        else {
            currentFontSettings = configManager?.getCurrentFontSettings?.();
        }
        const fontOverrides = {};
        if (currentFontSettings) {
            if (typeof currentFontSettings.fontFamily === 'string' &&
                currentFontSettings.fontFamily.trim()) {
                fontOverrides.fontFamily = currentFontSettings.fontFamily.trim();
            }
            if (typeof currentFontSettings.fontSize === 'number' && currentFontSettings.fontSize > 0) {
                fontOverrides.fontSize = currentFontSettings.fontSize;
            }
            if (typeof currentFontSettings.fontWeight === 'string' &&
                currentFontSettings.fontWeight.trim()) {
                fontOverrides.fontWeight =
                    currentFontSettings.fontWeight.trim();
            }
            if (typeof currentFontSettings.fontWeightBold === 'string' &&
                currentFontSettings.fontWeightBold.trim()) {
                fontOverrides.fontWeightBold =
                    currentFontSettings.fontWeightBold.trim();
            }
            if (typeof currentFontSettings.lineHeight === 'number' &&
                currentFontSettings.lineHeight > 0) {
                fontOverrides.lineHeight = currentFontSettings.lineHeight;
            }
            if (typeof currentFontSettings.letterSpacing === 'number') {
                fontOverrides.letterSpacing = currentFontSettings.letterSpacing;
            }
            if (currentFontSettings.cursorStyle) {
                fontOverrides.cursorStyle = currentFontSettings.cursorStyle;
            }
            if (typeof currentFontSettings.cursorWidth === 'number' &&
                currentFontSettings.cursorWidth > 0) {
                fontOverrides.cursorWidth = currentFontSettings.cursorWidth;
            }
            if (typeof currentFontSettings.drawBoldTextInBrightColors === 'boolean') {
                fontOverrides.drawBoldTextInBrightColors = currentFontSettings.drawBoldTextInBrightColors;
            }
            if (typeof currentFontSettings.minimumContrastRatio === 'number') {
                fontOverrides.minimumContrastRatio = currentFontSettings.minimumContrastRatio;
            }
        }
        return { fontSettings: currentFontSettings, fontOverrides };
    }
    updateContainerBackgrounds(terminalId, container, terminalContent, settings) {
        if (!settings) {
            return;
        }
        const resolvedTheme = (0, WebviewThemeUtils_1.getWebviewTheme)(settings);
        const backgroundColor = resolvedTheme.background;
        if (terminalContent) {
            terminalContent.style.backgroundColor = backgroundColor;
        }
        if (container) {
            const xtermElement = container.querySelector(`.${CssClasses.XTERM}`);
            if (xtermElement) {
                xtermElement.style.backgroundColor = backgroundColor;
            }
            const viewport = container.querySelector(`.${CssClasses.XTERM_VIEWPORT}`);
            if (viewport) {
                viewport.style.backgroundColor = backgroundColor;
            }
        }
        ManagerLogger_1.terminalLogger.info(`🎨 Container backgrounds updated: ${terminalId} (${backgroundColor})`);
    }
}
exports.TerminalAppearanceService = TerminalAppearanceService;
//# sourceMappingURL=TerminalAppearanceService.js.map