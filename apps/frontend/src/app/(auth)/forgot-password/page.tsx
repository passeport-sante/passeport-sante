"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="w-10 h-1 rounded-full mb-4" style={{ background: "#1B6B8A" }} />

        {sent ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-[#EBF6F3] flex items-center justify-center">
              <MailCheck size={26} className="text-[#2A8970]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Vérifie tes emails</h1>
            <p className="text-muted-foreground text-sm">
              Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation
              vient d&apos;être envoyé. Le lien est valable 1 heure.
            </p>
            <Link href="/sign-in" className="text-sm font-semibold text-[#1B6B8A] hover:underline mt-2">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-1">Mot de passe oublié ?</h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Entre ton email : on t&apos;envoie un lien pour en choisir un nouveau.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="vous@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Envoi..." : "Envoyer le lien →"}
              </Button>

              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
