"use client";

import { Gift, ImageIcon, Loader2, Pencil, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { PRIORITIES, PRIORITY_LABELS, type Priority, type PublicItem } from "@/lib/types";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  item: PublicItem | null; // null = création
  categories: string[];
  onClose: () => void;
  onSaved: (item: PublicItem, created: boolean) => void;
}

interface FormState {
  title: string;
  url: string;
  imageUrl: string;
  price: string;
  category: string;
  priority: Priority;
  note: string;
}

const EMPTY: FormState = { title: "", url: "", imageUrl: "", price: "", category: "", priority: "envie", note: "" };

function fromItem(item: PublicItem | null): FormState {
  if (!item) return EMPTY;
  return {
    title: item.title,
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    price: typeof item.price === "number" ? String(item.price).replace(".", ",") : "",
    category: item.category,
    priority: item.priority,
    note: item.note ?? "",
  };
}

export function ItemFormDialog({ open, item, categories, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pending, setPending] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Réinitialise le formulaire à chaque ouverture.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(fromItem(item));
      setErr(null);
      setInfo(null);
    }
  }, [open, item]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function fetchOg() {
    if (!form.url) return;
    setFetching(true);
    setErr(null);
    setInfo(null);
    try {
      const og = await api<{ title?: string; imageUrl?: string; price?: number }>("/api/og", {
        method: "POST",
        body: { url: form.url },
      });
      setForm((f) => ({
        ...f,
        title: f.title || og.title || "",
        imageUrl: f.imageUrl || og.imageUrl || "",
        price: f.price || (og.price ? String(og.price).replace(".", ",") : ""),
      }));
      setInfo(
        og.title || og.imageUrl || og.price
          ? "Informations récupérées (les champs déjà remplis ont été conservés)."
          : "Aucune information exploitable trouvée sur cette page.",
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setFetching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    try {
      const body = { ...form, price: form.price.trim() === "" ? null : form.price };
      const res = item
        ? await api<{ item: PublicItem }>(`/api/items/${item.id}`, { method: "PATCH", body })
        : await api<{ item: PublicItem }>("/api/items", { method: "POST", body });
      onSaved(res.item, !item);
      onClose();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? "Modifier le cadeau" : "Ajouter un cadeau"}
      icon={item ? <Pencil className="size-5 text-primary" /> : <Gift className="size-5 text-primary" />}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Lien du produit</span>
          <div className="flex gap-2">
            <input
              className="field"
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://…"
            />
            <button
              type="button"
              onClick={fetchOg}
              disabled={!form.url || fetching}
              className="flex shrink-0 items-center gap-1.5 rounded-theme-sm border border-line px-3 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
              title="Remplir automatiquement le titre, l'image et le prix"
            >
              {fetching ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              <span className="hidden sm:inline">Auto-remplir</span>
            </button>
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Titre *</span>
          <input className="field" required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>

        <div className="flex gap-3">
          <div className="flex size-[4.6rem] shrink-0 items-center justify-center overflow-hidden rounded-theme-sm border border-line bg-surface-2">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une URL externe
              <img src={form.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-6 text-muted" />
            )}
          </div>
          <label className="block flex-1 space-y-1.5">
            <span className="text-sm font-medium">URL de l&apos;image</span>
            <input
              className="field"
              type="url"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…/image.jpg"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Prix (€)</span>
            <input
              className="field"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="49,90"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Catégorie</span>
            <input
              className="field"
              list="categories"
              maxLength={50}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="High-tech, Livres…"
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">Priorité</legend>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <label
                key={p}
                className={`cursor-pointer rounded-theme-sm border px-2 py-2 text-center text-sm font-medium transition ${
                  form.priority === p ? "border-primary bg-primary text-primary-ink" : "border-line hover:bg-surface-2"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={form.priority === p}
                  onChange={() => set("priority", p)}
                  className="sr-only"
                />
                {PRIORITY_LABELS[p]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Note</span>
          <textarea
            className="field min-h-20 resize-y"
            maxLength={1000}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Taille, couleur, précisions…"
          />
        </label>

        {info && <p className="rounded-theme-sm bg-success/10 px-3 py-2 text-sm text-success">{info}</p>}
        {err && <p className="rounded-theme-sm bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {item ? "Enregistrer" : "Ajouter à la liste"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
