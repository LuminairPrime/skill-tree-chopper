'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const session_types_1 = require('../../../../shared/session.types');
(0, vitest_1.describe)('SessionDataTransformer', () => {
  const validSession = {
    terminals: [{ id: 't1', name: 'Term 1', number: 1, cwd: '/test', isActive: true }],
    activeTerminalId: 't1',
    timestamp: Date.now(),
    version: '1.0.0',
  };
  (0, vitest_1.beforeEach)(() => {
    vitest_1.vi.useFakeTimers();
  });
  (0, vitest_1.describe)('Validation', () => {
    (0, vitest_1.it)('should identify valid session data', () => {
      (0, vitest_1.expect)(
        session_types_1.SessionDataTransformer.isValidSessionData(validSession)
      ).toBe(true);
    });
    (0, vitest_1.it)('should reject invalid structures', () => {
      (0, vitest_1.expect)(session_types_1.SessionDataTransformer.isValidSessionData({})).toBe(
        false
      );
      (0, vitest_1.expect)(
        session_types_1.SessionDataTransformer.isValidSessionData({ terminals: [] })
      ).toBe(false); // missing timestamp/version
    });
  });
  (0, vitest_1.describe)('Expiry', () => {
    (0, vitest_1.it)('should detect expired sessions', () => {
      const oldSession = { ...validSession, timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 };
      (0, vitest_1.expect)(
        session_types_1.SessionDataTransformer.isSessionExpired(oldSession, 7)
      ).toBe(true);
    });
    (0, vitest_1.it)('should not detect fresh sessions as expired', () => {
      (0, vitest_1.expect)(
        session_types_1.SessionDataTransformer.isSessionExpired(validSession, 7)
      ).toBe(false);
    });
  });
  (0, vitest_1.describe)('Storage Optimization', () => {
    (0, vitest_1.it)('should calculate approximate storage size', () => {
      const size = session_types_1.SessionDataTransformer.calculateStorageSize(validSession);
      (0, vitest_1.expect)(size).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should detect when storage limit is exceeded', () => {
      // Simulate 20MB limit check
      const result = session_types_1.SessionDataTransformer.isStorageLimitExceeded(
        validSession,
        0.000001
      ); // ultra-low limit
      (0, vitest_1.expect)(result.exceeded).toBe(true);
    });
    (0, vitest_1.it)('should optimize storage by trimming scrollback', () => {
      const sessionWithLargeScrollback = {
        ...validSession,
        scrollbackData: {
          t1: Array(100).fill('some long log line content'),
        },
      };
      const result = session_types_1.SessionDataTransformer.optimizeSessionStorage(
        sessionWithLargeScrollback,
        0.0001
      ); // Trigger optimization
      (0, vitest_1.expect)(result.optimized).toBe(true);
      (0, vitest_1.expect)(result.reductionPercent).toBeGreaterThan(0);
      const optimizedScrollback = sessionWithLargeScrollback.scrollbackData?.['t1'];
      (0, vitest_1.expect)(optimizedScrollback.length).toBeLessThan(100);
    });
  });
  (0, vitest_1.describe)('Migration', () => {
    (0, vitest_1.it)('should migrate old format sessions', () => {
      const oldFormat = {
        terminals: [],
        timestamp: Date.now(),
        // No version, or old version
        config: { scrollbackLines: 200 },
      };
      const result = session_types_1.SessionDataTransformer.migrateSessionFormat(oldFormat);
      (0, vitest_1.expect)(result.migrated).toBe(true);
      (0, vitest_1.expect)(result.sessionData.version).toBe('0.1.137');
      (0, vitest_1.expect)(result.sessionData.config?.scrollbackLines).toBe(1000);
    });
    (0, vitest_1.it)('should not migrate current sessions', () => {
      const result = session_types_1.SessionDataTransformer.migrateSessionFormat(validSession);
      (0, vitest_1.expect)(result.migrated).toBe(false);
    });
  });
  (0, vitest_1.describe)('Helpers', () => {
    (0, vitest_1.it)('should normalize terminal data with defaults', () => {
      const partial = { id: 'test' };
      const normalized = session_types_1.SessionDataTransformer.normalizeTerminalData(partial);
      (0, vitest_1.expect)(normalized.id).toBe('test');
      (0, vitest_1.expect)(normalized.name).toBe('Terminal');
      (0, vitest_1.expect)(normalized.scrollback).toEqual([]);
    });
    (0, vitest_1.it)('should create success and failure results', () => {
      const success = session_types_1.SessionDataTransformer.createSuccessResult(2);
      (0, vitest_1.expect)(success.success).toBe(true);
      (0, vitest_1.expect)(success.restoredCount).toBe(2);
      const failure = session_types_1.SessionDataTransformer.createFailureResult('Error msg');
      (0, vitest_1.expect)(failure.success).toBe(false);
      (0, vitest_1.expect)(failure.message).toContain('Error msg');
    });
  });
});
//# sourceMappingURL=SessionDataTransformer.test.js.map
