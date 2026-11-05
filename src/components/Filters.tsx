"use client";

import { ALL_COUNTRIES, ALL_GENRES, ALL_STUDIOS, CATEGORY_LABELS, type Category, type Movie } from "@/lib/types";

export interface FilterState {
  cat: string;
  genre: string;
  year: string;
  country: string;
  studio: string;
}

export const EMPTY_FILTERS: FilterState = { cat: "", genre: "", year: "", country: "", studio: "" };

export const YEAR_OPTIONS = [
  ...Array.from({ length: 2026 - 2015 + 1 }, (_, i) => String(2026 - i)),
  "2010-2014",
  "2000-2009",
  "1990-1999",
  "1900-1989",
];

export function matchesFilters(m: Movie, f: FilterState): boolean {
  if (f.cat && m.category !== f.cat) return false;
  if (f.genre && !m.genres.includes(f.genre)) return false;
  if (f.country && m.country !== f.country) return false;
  if (f.studio && m.studio !== f.studio) return false;
  if (f.year) {
    if (f.year.includes("-")) {
      const [a, b] = f.year.split("-").map(Number);
      if (m.year < a || m.year > b) return false;
    } else if (m.year !== Number(f.year)) return false;
  }
  return true;
}

export default function Filters({
  value,
  onChange,
  countries = ALL_COUNTRIES,
  studios = ALL_STUDIOS,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  countries?: string[];
  studios?: string[];
}) {
  const set = (k: keyof FilterState, v: string) => onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-panel p-3 md:grid-cols-6">
      <select className="input" value={value.cat} onChange={(e) => set("cat", e.target.value)}>
        <option value="">Barcha turlar</option>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <select className="input" value={value.studio} onChange={(e) => set("studio", e.target.value)}>
        <option value="">Barcha studiyalar</option>
        {studios.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select className="input" value={value.genre} onChange={(e) => set("genre", e.target.value)}>
        <option value="">Barcha janrlar</option>
        {ALL_GENRES.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>
      <select className="input" value={value.year} onChange={(e) => set("year", e.target.value)}>
        <option value="">Barcha yillar</option>
        {YEAR_OPTIONS.map((y) => (
          <option key={y}>{y}</option>
        ))}
      </select>
      <select className="input" value={value.country} onChange={(e) => set("country", e.target.value)}>
        <option value="">Barcha davlatlar</option>
        {countries.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button className="btn btn-ghost col-span-2 md:col-span-1" onClick={() => onChange(EMPTY_FILTERS)}>
        Tozalash
      </button>
    </div>
  );
}
