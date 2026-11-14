// Outils partagés par les scripts de données : chemins, CSV, téléchargements en cache.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

/** Vrai quand le module est lancé directement (node script.ts). */
export function estPrincipal(url: string): boolean {
  return !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(url);
}

export const RACINE = path.resolve(import.meta.dirname, '..', '..');
export const CACHE = path.join(RACINE, '.cache');
export const PUBLIC = path.join(RACINE, 'public');

/** Cache des hotfixes du client : les objets révélés par le serveur. */
export const DBCACHE =
  process.env.DBCACHE ?? 'D:/Games/World of Warcraft/_forever_/Cache/ADB/frFR/DBCache.bin';

export type Ligne = Record<string, string>;

export function dossier(...parts: string[]): string {
  const d = path.join(...parts);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** CSV de wago.tools : champs entre guillemets, "" pour un guillemet. */
export function lireCsv(fichier: string): Ligne[] {
  const t = fs.readFileSync(fichier, 'utf8');
  const lignes: string[][] = [];
  let ligne: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { ligne.push(cur); cur = ''; }
    else if (c === '\n') { ligne.push(cur); cur = ''; lignes.push(ligne); ligne = []; }
    else if (c !== '\r') cur += c;
  }
  if (cur || ligne.length) { ligne.push(cur); lignes.push(ligne); }
  const tete = lignes.shift() ?? [];
  return lignes
    .filter((l) => l.length > 1)
    .map((l) => Object.fromEntries(tete.map((k, i) => [k, l[i] ?? ''])));
}

export function indexer(lignes: Ligne[], cle = 'ID'): Map<string, Ligne> {
  const m = new Map<string, Ligne>();
  for (const l of lignes) m.set(l[cle] ?? '', l);
  return m;
}

/** Télécharge une URL vers un fichier, sauf s'il existe déjà. Renvoie false sur une 404. */
export async function telecharger(url: string, fichier: string, entetes: Record<string, string> = {}): Promise<boolean> {
  if (fs.existsSync(fichier) && fs.statSync(fichier).size > 0) return true;
  dossier(path.dirname(fichier));
  // curl plutôt que fetch : le fetch de Node 22 lève parfois une erreur hors de toute promesse
  // (délai de lecture du corps) et fait tomber le processus.
  const tmp = `${fichier}.part`;
  const ua = entetes['User-Agent'] ?? 'feral-forever (outil de données)';
  for (let essai = 0; essai < 4; essai++) {
    try {
      const { stdout } = await execFileP('curl', ['-s', '-L', '--max-time', '30', '-A', ua, '-o', tmp, '-w', '%{http_code}', url]);
      const code = Number(stdout.trim());
      if (code === 404) { fs.rmSync(tmp, { force: true }); return false; }
      if (code === 200 && fs.existsSync(tmp)) { fs.renameSync(tmp, fichier); return true; }
    } catch (e) {
      console.warn(`  nouvel essai (${(e as Error).message.split('\n')[0]}) : ${url}`);
    }
    fs.rmSync(tmp, { force: true });
    await attendre(2000 * (essai + 1));
  }
  throw new Error(`Échec du téléchargement : ${url}`);
}

export function lireJson<T>(fichier: string): T {
  return JSON.parse(fs.readFileSync(fichier, 'utf8')) as T;
}

export function ecrireJson(fichier: string, valeur: unknown, joli = false): void {
  dossier(path.dirname(fichier));
  fs.writeFileSync(fichier, JSON.stringify(valeur, null, joli ? 1 : 0));
}
