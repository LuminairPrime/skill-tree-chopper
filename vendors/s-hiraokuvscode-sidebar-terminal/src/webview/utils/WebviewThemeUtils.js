"use strict";
/**
 * WebView Theme Utilities
 * @deprecated Use theme.types.ts for unified theme definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEME_UI_COLORS = exports.LIGHT_THEME = exports.DARK_THEME = exports.WEBVIEW_THEME_CONSTANTS = void 0;
exports.getWebviewTheme = getWebviewTheme;
const theme_types_1 = require("../types/theme.types");
Object.defineProperty(exports, "DARK_THEME", { enumerable: true, get: function () { return theme_types_1.DARK_THEME; } });
Object.defineProperty(exports, "LIGHT_THEME", { enumerable: true, get: function () { return theme_types_1.LIGHT_THEME; } });
Object.defineProperty(exports, "THEME_UI_COLORS", { enumerable: true, get: function () { return theme_types_1.THEME_UI_COLORS; } });
/**
 * WebView theme constants
 * @deprecated Import directly from theme.types.ts
 */
exports.WEBVIEW_THEME_CONSTANTS = {
    DARK_THEME: theme_types_1.DARK_THEME,
    LIGHT_THEME: theme_types_1.LIGHT_THEME,
    ...theme_types_1.THEME_UI_COLORS,
};
/**
 * Get WebView theme
 * @deprecated Use detectVSCodeTheme from theme.types.ts
 */
function getWebviewTheme(settings) {
    return (0, theme_types_1.detectVSCodeTheme)(settings);
}
//# sourceMappingURL=WebviewThemeUtils.js.map