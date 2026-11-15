// Format des données servies au site (public/data/<classe>.json).
// Partagé entre les scripts qui les génèrent et l'interface qui les lit.
import type { Matiere } from './classes/equipement.ts';

export type Emplacement =
  | 'tete' | 'cou' | 'epaules' | 'dos' | 'torse' | 'poignets'
  | 'mains' | 'taille' | 'jambes' | 'pieds' | 'doigt' | 'bijou'
  | 'arme2m' | 'arme1m' | 'maing' | 'bouclier' | 'relique'
  /** Arme à distance : baguette, arc, fusil, arbalète, arme de jet. */
  | 'distance'
  /** Arme de main gauche (InventoryType 22), pour les classes qui manient deux armes. */
  | 'armemg';

export type Stat =
  | 'agi' | 'for' | 'end' | 'int' | 'esp'
  | 'pa' | 'crit' | 'tou' | 'hate' | 'exp' | 'def' | 'esq' | 'par' | 'armure' | 'blocage'
  /** Puissance d'attaque à distance, score de blocage */
  | 'pad' | 'sbloc'
  | 'pa_mv' | 'pa_hum' | 'pa_bete' | 'pa_dem'
  | 'pds' | 'soins' | 'dsorts' | 'mp5' | 'vie5' | 'penet'
  | 'dnature' | 'darcane' | 'dfeu' | 'dgivre' | 'dombre' | 'dsacre' | 'dphys'
  | 'critsorts' | 'tousorts'
  | 'rfeu' | 'rgivre' | 'rombre' | 'rnature' | 'rarcane';

export type TypeSource =
  | 'donjon' | 'raid' | 'quete' | 'metier' | 'rep' | 'jcj' | 'vendeur' | 'monstre' | 'monde' | 'inconnue' | 'autre';

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
  /** Taux de butin en % (boss, monstres de base, monstre rare), quand il est connu. */
  taux?: number;
}

export interface Arme {
  min: number;
  max: number;
  vitesse: number;
  dps: number;
  /** Sous-classe d'arme du jeu (4/5 masse, 6 hast, 10 bâton, 13 pugilat, 15 dague). */
  sous: number;
  /** Dégâts estimés (arme de lanceur de sorts sans fiche vérifiée). */
  estime?: boolean;
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
  /** Qualité du jeu : 0 médiocre, 1 commun, 2 inhabituel, 3 rare, 4 épique, 5 légendaire */
  q: 0 | 1 | 2 | 3 | 4 | 5;
  ilvl: number;
  /** Niveau à partir duquel l'objet est accessible (niveau requis, sinon celui de la quête, sinon estimé). */
  niveau: number;
  /**
   * D'où vient `niveau` quand ce n'est pas le niveau requis : quête, estimation,
   * ou entrée du donjon (objet qui ne tombe que dans des donjons plus hauts que son niveau requis).
   */
  niveauType?: 'quete' | 'estime' | 'donjon' | 'matiere';
  /** Niveau requis du jeu, quand `niveau` vient de l'entrée du donjon ou de la matière (mailles, plaques au 40). */
  niveauRequis?: number;
  /** 1 = lié quand ramassé, 2 = lié quand équipé */
  liaison: 1 | 2;
  /** 1 = Unique, 2 = Unique - Équipé */
  unique?: 1 | 2;
  emplacement: Emplacement;
  /** InventoryType du jeu, pour le libellé exact de l'emplacement. */
  inv: number;
  /** Pièces d'armure : tissu, cuir, mailles ou plaques. */
  matiere?: Matiere;
  stats: Partial<Record<Stat, number>>;
  armure: number;
  arme?: Arme;
  effets: Effet[];
  /** Nom de l'icône dans public/icons, ou adresse complète (objets portés hors de la base). */
  icone?: string;
  sources: Source[];
  /** Pièce de travail du cuir liée quand ramassée : seul l'artisan peut la porter. */
  maroquinier?: boolean;
}

/** Personnage importé depuis l'armurerie. */
export interface Perso {
  lien: string;
  nom: string;
  royaume?: string;
  niveau: number;
  classe: string;
  /** Classe de l'armurerie (DRUID, WARRIOR…). */
  classeEnum?: string;
  estDruide: boolean;
  faction?: Faction;
  specialisation?: string;
  maroquinier: boolean;
  /** Date de la dernière mise à jour de l'armurerie (ISO). */
  majArmurerie?: string;
  importeLe: string;
  /** Objets portés, par case de la fiche (tete, doigt1, bijou2, arme, relique…). */
  equipement: Record<string, Objet>;
}

export interface Donnees {
  /** Classe à laquelle ces objets sont destinés. */
  classe: string;
  build: string;
  genere: string;
  objets: Objet[];
}
