/** Airline name used for the map's color group; unknown carriers use the gold group. */
export type RouteMapAirline = string;

/**
 * Read-only projection of an app's existing flight record.
 * Callers own filtering (year, carrier, and text search) and provide only visible records.
 */
export interface RouteMapFlight {
  /** Stable source-record ID, used to return selection to the original details screen. */
  id: string;
  /** Flight date in YYYY-MM-DD form. */
  date: string;
  airline: RouteMapAirline;
  /** JAL-owned group flight vs. another oneworld carrier; omitted legacy records default to JAL. */
  flightType?: "jal" | "oneworld";
  /** IATA airport codes from the existing saved record. */
  origin: string;
  destination: string;
  flightNumber?: string | null;
}

export interface RouteMapAirport {
  iata_code: string;
  name: string;
  municipality?: string;
  iso_country?: string;
  latitude_deg: number | string;
  longitude_deg: number | string;
  type?: string;
}

export type RouteMapDistance = {
  kilometers: number;
  nauticalMiles: number;
};
