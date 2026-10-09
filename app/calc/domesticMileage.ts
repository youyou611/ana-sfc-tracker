// ANA国内線 区間基本マイル (積算率100%) 片道
// 出典: ANA マイレージチャート https://www.ana.co.jp/ja/jp/amc/flightmile/dom/chart/
// ※ 区間基本マイルは毎年秋にIATAが発行するTPMを基準とし、1/1～12/31搭乗分に適用されます。
// ※ ANAは都市単位で区間を定めています。東京=羽田/成田(TYO)、大阪=伊丹/関西/神戸(OSA)。

/** 空港コード → マイレージチャート上のエリアキー */
const AREA_OF: { [airport: string]: string } = {
  HND: "TYO", NRT: "TYO",
  ITM: "OSA", KIX: "OSA", UKB: "OSA",
};

/** エリアキー同士の区間基本マイル (片側のみ記載。参照時は双方向で検索) */
const AREA_MILES: { [key: string]: { [key: string]: number } } = {
  AKJ: { TYO: 576, OSA: 739, NGO: 686 },
  AOJ: { OSA: 523, CTS: 153 },
  ASJ: { KOJ: 242, OKA: 199, KKX: 16, RNJ: 125, TKN: 65 },
  AXJ: { FUK: 78, KMJ: 42 },
  AXT: { TYO: 279, OSA: 439, NGO: 380, CTS: 238 },
  CTS: { TYO: 510, OSA: 666, NGO: 614, WKJ: 171, RIS: 159, MBE: 133, MMB: 148, SHB: 178, KUH: 136, HKD: 90, FKS: 400, SDJ: 335, FSZ: 592, KIJ: 369, TOY: 493, KMQ: 529, OKJ: 708, HIJ: 749, MYJ: 791, FUK: 882, OKA: 1397 },
  FKS: { OSA: 339 },
  FSZ: { OKA: 863 },
  FUJ: { FUK: 113, NGS: 67 },
  FUK: { TYO: 567, OSA: 287, NGO: 374, SDJ: 665, KIJ: 572, KMQ: 390, TSJ: 81, KMI: 131, KUM: 225, OKA: 537, MMY: 683, ISG: 737 },
  HAC: { TYO: 177 },
  HIJ: { TYO: 414, SDJ: 513, OKA: 650 },
  HKD: { TYO: 424, OSA: 578, NGO: 525 },
  HSG: { TYO: 584 },
  IKI: { NGS: 60 },
  ISG: { TYO: 1224, OSA: 969, NGO: 1044, OKA: 247, MMY: 72 },
  IWJ: { TYO: 474, OSA: 200 },
  IWK: { TYO: 457, OKA: 614 },
  KCZ: { TYO: 393, OSA: 119 },
  KIJ: { TYO: 167, OSA: 314, NGO: 249, OKA: 1052 },
  KKJ: { TYO: 534, OKA: 563 },
  KKX: { KOJ: 246 },
  KMI: { TYO: 561, OSA: 292, NGO: 372, OKA: 455 },
  KMJ: { TYO: 568, OSA: 290, NGO: 375, OKA: 494 },
  KMQ: { TYO: 211, SDJ: 276 },
  KOJ: { TYO: 601, OSA: 329, NGO: 411, TNE: 88, KUM: 102, RNJ: 358, TKN: 296, OKE: 326, OKA: 429 },
  KUH: { TYO: 555, OSA: 753 },
  MBE: { TYO: 623 },
  MMB: { TYO: 609, OSA: 797, NGO: 738 },
  MMY: { TYO: 1158, OSA: 906, NGO: 979, OKA: 177 },
  MYJ: { TYO: 438, OSA: 159, NGO: 246, OKA: 607 },
  NGO: { TYO: 193, SDJ: 322, OIT: 306, NGS: 417, OKA: 809 },
  NGS: { TYO: 610, OSA: 330, TSJ: 98, OKA: 484 },
  NTQ: { TYO: 207 },
  OBO: { TYO: 526 },
  OIT: { TYO: 499, OSA: 219 },
  OJA: { TYO: 314 },
  OKA: { TYO: 984, OSA: 739, SDJ: 1130, TAK: 677, OKE: 107 },
  OKE: { TKN: 30 },
  OKJ: { TYO: 356 },
  OSA: { TYO: 280, SDJ: 396 },
  SDJ: { TYO: 177 },
  SHB: { TYO: 605 },
  SYO: { TYO: 218 },
  TAK: { TYO: 354 },
  TKS: { TYO: 329 },
  TOY: { TYO: 176 },
  TTJ: { TYO: 328 },
  TYO: { WKJ: 679, UBJ: 510, YGJ: 384 },
};

export const getAreaKey = (airport: string): string => AREA_OF[airport] || airport;

/** ANA国内線の区間基本マイル。チャートに存在しない区間は 0 を返す。 */
export const getDomBaseMiles = (from: string, to: string): number => {
  const a = getAreaKey(from);
  const b = getAreaKey(to);
  return AREA_MILES[a]?.[b] || AREA_MILES[b]?.[a] || 0;
};
