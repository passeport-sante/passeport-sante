export const metadata = {
  title: "Conditions Générales d'Utilisation — Passeport Santé",
};

const UPDATED = "5 juin 2026";

export default function ConditionsGeneralesPage() {
  return (
    <div className="brand-container py-16 max-w-3xl">
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Dernière mise à jour : {UPDATED}</p>
      <h1 className="text-3xl font-black text-[#1A1A1A] mb-2">
        Conditions Générales d'Utilisation
      </h1>
      <p className="text-gray-500 mb-10">
        Les présentes conditions régissent l'accès et l'utilisation de la plateforme
        Passeport Santé, éditée par le CODES95.
      </p>

      <div className="space-y-10 text-[15px] leading-relaxed text-gray-700">

        <Section title="1. Présentation de la plateforme">
          <p>
            Passeport Santé est une plateforme pédagogique de prévention en santé
            destinée aux établissements scolaires du Val-d'Oise et d'Île-de-France.
            Elle est éditée par le <strong>CODES95</strong> (Comité Départemental
            d'Éducation pour la Santé du Val-d'Oise), association loi 1901 dont
            le siège social est à <strong>Pontoise (95)</strong>.
          </p>
          <p className="mt-3">
            Contact :{" "}
            <a href="mailto:contact@lepasseportsante.fr" className="text-[#1B6B8A] hover:underline">
              contact@lepasseportsante.fr
            </a>
          </p>
        </Section>

        <Section title="2. Accès à la plateforme">
          <p className="font-semibold text-[#1A1A1A] mb-2">Établissements scolaires</p>
          <p>
            L'accès à la plateforme est réservé aux établissements scolaires
            partenaires du CODES95. Les accès sont créés <strong>manuellement
            par le CODES95</strong> sur demande de l'établissement. Aucune
            inscription publique n'est disponible.
          </p>
          <p className="mt-3">
            L'établissement est responsable de la confidentialité de ses
            identifiants de connexion et de leur usage.
          </p>

          <p className="font-semibold text-[#1A1A1A] mt-5 mb-2">Élèves</p>
          <p>
            Les élèves accèdent à la plateforme via un <strong>code de session</strong>{" "}
            fourni par leur enseignant. Aucune création de compte n'est requise.
            L'accès est anonyme et temporaire.
          </p>
        </Section>

        <Section title="3. Services proposés">
          <p>La plateforme propose deux types d'activités :</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>
              <strong>Diagnostic Santé</strong> — questionnaire de 61 questions portant
              sur la santé, le bien-être, la nutrition, le sommeil, la sexualité et
              les usages numériques. Les résultats sont anonymes et consultables
              de façon agrégée par l'établissement.
            </li>
            <li>
              <strong>Modules pédagogiques</strong> — parcours interactifs (quiz,
              jeux, scénarios) sur des thématiques de prévention santé. Les élèves
              progressent à leur rythme.
            </li>
          </ul>
        </Section>

        <Section title="4. Utilisation acceptable">
          <p>Les utilisateurs s'engagent à :</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>Utiliser la plateforme dans un cadre exclusivement pédagogique</li>
            <li>
              Ne pas tenter d'accéder aux données d'autres établissements ou sessions
            </li>
            <li>Ne pas détourner, copier ou reproduire les contenus sans autorisation</li>
            <li>
              S'assurer que les élèves utilisent la plateforme dans des conditions
              adaptées (surveillance pédagogique)
            </li>
          </ul>
          <p className="mt-3">
            Tout usage abusif ou frauduleux peut entraîner la suspension de l'accès.
          </p>
        </Section>

        <Section title="5. Responsabilité de l'établissement vis-à-vis des mineurs">
          <p>
            La plateforme étant utilisée avec des élèves mineurs, l'établissement
            scolaire assume la responsabilité de l'encadrement pédagogique de son
            utilisation. Le CODES95 met à disposition l'outil ; il appartient à
            l'établissement de s'assurer du cadre approprié pour chaque activité,
            notamment pour le Diagnostic Santé qui aborde des sujets sensibles.
          </p>
        </Section>

        <Section title="6. Propriété intellectuelle">
          <p>
            L'ensemble des contenus de la plateforme (textes, questions du diagnostic,
            modules pédagogiques, illustrations, mascottes, animations) est la propriété
            exclusive du CODES95 ou de ses partenaires.
          </p>
          <p className="mt-3">
            Toute reproduction, distribution ou exploitation de ces contenus sans
            autorisation préalable et écrite du CODES95 est interdite.
          </p>
        </Section>

        <Section title="7. Disponibilité et évolution">
          <p>
            Le CODES95 s'efforce de maintenir la plateforme disponible mais ne peut
            garantir une disponibilité ininterrompue. Des interruptions pour maintenance
            ou mise à jour peuvent survenir sans préavis.
          </p>
          <p className="mt-3">
            Le CODES95 se réserve le droit de modifier, compléter ou supprimer des
            fonctionnalités à tout moment, dans l'intérêt du service.
          </p>
        </Section>

        <Section title="8. Modification des CGU">
          <p>
            Les présentes CGU peuvent être mises à jour à tout moment. La date de
            dernière modification est indiquée en haut de page. L'utilisation continue
            de la plateforme après modification vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="9. Droit applicable">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige,
            les parties s'engagent à rechercher une solution amiable. À défaut,
            les tribunaux compétents sont ceux du ressort de <strong>Pontoise (95)</strong>.
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-3 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </section>
  );
}
