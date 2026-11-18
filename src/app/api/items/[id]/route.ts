import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { mutateWishlist } from "@/lib/store";
import { validateItemInput } from "@/lib/validation";
import { toPublicItem } from "@/lib/view";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

class NotFound extends Error {}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const { id } = await params;
  const body = await readJson(req);

  const parsed = validateItemInput(body, true);
  if (!parsed.ok) return error(parsed.error, 400);
  if ("received" in body && typeof body.received !== "boolean") return error("Valeur « reçu » invalide.", 400);

  try {
    const item = await mutateWishlist((data) => {
      const found = data.items.find((i) => i.id === id);
      if (!found) throw new NotFound();
      Object.assign(found, parsed.value);
      if (typeof body.received === "boolean" && body.received !== found.received) {
        found.received = body.received;
        found.receivedAt = body.received ? new Date().toISOString() : null;
      }
      found.updatedAt = new Date().toISOString();
      return found;
    });
    // Réponse admin : aucune information de réservation.
    return json({ item: toPublicItem(item, true) });
  } catch (err) {
    if (err instanceof NotFound) return error("Article introuvable.", 404);
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const { id } = await params;
  const removed = await mutateWishlist((data) => {
    const before = data.items.length;
    data.items = data.items.filter((i) => i.id !== id);
    return before !== data.items.length;
  });
  return removed ? json({ ok: true }) : error("Article introuvable.", 404);
}
