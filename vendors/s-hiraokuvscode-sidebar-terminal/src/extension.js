'use strict';
/**
 * Main entry point for the Secondary Terminal VS Code extension.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const ExtensionLifecycle_1 = require('./core/ExtensionLifecycle');
const lifecycle = new ExtensionLifecycle_1.ExtensionLifecycle();
function activate(context) {
  return lifecycle.activate(context);
}
async function deactivate() {
  await lifecycle.deactivate();
}
//# sourceMappingURL=extension.js.map
