// Chaîne complète pour une classe : tables du jeu → cache des objets révélés → candidats → provenances
// (wowf.io, AzerothCompendium) → public/data/<classe>.json + icônes.
// Usage : npm run donnees
//   CLASSE=druide (par défaut) · BUILD=1.60.1.xxxxx pour un build précis · DBCACHE=… pour un autre cache du jeu
import path from 'node:path';
import { equipementDe } from '../../src/classes/equipement.ts';
import { CACHE, ecrireJson } from './commun.ts';
import { lireCacheJeu } from './cache-jeu.ts';
import { construire, fichierCandidats, fichierDonnees, telechargerIcones } from './construire.ts';
import { lireCompendium, recupererQuetes } from './compendium.ts';
import { niveauxDonjons, recupererDonjons } from './donjons.ts';
import { extraireObjets } from './objets.ts';
import { dernierBuild, telechargerTables } from './wago.ts';
import { idsConnus, recupererFiches } from './wowf.ts';

const classe = process.env.CLASSE ?? 'druide';
const eq = equipementDe(classe);
if (!eq) throw new Error(`Classe inconnue : ${classe}`);

const build = await dernierBuild();
console.log(`Classe : ${eq.nom} · build du jeu : ${build}`);
await telechargerTables(build);

const hotfix = lireCacheJeu(build);
const candidats = extraireObjets(build, hotfix, eq);
ecrireJson(fichierCandidats(classe), candidats);
ecrireJson(path.join(CACHE, 'etat.json'), { build });
const inconnues = new Map<number, number>();
for (const c of candidats) for (const s of c.statsInconnues) inconnues.set(s, (inconnues.get(s) ?? 0) + 1);
console.log(`${candidats.length} candidats ; stats non reconnues :`, Object.fromEntries(inconnues));

await recupererDonjons();
// Pages des quêtes citées par AzerothCompendium pour nos objets (noms et niveaux en français)
const comp = lireCompendium(build, [...niveauxDonjons().keys()]);
await recupererQuetes([...new Set(candidats.flatMap((c) => comp.quetes.get(c.id) ?? []))]);
const premier = construire(build, classe);
console.log(`Butin des donjons ajouté : ${premier.gardes} objets`);

const connus = await idsConnus();
// Les objets liés quand ramassés (butin de donjon, de raid, récompenses de quête) d'abord :
// sans leur fiche, on ne connaît pas leur provenance et ils n'apparaissent pas.
const aLire = candidats
  .filter((c) => connus.has(c.id))
  .sort((a, b) => a.liaison - b.liaison || b.q - a.q || a.niveau - b.niveau)
  .map((c) => c.id);
console.log(`${aLire.length} candidats ont une fiche wowf.io`);
if (process.env.SANS_WOWF) process.exit(0);
await recupererFiches(aLire, () => {
  const b = construire(build, classe);
  console.log(`  données reconstruites : ${b.gardes} objets`);
});

const bilan = construire(build, classe);
console.log(`${bilan.gardes} objets gardés`, bilan.ecartes);
await telechargerIcones(classe);
console.log(`Données prêtes dans ${path.relative(process.cwd(), fichierDonnees(classe))}`);
