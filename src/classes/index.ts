// Registre des classes du site. Une classe s'active en décrivant ses spécialisations ici,
// en passant `actif: true` dans equipement.ts, puis en générant ses données (CLASSE=<id> npm run donnees).
import { SPECS_DRUIDE } from './druide.ts';
import { EQUIPEMENTS } from './equipement.ts';
import { SPECS_MAGE } from './mage.ts';
import type { Classe, Specialisation } from './types.ts';

const SPECS: Partial<Record<string, Specialisation[]>> = {
  mage: SPECS_MAGE,
  druide: SPECS_DRUIDE,
};

export const CLASSES: Classe[] = EQUIPEMENTS.map((e) => ({ ...e, specs: SPECS[e.id] ?? [] }));

export function classeParId(id: string | undefined): Classe | undefined {
  return CLASSES.find((c) => c.id === id);
}

export function classeParEnum(e: string | undefined): Classe | undefined {
  return CLASSES.find((c) => c.enumArmurerie === e);
}

/** Spécialisation choisie, ou la première de la classe. */
export function specDe(classe: Classe, id: string): Specialisation {
  return classe.specs.find((s) => s.id === id) ?? classe.specs[0]!;
}

export type { Classe, Specialisation } from './types.ts';
