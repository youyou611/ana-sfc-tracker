// ANA国際線 区間基本マイル (積算率100%) 片道 と 路線倍率
// 出典: ANA マイレージチャート(国際線) https://www.ana.co.jp/ja/jp/amc/flightmile/int/chart/
// ※ 区間基本マイルは毎年秋にIATAが発行するTPMを基準とし、1/1～12/31搭乗分に適用されます。
// ※ ANAは都市単位で区間を定めています。東京=羽田/成田、上海=浦東/虹橋、ソウル=仁川/金浦、台北=桃園/松山。
// ※ 日本側の発着地はチャートに掲載のある 東京・大阪(関西)・名古屋(中部) のみです。

export type IntlRegion = "northAmerica" | "europe" | "asia" | "oceania" | "vladivostok";

/** 地域ごとの表示名とプレミアムポイントの路線倍率 (ANAグループ運航便) */
export const INTL_REGIONS: { [key in IntlRegion]: { label: string; multiplier: number } } = {
  northAmerica: { label: "北米・ハワイ", multiplier: 1.0 },
  europe: { label: "欧州・トルコ・ロシア(モスクワ)", multiplier: 1.0 },
  asia: { label: "アジア", multiplier: 1.5 },
  oceania: { label: "オセアニア", multiplier: 1.5 },
  vladivostok: { label: "ウラジオストク", multiplier: 1.5 },
};

export type IntlAirport = { code: string; name: string; region: IntlRegion | "japan"; city: string };

/** 日本側の空港 (チャート上の発着都市キー: TYO/OSA/NGO) */
export const INTL_JAPAN_AIRPORTS: IntlAirport[] = [
  { code: "HND", name: "東京(羽田)", region: "japan", city: "TYO" },
  { code: "NRT", name: "東京(成田)", region: "japan", city: "TYO" },
  { code: "KIX", name: "大阪(関西)", region: "japan", city: "OSA" },
  { code: "NGO", name: "名古屋(中部)", region: "japan", city: "NGO" },
];

/** 海外側の空港 (city = 同一都市の空港をまとめるキー) */
export const INTL_OVERSEAS_AIRPORTS: IntlAirport[] = [
  { code: "SEA", name: "シアトル", region: "northAmerica", city: "SEA" },
  { code: "SFO", name: "サンフランシスコ", region: "northAmerica", city: "SFO" },
  { code: "SJC", name: "サンノゼ", region: "northAmerica", city: "SJC" },
  { code: "LAX", name: "ロサンゼルス", region: "northAmerica", city: "LAX" },
  { code: "IAH", name: "ヒューストン", region: "northAmerica", city: "IAH" },
  { code: "ORD", name: "シカゴ", region: "northAmerica", city: "ORD" },
  { code: "JFK", name: "ニューヨーク", region: "northAmerica", city: "JFK" },
  { code: "IAD", name: "ワシントンD.C.", region: "northAmerica", city: "IAD" },
  { code: "HNL", name: "ホノルル", region: "northAmerica", city: "HNL" },
  { code: "YVR", name: "バンクーバー", region: "northAmerica", city: "YVR" },
  { code: "MEX", name: "メキシコシティ", region: "northAmerica", city: "MEX" },
  { code: "LHR", name: "ロンドン", region: "europe", city: "LHR" },
  { code: "FRA", name: "フランクフルト", region: "europe", city: "FRA" },
  { code: "MUC", name: "ミュンヘン", region: "europe", city: "MUC" },
  { code: "DUS", name: "デュッセルドルフ", region: "europe", city: "DUS" },
  { code: "CDG", name: "パリ", region: "europe", city: "CDG" },
  { code: "BRU", name: "ブリュッセル", region: "europe", city: "BRU" },
  { code: "VIE", name: "ウィーン", region: "europe", city: "VIE" },
  { code: "VVO", name: "ウラジオストク", region: "vladivostok", city: "VVO" },
  { code: "IST", name: "イスタンブール", region: "europe", city: "IST" },
  { code: "SVO", name: "モスクワ", region: "europe", city: "SVO" },
  { code: "MXP", name: "ミラノ", region: "europe", city: "MXP" },
  { code: "ARN", name: "ストックホルム", region: "europe", city: "ARN" },
  { code: "PVG", name: "上海(浦東)", region: "asia", city: "PVG" },
  { code: "SHA", name: "上海(虹橋)", region: "asia", city: "PVG" },
  { code: "PEK", name: "北京", region: "asia", city: "PEK" },
  { code: "HKG", name: "香港", region: "asia", city: "HKG" },
  { code: "CAN", name: "広州", region: "asia", city: "CAN" },
  { code: "DLC", name: "大連", region: "asia", city: "DLC" },
  { code: "TAO", name: "青島", region: "asia", city: "TAO" },
  { code: "XMN", name: "厦門", region: "asia", city: "XMN" },
  { code: "HGH", name: "杭州", region: "asia", city: "HGH" },
  { code: "SHE", name: "瀋陽", region: "asia", city: "SHE" },
  { code: "CTU", name: "成都", region: "asia", city: "CTU" },
  { code: "WUH", name: "武漢", region: "asia", city: "WUH" },
  { code: "SZX", name: "深圳", region: "asia", city: "SZX" },
  { code: "ICN", name: "ソウル(仁川)", region: "asia", city: "ICN" },
  { code: "GMP", name: "ソウル(金浦)", region: "asia", city: "ICN" },
  { code: "TPE", name: "台北(桃園)", region: "asia", city: "TPE" },
  { code: "TSA", name: "台北(松山)", region: "asia", city: "TPE" },
  { code: "SIN", name: "シンガポール", region: "asia", city: "SIN" },
  { code: "CGK", name: "ジャカルタ", region: "asia", city: "CGK" },
  { code: "BKK", name: "バンコク", region: "asia", city: "BKK" },
  { code: "SGN", name: "ホーチミン", region: "asia", city: "SGN" },
  { code: "HAN", name: "ハノイ", region: "asia", city: "HAN" },
  { code: "MNL", name: "マニラ", region: "asia", city: "MNL" },
  { code: "KUL", name: "クアラルンプール", region: "asia", city: "KUL" },
  { code: "RGN", name: "ヤンゴン", region: "asia", city: "RGN" },
  { code: "DEL", name: "デリー", region: "asia", city: "DEL" },
  { code: "BOM", name: "ムンバイ", region: "asia", city: "BOM" },
  { code: "PNH", name: "プノンペン", region: "asia", city: "PNH" },
  { code: "MAA", name: "チェンナイ", region: "asia", city: "MAA" },
  { code: "SYD", name: "シドニー", region: "oceania", city: "SYD" },
  { code: "PER", name: "パース", region: "oceania", city: "PER" },
] as IntlAirport[];

export const INTL_AIRPORTS: IntlAirport[] = [...INTL_JAPAN_AIRPORTS, ...INTL_OVERSEAS_AIRPORTS];

/** 日本側の都市キー → 海外の都市キー → 区間基本マイル(片道) */
const INTL_MILES: { [japan: string]: { [city: string]: number } } = {
  TYO: { SEA: 4775, SFO: 5130, SJC: 5162, LAX: 5458, IAH: 6658, ORD: 6283, JFK: 6739, IAD: 6762, HNL: 3831, YVR: 4681, MEX: 7003, LHR: 6220, FRA: 5929, MUC: 5866, DUS: 5959, CDG: 6207, BRU: 6067, VIE: 5699, VVO: 676, IST: 5748, SVO: 4664, MXP: 6078, ARN: 5439, PVG: 1111, PEK: 1313, HKG: 1823, CAN: 1822, DLC: 1042, TAO: 1117, XMN: 1520, HGH: 1206, SHE: 987, CTU: 2100, WUH: 1530, SZX: 1813, ICN: 758, TPE: 1330, SIN: 3312, CGK: 3612, BKK: 2869, SGN: 2706, HAN: 2294, MNL: 1880, KUL: 3345, RGN: 2984, DEL: 3656, BOM: 4201, PNH: 2759, MAA: 4017, SYD: 4863, PER: 4926 },
  OSA: { PVG: 831, PEK: 1092, HKG: 1548, DLC: 818, TAO: 864, HGH: 926 },
  NGO: { PVG: 919, HKG: 1632 },
};

const findAirport = (code: string) => INTL_AIRPORTS.find((a) => a.code === code);

/** 日本側・海外側を判定して { japan, overseas } を返す (どちらかが日本でなければ null) */
const splitEnds = (a: string, b: string) => {
  const A = findAirport(a);
  const B = findAirport(b);
  if (!A || !B) return null;
  if (A.region === "japan" && B.region !== "japan") return { japan: A, overseas: B };
  if (B.region === "japan" && A.region !== "japan") return { japan: B, overseas: A };
  return null;
};

/** ANA国際線の区間基本マイル。チャートに存在しない区間は 0 を返す。 */
export const getIntlBaseMiles = (a: string, b: string): number => {
  const ends = splitEnds(a, b);
  if (!ends) return 0;
  return INTL_MILES[ends.japan.city]?.[ends.overseas.city] || 0;
};

/** 海外側の地域から路線倍率を決定する (判定できない場合は 1.0) */
export const getIntlRegion = (a: string, b: string): IntlRegion | null => {
  const ends = splitEnds(a, b);
  return ends ? (ends.overseas.region as IntlRegion) : null;
};

export const getIntlRouteMultiplier = (a: string, b: string): number => {
  const region = getIntlRegion(a, b);
  return region ? INTL_REGIONS[region].multiplier : 1.0;
};
