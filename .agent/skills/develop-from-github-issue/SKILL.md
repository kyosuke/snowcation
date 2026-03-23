---
name: develop-from-github-issue
description: "GitHub Issue URLを受け取り、内容確認、要件の明確化、ブランチ作成提案、実装、Issueコメントでの進捗記録、PR作成までを一貫実行する。Issueベースで開発を進める依頼（例: 「Issue対応して」「このIssueを実装して」）のときに使う。"
---

# Develop From GitHub Issue

GitHub Issueを単一の真実の情報源（SSOT）として扱い、Issue URLから実装とPR作成まで進める。

## 実行手順

1. Issue URLを確認する。

- URLが未提供ならユーザーに確認する。
- 最初にIssue URLが現在のプロジェクトのGitHubリポジトリ配下か確認する。
- 別リポジトリのIssueなら、その旨をユーザーに明確に指摘して作業を終了する。
- `gh issue view <issue-url>` でIssue本文・受け入れ条件・関連情報を読む。
- 要件が曖昧なら、実装前に必ず質問して合意を取る。

2. ブランチ案を提案して承認を得る。

- ブランチ名は `<topic>/#<issue-number>_<branch-name>` を基本に提案する。
- 例: `fix/#1201_resolve-css-bug`, `feat/#123_add-login-page`
- ユーザー承認後に `git checkout -b <branch-name>` を実行する。

3. Issueを更新しながら実装を進める。

- 計画変更、技術制約、要件変更があれば `gh issue comment <issue-number> --body "..."` で記録する。
- 重要な判断やマイルストーン到達時にもIssueコメントを残す。
- 実装、テスト、修正を反復する。
- コミットメッセージにIssue番号を含める（例: `fix: resolve css bug #123`）。
- 必要に応じて定期的にpushする。

4. PRを作成する。

- 実装と検証完了後に `gh pr create` を実行する。
- PR本文に `Fixes #<issue-number>` を必ず含める。

## ガイドライン

- 要件が不明確なまま実装を開始しない。
- GitHub操作は `gh` コマンドを優先する。
- Issueの内容とIssueコメントを最新状態に保つ。
- コミットとPRをIssue番号に紐付ける。
- このSkillで作業するときは、ユーザーの明確な承認を得るまでコード変更を始めない。
