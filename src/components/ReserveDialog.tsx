"use client";

import { Copy, Gift, KeyRound, Loader2, PartyPopper } from "lucide-react";
import { useState } from "react";
import { api, saveLocalReservation } from "@/lib/client";
import type { PublicItem } from "@/lib/types";
import { Modal } from "./Modal";
import { SpoilerNotice } from "./SpoilerNotice";

interface Props {
  item: PublicItem | null;
  ownerName: string;
  onClose: () => void;
  onReserved: (item: PublicItem) => void;
  onConflict: () => void;
}

export function ReserveDialog({ item, ownerName, onClose, onReserved, onConflict }: Props) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function close() {
    setName("");
    setNote("");
    setErr(null);
    setCode(null);
    setCopied(false);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setPending(true);
    setErr(null);
    try {
      const res = await api<{ item: PublicItem; code: string; token: string }>(`/api/items/${item.id}/reservation`, {
        method: "POST",
        body: { name, note },
      });
      saveLocalReservation(item.id, {
        token: res.token,
        code: res.code,
        title: item.title,
        createdAt: new Date().toISOString(),
      });
      setCode(res.code);
      onReserved(res.item);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur inattendue.");
      if ((error as { status?: number }).status === 409) onConflict();
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={Boolean(item)}
      onClose={close}
      title={code ? "C'est réservé !" : "Réserver ce cadeau"}
      icon={code ? <PartyPopper className="size-5 text-primary" /> : <Gift className="size-5 text-primary" />}
    >
      {item && !code && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Vous réservez <strong className="text-ink">{item.title}</strong>. Les autres verront simplement « Déjà
            réservé ».
          </p>
          <SpoilerNotice ownerName={ownerName} compact />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Votre prénom <span className="font-normal text-muted">(optionnel)</span>
            </span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="given-name"
              placeholder="Ex. Camille"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              Une note <span className="font-normal text-muted">(optionnel, jamais montrée à {ownerName})</span>
            </span>
            <textarea
              className="field min-h-20 resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="Ex. on l'offre à plusieurs avec Léa"
            />
          </label>
          {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2">
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
              Confirmer la réservation
            </button>
          </div>
        </form>
      )}

      {item && code && (
        <div className="space-y-5 text-center">
          <p className="text-sm text-muted">
            Merci ! <strong className="text-ink">{item.title}</strong> est réservé pour vous. {ownerName} n&apos;en saura rien 🤫
          </p>
          <div className="rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-5">
            <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <KeyRound className="size-3.5" /> Votre code secret d&apos;annulation
            </p>
            <p className="font-mono text-5xl font-bold tracking-[0.35em] text-primary">{code}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch {
                  /* presse-papiers indisponible */
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              <Copy className="size-3.5" /> {copied ? "Copié !" : "Copier le code"}
            </button>
          </div>
          <p className="text-xs text-muted">
            Ce code est aussi mémorisé sur cet appareil. Notez-le si vous voulez pouvoir annuler depuis un autre
            téléphone ou ordinateur.
          </p>
          <button
            type="button"
            onClick={close}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition hover:brightness-110"
          >
            J&apos;ai noté mon code
          </button>
        </div>
      )}
    </Modal>
  );
}
