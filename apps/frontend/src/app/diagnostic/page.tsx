"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DiagnosticEntryPage() {
  const router = useRouter();
  const [code, setCode]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/diagnostic/session/by-code/${trimmed}`,
      );
      if (!res.ok) throw new Error("Code invalide");
      const session = await res.json();
      if (!session?.isActive) throw new Error("Cette session n'est plus active");
      router.push(`/diagnostic/${trimmed}`);
    } catch (err: any) {
      setError(err.message ?? "Code introuvable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div
        className="bg-[#0F3A5C]/80 backdrop-blur-sm rounded-3xl p-10 w-full max-w-sm flex flex-col items-center gap-6 text-white"
        style={{ boxShadow: "0 0 60px rgba(78,175,90,0.2), 0 8px 40px rgba(0,0,0,0.3)" }}
      >
        <Image
          src="/assets/logo/logo-passeport.png"
          alt="Passeport Santé"
          width={80}
          height={80}
          className="opacity-90"
        />

        <div className="text-center">
          <h1 className="text-2xl font-black">Entrer ton code</h1>
          <p className="text-white/60 text-sm mt-1">
            Saisis le code donné par ton enseignant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EX : AB3K7QXZ"
            maxLength={10}
            className="w-full bg-white/10 border-2 border-white/20 focus:border-[#4CAF5A] outline-none rounded-2xl px-5 py-4 text-center text-2xl font-black tracking-widest text-white placeholder:text-white/30 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #2A8970 0%, #4CAF5A 100%)" }}
          >
            {loading ? "Vérification..." : "Commencer →"}
          </button>
        </form>
      </div>
    </div>
  );
}
