import type { NextRequest } from "next/server";
import { checkPassword, createSessionToken, isAdminConfigured, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { clientIp, error, isSameOrigin, json, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!isAdminConfigured()) return error("Mode admin non configuré sur le serveur.", 503);
  if (!rateLimit(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return error("Trop de tentatives, réessayez dans 15 minutes.", 429);
  }
  const { password } = await readJson(req);
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 400));
    return error("Mot de passe incorrect.", 401);
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return res;
}
