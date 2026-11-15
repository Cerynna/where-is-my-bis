// Numéro de la prochaine release, pour la CI.
// La majeure et la mineure viennent du champ "version" de package.json : c'est toi qui les changes à la main
// (par exemple 0.2.0 ou 1.0.0). Le patch est automatique : le plus grand patch déjà tagué vX.Y.* + 1,
// ou le patch de package.json s'il n'y a encore aucun tag pour cette majeure.mineure.
// Usage : node --experimental-strip-types scripts/version-suivante.ts  →  version=0.1.3
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const paquet = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(paquet.version);
if (!m) throw new Error(`Version de package.json illisible : ${paquet.version}`);
const [majeure, mineure, patchDepart] = [Number(m[1]), Number(m[2]), Number(m[3])];

const tags = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' }).split(/\r?\n/);
const patchs = tags
  .map((t) => /^v(\d+)\.(\d+)\.(\d+)$/.exec(t.trim()))
  .filter((t): t is RegExpExecArray => !!t && Number(t[1]) === majeure && Number(t[2]) === mineure)
  .map((t) => Number(t[3]));
const patch = patchs.length ? Math.max(...patchs) + 1 : patchDepart;

console.log(`version=${majeure}.${mineure}.${patch}`);
