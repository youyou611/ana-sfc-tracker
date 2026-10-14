"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDomBaseMiles } from "./domesticMileage";
import { INTL_AIRPORTS, INTL_REGIONS, getIntlBaseMiles, getIntlRegion, getIntlRouteMultiplier } from "./internationalMileage";
import { useFlightData } from "../hooks/useFlightData";
import { saveImage } from "../lib/db";
import { Airline } from "../types";
import AircraftTypeCombobox from "../components/AircraftTypeCombobox";
import { getAircraftImageOptions, getFlyingHonuImagePath, getPreferredAircraftImagePath, getPreferredStarAllianceImagePath, getStarAllianceBackgroundOptions } from "../lib/aircraftImages";
import { getAnaDomesticClass, type TravelClass } from "../lib/travelClass";

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
    <div className="relative w-full min-w-0">
      <label className="mb-1.5 block text-[11px] font-semibold leading-relaxed text-slate-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-semibold text-[#12213a] shadow-[0_1px_2px_rgba(15,35,65,0.025)] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2878f0] focus:ring-4 focus:ring-blue-100/70"
          placeholder="空港名 or 3レター"
          value={isOpen ? search : displayValue}
          role="combobox"
          aria-controls={`airport-options-${isIntl ? "intl" : "domestic"}-${label.replace(/\s+/g, "-")}`}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
            if (event.key === "Enter" && isOpen && filtered.length > 0) {
              event.preventDefault();
              onChange(filtered[0].code);
              setSearch("");
              setIsOpen(false);
            }
          }}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(""); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {isOpen && (
        <ul id={`airport-options-${isIntl ? "intl" : "domestic"}-${label.replace(/\s+/g, "-")}`} role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-50">
          {allowEmpty && (
            <li role="option" aria-selected={!value} className="min-h-11 cursor-pointer p-3 text-sm font-medium text-slate-500 hover:bg-slate-50" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}>
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
                <li role="option" aria-selected={value === a.code} className="flex min-h-11 cursor-pointer items-center justify-between p-3 text-sm group hover:bg-blue-50" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(a.code); setIsOpen(false); setSearch(""); }}>
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
  const { addLog, addLogs } = useFlightData();
  const airline: Airline = "ANA";
  const [flightMode, setFlightMode] = useState<"domestic" | "international" | "star-alliance">("domestic");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSavingFlight, setIsSavingFlight] = useState(false);
  const [saveFlightError, setSaveFlightError] = useState("");
  
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
  const aircraftImageOptions = getAircraftImageOptions(aircraftType);
  const starAllianceBackgroundOptions = getStarAllianceBackgroundOptions(aircraftType);
  const selectedHonuImage = getFlyingHonuImagePath(registration);
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
    if (isSavingFlight) return;
    setSaveFlightError("");
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

    const recordsToSave = [newLog];
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
      recordsToSave.push(returnLog);
    }

    setIsSavingFlight(true);
    try {
      if (recordsToSave.length === 1) {
        await addLog(recordsToSave[0]);
      } else {
        await addLogs(recordsToSave);
      }
      router.push("/logs");
    } catch (error) {
      console.error("フライト登録に失敗しました", error);
      const detail = error instanceof Error ? error.message : "保存先のエラーを確認できませんでした。";
      setSaveFlightError(`フライトを保存できませんでした。入力内容はそのままです。${detail}`);
    } finally {
      setIsSavingFlight(false);
    }
  };


      const handleSwapAirports = () => {
    if (flightMode === "domestic") {
      const prev = origin;
      setOrigin(destination);
      setDestination(prev);
    } else if (flightMode === "international") {
      const prev = intlOrigin;
      setIntlOrigin(intlDestination);
      setIntlDestination(prev);
    } else {
      const prev = partnerOrigin;
      setPartnerOrigin(partnerDestination);
      setPartnerDestination(prev);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  return (
    <div className="min-h-screen min-w-0 bg-[#F4F7FB] pb-32 font-sans text-slate-900">
      {/* 透過・白ヘッダー (カンプ: フライト登録 / ✕) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="w-8" />
        <h1 className="text-base font-black tracking-tight text-slate-900">フライト登録</h1>
        <button
          type="button"
          onClick={() => router.push("/logs")}
          aria-label="閉じる"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>
      </header>

      <div className="max-w-md sm:max-w-xl mx-auto px-4 pt-4 space-y-4">

        {/* ================= 1. DUAL PILL SEGMENTED CONTROL ================= */}
        <div className="space-y-2">
          {/* 1段目: 片道 / 往復 */}
          <div role="group" aria-label="旅程タイプ" className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-full">
            <button
              type="button"
              aria-pressed={tripType === "oneway"}
              onClick={() => setTripType("oneway")}
              className={`py-2 text-xs font-black rounded-full transition-all duration-150 ${
                tripType === "oneway"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              片道
            </button>
            <button
              type="button"
              aria-pressed={tripType === "roundtrip"}
              onClick={() => setTripType("roundtrip")}
              className={`py-2 text-xs font-black rounded-full transition-all duration-150 ${
                tripType === "roundtrip"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              往復
            </button>
          </div>

          {/* 2段目: 国内線 / 国際線 / 提携航空会社 */}
          <div role="group" aria-label="運航区分" className="grid grid-cols-3 p-1 bg-slate-200/70 rounded-full">
            <button
              type="button"
              aria-pressed={flightMode === "domestic"}
              onClick={() => setFlightMode("domestic")}
              className={`py-2 text-xs font-black rounded-full transition-all duration-150 ${
                flightMode === "domestic"
                  ? "bg-white text-[#003184] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              国内線
            </button>
            <button
              type="button"
              aria-pressed={flightMode === "international"}
              onClick={() => setFlightMode("international")}
              className={`py-2 text-xs font-black rounded-full transition-all duration-150 ${
                flightMode === "international"
                  ? "bg-white text-[#003184] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              国際線
            </button>
            <button
              type="button"
              aria-pressed={flightMode === "star-alliance"}
              onClick={() => setFlightMode("star-alliance")}
              className={`py-2 text-xs font-black rounded-full transition-all duration-150 ${
                flightMode === "star-alliance"
                  ? "bg-white text-[#003184] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              提携航空会社
            </button>
          </div>
        </div>

        {/* ================= 2. 搭乗日入力カード ================= */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-base text-slate-400">📅</span>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">搭乗日</span>
                <input
                  type="date"
                  value={date}
                  onChange={handleOutboundDateChange}
                  className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                />
              </div>
            </div>
            {flightMode === "domestic" && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isNewFare ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {isNewFare ? "2026新運賃" : "現行運賃"}
              </span>
            )}
          </div>

          {tripType === "roundtrip" && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base text-slate-400">🔄</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">復路搭乗日</span>
                  <input
                    type="date"
                    ref={returnDateRef}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="text-xs sm:text-sm font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. ROUTE INPUT GROUP WITH FLOATING SWAP ================= */}
        <div className="relative bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          {/* 出発地 */}
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-blue-500">🛫</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">出発地</span>
            </div>
            {flightMode === "domestic" ? (
              <SearchableAirportSelect
                label=""
                value={origin}
                onChange={setOrigin}
              />
            ) : flightMode === "international" ? (
              <SearchableAirportSelect
                label=""
                value={intlOrigin}
                onChange={setIntlOrigin}
                isIntl
              />
            ) : (
              <SearchableAirportSelect
                label=""
                value={partnerOrigin}
                onChange={setPartnerOrigin}
                isIntl
              />
            )}
          </div>

          {/* ディバイダー */}
          <div className="border-t border-slate-100 my-3 relative" />

          {/* フローティング スワップボタン (⇅) */}
          <button
            type="button"
            onClick={handleSwapAirports}
            title="出発地と到着地を入れ替え"
            aria-label="出発地と到着地を入れ替え"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-[#003184] hover:bg-blue-50 active:scale-95 transition-all"
          >
            <span className="text-base font-bold">⇅</span>
          </button>

          {/* 到着地 */}
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-emerald-500">🛬</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">到着地</span>
            </div>
            {flightMode === "domestic" ? (
              <SearchableAirportSelect
                label=""
                value={destination}
                onChange={setDestination}
              />
            ) : flightMode === "international" ? (
              <SearchableAirportSelect
                label=""
                value={intlDestination}
                onChange={setIntlDestination}
                isIntl
              />
            ) : (
              <SearchableAirportSelect
                label=""
                value={partnerDestination}
                onChange={setPartnerDestination}
                isIntl
              />
            )}
          </div>
        </div>

        {/* ================= 4. 運航会社・予約クラス・積算率 ================= */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          {/* 運航会社 */}
          <div className="flex items-center justify-between gap-3 py-1">
            <span className="text-xs font-bold text-slate-600 shrink-0">運航会社</span>
            {flightMode === "star-alliance" ? (
              <select
                value={intlOperatingCarrier}
                onChange={(e) => setIntlOperatingCarrier(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none max-w-[200px]"
              >
                {STAR_ALLIANCE_CARRIERS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-black text-[#003184] bg-blue-50 px-3 py-1.5 rounded-xl">
                ANA（全日本空輸）
              </span>
            )}
          </div>

          {/* 運賃・予約クラス */}
          <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 shrink-0">
              {flightMode === "domestic" ? "運賃種別" : "予約クラス"}
            </span>
            {flightMode === "domestic" ? (
              <select
                value={fareKey}
                onChange={(e) => setFareKey(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none max-w-[220px]"
              >
                {Object.keys(domFareTypes).map((k) => (
                  <option key={k} value={k}>
                    {domFareTypes[k].label} ({Math.round(domFareTypes[k].rate * 100)}%)
                  </option>
                ))}
              </select>
            ) : flightMode === "international" ? (
              <select
                value={intlBookingClass}
                onChange={(e) => setIntlBookingClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none max-w-[220px]"
              >
                {Object.keys(ANA_INTL_BOOKING_CLASSES).map((k) => (
                  <option key={k} value={k}>
                    {ANA_INTL_BOOKING_CLASSES[k].label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={intlBookingClass}
                onChange={(e) => setIntlBookingClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none max-w-[220px]"
              >
                {PARTNER_ACCRUAL_CLASSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 積算率 */}
          <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 shrink-0">積算率</span>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl">
              {flightMode === "domestic"
                ? `${Math.round((domFareTypes[fareKey]?.rate || 1) * 100)}%`
                : flightMode === "international"
                ? `${Math.round((intlClassDetails?.rate || 1) * 100)}%`
                : `${partnerAccrualRate}%`}
            </span>
          </div>

          {/* 運賃金額入力 */}
          <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 shrink-0">航空券費用 (円)</span>
            <input
              type="number"
              step="1000"
              value={flightMode === "domestic" ? ticketPrice : intlTicketPrice}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                if (flightMode === "domestic") setTicketPrice(val);
                else setIntlTicketPrice(val);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-right text-slate-800 outline-none w-28 tabular-nums"
            />
          </div>
        </div>

        {/* 詳細オプション・機材情報 (折りたたみアコーディオン) */}
        <details className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-xs">
          <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between">
            <span>便名・機材・経由地の詳細入力</span>
            <span className="text-slate-400">＋</span>
          </summary>
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {flightMode === "domestic" && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">経由地 (任意)</label>
                <SearchableAirportSelect label="" value={via} onChange={setVia} allowEmpty />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">便名</label>
                <input
                  type="text"
                  placeholder="NH841"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">座席</label>
                <input
                  type="text"
                  placeholder="12A"
                  value={seat}
                  onChange={(e) => setSeat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">機材タイプ</label>
              <AircraftTypeCombobox value={aircraftType} onChange={setAircraftType} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">機体記号 (レジ)</label>
              <input
                type="text"
                placeholder="JA801A"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">搭乗・機体写真 (任意)</label>
              <input
                ref={aircraftImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleAircraftImageUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
              />
              {aircraftImageMessage && (
                <p className="mt-1 text-[10px] font-bold text-amber-600">{aircraftImageMessage}</p>
              )}
            </div>
          </div>
        </details>

        {/* ================= 5. RESULT SUMMARY CARD (カンプ準拠: ダークネイビーグラデーション) ================= */}
        <div
          ref={resultCardRef}
          className="bg-gradient-to-br from-[#0B192C] via-[#102A4A] to-[#1E3E62] text-white rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-3"
        >
          <div className="flex items-center justify-between text-white/80">
            <span className="text-xs font-bold tracking-wide">獲得プレミアムポイント</span>
            <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
              {tripType === "roundtrip" ? "往復合計" : "片道"} · ¥{ppUnitPrice}/PP
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#38BDF8] tracking-tight tabular-nums">
              {totalPP.toLocaleString()}
            </span>
            <span className="text-lg font-black text-white/90">PP</span>
          </div>

          <div className="text-[11px] text-white/70 leading-relaxed pt-1 border-t border-white/10">
            区間基本マイル {flightMode === "domestic" ? manualDistance : intlManualDistance} × 積算率{" "}
            {flightMode === "domestic"
              ? `${Math.round((domFareTypes[fareKey]?.rate || 1) * 100)}%`
              : `${Math.round((intlClassDetails?.rate || 1) * 100)}%`}
            {flightMode === "domestic" ? " × 路線倍率 2.0倍" : ""}
          </div>
        </div>

        {/* エラーメッセージ */}
        {saveFlightError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
            {saveFlightError}
          </div>
        )}

        {/* ================= 6. PRIMARY CTA BUTTON ================= */}
        <button
          type="button"
          disabled={isSavingFlight}
          onClick={saveFlightLog}
          className="w-full bg-[#2878F0] hover:bg-[#1E6AD8] text-white font-black py-4 px-4 rounded-2xl text-base shadow-[0_8px_24px_rgba(40,120,240,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSavingFlight ? "保存中..." : "この内容で登録"}
        </button>

      </div>
    </div>
  );
}
