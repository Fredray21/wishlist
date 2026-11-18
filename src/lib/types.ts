export const PRIORITIES = ["coup-de-coeur", "envie", "idee"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  "coup-de-coeur": "Coup de cœur",
  envie: "Envie",
  idee: "Idée",
};

/** Réservation stockée côté serveur uniquement. Ne quitte JAMAIS le serveur. */
export interface Reservation {
  name?: string;
  note?: string;
  /** Empreinte SHA-256 du code à 4 chiffres (salée par l'id de l'article). */
  codeHash: string;
  /** Empreinte SHA-256 du jeton conservé dans le localStorage du visiteur. */
  tokenHash: string;
  createdAt: string;
}

/** Article tel qu'il est enregistré dans data/wishlist.json. */
export interface StoredItem {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  price?: number | null;
  category: string;
  priority: Priority;
  note?: string;
  received: boolean;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reservation?: Reservation | null;
}

export interface WishlistFile {
  version: 1;
  items: StoredItem[];
}

/**
 * Article envoyé au navigateur.
 * - Visiteur : `reserved` est présent (booléen), sans aucun détail sur la personne.
 * - Admin : la clé `reserved` est totalement absente.
 */
export interface PublicItem {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  price?: number | null;
  category: string;
  priority: Priority;
  note?: string;
  received: boolean;
  receivedAt?: string | null;
  createdAt: string;
  reserved?: boolean;
}

export interface ItemsResponse {
  items: PublicItem[];
  isAdmin: boolean;
}
