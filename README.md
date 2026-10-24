# Snowcation

ゲレンデに泊まるスノーリゾートの個人メモ。Astro で静的に生成し、Cloudflare Workers の静的アセット配信でホストしている。

## コマンド

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm install`     | 依存をインストール                       |
| `npm run dev`     | 開発サーバー (`localhost:4321`)          |
| `npm run build`   | `./dist/` へビルド                       |
| `npm run preview` | ビルドして wrangler でローカルプレビュー |
| `npm run deploy`  | Cloudflare へデプロイ                    |
| `npm run knip`    | 未使用ファイル・エクスポート・依存の検出 |
| `npm run format`  | oxfmt で整形                             |

## 構成

- `src/content/resorts/*.mdx` — リゾートごとの記事
- `src/components/` — 部品
- `src/styles/frost.css` と `DESIGN.md` — デザインシステム Frost
