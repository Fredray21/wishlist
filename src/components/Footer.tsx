"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { EGGS, useEggs } from "./fx/EasterEggs";
import { burst, themeColors } from "./fx/particles";
import { Modal } from "./Modal";

export function Footer({ isAdmin, ownerName }: { isAdmin: boolean; ownerName: string }) {
  const eggs = useEggs();
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const hover = useRef(0);
  const count = eggs.discovered.length;

  return (
    <footer className="relative mt-10 border-t border-hero/15 pb-8 pt-12 text-hero-muted">
      <button
        type="button"
        onClick={(e) => burst({ x: e.clientX, y: e.clientY, spread: 360, velocity: 10, count: 50, colors: themeColors() })}
        className="font-display group block w-full select-none text-left leading-[0.8] text-hero"
        aria-label="Merci"
      >
        <span className="outline-text-hero block text-[clamp(5rem,24vw,19rem)] transition-colors duration-700 group-hover:text-hero">
          Merci.
        </span>
      </button>

      <div className="mt-8 flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} · Fait avec <span className="inline-block animate-pulse">❤️</span> pour les gens que {ownerName} aime.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-hero/15 px-3 py-1.5 transition hover:border-hero/40 hover:text-hero"
            title="Carnet secret"
          >
            <span className={count ? "" : "grayscale"}>🥚</span>
            <span className="tabular">{count ? `${count}/${EGGS.length} secrets` : "???"}</span>
          </button>

          {isAdmin ? (
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" /> Admin
            </span>
          ) : (
            <span className="relative">
              <Link
                href="/admin"
                onMouseEnter={() => {
                  hover.current = window.setTimeout(() => {
                    setPeek(true);
                    eggs.found("lock");
                  }, 2000);
                }}
                onMouseLeave={() => {
                  window.clearTimeout(hover.current);
                  setPeek(false);
                }}
                className={`block rounded-full p-1.5 opacity-40 transition hover:opacity-100 ${peek ? "shake" : ""}`}
                aria-label="Espace admin"
              >
                <Lock className="size-3.5" />
              </Link>
              {peek && (
                <span className="pop-in absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs text-surface shadow-xl">
                  Rien à voir ici… 👀
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {eggs.has("bottom") && (
        <p className="pop-in mt-6 text-center text-xs">🕵️ Tu as tout lu jusqu&apos;au bout. Détective confirmé·e.</p>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Carnet secret" icon={<span>🥚</span>}>
        <p className="mb-4 text-sm text-muted">
          {count === 0
            ? "Ce site cache des secrets. Saurez-vous tous les trouver ?"
            : `${count} secret${count > 1 ? "s" : ""} sur ${EGGS.length} trouvé${count > 1 ? "s" : ""}. Continuez à fouiller…`}
        </p>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(count / EGGS.length) * 100}%` }} />
        </div>
        <ul className="grid max-h-[55dvh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {EGGS.map((egg) => {
            const ok = eggs.has(egg.id);
            return (
              <li
                key={egg.id}
                className={`flex items-start gap-2.5 rounded-theme-sm border p-2.5 text-sm ${ok ? "border-primary/40 bg-primary/5" : "border-line"}`}
              >
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
