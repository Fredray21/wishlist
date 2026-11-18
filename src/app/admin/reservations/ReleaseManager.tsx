"use client";

import { ArrowLeft, EyeOff, Loader2, RotateCcw, Unlock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/client";
import type { PublicItem } from "@/lib/types";

export function ReleaseManager({ items, ownerName }: { items: PublicItem[]; ownerName: string }) {
  const [target, setTarget] = useState<PublicItem | "all" | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  async function confirm() {
    if (!target) return;
    setPending(true);
    try {
      await api("/api/admin/release", { method: "POST", body: target === "all" ? { all: true } : { id: target.id } });
      if (target === "all") {
        setDone(new Set(items.map((i) => i.id)));
        setMessage("C'est fait : plus aucun cadeau n'est réservé.");
      } else {
        setDone((d) => new Set(d).add(target.id));
        setMessage(`C'est fait. Si « ${target.title} » était réservé, il est de nouveau disponible.`);
      }
      setTarget(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/" className="eyebrow inline-flex items-center gap-2 text-hero-muted hover:text-hero">
        <ArrowLeft className="size-3.5" /> Retour à la liste
      </Link>

      <header className="mt-10 border-b border-hero/20 pb-8">
        <p className="eyebrow text-hero-muted">Service client · Admin</p>
        <h1 className="font-display mt-3 text-5xl leading-none text-hero sm:text-6xl">Libérer une réservation</h1>
        <p className="mt-5 max-w-xl text-hero-muted">
          Un proche a réservé un cadeau puis vous a demandé de l&apos;annuler ? Libérez-le ici. Vous ne saurez jamais
          lequel était réservé : la réponse est la même pour tous les cadeaux.
        </p>
      </header>

      <div className="mt-6 flex items-start gap-3 border-l-2 border-accent bg-surface p-4 text-sm text-ink">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Aucune réservation n&apos;est affichée sur cette page, {ownerName}. Libérer un cadeau qui n&apos;était pas réservé ne
          change rien.
        </p>
      </div>

      {message && <p className="pop-in mt-6 bg-ink px-4 py-3 text-sm text-surface">{message}</p>}

      <ul className="mt-8 divide-y divide-hero/15 border-y border-hero/15">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <span className="font-display tabular w-8 text-2xl text-hero-muted">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-hero">{item.title}</p>
              <p className="eyebrow mt-1 text-hero-muted">{item.category}</p>
            </div>
            <button
              type="button"
              onClick={() => setTarget(item)}
              className="btn-outline shrink-0 text-hero"
            >
              {done.has(item.id) ? <RotateCcw className="size-3.5" /> : <Unlock className="size-3.5" />}
              {done.has(item.id) ? "Libéré" : "Libérer"}
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="py-10 text-center text-hero-muted">Aucun cadeau en attente.</li>}
      </ul>

      {items.length > 0 && (
        <button type="button" onClick={() => setTarget("all")} className="eyebrow mt-8 text-danger underline-offset-4 hover:underline">
          Tout libérer (remet tous les cadeaux disponibles)
        </button>
      )}

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target === "all" ? "Tout libérer ?" : "Libérer ce cadeau ?"}
        icon={<Unlock className="size-5 text-primary" />}
      >
        <p className="text-sm text-muted">
          {target === "all"
            ? "Toutes les réservations seront annulées. Vos proches devront re-réserver."
            : target && (
                <>
                  Si « <strong className="text-ink">{target.title}</strong> » est réservé, la réservation sera annulée et le
                  cadeau redeviendra disponible. Sinon, rien ne change.
                </>
              )}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setTarget(null)} className="btn-ghost">
            Annuler
          </button>
          <button type="button" onClick={confirm} disabled={pending} className="btn-primary">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Confirmer
          </button>
        </div>
      </Modal>
    </main>
  );
}
