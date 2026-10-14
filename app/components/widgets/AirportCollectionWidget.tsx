"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { FlightLogEx } from "../../types";

interface AirportCollectionWidgetProps {
  logs: FlightLogEx[];
}

// Representative major airports with coordinates on a simple 0-100 normalized grid
const MAJOR_AIRPORTS = [
  { code: "HND", name: "東京(羽田)", city: "東京", x: 84, y: 35 },
  { code: "SIN", name: "シンガポール", city: "シンガポール", x: 74, y: 55 },
  { code: "LHR", name: "ロンドン", city: "ロンドン", x: 48, y: 25 },
  { code: "JFK", name: "ニューヨーク", city: "ニューヨーク", x: 28, y: 32 },
  { code: "OKA", name: "沖縄(那覇)", city: "沖縄", x: 81, y: 42 },
  { code: "CTS", name: "札幌(新千歳)", city: "札幌", x: 85, y: 28 },
  { code: "ITM", name: "大阪(伊丹)", city: "大阪", x: 83, y: 36 },
  { code: "FUK", name: "福岡", city: "福岡", x: 81, y: 38 },
];

export default function AirportCollectionWidget({ logs }: AirportCollectionWidgetProps) {
  const visitedCodes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.origin) set.add(log.origin.trim().toUpperCase());
      if (log.destination) set.add(log.destination.trim().toUpperCase());
      if (log.via) set.add(log.via.trim().toUpperCase());
    });
    return set;
  }, [logs]);

  const visitedCount = visitedCodes.size;
  const totalCount = 195; // World destination potential

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AIRPORT COLLECTION</span>
          <h3 className="text-base font-black text-slate-900 mt-0.5">訪問した空港</h3>
        </div>
        <div className="flex items-baseline gap-1 bg-blue-50 px-3 py-1 rounded-xl">
          <span className="text-xl font-black text-[#003184] tabular-nums">{visitedCount}</span>
          <span className="text-xs font-bold text-slate-400">/ {totalCount}</span>
        </div>
      </div>

      {/* ドットプロット世界地図 (ミニマルな点描世界地図) */}
      <div className="relative w-full h-32 rounded-2xl bg-[#0B172E] p-2 overflow-hidden flex items-center justify-center">
        {/* Subtle grid of world map dots */}
        <svg className="w-full h-full opacity-80" viewBox="0 0 100 50">
          {/* Background land dots */}
          {[
            // North America
            [20,15],[24,14],[28,16],[22,20],[26,22],[30,24],[24,28],
            // South America
            [32,34],[34,38],[36,42],[34,46],
            // Europe
            [48,14],[50,16],[46,18],[50,20],[54,18],
            // Africa
            [50,26],[52,30],[54,34],[52,38],[56,42],
            // Asia
            [64,16],[68,18],[72,20],[76,22],[70,26],[74,30],[80,24],
            // Japan
            [84,20],[85,22],[83,24],
            // Oceania
            [82,38],[86,40],[84,44],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.9" fill="rgba(255, 255, 255, 0.22)" />
          ))}

          {/* Visited glowing dots */}
          {MAJOR_AIRPORTS.filter((a) => visitedCodes.has(a.code)).map((a) => (
            <g key={a.code}>
              <circle cx={a.x * 0.9 + 5} cy={a.y * 0.8 + 5} r="2.2" fill="#38BDF8" opacity="0.4">
                <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={a.x * 0.9 + 5} cy={a.y * 0.8 + 5} r="1.3" fill="#38BDF8" />
            </g>
          ))}
        </svg>

        <span className="absolute bottom-2 right-3 text-[9px] font-bold text-sky-300/80">
          Visited Global Hubs
        </span>
      </div>

      {/* 4カラムの都市サムネイルカード */}
      <div className="grid grid-cols-4 gap-2">
        {MAJOR_AIRPORTS.slice(0, 4).map((item) => {
          const visited = visitedCodes.has(item.code);
          return (
            <div
              key={item.code}
              className={`p-2 rounded-2xl border text-center transition-all ${
                visited
                  ? "bg-blue-50/70 border-blue-200"
                  : "bg-slate-50 border-slate-200/60"
              }`}
            >
              <span className={`text-[11px] font-black block ${visited ? "text-[#003184]" : "text-slate-700"}`}>
                {item.code}
              </span>
              <span className="text-[9px] text-slate-500 truncate block mt-0.5">
                {item.city}
              </span>
              <span className={`mt-1 inline-block text-[8px] font-bold px-1.5 py-0.2 rounded ${
                visited ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {visited ? "訪問済" : "未訪問"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-1 text-right">
        <Link href="/guide" className="text-xs font-bold text-[#003184] hover:text-blue-700 inline-flex items-center gap-1">
          空港コレクションをすべて見る →
        </Link>
      </div>
    </div>
  );
}
