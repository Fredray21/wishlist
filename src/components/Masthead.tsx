"use client";

import { LogOut, Unlock } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { formatPrice } from "@/lib/client";
import type { Theme } from "@/lib/themes";
import type { PublicItem } from "@/lib/types";
import { useEggs } from "./fx/EasterEggs";
import { useMultiTap } from "./fx/gestures";
import { burst, sparkle } from "./fx/particles";
import { CountUp, SplitText } from "./fx/Reveal";

interface Props {
  ownerName: string;
  theme: Theme;
  isAdmin: boolean;
  onLogout: () => void;
  stats: { label: string; value: number }[];
  cover: PublicItem[];
}

const TICKER = [
  "Réservations strictement confidentielles",
  "Emballage facultatif",
  "Livraison de bonheur offerte",
  "Pièces choisies avec soin",
  "Pas de chaussettes (sauf jolies)",
  "Surprise garantie",
];

const COPY: Record<Theme, { edition: string; title: string; dek: string }> = {
  noel: {
    edition: "Édition d'hiver",
    title: "La liste de Noël",
    dek: "Une sélection de pièces désirées, à glisser sous le sapin. Les lutins sont tenus au secret le plus absolu.",
  },
  anniversaire: {
    edition: "Numéro spécial anniversaire",
    title: "Joyeux anniversaire",
    dek: "Une bougie de plus, quelques envies en plus. Voici la sélection officielle de l'année.",
  },
  minimaliste: {
    edition: "Collection permanente",
    title: "La sélection",
    dek: "Des objets désirés, choisis avec soin. À offrir si l'envie vous prend, sans aucune obligation.",
  },
};

export function Masthead({ ownerName, theme, isAdmin, onLogout, stats, cover }: Props) {
  const eggs = useEggs();
  const logoTaps = useRef(0);
  const [logoBump, setLogoBump] = useState(0);
  const [hatched, setHatched] = useState(false);
  const [scatter, setScatter] = useState(false);
  const [reverse, setReverse] = useState(false);
  const strokes = useRef(0);
  const lastSpark = useRef(0);

  const now = new Date();
  const edition = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(now);
  const issue = String(now.getMonth() + 1).padStart(2, "0");
  const copy = COPY[theme];

  function onLogo(e: React.MouseEvent) {
    logoTaps.current += 1;
    setLogoBump((n) => n + 1);
    if (logoTaps.current >= 7) {
      logoTaps.current = 0;
      setHatched(true);
      eggs.found("logo");
      burst({ x: e.clientX, y: e.clientY, emojis: ["🥚", "🐣", "🐥"], count: 20, spread: 140, velocity: 9, angle: 90 });
      window.setTimeout(() => setHatched(false), 5000);
    }
  }

  const onTitleTap = useMultiTap(
    2,
    useCallback(() => {
      setScatter(true);
      eggs.found("scatter");
      window.setTimeout(() => setScatter(false), 1100);
    }, [eggs]),
  );

  /** Poussière de fée : glisser le doigt (ou la souris, bouton enfoncé) sur le titre. */
  function onTitleMove(e: React.PointerEvent) {
    const drawing = e.pointerType !== "mouse" || e.buttons === 1;
    if (!drawing) return;
    const t = performance.now();
    if (t - lastSpark.current < 30) return;
    lastSpark.current = t;
    sparkle(e.clientX, e.clientY, theme === "noel" ? "❄️" : theme === "anniversaire" ? "✨" : undefined);
    if (++strokes.current === 30) eggs.found("sparkle");
  }

  return (
    <>
      {/* Bandeau d'annonce */}
      <button
        type="button"
        onClick={() => {
          setReverse((r) => !r);
          eggs.found("marquee");
        }}
        className="marquee-wrap relative -mx-4 block w-[calc(100%+2rem)] overflow-hidden bg-primary py-2 text-primary-ink sm:-mx-6 sm:w-[calc(100%+3rem)]"
        aria-label="Bandeau d'annonce"
      >
        <div className="marquee" style={{ animationDirection: reverse ? "reverse" : "normal" }}>
          {[0, 1].map((copyIndex) => (
            <div key={copyIndex} className="flex shrink-0 items-center" aria-hidden={copyIndex === 1}>
              {TICKER.map((m) => (
                <span key={m} className="eyebrow flex items-center whitespace-nowrap px-6 !text-[10px]">
                  {m}
                  <span className="pl-12 opacity-60">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </button>

      {/* Barre de navigation */}
      <nav className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-4 text-hero-muted">
        <span className="eyebrow hidden sm:block" suppressHydrationWarning>
          N° {issue} · {edition}
        </span>
        <span className="eyebrow sm:hidden">N° {issue}</span>
        <span className="eyebrow text-center">{copy.edition}</span>
        <div className="flex items-center justify-end gap-4">
          {isAdmin ? (
            <>
              <Link href="/admin/reservations" className="eyebrow link-underline inline-flex items-center gap-1.5 hover:text-hero" title="Libérer une réservation">
                <Unlock className="size-3" /> <span className="sm:hidden">Résa</span>
                <span className="hidden sm:inline">Réservations</span>
              </Link>
              <button type="button" onClick={onLogout} className="eyebrow link-underline inline-flex items-center gap-1.5 hover:text-hero" title="Se déconnecter">
                <LogOut className="size-3" /> <span className="hidden sm:inline">Quitter</span>
              </button>
            </>
          ) : (
            <span className="eyebrow hidden sm:block">Paris</span>
          )}
        </div>
      </nav>

      {/* Logo façon titre de magazine */}
      <div className="text-center">
        <button
          type="button"
          onClick={onLogo}
          className="font-display relative inline-block select-none text-[clamp(3.2rem,15vw,10.5rem)] uppercase leading-[0.85] tracking-[0.02em] text-hero"
          aria-label="Wishlist"
        >
          <span key={logoBump} className={logoBump ? "jelly inline-block" : "inline-block"}>
            Wishlist
          </span>
          {hatched && <span className="pop-in absolute -right-6 -top-4 text-4xl">🐣</span>}
        </button>
      </div>
      <div className="rule-double mt-4 text-hero" />

      {/* Couverture */}
      <header className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <p className="eyebrow fade-up text-accent" style={{ "--delay": "0ms" } as React.CSSProperties}>
            À la une
          </p>
          <h1
            onClick={onTitleTap}
            onPointerMove={onTitleMove}
            className={`font-display legend-target mt-4 cursor-default select-none text-[clamp(3rem,9vw,7.5rem)] leading-[0.9] text-hero [touch-action:pan-y] ${scatter ? "scatter" : ""}`}
          >
            <SplitText text={copy.title} />
          </h1>
          <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-hero-muted" style={{ "--delay": "600ms" } as React.CSSProperties}>
            {copy.dek}
          </p>
          <p className="eyebrow fade-up mt-6 flex items-center gap-3 text-hero" style={{ "--delay": "750ms" } as React.CSSProperties}>
            <span className="h-px w-10 bg-current" /> Par {ownerName}
          </p>
        </div>

        {/* Sommaire du numéro */}
        <aside className="fade-up lg:col-span-4 lg:border-l lg:border-hero/20 lg:pl-10" style={{ "--delay": "450ms" } as React.CSSProperties}>
          <p className="eyebrow text-hero-muted">Dans ce numéro</p>
          <ol className="mt-4 divide-y divide-hero/15 border-y border-hero/15">
            {cover.length === 0 && <li className="py-4 text-sm text-hero-muted">La sélection arrive bientôt.</li>}
            {cover.map((item, i) => (
              <li key={item.id}>
                <a href={`#item-${item.id}`} className="group flex gap-4 py-4">
                  <span className="font-display tabular text-3xl leading-none text-hero-muted transition group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="eyebrow block text-hero-muted">{item.category}</span>
                    <span className="font-display mt-1 line-clamp-2 block text-lg leading-snug text-hero">{item.title}</span>
                    {formatPrice(item.price) && <span className="tabular mt-1 block text-sm text-hero-muted">{formatPrice(item.price)}</span>}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      </header>

      {/* Chiffres clés */}
      <dl className="fade-up grid grid-cols-3 border-y border-hero/20" style={{ "--delay": "850ms" } as React.CSSProperties}>
        {stats.map((s, i) => (
          <div key={s.label} className={`flex flex-col items-center gap-2 py-6 ${i > 0 ? "border-l border-hero/20" : ""}`}>
            <dd className="font-display text-4xl leading-none text-hero sm:text-6xl">
              <CountUp value={s.value} />
            </dd>
            <dt className="eyebrow text-hero-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </>
  );
}
