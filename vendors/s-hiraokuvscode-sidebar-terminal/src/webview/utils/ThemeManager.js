"use strict";
/**
 * ThemeManager Utility
 * Centralized theme and styling management with VS Code integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeManager = void 0;
const theme_types_1 = require("../types/theme.types");
/**
 * Centralized theme manager for VS Code integration
 * Provides consistent color management across all components
 */
class ThemeManager {
    static parseHexColor(color) {
        if (!color.startsWith('#')) {
            return null;
        }
        const hex = color.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
            };
        }
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
            };
        }
        return null;
    }
    static parseRgbColor(color) {
        const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) {
            return null;
        }
        return {
            r: Number(match[1]),
            g: Number(match[2]),
            b: Number(match[3]),
        };
    }
    static resolveThemeType() {
        if (typeof document !== 'undefined' && typeof getComputedStyle !== 'undefined') {
            const computedStyle = getComputedStyle(document.documentElement);
            const background = computedStyle.getPropertyValue('--vscode-terminal-background').trim() ||
                computedStyle.getPropertyValue('--vscode-editor-background').trim();
            const rgb = this.parseHexColor(background) ?? this.parseRgbColor(background);
            if (rgb) {
                const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
                return luminance >= 0.5 ? 'light' : 'dark';
            }
        }
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    }
    /**
     * Initialize the theme manager
     */
    static initialize() {
        try {
            if (this.isInitialized) {
                return;
            }
            // Update theme colors from CSS custom properties
            this.updateThemeColors();
            this.isInitialized = true;
        }
        catch (error) {
            console.warn('ThemeManager initialization failed:', error);
            // Continue with default colors
            this.isInitialized = true;
        }
    }
    /**
     * Get current theme colors
     */
    static getThemeColors() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return { ...this.themeColors };
    }
    /**
     * Apply theme to an element
     */
    static applyTheme(element, customTheme) {
        if (!element) {
            return;
        }
        const colors = customTheme || this.getThemeColors();
        if (colors.background) {
            element.style.background = colors.background;
        }
        if (colors.foreground) {
            element.style.color = colors.foreground;
        }
        if (colors.border) {
            element.style.borderColor = colors.border;
        }
    }
    /**
     * Get VS Code CSS custom property value
     */
    static getVSCodeColor(property, fallback = '#1e1e1e') {
        try {
            if (!property || typeof document === 'undefined') {
                return fallback;
            }
            const root = document.documentElement;
            if (!root || !getComputedStyle) {
                return fallback;
            }
            const value = getComputedStyle(root).getPropertyValue(property).trim();
            return value || fallback;
        }
        catch {
            return fallback;
        }
    }
    /**
     * Create terminal theme from VS Code colors
     */
    static createTerminalTheme(overrides) {
        const colors = this.getThemeColors();
        // Use DARK_THEME as base and override with VS Code colors
        const defaultTheme = {
            ...theme_types_1.DARK_THEME,
            background: colors.background,
            foreground: colors.foreground,
            cursor: this.getVSCodeColor('--vscode-terminalCursor-foreground', theme_types_1.DARK_THEME.cursor),
            selectionBackground: this.getVSCodeColor('--vscode-terminal-selectionBackground', theme_types_1.DARK_THEME.selectionBackground),
        };
        return { ...defaultTheme, ...overrides };
    }
    /**
     * Update element theme by selector
     */
    static updateElementTheme(selector, styles) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element) => {
                Object.assign(element.style, styles);
            });
        }
        catch (error) {
            console.warn('Failed to update element theme:', error);
        }
    }
    /**
     * Get all VS Code theme variables
     */
    static getThemeVariables() {
        const variables = {};
        try {
            if (typeof document === 'undefined' || !getComputedStyle) {
                return variables;
            }
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            // Common VS Code variables
            const vsCodeProperties = [
                '--vscode-editor-background',
                '--vscode-editor-foreground',
                '--vscode-widget-border',
                '--vscode-focusBorder',
                '--vscode-button-background',
                '--vscode-button-foreground',
                '--vscode-input-background',
                '--vscode-input-foreground',
                '--vscode-list-activeSelectionBackground',
                '--vscode-list-hoverBackground',
                '--vscode-terminal-foreground',
                '--vscode-terminal-background',
                '--vscode-terminalCursor-foreground',
                '--vscode-terminal-selectionBackground',
            ];
            vsCodeProperties.forEach((property) => {
                const value = computedStyle.getPropertyValue(property).trim();
                if (value) {
                    variables[property] = value;
                }
            });
        }
        catch (error) {
            console.warn('Failed to get theme variables:', error);
        }
        return variables;
    }
    /**
     * Update theme colors from CSS custom properties
     */
    static updateThemeColors() {
        const resolvedTheme = (0, theme_types_1.getVSCodeThemeColors)(this.resolveThemeType());
        this.themeColors = {
            background: resolvedTheme.background,
            foreground: resolvedTheme.foreground,
            border: this.getVSCodeColor('--vscode-widget-border', '#454545'),
        };
    }
    /**
     * Dispose of theme manager
     */
    static dispose() {
        this.isInitialized = false;
        this.themeColors = {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            border: '#454545',
        };
    }
}
exports.ThemeManager = ThemeManager;
ThemeManager.isInitialized = false;
ThemeManager.themeColors = {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    border: '#454545',
};
//# sourceMappingURL=ThemeManager.js.map