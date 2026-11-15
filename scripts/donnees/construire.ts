// Assemble public/data/<classe>.json : candidats du jeu + provenances (wowf.io, AzerothCompendium, corrections),
// sans les butins du monde improbables ni les objets sans stat utile.
import fs from 'node:fs';
import path from 'node:path';
import type { Donnees, Objet, Source, Stat } from '../../src/types.ts';
import { CACHE, PUBLIC, RACINE, attendre, ecrireJson, estPrincipal, lireJson, telecharger } from './commun.ts';
import type { Candidat } from './objets.ts';
import { lireCompendium, sourcesQuetes } from './compendium.ts';
import { lireDonjons, niveauxDonjons, nomDonjon } from './donjons.ts';
import { lireFiche } from './wowf.ts';
import { classeParId, type Classe } from '../../src/classes/index.ts';
import { POIDS_HORS_STATS } from '../../src/classes/types.ts';

// Mots qui rendent un effet « Équipé : » utile : communs, pour les spés physiques, pour les spés de sorts.
// Les sorts propres à une classe (Colère, Boule de feu…) viennent des expressions `reliques` de ses spécialisations.
const EFFET_COMMUN = /critique|toucher|vitesse de déplacement|forme/i;
const EFFET_PHYSIQUE = /attaque|agilité|force|armure|esquive|dégâts physiques|vitesse d'attaque/i;
const EFFET_SORTS = /sorts|soins|mana/i;

export interface Bilan { gardes: number; ecartes: Record<string, number> }

/**
 * Objet utile à la classe : une stat qui pèse plus de 0,1 pour au moins une de ses spécialisations
 * (pour le druide, cela redonne la liste écrite à la main jusqu'ici), une arme, une relique lisible,
 * ou un effet qui parle de ses sorts.
 */
function critereUtile(classe: Classe): (c: Candidat) => boolean {
  if (!classe.specs.length) throw new Error(`${classe.nom} : décris ses spécialisations dans src/classes/ avant de générer ses données.`);
  const stats = new Set<Stat>();
  for (const s of classe.specs) {
    for (const [k, v] of Object.entries(s.poids)) if (!POIDS_HORS_STATS.includes(k) && (v ?? 0) > 0.1) stats.add(k as Stat);
  }
  const effets = [
    EFFET_COMMUN,
    ...(classe.specs.some((s) => s.physique) ? [EFFET_PHYSIQUE] : []),
    ...(classe.specs.some((s) => !s.physique) ? [EFFET_SORTS] : []),
    ...classe.specs.flatMap((s) => (s.reliques ? [s.reliques] : [])),
  ];
  return (c) => {
    // Reliques : toutes celles dont l'effet est lisible (les runes de Saison de la découverte n'existent pas sur Forever).
    if (c.emplacement === 'relique') return c.effets.some((e) => !e.texte.includes('$') && !/^Grave sur/.test(e.texte));
    if (c.arme) return true;
    for (const s of stats) if ((c.stats[s] ?? 0) > 0) return true;
    return c.effets.some((e) => effets.some((r) => r.test(e.texte)));
  };
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

/** Fichier des candidats d'une classe (cache) et fichier de données servi au site. */
export const fichierCandidats = (classe: string) => path.join(CACHE, `candidats-${classe}.json`);
export const fichierDonnees = (classe: string) => path.join(PUBLIC, 'data', `${classe}.json`);

export function construire(build: string, classe: string): Bilan {
  const laClasse = classeParId(classe);
  if (!laClasse) throw new Error(`Classe inconnue : ${classe}`);
  const utile = critereUtile(laClasse);
  const candidats = lireJson<Candidat[]>(fichierCandidats(classe));
  // Objets connus de wowf.io : tant que leur fiche manque, on ne devine pas leur provenance.
  const plan = path.join(CACHE, 'wowf', 'sitemap-en.xml');
  const connus = new Set<number>();
  if (fs.existsSync(plan)) for (const m of fs.readFileSync(plan, 'utf8').matchAll(/\/items\/(\d+)</g)) connus.add(Number(m[1]));
  const donjons = lireDonjons();
  const niveauxDonjon = niveauxDonjons();
  const fichierCorrections = path.join(RACINE, 'donnees', 'provenances.json');
  const corrections = fs.existsSync(fichierCorrections)
    ? (lireJson<Record<string, Source[] | string>>(fichierCorrections) as Record<string, Source[] | undefined>)
    : {};
  for (const k of Object.keys(corrections)) if (!Array.isArray(corrections[k])) delete corrections[k];
  const compendium = lireCompendium(build, [...niveauxDonjon.keys()]);
  // Niveau d'entrée d'un donjon ; pour un nom général (« Stratholme »), le plus bas de ses ailes.
  const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/haches-/g, 'hache-');
  const entreeDonjon = (lieu: string): number | undefined => {
    const direct = niveauxDonjon.get(lieu);
    if (direct !== undefined) return direct;
    const ailes = [...niveauxDonjon].filter(([k]) => sansAccents(k).includes(sansAccents(lieu))).map(([, v]) => v);
    return ailes.length ? Math.min(...ailes) : undefined;
  };
  const ecartes: Record<string, number> = {};
  const ecarter = (raison: string) => { ecartes[raison] = (ecartes[raison] ?? 0) + 1; };
  const objets: Objet[] = [];

  for (const c of candidats) {
    if (!utile(c)) { ecarter(`sans stat utile (${laClasse.nom.toLowerCase()})`); continue; }
    const fiche = lireFiche(c.id);
    const enDonjon = donjons.get(c.id) ?? [];
    // AzerothCompendium : boss et monstres des donjons et raids, quêtes, marchands.
    const deCompendium = [...(compendium.sources.get(c.id) ?? []), ...sourcesQuetes(compendium, c.id)];
    let sources: Source[];
    if (fiche) {
      // Les tableaux de butin des donjons sont complets : ils remplacent les lignes de donjon de la fiche.
      const autres = fiche.sources
        .filter((s) => !(enDonjon.length && s.type === 'donjon'))
        .map((s) => (s.type === 'donjon' ? { ...s, lieu: nomDonjon(s.lieu) } : s));
      sources = [...autres, ...enDonjon];
    } else if (enDonjon.length) sources = enDonjon;
    else if (deCompendium.length && (c.revele || connus.has(c.id) || compendium.forever.has(c.id))) sources = deCompendium;
    else if (connus.has(c.id) && !fs.existsSync(path.join(CACHE, 'wowf', 'fr', `${c.id}.html`))) {
      ecarter('fiche pas encore téléchargée'); continue;
    } else if (c.revele && c.liaison === 2) sources = [{ type: 'monde', lieu: 'Butin aléatoire' }];
    else { ecarter(c.revele ? 'provenance introuvable' : 'jamais vu en jeu'); continue; }
    // L'addon complète : il remplace « pas encore révélée » et ajoute les types de provenance absents.
    // Pour le butin de donjon, sa version (avec le taux de butin) remplace celle des tableaux wowf.io.
    if (deCompendium.length && sources !== deCompendium) {
      const ailes = sources.filter((s) => s.type === 'donjon');
      if (deCompendium.some((s) => s.type === 'donjon')) {
        // wowf.io découpe certaines instances par aile (Stratholme, Monastère…) : on garde son nom d'aile.
        const n = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        for (let i = 0; i < deCompendium.length; i++) {
          const s = deCompendium[i]!;
          const aile = s.type === 'donjon' ? ailes.find((a) => n(a.lieu).includes(n(s.lieu))) : undefined;
          if (aile) deCompendium[i] = { ...s, lieu: aile.lieu };
        }
        sources = sources.filter((s) => s.type !== 'donjon');
      }
      const presents = new Set(sources.filter((s) => s.type !== 'inconnue').map((s) => s.type));
      const ajout = deCompendium.filter((s) => !presents.has(s.type));
      if (ajout.length) sources = [...sources.filter((s) => s.type !== 'inconnue'), ...ajout];
    }
    // Provenances ajoutées à la main (donnees/provenances.json) : elles remplacent « pas encore révélée ».
    const ajout = corrections[String(c.id)];
    if (ajout?.length) sources = [...sources.filter((s) => s.type !== 'inconnue'), ...ajout];
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

    // Objet qui ne tombe que dans des donjons : accessible à l'entrée du plus bas d'entre eux.
    let niveauRequis: number | undefined;
    if (!niveauType && sources.length && sources.every((s) => s.type === 'donjon' || s.type === 'raid')) {
      const entrees = sources.map((s) => entreeDonjon(s.lieu));
      if (entrees.every((n): n is number => n !== undefined)) {
        const entree = Math.min(...entrees);
        if (entree > niveau) { niveauRequis = niveau; niveau = entree; niveauType = 'donjon'; }
      }
    }

    // Mailles (chasseur, chaman) et plaques (guerrier, paladin) ne se portent qu'à partir du niveau 40.
    const niveauMatiere = laClasse.armures.find((a) => a.matiere === c.matiere)?.niveau;
    if (niveauMatiere && niveau < niveauMatiere) {
      niveauRequis ??= niveau;
      niveau = niveauMatiere;
      niveauType = 'matiere';
    }

    const maroquinier = c.liaison === 1 && sources.some((s) => s.type === 'metier' && /cuir/i.test(s.lieu));
    objets.push({
      id: c.id, nom: c.nom, nomEn: c.nomEn, q: c.q, ilvl: c.ilvl, niveau, niveauType, niveauRequis, liaison: c.liaison, unique: c.unique,
      emplacement: c.emplacement, inv: c.inv, matiere: c.matiere, stats, armure: c.armure, arme, effets, icone: c.icone, sources,
      maroquinier: maroquinier || undefined,
    });
  }

  objets.sort((a, b) => a.niveau - b.niveau || a.id - b.id);
  const donnees: Donnees = { classe, build, genere: new Date().toISOString(), objets };
  ecrireJson(fichierDonnees(classe), donnees);
  return { gardes: objets.length, ecartes };
}

/**
 * Icônes 56 px copiées dans public/icons : d'abord le CDN d'images de Wowhead (par nom),
 * sinon celui de Blizzard (par numéro de fichier, comme l'armurerie).
 */
export async function telechargerIcones(classe: string): Promise<void> {
  const d = lireJson<Donnees>(fichierDonnees(classe));
  const numeros = new Map<string, number>();
  for (const c of lireJson<Candidat[]>(fichierCandidats(classe))) if (c.icone && c.iconeId) numeros.set(c.icone, c.iconeId);
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
  const classe = process.env.CLASSE ?? 'druide';
  const bilan = construire(build, classe);
  console.log(`${classe} : ${bilan.gardes} objets gardés`, bilan.ecartes);
  await telechargerIcones(classe);
}
