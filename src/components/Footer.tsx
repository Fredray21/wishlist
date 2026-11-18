"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { EGGS, useEggs } from "./fx/EasterEggs";
import { useLongPress } from "./fx/gestures";
import { burst, rain, themeColors } from "./fx/particles";
import { Modal } from "./Modal";

export function Footer({ isAdmin, ownerName }: { isAdmin: boolean; ownerName: string }) {
  const eggs = useEggs();
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [word, setWord] = useState("");
  const [wordMiss, setWordMiss] = useState(false);
  const hover = useRef(0);
  const count = eggs.discovered.length;

  const showPeek = useCallback(() => {
    setPeek(true);
    eggs.found("lock");
    window.setTimeout(() => setPeek(false), 2500);
  }, [eggs]);
  const lockPress = useLongPress(showPeek, 800);

  const globe = useLongPress(
    useCallback(() => {
      eggs.found("shake");
      rain({ snow: true, duration: 5000, density: 7 });
      eggs.stage("🔮", "Boule à neige !");
    }, [eggs]),
    1000,
  );

  function submitWord(e: React.FormEvent) {
    e.preventDefault();
    const w = word;
    setOpen(false);
    setWord("");
    // On ferme le carnet d'abord pour que l'effet soit visible.
    window.setTimeout(() => {
      if (!eggs.say(w)) {
        setWordMiss(true);
        eggs.stage("🤔", "Ce mot-là ne fait rien… essaie encore.");
        window.setTimeout(() => setWordMiss(false), 2000);
      }
    }, 350);
  }

  return (
    <footer className="relative mt-16 text-hero">
      <div className="rule-double text-hero" />

      <div className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <p className="eyebrow text-hero-muted">La maison</p>
          <p className="font-display mt-4 text-2xl leading-snug">Une wishlist tenue avec soin par {ownerName}.</p>
        </div>
        <div>
          <p className="eyebrow text-hero-muted">Service</p>
          <ul className="mt-4 space-y-2.5 text-sm text-hero-muted">
            <li>Réservation en toute discrétion</li>
            <li>Annulation avec votre code à 4 chiffres</li>
            <li>Votre prénom visible des autres, jamais de {ownerName}</li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-hero-muted">Secrets</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-4 flex items-center gap-2 text-sm text-hero-muted transition hover:text-hero" title="Carnet secret">
            <span className={count ? "" : "grayscale"}>🥚</span>
            <span className="link-underline">{count ? `Carnet secret · ${count}/${EGGS.length}` : "Ce site cache des secrets…"}</span>
          </button>
          {wordMiss && <p className="pop-in mt-2 text-xs text-hero-muted">Raté 🤭</p>}
        </div>
      </div>

      <button
        type="button"
        {...globe.handlers}
        onClick={(e) => {
          if (globe.fired.current) return;
          burst({ x: e.clientX, y: e.clientY, spread: 360, velocity: 9, count: 40, colors: themeColors() });
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="font-display group block w-full select-none text-center leading-[0.8] [-webkit-touch-callout:none]"
        aria-label="Merci"
      >
        <span className="outline-text-hero block text-[clamp(5rem,25vw,20rem)] transition-colors duration-700 group-hover:text-hero">
          Merci.
        </span>
      </button>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-hero/20 py-6 text-hero-muted">
        <p className="eyebrow !tracking-[0.2em]">© {new Date().getFullYear()} Wishlist · Tous droits de surprise réservés</p>
        {isAdmin ? (
          <span className="eyebrow flex items-center gap-1.5">
            <Lock className="size-3" /> Admin
          </span>
        ) : (
          <span className="relative">
            <Link
              href="/admin"
              {...lockPress.handlers}
              onClick={(e) => lockPress.fired.current && e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onMouseEnter={() => (hover.current = window.setTimeout(showPeek, 2000))}
              onMouseLeave={() => window.clearTimeout(hover.current)}
              className={`block p-1.5 opacity-40 transition hover:opacity-100 [-webkit-touch-callout:none] ${peek ? "shake" : ""}`}
              aria-label="Espace admin"
            >
              <Lock className="size-3.5" />
            </Link>
            {peek && (
              <span className="pop-in absolute bottom-full right-0 mb-2 whitespace-nowrap bg-ink px-3 py-1.5 text-xs text-surface">
                Rien à voir ici… 👀
              </span>
            )}
          </span>
        )}
      </div>

      {eggs.has("bottom") && <p className="pop-in pb-6 text-center text-xs text-hero-muted">🕵️ Vous avez tout lu jusqu&apos;au bout. Détective confirmé·e.</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="Carnet secret" icon={<span>🥚</span>}>
        <form onSubmit={submitWord} className="mb-5 flex items-end gap-3">
          <label className="flex-1">
            <span className="eyebrow text-muted">Murmurer un mot magique</span>
            <input
              className="field"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="…"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <button type="submit" disabled={!word.trim()} className="btn-primary !px-4" aria-label="Essayer">
            <Sparkles className="size-4" />
          </button>
        </form>

        <p className="text-sm text-muted">
          {count === 0
            ? "Ce site cache des secrets, tous faisables sur ordinateur comme sur téléphone."
            : `${count} secret${count > 1 ? "s" : ""} sur ${EGGS.length} trouvé${count > 1 ? "s" : ""}. Continuez à fouiller…`}
        </p>
        <div className="mb-4 mt-3 h-px bg-line">
          <div className="h-px bg-primary transition-[width] duration-700" style={{ width: `${(count / EGGS.length) * 100}%` }} />
        </div>
        <ul className="grid max-h-[45dvh] grid-cols-1 gap-px overflow-y-auto overscroll-contain bg-line sm:grid-cols-2">
          {EGGS.map((egg) => {
            const ok = eggs.has(egg.id);
            return (
              <li key={egg.id} className={`flex items-start gap-2.5 p-3 text-sm ${ok ? "bg-surface-2" : "bg-surface"}`}>
                <span className={`text-xl leading-none ${ok ? "" : "opacity-40 grayscale"}`}>{ok ? egg.emoji : "🔒"}</span>
                <span>
                  <strong className="block leading-tight">{ok ? egg.label : "???"}</strong>
                  <span className="text-xs text-muted">{egg.hint}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Modal>
    </footer>
  );
}
