---
name: code-review
description: 現在のブランチの変更をコードレビューする。Codex CLI の review コマンドで diff を分析し、バグ・セキュリティ・改善点を指摘する。
allowed-tools: Bash(codex *)
---

# コードレビュー via Codex CLI

Codex CLI の `review` コマンドを使ってコードレビューを実行する。

## 手順

1. 以下のコマンドを実行してレビューを依頼する:

引数なしの場合（main ブランチとの差分をレビュー）:
```bash
codex review --base main "日本語でレビューしてください。バグ、セキュリティ、パフォーマンス、可読性の観点でコメントしてください。"
```

引数ありの場合（カスタム指示）:
```bash
codex review --base main "$ARGUMENTS"
```

2. Codex CLI からのレビュー結果を確認し、ユーザーに要約して提示する。

## 実行時の注意

- **タイムアウト**: レビューには時間がかかることがある。Bash の timeout を 300000 に設定すること
- **ベースブランチ**: デフォルトは `main`。引数で `--base develop` のように指定があれば調整する
- **出力の扱い**: レビュー結果はそのままコンテキストに載るため、ユーザーへの報告は重要な指摘を優先して簡潔にまとめる
