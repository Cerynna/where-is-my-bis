import { cheminPublic } from '../chemins.ts';
import type { Specialisation } from '../classes/types.ts';

/** Icône d'une spécialisation (arbre de talents du jeu). Décorative : le nom de la spé l'accompagne toujours. */
export function IconeSpe({ spe, taille = 20 }: { spe: Specialisation; taille?: number }) {
  return (
    <img className="icone-spe" src={cheminPublic(`icons/specs/${spe.icone}.jpg`)} alt="" width={taille} height={taille} loading="lazy" decoding="async" />
  );
}
