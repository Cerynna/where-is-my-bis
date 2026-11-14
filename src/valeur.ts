// Valeur d'un objet pour un druide farouche, et filtres communs aux deux vues.
import type { Etat, Role } from './etat.ts';
import type { Emplacement, Objet, Stat } from './types.ts';

type Poids = Partial<Record<Stat, number>> & { dps: number; armureBase: number };

/**
 * Félin : 1 Force = 2 PA, l'Agilité donne PA et critique, toucher et expertise un cran au-dessus.
 * Sur Forever, le DPS de l'arme compte en forme animale : environ 14 PA par point de DPS.
 * Ours : Endurance, Agilité et armure d'abord, puis défense et esquive.
 */
export const POIDS: Record<Role, Poids> = {
  chat: {
    agi: 2.2, for: 2, pa: 1, crit: 2, tou: 2.5, exp: 2, hate: 1.5, end: 0.6, armure: 0.1, esq: 1, def: 0.5,
    int: 0.05, esp: 0.02, pa_mv: 0.3, pa_hum: 0.4, pa_bete: 0.4, pa_dem: 0.15, dps: 14, armureBase: 0,
  },
  ours: {
    end: 1.6, agi: 1.6, for: 1, armure: 0.12, def: 1.5, esq: 2, par: 1, pa: 0.5, crit: 0.6, tou: 1.2, exp: 1.5, hate: 0.5,
    esp: 0.02, int: 0.05, pa_mv: 0.15, pa_hum: 0.2, pa_bete: 0.2, pa_dem: 0.08,
    rfeu: 0.1, rgivre: 0.1, rombre: 0.1, rnature: 0.1, rarcane: 0.1, dps: 6, armureBase: 0.12,
  },
};

export function valeur(o: Objet, role: Role): number {
  const p = POIDS[role];
  let v = 0;
  for (const [k, n] of Object.entries(o.stats) as [Stat, number][]) v += (p[k] ?? 0) * n;
  if (o.arme) v += p.dps * o.arme.dps;
  v += p.armureBase * o.armure;
  return v;
}

/** Filtres qui valent pour l'ensemble conseillé comme pour la base d'objets. */
export function passeCommun(o: Objet, e: Etat): boolean {
  if (o.maroquinier && !e.maroquinier) return false;
  if (!e.qualites.includes(o.q)) return false;
  if (e.hvSeulement && o.liaison !== 2) return false;
  const sources = o.sources.filter((s) =>
    e.sources.includes(s.type) && (e.faction === 'toutes' || !s.faction || s.faction === e.faction));
  return sources.length > 0;
}

/** Les provenances qui passent les filtres (type, faction), à afficher en premier. */
export function sourcesVisibles(o: Objet, e: Etat): Objet['sources'] {
  const ok = (s: Objet['sources'][number]) =>
    e.sources.includes(s.type) && (e.faction === 'toutes' || !s.faction || s.faction === e.faction);
  return [...o.sources.filter(ok), ...o.sources.filter((s) => !ok(s))];
}

/** Filtres propres à la base d'objets. */
export function passeListe(o: Objet, e: Etat): boolean {
  if (!passeCommun(o, e)) return false;
  if (o.niveau > e.niveau + e.avance) return false;
  if (e.ecart && o.niveau < e.niveau - e.ecart) return false;
  if (e.emplacement !== 'tous' && o.emplacement !== e.emplacement) return false;
  if (e.lieu && !o.sources.some((s) => s.lieu === e.lieu)) return false;
  if (e.stats.length && !e.stats.every((s) => (o.stats[s] ?? 0) > 0)) return false;
  if (e.recherche) {
    const q = normaliser(e.recherche);
    if (!normaliser(o.nom).includes(q) && !normaliser(o.nomEn ?? '').includes(q)) return false;
  }
  return true;
}

export function normaliser(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();
}

export type Case = 'tete' | 'cou' | 'epaules' | 'dos' | 'torse' | 'poignets' | 'mains' | 'taille' | 'jambes' | 'pieds'
  | 'doigt1' | 'doigt2' | 'bijou1' | 'bijou2' | 'arme' | 'relique';

export type Ensemble = Record<Case, Objet | null>;

/** Le meilleur objet portable à ce niveau pour chaque case de la fiche de personnage. */
export function meilleurEnsemble(objets: Objet[], e: Etat): Ensemble {
  const portables = objets.filter((o) => o.niveau <= e.niveau && passeCommun(o, e));
  const par = (emp: Emplacement[]) => portables
    .filter((o) => emp.includes(o.emplacement))
    .sort((a, b) => valeur(b, e.role) - valeur(a, e.role));
  const premier = (emp: Emplacement) => par([emp])[0] ?? null;
  const bagues = par(['doigt']);
  const bijoux = par(['bijou']).filter((o) => valeur(o, e.role) > 0);
  return {
    tete: premier('tete'), cou: premier('cou'), epaules: premier('epaules'), dos: premier('dos'),
    torse: premier('torse'), poignets: premier('poignets'), mains: premier('mains'), taille: premier('taille'),
    jambes: premier('jambes'), pieds: premier('pieds'),
    doigt1: bagues[0] ?? null, doigt2: bagues[1] ?? null, bijou1: bijoux[0] ?? null, bijou2: bijoux[1] ?? null,
    arme: par(['arme2m', 'arme1m'])[0] ?? null, relique: premier('relique'),
  };
}
