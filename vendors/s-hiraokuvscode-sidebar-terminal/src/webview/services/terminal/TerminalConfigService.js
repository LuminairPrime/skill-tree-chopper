"use strict";
/**
 * Terminal Configuration Service
 *
 * Extracted from TerminalCreationService for better maintainability.
 * Manages default terminal configuration and settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalConfigService = exports.DEFAULT_TERMINAL_CONFIG = void 0;
const theme_types_1 = require("../../types/theme.types");
/**
 * Detect platform for platform-specific defaults
 * Falls back to 'linux' in Node.js test environments where navigator is not available
 */
const detectPlatform = () => {
    // Handle Node.js test environments where navigator is not available
    if (typeof navigator === 'undefined') {
        return 'linux'; // Default to linux for test environments
    }
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac'))
        return 'darwin';
    if (userAgent.includes('linux'))
        return 'linux';
    return 'win32';
};
const parseHexColor = (color) => {
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
};
const parseRgbColor = (color) => {
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) {
        return null;
    }
    return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
    };
};
const isLightColor = (color) => {
    const rgb = parseHexColor(color) ?? parseRgbColor(color);
    if (!rgb) {
        return null;
    }
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance >= 0.5;
};
const resolveThemeType = () => {
    if (typeof document !== 'undefined' && typeof getComputedStyle !== 'undefined') {
        const computedStyle = getComputedStyle(document.documentElement);
        const background = computedStyle.getPropertyValue('--vscode-terminal-background').trim() ||
            computedStyle.getPropertyValue('--vscode-editor-background').trim();
        const isLight = background ? isLightColor(background) : null;
        if (isLight !== null) {
            return isLight ? 'light' : 'dark';
        }
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
};
/**
 * VS Code Standard Terminal Configuration with all default values
 * Platform-specific adjustments are applied based on OS detection.
 *
 * @see https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/terminal/common/terminalConfiguration.ts
 * @see https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts
 */
const createDefaultTerminalConfig = () => {
    const platform = detectPlatform();
    const resolvedTheme = (0, theme_types_1.getVSCodeThemeColors)(resolveThemeType());
    return {
        // Basic appearance - VS Code standard values
        cursorBlink: true,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        fontSize: platform === 'darwin' ? 12 : 14, // VS Code: 12 on macOS, 14 elsewhere
        fontWeight: 'normal',
        fontWeightBold: 'bold',
        lineHeight: platform === 'linux' ? 1.1 : 1.0, // VS Code: 1.1 on Linux for underline rendering
        letterSpacing: 0,
        theme: {
            background: resolvedTheme.background,
            foreground: resolvedTheme.foreground,
            cursor: resolvedTheme.cursor,
            cursorAccent: resolvedTheme.cursorAccent,
            selectionBackground: resolvedTheme.selectionBackground,
        },
        // VS Code Standard Options - Core Features
        altClickMovesCursor: true,
        drawBoldTextInBrightColors: true, // VS Code default: true
        minimumContrastRatio: 4.5, // WCAG AA compliance (VS Code default)
        tabStopWidth: 8,
        macOptionIsMeta: false,
        rightClickSelectsWord: true,
        // Scrolling and Navigation - VS Code values
        fastScrollModifier: 'alt',
        fastScrollSensitivity: 5,
        scrollSensitivity: 1,
        scrollback: 2000, // Match package.json default (secondaryTerminal.scrollback)
        scrollOnUserInput: true,
        // Word and Selection - VS Code default separator
        wordSeparator: " ()[]{}',\"`─''|",
        // Rendering Options
        allowTransparency: false,
        rescaleOverlappingGlyphs: true, // VS Code default for better glyph rendering
        allowProposedApi: true,
        // Cursor Configuration - VS Code defaults
        cursorStyle: 'block',
        cursorInactiveStyle: 'outline',
        cursorWidth: 1,
        // Terminal Behavior
        convertEol: false,
        disableStdin: false,
        screenReaderMode: false,
        // Advanced Options
        windowOptions: {
            restoreWin: false,
            minimizeWin: false,
            setWinPosition: false,
            setWinSizePixels: false,
            raiseWin: false,
            lowerWin: false,
            refreshWin: false,
            setWinSizeChars: false,
            maximizeWin: false,
            fullscreenWin: false,
        },
        // Addon Configuration
        enableGpuAcceleration: true,
        enableSearchAddon: true,
        enableUnicode11: true,
    };
};
exports.DEFAULT_TERMINAL_CONFIG = createDefaultTerminalConfig();
/**
 * Service for managing terminal configuration
 */
class TerminalConfigService {
    /**
     * Merge user config with default terminal configuration
     */
    static mergeConfig(userConfig) {
        return { ...exports.DEFAULT_TERMINAL_CONFIG, ...userConfig };
    }
    /**
     * Get default terminal configuration
     */
    static getDefaultConfig() {
        return { ...exports.DEFAULT_TERMINAL_CONFIG };
    }
    /**
     * Validate terminal configuration
     */
    static validateConfig(config) {
        // Basic validation for critical fields
        if (config.fontSize !== undefined && (config.fontSize < 6 || config.fontSize > 72)) {
            return false;
        }
        if (config.scrollback !== undefined && (config.scrollback < 0 || config.scrollback > 100000)) {
            return false;
        }
        if (config.lineHeight !== undefined && (config.lineHeight < 0.5 || config.lineHeight > 3)) {
            return false;
        }
        return true;
    }
}
exports.TerminalConfigService = TerminalConfigService;
//# sourceMappingURL=TerminalConfigService.js.map