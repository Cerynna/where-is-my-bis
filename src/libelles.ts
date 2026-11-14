import type { Role } from './etat.ts';
import type { Emplacement, Stat, TypeSource } from './types.ts';

export const EMPLACEMENTS: Record<Emplacement, string> = {
  tete: 'Tête', cou: 'Cou', epaules: 'Épaules', dos: 'Dos', torse: 'Torse', poignets: 'Poignets',
  mains: 'Mains', taille: 'Taille', jambes: 'Jambes', pieds: 'Pieds', doigt: 'Doigt', bijou: 'Bijou',
  arme2m: 'Arme à deux mains', arme1m: 'Arme à une main', maing: 'Main gauche', relique: 'Idole',
};

export const ORDRE_EMPLACEMENTS: Emplacement[] = [
  'tete', 'cou', 'epaules', 'dos', 'torse', 'poignets', 'mains', 'taille', 'jambes', 'pieds',
  'doigt', 'bijou', 'arme2m', 'arme1m', 'maing', 'relique',
];

/** Libellé exact de l'emplacement (InventoryType) dans l'infobulle. */
export const INVENTAIRE: Record<number, string> = {
  1: 'Tête', 2: 'Cou', 3: 'Épaules', 5: 'Torse', 20: 'Torse', 6: 'Taille', 7: 'Jambes', 8: 'Pieds', 9: 'Poignets',
  10: 'Mains', 11: 'Doigt', 12: 'Bijou', 16: 'Dos', 13: 'Une main', 21: 'Main droite', 17: 'Deux mains',
  23: 'Tenu en main gauche', 28: 'Relique',
};

export const ARMES: Record<number, string> = { 4: 'Masse', 5: 'Masse', 6: 'Arme d’hast', 10: 'Bâton', 13: 'Arme de pugilat', 15: 'Dague' };

export const SOURCES: Record<TypeSource, string> = {
  donjon: 'Donjon', raid: 'Raid', quete: 'Quête', metier: 'Métier', rep: 'Réputation', jcj: 'JcJ',
  vendeur: 'Marchand', monde: 'Butin du monde', inconnue: 'Source inconnue', autre: 'Autre',
};
export const ORDRE_SOURCES: TypeSource[] = ['donjon', 'raid', 'quete', 'metier', 'rep', 'jcj', 'vendeur', 'monde', 'inconnue', 'autre'];

export const QUALITES: Record<number, string> = { 2: 'Inhabituel', 3: 'Rare', 4: 'Épique', 5: 'Légendaire' };

/** Boutons de spécialisation. */
export const SPECIALISATIONS: Record<Role, string> = {
  chat: 'Félin', ours: 'Ours', equilibre: 'Équilibre', resto: 'Restauration',
};

/** Stats primaires : lignes blanches de l'infobulle. */
export const STATS_BLANCHES: [Stat, string][] = [
  ['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['int', 'Intelligence'], ['esp', 'Esprit'],
  ['rfeu', 'Résistance au Feu'], ['rgivre', 'Résistance au Givre'], ['rombre', 'Résistance à l’Ombre'],
  ['rnature', 'Résistance à la Nature'], ['rarcane', 'Résistance aux Arcanes'],
];

/** Stats secondaires : lignes vertes « Équipé : ». */
export const STATS_VERTES: [Stat, string][] = [
  ['pa', 'à la puissance d’attaque'], ['crit', 'au score de coup critique'], ['tou', 'au score de toucher'],
  ['hate', 'au score de hâte'], ['exp', 'à l’expertise'], ['def', 'à la défense'], ['esq', 'au score d’esquive'],
  ['par', 'au score de parade'], ['blocage', 'à la valeur de blocage'], ['armure', 'à l’armure'],
  ['pa_mv', 'à la puissance d’attaque contre les morts-vivants'], ['pa_hum', 'à la puissance d’attaque contre les humanoïdes'],
  ['pa_bete', 'à la puissance d’attaque contre les bêtes'], ['pa_dem', 'à la puissance d’attaque contre les démons'],
  ['pds', 'à la puissance des sorts'], ['soins', 'aux soins prodigués'], ['dsorts', 'aux dégâts des sorts'],
  ['dnature', 'aux dégâts de Nature'], ['darcane', 'aux dégâts des Arcanes'], ['dfeu', 'aux dégâts de Feu'],
  ['dgivre', 'aux dégâts de Givre'], ['dombre', 'aux dégâts d’Ombre'], ['dsacre', 'aux dégâts du Sacré'],
  ['dphys', 'aux dégâts physiques'], ['penet', 'à la pénétration des sorts'],
];

/** Abréviations pour les lignes de liste. */
export const COURT: Partial<Record<Stat, string>> = {
  agi: 'Agi', for: 'For', end: 'End', pa: 'PA', crit: 'Crit', tou: 'Toucher', hate: 'Hâte', exp: 'Exp', def: 'Déf',
  esq: 'Esq', par: 'Parade', armure: 'Armure', esp: 'Esp', int: 'Int', pa_mv: 'PA mort-vivant', pa_hum: 'PA humanoïde',
  pa_bete: 'PA bête', pa_dem: 'PA démon', rfeu: 'Rés. feu', rgivre: 'Rés. givre', rombre: 'Rés. ombre',
  rnature: 'Rés. nature', rarcane: 'Rés. arcanes', pds: 'PdS', dsorts: 'Dégâts sorts', soins: 'Soins', blocage: 'Blocage',
  mp5: 'Mana/5', dnature: 'Nature', darcane: 'Arcanes', dfeu: 'Feu', dgivre: 'Givre', dombre: 'Ombre', dsacre: 'Sacré',
  dphys: 'Dégâts phys.', penet: 'Pénétration',
};

/** Stats proposées dans le filtre « doit avoir », selon la spécialisation. */
export const STATS_FILTRE: Record<Role, Stat[]> = {
  chat: ['agi', 'for', 'pa', 'crit', 'tou', 'exp', 'hate', 'end'],
  ours: ['end', 'agi', 'for', 'armure', 'def', 'esq', 'tou', 'exp'],
  equilibre: ['pds', 'dsorts', 'dnature', 'darcane', 'int', 'crit', 'tou', 'hate', 'mp5'],
  resto: ['soins', 'pds', 'mp5', 'int', 'esp', 'crit', 'hate'],
};

/** Lignes du bilan de l'ensemble, selon la spécialisation. */
export const BILAN: Record<Role, [Stat, string][]> = {
  chat: [['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte']],
  ours: [['end', 'Endurance'], ['agi', 'Agilité'], ['for', 'Force'], ['def', 'Défense'], ['esq', 'Score d’esquive'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['pa', 'Puissance d’attaque']],
  equilibre: [['pds', 'Puissance des sorts'], ['dsorts', 'Dégâts des sorts'], ['dnature', 'Dégâts de Nature'], ['darcane', 'Dégâts des Arcanes'], ['int', 'Intelligence'], ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['hate', 'Score de hâte'], ['mp5', 'Mana toutes les 5 s'], ['esp', 'Esprit']],
  resto: [['soins', 'Soins'], ['pds', 'Puissance des sorts'], ['mp5', 'Mana toutes les 5 s'], ['int', 'Intelligence'], ['esp', 'Esprit'], ['crit', 'Score de critique'], ['hate', 'Score de hâte'], ['end', 'Endurance']],
};

export function nombre(n: number, decimales = 0): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}
