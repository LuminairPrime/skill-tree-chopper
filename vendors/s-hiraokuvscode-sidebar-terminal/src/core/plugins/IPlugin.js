"use strict";
/**
 * Base Plugin Interface
 *
 * All plugins must implement this interface to participate in the plugin lifecycle.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginState = void 0;
/**
 * Plugin lifecycle states
 */
var PluginState;
(function (PluginState) {
    /** Plugin is registered but not activated */
    PluginState["Registered"] = "registered";
    /** Plugin is active and running */
    PluginState["Active"] = "active";
    /** Plugin encountered an error */
    PluginState["Error"] = "error";
    /** Plugin is deactivated */
    PluginState["Deactivated"] = "deactivated";
})(PluginState || (exports.PluginState = PluginState = {}));
//# sourceMappingURL=IPlugin.js.map