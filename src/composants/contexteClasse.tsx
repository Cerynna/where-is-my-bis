import { createContext, useContext } from 'react';
import type { Classe, Specialisation } from '../classes/types.ts';

/** Classe de la page et spécialisation choisie, lues par la fiche, les listes et l'infobulle. */
export const ContexteClasse = createContext<{ classe: Classe; spe: Specialisation } | null>(null);

export function useClasse(): { classe: Classe; spe: Specialisation } {
  const c = useContext(ContexteClasse);
  if (!c) throw new Error('useClasse hors d’une page de classe');
  return c;
}
