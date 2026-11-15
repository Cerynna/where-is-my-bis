// Guerrier : armes, fureur, protection.
// La Force donne 2 PA, l'Agilité du critique et de l'armure ; environ 14 PA par point de DPS d'arme
// (Frappe mortelle, Sanguinaire et Exécution dépendent de l'arme).
import type { Stat } from '../types.ts';
import type { Specialisation } from './types.ts';

const PA_CIBLES = { pa_mv: 0.3, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.15 };
const BILAN_DEGATS: [Stat, string][] = [
  ['for', 'Force'], ['agi', 'Agilité'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'],
  ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte'],
];

export const SPECS_GUERRIER: Specialisation[] = [
  {
    id: 'armes', nom: 'Armes', libelle: 'armes (dégâts)', physique: true, armurerie: /armes/i,
    poids: {
      for: 2, agi: 1, pa: 1, crit: 2.2, tou: 2.5, exp: 2.2, hate: 1.5, end: 0.4, armure: 0.02, ...PA_CIBLES,
      dps: 14, dpsDistance: 1, armureBase: 0,
    },
    reliques: /Frappe mortelle|Frappe héroïque|Exécution|Tourbillon|Pourfendre|Brise-genou|Fulgurance|Coup de tonnerre|Cri de guerre|Charge|Interception|\brage\b/i,
    filtre: ['for', 'agi', 'pa', 'crit', 'tou', 'exp', 'hate', 'end'],
    bilan: BILAN_DEGATS,
    note: 'Frappe mortelle et Exécution frappent avec ton arme : une arme à deux mains lente et puissante d’abord, puis la Force, le toucher et le critique.',
  },
  {
    id: 'fureur', nom: 'Fureur', libelle: 'fureur (dégâts)', physique: true, armurerie: /fureur/i, ambidextre: true,
    poids: {
      for: 2, agi: 1, pa: 1, crit: 2.3, tou: 2.6, exp: 2.2, hate: 1.7, end: 0.4, armure: 0.02, ...PA_CIBLES,
      dps: 14, dpsDistance: 1, armureBase: 0,
    },
    reliques: /Sanguinaire|Tourbillon|Frappe héroïque|Enchaînement|Exécution|Ivresse de la victoire|Ambidextrie|Fureur|Cri de guerre|\brage\b/i,
    filtre: ['for', 'agi', 'pa', 'crit', 'tou', 'exp', 'hate', 'end'],
    bilan: BILAN_DEGATS,
    note: 'En Fureur, tu tapes avec deux armes : celle de main gauche ne frappe qu’à moitié, mais ses stats comptent en entier.',
  },
  {
    id: 'protection', nom: 'Protection', libelle: 'protection (tank)', physique: true, armurerie: /protection/i,
    poids: {
      end: 1.6, def: 1.5, esq: 1.6, par: 1.3, sbloc: 1, blocage: 0.6, armure: 0.1, for: 0.6, agi: 0.8, tou: 1, exp: 1, pa: 0.2,
      crit: 0.3, hate: 0.3, rfeu: 0.1, rgivre: 0.1, rombre: 0.1, rnature: 0.1, rarcane: 0.1, dps: 3, dpsDistance: 0.3, armureBase: 0.1,
    },
    reliques: /Heurt de bouclier|Vengeance|Maîtrise du blocage|Mur protecteur|Provocation|Fracasser armure|Coup de tonnerre|blocage|bloquer|parer|parade|défense|menace/i,
    filtre: ['end', 'def', 'esq', 'par', 'blocage', 'armure', 'tou', 'exp'],
    bilan: [['end', 'Endurance'], ['def', 'Défense'], ['esq', 'Score d’esquive'], ['par', 'Score de parade'], ['blocage', 'Valeur de blocage'], ['for', 'Force'], ['agi', 'Agilité'], ['tou', 'Score de toucher']],
    note: 'En tank, l’Endurance, la défense et l’esquive passent avant les dégâts ; l’armure du bouclier compte beaucoup.',
  },
];
