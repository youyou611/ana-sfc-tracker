"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
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

export type WorldRouteMapProps = {
  flights: RouteMapFlight[];
  onSelectFlight: (flight: RouteMapFlight) => void;
  title?: string;
  subtitle?: string;
  theme?: "ana" | "jal" | "neutral";
  /** Enables JAL-specific JAL / oneworld grouping controls. */
  showFlightTypeFilter?: boolean;
};

const AIRLINE_COLORS: Record<string, string> = { ANA: "#54b8e8", JAL: "#f05b62", その他: "#edbf55" };
const LAND_SHAPES = landPathRows as string[];

const AIRPORTS = (airportRows as RouteMapAirport[]).filter(isUsableAirport);
const AIRPORT_CODE_BY_ALIAS = new Map<string, string>();
for (const airport of AIRPORTS) {
  AIRPORT_CODE_BY_ALIAS.set(airport.iata_code.toLocaleUpperCase("en-US"), airport.iata_code);
}

// Old calculator records store Japanese display labels instead of airport codes.
// Keep aliases focused on supported Japanese domestic airports so they resolve consistently.
const DOMESTIC_AIRPORT_ALIASES: Record<string, string> = {
  "東京(羽田)": "HND", "東京（羽田）": "HND", "羽田": "HND", "東京(成田)": "NRT", "東京（成田）": "NRT", "成田": "NRT",
  "大阪(伊丹)": "ITM", "大阪（伊丹）": "ITM", "伊丹": "ITM", "大阪(関西)": "KIX", "大阪（関西）": "KIX", "関西": "KIX", "神戸": "UKB",
  "名古屋(中部)": "NGO", "名古屋（中部）": "NGO", "中部": "NGO", "札幌(新千歳)": "CTS", "札幌（新千歳）": "CTS", "新千歳": "CTS",
  "沖縄(那覇)": "OKA", "沖縄（那覇）": "OKA", "那覇": "OKA", "福岡": "FUK", "石垣": "ISG", "宮古": "MMY", "旭川": "AKJ", "函館": "HKD",
  "釧路": "KUH", "女満別": "MMB", "帯広": "OBO", "稚内": "WKJ", "利尻": "RIS", "奥尻": "OIR", "青森": "AOJ", "大館能代": "ONJ", "秋田": "AXT",
  "庄内": "SYO", "仙台": "SDJ", "福島": "FKS", "新潟": "KIJ", "八丈島": "HAC", "富山": "TOY", "小松": "KMQ", "能登": "NTQ", "岡山": "OKJ",
  "広島": "HIJ", "岩国": "IWK", "山口宇部": "UBJ", "鳥取": "TTJ", "米子": "YGJ", "萩・石見": "IWJ", "高松": "TAK", "徳島": "TKS", "松山": "MYJ",
  "高知": "KCZ", "北九州": "KKJ", "佐賀": "HSG", "大分": "OIT", "熊本": "KMJ", "長崎": "NGS", "宮崎": "KMI", "鹿児島": "KOJ", "五島福江": "FUJ",
  "対馬": "TSJ", "根室中標津": "SHB", "中標津": "SHB", "オホーツク紋別": "MBE", "紋別": "MBE", "静岡": "FSZ", "天草": "AXJ", "屋久島": "KUM",
  "壱岐": "IKI", "種子島": "TNE", "喜界島": "KKX", "与論": "RNJ", "奄美": "ASJ", "徳之島": "TKN", "沖永良部": "OKE",
};
for (const [alias, code] of Object.entries(DOMESTIC_AIRPORT_ALIASES)) AIRPORT_CODE_BY_ALIAS.set(alias.trim().toLocaleLowerCase("ja"), code);

function resolveAirportCode(value: string): string {
  const normalized = value.trim().toLocaleUpperCase("en-US");
  if (AIRPORT_CODE_BY_ALIAS.has(normalized)) return AIRPORT_CODE_BY_ALIAS.get(normalized)!;
  const japanese = value.trim().toLocaleLowerCase("ja");
  return AIRPORT_CODE_BY_ALIAS.get(japanese) ?? normalized;
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

export default function WorldRouteMap({
  flights,
  onSelectFlight,
  title = "路線マップ",
  subtitle = "搭乗記録を大圏経路で地図に重ねて振り返ります。",
  theme = "neutral",
  showFlightTypeFilter = false,
}: WorldRouteMapProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [flightTypeFilter, setFlightTypeFilter] = useState<"jal" | "oneworld">("jal");
  const [zoom, setZoom] = useState(1.35);
  const japanWorldPoint = useMemo(() => ({ x: ((139.7 + 180) / 360) * MAP_WIDTH, y: ((82 - 35.7) / 164) * MAP_HEIGHT }), []);
  const [pan, setPan] = useState(() => ({ x: MAP_WIDTH / 2 - japanWorldPoint.x * 1.35, y: MAP_HEIGHT / 2 - japanWorldPoint.y * 1.35 }));
  const [is3D, setIs3D] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [globeRotation, setGlobeRotation] = useState({ longitude: -139.7, latitude: -35.7 });
  const [globeScale, setGlobeScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const pointerOriginRef = useRef<{ pointerId: number; x: number; y: number; baseX: number; baseY: number } | null>(null);
  const [globeAutoRotate, setGlobeAutoRotate] = useState(true);
  const suppressClickRef = useRef(false);
  const airportsByCode = useMemo(() => new Map(AIRPORTS.map((airport) => [airport.iata_code, airport])), []);
  const wrapHorizontalPan = (x: number, scale: number) => {
    const period = MAP_WIDTH * scale;
    return period ? ((x + period / 2) % period + period) % period - period / 2 : x;
  };

  const visibleFlights = useMemo(() => showFlightTypeFilter
    ? flights.filter((flight) => flightTypeFilter === "oneworld" ? flight.flightType === "oneworld" : flight.flightType !== "oneworld")
    : flights, [flightTypeFilter, flights, showFlightTypeFilter]);
  const routes = useMemo(() => visibleFlights.flatMap((flight) => {
    const origin = airportsByCode.get(resolveAirportCode(flight.origin));
    const destination = airportsByCode.get(resolveAirportCode(flight.destination));
    if (!origin || !destination || origin.iata_code === destination.iata_code) return [];
    const points = greatCirclePoints(origin, destination);
    const midpoint = points[Math.floor(points.length / 2)];
    return [{
      flight,
      origin,
      destination,
      kilometers: greatCircleDistanceKm(origin, destination),
      paths: greatCirclePathSegments(origin, destination),
      midpoint: { x: ((midpoint[0] + 180) / 360) * MAP_WIDTH, y: ((82 - midpoint[1]) / 164) * MAP_HEIGHT },
    }];
  }), [airportsByCode, visibleFlights]);
  const routeIds = new Set(routes.map((route) => route.flight.id));
  const unsupportedFlights = visibleFlights.filter((flight) => !routeIds.has(flight.id));
  const uniqueAirports = useMemo(() => {
    const byCode = new Map<string, RouteMapAirport>();
    routes.forEach((route) => { byCode.set(route.origin.iata_code, route.origin); byCode.set(route.destination.iata_code, route.destination); });
    return [...byCode.values()];
  }, [routes]);
  const selectedRoute = routes.find((route) => route.flight.id === selectedRouteId);
  const totalKm = routes.reduce((sum, route) => sum + route.kilometers, 0);

  useEffect(() => {
    if (!isMapOpen || !is3D || !globeAutoRotate || isDragging) return;
    let frame = 0;
    let previous = 0;
    const animate = (time: number) => {
      if (previous) {
        const delta = Math.min(40, time - previous);
        setGlobeRotation((current) => ({ ...current, longitude: (current.longitude + delta * 0.0045) % 360 }));
      }
      previous = time;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [globeAutoRotate, is3D, isDragging, isMapOpen]);

  useEffect(() => {
    if (!isMapOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsMapOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMapOpen]);

  const changeZoom = (nextZoom: number, focalX = MAP_WIDTH / 2, focalY = MAP_HEIGHT / 2) => {
    const boundedZoom = Math.min(5, Math.max(0.65, nextZoom));
    const ratio = boundedZoom / zoom;
    setPan((current) => ({ x: wrapHorizontalPan(focalX - (focalX - current.x) * ratio, boundedZoom), y: focalY - (focalY - current.y) * ratio }));
    setZoom(boundedZoom);
  };
  const resetCamera = () => {
    const resetZoom = 1.35;
    setZoom(resetZoom);
    setPan({ x: wrapHorizontalPan(MAP_WIDTH / 2 - japanWorldPoint.x * resetZoom, resetZoom), y: MAP_HEIGHT / 2 - japanWorldPoint.y * resetZoom });
    setGlobeRotation({ longitude: -139.7, latitude: -35.7 });
    setGlobeScale(1);
    setGlobeAutoRotate(true);
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement | SVGSVGElement>) => {
    if (event.button !== 0) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y, moved: false };
    pointerOriginRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, baseX: is3D ? globeRotation.longitude : pan.x, baseY: is3D ? globeRotation.latitude : pan.y };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement | SVGSVGElement>) => {
    const origin = pointerOriginRef.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) + Math.abs(dy) > 4 && dragRef.current) dragRef.current.moved = true;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (is3D) {
      if (dragRef.current?.moved) {
        setGlobeAutoRotate(false);
        setGlobeRotation({ longitude: origin.baseX + dx * 360 / Math.max(1, bounds.width), latitude: Math.max(-75, Math.min(75, origin.baseY + dy * 180 / Math.max(1, bounds.height))) });
      }
    } else if (dragRef.current?.moved) {
      setPan({ x: wrapHorizontalPan(origin.baseX + dx * MAP_WIDTH / Math.max(1, bounds.width), zoom), y: origin.baseY + dy * MAP_HEIGHT / Math.max(1, bounds.height) });
    }
  };
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement | SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      suppressClickRef.current = drag.moved;
      dragRef.current = null;
      pointerOriginRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (is3D) {
      setGlobeScale((current) => Math.min(1.8, Math.max(0.7, current * (event.deltaY < 0 ? 1.1 : 1 / 1.1))));
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    changeZoom(zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12), ((event.clientX - bounds.left) / bounds.width) * MAP_WIDTH, ((event.clientY - bounds.top) / bounds.height) * MAP_HEIGHT);
  };
  const globePoint = (longitude: number, latitude: number) => {
    const lon = (longitude + globeRotation.longitude) * Math.PI / 180;
    const lat = latitude * Math.PI / 180;
    const centerLat = globeRotation.latitude * Math.PI / 180;
    const x = Math.cos(lat) * Math.sin(lon);
    const y = Math.sin(lat) * Math.cos(centerLat) - Math.cos(lat) * Math.cos(lon) * Math.sin(centerLat);
    const z = Math.sin(lat) * Math.sin(centerLat) + Math.cos(lat) * Math.cos(lon) * Math.cos(centerLat);
    return { x: MAP_WIDTH / 2 + x * 202, y: MAP_HEIGHT / 2 - y * 202, z };
  };
  const globePath = (path: string) => {
    const commands = path.match(/[ML][^ML]*/g) ?? [];
    const projected: string[] = [];
    for (const command of commands) {
      const values = command.slice(1).trim().split(/[ ,]+/).map(Number);
      if (values.length < 2) continue;
      const point = globePoint((values[0] / MAP_WIDTH) * 360 - 180, 82 - (values[1] / MAP_HEIGHT) * 164);
      projected.push(`${command[0]}${point.x.toFixed(1)},${point.y.toFixed(1)}`);
    }
    return projected.join(" ");
  };

  return <section className={`shared-route-map shared-route-map-${theme}`} aria-label="フライト路線マップ">
    <header className="shared-route-map-header">
      <div><p className="shared-route-map-overline">YOUR FLIGHTS, ON THE MAP</p><h2>{title}</h2><p>{subtitle}</p></div>
      <div className="shared-route-map-controls">
        {showFlightTypeFilter && <div className="shared-route-map-segment" role="group" aria-label="表示する運航便"><button type="button" aria-pressed={flightTypeFilter === "jal"} className={flightTypeFilter === "jal" ? "active" : ""} onClick={() => { setFlightTypeFilter("jal"); setSelectedRouteId(null); }}>JAL</button><button type="button" aria-pressed={flightTypeFilter === "oneworld"} className={flightTypeFilter === "oneworld" ? "active" : ""} onClick={() => { setFlightTypeFilter("oneworld"); setSelectedRouteId(null); }}>ワンワールド</button></div>}
        <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> 空港コード</label>
        <label><input type="checkbox" checked={showDistance} onChange={(event) => setShowDistance(event.target.checked)} /> 距離</label>
      </div>
    </header>
    <div className="shared-route-map-stats">
      <div><span>搭乗記録</span><strong>{visibleFlights.length.toLocaleString("ja-JP")}</strong></div>
      <div><span>表示できる路線</span><strong>{routes.length.toLocaleString("ja-JP")}</strong></div>
      <div><span>空港数</span><strong>{uniqueAirports.length.toLocaleString("ja-JP")}</strong></div>
      <div><span>大圏距離の概算 合計</span><strong>約{Math.round(totalKm).toLocaleString("ja-JP")} km</strong></div>
    </div>

    <button type="button" className="shared-route-map-preview" aria-label="マップを全画面で開く" onClick={() => setIsMapOpen(true)}>
      <span className="shared-route-map-preview-canvas">
        <svg className="shared-route-map-svg" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={`日本中心の地図に${routes.length}便の大圏経路を表示`}>
        <defs>
          <linearGradient id="shared-map-ocean" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#102b42" /><stop offset="1" stopColor="#1b3e54" /></linearGradient>
          <linearGradient id="shared-map-land" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#66858e" /><stop offset="1" stopColor="#395b68" /></linearGradient>
        </defs>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-map-ocean)" />
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`} className="shared-route-map-world">
          {[-4000, -3000, -2000, -1000, 0, 1000, 2000, 3000, 4000].map((offset) => <g key={offset} transform={`translate(${offset} 0)`}>
            <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-map-ocean)"/>
            {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map((longitude)=><line key={`lon-${longitude}`} x1={((longitude+180)/360)*MAP_WIDTH} x2={((longitude+180)/360)*MAP_WIDTH} y1="0" y2={MAP_HEIGHT} stroke="#b5d2dd" strokeOpacity=".12"/>)}
            {[-60,-30,0,30,60].map((latitude)=><line key={`lat-${latitude}`} x1="0" x2={MAP_WIDTH} y1={((82-latitude)/164)*MAP_HEIGHT} y2={((82-latitude)/164)*MAP_HEIGHT} stroke="#b5d2dd" strokeOpacity=".12"/>)}
            <g fill="url(#shared-map-land)" stroke="#8ca8a7" strokeOpacity=".32" strokeWidth="1.2">{LAND_SHAPES.map((path,index)=><path key={index} d={path}/>)}</g>
            {routes.map((route)=><g key={route.flight.id} fill="none" stroke={colorFor(route.flight.airline)} strokeWidth={selectedRouteId===route.flight.id?3.8:2} strokeOpacity={selectedRouteId&&selectedRouteId!==route.flight.id?.14:.82}>{route.paths.map((path,index)=><path key={`${route.flight.id}-${index}`} d={path}/>)}</g>)}
            {uniqueAirports.map((airport)=>{const point=projectAirport(airport);return <g key={airport.iata_code} transform={`translate(${point.x},${point.y})`}><circle r="7" fill="#54b8e8" opacity=".25"/><circle r="3.5" fill="#fff" stroke="#234456" strokeWidth="1.5"/><title>{airport.iata_code} · {airport.municipality||airport.name}</title>{showLabels&&<text x="6" y="-6" fill="#fff" stroke="#19384a" strokeWidth="2.4" paintOrder="stroke" fontSize="10" fontWeight="800">{airport.iata_code}</text>}</g>;})}
          </g>)}
        </g>
        </svg>
        <span className="shared-route-map-preview-overlay"><strong>マップを開く</strong><span>タッチして移動・ズーム・3D表示</span><i aria-hidden="true">↗</i></span>
      </span>
    </button>
    {isMapOpen && <div className="shared-route-map-fullscreen" role="dialog" aria-modal="true" aria-label={`${title} 操作マップ`}>
      <header className="shared-route-map-fullscreen-header"><div><span>FLIGHT MAP EXPERIENCE</span><h2>{title}</h2><p>{is3D ? "3D地球儀 · 自動回転中" : "2D世界地図 · 日本中心"}</p></div><button type="button" aria-label="マップを閉じる" onClick={() => setIsMapOpen(false)}>✕</button></header>
      <div className="shared-route-map-fullscreen-tools"><div className="shared-route-map-mode-switch"><button type="button" className={!is3D?"active":""} onClick={()=>setIs3D(false)}>2D 地図</button><button type="button" className={is3D?"active":""} onClick={()=>{setIs3D(true);setGlobeAutoRotate(true);}}>3D 地球儀</button></div>
        {showFlightTypeFilter && <div className="shared-route-map-segment" role="group" aria-label="表示する運航便"><button type="button" className={flightTypeFilter==="jal"?"active":""} aria-pressed={flightTypeFilter==="jal"} onClick={()=>{setFlightTypeFilter("jal");setSelectedRouteId(null);}}>JAL</button><button type="button" className={flightTypeFilter==="oneworld"?"active":""} aria-pressed={flightTypeFilter==="oneworld"} onClick={()=>{setFlightTypeFilter("oneworld");setSelectedRouteId(null);}}>ワンワールド</button></div>}
        {!is3D && <div className="shared-route-map-zoom-tools"><button type="button" aria-label="縮小" onClick={()=>changeZoom(zoom/1.25)}>−</button><output>{zoom.toFixed(2)}×</output><button type="button" aria-label="拡大" onClick={()=>changeZoom(zoom*1.25)}>＋</button></div>}
        <button type="button" className="shared-route-map-reset" onClick={resetCamera}>初期位置へ</button>
      </div>
      <div className={`shared-route-map-canvas shared-route-map-fullscreen-canvas${is3D?" is-globe":""}${isDragging?" is-dragging":""}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel}>
        {is3D ? <svg className="shared-route-map-globe" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="自動回転する3D地球儀">
          <defs><radialGradient id="shared-globe-ocean" cx="34%" cy="26%" r="82%"><stop offset="0" stopColor="#4b8ca8"/><stop offset=".58" stopColor="#16435f"/><stop offset="1" stopColor="#071727"/></radialGradient><radialGradient id="shared-globe-land" cx="35%" cy="25%" r="90%"><stop offset="0" stopColor="#a6c3a7"/><stop offset="1" stopColor="#547b75"/></radialGradient><clipPath id="shared-globe-clip"><circle cx={MAP_WIDTH/2} cy={MAP_HEIGHT/2} r="203"/></clipPath><filter id="shared-globe-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter></defs>
          <g transform={`translate(${MAP_WIDTH/2} ${MAP_HEIGHT/2}) scale(${globeScale}) translate(${-MAP_WIDTH/2} ${-MAP_HEIGHT/2})`}>
            <ellipse cx={MAP_WIDTH/2} cy={MAP_HEIGHT/2+14} rx="209" ry="206" fill="#020b13" opacity=".8" filter="url(#shared-globe-shadow)"/><circle cx={MAP_WIDTH/2} cy={MAP_HEIGHT/2} r="203" fill="#0b1d2d" stroke="#88bad0" strokeWidth="2"/>
            <g clipPath="url(#shared-globe-clip)"><circle cx={MAP_WIDTH/2} cy={MAP_HEIGHT/2} r="203" fill="url(#shared-globe-ocean)"/>{[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(longitude=>{const a=globePoint(longitude,0);const b=globePoint(longitude,89);const c=globePoint(longitude,-89);return <path key={longitude} d={`M${a.x},${a.y} Q${b.x},${b.y} ${c.x},${c.y}`} fill="none" stroke="#b8e5ef" strokeOpacity=".18"/>;})}{[-60,-30,0,30,60].map(latitude=>{const points=Array.from({length:73},(_,i)=>globePoint(-180+i*5,latitude));return <path key={latitude} d={points.map((point,i)=>`${i?"L":"M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")} fill="none" stroke="#b8e5ef" strokeOpacity=".2"/>;})}<g fill="url(#shared-globe-land)" stroke="#bed5bb" strokeOpacity=".7" strokeWidth=".9">{LAND_SHAPES.map((path,index)=><path key={index} d={globePath(path)}/>)}</g>{routes.map(route=><g key={route.flight.id} fill="none" stroke={colorFor(route.flight.airline)} strokeWidth={selectedRouteId===route.flight.id?2.8:1.7} strokeOpacity={selectedRouteId&&selectedRouteId!==route.flight.id?.25:1}>{route.paths.map((path,index)=><path key={index} d={globePath(path)}/>)}</g>)}{uniqueAirports.map(airport=>{const point=globePoint(Number(airport.longitude_deg),Number(airport.latitude_deg));if(point.z<-.05)return null;return <g key={airport.iata_code}><circle cx={point.x} cy={point.y} r="3.4" fill="#fff" stroke="#0c2637"/><title>{airport.iata_code}</title>{showLabels&&point.z>.55&&<text x={point.x+5} y={point.y-5} fill="#fff" stroke="#123247" strokeWidth="2.2" paintOrder="stroke" fontSize="9" fontWeight="800">{airport.iata_code}</text>}</g>;})}</g>
            <circle cx={MAP_WIDTH/2} cy={MAP_HEIGHT/2} r="203" fill="none" stroke="#c5e1ee" strokeWidth="1.6"/>
          </g><text x={MAP_WIDTH/2} y="28" textAnchor="middle" fill="#d4edf8" fontSize="11" letterSpacing="3">FLIGHT GLOBE</text>
        </svg> : <svg className="shared-route-map-svg shared-route-map-continuous" preserveAspectRatio="xMidYMid slice" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="横方向に連続する2D世界地図"><defs><linearGradient id="shared-full-ocean" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#102b42"/><stop offset="1" stopColor="#1b3e54"/></linearGradient><linearGradient id="shared-full-land" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor="#66858e"/><stop offset="1" stopColor="#395b68"/></linearGradient></defs><rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-full-ocean)"/><g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>{[-3000,-2000,-1000,0,1000,2000,3000].map(offset=><g key={offset} transform={`translate(${offset} 0)`}><rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#shared-full-ocean)"/>{[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lon=><line key={lon} x1={(lon+180)/360*MAP_WIDTH} x2={(lon+180)/360*MAP_WIDTH} y1="0" y2={MAP_HEIGHT} stroke="#b5d2dd" strokeOpacity=".12"/>)}{[-60,-30,0,30,60].map(lat=><line key={lat} x1="0" x2={MAP_WIDTH} y1={(82-lat)/164*MAP_HEIGHT} y2={(82-lat)/164*MAP_HEIGHT} stroke="#b5d2dd" strokeOpacity=".12"/>)}<g fill="url(#shared-full-land)" stroke="#8ca8a7" strokeOpacity=".32" strokeWidth="1.2">{LAND_SHAPES.map((path,index)=><path key={index} d={path}/>)}</g>{routes.map(route=><g key={route.flight.id} fill="none" stroke={colorFor(route.flight.airline)} strokeWidth={selectedRouteId===route.flight.id?3.8:2} strokeOpacity={selectedRouteId&&selectedRouteId!==route.flight.id?.14:.82}>{route.paths.map((path,index)=><path key={index} d={path}/>)}</g>)}{uniqueAirports.map(airport=>{const point=projectAirport(airport);return <g key={airport.iata_code} transform={`translate(${point.x},${point.y})`}><circle r="6" fill="#54b8e8" opacity=".22"/><circle r="3.5" fill="#fff" stroke="#234456" strokeWidth="1.5"/>{showLabels&&<text x="6" y="-6" fill="#fff" stroke="#19384a" strokeWidth="2.4" paintOrder="stroke" fontSize="10" fontWeight="800">{airport.iata_code}</text>}</g>;})}</g>)}</g></svg>}
      </div>
      <footer className="shared-route-map-fullscreen-footer"><span>{visibleFlights.length.toLocaleString("ja-JP")} 件 · {routes.length.toLocaleString("ja-JP")} 路線 · {uniqueAirports.length.toLocaleString("ja-JP")} 空港</span><label><input type="checkbox" checked={showLabels} onChange={event=>setShowLabels(event.target.checked)}/> 空港コード</label><label><input type="checkbox" checked={showDistance} onChange={event=>setShowDistance(event.target.checked)}/> 距離</label>{is3D&&<><button type="button" onClick={()=>setGlobeScale(current=>Math.min(1.8,current*1.2))}>3D ＋</button><button type="button" onClick={()=>setGlobeScale(current=>Math.max(.7,current/1.2))}>3D −</button><button type="button" onClick={()=>setGlobeAutoRotate(value=>!value)}>{globeAutoRotate?"自動回転を停止":"自動回転を再開"}</button></>}</footer>
      <p className="shared-route-map-fullscreen-hint">{is3D?"地球儀は自動でゆっくり回転します。ドラッグで向きを変えられます。":"左右へドラッグしても地図は途切れずに続きます。ホイールや＋／−でズームできます。"}</p>
    </div>}
    <p className="shared-route-map-note">{is3D ? "3D地球儀はNatural Earthの陸地ポリゴンと登録フライトを球面へ投影した軽量表示です。実地形や衛星写真ではありません。" : "陸地形状はNatural Earth 1:110mの公開地理データです。"} 路線は空港座標から計算した大圏経路の概算であり、実際の飛行航跡ではありません。距離はANA公式区間基本マイル、PP、JAL公式区間マイル、FOP、LSPの計算には使用しません。</p>

    {unsupportedFlights.length > 0 && <section className="shared-route-map-unsupported" aria-label="地図に表示できない記録"><h3>地図に表示できない記録：{unsupportedFlights.length}件</h3><p>出発・到着空港コードが未登録、空港データ未対応、または同じ空港の記録です。搭乗記録は変更・削除していません。下から既存の詳細画面を開けます。</p><div>{unsupportedFlights.map((flight) => <button type="button" key={flight.id} onClick={() => onSelectFlight(flight)}><span>{flight.origin || "未登録"} → {flight.destination || "未登録"}</span><small>{flight.date} · {flight.flightNumber || "便名未登録"}</small><b>詳細 ↗</b></button>)}</div></section>}

    <section className="shared-route-map-routes" aria-label="路線一覧"><div className="shared-route-map-list-heading"><h3>路線一覧</h3><span>選択すると地図上で強調表示</span></div>
      {routes.length === 0 ? <p className="shared-route-map-empty">搭乗記録を登録するか、検索・年度の条件を変更すると路線が表示されます。</p> : <div className="shared-route-map-route-list">{routes.map((route) => <article key={route.flight.id} className={selectedRouteId === route.flight.id ? "selected" : ""}>
        <button type="button" className="shared-route-map-route-select" aria-pressed={selectedRouteId === route.flight.id} onClick={() => setSelectedRouteId((current) => current === route.flight.id ? null : route.flight.id)}>
          <span className="shared-route-map-airline" style={{ "--airline-color": colorFor(route.flight.airline) } as CSSProperties}>{airlineLabel(route.flight.airline)}</span>
          <span className="shared-route-map-route-codes">{route.flight.origin} <i>→</i> {route.flight.destination}</span>
          <span className="shared-route-map-route-meta">{route.flight.date} · {route.flight.flightNumber || "便名未登録"}</span>
          {showDistance && <span className="shared-route-map-distance">大圏距離の概算：約{Math.round(route.kilometers).toLocaleString("ja-JP")} km</span>}
        </button>
        <button type="button" className="shared-route-map-open-detail" onClick={() => onSelectFlight(route.flight)} aria-label={`${route.flight.date} ${route.flight.origin}から${route.flight.destination}の搭乗詳細を開く`}>詳細 ↗</button>
      </article>)}</div>}
    </section>
  </section>;
}
