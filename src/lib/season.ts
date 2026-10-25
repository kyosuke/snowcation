export type Kind = "pre" | "on" | "spring";

export interface Period {
  name: string;
  kind: Kind;
  start: string;
  end: string;
}

export interface Season {
  label: string;
  areas: {
    name?: string;
    periods: Period[];
    closures: { start: string; end: string; reason?: string }[];
  }[];
}

/** JST の今日を YYYY-MM-DD で返す。ビルド時に評価されるので、日付が変わったらデプロイし直す */
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());

export const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

/** 先頭シーズンの予定から営業状況のチップを決める */
export function status(seasons: Season[], t = today()) {
  const periods = seasons[0]?.areas.flatMap((a) => a.periods) ?? [];
  const first = periods.map((p) => p.start).sort()[0];
  const last = periods
    .map((p) => p.end)
    .sort()
    .at(-1);
  if (!first || !last) return { label: "シーズン前", tone: "off" };
  if (t < first) return { label: `${md(first)} オープン予定`, tone: "pre" };
  if (t <= last) return { label: "営業中", tone: "open" };
  // 終了後。夏以降は次シーズン未発表の扱い
  return Number(t.slice(5, 7)) >= 7
    ? { label: "シーズン前", tone: "off" }
    : { label: "シーズン終了", tone: "closed" };
}

/** シーズン開始前かどうか。前シーズンのカードを開いた状態で出すかの判断に使う */
export const isPreSeason = (seasons: Season[], t = today()) => {
  const first = seasons[0]?.areas
    .flatMap((a) => a.periods)
    .map((p) => p.start)
    .sort()[0];
  return !first || t < first;
};
