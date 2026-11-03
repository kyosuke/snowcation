#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import sharp from "sharp";

const { values: args } = parseArgs({
  options: {
    slug: { type: "string" },
    bbox: { type: "string" },
    hotel: { type: "string" },
    exclude: { type: "string", default: "" },
    "view-from": { type: "string" },
    "margin-km": { type: "string", default: "2" },
    help: { type: "boolean" },
  },
});
if (args.help) {
  console.log(`Usage: node .agents/skills/ski-resort-paper-cut/scripts/layout.mjs
 --slug <directory-name> --bbox <west,south,east,north> --hotel <lat,lon|way:OSM-ID>
 [--exclude <way-id,...>] [--view-from <degrees clockwise from north>]
 [--margin-km <0..10; default 2>]
Outputs: output/resort-research/<slug>/{layout.json,guide.png,map.png}
Exclude neighboring lifts AND pistes explicitly; no ownership is inferred.
OSM area pistes are rendered as polygons; other pistes as 24m-wide bands.
GSI dem_png z14, 25m terrain mesh with interpolated normals. Missing ways/DEM data abort execution.
Sources are cached in osm.json and dem-*.png; remove them to refresh.
Guide: perspective uphill view, auto-fitted to lifts/pistes/hotel.
Terrain extends beyond the camera/frustum (at least 6 km for the skyline).
Map: north up. Colored lifts, white pistes, orange hotel. Not a navigation map.`);
  process.exit(0);
}
const rad = Math.PI / 180;
function tuple(s, n) {
  const a = s?.split(",").map(Number);
  assert(a?.length === n && a.every(Number.isFinite), `Expected ${n} numbers: ${s}`);
  return a;
}
assert(/^[a-z0-9][a-z0-9_-]*$/.test(args.slug ?? ""), "Invalid --slug");
const [west, south, east, north] = tuple(args.bbox, 4);
assert(
  west >= -180 &&
    east <= 180 &&
    west < east &&
    south > -85 &&
    north < 85 &&
    south < north &&
    (east - west) * (north - south) <= 0.25,
  "Invalid bbox (maximum 0.25 square degrees)",
);
const margin = Number(args["margin-km"]) * 1000;
assert(Number.isFinite(margin) && margin >= 0 && margin <= 10000, "margin-km must be 0..10");
const excluded = args.exclude ? tuple(args.exclude, args.exclude.split(",").length) : [];
assert(
  excluded.every((n) => Number.isSafeInteger(n) && n > 0),
  "Invalid excluded way ID",
);
const out = `output/resort-research/${args.slug}`;
await mkdir(out, { recursive: true });
async function cached(name, url) {
  const path = `${out}/${name}`;
  try {
    return await readFile(path);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const response = await fetch(url, {
    headers: { "User-Agent": "SnowcationLayout/1.0 (OSM/GSI resort layout research)" },
    signal: AbortSignal.timeout(60000),
  });
  assert(response.ok, `${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(path, data);
  return data;
}
const osmUrl = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${args.bbox}`;
const osm = JSON.parse(await cached("osm.json", osmUrl));
// A cached bbox must never silently substitute another request.
assert(
  osm.bounds &&
    Math.abs(osm.bounds.minlon - west) < 1e-7 &&
    Math.abs(osm.bounds.minlat - south) < 1e-7 &&
    Math.abs(osm.bounds.maxlon - east) < 1e-7 &&
    Math.abs(osm.bounds.maxlat - north) < 1e-7,
  "Cached OSM bbox differs; remove osm.json",
);
const nodes = new Map(osm.elements.filter((e) => e.type === "node").map((e) => [e.id, e]));
const ways = osm.elements.filter((e) => e.type === "way");
let hotelOutline = [];
let hotelWay;
let hotelLat, hotelLon;
if (args.hotel?.startsWith("way:")) {
  assert(/^way:[1-9][0-9]*$/.test(args.hotel), "Invalid hotel way ID");
  hotelWay = ways.find((w) => w.id === Number(args.hotel.slice(4)));
  assert(hotelWay?.tags?.building, "Hotel way must exist and have a building outline");
  assert(
    hotelWay.nodes.length >= 4 && hotelWay.nodes[0] === hotelWay.nodes.at(-1),
    "Hotel outline must be closed",
  );
  hotelOutline = hotelWay.nodes.slice(0, -1).map((id) => {
    const n = nodes.get(id);
    assert(n, `Missing hotel node ${id}`);
    return { lat: n.lat, lon: n.lon };
  });
  hotelLat = hotelOutline.reduce((s, p) => s + p.lat, 0) / hotelOutline.length;
  hotelLon = hotelOutline.reduce((s, p) => s + p.lon, 0) / hotelOutline.length;
} else [hotelLat, hotelLon] = tuple(args.hotel, 2);
assert(
  hotelLat >= south && hotelLat <= north && hotelLon >= west && hotelLon <= east,
  "Hotel must be inside bbox",
);
for (const id of excluded)
  assert(
    ways.some((w) => w.id === id),
    `Excluded way ${id} not found`,
  );
const liftTypes = new Set([
  "chair_lift",
  "gondola",
  "cable_car",
  "mixed_lift",
  "drag_lift",
  "t-bar",
  "j-bar",
  "platter",
  "rope_tow",
  "magic_carpet",
]);
const selected = ways.filter(
  (w) =>
    !excluded.includes(w.id) &&
    (liftTypes.has(w.tags?.aerialway) || w.tags?.["piste:type"] === "downhill"),
);
assert(
  selected.some((w) => liftTypes.has(w.tags?.aerialway)),
  "No lift ways found",
);
assert(
  selected.some((w) => w.tags?.["piste:type"] === "downhill"),
  "No downhill ways found",
);
const lat0 = (south + north) / 2,
  lon0 = (west + east) / 2,
  metersLat = 6371008.8 * rad,
  metersLon = metersLat * Math.cos(lat0 * rad);
const xy = (lat, lon) => [(lon - lon0) * metersLon, (lat - lat0) * metersLat];
const ll = (x, y) => [lat0 + y / metersLat, lon0 + x / metersLon];
const allNodes = selected.flatMap((w) =>
  w.nodes.map((id) => {
    assert(nodes.has(id), `Missing node ${id}`);
    return nodes.get(id);
  }),
);
const positions = [
  ...allNodes.map((n) => xy(n.lat, n.lon)),
  xy(hotelLat, hotelLon),
  ...hotelOutline.map((p) => xy(p.lat, p.lon)),
];
const terrainMargin = Math.max(margin, 6000);
const bounds = [
  Math.min(...positions.map((p) => p[0])) - terrainMargin,
  Math.min(...positions.map((p) => p[1])) - terrainMargin,
  Math.max(...positions.map((p) => p[0])) + terrainMargin,
  Math.max(...positions.map((p) => p[1])) + terrainMargin,
];
const pixel = (lat, lon) => [
  ((lon + 180) / 360) * 4194304,
  ((1 - Math.asinh(Math.tan(lat * rad)) / Math.PI) / 2) * 4194304,
];
const [minLat, minLon] = ll(bounds[0] - 80, bounds[1] - 80),
  [maxLat, maxLon] = ll(bounds[2] + 80, bounds[3] + 80);
assert(
  minLat > -85 && maxLat < 85 && minLon >= -180 && maxLon <= 180,
  "Terrain out of supported bounds",
);
const [px0, py0] = pixel(maxLat, minLon),
  [px1, py1] = pixel(minLat, maxLon),
  tiles = new Map(),
  jobs = [];
for (let y = Math.floor(py0 / 256); y <= Math.floor(py1 / 256); y++)
  for (let x = Math.floor(px0 / 256); x <= Math.floor(px1 / 256); x++) jobs.push([x, y]);
assert(jobs.length <= 1024, "Too many DEM tiles; reduce bbox/margin");
console.log(`Fetching/reading ${jobs.length} GSI z14 tiles`);
for (let i = 0; i < jobs.length; i += 6)
  await Promise.all(
    jobs.slice(i, i + 6).map(async ([x, y]) => {
      const url = `https://cyberjapandata.gsi.go.jp/xyz/dem_png/14/${x}/${y}.png`;
      const { data, info } = await sharp(await cached(`dem-14-${x}-${y}.png`, url))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert(
        info.width === 256 && info.height === 256 && info.channels === 3,
        `Invalid DEM ${url}`,
      );
      tiles.set(`${x},${y}`, data);
    }),
  );
function decode(v) {
  assert(v !== 8388608, "Missing GSI elevation");
  return (v > 8388608 ? v - 16777216 : v) * 0.01;
}
function elevation(lat, lon) {
  const [px, py] = pixel(lat, lon),
    x = Math.floor(px),
    y = Math.floor(py),
    fx = px - x,
    fy = py - y;
  function sample(x, y) {
    const t = tiles.get(`${Math.floor(x / 256)},${Math.floor(y / 256)}`);
    assert(t, `Missing DEM tile at ${lat},${lon}`);
    const i = ((y % 256) * 256 + (x % 256)) * 3;
    return decode(t[i] * 65536 + t[i + 1] * 256 + t[i + 2]);
  }
  return (
    sample(x, y) * (1 - fx) * (1 - fy) +
    sample(x + 1, y) * fx * (1 - fy) +
    sample(x, y + 1) * (1 - fx) * fy +
    sample(x + 1, y + 1) * fx * fy
  );
}
function bearing(a, b) {
  const p = a.lat * rad,
    q = b.lat * rad,
    d = (b.lon - a.lon) * rad;
  return (
    (Math.atan2(
      Math.sin(d) * Math.cos(q),
      Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(d),
    ) /
      rad +
      360) %
    360
  );
}
function distance(a, b) {
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 12742017.6 * Math.asin(Math.sqrt(h));
}
assert.equal(decode(10000), 100);
assert.equal(decode(16777116), -1);
assert.throws(() => decode(8388608));
assert.equal(bearing({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }), 0);
assert.equal(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }), 90);
assert.equal(bearing({ lat: 1, lon: 0 }, { lat: 0, lon: 0 }), 180);
const minimum = (values) => values.reduce((a, b) => Math.min(a, b), Infinity);
const maximum = (values) => values.reduce((a, b) => Math.max(a, b), -Infinity);
const round = (n) => Math.round(n * 100) / 100;
const features = selected.map((w) => {
  const points = w.nodes.map((id) => {
    const n = nodes.get(id);
    return { lat: n.lat, lon: n.lon, elevation: round(elevation(n.lat, n.lon)) };
  });
  const ends = w.tags?.area === "yes" ? points : [points[0], points.at(-1)];
  const top = ends.reduce((a, b) => (a.elevation > b.elevation ? a : b)),
    bottom = ends.reduce((a, b) => (a.elevation < b.elevation ? a : b));
  return {
    way_id: w.id,
    name: w.tags?.name ?? null,
    type: w.tags?.aerialway ?? w.tags["piste:type"],
    difficulty: w.tags?.["piste:difficulty"] ?? null,
    area: w.tags?.area === "yes",
    points,
    horizontal_length: round(points.slice(1).reduce((s, p, i) => s + distance(points[i], p), 0)),
    top_elevation: top.elevation,
    bottom_elevation: bottom.elevation,
    downhill_bearing: round(bearing(top, bottom)),
  };
});
const lifts = features.filter((f) => liftTypes.has(f.type)),
  courses = features.filter((f) => f.type === "downhill");
const stations = lifts.flatMap((lift) => {
  const endpoints = [lift.points[0], lift.points.at(-1)],
    top = endpoints[0].elevation >= endpoints[1].elevation ? endpoints[0] : endpoints[1],
    bottom = top === endpoints[0] ? endpoints[1] : endpoints[0];
  return [
    { lift, end: "top", point: top },
    { lift, end: "bottom", point: bottom },
  ];
});
for (const station of stations) {
  const candidates = stations
    .filter((other) => other.lift !== station.lift)
    .map((other) => ({ other, distance_m: distance(station.point, other.point) }));
  const nearest = candidates.length
    ? candidates.reduce((a, b) => (a.distance_m < b.distance_m ? a : b))
    : null;
  station.lift[station.end === "top" ? "top_station_nearest" : "bottom_station_nearest"] = {
    lift_name: nearest?.other.lift.name ?? null,
    endpoint: nearest?.other.end ?? null,
    distance_m: nearest ? round(nearest.distance_m) : null,
  };
}
const sum = lifts.reduce(
  (s, l) => [
    s[0] + Math.sin(l.downhill_bearing * rad) * l.horizontal_length,
    s[1] + Math.cos(l.downhill_bearing * rad) * l.horizontal_length,
  ],
  [0, 0],
);
// 方位が相殺されても、--view-from を指定していれば自動の視点は要らない
assert(
  args["view-from"] !== undefined || Math.hypot(...sum) > 1e-6,
  "Ambiguous representative downhill bearing; pass --view-from",
);
const downhill = (Math.atan2(...sum) / rad + 360) % 360,
  view = args["view-from"] === undefined ? downhill : Number(args["view-from"]);
assert(Number.isFinite(view) && view >= 0 && view < 360, "view-from must be 0..<360");
if (!hotelOutline.length) {
  const [x, y] = xy(hotelLat, hotelLon);
  hotelOutline = [
    [-25, -18],
    [25, -18],
    [25, 18],
    [-25, 18],
  ].map(([dx, dy]) => {
    const [lat, lon] = ll(x + dx, y + dy);
    return { lat, lon };
  });
}
const hotel = {
  lat: hotelLat,
  lon: hotelLon,
  elevation: round(elevation(hotelLat, hotelLon)),
  way_id: hotelWay?.id ?? null,
  name: hotelWay?.tags.name ?? null,
  outline: hotelOutline.map((p) => ({ ...p, elevation: round(elevation(p.lat, p.lon)) })),
  simplified_height: 18,
  representation:
    "OSM footprint extruded by fixed illustrative height; coordinate input uses a 50x36m placeholder",
};
const heights = [...features.flatMap((f) => f.points.map((p) => p.elevation)), hotel.elevation];
// Features use the same piecewise planar ground as the mesh to avoid burial.
const nx = Math.ceil((bounds[2] - bounds[0]) / 25),
  ny = Math.ceil((bounds[3] - bounds[1]) / 25),
  dx = (bounds[2] - bounds[0]) / nx,
  dy = (bounds[3] - bounds[1]) / ny,
  grid = [];
for (let j = 0; j <= ny; j++)
  for (let i = 0; i <= nx; i++) {
    const x = bounds[0] + i * dx,
      y = bounds[1] + j * dy;
    grid.push([x, y, elevation(...ll(x, y))]);
  }
function ground(x, y) {
  const u = (x - bounds[0]) / dx,
    v = (y - bounds[1]) / dy,
    i = Math.max(0, Math.min(nx - 1, Math.floor(u))),
    j = Math.max(0, Math.min(ny - 1, Math.floor(v))),
    fx = u - i,
    fy = v - j;
  const a = grid[j * (nx + 1) + i][2],
    b = grid[j * (nx + 1) + i + 1][2],
    c = grid[(j + 1) * (nx + 1) + i][2],
    d = grid[(j + 1) * (nx + 1) + i + 1][2];
  return fx >= fy ? a + (b - a) * fx + (d - b) * fy : a + (d - c) * fx + (c - a) * fy;
}
assert(Math.abs(ground(grid[0][0], grid[0][1]) - grid[0][2]) < 1e-7);
const width = 1536,
  height = 1024,
  colors = [
    [213, 73, 82],
    [225, 146, 32],
    [106, 81, 189],
    [23, 151, 169],
    [151, 86, 44],
    [65, 134, 64],
  ];
// Ear clipping preserves concave OSM building footprints.
function triangulate(points) {
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const order = points.map((_, i) => i);
  const area = points.reduce((s, p, i) => {
    const q = points[(i + 1) % points.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  if (area < 0) order.reverse();
  const result = [];
  while (order.length > 3) {
    let found = false;
    for (let i = 0; i < order.length; i++) {
      const a = order[(i + order.length - 1) % order.length],
        b = order[i],
        c = order[(i + 1) % order.length];
      if (cross(points[a], points[b], points[c]) <= 1e-8) continue;
      if (
        order.some(
          (j) =>
            j !== a &&
            j !== b &&
            j !== c &&
            cross(points[a], points[b], points[j]) >= -1e-8 &&
            cross(points[b], points[c], points[j]) >= -1e-8 &&
            cross(points[c], points[a], points[j]) >= -1e-8,
        )
      )
        continue;
      result.push([a, b, c]);
      order.splice(i, 1);
      found = true;
      break;
    }
    assert(found, "Cannot triangulate hotel outline (self-intersection or degenerate polygon)");
  }
  result.push(order);
  return result;
}
const testPolygon = [
  [0, 0],
  [2, 0],
  [2, 2],
  [1, 1],
  [0, 2],
];
const testTriangles = triangulate(testPolygon);
assert.equal(testTriangles.length, 3);
assert.equal(
  testTriangles.reduce((sum, t) => {
    const [a, b, c] = t.map((i) => testPolygon[i]);
    return sum + Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }, 0),
  3,
);
async function render(map) {
  const az = view * rad,
    toward = [Math.sin(az), Math.cos(az)],
    right = [-Math.cos(az), Math.sin(az)];
  const liftBottoms = lifts
    .flatMap((l) => [l.points[0], l.points.at(-1)])
    .filter((p) => p.elevation < Math.min(...lifts.map((l) => l.bottom_elevation)) + 30);
  const base = liftBottoms
    .map((p) => xy(p.lat, p.lon))
    .reduce((s, p) => [s[0] + p[0] / liftBottoms.length, s[1] + p[1] / liftBottoms.length], [0, 0]);
  const span = Math.max(
    maximum(positions.map((p) => p[0])) - minimum(positions.map((p) => p[0])),
    maximum(positions.map((p) => p[1])) - minimum(positions.map((p) => p[1])),
  );
  const distanceFromBase = Math.max(650, span * 0.65);
  const eye = [
    base[0] + toward[0] * distanceFromBase,
    base[1] + toward[1] * distanceFromBase,
    Math.min(...lifts.map((l) => l.bottom_elevation)) + 130,
  ];
  // 構図は斜面を下から見上げる前提。斜面の上側へ回すとカメラが地中に入る
  assert(
    ground(eye[0], eye[1]) < eye[2] - 30,
    `Camera would be underground at view-from ${round(view)}°; view from the downhill side`,
  );
  const summit = lifts
    .flatMap((l) => l.points)
    .reduce((a, b) => (a.elevation > b.elevation ? a : b));
  const summitXY = xy(summit.lat, summit.lon);
  const pitch =
    Math.atan2(
      summit.elevation - eye[2],
      (eye[0] - summitXY[0]) * toward[0] + (eye[1] - summitXY[1]) * toward[1],
    ) * 0.5;
  function camera([x, y, z]) {
    if (map) return [x, y, z];
    x -= eye[0];
    y -= eye[1];
    z -= eye[2];
    const forward = -x * toward[0] - y * toward[1];
    return [
      x * right[0] + y * right[1],
      z * Math.cos(pitch) - forward * Math.sin(pitch),
      forward * Math.cos(pitch) + z * Math.sin(pitch),
    ];
  }
  const subject = features.flatMap((f) =>
    f.points.map((p) => {
      const [x, y] = xy(p.lat, p.lon);
      return [x, y, ground(x, y) + 12];
    }),
  );
  subject.push(
    ...hotel.outline.flatMap((p) => {
      const [x, y] = xy(p.lat, p.lon);
      return [
        [x, y, ground(x, y)],
        [x, y, ground(x, y) + hotel.simplified_height],
      ];
    }),
  );
  const uv = subject.map(camera).map(([x, y, z]) => (map ? [x, y] : [x / z, y / z]));
  const xmin = minimum(uv.map((p) => p[0])),
    xmax = maximum(uv.map((p) => p[0])),
    ymin = minimum(uv.map((p) => p[1])),
    ymax = maximum(uv.map((p) => p[1]));
  const scale = Math.min(
    (width * 0.84) / (xmax - xmin),
    (height * (map ? 0.8 : 0.66)) / (ymax - ymin),
  );
  const offsetX = width / 2 - (scale * (xmin + xmax)) / 2,
    offsetY = map ? height / 2 + (scale * (ymin + ymax)) / 2 : height * 0.29 + scale * ymax;
  const project = (p) => {
    const [x, y, z] = camera(p);
    return map
      ? [offsetX + x * scale, offsetY - y * scale, z]
      : [offsetX + (x / z) * scale, offsetY - (y / z) * scale, 1 / z];
  };
  const projectedBounds = (points) => {
    const p = points.map(project);
    const x0 = minimum(p.map((v) => v[0])),
      x1 = maximum(p.map((v) => v[0])),
      y0 = minimum(p.map((v) => v[1])),
      y1 = maximum(p.map((v) => v[1]));
    return {
      left: round(x0),
      top: round(y0),
      right: round(x1),
      bottom: round(y1),
      width_fraction: Math.round(((x1 - x0) / width) * 10000) / 10000,
      height_fraction: Math.round(((y1 - y0) / height) * 10000) / 10000,
    };
  };
  const image = Buffer.alloc(width * height * 3);
  for (let i = 0; i < image.length; i += 3) {
    image[i] = 226;
    image[i + 1] = 236;
    image[i + 2] = 242;
  }
  const depth = new Float64Array(width * height).fill(-Infinity);
  function paint(x, y, z, color, bias = 0) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = y * width + x;
    const adjusted = z + (map ? bias : bias * z * z);
    if (adjusted < depth[i]) return;
    depth[i] = adjusted;
    for (let c = 0; c < 3; c++) image[i * 3 + c] = color[c];
  }
  // Nearer samples must win regardless of painting order.
  paint(0, 0, 2, [10, 20, 30]);
  paint(0, 0, 1, [99, 99, 99]);
  assert.equal(depth[0], 2);
  assert.equal(image[0], 10);
  paint(0, 0, 3, [40, 50, 60]);
  assert.equal(image[0], 40);
  depth[0] = -Infinity;
  image.set([226, 236, 242], 0);
  function triangle(p, color) {
    let vertices = p.map((v, i) => ({ p: v, c: Array.isArray(color[0]) ? color[i] : color }));
    if (!map) {
      const clipped = [];
      for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i],
          b = vertices[(i + 1) % vertices.length],
          za = camera(a.p)[2],
          zb = camera(b.p)[2];
        if (za >= 10) clipped.push(a);
        if (za >= 10 !== zb >= 10) {
          const t = (10 - za) / (zb - za);
          clipped.push({
            p: a.p.map((v, k) => v + (b.p[k] - v) * t),
            c: a.c.map((v, k) => v + (b.c[k] - v) * t),
          });
        }
      }
      vertices = clipped;
    }
    for (let k = 1; k < vertices.length - 1; k++)
      raster([vertices[0], vertices[k], vertices[k + 1]]);
  }
  function raster(vertices) {
    const [a, b, c] = vertices.map((v) => project(v.p)),
      den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(den) < 1e-9) return;
    for (
      let y = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
      y <= Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      y++
    )
      for (
        let x = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
        x <= Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
        x++
      ) {
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / den,
          v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / den;
        if (u >= -1e-6 && v >= -1e-6 && u + v <= 1.000001) {
          const z = u * a[2] + v * b[2] + (1 - u - v) * c[2];
          const weights = map
            ? [u, v, 1 - u - v]
            : [(u * a[2]) / z, (v * b[2]) / z, ((1 - u - v) * c[2]) / z];
          const color = [0, 1, 2].map((k) =>
            vertices.reduce((s, p, i) => s + p.c[k] * weights[i], 0),
          );
          paint(x, y, z, color);
        }
      }
  }
  const faces = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = grid[j * (nx + 1) + i],
        b = grid[j * (nx + 1) + i + 1],
        c = grid[(j + 1) * (nx + 1) + i],
        d = grid[(j + 1) * (nx + 1) + i + 1];
      faces.push([a, b, d], [a, d, c]);
    }
  faces.sort(
    (a, b) => a.reduce((s, p) => s + camera(p)[2], 0) - b.reduce((s, p) => s + camera(p)[2], 0),
  );
  const smoothLight = new Map(
    grid.map(([x, y, z]) => {
      const h = 50;
      const gx = (elevation(...ll(x + h, y)) - elevation(...ll(x - h, y))) / (2 * h);
      const gy = (elevation(...ll(x, y + h)) - elevation(...ll(x, y - h))) / (2 * h);
      const light = Math.max(0, (gx * 0.45 + gy * 0.3 + 0.84) / Math.hypot(gx, gy, 1));
      return [[x, y, z].join(","), light];
    }),
  );
  for (const f of faces)
    triangle(
      f,
      f.map((p) => {
        const light = smoothLight.get(p.join(","));
        return [115 + 85 * light, 140 + 74 * light, 151 + 73 * light];
      }),
    );
  const terrainDepth = depth.slice();
  const visibility = [...lifts, ...courses].map((feature) => {
    let samples = 0,
      hidden = 0;
    for (let i = 1; i < feature.points.length; i++) {
      const a = feature.points[i - 1],
        b = feature.points[i];
      const steps = Math.max(1, Math.ceil(distance(a, b) / 8));
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const [x, y] = xy(a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t);
        const [sx, sy, z] = project([x, y, ground(x, y) + (liftTypes.has(feature.type) ? 12 : 2)]);
        const ix = Math.round(sx),
          iy = Math.round(sy);
        if (liftTypes.has(feature.type))
          assert(ix >= 0 && ix < width && iy >= 0 && iy < height, "Lift outside frame");
        samples++;
        if (
          ix < 0 ||
          ix >= width ||
          iy < 0 ||
          iy >= height ||
          z + (map ? 3 : 3 * z * z) < terrainDepth[iy * width + ix]
        )
          hidden++;
      }
    }
    const visible_fraction = round((samples - hidden) / samples);
    if (!map) feature.visible_fraction = visible_fraction;
    return { way_id: feature.way_id, samples, hidden_by_terrain: hidden, visible_fraction };
  });
  if (!map && visibility.some((feature) => feature.hidden_by_terrain))
    console.info("Terrain-hidden lift and piste portions may be omitted from the image.");
  function line(a, b, color, radius, bias = 0) {
    a = project(a);
    b = project(b);
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        x = a[0] + (b[0] - a[0]) * t,
        y = a[1] + (b[1] - a[1]) * t,
        z = a[2] + (b[2] - a[2]) * t;
      for (let yy = Math.floor(y - radius); yy <= Math.ceil(y + radius); yy++)
        for (let xx = Math.floor(x - radius); xx <= Math.ceil(x + radius); xx++)
          if ((xx - x) ** 2 + (yy - y) ** 2 <= radius ** 2) paint(xx, yy, z, color, bias);
    }
  }
  function drape(p, offset = 0) {
    const [x, y] = xy(p.lat, p.lon);
    return [x, y, ground(x, y) + offset];
  }
  function station(p, color) {
    const [x, y] = xy(p.lat, p.lon),
      z = ground(x, y),
      corners = [
        [x - 9, y - 6],
        [x + 9, y - 6],
        [x + 9, y + 6],
        [x - 9, y + 6],
      ].map(([cx, cy]) => [cx, cy, ground(cx, cy)]),
      roof = corners.map(([cx, cy, cz]) => [cx, cy, cz + 7]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      triangle([corners[i], corners[j], roof[j]], [218, 228, 233]);
      triangle([corners[i], roof[j], roof[i]], [218, 228, 233]);
      line(roof[i], roof[j], color, 1.5, 3);
      line(corners[i], roof[i], color, 1.5, 3);
    }
    triangle(roof, [245, 249, 250]);
  }
  for (const f of [...courses, ...lifts]) {
    // Wide course strokes must not act as floating occluders over lift cables.
    if (f === lifts[0]) depth.set(terrainDepth);
    const lift = liftTypes.has(f.type),
      color = lift ? colors[lifts.indexOf(f) % colors.length] : [252, 253, 255];
    // shortcut: polygon fill is sampled at mesh cells; refine the mesh for narrow areas.
    if (f.area) {
      const polygon = f.points.map((p) => xy(p.lat, p.lon));
      for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
          const x = bounds[0] + (i + 0.5) * dx,
            y = bounds[1] + (j + 0.5) * dy;
          let inside = false;
          for (let k = 0, l = polygon.length - 1; k < polygon.length; l = k++) {
            const a = polygon[k],
              b = polygon[l];
            if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0])
              inside = !inside;
          }
          if (inside) {
            const a = grid[j * (nx + 1) + i],
              b = grid[j * (nx + 1) + i + 1],
              c = grid[(j + 1) * (nx + 1) + i],
              d = grid[(j + 1) * (nx + 1) + i + 1];
            triangle(
              [a, b, d].map((p) => [p[0], p[1], p[2] + 1]),
              color,
            );
            triangle(
              [a, d, c].map((p) => [p[0], p[1], p[2] + 1]),
              color,
            );
          }
        }
    }
    for (let i = 1; i < f.points.length; i++) {
      const a = f.points[i - 1],
        b = f.points[i],
        steps = Math.max(1, Math.ceil(distance(a, b) / 8));
      for (let j = 0; j < steps; j++) {
        const interp = (t) =>
          drape(
            { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t },
            lift ? 12 : 2,
          );
        line(
          interp(j / steps),
          interp((j + 1) / steps),
          color,
          lift
            ? 2.6
            : map
              ? Math.max(2, 12 * scale)
              : Math.max(2, (12 * scale) / camera(interp(j / steps))[2]),
          3,
        );
      }
    }
    if (lift) {
      const endpoints = [f.points[0], f.points.at(-1)],
        top = endpoints[0].elevation >= endpoints[1].elevation ? endpoints[0] : endpoints[1],
        bottom = top === endpoints[0] ? endpoints[1] : endpoints[0];
      station(bottom, color);
      station(top, color);
    }
  }
  const footprint = hotel.outline.map((p) => drape(p));
  const roof = footprint.map((p) => [p[0], p[1], p[2] + hotel.simplified_height]);
  for (let i = 0; i < footprint.length; i++) {
    const j = (i + 1) % footprint.length;
    triangle([footprint[i], footprint[j], roof[j]], [193, 117, 48]);
    triangle([footprint[i], roof[j], roof[i]], [193, 117, 48]);
  }
  for (const indices of triangulate(roof))
    triangle(
      indices.map((i) => roof[i]),
      [248, 177, 65],
    );
  const escape = (s) =>
    String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const labels = lifts
    .map(
      (l, i) =>
        `<text x="30" y="${height - 110 + i * 17}" fill="rgb(${colors[i % colors.length]})">${escape(l.name ?? `way ${l.way_id}`)}</text>`,
    )
    .join("");
  const overlay = `<svg width="${width}" height="${height}"><g font-family="sans-serif" font-size="13">${labels}<text x="30" y="30">${map ? "N ↑ | North up" : `View from ${round(view)}° | perspective uphill`}</text><text x="30" y="52" fill="#ad621a">■ Hotel</text><text x="30" y="${height - 20}" font-size="11">© OpenStreetMap contributors | Terrain: GSI Japan dem_png z14 | schematic guide</text></g></svg>`;
  await sharp(image, { raw: { width, height, channels: 3 } })
    .composite([{ input: Buffer.from(overlay) }])
    .png()
    .toFile(`${out}/${map ? "map" : "guide"}.png`);
  return {
    projection: map ? "orthographic top-down" : "perspective",
    view_from: round(view),
    position: {
      ...Object.fromEntries(["x", "y", "elevation"].map((k, i) => [k, round(eye[i])])),
      ...Object.fromEntries(ll(eye[0], eye[1]).map((v, i) => [i ? "lon" : "lat", v])),
    },
    height_above_lowest_station: 130,
    upward_pitch: round(pitch / rad),
    vertical_fov: map ? null : round((2 * Math.atan(height / (2 * scale))) / rad),
    principal_point: [round(offsetX), round(offsetY)],
    terrain_mesh_m: 25,
    subject_bounds: projectedBounds(subject),
    lift_bounds: projectedBounds(
      lifts.flatMap((l) =>
        l.points.map((p) => {
          const [x, y] = xy(p.lat, p.lon);
          return [x, y, ground(x, y) + 12];
        }),
      ),
    ),
    lift_visibility: visibility.slice(0, lifts.length),
  };
}
const camera = await render(false);
await render(true);
const layout = {
  slug: args.slug,
  bbox: [west, south, east, north],
  sources: {
    osm: osmUrl,
    elevation: "https://cyberjapandata.gsi.go.jp/xyz/dem_png/14/{x}/{y}.png",
    dem_specification: "https://maps.gsi.go.jp/development/demtile.html",
    generated_at: new Date().toISOString(),
  },
  lifts,
  courses,
  hotel,
  highest_elevation: Math.max(...heights),
  lowest_elevation: Math.min(...heights),
  downhill: {
    bearing: round(downhill),
    method: "horizontal-length-weighted circular mean of lift endpoint bearings",
  },
  excluded_ways: excluded.map((id) => ({
    way_id: id,
    tags: ways.find((w) => w.id === id).tags ?? {},
  })),
  terrain: {
    bounds_xy_m: bounds,
    margin_m: margin,
    rendered_margin_m: terrainMargin,
    lowest_elevation: minimum(grid.map((p) => p[2])),
    highest_elevation: maximum(grid.map((p) => p[2])),
  },
  camera,
};
await writeFile(`${out}/layout.json`, JSON.stringify(layout, null, 2) + "\n");
console.log(
  `${out}: ${lifts.length} lifts, ${courses.length} pistes, ${excluded.length} excluded ways; downhill ${round(downhill)}°, view ${round(view)}°`,
);

console.log(
  JSON.stringify(
    { camera, hotel_way: hotel.way_id, hotel_outline_points: hotel.outline.length },
    null,
    2,
  ),
);
