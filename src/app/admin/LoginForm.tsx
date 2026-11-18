"use client";

import { ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    try {
      await api("/api/auth/login", { method: "POST", body: { password } });
      router.replace("/");
      router.refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur inattendue.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-3xl border border-line bg-surface p-7 text-ink shadow-xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-ink">
          <Lock className="size-5" />
        </span>
        <h1 className="font-display text-2xl">Espace admin</h1>
        <p className="text-sm text-muted">Les réservations resteront masquées, promis.</p>
      </div>
      {!configured && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          Le mode admin n&apos;est pas configuré (ADMIN_PASSWORD / SESSION_SECRET).
        </p>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Mot de passe</span>
        <input
          className="field"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>}
      <button
        type="submit"
        disabled={pending || !configured}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Se connecter
      </button>
      <Link href="/" className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Retour à la liste
      </Link>
    </form>
  );
}
