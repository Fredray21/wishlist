"use client";

import { ArrowUpDown, Euro, Tag } from "lucide-react";

export const PRICE_RANGES = [
  { id: "all", label: "Tous les prix", min: 0, max: Infinity },
  { id: "lt25", label: "Moins de 25 €", min: 0, max: 25 },
  { id: "25-50", label: "25 € – 50 €", min: 25, max: 50 },
  { id: "50-100", label: "50 € – 100 €", min: 50, max: 100 },
  { id: "100-200", label: "100 € – 200 €", min: 100, max: 200 },
  { id: "gt200", label: "Plus de 200 €", min: 200, max: Infinity },
] as const;

export type Sort = "priority" | "price-asc" | "price-desc" | "recent";

export interface FiltersState {
  availability: "available" | "all";
  category: string;
  price: (typeof PRICE_RANGES)[number]["id"];
  sort: Sort;
}

interface Props {
  value: FiltersState;
  onChange: (value: FiltersState) => void;
  categories: string[];
  isAdmin: boolean;
}

function Select({
  icon: Icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3 size-4 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-line bg-surface py-0 pl-9 pr-8 text-sm font-medium text-ink shadow-sm outline-none transition hover:border-muted focus:border-primary"
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 size-3 text-muted" viewBox="0 0 12 12" aria-hidden>
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </label>
  );
}

export function Filters({ value, onChange, categories, isAdmin }: Props) {
  const set = <K extends keyof FiltersState>(key: K, v: FiltersState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isAdmin && (
        <div role="radiogroup" aria-label="Disponibilité" className="flex h-10 rounded-xl border border-line bg-surface p-1 shadow-sm">
          {(
            [
              ["available", "Disponibles"],
              ["all", "Tous"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value.availability === id}
              onClick={() => set("availability", id)}
              className={`rounded-lg px-3 text-sm font-medium transition ${
                value.availability === id ? "bg-primary text-primary-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <Select icon={Tag} label="Catégorie" value={value.category} onChange={(v) => set("category", v)}>
        <option value="all">Toutes catégories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select icon={Euro} label="Prix" value={value.price} onChange={(v) => set("price", v as FiltersState["price"])}>
        {PRICE_RANGES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </Select>
      <Select icon={ArrowUpDown} label="Trier" value={value.sort} onChange={(v) => set("sort", v as Sort)}>
        <option value="priority">Par priorité</option>
        <option value="price-asc">Prix croissant</option>
        <option value="price-desc">Prix décroissant</option>
        <option value="recent">Plus récents</option>
      </Select>
    </div>
  );
}
