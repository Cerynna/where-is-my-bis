import type { Stat } from '../types.ts';
import type { EquipementClasse } from './equipement.ts';

/**
 * Poids de chaque stat pour une spécialisation, plus le DPS de l'arme de mêlée, celui de l'arme
 * à distance (baguette, arc…) et l'armure de base.
 */
export type Poids = Partial<Record<Stat, number>> & { dps: number; dpsDistance?: number; armureBase: number };

/** Clés de `Poids` qui ne sont pas des stats d'objet. */
export const POIDS_HORS_STATS: readonly string[] = ['dps', 'dpsDistance', 'armureBase'];

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
  /**
   * Mots (surtout des noms de sorts) qui disent qu'un effet sert à cette spé : classement des reliques
   * (idole, libram, totem), et tri des objets utiles dans les scripts de données.
   */
  reliques?: RegExp;
  /** Stats proposées dans le filtre « doit avoir ». */
  filtre: Stat[];
  /** Lignes du bilan de l'ensemble. */
  bilan: [Stat, string][];
  /** Phrase d'aide sous le bilan. */
  note: string;
  /** Nom de la spécialisation active sur l'armurerie (« Combat farouche »…), pour la choisir à l'import. */
  armurerie?: RegExp;
  /** Spé à deux armes : la main gauche peut porter une seconde arme (la classe doit avoir l'ambidextrie). */
  ambidextre?: boolean;
  /** Types d'arme permis en main droite (sous-classes), quand la spé en exige un (dague pour Attaque sournoise…). */
  armesMain?: number[];
  /** Types d'arme à distance permis (les tirs du chasseur exigent un arc, un fusil ou une arbalète). */
  armesDistance?: number[];
}

export interface Classe extends EquipementClasse {
  /** Vide tant que la classe n'est pas faite. */
  specs: Specialisation[];
}
