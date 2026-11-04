import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "shared/world-airports.json");
const targetPath = resolve(root, "JAL赤組用アプリ/public/data/airports.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
if (!Array.isArray(source)) throw new Error("shared/world-airports.json must contain an array");

const seen = new Set();
const normalized = [];
for (const airport of source) {
  const code = typeof airport.iata_code === "string" ? airport.iata_code.trim().toUpperCase() : "";
  const latitude = Number(airport.latitude_deg);
  const longitude = Number(airport.longitude_deg);
  if (!/^[A-Z]{3}$/.test(code)) throw new Error(`Invalid IATA code: ${code || "(empty)"}`);
  if (seen.has(code)) throw new Error(`Duplicate IATA code: ${code}`);
  if (!airport.name?.trim() || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid airport name or coordinates: ${code}`);
  }
  seen.add(code);
  normalized.push({
    code,
    name: airport.name,
    country: airport.iso_country || "",
    lat: latitude,
    lon: longitude,
  });
}

normalized.sort((left, right) => left.code.localeCompare(right.code));
await writeFile(targetPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
console.log(`Wrote ${normalized.length} airports to ${targetPath}; unique IATA codes and coordinate bounds verified.`);
