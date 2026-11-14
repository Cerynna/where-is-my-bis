// Format des données servies au site (public/data/objets.json).
// Partagé entre les scripts qui les génèrent et l'interface qui les lit.

export type Emplacement =
  | 'tete' | 'cou' | 'epaules' | 'dos' | 'torse' | 'poignets'
  | 'mains' | 'taille' | 'jambes' | 'pieds' | 'doigt' | 'bijou'
  | 'arme2m' | 'arme1m' | 'relique';

export type Stat =
  | 'agi' | 'for' | 'end' | 'int' | 'esp'
  | 'pa' | 'crit' | 'tou' | 'hate' | 'exp' | 'def' | 'esq' | 'par' | 'armure' | 'blocage'
  | 'pa_mv' | 'pa_hum' | 'pa_bete' | 'pa_dem'
  | 'pds' | 'soins' | 'dsorts' | 'mp5' | 'vie5'
  | 'rfeu' | 'rgivre' | 'rombre' | 'rnature' | 'rarcane';

export type TypeSource =
  | 'donjon' | 'raid' | 'quete' | 'metier' | 'rep' | 'jcj' | 'vendeur' | 'monde' | 'inconnue' | 'autre';

export type Faction = 'Alliance' | 'Horde';

export interface Source {
  type: TypeSource;
  /** Lieu principal : donjon, zone de la quête, métier, faction… */
  lieu: string;
  /** Précision : boss, nom de la quête, rang de réputation… */
  detail?: string;
  faction?: Faction;
  /** Niveau de la quête, quand c'en est une. */
  niveau?: number;
}

export interface Arme {
  min: number;
  max: number;
  vitesse: number;
  dps: number;
  /** Sous-classe d'arme du jeu (4/5 masse, 6 hast, 10 bâton, 13 pugilat, 15 dague). */
  sous: number;
}

export interface Effet {
  /** 0 = Utiliser, 1 = Équipé, 2 = Chances quand vous touchez */
  type: 0 | 1 | 2;
  texte: string;
}

export interface Objet {
  id: number;
  nom: string;
  nomEn?: string;
  /** Qualité du jeu : 2 inhabituel, 3 rare, 4 épique, 5 légendaire */
  q: 2 | 3 | 4 | 5;
  ilvl: number;
  /** Niveau à partir duquel l'objet est accessible (niveau requis, sinon celui de la quête, sinon estimé). */
  niveau: number;
  /** D'où vient `niveau` quand l'objet n'a pas de niveau requis. */
  niveauType?: 'quete' | 'estime';
  /** 1 = lié quand ramassé, 2 = lié quand équipé */
  liaison: 1 | 2;
  /** 1 = Unique, 2 = Unique - Équipé */
  unique?: 1 | 2;
  emplacement: Emplacement;
  /** InventoryType du jeu, pour le libellé exact de l'emplacement. */
  inv: number;
  stats: Partial<Record<Stat, number>>;
  armure: number;
  arme?: Arme;
  effets: Effet[];
  icone?: string;
  sources: Source[];
  /** Pièce de travail du cuir liée quand ramassée : seul l'artisan peut la porter. */
  maroquinier?: boolean;
}

export interface Donnees {
  build: string;
  genere: string;
  objets: Objet[];
}
