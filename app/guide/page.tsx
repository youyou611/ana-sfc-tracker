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

        {/* 1. SFCとは？ */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">SFC（スーパーフライヤーズカード）とは？</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ANAの「プラチナ」以上のステータスを獲得した人だけが申し込める、特別なクレジットカードです。一度発行すれば、年会費を払い続ける限り「ANAの上級会員特典（ラウンジ利用、優先搭乗、手荷物優先受け取りなど）」を受けることができます。このカードを取得するために飛行機に乗りまくる行為を「SFC修行」と呼びます。
          </p>
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
                <li className="text-red-500 font-bold mt-2">※2026年度より「ANA Mall」「ANAトラベラーズ」の2つが利用必須となります。</li>
              </ul>
            </div>
            <p className="text-[10px] text-slate-500 pt-3 border-t border-blue-100 mt-4">飛行機に乗る回数を減らし、日常の買い物（カード決済）などでプラチナに到達するルートです。</p>
          </div>
        </div>

        {/* ★ここからAdSense対策用の大量テキストコンテンツ（デザインを踏襲）★ */}
        
        {/* 3. SFCの絶大なメリット */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">一生涯続くSFCの絶大なメリット</h2>
          
          <p className="text-sm text-slate-600 leading-relaxed">
            「なぜ数十万円もの費用をかけてまでSFC修行をするのか？」その理由は、一度SFC（スーパーフライヤーズカード）を発行してしまえば、<strong>クレジットカードの年会費を払い続ける限り、半永久的にANAの上級会員として扱われるから</strong>です。主なメリットは以下の通りです。
          </p>
          <ul className="text-sm text-slate-600 space-y-3 pl-2">
            <li className="flex items-start">
              <span className="text-[#003184] mr-2">■</span>
              <div><strong>ANAラウンジの無料利用：</strong> 出発前の待ち時間を、専用のANAラウンジで過ごすことができます。ビールなどのアルコール類やソフトドリンクが無料で提供され、国際線ラウンジではビュッフェ形式の食事やヌードルバーも楽しめます。同伴者1名も無料で入室可能です。</div>
            </li>
            <li className="flex items-start">
              <span className="text-[#003184] mr-2">■</span>
              <div><strong>優先チェックインカウンターの利用：</strong> エコノミークラスの利用であっても、ビジネスクラスや上級会員専用の「ANA PREMIUM CHECK-IN」を利用できます。年末年始やGWなどの大混雑時でも、長蛇の列に並ぶことなくスムーズに手続きが完了します。</div>
            </li>
            <li className="flex items-start">
              <span className="text-[#003184] mr-2">■</span>
              <div><strong>手荷物受け取りの優先（プライオリティタグ）：</strong> 預けた手荷物に「PRIORITY」と書かれた専用タグが付けられ、到着空港のターンテーブルで真っ先に手荷物が出てきます。到着後の時間を大幅に節約できます。</div>
            </li>
            <li className="flex items-start">
              <span className="text-[#003184] mr-2">■</span>
              <div><strong>スターアライアンス・ゴールドメンバー資格：</strong> ANAだけでなく、ユナイテッド航空、ルフトハンザドイツ航空、シンガポール航空など、世界最大のアライアンスである「スターアライアンス」加盟航空会社に乗る際も、VIP待遇（ラウンジ利用や優先搭乗）を受けることができます。海外旅行好きには最大のメリットと言えます。</div>
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
            一般的に、PP単価が<strong>10円以下なら優秀、7〜8円台なら非常に優秀なルート</strong>とされています。例えば、プラチナステータス到達に必要な50,000PPを貯める場合、PP単価10円のルートばかりに乗れば総費用は50万円になりますが、PP単価8円のルートを駆使すれば総費用は40万円に抑えることができます。いかに安い航空券で遠くへ行き、効率よくPPを稼ぐかがSFC修行の醍醐味です。
          </p>
        </div>

        {/* 5. おすすめの修行ルート */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#003184] border-l-4 border-[#003184] pl-3">SFC修行の王道・おすすめルート</h2>
          
          <p className="text-sm text-slate-600 leading-relaxed">
            プレミアムポイントは「飛行距離が長いほど」「国内線（路線倍率2倍）であるほど」貯まりやすいという特徴があります。そのため、日本を縦断するような長距離路線が修行僧のメッカとなっています。
          </p>
          <ul className="text-sm text-slate-600 space-y-4">
            <li className="p-4 border border-slate-100 rounded-lg bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1">① 羽田(HND) 〜 那覇(OKA) 単純往復</h4>
              <p className="text-xs">SFC修行の基本中の基本ルートです。便数が非常に多く、1日に2往復（1日4便搭乗）することも可能です。スーパーバリュー運賃で安くチケットを確保できれば、PP単価を大きく下げることができます。</p>
            </li>
            <li className="p-4 border border-slate-100 rounded-lg bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1">② バリュートランジットを利用した石垣(ISG)・宮古(MMY)ルート</h4>
              <p className="text-xs">伊丹や羽田から、あえて直行便を使わずに「那覇経由」で石垣島や宮古島へ行くルートです。ANAの「バリュートランジット（乗継特割）」という運賃種別を使うと、1区間ごとに搭乗ボーナスとして200PPが加算されます。つまり「羽田→那覇→石垣」と乗ることで、ボーナス200PP×2＝400PPを片道で得ることができ、非常に効率よくPPを稼げます。</p>
            </li>
            <li className="p-4 border border-slate-100 rounded-lg bg-slate-50">
              <h4 className="font-bold text-slate-800 mb-1">③ OKA-SINタッチ（国際線修行）</h4>
              <p className="text-xs">海外旅行を兼ねて一気にPPを稼ぐ伝統的な手法です。単純に日本からシンガポールへ行くのではなく、「東京(羽田)→沖縄(那覇)→東京(羽田)→シンガポール→東京(羽田)→沖縄(那覇)→東京(羽田)」という、国際線の前後に国内線（沖縄往復）をくっつける発券方法を利用します。国際線航空券に含まれる国内線区間は「積算率100%」になる特例があるため、莫大なPPを一度に獲得できます。</p>
            </li>
          </ul>
        </div>

        {/* ★ AdSense対策テキスト ここまで ★ */}

        {/* 6. ツールの使い方（元のコードのまま） */}
        <div className="bg-[#003184] rounded-xl p-8 text-white shadow-lg space-y-6 mt-8">
          <h2 className="text-lg font-bold border-l-4 border-blue-400 pl-3">このツールの使い方</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
              <p className="text-sm font-bold text-blue-100">目標を決める</p>
              <p className="text-xs text-blue-200/70">ダッシュボードで目標のPP数を選択します。</p>
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
              <p className="text-xs text-blue-200/70">ブラウザのストレージを使用しているので毎年のフライト記録も保存できます！
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