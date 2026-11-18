import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { error, isSameOrigin, json, readJson } from "@/lib/http";
import { mutateWishlist, readWishlist } from "@/lib/store";
import type { ItemsResponse, StoredItem } from "@/lib/types";
import { validateItemInput } from "@/lib/validation";
import { toPublicItem, toPublicItems } from "@/lib/view";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdmin();
  const data = await readWishlist();
  return json<ItemsResponse>({ items: toPublicItems(data.items, admin), isAdmin: admin });
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return error("Origine refusée.", 403);
  if (!(await isAdmin())) return error("Réservé à l'admin.", 401);

  const parsed = validateItemInput(await readJson(req), false);
  if (!parsed.ok) return error(parsed.error, 400);

  const now = new Date().toISOString();
  const item: StoredItem = {
    id: randomUUID(),
    ...parsed.value,
    received: false,
    receivedAt: null,
    reservation: null,
    createdAt: now,
    updatedAt: now,
  };
  await mutateWishlist((data) => {
    data.items.unshift(item);
  });
  return json({ item: toPublicItem(item, true) }, { status: 201 });
}
