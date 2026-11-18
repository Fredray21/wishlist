import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-5xl text-hero">404</p>
      <p className="text-hero-muted">Cette page n&apos;existe pas.</p>
      <Link href="/" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink">
        Retour à la liste
      </Link>
    </main>
  );
}
