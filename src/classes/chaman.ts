// Chaman : élémentaire, amélioration, restauration. Sur Forever, le chaman a l'ambidextrie.
import type { Specialisation } from './types.ts';

export const SPECS_CHAMAN: Specialisation[] = [
  {
    // Éclair et Chaîne d'éclairs sont de Nature : seule cette école compte.
    id: 'elementaire', icone: 'spell_nature_lightning', nom: 'Élémentaire', libelle: 'élémentaire (sorts)', physique: false, armurerie: /l[ée]mentaire/i,
    poids: {
      pds: 1, dsorts: 1, dnature: 0.9, int: 0.5, crit: 0.85, tou: 1, hate: 0.8, mp5: 0.6, esp: 0.1, penet: 0.3, end: 0.05,
      dps: 0, armureBase: 0,
    },
    reliques: /Éclair|Chaîne d’éclairs|Chaîne d'éclairs|Horion|Totem de magma|Totem incendiaire|Nova de feu|Maîtrise élémentaire|Fureur des éléments|Foudre/i,
    filtre: ['pds', 'dsorts', 'dnature', 'int', 'crit', 'tou', 'hate', 'mp5'],
    bilan: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dnature', 'Dégâts de Nature'], ['int', 'Intelligence'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'], ['mp5', 'Mana toutes les 5 s']],
    note: 'Éclair et Chaîne d’éclairs sont de Nature : les dégâts de Nature valent presque la puissance des sorts.',
  },
  {
    // Mêlée : Force (2 PA), Agilité, arme(s) ; un peu d'Intelligence pour les horions.
    id: 'amelioration', icone: 'spell_nature_lightningshield', nom: 'Amélioration', libelle: 'amélioration (dégâts)', physique: true, armurerie: /am[ée]lioration/i, ambidextre: true,
    poids: {
      for: 2, agi: 1.6, pa: 1, crit: 1.8, tou: 2.2, exp: 1.8, hate: 1.4, int: 0.4, end: 0.4, pds: 0.2, mp5: 0.2,
      pa_mv: 0.3, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.15, dps: 14, armureBase: 0,
    },
    reliques: /Frappe-tempête|Furie-des-vents|Langue de feu|Croque-roc|Arme de givre|Horion|Rage du chaman|Totem de force de la terre|Totem Grâce de l’air|Totem Furie-des-vents|Rapidité|attaque/i,
    filtre: ['for', 'agi', 'pa', 'crit', 'tou', 'exp', 'hate', 'int'],
    bilan: [['for', 'Force'], ['agi', 'Agilité'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['int', 'Intelligence']],
    note: 'Sur Forever, le chaman peut porter deux armes : la fiche compare deux armes à une main à une arme à deux mains.',
  },
  {
    id: 'restauration', icone: 'spell_nature_magicimmunity', nom: 'Restauration', libelle: 'restauration (soins)', physique: false, armurerie: /restauration/i,
    poids: { soins: 1, pds: 1, mp5: 1.2, int: 0.7, esp: 0.3, crit: 0.5, hate: 0.6, end: 0.05, dps: 0, armureBase: 0 },
    reliques: /Vague de soins|Salve de guérison|Bouclier de terre|Totem guérisseur|Totem Fontaine de mana|Rapidité de la nature|Flots|soin|guérison/i,
    filtre: ['soins', 'pds', 'mp5', 'int', 'esp', 'crit', 'hate'],
    bilan: [['soins', 'Soins'], ['pds', 'Puissance des sorts'], ['mp5', 'Mana toutes les 5 s'], ['int', 'Intelligence'], ['esp', 'Esprit'], ['crit', 'Score de critique'], ['hate', 'Score de hâte'], ['end', 'Endurance']],
    note: 'Le mana toutes les 5 s compte plus que l’Esprit : tu soignes beaucoup sans t’arrêter de lancer des sorts.',
  },
];
