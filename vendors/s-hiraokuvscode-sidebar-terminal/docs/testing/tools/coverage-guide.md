# コードカバレッジガイド

Vitest built-in v8カバレッジを使用したコードカバレッジ測定のガイドです。このドキュメントでは、カバレッジの設定、測定、分析、改善方法を説明します。

## 目次

- [コードカバレッジとは](#コードカバレッジとは)
- [Vitestカバレッジのセットアップ](#vitestカバレッジのセットアップ)
- [カバレッジの測定](#カバレッジの測定)
- [カバレッジレポートの読み方](#カバレッジレポートの読み方)
- [カバレッジの改善](#カバレッジの改善)
- [CI/CDでのカバレッジチェック](#cicdでのカバレッジチェック)
- [トラブルシューティング](#トラブルシューティング)

---

## コードカバレッジとは

### カバレッジの種類

| 種類                   | 説明                 | 目標 |
| ---------------------- | -------------------- | ---- |
| **Line Coverage**      | 実行された行の割合   | 80%+ |
| **Function Coverage**  | 実行された関数の割合 | 85%+ |
| **Branch Coverage**    | 実行された分岐の割合 | 75%+ |
| **Statement Coverage** | 実行された文の割合   | 80%+ |

### カバレッジの目標

**現在の状態**:

- Line Coverage: ~70%
- Function Coverage: ~65%
- Branch Coverage: ~60%

**Phase 2 目標** (test-environment-improvement-proposal.md参照):

- Line Coverage: 85%
- Function Coverage: 85%
- Branch Coverage: 80%

### カバレッジ100%を目指すべきか？

**結論**: No

- **80-85%が現実的な目標**
- エラーハンドリングのエッジケースなど、テストが困難なコードも存在
- カバレッジの質 > 量
- 重要なコードパス（クリティカルパス）は必ず100%に

---

## Vitestカバレッジのセットアップ

### インストール

```bash
npm install --save-dev @vitest/coverage-v8
```

### 設定ファイル: vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 60,
        statements: 70,
      },
    },
  },
});
```

### 設定オプションの詳細

| オプション             | 説明                     | 推奨値            |
| ---------------------- | ------------------------ | ----------------- |
| `provider`             | カバレッジプロバイダー   | v8                |
| `include`              | カバレッジ対象のパターン | src/\*_/_.ts      |
| `exclude`              | 除外するパターン         | test/, \*.test.ts |
| `reporter`             | レポート形式             | text, html, lcov  |
| `thresholds.lines`     | ライン カバレッジ最小値  | 70                |
| `thresholds.functions` | 関数カバレッジ最小値     | 65                |
| `thresholds.branches`  | 分岐カバレッジ最小値     | 60                |

---

## カバレッジの測定

### 基本的な実行

```bash
# カバレッジ付きでテスト実行
npm run test:coverage

# または直接vitestを実行
npx vitest run --coverage
```

### カバレッジレポートの生成

```bash
# すべてのレポート形式を生成（vitest.config.tsで設定）
npx vitest run --coverage

# テキストレポートのみ
npx vitest run --coverage --coverage.reporter=text

# HTMLレポートのみ
npx vitest run --coverage --coverage.reporter=html
```

### HTMLレポートの閲覧

```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

---

## カバレッジレポートの読み方

### テキストレポート

```text
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   72.34 |    65.12 |   68.45 |   72.34 |
 commands           |   85.71 |    75.00 |   83.33 |   85.71 |
  CreateTerminal.ts |   90.00 |    80.00 |   85.71 |   90.00 | 25-27
  DeleteTerminal.ts |   80.00 |    70.00 |   80.00 |   80.00 | 42,56
 services           |   68.24 |    60.15 |   65.89 |   68.24 |
  SessionManager.ts |   70.45 |    62.50 |   68.18 |   70.45 | 78-82,95-98
  StorageService.ts |   65.00 |    57.14 |   62.50 |   65.00 | 45-52,67
--------------------|---------|----------|---------|---------|-------------------
```

### レポートの見方

**色分け（HTMLレポート）**:

- 🟢 **緑 (85%+)**: 良好
- 🟡 **黄 (70-85%)**: 改善の余地あり
- 🔴 **赤 (<70%)**: 要改善

**Uncovered Line #s**: テストされていない行番号

- `25-27`: 25, 26, 27行目がカバーされていない
- `42,56`: 42行目と56行目がカバーされていない

### HTMLレポートの活用

HTMLレポートでは以下が確認できます：

1. **ファイルごとのカバレッジ**
   - 各ファイルをクリックしてコードを表示
   - カバーされていない行がハイライト表示

2. **実行回数**
   - 各行が何回実行されたかを確認
   - 実行回数が少ない箇所を特定

3. **分岐のカバレッジ**
   - if文の両方の分岐がテストされているか
   - switch文のすべてのケースがカバーされているか

---

## カバレッジの改善

### ステップ1: カバレッジの低いファイルを特定

```bash
# カバレッジレポートを生成
npm run test:coverage

# カバレッジの低いファイルをリストアップ
npx nyc report --reporter=json | \
  jq '.[] | select(.lines.pct < 70) | {file: .path, coverage: .lines.pct}' | \
  sort -k2 -n
```

### ステップ2: カバーされていないコードを確認

```typescript
// SessionManager.ts の例
export class SessionManager {
  async saveSession(): Promise<void> {
    try {
      const data = this.collectSessionData();
      await this.storage.save(data);
    } catch (error) {
      // この行がカバーされていない可能性
      this.logger.error('Failed to save session', error);
      throw error;
    }
  }
}
```

HTMLレポートで確認：

- `catch` ブロックが赤くハイライトされている = エラーケースのテストが不足

### ステップ3: テストを追加

```typescript
// SessionManager.test.ts
describe('SessionManager', () => {
  describe('saveSession', () => {
    it('should save session successfully', async () => {
      // 正常ケース
      await sessionManager.saveSession();
      expect(storage.save).to.have.been.called;
    });

    // 追加: エラーケースのテスト
    it('should handle save errors', async () => {
      // Given: ストレージが失敗する
      storage.save.rejects(new Error('Storage error'));

      // When/Then: エラーが発生する
      await expect(sessionManager.saveSession()).to.be.rejectedWith('Storage error');

      // And: エラーがログに記録される
      expect(logger.error).toHaveBeenCalledWith('Failed to save session', expect.any(Error));
    });
  });
});
```

### ステップ4: カバレッジを再測定

```bash
npm run test:coverage
```

新しいカバレッジレポートで改善を確認。

---

## 分岐カバレッジの改善

### 分岐の種類

```typescript
// if/else
if (condition) {
  // 分岐1
} else {
  // 分岐2
}

// switch
switch (value) {
  case 'a': // 分岐1
    break;
  case 'b': // 分岐2
    break;
  default: // 分岐3
}

// 三項演算子
const result = condition ? value1 : value2;

// 論理演算子
const value = input || defaultValue;
const isValid = input && input.length > 0;
```

### 分岐カバレッジの例

```typescript
// カバレッジが不完全な例
export function formatTerminalName(id: number, name?: string): string {
  // 分岐1: nameがある場合
  // 分岐2: nameがない場合
  return name ? `${id}: ${name}` : `Terminal ${id}`;
}

// テスト: 分岐1のみカバー
it('should format with name', () => {
  expect(formatTerminalName(1, 'test')).to.equal('1: test');
  // 分岐2がカバーされていない！
});
```

**改善**:

```typescript
// 両方の分岐をテスト
describe('formatTerminalName', () => {
  it('should format with name', () => {
    expect(formatTerminalName(1, 'test')).to.equal('1: test');
  });

  it('should format without name', () => {
    expect(formatTerminalName(1)).to.equal('Terminal 1');
  });
});
```

---

## カバレッジレポートの種類

### 1. text レポーター（CLI）

```bash
npx vitest run --coverage --coverage.reporter=text
```

**用途**: CI/CD、クイックチェック

**出力例**:

```text
======== Coverage summary ========
Statements   : 72.34% ( 456/630 )
Branches     : 65.12% ( 234/359 )
Functions    : 68.45% ( 123/180 )
Lines        : 72.34% ( 456/630 )
===================================
```

### 2. html レポーター

```bash
npx vitest run --coverage --coverage.reporter=html
open coverage/index.html
```

**用途**: 詳細な分析、開発中の確認

**特徴**:

- ファイルごとの詳細表示
- カバーされていないコードのハイライト
- 実行回数の表示

### 3. lcov レポーター

```bash
npx vitest run --coverage --coverage.reporter=lcov
```

**用途**: CI/CDツール連携（Codecov, Coverallsなど）

**出力**: `coverage/lcov.info`

### 4. json レポーター

```bash
npx vitest run --coverage --coverage.reporter=json
```

**用途**: プログラムでの解析、カスタムレポート生成

**出力**: `coverage/coverage-final.json`

### 5. cobertura レポーター

```bash
npx vitest run --coverage --coverage.reporter=cobertura
```

**用途**: Azure DevOps, Jenkins などのCI/CD

---

## CI/CDでのカバレッジチェック

### GitHub Actions での設定

```yaml
# .github/workflows/coverage.yml
name: Code Coverage

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Compile
        run: npm run compile

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage thresholds
        run: |
          npx nyc check-coverage \
            --lines 70 \
            --functions 65 \
            --branches 60

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### カバレッジバッジの追加

```markdown
<!-- README.md -->

# VS Code Sidebar Terminal

[![Coverage Status](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

---

## 除外すべきコード

### カバレッジ測定から除外するべきもの

1. **テストコード自体**

   ```json
   {
     "exclude": ["out/src/test/**", "out/src/**/*.test.js"]
   }
   ```

2. **型定義ファイル**

   ```json
   {
     "exclude": ["out/src/**/*.d.ts"]
   }
   ```

3. **設定ファイル**
   ```json
   {
     "exclude": ["out/src/config/**"]
   }
   ```

### istanbul ignore コメント

特定のコードブロックを除外：

```typescript
// 全関数を除外
/* istanbul ignore next */
function debugOnlyFunction() {
  console.log('Debug info');
}

// if文を除外
if (process.env.NODE_ENV === 'development') {
  /* istanbul ignore next */
  console.log('Development mode');
}

// elseブロックを除外
if (condition) {
  normalCode();
} else /* istanbul ignore next */ {
  unreachableCode();
}
```

**注意**: `istanbul ignore` は最小限に使用してください。

---

## トラブルシューティング

### カバレッジが0%と表示される

**原因**: ソースマップが正しく設定されていない

**解決方法**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSourceMap": false,
    "inlineSources": true
  }
}
```

```json
// .nycrc.json
{
  "require": ["source-map-support/register"]
}
```

### カバレッジレポートが生成されない

**原因**: テストファイルとソースファイルのパスが間違っている

**解決方法**:

```bash
# ファイルの存在確認
ls -la out/src/**/*.js
ls -la out/test/**/*.test.js

# .nycrc.json のパスを確認
cat .nycrc.json
```

### カバレッジチェックが失敗する

**症状**:

```text
ERROR: Coverage for lines (68.24%) does not meet threshold (70%)
```

**解決方法**:

1. カバレッジを改善する（推奨）
2. 一時的に閾値を下げる（非推奨）

```json
// .nycrc.json - 一時的な対応
{
  "lines": 65, // 70 から下げる
  "check-coverage": true
}
```

---

## ベストプラクティス

### ✅ Do

- カバレッジ測定を自動化（CI/CD）
- HTMLレポートで詳細を確認
- 重要なコードパスは100%を目指す
- カバレッジの推移を追跡
- PRごとにカバレッジをチェック

### ❌ Don't

- 100%カバレッジを盲目的に目指さない
- テストの質を犠牲にしない
- `istanbul ignore` を乱用しない
- カバレッジのためだけのテストを書かない
- カバレッジレポートをコミットしない

---

## カバレッジ改善の優先順位

### Phase 1: クリティカルパス（優先度: 高）

- ターミナル作成・削除ロジック
- セッション保存・復元
- メッセージハンドリング

**目標**: 95%+

### Phase 2: コアロジック（優先度: 中）

- バッファ管理
- 設定管理
- イベント処理

**目標**: 85%+

### Phase 3: ユーティリティ（優先度: 低）

- ヘルパー関数
- フォーマッター
- 定数定義

**目標**: 70%+

---

## package.json スクリプト例

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:html": "vitest run --coverage --coverage.reporter=html && open coverage/index.html",
    "test:coverage:text": "vitest run --coverage --coverage.reporter=text",
    "coverage:clean": "rm -rf coverage"
  }
}
```

---

## 参考リンク

- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Codecov](https://about.codecov.io/)
- [Coveralls](https://coveralls.io/)
- [改善提案書](../../../test-environment-improvement-proposal.md)

---

**最終更新**: 2025-11-08
