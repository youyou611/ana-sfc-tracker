export default function AnaGuidePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="bg-[#002561] text-white px-6 py-8 shadow-md">
        <h1 className="text-2xl font-black">ANA修行ガイド</h1>
        <p className="text-blue-100 text-sm mt-2">プレミアムポイントと搭乗記録の管理</p>
      </header>
      <article className="max-w-3xl mx-auto p-5 space-y-5">
        <section className="bg-white p-5 rounded-2xl shadow-sm">
          <h2 className="font-black text-[#003184] mb-2">このアプリでできること</h2>
          <p className="text-sm leading-7 text-slate-700">ANA国内線・国際線のPP計算、ステータス目標の進捗管理、搭乗履歴と費用の記録ができます。</p>
        </section>
        <section className="bg-white p-5 rounded-2xl shadow-sm">
          <h2 className="font-black text-[#003184] mb-2">プレミアムポイント（PP）の計算</h2>
          <p className="text-sm leading-7 text-slate-700">PPは搭乗マイルとは別のステータス判定用ポイントです。基本区間マイル × 運賃・予約クラスに応じた積算率 × 路線倍率 ＋ 搭乗ポイントで計算します。国内線の路線倍率は2倍、国際線はANAグループ運航便の対象路線で1倍または1.5倍です。</p>
          <p className="text-sm leading-7 text-slate-700 mt-2">国内線は2026年5月19日搭乗分から新運賃区分を適用します。搭乗日を基準に切り替え、旧運賃での搭乗分には旧制度を使います。国際線は予約クラスと運航会社により積算率・搭乗ポイントが異なります。</p>
          <p className="text-sm leading-7 text-slate-500 mt-2">区間マイル表にない路線や対象外の予約クラスは正確に算出できない場合があります。表示値は見積もりとして使い、確定した実績はANA公式の積算結果を記録してください。</p>
          <a className="text-sm font-bold text-[#003184] underline mt-3 inline-block" href="https://www.ana.co.jp/ja/jp/amc/premium/overview/premium-point/" target="_blank" rel="noreferrer">ANA公式：プレミアムポイントの説明</a>
        </section>
        <section className="bg-white p-5 rounded-2xl shadow-sm">
          <h2 className="font-black text-[#003184] mb-2">搭乗記録について</h2>
          <p className="text-sm leading-7 text-slate-700">計算結果は目安として利用し、確定した積算実績はANA公式の表示に合わせて記録してください。履歴はこの端末のANA専用データベースに保存されます。</p>
        </section>
      </article>
    </main>
  );
}

