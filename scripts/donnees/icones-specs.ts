// Icônes des spécialisations (public/icons/specs) : celles des arbres de talents de Forever (table TalentTab),
// téléchargées une fois depuis le CDN d'images de Wowhead. Usage : npm run icones:specs
import fs from 'node:fs';
import path from 'node:path';
import { CLASSES } from '../../src/classes/index.ts';
import { PUBLIC, attendre, estPrincipal, telecharger } from './commun.ts';

export async function telechargerIconesSpecs(): Promise<void> {
  const dossier = path.join(PUBLIC, 'icons', 'specs');
  fs.mkdirSync(dossier, { recursive: true });
  const noms = [...new Set(CLASSES.flatMap((c) => c.specs.map((s) => s.icone)))];
  const absentes: string[] = [];
  for (const n of noms) {
    const f = path.join(dossier, `${n}.jpg`);
    if (fs.existsSync(f)) continue;
    if (!(await telecharger(`https://wow.zamimg.com/images/wow/icons/large/${n}.jpg`, f))) absentes.push(n);
    await attendre(80);
  }
  console.log(`Icônes de spé : ${noms.length - absentes.length}/${noms.length}`);
  if (absentes.length) console.warn('Introuvables :', absentes.join(' '));
}

if (estPrincipal(import.meta.url)) await telechargerIconesSpecs();
