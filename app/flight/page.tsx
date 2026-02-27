"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 空港データの定義
const airports = [
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
  { code: "TSJ", name: "対馬" }
];

// 空港選択コンポーネント
const SearchableAirportSelect = ({ label, value, onChange, allowEmpty = false }: { label: string, value: string, onChange: (val: string) => void, allowEmpty?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const displayValue = value ? `${airports.find(a => a.code === value)?.name} (${value})` : "";
  const filtered = airports.filter(a => a.name.includes(search) || a.code.toLowerCase().includes(search.toLowerCase()));

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
          {filtered.map(a => (
            <li key={a.code} className="p-3 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center group" onClick={() => onChange(a.code)}>
              <span className="font-bold text-slate-700 group-hover:text-[#003184]">{a.name}</span>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">{a.code}</span>
            </li>
          ))}
          {filtered.length === 0 && <li className="p-3 text-sm text-slate-400 text-center">見つかりません</li>}
        </ul>
      )}
    </div>
  );
};

export default function FlightCalculator() {
  const router = useRouter();
  
  const today = new Date().toISOString().split('T')[0];
  
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [date, setDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);
  
  const [isNewFare, setIsNewFare] = useState(false); 
  const [origin, setOrigin] = useState("ITM");
  const [via, setVia] = useState("OKA");
  const [destination, setDestination] = useState("ISG");
  
  const [manualDistance, setManualDistance] = useState<number>(0); 
  // デフォルト運賃をプレミアム系にしやすいよう調整
  const [fareKey, setFareKey] = useState("p_simple"); 
  const [boardingBonus, setBoardingBonus] = useState(400);
  const [ticketPrice, setTicketPrice] = useState(25000);

  const returnDateRef = useRef<HTMLInputElement>(null);

  // 簡易マイレージテーブル
  const mileageTable: { [key: string]: { [key: string]: number } } = {
    HND: { OKA: 984, ISG: 1095, CTS: 510, FUK: 567, ITM: 280, KIX: 280, NGO: 193, KOJ: 601, KMJ: 565, NGS: 610, MYJ: 438, TAK: 354, HIJ: 414, TOY: 176, KMQ: 211, HKD: 424, AKJ: 576 },
    ITM: { OKA: 739, ISG: 869, CTS: 666, HND: 280, FUK: 282, KOJ: 329, KMJ: 295, NGS: 334, MYJ: 159, KIJ: 246, SDJ: 315, HKD: 536, AKJ: 672 },
    KIX: { OKA: 739, ISG: 1214, CTS: 666, HND: 280, MMY: 893 },
    OKA: { HND: 984, ITM: 739, KIX: 739, FUK: 537, ISG: 247, MMY: 177, NGO: 809, CTS: 1397, SDJ: 1130, HIJ: 524, TAK: 574, KMJ: 466 },
    ISG: { HND: 1095, KIX: 1214, OKA: 247, NGO: 1030, FUK: 715 },
    CTS: { HND: 510, ITM: 666, KIX: 666, FUK: 882, NGO: 595, SDJ: 335, KIJ: 382, TOY: 442, KMQ: 466, HIJ: 768, OKJ: 729 },
    FUK: { HND: 567, OKA: 537, CTS: 882, ITM: 282, NGO: 374, SDJ: 665, KIJ: 521, KMQ: 414 }
  };

  const getDistance = (from: string, to: string) => mileageTable[from]?.[to] || mileageTable[to]?.[from] || 0;

  // 運賃定義：120%のプレミアムシンプルを追加し、計算順序の問題を解消
  const fareTypes: { [key: string]: { label: string, rate: number, bonus: number } } = isNewFare ? {
    "p_flex": { label: "プレミアム運賃 (150%)", rate: 1.5, bonus: 400 },
    "p_value": { label: "プレミアムバリュー (125%)", rate: 1.25, bonus: 400 },
    "p_simple": { label: "プレミアムシンプル (120%)", rate: 1.20, bonus: 400 }, // 伊丹那覇2173ppを実現するレート
    "flex": { label: "フレックス / 運賃1 (100%)", rate: 1.0, bonus: 400 },
    "value": { label: "バリュー / 運賃2 (75%)", rate: 0.75, bonus: 400 },
    "value_transit": { label: "バリュートランジット / 運賃6 (75%)", rate: 0.75, bonus: 200 },
    "super_value": { label: "スーパーバリュー / 運賃7 (75%)", rate: 0.75, bonus: 0 },
    "simple": { label: "シンプル / 運賃8相当 (70%)", rate: 0.70, bonus: 0 },
    "sale": { label: "セール / 運賃8 (50%)", rate: 0.5, bonus: 0 },
  } : {
    "old_fare1_3": { label: "運賃1〜3 (プレミアム等 125%)", rate: 1.25, bonus: 400 },
    "old_fare4": { label: "運賃4 (ANA FLEX等 100%)", rate: 1.0, bonus: 400 },
    "old_fare5": { label: "運賃5 (ANA VALUE等 75%)", rate: 0.75, bonus: 400 },
    "old_fare6": { label: "運賃6 (バリュートランジット 75%)", rate: 0.75, bonus: 200 },
    "old_fare7": { label: "運賃7 (SUPER VALUE等 75%)", rate: 0.75, bonus: 0 },
    "old_fare8": { label: "運賃8 (SV SALE等 50%)", rate: 0.5, bonus: 0 },
  };

  useEffect(() => {
    const calcDist = via ? getDistance(origin, via) + getDistance(via, destination) : getDistance(origin, destination);
    setManualDistance(calcDist);
  }, [origin, via, destination]);

  useEffect(() => {
    const defaultKey = isNewFare ? "p_simple" : "old_fare7";
    const fare = fareTypes[fareKey] || fareTypes[defaultKey];
    setBoardingBonus(fare?.bonus || 0);
  }, [fareKey, isNewFare]);

  // PP計算ロジック（修正済：2倍してから切り捨て）
  const calculateBasePP = () => {
    const defaultKey = isNewFare ? "p_simple" : "old_fare7";
    const fare = fareTypes[fareKey] || fareTypes[defaultKey];
    
    const dist1 = getDistance(origin, via);
    const dist2 = getDistance(via, destination);
    
    // 計算ロジック変更:
    // 従来: floor(マイル * 倍率) * 2  → 2172PP (1足りない)
    // 修正: floor(マイル * 倍率 * 2)  → 2173PP (正解)
    // ※ANA国内線は一律2倍のため、先に2倍してから端数処理を行うことで整合します

    if (via) {
      if (manualDistance === dist1 + dist2) {
        // 区間ごとに計算
        const pp1 = Math.floor(dist1 * fare.rate * 2) + boardingBonus;
        const pp2 = Math.floor(dist2 * fare.rate * 2) + boardingBonus;
        return pp1 + pp2;
      } else {
        // 手動距離入力時もボーナスは2回分
        return Math.floor(manualDistance * fare.rate * 2) + (boardingBonus * 2);
      }
    } else {
      // 直行便
      return Math.floor(manualDistance * fare.rate * 2) + boardingBonus;
    }
  };

  const basePP = calculateBasePP();
  const totalPP = tripType === "roundtrip" ? basePP * 2 : basePP;
  const ppUnitPrice = totalPP > 0 ? (ticketPrice / totalPP).toFixed(1) : "0.0";

  const switchToOldFare = () => { setIsNewFare(false); setFareKey("old_fare7"); };
  const switchToNewFare = () => { setIsNewFare(true); setFareKey("p_simple"); };

  const handleSwapRoute = () => {
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
  };

  const handleOutboundDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    
    if (tripType === "roundtrip") {
      setReturnDate(newDate);
      setTimeout(() => {
        if (returnDateRef.current) {
          returnDateRef.current.focus();
          try {
            if ('showPicker' in HTMLInputElement.prototype) {
              returnDateRef.current.showPicker();
            }
          } catch (err) {}
        }
      }, 50);
    }
  };

  const saveFlightLog = () => {
    if (!date) return alert("搭乗日を入力してください。");
    if (tripType === "roundtrip" && !returnDate) return alert("復路の搭乗日を入力してください。");

    const existingLogs = localStorage.getItem("sfc_flight_logs");
    const logsArray = existingLogs ? JSON.parse(existingLogs) : [];

    const originName = airports.find(a => a.code === origin)?.name || origin;
    const destName = airports.find(a => a.code === destination)?.name || destination;
    const viaName = via ? airports.find(a => a.code === via)?.name : "";

    const basePrice = Math.floor(ticketPrice / (tripType === "roundtrip" ? 2 : 1));

    logsArray.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      date: date,
      year: new Date(date).getFullYear(),
      origin: originName,
      destination: destName,
      via: viaName,
      pp: basePP,
      price: basePrice + (tripType === "roundtrip" ? ticketPrice % 2 : 0)
    });

    if (tripType === "roundtrip") {
      logsArray.push({
        id: crypto.randomUUID ? crypto.randomUUID() : (Date.now() + 1).toString(),
        date: returnDate,
        year: new Date(returnDate).getFullYear(),
        origin: destName,
        destination: originName,
        via: viaName,
        pp: basePP,
        price: basePrice
      });
    }

    localStorage.setItem("sfc_flight_logs", JSON.stringify(logsArray));
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#003184]">PP フライトシミュレーター</h1>
          </div>
          <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-[#003184] transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            ← ダッシュボードへ戻る
          </Link>
        </header>

        <div className="flex justify-center mb-2">
          <div className="bg-slate-200/70 p-1 rounded-xl inline-flex relative shadow-inner w-full md:w-auto">
            <button onClick={switchToOldFare} className={`flex-1 md:flex-none relative z-10 px-8 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${!isNewFare ? 'text-[#003184] bg-white shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              〜5/18 旧運賃
            </button>
            <button onClick={switchToNewFare} className={`flex-1 md:flex-none relative z-10 px-8 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${isNewFare ? 'text-[#003184] bg-white shadow-md transform scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}>
              5/19〜 新運賃体系
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-8">
            
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit shadow-inner">
              <button onClick={() => setTripType("oneway")} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${tripType === 'oneway' ? 'bg-white text-[#003184] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                片道
              </button>
              <button onClick={() => setTripType("roundtrip")} className={`px-6 py-2 text-xs font-bold rounded-md transition-all ${tripType === 'roundtrip' ? 'bg-white text-[#003184] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                往復
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider text-[#003184]">
                  {tripType === "roundtrip" ? "往路 (行き) 搭乗日" : "搭乗予定日"}
                </label>
                <input 
                  type="date" 
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-[#003184] transition-all cursor-pointer" 
                  value={date} 
                  onChange={handleOutboundDateChange} 
                />
              </div>
              
              {tripType === "roundtrip" && (
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider text-[#003184]">復路 (帰り) 搭乗日</label>
                  <input 
                    type="date" 
                    ref={returnDateRef}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-[#003184] transition-all cursor-pointer" 
                    value={returnDate} 
                    onChange={(e) => setReturnDate(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-end">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {tripType === "roundtrip" ? "往路 (行き) のルートを設定" : "ルートを設定"}
              </div>
              <button onClick={handleSwapRoute} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#003184] text-[10px] font-bold rounded-full transition-colors border border-blue-200/50 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                出発・到着を反転
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <SearchableAirportSelect label="出発空港" value={origin} onChange={setOrigin} />
              <SearchableAirportSelect label="経由地 (任意)" value={via} onChange={setVia} allowEmpty={true} />
              <SearchableAirportSelect label="到着空港" value={destination} onChange={setDestination} />
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60 mt-4">
              <label className="text-[10px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                <span>区間基本マイレージ (片道合計)</span>
                <span className="text-blue-500 font-medium">※自動算出されない場合は手入力</span>
              </label>
              <div className="flex items-center">
                <input type="number" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xl font-bold text-[#003184] focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={manualDistance} onChange={(e) => setManualDistance(Number(e.target.value))} />
                <span className="ml-3 text-sm font-bold text-slate-400">マイル</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">運賃種別</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={fareKey} onChange={(e) => setFareKey(e.target.value)}>
                  {Object.keys(fareTypes).map(k => <option key={k} value={k}>{fareTypes[k].label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">搭乗ボーナス PP (1区間あたり)</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={boardingBonus} onChange={(e) => setBoardingBonus(Number(e.target.value))}>
                  <option value={0}>なし (0 PP)</option>
                  <option value={200}>200 PP (乗継等)</option>
                  <option value={400}>あり (400 PP)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wider">航空券代 (円) <span className="text-blue-500 ml-2">※{tripType === "roundtrip" ? "往復の総額" : "片道の金額"}を入力</span></label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-[#003184] rounded-xl p-8 text-white text-center shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center transform transition-all hover:scale-[1.02] duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-blue-300 tracking-widest uppercase mb-2">獲得プレミアムポイント <span className="bg-blue-500/50 px-2 py-0.5 rounded ml-2">{tripType === "roundtrip" ? "往復合計" : "片道"}</span></p>
                  <p className="text-7xl font-black tracking-tighter drop-shadow-md">{totalPP.toLocaleString()}</p>
                  <p className="text-sm font-bold opacity-70 mt-1">PP</p>
                </div>
                
                <div className="pt-6 border-t border-blue-700/50">
                  <p className="text-[10px] font-bold text-blue-300 tracking-widest uppercase mb-1">PP単価</p>
                  <p className="text-4xl font-bold text-white tracking-tight">¥ {ppUnitPrice}</p>
                </div>

                <div className="bg-blue-900/40 rounded-lg p-3 mt-4 text-[10px] text-blue-100 font-medium leading-relaxed text-left border border-blue-800/50">
                  <span className="text-blue-300 font-bold block mb-1">【片道分の内訳】</span>
                  {via && manualDistance === getDistance(origin, via) + getDistance(via, destination) ? (
                    <>
                      区間①: floor({getDistance(origin, via)} × {fareTypes[fareKey]?.rate} × 2) + <span className="text-yellow-300 font-bold">{boardingBonus}</span> = <span className="text-white font-bold">{Math.floor(getDistance(origin, via) * (fareTypes[fareKey]?.rate || 0) * 2) + boardingBonus} PP</span><br/>
                      区間②: floor({getDistance(via, destination)} × {fareTypes[fareKey]?.rate} × 2) + <span className="text-yellow-300 font-bold">{boardingBonus}</span> = <span className="text-white font-bold">{Math.floor(getDistance(via, destination) * (fareTypes[fareKey]?.rate || 0) * 2) + boardingBonus} PP</span><br/>
                      片道合計: <span className="text-white font-bold">{basePP} PP</span>
                    </>
                  ) : (
                    <>
                      floor({manualDistance} × {fareTypes[fareKey]?.rate} × 2) ＋ <span className="text-yellow-300 font-bold">{via ? boardingBonus * 2 : boardingBonus}</span> = <span className="text-white font-bold">{basePP} PP</span>
                    </>
                  )}
                  <p className="mt-1 text-blue-300/50 text-[9px]">※(マイル×倍率×2倍)で端数切り捨て後、ボーナスを加算</p>
                </div>
              </div>
            </div>

            <button onClick={saveFlightLog} className="w-full py-4 bg-white border border-slate-200 text-[#003184] text-sm font-black rounded-xl hover:bg-slate-50 hover:shadow-md transition-all flex items-center justify-center group">
              {tripType === "roundtrip" ? "往復2件のフライトをダッシュボードに登録" : "このフライトをダッシュボードに登録"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}