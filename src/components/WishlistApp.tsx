"use client";

import { CheckCircle2, Gift, Loader2, Lock, LogOut, Plus, SearchX, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, readLocalReservations, removeLocalReservation, type LocalReservation } from "@/lib/client";
import { PRIORITIES, type ItemsResponse, type PublicItem } from "@/lib/types";
import { CancelDialog } from "./CancelDialog";
import { Filters, PRICE_RANGES, type FiltersState } from "./Filters";
import { ItemCard } from "./ItemCard";
import { ItemFormDialog } from "./ItemFormDialog";
import { Modal } from "./Modal";
import { ReserveDialog } from "./ReserveDialog";
import { AdminNotice, SpoilerNotice } from "./SpoilerNotice";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface Props {
  initialItems: PublicItem[];
  isAdmin: boolean;
  ownerName: string;
  birthdayMonth: number | null;
}

const DEFAULT_FILTERS: FiltersState = { availability: "available", category: "all", price: "all", sort: "priority" };

export function WishlistApp({ initialItems, isAdmin, ownerName, birthdayMonth }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [mine, setMine] = useState<Record<string, LocalReservation>>({});
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [reserving, setReserving] = useState<PublicItem | null>(null);
  const [cancelling, setCancelling] = useState<PublicItem | null>(null);
  const [editing, setEditing] = useState<PublicItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PublicItem | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((t) => (t === message ? null : t)), 3500);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api<ItemsResponse>("/api/items");
      setItems(data.items);
    } catch {
      /* hors ligne : on garde l'état courant */
    }
  }, []);

  // Rafraîchit quand l'onglet redevient visible (réservations faites par d'autres).
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  // Réservations locales du visiteur ; on oublie celles qui n'existent plus côté serveur.
  useEffect(() => {
    if (isAdmin) return;
    const local = readLocalReservations();
    for (const id of Object.keys(local)) {
      const item = items.find((i) => i.id === id);
      if (!item || !item.reserved) {
        removeLocalReservation(id);
        delete local[id];
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(local);
  }, [items, isAdmin]);

  const replaceItem = useCallback((next: PublicItem) => {
    setItems((list) => list.map((i) => (i.id === next.id ? next : i)));
  }, []);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b, "fr")),
    [items],
  );

  const { active, received } = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === filters.price) ?? PRICE_RANGES[0];
    const matches = (i: PublicItem) =>
      (filters.category === "all" || i.category === filters.category) &&
      (filters.price === "all" || (typeof i.price === "number" && i.price >= range.min && i.price < range.max));

    const sorted = (list: PublicItem[]) =>
      [...list].sort((a, b) => {
        switch (filters.sort) {
          case "price-asc":
            return (a.price ?? Infinity) - (b.price ?? Infinity);
          case "price-desc":
            return (b.price ?? -Infinity) - (a.price ?? -Infinity);
          case "recent":
            return b.createdAt.localeCompare(a.createdAt);
          default:
            return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || b.createdAt.localeCompare(a.createdAt);
        }
      });

    return {
      active: sorted(
        items.filter(
          (i) => !i.received && matches(i) && (isAdmin || filters.availability === "all" || !i.reserved || mine[i.id]),
        ),
      ),
      received: sorted(items.filter((i) => i.received && matches(i))).sort((a, b) =>
        (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""),
      ),
    };
  }, [items, filters, isAdmin, mine]);

  const openCount = items.filter((i) => !i.received).length;
  const availableCount = items.filter((i) => !i.received && !i.reserved).length;

  async function cancelMine(item: PublicItem) {
    const local = mine[item.id];
    if (!local) return;
    setBusyId(item.id);
    try {
      const res = await api<{ item: PublicItem }>(`/api/items/${item.id}/reservation`, {
        method: "DELETE",
        body: { token: local.token },
      });
      removeLocalReservation(item.id);
      replaceItem(res.item);
      notify("Réservation annulée.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur inattendue.");
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleReceived(item: PublicItem) {
    setBusyId(item.id);
    try {
      const res = await api<{ item: PublicItem }>(`/api/items/${item.id}`, {
        method: "PATCH",
        body: { received: !item.received },
      });
      replaceItem(res.item);
      notify(res.item.received ? "Marqué comme reçu 🎉" : "Remis dans la liste.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const item = deleting;
    setBusyId(item.id);
    try {
      await api(`/api/items/${item.id}`, { method: "DELETE" });
      setItems((list) => list.filter((i) => i.id !== item.id));
      notify("Cadeau supprimé.");
      setDeleting(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }

  const cardProps = (item: PublicItem) => ({
    item,
    isAdmin,
    mine: mine[item.id],
    busy: busyId === item.id,
    onReserve: () => setReserving(item),
    onCancelMine: () => cancelMine(item),
    onCancelWithCode: () => setCancelling(item),
    onEdit: () => {
      setEditing(item);
      setFormOpen(true);
    },
    onToggleReceived: () => toggleReceived(item),
    onDelete: () => setDeleting(item),
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
      {/* Barre supérieure */}
      <div className="flex items-center justify-between gap-3 py-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-hero-muted">
          <Gift className="size-4" /> Wishlist
        </span>
        <div className="flex items-center gap-2">
          <ThemeSwitcher birthdayMonth={birthdayMonth} />
          {isAdmin && (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full border border-hero/15 bg-hero/5 px-3 py-1.5 text-xs font-medium text-hero-muted transition hover:bg-hero/10 hover:text-hero"
              title="Se déconnecter"
            >
              <LogOut className="size-3.5" /> <span className="hidden sm:inline">Quitter l&apos;admin</span>
            </button>
          )}
        </div>
      </div>

      {/* En-tête thématique (bascule en CSS selon data-theme) */}
      <header className="pb-8 pt-6 text-center sm:pb-10 sm:pt-10">
        <h1 className="font-display text-4xl leading-tight text-hero sm:text-6xl">
          <span className="theme-only" data-for="noel">
            Liste de Noël de {ownerName} <span aria-hidden>🎄</span>
          </span>
          <span className="theme-only" data-for="anniversaire">
            Liste d&apos;anniversaire de {ownerName} <span aria-hidden>🎂</span>
          </span>
          <span className="theme-only" data-for="minimaliste">
            La wishlist de {ownerName}
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-hero-muted sm:text-lg">
          <span className="theme-only" data-for="noel">
            Quelques idées à glisser sous le sapin… ✨
          </span>
          <span className="theme-only" data-for="anniversaire">
            Une bougie de plus, quelques envies en plus ! 🎈
          </span>
          <span className="theme-only" data-for="minimaliste">
            Quelques idées, si l&apos;envie vous prend.
          </span>
        </p>
        <p className="mt-4 text-sm text-hero-muted">
          {isAdmin
            ? `${openCount} idée${openCount > 1 ? "s" : ""} dans la liste`
            : `${availableCount} cadeau${availableCount > 1 ? "x" : ""} disponible${availableCount > 1 ? "s" : ""} sur ${openCount}`}
        </p>
      </header>

      <main className="flex-1 space-y-6 pb-16">
        {isAdmin ? <AdminNotice /> : <SpoilerNotice ownerName={ownerName} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Filters value={filters} onChange={setFilters} categories={categories} isAdmin={isAdmin} />
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110"
            >
              <Plus className="size-4" /> Ajouter un cadeau
            </button>
          )}
        </div>

        {active.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((item) => (
              <ItemCard key={item.id} {...cardProps(item)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-surface/80 px-6 py-14 text-center text-ink">
            <SearchX className="size-10 text-muted" strokeWidth={1.5} />
            <p className="font-display text-lg">
              {openCount === 0 ? "La liste est vide pour le moment." : "Aucun cadeau ne correspond à ces filtres."}
            </p>
            {openCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS, availability: "all" })}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Afficher tous les cadeaux
              </button>
            )}
          </div>
        )}

        {received.length > 0 && (
          <section className="pt-8" aria-labelledby="received-title">
            <h2 id="received-title" className="font-display mb-4 flex items-center gap-2 text-2xl text-hero">
              <CheckCircle2 className="size-6 text-success" /> Déjà reçus
              <span className="text-base font-normal text-hero-muted">({received.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {received.map((item) => (
                <ItemCard key={item.id} {...cardProps(item)} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="flex items-center justify-between border-t border-hero/10 py-6 text-xs text-hero-muted">
        <span>Fait avec ❤️ pour les gens que j&apos;aime.</span>
        {isAdmin ? (
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5" /> Admin
          </span>
        ) : (
          <Link href="/admin" className="rounded-full p-1.5 opacity-40 transition hover:opacity-100" aria-label="Espace admin">
            <Lock className="size-3.5" />
          </Link>
        )}
      </footer>

      {!isAdmin && (
        <>
          <ReserveDialog
            item={reserving}
            ownerName={ownerName}
            onClose={() => setReserving(null)}
            onReserved={replaceItem}
            onConflict={refresh}
          />
          <CancelDialog
            item={cancelling}
            onClose={() => setCancelling(null)}
            onCancelled={(item) => {
              replaceItem(item);
              notify("Réservation annulée.");
            }}
          />
        </>
      )}

      {isAdmin && (
        <>
          <ItemFormDialog
            open={formOpen}
            item={editing}
            categories={categories}
            onClose={() => setFormOpen(false)}
            onSaved={(item, created) => {
              if (created) setItems((list) => [item, ...list]);
              else replaceItem(item);
              notify(created ? "Cadeau ajouté 🎁" : "Modifications enregistrées.");
            }}
          />
          <Modal
            open={Boolean(deleting)}
            onClose={() => setDeleting(null)}
            title="Supprimer ce cadeau ?"
            icon={<Trash2 className="size-5 text-danger" />}
          >
            <p className="text-sm text-muted">
              « <strong className="text-ink">{deleting?.title}</strong> » sera définitivement retiré de la liste.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleting?.id}
                className="flex items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {busyId === deleting?.id && <Loader2 className="size-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </Modal>
        </>
      )}

      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast && <p className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-xl">{toast}</p>}
      </div>
    </div>
  );
}
