import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "shared/route-map/ne_110m_land.geojson");
const targetPath = resolve(root, "shared/route-map/natural-earth-land-paths.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));

const width = 1000;
const height = 470;
const x = (longitude) => ((longitude + 180) / 360) * width;
const y = (latitude) => ((82 - latitude) / 164) * height;
const pointString = ([longitude, latitude], index) =>
  `${index === 0 ? "M" : "L"}${x(longitude).toFixed(1)},${y(latitude).toFixed(1)}`;

const paths = [];
let polygonCount = 0;
for (const feature of source.features) {
  if (feature.geometry?.type !== "Polygon") {
    throw new Error(`Unexpected Natural Earth geometry type: ${feature.geometry?.type}`);
  }
  for (const ring of feature.geometry.coordinates) {
    let segment = [];
    const segments = [];
    for (const point of ring) {
      if (segment.length && Math.abs(point[0] - segment[segment.length - 1][0]) > 180) {
        if (segment.length >= 3) segments.push(segment);
        segment = [];
      }
      segment.push(point);
    }
    if (segment.length >= 3) segments.push(segment);
    for (const coordinates of segments) {
      paths.push(`${coordinates.map(pointString).join(" ")} Z`);
      polygonCount += 1;
    }
  }
}

if (paths.length < 100 || paths.some((path) => !path.startsWith("M"))) {
  throw new Error(`Generated map geometry does not look complete (${paths.length} paths)`);
}
await writeFile(targetPath, `${JSON.stringify(paths)}\n`, "utf8");
console.log(`Generated ${paths.length} land paths from ${source.features.length} Natural Earth features (${polygonCount} polygon rings); wrote ${targetPath}.`);
