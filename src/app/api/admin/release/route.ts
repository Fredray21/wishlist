import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { mutateWishlist } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Libère une réservation « à l'aveugle » : l'admin ne sait jamais si l'article
 * était réservé. La réponse est strictement identique dans les deux cas.
 * Body : { id: string } pour un article, ou { all: true } pour tout libérer.
 */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const body = await readJson(req);
  const all = body.all === true;
  const id = typeof body.id === "string" ? body.id : null;
  if (!all && !id) return error("Article manquant.", 400);

  const exists = await mutateWishlist((data) => {
    let found = all;
    for (const item of data.items) {
      if (all || item.id === id) {
        found = true;
        item.reservation = null;
      }
    }
    return found;
  });
  if (!exists) return error("Article introuvable.", 404);
  return json({ ok: true });
}
