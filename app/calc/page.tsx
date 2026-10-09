"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDomBaseMiles } from "./domesticMileage";
import { INTL_AIRPORTS, INTL_REGIONS, getIntlBaseMiles, getIntlRegion, getIntlRouteMultiplier } from "./internationalMileage";
import { calcJalFOP, calcJalLSP, JalRouteType } from "./jalMileage";
import { useFlightData } from "../hooks/useFlightData";
import { Airline } from "../types";
import { motion, AnimatePresence } from "framer-motion";

// --- 空港データの定義 ---
const domAirports: { code: string; name: string; region?: string }[] = [
  { code: "HND", name: "東京(羽田)" }, { code: "NRT", name: "東京(成田)" },
  { code: "ITM", name: "大阪(伊丹)" }, { code: "KIX", name: "大阪(関西)" }, { code: "UKB", name: "神戸" },
  { code: "NGO", name: "名古屋(中部)" }, { code: "CTS", name: "札幌(新千歳)" },
  { code: "OKA", name: "沖縄(那覇)" }, { code: "FUK", name: "福岡" }, { code: "ISG", name: "石垣" },
  { code: "MMY", name: "宮古" }, { code: "AKJ", name: "旭川" }, { code: "HKD", name: "函館" },
  { code: "KUH", name: "釧路" }, { code: "MMB", name: "女満別" }, { code: "OBO", name: "帯広" },
  { code: "WKJ", name: "稚内" }, { code: "RIS", name: "利尻" }, { code: "OIR", name: "奥尻" },
  { code: "AOJ", name: "青森" }, { code: "OJA", name: "大館能代" }, { code: "AXT", name: "秋田" }, 
  { code: "SYO", name: "庄内" }, { code: "SDJ", name: "仙台" }, { code: "FKS", name: "福島" }, 
  { code: "KIJ", name: "新潟" }, { code: "HAC", name: "八丈島" }, { code: "TOY", name: "富山" }, 
  { code: "KMQ", name: "小松" }, { code: "NTQ", name: "能登" }, { code: "OKJ", name: "岡山" }, 
  { code: "HIJ", name: "広島" }, { code: "IWK", name: "岩国" }, { code: "UBJ", name: "山口宇部" }, 
  { code: "TTJ", name: "鳥取" }, { code: "YGJ", name: "米子" }, { code: "IWJ", name: "萩・石見" }, 
  { code: "TAK", name: "高松" }, { code: "TKS", name: "徳島" }, { code: "MYJ", name: "松山" }, 
  { code: "KCZ", name: "高知" }, { code: "KKJ", name: "北九州" }, { code: "HSG", name: "佐賀" }, 
  { code: "OIT", name: "大分" }, { code: "KMJ", name: "熊本" }, { code: "NGS", name: "長崎" }, 
  { code: "KMI", name: "宮崎" }, { code: "KOJ", name: "鹿児島" }, { code: "FUJ", name: "五島福江" },
  { code: "TSJ", name: "対馬" },
  // ANAマイレージチャートに掲載されている就航地 (追加分)
  { code: "SHB", name: "根室中標津" }, { code: "MBE", name: "オホーツク紋別" }, { code: "FSZ", name: "静岡" },
  { code: "AXJ", name: "天草" }, { code: "KUM", name: "屋久島" }, { code: "IKI", name: "壱岐" },
  { code: "TNE", name: "種子島" }, { code: "KKX", name: "喜界島" }, { code: "RNJ", name: "与論" },
  { code: "ASJ", name: "奄美" }, { code: "TKN", name: "徳之島" }, { code: "OKE", name: "沖永良部" }
];

// 国際線の空港・路線倍率・区間基本マイルは ./internationalMileage.ts (ANA公式マイレージチャート) を参照
const intlAirports: { code: string; name: string; region?: string }[] = INTL_AIRPORTS;

// --- 共通コンポーネント ---
const SearchableAirportSelect = ({ label, value, onChange, allowEmpty = false, isIntl = false }: { label: string, value: string, onChange: (val: string) => void, allowEmpty?: boolean, isIntl?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const targetAirports = isIntl ? intlAirports : domAirports;
  const displayValue = value ? `${targetAirports.find(a => a.code === value)?.name || value} (${value})` : "";
  const filtered = targetAirports.filter(a => a.name.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-3 pr-8 text-sm font-bold text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
          placeholder="空港名 or 3レター"
          value={isOpen ? search : displayValue}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(""); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {isOpen && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-slate-50">
          {allowEmpty && (
            <li className="p-3 text-sm cursor-pointer hover:bg-slate-50 text-slate-500 font-medium" onClick={() => onChange("")}>
              直行便 (経由なし)
            </li>
          )}
          {filtered.map((a, idx) => {
            const regionKey = isIntl ? a.region : undefined;
            const showHeader = !!regionKey && (idx === 0 || filtered[idx - 1].region !== regionKey);
            const headerLabel = regionKey === "japan" ? "日本" : regionKey ? `${INTL_REGIONS[regionKey as keyof typeof INTL_REGIONS].label}  (路線倍率 ${INTL_REGIONS[regionKey as keyof typeof INTL_REGIONS].multiplier.toFixed(1)}倍)` : "";
            return (
              <React.Fragment key={a.code}>
                {showHeader && <li className="px-3 py-1.5 text-[10px] font-black text-slate-500 bg-slate-100 sticky top-0">{headerLabel}</li>}
                <li className="p-3 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center group" onClick={() => onChange(a.code)}>
                  <span className="font-bold text-slate-700 group-hover:text-[#003184]">{a.name}</span>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">{a.code}</span>
                </li>
              </React.Fragment>
            );
          })}
          {filtered.length === 0 && <li className="p-3 text-sm text-slate-400 text-center">見つかりません</li>}
        </ul>
      )}
    </div>
  );
};

export default function FlightCalculator() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  
  // --- 状態管理 ---
  const { addLog, settings } = useFlightData();
  const [airline, setAirline] = useState<Airline>("ANA");
  const [flightMode, setFlightMode] = useState<"domestic" | "international">("domestic");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // オタク向けフィールド
  const [flightNumber, setFlightNumber] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [registration, setRegistration] = useState("");
  const [seat, setSeat] = useState("");

  // 国内線用の状態
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [date, setDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);
  const [origin, setOrigin] = useState("ITM");
  const [via, setVia] = useState("OKA");
  const [destination, setDestination] = useState("ISG");
  const [fareKey, setFareKey] = useState("old_fare7"); 
  const [boardingBonus, setBoardingBonus] = useState(400);
  const [ticketPrice, setTicketPrice] = useState(25000);
  const [isFirstClassOnly, setIsFirstClassOnly] = useState(false);
  const [manualDistance, setManualDistance] = useState<number>(0); 

  // 国際線用の状態
  const [intlOrigin, setIntlOrigin] = useState("HND");
  const [intlDestination, setIntlDestination] = useState("SIN");
  const [intlFareKey, setIntlFareKey] = useState("intl_eco_m");
  const [intlManualDistance, setIntlManualDistance] = useState<number>(0);
  const [intlTicketPrice, setIntlTicketPrice] = useState(100000);

  const returnDateRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const isNewFare = new Date(date) >= new Date("2026-05-19");

  const scrollToResult = () => {
    if (resultCardRef.current) {
      resultCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ★ localStorage 読み込み
  useEffect(() => {
    if (settings && settings.activeMode) {
      setAirline(settings.activeMode);
    }
    const savedState = localStorage.getItem("sfc_calculator_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.airline) setAirline(parsed.airline);
        if (parsed.flightNumber) setFlightNumber(parsed.flightNumber);
        if (parsed.aircraftType) setAircraftType(parsed.aircraftType);
        if (parsed.registration) setRegistration(parsed.registration);
        if (parsed.seat) setSeat(parsed.seat);
        if (parsed.flightMode) setFlightMode(parsed.flightMode);
        
        if (parsed.tripType) setTripType(parsed.tripType);
        if (parsed.date) setDate(parsed.date);
        if (parsed.returnDate) setReturnDate(parsed.returnDate);
        if (parsed.origin) setOrigin(parsed.origin);
        if (parsed.via !== undefined) setVia(parsed.via);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.fareKey) setFareKey(parsed.fareKey);
        if (parsed.boardingBonus !== undefined) setBoardingBonus(parsed.boardingBonus);
        if (parsed.ticketPrice !== undefined) setTicketPrice(parsed.ticketPrice);
        if (parsed.isFirstClassOnly !== undefined) setIsFirstClassOnly(parsed.isFirstClassOnly);

        if (parsed.intlOrigin) setIntlOrigin(parsed.intlOrigin);
        if (parsed.intlDestination) setIntlDestination(parsed.intlDestination);
        if (parsed.intlFareKey) setIntlFareKey(parsed.intlFareKey);
        if (parsed.intlTicketPrice !== undefined) setIntlTicketPrice(parsed.intlTicketPrice);
      } catch (e) {
        console.error("状態の復元に失敗しました", e);
      }
    }
    setIsLoaded(true);
  }, [settings]);

  // ★ localStorage 保存
  useEffect(() => {
    if (isLoaded) {
      const currentState = {
        airline, flightNumber, aircraftType, registration, seat,
        flightMode,
        tripType, date, returnDate, origin, via, destination, fareKey, boardingBonus, ticketPrice, isFirstClassOnly,
        intlOrigin, intlDestination, intlFareKey, intlTicketPrice
      };
      localStorage.setItem("sfc_calculator_state", JSON.stringify(currentState));
    }
  }, [airline, flightNumber, aircraftType, registration, seat, flightMode, tripType, date, returnDate, origin, via, destination, fareKey, boardingBonus, ticketPrice, isFirstClassOnly, intlOrigin, intlDestination, intlFareKey, intlTicketPrice, isLoaded]);

  // --- 国内線マイレージ ---
  // ANA公式マイレージチャートの区間基本マイルを使用 (./domesticMileage.ts 参照)
  const getDomDistance = (from: string, to: string) => getDomBaseMiles(from, to);

  // --- 国際線マイレージ・路線倍率 ---
  // ANA公式マイレージチャートの区間基本マイルと、地域別の路線倍率を使用 (./internationalMileage.ts 参照)
  const getIntlDistance = (from: string, to: string) => getIntlBaseMiles(from, to);

  // --- 国内線 運賃定義 ---
  const domFareTypes: { [key: string]: { label: string, rate: number, bonus: number, classType: "first" | "economy" } } = isNewFare ? {
    "p_a": { label: "運賃A:ファーストクラス フレックス/Biz (150%)", rate: 1.50, bonus: 400, classType: "first" },
    "p_b": { label: "運賃B:ファーストクラス スタンダード (130%)", rate: 1.30, bonus: 400, classType: "first" },
    "p_c": { label: "運賃C:ファーストクラス シンプル (120%)", rate: 1.20, bonus: 400, classType: "first" },
    "e_d": { label: "運賃D:エコノミークラス フレックス/Biz (100%)", rate: 1.0, bonus: 400, classType: "economy" },
    "e_e_first": { label: "運賃E:ファーストクラス セール (100%)", rate: 1.0, bonus: 0, classType: "first" },
    "e_e_eco": { label: "運賃E:エコノミークラス セール (100%)", rate: 1.0, bonus: 0, classType: "economy" },
    "e_g": { label: "運賃G:エコノミークラス 株主優待割引 (80%)", rate: 0.80, bonus: 400, classType: "economy" },
    "e_h": { label: "運賃H:エコノミークラス スタンダード (80%)", rate: 0.80, bonus: 200, classType: "economy" },
    "e_i": { label: "運賃I:エコノミークラス シンプル (70%)", rate: 0.70, bonus: 100, classType: "economy" },
    "e_j": { label: "運賃J:エコノミークラス セール/ユース/シニア (50%)", rate: 0.50, bonus: 0, classType: "economy" },
    "e_k": { label: "運賃K:エコノミークラス 包括旅行割引 (30%)", rate: 0.30, bonus: 0, classType: "economy" },
  } : {
    "old_fare1": { label: "運賃1:プレミアム運賃/Biz (150%)", rate: 1.50, bonus: 400, classType: "first" },
    "old_fare2": { label: "運賃2:ANA VALUE PREMIUM 3/SUPER VALUE PREMIUM28 (125%)", rate: 1.25, bonus: 400, classType: "first" },
    "old_fare3": { label: "運賃3:ANA FLEX/Biz/小児運賃 (100%)", rate: 1.0, bonus: 400, classType: "first" },
    "old_fare4": { label: "運賃4:各種アイきっぷ (100%)", rate: 1.0, bonus: 0, classType: "economy" },
    "old_fare5": { label: "運賃5:ANA VALUE 1/3/7/株主優待割引 (75%)", rate: 0.75, bonus: 400, classType: "economy" },
    "old_fare6": { label: "運賃6:ANA VALUE TRANSIT (75%)", rate: 0.75, bonus: 200, classType: "economy" },
    "old_fare7": { label: "運賃7:ANA SUPER VALUE 21/28/45/55/75 (75%)", rate: 0.75, bonus: 0, classType: "economy" },
    "old_fare8": { label: "運賃8:個人包括旅行/スマートU25/ANA SUPER VALUE SALE (50%)", rate: 0.50, bonus: 0, classType: "economy" },
  };

  // --- 国際線 運賃定義 ---
  const intlFareTypes: { [key: string]: { label: string, rate: number, bonus: number } } = {
    "intl_f_a": { label: "ファースト/ビジネス F, A, J (150%)", rate: 1.50, bonus: 400 },
    "intl_biz_c": { label: "ビジネス C, D, Z (125%)", rate: 1.25, bonus: 400 },
    "intl_eco_m": { label: "プレエコ/エコノミー G, E, Y, B, M (100%)", rate: 1.00, bonus: 400 },
    "intl_eco_h": { label: "ビジネスセール/プレエコ/エコノミー P, N, U, H, Q (70%)", rate: 0.70, bonus: 0 },
    "intl_eco_v": { label: "エコノミー V, W, S, T (50%)", rate: 0.50, bonus: 0 },
    "intl_eco_l": { label: "エコノミー L, K (30%)", rate: 0.30, bonus: 0 },
  };

  // 国内線 useEffects
  useEffect(() => {
    if (flightMode === "domestic") {
      const calcDist = via ? getDomDistance(origin, via) + getDomDistance(via, destination) : getDomDistance(origin, destination);
      setManualDistance(calcDist);
    }
  }, [origin, via, destination, flightMode]);

  const getAvailableFareKeys = () => Object.keys(domFareTypes).filter(k => domFareTypes[k].classType === (isFirstClassOnly ? "first" : "economy"));

  useEffect(() => {
    if (!isLoaded || flightMode !== "domestic") return;
    const available = getAvailableFareKeys();
    if (available.length > 0 && !available.includes(fareKey)) {
      let defaultKey = available[0];
      if (isNewFare) {
        defaultKey = isFirstClassOnly ? "p_c" : "e_i";
      } else {
        defaultKey = isFirstClassOnly ? "old_fare2" : "old_fare7";
      }
      if (!available.includes(defaultKey)) defaultKey = available[0];
      setFareKey(defaultKey);
    }
  }, [isFirstClassOnly, isNewFare, fareKey, isLoaded, flightMode]);

  useEffect(() => {
    if (!isLoaded || flightMode !== "domestic") return;
    const defaultKey = getAvailableFareKeys().includes(fareKey) ? fareKey : getAvailableFareKeys()[0];
    const fare = domFareTypes[fareKey] || domFareTypes[defaultKey];
    if (fare) setBoardingBonus(fare.bonus || 0);
  }, [fareKey, isNewFare, isLoaded, flightMode]);

  // 国際線 useEffects
  useEffect(() => {
    if (flightMode === "international") {
      setIntlManualDistance(getIntlDistance(intlOrigin, intlDestination));
    }
  }, [intlOrigin, intlDestination, flightMode]);

  // --- 計算ロジック ---
  const calculateDomPP = () => {
    const defaultKey = getAvailableFareKeys()[0];
    const fare = domFareTypes[fareKey] || domFareTypes[defaultKey];
    if (!fare) return 0;
    
    const dist1 = getDomDistance(origin, via);
    const dist2 = getDomDistance(via, destination);

    if (airline === 'JAL') {
      const getFOP = (dist: number) => calcJalFOP({ baseMiles: dist, accumulationRate: fare.rate, routeType: 'domestic', boardingBonus });
      if (via) {
        if (manualDistance === dist1 + dist2) return getFOP(dist1) + getFOP(dist2);
        else return calcJalFOP({ baseMiles: manualDistance, accumulationRate: fare.rate, routeType: 'domestic', boardingBonus: boardingBonus * 2 });
      } else {
        return calcJalFOP({ baseMiles: manualDistance, accumulationRate: fare.rate, routeType: 'domestic', boardingBonus });
      }
    } else {
      if (via) {
        if (manualDistance === dist1 + dist2) {
          return Math.floor(dist1 * fare.rate * 2) + boardingBonus + Math.floor(dist2 * fare.rate * 2) + boardingBonus;
        } else {
          return Math.floor(manualDistance * fare.rate * 2) + (boardingBonus * 2);
        }
      } else {
        return Math.floor(manualDistance * fare.rate * 2) + boardingBonus;
      }
    }
  };

  const calculateIntlPP = () => {
    const fare = intlFareTypes[intlFareKey];
    if (!fare) return 0;

    const routeMultiplier = getIntlRouteMultiplier(intlOrigin, intlDestination);
    
    if (airline === 'JAL') {
      let routeType: JalRouteType = 'other_intl';
      if (routeMultiplier === 1.5) routeType = 'asia_oceania';
      return calcJalFOP({ baseMiles: intlManualDistance, accumulationRate: fare.rate, routeType, boardingBonus: fare.bonus });
    } else {
      return Math.floor(intlManualDistance * fare.rate * routeMultiplier) + fare.bonus;
    }
  };

  const calculateLSP = () => {
    if (airline !== 'JAL') return 0;
    if (flightMode === "domestic") {
      const segments = via ? 2 : 1;
      return calcJalLSP('domestic', 0) * segments; // 5 per segment
    } else {
      return calcJalLSP('other_intl', intlManualDistance); 
    }
  };

  const intlRegion = getIntlRegion(intlOrigin, intlDestination);
  const basePP = flightMode === "domestic" ? calculateDomPP() : calculateIntlPP();
  const baseLSP = calculateLSP();
  const totalPP = tripType === "roundtrip" ? basePP * 2 : basePP;
  const totalLSP = tripType === "roundtrip" ? baseLSP * 2 : baseLSP;
  const currentPrice = flightMode === "domestic" ? ticketPrice : intlTicketPrice;
  const ppUnitPrice = totalPP > 0 ? (currentPrice / totalPP).toFixed(1) : "0.0";

  const handleSwapDomRoute = () => { const temp = origin; setOrigin(destination); setDestination(temp); };
  const handleSwapIntlRoute = () => { const temp = intlOrigin; setIntlOrigin(intlDestination); setIntlDestination(temp); };

  const handleOutboundDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);

    if (tripType === "roundtrip") {
      setReturnDate(newDate);
      const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || window.matchMedia('(pointer:coarse)').matches);
      if (!isTouchDevice) return;
      setTimeout(() => {
        if (returnDateRef.current) {
          returnDateRef.current.focus();
          try {
            if ('showPicker' in HTMLInputElement.prototype) {
              returnDateRef.current.showPicker();
            }
          } catch (err) { console.warn('showPicker unavailable', err); }
        }
      }, 50);
    }
  };

  const saveFlightLog = async () => {
    if (!date) return alert("搭乗日を入力してください。");
    if (tripType === "roundtrip" && !returnDate) return alert("復路の搭乗日を入力してください。");

    let originName, destName, viaName = "", basePrice;

    if (flightMode === "domestic") {
      originName = domAirports.find(a => a.code === origin)?.name || origin;
      destName = domAirports.find(a => a.code === destination)?.name || destination;
      viaName = via ? domAirports.find(a => a.code === via)?.name || via : "";
      basePrice = Math.floor(ticketPrice / (tripType === "roundtrip" ? 2 : 1));
    } else {
      originName = intlAirports.find(a => a.code === intlOrigin)?.name || intlOrigin;
      destName = intlAirports.find(a => a.code === intlDestination)?.name || intlDestination;
      viaName = ""; // 国際線の単純往復を想定
      basePrice = Math.floor(intlTicketPrice / (tripType === "roundtrip" ? 2 : 1));
    }

    const newLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      airline,
      date: date,
      year: new Date(date).getFullYear(),
      origin: originName,
      destination: destName,
      via: viaName,
      pp: basePP,
      lsp: baseLSP,
      price: basePrice + (tripType === "roundtrip" ? currentPrice % 2 : 0),
      flightNumber,
      aircraftType,
      registration,
      seat
    };

    await addLog(newLog);

    if (tripType === "roundtrip") {
      const returnLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : (Date.now() + 1).toString(),
        airline,
        date: returnDate,
        year: new Date(returnDate).getFullYear(),
        origin: destName,
        destination: originName,
        via: viaName,
        pp: basePP,
        lsp: baseLSP,
        price: basePrice,
        flightNumber,
        aircraftType,
        registration,
        seat
      };
      await addLog(returnLog);
    }

    router.push("/logs");
  };


  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-24 font-sans">
      <div className="bg-[#002561] text-white py-3.5 md:py-6 px-4 md:px-6 relative shadow-md mb-3 md:mb-6">
        <h1 className="text-base md:text-xl font-bold tracking-tight text-center">PPフライトシミュレーター</h1>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 space-y-4 md:space-y-6">
        
        {/* 国内・国際 切り替えタブ */}
        <div className="flex justify-center mb-1">
          <div className="bg-slate-200/70 p-1 rounded-xl inline-flex relative shadow-inner w-full md:w-auto">
            <button onClick={() => setFlightMode("domestic")} className={`flex-1 md:flex-none relative z-10 px-5 md:px-8 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${flightMode === 'domestic' ? (airline === 'JAL' ? 'text-red-700 bg-white' : 'text-[#003184] bg-white') + ' shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              {airline} 国内線
            </button>
            <button onClick={() => setFlightMode("international")} className={`flex-1 md:flex-none relative z-10 px-5 md:px-8 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${flightMode === 'international' ? (airline === 'JAL' ? 'text-red-700 bg-white' : 'text-[#003184] bg-white') + ' shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              {airline} 国際線
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <div className="md:col-span-7 bg-white rounded-2xl p-4 md:p-8 border border-slate-200 shadow-sm space-y-4 md:space-y-6">
            
            {/* 共通: 片道/往復、日付 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner">
                <button onClick={() => setTripType("oneway")} className={`px-4 md:px-6 py-1.5 md:py-2 text-xs font-bold rounded-md transition-all ${tripType === 'oneway' ? 'bg-white text-[#003184] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  片道
                </button>
                <button onClick={() => setTripType("roundtrip")} className={`px-4 md:px-6 py-1.5 md:py-2 text-xs font-bold rounded-md transition-all ${tripType === 'roundtrip' ? 'bg-white text-[#003184] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  往復
                </button>
              </div>

              {flightMode === "domestic" && (
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold text-white shadow-sm ${isNewFare ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                  {isNewFare ? '2026年新運賃' : '現行運賃'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider text-[#003184]">
                  {tripType === "roundtrip" ? "往路 (行き) 搭乗日" : "搭乗予定日"}
                </label>
                <input 
                  type="date" 
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-lg p-2.5 text-xs md:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-[#003184] transition-all cursor-pointer" 
                  value={date} 
                  onChange={handleOutboundDateChange} 
                />
              </div>
              
              {tripType === "roundtrip" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider text-[#003184]">復路 (帰り) 搭乗日</label>
                  <input 
                    type="date" 
                    ref={returnDateRef}
                    className="w-full bg-blue-50/40 border border-blue-200 rounded-lg p-2.5 text-xs md:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-[#003184] transition-all cursor-pointer" 
                    value={returnDate} 
                    onChange={(e) => setReturnDate(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {tripType === "roundtrip" ? "往路の区間設定" : "フライト区間"}
              </div>
              <button onClick={flightMode === "domestic" ? handleSwapDomRoute : handleSwapIntlRoute} className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#003184] text-[10px] font-bold rounded-full transition-colors border border-blue-200/50 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                反転
              </button>
            </div>

            {flightMode === "domestic" ? (
              // --- 国内線 入力エリア ---
              <>
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" checked={isFirstClassOnly} onChange={(e) => setIsFirstClassOnly(e.target.checked)} />
                    {isFirstClassOnly ? (isNewFare ? "ファーストクラス" : "プレミアムクラス") : "普通席/エコノミー"}
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  <SearchableAirportSelect label="出発空港" value={origin} onChange={setOrigin} isIntl={false} />
                  <SearchableAirportSelect label="到着空港" value={destination} onChange={setDestination} isIntl={false} />
                  <div className="col-span-2 md:col-span-1">
                    <SearchableAirportSelect label="経由地 (任意)" value={via} onChange={setVia} allowEmpty={true} isIntl={false} />
                  </div>
                </div>

                {/* コンパクトなマイル表示バー */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 md:p-3 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">区間基本マイル</span>
                    <span className="text-[11px] text-blue-600 font-semibold">自動算出済</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="number" className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs md:text-sm font-bold text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none" value={manualDistance} onChange={(e) => setManualDistance(Number(e.target.value))} />
                    <span className="text-[10px] font-bold text-slate-400">マイル</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">運賃種別</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={fareKey} onChange={(e) => setFareKey(e.target.value)}>
                      {getAvailableFareKeys().map(k => <option key={k} value={k}>{domFareTypes[k].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">搭乗ボーナス PP (1区間)</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={boardingBonus} onChange={(e) => setBoardingBonus(Number(e.target.value))}>
                      <option value={0}>なし (0 PP)</option>
                      <option value={100}>100 PP</option>
                      <option value={200}>200 PP (乗継等)</option>
                      <option value={400}>あり (400 PP)</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              // --- 国際線 入力エリア ---
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <SearchableAirportSelect label="日本側 空港" value={intlOrigin} onChange={setIntlOrigin} isIntl={true} />
                  <SearchableAirportSelect label="海外側 空港" value={intlDestination} onChange={setIntlDestination} isIntl={true} />
                </div>
                <p className="text-[10px] font-bold">
                  {intlRegion ? (
                    <span className={getIntlRouteMultiplier(intlOrigin, intlDestination) > 1 ? "text-emerald-600" : "text-slate-500"}>
                      {INTL_REGIONS[intlRegion].label}路線: 路線倍率 {getIntlRouteMultiplier(intlOrigin, intlDestination).toFixed(1)}倍
                    </span>
                  ) : (
                    <span className="text-amber-600">日本の空港と海外の空港を選んでください</span>
                  )}
                </p>

                <div className="bg-slate-50/80 rounded-xl p-2.5 md:p-3 border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">区間基本マイル (片道 TPM)</span>
                  <div className="flex items-center gap-1.5">
                    <input type="number" className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs md:text-sm font-bold text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none" value={intlManualDistance} onChange={(e) => setIntlManualDistance(Number(e.target.value))} />
                    <span className="text-[10px] font-bold text-slate-400">マイル</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">予約クラス・運賃種別</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={intlFareKey} onChange={(e) => setIntlFareKey(e.target.value)}>
                    {Object.keys(intlFareTypes).map(k => <option key={k} value={k}>{intlFareTypes[k].label}</option>)}
                  </select>
                </div>
              </>
            )}
            
            {/* オタク向け詳細データ */}
            <div className="pt-3 pb-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                フライト詳細（任意）
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">便名</label>
                  <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder={airline === 'JAL' ? "JL516" : "NH10"} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">座席</label>
                  <input type="text" value={seat} onChange={e => setSeat(e.target.value)} placeholder="5A" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">機材</label>
                  <input type="text" value={aircraftType} onChange={e => setAircraftType(e.target.value)} placeholder={airline === 'JAL' ? "A350-900" : "B787-9"} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">機体記号</label>
                  <input type="text" value={registration} onChange={e => setRegistration(e.target.value)} placeholder="JA01XJ" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
              </div>
            </div>
            {/* 航空券代 入力エリア (入力完了で自動スクロール) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between uppercase tracking-wider">
                <span>航空券代 (円) ※{tripType === "roundtrip" ? "往復総額" : "片道金額"}</span>
                <span className="text-blue-500 text-[9px] font-semibold">確定で結果へ移動</span>
              </label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base md:text-lg font-black text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                value={flightMode === "domestic" ? ticketPrice : intlTicketPrice} 
                onChange={(e) => flightMode === "domestic" ? setTicketPrice(Number(e.target.value)) : setIntlTicketPrice(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                    scrollToResult();
                  }
                }}
                onBlur={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    scrollToResult();
                  }
                }}
              />

              {/* スマホ用: 結果ジャンプボタン */}
              <button
                type="button"
                onClick={scrollToResult}
                className="md:hidden mt-2.5 w-full py-2.5 bg-blue-50 active:bg-blue-100 text-[#003184] text-xs font-bold rounded-xl border border-blue-200/80 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>計算結果を見る（{totalPP.toLocaleString()} PP・¥{ppUnitPrice}）</span>
              </button>
            </div>
          </div>

          {/* 計算結果カード (スマホ自動スクロール対象) */}
          <div ref={resultCardRef} className="md:col-span-5 flex flex-col gap-4 scroll-mt-14">
            <div className={`${airline === 'JAL' ? 'bg-red-800' : 'bg-[#003184]'} rounded-2xl p-6 md:p-8 text-white text-center shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center transform transition-colors duration-300`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div>
                  <p className={`text-[10px] font-bold ${airline === 'JAL' ? 'text-red-300' : 'text-blue-300'} tracking-widest uppercase mb-1 md:mb-2`}>{airline === 'JAL' ? '獲得FLY ON ポイント' : '獲得プレミアムポイント'} <span className={`${airline === 'JAL' ? 'bg-red-500/50' : 'bg-blue-500/50'} px-2 py-0.5 rounded ml-2`}>{tripType === "roundtrip" ? "往復合計" : "片道"}</span></p>
                  <p className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">{totalPP.toLocaleString()}</p>
                  <p className="text-xs md:text-sm font-bold opacity-70 mt-1">{airline === 'JAL' ? 'FOP' : 'PP'}</p>
                  {airline === 'JAL' && totalLSP > 0 && <p className="text-xs font-bold text-emerald-300 mt-2">+{totalLSP} LSP</p>}
                </div>
                
                <div className={`pt-4 md:pt-6 border-t ${airline === 'JAL' ? 'border-red-700/50' : 'border-blue-700/50'}`}>
                  <p className={`text-[10px] font-bold ${airline === 'JAL' ? 'text-red-300' : 'text-blue-300'} tracking-widest uppercase mb-1`}>{airline === 'JAL' ? 'FOP' : 'PP'}単価</p>
                  <p className="text-3xl md:text-4xl font-black text-white tracking-tight">¥ {ppUnitPrice}</p>
                </div>

                <div className={`${airline === 'JAL' ? 'bg-red-900/40 border-red-800/50' : 'bg-blue-900/40 border-blue-800/50'} rounded-lg p-3 text-[10px] text-white/90 font-medium leading-relaxed text-left border`}>
                  <span className="text-blue-300 font-bold block mb-1">【片道分の計算式】</span>
                  
                  {flightMode === "domestic" ? (
                    via && manualDistance === getDomDistance(origin, via) + getDomDistance(via, destination) ? (
                      <>
                        区間①: floor({getDomDistance(origin, via)} × {domFareTypes[fareKey]?.rate} × 2) + <span className="text-yellow-300 font-bold">{boardingBonus}</span> = <span className="text-white font-bold">{Math.floor(getDomDistance(origin, via) * (domFareTypes[fareKey]?.rate || 0) * 2) + boardingBonus} PP</span><br/>
                        区間②: floor({getDomDistance(via, destination)} × {domFareTypes[fareKey]?.rate} × 2) + <span className="text-yellow-300 font-bold">{boardingBonus}</span> = <span className="text-white font-bold">{Math.floor(getDomDistance(via, destination) * (domFareTypes[fareKey]?.rate || 0) * 2) + boardingBonus} PP</span><br/>
                        片道合計: <span className="text-white font-bold">{basePP} PP</span>
                        <p className="mt-1 text-blue-300/50 text-[9px]">※国内線(路線倍率2倍)で端数切り捨て後、ボーナス加算</p>
                      </>
                    ) : (
                      <>
                        floor({manualDistance} × {domFareTypes[fareKey]?.rate} × 2) ＋ <span className="text-yellow-300 font-bold">{via ? boardingBonus * 2 : boardingBonus}</span> = <span className="text-white font-bold">{basePP} PP</span>
                        <p className="mt-1 text-blue-300/50 text-[9px]">※国内線(路線倍率2倍)で端数切り捨て後、ボーナス加算</p>
                      </>
                    )
                  ) : (
                    <>
                      floor({intlManualDistance} × {intlFareTypes[intlFareKey]?.rate} × {getIntlRouteMultiplier(intlOrigin, intlDestination).toFixed(1)}{intlRegion ? `(${INTL_REGIONS[intlRegion].label})` : "(区間不明)"}) ＋ <span className="text-yellow-300 font-bold">{intlFareTypes[intlFareKey]?.bonus}</span> = <span className="text-white font-bold">{basePP} PP</span>
                      <p className="mt-1 text-blue-300/50 text-[9px]">※(TPM × 積算率 × 路線倍率) で端数切り捨て後、ボーナス加算</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button onClick={saveFlightLog} className="w-full py-3.5 md:py-4 bg-[#003184] md:bg-white md:border md:border-slate-200 text-white md:text-[#003184] text-sm font-black rounded-xl hover:bg-blue-900 md:hover:bg-slate-50 shadow-md md:shadow-none hover:shadow-md transition-all flex items-center justify-center group active:scale-95">
              {tripType === "roundtrip" ? "往復2件を履歴に登録" : "このフライトを履歴に登録"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* スマホ専用: 常時表示のフローティング結果バー (リキッドタブバーの上に浮遊) */}
      <div className="md:hidden fixed z-40 inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-w-sm mx-auto pointer-events-auto">
        <div
          onClick={scrollToResult}
          className={`${airline === 'JAL' ? 'bg-red-900/95 border-red-500/40 shadow-[0_8px_32px_rgba(153,27,27,0.35)]' : 'bg-[#002561]/95 border-blue-400/40 shadow-[0_8px_32px_rgba(0,37,97,0.35)]'} backdrop-blur-xl border text-white rounded-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-center gap-2.5 pl-1 min-w-0">
            <div className={`${airline === 'JAL' ? 'bg-red-500/30 text-yellow-300' : 'bg-blue-500/30 text-yellow-300'} p-2 rounded-xl shrink-0`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] ${airline === 'JAL' ? 'text-red-200' : 'text-blue-200'} font-bold flex items-center gap-1.5 truncate`}>
                <span>獲得{airline === 'JAL' ? 'FOP' : 'PP'} ({tripType === "roundtrip" ? "往復" : "片道"})</span>
                <span className={`text-[9px] text-yellow-300 ${airline === 'JAL' ? 'bg-red-950/80' : 'bg-blue-900/80'} px-1.5 py-0.5 rounded font-mono font-bold`}>¥{ppUnitPrice}/{airline === 'JAL' ? 'FOP' : 'PP'}</span>
              </div>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                {totalPP.toLocaleString()} <span className={`text-[10px] font-bold ${airline === 'JAL' ? 'text-red-300' : 'text-blue-300'}`}>{airline === 'JAL' ? 'FOP' : 'PP'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                saveFlightLog();
              }}
              className={`bg-white ${airline === 'JAL' ? 'text-red-900 hover:bg-red-50' : 'text-[#002561] hover:bg-blue-50'} px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1`}
            >
              登録
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}