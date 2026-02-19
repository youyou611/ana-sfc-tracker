"use client";

import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#003184]">SFC修行ガイド 2026年版</h1>
          <p className="text-slate-500 text-xs mt-2 font-medium">ANAスーパーフライヤーズカード解脱のための基礎知識とツールの使い方</p>
        </header>

        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">SFC（スーパーフライヤーズカード）とは？</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ANAの「プラチナ」以上のステータスを獲得した人だけが申し込める、特別なクレジットカードです。一度発行すれば、年会費を払い続ける限り「ANAの上級会員特典（ラウンジ利用、優先搭乗、手荷物優先受け取りなど）」を受けることができます。このカードを取得するために飛行機に乗りまくる行為を「SFC修行」と呼びます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">ルートA：通常</h3>
            <p className="text-3xl font-black text-[#003184]">50,000 <span className="text-sm font-bold text-slate-500">PP</span></p>
            <p className="text-xs text-slate-600 leading-relaxed">
              1月1日から12月31日までの1年間で、飛行機に乗ってひたすらプレミアムポイント（PP）を貯めるルートです。出張が多い方や、沖縄・石垣などの長距離を何度も往復（タッチ修行）できる方におすすめです。
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-blue-200 shadow-sm bg-blue-50/30 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">2026年注目</div>
            <h3 className="text-base font-bold text-[#003184]">ルートB：ライフソリューション</h3>
            <p className="text-3xl font-black text-[#003184]">30,000 <span className="text-sm font-bold text-slate-500">PP</span></p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>年間決済額 <span className="font-bold text-slate-800">400万円以上</span></li>
              <li>対象サービス利用 <span className="font-bold text-slate-800">7サービス以上</span></li>
              <li className="text-red-500 font-bold mt-2">※2026年度より「ANA Mall」「ANAトラベラーズ」の2つが利用必須となります。</li>
            </ul>
            <p className="text-[10px] text-slate-500 pt-2 border-t border-blue-100">飛行機に乗る回数を減らし、日常の買い物（カード決済）などでプラチナに到達するルートです。</p>
          </div>
        </div>

        <div className="bg-[#003184] rounded-xl p-8 text-white shadow-lg space-y-6">
          <h2 className="text-lg font-bold border-l-4 border-blue-400 pl-3">このツールの使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
              <p className="text-sm font-bold text-blue-100">目標を決める</p>
              <p className="text-xs text-blue-200/70">ダッシュボードで目標のpp数を選択します。</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
              <p className="text-sm font-bold text-blue-100">フライトを計算・登録</p>
              <p className="text-xs text-blue-200/70">左メニューの「フライト予定」から、新旧運賃や日付、往復を設定して保存します。
              (復路が異なる場合は片道ごとにフライト登録してください。)</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
              <p className="text-sm font-bold text-blue-100">データをバックアップ</p>
              <p className="text-xs text-blue-200/70">cookieを使用しているので毎年のフライト記録も保存できます！
              スマホの機種変更時などは「データの保存」からファイルを書き出してください。</p>
            </div>
          </div>
          <div className="pt-4 flex justify-center border-t border-blue-700">
            <Link href="/" className="px-8 py-3 bg-white text-[#003184] text-sm font-bold rounded-full shadow-md hover:bg-slate-100 transition-colors">
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}