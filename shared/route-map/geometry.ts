import type { RouteMapAirport } from "./types";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 470;
const EARTH_RADIUS_KM = 6371.0088;

export type MapPoint = { x: number; y: number };

export function isUsableAirport(airport: RouteMapAirport): boolean {
  const lat = Number(airport.latitude_deg);
  const lon = Number(airport.longitude_deg);
  return /^[A-Z]{3}$/.test(airport.iata_code)
    && airport.name.trim().length > 0
    && Number.isFinite(lat) && lat >= -90 && lat <= 90
    && Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

export function projectAirport(airport: RouteMapAirport): MapPoint {
  const latitude = Number(airport.latitude_deg);
  const longitude = Number(airport.longitude_deg);
  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((82 - latitude) / 164) * MAP_HEIGHT,
  };
}

export function greatCircleDistanceKm(a: RouteMapAirport, b: RouteMapAirport): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat1 = radians(Number(a.latitude_deg));
  const lat2 = radians(Number(b.latitude_deg));
  const dLat = lat2 - lat1;
  const dLon = radians(Number(b.longitude_deg) - Number(a.longitude_deg));
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(
    Math.sqrt(Math.min(1, Math.max(0, haversine))),
    Math.sqrt(Math.max(0, 1 - haversine)),
  );
}

function unitVector(airport: RouteMapAirport): [number, number, number] {
  const lat = Number(airport.latitude_deg) * Math.PI / 180;
  const lon = Number(airport.longitude_deg) * Math.PI / 180;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
}

export function greatCirclePoints(a: RouteMapAirport, b: RouteMapAirport, steps = 56): [number, number][] {
  const leftVector = unitVector(a);
  const rightVector = unitVector(b);
  const dot = Math.max(-1, Math.min(1, leftVector[0] * rightVector[0] + leftVector[1] * rightVector[1] + leftVector[2] * rightVector[2]));
  const angle = Math.acos(dot);
  const sine = Math.sin(angle);
  const points: [number, number][] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const u = sine < 1e-8 ? 1 - t : Math.sin((1 - t) * angle) / sine;
    const v = sine < 1e-8 ? t : Math.sin(t * angle) / sine;
    const x = u * leftVector[0] + v * rightVector[0];
    const y = u * leftVector[1] + v * rightVector[1];
    const z = u * leftVector[2] + v * rightVector[2];
    points.push([Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI]);
  }
  return points;
}

/** Splits SVG polyline paths at the antimeridian so they never cross the whole map. */
export function greatCirclePathSegments(origin: RouteMapAirport, destination: RouteMapAirport): string[] {
  const projected = greatCirclePoints(origin, destination).map(([longitude, latitude]) => ({
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((82 - latitude) / 164) * MAP_HEIGHT,
  }));
  const paths: string[] = [];
  let current = [projected[0]];
  for (let index = 1; index < projected.length; index += 1) {
    const previous = projected[index - 1];
    const next = projected[index];
    const delta = next.x - previous.x;
    if (delta > MAP_WIDTH / 2 || delta < -MAP_WIDTH / 2) {
      const wrappedX = delta > 0 ? next.x - MAP_WIDTH : next.x + MAP_WIDTH;
      const edgeX = delta > 0 ? 0 : MAP_WIDTH;
      const oppositeEdgeX = delta > 0 ? MAP_WIDTH : 0;
      const denominator = wrappedX - previous.x;
      const ratio = denominator === 0 ? 0 : (edgeX - previous.x) / denominator;
      const crossingY = previous.y + (next.y - previous.y) * ratio;
      current.push({ x: edgeX, y: crossingY });
      paths.push(toSvgPath(current));
      current = [{ x: oppositeEdgeX, y: crossingY }, next];
    } else {
      current.push(next);
    }
  }
  if (current.length > 1) paths.push(toSvgPath(current));
  return paths;
}

function toSvgPath(points: MapPoint[]): string {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

