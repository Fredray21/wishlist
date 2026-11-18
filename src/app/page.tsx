import { isAdmin } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { readWishlist } from "@/lib/store";
import { toPublicItems } from "@/lib/view";
import { WishlistApp } from "@/components/WishlistApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [admin, data] = await Promise.all([isAdmin(), readWishlist()]);
  const { ownerName, birthdayMonth } = getSiteConfig();
  return (
    <WishlistApp
      key={admin ? "admin" : "visitor"}
      initialItems={toPublicItems(data.items, admin)}
      isAdmin={admin}
      ownerName={ownerName}
      birthdayMonth={birthdayMonth}
    />
  );
}
