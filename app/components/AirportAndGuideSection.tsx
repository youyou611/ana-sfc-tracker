"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FlightLogEx } from "../types";
import SfcGuideHeroCard from "./widgets/SfcGuideHeroCard";
import { ANA_NETWORK_AIRPORTS, type NetworkAirport } from "./widgets/airportCollectionData";
import {
  AIRPORTS_BY_CODE,
  getAirportDisplayName,
  resolveAirportCode,
} from "../../shared/route-map/WorldRouteMap";

// Major domestic & international airports served by ANA and Star Alliance (with rich lounge info)
export interface AirportGuideItem {
  code: string;
  name: string;
  city: string;
  country: string;
  region: "domestic" | "asia" | "europe" | "north_america" | "hawaii_oceania";
  regionLabel: string;
  isDomestic: boolean;
  terminals: string;
  anaLounge: {
    hasSuiteLounge: boolean;
    hasAnaLounge: boolean;
    location: string;
    shower: boolean;
    food: string;
  };
  access: string;
  facilities: string[];
  tips: string;
  image: string;
}

export const AIRPORTS_DATA: AirportGuideItem[] = [
  {
    code: "HND",
    name: "東京 (羽田)",
    city: "東京",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "第2ターミナル（ANA国内線・一部国際線）、第3ターミナル（国際線）",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "第2ターミナル本館南・北（国内） / 第2・第3ターミナル（国際）",
      shower: true,
      food: "国内線：軽食・ビール / 国際線：ダイニングh・ヌードルバー・ブッフェ",
    },
    access: "東京モノレール（浜松町から空港快速13分）、京急空港線（品川からエアポート快特11分）",
    facilities: ["展望デッキ", "ANA FESTA", "手荷物当日配送", "シャワールーム"],
    tips: "SFC修行のメインハブ。第2ターミナル国際線施設は保安検査後直結で非常にスムーズ。",
    image: "/airports/hnd.jpg",
  },
  {
    code: "NRT",
    name: "東京 (成田)",
    city: "東京",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "第1ターミナル南ウイング（ANA / スターアライアンス）",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "第1ターミナル南ウイング 第4サテライト・第5サテライト",
      shower: true,
      food: "ヌードルバー（ANA特製チキンカレー、うどん・そば）、にぎり寿司サービス、ブッフェ",
    },
    access: "成田エクスプレス（東京駅約60分）、京成スカイライナー（日暮里約36分）",
    facilities: ["免税店", "展望デッキ", "外貨両替", "シャワールーム"],
    tips: "フライングホヌ（A380）ホノルル便の発着地。第5サテライトラウンジは広大で開放的。",
    image: "/airports/nrt.jpg",
  },
  {
    code: "ITM",
    name: "大阪 (伊丹)",
    city: "大阪",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "南ターミナル（ANAグループ）",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "南ターミナル 3階保安検査場通過後",
      shower: false,
      food: "国内線専用：ビールサーバー、ソフトドリンク、スナック（あられ等）",
    },
    access: "大阪モノレール（大阪空港駅直結）、各方面連絡空港リムジンバス",
    facilities: ["展望デッキ", "関西グルメ街", "ANA FESTA"],
    tips: "羽田〜伊丹便は修行僧の王道幹線。隈研吾氏デザインの洗練された木目調ラウンジ。",
    image: "/airports/itm.jpg",
  },
  {
    code: "KIX",
    name: "大阪 (関西)",
    city: "大阪",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "第1ターミナル 国際線・国内線",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: true,
      location: "第1ターミナル 国際線ゲートエリア / 国内線カードラウンジ提携",
      shower: true,
      food: "国際線ANAラウンジ：カレー、麺類、ブッフェ、アルコール",
    },
    access: "JR特急はるか、南海ラピート（難波約34分）",
    facilities: ["国際線免税エリアリニューアル済", "24時間空港", "免税店"],
    tips: "国際線エリア大規模リニューアルにより動線が大幅改善。",
    image: "/airports/kix.jpg",
  },
  {
    code: "NGO",
    name: "名古屋 (中部)",
    city: "名古屋",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "第1ターミナル",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: true,
      location: "第1ターミナル 国内線制限エリア（3階）",
      shower: false,
      food: "生ビール、コーヒー、ソフトドリンク、スナック",
    },
    access: "名鉄空港特急ミュースカイ（名鉄名古屋約28分）",
    facilities: ["フライト・オブ・ドリームズ（787初号機展示）", "展望風呂 風の湯", "スカイデッキ"],
    tips: "空港内にボーイング787実機展示施設があり、航空ファン必見の空港。",
    image: "/airports/ngo.jpg",
  },
  {
    code: "CTS",
    name: "札幌 (新千歳)",
    city: "札幌",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "国内線ターミナル 2階ANA側",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "国内線ターミナル 2階中央（保安検査直結プレミアムチェックインあり）",
      shower: false,
      food: "SUITE：北海道産おにぎり・パン、ビール（サッポロクラシック提供） / ANA：ビール・ソフトドリンク",
    },
    access: "JR快速エアポート（札幌駅約37分）",
    facilities: ["新千歳空港温泉", "北海道ラーメン道場", "ロイズチョコレートワールド", "展望デッキ"],
    tips: "サッポロクラシック生ビールが飲める大人気ラウンジ。空港自体が巨大エンタメ施設。",
    image: "/airports/cts.jpg",
  },
  {
    code: "FUK",
    name: "福岡",
    city: "福岡",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "国内線旅客ターミナル",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "国内線ターミナル 2階（南側プレミアムチェックイン直結）",
      shower: false,
      food: "SUITE：特製おにぎり・スープ・クロワッサン / ANA：生ビール・各種ドリンク",
    },
    access: "福岡市営地下鉄空港線（博多駅までわずか5分、天神まで11分）",
    facilities: ["ラーメン滑走路", "展望デッキ", "お土産フロア"],
    tips: "日本屈指の好立地空港。博多駅からわずか2駅5分で市内観光との相性抜群。",
    image: "/airports/fuk.jpg",
  },
  {
    code: "OKA",
    name: "沖縄 (那覇)",
    city: "沖縄",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "国内線旅客ターミナル 2階ANA側",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "国内線ターミナル 2階（プレミアムチェックイン直結）",
      shower: false,
      food: "オリオン生ビール、泡盛、シークヮーサージュース、スナック",
    },
    access: "沖縄都市モノレール「ゆいレール」（那覇空港駅直結、県庁前約12分）",
    facilities: ["ゆいレール展示館", "DFS免税店", "沖縄そば・ステーキ店多数"],
    tips: "SFC修行の聖地！羽田〜那覇往復で大量PP獲得可能。オリオンビールがサーバーで飲み放題。",
    image: "/airports/oka.jpg",
  },
  {
    code: "ISG",
    name: "石垣 (南ぬ島石垣)",
    city: "石垣",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "旅客ターミナル 1階",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "ラウンジなし（共用カードラウンジもなし）",
      shower: false,
      food: "館内売店・ミルミル本舗のジェラートや八重山そばが充実",
    },
    access: "路線バス（バスターミナル約30〜45分）、レンタカー・タクシー",
    facilities: ["ミルミル本舗", "やいま村八重山そば", "お土産コーナー"],
    tips: "羽田〜石垣直行便は1便あたりの獲得PPが国内線最高峰。PP単価に優れた最重要路線。",
    image: "/airports/isg.jpg",
  },
  {
    code: "MMY",
    name: "宮古",
    city: "宮古",
    country: "日本",
    region: "domestic",
    regionLabel: "国内",
    isDomestic: true,
    terminals: "旅客ターミナル 2階",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "ANAラウンジなし",
      shower: false,
      food: "売店・カフェ、宮古そば",
    },
    access: "バス、レンタカー、タクシー（平良市街地まで約10分）",
    facilities: ["展望デッキ", "宮古まもる君グッズ売店"],
    tips: "羽田〜宮古直行便もPP獲得効率が高く、沖縄タッチ修行の人気路線。",
    image: "/airports/mmy.jpg",
  },
  {
    code: "HNL",
    name: "ホノルル (ダニエル・K・イノウエ)",
    city: "ホノルル",
    country: "アメリカ (ハワイ)",
    region: "hawaii_oceania",
    regionLabel: "ハワイ・オセアニア",
    isDomestic: false,
    terminals: "ターミナル2 エポイ・コンコース3階（ゲートC4向かい）",
    anaLounge: {
      hasSuiteLounge: true,
      hasAnaLounge: true,
      location: "ターミナル2 3階ゲートC4上（A380フライングホヌ直結搭乗対応）",
      shower: false,
      food: "ハワイアンカレー、豚汁、スパムむすび、トロピカルカクテル、マウイビール",
    },
    access: "タクシー・Uber（ワイキキ約25〜35分）、空港シャトルバス",
    facilities: ["ハワイアンガーデン", "免税店", "ANA専用A380アッパーデッキ搭乗ゲート"],
    tips: "海外空港で唯一のANA自社ラウンジ！ラウンジ内からA380（2階席）へ直接ボーディング可能。",
    image: "/airports/hnl.jpg",
  },
  {
    code: "SIN",
    name: "シンガポール (チャンギ)",
    city: "シンガポール",
    country: "シンガポール",
    region: "asia",
    regionLabel: "アジア",
    isDomestic: false,
    terminals: "ターミナル1・2（ANA便は通常ターミナル1または2）",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "提携スターアライアンス加盟シンガポール航空SilverKris Lounge / SATS Premier Lounge",
      shower: true,
      food: "ラクサ、点心、チキンライス、シンガポールスリング、各種アルコール",
    },
    access: "MRT地下鉄（タナメラ乗り換えで市内約30分）、タクシー・Grab（市内約20分）",
    facilities: ["Jewel（世界最大の屋内滝）", "バタフライガーデン", "24時間シネマ", "ショッピングモール"],
    tips: "世界最高峰のハブ空港。「SINタッチ」はPP修行僧の定番ルート（路線倍率1.5倍対象）。",
    image: "/airports/sin.jpg",
  },
  {
    code: "BKK",
    name: "バンコク (スワンナプーム)",
    city: "バンコク",
    country: "タイ",
    region: "asia",
    regionLabel: "アジア",
    isDomestic: false,
    terminals: "メインターミナル コンコースD/E/C",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "タイ国際航空 Royal Silk Lounge / エバー航空ラウンジ / Miracle Lounge",
      shower: true,
      food: "タイカレー、パッタイ、点心、ビール、ワイン",
    },
    access: "エアポートレイルリンク（ARLで市内約30分）、タクシー・Grab",
    facilities: ["タイ古式マッサージ", "巨大免税店", "フードコート"],
    tips: "アジア路線倍率1.5倍対象。スターアライアンス提携ラウンジ巡り（ホッピング）が楽しめます。",
    image: "/airports/bkk.jpg",
  },
  {
    code: "LHR",
    name: "ロンドン (ヒースロー)",
    city: "ロンドン",
    country: "イギリス",
    region: "europe",
    regionLabel: "ヨーロッパ",
    isDomestic: false,
    terminals: "ターミナル2（ザ・クイーンズ・ターミナル）",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "ユナイテッドクラブ（T2B） / ルフトハンザ・ラウンジ（T2A） / シンガポール航空SilverKris Lounge",
      shower: true,
      food: "フル・イングリッシュ・ブレックファスト、アフタヌーンティー、各種ワイン",
    },
    access: "エリザベス線（パディントン約30分）、ヒースロー・エクスプレス（約15分）、ピカデリー線",
    facilities: ["ハロッズ免税店", "シャワールーム", "高級ブティック"],
    tips: "ANA欧州路線の主要ハブ。ターミナル2はスターアライアンス専用設計で乗り継ぎがスムーズ。",
    image: "/airports/lhr.jpg",
  },
  {
    code: "JFK",
    name: "ニューヨーク (ジョン・F・ケネディ)",
    city: "ニューヨーク",
    country: "アメリカ",
    region: "north_america",
    regionLabel: "北米",
    isDomestic: false,
    terminals: "ターミナル7（ANA発着）",
    anaLounge: {
      hasSuiteLounge: false,
      hasAnaLounge: false,
      location: "ブリティッシュ・エアウェイズ Club Lounge または提携ラウンジ",
      shower: true,
      food: "アメリカン・ブレックファスト、デリ、サンドイッチ、各種スピリッツ",
    },
    access: "AirTrain + 地下鉄E/J/Z線（マンハッタン約50分）、LIRR、イエローキャブ",
    facilities: ["免税店", "手荷物一時預かり", "カフェ"],
    tips: "羽田〜JFK便は新仕様「THE Room」（ビジネスクラス）・「THE Suite」（ファーストクラス）が好評。",
    image: "/airports/jfk.jpg",
  },
];

// Curated 85 ANA network airports (50 domestic + 35 international) so total matches 85
const BASE_COLLECTION_AIRPORTS: NetworkAirport[] = [
  ...ANA_NETWORK_AIRPORTS.filter((a) => a.domestic).slice(0, 50),
  ...ANA_NETWORK_AIRPORTS.filter((a) => !a.domestic).slice(0, 35),
];

const GUIDE_MAP = new Map<string, AirportGuideItem>(
  AIRPORTS_DATA.map((item) => [item.code, item])
);

const PRIORITY_CODES = [
  "HND",
  "OKA",
  "SIN",
  "LHR",
  "CTS",
  "ITM",
  "FUK",
  "NRT",
  "KIX",
  "NGO",
  "ISG",
  "MMY",
  "HNL",
  "BKK",
  "JFK",
];

function shortCityLabel(airport: NetworkAirport): string {
  const guide = GUIDE_MAP.get(airport.code);
  if (guide) return guide.city;
  return airport.name.replace(/\(.*?\)|（.*?）/g, "").trim();
}

export function AirportAndGuideSection({ logs }: { logs: FlightLogEx[] }) {
  const [activeTab, setActiveTab] = useState<"collection" | "airports" | "guide">("collection");
  const [collectionFilter, setCollectionFilter] = useState<"all" | "visited" | "domestic" | "intl" | "unvisited">("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAirport, setSelectedAirport] = useState<AirportGuideItem | null>(null);

  // Calculate user's visited airports from actual flight records (100% synced with WorldRouteMap)
  const visitedAirportCodes = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      const originCode = resolveAirportCode(log.origin);
      const destCode = resolveAirportCode(log.destination);
      const viaCode = resolveAirportCode(log.via);
      if (originCode && destCode && originCode !== destCode && AIRPORTS_BY_CODE.has(originCode) && AIRPORTS_BY_CODE.has(destCode)) {
        set.add(originCode);
        set.add(destCode);
      } else {
        if (originCode && AIRPORTS_BY_CODE.has(originCode)) set.add(originCode);
        if (destCode && AIRPORTS_BY_CODE.has(destCode)) set.add(destCode);
      }
      if (viaCode && AIRPORTS_BY_CODE.has(viaCode)) set.add(viaCode);
    }
    return set;
  }, [logs]);

  // Unified 85-airport collection list (including any visited airport outside the base 85 so user visits are never lost)
  const collectionAirports = useMemo(() => {
    const map = new Map<string, NetworkAirport>();
    for (const a of BASE_COLLECTION_AIRPORTS) {
      map.set(a.code, a);
    }
    for (const code of visitedAirportCodes) {
      if (!map.has(code)) {
        const found = ANA_NETWORK_AIRPORTS.find((a) => a.code === code);
        if (found) {
          map.set(code, found);
        } else {
          const worldAp = AIRPORTS_BY_CODE.get(code);
          map.set(code, {
            code,
            name: getAirportDisplayName(code, worldAp),
            domestic: worldAp?.iso_country === "JP",
            lat: Number(worldAp?.latitude_deg ?? 0),
            lon: Number(worldAp?.longitude_deg ?? 0),
          });
        }
      }
    }
    return Array.from(map.values());
  }, [visitedAirportCodes]);

  const totalAirportsCount = collectionAirports.length;
  const visitedAirportsCount = useMemo(
    () => collectionAirports.filter((a) => visitedAirportCodes.has(a.code)).length,
    [collectionAirports, visitedAirportCodes]
  );
  const domesticVisitedCount = useMemo(
    () => collectionAirports.filter((a) => a.domestic && visitedAirportCodes.has(a.code)).length,
    [collectionAirports, visitedAirportCodes]
  );
  const intlVisitedCount = useMemo(
    () => collectionAirports.filter((a) => !a.domestic && visitedAirportCodes.has(a.code)).length,
    [collectionAirports, visitedAirportCodes]
  );
  const unvisitedCount = Math.max(0, totalAirportsCount - visitedAirportsCount);

  // Filtered & sorted list for Tab 1 (AIRPORT COLLECTION)
  const filteredCollectionAirports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = collectionAirports.filter((item) => {
      const isVisited = visitedAirportCodes.has(item.code);
      if (collectionFilter === "visited" && !isVisited) return false;
      if (collectionFilter === "unvisited" && isVisited) return false;
      if (collectionFilter === "domestic" && !item.domestic) return false;
      if (collectionFilter === "intl" && item.domestic) return false;

      if (query) {
        const city = shortCityLabel(item).toLowerCase();
        const matches =
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          city.includes(query);
        if (!matches) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const aVisited = visitedAirportCodes.has(a.code) ? 1 : 0;
      const bVisited = visitedAirportCodes.has(b.code) ? 1 : 0;
      if (aVisited !== bVisited) return bVisited - aVisited;
      const aPri = PRIORITY_CODES.indexOf(a.code);
      const bPri = PRIORITY_CODES.indexOf(b.code);
      if (aPri !== -1 && bPri !== -1) return aPri - bPri;
      if (aPri !== -1) return -1;
      if (bPri !== -1) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [collectionAirports, collectionFilter, searchQuery, visitedAirportCodes]);

  // Filtered list for Tab 2 (空港・ラウンジ案内)
  const filteredGuideAirports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AIRPORTS_DATA.filter((item) => {
      if (selectedRegion !== "all") {
        if (selectedRegion === "domestic" && !item.isDomestic) return false;
        if (["asia", "europe", "north_america", "hawaii_oceania"].includes(selectedRegion) && item.region !== selectedRegion) {
          return false;
        }
      }
      if (query) {
        const matches =
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.city.toLowerCase().includes(query) ||
          item.country.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedRegion, searchQuery]);

  const handleOpenAirportDetail = (airport: NetworkAirport) => {
    const guideItem = GUIDE_MAP.get(airport.code);
    if (guideItem) {
      setSelectedAirport(guideItem);
      return;
    }
    setSelectedAirport({
      code: airport.code,
      name: airport.name,
      city: shortCityLabel(airport),
      country: airport.domestic ? "日本" : "海外",
      region: airport.domestic ? "domestic" : "asia",
      regionLabel: airport.domestic ? "国内" : "国際線",
      isDomestic: airport.domestic,
      terminals: airport.domestic ? "国内線ターミナル（ANA発着枠）" : "国際線ターミナル（ANA / スターアライアンス発着枠）",
      anaLounge: {
        hasSuiteLounge: false,
        hasAnaLounge: false,
        location: "対象ラウンジまたは提携カードラウンジをご確認ください",
        shower: false,
        food: "ソフトドリンク・スナック等（空港により異なります）",
      },
      access: "空港連絡バス・鉄道・タクシー等で市内中心部へアクセス可能",
      facilities: ["ANAチェックインカウンター", "保安検査場", "売店・カフェ"],
      tips: `${airport.name}（${airport.code}）の発着フライトを登録すると自動的に訪問済みとしてコレクションに記録されます。`,
      image: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* ================= 3-TAB SWITCHER (ワイヤーフレーム準拠: [◎ 空港コレクション] [🏢 空港・ラウンジ案内] [📘 ガイド]) ================= */}
      <div
        role="tablist"
        aria-label="空港コレクションとガイドの切り替え"
        className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "collection"}
          onClick={() => setActiveTab("collection")}
          className={`min-h-11 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "collection"
              ? "bg-[#0B192C] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span aria-hidden="true">◎</span>
          <span className="truncate">空港コレクション</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "airports"}
          onClick={() => setActiveTab("airports")}
          className={`min-h-11 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "airports"
              ? "bg-[#0B192C] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span aria-hidden="true">🏢</span>
          <span className="truncate">空港・ラウンジ案内</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "guide"}
          onClick={() => setActiveTab("guide")}
          className={`min-h-11 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "guide"
              ? "bg-[#0B192C] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <span aria-hidden="true">📘</span>
          <span className="truncate">ガイド</span>
        </button>
      </div>

      {/* ================= TAB 1: AIRPORT COLLECTION (1つに統合) ================= */}
      {activeTab === "collection" && (
        <section
          aria-labelledby="collection-heading"
          className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4"
        >
          {/* Header Row: AIRPORT COLLECTION + 6 / 85 */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#0284C7]">
                AIRPORT COLLECTION
              </p>
              <h2 id="collection-heading" className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                訪問した空港
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                登録した搭乗ログ（出発・到着・経由）から自動判定しています。
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="inline-flex items-baseline gap-1 px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 tabular-nums">
                <span className="text-lg sm:text-xl font-black text-[#0B192C]">{visitedAirportsCount}</span>
                <span className="text-xs font-bold text-slate-400">/ {totalAirportsCount}</span>
              </div>
            </div>
          </div>

          {/* 4-Column KPI Row: 訪問済み / 国内空港 / 国際線空港 / 未訪問 */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setCollectionFilter("visited")}
              className={`text-left rounded-2xl p-2.5 sm:p-3.5 border transition-all ${
                collectionFilter === "visited"
                  ? "bg-blue-50/80 border-blue-400 shadow-xs"
                  : "bg-slate-50/90 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate">訪問済み</span>
              <div className="mt-1 flex items-baseline gap-0.5 tabular-nums">
                <span className="text-base sm:text-xl font-black text-slate-900">{visitedAirportsCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">空港</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCollectionFilter("domestic")}
              className={`text-left rounded-2xl p-2.5 sm:p-3.5 border transition-all ${
                collectionFilter === "domestic"
                  ? "bg-blue-50/80 border-blue-400 shadow-xs"
                  : "bg-slate-50/90 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate">国内空港</span>
              <div className="mt-1 flex items-baseline gap-0.5 tabular-nums">
                <span className="text-base sm:text-xl font-black text-slate-900">{domesticVisitedCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">空港</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCollectionFilter("intl")}
              className={`text-left rounded-2xl p-2.5 sm:p-3.5 border transition-all ${
                collectionFilter === "intl"
                  ? "bg-blue-50/80 border-blue-400 shadow-xs"
                  : "bg-slate-50/90 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate">国際線空港</span>
              <div className="mt-1 flex items-baseline gap-0.5 tabular-nums">
                <span className="text-base sm:text-xl font-black text-slate-900">{intlVisitedCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">空港</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCollectionFilter("unvisited")}
              className={`text-left rounded-2xl p-2.5 sm:p-3.5 border transition-all ${
                collectionFilter === "unvisited"
                  ? "bg-blue-50/80 border-blue-400 shadow-xs"
                  : "bg-slate-50/90 border-slate-200/80 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block truncate">未訪問</span>
              <div className="mt-1 flex items-baseline gap-0.5 tabular-nums">
                <span className="text-base sm:text-xl font-black text-slate-700">{unvisitedCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500">空港</span>
              </div>
            </button>
          </div>

          {/* Search & Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="空港コード（HND, OKA, SIN等）や都市名で検索…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="検索をクリア"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "すべて" },
                { id: "visited", label: "訪問済" },
                { id: "domestic", label: "国内" },
                { id: "intl", label: "国際線" },
                { id: "unvisited", label: "未訪問" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCollectionFilter(filter.id as typeof collectionFilter)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    collectionFilter === filter.id
                      ? "bg-[#0B192C] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Column Airport Badge Cards Grid (ワイヤーフレーム準拠: HND (東京) [✓ 訪問済]) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {filteredCollectionAirports.map((airport) => {
              const isVisited = visitedAirportCodes.has(airport.code);
              const city = shortCityLabel(airport);
              const hasGuide = GUIDE_MAP.has(airport.code);
              return (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => handleOpenAirportDetail(airport)}
                  className={`text-left rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2 hover:shadow-xs ${
                    isVisited
                      ? "bg-blue-50/40 border-blue-200 hover:border-blue-400"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-1 min-w-0">
                    <div className="truncate">
                      <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {airport.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        ({city})
                      </span>
                    </div>
                    {hasGuide && (
                      <span className="shrink-0 text-[10px] font-bold text-blue-600" title="ラウンジ情報あり">
                        🛋️
                      </span>
                    )}
                  </div>

                  <div>
                    {isVisited ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-600 text-white">
                        ✓ 訪問済
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-400">
                        未訪問
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCollectionAirports.length === 0 && (
            <div className="rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-xs font-bold text-slate-700">該当する空港がありません</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCollectionFilter("all");
                }}
                className="mt-2.5 px-3.5 py-1.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold"
              >
                フィルターをリセット
              </button>
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 2: 空港・ラウンジ案内 ================= */}
      {activeTab === "airports" && (
        <section
          aria-labelledby="airports-guide-heading"
          className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#0284C7]">
                AIRPORT & LOUNGE GUIDE
              </p>
              <h2 id="airports-guide-heading" className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                空港・ラウンジ案内
              </h2>
              <p className="text-xs text-slate-500">
                国内・海外の主要就航地におけるANAラウンジ、アクセス、設備案内です。
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "すべて" },
                { id: "domestic", label: "日本国内" },
                { id: "asia", label: "アジア" },
                { id: "europe", label: "ヨーロッパ" },
                { id: "north_america", label: "北米" },
                { id: "hawaii_oceania", label: "ハワイ" },
              ].map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setSelectedRegion(region.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedRegion === region.id
                      ? "bg-[#0B192C] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuideAirports.map((airport) => {
              const isVisited = visitedAirportCodes.has(airport.code);
              return (
                <div
                  key={airport.code}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3.5 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-[#002561]">{airport.code}</span>
                          <h3 className="text-sm font-bold text-slate-900">{airport.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {airport.city}・{airport.country}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isVisited && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                            ✓ 訪問済
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                          {airport.regionLabel}
                        </span>
                      </div>
                    </div>

                    {/* Lounge Box */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-800">🛋️ ラウンジ：</span>
                        {airport.anaLounge.hasSuiteLounge && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                            SUITE LOUNGE
                          </span>
                        )}
                        {airport.anaLounge.hasAnaLounge && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#003184] text-[10px] font-black">
                            ANA LOUNGE
                          </span>
                        )}
                        {airport.anaLounge.shower && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            シャワーあり
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {airport.anaLounge.location}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        <span className="font-semibold text-slate-700">飲食：</span>
                        {airport.anaLounge.food}
                      </p>
                    </div>

                    {/* Access & Tips */}
                    <div className="space-y-1 text-xs">
                      <p className="text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-800">🚆 アクセス：</span>
                        {airport.access}
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-800">💡 修行メモ：</span>
                        {airport.tips}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/60">
                    <div className="flex flex-wrap gap-1">
                      {airport.facilities.slice(0, 3).map((fac) => (
                        <span key={fac} className="px-2 py-0.5 rounded bg-white border border-slate-200/70 text-[10px] font-medium text-slate-600">
                          {fac}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAirport(airport)}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-bold text-[#003184] transition-colors"
                    >
                      詳細 ↗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= TAB 3: SFC修行ガイド ================= */}
      {activeTab === "guide" && (
        <article aria-labelledby="guide-rules-heading" className="space-y-4">
          <SfcGuideHeroCard />

          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase text-[#0284C7]">
                SFC TRAINING GUIDE
              </p>
              <h2 id="guide-rules-heading" className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                SFC修行の基礎知識 & 2026年最新ルール
              </h2>
              <p className="text-xs text-slate-500">
                ANAスーパーフライヤーズカード（SFC）獲得のためのPP計算式とステータス条件
              </p>
            </div>

            {/* PP計算式 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#003184] flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#003184]">
                  🧮
                </span>
                プレミアムポイント（PP）の計算式
              </h3>

              <div className="bg-[#0B192C] text-white p-4 rounded-2xl text-center space-y-1 font-mono text-xs sm:text-sm">
                <p className="text-sky-300 text-[11px] font-sans font-bold">獲得プレミアムポイント（PP）</p>
                <p className="font-bold tracking-wider">
                  区間基本マイレージ × 積算率 × 路線倍率 ＋ 搭乗ポイント
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs leading-relaxed text-slate-700">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">1. 区間基本マイレージ</span>
                  IATAが定めるTPM（区間基本マイル）に基づき規定されます。
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">2. 積算率（運賃・予約クラス）</span>
                  国内線は運賃種別、国際線は予約クラスに応じて50%〜150%が適用されます。
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">3. 路線倍率</span>
                  国内線：<strong>2.0倍</strong> / アジア・オセアニア：<strong>1.5倍</strong> / 欧米・他社：<strong>1.0倍</strong>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">4. 搭乗ポイント</span>
                  対象運賃種別に応じて1区間ごとに0または400ポイントが付与されます。
                </div>
              </div>
            </div>

            {/* 2026年新運賃制度について */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#003184] text-white text-[10px] font-black">
                  2026年改定対応
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">国内線新運賃制度（2026年5月19日〜）</h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                ANA国内線は2026年5月19日搭乗分より新運賃制度が適用されます。当トラッカーの計算機では搭乗日を基準として自動で旧制度・新制度の積算率を切り替えて試算します。
              </p>
            </div>

            {/* ステータス目標の目安 */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#003184]">ステータス達成基準</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50">
                  <span className="font-bold text-amber-900 block">ブロンズ</span>
                  <span className="text-lg font-black text-amber-700 block mt-0.5 tabular-nums">30,000 PP</span>
                  <p className="text-[11px] text-amber-800 mt-1">うちANAグループ運航便 15,000 PP以上</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50">
                  <span className="font-bold text-[#003184] block">プラチナ (SFC解禁)</span>
                  <span className="text-lg font-black text-[#003184] block mt-0.5 tabular-nums">50,000 PP</span>
                  <p className="text-[11px] text-blue-700 mt-1">うちANAグループ運航便 25,000 PP以上。達成でSFC申込可能！</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/50">
                  <span className="font-bold text-purple-900 block">ダイヤモンド</span>
                  <span className="text-lg font-black text-purple-700 block mt-0.5 tabular-nums">100,000 PP</span>
                  <p className="text-[11px] text-purple-800 mt-1">うちANAグループ運航便 50,000 PP以上。SUITEラウンジ利用権。</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Airport Detail Modal */}
      <AnimatePresence>
        {selectedAirport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAirport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#002561]">{selectedAirport.code}</span>
                    <h3 className="text-lg font-bold text-slate-900">{selectedAirport.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedAirport.city} · {selectedAirport.country}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAirport(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div>
                {visitedAirportCodes.has(selectedAirport.code) ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ✓ 訪問済み（フライト記録あり）
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                    未訪問
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🏢 ターミナル</span>
                  <p className="text-slate-600">{selectedAirport.terminals}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🛋️ ANAラウンジ情報</span>
                  <p className="text-slate-700 font-semibold">{selectedAirport.anaLounge.location}</p>
                  <p className="text-slate-500 mt-1">飲食内容：{selectedAirport.anaLounge.food}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedAirport.anaLounge.hasSuiteLounge ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-500"}`}>
                      SUITE: {selectedAirport.anaLounge.hasSuiteLounge ? "設置あり" : "なし"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedAirport.anaLounge.hasAnaLounge ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-500"}`}>
                      ANA LOUNGE: {selectedAirport.anaLounge.hasAnaLounge ? "設置あり" : "なし"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedAirport.anaLounge.shower ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500"}`}>
                      シャワー: {selectedAirport.anaLounge.shower ? "あり" : "なし"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🚆 アクセス</span>
                  <p className="text-slate-600">{selectedAirport.access}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">💡 SFC修行のポイント</span>
                  <p className="text-slate-600">{selectedAirport.tips}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAirport(null)}
                  className="px-5 py-2.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
