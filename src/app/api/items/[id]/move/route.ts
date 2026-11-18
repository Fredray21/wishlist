import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { mutateWishlist } from "@/lib/store";
import { toPublicItems } from "@/lib/view";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * Déplace un cadeau d'un cran dans sa priorité (admin) :
 * il échange sa place avec le cadeau précédent / suivant de la même priorité
 * (Coup de cœur, Envie ou Idée).
 * Body : { direction: "up" | "down" }. Renvoie la liste complète, en vue admin.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const { id } = await params;
  const { direction } = await readJson(req);
  if (direction !== "up" && direction !== "down") return error("Direction invalide.", 400);

  try {
    const items = await mutateWishlist((data) => {
      const item = data.items.find((i) => i.id === id);
      if (!item) throw new HttpError("Article introuvable.", 404);
      const siblings = data.items
        .filter((i) => i.priority === item.priority && i.received === item.received)
        .sort((a, b) => a.order - b.order);
      const index = siblings.indexOf(item);
      const neighbour = siblings[direction === "up" ? index - 1 : index + 1];
      if (neighbour) {
        // Ordres identiques (données anciennes) : on renumérote d'abord toute la liste.
        if (neighbour.order === item.order) {
          [...data.items].sort((a, b) => a.order - b.order).forEach((it, n) => (it.order = n + 1));
        }
        [item.order, neighbour.order] = [neighbour.order, item.order];
        item.updatedAt = neighbour.updatedAt = new Date().toISOString();
      }
      return data.items;
    });
    return json({ items: toPublicItems(items, true) });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
}
