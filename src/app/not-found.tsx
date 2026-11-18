import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="float text-8xl" aria-hidden>
        📦
      </span>
      <p className="font-display text-[clamp(6rem,22vw,14rem)] leading-none text-hero">
        4<span className="outline-text-hero">0</span>4
      </p>
      <p className="max-w-md text-lg text-hero-muted">
        Ce cadeau s&apos;est perdu en livraison. Le lutin responsable a été prié de faire ses valises. 🧝
      </p>
      <Link href="/" className="btn-fill rounded-theme-sm bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-ink">
        Retour à la liste
      </Link>
    </main>
  );
}
