export const metadata = {
  title: "Politique de confidentialité — Passeport Santé",
};

const UPDATED = "24 juillet 2026";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="brand-container py-16 max-w-3xl">
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Dernière mise à jour : {UPDATED}</p>
      <h1 className="text-3xl font-black text-[#1A1A1A] mb-2">Politique de confidentialité</h1>
      <p className="text-gray-500 mb-10">
        Le CODES95 s'engage à protéger les données des établissements et des élèves
        qui utilisent la plateforme Passeport Santé.
      </p>

      <div className="space-y-10 text-[15px] leading-relaxed text-gray-700">

        <Section title="1. Responsable de traitement">
          <p>
            Le responsable de traitement est le <strong>CODES95</strong> (Comité Départemental
            d'Éducation pour la Santé du Val-d'Oise), association loi 1901 dont le siège
            social est situé à <strong>Pontoise (95)</strong>.
          </p>
          <p className="mt-3">
            Pour toute question relative à vos données :{" "}
            <a href="mailto:contact@lepasseportsante.fr" className="text-[#1B6B8A] hover:underline">
              contact@lepasseportsante.fr
            </a>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p className="font-semibold text-[#1A1A1A] mb-2">Établissements scolaires</p>
          <p>
            Lors de l'ouverture d'un accès à la plateforme (effectuée par le CODES95),
            les informations suivantes sont enregistrées :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>Nom de l'établissement</li>
            <li>Adresse email de contact de l'établissement</li>
          </ul>
          <p className="mt-3">
            Aucun compte individuel n'est créé pour les enseignants. L'accès est
            attribué par établissement.
          </p>

          <p className="font-semibold text-[#1A1A1A] mt-5 mb-2">Élèves</p>
          <p>
            Les élèves accèdent à la plateforme via un <strong>code de session</strong>{" "}
            fourni par leur enseignant. <strong>Aucune donnée nominative n'est collectée</strong> :
            pas de nom, pas de prénom, pas d'adresse email.
          </p>
          <p className="mt-3">
            Un identifiant anonyme temporaire (<em>guestStudentId</em>) est généré
            automatiquement pour la durée de la session. Il ne permet pas d'identifier
            un élève individuellement.
          </p>
        </Section>

        <Section title="3. Données de santé et réponses au diagnostic">
          <p>
            Le diagnostic Passeport Santé comporte des questions portant sur la santé,
            le bien-être, la nutrition, le sommeil, la sexualité et les usages numériques.
            Ces réponses constituent des <strong>données de nature sensible</strong> au
            sens du RGPD.
          </p>
          <p className="mt-3">
            Elles sont collectées de manière <strong>strictement anonyme</strong>, liées
            à une classe (nom de classe) et non à un élève identifiable. Les résultats
            sont uniquement consultables de façon agrégée par l'établissement et le CODES95,
            dans un but exclusivement pédagogique.
          </p>
        </Section>

        <Section title="4. Finalité et base légale">
          <p>
            Les données sont traitées pour les finalités suivantes :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
            <li>Mise à disposition de la plateforme pédagogique aux établissements partenaires</li>
            <li>Suivi de la progression des élèves au sein d'une session (anonyme)</li>
            <li>Production de statistiques agrégées à destination de l'établissement et du CODES95</li>
          </ul>
          <p className="mt-3">
            La base légale est la <strong>mission d'intérêt général</strong> poursuivie
            par le CODES95 dans le cadre de son activité de prévention en santé publique,
            en partenariat avec les établissements scolaires.
          </p>
        </Section>

        <Section title="5. Durée de conservation">
          <p>
            Les données des établissements sont conservées pendant la durée de la
            relation avec le CODES95 et supprimées sur demande.
          </p>
          <p className="mt-3">
            Les réponses anonymes des élèves (diagnostic et modules) sont conservées
            pendant la durée de l'année scolaire en cours, puis archivées sous forme
            de statistiques agrégées.
          </p>
        </Section>

        <Section title="6. Partage des données">
          <p>
            Les données collectées ne sont <strong>pas transmises à des tiers</strong>{" "}
            à des fins commerciales. Elles peuvent être partagées avec les partenaires
            institutionnels du CODES95 (ARS Île-de-France, Académie de Versailles)
            uniquement sous forme de statistiques agrégées et anonymisées.
          </p>
        </Section>

        <Section title="7. Lecteurs vidéo tiers et cookies">
          <p>
            Certains modules pédagogiques peuvent intégrer des vidéos hébergées par des
            services tiers (<strong>YouTube</strong> et <strong>Vimeo</strong>). Ces services
            sont susceptibles de déposer des cookies et de collecter des données de connexion
            (dont l'adresse IP) lors de la lecture d'une vidéo.
          </p>
          <p className="mt-3">
            Pour protéger votre vie privée, ces vidéos ne sont <strong>pas chargées
            automatiquement</strong> : une vignette s'affiche à la place, et le lecteur tiers
            n'est contacté qu'<strong>après un clic explicite</strong> de votre part sur le
            bouton de lecture. Tant que vous ne cliquez pas, aucune donnée n'est transmise à
            YouTube ou Vimeo.
          </p>
          <p className="mt-3">
            Les vidéos sont en outre intégrées en mode « respect de la vie privée »
            (<em>youtube-nocookie.com</em>, option <em>Do Not Track</em> pour Vimeo), qui
            limite le dépôt de traceurs. La lecture d'une vidéo est soumise aux politiques de
            confidentialité de{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1B6B8A] hover:underline">
              Google/YouTube
            </a>{" "}
            et{" "}
            <a href="https://vimeo.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1B6B8A] hover:underline">
              Vimeo
            </a>.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Le CODES95 met en œuvre les mesures techniques et organisationnelles
            appropriées pour protéger les données contre tout accès non autorisé,
            perte ou divulgation. Les mots de passe des comptes établissements sont
            stockés sous forme hachée.
          </p>
        </Section>

        <Section title="9. Vos droits">
          <p>
            Conformément au RGPD, les établissements disposent d'un droit d'accès,
            de rectification et de suppression de leurs données. Pour exercer ces droits,
            contactez-nous à :{" "}
            <a href="mailto:contact@lepasseportsante.fr" className="text-[#1B6B8A] hover:underline">
              contact@lepasseportsante.fr
            </a>
          </p>
          <p className="mt-3">
            Les données des élèves étant anonymes, l'exercice de ces droits ne s'y
            applique pas (impossibilité technique d'identifier un élève a posteriori).
          </p>
          <p className="mt-3">
            En cas de litige, vous pouvez saisir la{" "}
            <strong>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong>{" "}
            à l'adresse{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#1B6B8A] hover:underline">
              www.cnil.fr
            </a>.
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
