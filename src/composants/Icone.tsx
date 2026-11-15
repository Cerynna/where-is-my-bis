import type { Objet } from '../types.ts';
import { cheminPublic } from '../chemins.ts';

export function Icone({ objet, petite }: { objet: Objet; petite?: boolean }) {
  // Icône locale (public/icons) pour les objets de la base, adresse de l'armurerie pour les autres objets portés.
  const url = objet.icone ? (objet.icone.startsWith('http') ? objet.icone : cheminPublic(`icons/${objet.icone}.jpg`)) : undefined;
  return (
    <span
      className={`icone q${objet.q}${petite ? ' petite' : ''}`}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
      aria-hidden="true"
    />
  );
}
