"use client";

import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ExternalLink, Gift, GripVertical, Heart, Lightbulb, Lock, Pencil, RotateCcw, Star, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice, type LocalReservation } from "@/lib/client";
import { PRIORITY_LABELS, type Priority, type PublicItem } from "@/lib/types";
import { useEggs } from "./fx/EasterEggs";
import { useLongPress } from "./fx/gestures";
import { burst, themeColors } from "./fx/particles";

const PRIORITY_ICON: Record<Priority, React.ComponentType<{ className?: string }>> = {
  "coup-de-coeur": Heart,
  envie: Star,
  idee: Lightbulb,
};

const PRICE_JOKES = [
  "Le prix du cœur n'a pas d'étiquette 💝",
  "Promis, je ne regarde pas les prix 🙈",
  "Ça vaut mieux qu'une paire de chaussettes 🧦",
];

export interface ItemCardProps {
  item: PublicItem;
  index: number;
  isAdmin: boolean;
  mine?: LocalReservation;
  busy?: boolean;
  onReserve?: () => void;
  onCancelMine?: () => void;
  onCancelWithCode?: () => void;
  onEdit?: () => void;
  onToggleReceived?: () => void;
  onDelete?: () => void;
  /** Admin, tri par priorité : déplacer parmi les cadeaux de même priorité. */
  move?: { first: boolean; last: boolean; group: string; onUp: () => void; onDown: () => void };
  /** Admin : poignée de glisser-déposer (fournie par dnd-kit). */
  drag?: {
    attachHandle: (el: HTMLElement | null) => void;
    handleProps: React.HTMLAttributes<HTMLElement>;
    dragging: boolean;
  };
}

function DragHandle({ drag, label }: { drag: NonNullable<ItemCardProps["drag"]>; label: string }) {
  const { attachHandle, handleProps } = drag;
  return (
    <button
      type="button"
      ref={attachHandle}
      {...handleProps}
      className="flex size-8 cursor-grab touch-none items-center justify-center border border-ink bg-ink text-surface active:cursor-grabbing"
      aria-label={label}
      title="Glisser pour déplacer"
    >
      <GripVertical className="size-4" />
    </button>
  );
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  const Icon = PRIORITY_ICON[priority];
  return (
    <span
      className={`eyebrow inline-flex items-center gap-1.5 whitespace-nowrap ${priority === "coup-de-coeur" ? "text-primary" : "text-muted"}`}
      title={PRIORITY_LABELS[priority]}
    >
      <Icon className={`size-3 ${priority === "coup-de-coeur" ? "fill-current" : ""}`} />
      <span className="hidden sm:inline">{PRIORITY_LABELS[priority]}</span>
    </span>
  );
}

function ItemImage({ item }: { item: PublicItem }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // L'erreur peut survenir avant l'hydratation : on la rattrape ici.
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [item.imageUrl]);

  if (!item.imageUrl || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span aria-hidden className="font-display select-none text-[7rem] leading-none text-ink/[0.07]">
          {item.title.charAt(0)}
        </span>
        <Gift className="absolute size-9 text-muted/60" strokeWidth={1} />
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
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-contain p-4 mix-blend-multiply sm:p-8"
    />
  );
}

export function ItemCard(props: ItemCardProps) {
  const { item, index, isAdmin, mine, busy } = props;
  const { found, stage } = useEggs();
  const mediaRef = useRef<HTMLDivElement>(null);
  const priceTaps = useRef(0);
  const [jelly, setJelly] = useState(false);

  const price = formatPrice(item.price);
  const reserved = !isAdmin && item.reserved;
  const reservedByOther = reserved && !mine;
  const number = String(index + 1).padStart(2, "0");

  function onPrice(e: React.MouseEvent) {
    setJelly(false);
    requestAnimationFrame(() => setJelly(true));
    priceTaps.current += 1;
    if (priceTaps.current >= 5) {
      priceTaps.current = 0;
      found("price");
      burst({ x: e.clientX, y: e.clientY, emojis: ["💶", "🪙", "💸"], count: 24, spread: 140, velocity: 10 });
      stage("💸", PRICE_JOKES[Math.floor(Math.random() * PRICE_JOKES.length)]);
    }
  }

  // Easter egg « Déballage » : appui long sur la photo (le simple clic ouvre le lien).
  const unwrap = useLongPress(
    useCallback(
      (e: React.PointerEvent) => {
        found("unwrap");
        const el = mediaRef.current;
        el?.classList.remove("wiggle");
        void el?.offsetWidth;
        el?.classList.add("wiggle");
        burst({ x: e.clientX, y: e.clientY, emojis: ["💖", "💝", "✨"], count: 16, spread: 160, velocity: 9, gravity: 0.2 });
      },
      [found],
    ),
    700,
  );

  const mediaInner = (
    <div ref={mediaRef} className={`h-full w-full ${item.received ? "opacity-60 grayscale" : ""}`}>
      <ItemImage item={item} />
    </div>
  );

  return (
    <article
      id={`item-${item.id}`}
      className={`card group flex h-full scroll-mt-28 flex-col border bg-surface text-ink transition-[border-color,box-shadow] duration-300 ${
        props.drag?.dragging ? "border-ink shadow-2xl" : "border-line hover:border-ink/40"
      }`}
    >
      {/* Photo : format identique pour toutes les cartes */}
      <div className="card-media relative aspect-[4/5] overflow-hidden bg-surface-2" {...unwrap.handlers} onContextMenu={(e) => e.preventDefault()}>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => unwrap.fired.current && e.preventDefault()}
            className="absolute inset-0 block [-webkit-touch-callout:none]"
            aria-label={`Voir « ${item.title} » sur le site du vendeur`}
            draggable={false}
          >
            {mediaInner}
            {/* Indication au survol (ordinateur) */}
            <span className="card-quick eyebrow pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap bg-ink px-3 py-2 text-surface [@media(hover:hover)]:inline-flex">
              Voir le produit <ExternalLink className="size-3" />
            </span>
          </a>
        ) : (
          mediaInner
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 [&_button]:pointer-events-auto">
          <span className="bg-surface px-2 py-1">
            <PriorityLabel priority={item.priority} />
          </span>
          {props.move ? (
            <span className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
              {props.drag && <DragHandle drag={props.drag} label={`Glisser pour déplacer « ${item.title} » parmi les ${props.move.group}`} />}
              <button
                type="button"
                disabled={busy || props.move.first}
                onClick={props.move.onUp}
                className="flex size-8 items-center justify-center border border-line bg-surface text-ink transition hover:bg-ink hover:text-surface disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Avancer dans « ${props.move.group} »`}
                title={`Avancer dans « ${props.move.group} »`}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={busy || props.move.last}
                onClick={props.move.onDown}
                className="flex size-8 items-center justify-center border border-line bg-surface text-ink transition hover:bg-ink hover:text-surface disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Reculer dans « ${props.move.group} »`}
                title={`Reculer dans « ${props.move.group} »`}
              >
                <ChevronRight className="size-4" />
              </button>
            </span>
          ) : (
            <span className="eyebrow tabular hidden text-muted sm:inline">N°{number}</span>
          )}
        </div>

        {/* Statut en bandeau bas */}
        {item.received && (
          <div className="eyebrow pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-success py-2.5 text-white">
            <Check className="size-3.5" /> Déjà reçu
          </div>
        )}
        {reservedByOther && (
          <div className="eyebrow pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-reserved px-2 py-2.5 !tracking-[0.16em] text-white">
            <Lock className="size-3 shrink-0" />
            <span className="min-w-0 break-words text-center">
              <span className="hidden sm:inline">Réservé </span>par {item.reservedBy}
            </span>
          </div>
        )}
        {reserved && mine && (
          <div className="eyebrow pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-success px-2 py-2.5 !tracking-[0.16em] text-white">
            <Gift className="size-3 shrink-0" />
            <span className="min-w-0 break-words text-center">
              Par vous · code <span className="font-mono">{mine.code}</span>
            </span>
          </div>
        )}
      </div>

      {/* Texte */}
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <p className="eyebrow break-words text-muted">{item.category}</p>
        <h3 className="font-display mt-2 min-h-[2.5em] break-words text-base leading-[1.25] sm:text-xl" title={item.title}>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="transition-colors hover:text-primary">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        {item.note && <p className="mt-2 mb-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted">{item.note}</p>}

        {/* Prix + lien */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3 sm:pt-4">
          {price ? (
            <button
              type="button"
              onClick={onPrice}
              onAnimationEnd={() => setJelly(false)}
              className={`font-display tabular origin-left text-xl leading-none text-ink sm:text-[1.75rem] ${jelly ? "jelly" : ""}`}
              aria-label={`Prix : ${price}`}
            >
              {price}
            </button>
          ) : (
            <span className="eyebrow text-muted">Prix libre</span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="eyebrow link-underline inline-flex shrink-0 items-center gap-1 text-ink"
            >
              Voir <ArrowUpRight className="size-3.5" />
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 sm:mt-4">
          {isAdmin ? (
            <div className="flex gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  if (!item.received) burst({ x: e.clientX, y: e.clientY, count: 40, spread: 120, velocity: 10, colors: themeColors() });
                  props.onToggleReceived?.();
                }}
                className={`${item.received ? "btn-outline" : "btn-primary"} flex-1 whitespace-nowrap`}
              >
                {item.received ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
                {item.received ? "Pas reçu" : "Reçu"}
              </button>
              <button type="button" onClick={props.onEdit} className="btn-outline !px-2.5 sm:!px-3" aria-label={`Modifier ${item.title}`} title="Modifier">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" disabled={busy} onClick={props.onDelete} className="btn-outline !px-2.5 hover:!border-danger hover:!bg-danger sm:!px-3" aria-label={`Supprimer ${item.title}`} title="Supprimer">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ) : item.received ? (
            <p className="eyebrow flex h-11 items-center justify-center text-muted">Merci à vous ♥</p>
          ) : reserved && mine ? (
            <button type="button" disabled={busy} onClick={props.onCancelMine} className="btn-outline w-full">
              <Undo2 className="size-3.5" /> Annuler<span className="hidden sm:inline"> ma réservation</span>
            </button>
          ) : reservedByOther ? (
            <button type="button" onClick={props.onCancelWithCode} className="btn-outline w-full text-muted" title="Vous avez réservé ce cadeau ? Annulez avec votre code">
              <Lock className="size-3.5" /> C&apos;est vous ?
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                burst({ x: e.clientX, y: e.clientY, count: 24, spread: 100, velocity: 8, colors: themeColors(), size: 7 });
                props.onReserve?.();
              }}
              className="btn-primary w-full"
            >
              <Gift className="size-3.5" /> Réserver<span className="hidden sm:inline"> ce cadeau</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
