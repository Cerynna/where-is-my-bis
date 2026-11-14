// Réglages de l'utilisateur : lus et écrits dans l'adresse (pour partager un lien) et gardés localement.
import type { Emplacement, Faction, Stat, TypeSource } from './types.ts';
import { ORDRE_SOURCES } from './libelles.ts';

export type Role = 'chat' | 'ours';
export type Vue = 'ensemble' | 'objets';
export type Tri = 'valeur' | 'niveau' | 'ilvl' | 'nom';

export interface Etat {
  vue: Vue;
  niveau: number;
  role: Role;
  faction: Faction | 'toutes';
  maroquinier: boolean;
  sources: TypeSource[];
  qualites: number[];
  hvSeulement: boolean;
  emplacement: Emplacement | 'tous';
  lieu: string;
  recherche: string;
  stats: Stat[];
  /** Montrer aussi les objets des N niveaux suivants (grisés). */
  avance: number;
  /** Cacher les objets de plus de N niveaux sous le mien (0 = tout montrer). */
  ecart: number;
  tri: Tri;
}

export const DEFAUT: Etat = {
  vue: 'ensemble',
  niveau: 60,
  role: 'chat',
  faction: 'toutes',
  maroquinier: false,
  sources: ORDRE_SOURCES.filter((s) => s !== 'autre'),
  qualites: [2, 3, 4, 5],
  hvSeulement: false,
  emplacement: 'tous',
  lieu: '',
  recherche: '',
  stats: [],
  avance: 0,
  ecart: 0,
  tri: 'valeur',
};

const CLE = 'feral-forever:etat';

function borner(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
}

/** Ne garde que les champs valides, avec les valeurs par défaut pour le reste. */
function nettoyer(e: Partial<Etat>): Etat {
  return {
    ...DEFAUT,
    ...e,
    niveau: borner(Number(e.niveau ?? DEFAUT.niveau), 1, 60),
    avance: borner(Number(e.avance ?? 0), 0, 10),
    ecart: borner(Number(e.ecart ?? 0), 0, 59),
    role: e.role === 'ours' ? 'ours' : 'chat',
    vue: e.vue === 'objets' ? 'objets' : 'ensemble',
  };
}

export function lireEtat(): Etat {
  let local: Partial<Etat> = {};
  try { local = JSON.parse(localStorage.getItem(CLE) ?? '{}') as Partial<Etat>; } catch { /* stockage indisponible */ }
  const p = new URLSearchParams(location.search);
  if (![...p.keys()].length) return nettoyer(local);
  const liste = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : undefined);
  const depuisUrl: Partial<Etat> = {
    vue: (p.get('vue') as Vue) ?? undefined,
    niveau: p.has('niv') ? Number(p.get('niv')) : undefined,
    role: (p.get('role') as Role) ?? undefined,
    faction: (p.get('fac') as Etat['faction']) ?? undefined,
    maroquinier: p.has('cuir') ? p.get('cuir') === '1' : undefined,
    sources: liste('src') as TypeSource[] | undefined,
    qualites: liste('q')?.map(Number),
    hvSeulement: p.has('hv') ? p.get('hv') === '1' : undefined,
    emplacement: (p.get('empl') as Etat['emplacement']) ?? undefined,
    lieu: p.get('lieu') ?? undefined,
    recherche: p.get('nom') ?? undefined,
    stats: liste('stats') as Stat[] | undefined,
    avance: p.has('avance') ? Number(p.get('avance')) : undefined,
    ecart: p.has('ecart') ? Number(p.get('ecart')) : undefined,
    tri: (p.get('tri') as Tri) ?? undefined,
  };
  // Un lien partagé décrit tout l'état : on n'y mêle pas les réglages gardés dans ce navigateur.
  const defini = Object.fromEntries(Object.entries(depuisUrl).filter(([, v]) => v !== undefined)) as Partial<Etat>;
  return nettoyer(defini);
}

export function ecrireEtat(e: Etat): void {
  try { localStorage.setItem(CLE, JSON.stringify(e)); } catch { /* stockage indisponible */ }
  const p = new URLSearchParams();
  const egal = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x) => b.includes(x));
  if (e.vue !== DEFAUT.vue) p.set('vue', e.vue);
  p.set('niv', String(e.niveau));
  if (e.role !== DEFAUT.role) p.set('role', e.role);
  if (e.faction !== DEFAUT.faction) p.set('fac', e.faction);
  if (e.maroquinier) p.set('cuir', '1');
  if (!egal(e.sources, DEFAUT.sources)) p.set('src', e.sources.join(','));
  if (!egal(e.qualites, DEFAUT.qualites)) p.set('q', e.qualites.join(','));
  if (e.hvSeulement) p.set('hv', '1');
  if (e.emplacement !== 'tous') p.set('empl', e.emplacement);
  if (e.lieu) p.set('lieu', e.lieu);
  if (e.recherche) p.set('nom', e.recherche);
  if (e.stats.length) p.set('stats', e.stats.join(','));
  if (e.avance) p.set('avance', String(e.avance));
  if (e.ecart) p.set('ecart', String(e.ecart));
  if (e.tri !== DEFAUT.tri) p.set('tri', e.tri);
  history.replaceState(null, '', `${location.pathname}?${p.toString()}${location.hash}`);
}
