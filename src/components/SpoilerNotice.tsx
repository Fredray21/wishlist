"use client";

import { EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import { useEggs } from "./fx/EasterEggs";
import { burst } from "./fx/particles";

export function SpoilerNotice({ ownerName, compact = false }: { ownerName: string; compact?: boolean }) {
  const eggs = useEggs();
  const clicks = useRef(0);
  const [promise, setPromise] = useState(false);
  const [shake, setShake] = useState(false);

  function onEmoji(e: React.MouseEvent) {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    clicks.current += 1;
    if (clicks.current >= 3) {
      clicks.current = 0;
      setPromise(true);
      eggs.found("promise");
      burst({ x: e.clientX, y: e.clientY, emojis: ["🤞", "🤐", "🔒"], count: 14, spread: 140, velocity: 7 });
    }
  }

  return (
    <aside
      role="note"
      className={`relative flex items-start gap-4 overflow-hidden rounded-theme border border-line bg-surface text-ink shadow-sm ${
        compact ? "p-3.5 text-sm" : "p-5 sm:p-6"
      }`}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
      <button
        type="button"
        onClick={onEmoji}
        onAnimationEnd={() => setShake(false)}
        className={`shrink-0 select-none leading-none transition hover:scale-110 ${compact ? "text-2xl" : "text-4xl"} ${shake ? "shake" : ""}`}
        aria-label="Chut"
      >
        🤫
      </button>
      <div className="space-y-1">
        {!compact && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Note de la rédaction</p>
        )}
        <p className={compact ? "" : "font-display text-lg leading-snug sm:text-xl"}>
          <strong>Chut !</strong> Si vous réservez un cadeau ici, {ownerName} ne le saura pas : les réservations lui sont
          totalement masquées pour garder la surprise intacte.
        </p>
        {promise && <p className="pop-in text-sm text-muted">Promis, juré, craché 🤞 Même sous la torture des chatouilles.</p>}
      </div>
    </aside>
  );
}

export function AdminNotice() {
  return (
    <aside role="note" className="relative flex items-center gap-3 overflow-hidden rounded-theme border border-line bg-surface p-4 text-sm text-ink shadow-sm">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-accent" />
      <EyeOff className="size-5 shrink-0 text-accent" />
      <p>
        <strong>Mode Admin :</strong> les réservations de vos proches sont masquées pour garder la surprise.
      </p>
    </aside>
  );
}
