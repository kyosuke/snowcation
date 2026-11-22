import assert from "node:assert/strict";
import { isExpired, isPreSeason, status, todayPosition, type Season } from "./season.ts";

const grandecoSeasonWithDelayedOpening: Season[] = [
  {
    label: "26-27",
    areas: [
      {
        periods: [
          { name: "プレ", kind: "pre", start: "2026-11-21", end: "2026-12-11" },
          { name: "全面", kind: "on", start: "2026-12-12", end: "2027-03-22" },
          { name: "春", kind: "spring", start: "2027-03-23", end: "2027-04-11" },
        ],
        closures: [
          { start: "2026-11-21", end: "2026-11-23" },
          { start: "2027-01-10", end: "2027-01-10" },
          { start: "2027-04-05", end: "2027-04-11" },
        ],
      },
    ],
  },
];
const label = (t: string) => status(grandecoSeasonWithDelayedOpening, t).label;

assert.equal(label("2026-11-20"), "11/24 オープン予定");
assert.equal(label("2026-11-22"), "11/24 オープン予定");
assert.equal(label("2026-11-24"), "営業中");
assert.equal(label("2027-01-10"), "休業中");
assert.equal(label("2027-04-04"), "営業中");
assert.equal(label("2027-04-05"), "シーズン終了");
assert.equal(label("2027-06-30"), "シーズン終了");
assert.equal(label("2027-07-01"), "シーズン前");
assert.equal(label("2027-08-01"), "シーズン前");
assert.equal(status([], "2026-11-22").label, "シーズン前");

const unknownReopenDate: Season[] = [
  {
    label: "26-27",
    areas: [
      {
        periods: [{ name: "プレ", kind: "pre", start: "2026-11-21", end: "2027-04-11" }],
        closures: [{ start: "2026-11-21", reason: "オープン延期" }],
      },
    ],
  },
];
assert.equal(status(unknownReopenDate, "2026-11-20").label, "11/21 オープン予定");
assert.equal(status(unknownReopenDate, "2026-11-21").label, "オープン延期・開始日未定");
assert.equal(status(unknownReopenDate, "2026-11-24").label, "オープン延期・開始日未定");
assert.equal(status(unknownReopenDate, "2027-04-12").label, "オープン延期・開始日未定");
assert.equal(isPreSeason(grandecoSeasonWithDelayedOpening, "2026-11-20"), true);
assert.equal(isPreSeason(grandecoSeasonWithDelayedOpening, "2026-11-21"), false);
assert.equal(isExpired(undefined, "2026-11-22"), false);
assert.equal(isExpired("2026-11-22", "2026-11-22"), false);
assert.equal(isExpired("2026-11-21", "2026-11-22"), true);

const axisStart = Date.parse("2026-11-01T06:00:00+09:00");
const axisEnd = Date.parse("2027-06-01T06:00:00+09:00");
assert.equal(todayPosition(axisStart, axisEnd, "2026-11-01"), 0);
assert.equal(todayPosition(axisStart, axisEnd, "2027-06-01"), null);
console.log("ok");
