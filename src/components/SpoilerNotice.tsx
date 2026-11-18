"use client";

import { ArrowRight, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useEggs } from "./fx/EasterEggs";
import { burst } from "./fx/particles";

export function SpoilerNotice({ ownerName, compact = false }: { ownerName: string; compact?: boolean }) {
  const eggs = useEggs();
  const taps = useRef(0);
  const [promise, setPromise] = useState(false);
  const [shake, setShake] = useState(false);

  function onEmoji(e: React.MouseEvent) {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    taps.current += 1;
    if (taps.current >= 3) {
      taps.current = 0;
      setPromise(true);
      eggs.found("promise");
      burst({ x: e.clientX, y: e.clientY, emojis: ["🤞", "🤐", "🔒"], count: 14, spread: 140, velocity: 7 });
    }
  }

  const emoji = (
    <button
      type="button"
      onClick={onEmoji}
      onAnimationEnd={() => setShake(false)}
      className={`inline-block select-none leading-none ${shake ? "shake" : ""}`}
      aria-label="Chut"
    >
      🤫
    </button>
  );

  if (compact) {
    return (
      <div role="note" className="flex items-start gap-3 border-l-2 border-accent bg-surface-2 p-3.5 text-sm text-ink">
        <span className="text-xl">{emoji}</span>
        <p>
          <strong>Chut !</strong> Si vous réservez un cadeau ici, {ownerName} ne le saura pas : les réservations lui sont
          totalement masquées pour garder la surprise intacte.
        </p>
      </div>
    );
  }

  return (
    <aside role="note" className="grid gap-6 border-y border-hero/20 py-10 text-hero md:grid-cols-12 md:gap-10">
      <div className="md:col-span-3">
        <p className="eyebrow text-hero-muted">Le mot de la rédaction</p>
        <p className="mt-3 text-5xl">{emoji}</p>
      </div>
      <div className="md:col-span-9">
        <p className="dropcap font-display text-2xl leading-snug sm:text-[1.9rem]">
          Chut ! Si vous réservez un cadeau ici, {ownerName} ne le saura pas : les réservations lui sont totalement
          masquées pour garder la surprise intacte.
        </p>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-hero-muted">
          Les autres visiteurs voient votre prénom sur le cadeau réservé, pour éviter les doublons. Un code à 4 chiffres
          vous permet d&apos;annuler à tout moment.
        </p>
        {promise && <p className="pop-in mt-3 text-sm text-hero-muted">Promis, juré, craché 🤞 Même sous la torture des chatouilles.</p>}
        <p className="eyebrow mt-6 text-hero-muted">— La rédaction</p>
      </div>
    </aside>
  );
}

export function AdminNotice() {
  return (
    <aside role="note" className="flex flex-col gap-4 border-y border-hero/20 py-5 text-sm text-hero sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-3">
        <EyeOff className="size-4 shrink-0 text-accent" />
        <span>
          <strong>Mode Admin :</strong> les réservations de vos proches sont masquées pour garder la surprise.
        </span>
      </p>
      <Link href="/admin/reservations" className="btn-outline shrink-0 self-start text-hero sm:self-auto">
        Libérer une réservation <ArrowRight className="size-3.5" />
      </Link>
    </aside>
  );
}
