"use client";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Une erreur est survenue.", res.status);
  return data as T;
}

/* ---------- Réservations du visiteur (localStorage) ---------- */

export interface LocalReservation {
  token: string;
  code: string;
  title: string;
  createdAt: string;
}

const KEY = "wishlist:reservations";

export function readLocalReservations(): Record<string, LocalReservation> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalReservation(itemId: string, value: LocalReservation) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readLocalReservations(), [itemId]: value }));
  } catch {
    /* stockage indisponible : le code affiché reste la solution de secours */
  }
}

export function removeLocalReservation(itemId: string) {
  try {
    const all = readLocalReservations();
    delete all[itemId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignoré */
  }
}

export function formatPrice(price?: number | null): string | null {
  if (typeof price !== "number") return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}
