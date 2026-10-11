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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <div className="bg-[#002561] text-white pt-6 pb-6 px-6 relative shadow-md mb-6">
        <h1 className="text-xl font-bold tracking-tight text-center">設定・ツール</h1>
      </div>

      <div className="px-4 space-y-6 max-w-2xl mx-auto">
        
        {/* 目標設定 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-[#003184] border-l-4 border-[#003184] pl-3 mb-4">目標ステータス設定</h2>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
            value={targetType} 
            onChange={(e) => updateSettings({ anaTargetType: e.target.value })}
          >
            {Object.keys(targetOptions).map(k => (
              <option key={k} value={k}>{targetOptions[k].label} - {targetOptions[k].pp.toLocaleString()} PP</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-2">目標を変更するとホーム画面の達成率が再計算されます。</p>
        </div>

        {/* ガイド */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-[#003184] border-l-4 border-[#003184] pl-3 mb-4">SFC修行の基礎知識</h2>
          <Link href="/guide" className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            SFC修行ガイド 2026年版 を読む
          </Link>
        </div>

        {/* バックアップ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-[#003184] border-l-4 border-[#003184] pl-3 mb-4">データの保存・復元</h2>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            フライト記録などはすべてお使いのブラウザ（端末）に保存されています。機種変更時や、他のブラウザにデータを移行したい場合は、ファイルに書き出してください。
          </p>

          <div className="flex flex-col gap-3">
            <button onClick={exportData} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm flex justify-center items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              バックアップを保存 (ファイルダウンロード)
            </button>
            <button onClick={() => setShowImport(!showImport)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">
              ファイルから復元する
            </button>
          </div>

          {message && <p role="status" className="mt-3 text-xs font-bold text-slate-600">{message}</p>}

          {showImport && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-[10px] font-bold text-slate-400 block mb-2">ダウンロードしたJSONファイルの中身を貼り付けてください</label>
              <textarea 
                className="w-full h-32 p-3 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                value={backupText} 
                onChange={(e) => setBackupText(e.target.value)}
                placeholder='{"flightLogs":"[...]"}' 
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setShowImport(false)} className="flex-1 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors">キャンセル</button>
                <button onClick={importData} className="flex-1 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors">復元を実行</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

