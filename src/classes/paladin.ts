// Paladin : sacré, protection, vindicte.
import type { Specialisation } from './types.ts';

export const SPECS_PALADIN: Specialisation[] = [
  {
    // Soins et puissance des sorts ; le critique rend du mana (Illumination), l'Intelligence pèse plus que l'Esprit.
    id: 'sacre', nom: 'Sacré', libelle: 'sacré (soins)', physique: false, armurerie: /sacr/i,
    poids: { soins: 1, pds: 1, int: 0.8, mp5: 1, crit: 0.6, hate: 0.5, esp: 0.25, end: 0.05, dps: 0, armureBase: 0 },
    reliques: /Lumière sacrée|Éclair lumineux|Horion sacré|Imposition des mains|Illumination|Purification|Faveur divine|Bénédiction de lumière|soin|guérison/i,
    filtre: ['soins', 'pds', 'int', 'mp5', 'crit', 'hate'],
    bilan: [['soins', 'Soins'], ['pds', 'Puissance des sorts'], ['int', 'Intelligence'], ['mp5', 'Mana toutes les 5 s'], ['crit', 'Score de critique'], ['hate', 'Score de hâte'], ['esp', 'Esprit'], ['end', 'Endurance']],
    note: 'Le critique de tes soins te rend du mana (Illumination) : l’Intelligence et le critique valent plus que l’Esprit.',
  },
  {
    // Tank : Endurance, défense, évitement et blocage ; la menace vient de la magie du Sacré.
    id: 'protection', nom: 'Protection', libelle: 'protection (tank)', physique: true, armurerie: /protection/i,
    poids: {
      end: 1.5, def: 1.5, esq: 1.5, par: 1.2, sbloc: 1, blocage: 0.7, armure: 0.1, for: 0.5, agi: 0.7, tou: 0.8, exp: 0.8,
      pds: 0.4, dsacre: 0.35, int: 0.3, mp5: 0.3, crit: 0.2, rfeu: 0.1, rgivre: 0.1, rombre: 0.1, rnature: 0.1, rarcane: 0.1,
      dps: 3, armureBase: 0.1,
    },
    reliques: /Bouclier sacré|Consécration|Fureur vertueuse|Aura de dévotion|Bénédiction du sanctuaire|Bouclier du vengeur|Sceau de vertu|blocage|bloquer|parer|parade|défense|menace/i,
    filtre: ['end', 'def', 'esq', 'par', 'blocage', 'pds', 'armure'],
    bilan: [['end', 'Endurance'], ['def', 'Défense'], ['esq', 'Score d’esquive'], ['par', 'Score de parade'], ['blocage', 'Valeur de blocage'], ['pds', 'Puissance des sorts'], ['dsacre', 'Dégâts du Sacré'], ['int', 'Intelligence']],
    note: 'Ta menace vient de la magie du Sacré (Consécration, Bouclier sacré) : la puissance des sorts compte un peu, après l’Endurance et la défense.',
  },
  {
    // Arme à deux mains lente : environ 14 PA par point de DPS ; les sceaux ajoutent des dégâts du Sacré.
    id: 'vindicte', nom: 'Vindicte', libelle: 'vindicte (dégâts)', physique: true, armurerie: /vindicte/i,
    poids: {
      for: 2, agi: 1, pa: 1, crit: 2, tou: 2.3, exp: 2, hate: 1.4, end: 0.4, int: 0.2, mp5: 0.15, pds: 0.3, dsacre: 0.3,
      pa_mv: 0.4, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.3, dps: 14, armureBase: 0,
    },
    reliques: /Sceau|Jugement|Croisé|Exorcisme|Marteau de courroux|Vindicte|Bénédiction de puissance|Aura de vindicte|Inquisition/i,
    filtre: ['for', 'agi', 'pa', 'crit', 'tou', 'exp', 'hate'],
    bilan: [['for', 'Force'], ['agi', 'Agilité'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte']],
    note: 'Une arme à deux mains lente et puissante d’abord ; tes sceaux et tes jugements ajoutent des dégâts du Sacré.',
  },
];
