import type { PublicItem, StoredItem } from "./types";

/**
 * Transforme un article stocké en article « public ».
 * Règle anti-spoiler : en mode admin, la clé `reserved` n'est jamais émise.
 * Les détails d'une réservation (prénom, note, empreintes) ne sont jamais émis, quel que soit le rôle.
 */
export function toPublicItem(item: StoredItem, isAdmin: boolean): PublicItem {
  const view: PublicItem = {
    id: item.id,
    title: item.title,
    category: item.category,
    priority: item.priority,
    received: item.received,
    createdAt: item.createdAt,
  };
  if (item.url) view.url = item.url;
  if (item.imageUrl) view.imageUrl = item.imageUrl;
  if (typeof item.price === "number") view.price = item.price;
  if (item.note) view.note = item.note;
  if (item.receivedAt) view.receivedAt = item.receivedAt;
  if (!isAdmin) view.reserved = !item.received && Boolean(item.reservation);
  return view;
}

export function toPublicItems(items: StoredItem[], isAdmin: boolean): PublicItem[] {
  return items.map((item) => toPublicItem(item, isAdmin));
}
