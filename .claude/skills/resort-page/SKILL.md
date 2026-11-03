---
name: resort-page
description: Snowcation に新しいリゾートのページを足す。施設情報と配置データを先に集め、それを使って MDX と画像を作る。「〇〇スキー場のページを作って」のような依頼で使う。
---

# リゾートのページを作る

先にページと画像の両方に要る情報を集め、それを使って MDX を書き、画像を作る。画像の生成時に配置が分かっていないと、リフトがありえない場所を通ったり途中で途切れたりする。

調査と画像制作は /codex-director で Codex に任せる。値の裏取りと、確かめられない値の扱いは CLAUDE.md のルールに従う。

## 1. 施設情報を集める

Codex（読み取り専用、ネットワーク開放）に、次を出典 URL つきで集めさせる。書く先の形は既存の MDX（`src/content/resorts/*.mdx`）とスキーマ（`src/content.config.ts`）を読ませて把握させる。

- 基本: 正式名称、所在地、エリア名、公式 URL、リフト運行状況ページ、yukiyama の URL
- 数値: 最長滑走距離、最大斜度、初中上級の比率、コース数、特徴（公式の言い方）
- 営業期間: 今シーズンの予定、前シーズンの実績（クローズや延期は日付と理由）
- リフト: 名称、乗車人数、長さ、高速・フード・足置き
- リフト券: 窓口料金、早割・前売り（価格・期限・購入先）、宿泊者割引
- ホテル: ゲレンデとの位置関係、チェックイン/アウト、WiFi、食事、温泉（浴場ごとの時間・泉質・設備）、宿泊者特典、荷物の送り先
- アクセス: 東京からの公共交通、送迎バスの時刻と予約条件、最短の往路と復路

## 2. 配置データを集める

標高・ゲレンデの向き・リフトの配置は公式に無いことが多い。OSM と地理院の標高から出す。

```bash
node .agents/skills/ski-resort-paper-cut/scripts/layout.mjs --slug <slug> --bbox <西,南,東,北> --hotel way:<OSMのID> [--exclude <way ID,...>]
```

- 施設の座標は Nominatim（User-Agent を付ける）で引く。ホテルは `tourism=hotel` の建物の way ID を使う。名前の近い駐車場や別の宿と取り違えやすい。
- 隣のスキー場のリフトやコースは `--exclude` で外す。`map.png` で位置を見て判断する。
- `map.png` と `guide.png` を開き、リフトの本数と位置、ホテルの位置を確かめる。視点から見えないリフトやコースは画像で省略してよい（MDX には全部載せる）。

出力の `output/resort-research/<slug>/layout.json` から、frontmatter の `facts.top`・`facts.base`（リフトの最高・最低標高。yukiyama などの公称値と比べる）と `facts.aspect`（下り方位の集計）を埋める。リフトの名前と本数も照合する。

## 3. MDX を書く

- `src/content/resorts/<slug>.mdx` を、近い条件の既存ページ（宿がゲレンデ直結か、送迎か）を手本に書く。部品の使い方と見せ方は `DESIGN.md` に従う。
- `order` は北→南。差し込む位置より後ろのリゾートの `order` を1つずつずらす。県が増えたら CLAUDE.md の県の並びも直す。
- `aspect`、`ratio`、リフトの装備などは省略できる。確かめられなければ書かない。

## 4. 画像を作る

/codex-director で Codex に `$ski-resort-paper-cut` を使わせ、`output/resort-research/<slug>/` の下絵を配置の参照として渡すよう依頼する。採用画像は `src/assets/<slug>.webp`（1536×1024）に置かせる。

検収では、採用画像と `guide.png` を並べて開き、リフトの本数・経路・終点とホテルの位置が対応するかを見る。

## 5. 確かめる

- `npm run build`、`npx oxfmt --check`、`npm run knip`
- `dist/resorts/<slug>/index.html` とトップの並び順
