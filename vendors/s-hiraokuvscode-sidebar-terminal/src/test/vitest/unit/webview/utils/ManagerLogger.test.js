"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ManagerLogger_1 = require("../../../../../webview/utils/ManagerLogger");
const logger_1 = require("../../../../../utils/logger");
// Mock base logger
vi.mock('../../../../../utils/logger', () => ({
    webview: vi.fn(),
}));
(0, vitest_1.describe)('ManagerLogger', () => {
    let logger;
    beforeEach(() => {
        // Reset global config to defaults
        ManagerLogger_1.ManagerLogger.configure({
            enableTimestamp: false,
            enableLevel: true,
            maxMessageLength: 500,
        });
        ManagerLogger_1.ManagerLogger.clearHistory();
        logger = ManagerLogger_1.ManagerLogger.createLogger('TestManager', '🧪');
        vi.clearAllMocks();
    });
    (0, vitest_1.describe)('Basic Logging', () => {
        (0, vitest_1.it)('should log info messages to base logger', () => {
            logger.info('Hello world');
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('🧪 [TestManager] Hello world'));
        });
        (0, vitest_1.it)('should include [LEVEL] for non-info logs', () => {
            logger.error('Failed');
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('[ERROR] 🧪 [TestManager] Failed'));
        });
        (0, vitest_1.it)('should truncate long messages', () => {
            // Configure BEFORE creating the instance, or use a fresh one
            ManagerLogger_1.ManagerLogger.configure({ maxMessageLength: 10 });
            const truncateLogger = ManagerLogger_1.ManagerLogger.createLogger('Short', 'S');
            const longMsg = 'This is a very long message';
            truncateLogger.info(longMsg);
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('This is a ...'));
        });
        (0, vitest_1.it)('should log additional data', () => {
            const data = { id: 1 };
            logger.info('Msg', data);
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('🧪 [TestManager] Msg'));
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith('🔍 [TestManager] Data:', data);
        });
    });
    (0, vitest_1.describe)('Specialized Formats', () => {
        (0, vitest_1.it)('should format lifecycle events', () => {
            logger.lifecycle('Init', 'completed');
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('🧪 [TestManager] ✅ Init completed'));
        });
        (0, vitest_1.it)('should format performance logs', () => {
            logger.performance('Startup', 150);
            (0, vitest_1.expect)(logger_1.webview).toHaveBeenCalledWith(vitest_1.expect.stringContaining('🧪 [TestManager] ⏱️ Startup: 150ms'));
        });
    });
    (0, vitest_1.describe)('History and Stats', () => {
        (0, vitest_1.it)('should keep track of log history', () => {
            logger.info('msg1');
            logger.warn('msg2');
            const all = ManagerLogger_1.ManagerLogger.getAllLogs();
            (0, vitest_1.expect)(all.length).toBe(2);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(all[0].message).toBe('msg1');
        });
        (0, vitest_1.it)('should filter logs by manager', () => {
            const other = ManagerLogger_1.ManagerLogger.createLogger('Other');
            logger.info('msg1');
            other.info('msg2');
            const filtered = logger.getRecentLogs(10);
            (0, vitest_1.expect)(filtered.length).toBe(1);
            // @ts-expect-error - test mock type
            (0, vitest_1.expect)(filtered[0].message).toBe('msg1');
        });
        (0, vitest_1.it)('should provide statistics', () => {
            logger.info('msg');
            logger.error('err');
            const stats = ManagerLogger_1.ManagerLogger.getStats();
            (0, vitest_1.expect)(stats.totalEntries).toBe(2);
            (0, vitest_1.expect)(stats.levelCounts.info).toBe(1);
            (0, vitest_1.expect)(stats.levelCounts.error).toBe(1);
            (0, vitest_1.expect)(stats.managerCounts['TestManager']).toBe(2);
        });
    });
});
//# sourceMappingURL=ManagerLogger.test.js.map