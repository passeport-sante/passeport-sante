"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.message ?? "Lien invalide ou expiré. Refais une demande.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 2500);
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-10 h-1 rounded-full mb-4 mx-auto" style={{ background: "#1B6B8A" }} />
        <h1 className="text-2xl font-bold text-foreground mb-2">Lien invalide</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Ce lien de réinitialisation est incomplet ou a expiré.
        </p>
        <Link href="/forgot-password" className="text-sm font-semibold text-[#1B6B8A] hover:underline">
          Refaire une demande
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#EBF6F3] flex items-center justify-center">
          <CheckCircle2 size={26} className="text-[#2A8970]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mot de passe modifié !</h1>
        <p className="text-muted-foreground text-sm">
          Tu peux maintenant te connecter. Redirection en cours…
        </p>
        <Link href="/sign-in" className="text-sm font-semibold text-[#1B6B8A] hover:underline">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="w-10 h-1 rounded-full mb-4" style={{ background: "#1B6B8A" }} />
      <h1 className="text-3xl font-bold text-foreground mb-1">Nouveau mot de passe</h1>
      <p className="text-muted-foreground mb-8 text-sm">Choisis un nouveau mot de passe pour ton compte.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Au moins 8 caractères.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <Input
            id="confirm"
            type={showPwd ? "text" : "password"}
            required
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full text-white font-semibold"
          style={{ background: "linear-gradient(135deg, #1B6B8A 0%, #2A8970 100%)" }}
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Réinitialiser →"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <Suspense fallback={<div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}
