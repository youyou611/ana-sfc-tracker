# 世界の空港間距離・路線マップ — メンバー確認資料

更新日: 2026-10-11
状態: 空港データと距離計算の共通素材は実装・検証済み。Flight Recorderの路線マップに組み込み済み（今回の追加分は未検証）。ANA/JALの修行計算機から汎用世界距離ツールを外す方針。

## 現在の機能

Flight Recorderの「路線マップ」ビューで、保存済みの出発・到着空港を世界地図上に表示し、登録路線からフライト詳細を開けます。距離は大圏距離の概算値を合計表示します。新規画面の実操作・表示検証は未実施です。

共通素材には、任意の2空港を検索・選択して一般マイル/km/海里を換算する `WorldDistanceCalculator.tsx` もありますが、ANA/JAL計算機には接続していません。過去に計算機へ組み込んで検証した機能として残しています。今回Flight Recorderへ追加したのは、保存済みフライトの路線マップです。

## 距離の定義を区別する

この機能が計算する値は、空港座標に基づく **大圏距離（great-circle distance）** です。地球表面上の最短距離の球面近似であり、実際の飛行経路や航空会社の区間マイルを示すものではありません。

- **ANAのPP計算:** 既存のANA公式マイレージチャートによる区間基本マイルを使います。世界距離ツールの値をPPに自動投入しません。
- **JALのFOP/LSP計算:** 既存のJAL参考区間マイル表と、必要に応じた利用者による距離の手入力を維持しています。大圏距離をFOP/LSPへ自動投入しません。
- **未知の路線:** 追加ツールでは座標データから大圏距離を計算できますが、その結果が公式TPMであるとは扱いません。公式積算値には搭乗日に適用される航空会社の公式表を確認してください。

## 空港データ

元データ: [OurAirports airports.csv](https://davidmegginson.github.io/ourairports-data/airports.csv)

抽出条件: `scheduled_service=yes`、大文字3文字のIATAコード、緯度・経度が数値かつ有効範囲内。small_airport、seaplane_base、heliportも、条件を満たすデータは除外していません。

| 検査項目 | 結果 |
|---|---:|
| 空港レコード | 4,133 |
| JSONサイズ | 856,283 bytes |
| IATAコード重複グループ | 0 |
| 範囲外座標 | 0 |
| large_airport | 1,150 |
| medium_airport | 2,094 |
| small_airport | 764 |
| seaplane_base | 71 |
| heliport | 54 |

生成データ: `shared/world-airports.json`

SHA-256: `BEC2CA51CBE98B996F651BAD043D6502300DC24650D03ED30911697E801DEC41`

OurAirportsデータは公開ドメインとして配布されていますが、コミュニティ管理のため、データの正確性・完全性・目的への適合性は保証されていません。データの再取得時は抽出条件・件数・重複・座標範囲を再検証してください。

## 計算方法

`shared/worldDistance.ts` の Haversine（ハーサイン）式で、緯度・経度から中心角を計算し、平均地球半径 6,371.0088 km を用いて距離へ変換します。キロメートルから一般マイルは 1.609344 km、海里は 1.852 km として換算します。逆方向でも同じ距離になります。大圏距離の結果は推定値で、航空会社の計算規則やTPM表の値を置き換えるものではありません。

## 過去の共通距離素材に対する検証

以下はANA/JAL計算機へ距離ツールを組み込んでいた時点の共通素材・計算機に対する過去の結果です。Flight Recorderの路線マップを検証した結果ではありません。

- ANA: `npx tsc --noEmit` 成功、`npm run lint` 成功、`npm run build` 成功。
- JAL: `npx tsc --noEmit` 成功、`npm run lint` 成功（既存の画像表示 `no-img-element` 警告6件）、`npm run build` 成功。
- 計算モジュールを一時的にコンパイルして実行: HND–LHR = 約5,960一般マイル / 9,592 km / 5,179海里、HND–SIN = 約3,293一般マイル / 5,300 km / 2,862海里、JFK–LHR = 約3,442一般マイル / 5,540 km / 2,991海里、SYD–GRU = 約8,306一般マイル / 13,368 km / 7,218海里。
- テストで確認: 逆方向の対称性、同一空港間のゼロ距離、無効座標の拒否、4,133件のコード一意性、全座標範囲。
- 未実施: ブラウザーでの視覚的確認、実機・モバイル操作の確認、都市コードから複数空港への自動展開。
- 未実施（Flight Recorderの路線マップ）: 型チェック、lint、ビルド、ブラウザー実操作、日付変更線を跨ぐ路線表示。

## 限界・確認事項

1. IATA都市コード（例: TYO、NYC、LON）と空港コードは別物の場合があり、今回のデータは空港単位です。都市コードから複数空港を自動解決する機能は未実装です。TYOなどを入力したとき、HND/NRT等の候補が都市名から自動的に束ねられるわけではありません。
2. 大圏距離は飛行経路・風・航空路・経由地・公式距離の丸めなどを反映しません。
3. ANA/JALの公式積算用区間マイルを世界中の全路線へ拡張するには、それぞれの搭乗日に適用される公式マイレージ表またはライセンスされたIATA TPMデータが必要です。今回の公開座標データはその代替になりません。
4. Flight Recorderの路線マップは記録済みの経路を可視化する用途です。ANA/JALのPP/FOP計算結果へ推定大圏距離を結びつけません。

## 参照元

- OurAirports data: https://ourairports.com/data/
- OurAirports data dictionary: https://ourairports.com/help/data-dictionary.html
- IATA Ticketed Point Mileage: https://www.iata.org/en/services/finance/mileage/ticketed-point-mileage-tpm/
- ANA international mileage chart: https://www.ana.co.jp/ja/jp/amc/flightmile/int/chart/
- JAL sector miles: https://www.jal.co.jp/jp/ja/jmb/earn/travel/flight/jismt/
