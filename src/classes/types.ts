import type { Stat } from '../types.ts';
import type { EquipementClasse } from './equipement.ts';

/** Poids de chaque stat pour une spécialisation, plus le DPS d'arme et l'armure de base. */
export type Poids = Partial<Record<Stat, number>> & { dps: number; armureBase: number };

export interface Specialisation {
  /** Identifiant court, gardé dans l'adresse (role=…). */
  id: string;
  /** Libellé du bouton. */
  nom: string;
  /** Libellé dans les phrases (« félin (dégâts) »). */
  libelle: string;
  /** Spé physique : le DPS de l'arme et la puissance d'attaque comptent. */
  physique: boolean;
  poids: Poids;
  /** Mots qui disent qu'une relique (idole, libram, totem) sert à cette spé. */
  reliques?: RegExp;
  /** Stats proposées dans le filtre « doit avoir ». */
  filtre: Stat[];
  /** Lignes du bilan de l'ensemble. */
  bilan: [Stat, string][];
  /** Phrase d'aide sous le bilan. */
  note: string;
  /** Nom de la spécialisation active sur l'armurerie (« Combat farouche »…), pour la choisir à l'import. */
  armurerie?: RegExp;
}

export interface Classe extends EquipementClasse {
  /** Vide tant que la classe n'est pas faite. */
  specs: Specialisation[];
}
