"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as maplibregl from "maplibre-gl";
import type { MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import airportRows from "../world-airports.json";
import {
  greatCircleDistanceKm,
  greatCirclePathSegments,
  greatCirclePoints,
  isUsableAirport,
  MAP_HEIGHT,
  MAP_WIDTH,
  projectAirport,
} from "./geometry";
import landPathRows from "./natural-earth-land-paths.json";
import type { RouteMapAirport, RouteMapFlight } from "./types";

// MapLibre GL JS v6 needs an explicit worker URL when bundled by Next.js/Turbopack.
// Keep it same-origin and versioned so a stale worker cannot survive dependency updates.
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`);
}

export type WorldRouteMapActions = {
  zoomIn: () => void;
  zoomOut: () => void;
  fitAll: () => void;
  reset: () => void;
  selectRoute: (id: string) => void;
};

export type RouteMapViewPreset = "japan" | "world";

export type WorldRouteMapProps = {
  flights: RouteMapFlight[];
  onSelectFlight: (flight: RouteMapFlight) => void;
  title?: string;
  subtitle?: string;
  theme?: "ana" | "jal" | "neutral";
  /** Optional country/world camera preset. Unset preserves the existing route-fit behavior. */
  viewPreset?: RouteMapViewPreset;
  onChangeViewPreset?: (preset: RouteMapViewPreset) => void;
  /** Enables JAL-specific JAL / oneworld grouping controls. */
  showFlightTypeFilter?: boolean;
  /** Render the dark map viewport directly instead of the inline preview and drawer. */
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

const AIRLINE_COLORS: Record<string, string> = {
  ANA: "#38bdf8",
  JAL: "#f05b62",
  その他: "#edbf55",
};
const LAND_SHAPES = landPathRows as string[];

const AIRPORTS = (airportRows as RouteMapAirport[]).filter(isUsableAirport);
export const AIRPORTS_BY_CODE = new Map<string, RouteMapAirport>(
  AIRPORTS.map((airport) => [airport.iata_code.trim().toLocaleUpperCase("en-US"), airport])
);

const AIRPORT_CODE_BY_ALIAS = new Map<string, string>();
for (const airport of AIRPORTS) {
  AIRPORT_CODE_BY_ALIAS.set(airport.iata_code.trim().toLocaleUpperCase("en-US"), airport.iata_code.trim().toLocaleUpperCase("en-US"));
}

export const JAPANESE_AIRPORT_NAMES: Record<string, string> = {
  HND: "東京(羽田)",
  NRT: "東京(成田)",
  ITM: "大阪(伊丹)",
  KIX: "大阪(関西)",
  UKB: "神戸",
  NGO: "名古屋(中部)",
  CTS: "札幌(新千歳)",
  OKA: "沖縄(那覇)",
  FUK: "福岡",
  ISG: "石垣",
  MMY: "宮古",
  AKJ: "旭川",
  HKD: "函館",
  KUH: "釧路",
  MMB: "女満別",
  OBO: "帯広",
  WKJ: "稚内",
  RIS: "利尻",
  OIR: "奥尻",
  AOJ: "青森",
  ONJ: "大館能代",
  AXT: "秋田",
  SYO: "庄内",
  SDJ: "仙台",
  FKS: "福島",
  KIJ: "新潟",
  HAC: "八丈島",
  TOY: "富山",
  KMQ: "小松",
  NTQ: "能登",
  OKJ: "岡山",
  HIJ: "広島",
  IWK: "岩国",
  UBJ: "山口宇部",
  TTJ: "鳥取",
  YGJ: "米子",
  IWJ: "萩・石見",
  TAK: "高松",
  TKS: "徳島",
  MYJ: "松山",
  KCZ: "高知",
  KKJ: "北九州",
  HSG: "佐賀",
  OIT: "大分",
  KMJ: "熊本",
  NGS: "長崎",
  KMI: "宮崎",
  KOJ: "鹿児島",
  FUJ: "五島福江",
  TSJ: "対馬",
  SHB: "根室中標津",
  MBE: "オホーツク紋別",
  FSZ: "静岡",
  AXJ: "天草",
  KUM: "屋久島",
  IKI: "壱岐",
  TNE: "種子島",
  KKX: "喜界島",
  RNJ: "与論",
  ASJ: "奄美",
  TKN: "徳之島",
  OKE: "沖永良部",
  SIN: "シンガポール",
  HNL: "ホノルル",
  BKK: "バンコク",
  LHR: "ロンドン",
  JFK: "ニューヨーク",
  LAX: "ロサンゼルス",
  SFO: "サンフランシスコ",
  SEA: "シアトル",
  ORD: "シカゴ",
  IAD: "ワシントンD.C.",
  IAH: "ヒューストン",
  YVR: "バンクーバー",
  MEX: "メキシコシティ",
  FRA: "フランクフルト",
  MUC: "ミュンヘン",
  CDG: "パリ",
  BRU: "ブリュッセル",
  VIE: "ウィーン",
  IST: "イスタンブール",
  MXP: "ミラノ",
  ARN: "ストックホルム",
  ICN: "ソウル(仁川)",
  GMP: "ソウル(金浦)",
  TPE: "台北(桃園)",
  TSA: "台北(松山)",
  HKG: "香港",
  PVG: "上海(浦東)",
  SHA: "上海(虹橋)",
  PEK: "北京",
  SGN: "ホーチミン",
  HAN: "ハノイ",
  MNL: "マニラ",
  KUL: "クアラルンプール",
  CGK: "ジャカルタ",
  DEL: "デリー",
  BOM: "ムンバイ",
  SYD: "シドニー",
  PER: "パース",
};

const DOMESTIC_AIRPORT_ALIASES: Record<string, string> = {
  "東京(羽田)": "HND",
  "東京（羽田）": "HND",
  羽田: "HND",
  "東京(成田)": "NRT",
  "東京（成田）": "NRT",
  成田: "NRT",
  "大阪(伊丹)": "ITM",
  "大阪（伊丹）": "ITM",
  伊丹: "ITM",
  "大阪(関西)": "KIX",
  "大阪（関西）": "KIX",
  関西: "KIX",
  神戸: "UKB",
  "名古屋(中部)": "NGO",
  "名古屋（中部）": "NGO",
  中部: "NGO",
  "札幌(新千歳)": "CTS",
  "札幌（新千歳）": "CTS",
  新千歳: "CTS",
  "沖縄(那覇)": "OKA",
  "沖縄（那覇）": "OKA",
  那覇: "OKA",
  福岡: "FUK",
  石垣: "ISG",
  宮古: "MMY",
  旭川: "AKJ",
  函館: "HKD",
  釧路: "KUH",
  女満別: "MMB",
  帯広: "OBO",
  稚内: "WKJ",
  利尻: "RIS",
  奥尻: "OIR",
  青森: "AOJ",
  大館能代: "ONJ",
  秋田: "AXT",
  庄内: "SYO",
  仙台: "SDJ",
  福島: "FKS",
  新潟: "KIJ",
  八丈島: "HAC",
  富山: "TOY",
  小松: "KMQ",
  能登: "NTQ",
  岡山: "OKJ",
  広島: "HIJ",
  岩国: "IWK",
  山口宇部: "UBJ",
  鳥取: "TTJ",
  米子: "YGJ",
  "萩・石見": "IWJ",
  高松: "TAK",
  徳島: "TKS",
  松山: "MYJ",
  高知: "KCZ",
  北九州: "KKJ",
  佐賀: "HSG",
  大分: "OIT",
  熊本: "KMJ",
  長崎: "NGS",
  宮崎: "KMI",
  鹿児島: "KOJ",
  五島福江: "FUJ",
  対馬: "TSJ",
  根室中標津: "SHB",
  中標津: "SHB",
  オホーツク紋別: "MBE",
  紋別: "MBE",
  静岡: "FSZ",
  天草: "AXJ",
  屋久島: "KUM",
  壱岐: "IKI",
  種子島: "TNE",
  喜界島: "KKX",
  与論: "RNJ",
  奄美: "ASJ",
  徳之島: "TKN",
  沖永良部: "OKE",
  シンガポール: "SIN",
};

for (const [alias, code] of Object.entries(DOMESTIC_AIRPORT_ALIASES)) {
  AIRPORT_CODE_BY_ALIAS.set(alias.trim().toLocaleLowerCase("ja"), code);
}
AIRPORT_CODE_BY_ALIAS.set("SINGAPORE", "SIN");
AIRPORT_CODE_BY_ALIAS.set("SINGAPORE CHANGI", "SIN");

export function resolveAirportCode(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLocaleUpperCase("en-US");
  if (AIRPORT_CODE_BY_ALIAS.has(normalized)) return AIRPORT_CODE_BY_ALIAS.get(normalized)!;
  const japanese = trimmed.toLocaleLowerCase("ja");
  if (AIRPORT_CODE_BY_ALIAS.has(japanese)) return AIRPORT_CODE_BY_ALIAS.get(japanese)!;
  // Also extract 3-letter IATA code if formatted like "HND - 東京(羽田)" or "東京 (HND)"
  const match = normalized.match(/\b([A-Z]{3})\b/);
  if (match && AIRPORTS_BY_CODE.has(match[1])) return match[1];
  return normalized;
}

function validAirportCoordinates(airport: RouteMapAirport | undefined): airport is RouteMapAirport {
  if (!airport) return false;
  const lat = Number(airport.latitude_deg);
  const lng = Number(airport.longitude_deg);
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
    && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function getAirportDisplayName(code: string, airport?: RouteMapAirport): string {
  if (JAPANESE_AIRPORT_NAMES[code]) return JAPANESE_AIRPORT_NAMES[code];
  if (airport?.municipality) return airport.municipality;
  if (airport?.name) return airport.name;
  return code;
}

function airlineGroup(airline: string): "ANA" | "JAL" | "その他" {
  const code = airline.trim().toLocaleUpperCase("en-US");
  if (code === "ANA" || code === "NH") return "ANA";
  if (code === "JAL" || code === "JL") return "JAL";
  return "その他";
}

function colorFor(airline: string): string {
  return AIRLINE_COLORS[airlineGroup(airline)];
}

function airlineLabel(airline: string): string {
  return airlineGroup(airline);
}

/** Smart label offset in 2D preview so nearby Japanese hubs don't collide */
function get2DLabelOffset(
  code: string,
  invZoom: number
): { dx: number; dy: number; anchor: "start" | "middle" | "end" } {
  switch (code) {
    case "HND":
      return { dx: 7 * invZoom, dy: 4 * invZoom, anchor: "start" };
    case "NRT":
      return { dx: 7 * invZoom, dy: -4 * invZoom, anchor: "start" };
    case "ITM":
      return { dx: -7 * invZoom, dy: -4 * invZoom, anchor: "end" };
    case "KIX":
      return { dx: -7 * invZoom, dy: 8 * invZoom, anchor: "end" };
    case "UKB":
      return { dx: -7 * invZoom, dy: 2 * invZoom, anchor: "end" };
    case "NGO":
      return { dx: 0, dy: -7 * invZoom, anchor: "middle" };
    case "FUK":
      return { dx: -7 * invZoom, dy: -3 * invZoom, anchor: "end" };
    case "OKA":
      return { dx: 7 * invZoom, dy: 3 * invZoom, anchor: "start" };
    case "ISG":
      return { dx: -7 * invZoom, dy: 4 * invZoom, anchor: "end" };
    case "MMY":
      return { dx: 7 * invZoom, dy: 8 * invZoom, anchor: "start" };
    case "CTS":
      return { dx: 7 * invZoom, dy: 3 * invZoom, anchor: "start" };
    default:
      return { dx: 6.5 * invZoom, dy: -4.5 * invZoom, anchor: "start" };
  }
}

/** Split great-circle coordinates at the ±180° antimeridian for GeoJSON MultiLineString */
function greatCircleGeoJsonSegments(
  origin: RouteMapAirport,
  destination: RouteMapAirport,
  steps = 72
): [number, number][][] {
  const pts = greatCirclePoints(origin, destination, steps);
  const segments: [number, number][][] = [];
  let current: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const next = pts[i];
    const dLon = next[0] - prev[0];
    if (Math.abs(dLon) > 180) {
      const wrappedNextLon = dLon > 0 ? next[0] - 360 : next[0] + 360;
      const edgeLon = dLon > 0 ? -180 : 180;
      const oppositeLon = dLon > 0 ? 180 : -180;
      const denom = wrappedNextLon - prev[0];
      const t = denom === 0 ? 0.5 : (edgeLon - prev[0]) / denom;
      const crossLat = prev[1] + (next[1] - prev[1]) * t;
      current.push([edgeLon, crossLat]);
      segments.push(current);
      current = [[oppositeLon, crossLat], next];
    } else {
      current.push(next);
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

/** OpenFreeMap Liberty vector style. MapLibre applies the globe/mercator projection after loading. */
function createAviationMapStyle(): string {
  return "https://tiles.openfreemap.org/styles/liberty";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function WorldRouteMap({
  flights,
  onSelectFlight,
  title = "路線マップ（SFC Tracker）",
  subtitle = "登録した搭乗記録を大圏経路で地図に重ねて振り返ります。",
  theme = "ana",
  viewPreset,
  onChangeViewPreset,
  showFlightTypeFilter = false,
  fullScreen = false,
  is3D: controlledIs3D,
  onChangeIs3D,
  actionsRef,
  onStatsChange,
  showRouteList = false,
}: WorldRouteMapProps) {
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null);
  const [selectedAirportCode, setSelectedAirportCode] = useState<string | null>(null);
  const [flightTypeFilter, setFlightTypeFilter] = useState<"jal" | "oneworld">("jal");
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Default to 2D on open, or controlled is3D if passed
  const [internalIs3D, setInternalIs3D] = useState<boolean>(false);
  const is3D = controlledIs3D !== undefined ? controlledIs3D : internalIs3D;
  const setIs3D = useCallback(
    (next: boolean) => {
      setInternalIs3D(next);
      onChangeIs3D?.(next);
    },
    [onChangeIs3D]
  );

  // MapLibre refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const visibleFlights = useMemo(
    () =>
      showFlightTypeFilter
        ? flights.filter((flight) =>
            flightTypeFilter === "oneworld"
              ? flight.flightType === "oneworld"
              : flight.flightType !== "oneworld"
          )
        : flights,
    [flightTypeFilter, flights, showFlightTypeFilter]
  );

  // Individual flight segments resolved to airports
  const routes = useMemo(
    () =>
      visibleFlights.flatMap((flight) => {
        const originCode = resolveAirportCode(flight.origin);
        const destinationCode = resolveAirportCode(flight.destination);
        const origin = AIRPORTS_BY_CODE.get(originCode.trim().toLocaleUpperCase("en-US"));
        const destination = AIRPORTS_BY_CODE.get(destinationCode.trim().toLocaleUpperCase("en-US"));
        if (!validAirportCoordinates(origin) || !validAirportCoordinates(destination)
          || origin.iata_code === destination.iata_code) return [];
        const points = greatCirclePoints(origin, destination, 72);
        if (points.length < 2 || points.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) return [];
        const midpoint = points[Math.floor(points.length / 2)];
        const kilometers = greatCircleDistanceKm(origin, destination);
        const miles = Math.round(kilometers * 0.621371);
        const codes = [origin.iata_code, destination.iata_code].sort();
        const pairKey = `${codes[0]}-${codes[1]}`;
        return [
          {
            flight,
            pairKey,
            origin,
            destination,
            kilometers,
            miles,
            paths: greatCirclePathSegments(origin, destination),
            geoSegments: greatCircleGeoJsonSegments(origin, destination, 72),
            midpointCoord: midpoint, // [lon, lat]
            midpoint: {
              x: ((midpoint[0] + 180) / 360) * MAP_WIDTH,
              y: ((82 - midpoint[1]) / 164) * MAP_HEIGHT,
            },
          },
        ];
      }),
    [visibleFlights]
  );

  // Unique route pairs (e.g., HND ⇄ OKA) with aggregated flight count & total PP
  const uniqueRoutes = useMemo(() => {
    const byPair = new Map<
      string,
      (typeof routes)[number] & {
        count: number;
        totalPp: number;
        flightsOnRoute: RouteMapFlight[];
      }
    >();
    for (const route of routes) {
      const existing = byPair.get(route.pairKey);
      const pp = Number(route.flight.points ?? 0);
      if (existing) {
        existing.count += 1;
        existing.totalPp += pp;
        existing.flightsOnRoute.push(route.flight);
      } else {
        byPair.set(route.pairKey, {
          ...route,
          count: 1,
          totalPp: pp,
          flightsOnRoute: [route.flight],
        });
      }
    }
    return [...byPair.values()];
  }, [routes]);

  // Unique visited airports with aggregated stats
  const uniqueAirports = useMemo(() => {
    const byCode = new Map<
      string,
      {
        airport: RouteMapAirport;
        flightCount: number;
        totalPp: number;
        connectedPairs: Set<string>;
      }
    >();
    for (const route of routes) {
      const pp = Number(route.flight.points ?? 0);
      for (const ap of [route.origin, route.destination]) {
        const current = byCode.get(ap.iata_code);
        if (current) {
          current.flightCount += 1;
          current.totalPp += pp;
          current.connectedPairs.add(route.pairKey);
        } else {
          byCode.set(ap.iata_code, {
            airport: ap,
            flightCount: 1,
            totalPp: pp,
            connectedPairs: new Set([route.pairKey]),
          });
        }
      }
    }
    // Also include any resolved via airport from visibleFlights if present
    for (const flight of visibleFlights) {
      const viaCode = resolveAirportCode(flight.via).trim().toLocaleUpperCase("en-US");
      if (viaCode && !byCode.has(viaCode)) {
        const viaAirport = AIRPORTS_BY_CODE.get(viaCode);
        if (validAirportCoordinates(viaAirport)) {
          byCode.set(viaCode, {
            airport: viaAirport,
            flightCount: 1,
            totalPp: Number(flight.points ?? 0),
            connectedPairs: new Set(),
          });
        }
      }
    }
    return [...byCode.values()];
  }, [routes, visibleFlights]);

  const totalKm = useMemo(
    () => routes.reduce((sum, route) => sum + route.kilometers, 0),
    [routes]
  );
  const totalMiles = useMemo(() => Math.round(totalKm * 0.621371), [totalKm]);

  useEffect(() => {
    onStatsChange?.({
      airportCount: uniqueAirports.length,
      routeCount: uniqueRoutes.length,
      totalKm,
    });
  }, [onStatsChange, totalKm, uniqueAirports.length, uniqueRoutes.length]);

  // Automatic 2D preview viewport calculation (purely derived from routes so the inline 2D map always frames all routes cleanly)
  const previewTransform = useMemo(() => {
    const japanPoint = {
      x: ((139.7 + 180) / 360) * MAP_WIDTH,
      y: ((82 - 35.7) / 164) * MAP_HEIGHT,
    };
    if (viewPreset) {
      const center = viewPreset === "japan"
        ? japanPoint
        : { x: MAP_WIDTH / 2, y: ((82 - 20) / 164) * MAP_HEIGHT };
      const z = viewPreset === "japan" ? 2.4 : 0.95;
      return {
        zoom: z,
        panX: MAP_WIDTH / 2 - center.x * z,
        panY: MAP_HEIGHT / 2 - center.y * z,
      };
    }
    if (routes.length === 0) {
      const z = 2.4;
      return {
        zoom: z,
        panX: MAP_WIDTH / 2 - japanPoint.x * z,
        panY: MAP_HEIGHT / 2 - japanPoint.y * z,
      };
    }
    const points = routes.flatMap((r) => [
      projectAirport(r.origin),
      projectAirport(r.destination),
      r.midpoint,
    ]);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = Math.max(48, maxX - minX);
    const spanY = Math.max(36, maxY - minY);
    const z = Math.min(4.0, Math.max(1.15, Math.min(MAP_WIDTH / (spanX * 1.65), MAP_HEIGHT / (spanY * 1.75))));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      zoom: z,
      panX: MAP_WIDTH / 2 - cx * z,
      panY: MAP_HEIGHT / 2 - cy * z,
    };
  }, [routes, viewPreset]);

  const invPreviewZoom = 1 / Math.max(0.65, previewTransform.zoom);

  const selectedRouteGroup = useMemo(
    () => uniqueRoutes.find((r) => r.pairKey === selectedPairKey) ?? null,
    [selectedPairKey, uniqueRoutes]
  );

  const selectedAirportInfo = useMemo(
    () => uniqueAirports.find((a) => a.airport.iata_code === selectedAirportCode) ?? null,
    [selectedAirportCode, uniqueAirports]
  );

  const airportConnectedRoutes = useMemo(
    () =>
      selectedAirportCode
        ? uniqueRoutes.filter(
            (r) =>
              r.origin.iata_code === selectedAirportCode ||
              r.destination.iata_code === selectedAirportCode
          )
        : [],
    [selectedAirportCode, uniqueRoutes]
  );

  // Build GeoJSON FeatureCollections for MapLibre GL
  const routesGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
        features: uniqueRoutes.flatMap((uRoute) => {
        const validSegments = uRoute.geoSegments.filter((segment) => segment.length >= 2
          && segment.every(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat)
            && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90));
        if (validSegments.length === 0) return [];
        const originName = getAirportDisplayName(uRoute.origin.iata_code, uRoute.origin);
        const destName = getAirportDisplayName(uRoute.destination.iata_code, uRoute.destination);
        return [{
          type: "Feature" as const,
          properties: {
            pairKey: uRoute.pairKey,
            originCode: uRoute.origin.iata_code,
            originName,
            destCode: uRoute.destination.iata_code,
            destName,
            distanceKm: Math.round(uRoute.kilometers),
            distanceMiles: uRoute.miles,
            flightCount: uRoute.count,
            totalPp: uRoute.totalPp,
            midLon: uRoute.midpointCoord[0],
            midLat: uRoute.midpointCoord[1],
            selected: selectedPairKey === uRoute.pairKey,
          },
          geometry: {
            type: "MultiLineString" as const,
            coordinates: validSegments,
          },
        }];
      }),
    }),
    [selectedPairKey, uniqueRoutes]
  );

  const airportsGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
        features: uniqueAirports.flatMap((item) => {
        if (!validAirportCoordinates(item.airport)) return [];
        const code = item.airport.iata_code;
        const displayName = getAirportDisplayName(code, item.airport);
        return [{
          type: "Feature" as const,
          properties: {
            code,
            name: displayName,
            flightCount: item.flightCount,
            routeCount: item.connectedPairs.size,
            totalPp: item.totalPp,
            selected: selectedAirportCode === code,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [
              Number(item.airport.longitude_deg),
              Number(item.airport.latitude_deg),
            ],
          },
        }];
      }),
    }),
    [selectedAirportCode, uniqueAirports]
  );

  // Fit all routes on the MapLibre instance
  const fitMapLibreBounds = useCallback(
    (map: maplibregl.Map, animate = true, preset: RouteMapViewPreset | null = viewPreset ?? null) => {
      if (preset) {
        map.easeTo({
          center: preset === "japan" ? [138.0, 36.0] : [0, 20],
          zoom: preset === "japan" ? (is3D ? 2.8 : 4.6) : (is3D ? 1.15 : 1.1),
          pitch: is3D ? 15 : 0,
          bearing: 0,
          duration: animate ? 650 : 0,
        });
        return;
      }
      const usableAirports = uniqueAirports.filter((item) => validAirportCoordinates(item.airport));
      if (usableAirports.length === 0) {
        map.easeTo({
          center: [138.0, 35.6],
          zoom: is3D ? 2.2 : 4.2,
          pitch: is3D ? 15 : 0,
          bearing: 0,
          duration: animate ? 650 : 0,
        });
        return;
      }
      if (is3D) {
        // Center globe around the centroid of visited airports
        const lons = usableAirports.map((a) => Number(a.airport.longitude_deg));
        const lats = usableAirports.map((a) => Number(a.airport.latitude_deg));
        const avgLon = lons.reduce((s, v) => s + v, 0) / lons.length;
        const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
        const maxSpan = Math.max(
          Math.max(...lons) - Math.min(...lons),
          Math.max(...lats) - Math.min(...lats)
        );
        const targetZoom = maxSpan > 90 ? 1.65 : maxSpan > 40 ? 2.3 : 3.2;
        map.easeTo({
          center: [avgLon, avgLat],
          zoom: targetZoom,
          pitch: 15,
          bearing: 0,
          duration: animate ? 700 : 0,
        });
        return;
      }
      const bounds = new maplibregl.LngLatBounds();
      // Frame only the actual origin/destination coordinates for all valid routes.
      for (const route of routes) {
        for (const airport of [route.origin, route.destination]) {
          if (!validAirportCoordinates(airport)) continue;
          bounds.extend([Number(airport.longitude_deg), Number(airport.latitude_deg)]);
        }
      }
      if (bounds.isEmpty()) return;
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 6.2,
        duration: animate ? 1000 : 0,
      });
    },
    [is3D, routes, uniqueAirports, viewPreset]
  );

  // Switch between 2D Mercator and 3D Globe on MapLibre GL
  const handleSwitchProjection = useCallback(
    (next3D: boolean) => {
      setIs3D(next3D);
      const map = mapInstanceRef.current;
      if (!map) return;
      try {
        map.setProjection({ type: next3D ? "globe" : "mercator" });
        if (next3D) {
          const currentZoom = map.getZoom();
          map.easeTo({
            zoom: Math.min(currentZoom, 3.1),
            pitch: 15,
            duration: 650,
          });
        } else {
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 650,
          });
        }
      } catch {
        // Ignore if style is still loading
      }
    },
    [setIs3D]
  );

  // Show MapLibre Popup for a Route
  const showRoutePopup = useCallback(
    (pairKey: string, lngLat?: [number, number]) => {
      setSelectedPairKey(pairKey);
      setSelectedAirportCode(null);
      const map = mapInstanceRef.current;
      const uRoute = uniqueRoutes.find((r) => r.pairKey === pairKey);
      if (!map || !uRoute) return;

      const coords: [number, number] = lngLat ?? uRoute.midpointCoord;
      const originName = getAirportDisplayName(uRoute.origin.iata_code, uRoute.origin);
      const destName = getAirportDisplayName(uRoute.destination.iata_code, uRoute.destination);
      const kmStr = Math.round(uRoute.kilometers).toLocaleString("ja-JP");
      const milesStr = uRoute.miles.toLocaleString("ja-JP");
      const ppStr = uRoute.totalPp.toLocaleString("ja-JP");

      popupRef.current?.remove();
      const popupHtml = `
        <div class="sfc-maplibre-popup">
          <div class="sfc-maplibre-popup-badge">FLIGHT ROUTE</div>
          <div class="sfc-maplibre-popup-title">${escapeHtml(uRoute.origin.iata_code)} <span>⇄</span> ${escapeHtml(uRoute.destination.iata_code)}</div>
          <div class="sfc-maplibre-popup-sub">${escapeHtml(originName)} ⇄ ${escapeHtml(destName)}</div>
          <div class="sfc-maplibre-popup-grid">
            <div>
              <small>区間距離</small>
              <strong>${milesStr} マイル <span class="sfc-maplibre-popup-unit">(${kmStr} km)</span></strong>
            </div>
            <div>
              <small>搭乗回数・獲得PP実績</small>
              <strong>${uRoute.count} 回 · <span class="sfc-maplibre-popup-pp">${ppStr} PP</span></strong>
            </div>
          </div>
        </div>
      `;
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
        offset: 12,
      })
        .setLngLat(coords)
        .setHTML(popupHtml)
        .addTo(map);
    },
    [uniqueRoutes]
  );

  // Show MapLibre Popup for an Airport
  const showAirportPopup = useCallback(
    (code: string) => {
      setSelectedAirportCode(code);
      setSelectedPairKey(null);
      const map = mapInstanceRef.current;
      const info = uniqueAirports.find((a) => a.airport.iata_code === code);
      if (!map || !info) return;

      const coords: [number, number] = [
        Number(info.airport.longitude_deg),
        Number(info.airport.latitude_deg),
      ];
      const displayName = getAirportDisplayName(code, info.airport);
      const ppStr = info.totalPp.toLocaleString("ja-JP");

      popupRef.current?.remove();
      const popupHtml = `
        <div class="sfc-maplibre-popup">
          <div class="sfc-maplibre-popup-badge">AIRPORT PIN</div>
          <div class="sfc-maplibre-popup-title">${escapeHtml(code)} <span class="sfc-maplibre-popup-city">${escapeHtml(displayName)}</span></div>
          <div class="sfc-maplibre-popup-sub">${escapeHtml(info.airport.name)}</div>
          <div class="sfc-maplibre-popup-grid">
            <div>
              <small>発着回数 / 接続路線</small>
              <strong>${info.flightCount} 回 / ${info.connectedPairs.size} 路線</strong>
            </div>
            <div>
              <small>関連フライト累計PP</small>
              <strong class="sfc-maplibre-popup-pp">${ppStr} PP</strong>
            </div>
          </div>
        </div>
      `;
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "290px",
        offset: 14,
      })
        .setLngLat(coords)
        .setHTML(popupHtml)
        .addTo(map);
    },
    [uniqueAirports]
  );

  // Initialize MapLibre GL map when fullscreen modal opens
  const shouldRenderInteractive = fullScreen || isMapOpen;

  useEffect(() => {
    if (!shouldRenderInteractive || !mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createAviationMapStyle(),
      center: [138.0, 35.6],
      zoom: is3D ? 2.3 : 4.2,
      pitch: is3D ? 15 : 0,
      bearing: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    mapInstanceRef.current = map;

    let disposed = false;
    let routeLayerEventsAttached = false;

    const addLayersWhenStyleReady = () => {
      if (disposed || !mapInstanceRef.current || mapInstanceRef.current !== map || !map.isStyleLoaded()) return;

      // Ensure projection matches current toggle, then idempotently add data sources/layers.
      try {
        map.setProjection({ type: is3D ? "globe" : "mercator" });
      } catch {
        // A style may still be finalizing after a styledata event; retry on the next style event.
        return;
      }

      if (!map.getSource("sfc-routes")) {
        map.addSource("sfc-routes", {
          type: "geojson",
          data: routesGeoJson,
        });
      } else {
        (map.getSource("sfc-routes") as maplibregl.GeoJSONSource).setData(routesGeoJson);
      }

      if (!map.getLayer("sfc-routes-glow")) {
        map.addLayer({
          id: "sfc-routes-glow",
          type: "line",
          source: "sfc-routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#00d4ff",
            "line-width": 7,
            "line-blur": 3,
            "line-opacity": 0.22,
          },
        });
      }

      if (!map.getLayer("sfc-routes-core")) {
        map.addLayer({
          id: "sfc-routes-core",
          type: "line",
          source: "sfc-routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["case", ["boolean", ["get", "selected"], false], "#ffffff", "#00d4ff"],
            "line-width": ["case", ["boolean", ["get", "selected"], false], 4, 3],
            "line-opacity": 0.8,
          },
        });
      }

      if (!map.getLayer("sfc-routes-hit")) {
        map.addLayer({
          id: "sfc-routes-hit",
          type: "line",
          source: "sfc-routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#00d4ff", "line-width": 24, "line-opacity": 0.01 },
        });
      }

      if (!map.getSource("sfc-airports")) {
        map.addSource("sfc-airports", { type: "geojson", data: airportsGeoJson });
      } else {
        (map.getSource("sfc-airports") as maplibregl.GeoJSONSource).setData(airportsGeoJson);
      }

      if (!map.getLayer("sfc-airports-glow")) map.addLayer({
        id: "sfc-airports-glow",
        type: "circle",
        source: "sfc-airports",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["get", "selected"], false],
            15,
            10,
          ],
          "circle-color": "#38bdf8",
          "circle-opacity": [
            "case",
            ["boolean", ["get", "selected"], false],
            0.52,
            0.3,
          ],
          "circle-blur": 0.35,
        },
      });

      if (!map.getLayer("sfc-airports-pin")) map.addLayer({
        id: "sfc-airports-pin",
        type: "circle",
        source: "sfc-airports",
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["get", "selected"], false],
            6.8,
            5.2,
          ],
          "circle-color": [
            "case",
            ["boolean", ["get", "selected"], false],
            "#38bdf8",
            "#ffffff",
          ],
          "circle-stroke-width": 2.2,
          "circle-stroke-color": "#0284c7",
        },
      });

      if (!map.getLayer("sfc-airports-label")) map.addLayer({
        id: "sfc-airports-label",
        type: "symbol",
        source: "sfc-airports",
        layout: {
          "text-field": ["get", "code"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-offset": [0, -1.2],
          "text-anchor": "bottom",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#040d1a",
          "text-halo-width": 2.2,
        },
      });

      if (!map.getLayer("sfc-airports-hit")) map.addLayer({
        id: "sfc-airports-hit",
        type: "circle",
        source: "sfc-airports",
        paint: {
          "circle-radius": 18,
          "circle-color": "#ffffff",
          "circle-opacity": 0.01,
        },
      });

      if (!routeLayerEventsAttached) {
        routeLayerEventsAttached = true;
        for (const layerId of ["sfc-routes-hit", "sfc-airports-hit"]) {
          map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
        }

        // Click on Airport Pin (takes priority over route line)
        map.on("click", "sfc-airports-hit", (e: MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          const code = feature?.properties?.code as string | undefined;
          if (code) {
            e.originalEvent.stopPropagation();
            showAirportPopup(code);
          }
        });

        // Click on Route Line
        map.on("click", "sfc-routes-hit", (e: MapLayerMouseEvent) => {
          // Check if an airport pin was also under the click point
          const airportFeatures = map.queryRenderedFeatures(e.point, {
            layers: ["sfc-airports-hit"],
          });
          if (airportFeatures.length > 0) return;

          const feature = e.features?.[0];
          const pairKey = feature?.properties?.pairKey as string | undefined;
          if (pairKey) {
            showRoutePopup(pairKey, [e.lngLat.lng, e.lngLat.lat]);
          }
        });
      }

      // Fit all valid routes once each time the style becomes ready.
      fitMapLibreBounds(map, false);
    };

    // `load` covers the initial style; `styledata` also handles cached/already-loaded styles.
    map.on("load", addLayersWhenStyleReady);
    map.on("styledata", addLayersWhenStyleReady);
    if (map.isStyleLoaded()) addLayersWhenStyleReady();

    return () => {
      disposed = true;
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
    };
    // Only re-create map when modal opens/closes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRenderInteractive]);

  // Keep sources synchronized even when data changes before style initialization completes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    let disposed = false;
    const syncSources = () => {
      if (disposed || !mapInstanceRef.current || mapInstanceRef.current !== map || !map.isStyleLoaded()) return;
      const routesSrc = map.getSource("sfc-routes") as maplibregl.GeoJSONSource | undefined;
      routesSrc?.setData(routesGeoJson);
      const airportsSrc = map.getSource("sfc-airports") as maplibregl.GeoJSONSource | undefined;
      airportsSrc?.setData(airportsGeoJson);
      if (routesGeoJson.features.length > 0) fitMapLibreBounds(map, true);
    };
    const onReady = () => syncSources();
    map.on("load", onReady);
    map.on("styledata", onReady);
    if (map.isStyleLoaded()) syncSources();
    return () => {
      disposed = true;
      map.off("load", onReady);
      map.off("styledata", onReady);
    };
  }, [airportsGeoJson, fitMapLibreBounds, routesGeoJson]);

  // Expose imperative actions if actionsRef is provided
  useEffect(() => {
    if (!actionsRef) return;
    actionsRef.current = {
      zoomIn: () => mapInstanceRef.current?.zoomIn({ duration: 250 }),
      zoomOut: () => mapInstanceRef.current?.zoomOut({ duration: 250 }),
      fitAll: () => {
        if (mapInstanceRef.current) fitMapLibreBounds(mapInstanceRef.current, true, null);
      },
      reset: () => {
        setSelectedPairKey(null);
        setSelectedAirportCode(null);
        popupRef.current?.remove();
        if (mapInstanceRef.current) fitMapLibreBounds(mapInstanceRef.current, true);
      },
      selectRoute: (flightId: string) => {
        const found = routes.find((r) => r.flight.id === flightId);
        if (found) {
          setIsMapOpen(true);
          setTimeout(() => showRoutePopup(found.pairKey), 150);
        }
      },
    };
    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef, fitMapLibreBounds, routes, showRoutePopup]);

  useEffect(() => {
    if (!isMapOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMapOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMapOpen]);

  const unsupportedFlights = useMemo(() => {
    const routedIds = new Set(routes.map((route) => route.flight.id));
    return visibleFlights.filter((flight) => !routedIds.has(flight.id));
  }, [routes, visibleFlights]);

  // Fullscreen Interactive 2D/3D MapLibre Modal
  const interactiveMapViewport = (
    <div
      className={`shared-route-map-fullscreen${fullScreen ? " shared-route-map-standalone" : ""}`}
      role={fullScreen ? "region" : "dialog"}
      aria-modal={fullScreen ? undefined : true}
      aria-label={`${title} 2D/3Dインタラクティブマップ`}
    >
      {/* MapLibre GL JS Canvas Container */}
      <div ref={mapContainerRef} className="shared-route-map-fullscreen-viewport" />

      {/* Top-Left Brand & Stats Badge */}
      <div className="shared-hud-top-left">
        <div className="shared-glass-card shared-brand-badge">
          <span className="shared-badge-dot" />
          <div>
            <span className="shared-badge-overline">INTERACTIVE ROUTE MAP</span>
            <h1 className="shared-badge-title">{title}</h1>
          </div>
          <div className="shared-badge-divider" />
          <div className="shared-badge-stats">
            <span>{visibleFlights.length} 回</span>
            <span className="shared-badge-stat-dot">·</span>
            <span>{uniqueRoutes.length} 路線</span>
            <span className="shared-badge-stat-dot">·</span>
            <span>{uniqueAirports.length} 空港</span>
          </div>
        </div>
      </div>

      {/* Top-Center: Japan/World camera preset and 2D/3D projection switchers */}
      <div className="shared-hud-mode-switcher">
        {onChangeViewPreset && (
          <div className="shared-glass-segmented" role="group" aria-label="地図の表示範囲">
            <button
              type="button"
              className={viewPreset === "japan" ? "is-active" : ""}
              aria-pressed={viewPreset === "japan"}
              onClick={() => onChangeViewPreset("japan")}
            >
              日本
            </button>
            <button
              type="button"
              className={viewPreset === "world" ? "is-active" : ""}
              aria-pressed={viewPreset === "world"}
              onClick={() => onChangeViewPreset("world")}
            >
              世界
            </button>
          </div>
        )}
        <div
          className="shared-glass-segmented"
          role="group"
          aria-label="2D地図と3D地球儀の切り替え"
        >
          <button
            type="button"
            className={!is3D ? "is-active" : ""}
            aria-pressed={!is3D}
            onClick={() => handleSwitchProjection(false)}
          >
            2D地図
          </button>
          <button
            type="button"
            className={is3D ? "is-active" : ""}
            aria-pressed={is3D}
            onClick={() => handleSwitchProjection(true)}
          >
            3D地球儀
          </button>
        </div>
      </div>

      {/* Top-Right Controls: Zoom / Fit All / Close */}
      <div className="shared-hud-top-right">
        <div className="shared-glass-group">
          <button
            type="button"
            className="shared-glass-btn"
            aria-label="拡大"
            title="拡大"
            onClick={() => mapInstanceRef.current?.zoomIn({ duration: 250 })}
          >
            ＋
          </button>
          <button
            type="button"
            className="shared-glass-btn"
            aria-label="縮小"
            title="縮小"
            onClick={() => mapInstanceRef.current?.zoomOut({ duration: 250 })}
          >
            −
          </button>
        </div>
        <button
          type="button"
          className="shared-glass-btn"
          aria-label="全路線を表示"
          title="全路線にフィット"
          onClick={() => {
            if (mapInstanceRef.current) fitMapLibreBounds(mapInstanceRef.current, true, null);
          }}
        >
          ◎
        </button>
        {!fullScreen && (
          <button
            type="button"
            className="shared-glass-btn shared-btn-close"
            aria-label="マップを閉じる"
            title="閉じる"
            onClick={() => setIsMapOpen(false)}
          >
            ✕
          </button>
        )}
      </div>

      {/* Bottom Hint */}
      {!selectedRouteGroup && !selectedAirportInfo && (
        <div className="shared-hud-bottom-center">
          <div className="shared-glass-hint">
            <span>
              路線または空港ピンをタップで区間・距離（マイル/km）・搭乗実績を表示
            </span>
          </div>
        </div>
      )}

      {/* Bottom Detail Sheet when a Route is selected */}
      {selectedRouteGroup && (
        <section className="shared-map-detail-sheet" aria-label="選択した路線の詳細">
          <div className="shared-map-detail-heading">
            <div>
              <span>選択した区間（大圏航路）</span>
              <strong>
                { getAirportDisplayName(selectedRouteGroup.origin.iata_code, selectedRouteGroup.origin) } ⇄{" "}
                { getAirportDisplayName(selectedRouteGroup.destination.iata_code, selectedRouteGroup.destination) }
              </strong>
            </div>
            <button
              type="button"
              aria-label="詳細を閉じる"
              onClick={() => {
                setSelectedPairKey(null);
                popupRef.current?.remove();
              }}
            >
              ✕
            </button>
          </div>

          <p className="shared-map-detail-route">
            {selectedRouteGroup.origin.iata_code} <span>⇄</span> {selectedRouteGroup.destination.iata_code}
          </p>

          <div className="shared-map-detail-stats">
            <span>
              <small>区間距離（マイル / km）</small>
              <strong>
                {selectedRouteGroup.miles.toLocaleString("ja-JP")} マイル（約
                {Math.round(selectedRouteGroup.kilometers).toLocaleString("ja-JP")} km）
              </strong>
            </span>
            <span>
              <small>搭乗回数・獲得PP実績</small>
              <strong>
                {selectedRouteGroup.count.toLocaleString("ja-JP")} 回 ·{" "}
                {selectedRouteGroup.totalPp.toLocaleString("ja-JP")} PP
              </strong>
            </span>
          </div>

          <div className="shared-map-airport-routes">
            <span>この区間の搭乗履歴（最新3件）</span>
            {selectedRouteGroup.flightsOnRoute.slice(0, 3).map((fl) => (
              <button
                type="button"
                key={fl.id}
                onClick={() => {
                  setIsMapOpen(false);
                  onSelectFlight(fl);
                }}
              >
                {fl.origin} → {fl.destination}（{Number(fl.points ?? 0).toLocaleString("ja-JP")} PP）
                <small>
                  {fl.date} · {fl.flightNumber || airlineLabel(fl.airline)} · タップで詳細を開く ↗
                </small>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Detail Sheet when an Airport Pin is selected */}
      {selectedAirportInfo && (
        <section className="shared-map-detail-sheet" aria-label="選択した空港の詳細">
          <div className="shared-map-detail-heading">
            <div>
              <span>選択した空港ピン</span>
              <strong>
                {selectedAirportInfo.airport.iata_code} ·{" "}
                {getAirportDisplayName(
                  selectedAirportInfo.airport.iata_code,
                  selectedAirportInfo.airport
                )}
              </strong>
            </div>
            <button
              type="button"
              aria-label="詳細を閉じる"
              onClick={() => {
                setSelectedAirportCode(null);
                popupRef.current?.remove();
              }}
            >
              ✕
            </button>
          </div>

          <div className="shared-map-detail-stats">
            <span>
              <small>発着回数 / 接続路線数</small>
              <strong>
                {selectedAirportInfo.flightCount} 回 / {airportConnectedRoutes.length} 路線
              </strong>
            </span>
            <span>
              <small>関連フライト獲得PP合計</small>
              <strong>{selectedAirportInfo.totalPp.toLocaleString("ja-JP")} PP</strong>
            </span>
          </div>

          <div className="shared-map-airport-routes">
            <span>発着路線一覧（タップで路線を選択）</span>
            {airportConnectedRoutes.slice(0, 4).map((uRoute) => (
              <button
                type="button"
                key={uRoute.pairKey}
                onClick={() => showRoutePopup(uRoute.pairKey)}
              >
                {uRoute.origin.iata_code} ⇄ {uRoute.destination.iata_code}（
                {uRoute.miles.toLocaleString("ja-JP")} マイル / 約
                {Math.round(uRoute.kilometers).toLocaleString("ja-JP")} km）
                <small>
                  搭乗 {uRoute.count} 回 · 獲得 {uRoute.totalPp.toLocaleString("ja-JP")} PP
                </small>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  if (fullScreen) {
    return interactiveMapViewport;
  }

  return (
    <section className={`shared-route-map shared-route-map-${theme}`} aria-label="フライト路線マップ">
      <header className="shared-route-map-header">
        <div>
          <p className="shared-route-map-overline">YOUR FLIGHTS, ON THE MAP</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {showFlightTypeFilter && (
          <div className="shared-route-map-controls">
            <div className="shared-route-map-segment" role="group" aria-label="表示する運航便">
              <button
                type="button"
                aria-pressed={flightTypeFilter === "jal"}
                className={flightTypeFilter === "jal" ? "active" : ""}
                onClick={() => {
                  setFlightTypeFilter("jal");
                  setSelectedPairKey(null);
                  setSelectedAirportCode(null);
                }}
              >
                JAL
              </button>
              <button
                type="button"
                aria-pressed={flightTypeFilter === "oneworld"}
                className={flightTypeFilter === "oneworld" ? "active" : ""}
                onClick={() => {
                  setFlightTypeFilter("oneworld");
                  setSelectedPairKey(null);
                  setSelectedAirportCode(null);
                }}
              >
                ワンワールド
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 1. 通常画面（初期状態）: 余計な文字オーバーレイ・チェックボックス・丸ボタンを排したシンプルな2D路線マップ */}
      <div className="shared-route-map-preview-box">
        {routes.length === 0 ? (
          <div className="shared-route-map-preview-empty" role="status">
            <span className="shared-route-map-empty-icon" aria-hidden="true">
              ✈
            </span>
            <strong>地図に表示できる路線がありません</strong>
            <span>
              {visibleFlights.length > 0
                ? "空港コードを確認してください。"
                : "搭乗記録を登録すると、ここに路線マップが表示されます。"}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="shared-route-map-preview"
            aria-label="マップをタップして2D/3Dインタラクティブマップを開く"
            onClick={() => setIsMapOpen(true)}
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          >
            <span className="shared-route-map-preview-canvas">
              <svg
                className="shared-route-map-svg"
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                role="img"
                aria-label={`${uniqueRoutes.length}路線の2D路線マップ（タップで2D/3Dインタラクティブマップを展開）`}
              >
                <defs>
                  <linearGradient id="shared-map-ocean" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#071628" />
                    <stop offset="1" stopColor="#0f2944" />
                  </linearGradient>
                  <linearGradient id="shared-map-land" x1="0" y1="0" x2="0.9" y2="1">
                    <stop offset="0" stopColor="#35586c" />
                    <stop offset="1" stopColor="#213c4d" />
                  </linearGradient>
                </defs>
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-map-ocean)" />
                <g
                  transform={`translate(${previewTransform.panX} ${previewTransform.panY}) scale(${previewTransform.zoom})`}
                  className="shared-route-map-world"
                >
                  {[-1000, 0, 1000].map((offset) => (
                    <g key={offset} transform={`translate(${offset} 0)`}>
                      <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-map-ocean)" />
                      {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((longitude) => (
                        <line
                          key={`lon-${longitude}`}
                          x1={((longitude + 180) / 360) * MAP_WIDTH}
                          x2={((longitude + 180) / 360) * MAP_WIDTH}
                          y1="0"
                          y2={MAP_HEIGHT}
                          stroke="#7cc6e8"
                          strokeOpacity=".1"
                          strokeWidth={0.75 * invPreviewZoom}
                        />
                      ))}
                      {[-60, -30, 0, 30, 60].map((latitude) => (
                        <line
                          key={`lat-${latitude}`}
                          x1="0"
                          x2={MAP_WIDTH}
                          y1={((82 - latitude) / 164) * MAP_HEIGHT}
                          y2={((82 - latitude) / 164) * MAP_HEIGHT}
                          stroke="#7cc6e8"
                          strokeOpacity=".1"
                          strokeWidth={0.75 * invPreviewZoom}
                        />
                      ))}
                      <g
                        fill="url(#shared-map-land)"
                        stroke="#6ea3bc"
                        strokeOpacity=".38"
                        strokeWidth={0.85 * invPreviewZoom}
                      >
                        {LAND_SHAPES.map((path, index) => (
                          <path key={index} d={path} />
                        ))}
                      </g>

                      {uniqueRoutes.map((route) => (
                        <g key={route.pairKey} fill="none">
                          {route.paths.map((path, index) => (
                            <g key={`${route.pairKey}-${index}`}>
                              <path
                                d={path}
                                stroke="#0ea5e9"
                                strokeWidth={4.2 * invPreviewZoom}
                                strokeOpacity={0.28}
                                strokeLinecap="round"
                              />
                              <path
                                d={path}
                                stroke="#38bdf8"
                                strokeWidth={1.85 * invPreviewZoom}
                                strokeOpacity={0.95}
                                strokeLinecap="round"
                              />
                            </g>
                          ))}
                        </g>
                      ))}

                      {uniqueAirports.map(({ airport }) => {
                        const point = projectAirport(airport);
                        const labelPos = get2DLabelOffset(airport.iata_code, invPreviewZoom);
                        return (
                          <g
                            key={airport.iata_code}
                            transform={`translate(${point.x},${point.y})`}
                          >
                            <circle r={6.0 * invPreviewZoom} fill="#38bdf8" opacity=".3" />
                            <circle
                              r={3.0 * invPreviewZoom}
                              fill="#ffffff"
                              stroke="#0284c7"
                              strokeWidth={1.3 * invPreviewZoom}
                            />
                            <text
                              x={labelPos.dx}
                              y={labelPos.dy}
                              textAnchor={labelPos.anchor}
                              fill="#ffffff"
                              stroke="#071628"
                              strokeWidth={2.4 * invPreviewZoom}
                              paintOrder="stroke"
                              fontSize={10.2 * invPreviewZoom}
                              fontWeight="800"
                            >
                              {airport.iata_code}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  ))}
                </g>
              </svg>
            </span>
          </button>
        )}
      </div>

      {/* 2x2 KPI Summary Boxes below the Map Card */}
      <div className="shared-route-map-stats">
        <div>
          <span>搭乗記録</span>
          <strong>{visibleFlights.length.toLocaleString("ja-JP")} 回</strong>
        </div>
        <div>
          <span>表示できる路線</span>
          <strong>{uniqueRoutes.length.toLocaleString("ja-JP")} 路線</strong>
        </div>
        <div>
          <span>訪問空港数</span>
          <strong>{uniqueAirports.length.toLocaleString("ja-JP")} 空港</strong>
        </div>
        <div>
          <span>大圏距離の概算 合計</span>
          <strong>
            約 {Math.round(totalKm).toLocaleString("ja-JP")} km（{totalMiles.toLocaleString("ja-JP")} マイル）
          </strong>
        </div>
      </div>

      {/* 2. タップして開く「2D/3Dインタラクティブマップ画面」（MapLibre GL フルスクリーンモーダル） */}
      {isMapOpen && interactiveMapViewport}

      {unsupportedFlights.length > 0 && (
        <section className="shared-route-map-unsupported" aria-label="地図に表示できない記録">
          <h3>地図に表示できない記録：{unsupportedFlights.length}件</h3>
          <p>
            出発・到着空港コードが未登録、空港データ未対応、または同じ空港の記録です。搭乗記録は変更・削除していません。
          </p>
          <div>
            {unsupportedFlights.map((flight) => (
              <button type="button" key={flight.id} onClick={() => onSelectFlight(flight)}>
                <span>
                  {flight.origin || "未登録"} → {flight.destination || "未登録"}
                </span>
                <small>
                  {flight.date} · {flight.flightNumber || "便名未登録"}
                </small>
                <b>詳細 ↗</b>
              </button>
            ))}
          </div>
        </section>
      )}

      {showRouteList && (
        <section className="shared-route-map-routes" aria-label="路線一覧">
          <div className="shared-route-map-list-heading">
            <h3>路線一覧</h3>
            <span>選択すると地図上で強調表示</span>
          </div>
          {routes.length === 0 ? (
            <p className="shared-route-map-empty">
              搭乗記録を登録すると路線が表示されます。
            </p>
          ) : (
            <div className="shared-route-map-route-list">
              {routes.map((route) => (
                <article
                  key={route.flight.id}
                  className={selectedPairKey === route.pairKey ? "selected" : ""}
                >
                  <button
                    type="button"
                    className="shared-route-map-route-select"
                    onClick={() => {
                      setIsMapOpen(true);
                      setTimeout(() => showRoutePopup(route.pairKey), 150);
                    }}
                  >
                    <span
                      className="shared-route-map-airline"
                      style={
                        {
                          "--airline-color": colorFor(route.flight.airline),
                        } as CSSProperties
                      }
                    >
                      {airlineLabel(route.flight.airline)}
                    </span>
                    <span className="shared-route-map-route-codes">
                      {route.origin.iata_code} <i>→</i> {route.destination.iata_code}
                    </span>
                    <span className="shared-route-map-route-meta">
                      {route.flight.date} · {route.flight.flightNumber || "便名未登録"}
                    </span>
                    <span className="shared-route-map-distance">
                      約{Math.round(route.kilometers).toLocaleString("ja-JP")} km（
                      {route.miles.toLocaleString("ja-JP")} マイル）
                    </span>
                  </button>
                  <button
                    type="button"
                    className="shared-route-map-open-detail"
                    onClick={() => onSelectFlight(route.flight)}
                  >
                    詳細 ↗
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
