"use client";

import { useState } from "react";
import Link from "next/link";
import { useFlightData } from "../hooks/useFlightData";
import { getAllImages, getAllLogs, restoreBackupRecords } from "../lib/db";
import { FlightLogEx, FlightImage } from "../types";

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded, refreshLogs } = useFlightData();
  const targetType = settings.anaTargetType;
  const [backupText, setBackupText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [message, setMessage] = useState("");

  const targetOptions: { [key: string]: { label: string, pp: number } } = {
    bronze_ls: { label: "ブロンズ (LS)", pp: 15000 },
    bronze_std: { label: "ブロンズ (通常)", pp: 30000 },
    platinum_ls: { label: "プラチナ (LS)", pp: 30000 },
    platinum_std: { label: "プラチナ/SFC (通常)", pp: 50000 },
    diamond_ls_5m: { label: "ダイヤ (LS/500万)", pp: 50000 },
    diamond_ls_4m: { label: "ダイヤ (LS/400万)", pp: 80000 },
    diamond_std: { label: "ダイヤモンド (通常)", pp: 100000 },
  };

  const exportData = async () => {
    try {
      const [flightLogs, images] = await Promise.all([getAllLogs(), getAllImages()]);
      const data = {
        format: "ana-flight-tracker-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        flightLogs,
        images,
        settings,
        calculatorState: localStorage.getItem("sfc_calculator_state"),
      };
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ana_flight_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("履歴・写真・設定をバックアップしました。");
    } catch {
      setMessage("バックアップを作成できませんでした。");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBackupText(content);
      }
    };
    reader.readAsText(file);
  };

  const importData = async () => {
    try {
      const data = JSON.parse(backupText);
      if (data.format && (data.format !== "ana-flight-tracker-backup" || data.version !== 1)) {
        throw new Error("Unsupported backup format");
      }
      const rawLogs = typeof data.flightLogs === "string" ? JSON.parse(data.flightLogs) : data.flightLogs;
      const backupLogs = rawLogs ?? (data.format ? null : []);
      if (!Array.isArray(backupLogs)) throw new Error("Flight records are missing");
      const flightLogs = backupLogs
        .filter((log: Partial<FlightLogEx>) => !log.airline || log.airline === "ANA")
        .map((log: Partial<FlightLogEx>) => {
          if (!log.id || !log.date || !log.origin || !log.destination) throw new Error("Invalid flight record");
          const date = String(log.date);
          return {
            ...log,
            id: String(log.id),
            airline: "ANA" as const,
            date,
            year: Number(log.year) || new Date(`${date}T00:00:00`).getFullYear(),
            origin: String(log.origin),
            destination: String(log.destination),
            via: String(log.via || ""),
            pp: Number(log.pp) || 0,
            lsp: 0,
            price: Number(log.price) || 0,
          };
        });
      const rawImages = data.images ?? [];
      if (!Array.isArray(rawImages) || rawImages.some((image: Partial<FlightImage>) => !image.id || !image.data)) {
        throw new Error("Invalid photo data");
      }
      await restoreBackupRecords(flightLogs, rawImages as FlightImage[]);

      const importedTarget = data.settings?.anaTargetType ?? data.targetType;
      if (typeof importedTarget === "string" && targetOptions[importedTarget]) {
        updateSettings({ anaTargetType: importedTarget });
      }
      if (typeof data.calculatorState === "string") {
        localStorage.setItem("sfc_calculator_state", data.calculatorState);
      }
      await refreshLogs();
      setMessage("バックアップの履歴・写真・設定を復元しました。既存の記録は保持し、同じIDの記録を更新しました。");
      setShowImport(false);
      setBackupText("");
    } catch {
      setMessage("データを復元できませんでした。バックアップの形式を確認してください。");
    }
  };

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900 pb-28 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#002561] via-[#003477] to-[#001b47] text-white pt-6 pb-7 px-4 sm:px-6 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-200">ANA SFC TRACKER</p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">設定・データ管理</h1>
            <p className="text-xs text-blue-100/75 mt-1">ステータス目標、データバックアップ、各種リンクの管理</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-sm border border-white/15">
              Version 1.1.0
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* カンプ準拠: iOSグループ化 設定メニュー行 */}
        <section aria-labelledby="settings-menu-heading" className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          
          {/* 行 1: 目標PP設定 */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-blue-50 text-[#003184] flex items-center justify-center text-lg shrink-0">
                🎯
              </span>
              <div className="min-w-0">
                <span className="text-sm font-black text-slate-900 block">目標PP設定</span>
                <span className="text-xs text-slate-400 block truncate">
                  現在: {targetOptions[targetType]?.label}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <select
                aria-label="目標ステータス"
                value={targetType}
                onChange={(e) => updateSettings({ anaTargetType: e.target.value })}
                className="bg-slate-100 hover:bg-slate-200 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-[#003184] outline-none cursor-pointer"
              >
                {Object.keys(targetOptions).map((k) => (
                  <option key={k} value={k}>
                    {targetOptions[k].pp.toLocaleString()} PP
                  </option>
                ))}
              </select>
              <span className="text-slate-300 font-bold text-sm">›</span>
            </div>
          </div>

          {/* 行 2: データのバックアップ */}
          <button
            type="button"
            onClick={exportData}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center text-lg shrink-0">
                ☁️
              </span>
              <div className="min-w-0">
                <span className="text-sm font-black text-slate-900 block">データのバックアップ</span>
                <span className="text-xs text-slate-400 block truncate">
                  搭乗履歴をJSONファイルとしてエクスポート
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-xl shrink-0">
              書き出し ›
            </span>
          </button>

          {/* 行 3: データのインポート */}
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg shrink-0">
                📥
              </span>
              <div className="min-w-0">
                <span className="text-sm font-black text-slate-900 block">データのインポート</span>
                <span className="text-xs text-slate-400 block truncate">
                  別端末やバックアップJSONから復元
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl shrink-0">
              {showImport ? "閉じる" : "復元 ›"}
            </span>
          </button>

          {/* 行 4: 表示設定・ガイド案内 */}
          <Link
            href="/guide"
            className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg shrink-0">
                ⚙️
              </span>
              <div className="min-w-0">
                <span className="text-sm font-black text-slate-900 block">表示設定・修行ガイド</span>
                <span className="text-xs text-slate-400 block truncate">
                  テーマ・2026年新運賃制度・空港ラウンジ案内
                </span>
              </div>
            </div>
            <span className="text-slate-300 font-bold text-sm">›</span>
          </Link>
        </section>

          {message && (
            <div role="status" className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-[#003184] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}

          {showImport && (
            <div className="mt-4 p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  バックアップJSONファイルを選択：
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#002561] file:text-white hover:file:bg-[#001b47] cursor-pointer"
                />
              </div>

              <div className="mb-3">
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  またはJSONテキストを直接貼り付け：
                </label>
                <textarea 
                  className="w-full h-28 p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  value={backupText} 
                  onChange={(e) => setBackupText(e.target.value)}
                  placeholder='{"flightLogs":"[...]"}' 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowImport(false)} 
                  className="flex-1 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="button"
                  onClick={importData} 
                  className="flex-1 py-2.5 bg-[#003184] text-white text-xs font-bold rounded-lg hover:bg-[#002561] transition-colors shadow-sm"
                >
                  復元を実行
                </button>
              </div>
            </div>
          )}

        {/* SFC修行ガイドへの案内 */}
        <section aria-labelledby="guide-heading" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="guide-heading" className="text-sm font-bold text-slate-900">SFC修行ガイド & 空港ガイド</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                PP計算の基本ルール、2026年新運賃制度、主要空港のANAラウンジ情報を確認できます
              </p>
            </div>
            <Link 
              href="/guide" 
              className="shrink-0 py-2.5 px-4 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center gap-1.5 hover:bg-blue-100 transition-colors text-xs"
            >
              ガイドを見る
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ANA公式リンク集 */}
        <section aria-labelledby="links-heading" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#003184]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
            <div>
              <h2 id="links-heading" className="text-sm font-bold text-slate-900">ANA 公式お役立ちリンク</h2>
              <p className="text-xs text-slate-500">ANAオフィシャルサイトの最新シミュレーターおよび規約</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://www.ana.co.jp/ja/jp/amc/reference/tameru/flightmile/dom/flightcalc.html"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#003184] block">国内線フライトマイル計算</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">ANA公式フライトマイル・PPシミュレーター</span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 text-sm ml-2">↗</span>
            </a>
            <a
              href="https://www.ana.co.jp/ja/jp/amc/premium/overview/premium-point/"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#003184] block">プレミアムポイントとは</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">積算ルール・路線倍率・搭乗ポイント</span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 text-sm ml-2">↗</span>
            </a>
            <a
              href="https://www.ana.co.jp/ja/jp/amc/premium/service/"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#003184] block">プレミアムメンバーサービス</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">ブロンズ・プラチナ・ダイヤモンドの特典一覧</span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 text-sm ml-2">↗</span>
            </a>
            <a
              href="https://www.ana.co.jp/ja/jp/amc/reference/tameru/flightmile/dom/chart.html"
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#003184] block">国内線区間基本マイレージ表</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">全就航路線の基本マイル（TPM）一覧</span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-600 text-sm ml-2">↗</span>
            </a>
          </div>
        </section>

        {/* システム情報 */}
        <section aria-labelledby="system-heading" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <h2 id="system-heading" className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">システム情報</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">バージョン</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">1.1.0</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">アライアンス</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">スターアライアンス</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">ストレージ</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">IndexedDB</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">新運賃制度</span>
              <span className="text-xs font-bold text-slate-700 mt-0.5 block">2026年対応済</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

