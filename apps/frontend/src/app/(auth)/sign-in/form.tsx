"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";

interface SignInFormValues {
  email: string;
  password: string;
}

export function SignInForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>();

  const onSubmit = async (data: SignInFormValues) => {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) return;

    localStorage.setItem("access_token", result.access_token);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Côté gauche — formulaire */}
      <div className="relative flex flex-1 flex-col justify-center items-center px-12 py-16 overflow-hidden bg-white">
        {/* Cercles décoratifs bleu site */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full" style={{ background: "rgba(27,107,138,0.08)" }} />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full" style={{ background: "rgba(27,107,138,0.06)" }} />
        <div className="absolute top-1/2 -right-20 w-56 h-56 rounded-full" style={{ background: "rgba(42,137,112,0.07)" }} />

        <div className="mx-auto w-full max-w-sm relative z-10">
          {/* Barre accent bleue */}
          <div className="w-10 h-1 rounded-full mb-4" style={{ background: "#1B6B8A" }} />
          <h1 className="text-3xl font-bold text-foreground mb-1">Bienvenue !</h1>
          <p className="text-muted-foreground mb-8">Connectez-vous à votre espace formateur.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@example.com"
                {...register("email", { required: true })}
              />
              {errors.email && (
                <span className="text-destructive text-sm">Email requis</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password", { required: true })}
              />
              {errors.password && (
                <span className="text-destructive text-sm">Mot de passe requis</span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2 text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #1B6B8A 0%, #2A8970 100%)" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion..." : "Se connecter →"}
            </Button>
          </form>
        </div>
      </div>

      {/* Côté droit — branding */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center gap-8 px-12"
        style={{ background: "linear-gradient(160deg, #1B6B8A 0%, #2A8970 55%, #4CAF5A 100%)" }}
      >
        <Image
          src="/assets/mascotte/mascotte-bouclier.png"
          alt="Mascotte prévention"
          width={340}
          height={340}
          className="drop-shadow-xl"
        />
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Plateforme de Prévention</h2>
          <p className="text-white/75 max-w-xs">
            Créez des sessions interactives et sensibilisez vos élèves aux risques du quotidien.
          </p>
        </div>
      </div>
    </div>
  );
}
