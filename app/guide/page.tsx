"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../hooks/useFlightData";
import AirportCollectionWidget from "../components/widgets/AirportCollectionWidget";
import SfcGuideHeroCard from "../components/widgets/SfcGuideHeroCard";

// Major domestic & international airports served by ANA and Star Alliance
interface AirportGuideItem {
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

const AIRPORTS_DATA: AirportGuideItem[] = [
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
    city: "石垣島",
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
    city: "宮古島",
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

export default function GuidePage() {
  const { logs } = useFlightData();
  const [activeTab, setActiveTab] = useState<"collection" | "airports" | "guide">("collection");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAirport, setSelectedAirport] = useState<AirportGuideItem | null>(null);

  // Calculate user's visited airports from actual flight records
  const visitedAirportCodes = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.origin) set.add(log.origin.trim().toUpperCase());
      if (log.destination) set.add(log.destination.trim().toUpperCase());
      if (log.via) set.add(log.via.trim().toUpperCase());
    }
    return set;
  }, [logs]);

  const totalAirportsCount = AIRPORTS_DATA.length;
  const visitedAirportsCount = AIRPORTS_DATA.filter((a) => visitedAirportCodes.has(a.code)).length;
  const domesticVisitedCount = AIRPORTS_DATA.filter((a) => a.isDomestic && visitedAirportCodes.has(a.code)).length;
  const domesticTotalCount = AIRPORTS_DATA.filter((a) => a.isDomestic).length;
  const intlVisitedCount = AIRPORTS_DATA.filter((a) => !a.isDomestic && visitedAirportCodes.has(a.code)).length;
  const intlTotalCount = AIRPORTS_DATA.filter((a) => !a.isDomestic).length;
  const unvisitedCount = totalAirportsCount - visitedAirportsCount;

  // Filtered list for Airport Guide & Collection
  const filteredAirports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AIRPORTS_DATA.filter((item) => {
      // Region filter
      if (selectedRegion !== "all") {
        if (selectedRegion === "visited" && !visitedAirportCodes.has(item.code)) return false;
        if (selectedRegion === "unvisited" && visitedAirportCodes.has(item.code)) return false;
        if (selectedRegion === "domestic" && !item.isDomestic) return false;
        if (selectedRegion === "intl" && item.isDomestic) return false;
        if (["asia", "europe", "north_america", "hawaii_oceania"].includes(selectedRegion) && item.region !== selectedRegion) {
          return false;
        }
      }
      // Search query
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
  }, [selectedRegion, searchQuery, visitedAirportCodes]);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900 pb-28 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#002561] via-[#003477] to-[#001b47] text-white pt-6 pb-6 px-4 sm:px-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-200">ANA SFC TRACKER</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">空港ガイド & SFC修行の基礎知識</h1>
              <p className="text-xs text-blue-100/75 mt-1">訪問済み空港の達成度、世界主要空港・ANAラウンジ情報、PP計算ルール</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-blue-100 text-xs font-semibold backdrop-blur-sm border border-white/15">
                就航空港コレクション
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex items-center gap-2 border-b border-white/15 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("collection")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "collection"
                  ? "border-blue-400 text-white"
                  : "border-transparent text-blue-200/70 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              空港コレクション
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("airports")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "airports"
                  ? "border-blue-400 text-white"
                  : "border-transparent text-blue-200/70 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              空港・ラウンジ案内
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guide")}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "guide"
                  ? "border-blue-400 text-white"
                  : "border-transparent text-blue-200/70 hover:text-white"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              SFC修行ガイド
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================= TAB 1: 空港コレクション ================= */}
        {activeTab === "collection" && (
          <section aria-labelledby="collection-heading" className="space-y-6">
            <AirportCollectionWidget logs={logs} />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 id="collection-heading" className="text-lg font-bold text-slate-900">空港コレクション</h2>
                <p className="text-xs text-slate-500">
                  登録した搭乗記録をもとに、訪れた空港の達成状況を自動集計しています。
                </p>
              </div>
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003184] hover:text-blue-700 hover:underline"
              >
                2D / 3D 路線マップで見る →
              </Link>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">訪問済み空港</span>
                  <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{visitedAirportsCount}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {totalAirportsCount}</span>
                  <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                    {totalAirportsCount > 0 ? ((visitedAirportsCount / totalAirportsCount) * 100).toFixed(1) : 0}% 達成
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">国内空港</span>
                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{domesticVisitedCount}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {domesticTotalCount}</span>
                  <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                    {domesticTotalCount > 0 ? ((domesticVisitedCount / domesticTotalCount) * 100).toFixed(1) : 0}% 達成
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">国際線空港</span>
                  <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{intlVisitedCount}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">/ {intlTotalCount}</span>
                  <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                    {intlTotalCount > 0 ? ((intlVisitedCount / intlTotalCount) * 100).toFixed(1) : 0}% 達成
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold">未訪問空港</span>
                  <span className="p-1 rounded-lg bg-slate-100 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-slate-700 tracking-tight">{unvisitedCount}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">空港</span>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">次の修行の目的地に</p>
                </div>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search */}
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
                    placeholder="空港名、コード（HND, OKA等）、都市名で検索…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "すべて" },
                    { id: "visited", label: "訪問済み" },
                    { id: "unvisited", label: "未訪問" },
                    { id: "domestic", label: "国内線" },
                    { id: "intl", label: "国際線" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedRegion(filter.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRegion === filter.id
                          ? "bg-[#002561] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Airport Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAirports.map((airport) => {
                const isVisited = visitedAirportCodes.has(airport.code);
                return (
                  <div
                    key={airport.code}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900 tracking-tight">{airport.code}</span>
                          <span className="text-xs font-bold text-slate-500">{airport.name}</span>
                        </div>
                        {isVisited ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                            ✓ 訪問済み
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
                            未訪問
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {airport.city} · {airport.country} ({airport.regionLabel})
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {airport.anaLounge.hasSuiteLounge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            SUITE LOUNGE
                          </span>
                        )}
                        {airport.anaLounge.hasAnaLounge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#003184] border border-blue-200">
                            ANA LOUNGE
                          </span>
                        )}
                        {airport.anaLounge.shower && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            シャワー完備
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {airport.tips}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAirport(airport)}
                      className="mt-3.5 w-full py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      空港・ラウンジ詳細を見る ↗
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredAirports.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-700">該当する空港が見つかりませんでした</p>
                <p className="text-xs text-slate-400 mt-1">検索条件を変更するか、条件をクリアしてください。</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRegion("all");
                  }}
                  className="mt-3 px-4 py-2 bg-[#002561] text-white rounded-xl text-xs font-bold"
                >
                  条件をクリア
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= TAB 2: 空港・ラウンジ案内 ================= */}
        {activeTab === "airports" && (
          <section aria-labelledby="airports-guide-heading" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 id="airports-guide-heading" className="text-lg font-bold text-slate-900">空港・ラウンジ案内</h2>
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedRegion === region.id
                        ? "bg-[#002561] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAirports.map((airport) => (
                <div
                  key={airport.code}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#002561]">{airport.code}</span>
                        <h3 className="text-sm font-bold text-slate-900">{airport.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {airport.city}・{airport.country}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                      {airport.regionLabel}
                    </span>
                  </div>

                  {/* Lounge Box */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">🛋️ ラウンジ情報：</span>
                      {airport.anaLounge.hasSuiteLounge && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black">
                          SUITEあり
                        </span>
                      )}
                      {airport.anaLounge.hasAnaLounge && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#003184] text-[9px] font-black">
                          ANA LOUNGEあり
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

                  <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                    {airport.facilities.map((fac) => (
                      <span key={fac} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= TAB 3: SFC修行ガイド ================= */}
        {activeTab === "guide" && (
          <article aria-labelledby="guide-rules-heading" className="space-y-6">
            <SfcGuideHeroCard />

            <div>
              <h2 id="guide-rules-heading" className="text-lg font-bold text-slate-900">SFC修行の基礎知識 & 2026年最新ルール</h2>
              <p className="text-xs text-slate-500">
                ANAスーパーフライヤーズカード（SFC）獲得のためのPP計算式とステータス条件
              </p>
            </div>

            {/* このアプリでできること */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
              <h3 className="text-sm font-bold text-[#003184] flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#003184]">
                  ✓
                </span>
                このアプリでできること
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                ANA国内線および国際線（スターアライアンス便含む）のプレミアムポイント（PP）試算、獲得シミュレーション、ステータス達成率の可視化、実際の搭乗履歴や費用の管理、路線マップでの振り返りがブラウザのみで完結します。データはお使いの端末に安全に保存されます。
              </p>
            </div>

            {/* PP計算式 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-bold text-[#003184] flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#003184]">
                  🧮
                </span>
                プレミアムポイント（PP）の計算式
              </h3>
              
              <div className="bg-[#002561] text-white p-4 rounded-xl text-center space-y-1 font-mono text-xs sm:text-sm">
                <p className="text-blue-200 text-[11px] font-sans">獲得プレミアムポイント（PP）</p>
                <p className="font-bold tracking-wider">
                  区間基本マイレージ × 積算率 × 路線倍率 ＋ 搭乗ポイント
                </p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">1. 区間基本マイレージ</span>
                  IATA（国際航空運送協会）が定めるTPM（区間基本マイル）に基づき、毎年改定されます。ANA国内線は東京発着（羽田/成田）や大阪発着（伊丹/関西/神戸）など都市単位で規定されています。
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">2. 積算率（運賃区分・予約クラス）</span>
                  国内線は運賃種別（運賃75%〜150%など）、国際線は予約クラス（F, C, Y, B, M等）に応じて50%〜150%が適用されます。
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">3. 路線倍率</span>
                  <ul className="list-disc list-inside space-y-0.5 mt-1 text-slate-600">
                    <li>ANA国内線全路線：<strong>2.0倍</strong>（最重要）</li>
                    <li>ANA国際線（日本発着のアジア・オセアニア路線、ウラジオストク）：<strong>1.5倍</strong></li>
                    <li>その他の国際線およびスターアライアンス加盟他社運航便：<strong>1.0倍</strong></li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-900 block mb-1">4. 搭乗ポイント</span>
                  運賃種別に応じて1区間ごとに0ポイントまたは400ポイントが付与されます。
                </div>
              </div>
            </div>

            {/* 2026年新運賃制度について */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#003184] text-[10px] font-black">
                  2026年改定
                </span>
                <h3 className="text-sm font-bold text-slate-900">国内線新運賃制度への対応</h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                ANA国内線は2026年5月19日搭乗分より新運賃制度が適用されます。当トラッカーの計算機では搭乗日を基準として自動で旧制度・新制度の積算率を切り替えて正確に試算します。
              </p>
            </div>

            {/* ステータス目標の目安 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
              <h3 className="text-sm font-bold text-[#003184]">ステータス達成基準</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                  <span className="font-bold text-amber-900 block">ブロンズ</span>
                  <span className="text-lg font-black text-amber-700 block mt-1">30,000 PP</span>
                  <p className="text-[10px] text-amber-800 mt-1">うちANAグループ運航便 15,000 PP以上（LS枠あり）</p>
                </div>
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                  <span className="font-bold text-[#003184] block">プラチナ (SFC資格)</span>
                  <span className="text-lg font-black text-[#003184] block mt-1">50,000 PP</span>
                  <p className="text-[10px] text-blue-700 mt-1">うちANAグループ運航便 25,000 PP以上。達成でSFC入会可能！</p>
                </div>
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
                  <span className="font-bold text-purple-900 block">ダイヤモンド</span>
                  <span className="text-lg font-black text-purple-700 block mt-1">100,000 PP</span>
                  <p className="text-[10px] text-purple-800 mt-1">うちANAグループ運航便 50,000 PP以上。最上位特典・SUITEラウンジ利用権。</p>
                </div>
              </div>
            </div>

            {/* 公式リンク */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">最新情報・確定加算ポイントはANA公式でご確認ください</p>
                <p className="text-[11px] text-slate-500">当シミュレーターは目安としてご活用ください。</p>
              </div>
              <a
                href="https://www.ana.co.jp/ja/jp/amc/premium/overview/premium-point/"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 px-4 py-2.5 bg-[#003184] text-white text-xs font-bold rounded-xl hover:bg-[#002561] transition-all flex items-center gap-1.5"
              >
                ANA公式 プレミアムポイント説明 ↗
              </a>
            </div>
          </article>
        )}
      </div>

      {/* Airport Detail Modal */}
      <AnimatePresence>
        {selectedAirport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4"
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Badge */}
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

              {/* Detail Sections */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🏢 ターミナル</span>
                  <p className="text-slate-600">{selectedAirport.terminals}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🛋️ ANAラウンジ情報</span>
                  <p className="text-slate-700 font-semibold">{selectedAirport.anaLounge.location}</p>
                  <p className="text-slate-500 mt-1">飲食内容：{selectedAirport.anaLounge.food}</p>
                  <div className="mt-2 flex gap-2">
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

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">🚆 アクセス</span>
                  <p className="text-slate-600">{selectedAirport.access}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-1">💡 SFC修行のポイント</span>
                  <p className="text-slate-600">{selectedAirport.tips}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAirport(null)}
                  className="px-5 py-2.5 bg-[#002561] text-white rounded-xl text-xs font-bold hover:bg-[#001b47] transition-colors"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
