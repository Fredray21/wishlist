"use client";

import { Gift, LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { useEggs } from "./fx/EasterEggs";
import { burst } from "./fx/particles";
import { CountUp, SplitText } from "./fx/Reveal";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface Props {
  ownerName: string;
  birthdayMonth: number | null;
  isAdmin: boolean;
  onLogout: () => void;
  stats: { label: string; value: number }[];
}

const MARQUEE = [
  "Réservations 100 % secrètes",
  "Coup de cœur",
  "Livraison de bonheur offerte",
  "Emballage facultatif",
  "Envie",
  "Pas de chaussettes (sauf jolies)",
  "Idée",
  "Fait avec amour",
  "Surprise garantie",
];

function Title({ kicker, top, main, bottom }: { kicker: string; top: string; main: string; bottom: string }) {
  const topLen = top.replace(/ /g, "").length;
  return (
    <>
      <span className="fade-up mb-4 block text-[11px] font-semibold uppercase tracking-[0.35em] text-hero-muted sm:mb-6 sm:text-xs" style={{ "--delay": "0ms" } as React.CSSProperties}>
        {kicker}
      </span>
      <span className="block text-left text-[clamp(1.6rem,4.5vw,3.5rem)] italic leading-none text-hero-muted">
        <SplitText text={top} />
      </span>
      <span className="legend-target block text-[clamp(4.8rem,19vw,15rem)] leading-[0.82]">
        <SplitText text={main} offset={topLen} />
      </span>
      <span className="block text-right text-[clamp(1.6rem,4.5vw,3.5rem)] italic leading-none">
        <SplitText text={bottom} offset={topLen + main.length} />
      </span>
    </>
  );
}

export function Masthead({ ownerName, birthdayMonth, isAdmin, onLogout, stats }: Props) {
  const eggs = useEggs();
  const logoClicks = useRef(0);
  const [logoSpin, setLogoSpin] = useState(0);
  const [hatched, setHatched] = useState(false);
  const [scatter, setScatter] = useState(false);
  const [reverse, setReverse] = useState(false);

  const now = new Date();
  const edition = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now);
  const issue = String(now.getMonth() + 1).padStart(2, "0");

  function onLogo(e: React.MouseEvent) {
    logoClicks.current += 1;
    setLogoSpin((n) => n + 1);
    if (logoClicks.current >= 7) {
      logoClicks.current = 0;
      setHatched(true);
      eggs.found("logo");
      burst({ x: e.clientX, y: e.clientY, emojis: ["🥚", "🐣", "🐥"], count: 20, spread: 120, velocity: 9, angle: 60 });
      window.setTimeout(() => setHatched(false), 5000);
    }
  }

  function onTitle() {
    setScatter(true);
    eggs.found("scatter");
    window.setTimeout(() => setScatter(false), 1100);
  }

  return (
    <>
      {/* Barre supérieure */}
      <div className="flex items-center justify-between gap-3 border-b border-hero/15 py-4 text-hero-muted">
        <button type="button" onClick={onLogo} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.35em]" aria-label="Wishlist">
          <span key={logoSpin} className={logoSpin ? "spin-once inline-flex" : "inline-flex"}>
            {hatched ? <span className="text-lg leading-none">🐣</span> : <Gift className="size-4" />}
          </span>
          Wishlist
        </button>
        <span className="hidden text-[11px] font-semibold uppercase tracking-[0.3em] md:block" suppressHydrationWarning>
          N° {issue} — {edition}
        </span>
        <div className="flex items-center gap-2">
          <ThemeSwitcher birthdayMonth={birthdayMonth} />
          {isAdmin && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-full border border-hero/15 bg-hero/5 px-3 py-1.5 text-xs font-medium text-hero-muted transition hover:bg-hero/10 hover:text-hero"
              title="Se déconnecter"
            >
              <LogOut className="size-3.5" /> <span className="hidden sm:inline">Quitter l&apos;admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Couverture */}
      <header className="pb-10 pt-10 sm:pb-14 sm:pt-16">
        <h1
          onDoubleClick={onTitle}
          className={`font-display mx-auto max-w-5xl select-none text-center text-hero ${scatter ? "scatter" : ""}`}
          title=""
        >
          <span className="theme-only" data-for="noel">
            <Title kicker={`Édition d'hiver · ${edition}`} top="La liste de" main="Noël" bottom={`de ${ownerName}`} />
          </span>
          <span className="theme-only" data-for="anniversaire">
            <Title kicker="Numéro spécial anniversaire" top="La liste d'" main="Anniv'" bottom={`de ${ownerName}`} />
          </span>
          <span className="theme-only" data-for="minimaliste">
            <Title kicker="Collection permanente" top="La" main="Wishlist" bottom={`de ${ownerName}`} />
          </span>
        </h1>

        <p className="fade-up mx-auto mt-8 max-w-xl text-center text-base text-hero-muted sm:text-lg" style={{ "--delay": "700ms" } as React.CSSProperties}>
          <span className="theme-only" data-for="noel">
            Quelques idées à glisser sous le sapin. Les lutins sont tenus au secret. ✨
          </span>
          <span className="theme-only" data-for="anniversaire">
            Une bougie de plus, quelques envies en plus. On souffle ? 🎈
          </span>
          <span className="theme-only" data-for="minimaliste">
            Une sélection d&apos;objets désirés, choisis avec soin. Si l&apos;envie vous prend.
          </span>
        </p>

        {/* Chiffres clés */}
        <dl className="fade-up mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-hero/15 border-y border-hero/15" style={{ "--delay": "850ms" } as React.CSSProperties}>
          {stats.map((s) => (
            <div key={s.label} className="px-2 py-4 text-center">
              <dd className="font-display text-4xl leading-none text-hero sm:text-5xl">
                <CountUp value={s.value} />
              </dd>
              <dt className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-hero-muted sm:text-[11px]">{s.label}</dt>
            </div>
          ))}
        </dl>
      </header>

      {/* Bandeau défilant */}
      <button
        type="button"
        onClick={() => {
          setReverse((r) => !r);
          eggs.found("marquee");
        }}
        className="marquee-wrap relative -mx-4 mb-10 block w-[calc(100%+2rem)] -rotate-1 cursor-pointer overflow-hidden bg-primary py-3 text-primary-ink shadow-lg sm:-mx-6 sm:w-[calc(100%+3rem)]"
        aria-label="Bandeau"
      >
        <div className="marquee" style={{ animationDirection: reverse ? "reverse" : "normal" }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {MARQUEE.map((m) => (
                <span key={m} className="font-display flex items-center whitespace-nowrap px-5 text-lg italic sm:text-xl">
                  {m}
                  <span className="pl-10 text-pop not-italic">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </button>
    </>
  );
}
