"use strict";
/**
 * ScrollbackService Unit Tests
 *
 * Vitest Migration: Converted from Mocha/assert to Vitest
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ScrollbackService_1 = require("../../../../../services/scrollback/ScrollbackService");
(0, vitest_1.describe)('ScrollbackService', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        service = new ScrollbackService_1.ScrollbackService();
    });
    (0, vitest_1.afterEach)(() => {
        if (service) {
            service.dispose();
        }
    });
    (0, vitest_1.describe)('Basic Operations', () => {
        (0, vitest_1.it)('should initialize successfully', () => {
            (0, vitest_1.expect)(service).toBeDefined();
        });
        (0, vitest_1.it)('should start recording', () => {
            service.startRecording('term-1');
            const stats = service.getScrollbackStats('term-1');
            (0, vitest_1.expect)(stats).toBeDefined();
            (0, vitest_1.expect)(stats.isRecording).toBe(true);
        });
        (0, vitest_1.it)('should record data', () => {
            service.startRecording('term-1');
            service.recordData('term-1', 'test data\n');
            const stats = service.getScrollbackStats('term-1');
            (0, vitest_1.expect)(stats).toBeDefined();
            (0, vitest_1.expect)(stats.entryCount).toBe(1);
        });
        (0, vitest_1.it)('should serialize data', () => {
            service.startRecording('term-1');
            service.recordData('term-1', 'line 1\n');
            service.recordData('term-1', 'line 2\n');
            const data = service.getSerializedData('term-1');
            (0, vitest_1.expect)(data).toBeDefined();
            (0, vitest_1.expect)(data).toContain('line 1');
            (0, vitest_1.expect)(data).toContain('line 2');
        });
    });
});
//# sourceMappingURL=ScrollbackService.test.js.map