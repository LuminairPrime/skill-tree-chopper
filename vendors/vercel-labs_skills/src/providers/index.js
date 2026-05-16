"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wellKnownProvider = exports.WellKnownProvider = exports.getProviders = exports.findProvider = exports.registerProvider = exports.registry = void 0;
// Export registry functions
var registry_ts_1 = require("./registry.ts");
Object.defineProperty(exports, "registry", { enumerable: true, get: function () { return registry_ts_1.registry; } });
Object.defineProperty(exports, "registerProvider", { enumerable: true, get: function () { return registry_ts_1.registerProvider; } });
Object.defineProperty(exports, "findProvider", { enumerable: true, get: function () { return registry_ts_1.findProvider; } });
Object.defineProperty(exports, "getProviders", { enumerable: true, get: function () { return registry_ts_1.getProviders; } });
// Export individual providers
var wellknown_ts_1 = require("./wellknown.ts");
Object.defineProperty(exports, "WellKnownProvider", { enumerable: true, get: function () { return wellknown_ts_1.WellKnownProvider; } });
Object.defineProperty(exports, "wellKnownProvider", { enumerable: true, get: function () { return wellknown_ts_1.wellKnownProvider; } });
//# sourceMappingURL=index.js.map