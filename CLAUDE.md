# プロジェクト概要

Snowcation — ゲレンデに泊まるスノーリゾートの個人メモ。Astro で静的に生成し、Cloudflare Workers の静的アセット配信でホストしている。

## 技術スタック

- **フレームワーク**: Astro 7（MDX）。コンテンツコレクション `resorts`
- **ホスティング**: Cloudflare Workers Static Assets（wrangler でデプロイ。Worker スクリプトは持たない）
- **アイコン**: unplugin-icons（Material Symbols Light、GitHub だけ Simple Icons）
- **デザイン**: `DESIGN.md`（決定事項）と `src/styles/frost.css`（トークンと共通クラス）
- **リント**: knip（未使用コード検出）、oxfmt（整形）

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — プロダクションビルド
- `npm run preview` — ビルド後のローカルプレビュー (wrangler dev)
- `npm run deploy` — Cloudflare へデプロイ
- `npm run knip` — 未使用ファイル・エクスポート・依存の検出
- `npm run format` — oxfmt で整形

## プロジェクト構成

- `src/content/resorts/*.mdx` — リゾートごとの記事。frontmatter に基本情報・営業期間、本文にリフトとホテルの部品
- `src/content.config.ts` — frontmatter のスキーマ
- `src/pages/` — トップ (`index.astro`) と中ページ (`resorts/[slug].astro`)
- `src/components/` — 部品。中ページの本文で使うのは LiftList / HotelBand / Card / Stats / Note / Dl / OnsenInfo / AccessCard / AccessRoute / RouteExamples
- `src/lib/season.ts` — 営業状況チップとシーズン前判定（ビルド時の JST 日付で決まる）
- `src/assets/` — イラスト・ロゴ・フッター（WebP）
- `public/` — 静的ファイル

## ルール

- ユーザーへの応答は日本語で行う
- コミットメッセージは日本語で記述する
- コミットメッセージは Conventional Commits 形式 (`feat:`, `fix:`, `docs:`, `chore:` など)
- 新規作業は新しいブランチを作って行う
- PR の説明には概要・変更内容・テスト方法・関連 Issue を含める
- リゾートは北→南の順に並べる。frontmatter の `order` で決まる（青森県 → 秋田県 → 宮城県 → 福島県）
- 営業期間は frontmatter の `seasons` に書く。先頭が最新シーズンで、クローズは `closures` に理由つきで足す（見せ方は DESIGN.md）
- リゾート画像の制作・修正は /codex-director で Codex に任せ、`$ski-resort-paper-cut` を使うよう依頼する
