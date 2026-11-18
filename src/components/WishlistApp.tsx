"use client";

import { Loader2, Plus, SearchX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { api, readLocalReservations, removeLocalReservation, type LocalReservation } from "@/lib/client";
import { PRIORITIES, type ItemsResponse, type PublicItem } from "@/lib/types";
import { CancelDialog } from "./CancelDialog";
import { Filters, PRICE_RANGES, type FiltersState } from "./Filters";
import { ItemCard } from "./ItemCard";
import { ItemFormDialog } from "./ItemFormDialog";
import { Modal } from "./Modal";
import { ReserveDialog } from "./ReserveDialog";
import { AdminNotice, SpoilerNotice } from "./SpoilerNotice";
import { Footer } from "./Footer";
import { EasterEggs } from "./fx/EasterEggs";
import { useReveal } from "./fx/Reveal";
import { Masthead } from "./Masthead";

interface Props {
  initialItems: PublicItem[];
  isAdmin: boolean;
  ownerName: string;
  birthdayMonth: number | null;
}

const DEFAULT_FILTERS: FiltersState = { availability: "available", category: "all", price: "all", sort: "priority" };

export function WishlistApp(props: Props) {
  return (
    <EasterEggs ownerName={props.ownerName}>
      <WishlistInner {...props} />
    </EasterEggs>
  );
}

function WishlistInner({ initialItems, isAdmin, ownerName, birthdayMonth }: Props) {
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

  const changeFilters = useCallback((next: FiltersState) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => flushSync(() => setFilters(next)));
    } else setFilters(next);
  }, []);

  useReveal([active, received]);

  const openCount = items.filter((i) => !i.received).length;
  const availableCount = items.filter((i) => !i.received && !i.reserved).length;
  const receivedCount = items.length - openCount;

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
      <Masthead
        ownerName={ownerName}
        birthdayMonth={birthdayMonth}
        isAdmin={isAdmin}
        onLogout={logout}
        stats={
          isAdmin
            ? [
                { label: "Idées", value: openCount },
                { label: "Catégories", value: categories.length },
                { label: "Reçus", value: receivedCount },
              ]
            : [
                { label: "Pièces", value: openCount },
                { label: "Disponibles", value: availableCount },
                { label: "Reçus", value: receivedCount },
              ]
        }
      />

      <main className="flex-1 space-y-8 pb-10">
        <div data-reveal>{isAdmin ? <AdminNotice /> : <SpoilerNotice ownerName={ownerName} />}</div>

        <div className="sticky top-3 z-20 flex flex-col gap-2 rounded-theme border border-line/70 bg-bg/75 p-2 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <Filters value={filters} onChange={changeFilters} categories={categories} isAdmin={isAdmin} />
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="btn-fill flex shrink-0 items-center justify-center gap-2 rounded-theme-sm bg-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-primary-ink shadow-sm transition active:scale-95"
            >
              <Plus className="size-4" /> Ajouter un cadeau
            </button>
          )}
        </div>

        {active.length > 0 ? (
          <div className="grid grid-flow-dense grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
            {active.map((item, index) => {
              const featured = index === 0 && active.length >= 4 && filters.sort === "priority";
              return (
                <div
                  key={item.id}
                  data-reveal
                  className={featured ? "sm:col-span-2 lg:row-span-2" : ""}
                  style={{ "--delay": `${(index % 6) * 70}ms`, viewTransitionName: `vt-${item.id}` } as React.CSSProperties}
                >
                  <ItemCard index={index} featured={featured} {...cardProps(item)} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-theme border border-dashed border-line bg-surface/80 px-6 py-16 text-center text-ink">
            <SearchX className="float size-10 text-muted" strokeWidth={1.5} />
            <p className="font-display text-2xl">
              {openCount === 0 ? "La liste est vide pour le moment." : "Rien ne correspond à ces filtres."}
            </p>
            {openCount > 0 && (
              <button
                type="button"
                onClick={() => changeFilters({ ...DEFAULT_FILTERS, availability: "all" })}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Afficher tous les cadeaux
              </button>
            )}
          </div>
        )}

        {received.length > 0 && (
          <section className="pt-12" aria-labelledby="received-title">
            <div data-reveal className="mb-6 flex items-end justify-between gap-4 border-b border-hero/15 pb-4">
              <h2 id="received-title" className="font-display text-5xl leading-none text-hero sm:text-7xl">
                <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.35em] text-hero-muted block mb-3">Archives</span>
                Déjà <em className="outline-text-hero not-italic">reçus</em>
              </h2>
              <span className="font-display text-5xl leading-none text-hero-muted sm:text-7xl tabular">
                {String(received.length).padStart(2, "0")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {received.map((item, index) => (
                <div key={item.id} data-reveal style={{ "--delay": `${(index % 4) * 70}ms` } as React.CSSProperties}>
                  <ItemCard index={index} {...cardProps(item)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer isAdmin={isAdmin} ownerName={ownerName} />

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
