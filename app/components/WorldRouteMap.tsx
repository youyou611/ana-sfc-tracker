"use client";

import SharedWorldRouteMap from "../../../shared/route-map/WorldRouteMap";
import type { RouteMapFlight } from "../../../shared/route-map/types";
import type { FlightLogEx } from "../types";

type Props = { flights: FlightLogEx[]; onSelectFlight: (flight: FlightLogEx) => void };

/** Keeps ANA's local record type and detail modal intact while sharing map rendering. */
export default function WorldRouteMap({ flights, onSelectFlight }: Props) {
  const flightById = new Map(flights.map((flight) => [flight.id, flight]));
  const mapFlights: RouteMapFlight[] = flights.map((flight) => ({
    id: flight.id,
    date: flight.date,
    airline: flight.operatingCarrier && flight.operatingCarrier !== "NH" ? flight.operatingCarrier : "ANA",
    origin: flight.origin,
    destination: flight.destination,
    flightNumber: flight.flightNumber,
  }));

  return <SharedWorldRouteMap
    flights={mapFlights}
    theme="ana"
    title="ANA 路線マップ"
    subtitle="登録した搭乗記録を大圏経路で地図に重ねて振り返ります。"
    onSelectFlight={(flight) => {
      const original = flightById.get(flight.id);
      if (original) onSelectFlight(original);
    }}
  />;
}
