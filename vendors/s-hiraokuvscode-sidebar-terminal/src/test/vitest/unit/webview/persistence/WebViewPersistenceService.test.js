"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jsdom_1 = require("jsdom");
const WebViewPersistenceService_1 = require("../../../../../webview/persistence/WebViewPersistenceService");
(0, vitest_1.describe)('WebViewPersistenceService', () => {
    let dom;
    let service;
    (0, vitest_1.beforeEach)(() => {
        dom = new jsdom_1.JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
        });
        vitest_1.vi.stubGlobal('window', dom.window);
        vitest_1.vi.stubGlobal('document', dom.window.document);
        vitest_1.vi.stubGlobal('localStorage', dom.window.localStorage);
        vitest_1.vi.stubGlobal('sessionStorage', dom.window.sessionStorage);
        // Clear localStorage before each test
        localStorage.clear();
        service = new WebViewPersistenceService_1.WebViewPersistenceService();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        dom.window.close();
        vitest_1.vi.unstubAllGlobals();
    });
    (0, vitest_1.describe)('saveSession', () => {
        (0, vitest_1.it)('should save session data to localStorage', async () => {
            // @ts-expect-error - test mock type
            const response = await service.saveSession({ requestId: 'req-1' });
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(localStorage.getItem('secondaryTerminal.webview.session')).not.toBeNull();
        });
        (0, vitest_1.it)('should return failure if data exceeds max size', async () => {
            // Mock collectLocalSessionData to return huge data
            const hugeData = {
                version: '2.0.0',
                timestamp: Date.now(),
                terminals: new Array(1000).fill({ id: 't', name: 'x'.repeat(10000) }),
            };
            // @ts-ignore - mocking private method
            vitest_1.vi.spyOn(service, 'collectLocalSessionData').mockResolvedValue(hugeData);
            // @ts-expect-error - test mock type
            const response = await service.saveSession({ requestId: 'req-2' });
            (0, vitest_1.expect)(response.success).toBe(false);
            (0, vitest_1.expect)(response.error).toContain('Failed to store');
        });
    });
    (0, vitest_1.describe)('restoreSession', () => {
        (0, vitest_1.it)('should return session data from localStorage', async () => {
            const testData = {
                version: '2.0.0',
                timestamp: Date.now(),
                terminals: [{ id: 'term-1', name: 'Terminal 1' }],
            };
            localStorage.setItem('secondaryTerminal.webview.session', JSON.stringify(testData));
            // @ts-expect-error - test mock type
            const response = await service.restoreSession({ requestId: 'req-3' });
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(response.restoredTerminals).toBe(1);
        });
        (0, vitest_1.it)('should return failure if no data found', async () => {
            // @ts-expect-error - test mock type
            const response = await service.restoreSession({ requestId: 'req-4' });
            (0, vitest_1.expect)(response.success).toBe(false);
            (0, vitest_1.expect)(response.errors).toContain('No local session data found');
        });
    });
    (0, vitest_1.describe)('clearSession', () => {
        (0, vitest_1.it)('should remove session data from localStorage', async () => {
            localStorage.setItem('secondaryTerminal.webview.session', 'some-data');
            // @ts-expect-error - test mock type
            const response = await service.clearSession({ requestId: 'req-5' });
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(localStorage.getItem('secondaryTerminal.webview.session')).toBeNull();
        });
    });
    (0, vitest_1.describe)('cleanupExpiredSessions', () => {
        (0, vitest_1.it)('should clear sessions older than 1 day', async () => {
            const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
            const oldData = {
                version: '2.0.0',
                timestamp: oldTimestamp,
                terminals: [],
            };
            localStorage.setItem('secondaryTerminal.webview.session', JSON.stringify(oldData));
            await service.cleanupExpiredSessions();
            (0, vitest_1.expect)(localStorage.getItem('secondaryTerminal.webview.session')).toBeNull();
        });
        (0, vitest_1.it)('should not clear recent sessions', async () => {
            const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago
            const recentData = {
                version: '2.0.0',
                timestamp: recentTimestamp,
                terminals: [],
            };
            localStorage.setItem('secondaryTerminal.webview.session', JSON.stringify(recentData));
            await service.cleanupExpiredSessions();
            (0, vitest_1.expect)(localStorage.getItem('secondaryTerminal.webview.session')).not.toBeNull();
        });
    });
});
//# sourceMappingURL=WebViewPersistenceService.test.js.map