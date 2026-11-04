import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '利用規約・免責事項・プライバシーポリシー | SFC Tracker',
  description: 'SFC Trackerの利用規約、非公式ツールとしての免責事項、ローカル保存、画像の権利、Cookieとプライバシーに関する方針。',
  robots: { index: true, follow: true },
}

const sections = [
  {
    id: 'unofficial',
    title: '1. 重要なお知らせ（非公式ツール）',
    paragraphs: [
      'SFC Tracker（以下「本サービス」）は、個人の航空ファンが開発・運営する非公式のフライト記録・ポイント計算支援ツールです。全日本空輸株式会社（ANA）、日本航空株式会社（JAL）、その他いかなる航空会社・グループ企業とも提携・公認・資本関係等はなく、一切関係ありません。',
      '本サービスについての質問、要望、苦情、障害報告等を各航空会社へ問い合わせることはお控えください。本サービスに関する問い合わせは、本ページの運営者窓口をご利用ください。',
    ],
  },
  {
    id: 'accuracy',
    title: '2. 計算結果・情報の正確性について',
    paragraphs: [
      'プレミアムポイント（PP）、マイル、区間距離、PP単価、ステータス達成見込みその他の表示は、本サービス独自の算出ロジックや登録情報に基づく参考値です。航空会社による実際の付与数、会員資格、ステータス到達、特典適用、運賃・路線条件等を保証するものではありません。',
      '運賃、積算率、対象便、キャンペーン、会員制度等は変更される場合があります。予約・購入・搭乗その他の判断を行う前に、必ず各航空会社の公式サイトおよび公式発表で最新情報をご確認ください。計算結果の利用により生じた損害について、法令上認められる範囲で運営者は責任を負いません。',
    ],
  },
  {
    id: 'storage',
    title: '3. データの保存・消失・バックアップ',
    paragraphs: [
      '本サービスに入力したフライトログ、設定、計算機の状態、画像等のデータは、ユーザーが利用しているブラウザ・端末内のIndexedDBおよびLocalStorageに保存されます。これらの入力データを運営者のサーバーへ送信・保存する機能は設けていません。',
      'ブラウザのデータ・キャッシュ削除、プライベートブラウズの利用、ブラウザや端末の故障・紛失、端末変更、アプリの利用環境変更等によりデータが消失することがあります。必要なデータは、設定画面の「データのバックアップ」からJSONファイルを定期的にエクスポートし、ユーザー自身で安全な場所に保管してください。運営者はデータの消失・破損・復元不能について、法令上認められる範囲で責任を負いません。',
    ],
  },
  {
    id: 'images',
    title: '4. 画像の権利と表現',
    paragraphs: [
      '本サービスに表示される航空機等の画像の一部は、生成AIおよび独自の加工によって作成されたイメージです。各航空会社から提供された公式素材・公式ロゴであることを示すものではなく、航空会社による承認・推奨を意味しません。画像は実在する機体や塗装、設備を正確に再現しているとは限りません。',
      '第三者が権利を有する名称、商標、写真等が画面・説明文に登場する場合、それぞれの権利は各権利者に帰属します。',
    ],
  },
  {
    id: 'privacy',
    title: '5. プライバシーポリシー（広告・アクセス解析）',
    paragraphs: [
      '本サービスでは、運営・改善・利用状況の把握のため、Google Analytics等のアクセス解析ツールを将来導入する場合があります。また、広告配信にGoogle AdSense等の第三者配信サービスや各種アフィリエイトプログラムを利用する場合があります。利用するサービスに応じて、Cookie、類似の識別技術、端末情報、閲覧したページ、操作・アクセス情報等が、各サービス提供者により取得・処理されることがあります。',
      'Cookie等は、アクセス解析、広告の配信・測定、表示内容の最適化、不正利用の防止等に使用される場合があります。ブラウザの設定によりCookieを無効化・削除できますが、一部機能や広告表示に影響することがあります。第三者によるデータの取扱いは各サービス提供者のプライバシーポリシーおよび設定に従います。',
      '現在、本サービスではアプリ内に入力したフライトログや設定を運営者のサーバーへ送信する機能はありません。ただし、ホスティング、セキュリティ、広告または解析サービスの導入・設定に伴い、アクセスに関する技術情報が各提供者により処理される場合があります。サービスの導入状況に応じて、本ページの内容を更新します。',
    ],
  },
  {
    id: 'terms',
    title: '6. 利用条件・サービスの変更',
    paragraphs: [
      'ユーザーは自己の責任で本サービスを利用するものとします。運営者は、保守、障害対応、仕様変更その他の事情により、事前の予告なく本サービスの全部または一部を変更・停止・終了する場合があります。',
      '本サービス内の説明、計算、リンク、情報等は、完全性、正確性、継続的な提供を保証するものではありません。本規約は必要に応じて改定され、改定後の内容は本ページに掲載した時点から適用されます。',
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-4 pb-32 pt-6 text-white sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-3xl border border-blue-300/15 bg-gradient-to-br from-[#002561] via-[#003477] to-[#00152f] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200">SFC TRACKER · POLICY</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">利用規約・免責事項・プライバシーポリシー</h1>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/80">
            安心してご利用いただくために、本サービスの性質、データの扱い、利用上の注意をご確認ください。
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-100/10 p-4 text-sm leading-relaxed text-amber-50">
            <strong className="block">非公式サービスについて</strong>
            本サービスは個人が運営するファン向けツールで、航空会社から公認・運営されていません。
          </div>
        </header>

        <nav aria-label="このページの項目" className="mb-6 rounded-2xl border border-white/10 bg-[#0B1D33] p-4 sm:p-5">
          <p className="mb-3 text-xs font-bold tracking-wide text-blue-200">このページの項目</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white">
                {section.title}
              </a>
            ))}
            <a href="#operator" className="rounded-xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white">7. 運営者情報・お問い合わせ</a>
          </div>
        </nav>

        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#0B1D33] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] sm:p-6">
              <h2 id={`${section.id}-heading`} className="text-base font-extrabold leading-relaxed text-white sm:text-lg">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}

          <section id="operator" aria-labelledby="operator-heading" className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#0B1D33] p-5 sm:p-6">
            <h2 id="operator-heading" className="text-base font-extrabold text-white sm:text-lg">7. 運営者情報・お問い合わせ</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-slate-400">サービス名</dt><dd className="text-slate-200">SFC Tracker</dd>
              <dt className="text-slate-400">運営者</dt><dd className="text-slate-200">Development Team / @youyou611</dd>
              <dt className="text-slate-400">お問い合わせ</dt>
              <dd className="text-slate-300">
                問い合わせ窓口は準備中です。窓口を公開するまでは、公開済みの開発者SNSアカウントをご確認ください。航空会社への本サービスに関するお問い合わせはご遠慮ください。
              </dd>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">※運営者名および問い合わせ先は公開前に実際の連絡先へ更新してください。</p>
          </section>
        </div>

        <footer className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>※本アプリは個人のファンによる非公式ツールであり、実在する航空会社とは一切関係ありません。</p>
          <Link href="/settings" className="font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-white">設定・JSONバックアップへ戻る</Link>
        </footer>
      </div>
    </main>
  )
}
