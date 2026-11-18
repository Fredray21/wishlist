import "server-only";
import { NextResponse, type NextRequest } from "next/server";

export const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};

export function json<T>(data: T, init: { status?: number } = {}) {
  return NextResponse.json(data, { status: init.status ?? 200, headers: NO_STORE });
}

export function error(message: string, status: number) {
  return json({ error: message }, { status });
}

/** Protection CSRF : les requêtes qui modifient des données doivent venir du même site. */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Les navigateurs modernes envoient toujours Origin sur POST/PATCH/DELETE ;
    // on accepte son absence uniquement si Sec-Fetch-Site confirme une requête same-origin.
    const site = req.headers.get("sec-fetch-site");
    return site === null || site === "same-origin" || site === "none";
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}
