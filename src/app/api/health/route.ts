import { json } from "@/lib/http";
import { readWishlist } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await readWishlist();
  return json({ ok: true });
}
