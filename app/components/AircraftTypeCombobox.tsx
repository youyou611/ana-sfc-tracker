"use client";

import { useId, useState } from "react";
import { AIRCRAFT_OPTIONS } from "../lib/aircraftImages";

export default function AircraftTypeCombobox({ value, onChange, onSelect }: {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}) {
  const generatedId = useId();
  const listboxId = `aircraft-options-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const [manufacturer, setManufacturer] = useState<"all" | "Airbus" | "Boeing" | "other">("all");
  const visibleQuery = isOpen ? query : value;
  const filteredOptions = AIRCRAFT_OPTIONS.filter((option) => {
    const family = option.label.startsWith("Airbus ") ? "Airbus" : option.label.startsWith("Boeing ") ? "Boeing" : "other";
    return (manufacturer === "all" || manufacturer === family)
      && `${option.value} ${option.label}`.toLowerCase().includes(visibleQuery.trim().toLowerCase());
  });

  const selectOption = (index: number) => {
    const option = filteredOptions[index];
    if (!option) return;
    onChange(option.value);
    onSelect?.(option.value);
    setQuery(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center gap-1" aria-label="機材メーカーで絞り込み">
        {[{ value: "all", label: "全て" }, { value: "Airbus", label: "Airbus" }, { value: "Boeing", label: "Boeing" }, { value: "other", label: "その他" }].map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={manufacturer === item.value}
            onClick={() => { setManufacturer(item.value as typeof manufacturer); setActiveIndex(0); setIsOpen(true); }}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 transition-colors ${manufacturer === item.value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex">
        <input
          aria-label="機材"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && filteredOptions.length ? `${listboxId}-option-${activeIndex}` : undefined}
          value={visibleQuery}
          onFocus={() => { setQuery(value); setActiveIndex(0); setIsOpen(true); }}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setQuery(value);
            } else if (event.key === "ArrowDown" && filteredOptions.length) {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => (index + 1) % filteredOptions.length);
            } else if (event.key === "ArrowUp" && filteredOptions.length) {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => (index - 1 + filteredOptions.length) % filteredOptions.length);
            } else if (event.key === "Enter" && isOpen && filteredOptions.length) {
              event.preventDefault();
              selectOption(activeIndex);
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setActiveIndex(0);
            onChange(nextValue);
            setIsOpen(true);
          }}
          placeholder="例：B787-9"
          className="w-full min-h-9 rounded-l-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button type="button" aria-label="機材候補を開く" aria-expanded={isOpen} aria-controls={listboxId} onMouseDown={(event) => event.preventDefault()} onClick={() => { if (isOpen) setIsOpen(false); else { setQuery(value); setActiveIndex(0); setIsOpen(true); } }} className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 px-2.5 text-slate-600 hover:bg-slate-200">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m6 9 6 6 6-6" /></svg>
        </button>
      </div>
      {isOpen && <ul id={listboxId} role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
        {filteredOptions.map((option, index) => <li key={option.value} id={`${listboxId}-option-${index}`} role="option" aria-selected={value === option.value}>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectOption(index)} className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 ${index === activeIndex ? "bg-blue-50" : ""} ${value === option.value ? "text-[#003184]" : "text-slate-700"}`}>
            <span className="block text-sm font-bold">{option.label}</span><span className="block text-[10px] font-semibold text-slate-400">{option.value}</span>
          </button>
        </li>)}
        {filteredOptions.length === 0 && <li className="px-3 py-3 text-xs text-slate-400">候補がありません。型式を直接入力できます。</li>}
      </ul>}
    </div>
  );
}
