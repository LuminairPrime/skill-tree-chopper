"use strict";
/**
 * Platform detection utilities for WebView context.
 *
 * Uses Navigator.userAgentData (modern) with fallback to Navigator.userAgent (legacy).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMacPlatform = isMacPlatform;
/**
 * Detect whether the current platform is macOS.
 */
function isMacPlatform() {
    const nav = navigator;
    return nav.userAgentData?.platform === 'macOS' || /Mac/.test(navigator.userAgent);
}
//# sourceMappingURL=PlatformUtils.js.map