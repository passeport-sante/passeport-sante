// Année scolaire d'une date, au format "2026-2027". Elle bascule au 1er août :
// une session préparée fin août compte déjà pour la rentrée qui arrive.
// Le même calcul sert au remplissage des sessions existantes dans la migration
// 20261019110000_session_school_year : les garder alignés.
export function schoolYearOf(date: Date = new Date()): string {
  const year = date.getFullYear();
  const start = date.getMonth() >= 7 ? year : year - 1;
  return `${start}-${start + 1}`;
}
