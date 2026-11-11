export type TravelClass = "economy" | "premium-economy" | "business" | "first" | "premium-class" | "class-j";

export const TRAVEL_CLASS_PRESENTATION: Record<TravelClass, { label: string; badge: string; border: string; ticket: string }> = {
  economy: { label: "エコノミー", badge: "bg-slate-100 text-slate-700", border: "border-slate-300", ticket: "bg-slate-100" },
  "premium-economy": { label: "プレミアムエコノミー", badge: "bg-teal-100 text-teal-800", border: "border-teal-500", ticket: "bg-teal-50" },
  business: { label: "ビジネス", badge: "bg-violet-100 text-violet-800", border: "border-violet-500", ticket: "bg-violet-50" },
  first: { label: "ファースト", badge: "bg-amber-100 text-amber-900", border: "border-amber-500", ticket: "bg-amber-50" },
  "premium-class": { label: "プレミアムクラス", badge: "bg-amber-100 text-amber-900", border: "border-amber-500", ticket: "bg-amber-50" },
  "class-j": { label: "クラスJ", badge: "bg-rose-100 text-rose-800", border: "border-rose-500", ticket: "bg-rose-50" },
};

export function getTravelClassPresentation(value?: string) {
  return TRAVEL_CLASS_PRESENTATION[(value || "economy") as TravelClass] || TRAVEL_CLASS_PRESENTATION.economy;
}

export function getAnaDomesticClass(isFirstClass: boolean, date: string): TravelClass {
  if (!isFirstClass) return "economy";
  return date >= "2026-05-19" ? "first" : "premium-class";
}
