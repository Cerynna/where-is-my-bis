// Lit le cache de hotfixes du client (DBCache.bin) : les objets que le serveur a révélés,
// absents des tables publiées. Format : en-tête de 44 octets, puis des entrées « XFTH ».
import fs from 'node:fs';
import path from 'node:path';
import { CACHE, DBCACHE, estPrincipal, ecrireJson } from './commun.ts';

const HASH_ITEMSPARSE = 0x919be54e;
const HASH_ITEM = 0x50238ec2;

interface Champ { nom: string; taille?: number; nonSigne?: boolean; texte?: boolean; flottant?: boolean }
export type Rangee = Record<string, number | string>;

/** Disposition des colonnes d'une table pour un build, tirée du fichier .dbd. */
export function disposition(table: string, build: string): Champ[] {
  const lignes = fs.readFileSync(path.join(CACHE, 'dbd', `${table}.dbd`), 'utf8').split(/\r?\n/);
  let i = lignes.findIndex((l) => l.startsWith('BUILD') && l.includes(build));
  if (i < 0) {
    // Build trop récent pour WoWDBDefs : on prend le dernier bloc de la même branche.
    const branche = build.split('.').slice(0, 3).join('.') + '.';
    for (let k = lignes.length - 1; k >= 0; k--) {
      if (lignes[k]?.startsWith('BUILD') && lignes[k]?.includes(branche)) { i = k; break; }
    }
  }
  if (i < 0) throw new Error(`Pas de disposition ${table} pour ${build}`);
  while (/^(BUILD|COMMENT|LAYOUT)/.test(lignes[i] ?? '')) i++;
  const champs: Champ[] = [];
  for (; i < lignes.length && lignes[i]?.trim(); i++) {
    const m = (lignes[i] ?? '').match(/^(\$[^$]*\$)?([A-Za-z0-9_]+)(<(u?)(\d+)>)?(\[(\d+)\])?/);
    if (!m) continue;
    if (m[1]?.includes('noninline')) continue;
    const nom = m[2] ?? '';
    const base: Omit<Champ, 'nom'> = m[3]
      ? { taille: Number(m[5]) / 8, nonSigne: m[4] === 'u' }
      : /_lang$/.test(nom) ? { texte: true } : { flottant: true };
    const n = m[7] ? Number(m[7]) : 1;
    for (let k = 0; k < n; k++) champs.push({ nom: n > 1 ? `${nom}_${k}` : nom, ...base });
  }
  return champs;
}

function decoder(buf: Buffer, champs: Champ[]): Rangee | null {
  let o = 0;
  const r: Rangee = {};
  for (const c of champs) {
    if (c.texte) {
      const fin = buf.indexOf(0, o);
      if (fin < 0) return null;
      r[c.nom] = buf.subarray(o, fin).toString('utf8');
      o = fin + 1;
    } else if (c.flottant) {
      if (o + 4 > buf.length) return null;
      r[c.nom] = buf.readFloatLE(o); o += 4;
    } else {
      const t = c.taille ?? 4;
      if (o + t > buf.length) return null;
      r[c.nom] = t === 4 ? (c.nonSigne ? buf.readUInt32LE(o) : buf.readInt32LE(o))
        : t === 2 ? (c.nonSigne ? buf.readUInt16LE(o) : buf.readInt16LE(o))
        : (c.nonSigne ? buf.readUInt8(o) : buf.readInt8(o));
      o += t;
    }
  }
  return o === buf.length ? r : null;
}

export interface Hotfix { sparse: Record<string, Rangee>; item: Record<string, Rangee> }

export function lireCacheJeu(build: string, fichier = DBCACHE): Hotfix {
  const res: Hotfix = { sparse: {}, item: {} };
  if (!fs.existsSync(fichier)) {
    console.warn('Cache du jeu introuvable :', fichier, '(seules les tables publiées seront utilisées)');
    return res;
  }
  const dSparse = disposition('ItemSparse', build);
  const dItem = disposition('Item', build);
  const b = fs.readFileSync(fichier);
  let o = 44;
  let rejets = 0;
  while (o < b.length - 32) {
    if (b.toString('latin1', o, o + 4) !== 'XFTH') throw new Error(`DBCache.bin désynchronisé à ${o}`);
    const hash = b.readUInt32LE(o + 16);
    const id = b.readUInt32LE(o + 20);
    const taille = b.readUInt32LE(o + 24);
    const statut = b[o + 28];
    const donnees = b.subarray(o + 32, o + 32 + taille);
    o += 32 + taille;
    if (statut !== 1 || !taille) continue;
    if (hash === HASH_ITEMSPARSE || hash === HASH_ITEM) {
      const r = decoder(donnees, hash === HASH_ITEMSPARSE ? dSparse : dItem);
      if (!r) { rejets++; continue; }
      r.ID = id;
      (hash === HASH_ITEMSPARSE ? res.sparse : res.item)[id] = r;
    }
  }
  console.log(`Cache du jeu : ${Object.keys(res.sparse).length} objets révélés, ${rejets} entrées illisibles`);
  return res;
}

if (estPrincipal(import.meta.url)) {
  const build = process.argv[2];
  if (!build) throw new Error('Usage : cache-jeu.ts <build>');
  ecrireJson(path.join(CACHE, 'hotfix.json'), lireCacheJeu(build));
}
