/**
 * Geographic great-circle distance between airports.
 *
 * This is NOT IATA Ticketed Point Mileage (TPM), ANA's published mileage chart,
 * nor JAL's published mileage chart. Never use this result as an official
 * mileage input for PP/FOP/LSP calculations without an explicit user override.
 */

export type WorldAirport = {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
  latitude_deg: string | number;
  longitude_deg: string | number;
  icao?: string;
  icao_code?: string;
  type?: string;
  ident?: string;
  id?: string | number;
};

export type DistanceUnit = "mi" | "km" | "nm";

export type GreatCircleResult = {
  origin: WorldAirport;
  destination: WorldAirport;
  miles: number;
  kilometers: number;
  nauticalMiles: number;
  roundedMiles: number;
  method: "great-circle";
  source: "OurAirports coordinates";
};

// Mean Earth radius. This produces a repeatable geographic estimate; airline
// mileage systems may apply different reference points, rules, rounding, and dates.
const EARTH_RADIUS_KM = 6371.0088;
const KM_PER_STATUTE_MILE = 1.609344;
const KM_PER_NAUTICAL_MILE = 1.852;

function numberCoordinate(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidAirport(airport: WorldAirport): boolean {
  const latitude = numberCoordinate(airport.latitude_deg);
  const longitude = numberCoordinate(airport.longitude_deg);
  return /^[A-Z]{3}$/.test(airport.iata_code)
    && airport.name.trim().length > 0
    && latitude !== null && latitude >= -90 && latitude <= 90
    && longitude !== null && longitude >= -180 && longitude <= 180;
}

export function haversineKilometers(
  origin: Pick<WorldAirport, "latitude_deg" | "longitude_deg">,
  destination: Pick<WorldAirport, "latitude_deg" | "longitude_deg">,
): number | null {
  const lat1 = numberCoordinate(origin.latitude_deg);
  const lon1 = numberCoordinate(origin.longitude_deg);
  const lat2 = numberCoordinate(destination.latitude_deg);
  const lon2 = numberCoordinate(destination.longitude_deg);
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90
    || lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) return null;

  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = toRadians(lat2 - lat1);
  const deltaLongitude = toRadians(lon2 - lon1);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(deltaLongitude / 2) ** 2;
  // Clamp against tiny floating-point overshoots near antipodal points.
  const centralAngle = 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
  return EARTH_RADIUS_KM * centralAngle;
}

export function calculateGreatCircleDistance(
  origin: WorldAirport,
  destination: WorldAirport,
): GreatCircleResult | null {
  if (!isValidAirport(origin) || !isValidAirport(destination)) return null;
  const kilometers = haversineKilometers(origin, destination);
  if (kilometers === null) return null;
  const miles = kilometers / KM_PER_STATUTE_MILE;
  return {
    origin,
    destination,
    kilometers,
    miles,
    nauticalMiles: kilometers / KM_PER_NAUTICAL_MILE,
    roundedMiles: Math.round(miles),
    method: "great-circle",
    source: "OurAirports coordinates",
  };
}

export function formatDistance(value: number, unit: DistanceUnit): string {
  const digits = unit === "mi" ? 0 : 1;
  return value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
