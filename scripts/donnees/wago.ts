// Tables DB2 du jeu Forever publiées par wago.tools (produit « wowf »), et définitions de format WoWDBDefs.
import path from 'node:path';
import { CACHE, estPrincipal, telecharger, lireJson } from './commun.ts';

const TABLES = [
  'ItemSparse', 'Item', 'ItemXItemEffect', 'ItemEffect', 'SpellEffect', 'SpellName', 'SpellMisc', 'SpellDuration',
  'RandPropPoints', 'ItemDamageOneHand', 'ItemDamageTwoHand', 'ItemArmorTotal', 'ArmorLocation', 'ItemArmorQuality',
  'ManifestInterfaceData', 'ItemModifiedAppearance', 'ItemAppearance', 'DungeonEncounter', 'Map', 'AreaTable', 'Faction',
];
const TABLES_FR = ['ItemSparse', 'Spell', 'DungeonEncounter', 'Map', 'Faction'];
const DBD = ['ItemSparse', 'Item'];

/** Dernier build « wowf » connu de wago.tools, sauf si BUILD est fixé. */
export async function dernierBuild(): Promise<string> {
  if (process.env.BUILD) return process.env.BUILD;
  const f = path.join(CACHE, 'builds.json');
  await telecharger('https://wago.tools/api/builds', f);
  const b = lireJson<Record<string, { version: string }[]>>(f);
  const v = b.wowf?.[0]?.version;
  if (!v) throw new Error('Aucun build wowf sur wago.tools');
  return v;
}

export function dossierWago(build: string): string {
  return path.join(CACHE, 'wago', build);
}

export async function telechargerTables(build: string): Promise<void> {
  const d = dossierWago(build);
  for (const t of TABLES) {
    await telecharger(`https://wago.tools/db2/${t}/csv?build=${build}`, path.join(d, `${t}.csv`));
  }
  for (const t of TABLES_FR) {
    await telecharger(`https://wago.tools/db2/${t}/csv?build=${build}&locale=frFR`, path.join(d, `${t}.fr.csv`));
  }
  for (const t of DBD) {
    await telecharger(
      `https://raw.githubusercontent.com/wowdev/WoWDBDefs/master/definitions/${t}.dbd`,
      path.join(CACHE, 'dbd', `${t}.dbd`),
    );
  }
}

if (estPrincipal(import.meta.url)) {
  const b = await dernierBuild();
  await telechargerTables(b);
  console.log('Tables wago.tools prêtes pour', b);
}
