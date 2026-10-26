// Mélange « stable » des propositions d'un mini-jeu.
//
// Les contenus sont souvent saisis avec la bonne réponse en premier : affichés
// tels quels, les élèves repèrent vite qu'il suffit de cliquer sur la première.
// On mélange donc l'ordre d'affichage, mais de façon déterministe (même ordre
// côté serveur et côté navigateur, donc pas de décalage d'hydratation ni de
// propositions qui sautent à l'écran). La correction ne dépend jamais de la
// position : chaque jeu compare des identifiants ou des valeurs.

// Hachage 32 bits bien réparti (FNV-1a + mélange final de MurmurHash3) : deux
// clés proches ("opt-1", "opt-2") donnent des valeurs sans rapport, ce qui
// évite de retrouver l'ordre de saisie.
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

// `salt` doit différer d'une question à l'autre (id ou texte de la question) :
// sans lui, des questions dont les propositions ont les mêmes ids seraient
// toutes mélangées pareil, et la bonne réponse retomberait au même rang.
export function stableShuffle<T>(items: readonly T[], keyOf: (item: T) => string, salt: string): T[] {
  return items
    .map((item) => ({ item, rank: hash32(`${salt}\u0000${keyOf(item)}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
}
