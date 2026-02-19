"use client";

import { useState } from "react";
import Link from "next/link";

export default function BackupPage() {
  const [importStatus, setImportStatus] = useState("");

  // --- データをJSONファイルとしてダウンロード（エクスポート） ---
  const handleExport = () => {
    const data = localStorage.getItem("sfc_flight_logs");
    if (!data || data === "[]") {
      alert("保存するフライトデータがありません。");
      return;
    }
    
    // 現在の日付をファイル名に入れる
    const today = new Date().toISOString().split('T')[0];
    const fileName = `sfc_backup_${today}.json`;
    
    // Blob（ファイルの実体）を作成してダウンロード発火
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- JSONファイルを読み込んでLocalStorageに保存（インポート） ---
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // JSONが正しいかチェック
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // 強制上書き
          localStorage.setItem("sfc_flight_logs", JSON.stringify(parsed));
          setImportStatus("復元が完了しました！ダッシュボードを確認してください。");
          // 少し待ってからリロード
          setTimeout(() => window.location.href = "/", 1500);
        } else {
          setImportStatus("エラー：ファイルの形式が正しくありません。");
        }
      } catch (err) {
        setImportStatus("エラー：ファイルを読み込めませんでした。");
      }
    };
    reader.readAsText(file);
  };

  // --- データを全消去（危険ゾーン） ---
  const handleClear = () => {
    if (confirm("【警告】すべてのフライト履歴が完全に削除されます。\n本当によろしいですか？")) {
      if (confirm("本当にすべて消去しますか？（元には戻せません）")) {
        localStorage.removeItem("sfc_flight_logs");
        alert("すべてのデータを消去しました。");
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-xl font-bold tracking-tight text-[#003184]">データの保存と復元</h1>
          <p className="text-slate-500 text-xs mt-2 font-medium">スマホの機種変更時や、ブラウザのキャッシュクリア対策の機能です。</p>
        </header>

        <div className="grid gap-6">
          
          {/* エクスポート（書き出し） */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">バックアップを保存 (エクスポート)</h2>
                <p className="text-[10px] text-slate-500">現在のフライト履歴を「JSONファイル」として端末にダウンロードします。</p>
              </div>
            </div>
            <button onClick={handleExport} className="px-6 py-3 bg-[#003184] hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center justify-center w-full md:w-auto">
              ファイルをダウンロード
            </button>
          </div>

          {/* インポート（読み込み） */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">データを復元 (インポート)</h2>
                <p className="text-[10px] text-slate-500">以前ダウンロードしたバックアップファイル（.json）を読み込みます。</p>
                <p className="text-[10px] text-red-500 font-bold mt-1">※現在のデータはすべて上書きされます。</p>
              </div>
            </div>
            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-lg"
              />
            </div>
            {importStatus && (
              <p className={`text-xs font-bold ${importStatus.includes('エラー') ? 'text-red-500' : 'text-emerald-600'}`}>
                {importStatus}
              </p>
            )}
          </div>

          {/* 危険ゾーン（全消去） */}
          <div className="bg-red-50 rounded-xl p-8 border border-red-200 space-y-4 mt-8">
            <h2 className="text-base font-bold text-red-700">Danger Zone (全データ初期化)</h2>
            <p className="text-[10px] text-red-500">この操作は取り消せません。アプリ内のすべてのフライト履歴が完全に消去されます。</p>
            <button onClick={handleClear} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm transition-all">
              すべての履歴を消去する
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}