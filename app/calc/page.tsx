"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getDomBaseMiles } from "./domesticMileage";
import { INTL_AIRPORTS, INTL_REGIONS, getIntlBaseMiles, getIntlRegion, getIntlRouteMultiplier } from "./internationalMileage";
import { useFlightData } from "../hooks/useFlightData";
import { saveImage } from "../lib/db";
import { Airline } from "../types";
import AircraftTypeCombobox from "../components/AircraftTypeCombobox";
import { AIRCRAFT_OPTIONS, getAircraftImageOptions, getFlyingHonuImagePath, getPreferredAircraftImagePath, getPreferredStarAllianceImagePath, getStarAllianceBackgroundOptions } from "../lib/aircraftImages";
import { getAnaDomesticClass, getTravelClassPresentation, type TravelClass } from "../lib/travelClass";

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

const ANA_INTL_BOOKING_CLASSES: Record<string, { label: string; rate: number; travelClass: TravelClass; boardingPoints: number }> = {
  F: { label: "F — ファースト", rate: 1.5, travelClass: "first", boardingPoints: 400 },
  A: { label: "A — ファースト", rate: 1.5, travelClass: "first", boardingPoints: 400 },
  J: { label: "J — ビジネス", rate: 1.5, travelClass: "business", boardingPoints: 400 },
  C: { label: "C — ビジネス", rate: 1.25, travelClass: "business", boardingPoints: 400 },
  D: { label: "D — ビジネス", rate: 1.25, travelClass: "business", boardingPoints: 400 },
  Z: { label: "Z — ビジネス", rate: 1.25, travelClass: "business", boardingPoints: 400 },
  P: { label: "P — ビジネス", rate: 0.7, travelClass: "business", boardingPoints: 400 },
  G: { label: "G — プレミアムエコノミー", rate: 1, travelClass: "premium-economy", boardingPoints: 400 },
  E: { label: "E — プレミアムエコノミー", rate: 1, travelClass: "premium-economy", boardingPoints: 400 },
  N: { label: "N — プレミアムエコノミー", rate: 0.7, travelClass: "premium-economy", boardingPoints: 400 },
  Y: { label: "Y — エコノミー", rate: 1, travelClass: "economy", boardingPoints: 400 },
  B: { label: "B — エコノミー", rate: 1, travelClass: "economy", boardingPoints: 400 },
  M: { label: "M — エコノミー", rate: 1, travelClass: "economy", boardingPoints: 400 },
  U: { label: "U — エコノミー", rate: 0.7, travelClass: "economy", boardingPoints: 0 },
  H: { label: "H — エコノミー", rate: 0.7, travelClass: "economy", boardingPoints: 0 },
  Q: { label: "Q — エコノミー", rate: 0.7, travelClass: "economy", boardingPoints: 0 },
  V: { label: "V — エコノミー", rate: 0.5, travelClass: "economy", boardingPoints: 0 },
  W: { label: "W — エコノミー", rate: 0.5, travelClass: "economy", boardingPoints: 0 },
  S: { label: "S — エコノミー", rate: 0.5, travelClass: "economy", boardingPoints: 0 },
  T: { label: "T — エコノミー", rate: 0.5, travelClass: "economy", boardingPoints: 0 },
  L: { label: "L — エコノミー", rate: 0.3, travelClass: "economy", boardingPoints: 0 },
  K: { label: "K — エコノミー", rate: 0.3, travelClass: "economy", boardingPoints: 0 },
  O: { label: "O — 積算対象外", rate: 0, travelClass: "economy", boardingPoints: 0 },
  I: { label: "I — 積算対象外", rate: 0, travelClass: "business", boardingPoints: 0 },
  R: { label: "R — 積算対象外", rate: 0, travelClass: "premium-economy", boardingPoints: 0 },
  X: { label: "X — 積算対象外", rate: 0, travelClass: "business", boardingPoints: 0 },
};

const STAR_ALLIANCE_CARRIERS = [
  { code: "A3", name: "エーゲ航空" }, { code: "AC", name: "エア・カナダ" },
  { code: "CA", name: "中国国際航空" }, { code: "AI", name: "エア・インディア" },
  { code: "NZ", name: "ニュージーランド航空" }, { code: "NH", name: "ANA（全日本空輸）" },
  { code: "OZ", name: "アシアナ航空" }, { code: "OS", name: "オーストリア航空" },
  { code: "AV", name: "アビアンカ航空" }, { code: "SN", name: "ブリュッセル航空" },
  { code: "CM", name: "コパ航空" }, { code: "OU", name: "クロアチア航空" },
  { code: "MS", name: "エジプト航空" }, { code: "ET", name: "エチオピア航空" },
  { code: "BR", name: "エバー航空" }, { code: "LO", name: "LOTポーランド航空" },
  { code: "LH", name: "ルフトハンザ ドイツ航空" }, { code: "ZH", name: "深圳航空" },
  { code: "SQ", name: "シンガポール航空" }, { code: "SA", name: "南アフリカ航空" },
  { code: "LX", name: "スイス インターナショナル エアラインズ" }, { code: "TP", name: "TAPポルトガル航空" },
  { code: "TG", name: "タイ国際航空" }, { code: "TK", name: "ターキッシュ エアラインズ" },
  { code: "UA", name: "ユナイテッド航空" },
] as const;

const PARTNER_ACCRUAL_CLASSES = [
  { code: "F", label: "F — ファースト", travelClass: "first" as TravelClass },
  { code: "A", label: "A — ファースト", travelClass: "first" as TravelClass },
  { code: "J", label: "J — ビジネス", travelClass: "business" as TravelClass },
  { code: "C", label: "C — ビジネス", travelClass: "business" as TravelClass },
  { code: "D", label: "D — ビジネス", travelClass: "business" as TravelClass },
  { code: "Z", label: "Z — ビジネス", travelClass: "business" as TravelClass },
  { code: "P", label: "P — ビジネス", travelClass: "business" as TravelClass },
  { code: "G", label: "G — プレミアムエコノミー", travelClass: "premium-economy" as TravelClass },
  { code: "E", label: "E — プレミアムエコノミー", travelClass: "premium-economy" as TravelClass },
  { code: "N", label: "N — プレミアムエコノミー", travelClass: "premium-economy" as TravelClass },
  { code: "Y", label: "Y — エコノミー", travelClass: "economy" as TravelClass },
  { code: "B", label: "B — エコノミー", travelClass: "economy" as TravelClass },
  { code: "M", label: "M — エコノミー", travelClass: "economy" as TravelClass },
  { code: "U", label: "U — エコノミー", travelClass: "economy" as TravelClass },
  { code: "H", label: "H — エコノミー", travelClass: "economy" as TravelClass },
  { code: "Q", label: "Q — エコノミー", travelClass: "economy" as TravelClass },
  { code: "V", label: "V — エコノミー", travelClass: "economy" as TravelClass },
  { code: "W", label: "W — エコノミー", travelClass: "economy" as TravelClass },
  { code: "S", label: "S — エコノミー", travelClass: "economy" as TravelClass },
  { code: "T", label: "T — エコノミー", travelClass: "economy" as TravelClass },
  { code: "L", label: "L — エコノミー", travelClass: "economy" as TravelClass },
  { code: "K", label: "K — エコノミー", travelClass: "economy" as TravelClass },
  { code: "O", label: "O — 積算対象外の可能性", travelClass: "economy" as TravelClass },
  { code: "I", label: "I — 積算対象外の可能性", travelClass: "business" as TravelClass },
  { code: "R", label: "R — 積算対象外の可能性", travelClass: "premium-economy" as TravelClass },
  { code: "X", label: "X — 積算対象外の可能性", travelClass: "economy" as TravelClass },
] as const;

export default function FlightCalculator() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  
  // --- 状態管理 ---
  const { addLog } = useFlightData();
  const airline: Airline = "ANA";
  const [flightMode, setFlightMode] = useState<"domestic" | "international" | "star-alliance">("domestic");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // オタク向けフィールド
  const [flightNumber, setFlightNumber] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [registration, setRegistration] = useState("");
  const [seat, setSeat] = useState("");
  const [aircraftImagePath, setAircraftImagePath] = useState("");
  const [aircraftCustomImageId, setAircraftCustomImageId] = useState("");
  const [aircraftCustomImageSrc, setAircraftCustomImageSrc] = useState("");
  const [aircraftImageMessage, setAircraftImageMessage] = useState("");
  const aircraftImageInputRef = useRef<HTMLInputElement>(null);

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
  const [partnerOrigin, setPartnerOrigin] = useState("HND");
  const [partnerDestination, setPartnerDestination] = useState("SIN");
  const [intlBookingClass, setIntlBookingClass] = useState("Y");
  const [intlOperatingCarrier, setIntlOperatingCarrier] = useState("NH");
  const [partnerAccrualRate, setPartnerAccrualRate] = useState(100);
  const [partnerAccrualConfirmed, setPartnerAccrualConfirmed] = useState(false);
  const [intlManualDistance, setIntlManualDistance] = useState<number>(0);
  const [partnerManualDistance, setPartnerManualDistance] = useState<number>(0);
  const [intlTicketPrice, setIntlTicketPrice] = useState(100000);

  const returnDateRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);
  const isNewFare = date >= "2026-05-19";

  const scrollToResult = () => {
    if (resultCardRef.current) {
      resultCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ★ localStorage 読み込み
  useEffect(() => {
    const savedState = localStorage.getItem("sfc_calculator_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.flightNumber) setFlightNumber(parsed.flightNumber);
        if (parsed.aircraftType) setAircraftType(parsed.aircraftType);
        if (parsed.registration) setRegistration(parsed.registration);
        if (parsed.seat) setSeat(parsed.seat);
        if (parsed.aircraftImagePath) setAircraftImagePath(parsed.aircraftImagePath);
        if (parsed.aircraftCustomImageId) setAircraftCustomImageId(parsed.aircraftCustomImageId);
        if (parsed.aircraftCustomImageSrc) setAircraftCustomImageSrc(parsed.aircraftCustomImageSrc);
        else if (parsed.aircraftType && !parsed.aircraftImagePath) setAircraftImagePath(parsed.intlOperatingCarrier && parsed.intlOperatingCarrier !== "NH" ? getPreferredStarAllianceImagePath(parsed.aircraftType) : getPreferredAircraftImagePath(parsed.aircraftType, parsed.registration));
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
        if (parsed.partnerOrigin) setPartnerOrigin(parsed.partnerOrigin);
        if (parsed.partnerDestination) setPartnerDestination(parsed.partnerDestination);
        if (parsed.intlBookingClass && ANA_INTL_BOOKING_CLASSES[parsed.intlBookingClass]) setIntlBookingClass(parsed.intlBookingClass);
        if (parsed.intlOperatingCarrier && STAR_ALLIANCE_CARRIERS.some((carrier) => carrier.code === parsed.intlOperatingCarrier)) setIntlOperatingCarrier(parsed.intlOperatingCarrier);
        if (typeof parsed.partnerAccrualRate === "number" && parsed.partnerAccrualRate >= 0 && parsed.partnerAccrualRate <= 200) setPartnerAccrualRate(parsed.partnerAccrualRate);
        if (typeof parsed.partnerAccrualConfirmed === "boolean") setPartnerAccrualConfirmed(parsed.partnerAccrualConfirmed);
        if (typeof parsed.partnerManualDistance === "number") setPartnerManualDistance(parsed.partnerManualDistance);
        if (parsed.flightMode === "international" && parsed.intlOperatingCarrier && parsed.intlOperatingCarrier !== "NH") {
          setFlightMode("star-alliance");
          setPartnerOrigin(parsed.intlOrigin || "HND");
          setPartnerDestination(parsed.intlDestination || "SIN");
        }
        else if (parsed.intlFareKey) {
          const legacyBookingClass: Record<string, string> = { intl_f_a: "F", intl_biz_c: "C", intl_eco_m: "Y", intl_eco_h: "H", intl_eco_v: "V", intl_eco_l: "L" };
          setIntlBookingClass(legacyBookingClass[parsed.intlFareKey] || "Y");
        }
        if (parsed.intlTicketPrice !== undefined) setIntlTicketPrice(parsed.intlTicketPrice);
      } catch (e) {
        console.error("状態の復元に失敗しました", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // ★ localStorage 保存
  useEffect(() => {
    if (isLoaded) {
      const currentState = {
        airline, flightNumber, aircraftType, registration, seat, aircraftImagePath, aircraftCustomImageId, aircraftCustomImageSrc,
        flightMode,
        tripType, date, returnDate, origin, via, destination, fareKey, boardingBonus, ticketPrice, isFirstClassOnly,
        intlOrigin, intlDestination, partnerOrigin, partnerDestination, intlBookingClass, intlOperatingCarrier, partnerAccrualRate, partnerAccrualConfirmed, intlManualDistance, partnerManualDistance, intlTicketPrice
      };
      try {
        localStorage.setItem("sfc_calculator_state", JSON.stringify(currentState));
      } catch (error) {
        // The full image is stored in IndexedDB; a localStorage quota issue shouldn't break the calculator.
        console.warn("計算機の状態を端末に保存できませんでした", error);
      }
    }
  }, [airline, flightNumber, aircraftType, registration, seat, aircraftImagePath, aircraftCustomImageId, aircraftCustomImageSrc, flightMode, tripType, date, returnDate, origin, via, destination, fareKey, boardingBonus, ticketPrice, isFirstClassOnly, intlOrigin, intlDestination, partnerOrigin, partnerDestination, intlBookingClass, intlOperatingCarrier, partnerAccrualRate, partnerAccrualConfirmed, intlManualDistance, partnerManualDistance, intlTicketPrice, isLoaded]);

  const handleAircraftImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAircraftImageMessage("");
    if (!file.type.startsWith("image/")) {
      setAircraftImageMessage("画像ファイルを選択してください。");
      event.target.value = "";
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAircraftImageMessage("画像は12MB以下にしてください。");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("画像を読み込めませんでした"));
        reader.onerror = () => reject(new Error("画像を読み込めませんでした"));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const candidate = new window.Image();
        candidate.onload = () => resolve(candidate);
        candidate.onerror = () => reject(new Error("画像を開けませんでした"));
        candidate.src = dataUrl;
      });
      const maxEdge = 1600;
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("画像を変換できませんでした");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.84);
      const imageId = `aircraft-background-${crypto.randomUUID()}`;
      await saveImage(imageId, compressedDataUrl);
      setAircraftCustomImageId(imageId);
      setAircraftCustomImageSrc(compressedDataUrl);
      setAircraftImagePath("");
      setAircraftImageMessage("アップロード画像を背景に設定しました。");
    } catch {
      setAircraftImageMessage("画像を保存できませんでした。別の画像でお試しください。");
    } finally {
      event.target.value = "";
    }
  };

  // --- 国内線マイレージ ---
  // ANA公式マイレージチャートの区間基本マイルを使用 (./domesticMileage.ts 参照)
  const getDomDistance = (from: string, to: string) => getDomBaseMiles(from, to);

  // --- 国際線マイレージ・路線倍率 ---
  // ANA公式マイレージチャートの区間基本マイルと、地域別の路線倍率を使用 (./internationalMileage.ts 参照)
  const getIntlDistance = (from: string, to: string) => getIntlBaseMiles(from, to);

  // --- 国内線 運賃定義 ---
  const domFareTypes = useMemo((): Record<string, { label: string, rate: number, bonus: number, classType: "first" | "economy" }> => isNewFare ? {
    "p_a": { label: "運賃A:ファーストクラス フレックス/Biz (150%)", rate: 1.50, bonus: 400, classType: "first" },
    "p_b": { label: "運賃B:ファーストクラス スタンダード (130%)", rate: 1.30, bonus: 400, classType: "first" },
    "p_c": { label: "運賃C:ファーストクラス シンプル (120%)", rate: 1.20, bonus: 400, classType: "first" },
    "e_d": { label: "運賃D:エコノミークラス フレックス/Biz (100%)", rate: 1.0, bonus: 400, classType: "economy" },
    "e_e_first": { label: "運賃E:ファーストクラス セール (100%)", rate: 1.0, bonus: 0, classType: "first" },
    "e_e_eco": { label: "運賃E:エコノミークラス セール (50%)", rate: 0.50, bonus: 0, classType: "economy" },
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
  }, [isNewFare]);

  // 国内線 useEffects
  useEffect(() => {
    if (flightMode === "domestic") {
      const calcDist = via ? getDomDistance(origin, via) + getDomDistance(via, destination) : getDomDistance(origin, destination);
      setManualDistance(calcDist);
    }
  }, [origin, via, destination, flightMode]);

  const availableFareKeys = useMemo(
    () => Object.keys(domFareTypes).filter((key) => domFareTypes[key].classType === (isFirstClassOnly ? "first" : "economy")),
    [domFareTypes, isFirstClassOnly],
  );

  useEffect(() => {
    if (!isLoaded || flightMode !== "domestic") return;
    const available = availableFareKeys;
    if (available.length === 0 || available.includes(fareKey)) return;
    const defaultKey = isNewFare
      ? (isFirstClassOnly ? "p_c" : "e_i")
      : (isFirstClassOnly ? "old_fare2" : "old_fare7");
    setFareKey(available.includes(defaultKey) ? defaultKey : available[0]);
  }, [availableFareKeys, isFirstClassOnly, isNewFare, fareKey, isLoaded, flightMode]);

  useEffect(() => {
    if (!isLoaded || flightMode !== "domestic") return;
    const defaultKey = availableFareKeys.includes(fareKey) ? fareKey : availableFareKeys[0];
    const fare = domFareTypes[fareKey] || domFareTypes[defaultKey];
    if (fare) setBoardingBonus(fare.bonus || 0);
  }, [availableFareKeys, domFareTypes, fareKey, isNewFare, isLoaded, flightMode]);

  // 国際線 useEffects
  useEffect(() => {
    if (flightMode === "international") setIntlManualDistance(getIntlDistance(intlOrigin, intlDestination));
  }, [intlOrigin, intlDestination, flightMode]);
  useEffect(() => {
    if (flightMode === "star-alliance") setPartnerManualDistance(getIntlDistance(partnerOrigin, partnerDestination));
  }, [partnerOrigin, partnerDestination, flightMode]);

  // --- 計算ロジック ---
    const calculateIntlPP = () => {
    const fare = ANA_INTL_BOOKING_CLASSES[intlBookingClass];
    const routeDistance = getIntlDistance(intlOrigin, intlDestination);
    if (!fare || !intlRegion || routeDistance <= 0 || intlManualDistance <= 0) return 0;
    const routeMultiplier = getIntlRouteMultiplier(intlOrigin, intlDestination);
    return Math.floor(intlManualDistance * fare.rate * routeMultiplier) + fare.boardingPoints;
  };

  const calculatePartnerIntlPP = () => {
    if (!partnerAccrualConfirmed || partnerAccrualRate <= 0 || partnerManualDistance <= 0) return 0;
    const boardingPoints = partnerAccrualRate >= 100 ? 400 : 0;
    return Math.floor(partnerManualDistance * (partnerAccrualRate / 100)) + boardingPoints;
  };

  const isPartnerIntl = flightMode === "star-alliance";
  const activeOperatingCarrier = isPartnerIntl ? intlOperatingCarrier : "NH";
  const intlRegion = getIntlRegion(intlOrigin, intlDestination);
  const intlClassDetails = ANA_INTL_BOOKING_CLASSES[intlBookingClass] || ANA_INTL_BOOKING_CLASSES.Y;
  const partnerClassDetails = PARTNER_ACCRUAL_CLASSES.find((item) => item.code === intlBookingClass);
  const currentTravelClass: TravelClass = flightMode === "domestic" ? getAnaDomesticClass(isFirstClassOnly, date) : isPartnerIntl ? (partnerClassDetails?.travelClass || "economy") : intlClassDetails.travelClass;
  const currentClassPresentation = getTravelClassPresentation(currentTravelClass);
  const aircraftImageOptions = getAircraftImageOptions(aircraftType);
  const starAllianceBackgroundOptions = getStarAllianceBackgroundOptions(aircraftType);
  const selectedHonuImage = getFlyingHonuImagePath(registration);
  const visibleAircraftImageOptions = !aircraftType.trim() ? [] : isPartnerIntl
    ? starAllianceBackgroundOptions
    : aircraftType.toUpperCase().includes("380")
      ? aircraftImageOptions.filter((option) => option.path === (selectedHonuImage || getPreferredAircraftImagePath(aircraftType, registration)))
      : aircraftImageOptions.filter((option) => option.alliance === "ANA");
  useEffect(() => {
    if (!aircraftType.trim()) return;
    const requiredPath = isPartnerIntl
      ? (starAllianceBackgroundOptions.some((option) => option.path === aircraftImagePath) ? aircraftImagePath : getPreferredStarAllianceImagePath(aircraftType))
      : getPreferredAircraftImagePath(aircraftType, registration);
    const allowed = isPartnerIntl
      ? starAllianceBackgroundOptions.some((option) => option.path === aircraftImagePath)
      : aircraftImageOptions.some((option) => option.path === aircraftImagePath && option.alliance === "ANA")
      || (!isPartnerIntl && aircraftType.toUpperCase().includes("380") && Boolean(selectedHonuImage) && aircraftImagePath === selectedHonuImage);
    if (!allowed) setAircraftImagePath(requiredPath);
  }, [flightMode, isPartnerIntl, aircraftType, registration, aircraftImagePath, aircraftImageOptions, starAllianceBackgroundOptions, selectedHonuImage]);
  const handleSwapDomRoute = () => { const temp = origin; setOrigin(destination); setDestination(temp); };
  const handleSwapIntlRoute = () => { const temp = intlOrigin; setIntlOrigin(intlDestination); setIntlDestination(temp); };
  const handleSwapPartnerRoute = () => { const temp = partnerOrigin; setPartnerOrigin(partnerDestination); setPartnerDestination(temp); };

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

  const calculateDomesticPP = (travelDate: string) => {
    if (flightMode !== "domestic") return 0;
    const useNewFare = travelDate >= "2026-05-19";
    const fareTypes: Record<string, { rate: number; bonus: number; classType: "first" | "economy" }> = useNewFare
      ? {
          p_a: { rate: 1.5, bonus: 400, classType: "first" },
          p_b: { rate: 1.3, bonus: 400, classType: "first" },
          p_c: { rate: 1.2, bonus: 400, classType: "first" },
          e_d: { rate: 1, bonus: 400, classType: "economy" },
          e_e_first: { rate: 1, bonus: 0, classType: "first" },
          e_e_eco: { rate: 0.5, bonus: 0, classType: "economy" },
          e_g: { rate: 0.8, bonus: 400, classType: "economy" },
          e_h: { rate: 0.8, bonus: 200, classType: "economy" },
          e_i: { rate: 0.7, bonus: 100, classType: "economy" },
          e_j: { rate: 0.5, bonus: 0, classType: "economy" },
          e_k: { rate: 0.3, bonus: 0, classType: "economy" },
        }
      : {
          old_fare1: { rate: 1.5, bonus: 400, classType: "first" },
          old_fare2: { rate: 1.25, bonus: 400, classType: "first" },
          old_fare3: { rate: 1, bonus: 400, classType: "first" },
          old_fare4: { rate: 1, bonus: 0, classType: "economy" },
          old_fare5: { rate: 0.75, bonus: 400, classType: "economy" },
          old_fare6: { rate: 0.75, bonus: 200, classType: "economy" },
          old_fare7: { rate: 0.75, bonus: 0, classType: "economy" },
          old_fare8: { rate: 0.5, bonus: 0, classType: "economy" },
        };
    const selectedFare = fareTypes[fareKey];
    const defaultKey = useNewFare ? (isFirstClassOnly ? "p_c" : "e_i") : (isFirstClassOnly ? "old_fare2" : "old_fare7");
    const fare = selectedFare && selectedFare.classType === (isFirstClassOnly ? "first" : "economy")
      ? selectedFare
      : fareTypes[defaultKey];
    if (!fare || manualDistance <= 0) return 0;
    const dist1 = getDomDistance(origin, via);
    const dist2 = getDomDistance(via, destination);
    if (via && dist1 > 0 && dist2 > 0 && manualDistance === dist1 + dist2) {
      return Math.floor(dist1 * fare.rate * 2) + fare.bonus + Math.floor(dist2 * fare.rate * 2) + fare.bonus;
    }
    return Math.floor(manualDistance * fare.rate * 2) + fare.bonus * (via ? 2 : 1);
  };

  const basePP = flightMode === "domestic" ? calculateDomesticPP(date) : isPartnerIntl ? calculatePartnerIntlPP() : calculateIntlPP();
  const totalPP = tripType === "roundtrip" ? basePP * 2 : basePP;
  const currentPrice = flightMode === "domestic" ? ticketPrice : intlTicketPrice;
  const ppUnitPrice = totalPP > 0 ? (currentPrice / totalPP).toFixed(1) : "0.0";

  const saveFlightLog = async () => {
    if (!date) return alert("搭乗日を入力してください。");
    if (tripType === "roundtrip" && !returnDate) return alert("復路の搭乗日を入力してください。");

    if (tripType === "roundtrip" && returnDate < date) return alert("復路の搭乗日は往路と同日または後の日付にしてください。");

    let originName, destName, viaName = "", outboundPrice: number, returnPrice = 0;

    if (flightMode === "domestic") {
      originName = domAirports.find(a => a.code === origin)?.name || origin;
      destName = domAirports.find(a => a.code === destination)?.name || destination;
      viaName = via ? domAirports.find(a => a.code === via)?.name || via : "";
      outboundPrice = tripType === "roundtrip" ? Math.ceil(ticketPrice / 2) : ticketPrice;
      returnPrice = tripType === "roundtrip" ? Math.floor(ticketPrice / 2) : 0;
      } else if (flightMode === "international") {
      originName = intlAirports.find(a => a.code === intlOrigin)?.name || intlOrigin;
      destName = intlAirports.find(a => a.code === intlDestination)?.name || intlDestination;
      viaName = ""; // 国際線の単純往復を想定
      outboundPrice = tripType === "roundtrip" ? Math.ceil(intlTicketPrice / 2) : intlTicketPrice;
      returnPrice = tripType === "roundtrip" ? Math.floor(intlTicketPrice / 2) : 0;
    } else {
      originName = intlAirports.find(a => a.code === partnerOrigin)?.name || partnerOrigin;
      destName = intlAirports.find(a => a.code === partnerDestination)?.name || partnerDestination;
      viaName = "";
      outboundPrice = tripType === "roundtrip" ? Math.ceil(intlTicketPrice / 2) : intlTicketPrice;
      returnPrice = tripType === "roundtrip" ? Math.floor(intlTicketPrice / 2) : 0;
    }

    const newLog = {
      id: crypto.randomUUID(),
      airline,
      date: date,
      year: new Date(date).getFullYear(),
      origin: flightMode === "domestic" ? origin : originName,
      destination: flightMode === "domestic" ? destination : destName,
      via: viaName,
      pp: flightMode === "domestic" ? calculateDomesticPP(date) : isPartnerIntl ? calculatePartnerIntlPP() : calculateIntlPP(),
      lsp: 0,
      price: outboundPrice,
      flightNumber,
      flightMode: (flightMode === "domestic" ? "domestic" : "international") as "domestic" | "international",
      aircraftType,
      aircraftImagePath: aircraftCustomImageId ? undefined : (aircraftImagePath || (isPartnerIntl ? getPreferredStarAllianceImagePath(aircraftType) : getPreferredAircraftImagePath(aircraftType, registration))),
      aircraftCustomImageId: aircraftCustomImageId || undefined,
      registration,
      seat,
      bookingClass: flightMode !== "domestic" ? intlBookingClass : undefined,
      operatingCarrier: isPartnerIntl ? activeOperatingCarrier : undefined,
      accrualRate: isPartnerIntl ? partnerAccrualRate : undefined,
      boardingPoints: isPartnerIntl ? (partnerAccrualConfirmed && partnerAccrualRate >= 100 ? 400 : 0) : undefined,
      distanceSource: isPartnerIntl && partnerManualDistance > 0 ? "manual-official" as const : undefined,
      travelClass: currentTravelClass,
    };

    await addLog(newLog);

    if (tripType === "roundtrip") {
      const returnLog = {
        id: crypto.randomUUID(),
        airline,
        date: returnDate,
        year: new Date(returnDate).getFullYear(),
        origin: flightMode === "domestic" ? destination : destName,
        destination: flightMode === "domestic" ? origin : originName,
        via: viaName,
        pp: flightMode === "domestic" ? calculateDomesticPP(returnDate) : isPartnerIntl ? calculatePartnerIntlPP() : calculateIntlPP(),
        lsp: 0,
        price: returnPrice,
        flightNumber,
        flightMode: (flightMode === "domestic" ? "domestic" : "international") as "domestic" | "international",
        aircraftType,
        aircraftImagePath: aircraftCustomImageId ? undefined : (aircraftImagePath || (isPartnerIntl ? getPreferredStarAllianceImagePath(aircraftType) : getPreferredAircraftImagePath(aircraftType, registration))),
        aircraftCustomImageId: aircraftCustomImageId || undefined,
        registration,
        seat,
        bookingClass: flightMode !== "domestic" ? intlBookingClass : undefined,
        operatingCarrier: isPartnerIntl ? activeOperatingCarrier : undefined,
        accrualRate: isPartnerIntl ? partnerAccrualRate : undefined,
        boardingPoints: isPartnerIntl ? (partnerAccrualConfirmed && partnerAccrualRate >= 100 ? 400 : 0) : undefined,
        distanceSource: isPartnerIntl && partnerManualDistance > 0 ? "manual-official" as const : undefined,
        travelClass: flightMode === "domestic" ? getAnaDomesticClass(isFirstClassOnly, returnDate) : currentTravelClass,
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
            <button onClick={() => setFlightMode("domestic")} className={`flex-1 md:flex-none relative z-10 px-5 md:px-8 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${flightMode === 'domestic' ? ('text-[#003184] bg-white') + ' shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              {airline} 国内線
            </button>
            <button onClick={() => setFlightMode("international")} className={`flex-1 md:flex-none relative z-10 px-5 md:px-8 py-2 md:py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all duration-300 ${flightMode === 'international' ? ('text-[#003184] bg-white') + ' shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              {airline} 国際線
            </button>
            <button onClick={() => setFlightMode("star-alliance")} className={`flex-1 md:flex-none relative z-10 px-4 md:px-6 py-2 md:py-2.5 text-[11px] md:text-sm font-bold rounded-lg transition-all duration-300 ${flightMode === 'star-alliance' ? 'text-white bg-[#002561] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              スターアライアンス運航便
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
              <button onClick={flightMode === "domestic" ? handleSwapDomRoute : isPartnerIntl ? handleSwapPartnerRoute : handleSwapIntlRoute} className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#003184] text-[10px] font-bold rounded-full transition-colors border border-blue-200/50 shadow-sm">
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
                      {availableFareKeys.map(k => <option key={k} value={k}>{domFareTypes[k].label}</option>)}
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
            ) : flightMode === "international" ? (
              // --- 国際線 入力エリア ---
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <SearchableAirportSelect label="日本側 空港（ANA対象路線）" value={intlOrigin} onChange={(code) => { setIntlOrigin(code); setIntlManualDistance(getIntlDistance(code, intlDestination)); }} isIntl={true} />
                  <SearchableAirportSelect label="海外側 空港（ANA対象路線）" value={intlDestination} onChange={(code) => { setIntlDestination(code); setIntlManualDistance(getIntlDistance(intlOrigin, code)); }} isIntl={true} />
                </div>
                {getIntlDistance(intlOrigin, intlDestination) <= 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">この区間はANA公式マイレージチャートの対象外です。スターアライアンス加盟会社運航便は、専用タブで登録してください。</p>}
                <p className="text-[10px] font-bold">
                  {getIntlDistance(intlOrigin, intlDestination) > 0 && intlRegion ? (
                    <span className={getIntlRouteMultiplier(intlOrigin, intlDestination) > 1 ? "text-emerald-600" : "text-slate-500"}>
                      {`${INTL_REGIONS[intlRegion].label}路線: 路線倍率 ${getIntlRouteMultiplier(intlOrigin, intlDestination).toFixed(1)}倍`}
                    </span>
                  ) : (
                    <span className="text-amber-600">ANA公式マイレージチャート対象外の路線です。スターアライアンス運航便タブを利用してください。</span>
                  )}
                </p>

                <div className="bg-slate-50/80 rounded-xl p-2.5 md:p-3 border border-slate-200/80 space-y-2 text-xs">
                  <label className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-600">
                    <span>区間基本マイル（片道 TPM）</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs md:text-sm font-bold text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none" value={intlManualDistance} onChange={(e) => setIntlManualDistance(Number(e.target.value))} />
                    <span className="text-[10px] font-bold text-slate-400">マイル</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">予約クラス</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs md:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={intlBookingClass} onChange={(e) => setIntlBookingClass(e.target.value)}>
                    {Object.entries(ANA_INTL_BOOKING_CLASSES).map(([code, fare]) => <option key={code} value={code}>{fare.label} — {Math.round(fare.rate * 100)}%・搭乗ポイント {fare.boardingPoints}</option>)}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">ANA運航便の予約クラスを選択します。</p>
                </div>
              </>
            ) : (
              // --- スターアライアンス運航便 入力エリア ---
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                  <SearchableAirportSelect label="出発空港" value={partnerOrigin} onChange={(code) => { setPartnerOrigin(code); setPartnerManualDistance(getIntlDistance(code, partnerDestination)); }} isIntl={true} />
                  <SearchableAirportSelect label="到着空港" value={partnerDestination} onChange={(code) => { setPartnerDestination(code); setPartnerManualDistance(getIntlDistance(partnerOrigin, code)); }} isIntl={true} />
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-[#003184]">運航会社</label>
                    <select aria-label="運航会社" className="w-full rounded-lg border border-blue-200 bg-white p-2.5 text-sm font-bold text-[#003184] outline-none focus:ring-2 focus:ring-blue-400" value={intlOperatingCarrier} onChange={(event) => {
                      const code = event.target.value;
                      setIntlOperatingCarrier(code);
                      setAircraftImagePath(getPreferredStarAllianceImagePath(aircraftType));
                    }}>
                      {STAR_ALLIANCE_CARRIERS.filter((carrier) => carrier.code !== "NH").map((carrier) => <option key={carrier.code} value={carrier.code}>{carrier.name} ({carrier.code})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-black text-slate-600">ANAマイレージクラブ積算率（航空会社別条件を確認）</label>
                      <select className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-800" value={partnerAccrualRate} onChange={(event) => { setPartnerAccrualRate(Number(event.target.value)); setPartnerAccrualConfirmed(false); }}>
                        {[0, 30, 50, 70, 75, 100, 110, 125, 150, 200].map((rate) => <option key={rate} value={rate}>{rate === 0 ? "0%（積算対象外）" : `${rate}%`}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-start gap-2 rounded-lg bg-white p-2.5 text-xs font-bold leading-relaxed text-slate-700 border border-slate-200">
                        <input type="checkbox" checked={partnerAccrualConfirmed} onChange={(event) => setPartnerAccrualConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#003184]" />
                        この運航会社・予約クラスのANA積算率を公式一覧で確認した
                      </label>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">提携会社便の積算率は航空会社・予約クラスで異なります。公式条件を確認してチェックを入れるまでPPは0として扱います。確認済みの場合、路線倍率は1倍、積算率100%以上なら搭乗ポイント400、未満なら0で試算します。</p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-2.5 md:p-3 border border-slate-200/80 space-y-2 text-xs">
                  <label className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-600">
                    <span>ANA公式マイレージチャートの区間基本マイル（片道）</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-right text-sm font-bold text-[#003184]" value={partnerManualDistance} onChange={(event) => setPartnerManualDistance(Number(event.target.value))} />
                    <span className="text-[10px] font-bold text-slate-400">マイル</span>
                  </div>
                  {partnerManualDistance <= 0 && <p className="text-[10px] text-amber-700">公式チャートに区間がない場合は、公式の区間基本マイルを確認して手入力してください。</p>}
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">予約クラス</label>
                  <select className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium" value={intlBookingClass} onChange={(event) => { setIntlBookingClass(event.target.value); setPartnerAccrualConfirmed(false); }}>
                    {PARTNER_ACCRUAL_CLASSES.map((item) => <option key={item.code} value={item.code}>{item.label} — 積算率は会社別一覧で要確認</option>)}
                  </select>
                </div>
              </>
            )}
            
            {/* オタク向け詳細データ */}
            <div className="pt-3 pb-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">
                フライト詳細（任意）
              </label>
              <div className={`mb-3 flex items-center justify-between gap-3 rounded-xl border ${currentClassPresentation.border} ${currentClassPresentation.ticket} p-3`}>
                <div><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">搭乗券プレビュー</p><p className="text-sm font-black text-slate-800">{currentClassPresentation.label}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${currentClassPresentation.badge}`}>{flightMode === "domestic" ? (isNewFare ? "2026年運賃" : "旧運賃") : `${isPartnerIntl ? activeOperatingCarrier : "ANA"}・予約 ${intlBookingClass}`}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">便名</label>
                  <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder={false ? "JL516" : "NH10"} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">座席</label>
                  <input type="text" value={seat} onChange={e => setSeat(e.target.value)} placeholder="5A" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">機材</label>
                  <AircraftTypeCombobox value={aircraftType} onChange={(value) => {
                    setAircraftType(value);
                    const known = AIRCRAFT_OPTIONS.some((option) => option.value.toLowerCase() === value.trim().toLowerCase());
                    if (known) setAircraftImagePath(isPartnerIntl ? getPreferredStarAllianceImagePath(value) : getPreferredAircraftImagePath(value, registration));
                    else if (value.trim()) setAircraftImagePath("");
                  }} onSelect={(value) => { setAircraftType(value); setAircraftImagePath(isPartnerIntl ? getPreferredStarAllianceImagePath(value) : getPreferredAircraftImagePath(value, registration)); }} />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">機体記号</label>
                  <input type="text" value={registration} onChange={e => { const next = e.target.value.toUpperCase(); setRegistration(next); if (getFlyingHonuImagePath(next) || aircraftType.toUpperCase().includes("380")) setAircraftImagePath(getPreferredAircraftImagePath(aircraftType, next)); }} placeholder="JA01AN" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-[#003184] outline-none uppercase" />
                </div>
              </div>
              {flightMode !== "domestic" && <p className="mt-3 text-[10px] font-bold text-slate-500">{isPartnerIntl ? "スターアライアンス運航便：スタアラ塗装のみ" : "ANA運航便：ANA塗装のみ"}</p>}
                  {visibleAircraftImageOptions.length > 0 && <div className="mt-2 grid grid-cols-2 gap-2">
                  {visibleAircraftImageOptions.map((option) => <button key={option.path} type="button" aria-pressed={aircraftImagePath === option.path} onClick={() => setAircraftImagePath(option.path)} className={`overflow-hidden rounded-lg border text-left ${aircraftImagePath === option.path ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
                  <Image src={option.path} alt="" width={400} height={160} className="h-20 w-full object-cover" />
                    <span className="block px-2 py-1.5 text-[10px] font-bold text-slate-700">{option.label}{aircraftImagePath === option.path ? " ✓" : ""}</span>
                </button>)}
                <button type="button" onClick={() => aircraftImageInputRef.current?.click()} aria-pressed={Boolean(aircraftCustomImageId)} className={`overflow-hidden rounded-lg border text-left transition-colors ${aircraftCustomImageId ? "border-blue-600 ring-2 ring-blue-100" : "border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40"}`}>
                  {aircraftCustomImageSrc ? <Image unoptimized src={aircraftCustomImageSrc} alt="アップロードした背景画像" width={400} height={160} className="h-20 w-full object-cover" /> : <div className="flex h-20 items-center justify-center bg-slate-50 text-slate-400">
                    <svg viewBox="0 0 120 60" className="h-12 w-24" fill="currentColor" aria-hidden="true"><path d="M58 3c-2 0-3 2-3 4v16L7 37c-3 1-4 3-4 5 0 3 2 4 5 4l47-9v8L37 54c-2 1-3 2-3 3h51c0-1-1-2-3-3L65 45v-8l47 9c3 0 5-1 5-4 0-2-2-4-5-5L65 23V7c0-2-3-4-7-4Z" /></svg>
                  </div>}
                  <span className="block px-2 py-1.5 text-[10px] font-bold text-slate-700">{aircraftCustomImageId ? "自分の画像 ✓（選択中）" : "自分の画像をアップロード"}</span>
                </button>
              </div>}
              <input ref={aircraftImageInputRef} type="file" accept="image/*" onChange={handleAircraftImageUpload} className="hidden" aria-label="背景に使う飛行機画像をアップロード" />
              {aircraftCustomImageId && <button type="button" onClick={() => { setAircraftCustomImageId(""); setAircraftCustomImageSrc(""); setAircraftImagePath(isPartnerIntl ? getPreferredStarAllianceImagePath(aircraftType) : getPreferredAircraftImagePath(aircraftType, registration)); setAircraftImageMessage("既定の塗装画像に戻しました。"); }} className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50">既定の塗装画像に戻す</button>}
              {aircraftImageMessage && <p role="status" className="mt-2 text-[10px] font-bold text-slate-600">{aircraftImageMessage}</p>}
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
            <div className={`${'bg-[#003184]'} rounded-2xl p-6 md:p-8 text-white text-center shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center transform transition-colors duration-300`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div>
                  <p className={`text-[10px] font-bold ${'text-blue-300'} tracking-widest uppercase mb-1 md:mb-2`}>{'獲得プレミアムポイント'} <span className={`${'bg-blue-500/50'} px-2 py-0.5 rounded ml-2`}>{tripType === "roundtrip" ? "往復合計" : "片道"}</span></p>
                  <p className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-md">{totalPP.toLocaleString()}</p>
                  <p className="text-xs md:text-sm font-bold opacity-70 mt-1">{'PP'}</p>
                </div>
                
                <div className={`pt-4 md:pt-6 border-t ${'border-blue-700/50'}`}>
                  <p className={`text-[10px] font-bold ${'text-blue-300'} tracking-widest uppercase mb-1`}>{'PP'}単価</p>
                  <p className="text-3xl md:text-4xl font-black text-white tracking-tight">¥ {ppUnitPrice}</p>
                </div>

                <div className={`${'bg-blue-900/40 border-blue-800/50'} rounded-lg p-3 text-[10px] text-white/90 font-medium leading-relaxed text-left border`}>
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
                      {isPartnerIntl ? (
                        <>
                          floor({partnerManualDistance} × {partnerAccrualRate / 100}) ＋ <span className="text-yellow-300 font-bold">{partnerAccrualConfirmed && partnerAccrualRate >= 100 ? 400 : 0}</span> = <span className="text-white font-bold">{basePP} PP</span>
                          <p className="mt-1 text-blue-300/80 text-[9px]">※提携会社のAMC対象予約クラスを確認した場合のみ参考計算。路線倍率1倍。</p>
                        </>
                      ) : (
                        <>
                          floor({intlManualDistance} × {intlClassDetails.rate} × {getIntlRouteMultiplier(intlOrigin, intlDestination).toFixed(1)}{intlRegion ? `(${INTL_REGIONS[intlRegion].label})` : "(区間不明)"}) ＋ <span className="text-yellow-300 font-bold">{intlClassDetails.boardingPoints}</span> = <span className="text-white font-bold">{basePP} PP</span>
                          <p className="mt-1 text-blue-300/50 text-[9px]">※(TPM × 積算率 × 路線倍率) で端数切り捨て後、ボーナス加算</p>
                        </>
                      )}
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
          className={`${'bg-[#002561]/95 border-blue-400/40 shadow-[0_8px_32px_rgba(0,37,97,0.35)]'} backdrop-blur-xl border text-white rounded-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform`}
        >
          <div className="flex items-center gap-2.5 pl-1 min-w-0">
            <div className={`${'bg-blue-500/30 text-yellow-300'} p-2 rounded-xl shrink-0`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] ${'text-blue-200'} font-bold flex items-center gap-1.5 truncate`}>
                <span>獲得{'PP'} ({tripType === "roundtrip" ? "往復" : "片道"})</span>
                <span className={`text-[9px] text-yellow-300 ${'bg-blue-900/80'} px-1.5 py-0.5 rounded font-mono font-bold`}>¥{ppUnitPrice}/{'PP'}</span>
              </div>
              <div className="text-lg font-black text-white leading-tight mt-0.5">
                {totalPP.toLocaleString()} <span className={`text-[10px] font-bold ${'text-blue-300'}`}>{'PP'}</span>
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
              className={`bg-white ${'text-[#002561] hover:bg-blue-50'} px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1`}
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



