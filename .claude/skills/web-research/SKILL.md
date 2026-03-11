---
name: web-research
description: Gemini CLI を使ってWebを調査し、結果のサマリーを返す。Web検索やURLの内容確認が必要なときに使う。
disable-model-invocation: true
allowed-tools: Bash(gemini *)
---

# Web Research via Gemini CLI

Gemini CLI を使って Web 調査を行い、その結果を活用してください。

## 手順

1. 以下のコマンドを実行して Gemini CLI に調査を依頼する:

```bash
gemini -p "$ARGUMENTS" -o json --approval-mode plan --sandbox 2>/dev/null | jq -r '.response'
```

2. Gemini からの応答を確認し、ユーザーの質問やタスクに役立つ形で要約・活用する。

## オプション説明

- `-p`: 非インタラクティブ (ヘッドレス) モードで実行
- `-o json`: JSON 形式で出力 (パース可能)
- `--approval-mode plan`: 読み取り専用モード (ファイル変更なし)
- `--sandbox`: サンドボックスで実行 (安全性確保)

## 注意事項

- Gemini の応答が空やエラーの場合は、その旨をユーザーに伝える
- Gemini の出力はあくまで参考情報として扱い、重要な内容は裏付けを取る
