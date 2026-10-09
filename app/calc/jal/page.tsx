"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFlightData } from "../../hooks/useFlightData";
import { calcJalFOP, calcJalLSP } from "../jalMileage";
import { getDomBaseMiles } from "../domesticMileage";

// JAL就航空港（主要 + 離島）
const jalAirports: { code: string; name: string }[] = [
  { code: "HND", name: "東京(羽田)" }, { code: "NRT", name: "東京(成田)" },
  { code: "ITM", name: "大阪(伊丹)" }, { code: "KIX", name: "大阪(関西)" }, 
  { code: "FUK", name: "福岡" }, { code: "CTS", name: "札幌(新千歳)" }, { code: "OKA", name: "沖縄(那覇)" },
  { code: "NGO", name: "名古屋(中部)" }, { code: "UKB", name: "神戸" },
  { code: "AOJ", name: "青森" }, { code: "MSJ", name: "三沢" }, { code: "AXT", name: "秋田" },
  { code: "HNA", name: "花巻" }, { code: "YGJ", name: "山形" }, { code: "SDJ", name: "仙台" },
  { code: "KIJ", name: "新潟" }, { code: "KMQ", name: "小松" },
  { code: "MMB", name: "女満別" }, { code: "AKJ", name: "旭川" }, { code: "KUH", name: "釧路" },
  { code: "OBO", name: "帯広" }, { code: "HKD", name: "函館" }, { code: "OKD", name: "丘珠" },
  { code: "SHB", name: "中標津" }, { code: "RIS", name: "利尻" }, { code: "OIR", name: "奥尻" },
  { code: "IZO", name: "出雲" }, { code: "OKJ", name: "岡山" }, { code: "HIJ", name: "広島" },
  { code: "UBJ", name: "山口宇部" }, { code: "TAK", name: "高松" }, { code: "TKS", name: "徳島" },
  { code: "KCZ", name: "高知" }, { code: "MYJ", name: "松山" },
  { code: "KKJ", name: "北九州" }, { code: "OIT", name: "大分" }, { code: "NGS", name: "長崎" },
  { code: "KMJ", name: "熊本" }, { code: "KMI", name: "宮崎" }, { code: "KOJ", name: "鹿児島" },
  { code: "ASJ", name: "奄美大島" }, { code: "TKN", name: "徳之島" }, { code: "OKE", name: "沖永良部" },
  { code: "RNJ", name: "与論" }, { code: "KKX", name: "喜界島" }, { code: "TNE", name: "種子島" },
  { code: "KUM", name: "屋久島" }, { code: "KTD", name: "北大東" }, { code: "MMD", name: "南大東" },
  { code: "UEO", name: "久米島" }, { code: "TRA", name: "多良間" }, { code: "MMY", name: "宮古" },
  { code: "ISG", name: "石垣" }, { code: "OGN", name: "与那国" }
];

const jalFareTypes: { [key: string]: { label: string, rate: number, bonus: number } } = {
  "fare1": { label: "運賃1 (100% + 400FOP) 普通運賃/往復割引", rate: 1.0, bonus: 400 },
  "fare2": { label: "運賃2 (75% + 400FOP) セイバー/特便", rate: 0.75, bonus: 400 },
  "fare3": { label: "運賃3 (75% + 0FOP) スペシャルセイバー等", rate: 0.75, bonus: 0 },
  "fare4": { label: "運賃4 (50% + 0FOP) プロモーション等", rate: 0.50, bonus: 0 },
};

const SearchableAirportSelect = ({ label, value, onChange, allowEmpty = false }: { label: string, value: string, onChange: (val: string) => void, allowEmpty?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const displayValue = value ? `${jalAirports.find(a => a.code === value)?.name || value} (${value})` : "";
  const filtered = jalAirports.filter(a => a.name.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <label className="text-[10px] font-bold text-red-800/60 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-red-50/50 border border-red-100 rounded-lg p-2.5 pl-3 pr-8 text-sm font-bold text-red-900 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-red-300 placeholder:font-normal"
          placeholder="空港名 or 3レター"
          value={isOpen ? search : displayValue}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => { setIsOpen(true); setSearch(""); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>
      {isOpen && (
        <ul className="absolute z-50 w-full bg-white border border-red-100 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-slate-50">
          {allowEmpty && <li className="p-3 text-sm cursor-pointer hover:bg-red-50 text-slate-500 font-medium" onClick={() => onChange("")}>直行便 (経由なし)</li>}
          {filtered.map(a => (
            <li key={a.code} className="p-3 text-sm cursor-pointer hover:bg-red-50 flex justify-between items-center group" onClick={() => onChange(a.code)}>
              <span className="font-bold text-slate-700 group-hover:text-red-800">{a.name}</span>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">{a.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function JalCalculator() {
  const router = useRouter();
  const { addLog, isLoaded: hookLoaded } = useFlightData();
  const today = new Date().toISOString().split('T')[0];
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [date, setDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);
  const [origin, setOrigin] = useState("HND");
  const [via, setVia] = useState("");
  const [destination, setDestination] = useState("OKA");
  const [fareKey, setFareKey] = useState("fare3");
  const [ticketPrice, setTicketPrice] = useState(15000);

  const [flightNumber, setFlightNumber] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [registration, setRegistration] = useState("");
  const [seat, setSeat] = useState("");

  const returnDateRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const scrollToResult = () => {
    if (resultCardRef.current) {
      resultCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("sfc_jal_calc_state");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.tripType) setTripType(p.tripType);
        if (p.date) setDate(p.date);
        if (p.returnDate) setReturnDate(p.returnDate);
        if (p.origin) setOrigin(p.origin);
        if (p.via !== undefined) setVia(p.via);
        if (p.destination) setDestination(p.destination);
        if (p.fareKey) setFareKey(p.fareKey);
        if (p.ticketPrice !== undefined) setTicketPrice(p.ticketPrice);
        if (p.flightNumber) setFlightNumber(p.flightNumber);
        if (p.aircraftType) setAircraftType(p.aircraftType);
        if (p.registration) setRegistration(p.registration);
        if (p.seat) setSeat(p.seat);
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sfc_jal_calc_state", JSON.stringify({
        tripType, date, returnDate, origin, via, destination, fareKey, ticketPrice,
        flightNumber, aircraftType, registration, seat
      }));
    }
  }, [tripType, date, returnDate, origin, via, destination, fareKey, ticketPrice, flightNumber, aircraftType, registration, seat, isLoaded]);

  const getDistance = (from: string, to: string) => getDomBaseMiles(from, to) || 0;

  const calculateFOP = () => {
    const fare = jalFareTypes[fareKey];
    if (!fare) return 0;
    
    const dist1 = getDistance(origin, via);
    const dist2 = getDistance(via, destination);

    const getFOP = (dist: number) => calcJalFOP({ baseMiles: dist, accumulationRate: fare.rate, routeType: 'domestic', boardingBonus: fare.bonus });

    if (via) return getFOP(dist1) + getFOP(dist2);
    return getFOP(getDistance(origin, destination));
  };

  const calculateLSP = () => {
    const segments = via ? 2 : 1;
    return calcJalLSP('domestic', 0) * segments;
  };

  const baseFOP = calculateFOP();
  const baseLSP = calculateLSP();
  const totalFOP = tripType === "roundtrip" ? baseFOP * 2 : baseFOP;
  const totalLSP = tripType === "roundtrip" ? baseLSP * 2 : baseLSP;
  const ppUnitPrice = totalFOP > 0 ? (ticketPrice / totalFOP).toFixed(1) : "0.0";

  const handleSwapRoute = () => { const t = origin; setOrigin(destination); setDestination(t); };

  const saveLog = async () => {
    if (!date) return alert("搭乗日を入力してください。");
    
    const originName = jalAirports.find(a => a.code === origin)?.name || origin;
    const destName = jalAirports.find(a => a.code === destination)?.name || destination;
    const viaName = via ? jalAirports.find(a => a.code === via)?.name || via : "";
    const basePrice = Math.floor(ticketPrice / (tripType === "roundtrip" ? 2 : 1));

    const newLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      airline: 'JAL' as const,
      date,
      year: new Date(date).getFullYear(),
      origin: originName,
      destination: destName,
      via: viaName,
      pp: baseFOP,
      lsp: baseLSP,
      price: basePrice + (tripType === "roundtrip" ? ticketPrice % 2 : 0),
      flightNumber, aircraftType, registration, seat
    };

    await addLog(newLog);

    if (tripType === "roundtrip") {
      const returnLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : (Date.now() + 1).toString(),
        airline: 'JAL' as const,
        date: returnDate,
        year: new Date(returnDate).getFullYear(),
        origin: destName,
        destination: originName,
        via: viaName,
        pp: baseFOP,
        lsp: baseLSP,
        price: basePrice,
        flightNumber, aircraftType, registration, seat
      };
      await addLog(returnLog);
    }

    router.push("/logs");
  };

  if (!isLoaded || !hookLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 font-bold text-sm">読み込み中...</p></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-24 font-sans">
      <div className="bg-red-900 text-white py-4 md:py-6 px-4 md:px-6 relative shadow-md mb-4 md:mb-6">
        <h1 className="text-base md:text-xl font-bold tracking-tight text-center">JAL FOPシミュレーター (国内線)</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-red-100">
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full mb-6 relative shadow-inner">
            <button onClick={() => setTripType("oneway")} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all z-10 ${tripType === 'oneway' ? 'text-red-800 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>片道</button>
            <button onClick={() => setTripType("roundtrip")} className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all z-10 ${tripType === 'roundtrip' ? 'text-red-800 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>往復</button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-red-800/60 mb-1.5 block uppercase">搭乗日</label>
                <input type="date" className="w-full bg-red-50/50 border border-red-100 rounded-lg p-2.5 text-sm font-bold text-red-900 outline-none" value={date} onChange={e => { setDate(e.target.value); if(tripType === 'roundtrip') setReturnDate(e.target.value); }} />
              </div>
              {tripType === "roundtrip" && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  <label className="text-[10px] font-bold text-red-800/60 mb-1.5 block uppercase">復路搭乗日</label>
                  <input type="date" ref={returnDateRef} className="w-full bg-red-50/50 border border-red-100 rounded-lg p-2.5 text-sm font-bold text-red-900 outline-none" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={date} />
                </motion.div>
              )}
            </div>

            <div className="relative pt-2">
              <div className="grid grid-cols-2 gap-4 items-end">
                <SearchableAirportSelect label="出発地" value={origin} onChange={setOrigin} />
                <SearchableAirportSelect label="到着地" value={destination} onChange={setDestination} />
              </div>
              <button onClick={handleSwapRoute} className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 bg-white border border-red-100 shadow-sm text-red-600 rounded-full p-1.5 hover:bg-red-50 active:scale-90 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </button>
            </div>

            <div>
              <SearchableAirportSelect label="経由地 (直行便は空欄)" value={via} onChange={setVia} allowEmpty={true} />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-red-800/60 mb-1 block uppercase">運賃種別・積算率</label>
              <select className="w-full bg-red-50/50 border border-red-100 rounded-lg p-2.5 text-sm font-bold text-red-900 outline-none" value={fareKey} onChange={e => setFareKey(e.target.value)}>
                {Object.keys(jalFareTypes).map(k => <option key={k} value={k}>{jalFareTypes[k].label}</option>)}
              </select>
            </div>

            <div className="pt-3 pb-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-red-800/60 mb-2 block uppercase">オタク向け詳細（任意）</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="便名 (JL516)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
                <input type="text" value={seat} onChange={e => setSeat(e.target.value)} placeholder="座席 (5A)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
                <input type="text" value={aircraftType} onChange={e => setAircraftType(e.target.value)} placeholder="機材 (A350-900)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
                <input type="text" value={registration} onChange={e => setRegistration(e.target.value)} placeholder="機体記号 (JA01XJ)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none" />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-red-800/60 mb-1 flex justify-between uppercase">
                <span>航空券代 (円) ※{tripType === "roundtrip" ? "往復総額" : "片道額"}</span>
              </label>
              <input type="number" className="w-full bg-red-50/50 border border-red-100 rounded-xl p-3 text-lg font-black text-red-900 focus:ring-2 focus:ring-red-500 outline-none" value={ticketPrice} onChange={e => setTicketPrice(Number(e.target.value))} onKeyDown={e => e.key === "Enter" && scrollToResult()} onBlur={() => window.innerWidth < 768 && scrollToResult()} />
            </div>
          </div>
        </div>

        <div ref={resultCardRef} className="bg-red-800 rounded-2xl p-6 md:p-8 text-white text-center shadow-lg scroll-mt-14">
          <p className="text-[10px] font-bold text-red-200 tracking-widest uppercase mb-1">獲得FLY ON ポイント <span className="bg-red-900/50 px-2 py-0.5 rounded">{tripType === "roundtrip" ? "往復" : "片道"}</span></p>
          <p className="text-6xl md:text-7xl font-black drop-shadow-md">{totalFOP.toLocaleString()}</p>
          <p className="text-xs font-bold opacity-70 mt-1">FOP</p>
          {totalLSP > 0 && <p className="text-xs font-bold text-emerald-300 mt-2">+{totalLSP} LSP</p>}
          
          <div className="pt-5 mt-5 border-t border-red-700/50">
            <p className="text-[10px] font-bold text-red-200 tracking-widest uppercase mb-1">FOP単価</p>
            <p className="text-3xl font-black">¥ {ppUnitPrice}</p>
          </div>

          <button onClick={saveLog} className="w-full mt-6 py-4 bg-white text-red-900 text-sm font-black rounded-xl hover:bg-red-50 shadow-md transition-all active:scale-95">
            履歴に登録
          </button>
        </div>
      </div>
    </motion.div>
  );
}
