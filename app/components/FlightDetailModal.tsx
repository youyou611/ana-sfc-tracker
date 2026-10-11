"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { deleteImageIfUnreferenced, getImage, saveImage } from "../lib/db";
import { FlightLogEx } from "../types";
import { AIRCRAFT_OPTIONS, getAircraftImageOptions, getFlyingHonuImagePath, getPreferredAircraftImagePath, getPreferredStarAllianceImagePath, getStarAllianceBackgroundOptions } from "../lib/aircraftImages";
import { getTravelClassPresentation, type TravelClass } from "../lib/travelClass";

type Props = {
  log: FlightLogEx;
  generatedImage: string;
  onClose: () => void;
  onUpdate: (log: FlightLogEx) => Promise<void>;
};

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を読み込めませんでした");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.84);
}

function AircraftTypeCombobox({ value, onChange, onSelect }: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const filteredOptions = AIRCRAFT_OPTIONS.filter((option) =>
    `${option.value} ${option.label}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="relative">
      <div className="flex">
        <input
          id="flight-aircraft-type"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="ana-aircraft-options"
          aria-autocomplete="list"
          value={isOpen ? query : value}
          onFocus={() => { setQuery(value); setIsOpen(true); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onChange(nextValue);
            setIsOpen(true);
          }}
          placeholder="例：B787-9"
          className="w-full rounded-l-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          aria-label="機材候補を表示"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (isOpen) setIsOpen(false);
            else { setQuery(""); setIsOpen(true); }
          }}
          className="rounded-r-xl border border-l-0 border-slate-200 bg-slate-100 px-3 text-slate-600 hover:bg-slate-200"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>
      {isOpen && <ul id="ana-aircraft-options" role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
        {filteredOptions.map((option) => <li key={option.value} role="option" aria-selected={value === option.value}>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { onSelect(option.value); setQuery(option.value); setIsOpen(false); }}
            className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 ${value === option.value ? "bg-blue-50 text-[#003184]" : "text-slate-700"}`}
          >
            <span className="block text-sm font-bold">{option.label}</span>
            <span className="block text-[10px] font-semibold text-slate-400">{option.value}</span>
          </button>
        </li>)}
        {filteredOptions.length === 0 && <li className="px-3 py-3 text-xs text-slate-400">候補がありません。型式を直接入力できます。</li>}
      </ul>}
    </div>
  );
}

export default function FlightDetailModal({ log, generatedImage, onClose, onUpdate }: Props) {
  const [memo, setMemo] = useState(log.memo || "");
  const [imageSrc, setImageSrc] = useState(generatedImage);
  const imageSrcRef = useRef(generatedImage);
  const updateImageSrc = (nextSrc: string) => {
    imageSrcRef.current = nextSrc;
    setImageSrc(nextSrc);
  };
  const [aircraftType, setAircraftType] = useState(log.aircraftType || "");
  const [registration, setRegistration] = useState(log.registration || "");
  const [flightNumber, setFlightNumber] = useState(log.flightNumber || "");
  const [seat, setSeat] = useState(log.seat || "");
  const [travelClass, setTravelClass] = useState<TravelClass>(log.travelClass || "economy");
  const [bookingClass, setBookingClass] = useState(log.bookingClass || "");
  const [aircraftImagePath, setAircraftImagePath] = useState(
    log.operatingCarrier && log.operatingCarrier !== "NH"
      ? getPreferredStarAllianceImagePath(log.aircraftType)
      : getPreferredAircraftImagePath(log.aircraftType, log.registration),
  );
  const [aircraftCustomImageId, setAircraftCustomImageId] = useState(log.aircraftCustomImageId || "");
  const [aircraftCustomImageSrc, setAircraftCustomImageSrc] = useState<string | null>(null);
  const [customImageMessage, setCustomImageMessage] = useState("");
  const aircraftImageInputRef = useRef<HTMLInputElement>(null);
  const [memoImages, setMemoImages] = useState<Array<{ id: string; src: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const allAircraftImages = getAircraftImageOptions(aircraftType);
  const starAllianceBackgroundOptions = getStarAllianceBackgroundOptions(aircraftType);
  const classPresentation = getTravelClassPresentation(travelClass);
  const isPartnerFlight = Boolean(log.operatingCarrier && log.operatingCarrier !== "NH");
  const isA380 = aircraftType.toUpperCase().includes("380");
  const honuPath = getFlyingHonuImagePath(registration);
  const standardAircraftImages = isPartnerFlight
    ? starAllianceBackgroundOptions
    : isA380
      ? allAircraftImages.filter((option) => option.path === (honuPath || getPreferredAircraftImagePath(aircraftType, registration)))
      : allAircraftImages.filter((option) => option.alliance === "ANA");
  const visibleAircraftImages = standardAircraftImages;

  useEffect(() => {
    let active = true;
    setMemoImages([]);
    setMemo(log.memo || "");
    setAircraftType(log.aircraftType || "");
    setRegistration(log.registration || "");
    setFlightNumber(log.flightNumber || "");
    setSeat(log.seat || "");
    setTravelClass(log.travelClass || "economy");
    setBookingClass(log.bookingClass || "");
    setAircraftCustomImageId(log.aircraftCustomImageId || "");
    setCustomImageMessage("");
    const defaultAircraftPath = log.operatingCarrier && log.operatingCarrier !== "NH"
      ? getPreferredStarAllianceImagePath(log.aircraftType)
      : getPreferredAircraftImagePath(log.aircraftType, log.registration);
    setAircraftImagePath(defaultAircraftPath);
    updateImageSrc(log.imageId ? generatedImage : log.aircraftCustomImageId ? generatedImage : defaultAircraftPath);
    Promise.all((log.memoImageIds || []).map(async (id) => ({ id, src: await getImage(id) }))).then((items) => {
      if (active) setMemoImages(items.filter((item): item is { id: string; src: string } => Boolean(item.src)));
    });
    if (log.aircraftCustomImageId) {
      getImage(log.aircraftCustomImageId).then((data) => {
        if (active) {
          setAircraftCustomImageSrc(data);
          if (!log.imageId && data) updateImageSrc(data);
        }
      });
    } else {
      setAircraftCustomImageSrc(null);
    }
    if (log.imageId) {
      getImage(log.imageId).then((data) => {
        if (active && data) updateImageSrc(data);
      });
    }
    return () => { active = false; };
  }, [log.id, log.imageId, log.memoImageIds, log.memo, log.aircraftType, log.registration, log.flightNumber, log.seat, log.travelClass, log.bookingClass, log.flightMode, log.operatingCarrier, log.aircraftImagePath, log.aircraftCustomImageId, generatedImage]);

  const currentFlightEdits = () => ({
    memo: memo.trim() || undefined,
    aircraftType: aircraftType.trim() || undefined,
    registration: registration.trim().toUpperCase() || undefined,
    flightNumber: flightNumber.trim() || undefined,
    seat: seat.trim() || undefined,
    travelClass,
    bookingClass: bookingClass.trim().toUpperCase() || undefined,
    aircraftImagePath: aircraftCustomImageId ? undefined : aircraftImagePath,
    aircraftCustomImageId: aircraftCustomImageId || undefined,
  });

  const handleAircraftTypeChange = (nextType: string, selectedFromList = false) => {
    setAircraftType(nextType);
    const isKnownOption = AIRCRAFT_OPTIONS.some((option) => option.value.toLowerCase() === nextType.trim().toLowerCase());
    if (selectedFromList || isKnownOption || nextType.toUpperCase().includes("380")) {
      const nextPath = isPartnerFlight ? getPreferredStarAllianceImagePath(nextType) : getPreferredAircraftImagePath(nextType, registration);
      setAircraftImagePath(nextPath);
      setAircraftCustomImageId("");
      setAircraftCustomImageSrc(null);
      if (!log.imageId) updateImageSrc(nextPath);
    }
  };

  const chooseAircraftBackground = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    setCustomImageMessage("");
    try {
      const data = await compressPhoto(file);
      const imageId = `flight-${log.id}-aircraft-bg-${crypto.randomUUID()}`;
      await saveImage(imageId, data);
      const previousImageId = aircraftCustomImageId;
      setAircraftCustomImageId(imageId);
      setAircraftCustomImageSrc(data);
      setAircraftImagePath("");
      await onUpdate({ ...log, ...currentFlightEdits(), aircraftImagePath: undefined, aircraftCustomImageId: imageId });
      if (previousImageId) await deleteImageIfUnreferenced(previousImageId);
      if (!log.imageId) updateImageSrc(data);
      setCustomImageMessage("自分の画像を背景として保存しました。");
    } catch {
      setCustomImageMessage("画像を保存できませんでした。別の画像でお試しください。");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const resetAircraftBackground = async () => {
    if (!aircraftCustomImageId) return;
    setIsSaving(true);
    try {
      const previousImageId = aircraftCustomImageId;
      const nextPath = isPartnerFlight ? getPreferredStarAllianceImagePath(aircraftType) : getPreferredAircraftImagePath(aircraftType, registration);
      setAircraftCustomImageId("");
      setAircraftCustomImageSrc(null);
      setAircraftImagePath(nextPath);
      await onUpdate({ ...log, ...currentFlightEdits(), aircraftImagePath: nextPath, aircraftCustomImageId: undefined });
      await deleteImageIfUnreferenced(previousImageId);
      if (!log.imageId) updateImageSrc(nextPath);
      setCustomImageMessage("既定の塗装画像に戻しました。");
    } catch {
      setCustomImageMessage("既定画像に戻せませんでした。");
    } finally {
      setIsSaving(false);
    }
  };

  const saveMemo = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ ...log, ...currentFlightEdits() });
      setMessage("フライト詳細とメモを保存しました");
    } catch {
      setMessage("メモを保存できませんでした。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setIsSaving(true);
    setMessage("");
    const added: Array<{ id: string; src: string }> = [];
    try {
      for (const file of files) {
        const data = await compressPhoto(file);
        const uniqueId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const imageId = `flight-${log.id}-memo-${uniqueId}`;
        await saveImage(imageId, data);
        added.push({ id: imageId, src: data });
      }
      const nextImages = [...memoImages, ...added];
      await onUpdate({ ...log, ...currentFlightEdits(), memoImageIds: nextImages.map((item) => item.id) });
      setMemoImages(nextImages);
      setMessage(`${added.length}枚の写真をメモに追加しました`);
    } catch {
      await Promise.all(added.map((item) => deleteImageIfUnreferenced(item.id).catch(() => undefined)));
      setMessage("写真を保存できませんでした。別の画像をお試しください。");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const removeMemoPhoto = async (imageId: string) => {
    setIsSaving(true);
    try {
      const nextImages = memoImages.filter((item) => item.id !== imageId);
      await onUpdate({ ...log, ...currentFlightEdits(), memoImageIds: nextImages.map((item) => item.id) });
      await deleteImageIfUnreferenced(imageId);
      setMemoImages(nextImages);
      setMessage("メモ写真を削除しました");
    } catch {
      setMessage("写真を削除できませんでした。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  const chooseCoverPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const data = await compressPhoto(file);
      const imageId = `flight-${log.id}-cover-${Date.now()}`;
      await saveImage(imageId, data);
      await onUpdate({ ...log, ...currentFlightEdits(), imageId });
      if (log.imageId) await deleteImageIfUnreferenced(log.imageId);
      setImageSrc(data);
      setMessage("カバー写真を保存しました");
    } catch {
      setMessage("カバー写真を保存できませんでした。");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  };

  const resetPhoto = async () => {
    if (!log.imageId) return;
    setIsSaving(true);
    try {
      await onUpdate({ ...log, ...currentFlightEdits(), imageId: undefined });
      await deleteImageIfUnreferenced(log.imageId);
      updateImageSrc(aircraftCustomImageSrc || getPreferredAircraftImagePath(aircraftType, registration));
      setMessage("機材画像に戻しました");
    } catch {
      setMessage("写真を解除できませんでした。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-md p-3 md:p-6 flex items-center justify-center"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="フライト詳細"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100"
      >
        <div className="relative h-52 md:h-72 bg-slate-900">
          <img src={imageSrc} alt={`${log.aircraftType || "航空機"} の画像`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/5 to-slate-950/20" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-black/80 transition-colors"
          >
            閉じる
          </motion.button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-xs font-bold text-white/75">{log.date} ・ {log.flightNumber || "便名未登録"}</p>
            <h2 className="mt-1 text-2xl font-black">{log.origin}{log.via ? ` → ${log.via}` : ""} → {log.destination}</h2>
            <p className="text-sm text-white/80">{log.operatingCarrier && log.operatingCarrier !== "NH" ? `スターアライアンス運航便 · ${log.operatingCarrier}` : "ANA運航便"} ・ {log.aircraftType || "機材未登録"}{log.registration ? ` ・ ${log.registration}` : ""}{log.seat ? ` ・ ${log.seat}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${classPresentation.badge}`}>{classPresentation.label}</span>{bookingClass && <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black">予約クラス {bookingClass}</span>}</div>
              </div>
        </div>
        <div className="space-y-5 p-5 md:p-7">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-blue-50 p-3"><p className="text-[10px] font-bold text-slate-500">獲得PP</p><p className="text-xl font-black text-[#003184]">{log.pp.toLocaleString()}</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-500">運賃</p><p className="text-lg font-black text-slate-800">¥{log.price.toLocaleString()}</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-500">PP単価</p><p className="text-lg font-black text-slate-800">¥{log.pp > 0 ? (log.price / log.pp).toFixed(1) : "0.0"}</p></div>
          </div>
          {log.operatingCarrier && log.operatingCarrier !== "NH" && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            <p className="font-black">提携航空会社のPP記録</p>
            <p className="mt-1">運航会社: {log.operatingCarrier} · 予約クラス: {log.bookingClass || "未登録"} · AMC積算率: {log.accrualRate === undefined ? "未確認" : `${log.accrualRate}%`} · 搭乗ポイント: {log.boardingPoints === undefined ? "未確定" : `${log.boardingPoints} PP`}</p>
            <p className="mt-1">距離の種類: {log.distanceSource === "great-circle" ? "参考大圏距離（公式PP確認には使用不可）" : log.distanceSource === "manual-official" ? "手入力の公式区間基本マイル" : "未記録"}</p>
            <p className="mt-1 text-slate-500">PPはAMC登録条件・対象運賃・運航会社の予約クラス別積算条件を確認した値を使用してください。</p>
          </div>}
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-black text-slate-800">フライト情報・機材画像</h3>
            <div className={`rounded-xl border ${classPresentation.border} ${classPresentation.ticket} p-3`}>
              <label htmlFor="flight-cabin-class" className="mb-1 block text-[10px] font-black text-slate-500">搭乗クラス・搭乗券カラー</label>
              <select id="flight-cabin-class" value={travelClass} onChange={(event) => setTravelClass(event.target.value as TravelClass)} className="w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100">
                <option value="economy">エコノミー</option>
                <option value="premium-economy">プレミアムエコノミー</option>
                <option value="business">ビジネス</option>
                <option value="first">ファースト</option>
                <option value="premium-class">国内線プレミアムクラス（旧表記）</option>
              </select>
              {log.bookingClass !== undefined && <div className="mt-2"><label htmlFor="flight-booking-class" className="mb-1 block text-[10px] font-bold text-slate-500">予約クラス</label><input id="flight-booking-class" value={bookingClass} onChange={(event) => setBookingClass(event.target.value.toUpperCase())} placeholder="Y" maxLength={2} className="w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm font-bold uppercase text-slate-800" /></div>}
            </div>
            <div>
              <label htmlFor="flight-aircraft-type" className="mb-1 block text-xs font-bold text-slate-600">機材（検索または選択）</label>
              <AircraftTypeCombobox
                value={aircraftType}
                onChange={(value) => handleAircraftTypeChange(value)}
                onSelect={(value) => handleAircraftTypeChange(value, true)}
              />
              <p className="mt-1 text-[10px] text-slate-400">型式名・略称のどちらでも検索できます。候補にない型式も直接入力できます。</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><label htmlFor="flight-number-edit" className="mb-1 block text-xs font-bold text-slate-600">便名</label><input id="flight-number-edit" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} placeholder="NH10" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></div>
              <div><label htmlFor="flight-registration-edit" className="mb-1 block text-xs font-bold text-slate-600">機体番号</label><input id="flight-registration-edit" value={registration} onChange={(event) => {
                const nextRegistration = event.target.value.toUpperCase();
                setRegistration(nextRegistration);
                const honuPath = getFlyingHonuImagePath(nextRegistration);
                if (honuPath) {
                  setAircraftType("A380-800");
                  setAircraftImagePath(honuPath);
                  if (!log.imageId) updateImageSrc(honuPath);
                } else if (aircraftType.toUpperCase().includes("380")) {
                  const anaPath = getPreferredAircraftImagePath("A380-800", nextRegistration);
                  setAircraftImagePath(anaPath);
                  if (!log.imageId) updateImageSrc(anaPath);
                }
              }} placeholder="JA381A" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase" /></div>
              <div><label htmlFor="flight-seat-edit" className="mb-1 block text-xs font-bold text-slate-600">座席</label><input id="flight-seat-edit" value={seat} onChange={(event) => setSeat(event.target.value.toUpperCase())} placeholder="5A" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase" /></div>
            </div>
            {aircraftType.toUpperCase().includes("380") && <p className="text-[11px] font-bold text-cyan-800">フライングホヌは機体番号から塗装色を自動選択します（JA381A 青・JA382A 緑・JA383A オレンジ）。</p>}
            <p className="text-[10px] text-slate-400">{isPartnerFlight ? "スターアライアンス運航便はスターアライアンス塗装を使用します。" : "ANA運航便はANA塗装を使用します。"}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {visibleAircraftImages.map((option) => <button key={option.path} type="button" onClick={() => {
                setAircraftImagePath(option.path);
                setAircraftCustomImageId("");
                setAircraftCustomImageSrc(null);
                if (!log.imageId) updateImageSrc(option.path);
              }} className={`overflow-hidden rounded-xl border text-left ${aircraftImagePath === option.path ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
                <img src={option.path} alt="" className="h-24 w-full object-cover" />
                <span className="block px-3 py-2 text-xs font-bold text-slate-700">{option.label}{aircraftImagePath === option.path ? " ✓" : ""}</span>
              </button>)}
              <button type="button" disabled={isSaving} onClick={() => aircraftImageInputRef.current?.click()} aria-pressed={Boolean(aircraftCustomImageId)} className={`overflow-hidden rounded-xl border text-left disabled:opacity-50 ${aircraftCustomImageId ? "border-blue-600 ring-2 ring-blue-100" : "border-dashed border-slate-300 hover:border-blue-400"}`}>
                {aircraftCustomImageSrc ? <img src={aircraftCustomImageSrc} alt="アップロードした機材背景" className="h-24 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-slate-50 text-slate-400">
                  <svg viewBox="0 0 120 60" className="h-12 w-24" fill="currentColor" aria-hidden="true"><path d="M58 3c-2 0-3 2-3 4v16L7 37c-3 1-4 3-4 5 0 3 2 4 5 4l47-9v8L37 54c-2 1-3 2-3 3h51c0-1-1-2-3-3L65 45v-8l47 9c3 0 5-1 5-4 0-2-2-4-5-5L65 23V7c0-2-3-4-7-4Z" /></svg>
                </div>}
                <span className="block px-3 py-2 text-xs font-bold text-slate-700">{aircraftCustomImageId ? "自分の画像 ✓（選択中）" : "自分の画像をアップロード"}</span>
              </button>
            </div>
            <input ref={aircraftImageInputRef} type="file" accept="image/*" onChange={chooseAircraftBackground} className="hidden" aria-label="機材背景画像をアップロード" />
            {aircraftCustomImageId && <button type="button" disabled={isSaving} onClick={resetAircraftBackground} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-50">既定の塗装画像に戻す</button>}
            {customImageMessage && <p role="status" className="text-[10px] font-bold text-slate-600">{customImageMessage}</p>}
            <button type="button" disabled={isSaving} onClick={saveMemo} className="rounded-xl bg-[#003184] px-4 py-2 text-xs font-black text-white disabled:opacity-50">機材情報と画像を保存</button>
          </div>
          <div>
            <label htmlFor="flight-memo" className="mb-2 block text-sm font-black text-slate-800">このフライトのメモ</label>
            <textarea id="flight-memo" value={memo} onChange={(event) => setMemo(event.target.value)} rows={4} placeholder="空港での出来事、座席の感想など" className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            <button type="button" disabled={isSaving} onClick={saveMemo} className="mt-2 rounded-xl bg-[#003184] px-4 py-2 text-xs font-black text-white disabled:opacity-50">メモを保存</button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <label className="cursor-pointer rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-black text-[#003184] hover:bg-blue-100">
              メモに写真を追加（複数可）
              <input type="file" accept="image/*" multiple onChange={choosePhoto} className="hidden" />
            </label>
            <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              カバー写真を変更
              <input type="file" accept="image/*" capture="environment" onChange={chooseCoverPhoto} className="hidden" />
            </label>
            {log.imageId && <button type="button" disabled={isSaving} onClick={resetPhoto} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">機材画像に戻す</button>}
            <span className="text-[11px] text-slate-400">写真は縮小してこの端末に保存します</span>
          </div>
          {memoImages.length > 0 && <div>
            <h3 className="mb-2 text-sm font-black text-slate-800">メモの写真（{memoImages.length}枚）</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {memoImages.map((photo, index) => <figure key={photo.id} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img src={photo.src} alt={`フライトメモの写真 ${index + 1}`} className="h-36 w-full object-cover" />
                <button type="button" disabled={isSaving} onClick={() => removeMemoPhoto(photo.id)} className="absolute right-2 top-2 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50">削除</button>
              </figure>)}
            </div>
          </div>}
          {message && <p role="status" className={`text-xs font-bold ${message.includes("できません") ? "text-red-600" : "text-emerald-700"}`}>{message}</p>}
        </div>
      </motion.section>
    </motion.div>
  );
}
