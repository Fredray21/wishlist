"use client";

import { Loader2, Plus, SearchX, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { api, readLocalReservations, removeLocalReservation, type LocalReservation } from "@/lib/client";
import type { Theme } from "@/lib/themes";
import { PRIORITIES, PRIORITY_LABELS, type ItemsResponse, type PublicItem } from "@/lib/types";
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
  theme: Theme;
}

const DEFAULT_FILTERS: FiltersState = { availability: "available", category: "all", price: "all", sort: "priority" };

export function WishlistApp(props: Props) {
  return (
    <EasterEggs ownerName={props.ownerName}>
      <WishlistInner {...props} />
    </EasterEggs>
  );
}

function WishlistInner({ initialItems, isAdmin, ownerName, theme }: Props) {
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
            // Par priorité, puis l'ordre choisi par l'admin à l'intérieur de chaque priorité.
            return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.order - b.order;
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

  const cover = items
    .filter((i) => !i.received && (isAdmin || !i.reserved))
    .sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.order - b.order)
    .slice(0, 3);

  // Voisins de même priorité, selon l'ordre manuel (pour les flèches admin).
  const neighbours = (item: PublicItem) => {
    const siblings = items.filter((i) => i.priority === item.priority && i.received === item.received).sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((i) => i.id === item.id);
    return { first: index <= 0, last: index === siblings.length - 1 };
  };

  async function move(item: PublicItem, direction: "up" | "down") {
    setBusyId(item.id);
    try {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      const res = await api<{ items: PublicItem[] }>(`/api/items/${item.id}/move`, { method: "POST", body: { direction } });
      if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        doc.startViewTransition(() => flushSync(() => setItems(res.items)));
      } else setItems(res.items);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 sm:px-6 lg:px-10">
      <Masthead
        ownerName={ownerName}
        theme={theme}
        isAdmin={isAdmin}
        onLogout={logout}
        cover={cover}
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
                { label: "Reçues", value: receivedCount },
              ]
        }
      />

      <main className="flex-1 pb-10">
        <div data-reveal className="mt-14">
          {isAdmin ? <AdminNotice /> : <SpoilerNotice ownerName={ownerName} />}
        </div>

        {/* I — La sélection */}
        <section aria-labelledby="selection-title" className="mt-16">
          <div data-reveal className="flex items-end justify-between gap-4">
            <h2 id="selection-title" className="font-display text-5xl leading-none text-hero sm:text-7xl">
              <span className="eyebrow mb-4 block text-hero-muted">Chapitre I</span>
              La sélection
            </h2>
            <span className="font-display tabular text-5xl leading-none text-hero-muted sm:text-7xl">
              {String(active.length).padStart(2, "0")}
            </span>
          </div>

          <div className="sticky top-0 z-20 -mx-4 mt-8 border-y border-line bg-surface px-4 py-1.5 text-ink sm:mx-0 sm:px-5 sm:py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex-1">
                <Filters
                  value={filters}
                  onChange={changeFilters}
                  categories={categories}
                  isAdmin={isAdmin}
                  counts={{ available: availableCount, all: openCount }}
                />
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                  className="btn-primary shrink-0"
                >
                  <Plus className="size-3.5" /> Ajouter
                </button>
              )}
            </div>
          </div>

          {isAdmin && active.length > 1 && (
            <p className="eyebrow mt-4 text-hero-muted">
              {filters.sort === "priority"
                ? "Astuce : les flèches ‹ › sur chaque photo rangent le cadeau parmi ceux de même priorité."
                : "Pour ranger les cadeaux à la main, choisissez le tri « Par priorité »."}
            </p>
          )}

          {active.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {active.map((item, index) => (
                <div
                  key={item.id}
                  data-reveal
                 
                  style={{ "--delay": `${(index % 4) * 60}ms`, viewTransitionName: `vt-${item.id}` } as React.CSSProperties}
                >
                  <ItemCard
                    index={index}
                    {...cardProps(item)}
                    move={
                      isAdmin && filters.sort === "priority"
                        ? { ...neighbours(item), group: PRIORITY_LABELS[item.priority], onUp: () => move(item, "up"), onDown: () => move(item, "down") }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 border border-line bg-surface px-6 py-20 text-center text-ink">
              <SearchX className="float size-9 text-muted" strokeWidth={1} />
              <p className="font-display text-3xl">
                {openCount === 0 ? "La sélection arrive bientôt." : "Rien ne correspond à ces filtres."}
              </p>
              {openCount > 0 && (
                <button type="button" onClick={() => changeFilters({ ...DEFAULT_FILTERS, availability: "all" })} className="btn-outline">
                  Afficher toute la sélection
                </button>
              )}
            </div>
          )}
        </section>

        {/* II — Archives */}
        {received.length > 0 && (
          <section className="mt-24" aria-labelledby="received-title">
            <div data-reveal className="flex items-end justify-between gap-4 border-b border-hero/20 pb-6">
              <h2 id="received-title" className="font-display text-5xl leading-none text-hero sm:text-7xl">
                <span className="eyebrow mb-4 block text-hero-muted">Chapitre II · Archives</span>
                Déjà <em className="outline-text-hero not-italic">reçus</em>
              </h2>
              <span className="font-display tabular text-5xl leading-none text-hero-muted sm:text-7xl">
                {String(received.length).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
              {received.map((item, index) => (
                <div key={item.id} data-reveal style={{ "--delay": `${(index % 5) * 60}ms` } as React.CSSProperties}>
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
                className="btn-ghost"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleting?.id}
                className="btn-primary !border-danger !bg-danger !text-white"
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
        {toast && <p className="eyebrow bg-ink px-5 py-3 text-surface shadow-xl">{toast}</p>}
      </div>
    </div>
  );
}
