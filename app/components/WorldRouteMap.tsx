"use client";

import type { ReactNode } from "react";
import type { FlightLogEx } from "../types";
import SharedWorldRouteMap, { type WorldRouteMapActions } from "../../shared/route-map/WorldRouteMap";

export type { WorldRouteMapActions };

type WorldRouteMapProps = {
  flights: FlightLogEx[];
  onSelectFlight: (flight: FlightLogEx) => void;
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  is3D?: boolean;
  onChangeIs3D?: (next: boolean) => void;
  showLabels?: boolean;
  onChangeShowLabels?: (next: boolean) => void;
  hideBuiltInHud?: boolean;
  actionsRef?: { current: WorldRouteMapActions | null };
  onStatsChange?: (stats: { airportCount: number; routeCount: number; totalKm: number }) => void;
  onToggleSearchFilter?: () => void;
  isSearchFilterActive?: boolean;
  searchFilterPanel?: ReactNode;
  showRouteList?: boolean;
};

/** Thin ANA adapter. All 2D/3D rendering and interaction lives in the shared map. */
export default function WorldRouteMap({
  flights,
  onSelectFlight,
  title = "路線マップ（SFC Tracker）",
  subtitle = "登録した搭乗記録を大圏経路で地図に重ねて振り返ります。",
  fullScreen = false,
  is3D,
  onChangeIs3D,
  showLabels,
  onChangeShowLabels,
  hideBuiltInHud = false,
  actionsRef,
  onStatsChange,
  onToggleSearchFilter,
  isSearchFilterActive,
  searchFilterPanel,
  showRouteList = false,
}: WorldRouteMapProps) {
  return (
    <SharedWorldRouteMap
      flights={flights.map((flight) => ({
        id: flight.id,
        airline: flight.airline,
        origin: flight.origin,
        destination: flight.destination,
        via: flight.via,
        date: flight.date,
        flightNumber: flight.flightNumber,
        points: flight.pp,
        status: "Actual" as const,
      }))}
      onSelectFlight={(flight) => {
        const original = flights.find((entry) => entry.id === flight.id);
        if (original) onSelectFlight(original);
      }}
      title={title}
      subtitle={subtitle}
      theme="ana"
      fullScreen={fullScreen}
      is3D={is3D}
      onChangeIs3D={onChangeIs3D}
      showLabels={showLabels}
      onChangeShowLabels={onChangeShowLabels}
      hideBuiltInHud={hideBuiltInHud}
      actionsRef={actionsRef}
      onStatsChange={onStatsChange}
      onToggleSearchFilter={onToggleSearchFilter}
      isSearchFilterActive={isSearchFilterActive}
      searchFilterPanel={searchFilterPanel}
      showRouteList={showRouteList}
    />
  );
}
