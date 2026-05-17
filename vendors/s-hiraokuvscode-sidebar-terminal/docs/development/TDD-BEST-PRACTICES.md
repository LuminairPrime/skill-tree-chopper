# TDDベストプラクティス集

## 📖 はじめに

t-wada氏のTDD手法に基づいた実践的なベストプラクティス集です。
VS Code Sidebar Terminal プロジェクトでの経験を基に、効果的なTDD実践のためのノウハウを集約しました。

## 🎯 TDDの基本原則

### 1. Red-Green-Refactor サイクル

#### Red Phase: 失敗するテストを書く

```typescript
// ❌ 悪い例: 実装を意識したテスト
it('should call updateSettings method', () => {
  const panel = new SettingsPanel();
  const spy = vi.spyOn(panel, 'updateSettings');
  panel.handleApplyClick();
  expect(spy).toHaveBeenCalled();
});

// ✅ 良い例: 振る舞いを確認するテスト
it('should apply font size setting when apply button is clicked', () => {
  const panel = new SettingsPanel();
  panel.show({ fontSize: 16 });

  // Apply button click simulation
  panel.handleApplyClick();

  const appliedSettings = panel.getAppliedSettings();
  expect(appliedSettings.fontSize).toBe(16);
});
```

#### Green Phase: 最小実装で通す

```typescript
// ❌ 悪い例: 過剰な実装
class SettingsPanel {
  private settings: any = {};
  private cache: Map<string, any> = new Map();
  private listeners: EventListener[] = [];

  handleApplyClick() {
    // 複雑なキャッシュロジック
    // 複数のイベント処理
    // エラーハンドリング
    this.settings = this.gatherAllPossibleSettings();
  }
}

// ✅ 良い例: 最小実装
class SettingsPanel {
  private appliedSettings: any = {};

  handleApplyClick() {
    this.appliedSettings = { fontSize: 16 };
  }

  getAppliedSettings() {
    return this.appliedSettings;
  }
}
```

#### Refactor Phase: 設計を改善

```typescript
// リファクタリング前の重複
class SettingsPanel {
  handleFontSizeChange() {
    const slider = document.getElementById('font-size-slider');
    const value = slider.value;
    this.fontSize = parseInt(value);
  }

  handleLineHeightChange() {
    const slider = document.getElementById('line-height-slider');
    const value = slider.value;
    this.lineHeight = parseInt(value);
  }
}

// リファクタリング後の統一
class SettingsPanel {
  private handleSliderChange(sliderId: string, property: string) {
    const slider = document.getElementById(sliderId);
    const value = parseInt(slider.value);
    this[property] = value;
  }

  handleFontSizeChange() {
    this.handleSliderChange('font-size-slider', 'fontSize');
  }

  handleLineHeightChange() {
    this.handleSliderChange('line-height-slider', 'lineHeight');
  }
}
```

## 🧪 効果的なテスト設計

### 1. テストの構造（AAA パターン）

```typescript
describe('SettingsPanel', () => {
  it('should update font size when slider value changes', () => {
    // Arrange（準備）
    const panel = new SettingsPanel();
    const mockSlider = { value: '18' };
    document.getElementById = vi.fn().mockReturnValue(mockSlider);

    // Act（実行）
    panel.handleFontSizeChange();

    // Assert（検証）
    expect(panel.getFontSize()).toBe(18);
  });
});
```

### 2. 境界値テスト

```typescript
describe('Font size validation', () => {
  const testCases = [
    { input: 8, expected: 8, description: 'minimum valid value' },
    { input: 7, expected: 8, description: 'below minimum (should clamp)' },
    { input: 24, expected: 24, description: 'maximum valid value' },
    { input: 25, expected: 24, description: 'above maximum (should clamp)' },
    { input: 16, expected: 16, description: 'typical valid value' },
  ];

  testCases.forEach(({ input, expected, description }) => {
    it(`should handle ${description}`, () => {
      const panel = new SettingsPanel();
      panel.setFontSize(input);
      expect(panel.getFontSize()).toBe(expected);
    });
  });
});
```

### 3. エラーケーステスト

```typescript
describe('Error handling', () => {
  it('should handle missing DOM elements gracefully', () => {
    // DOM要素が存在しない場合のテスト
    document.getElementById = vi.fn().mockReturnValue(null);

    const panel = new SettingsPanel();

    // エラーが投げられないことを確認
    expect(() => panel.handleFontSizeChange()).not.toThrow();
  });

  it('should handle invalid slider values', () => {
    const mockSlider = { value: 'invalid' };
    document.getElementById = vi.fn().mockReturnValue(mockSlider);

    const panel = new SettingsPanel();
    panel.handleFontSizeChange();

    // デフォルト値が設定されることを確認
    expect(panel.getFontSize()).toBe(14); // default value
  });
});
```

## 🔧 VS Code拡張開発特有のTDD

### 1. VS Code API のモック

```typescript
// テストセットアップファイル
export const mockVSCodeAPI = {
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn().mockReturnValue(true),
    }),
  },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  commands: {
    executeCommand: vi.fn().mockResolvedValue(undefined),
  },
};

// 各テストでの使用
beforeEach(() => {
  (global as any).vscode = mockVSCodeAPI;
});
```

### 2. Webview通信のテスト

```typescript
describe('Webview communication', () => {
  it('should send settings update message to extension', () => {
    const mockPostMessage = vi.fn();
    (global as any).acquireVsCodeApi = () => ({
      postMessage: mockPostMessage,
    });

    const panel = new SettingsPanel();
    panel.sendSettingsUpdate({ fontSize: 16 });

    expect(mockPostMessage).toHaveBeenCalledWith({
      command: 'updateSettings',
      settings: { fontSize: 16 },
    });
  });
});
```

### 3. 非同期処理のテスト

```typescript
describe('Async operations', () => {
  it('should handle command execution asynchronously', async () => {
    const commandStub = vi.fn().mockResolvedValue('success');
    (global as any).vscode.commands.executeCommand = commandStub;

    const command = new CopilotIntegrationCommand();
    await command.handleActivateCopilot();

    expect(commandStub).toHaveBeenCalledWith('workbench.action.chat.open');
  });

  it('should handle command execution errors', async () => {
    const commandStub = vi.fn().mockRejectedValue(new Error('Command failed'));
    (global as any).vscode.commands.executeCommand = commandStub;

    const command = new CopilotIntegrationCommand();

    // エラーが適切にハンドリングされることを確認
    await expect(command.handleActivateCopilot()).resolves.not.toThrow();
  });
});
```

## 📊 メトリクス駆動開発

### 1. TDD遵守率の維持

```bash
# 目標値設定
TDD_COMPLIANCE_TARGET=80%
TEST_COVERAGE_TARGET=90%
CODE_QUALITY_TARGET=85%

# 継続的なモニタリング
npm run tdd:check-quality
```

### 2. 品質ゲートの設定

```typescript
// 品質チェックの自動化
class QualityGate {
  static checkTDDCompliance(): boolean {
    const metrics = TDDMetrics.getInstance().getCurrentMetrics();
    return metrics.tddComplianceRate >= 0.8;
  }

  static checkTestCoverage(): boolean {
    const coverage = CoverageReporter.getCurrentCoverage();
    return coverage.percentage >= 90;
  }

  static checkCodeQuality(): boolean {
    const eslintScore = ESLintReporter.getScore();
    const typescriptScore = TypeScriptReporter.getScore();
    return eslintScore >= 90 && typescriptScore >= 90;
  }
}
```

## 🎨 リファクタリングの実践

### 1. 段階的リファクタリング

```typescript
// Step 1: テストで現在の動作を保護
describe('Current behavior protection', () => {
  it('should maintain existing functionality during refactoring', () => {
    const panel = new SettingsPanel();
    const originalBehavior = panel.getAllSettings();

    // リファクタリング前の状態を記録
    expect(originalBehavior).toEqual({
      fontSize: 14,
      theme: 'auto',
    });
  });
});

// Step 2: 小さな変更を段階的に適用
// Step 3: 各段階でテストが通ることを確認
// Step 4: 最終的な設計目標に到達
```

### 2. デザインパターンの適用

```typescript
// リファクタリング前: 手続き型
class SettingsPanel {
  applyTheme(theme: string) {
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#1e1e1e';
      document.body.style.color = '#ffffff';
    } else if (theme === 'light') {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
  }
}

// リファクタリング後: Strategy パターン
interface ThemeStrategy {
  apply(): void;
}

class DarkTheme implements ThemeStrategy {
  apply() {
    document.body.style.backgroundColor = '#1e1e1e';
    document.body.style.color = '#ffffff';
  }
}

class LightTheme implements ThemeStrategy {
  apply() {
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#000000';
  }
}

class SettingsPanel {
  applyTheme(strategy: ThemeStrategy) {
    strategy.apply();
  }
}
```

## 🔍 デバッグとトラブルシューティング

### 1. テスト失敗時の調査手順

```typescript
// 1. 失敗の詳細確認
npm test -- --grep "failing test name" --reporter spec

// 2. デバッグ用ログ追加
it('should debug failing behavior', () => {
  const panel = new SettingsPanel();
  console.log('Before action:', panel.getState());

  panel.performAction();

  console.log('After action:', panel.getState());
  expect(panel.getState()).toBe('expected');
});

// 3. ステップバイステップ検証
it('should verify each step', () => {
  const panel = new SettingsPanel();

  // Step 1
  panel.initialize();
  expect(panel.isInitialized()).toBe(true);

  // Step 2
  panel.loadSettings();
  expect(panel.hasSettings()).toBe(true);

  // Step 3
  panel.render();
  expect(panel.isVisible()).toBe(true);
});
```

### 2. モックの適切な使用

```typescript
// ❌ 悪い例: 過度なモック
it('should test with excessive mocking', () => {
  vi.spyOn(document, 'createElement');
  vi.spyOn(window, 'getComputedStyle');
  vi.spyOn(document, 'querySelector');
  // ... 過度なモック設定
});

// ✅ 良い例: 必要最小限のモック
it('should test with minimal mocking', () => {
  vi.spyOn(document, 'getElementById').mockReturnValue({ value: '16' } as any);

  const panel = new SettingsPanel();
  panel.handleFontSizeChange();

  expect(panel.getFontSize()).toBe(16);
});
```

## 📈 継続的改善

### 1. TDDメトリクスの活用

```typescript
// 週次レビューでの確認項目
class TDDReview {
  static generateWeeklyReport() {
    const metrics = TDDMetrics.getInstance().getWeeklyMetrics();

    return {
      tddCompliance: metrics.tddComplianceRate,
      testCoverage: metrics.coveragePercentage,
      codeQuality: metrics.qualityScore,
      recommendations: this.generateRecommendations(metrics),
    };
  }

  private static generateRecommendations(metrics: any) {
    const recommendations = [];

    if (metrics.tddComplianceRate < 0.8) {
      recommendations.push(
        'TDD遵守率が低下しています。Red-Green-Refactorサイクルを意識してください。'
      );
    }

    if (metrics.coveragePercentage < 0.9) {
      recommendations.push(
        'テストカバレッジが不足しています。エッジケースのテストを追加してください。'
      );
    }

    return recommendations;
  }
}
```

### 2. チーム学習の促進

```bash
# ペアプロミングセッション
npm run tdd:pair-session

# コードレビューでのTDDチェック
npm run tdd:review-checklist

# TDD学習セッション
npm run tdd:learning-session
```

## 🎓 学習リソース

### 推奨プラクティス順序

1. **基礎**: Red-Green-Refactorサイクルの習得
2. **応用**: 効果的なテスト設計パターンの学習
3. **発展**: リファクタリング技法の実践
4. **熟達**: メトリクス駆動でのTDD改善

### 参考書籍・資料

- 『テスト駆動開発』Kent Beck
- 『レガシーコード改善ガイド』Michael Feathers
- t-wada氏のJavaScriptテスト講座
- Clean Code: テスト章

---

## 💡 まとめ

効果的なTDDの実践には：

1. **小さなサイクル**: 5-10分でRed-Green-Refactorを完了
2. **明確なテスト**: 何をテストするか明確に定義
3. **最小実装**: 必要以上に実装しない
4. **継続的リファクタリング**: 設計を常に改善
5. **メトリクス活用**: 数値でTDD品質を管理

これらの実践により、保守しやすく高品質なコードベースを実現できます。
