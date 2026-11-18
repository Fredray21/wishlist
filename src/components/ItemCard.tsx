"use client";

import {
  CheckCircle2,
  ExternalLink,
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
import { useState } from "react";
import { formatPrice, type LocalReservation } from "@/lib/client";
import { PRIORITY_LABELS, type Priority, type PublicItem } from "@/lib/types";

const PRIORITY_STYLE: Record<Priority, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  "coup-de-coeur": { icon: Heart, className: "bg-primary text-primary-ink" },
  envie: { icon: Star, className: "bg-accent text-accent-ink" },
  idee: { icon: Lightbulb, className: "bg-surface text-ink border border-line" },
};

export interface ItemCardProps {
  item: PublicItem;
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${className}`}>
      <Icon className="size-3.5" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function ItemImage({ item }: { item: PublicItem }) {
  const [failed, setFailed] = useState(false);
  if (!item.imageUrl || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-2 to-surface">
        <Gift className="size-12 text-muted/50" strokeWidth={1.25} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- images externes arbitraires
    <img
      src={item.imageUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}

export function ItemCard(props: ItemCardProps) {
  const { item, isAdmin, mine, busy } = props;
  const price = formatPrice(item.price);
  const reserved = !isAdmin && item.reserved;
  const reservedByOther = reserved && !mine;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`relative aspect-[4/3] overflow-hidden bg-surface-2 ${item.received ? "grayscale-[60%]" : ""}`}>
        <ItemImage item={item} />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <PriorityBadge priority={item.priority} />
          {price && (
            <span className="rounded-full bg-surface/95 px-2.5 py-1 text-sm font-bold text-ink shadow-sm backdrop-blur">
              {price}
            </span>
          )}
        </div>
        {item.received && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/40">
            <span className="flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-sm font-semibold text-white shadow">
              <CheckCircle2 className="size-4" /> Déjà reçu
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

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">{item.category}</p>
          <h3 className="font-display text-lg leading-snug">{item.title}</h3>
          {item.note && <p className="mt-1.5 whitespace-pre-line text-sm text-muted">{item.note}</p>}
        </div>

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voir le produit <ExternalLink className="size-3.5" />
          </a>
        )}

        <div className="mt-auto pt-2">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={props.onToggleReceived}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                  item.received
                    ? "border border-line bg-surface-2 text-ink hover:bg-line"
                    : "bg-success text-white hover:brightness-110"
                }`}
              >
                {item.received ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                {item.received ? "Pas encore reçu" : "Marquer reçu"}
              </button>
              <button
                type="button"
                onClick={props.onEdit}
                className="rounded-xl border border-line p-2.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                aria-label={`Modifier ${item.title}`}
                title="Modifier"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={props.onDelete}
                className="rounded-xl border border-line p-2.5 text-muted transition hover:border-danger hover:bg-danger hover:text-white disabled:opacity-50"
                aria-label={`Supprimer ${item.title}`}
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : item.received ? null : reserved && mine ? (
            <div className="space-y-2">
              <p className="rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-muted">
                Votre code d&apos;annulation : <strong className="font-mono text-sm tracking-[0.3em] text-ink">{mine.code}</strong>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={props.onCancelMine}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-50"
              >
                <Undo2 className="size-4" /> Annuler ma réservation
              </button>
            </div>
          ) : reservedByOther ? (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm font-semibold text-muted"
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
              onClick={props.onReserve}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110 disabled:opacity-50"
            >
              <Gift className="size-4" /> Réserver ce cadeau
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
