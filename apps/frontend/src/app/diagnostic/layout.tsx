import Image from "next/image";

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1B6B8A 0%, #2A8970 50%, #4CAF5A 100%)",
      }}
    >
      {/* Logos passeport santé en décoration de fond */}

      {/* Haut droite */}
      <Image
        src="/assets/logo/logo-passeport.png"
        alt=""
        width={160}
        height={160}
        className="absolute top-[-20px] right-[-20px] opacity-[0.12] rotate-12 pointer-events-none select-none"
        aria-hidden
      />

      {/* Droite — au niveau de la question */}
      <Image
        src="/assets/logo/logo-passeport.png"
        alt=""
        width={200}
        height={200}
        className="absolute top-1/2 -translate-y-1/2 right-[-30px] opacity-[0.09] -rotate-6 pointer-events-none select-none"
        aria-hidden
      />

      {/* Bas gauche */}
      <Image
        src="/assets/logo/logo-passeport.png"
        alt=""
        width={170}
        height={170}
        className="absolute bottom-8 left-[-30px] opacity-[0.09] rotate-3 pointer-events-none select-none"
        aria-hidden
      />

      {children}
    </div>
  );
}
