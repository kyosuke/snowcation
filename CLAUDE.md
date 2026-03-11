# プロジェクト概要

Snowcation — スキーリゾート情報サイト。Astro + Starlight で構築し、Cloudflare にデプロイしている。

## 技術スタック

- **フレームワーク**: Astro (Starlight テーマ)
- **ホスティング**: Cloudflare (wrangler でデプロイ)
- **ダイアグラム**: astro-d2
- **アイコン**: unplugin-icons (Material Symbols Light)
- **リント**: knip (未使用コード検出)

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npm run preview` — ビルド後のローカルプレビュー (wrangler dev)
- `npm run deploy` — Cloudflare へデプロイ
- `npm run knip` — 未使用ファイル・エクスポート・依存の検出

## プロジェクト構成

- `src/content/` — コンテンツ (Starlight のドキュメント)
- `src/components/` — Astro コンポーネント
- `src/assets/` — 画像などのアセット
- `public/` — 静的ファイル

## ルール

- ユーザーへの応答は日本語で行う
- コミットメッセージは日本語で記述する
- コミットメッセージは Conventional Commits 形式 (`feat:`, `fix:`, `docs:`, `chore:` など)
- 新規作業は新しいブランチを作って行う
- PR の説明には概要・変更内容・テスト方法・関連 Issue を含める
