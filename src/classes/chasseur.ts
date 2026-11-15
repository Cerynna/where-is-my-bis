// Chasseur : maîtrise des bêtes, précision, survie.
// L'arme à distance fait l'essentiel des dégâts (environ 14 PA à distance par point de DPS) ;
// les armes de mêlée ne servent presque que pour leurs stats.
import type { Stat } from '../types.ts';
import type { Specialisation } from './types.ts';

const RELIQUES = /Visée|Tir des arcanes|Tir multiple|Tir assuré|Tir automatique|Morsure de serpent|Piqûre|Marque du chasseur|Aspect|familier|Courroux bestial|Intimidation|Tir de dispersion|Contre-attaque|Morsure de la mangouste|Coupure d’ailes|flèches|balles|munitions|à distance/i;
const BILAN: [Stat, string][] = [
  ['agi', 'Agilité'], ['pa', 'Puissance d’attaque'], ['pad', 'PA à distance'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'],
  ['hate', 'Score de hâte'], ['end', 'Endurance'], ['int', 'Intelligence'], ['mp5', 'Mana toutes les 5 s'],
];
const FILTRE: Stat[] = ['agi', 'pa', 'crit', 'tou', 'hate', 'int', 'end'];
// Tir automatique, Visée et les autres tirs exigent un arc (2), un fusil (3) ou une arbalète (18) : pas d'arme de jet.
const TIR = [2, 3, 18];
const BASE = {
  pa: 1, pad: 1, end: 0.4, int: 0.4, mp5: 0.3, for: 0.1, esp: 0.05, pa_bete: 0.3, pa_hum: 0.3, pa_mv: 0.2, pa_dem: 0.1,
  dps: 0.4, dpsDistance: 14, armureBase: 0,
};

export const SPECS_CHASSEUR: Specialisation[] = [
  {
    id: 'betes', icone: 'ability_hunter_beasttaming', nom: 'Maîtrise des bêtes', libelle: 'maîtrise des bêtes (dégâts)', physique: true, armurerie: /b[êe]tes/i, ambidextre: true, armesDistance: TIR,
    poids: { ...BASE, agi: 2.2, crit: 1.6, tou: 2.2, hate: 1.5 },
    reliques: RELIQUES, filtre: FILTRE, bilan: BILAN,
    note: 'Ton arme à distance fait l’essentiel des dégâts : son DPS compte autant que l’Agilité. Les armes de mêlée ne servent que pour leurs stats.',
  },
  {
    id: 'precision', icone: 'ability_marksmanship', nom: 'Précision', libelle: 'précision (dégâts)', physique: true, armurerie: /pr[ée]cision/i, ambidextre: true, armesDistance: TIR,
    poids: { ...BASE, agi: 2.2, crit: 1.9, tou: 2.3, hate: 1.4 },
    reliques: RELIQUES, filtre: FILTRE, bilan: BILAN,
    note: 'Visée et Tir des arcanes partent de ton arme à distance : son DPS d’abord, puis l’Agilité, le toucher et le critique.',
  },
  {
    id: 'survie', icone: 'ability_hunter_swiftstrike', nom: 'Survie', libelle: 'survie (dégâts)', physique: true, armurerie: /survie/i, ambidextre: true, armesDistance: TIR,
    poids: { ...BASE, agi: 2.6, crit: 1.7, tou: 2.2, hate: 1.4, end: 0.6 },
    reliques: RELIQUES, filtre: FILTRE, bilan: BILAN,
    note: 'La Survie tire plus de l’Agilité que les deux autres spés ; ton arme à distance reste la pièce la plus importante.',
  },
];
