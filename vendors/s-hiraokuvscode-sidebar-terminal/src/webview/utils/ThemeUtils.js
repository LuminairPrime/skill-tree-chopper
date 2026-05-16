"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeUtils = void 0;
const constants_1 = require("../constants");
const logger_1 = require("../../utils/logger");
const DARK_THEME_HEX_MARKERS = ['1e1e1e', '2d2d30', '252526'];
const LIGHT_THEME_HEX_MARKERS = ['ffffff', 'f3f3f3', 'fffffe'];
const BRIGHTNESS_THRESHOLD = 128;
function brightnessFromRgb(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}
function brightnessFromHex(hex) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return brightnessFromRgb(r, g, b);
}
function brightnessFromRgbString(bgColor) {
    const values = bgColor.match(/\d+/g);
    if (!values || values.length < 3)
        return undefined;
    return brightnessFromRgb(parseInt(values[0] || '0'), parseInt(values[1] || '0'), parseInt(values[2] || '0'));
}
function classifyBackgroundAsDark(bgColor) {
    if (!bgColor)
        return true;
    if (bgColor.startsWith('#')) {
        return brightnessFromHex(bgColor.substring(1)) < BRIGHTNESS_THRESHOLD;
    }
    if (bgColor.includes('rgb')) {
        const brightness = brightnessFromRgbString(bgColor);
        return brightness === undefined ? true : brightness < BRIGHTNESS_THRESHOLD;
    }
    if (DARK_THEME_HEX_MARKERS.some((marker) => bgColor.includes(marker)))
        return true;
    if (LIGHT_THEME_HEX_MARKERS.some((marker) => bgColor.includes(marker)))
        return false;
    return true;
}
/**
 * テーマ関連のユーティリティクラス
 */
exports.ThemeUtils = {
    /**
     * 現在のVS Codeテーマを検出
     */
    detectTheme() {
        const style = getComputedStyle(document.body);
        const bgColor = style.getPropertyValue('--vscode-editor-background') ||
            style.getPropertyValue('--vscode-panel-background') ||
            style.backgroundColor;
        (0, logger_1.webview)('🎨 [THEME] Detected background color:', bgColor);
        const isDark = classifyBackgroundAsDark(bgColor);
        (0, logger_1.webview)('🎨 [THEME] Theme detected as:', isDark ? 'dark' : 'light');
        return isDark ? 'dark' : 'light';
    },
    /**
     * テーマに基づいて適切なカラーパレットを取得
     */
    getThemeColors(theme) {
        const detectedTheme = theme === 'auto' ? this.detectTheme() : theme || 'dark';
        const colors = detectedTheme === 'dark' ? constants_1.THEME_CONSTANTS.DARK_THEME : constants_1.THEME_CONSTANTS.LIGHT_THEME;
        (0, logger_1.webview)('🎨 [THEME] Applied theme colors:', colors);
        return colors;
    },
    /**
     * VS Code CSS変数から色を取得
     */
    getVSCodeColor(variableName, fallback) {
        const style = getComputedStyle(document.documentElement);
        return style.getPropertyValue(`--vscode-${variableName}`) || fallback;
    },
    /**
     * 色の明度を計算
     */
    calculateBrightness(color) {
        if (color.startsWith('#'))
            return brightnessFromHex(color.substring(1));
        if (color.includes('rgb'))
            return brightnessFromRgbString(color) ?? 0;
        return 0;
    },
    /**
     * 色が暗いかどうか判定
     */
    isDarkColor(color) {
        return this.calculateBrightness(color) < BRIGHTNESS_THRESHOLD;
    },
    /**
     * アクセント色を生成
     */
    generateAccentColor(baseColor, factor = 0.2) {
        const brightness = this.calculateBrightness(baseColor);
        const isDark = brightness < BRIGHTNESS_THRESHOLD;
        // 簡易的な色調整（実際の実装では色空間変換が望ましい）
        return isDark ? this.lightenColor(baseColor, factor) : this.darkenColor(baseColor, factor);
    },
    /**
     * 色を明るくする
     */
    lightenColor(color, _factor) {
        // 簡易実装：より正確な実装が必要な場合はcolor-manipulationライブラリを使用
        return color; // プレースホルダー
    },
    /**
     * 色を暗くする
     */
    darkenColor(color, _factor) {
        // 簡易実装：より正確な実装が必要な場合はcolor-manipulationライブラリを使用
        return color; // プレースホルダー
    },
};
//# sourceMappingURL=ThemeUtils.js.map