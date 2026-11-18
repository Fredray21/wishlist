import { EyeOff } from "lucide-react";

export function SpoilerNotice({ ownerName, compact = false }: { ownerName: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-2xl border border-line border-l-4 border-l-accent bg-surface text-ink shadow-sm ${
        compact ? "p-3 text-sm" : "p-4 text-sm sm:text-base"
      }`}
    >
      <span className="text-xl leading-none" aria-hidden>
        🤫
      </span>
      <p>
        <strong>Chut !</strong> Si vous réservez un cadeau ici, {ownerName} ne le saura pas : les réservations lui sont
        totalement masquées pour garder la surprise intacte.
      </p>
    </div>
  );
}

export function AdminNotice() {
  return (
    <div role="note" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-sm text-ink shadow-sm">
      <EyeOff className="size-5 shrink-0 text-accent" />
      <p>
        <strong>Mode Admin :</strong> les réservations de vos proches sont masquées pour garder la surprise.
      </p>
    </div>
  );
}
