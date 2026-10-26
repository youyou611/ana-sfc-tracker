import { FlightLogEx } from "../types";

export type AircraftImageOption = { path: string; label: string; alliance: "ANA" | "star-alliance" };
export type StarAllianceBackgroundOption = { path: string; label: string; family: "Airbus" | "Boeing" };

export const AIRCRAFT_OPTIONS = [
  { value: "A380-800", label: "Airbus A380-800" },
  { value: "A350-900", label: "Airbus A350-900" },
  { value: "A321neo", label: "Airbus A321neo" },
  { value: "A321", label: "Airbus A321" },
  { value: "A320neo", label: "Airbus A320neo" },
  { value: "A320", label: "Airbus A320" },
  { value: "B787-10", label: "Boeing 787-10" },
  { value: "B787-9", label: "Boeing 787-9" },
  { value: "B787-8", label: "Boeing 787-8" },
  { value: "B777-300ER", label: "Boeing 777-300ER" },
  { value: "B777-200ER", label: "Boeing 777-200ER" },
  { value: "B767-300ER", label: "Boeing 767-300ER" },
  { value: "B737-800", label: "Boeing 737-800" },
  { value: "B737-700", label: "Boeing 737-700" },
  { value: "B737MAX", label: "Boeing 737 MAX" },
  { value: "DHC-8-Q400", label: "DHC-8-Q400 (Dash 8)" },
  { value: "E190", label: "Embraer 190" },
] as const;

function modelKey(aircraftType?: string): string {
  const text = (aircraftType || "").toUpperCase().replace(/[\s-]/g, "");
  if (text.includes("380")) return "A380";
  if (text.includes("350")) return "A350";
  if (text.includes("787")) return "B787";
  if (text.includes("777")) return "B777";
  if (text.includes("767")) return "B767";
  if (text.includes("747")) return "B747";
  if (text.includes("737MAX") || text.includes("7378") || text.includes("7379")) return "B737MAX";
  if (text.includes("320") || text.includes("321")) return text.includes("321") ? "A321" : "A320";
  if (text.includes("DHC8") || text.includes("DASH8") || text.includes("Q400")) return "DHC8";
  if (text.includes("E190")) return "E190";
  return "B787";
}

const aircraftAsset: Record<string, { ana?: string; star?: string }> = {
  A380: { ana: "ana-A380.jpg" },
  A350: { star: "スタアラ-A350.jpg" },
  B787: { ana: "ana-B787.jpg", star: "スタアラ-B787.jpg" },
  B777: { ana: "ana-B777.jpg", star: "スタアラ-B777.jpg" },
  B767: { ana: "ana-B767.jpg" },
  B747: { ana: "ana-B747.jpg" },
  B737MAX: { ana: "ana-B737MAX.jpg" },
  A320: { ana: "ana-A320.jpg" },
  A321: { ana: "ana-A320.jpg" },
  DHC8: { ana: "ana-DHC-8.jpg" },
  E190: { ana: "ana-B787.jpg" },
};

/** Background image choices for partner-operated flights. Keep independent from the actual recorded aircraft type. */
export function getStarAllianceBackgroundOptions(aircraftType?: string): StarAllianceBackgroundOption[] {
  const normalized = (aircraftType || "").toUpperCase().replace(/[\s-]/g, "");
  const isAirbus = /A(?:220|300|310|318|319|320|321|330|340|350|380)/.test(normalized) || normalized.startsWith("AIRBUS");
  const isBoeing = /B?(?:707|717|727|737|747|757|767|777|787)/.test(normalized) || normalized.startsWith("BOEING");
  if (isAirbus) {
    return [{ path: `/aircraft/ana/${encodeURIComponent("スタアラ-A350.jpg")}`, label: "A350 スターアライアンス塗装背景", family: "Airbus" }];
  }
  if (isBoeing) {
    return [
      { path: `/aircraft/ana/${encodeURIComponent("スタアラ-B777.jpg")}`, label: "B777 スターアライアンス塗装背景", family: "Boeing" },
      { path: `/aircraft/ana/${encodeURIComponent("スタアラ-B787.jpg")}`, label: "B787 スターアライアンス塗装背景", family: "Boeing" },
    ];
  }
  return [
    { path: `/aircraft/ana/${encodeURIComponent("スタアラ-A350.jpg")}`, label: "A350 スターアライアンス塗装背景", family: "Airbus" },
    { path: `/aircraft/ana/${encodeURIComponent("スタアラ-B777.jpg")}`, label: "B777 スターアライアンス塗装背景", family: "Boeing" },
    { path: `/aircraft/ana/${encodeURIComponent("スタアラ-B787.jpg")}`, label: "B787 スターアライアンス塗装背景", family: "Boeing" },
  ];
}

export function getAircraftImageOptions(aircraftType?: string): AircraftImageOption[] {
  const model = modelKey(aircraftType);
  const asset = aircraftAsset[model] || aircraftAsset.B787;
  const options: AircraftImageOption[] = [];
  if (model === "A380") {
    options.push({ path: "/aircraft/ana/ana-A380.jpg", label: "フライングホヌ・青 (JA381A)", alliance: "ANA" });
    options.push({ path: "/aircraft/ana/ana-A380%E2%91%A1.jpg", label: "フライングホヌ・緑 (JA382A)", alliance: "ANA" });
    options.push({ path: "/aircraft/ana/ana-A380%E2%91%A2.jpg", label: "フライングホヌ・オレンジ (JA383A)", alliance: "ANA" });
  }
  if (asset.ana && model !== "A380") options.push({ path: `/aircraft/ana/${encodeURIComponent(asset.ana)}`, label: "ANA標準塗装", alliance: "ANA" });
  if (asset.star) options.push({ path: `/aircraft/ana/${encodeURIComponent(asset.star)}`, label: "スターアライアンス塗装", alliance: "star-alliance" });
  return options;
}

export function getFlyingHonuImagePath(registration?: string): string | null {
  const code = (registration || "").toUpperCase().replace(/\s/g, "");
  if (code === "JA381A") return "/aircraft/ana/ana-A380.jpg";
  if (code === "JA382A") return "/aircraft/ana/ana-A380%E2%91%A1.jpg";
  if (code === "JA383A") return "/aircraft/ana/ana-A380%E2%91%A2.jpg";
  return null;
}

/** Choose the airline's standard image by default; select a Flying Honu by registration. */
export function getPreferredAircraftImagePath(aircraftType?: string, registration?: string): string {
  const options = getAircraftImageOptions(aircraftType);
  if (modelKey(aircraftType) === "A380") {
    return getFlyingHonuImagePath(registration)
      || options.find((option) => option.alliance === "ANA")?.path
      || "/aircraft/ana/ana-A380.jpg";
  }
  return options.find((option) => option.alliance === "ANA")?.path
    || options[0]?.path
    || "/aircraft/ana/ana-B787.jpg";
}

/** Prefer a Star Alliance livery when recording a partner-operated flight. */
export function getPreferredStarAllianceImagePath(aircraftType?: string): string {
  return getStarAllianceBackgroundOptions(aircraftType)[0]?.path || `/aircraft/ana/${encodeURIComponent("スタアラ-B787.jpg")}`;
}

export function getDefaultAircraftImagePath(log: Pick<FlightLogEx, "aircraftType" | "flightNumber" | "registration" | "aircraftImagePath"> & { operatingCarrier?: string }): string {
  const registration = (log.registration || "").toUpperCase().replace(/\s/g, "");
  const honuPath = getFlyingHonuImagePath(registration);
  const savedPath = log.aircraftImagePath;
  if (savedPath && savedPath.startsWith("/aircraft/")) return savedPath;
  if (honuPath && modelKey(log.aircraftType) === "A380") return honuPath;
  if (log.operatingCarrier && log.operatingCarrier !== "NH") return getPreferredStarAllianceImagePath(log.aircraftType);
  if (modelKey(log.aircraftType) === "A380") return getPreferredAircraftImagePath(log.aircraftType, registration);
  return getPreferredAircraftImagePath(log.aircraftType, registration);
}

export function getAircraftImagePath(log: FlightLogEx) {
  return getDefaultAircraftImagePath(log);
}
