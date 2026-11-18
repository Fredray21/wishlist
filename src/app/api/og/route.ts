import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { fetchOpenGraph } from "@/lib/og";
import { httpUrl } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);
  const url = httpUrl((await readJson(req)).url);
  if (!url) return error("Adresse invalide.", 400);
  try {
    return json(await fetchOpenGraph(url));
  } catch (err) {
    const message = err instanceof Error && err.name !== "TimeoutError" ? err.message : "La page n'a pas répondu à temps.";
    return error(`Impossible de lire la page : ${message}`, 422);
  }
}
