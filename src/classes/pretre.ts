// Prêtre : discipline, sacré, ombre. La baguette compte par son DPS (beaucoup utilisée en montant de niveau).
import type { Specialisation } from './types.ts';

const BILAN_SOINS: Specialisation['bilan'] = [
  ['soins', 'Soins'], ['pds', 'Puissance des sorts'], ['mp5', 'Mana toutes les 5 s'], ['int', 'Intelligence'],
  ['esp', 'Esprit'], ['crit', 'Score de critique'], ['hate', 'Score de hâte'], ['end', 'Endurance'],
];

export const SPECS_PRETRE: Specialisation[] = [
  {
    // Boucliers et soins ; vit de son mana : l'Intelligence pèse presque autant que les soins.
    id: 'discipline', icone: 'spell_holy_wordfortitude', nom: 'Discipline', libelle: 'discipline (soins)', physique: false, armurerie: /discipline/i,
    poids: { soins: 1, pds: 1, int: 0.8, mp5: 1, esp: 0.45, crit: 0.4, hate: 0.6, end: 0.1, dps: 0, dpsDistance: 0.5, armureBase: 0 },
    reliques: /Mot de pouvoir : Bouclier|Infusion de puissance|Feu intérieur|Focalisation|Méditation|Esprit divin|Rénovation|Prière|Soins|guérison/i,
    filtre: ['soins', 'pds', 'int', 'mp5', 'esp', 'crit', 'hate'],
    bilan: BILAN_SOINS,
    note: 'La Discipline vit de son mana : l’Intelligence et le mana toutes les 5 s comptent presque autant que les soins.',
  },
  {
    // Soins ; l'Esprit aide aussi les soins (Direction spirituelle).
    id: 'sacre', icone: 'spell_holy_guardianspirit', nom: 'Sacré', libelle: 'sacré (soins)', physique: false, armurerie: /sacr/i,
    poids: { soins: 1, pds: 1, mp5: 1.1, int: 0.6, esp: 0.6, crit: 0.5, hate: 0.6, end: 0.05, dps: 0, dpsDistance: 0.5, armureBase: 0 },
    reliques: /Soins supérieurs|Soins rapides|Prière de soins|Rénovation|Esprit de rédemption|Direction spirituelle|Châtiment|Flammes sacrées|Soins|guérison/i,
    filtre: ['soins', 'pds', 'mp5', 'int', 'esp', 'crit', 'hate'],
    bilan: BILAN_SOINS,
    note: 'En Sacré, l’Esprit soutient aussi tes soins (Direction spirituelle) : il vaut plus que pour la Discipline.',
  },
  {
    // Tous les sorts d'attaque sont d'Ombre : seule cette école compte.
    id: 'ombre', icone: 'spell_shadow_shadowwordpain', nom: 'Ombre', libelle: 'ombre (dégâts)', physique: false, armurerie: /ombre/i,
    poids: {
      pds: 1, dsorts: 1, dombre: 0.95, int: 0.4, esp: 0.35, crit: 0.4, tou: 1, hate: 0.85, mp5: 0.4, penet: 0.3, end: 0.08,
      dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Mot de l’ombre|Mot de l'ombre|Attaque mentale|Fouet mental|Toucher vampirique|Étreinte vampirique|Forme d’Ombre|Forme d'Ombre|Peste dévorante|Cri psychique/i,
    filtre: ['pds', 'dsorts', 'dombre', 'int', 'esp', 'tou', 'hate', 'crit'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dombre', 'Dégâts d’Ombre'], ['int', 'Intelligence'], ['esp', 'Esprit'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'], ['crit', 'Score de critique']],
    note: 'Tous tes sorts d’attaque sont d’Ombre : les dégâts d’Ombre valent presque la puissance des sorts.',
  },
];
