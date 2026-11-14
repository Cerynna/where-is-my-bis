// Butin des donjons d'après les pages de donjon de wowf.io (une page par donjon, tableau objet → boss).
// Une quarantaine de requêtes donnent tout le butin, sans attendre les fiches d'objet une par une.
import fs from 'node:fs';
import path from 'node:path';
import type { Source } from '../../src/types.ts';
import { CACHE, attendre, telecharger } from './commun.ts';

const DOSSIER = path.join(CACHE, 'wowf', 'donjons');
const UA = { 'User-Agent': 'Mozilla/5.0 (feral-forever)' };

const texte = (html: string) => html
  .replace(/<!--.*?-->/g, '').replace(/<[^>]*>/g, ' ')
  .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

/** Nom de donjon homogène entre les pages de donjon et les fiches d'objet. */
export function nomDonjon(n: string): string {
  return n.replace(/^NEW\s+/, '').replace(/\s*NEW$/, '').replace(/^Monastère Écarlate/, 'Monastère écarlate').trim();
}

function perime(f: string): boolean {
  return fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs > 86_400_000;
}

export async function recupererDonjons(): Promise<string[]> {
  const index = path.join(DOSSIER, '_index.html');
  if (perime(index)) fs.rmSync(index);
  await telecharger('https://wowf.io/fr/dungeons', index, UA);
  const slugs = [...new Set([...fs.readFileSync(index, 'utf8').matchAll(/href="\/fr\/dungeons\/([a-z0-9-]+)"/g)].map((m) => m[1]!))];
  for (const s of slugs) {
    const f = path.join(DOSSIER, `${s}.html`);
    if (perime(f)) fs.rmSync(f);
    if (fs.existsSync(f)) continue;
    await telecharger(`https://wowf.io/fr/dungeons/${s}`, f, UA);
    await attendre(700);
  }
  console.log(`Donjons wowf.io : ${slugs.length} pages`);
  return slugs;
}

/** Donjon → niveau minimal conseillé (« Niveau 48–51 » sur la page des donjons). */
export function niveauxDonjons(): Map<string, number> {
  const res = new Map<string, number>();
  const f = path.join(DOSSIER, '_index.html');
  if (!fs.existsSync(f)) return res;
  const html = fs.readFileSync(f, 'utf8').split('self.__next_f')[0] ?? '';
  for (const m of html.matchAll(/href="\/fr\/dungeons\/[a-z0-9-]+"[^>]*>([\s\S]*?)<\/a>/g)) {
    const t = texte(m[1] ?? '');
    const n = t.match(/^(.*?)\s*Niveau (\d+)/);
    if (n?.[1] && n[2]) res.set(nomDonjon(n[1]), Number(n[2]));
  }
  return res;
}

/** Objet → provenances de donjon (nom français du donjon, boss ou « monstres du donjon »). */
export function lireDonjons(): Map<number, Source[]> {
  const res = new Map<number, Source[]>();
  if (!fs.existsSync(DOSSIER)) return res;
  for (const f of fs.readdirSync(DOSSIER).filter((n) => n.endsWith('.html') && !n.startsWith('_'))) {
    const html = fs.readFileSync(path.join(DOSSIER, f), 'utf8').split('self.__next_f')[0] ?? '';
    const lieu = nomDonjon(texte(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? f.replace('.html', '')));
    for (const r of html.matchAll(/<tr id="item-(\d+)"[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cellules = [...(r[2] ?? '').matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
      const qui = texte(cellules.at(-1)?.[1] ?? '');
      const detail = !qui || qui === '—' ? undefined : qui === 'Monstres de base' ? 'monstres du donjon' : qui;
      const id = Number(r[1]);
      const l = res.get(id) ?? [];
      if (!l.some((s) => s.lieu === lieu && s.detail === detail)) l.push({ type: 'donjon', lieu, detail });
      res.set(id, l);
    }
  }
  return res;
}
