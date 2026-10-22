// Code de département déduit d'un code postal français :
//  - métropole : 2 premiers chiffres ("54000" → "54") ;
//  - Corse : 200xx-201xx → "2A", 202xx-206xx → "2B" ;
//  - outre-mer : 3 premiers chiffres ("97100" → "971").
// Renvoie null si le code postal n'a pas le bon format.
export function departmentFromPostalCode(postalCode: string): string | null {
  const cp = postalCode.trim();
  if (!/^\d{5}$/.test(cp)) return null;
  if (cp.startsWith("97") || cp.startsWith("98")) return cp.slice(0, 3);
  if (cp.startsWith("20")) return Number(cp.slice(0, 3)) < 202 ? "2A" : "2B";
  return cp.slice(0, 2);
}
