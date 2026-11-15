// Voleur : assassinat, combat, finesse. Toujours deux armes.
// L'Agilité donne PA et critique, la Force 1 PA ; environ 14 PA par point de DPS de l'arme de main droite.
import type { Stat } from '../types.ts';
import type { Specialisation } from './types.ts';

const BILAN: [Stat, string][] = [
  ['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'],
  ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte'],
];
const FILTRE: Stat[] = ['agi', 'for', 'pa', 'crit', 'tou', 'exp', 'hate', 'end'];
const BASE = {
  agi: 2, for: 1, pa: 1, crit: 2, tou: 2.5, exp: 2.2, hate: 1.6, end: 0.4, armure: 0.02,
  pa_mv: 0.3, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.15, dps: 14, dpsDistance: 1, armureBase: 0,
};
const DAGUE = 15;

export const SPECS_VOLEUR: Specialisation[] = [
  {
    id: 'assassinat', nom: 'Assassinat', libelle: 'assassinat (dégâts)', physique: true, armurerie: /assassinat/i,
    ambidextre: true, armesMain: [DAGUE],
    poids: { ...BASE, crit: 2.2 },
    reliques: /Attaque sournoise|Mutilation|Embuscade|Éviscération|Envenimer|Poison|Rupture|Garrot|Frappe fatale|Coup bas|énergie|points de combo/i,
    filtre: FILTRE, bilan: BILAN,
    note: 'Attaque sournoise et Embuscade demandent une dague en main droite : la fiche n’en propose pas d’autre.',
  },
  {
    id: 'combat', nom: 'Combat', libelle: 'combat (dégâts)', physique: true, armurerie: /combat/i, ambidextre: true,
    poids: { ...BASE, exp: 2.4, hate: 1.8 },
    reliques: /Attaque pernicieuse|Éviscération|Déluge de lames|Riposte|Poussée d’adrénaline|Coup de pied|Feinte|énergie|points de combo/i,
    filtre: FILTRE, bilan: BILAN,
    note: 'Attaque pernicieuse frappe avec l’arme de main droite : une arme lente et puissante y vaut le plus.',
  },
  {
    id: 'finesse', nom: 'Finesse', libelle: 'finesse (dégâts)', physique: true, armurerie: /finesse/i,
    ambidextre: true, armesMain: [DAGUE],
    poids: { ...BASE, agi: 2.2 },
    reliques: /Embuscade|Attaque sournoise|Hémorragie|Camouflage|Préparation|Assommer|Coup bas|Cécité|Disparition|énergie|points de combo/i,
    filtre: FILTRE, bilan: BILAN,
    note: 'Embuscade et Attaque sournoise demandent une dague en main droite : la fiche n’en propose pas d’autre.',
  },
];
