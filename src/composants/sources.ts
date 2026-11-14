import type { Source } from '../types.ts';

/** Texte lisible d'une provenance : lieu principal et précision. */
export function texteSource(s: Source): { lieu: string; detail?: string } {
  switch (s.type) {
    case 'quete': {
      const extra = [s.niveau ? `niv. ${s.niveau}` : '', s.faction ?? ''].filter(Boolean).join(', ');
      const zone = s.lieu || 'Récompense de quête';
      return { lieu: `Quête « ${s.detail ?? '?'} »`, detail: `${zone}${extra ? ` (${extra})` : ''}` };
    }
    case 'monde':
      return { lieu: 'Butin du monde', detail: 'à guetter à l’hôtel des ventes' };
    case 'inconnue':
      return { lieu: 'Provenance pas encore révélée', detail: 'déjà trouvé en jeu' };
    case 'metier':
      return { lieu: s.lieu, detail: s.detail };
    default:
      return { lieu: s.lieu, detail: [s.detail, s.faction].filter(Boolean).join(', ') || undefined };
  }
}
