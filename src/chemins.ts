/** Chemin d'un fichier de public/ (données, icônes), valable quelle que soit la page (/druide/objets…). */
export function cheminPublic(fichier: string): string {
  return `${import.meta.env.BASE_URL}${fichier}`;
}
