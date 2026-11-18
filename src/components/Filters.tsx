"use client";

export const PRICE_RANGES = [
  { id: "all", label: "Tous les prix", min: 0, max: Infinity },
  { id: "lt25", label: "Moins de 25 €", min: 0, max: 25 },
  { id: "25-50", label: "25 – 50 €", min: 25, max: 50 },
  { id: "50-100", label: "50 – 100 €", min: 50, max: 100 },
  { id: "100-200", label: "100 – 200 €", min: 100, max: 200 },
  { id: "gt200", label: "Plus de 200 €", min: 200, max: Infinity },
] as const;

export type Sort = "manual" | "priority" | "price-asc" | "price-desc" | "recent";

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
  counts: { available: number; all: number };
}

function LineSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="select-line">
        {children}
      </select>
      <svg className="pointer-events-none absolute right-0 size-2.5 text-muted" viewBox="0 0 12 12" aria-hidden>
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </label>
  );
}

export function Filters({ value, onChange, categories, isAdmin, counts }: Props) {
  const set = <K extends keyof FiltersState>(key: K, v: FiltersState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-3">
      {!isAdmin ? (
        <div role="radiogroup" aria-label="Disponibilité" className="flex items-center gap-6">
          {(
            [
              ["available", "Disponibles", counts.available],
              ["all", "Tous", counts.all],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value.availability === id}
              onClick={() => set("availability", id)}
              className={`eyebrow relative py-2 transition ${value.availability === id ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {label} <span className="tabular opacity-60">({n})</span>
              <span
                className={`absolute inset-x-0 -bottom-px h-px origin-left bg-ink transition-transform duration-300 ${
                  value.availability === id ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          ))}
        </div>
      ) : (
        <span className="eyebrow text-muted">Toute la sélection ({counts.all})</span>
      )}

      <div className="-mx-4 flex items-center gap-x-6 overflow-x-auto whitespace-nowrap px-4 pb-1 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <LineSelect label="Catégorie" value={value.category} onChange={(v) => set("category", v)}>
          <option value="all">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </LineSelect>
        <LineSelect label="Prix" value={value.price} onChange={(v) => set("price", v as FiltersState["price"])}>
          {PRICE_RANGES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </LineSelect>
        <LineSelect label="Trier" value={value.sort} onChange={(v) => set("sort", v as Sort)}>
          <option value="manual">La sélection</option>
          <option value="priority">Par priorité</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="recent">Nouveautés</option>
        </LineSelect>
      </div>
    </div>
  );
}
