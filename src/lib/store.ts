import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PRIORITIES, type StoredItem, type WishlistFile } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "wishlist.json");
const EXAMPLE_CANDIDATES = [
  path.join(DATA_DIR, "wishlist.example.json"),
  // Copie embarquée dans l'image Docker (le volume monté sur /app/data masque celle du dépôt).
  path.join(/* turbopackIgnore: true */ process.cwd(), "seed", "wishlist.example.json"),
];

const EMPTY: WishlistFile = { version: 1, items: [] };

/** File d'attente : sérialise toutes les opérations lecture-modification-écriture du processus. */
let queue: Promise<unknown> = Promise.resolve();
let ensured = false;

function normalize(raw: unknown): WishlistFile {
  const list = Array.isArray((raw as WishlistFile | null)?.items) ? (raw as WishlistFile).items : [];
  const items = list
    .filter((i): i is StoredItem => Boolean(i && typeof i.id === "string" && typeof i.title === "string"))
    .map((i) => ({
      ...i,
      category: typeof i.category === "string" && i.category.trim() ? i.category : "Divers",
      priority: PRIORITIES.includes(i.priority) ? i.priority : "envie",
      received: Boolean(i.received),
    }));

  // Anciennes données sans ordre manuel : on part de l'ordre « par priorité, plus récent d'abord ».
  if (items.some((i) => typeof i.order !== "number" || !Number.isFinite(i.order))) {
    [...items]
      .sort(
        (a, b) =>
          (typeof a.order === "number" ? -1 : 0) - (typeof b.order === "number" ? -1 : 0) ||
          (a.order ?? 0) - (b.order ?? 0) ||
          PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .forEach((item, index) => (item.order = index + 1));
  }
  return { version: 1, items };
}

async function writeAtomic(file: string, data: WishlistFile): Promise<void> {
  const tmp = `${file}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  const handle = await fs.open(tmp, "w", 0o600);
  try {
    await handle.writeFile(JSON.stringify(data, null, 2) + "\n", "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

/** Crée data/wishlist.json à partir de l'exemple s'il est absent. */
export async function ensureDataFile(): Promise<void> {
  if (ensured) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    let initial: WishlistFile = EMPTY;
    for (const candidate of EXAMPLE_CANDIDATES) {
      try {
        initial = normalize(JSON.parse(await fs.readFile(/* turbopackIgnore: true */ candidate, "utf8")));
        break;
      } catch {
        /* candidat suivant */
      }
    }
    await writeAtomic(DATA_FILE, initial);
    console.log(`[wishlist] ${DATA_FILE} créé (${initial.items.length} article(s) d'exemple).`);
  }
  ensured = true;
}

async function load(): Promise<WishlistFile> {
  await ensureDataFile();
  const content = await fs.readFile(/* turbopackIgnore: true */ DATA_FILE, "utf8");
  return normalize(JSON.parse(content));
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export function readWishlist(): Promise<WishlistFile> {
  return enqueue(load);
}

/**
 * Applique `fn` sur une copie fraîche des données puis l'écrit de façon atomique
 * (fichier temporaire + fs.rename). Si `fn` lève une erreur, rien n'est écrit.
 */
export function mutateWishlist<T>(fn: (data: WishlistFile) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const data = await load();
    const result = await fn(data);
    await writeAtomic(DATA_FILE, data);
    return result;
  });
}
