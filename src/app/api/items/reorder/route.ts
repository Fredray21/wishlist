import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { mutateWishlist } from "@/lib/store";
import { toPublicItems } from "@/lib/view";

export const dynamic = "force-dynamic";

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Réordonne des cadeaux d'une même priorité (glisser-déposer admin).
 * Body : { ids: string[] } dans le nouvel ordre d'affichage.
 * Les cadeaux concernés se redistribuent leurs propres places : les autres ne bougent pas
 * (fonctionne aussi quand la liste affichée est filtrée).
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const { ids } = await readJson(req);
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 500 || !ids.every((id) => typeof id === "string")) {
    return error("Liste invalide.", 400);
  }
  if (new Set(ids).size !== ids.length) return error("Liste invalide.", 400);

  try {
    const items = await mutateWishlist((data) => {
      const moved = ids.map((id) => {
        const item = data.items.find((i) => i.id === id);
        if (!item) throw new HttpError("Article introuvable.", 404);
        return item;
      });
      if (moved.some((i) => i.priority !== moved[0].priority || i.received !== moved[0].received)) {
        throw new HttpError("On ne peut réordonner que des cadeaux de même priorité.", 400);
      }
      // Places disponibles = les ordres actuels de ces cadeaux. En cas d'égalité, on renumérote d'abord.
      if (new Set(moved.map((i) => i.order)).size !== moved.length) {
        [...data.items].sort((a, b) => a.order - b.order).forEach((it, n) => (it.order = n + 1));
      }
      const slots = moved.map((i) => i.order).sort((a, b) => a - b);
      const now = new Date().toISOString();
      moved.forEach((item, index) => {
        if (item.order !== slots[index]) {
          item.order = slots[index];
          item.updatedAt = now;
        }
      });
      return data.items;
    });
    return json({ items: toPublicItems(items, true) });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
}
