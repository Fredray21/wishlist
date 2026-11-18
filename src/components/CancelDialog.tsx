"use client";

import { KeyRound, Loader2, Undo2 } from "lucide-react";
import { useState } from "react";
import { api, removeLocalReservation } from "@/lib/client";
import type { PublicItem } from "@/lib/types";
import { Modal } from "./Modal";

interface Props {
  item: PublicItem | null;
  onClose: () => void;
  onCancelled: (item: PublicItem) => void;
}

export function CancelDialog({ item, onClose, onCancelled }: Props) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function close() {
    setCode("");
    setErr(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || code.length !== 4) return;
    setPending(true);
    setErr(null);
    try {
      const res = await api<{ item: PublicItem }>(`/api/items/${item.id}/reservation`, {
        method: "DELETE",
        body: { code },
      });
      removeLocalReservation(item.id);
      onCancelled(res.item);
      close();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={Boolean(item)} onClose={close} title="Annuler ma réservation" icon={<KeyRound className="size-5 text-primary" />}>
      {item && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Saisissez le code à 4 chiffres reçu lors de la réservation de <strong className="text-ink">{item.title}</strong>.
          </p>
          <input
            className="field text-center font-mono text-3xl tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            aria-label="Code à 4 chiffres"
            autoFocus
          />
          {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2">
              Fermer
            </button>
            <button
              type="submit"
              disabled={pending || code.length !== 4}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
              Annuler la réservation
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
