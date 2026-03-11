---
name: issue-analyze
description: GitHub Issue を分析し、実装提案を生成する。Issue 番号や URL を渡すと、Copilot CLI (Opus 4.6) がコードベースと Issue の内容を踏まえて実装方針を提案する。
allowed-tools: Bash(copilot *)
---

# Issue 分析・実装提案 via Copilot CLI

GitHub Copilot CLI を使って Issue を分析し、実装提案を生成する。

## 手順

1. 以下のコマンドを実行して Copilot CLI に分析を依頼する:

```bash
copilot -p "以下の GitHub Issue を分析し、このコードベースでの実装方針を提案してください。
- 変更が必要なファイルと箇所
- 実装手順（ステップバイステップ）
- 注意点やリスク

Issue: $ARGUMENTS" \
  --model claude-opus-4.6 \
  --no-ask-user \
  --enable-all-github-mcp-tools \
  --deny-tool 'write' --deny-tool 'edit' --deny-tool 'shell' \
  -s 2>&1
```

2. Copilot CLI からの応答を確認し、ユーザーに実装提案として提示する。

## 実行時の注意

- **タイムアウト**: 分析には時間がかかることがある。Bash の timeout を 300000 に設定すること
- **Issue の指定**: `#123`、`123`、または Issue URL のいずれでも受け付ける
- **読み取り専用**: `--deny-tool` で書き込み系ツール (write, edit, shell) を除外し、コードベースを変更しない
- **出力の扱い**: 提案はあくまで参考。採用するかはユーザーの判断に委ねる
