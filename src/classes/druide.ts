// Druide : félin, ours, équilibre, restauration.
import type { Specialisation } from './types.ts';

export const SPECS_DRUIDE: Specialisation[] = [
  {
    // 1 Force = 2 PA, l'Agilité donne PA et critique, toucher et expertise un cran au-dessus.
    // Sur Forever, le DPS de l'arme compte en forme animale : environ 14 PA par point de DPS.
    id: 'chat', nom: 'Félin', libelle: 'félin (dégâts)', physique: true, armurerie: /farouche/i,
    poids: {
      agi: 2.2, for: 2, pa: 1, crit: 2, tou: 2.5, exp: 2, hate: 1.5, end: 0.6, armure: 0.1, esq: 1, def: 0.5,
      int: 0.05, esp: 0.02, pa_mv: 0.3, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.15, dps: 14, armureBase: 0,
    },
    reliques: /félin|forme de chat|Griffe|Lambeau|Mutilation|Déchiqueter|Déchirure|Rugissement sauvage|Morsure féroce|énergie|Griffure|Changeforme/i,
    filtre: ['agi', 'for', 'pa', 'crit', 'tou', 'exp', 'hate', 'end'],
    bilan: [['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte']],
    note: '',
  },
  {
    // Endurance, Agilité et armure d'abord, puis défense et esquive.
    id: 'ours', nom: 'Ours', libelle: 'ours (tank)', physique: true, armurerie: /farouche/i,
    poids: {
      end: 1.6, agi: 1.6, for: 1, armure: 0.12, def: 1.5, esq: 2, par: 1, pa: 0.5, crit: 0.6, tou: 1.2, exp: 1.5, hate: 0.5,
      esp: 0.02, int: 0.05, pa_mv: 0.15, pa_hum: 0.2, pa_bete: 0.2, pa_dem: 0.08,
      rfeu: 0.1, rgivre: 0.1, rombre: 0.1, rnature: 0.1, rarcane: 0.1, dps: 6, armureBase: 0.12,
    },
    // \b : sans lui, « ours » reconnaît aussi « pour » et « course », « rage » aussi « courage ».
    reliques: /\bours\b|Mutilation|Rossée|Mutiler|\brage\b|Sauvagerie|Pilonnage|Lacérer|Rugissement démoralisant|Changeforme/i,
    filtre: ['end', 'agi', 'for', 'armure', 'def', 'esq', 'tou', 'exp'],
    bilan: [['end', 'Endurance'], ['agi', 'Agilité'], ['for', 'Force'], ['def', 'Défense'], ['esq', 'Score d’esquive'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['pa', 'Puissance d’attaque']],
    note: 'En ours, la forme multiplie l’armure : vise l’Endurance et l’armure.',
  },
  {
    // Puissance des sorts ; Colère est de Nature, Feu stellaire et Éclat lunaire d'Arcanes.
    // Les scores (critique, toucher, hâte) sont communs aux attaques et aux sorts sur Forever.
    id: 'equilibre', nom: 'Équilibre', libelle: 'équilibre (sorts)', physique: false, armurerie: /équilibre/i,
    poids: {
      pds: 1, dsorts: 0.95, dnature: 0.5, darcane: 0.5, int: 0.45, crit: 0.8, tou: 0.9, hate: 0.8, mp5: 0.6,
      esp: 0.1, penet: 0.3, end: 0.05, dps: 0, armureBase: 0,
    },
    reliques: /Colère|Feu stellaire|Éclat lunaire|Essaim d|Ouragan|Lucioles|sélén|Sarments|Racines|Esprit/i,
    filtre: ['pds', 'dsorts', 'dnature', 'darcane', 'int', 'crit', 'tou', 'hate', 'mp5'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dnature', 'Dégâts de Nature'], ['darcane', 'Dégâts des Arcanes'], ['int', 'Intelligence'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'], ['mp5', 'Mana toutes les 5 s'], ['esp', 'Esprit']],
    note: 'Colère profite des dégâts de Nature, Feu stellaire et Éclat lunaire de ceux des Arcanes ; la puissance des sorts sert aux deux.',
  },
  {
    // Soins et puissance des sorts, puis mana (mana/5, Intelligence, Esprit).
    id: 'resto', nom: 'Restauration', libelle: 'restauration (soins)', physique: false, armurerie: /restauration/i,
    poids: { soins: 1, pds: 1, mp5: 1.2, int: 0.6, esp: 0.45, crit: 0.4, hate: 0.6, end: 0.05, dps: 0, armureBase: 0 },
    reliques: /Toucher guérisseur|Récupération|Rétablissement|Prompte guérison|Tranquillité|soin|guérison|Régénération|Croissance|Esprit/i,
    filtre: ['soins', 'pds', 'mp5', 'int', 'esp', 'crit', 'hate'],
    bilan: [['soins', 'Soins'], ['pds', 'Puissance des sorts'], ['mp5', 'Mana toutes les 5 s'], ['int', 'Intelligence'], ['esp', 'Esprit'], ['crit', 'Score de critique'], ['hate', 'Score de hâte'], ['end', 'Endurance']],
    note: 'Les soins et la puissance des sorts comptent autant ; le mana toutes les 5 s et l’Intelligence font tenir les longs combats.',
  },
];
