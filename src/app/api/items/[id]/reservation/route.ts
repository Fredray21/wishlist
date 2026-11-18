import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { clientIp, error, isSameOrigin, json, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateCode,
  generateToken,
  hashCode,
  hashToken,
  isValidCode,
  matchesHash,
} from "@/lib/reservation";
import { mutateWishlist } from "@/lib/store";
import { cleanText } from "@/lib/validation";
import { toPublicItem } from "@/lib/view";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * L'admin ne peut ni réserver ni annuler : ces routes lui répondraient
 * « déjà réservé » / « pas réservé », ce qui trahirait la surprise.
 */
async function guard(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (await isAdmin()) return error("Action indisponible en mode admin.", 403);
  return null;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  if (!rateLimit(`reserve:${clientIp(req)}`, 20, 60 * 60 * 1000)) {
    return error("Trop de réservations, réessayez plus tard.", 429);
  }
  const { id } = await params;
  const body = await readJson(req);
  const code = generateCode();
  const token = generateToken();

  try {
    const item = await mutateWishlist((data) => {
      const found = data.items.find((i) => i.id === id);
      if (!found) throw new HttpError("Article introuvable.", 404);
      if (found.received) throw new HttpError("Ce cadeau a déjà été reçu.", 409);
      if (found.reservation) throw new HttpError("Ce cadeau vient d'être réservé par quelqu'un d'autre.", 409);
      found.reservation = {
        name: cleanText(body.name, 60),
        note: cleanText(body.note, 500),
        codeHash: hashCode(found.id, code),
        tokenHash: hashToken(token),
        createdAt: new Date().toISOString(),
      };
      return found;
    });
    return json({ item: toPublicItem(item, false), code, token }, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const blocked = await guard(req);
  if (blocked) return blocked;
  const { id } = await params;
  const body = await readJson(req);
  const token = typeof body.token === "string" ? body.token : undefined;
  const code = isValidCode(body.code) ? body.code : undefined;
  if (!token && !code) return error("Code à 4 chiffres requis.", 400);

  // Anti force brute sur le code à 4 chiffres.
  if (!rateLimit(`cancel:${clientIp(req)}`, 10, 15 * 60 * 1000) || !rateLimit(`cancel-item:${id}`, 30, 60 * 60 * 1000)) {
    return error("Trop de tentatives, réessayez dans quelques minutes.", 429);
  }

  try {
    const item = await mutateWishlist((data) => {
      const found = data.items.find((i) => i.id === id);
      if (!found) throw new HttpError("Article introuvable.", 404);
      const r = found.reservation;
      const ok =
        r &&
        ((token && matchesHash(hashToken(token), r.tokenHash)) || (code && matchesHash(hashCode(found.id, code), r.codeHash)));
      if (!ok) throw new HttpError("Code incorrect.", 403);
      found.reservation = null;
      return found;
    });
    return json({ item: toPublicItem(item, false) });
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.status);
    throw err;
  }
}
