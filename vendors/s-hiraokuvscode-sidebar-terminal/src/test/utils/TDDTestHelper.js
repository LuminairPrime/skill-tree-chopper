'use strict';
/**
 * TDD (Test-Driven Development) ヘルパーユーティリティ
 *
 * Red-Green-Refactorサイクルを支援するためのツール群
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TDDTestSuite =
  exports.TestDataFactory =
  exports.RestoreAssertionHelper =
  exports.MockManager =
  exports.PerformanceTestHelper =
  exports.TDDWorkflowManager =
    void 0;
const chai_1 = require('chai');
const sinon = require('sinon');
const TestConstants_1 = require('../constants/TestConstants');
/**
 * TDDワークフローマネージャー
 * テストの実行フェーズを管理し、適切なTDDサイクルを保証する
 */
class TDDWorkflowManager {
  constructor() {
    this.currentPhase = TestConstants_1.TDD_PHASES.RED;
    this.testResults = [];
  }
  /**
   * Red フェーズ: 失敗するテストを書く
   */
  startRedPhase(testName) {
    this.currentPhase = TestConstants_1.TDD_PHASES.RED;
    console.log(`🔴 [TDD-RED] Starting RED phase for: ${testName}`);
    console.log(`🔴 [TDD-RED] Expectation: Test should FAIL initially`);
  }
  /**
   * Green フェーズ: テストを通すための最小限の実装
   */
  startGreenPhase(testName) {
    this.currentPhase = TestConstants_1.TDD_PHASES.GREEN;
    console.log(`🟢 [TDD-GREEN] Starting GREEN phase for: ${testName}`);
    console.log(`🟢 [TDD-GREEN] Expectation: Test should PASS with minimal implementation`);
  }
  /**
   * Refactor フェーズ: コードの改善
   */
  startRefactorPhase(testName) {
    this.currentPhase = TestConstants_1.TDD_PHASES.REFACTOR;
    console.log(`🔵 [TDD-REFACTOR] Starting REFACTOR phase for: ${testName}`);
    console.log(`🔵 [TDD-REFACTOR] Expectation: Test should PASS with improved code`);
  }
  /**
   * テスト結果を記録
   */
  recordTestResult(testName, passed, duration) {
    this.testResults.push({
      phase: this.currentPhase,
      testName,
      passed,
      duration,
    });
    const phaseIcon = this.getPhaseIcon(this.currentPhase);
    const statusIcon = passed ? '✅' : '❌';
    console.log(
      `${phaseIcon} [TDD-${this.currentPhase}] ${statusIcon} ${testName} (${duration}ms)`
    );
  }
  /**
   * TDDサイクルの検証
   */
  validateTDDCycle(testName) {
    const testHistory = this.testResults.filter((r) => r.testName === testName);
    if (testHistory.length === 0) {
      throw new Error(`No test history found for: ${testName}`);
    }
    // Red-Green-Refactorサイクルの確認
    const phases = testHistory.map((r) => r.phase);
    console.log(`🔍 [TDD-VALIDATION] Test cycle for ${testName}: ${phases.join(' → ')}`);
  }
  /**
   * フェーズアイコンを取得
   */
  getPhaseIcon(phase) {
    switch (phase) {
      case TestConstants_1.TDD_PHASES.RED:
        return '🔴';
      case TestConstants_1.TDD_PHASES.GREEN:
        return '🟢';
      case TestConstants_1.TDD_PHASES.REFACTOR:
        return '🔵';
      default:
        return '⚪';
    }
  }
  /**
   * TDDレポートを生成
   */
  generateTDDReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.passed).length;
    const averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    return `
📊 TDD Cycle Report
==================
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${totalTests - passedTests}
Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%
Average Duration: ${averageDuration.toFixed(1)}ms

Phase Distribution:
- RED: ${this.testResults.filter((r) => r.phase === TestConstants_1.TDD_PHASES.RED).length}
- GREEN: ${this.testResults.filter((r) => r.phase === TestConstants_1.TDD_PHASES.GREEN).length}
- REFACTOR: ${this.testResults.filter((r) => r.phase === TestConstants_1.TDD_PHASES.REFACTOR).length}
`;
  }
}
exports.TDDWorkflowManager = TDDWorkflowManager;
/**
 * パフォーマンス測定ヘルパー
 */
class PerformanceTestHelper {
  /**
   * 関数の実行時間を測定
   */
  static async measureExecutionTime(fn, testName) {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    console.log(`⏱️ [PERFORMANCE] ${testName}: ${duration}ms`);
    return { result, duration };
  }
  /**
   * パフォーマンス閾値の検証
   */
  static validatePerformance(duration, operation, testName) {
    let threshold;
    switch (operation) {
      case 'save':
        threshold = TestConstants_1.PERFORMANCE_THRESHOLDS.MAX_SAVE_TIME_MS;
        break;
      case 'restore':
        threshold = TestConstants_1.PERFORMANCE_THRESHOLDS.MAX_RESTORE_TIME_MS;
        break;
      case 'scrollback':
        threshold = TestConstants_1.PERFORMANCE_THRESHOLDS.MAX_SCROLLBACK_RESTORE_MS;
        break;
    }
    if (duration > threshold) {
      console.warn(
        `⚠️ [PERFORMANCE WARNING] ${testName} took ${duration}ms (threshold: ${threshold}ms)`
      );
    } else {
      console.log(`✅ [PERFORMANCE OK] ${testName} completed in ${duration}ms`);
    }
    // アサーションとしても使用可能
    (0, chai_1.expect)(duration).to.be.lessThan(
      threshold,
      `Performance test failed: ${testName} took ${duration}ms (max: ${threshold}ms)`
    );
  }
}
exports.PerformanceTestHelper = PerformanceTestHelper;
/**
 * モックマネージャー
 * 一貫性のあるモックオブジェクトの生成と管理
 */
class MockManager {
  constructor(sandbox) {
    this.sandbox = sandbox;
  }
  /**
   * 標準的なExtensionContextモックを作成
   */
  createMockExtensionContext(customConfig) {
    const mockGlobalState = {
      get: this.sandbox.stub(),
      update: this.sandbox.stub().resolves(),
      keys: this.sandbox.stub(),
      setKeysForSync: this.sandbox.stub(),
    };
    return {
      globalState: mockGlobalState,
      subscriptions: [],
      extensionPath: '/test/path',
      ...customConfig,
    };
  }
  /**
   * 標準的なTerminalManagerモックを作成
   */
  createMockTerminalManager(customConfig) {
    return {
      getTerminals: this.sandbox.stub().returns([]),
      getActiveTerminalId: this.sandbox.stub().returns(undefined),
      createTerminal: this.sandbox.stub().returns('new-term-id'),
      setActiveTerminal: this.sandbox.stub(),
      ...customConfig,
    };
  }
  /**
   * SidebarProviderモックを作成
   */
  createMockSidebarProvider() {
    return {
      _sendMessage: this.sandbox.stub(),
    };
  }
}
exports.MockManager = MockManager;
/**
 * アサーションヘルパー
 * 復元機能テスト用の共通アサーション
 */
class RestoreAssertionHelper {
  /**
   * セッション復元の基本検証
   */
  static validateBasicRestore(result, expectedCount, testName) {
    (0, chai_1.expect)(result.success).to.be.true;
    (0, chai_1.expect)(result.restoredCount).to.equal(expectedCount);
    console.log(`✅ [ASSERTION] ${testName}: ${expectedCount} terminals restored successfully`);
  }
  /**
   * TerminalManager呼び出しの検証
   */
  static validateTerminalManagerCalls(
    mockTerminalManager,
    expectedCreateCalls,
    expectedSetActiveCalls,
    testName
  ) {
    (0, chai_1.expect)(mockTerminalManager.createTerminal.callCount).to.equal(expectedCreateCalls);
    if (expectedSetActiveCalls > 0) {
      (0, chai_1.expect)(mockTerminalManager.setActiveTerminal.callCount).to.equal(
        expectedSetActiveCalls
      );
    }
    console.log(`✅ [ASSERTION] ${testName}: Terminal manager calls validated`);
  }
  /**
   * Scrollback復元の検証
   */
  static async validateScrollbackRestore(
    mockSidebarProvider,
    expectedTerminalId,
    expectedLines,
    delayMs = 2000
  ) {
    // Scrollback復元の遅延を待つ
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    (0, chai_1.expect)(mockSidebarProvider._sendMessage.calledOnce).to.be.true;
    const sentMessage = mockSidebarProvider._sendMessage.firstCall.args[0];
    (0, chai_1.expect)(sentMessage.command).to.equal('restoreScrollback');
    (0, chai_1.expect)(sentMessage.terminalId).to.equal(expectedTerminalId);
    (0, chai_1.expect)(sentMessage.scrollbackContent).to.have.length(expectedLines);
    console.log(
      `✅ [ASSERTION] Scrollback restored: ${expectedLines} lines to ${expectedTerminalId}`
    );
  }
}
exports.RestoreAssertionHelper = RestoreAssertionHelper;
/**
 * テストデータファクトリー
 * 一貫性のあるテストデータの生成
 */
class TestDataFactory {
  /**
   * セッションデータを生成
   */
  static createSessionData(terminalCount, activeTerminalId, includeScrollback = false) {
    const terminals = [];
    for (let i = 1; i <= terminalCount; i++) {
      const terminalId = `term${i}`;
      const terminal = {
        id: terminalId,
        name: `Terminal ${i}`,
        number: i,
        cwd: '/test',
        isActive: terminalId === (activeTerminalId || 'term1'),
      };
      if (includeScrollback) {
        terminal.scrollback = [
          { content: 'echo hello', type: 'input', timestamp: Date.now() },
          { content: 'hello', type: 'output', timestamp: Date.now() },
        ];
      }
      terminals.push(terminal);
    }
    return {
      terminals,
      activeTerminalId: activeTerminalId || 'term1',
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }
  /**
   * 期限切れセッションデータを生成
   */
  static createExpiredSessionData(daysAgo) {
    const sessionData = this.createSessionData(1);
    return {
      ...sessionData,
      timestamp: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    };
  }
  /**
   * 破損したセッションデータを生成
   */
  static createCorruptSessionData() {
    return {
      terminals: 'not-an-array',
      activeTerminalId: 123,
      timestamp: 'invalid-timestamp',
    };
  }
}
exports.TestDataFactory = TestDataFactory;
/**
 * TDDテストスイートベースクラス
 */
class TDDTestSuite {
  constructor() {
    this.tddManager = new TDDWorkflowManager();
    this.sandbox = sinon.createSandbox();
    this.mockManager = new MockManager(this.sandbox);
  }
  /**
   * TDDサイクルでテストを実行
   */
  async runTDDCycle(testName, testImplementation) {
    // RED phase
    this.tddManager.startRedPhase(testName);
    try {
      const { result, duration } = await PerformanceTestHelper.measureExecutionTime(
        testImplementation,
        testName
      );
      this.tddManager.recordTestResult(testName, true, duration);
      return result;
    } catch (error) {
      this.tddManager.recordTestResult(testName, false, 0);
      throw error;
    }
  }
  /**
   * クリーンアップ
   */
  cleanup() {
    this.sandbox.restore();
    console.log(this.tddManager.generateTDDReport());
  }
}
exports.TDDTestSuite = TDDTestSuite;
//# sourceMappingURL=TDDTestHelper.js.map
