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

/** JST の今日を YYYY-MM-DD で返す。SSR の初期表示とブラウザの日付判定に使う */
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());

export const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

export const isExpired = (until: string | undefined, t = today()) => !!until && until < t;

export const todayPosition = (axisStart: number, axisEnd: number, t = today()) => {
  const time = Date.parse(`${t}T06:00:00+09:00`);
  return time >= axisStart && time < axisEnd
    ? ((time - axisStart) / (axisEnd - axisStart)) * 100
    : null;
};

const nextDay = (iso: string) => new Date(Date.parse(iso) + 86400000).toISOString().slice(0, 10);

/** その日にどこかのエリアが営業しているか。期間内でもクローズに入る日は休み */
const isOpen = (season: Season, t: string) =>
  season.areas.some(
    (a) =>
      a.periods.some((p) => p.start <= t && t <= p.end) &&
      !a.closures.some((c) => c.start <= t && t <= c.end),
  );

/** 先頭シーズンの予定とクローズから営業状況のチップを決める */
export function status(seasons: Season[], t = today()) {
  const season = seasons[0];
  const periods = season?.areas.flatMap((a) => a.periods) ?? [];
  const first = periods.map((p) => p.start).sort()[0];
  const last = periods
    .map((p) => p.end)
    .sort()
    .at(-1);
  // 実際に営業する最初と最後の日。オープン延期や早期終了の分だけ予定より狭まる
  const days: string[] = [];
  for (let d = first; d && last && d <= last; d = nextDay(d)) if (isOpen(season, d)) days.push(d);
  const [open, close] = [days[0], days.at(-1)];
  if (!open || !close) return { label: "シーズン前", tone: "off" };
  if (t < open) return { label: `${md(open)} オープン予定`, tone: "pre" };
  if (t <= close)
    return isOpen(season, t)
      ? { label: "営業中", tone: "open" }
      : { label: "休業中", tone: "closed" };
  // 終了後。夏以降は次シーズン未発表の扱い
  return Number(t.slice(5, 7)) >= 7
    ? { label: "シーズン前", tone: "off" }
    : { label: "シーズン終了", tone: "closed" };
}

/** ビルド後に日付が変わってもずれないよう、data-seasons を持つチップをブラウザの日付で描き直す */
export function refreshStatus() {
  for (const el of document.querySelectorAll<HTMLElement>(".status[data-seasons]")) {
    const s = status(JSON.parse(el.dataset.seasons!));
    el.textContent = s.label;
    el.dataset.tone = s.tone;
  }
}

/** ビルド後の日付でタイムラインの今日線を描き直す */
export function refreshTimelineToday() {
  for (const el of document.querySelectorAll<HTMLElement>(".timeline[data-axis-start]")) {
    const line = el.querySelector<HTMLElement>(".today");
    if (!line) continue;
    const position = todayPosition(Number(el.dataset.axisStart), Number(el.dataset.axisEnd));
    line.hidden = position === null;
    if (position !== null) line.style.left = `${position}%`;
  }
}

/** ビルド後の日付で前シーズンのカードを開閉する */
export function refreshPastSeasons() {
  for (const el of document.querySelectorAll<HTMLElement>(".season[data-seasons]")) {
    const open = isPreSeason(JSON.parse(el.dataset.seasons!));
    for (const details of el.querySelectorAll<HTMLDetailsElement>("details[data-past-season]"))
      details.open = open;
  }
}

/** シーズン開始前かどうか。前シーズンのカードを開いた状態で出すかの判断に使う */
export const isPreSeason = (seasons: Season[], t = today()) => {
  const first = seasons[0]?.areas
    .flatMap((a) => a.periods)
    .map((p) => p.start)
    .sort()[0];
  return !first || t < first;
};
