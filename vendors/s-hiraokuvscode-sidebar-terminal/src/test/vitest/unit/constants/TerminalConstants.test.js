'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const TerminalConstants_1 = require('../../../../constants/TerminalConstants');
(0, vitest_1.describe)('TerminalConstants', () => {
  (0, vitest_1.it)('should have MAX_TERMINAL_COUNT set to 10', () => {
    (0, vitest_1.expect)(TerminalConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_COUNT).toBe(10);
  });
  (0, vitest_1.it)('should have DEFAULT_MAX_TERMINALS set to 10', () => {
    (0, vitest_1.expect)(TerminalConstants_1.TERMINAL_CONSTANTS.DEFAULT_MAX_TERMINALS).toBe(10);
  });
  (0, vitest_1.it)('should have MAX_TERMINAL_ID_NUMBER set to 10', () => {
    (0, vitest_1.expect)(TerminalConstants_1.TERMINAL_CONSTANTS.MAX_TERMINAL_ID_NUMBER).toBe(10);
  });
});
//# sourceMappingURL=TerminalConstants.test.js.map
