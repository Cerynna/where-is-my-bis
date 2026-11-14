// Assemble public/data/objets.json : candidats du jeu + provenance wowf.io,
// sans les butins du monde improbables ni les objets inutiles à un druide (toutes spécialisations).
import fs from 'node:fs';
import path from 'node:path';
import type { Donnees, Objet, Source, Stat } from '../../src/types.ts';
import { CACHE, PUBLIC, attendre, ecrireJson, estPrincipal, lireJson, telecharger } from './commun.ts';
import type { Candidat } from './objets.ts';
import { lireDonjons, niveauxDonjons, nomDonjon } from './donjons.ts';
import { lireFiche } from './wowf.ts';

// Stats qui servent à au moins une spécialisation du druide (félin, ours, équilibre, restauration).
const UTILES: Stat[] = [
  'agi', 'for', 'end', 'pa', 'crit', 'tou', 'hate', 'exp', 'def', 'esq', 'par', 'armure', 'pa_mv', 'pa_hum', 'pa_bete', 'pa_dem',
  'int', 'esp', 'pds', 'soins', 'dsorts', 'mp5', 'dnature', 'darcane', 'penet',
];
const EFFET_UTILE = /attaque|agilité|force|armure|esquive|critique|toucher|dégâts physiques|vitesse d'attaque|vitesse de déplacement|forme|sorts|soins|mana|Colère|Feu stellaire|Éclat lunaire|Toucher guérisseur|Récupération|Rétablissement/i;

export interface Bilan { gardes: number; ecartes: Record<string, number> }

function utile(c: Candidat): boolean {
  // Idoles : toutes celles dont l'effet est lisible (les runes de Saison de la découverte n'existent pas sur Forever).
  if (c.emplacement === 'relique') return c.effets.some((e) => !e.texte.includes('$') && !/^Grave sur/.test(e.texte));
  if (c.arme) return true;
  if (UTILES.some((s) => (c.stats[s] ?? 0) > 0)) return true;
  return c.effets.some((e) => EFFET_UTILE.test(e.texte));
}

/**
 * Effets permanents (« Équipé : ») qui sont en fait des stats sur les objets classiques :
 * puissance des sorts et mana toutes les 5 s. Les effets temporaires (« pendant N s ») ne comptent pas.
 */
function statsDesEffets(effets: Objet['effets']): Partial<Record<Stat, number>> {
  const s: Partial<Record<Stat, number>> = {};
  for (const e of effets) {
    if (e.type !== 1 || /pendant \d/.test(e.texte)) continue;
    const pds = e.texte.match(/Augmente les dégâts (?:infligés )?et les soins (?:produits|prodigués) par les sorts et effets magiques (?:de |d’un maximum de |d'un maximum de )?(\d+)/);
    if (pds) s.pds = (s.pds ?? 0) + Number(pds[1]);
    const mana = e.texte.match(/^Rend (\d+) points? de mana toutes les 5 s/);
    if (mana) s.mp5 = (s.mp5 ?? 0) + Number(mana[1]);
  }
  return s;
}

export function construire(build: string): Bilan {
  const candidats = lireJson<Candidat[]>(path.join(CACHE, 'candidats.json'));
  // Objets connus de wowf.io : tant que leur fiche manque, on ne devine pas leur provenance.
  const plan = path.join(CACHE, 'wowf', 'sitemap-en.xml');
  const connus = new Set<number>();
  if (fs.existsSync(plan)) for (const m of fs.readFileSync(plan, 'utf8').matchAll(/\/items\/(\d+)</g)) connus.add(Number(m[1]));
  const donjons = lireDonjons();
  const niveauxDonjon = niveauxDonjons();
  const ecartes: Record<string, number> = {};
  const ecarter = (raison: string) => { ecartes[raison] = (ecartes[raison] ?? 0) + 1; };
  const objets: Objet[] = [];

  for (const c of candidats) {
    if (!utile(c)) { ecarter('sans stat utile au druide'); continue; }
    const fiche = lireFiche(c.id);
    const enDonjon = donjons.get(c.id) ?? [];
    let sources: Source[];
    if (fiche) {
      // Les tableaux de butin des donjons sont complets : ils remplacent les lignes de donjon de la fiche.
      const autres = fiche.sources
        .filter((s) => !(enDonjon.length && s.type === 'donjon'))
        .map((s) => (s.type === 'donjon' ? { ...s, lieu: nomDonjon(s.lieu) } : s));
      sources = [...autres, ...enDonjon];
    } else if (enDonjon.length) sources = enDonjon;
    else if (connus.has(c.id) && !fs.existsSync(path.join(CACHE, 'wowf', 'fr', `${c.id}.html`))) {
      ecarter('fiche pas encore téléchargée'); continue;
    } else if (c.revele && c.liaison === 2) sources = [{ type: 'monde', lieu: 'Butin aléatoire' }];
    else { ecarter(c.revele ? 'provenance introuvable' : 'jamais vu en jeu'); continue; }
    // Un butin de donjon n'est pas un butin du monde, même si la fiche le dit aussi.
    if (sources.some((s) => s.type === 'donjon')) sources = sources.filter((s) => s.type !== 'monde');
    if (!sources.length) { ecarter('provenance introuvable'); continue; }

    // Butin du monde seul, bleu ou violet : trop rare pour compter dessus.
    if (sources.every((s) => s.type === 'monde') && c.q >= 3) { ecarter('butin du monde improbable'); continue; }

    // Dégâts exacts de wowf.io quand la fiche existe ; sinon la formule (corrigée pour les armes de lanceur).
    let arme = c.arme;
    if (arme && fiche?.arme) arme = { ...fiche.arme, sous: arme.sous };

    const nos = c.effets.filter((e) => !e.texte.includes('$'));
    const effets = nos.length >= c.effets.length && nos.length ? nos : fiche?.effets.length ? fiche.effets : nos;
    const stats = { ...c.stats };
    for (const [k, v] of Object.entries(statsDesEffets(effets)) as [Stat, number][]) stats[k] = (stats[k] ?? 0) + v;

    // Sur Forever, beaucoup de récompenses de quête n'ont pas de niveau requis : on prend celui de la quête,
    // sinon une estimation d'après le niveau d'objet (≈ niveau d'objet − 5 dans le jeu classique).
    let niveau = c.niveau;
    let niveauType: Objet['niveauType'];
    // Niveau requis 0 ou 1 sur un objet de niveau d'objet > 10 : en fait aucun niveau requis.
    if ((c.niveauRequis ?? 0) <= 1 && c.ilvl > 10) {
      const quetes = sources.flatMap((s) => (s.type === 'quete' && s.niveau ? [s.niveau] : []));
      if (fiche?.disponible) { niveau = fiche.disponible; niveauType = 'quete'; }
      else if (quetes.length) { niveau = Math.min(...quetes); niveauType = 'quete'; }
      else { niveau = Math.max(1, Math.min(60, c.ilvl - 5)); niveauType = 'estime'; }
      // Une quête de donjon se prend parfois bien avant de pouvoir faire le donjon.
      const entrees = sources.flatMap((s) => {
        const n = niveauxDonjon.get(s.lieu);
        return n && (s.type === 'quete' || s.type === 'donjon') ? [n] : [];
      });
      if (entrees.length) niveau = Math.max(niveau, Math.min(...entrees));
      // Garde-fou : une récompense n'est pas accessible plus de 15 niveaux sous son niveau d'objet
      // (quête de pêche « niveau 1 » qui donne un objet de niveau 65, par exemple).
      if (c.ilvl - niveau > 15) niveau = Math.min(60, c.ilvl - 10);
    }

    const maroquinier = c.liaison === 1 && sources.some((s) => s.type === 'metier' && /cuir/i.test(s.lieu));
    objets.push({
      id: c.id, nom: c.nom, nomEn: c.nomEn, q: c.q, ilvl: c.ilvl, niveau, niveauType, liaison: c.liaison, unique: c.unique,
      emplacement: c.emplacement, inv: c.inv, matiere: c.matiere, stats, armure: c.armure, arme, effets, icone: c.icone, sources,
      maroquinier: maroquinier || undefined,
    });
  }

  objets.sort((a, b) => a.niveau - b.niveau || a.id - b.id);
  const donnees: Donnees = { build, genere: new Date().toISOString(), objets };
  ecrireJson(path.join(PUBLIC, 'data', 'objets.json'), donnees);
  return { gardes: objets.length, ecartes };
}

/**
 * Icônes 56 px copiées dans public/icons : d'abord le CDN d'images de Wowhead (par nom),
 * sinon celui de Blizzard (par numéro de fichier, comme l'armurerie).
 */
export async function telechargerIcones(): Promise<void> {
  const d = lireJson<Donnees>(path.join(PUBLIC, 'data', 'objets.json'));
  const numeros = new Map<string, number>();
  for (const c of lireJson<Candidat[]>(path.join(CACHE, 'candidats.json'))) if (c.icone && c.iconeId) numeros.set(c.icone, c.iconeId);
  const noms = [...new Set(d.objets.map((o) => o.icone).filter((i): i is string => !!i))];
  const manquantes = noms.filter((n) => !fs.existsSync(path.join(PUBLIC, 'icons', `${n}.jpg`)));
  if (manquantes.length) console.log(`Icônes : ${manquantes.length} à télécharger`);
  const absentes: string[] = [];
  for (const n of manquantes) {
    const f = path.join(PUBLIC, 'icons', `${n}.jpg`);
    try {
      let ok = await telecharger(`https://wow.zamimg.com/images/wow/icons/large/${n}.jpg`, f);
      const num = numeros.get(n);
      if (!ok && num) ok = await telecharger(`https://render.worldofwarcraft.com/forever-eu/icons/56/${num}.jpg`, f);
      if (!ok) absentes.push(n);
    } catch {
      absentes.push(n);
    }
    await attendre(80);
  }
  if (absentes.length) console.warn('Icônes introuvables :', absentes.join(' '));
}

if (estPrincipal(import.meta.url)) {
  const build = lireJson<{ build: string }>(path.join(CACHE, 'etat.json')).build;
  const bilan = construire(build);
  console.log(`${bilan.gardes} objets gardés`, bilan.ecartes);
  await telechargerIcones();
}
