import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface OgResult {
  title?: string;
  imageUrl?: string;
  price?: number;
}

const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 4;

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = address.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Protocole non autorisé.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("Adresse non autorisée.");
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function metaContent(html: string, keys: string[]): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const key of keys) {
    for (const tag of tags) {
      const name = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (name?.toLowerCase() !== key) continue;
      const content = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const value = content?.[1] ?? content?.[2];
      if (value) return decodeEntities(value);
    }
  }
  return undefined;
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 1_000_000 ? Math.round(n * 100) / 100 : undefined;
}

const STORE_WORDS = /^(amazon(\.[a-z.]+)?|amazon\.[a-z.]+|books?|livres?|fnac|cdiscount|darty|boulanger|decathlon|ikea|zalando|etsy|ebay|aliexpress|shop|boutique|store|kindle store|high-tech|jeux et jouets|toys? & games)$/i;

/** Nettoie un titre de page produit : supprime le nom de la boutique, les ISBN, les suffixes « | Site ». */
export function cleanTitle(raw: string, siteName?: string): string {
  let title = raw.replace(/\s+/g, " ").trim();
  // « Amazon.fr : Titre » ou « Titre | Boutique » / « Titre - Boutique »
  title = title.replace(/^amazon\.[a-z.]+\s*:\s*/i, "");
  const site = siteName?.trim();
  for (const sep of [" | ", " – ", " — ", " - "]) {
    const idx = title.lastIndexOf(sep);
    if (idx > 0) {
      const tail = title.slice(idx + sep.length).trim();
      if ((site && tail.toLowerCase().includes(site.toLowerCase())) || STORE_WORDS.test(tail) || /amazon|fnac|cdiscount/i.test(tail)) {
        title = title.slice(0, idx).trim();
      }
    }
  }
  // Segments séparés par « : » (format Amazon : Titre: Auteur: ISBN: Amazon.com: Books)
  const parts = title.split(/\s*:\s+/);
  if (parts.length > 1) {
    const kept = parts.filter((p) => p && !STORE_WORDS.test(p) && !/^[\d\s-]{9,17}x?$/i.test(p) && !/amazon/i.test(p));
    // On garde le titre principal ; l'auteur (2e segment court) est conservé s'il reste lisible.
    title = kept.slice(0, kept.length > 1 && kept[1].length <= 40 ? 2 : 1).join(" — ") || parts[0];
  }
  return title.slice(0, 200);
}

export function parseOg(html: string, baseUrl: string): OgResult {
  const result: OgResult = {};
  const title =
    metaContent(html, ["og:title", "twitter:title"]) ??
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]) : undefined);
  if (title) result.title = cleanTitle(title, metaContent(html, ["og:site_name"]));

  const image = metaContent(html, ["og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
  if (image) {
    try {
      const resolved = new URL(image, baseUrl);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") result.imageUrl = resolved.toString();
    } catch {
      /* image ignorée */
    }
  }

  const price =
    parsePrice(metaContent(html, ["product:price:amount", "og:price:amount", "price"])) ??
    parsePrice(html.match(/"price"\s*:\s*"?(\d+(?:[.,]\d{1,2})?)"?/)?.[1]);
  if (price) result.price = price;
  return result;
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
}

/** Récupère titre / image / prix OpenGraph d'une page produit (admin uniquement). */
export async function fetchOpenGraph(rawUrl: string): Promise<OgResult> {
  let url = new URL(rawUrl);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WishlistPreview/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5",
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`La page a répondu ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new Error("Ce lien ne pointe pas vers une page HTML.");
    return parseOg(await readLimited(res), url.toString());
  }
  throw new Error("Trop de redirections.");
}
