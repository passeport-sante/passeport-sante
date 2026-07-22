import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { mascotteUrl } from "@/lib/mascotte";

export type Module = {
  id: string;
  title: string;
  description: string;
  duration: number;
  mascotte: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  modules: Module[];
};

export function ModuleCard({ module }: { module: Module }) {
  const mascotteSrc = mascotteUrl(module.mascotte, "card");

  return (
    <div className="module-card-wrapper">
      {/* Mascotte — superposée sur la carte, indépendante du contenu */}
      {mascotteSrc && (
        <div className="module-card-mascotte">
          <Image
            src={mascotteSrc}
            alt={module.title}
            width={100}
            height={100}
            className="w-full h-full object-contain object-bottom"
          />
        </div>
      )}

      {/* Carte — layout fixe, non affecté par la taille de la mascotte */}
      <div className="module-card">
        {/* Header : titre gris + durée */}
        <div className="module-card-header">
          <h3 className="module-card-title">{module.title}</h3>
          <div className="module-card-timer">
            <Clock size={20} strokeWidth={2.5} />
            <span>{module.duration} min</span>
          </div>
        </div>

        {/* Bulle ovale — alignée à droite */}
        <div className="module-card-bubble-row">
          <div className="speech-bubble">{module.description}</div>
        </div>

        {/* Bouton — dépasse bas-droite */}
        <Link href={`/modules/${module.slug}`} className="module-card-btn">
          Découvrir le module
        </Link>
      </div>
    </div>
  );
}
