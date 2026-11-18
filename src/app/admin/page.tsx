import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function AdminPage() {
  if (await isAdmin()) redirect("/");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <LoginForm configured={isAdminConfigured()} />
    </main>
  );
}
