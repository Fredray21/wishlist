import { PRIORITIES, type Priority } from "./types";

export interface ItemInput {
  title: string;
  url?: string;
  imageUrl?: string;
  price?: number | null;
  category: string;
  priority: Priority;
  note?: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, (s) => (s.includes("\n") ? s : " "));
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export function httpUrl(value: unknown): string | undefined | null {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function price(value: unknown): number | null | undefined | false {
  if (value === null || value === "" || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return false;
  return Math.round(n * 100) / 100;
}

/** Valide un article complet (création) ou partiel (`partial: true`, modification). */
export function validateItemInput(body: Record<string, unknown>, partial: false): ValidationResult<ItemInput>;
export function validateItemInput(body: Record<string, unknown>, partial: true): ValidationResult<Partial<ItemInput>>;
export function validateItemInput(
  body: Record<string, unknown>,
  partial: boolean,
): ValidationResult<Partial<ItemInput>> {
  const out: Partial<ItemInput> = {};

  if (!partial || "title" in body) {
    const title = text(body.title, 200);
    if (!title) return { ok: false, error: "Le titre est obligatoire." };
    out.title = title;
  }
  for (const key of ["url", "imageUrl"] as const) {
    if (!partial || key in body) {
      const url = httpUrl(body[key]);
      if (url === null) return { ok: false, error: `L'adresse ${key === "url" ? "du produit" : "de l'image"} est invalide.` };
      out[key] = url;
    }
  }
  if (!partial || "price" in body) {
    const p = price(body.price);
    if (p === false) return { ok: false, error: "Le prix est invalide." };
    out.price = p;
  }
  if (!partial || "category" in body) {
    out.category = text(body.category, 50) ?? "Divers";
  }
  if (!partial || "priority" in body) {
    const priority = body.priority ?? "envie";
    if (!PRIORITIES.includes(priority as Priority)) return { ok: false, error: "Priorité invalide." };
    out.priority = priority as Priority;
  }
  if (!partial || "note" in body) {
    out.note = text(body.note, 1000);
  }
  return { ok: true, value: out };
}

export function cleanText(value: unknown, max: number): string | undefined {
  return text(value, max);
}
