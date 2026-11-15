// Valeur d'un objet pour chaque spécialisation du druide, et filtres communs aux deux vues.
import type { Etat, Role } from './etat.ts';
import type { Emplacement, Objet, Perso, Stat } from './types.ts';

type Poids = Partial<Record<Stat, number>> & { dps: number; armureBase: number };

/**
 * Félin : 1 Force = 2 PA, l'Agilité donne PA et critique, toucher et expertise un cran au-dessus.
 * Sur Forever, le DPS de l'arme compte en forme animale : environ 14 PA par point de DPS.
 * Ours : Endurance, Agilité et armure d'abord, puis défense et esquive.
 * Équilibre : puissance des sorts ; Colère est de Nature, Feu stellaire et Éclat lunaire d'Arcanes.
 * Restauration : soins et puissance des sorts, puis mana (mana/5, Intelligence, Esprit).
 * Les scores (critique, toucher, hâte) sont communs aux attaques et aux sorts sur Forever.
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
  equilibre: {
    pds: 1, dsorts: 0.95, dnature: 0.5, darcane: 0.5, int: 0.45, crit: 0.8, tou: 0.9, hate: 0.8, mp5: 0.6,
    esp: 0.1, penet: 0.3, end: 0.05, dps: 0, armureBase: 0,
  },
  resto: {
    soins: 1, pds: 1, mp5: 1.2, int: 0.6, esp: 0.45, crit: 0.4, hate: 0.6, end: 0.05, dps: 0, armureBase: 0,
  },
};

export const LIBELLES_ROLE: Record<Role, string> = {
  chat: 'félin (dégâts)', ours: 'ours (tank)', equilibre: 'équilibre (sorts)', resto: 'restauration (soins)',
};

/** Mots qui disent à quelle spécialisation sert l'effet d'une idole. */
const IDOLES: Record<Role, RegExp> = {
  chat: /félin|forme de chat|Griffe|Lambeau|Mutilation|Déchiqueter|Déchirure|Rugissement sauvage|Morsure féroce|énergie|Griffure|Changeforme/i,
  ours: /ours|Mutilation|Rossée|Mutiler|rage|Sauvagerie|Pilonnage|Lacérer|Rugissement démoralisant|Changeforme/i,
  equilibre: /Colère|Feu stellaire|Éclat lunaire|Essaim d|Ouragan|Lucioles|sélén|Sarments|Racines|Esprit/i,
  resto: /Toucher guérisseur|Récupération|Rétablissement|Prompte guérison|Tranquillité|soin|guérison|Régénération|Croissance|Esprit/i,
};

export function valeur(o: Objet, role: Role): number {
  if (o.emplacement === 'relique') {
    // Effet d'idole non chiffrable : on garde la plus récente de celles qui servent à la spécialisation.
    return o.effets.some((e) => IDOLES[role].test(e.texte)) ? 10 + o.ilvl / 10 : 0;
  }
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
  if (o.matiere && !e.matieres.includes(o.matiere)) return false;
  if (!e.qualites.includes(o.q)) return false;
  if (e.hvSeulement && o.liaison !== 2) return false;
  return o.sources.some((s) => sourceRetenue(s, e));
}

/** Provenance gardée par les filtres : type coché, bonne faction, butin pas trop rare. */
export function sourceRetenue(s: Objet['sources'][number], e: Etat): boolean {
  return e.sources.includes(s.type)
    && (e.faction === 'toutes' || !s.faction || s.faction === e.faction)
    && (s.taux === undefined || s.taux >= e.tauxMin);
}

/** Les provenances qui passent les filtres (type, faction), à afficher en premier. */
export function sourcesVisibles(o: Objet, e: Etat): Objet['sources'] {
  const ok = (s: Objet['sources'][number]) => sourceRetenue(s, e);
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
  | 'doigt1' | 'doigt2' | 'bijou1' | 'bijou2' | 'arme' | 'maing' | 'relique';

export type Ensemble = Record<Case, Objet | null>;

/** Objets portés par le personnage importé (versions de la base quand elles existent). */
export function objetsPortes(perso: Perso | null, parId: Map<number, Objet>): Objet[] {
  if (!perso) return [];
  return Object.values(perso.equipement).map((p) => {
    const b = parId.get(p.id);
    // Les stats de l'armurerie font foi (suffixes aléatoires « du sanglier »…), la base donne la provenance.
    return b ? { ...b, nom: p.nom, stats: p.stats, armure: p.armure, arme: p.arme ?? b.arme } : p;
  });
}

/**
 * Le meilleur objet portable à ce niveau pour chaque case de la fiche de personnage.
 * Les objets que le personnage porte déjà concourent aussi, sans passer par les filtres.
 */
export function meilleurEnsemble(objets: Objet[], e: Etat, portes: Objet[] = []): Ensemble {
  const idsPortes = new Set(portes.map((o) => o.id));
  const portables = [
    ...objets.filter((o) => !idsPortes.has(o.id) && o.niveau <= e.niveau && passeCommun(o, e)),
    // Tes pièces ne passent pas les filtres, mais restent soumises au niveau choisi.
    ...portes.filter((o) => o.niveau <= e.niveau),
  ];
  const par = (emp: Emplacement[]) => portables
    .filter((o) => emp.includes(o.emplacement))
    .sort((a, b) => valeur(b, e.role) - valeur(a, e.role));
  const premier = (emp: Emplacement) => par([emp])[0] ?? null;
  const bagues = par(['doigt']);
  const bijoux = par(['bijou']).filter((o) => valeur(o, e.role) > 0);
  // Arme à deux mains, ou arme à une main + objet tenu en main gauche : la paire qui vaut le plus.
  const deuxMains = premier('arme2m');
  const uneMain = premier('arme1m');
  const mainGauche = par(['maing']).filter((o) => valeur(o, e.role) > 0)[0] ?? null;
  const v = (o: Objet | null) => (o ? valeur(o, e.role) : 0);
  const paire = uneMain && v(uneMain) + v(mainGauche) > v(deuxMains);
  return {
    tete: premier('tete'), cou: premier('cou'), epaules: premier('epaules'), dos: premier('dos'),
    torse: premier('torse'), poignets: premier('poignets'), mains: premier('mains'), taille: premier('taille'),
    jambes: premier('jambes'), pieds: premier('pieds'),
    doigt1: bagues[0] ?? null, doigt2: bagues[1] ?? null, bijou1: bijoux[0] ?? null, bijou2: bijoux[1] ?? null,
    arme: paire ? uneMain : deuxMains ?? uneMain, maing: paire ? mainGauche : null,
    relique: par(['relique']).filter((o) => valeur(o, e.role) > 0)[0] ?? null,
  };
}

export type Statut =
  | { type: 'porte' }
  | { type: 'mieux'; remplace: Objet | null; gain: number }
  | { type: 'aucun' };

/**
 * Pour chaque case : l'objet conseillé est-il déjà porté, ou que remplace-t-il ?
 * Bagues et bijoux : la meilleure nouvelle pièce remplace la plus faible des pièces portées.
 */
export function comparer(ens: Ensemble, perso: Perso | null, portes: Objet[], role: Role): Partial<Record<Case, Statut>> {
  const res: Partial<Record<Case, Statut>> = {};
  if (!perso) return res;
  const ids = new Set(portes.map((o) => o.id));
  const parCase = new Map<string, Objet>();
  for (const [c, p] of Object.entries(perso.equipement)) {
    const o = portes.find((x) => x.id === p.id);
    if (o) parCase.set(c, o);
  }
  const statut = (o: Objet | null, ancien: Objet | null): Statut => {
    if (!o) return { type: 'aucun' };
    if (ids.has(o.id)) return { type: 'porte' };
    const v = valeur(o, role);
    const va = ancien ? valeur(ancien, role) : 0;
    // Gain infini : la pièce remplacée n'a aucune stat utile (sacoche, bijou de métier…).
    return { type: 'mieux', remplace: ancien, gain: va > 0 ? (v - va) / va : Number.POSITIVE_INFINITY };
  };
  for (const c of ['tete', 'cou', 'epaules', 'dos', 'torse', 'poignets', 'mains', 'taille', 'jambes', 'pieds', 'arme', 'maing', 'relique'] as Case[]) {
    res[c] = statut(ens[c], parCase.get(c) ?? null);
  }
  for (const [a, b] of [['doigt1', 'doigt2'], ['bijou1', 'bijou2']] as [Case, Case][]) {
    const choisis = [ens[a], ens[b]];
    const nouveaux = choisis.filter((o): o is Objet => !!o && !ids.has(o.id));
    const restants = [parCase.get(a), parCase.get(b)]
      .filter((o): o is Objet => !!o && !choisis.some((x) => x?.id === o.id))
      .sort((x, y) => valeur(x, role) - valeur(y, role));
    for (const c of [a, b]) {
      const o = ens[c];
      if (!o) { res[c] = { type: 'aucun' }; continue; }
      if (ids.has(o.id)) { res[c] = { type: 'porte' }; continue; }
      res[c] = statut(o, restants[nouveaux.indexOf(o)] ?? null);
    }
  }
  return res;
}

/** Valeur de la pièce portée la plus faible pour ce type d'emplacement (0 si vide). */
export function valeurPortee(portes: Objet[], emplacement: Emplacement, role: Role): number | null {
  if (!portes.length) return null;
  const groupe: Emplacement[] = emplacement === 'arme2m' || emplacement === 'arme1m' ? ['arme2m', 'arme1m'] : [emplacement];
  const v = portes.filter((o) => groupe.includes(o.emplacement)).map((o) => valeur(o, role));
  const attendu = emplacement === 'doigt' || emplacement === 'bijou' ? 2 : 1;
  if (v.length < attendu) return 0;
  return Math.min(...v);
}
