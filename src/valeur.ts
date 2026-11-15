// Valeur d'un objet pour une spécialisation, et filtres communs aux deux vues.
import { STATS_ARMURERIE } from './armurerie.ts';
import type { Specialisation } from './classes/types.ts';
import type { Etat } from './etat.ts';
import type { Emplacement, Objet, Perso, Stat } from './types.ts';

export function valeur(o: Objet, spe: Specialisation): number {
  if (o.emplacement === 'relique') {
    // Effet de relique non chiffrable : on garde la plus récente de celles qui servent à la spécialisation.
    return spe.reliques && o.effets.some((e) => spe.reliques!.test(e.texte)) ? 10 + o.ilvl / 10 : 0;
  }
  const p = spe.poids;
  let v = 0;
  for (const [k, n] of Object.entries(o.stats) as [Stat, number][]) v += (p[k] ?? 0) * n;
  // DPS de l'arme : celui de mêlée et celui de l'arme à distance (baguette…) ne pèsent pas pareil.
  if (o.arme) v += (o.emplacement === 'distance' ? p.dpsDistance ?? 0 : p.dps) * o.arme.dps;
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

/** Les provenances qui passent les filtres, à afficher en premier. */
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
  | 'doigt1' | 'doigt2' | 'bijou1' | 'bijou2' | 'arme' | 'maing' | 'relique' | 'distance';

export type Ensemble = Record<Case, Objet | null>;

/** Objets portés par le personnage importé (versions de la base quand elles existent). */
export function objetsPortes(perso: Perso | null, parId: Map<number, Objet>): Objet[] {
  if (!perso) return [];
  return Object.values(perso.equipement).map((p) => {
    const b = parId.get(p.id);
    if (!b) return p;
    // Les stats de l'armurerie font foi (suffixes aléatoires « du sanglier »…), la base donne la provenance.
    // Celles que l'armurerie ne sait pas donner (dégâts par école, soins…) viennent de la base.
    const manquantes = Object.fromEntries(Object.entries(b.stats).filter(([k]) => !STATS_ARMURERIE.has(k as Stat)));
    return { ...b, nom: p.nom, stats: { ...manquantes, ...p.stats }, armure: p.armure, arme: p.arme ?? b.arme };
  });
}

/**
 * Le meilleur objet portable à ce niveau pour chaque case de la fiche de personnage.
 * Les objets que le personnage porte déjà concourent aussi, sans passer par les filtres.
 */
export function meilleurEnsemble(objets: Objet[], e: Etat, spe: Specialisation, portes: Objet[] = []): Ensemble {
  const idsPortes = new Set(portes.map((o) => o.id));
  const portables = [
    ...objets.filter((o) => !idsPortes.has(o.id) && o.niveau <= e.niveau && passeCommun(o, e)),
    // Tes pièces ne passent pas les filtres, mais restent soumises au niveau choisi.
    ...portes.filter((o) => o.niveau <= e.niveau),
  ];
  const v = (o: Objet | null) => (o ? valeur(o, spe) : 0);
  const par = (emp: Emplacement[]) => portables
    .filter((o) => emp.includes(o.emplacement))
    .sort((a, b) => v(b) - v(a));
  const premier = (emp: Emplacement) => par([emp])[0] ?? null;
  const bagues = par(['doigt']);
  const bijoux = par(['bijou']).filter((o) => v(o) > 0);
  // Arme à deux mains, ou arme à une main + objet tenu en main gauche (ou bouclier) : la paire qui vaut le plus.
  const deuxMains = premier('arme2m');
  const uneMain = premier('arme1m');
  const mainGauche = par(['maing', 'bouclier']).filter((o) => v(o) > 0)[0] ?? null;
  const paire = uneMain && v(uneMain) + v(mainGauche) > v(deuxMains);
  return {
    tete: premier('tete'), cou: premier('cou'), epaules: premier('epaules'), dos: premier('dos'),
    torse: premier('torse'), poignets: premier('poignets'), mains: premier('mains'), taille: premier('taille'),
    jambes: premier('jambes'), pieds: premier('pieds'),
    doigt1: bagues[0] ?? null, doigt2: bagues[1] ?? null, bijou1: bijoux[0] ?? null, bijou2: bijoux[1] ?? null,
    arme: paire ? uneMain : deuxMains ?? uneMain, maing: paire ? mainGauche : null,
    relique: par(['relique']).filter((o) => v(o) > 0)[0] ?? null,
    distance: par(['distance']).filter((o) => v(o) > 0)[0] ?? null,
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
export function comparer(ens: Ensemble, perso: Perso | null, portes: Objet[], spe: Specialisation): Partial<Record<Case, Statut>> {
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
    const v = valeur(o, spe);
    const va = ancien ? valeur(ancien, spe) : 0;
    // Gain infini : la pièce remplacée n'a aucune stat utile (sacoche, bijou de métier…).
    return { type: 'mieux', remplace: ancien, gain: va > 0 ? (v - va) / va : Number.POSITIVE_INFINITY };
  };
  for (const c of ['tete', 'cou', 'epaules', 'dos', 'torse', 'poignets', 'mains', 'taille', 'jambes', 'pieds', 'arme', 'maing', 'relique', 'distance'] as Case[]) {
    res[c] = statut(ens[c], parCase.get(c) ?? null);
  }
  for (const [a, b] of [['doigt1', 'doigt2'], ['bijou1', 'bijou2']] as [Case, Case][]) {
    const choisis = [ens[a], ens[b]];
    const nouveaux = choisis.filter((o): o is Objet => !!o && !ids.has(o.id));
    const restants = [parCase.get(a), parCase.get(b)]
      .filter((o): o is Objet => !!o && !choisis.some((x) => x?.id === o.id))
      .sort((x, y) => valeur(x, spe) - valeur(y, spe));
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
export function valeurPortee(portes: Objet[], emplacement: Emplacement, spe: Specialisation): number | null {
  if (!portes.length) return null;
  const groupe: Emplacement[] = emplacement === 'arme2m' || emplacement === 'arme1m' ? ['arme2m', 'arme1m'] : [emplacement];
  const v = portes.filter((o) => groupe.includes(o.emplacement)).map((o) => valeur(o, spe));
  const attendu = emplacement === 'doigt' || emplacement === 'bijou' ? 2 : 1;
  if (v.length < attendu) return 0;
  return Math.min(...v);
}
