// Démoniste : affliction, démonologie, destruction. La baguette compte par son DPS.
// Connexion rend du mana contre de la vie : l'Endurance compte un peu plus que pour le mage.
import type { Stat } from '../types.ts';
import type { Specialisation } from './types.ts';

const BILAN_OMBRE: [Stat, string][] = [
  ['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dombre', 'Dégâts d’Ombre'], ['int', 'Intelligence'],
  ['end', 'Endurance'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'], ['crit', 'Score de critique'],
];

export const SPECS_DEMONISTE: Specialisation[] = [
  {
    // Sorts d'Ombre à effet sur la durée : le critique compte peu.
    id: 'affliction', icone: 'spell_shadow_deathcoil', nom: 'Affliction', libelle: 'affliction (dégâts)', physique: false, armurerie: /affliction/i,
    poids: {
      pds: 1, dsorts: 1, dombre: 0.95, int: 0.35, end: 0.2, esp: 0.15, crit: 0.4, tou: 1, hate: 0.8, mp5: 0.3, penet: 0.3,
      dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Corruption|Malédiction|Siphon de vie|Drain|Trait de l’ombre|Trait de l'ombre|Hurlement de terreur|Affliction instable|Connexion|Siphon d’âme|Graine de corruption/i,
    filtre: ['pds', 'dsorts', 'dombre', 'int', 'end', 'tou', 'hate'],
    bilan: BILAN_OMBRE,
    note: 'Tes sorts d’affliction sont d’Ombre et frappent sur la durée : le critique compte peu, le toucher et la hâte beaucoup.',
  },
  {
    // Ombre aussi ; l'Endurance profite de l'Étreinte démoniaque, et le démon hérite d'une part de tes stats.
    id: 'demonologie', icone: 'spell_shadow_metamorphosis', nom: 'Démonologie', libelle: 'démonologie (dégâts)', physique: false, armurerie: /d[ée]monologie/i,
    poids: {
      pds: 1, dsorts: 1, dombre: 0.9, int: 0.4, end: 0.3, esp: 0.1, crit: 0.6, tou: 1, hate: 0.8, mp5: 0.3, penet: 0.3,
      dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Démon|démoniaque|familier|Diablotin|Marcheur du Vide|Succube|Chasseur corrompu|Gangregarde|Pierre de soins|Pierre d’âme|Lien spirituel|Sacrifice|Trait de l’ombre|Trait de l'ombre/i,
    filtre: ['pds', 'dsorts', 'dombre', 'int', 'end', 'tou', 'hate', 'crit'],
    bilan: BILAN_OMBRE,
    note: 'Ton démon hérite d’une partie de tes stats, et l’Étreinte démoniaque augmente ton Endurance : elle compte un peu plus ici.',
  },
  {
    // Trait de l'ombre (Ombre) et Immolation, Feu de l'âme, Conflagration (Feu) : les deux écoles sont celles de la spé.
    id: 'destruction', icone: 'spell_shadow_rainoffire', nom: 'Destruction', libelle: 'destruction (dégâts)', physique: false, armurerie: /destruction/i,
    poids: {
      pds: 1, dsorts: 1, dombre: 0.7, dfeu: 0.6, int: 0.35, end: 0.2, esp: 0.1, crit: 0.95, tou: 1, hate: 0.8, mp5: 0.3, penet: 0.3,
      dps: 0, dpsDistance: 0.6, armureBase: 0,
    },
    reliques: /Trait de l’ombre|Trait de l'ombre|Immolation|Incinérer|Douleur brûlante|Pluie de feu|Feu de l’âme|Feu de l'âme|Conflagration|Brûlure de l’ombre|Brûlure de l'ombre|Flammes infernales|Embrasement/i,
    filtre: ['pds', 'dsorts', 'dombre', 'dfeu', 'int', 'crit', 'tou', 'hate'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dombre', 'Dégâts d’Ombre'], ['dfeu', 'Dégâts de Feu'], ['int', 'Intelligence'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte']],
    note: 'La Destruction lance Trait de l’ombre (Ombre) et Immolation, Feu de l’âme, Conflagration (Feu) : les deux écoles comptent, le critique aussi.',
  },
];
