"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import type { FlightLogEx } from "../types";
import FlightDetailModal from "../components/FlightDetailModal";
import { getAircraftImagePath } from "../lib/aircraftImages";
import WorldRouteMap, { type WorldRouteMapActions } from "../components/WorldRouteMap";
import { AirportAndGuideSection } from "../components/AirportAndGuideSection";

export default function RouteMapPage() {
  const { logs, isLoaded, loadError, updateLog, refreshLogs } = useFlightData();
  const [selectedLog, setSelectedLog] = useState<FlightLogEx | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const mapActionsRef = useRef<WorldRouteMapActions | null>(null);

  const updateSelectedLog = async (updated: FlightLogEx) => {
    await updateLog(updated);
    setSelectedLog(updated);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F7FB] text-slate-900">
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-[#2878F0] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">路線マップを読み込み中…</p>
        </div>
      </main>
    );
  }

  const isLoadingErrorRetry = loadError && isRetrying;

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-slate-900 pb-28 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-5">
        {/* ================= 1. ROUTE MAP SECTION (通常時はシンプル2D路線表示、タップでMapLibre 2D/3Dモーダル展開) ================= */}
        <WorldRouteMap
          flights={loadError ? [] : logs}
          onSelectFlight={setSelectedLog}
          fullScreen={false}
          title="路線マップ（SFC Tracker）"
          subtitle="登録した搭乗記録を大圏経路で地図に重ねて振り返ります。"
          actionsRef={mapActionsRef}
          showRouteList={false}
        />

        {/* エラーまたは未登録時の案内バナー */}
        {(loadError || logs.length === 0) && (
          <section
            role={loadError ? "alert" : "status"}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div>
              <h2 className="text-sm font-black text-slate-900">
                {loadError ? "搭乗記録を読み込めませんでした" : "まだフライト記録がありません"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {loadError
                  ? "データの再読み込みをお試しください。"
                  : "フライトを登録すると、2D/3D路線マップと空港コレクションに自動反映されます。"}
              </p>
            </div>
            {loadError ? (
              <button
                type="button"
                disabled={isRetrying}
                onClick={async () => {
                  setIsRetrying(true);
                  try {
                    await refreshLogs();
                  } finally {
                    setIsRetrying(false);
                  }
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-[#2878F0] text-xs font-bold text-white disabled:opacity-60"
              >
                {isLoadingErrorRetry ? "再読み込み中…" : "再試行"}
              </button>
            ) : (
              <Link
                href="/calc"
                className="shrink-0 px-4 py-2.5 rounded-xl bg-[#2878F0] text-xs font-bold text-white hover:bg-blue-600 transition-colors"
              >
                + フライトを登録
              </Link>
            )}
          </section>
        )}

        {/* ================= 2. 空港コレクション / 空港・ラウンジ案内 / ガイド (1つに統合・100%データ連動) ================= */}
        <AirportAndGuideSection logs={logs} />
      </div>

      {/* ================= 3. FLIGHT DETAIL MODAL ================= */}
      <AnimatePresence>
        {selectedLog && (
          <FlightDetailModal
            log={selectedLog}
            generatedImage={getAircraftImagePath(selectedLog)}
            onClose={() => setSelectedLog(null)}
            onUpdate={updateSelectedLog}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
