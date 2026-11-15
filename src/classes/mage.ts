// Mage : arcanes, feu, givre. Tout passe par les sorts : puissance des sorts, dégâts de l'école de la spé,
// puis les scores (communs aux attaques et aux sorts sur Forever), l'Intelligence et le mana.
// La baguette compte un peu par son DPS (on s'en sert beaucoup en montant de niveau).
import type { Stat } from '../types.ts';
import type { Specialisation } from './types.ts';

const BILAN_COMMUN: [Stat, string][] = [
  ['int', 'Intelligence'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'],
  ['mp5', 'Mana toutes les 5 s'], ['esp', 'Esprit'],
];

export const SPECS_MAGE: Specialisation[] = [
  {
    // Gros consommateur de mana : Intelligence, Esprit et mana/5 pèsent plus qu'en Feu ou en Givre.
    // Chaque spé ne compte que les dégâts de son école : pas de Givre ni de Feu ici.
    id: 'arcanes', icone: 'spell_holy_magicalsentry', nom: 'Arcanes', libelle: 'arcanes (dégâts)', physique: false, armurerie: /arcane/i,
    poids: {
      pds: 1, dsorts: 1, darcane: 0.85, int: 0.7, esp: 0.3, mp5: 0.7, crit: 0.7, tou: 1, hate: 0.9,
      penet: 0.3, end: 0.05, dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Projectiles des Arcanes|Explosion des Arcanes|Déflagration des Arcanes|Puissance des Arcanes|Intelligence des Arcanes|Évocation|Bouclier de mana|Présence spirituelle|Métamorphose|Transfert|Contresort/i,
    filtre: ['pds', 'dsorts', 'darcane', 'int', 'esp', 'mp5', 'crit', 'tou', 'hate'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['darcane', 'Dégâts des Arcanes'], ...BILAN_COMMUN],
    note: 'Les Arcanes vident vite la barre de mana : l’Intelligence, l’Esprit et le mana toutes les 5 s comptent plus qu’en Feu ou en Givre.',
  },
  {
    // Presque tous les sorts sont de Feu ; le critique pèse plus (Enflammer prolonge les coups critiques).
    id: 'feu', icone: 'spell_fire_firebolt02', nom: 'Feu', libelle: 'feu (dégâts)', physique: false, armurerie: /feu/i,
    poids: {
      pds: 1, dsorts: 1, dfeu: 0.95, int: 0.4, esp: 0.1, mp5: 0.4, crit: 0.95, tou: 1, hate: 0.8,
      penet: 0.3, end: 0.05, dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Boule de feu|Explosion pyrotechnique|Brûlure|Trait de feu|Choc de flammes|Vague explosive|Souffle du dragon|Combustion|Enflammer|Gardien contre le feu/i,
    filtre: ['pds', 'dsorts', 'dfeu', 'int', 'crit', 'tou', 'hate', 'mp5'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dfeu', 'Dégâts de Feu'], ...BILAN_COMMUN],
    note: 'Presque tous tes sorts sont de Feu : les dégâts de Feu valent presque la puissance des sorts, et le critique compte plus qu’ailleurs.',
  },
  {
    // Éclair de givre, Cône de froid, Blizzard : dégâts de Givre ; un peu plus d'Endurance pour survivre en solo.
    id: 'givre', icone: 'spell_frost_frostbolt02', nom: 'Givre', libelle: 'givre (dégâts)', physique: false, armurerie: /givre/i,
    poids: {
      pds: 1, dsorts: 1, dgivre: 0.95, int: 0.4, esp: 0.1, mp5: 0.4, crit: 0.75, tou: 1, hate: 0.85,
      penet: 0.3, end: 0.08, dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Éclair de givre|Cône de froid|Blizzard|Nova de givre|Armure de givre|Armure de glace|Barrière de glace|Javelot de glace|Bloc de glace|Morsure du froid|Gardien contre le givre/i,
    filtre: ['pds', 'dsorts', 'dgivre', 'int', 'crit', 'tou', 'hate', 'mp5'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dgivre', 'Dégâts de Givre'], ...BILAN_COMMUN],
    note: 'Éclair de givre, Cône de froid et Blizzard profitent des dégâts de Givre ; la puissance des sorts sert à tout.',
  },
];
