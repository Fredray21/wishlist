"use client";

import { Cake, Check, Palette, Snowflake, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  autoTheme,
  THEME_CHOICES,
  THEME_LABELS,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChoice,
} from "@/lib/themes";

const ICONS: Record<ThemeChoice, React.ComponentType<{ className?: string }>> = {
  auto: Sparkles,
  noel: Snowflake,
  anniversaire: Cake,
  minimaliste: Square,
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice | null;
    return v && THEME_CHOICES.includes(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

export function ThemeSwitcher({ birthdayMonth }: { birthdayMonth: number | null }) {
  const [choice, setChoice] = useState<ThemeChoice>("auto");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const auto: Theme = autoTheme(new Date().getMonth() + 1, birthdayMonth);

  useEffect(() => {
    // Synchronisation avec le choix mémorisé (appliqué avant hydratation par le script de démarrage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(readChoice());
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function select(next: ThemeChoice) {
    setChoice(next);
    setOpen(false);
    applyTheme(next === "auto" ? auto : next);
    try {
      if (next === "auto") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignoré */
    }
  }

  const Current = ICONS[choice];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-hero/15 bg-hero/5 px-3 py-1.5 text-xs font-medium text-hero-muted backdrop-blur transition hover:bg-hero/10 hover:text-hero"
        title="Changer de thème"
      >
        <Palette className="size-3.5" />
        <span className="hidden sm:inline">Thème :</span>
        <Current className="size-3.5" />
        {THEME_LABELS[choice]}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-xl"
        >
          {THEME_CHOICES.map((t) => {
            const Icon = ICONS[t];
            return (
              <button
                key={t}
                role="menuitemradio"
                aria-checked={choice === t}
                type="button"
                onClick={() => select(t)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-surface-2"
              >
                <Icon className="size-4 text-muted" />
                <span className="flex-1">
                  {THEME_LABELS[t]}
                  {t === "auto" && <span className="ml-1 text-xs text-muted">({THEME_LABELS[auto]})</span>}
                </span>
                {choice === t && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
