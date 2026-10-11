"use client";

import { useMemo, useState } from "react";
import airportRows from "./world-airports.json";
import {
  calculateGreatCircleDistance,
  formatDistance,
  isValidAirport,
  type DistanceUnit,
  type WorldAirport,
} from "./worldDistance";

const AIRPORTS = (airportRows as WorldAirport[]).filter(isValidAirport);
const AIRPORT_TYPE_ORDER: Record<string, number> = { large_airport: 0, medium_airport: 1, small_airport: 2, seaplane_base: 3, heliport: 4 };
AIRPORTS.sort((a, b) => (AIRPORT_TYPE_ORDER[a.type || ""] ?? 5) - (AIRPORT_TYPE_ORDER[b.type || ""] ?? 5)
  || a.iata_code.localeCompare(b.iata_code));

type Props = {
  theme?: "ana" | "jal" | "neutral";
  compact?: boolean;
};

const themeStyles = {
  ana: { heading: "text-[#003184]", border: "border-blue-200", focus: "focus:ring-blue-300", button: "bg-[#003184] hover:bg-blue-900", pill: "bg-blue-50 text-[#003184]" },
  jal: { heading: "text-red-900", border: "border-red-200", focus: "focus:ring-red-300", button: "bg-red-900 hover:bg-red-800", pill: "bg-red-50 text-red-900" },
  neutral: { heading: "text-slate-900", border: "border-slate-200", focus: "focus:ring-slate-300", button: "bg-slate-900 hover:bg-slate-700", pill: "bg-slate-100 text-slate-800" },
};

export default function WorldDistanceCalculator({ theme = "neutral", compact = false }: Props) {
  const styles = themeStyles[theme];
  const [originCode, setOriginCode] = useState("HND");
  const [destinationCode, setDestinationCode] = useState("LHR");
  const [originSearch, setOriginSearch] = useState("");
  const [destinationSearch, setDestinationSearch] = useState("");
  const [originOpen, setOriginOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [unit, setUnit] = useState<DistanceUnit>("mi");

  const origin = AIRPORTS.find((airport) => airport.iata_code === originCode);
  const destination = AIRPORTS.find((airport) => airport.iata_code === destinationCode);
  const result = origin && destination ? calculateGreatCircleDistance(origin, destination) : null;
  const selectedValue = result ? (unit === "mi" ? result.miles : unit === "km" ? result.kilometers : result.nauticalMiles) : null;

  const airportCount = AIRPORTS.length;
  const suggestions = (query: string, currentCode: string) => {
    const normalized = query.trim().toLocaleLowerCase();
    return AIRPORTS
      .filter((airport) => airport.iata_code !== currentCode)
      .filter((airport) => !normalized || [airport.iata_code, airport.name, airport.municipality, airport.iso_country, airport.icao || airport.icao_code || ""]
        .some((value) => value.toLocaleLowerCase().includes(normalized)))
      .slice(0, 80);
  };

  const originSuggestions = useMemo(() => suggestions(originSearch, destinationCode), [originSearch, destinationCode]);
  const destinationSuggestions = useMemo(() => suggestions(destinationSearch, originCode), [destinationSearch, originCode]);

  const swap = () => {
    setOriginCode(destinationCode);
    setDestinationCode(originCode);
    setOriginSearch("");
    setDestinationSearch("");
    setOriginOpen(false);
    setDestinationOpen(false);
  };

  const originCandidates = originSearch.trim()
    ? AIRPORTS.filter((airport) => [airport.iata_code, airport.name, airport.municipality, airport.iso_country, airport.icao || airport.icao_code || ""]
      .some((value) => value.toLocaleLowerCase().includes(originSearch.trim().toLocaleLowerCase())))
    : originSuggestions;
  const destinationCandidates = destinationSearch.trim()
    ? AIRPORTS.filter((airport) => [airport.iata_code, airport.name, airport.municipality, airport.iso_country, airport.icao || airport.icao_code || ""]
      .some((value) => value.toLocaleLowerCase().includes(destinationSearch.trim().toLocaleLowerCase())))
    : destinationSuggestions;

  const renderAirportInput = (
    kind: "origin" | "destination",
    current: WorldAirport | undefined,
    search: string,
    setSearch: (value: string) => void,
    open: boolean,
    setOpen: (value: boolean) => void,
    candidates: WorldAirport[],
  ) => <div className="relative min-w-0">
    <label className="mb-1.5 block text-xs font-bold text-slate-600">{kind === "origin" ? "出発空港" : "到着空港"}</label>
    <input
      role="combobox"
      aria-label={kind === "origin" ? "出発空港" : "到着空港"}
      aria-expanded={open}
      aria-controls={`${kind}-world-airport-list`}
      aria-autocomplete="list"
      autoComplete="off"
      value={open ? search : current ? `${current.iata_code} — ${current.municipality || current.name}` : ""}
      onFocus={() => { setSearch(""); setOpen(true); }}
      onChange={(event) => { setSearch(event.target.value); setOpen(true); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
        if (event.key === "Enter" && candidates.length > 0) {
          event.preventDefault();
          const picked = candidates[0];
          if (kind === "origin") setOriginCode(picked.iata_code); else setDestinationCode(picked.iata_code);
          setSearch("");
          setOpen(false);
        }
      }}
      placeholder="IATA・空港名・都市名・国"
      className={`w-full rounded-xl border ${styles.border} bg-white px-3 py-3 text-sm font-semibold outline-none focus:ring-2 ${styles.focus}`}
    />
    {open && <div id={`${kind}-world-airport-list`} className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl" role="listbox">
      <p className="sticky top-0 border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500">候補 {candidates.length} 件（最多80件表示）</p>
      {candidates.length === 0 ? <p className="p-3 text-sm text-slate-500">空港が見つかりません。3レターコードや英語名も試してください。</p> : candidates.map((airport) => <button
        type="button"
        role="option"
        aria-selected={airport.iata_code === current?.iata_code}
        key={`${airport.iata_code}-${airport.ident || airport.name}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (kind === "origin") setOriginCode(airport.iata_code); else setDestinationCode(airport.iata_code);
          setSearch("");
          setOpen(false);
        }}
        className="block w-full border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
      >
        <span className="block text-sm font-bold text-slate-800">{airport.iata_code} — {airport.municipality || airport.name}</span>
        <span className="block truncate text-[11px] text-slate-500">{airport.name} · {airport.iso_country} · {airport.type || "airport"}</span>
      </button>)}
    </div>}
  </div>;

  return <section className={`rounded-2xl border ${styles.border} bg-white ${compact ? "p-4" : "p-5 md:p-7"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className={`text-lg font-black ${styles.heading}`}>世界の空港間距離</h2>
        <p className="mt-1 text-xs text-slate-500">IATA 3レターで検索 · 世界 {airportCount.toLocaleString()} 空港を収録</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-[10px] font-black ${styles.pill}`}>大圏距離</span>
    </div>

    <div className="mt-5 grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
      {renderAirportInput("origin", origin, originSearch, setOriginSearch, originOpen, setOriginOpen, originCandidates)}
      <button type="button" onClick={swap} aria-label="出発空港と到着空港を入れ替え" className="mx-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 md:mb-0.5">⇄ 入替</button>
      {renderAirportInput("destination", destination, destinationSearch, setDestinationSearch, destinationOpen, setDestinationOpen, destinationCandidates)}
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg bg-slate-100 p-1" aria-label="距離単位">
        {([ ["mi", "マイル"], ["km", "km"], ["nm", "海里"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${unit === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{label}</button>)}
      </div>
      {originCode === destinationCode && <p className="text-xs font-bold text-amber-700">出発地と到着地が同じ空港です。</p>}
    </div>

    {result && selectedValue !== null ? <div className={`mt-4 rounded-2xl ${styles.pill} p-5`}>
      <p className="text-xs font-bold opacity-75">{result.origin.iata_code} → {result.destination.iata_code} · 計算上の距離</p>
      <p className="mt-1 break-words text-4xl font-black tracking-tight">{formatDistance(selectedValue, unit)} <span className="text-base font-bold">{unit === "mi" ? "mi" : unit === "km" ? "km" : "nm"}</span></p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-current/10 pt-3 text-xs">
        <div><p className="opacity-70">マイル</p><p className="font-black">{formatDistance(result.miles, "mi")}</p></div>
        <div><p className="opacity-70">キロメートル</p><p className="font-black">{formatDistance(result.kilometers, "km")}</p></div>
        <div><p className="opacity-70">海里</p><p className="font-black">{formatDistance(result.nauticalMiles, "nm")}</p></div>
      </div>
    </div> : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">空港データまたは座標を確認できないため、距離を計算できません。</p>}

    <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
      <p className="font-black">計算値の用途に注意</p>
      <p>この値は空港座標から求めた地表上の最短距離（大圏距離）です。実際の飛行経路、IATA公式TPM、ANAの区間基本マイル、JALの区間マイルとは異なる場合があります。</p>
      <p>PP・FOP・LSPの公式積算値として自動利用しません。航空会社の積算には、搭乗日・運賃・予約クラスに適用される公式距離を別途確認してください。</p>
    </div>
    <p className="mt-3 text-[10px] leading-relaxed text-slate-400">空港座標データ: OurAirports / public domain。元データはコミュニティ提供で、正確性・用途適合性の保証はありません。</p>
  </section>;
}
