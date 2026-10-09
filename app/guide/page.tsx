"use client";

import Link from "next/link";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#003184]">Ultimate Flight Log & Status Tracker (Beta)</h1>
          <p className="text-slate-500 text-xs mt-2 font-medium">JAL / ANA ステータス修行 & 航空ファン向けフライト記録アプリ</p>
        </header>

        {/* アプリについて (Beta版) */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-l-4 border-emerald-500 pl-3">本アプリについて (Beta版)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            このアプリは、ANAの「SFC修行」およびJALの「JGC修行」を行うステータス修行僧、ならびに搭乗機材や便名などの詳細を記録したい航空ファンのための<strong>Ultimate Flight Log & Status Tracker</strong>です。<br />
            現在Beta版として提供しており、端末の内部ストレージ（IndexedDB）を使用してデータを保存しています。
          </p>
          
          <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2">🔄 アップデート履歴</h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex gap-2">
                <span className="font-mono text-emerald-600 font-bold">2026.10</span>
                <span>JAL (FOP / LSP) 対応、オタク向けメタデータ（便名・機材・機体記号・座席）の記録機能を追加。IndexedDBへの移行とFramer Motionによるアプリ風UIへの刷新。</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-blue-600 font-bold">2026.09</span>
                <span>ANA SFCの2026年9月発表の改定ルール（SFC LITE / SFC PLUS）についてのガイダンスを追加。国際線の倍率計算機能実装。</span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-slate-500 font-bold">2026.08</span>
                <span>Beta版リリース。PPシミュレーターと国内線記録機能の実装。</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 1. SFCとは？ */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">SFC（スーパーフライヤーズカード）とは？</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ANAの「プラチナ」以上のステータスを獲得した人だけが申し込める、特別なクレジットカードです。一度発行すれば、年会費を払い続ける限り「ANAの上級会員特典（ラウンジ利用、優先搭乗、手荷物優先受け取りなど）」を受けることができます。このカードを取得するために飛行機に乗りまくる行為を「SFC修行」と呼びます。
          </p>
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <h3 className="text-sm font-bold text-red-700 flex items-center">
              <span className="mr-2">⚠️</span>【重要】2026年9月発表・2028年以降のSFC制度改定について
            </h3>
            <p className="text-xs text-red-600 mt-2 leading-relaxed">
              2028年4月よりSFCの制度が大きく変わり、クレジットカードの年間決済額（300万円）を基準に<strong>「SFC PLUS」と「SFC LITE」の2つに区分け</strong>されます。2026年9月末の最新の発表により、SFC LITEでも条件付きでANAラウンジが利用できるよう見直されましたが、海外提携航空会社を利用する際のスターアライアンス資格などに大きな差がつくため、修行の際は「今後のカード決済額」も視野に入れる必要があります。
            </p>
          </div>
        </div>

        {/* 2. ステータス獲得ルート */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">ルートA：通常（フライト重視）</h3>
              <p className="text-3xl font-black text-[#003184] mt-2">50,000 <span className="text-sm font-bold text-slate-500">PP</span></p>
              <p className="text-xs text-slate-600 leading-relaxed mt-4">
                1月1日から12月31日までの1年間で、飛行機に乗ってひたすらプレミアムポイント（PP）を貯める伝統的なルートです。うち、ANAグループ運航便で25,000PP以上を獲得する必要があります。出張が多い方や、沖縄・石垣などの長距離を何度も往復（タッチ修行）できる方におすすめです。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 border border-blue-200 shadow-sm bg-blue-50/30 space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">2026年注目</div>
            <div>
              <h3 className="text-base font-bold text-[#003184]">ルートB：ライフソリューション</h3>
              <p className="text-3xl font-black text-[#003184] mt-2">30,000 <span className="text-sm font-bold text-slate-500">PP</span></p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside mt-4">
                <li>ANA便での獲得PP <span className="font-bold text-slate-800">15,000PP以上</span></li>
                <li>年間決済額 <span className="font-bold text-slate-800">400万円以上</span></li>
                <li>対象サービス利用 <span className="font-bold text-slate-800">7サービス以上</span></li>
                <li className="text-red-500 font-bold mt-2">※2026年度より「ANA Mall」「ANAトラベラーズ」の2つが利用必須となっています。</li>
              </ul>
            </div>
            <p className="text-[10px] text-slate-500 pt-3 border-t border-blue-100 mt-4">飛行機に乗る回数を減らし、日常の買い物（カード決済）などでプラチナに到達するルートです。</p>
          </div>
        </div>

        {/* 3. SFCの絶大なメリット */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">SFCのメリット（2028年新制度対応版）</h2>
          
          <p className="text-sm text-slate-600 leading-relaxed">
            数十万円の費用をかけてまでSFC修行をする最大の理由は、「カードの年会費を払う限り上級会員でいられる」ことでした。2028年4月以降は、前年のカード決済額が300万円以上なら「SFC PLUS」、未満なら「SFC LITE」となり、受けられる恩恵が変わります。
          </p>
          <ul className="text-sm text-slate-600 space-y-4 pl-2">
            <li className="flex items-start">
              <span className="text-[#003184] mr-2 mt-1">■</span>
              <div>
                <strong>ANAラウンジの利用</strong><br/>
                <span className="text-xs text-slate-500">
                  【SFC PLUS】 従来通り無料で利用可能です。<br/>
                  【SFC LITE】 9月の改定見直しにより利用可能になりましたが、国内線は「事前予約制」、国際線は「羽田・成田・ホノルル（ANA運航便搭乗時のみ）」に限定されます。
                </span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-[#003184] mr-2 mt-1">■</span>
              <div>
                <strong>優先チェックインと手荷物優先受け取り</strong><br/>
                <span className="text-xs text-slate-500">混雑する空港でも「ANA PREMIUM CHECK-IN」の利用や、到着時の手荷物優先受け取り（プライオリティタグ）の特典は、PLUS・LITE共通で引き続き利用できます。</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-[#003184] mr-2 mt-1">■</span>
              <div>
                <strong>スターアライアンス・ゴールドメンバー資格</strong><br/>
                <span className="text-xs text-slate-500">
                  【SFC PLUS】 従来通り「ゴールド」を維持し、海外の提携航空会社でもラウンジや優先搭乗が使えます。<br/>
                  <span className="text-red-500 font-bold">【SFC LITE】 「シルバー」に格下げされます。</span>これにより、ルフトハンザやユナイテッド航空などに乗る際、VIP待遇（ラウンジや優先搭乗など）を受けることができなくなります。海外旅行メインの方には最大の注意点です。
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* 4. マイルとPPの違い / PP単価 */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">マイルとプレミアムポイント（PP）の違い</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            SFC修行を始めるにあたって、絶対に理解しておかなければならないのが「マイル」と「プレミアムポイント（PP）」の違いです。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-2">マイル（マイレージ）とは？</h4>
              <p className="text-xs text-slate-600">
                クレジットカードの買い物や、飛行機に乗ることで貯まる「ポイント」のようなものです。貯まったマイルは、無料の特典航空券に交換したり、電子マネー（ANA SKY コイン）に交換したりと、お金の代わりとして使うことができます。
              </p>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-[#003184] text-sm mb-2">プレミアムポイント（PP）とは？</h4>
              <p className="text-xs text-slate-600">
                ステータス（上級会員資格）を決めるためだけに存在する「経験値」のようなものです。<strong>お金を払って飛行機に乗った時にしか貯まりません</strong>（特典航空券での搭乗は付与率0%です）。毎年1月1日〜12月31日までの1年間でリセットされ、翌年への繰り越しはできません。
              </p>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-800 mt-6">PP単価とは？（修行の最重要キーワード）</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            修行僧が常に計算しているのが<strong>「PP単価」</strong>です。これは「1プレミアムポイントを獲得するのに、いくらの航空券代がかかったか」を表す数値です。<br/><br/>
            計算式： <code>航空券代 ÷ 獲得プレミアムポイント ＝ PP単価</code><br/><br/>
            一般的に、PP単価が<strong>10円以下なら優秀、7〜8円台なら非常に優秀なルート</strong>とされています。いかに安い航空券で遠くへ行き、効率よくPPを稼ぐかがSFC修行の醍醐味です。
          </p>
        </div>

        {/* 5. おすすめの修行ルートと最新運賃ルール */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">2026年最新の運賃体系とおすすめルート</h2>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-amber-800 text-sm mb-2">【重要】2026年5月以降の国内線運賃リニューアル</h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              2026年5月19日よりANA国内線の運賃体系が刷新され、国際線と共通の<strong>「Simple（シンプル）」「Standard（スタンダード）」「Flex（フレックス）」</strong>の3種類に再編されました。従来の「スーパーバリュー」などの名称は廃止され、また株主優待割引の積算率が100%から80%へ引き下げられるなど、PP獲得計算のルールが大きく変更されています。
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            プレミアムポイントは「飛行距離が長いほど」「国内線（路線倍率2倍）であるほど」貯まりやすいという特徴があります。そのため、日本を縦断するような長距離路線が修行僧のメッカとなっています。
          </p>
          <ul className="text-sm text-slate-600 space-y-4">
            <li className="p-4 border border-slate-100 rounded-lg bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1">① 羽田(HND) 〜 那覇(OKA) 単純往復</h4>
              <p className="text-xs">SFC修行の基本中の基本ルートです。便数が非常に多く、1日に2往復することも可能です。新運賃「Simple」のセール運賃などで安くチケットを確保できれば、PP単価を大きく下げることができます。</p>
            </li>
            <li className="p-4 border border-slate-100 rounded-lg bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1">② OKA-SINタッチ（国際線修行）</h4>
              <p className="text-xs">
                海外旅行を兼ねて一気にPPを稼ぐ伝統的な手法です。「東京(羽田)→沖縄(那覇)→東京(羽田)→シンガポール→東京(羽田)→沖縄(那覇)→東京(羽田)」という、国際線の前後に国内線（沖縄往復）をくっつける発券方法を利用します。国際線航空券に含まれる国内線区間は「積算率100%」になる特例があるため、莫大なPPを一度に獲得できます。
              </p>
            </li>
          </ul>
        </div>

        {/* 6. ツールの使い方 */}
        <div className="bg-[#003184] rounded-xl p-8 text-white shadow-lg space-y-6 mt-8">
          <h2 className="text-lg font-bold border-l-4 border-blue-400 pl-3">このツールの使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
              <p className="text-sm font-bold text-blue-100">目標を決める</p>
              <p className="text-xs text-blue-200/70">ダッシュボードで目標のPP数（プラチナ 50,000PPなど）を選択します。</p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
              <p className="text-sm font-bold text-blue-100">フライトを計算・登録</p>
              <p className="text-xs text-blue-200/70">
                左メニューの「フライト予定」から路線と運賃種別を選んで保存します。<br/>
                <span className="text-yellow-300 font-bold">★2026年10月より「ANA国際線」の計算にも対応しました！</span>
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
              <p className="text-sm font-bold text-blue-100">データをバックアップ</p>
              <p className="text-xs text-blue-200/70">ブラウザのストレージを使用しているので毎年のフライト記録も保存できます！スマホの機種変更時などは「データの保存」からファイルを書き出してください。</p>
            </div>
          </div>
          <div className="pt-4 flex justify-center border-t border-blue-700">
            <Link href="/settings" className="px-8 py-3 bg-white text-[#003184] text-sm font-bold rounded-full shadow-md hover:bg-slate-100 transition-colors">
              設定へ戻る
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}