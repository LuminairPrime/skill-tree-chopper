# テストドキュメント

VS Code Sidebar Terminal拡張機能のテスト環境に関する包括的なドキュメントです。

## 📚 目次

### 🚀 はじめに

- **[Getting Started](./getting-started.md)** - テスト環境のセットアップから最初のテストまで
- **[Troubleshooting](./troubleshooting.md)** - よくある問題と解決法

### 📖 ガイド

- **[Best Practices](./best-practices.md)** - テスト作成のベストプラクティス

### 🎯 テストパターン

- **[Unit Testing Patterns](./patterns/unit-testing.md)** - ユニットテストのパターン集
- **[Integration Testing Patterns](./patterns/integration-testing.md)** - 統合テストのパターン
- **[E2E Testing Patterns](./patterns/e2e-testing.md)** - E2Eテストのパターン
- **[Performance Testing Patterns](./patterns/performance-testing.md)** - パフォーマンステスト

### 🛠 ツールガイド

- **[Vitest Guide](./tools/vitest-guide.md)** - Vitestテストランナーの詳細
- **[Coverage Guide](./tools/coverage-guide.md)** - カバレッジ測定と改善

---

## 🎯 クイックリンク

### 新規開発者向け

1. [環境セットアップ](./getting-started.md#セットアップ)
2. [最初のテストを書く](./getting-started.md#最初のテストを書く)
3. [テストの実行](./getting-started.md#テストの実行)

### 問題解決

- [テスト終了コードの問題](./troubleshooting.md#テスト終了コードの問題)
- [テストタイムアウト](./troubleshooting.md#テストタイムアウト)
- [モック関連の問題](./troubleshooting.md#モック関連の問題)

### テスト作成

- [ユニットテストパターン](./patterns/unit-testing.md)
- [非同期テスト](./best-practices.md#非同期テスト)
- [モックの作成](./best-practices.md#モックとスタブ)

---

## 📊 テスト環境の概要

### テストフレームワーク

- **ユニット/統合テスト**: Vitest (テストランナー/アサーション/モック)
- **E2Eテスト**: Mocha (@vscode/test-electron が要求)
- **カバレッジ**: v8 (Vitest built-in)

### テストカテゴリ

#### ユニットテスト

- **場所**: `src/test/vitest/unit/`
- **目的**: 個別のコンポーネント・関数のテスト
- **実行**: `npm run test:unit`

#### 統合テスト

- **場所**: `src/test/integration/`
- **目的**: コンポーネント間の連携テスト
- **実行**: `npm run test:integration`

#### パフォーマンステスト

- **場所**: `src/test/performance/`
- **目的**: メモリ使用量、実行速度の検証
- **実行**: `npm run test:performance`

#### E2Eテスト

- **場所**: `src/test/suite/`
- **目的**: エンドツーエンドのユーザーシナリオ
- **実行**: `npm run test:e2e`

---

## 🎯 テスト品質目標

### 現在の状態

- **テスト総数**: 275+ tests
- **成功率**: 93%
- **カバレッジ**: 70%

### 目標

- **テスト成功率**: 98%
- **カバレッジ**: 85%
- **E2Eカバレッジ**: 40%

詳細は [Test Environment Improvement Proposal](../../test-environment-improvement-proposal.md) を参照。

---

## 🚀 よく使うコマンド

```bash
# すべてのユニットテストを実行
npm run test:unit

# 並列実行（高速）
npm run test:unit:parallel

# カバレッジ付きで実行
npm run test:coverage

# 特定のテストファイルのみ実行
npx vitest run src/test/vitest/unit/specific-file.test.ts

# ウォッチモード（変更を自動検出）
npm run test:watch
```

---

## 📝 ドキュメント貢献

### ドキュメントの改善

ドキュメントの改善提案は歓迎します：

1. 誤字・脱字の修正
2. サンプルコードの追加
3. 新しいパターンの追加
4. 説明の明確化

### プルリクエスト

ドキュメント変更のPRを作成する際は：

- `docs:` プレフィックスを使用
- 変更内容を簡潔に説明
- サンプルコードは動作確認済みのものを

---

## 🔗 関連リソース

### プロジェクト内

- [TDD Implementation Strategy](../../src/test/TDD-Implementation-Strategy.md) - TDD実践ガイド
- [Test Environment Improvement Proposal](../../test-environment-improvement-proposal.md) - 改善提案
- [CLAUDE.md](../../src/test/CLAUDE.md) - TDD効率化ガイド

### 外部リンク

- [Vitest Documentation](https://vitest.dev/) - Vitest公式ドキュメント
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension) - VS Code拡張機能テスト

---

## 💬 質問・フィードバック

質問やフィードバックは以下で受け付けています：

- [GitHub Issues](https://github.com/s-hiraoku/vscode-sidebar-terminal/issues)
- [GitHub Discussions](https://github.com/s-hiraoku/vscode-sidebar-terminal/discussions)

---

**最終更新**: 2025-11-08
