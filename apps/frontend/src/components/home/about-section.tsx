import Image from "next/image";

export function AboutSection() {
  return (
    <section className="relative py-24 overflow-hidden">

      <div className="circle-about-green" />
      <div className="circle-about-blue" />

      <div className="relative z-10 brand-container">
        <div className="grid grid-cols-2 gap-16 items-center">

          {/* Image / future vidéo */}
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/assets/mascotte/mascotte-bouclier.png"
              alt="Passeport santé"
              width={700} height={500}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Texte */}
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-[#1A1A1A] leading-snug">
              {"C'est quoi le"} <span className="text-brand-green">passeport santé</span> ?
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Le passeport santé est un parcours numérique interactif conçu pour accompagner
              les jeunes dans la découverte des grands enjeux liés à leur santé.
            </p>
            <ul className="space-y-4 text-gray-700 text-base">
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-green">·</span>
                {"Chaque module aborde un thème de manière ludique pour valoriser tes connaissances et t'en apprendre des nouvelles."}
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-green">·</span>
                {"Si tu réalises les modules en classe, sache qu'ils sont indépendants et pourront être réalisés dans l'ordre choisi par ton enseignant."}
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-green">·</span>
                Tu peux également profiter d&apos;un temps libre pour enrichir tes connaissances !
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
