import { BubbleCard, type Category } from "@/components/modules/bubble-card";

// ---- Fetch depuis le backend ----
async function getModulesByCategory(): Promise<Category[]> {
  try {
    const baseUrl = process.env.API_INTERNAL_URL ?? "http://localhost:5000";
    const res = await fetch(`${baseUrl}/api/modules?grouped=true`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Erreur API");
    return res.json();
  } catch {
    return [];
  }
}

// ---- Page ----
export default async function ModulesPage() {
  const categories = await getModulesByCategory();

  return (
    <div className="relative overflow-hidden">
      {/* Cercles déco */}
      <div className="circle-hero-mauve" />
      <div className="circle-about-green" />

      {/* Hero texte */}
      <section className="relative z-10 brand-container pt-16 pb-12">
        <h1 className="text-5xl font-black text-gray-900">
          Ton Guide <span className="text-brand-green">Futur Serein</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl leading-relaxed">
          Explore nos modules thématiques pour comprendre, agir et te protéger
          au quotidien. Des contenus courts, clairs et sans tabou.
        </p>
      </section>

      {/* Catégories + modules */}
      <section className="relative z-10 brand-container pb-24 space-y-16">
        {categories.map((category) => (
          <div key={category.id}>
            {/* Titre catégorie */}
            <h2
              className="text-lg font-bold pl-3 mb-8 border-l-4"
              style={{ color: category.color ?? "#2A8970", borderColor: category.color ?? "#2A8970" }}
            >
              {category.name}
            </h2>

            {/* Grille modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {category.modules.map((module) => (
                <BubbleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
