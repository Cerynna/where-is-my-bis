// Fiches d'objets de wowf.io (version française) : provenance, quêtes, dégâts exacts des armes, textes d'effets.
// Les pages sont gardées en cache sur disque : une relance ne retélécharge que les nouvelles.
import fs from 'node:fs';
import path from 'node:path';
import type { Effet, Faction, Source } from '../../src/types.ts';
import { CACHE, attendre, telecharger } from './commun.ts';

const DOSSIER = path.join(CACHE, 'wowf', 'fr');
const DELAI_MS = 700;

export interface Fiche {
  sources: Source[];
  /** « Quête disponible au niveau N » : pour les récompenses sans niveau requis. */
  disponible?: number;
  arme?: { min: number; max: number; vitesse: number; dps: number };
  effets: Effet[];
}

/** Identifiants des objets connus de wowf.io (plan du site). */
export async function idsConnus(): Promise<Set<number>> {
  const f = path.join(CACHE, 'wowf', 'sitemap-en.xml');
  // Le plan change quand de nouveaux objets sont révélés : on le reprend s'il date de plus d'un jour.
  if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs > 86_400_000) fs.rmSync(f);
  await telecharger('https://wowf.io/item-sitemaps/sitemap/en.xml', f);
  const ids = new Set<number>();
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/\/items\/(\d+)</g)) ids.add(Number(m[1]));
  return ids;
}

/**
 * Télécharge les fiches manquantes, dans l'ordre donné, avec quelques requêtes en parallèle.
 * `etape` est appelée toutes les 200 fiches (pour reconstruire les données au fil de l'eau).
 */
export async function recupererFiches(ids: number[], etape?: () => void): Promise<void> {
  const manquants = ids.filter((id) => !fs.existsSync(path.join(DOSSIER, `${id}.html`)));
  if (!manquants.length) return;
  const PARALLELE = 3;
  console.log(`wowf.io : ${manquants.length} fiches à télécharger (≈ ${Math.ceil(manquants.length * (DELAI_MS + 1300) / PARALLELE / 60000)} min)`);
  let n = 0;
  let suivant = 0;
  const travailleur = async () => {
    while (suivant < manquants.length) {
      const id = manquants[suivant++]!;
      try {
        const ok = await telecharger(`https://wowf.io/fr/items/${id}`, path.join(DOSSIER, `${id}.html`), { 'User-Agent': 'Mozilla/5.0 (feral-forever)' });
        if (!ok) fs.writeFileSync(path.join(DOSSIER, `${id}.html`), '');
      } catch {
        console.warn(`  fiche ${id} abandonnée, reprise à la prochaine exécution`);
      }
      if (++n % 100 === 0) console.log(`  ${n}/${manquants.length}`);
      if (n % 200 === 0) etape?.();
      await attendre(DELAI_MS);
    }
  };
  await Promise.all(Array.from({ length: PARALLELE }, travailleur));
}

const entites = (t: string) =>
  t.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const texte = (html: string) => entites(html.replace(/<!--.*?-->/g, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const RANGS = /(Neutre|Amical|Honoré|Révéré|Exalté)/;

function classer(href: string, t: string, faction: Faction | undefined, niveaux: Map<string, number>): Source {
  const base = { faction } as Partial<Source>;
  if (/Provenance pas encore révélée/i.test(t)) return { type: 'inconnue', lieu: 'Provenance pas encore révélée' };
  if (/^Butin aléatoire/i.test(t)) return { type: 'monde', lieu: 'Butin aléatoire' };
  const [lieu = t, ...reste] = t.split(' · ');
  const detail = reste.join(' · ') || undefined;
  if (href.includes('/quests/')) {
    const id = href.match(/\/quests\/(\d+)/)?.[1] ?? '';
    const nom = detail?.match(/Quête « (.*) »/)?.[1] ?? detail;
    // « Récompenses de quête · Nom » ou « Quête · Nom » : wowf.io ne donne pas la zone.
    const zone = /^(Récompenses? de quête|Quête)$/i.test(lieu) ? '' : lieu;
    return { ...base, type: 'quete', lieu: zone, detail: nom, niveau: niveaux.get(id) } as Source;
  }
  if (href.includes('/raids/')) return { ...base, type: 'raid', lieu, detail } as Source;
  if (href.includes('/dungeons/')) return { ...base, type: 'donjon', lieu, detail: detail === 'Monstres de base' ? 'monstres du donjon' : detail } as Source;
  if (href.includes('/professions/')) return { type: 'metier', lieu: lieu.replace(/^Recette de /, ''), detail };
  if (RANGS.test(t)) {
    // « Marchand · PNJ · Faction Rang (Alliance) » → lieu = faction, détail = rang · PNJ
    const parts = t.split(' · ');
    const iRang = parts.findIndex((p) => RANGS.test(p));
    const m = parts[iRang]?.match(/^(.*?)\s*(Neutre|Amical|Honoré|Révéré|Exalté)\s*(\((Alliance|Horde)\))?$/);
    const pnj = parts.filter((p, i) => i !== iRang && p !== 'Marchand').join(' · ');
    if (m && m[1]) return { ...base, type: 'rep', lieu: m[1], detail: [m[2], pnj].filter(Boolean).join(' · ') } as Source;
    return { ...base, type: 'rep', lieu, detail } as Source;
  }
  if (/Marchand|Vendeur|Intendant/i.test(t)) return { ...base, type: 'vendeur', lieu, detail } as Source;
  if (/Rang|JcJ|Honneur|Champ de bataille/i.test(t)) return { ...base, type: 'jcj', lieu, detail } as Source;
  return { ...base, type: 'autre', lieu, detail } as Source;
}

export function lireFiche(id: number): Fiche | null {
  const f = path.join(DOSSIER, `${id}.html`);
  if (!fs.existsSync(f)) return null;
  const html = fs.readFileSync(f, 'utf8').split('self.__next_f')[0] ?? '';
  if (!html.includes('>Provenance<')) return null;

  // Niveaux des quêtes (bloc « Récompense de »)
  const niveaux = new Map<string, number>();
  const recomp = html.match(/>Récompense de<\/h2>([\s\S]*?)<\/ul>/)?.[1] ?? '';
  for (const li of recomp.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const q = li[1]?.match(/\/quests\/(\d+)/)?.[1];
    const niv = texte(li[1] ?? '').match(/Niveau (\d+)/)?.[1];
    if (q && niv) niveaux.set(q, Number(niv));
  }

  const sources: Source[] = [];
  const prov = html.match(/>Provenance<\/h2>([\s\S]*?)<\/ul>/)?.[1] ?? '';
  for (const li of prov.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const contenu = li[1] ?? '';
    const href = contenu.match(/href="([^"]*)"/)?.[1] ?? '';
    const lien = contenu.match(/<a[^>]*>([\s\S]*?)<\/a>/)?.[1];
    const t = texte(lien ?? contenu);
    const fac = texte(contenu).match(/\((Alliance|Horde)\)/)?.[1] as Faction | undefined;
    sources.push(classer(href, t, fac, niveaux));
  }

  // Infobulle : dégâts exacts et lignes d'effet
  const debut = html.indexOf('<h1');
  const bloc = html.slice(debut, html.indexOf('>Provenance<'));
  const jetons = entites(bloc.replace(/<!--.*?-->/g, '').replace(/<[^>]*>/g, '\u0001')).split('\u0001').map((s) => s.trim()).filter(Boolean);
  const plat = jetons.join(' | ');
  let arme: Fiche['arme'];
  const dg = plat.match(/Dégâts : (\d+) - (\d+)/);
  const vit = plat.match(/Vitesse ([\d.]+)/);
  const dps = plat.match(/\(([\d.]+) dégâts par seconde\)/);
  if (dg && vit && dps) arme = { min: Number(dg[1]), max: Number(dg[2]), vitesse: Number(vit[1]), dps: Number(dps[1]) };

  const effets: Effet[] = [];
  const LIBELLES: Record<string, Effet['type']> = { 'Équipé :': 1, 'Utiliser :': 0, 'Chances quand vous touchez :': 2 };
  for (let i = 0; i < jetons.length; i++) {
    const type = LIBELLES[jetons[i] ?? ''];
    if (type === undefined) continue;
    let t = jetons[i + 1] ?? '';
    if (/^\(.*recharge/.test(jetons[i + 2] ?? '')) t += ' ' + jetons[i + 2];
    // Les lignes de stats (« +28 Coup critique ») sont déjà calculées à part.
    if (!t || /^[+-]\d+ [^.]*$/.test(t)) continue;
    effets.push({ type, texte: t });
  }
  const dispo = plat.match(/Quête disponible au niveau (\d+)/)?.[1];
  return { sources, arme, effets, disponible: dispo ? Number(dispo) : undefined };
}
