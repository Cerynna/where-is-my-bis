// Provenances tirées de l'addon AzerothCompendium (installé dans le jeu) : butin des boss et des monstres
// de base des donjons et des raids (avec taux), récompenses de quête, marchands de réputation et de JcJ.
// Les noms anglais de l'addon sont traduits avec les tables du jeu ; les quêtes avec leur page wowf.io.
import fs from 'node:fs';
import path from 'node:path';
import type { Faction, Source } from '../../src/types.ts';
import { CACHE, attendre, indexer, lireCsv, telecharger } from './commun.ts';
import { nomDonjon } from './donjons.ts';
import { champ, liste, lireTable, type ValeurLua } from './lua.ts';
import { dossierWago } from './wago.ts';

export const COMPENDIUM = process.env.COMPENDIUM ?? 'D:/Games/World of Warcraft/_forever_/Interface/AddOns/AzerothCompendium';
const DOSSIER_QUETES = path.join(CACHE, 'wowf', 'quetes');

/** Noms des cartes du jeu → noms des pages de donjon de wowf.io, quand ils diffèrent. */
const ALIAS_FR: Record<string, string> = { Mortemines: 'Les mortemines', 'Prison de Hurlevent': 'La Prison' };

const RANGS: Record<string, string> ={ Exalted: 'Exalté', Revered: 'Révéré', Honored: 'Honoré', Friendly: 'Amical', Neutral: 'Neutre' };
const nb = (v: ValeurLua | undefined) => (typeof v === 'number' ? v : Number(v ?? 0));
const ch = (v: ValeurLua | undefined) => (typeof v === 'string' ? v : '');
const pourcent = (p: number) => (p >= 1 ? `${Math.round(p)} %` : p >= 0.1 ? `${p.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : p > 0 ? '< 0,1 %' : '');
const normaliser = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, "'").toLowerCase();

function lire(fichier: string): string {
  const f = path.join(COMPENDIUM, 'data', fichier);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
}

export interface Compendium {
  sources: Map<number, Source[]>;
  /**
   * Objets gardés même s'ils n'ont pas encore été vus en jeu : butin des donjons propres à Forever
   * et objets des marchands de réputation JcE (Cartel Gentepression, Poudremèche, etc.).
   */
  forever: Set<number>;
  /** Quêtes citées, pour télécharger leur page wowf.io. */
  quetes: Map<number, number[]>;
}

// ---- Quêtes (pages wowf.io en français) ----

export interface InfoQuete { nom: string; niveau?: number; requis?: number; zone?: string; faction?: Faction }

export async function recupererQuetes(ids: number[]): Promise<void> {
  const manquantes = ids.filter((id) => !fs.existsSync(path.join(DOSSIER_QUETES, `${id}.html`)));
  if (manquantes.length) console.log(`Quêtes wowf.io : ${manquantes.length} pages à télécharger`);
  for (const id of manquantes) {
    try {
      const ok = await telecharger(`https://wowf.io/fr/quests/${id}`, path.join(DOSSIER_QUETES, `${id}.html`), { 'User-Agent': 'Mozilla/5.0 (feral-forever)' });
      if (!ok) fs.writeFileSync(path.join(DOSSIER_QUETES, `${id}.html`), '');
    } catch { /* reprise à la prochaine exécution */ }
    await attendre(700);
  }
}

export function lireQuete(id: number): InfoQuete | null {
  const f = path.join(DOSSIER_QUETES, `${id}.html`);
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f, 'utf8').split('self.__next_f')[0] ?? '';
  const i = html.indexOf('<h1');
  if (i < 0) return null;
  const jetons = html.slice(i, i + 3000).replace(/<!--.*?-->/g, '').replace(/<[^>]*>/g, '\u0001')
    .replace(/&#x27;/g, "'").replace(/&amp;/g, '&').split('\u0001').map((s) => s.trim()).filter(Boolean);
  const nom = jetons[0];
  if (!nom) return null;
  const ligne = jetons.find((t) => /^Niveau \d+/.test(t)) ?? '';
  const faction = jetons.slice(1, 3).find((t) => t === 'Alliance' || t === 'Horde') as Faction | undefined;
  const parts = ligne.split(' · ');
  return {
    nom,
    niveau: Number(ligne.match(/^Niveau (\d+)/)?.[1]) || undefined,
    requis: Number(ligne.match(/Niveau requis (\d+)/)?.[1]) || undefined,
    zone: parts.find((p) => !/^Niveau/.test(p)),
    faction,
  };
}

// ---- Addon ----

export function lireCompendium(build: string, nomsDonjons: string[]): Compendium {
  const res: Compendium = { sources: new Map(), forever: new Set(), quetes: new Map() };
  if (!fs.existsSync(COMPENDIUM)) {
    console.warn('AzerothCompendium introuvable :', COMPENDIUM);
    return res;
  }
  const ajouter = (id: number, s: Source) => {
    if (!id) return;
    const l = res.sources.get(id) ?? [];
    if (!l.some((x) => x.type === s.type && x.lieu === s.lieu && x.detail === s.detail)) l.push(s);
    res.sources.set(id, l);
  };

  // Traductions : zone → carte → nom français ; rencontres et factions
  const d = dossierWago(build);
  const lireW = (t: string) => lireCsv(path.join(d, `${t}.csv`));
  const zones = indexer(lireW('AreaTable'));
  const cartesFr = indexer(lireW('Map.fr'));
  const cartesEn = new Map(lireW('Map').map((r) => [r.MapName_lang ?? '', r.ID ?? '']));
  const rencontresEn = new Map(lireW('DungeonEncounter').map((r) => [r.ID ?? '', r.Name_lang ?? '']));
  const boss = new Map<string, string>();
  for (const r of lireW('DungeonEncounter.fr')) { const en = rencontresEn.get(r.ID ?? ''); if (en) boss.set(en, r.Name_lang ?? en); }
  const factionsFr = indexer(lireW('Faction.fr'));
  const parNormal = new Map(nomsDonjons.map((n) => [normaliser(n), n]));

  // Cartes d'instance (donjons et raids) : la zone de l'addon est parfois la zone extérieure
  // (Monastère écarlate dans Tirisfal, Mont Rochenoire…), dont le continent ne dit rien du donjon.
  const instancesCartes = new Set(lireW('Map').filter((r) => Number(r.InstanceType) > 0).map((r) => r.ID ?? ''));
  const ALIAS: Record<string, string> = { "The Temple of Atal'Hakkar": 'Sunken Temple', "Ahn'Qiraj": "Ahn'Qiraj Temple" };
  const nomInstance = (inst: ValeurLua): string => {
    const en = ch(champ(inst, 'name'));
    const zone = zones.get(String(nb(champ(inst, 'areaID'))));
    const parZone = zone?.ContinentID && instancesCartes.has(zone.ContinentID) ? zone.ContinentID : '';
    const carte = cartesEn.get(en) ?? cartesEn.get(ALIAS[en] ?? '') ?? parZone;
    const fr = nomDonjon(cartesFr.get(carte)?.MapName_lang || en);
    const vu = ALIAS_FR[fr] ?? fr;
    return parNormal.get(normaliser(vu)) ?? vu;
  };

  // Boss et monstres de base des donjons et des raids
  const instances = lireTable(lire('instances.lua'), 'AzerothCompendium.INSTANCES =');
  const nomsParAnglais = new Map<string, { lieu: string; type: 'donjon' | 'raid'; forever: boolean }>();
  for (const inst of liste(instances)) {
    const type = ch(champ(inst, 'type')) === 'raid' ? 'raid' : 'donjon';
    const lieu = nomInstance(inst);
    const forever = champ(inst, 'forever') === true;
    nomsParAnglais.set(ch(champ(inst, 'name')), { lieu, type, forever });
    for (const b of liste(champ(inst, 'bosses'))) {
      // Sous-titre éventuel (« Archaedas <Ancient Stone Watcher> ») retiré avant traduction.
      const nomBoss = ch(champ(b, 'name')).replace(/\s*<[^>]*>/, '').trim();
      for (const l of liste(champ(b, 'loot'))) {
        const id = nb(champ(l, 1));
        const p = nb(champ(l, 2));
        const taux = pourcent(p);
        ajouter(id, { type, lieu, detail: `${boss.get(nomBoss) ?? nomBoss}${taux ? ` (${taux})` : ''}`, taux: p || undefined });
        if (forever) res.forever.add(id);
      }
    }
  }
  const trash = lireTable(lire('trash.lua'), 'local lootByInstance =');
  for (const [nomEn, objets] of Object.entries(trash?.champs ?? {})) {
    const inst = nomsParAnglais.get(nomEn);
    if (!inst) continue;
    for (const o of liste(objets)) {
      const id = nb(champ(o, 1));
      const p = nb(champ(o, 2));
      const taux = pourcent(p);
      ajouter(id, { type: inst.type, lieu: inst.lieu, detail: `monstres du donjon${taux ? ` (${taux})` : ''}`, taux: p || undefined });
      if (inst.forever) res.forever.add(id);
    }
  }

  // Marchands : rangs d'honneur et réputations (camp d'après pvp_sides.lua : 1 Alliance, 2 Horde)
  const camps = lireTable(lire('pvp_sides.lua'), 'AzerothCompendium.ITEMSIDES =');
  const marchands = lireTable(lire('vendors.lua'), 'AzerothCompendium.VENDORS =');
  for (const v of liste(marchands)) {
    const factionId = nb(champ(v, 'factionID'));
    const nomEn = ch(champ(v, 'name'));
    const honneur = champ(v, 'honor') === true;
    // Les marchands JcE (avec une catégorie dans l'addon : steamwheedle, world, warfront, dungeon) vendent
    // déjà en jeu, même quand personne n'a encore révélé leurs objets (marchands du Cartel ajoutés après
    // la sortie). Ceux du JcJ (rangs d'honneur, champs de bataille) restent soumis à la règle commune.
    const jce = !!ch(champ(v, 'category'));
    const lieu =factionId ? factionsFr.get(String(factionId))?.Name_lang || nomEn : honneur ? 'Rangs d’honneur' : nomEn;
    for (const b of liste(champ(v, 'bosses'))) {
      const rang = ch(champ(b, 'name'));
      const detail = RANGS[rang] ?? rang.replace(/^Rank (\d+)$/, 'Rang $1');
      for (const l of liste(champ(b, 'loot'))) {
        const id = nb(champ(l, 1));
        const camp = nb(champ(camps, String(id)) ?? camps?.champs[String(id)]);
        const faction: Faction | undefined = camp === 1 ? 'Alliance' : camp === 2 ? 'Horde' : undefined;
        ajouter(id, { type: honneur ? 'jcj' : 'rep', lieu, detail, faction });
        if (jce) res.forever.add(id);
      }
    }
  }

  // Récompenses de quête : les noms viennent des pages wowf.io (téléchargées à part)
  const recompenses = lireTable(lire('quest_rewards.lua'), 'AzerothCompendium.QUESTREWARDS =');
  for (const [q, r] of Object.entries(recompenses?.champs ?? {})) {
    for (const cle of ['items', 'choices']) {
      for (const l of liste(champ(r, cle))) {
        const id = nb(champ(l, 1));
        const qs = res.quetes.get(id) ?? [];
        qs.push(Number(q));
        res.quetes.set(id, qs);
      }
    }
  }
  return res;
}

/** Sources de quête d'un objet, une fois les pages de quête téléchargées. */
export function sourcesQuetes(comp: Compendium, id: number): Source[] {
  return (comp.quetes.get(id) ?? []).map((q) => {
    const i = lireQuete(q);
    return i
      ? { type: 'quete', lieu: i.zone ?? '', detail: i.nom, niveau: i.requis ?? i.niveau, faction: i.faction }
      : { type: 'quete', lieu: '', detail: `Quête n° ${q}` };
  });
}
