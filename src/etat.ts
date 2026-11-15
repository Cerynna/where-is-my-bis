// Réglages d'une page de classe : lus et écrits dans l'adresse (pour partager un lien)
// et gardés localement, classe par classe.
import type { Classe } from './classes/types.ts';
import type { Matiere } from './classes/equipement.ts';
import type { Emplacement, Faction, Stat, TypeSource } from './types.ts';
import { ORDRE_SOURCES } from './libelles.ts';

export type Vue = 'ensemble' | 'objets';
export type Tri = 'valeur' | 'niveau' | 'ilvl' | 'nom';

export interface Etat {
  niveau: number;
  /** Spécialisation (identifiant défini par la classe). */
  role: string;
  faction: Faction | 'toutes';
  maroquinier: boolean;
  /** Matières d'armure acceptées. */
  matieres: Matiere[];
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
  /** Base d'objets : seulement ce qui bat ce que porte le personnage importé. */
  ameliorations: boolean;
  /** Taux de butin minimum en % : un butin plus rare est ignoré (0 = tout garder). */
  tauxMin: number;
}

/** Réglages par défaut d'une classe. */
export function defaut(classe: Classe): Etat {
  return {
    niveau: 60,
    role: classe.specs[0]?.id ?? '',
    faction: 'toutes',
    maroquinier: false,
    matieres: classe.armures.map((a) => a.matiere),
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
    ameliorations: false,
    tauxMin: 1,
  };
}

const PREFIXE = 'forever-equipement';
const cle = (classe: Classe) => `${PREFIXE}:etat:${classe.id}`;
/** Version des réglages gardés : la 2 ajoute la provenance « Monstre », cochée d'office une fois. */
const VERSION = 2;

function borner(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : min;
}

/** Ne garde que les champs valides, avec les valeurs par défaut de la classe pour le reste. */
function nettoyer(e: Partial<Etat>, classe: Classe): Etat {
  const d = defaut(classe);
  const matieres = classe.armures.map((a) => a.matiere);
  return {
    ...d,
    ...e,
    niveau: borner(Number(e.niveau ?? d.niveau), 1, 60),
    avance: borner(Number(e.avance ?? 0), 0, 10),
    ecart: borner(Number(e.ecart ?? 0), 0, 59),
    tauxMin: borner(Number(e.tauxMin ?? d.tauxMin), 0, 100),
    role: classe.specs.some((s) => s.id === e.role) ? e.role! : d.role,
    matieres: (e.matieres ?? d.matieres).filter((m) => matieres.includes(m)),
  };
}

/** Réglages de départ : l'adresse si elle en porte, sinon ceux gardés pour cette classe. */
export function lireEtat(classe: Classe, p: URLSearchParams): Etat {
  if ([...p.keys()].length) {
    const liste = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : undefined);
    const depuisUrl: Partial<Etat> = {
      niveau: p.has('niv') ? Number(p.get('niv')) : undefined,
      role: p.get('role') ?? undefined,
      faction: (p.get('fac') as Etat['faction']) ?? undefined,
      maroquinier: p.has('cuir') ? p.get('cuir') === '1' : undefined,
      matieres: liste('mat') as Matiere[] | undefined,
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
      ameliorations: p.has('mieux') ? p.get('mieux') === '1' : undefined,
      tauxMin: p.has('taux') ? Number(p.get('taux')) : undefined,
    };
    // Un lien partagé décrit tout l'état : on n'y mêle pas les réglages gardés dans ce navigateur.
    return nettoyer(Object.fromEntries(Object.entries(depuisUrl).filter(([, v]) => v !== undefined)) as Partial<Etat>, classe);
  }
  let local: Partial<Etat> = {};
  try {
    local = JSON.parse(localStorage.getItem(cle(classe)) ?? localStorage.getItem('feral-forever:etat') ?? '{}') as Partial<Etat>;
    if (Number(localStorage.getItem(`${cle(classe)}:version`) ?? 1) < VERSION && local.sources && !local.sources.includes('monstre')) {
      local.sources = [...local.sources, 'monstre'];
    }
    localStorage.setItem(`${cle(classe)}:version`, String(VERSION));
  } catch { /* stockage indisponible */ }
  return nettoyer(local, classe);
}

/** Garde les réglages et renvoie les paramètres d'adresse qui les décrivent. */
export function ecrireEtat(e: Etat, classe: Classe): URLSearchParams {
  try { localStorage.setItem(cle(classe), JSON.stringify(e)); } catch { /* stockage indisponible */ }
  const d = defaut(classe);
  const p = new URLSearchParams();
  const egal = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x) => b.includes(x));
  p.set('niv', String(e.niveau));
  if (e.role !== d.role) p.set('role', e.role);
  if (e.faction !== d.faction) p.set('fac', e.faction);
  if (e.maroquinier) p.set('cuir', '1');
  if (!egal(e.matieres, d.matieres)) p.set('mat', e.matieres.join(','));
  if (!egal(e.sources, d.sources)) p.set('src', e.sources.join(','));
  if (!egal(e.qualites, d.qualites)) p.set('q', e.qualites.join(','));
  if (e.hvSeulement) p.set('hv', '1');
  if (e.emplacement !== 'tous') p.set('empl', e.emplacement);
  if (e.lieu) p.set('lieu', e.lieu);
  if (e.recherche) p.set('nom', e.recherche);
  if (e.stats.length) p.set('stats', e.stats.join(','));
  if (e.avance) p.set('avance', String(e.avance));
  if (e.ecart) p.set('ecart', String(e.ecart));
  if (e.tri !== d.tri) p.set('tri', e.tri);
  if (e.ameliorations) p.set('mieux', '1');
  if (e.tauxMin !== d.tauxMin) p.set('taux', String(e.tauxMin));
  return p;
}
