import fs from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import path from "node:path";
const root = process.cwd();
const appPaths = ["ANA青組用アプリ", "JAL赤組用アプリ", "フライトレコーダーアプリ"].map((app) => path.join(root, app));
const require = createRequire(import.meta.url);
const ts = require(require.resolve("typescript", { paths: appPaths }));
const source = fs.readFileSync(path.join(root, "shared/route-map/geometry.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const geometryModule = { exports: {} };
vm.runInNewContext(outputText, { module: geometryModule, exports: geometryModule.exports, Math, Number });
const { greatCircleDistanceKm, greatCirclePathSegments, isUsableAirport } = geometryModule.exports;
const airports = JSON.parse(fs.readFileSync(path.join(root, "shared/world-airports.json"), "utf8"));
const codes = airports.map((airport) => airport.iata_code);
const duplicates = [...new Set(codes.filter((code, index) => codes.indexOf(code) !== index))];
const invalid = airports.filter((airport) => !isUsableAirport(airport));
const byCode = new Map(airports.map((airport) => [airport.iata_code, airport]));
const mapWidth = 1000;
const parsePathX = (pathText) => [...pathText.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
const samples = [["HND", "LAX"], ["HND", "LHR"], ["LAX", "NRT"], ["HND", "CTS"]];
const routes = samples.map(([from, to]) => {
  const origin = byCode.get(from);
  const destination = byCode.get(to);
  if (!origin || !destination) throw new Error(`Missing sample airport: ${from} or ${to}`);
  const paths = greatCirclePathSegments(origin, destination);
  const spans = paths.map((pathText) => {
    const xs = parsePathX(pathText);
    return Math.max(...xs) - Math.min(...xs);
  });
  return {
    route: `${from}-${to}`,
    kilometers: Math.round(greatCircleDistanceKm(origin, destination)),
    segments: paths.length,
    maxLongitudeSpanPx: Math.round(Math.max(...spans)),
    crossesAntimeridian: paths.length > 1,
  };
});

const jalAirports = JSON.parse(fs.readFileSync(path.join(root, "JAL赤組用アプリ/public/data/airports.json"), "utf8"));
const jalCodes = jalAirports.map((airport) => airport.code);
const landPaths = JSON.parse(fs.readFileSync(path.join(root, "shared/route-map/natural-earth-land-paths.json"), "utf8"));
const sourceHasInvalidCodes = codes.some((code) => !/^[A-Z]{3}$/.test(code));
const compatHasInvalidCoordinates = jalAirports.some((airport) => !Number.isFinite(airport.lat) || airport.lat < -90 || airport.lat > 90
  || !Number.isFinite(airport.lon) || airport.lon < -180 || airport.lon > 180);
const out = {
  sharedAirportCount: airports.length,
  uniqueIataCount: new Set(codes).size,
  duplicateIataCodes: duplicates,
  invalidSourceCoordinates: invalid.length,
  sourceHasInvalidCodes,
  knownAirportCodes: ["HND", "LAX", "LHR", "NRT", "CTS"].map((code) => ({ code, found: byCode.has(code) })),
  jalCompatibilityCount: jalAirports.length,
  jalCompatibilityDuplicateCodes: [...new Set(jalCodes.filter((code, index) => jalCodes.indexOf(code) !== index))],
  jalCompatibilityInvalidCoordinates: jalAirports.filter((airport) => !Number.isFinite(airport.lat) || airport.lat < -90 || airport.lat > 90
    || !Number.isFinite(airport.lon) || airport.lon < -180 || airport.lon > 180).length,
  naturalEarthLandPaths: landPaths.length,
  routes,
};
console.log(JSON.stringify(out, null, 2));

if (duplicates.length || invalid.length || sourceHasInvalidCodes || compatHasInvalidCoordinates
  || jalAirports.length !== airports.length || new Set(jalCodes).size !== jalCodes.length
  || landPaths.length < 100 || routes.some((route) => route.maxLongitudeSpanPx > mapWidth / 2 + 2)) {
  throw new Error("Route map data validation failed; see the diagnostics above.");
}



