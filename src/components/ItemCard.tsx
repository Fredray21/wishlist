"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Gift,
  Heart,
  Lightbulb,
  Lock,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatPrice, type LocalReservation } from "@/lib/client";
import { PRIORITY_LABELS, type Priority, type PublicItem } from "@/lib/types";
import { useEggs } from "./fx/EasterEggs";
import { burst, themeColors } from "./fx/particles";

const PRIORITY_STYLE: Record<Priority, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  "coup-de-coeur": { icon: Heart, className: "bg-primary text-primary-ink" },
  envie: { icon: Star, className: "bg-accent text-accent-ink" },
  idee: { icon: Lightbulb, className: "bg-surface text-ink" },
};

const PRICE_JOKES = [
  "Le prix du cœur n'a pas d'étiquette 💝",
  "Promis, je ne regarde pas les prix 🙈",
  "Ça vaut mieux qu'une paire de chaussettes 🧦",
];

export interface ItemCardProps {
  item: PublicItem;
  index: number;
  featured?: boolean;
  isAdmin: boolean;
  mine?: LocalReservation;
  busy?: boolean;
  onReserve?: () => void;
  onCancelMine?: () => void;
  onCancelWithCode?: () => void;
  onEdit?: () => void;
  onToggleReceived?: () => void;
  onDelete?: () => void;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { icon: Icon, className } = PRIORITY_STYLE[priority];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm ${className}`}>
      <Icon className={`size-3.5 ${priority === "coup-de-coeur" ? "animate-pulse" : ""}`} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function ItemImage({ item, featured }: { item: PublicItem; featured?: boolean }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // L'erreur peut survenir avant l'hydratation : on la rattrape ici.
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [item.imageUrl]);
  if (!item.imageUrl || failed) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-surface-2">
        <span
          aria-hidden
          className={`font-display pointer-events-none absolute select-none leading-none text-ink/[0.06] ${featured ? "text-[16rem]" : "text-[10rem]"}`}
        >
          {item.title.charAt(0)}
        </span>
        <Gift className="relative size-12 text-muted/60 transition duration-500 group-hover:-rotate-12 group-hover:scale-110" strokeWidth={1.1} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- images externes arbitraires
    <img
      ref={img}
      src={item.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
    />
  );
}

export function ItemCard(props: ItemCardProps) {
  const { item, index, featured, isAdmin, mine, busy } = props;
  const { found, stage } = useEggs();
  const ref = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const priceClicks = useRef(0);
  const [jelly, setJelly] = useState(false);

  const price = formatPrice(item.price);
  const reserved = !isAdmin && item.reserved;
  const reservedByOther = reserved && !mine;
  const number = String(index + 1).padStart(2, "0");

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ref.current.style.setProperty("--ry", `${(px - 0.5) * 7}deg`);
    ref.current.style.setProperty("--rx", `${(0.5 - py) * 7}deg`);
    ref.current.style.setProperty("--gx", `${px * 100}%`);
    ref.current.style.setProperty("--gy", `${py * 100}%`);
  }

  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }

  function onPriceClick(e: React.MouseEvent) {
    setJelly(false);
    requestAnimationFrame(() => setJelly(true));
    priceClicks.current += 1;
    if (priceClicks.current === 5) {
      priceClicks.current = 0;
      found("price");
      burst({ x: e.clientX, y: e.clientY, emojis: ["💶", "🪙", "💸"], count: 26, spread: 140, velocity: 10 });
      stage("💸", PRICE_JOKES[Math.floor(Math.random() * PRICE_JOKES.length)]);
    }
  }

  function onUnwrap(e: React.MouseEvent) {
    found("unwrap");
    imgRef.current?.classList.remove("wiggle");
    void imgRef.current?.offsetWidth;
    imgRef.current?.classList.add("wiggle");
    burst({ x: e.clientX, y: e.clientY, emojis: ["💖", "💝", "✨"], count: 18, spread: 160, velocity: 9, gravity: 0.2 });
  }

  function reserve(e: React.MouseEvent) {
    burst({ x: e.clientX, y: e.clientY, count: 30, spread: 100, velocity: 9, colors: themeColors(), size: 7 });
    props.onReserve?.();
  }

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt group relative flex h-full flex-col overflow-hidden rounded-theme border border-line bg-surface text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-2xl"
    >
      <div
        ref={imgRef}
        onDoubleClick={onUnwrap}
        className={`relative overflow-hidden ${featured ? "aspect-[4/3] lg:aspect-auto lg:flex-1" : "aspect-[4/5]"} ${
          item.received ? "grayscale-[70%]" : ""
        }`}
      >
        <ItemImage item={item} featured={featured} />
        <div className="glare pointer-events-none absolute inset-0" />

        {/* Numéro façon lookbook */}
        <span
          aria-hidden
          className={`font-display pointer-events-none absolute bottom-2 right-3 leading-none text-white mix-blend-difference ${
            featured ? "text-8xl" : "text-6xl"
          } opacity-80 transition duration-500 group-hover:-translate-y-1`}
        >
          {number}
        </span>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <PriorityBadge priority={item.priority} />
          {price && (
            <button
              type="button"
              onClick={onPriceClick}
              onAnimationEnd={() => setJelly(false)}
              className={`tabular rounded-full bg-surface/95 px-3 py-1 text-sm font-bold text-ink shadow-sm backdrop-blur transition hover:scale-105 ${jelly ? "jelly" : ""}`}
              aria-label={`Prix : ${price}`}
            >
              {price}
            </button>
          )}
        </div>

        {item.received && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/30">
            <span className="flex -rotate-6 items-center gap-1.5 border-2 border-success bg-surface/90 px-4 py-1.5 text-sm font-black uppercase tracking-[0.25em] text-success shadow-lg">
              <CheckCircle2 className="size-4" /> Reçu
            </span>
          </div>
        )}
        {reservedByOther && (
          <div className="absolute bottom-3 left-3">
            <span className="flex items-center gap-1.5 rounded-full bg-reserved px-3 py-1 text-xs font-semibold text-white shadow">
              <Lock className="size-3.5" /> Déjà réservé
            </span>
          </div>
        )}
        {reserved && mine && (
          <div className="absolute bottom-3 left-3">
            <span className="flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white shadow">
              <Gift className="size-3.5" /> Réservé par vous
            </span>
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-3 ${featured ? "p-6 sm:p-7" : "p-5"}`}>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
          <span className="tabular">N° {number}</span>
          <span className="h-px flex-1 bg-line" />
          <span>{item.category}</span>
        </div>

        <h3 className={`font-display leading-[1.05] ${featured ? "text-3xl sm:text-4xl" : "text-xl"}`}>{item.title}</h3>
        {item.note && (
          <p className={`whitespace-pre-line text-muted ${featured ? "text-base" : "text-sm"} ${item.received ? "line-through decoration-1" : ""}`}>
            {item.note}
          </p>
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group/link inline-flex w-fit items-center gap-1 text-sm font-semibold text-ink"
          >
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-300 group-hover/link:bg-[length:100%_1px]">
              Voir le produit
            </span>
            <ArrowUpRight className="size-4 transition group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </a>
        )}

        <div className="mt-auto pt-1">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  if (!item.received) burst({ x: e.clientX, y: e.clientY, count: 50, spread: 120, velocity: 11, colors: themeColors() });
                  props.onToggleReceived?.();
                }}
                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-theme-sm px-3 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${
                  item.received ? "border border-line bg-surface-2 text-ink hover:bg-line" : "bg-success text-white hover:brightness-110"
                }`}
              >
                {item.received ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                {item.received ? "Pas encore reçu" : "Marquer reçu"}
              </button>
              <button
                type="button"
                onClick={props.onEdit}
                className="rounded-theme-sm border border-line p-2.5 text-muted transition hover:rotate-6 hover:bg-surface-2 hover:text-ink"
                aria-label={`Modifier ${item.title}`}
                title="Modifier"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={props.onDelete}
                className="rounded-theme-sm border border-line p-2.5 text-muted transition hover:-rotate-6 hover:border-danger hover:bg-danger hover:text-white disabled:opacity-50"
                aria-label={`Supprimer ${item.title}`}
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : item.received ? null : reserved && mine ? (
            <div className="space-y-2">
              <p className="rounded-theme-sm bg-surface-2 px-3 py-2 text-center text-xs text-muted">
                Votre code d&apos;annulation :{" "}
                <strong className="font-mono text-sm tracking-[0.3em] text-ink">{mine.code}</strong>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={props.onCancelMine}
                className="flex w-full items-center justify-center gap-2 rounded-theme-sm border border-line px-3 py-2.5 text-sm font-semibold transition hover:bg-surface-2 active:scale-[0.98] disabled:opacity-50"
              >
                <Undo2 className="size-4" /> Annuler ma réservation
              </button>
            </div>
          ) : reservedByOther ? (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-theme-sm bg-surface-2 px-3 py-2.5 text-sm font-semibold text-muted"
              >
                <Lock className="size-4" /> Déjà réservé
              </button>
              <button
                type="button"
                onClick={props.onCancelWithCode}
                className="w-full text-center text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                C&apos;est vous ? Annuler ma réservation
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={reserve}
              className="btn-fill group/btn flex w-full items-center justify-center gap-2 rounded-theme-sm bg-primary px-3 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-ink shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              <Gift className="size-4 transition group-hover/btn:-rotate-12 group-hover/btn:scale-125" /> Réserver ce cadeau
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
