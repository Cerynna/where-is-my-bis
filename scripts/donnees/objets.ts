// Extrait des tables du jeu (publiées + cache des objets révélés) tous les objets qu'une classe
// peut porter, du niveau 1 au niveau 60, avec stats, armure, dégâts, effets et icône.
import path from 'node:path';
import { SOUS_CLASSE_ARMURE, type EquipementClasse, type Matiere } from '../../src/classes/equipement.ts';
import type { Arme, Effet, Emplacement, Stat } from '../../src/types.ts';
import { indexer, lireCsv, type Ligne } from './commun.ts';
import type { Hotfix, Rangee } from './cache-jeu.ts';
import { dossierWago } from './wago.ts';

export interface Candidat {
  id: number;
  nom: string;
  nomEn?: string;
  q: 2 | 3 | 4 | 5;
  ilvl: number;
  niveau: number;
  /** Niveau requis brut du jeu (0 = aucun : courant pour les récompenses de quête de Forever). */
  niveauRequis: number;
  liaison: 1 | 2;
  unique?: 1 | 2;
  emplacement: Emplacement;
  inv: number;
  matiere?: Matiere;
  stats: Partial<Record<Stat, number>>;
  statsInconnues: number[];
  armure: number;
  arme?: Arme;
  /** Bâton de lanceur de sorts : DPS réel plus bas que la formule. */
  lanceur: boolean;
  effets: Effet[];
  icone?: string;
  /** Numéro de fichier de l'icône (secours : CDN de Blizzard). */
  iconeId?: number;
  /** Présent dans le cache des objets révélés. */
  revele: boolean;
}

const STATS: Record<number, Stat> = {
  3: 'agi', 4: 'for', 5: 'int', 6: 'esp', 7: 'end', 38: 'pa', 32: 'crit', 31: 'tou', 36: 'hate', 37: 'exp',
  12: 'def', 13: 'esq', 14: 'par', 50: 'armure', 48: 'blocage', 45: 'pds', 41: 'soins', 42: 'dsorts', 43: 'mp5', 46: 'vie5',
  51: 'rfeu', 52: 'rgivre', 54: 'rombre', 55: 'rnature', 56: 'rarcane', 128: 'pa_mv', 125: 'pa_hum', 131: 'pa_bete', 127: 'pa_dem',
  // Stats propres à Forever, identifiées sur wowf.io : dégâts par école de magie, pénétration des sorts
  47: 'penet', 83: 'dphys', 84: 'dsacre', 85: 'dfeu', 86: 'dnature', 87: 'dgivre', 88: 'dombre', 89: 'darcane',
};

// Colonne du budget de stats (RandPropPoints) selon l'emplacement.
const INDEX_BUDGET: Record<number, number> = {
  1: 0, 5: 0, 20: 0, 7: 0, 17: 0, 3: 1, 10: 1, 6: 1, 8: 1, 12: 1, 9: 2, 2: 2, 11: 2, 16: 2, 23: 2, 14: 2, 13: 3, 21: 3, 22: 3, 28: 4,
};
const EMPLACEMENT_ARMURE: Record<number, Emplacement> = {
  1: 'tete', 3: 'epaules', 5: 'torse', 20: 'torse', 6: 'taille', 7: 'jambes', 8: 'pieds', 9: 'poignets', 10: 'mains',
};
const MATIERE_PAR_SOUS = Object.fromEntries(Object.entries(SOUS_CLASSE_ARMURE).map(([m, s]) => [s, m as Matiere])) as Record<number, Matiere>;

/**
 * Emplacement (et matière pour l'armure) d'un objet que la classe peut porter, sinon null.
 * Les armes à distance (arcs, fusils, baguettes, armes de jet) attendent leur emplacement à elles.
 */
function emplacement(eq: EquipementClasse, classe: number, sous: number, inv: number): { emp: Emplacement; matiere?: Matiere } | null {
  const armure = EMPLACEMENT_ARMURE[inv];
  const matiere = MATIERE_PAR_SOUS[sous];
  if (classe === 4 && armure && matiere && eq.armures.some((a) => a.matiere === matiere)) return { emp: armure, matiere };
  if (classe === 2 && eq.armes.includes(sous)) return inv === 17 ? { emp: 'arme2m' } : [13, 21].includes(inv) ? { emp: 'arme1m' } : null;
  if (classe === 4 && sous === 0 && inv === 2) return { emp: 'cou' };
  if (classe === 4 && sous === 0 && inv === 11) return { emp: 'doigt' };
  if (classe === 4 && sous === 0 && inv === 12) return { emp: 'bijou' };
  if (classe === 4 && sous === 0 && inv === 23) return { emp: 'maing' };
  if (classe === 4 && sous === 6 && inv === 14 && eq.bouclier) return { emp: 'bouclier' };
  if (classe === 4 && inv === 16) return { emp: 'dos' };
  if (classe === 4 && eq.relique && sous === eq.relique.sous && inv === 28) return { emp: 'relique' };
  return null;
}

/** Rapport DPS réel / formule pour les armes de lanceur de sorts (mesuré sur 140 armes vérifiées sur wowf.io). */
const FACTEUR_LANCEUR = { arme2m: 0.745, arme1m: 0.66 } as const;

const nombre = (v: string | number | undefined): number => Number(v ?? 0);

export function extraireObjets(build: string, hotfix: Hotfix, eq: EquipementClasse): Candidat[] {
  const masque = 1 << (eq.idJeu - 1);
  const d = dossierWago(build);
  const lire = (t: string) => lireCsv(path.join(d, `${t}.csv`));

  const base = lire('ItemSparse');
  const nomsEn = new Map(base.map((r) => [r.ID ?? '', r.Display_lang ?? '']));
  const sparse = new Map<string, Ligne | Rangee>(base.map((r) => [r.ID ?? '', r]));
  const nomsFr = new Map(lire('ItemSparse.fr').map((r) => [r.ID ?? '', r.Display_lang ?? '']));
  for (const [id, r] of Object.entries(hotfix.sparse)) {
    sparse.set(id, r);
    nomsFr.set(id, String(r.Display_lang ?? ''));
  }
  const items = new Map<string, Ligne | Rangee>(lire('Item').map((r) => [r.ID ?? '', r]));
  for (const [id, r] of Object.entries(hotfix.item)) items.set(id, r);

  const budget = indexer(lire('RandPropPoints'));
  const degats1 = indexer(lire('ItemDamageOneHand'));
  const degats2 = indexer(lire('ItemDamageTwoHand'));
  const armTotal = indexer(lire('ItemArmorTotal'), 'ItemLevel');
  const armLieu = indexer(lire('ArmorLocation'));
  const armQualite = indexer(lire('ItemArmorQuality'));
  const fichiers = indexer(lire('ManifestInterfaceData'));
  const apparenceObjet = new Map<string, Ligne>();
  for (const r of lire('ItemModifiedAppearance')) {
    const cle = r.ItemID ?? '';
    if (!apparenceObjet.has(cle) || r.ItemAppearanceModifierID === '0') apparenceObjet.set(cle, r);
  }
  const apparences = indexer(lire('ItemAppearance'));

  // Effets d'objet → sorts → descriptions françaises
  const effetParId = indexer(lire('ItemEffect'));
  const effetsObjet = new Map<string, Ligne[]>();
  for (const r of lire('ItemXItemEffect')) {
    const e = effetParId.get(r.ItemEffectID ?? '');
    if (!e) continue;
    const l = effetsObjet.get(r.ItemID ?? '') ?? [];
    l.push(e);
    effetsObjet.set(r.ItemID ?? '', l);
  }
  const effetsSort = new Map<string, Ligne[]>();
  for (const r of lire('SpellEffect')) {
    const l = effetsSort.get(r.SpellID ?? '') ?? [];
    l.push(r);
    effetsSort.set(r.SpellID ?? '', l);
  }
  for (const l of effetsSort.values()) l.sort((a, b) => nombre(a.EffectIndex) - nombre(b.EffectIndex));
  const sortsFr = indexer(lire('Spell.fr'));
  const sortMisc = indexer(lire('SpellMisc'), 'SpellID');
  const durees = indexer(lire('SpellDuration'));

  function description(sort: string): string | null {
    let t = sortsFr.get(sort)?.Description_lang ?? '';
    if (!t) return null;
    const ef = effetsSort.get(sort) ?? [];
    const misc = sortMisc.get(sort);
    const duree = misc ? nombre(durees.get(misc.DurationIndex ?? '')?.Duration) / 1000 : 0;
    const fmtDuree = (s: number) => (s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`);
    const valeur = (ref: string, n: string): number | null => {
      const liste = ref ? effetsSort.get(ref) ?? [] : ef;
      const e = liste[Number(n) - 1];
      return e ? Math.abs(nombre(e.EffectBasePointsF)) : null;
    };
    t = t.replace(/\$\{([^}]*)\}/g, (tout, expr: string) => {
      const ex = expr.replace(/\$(\d*)[sSmM](\d)/g, (_z, ref: string, n: string) => String(valeur(ref, n) ?? 'NaN'));
      if (!/^[\d\s.+\-*/()]+$/.test(ex)) return tout;
      const v = Function(`return (${ex})`)() as number;
      return Number.isFinite(v) ? String(Math.round(v)) : tout;
    });
    t = t.replace(/\$(\d*)([sSmMoOdDtT])(\d)?/g, (tout, ref: string, k: string, n?: string) => {
      if (/[sSmM]/.test(k) && n) { const v = valeur(ref, n); return v === null ? tout : String(Math.round(v)); }
      if (/[dD]/.test(k)) return fmtDuree(duree);
      const e = n ? ef[Number(n) - 1] : undefined;
      if (/[tT]/.test(k) && e) return fmtDuree(nombre(e.EffectAuraPeriod) / 1000);
      if (/[oO]/.test(k) && e) return String(Math.round(nombre(e.EffectBasePointsF) * duree / (nombre(e.EffectAuraPeriod) / 1000 || 1)));
      return tout;
    });
    t = t.replace(/\$[lL]([^:;]*):([^;]*);/g, '$2');
    return t.replace(/\r?\n/g, ' ').trim();
  }

  const sortie: Candidat[] = [];
  for (const [id, s] of sparse) {
    const it = items.get(id);
    if (!it) continue;
    const inv = nombre(s.InventoryType);
    const place = emplacement(eq, nombre(it.ClassID), nombre(it.SubclassID), inv);
    if (!place) continue;
    const emp = place.emp;
    const rl = nombre(s.RequiredLevel);
    const ilvl = nombre(s.ItemLevel);
    const q = nombre(s.OverallQualityID);
    if (rl > 60 || q < 2 || q > 5 || ilvl < 5) continue;
    const classes = nombre(s.AllowableClass);
    if (classes !== -1 && classes !== 0 && !(classes & masque)) continue;
    if (/TEST|DEPRECATED|^OLD|\[PH\]|Monster -/i.test(String(s.Display_lang))) continue;

    const ligneBudget = budget.get(String(ilvl));
    const colonne = q >= 4 ? 'EpicF_' : q === 3 ? 'SuperiorF_' : 'GoodF_';
    const pts = ligneBudget ? nombre(ligneBudget[colonne + (INDEX_BUDGET[inv] ?? 2)]) : 0;
    const stats: Partial<Record<Stat, number>> = {};
    const inconnues: number[] = [];
    let aucuneStat = true;
    for (let i = 0; i < 10; i++) {
      const type = nombre(s[`StatModifier_bonusStat_${i}`]);
      const part = nombre(s[`StatPercentEditor_${i}`]);
      if (type < 0 || !part) continue;
      aucuneStat = false;
      const v = Math.floor(pts * part / 10000 + 0.5);
      const cle = STATS[type];
      if (cle) stats[cle] = (stats[cle] ?? 0) + v; else inconnues.push(type);
    }

    let armure = 0;
    if (place.matiere || emp === 'dos') {
      const t = armTotal.get(String(ilvl));
      const l = armLieu.get(String(inv));
      const aq = armQualite.get(String(ilvl));
      if (t && l && aq) {
        // Colonnes des tables d'armure selon la matière (une cape compte comme du tissu).
        const [total, lieu] = ({
          tissu: ['Cloth', 'Clothmodifier'], cuir: ['Leather', 'Leathermodifier'],
          mailles: ['Mail', 'Chainmodifier'], plaques: ['Plate', 'Platemodifier'],
        } as const)[place.matiere ?? 'tissu'];
        armure = Math.round(nombre(t[total]) * nombre(l[lieu]) * nombre(aq[`Qualitymod_${q}`]));
      }
    }

    let arme: Arme | undefined;
    const lanceur = (nombre(s.Flags_4) & 0x100) !== 0;
    if (emp === 'arme2m' || emp === 'arme1m') {
      const table = emp === 'arme2m' ? degats2 : degats1;
      // Arme de lanceur : la formule surestime les dégâts, on applique le rapport mesuré.
      const dps = nombre(table.get(String(ilvl))?.[`Quality_${q}`]) * (lanceur ? FACTEUR_LANCEUR[emp] : 1);
      const vitesse = nombre(s.ItemDelay) / 1000;
      const ecart = nombre(s.DmgVariance);
      const min = Math.floor(dps * vitesse * (1 - ecart / 2));
      const max = Math.floor(dps * vitesse * (1 + ecart / 2) + 0.5);
      arme = { min, max, vitesse, dps: Math.round(((min + max) / 2 / vitesse) * 10) / 10, sous: nombre(it.SubclassID), estime: lanceur || undefined };
    }

    const effets: Effet[] = [];
    for (const e of effetsObjet.get(id) ?? []) {
      const texte = description(e.SpellID ?? '');
      if (!texte) continue;
      const declencheur = nombre(e.TriggerType);
      const proc = (effetsSort.get(e.SpellID ?? '') ?? []).some((f) => f.EffectAura === '42');
      effets.push({ type: declencheur === 0 ? 0 : declencheur === 2 || proc ? 2 : 1, texte });
    }

    // Objet à propriétés aléatoires (« du singe »…) : stats inconnues d'avance, on l'écarte.
    if (aucuneStat && !arme && !effets.length) continue;

    let fichier = nombre(it.IconFileDataID);
    if (!fichier) {
      const app = apparenceObjet.get(id);
      fichier = nombre(apparences.get(app?.ItemAppearanceID ?? '')?.DefaultIconFileDataID);
    }
    // Quelques noms de fichier de Blizzard contiennent une espace : on la remplace pour le nom local.
    const icone = fichiers.get(String(fichier))?.FileName?.replace(/\.blp$/i, '').toLowerCase().replace(/\s+/g, '_');
    const flags0 = nombre(s.Flags_0) >>> 0;
    const unique = nombre(s.MaxCount) === 1 ? 1 : flags0 & 0x80000 ? 2 : undefined;

    sortie.push({
      id: Number(id),
      nom: nomsFr.get(id) || String(s.Display_lang),
      nomEn: nomsEn.get(id) || undefined,
      q: q as Candidat['q'],
      ilvl,
      niveau: Math.max(1, rl),
      niveauRequis: rl,
      liaison: nombre(s.Bonding) === 1 ? 1 : 2,
      unique,
      emplacement: emp,
      inv,
      matiere: place.matiere,
      stats,
      statsInconnues: inconnues,
      armure,
      arme,
      lanceur,
      effets,
      icone,
      iconeId: fichier || undefined,
      revele: id in hotfix.sparse,
    });
  }
  return sortie;
}
