---
name: web-research
description: Gemini CLI を使ってWebを調査し、結果のサマリーを返す。外部の情報が必要なとき（スキー場の料金・アクセス・施設情報、最新ニュースなど）に通常のWeb検索より優先して使う。
allowed-tools: Bash(gemini *)
---

# Web Research via Gemini CLI

Gemini CLI を使って Web 調査を行い、その結果を活用してください。

## 手順

1. 以下のコマンドを実行して Gemini CLI に調査を依頼する:

```bash
gemini -p "以下について簡潔に調査してまとめてください。箇条書きや表で要点を整理し、冗長な説明は省いてください。出典URLがあれば末尾にまとめてください。

$ARGUMENTS" -o json --approval-mode plan --sandbox 2>&1 | jq -r '.response // "ERROR: " + (.error // "応答を取得できませんでした")'
```

2. Gemini からの応答を確認し、ユーザーの質問やタスクに役立つ形で活用する。

## 実行時の注意

- **タイムアウト**: Gemini の応答には 30〜120 秒かかることがある。Bash の timeout を 120000 に設定すること
- **エラー時**: jq が ERROR を返した場合はユーザーにその旨を伝え、必要に応じてリトライする
- **出力の扱い**: Gemini の出力はそのままコンテキストに載るため、ユーザーへの報告は重複を避けて簡潔にまとめる
- **信頼性**: Gemini の出力はあくまで参考情報。正確性が重要な場合は公式サイト等で裏付けを取る
