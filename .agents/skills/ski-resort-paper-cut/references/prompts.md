# 生成・編集プロンプト

未使用の項目を削り、角括弧を具体的な観察内容で置き換える。未確認の事実を埋め草で足さない。日本語の固有名詞はそのまま保持してよい。英語を使うこと自体を品質の保証とは考えない。

## 調査メモ

```text
対象: [スキー場名／ホテル名]
確認日: [YYYY-MM-DD]
用途・比率: [配置先と縦横比]
写真・コース図で確認したこと:
- [具体的な形・位置関係] — [資料のページURL・写真の場所]
森: [針葉樹と広葉樹の割合、標高による違い] — [写真の場所・撮影時期]
主役にする特徴: [2〜4個]
構図: [視点、主役の位置、前景・中景・遠景]
再構成: [省略する要素や縮尺の調整]
未確認: [未確認の箇所と、描かない／控えめにする判断]
画像入力: [各ファイルと、その役割]
```

## 新規生成

```text
Use case: stylized-concept
Asset type: A single landscape illustration for a Japanese ski-resort website.
Primary request: Create a recognizable winter impression of [RESORT NAME], with [VERIFIED HOTEL OR BASE FACILITY, OR OMIT IF NOT APPLICABLE].

Input images:
[Image 1: paper-cut style reference. Use its material, restrained palette, soft lighting and level of simplification; do not copy its resort-specific building, transport or lake.]
[Image 2: verified hotel exterior. Use its building massing, roof silhouette and principal colors.]
[Image 3: layout guide from scripts/layout.mjs (guide.png). Follow its viewpoint and the positions, paths, start and end terminals of every lift line and the hotel. It is a schematic; do not reproduce its labels, colored route strokes, hotel box color, white trail overlays or blank background.]

Defining features:
- [VERIFIED TERRAIN SILHOUETTE AND SLOPE CHARACTER]
- [VERIFIED FOREST: conifer/broadleaf mix and how it changes with elevation, e.g. "lower slopes: leafless birch and beech with white trunks and fine bare branches; upper slopes: rime-covered firs (snow monsters)"]
- [VERIFIED HOTEL MASSING, ROOF SHAPE AND COLORS]
- [VERIFIED DISTINCTIVE LIFT OR GONDOLA, IF INCLUDED]
- [VERIFIED LAKE OR OTHER LANDMARK AND VIEW DIRECTION, IF INCLUDED]

Style and materials: Dreamy, layered paper-cut 3D illustration. Tactile matte paper with visible fibers, carefully cut edges, convincing thickness and soft shadows between layers. Treat the snow, mountains, trees and building as parts of the same crafted paper scene.

Depth and detail: Use a few clear, broad forms for the overall composition. Keep recognizable individual trees and overlapping tree clusters in the foreground and middle distance. Use the tree species from the defining features, not from the style reference. Simplify distant mountains into broad layered paper silhouettes; flat paper planes are appropriate there. Reduce detail with distance. Preserve the forest's presence without filling every area with equally dense detail.

Composition: [SPECIFIC VIEWPOINT AND ARRANGEMENT, CONSISTENT WITH THE RESEARCH]. Make the selected features legible while keeping the scene calm and spacious. [ASPECT RATIO]. Maintain believable spatial relationships; this is an evocative illustration rather than an exact piste map.

Lighting and palette: Soft late-day light, snowy ivory and pale blue, muted blue shadows, a restrained peach-apricot glow and warm amber windows. Retain the verified distinctive colors of the hotel and transport. Keep the sun and clouds simple if they help the composition.

Transport structure: [ACTUAL SELECTED TYPE AND ROUTE]. [FOR EACH LIFT VISIBLE IN THE GUIDE: where it starts and ends relative to the others, e.g. "two short parallel lifts from the shared lower base", "a diagonal lift from the mid slope to the upper-left terminal".] [FOR NEARBY TERMINALS OF DIFFERENT LIFTS, FROM layout.json: e.g. "The upper station of the second lift and the lower station of the third lift are two separate stations about 85 m apart."] Draw a station at both ends of every visible lift, unless terrain or trees naturally hide that end. Station form: [FROM PHOTOS OR THE TYPICAL FORM FOR THE LIFT TYPE, e.g. "pair lift: an open steel bullwheel platform on pillars with a small attendant hut beside it, no roofed building" / "gondola: the researched station building, its roof shape and colors"]. Never join the top of one lift to the bottom of another with a shared station or a continuous cable. Lifts are supporting elements, not the subject: keep lifts, stations and chairs at the scale implied by the guide's perspective, small and unobtrusive in the distance, and never enlarge a photographed station beyond that scale. Do not invent lifts that are not in the guide, and do not route any lift over a ridge to show parts the guide hides. Cables continue coherently through supports to the selected terminal, a natural occlusion or the frame edge. Respect the selected terminal position; the line need not reach the mountain summit. [FOR A DISTINCTIVE CABIN: make one nearer cabin large enough for its silhouette and color blocks to be recognizable.]

Text: None.
Constraints: No people, skiers, tiny human silhouettes, logos or watermark. Add only the researched or explicitly requested scene elements. Do not add a decorative river or bridge. Preserve a documented lake or other defining water feature when specified. Keep the paper construction visible rather than turning the image into a photograph, glossy plastic model or flat vector graphic.
```

人・文字・川などの条件を変更する明示的な依頼があれば、その依頼に合わせて雛形を変える。利用可能なツールに存在しないサイズ引数・モデル名・マスク指定を作らない。

## 部分修正

```text
Use case: precise-object-edit
Input images:
- Image 1: the current image to edit.
- [Image 2: the earlier image that defines the original position of the specified element.]

Change only: [ONE REQUESTED REGION OR A COHERENT GROUP OF REQUESTED CHANGES].
Location and reference: [UNAMBIGUOUS VISUAL LANDMARKS IN THE INPUT IMAGE; USE COORDINATES ONLY IF ACTUALLY MEASURED].
Desired result: [WHAT THE CHANGED ELEMENT SHOULD LOOK LIKE AND WHERE IT SHOULD END].

Preserve: The existing viewpoint, crop, aspect ratio, terrain outside the edit, hotel architecture and position, forest placement and density, colors, lighting, paper grain, cut edges and layer shadows. [SPECIFIC PREVIOUSLY APPROVED ELEMENTS].

Keep the result consistent with the surrounding paper construction. Keep all unrequested regions visually unchanged. Do not introduce people, text or unrelated scenery.
```

### リフトの上側だけを戻す例

対象画像と「元の上端」が分かる画像を実際に確認した場合に使う。下記の位置説明は画像に合わせて具体化する。

```text
Restore only the upper end of the foreground chairlift to the terminal shown in Image 2, at [VISIBLE LANDMARK]. Keep the repaired lower section from Image 1 intact. End the upper cable naturally at that terminal. Preserve the separate background lift if present. Keep the hotel, forest, snow layers and lighting unchanged.
```
