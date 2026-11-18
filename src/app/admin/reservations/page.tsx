import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { readWishlist } from "@/lib/store";
import { toPublicItems } from "@/lib/view";
import { ReleaseManager } from "./ReleaseManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Libérer une réservation" };

export default async function ReservationsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const data = await readWishlist();
  const { ownerName } = getSiteConfig();
  // Vue admin : aucune information de réservation n'est transmise.
  const items = toPublicItems(data.items, true).filter((i) => !i.received);
  return <ReleaseManager items={items} ownerName={ownerName} />;
}
