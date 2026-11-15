// Import d'un personnage depuis l'armurerie de Blizzard (WoW Forever).
// La page n'autorise pas les requêtes d'un autre site (CORS) : elle passe par le relais /armurerie
// (proxy du serveur Vite en développement). On y lit l'objet JSON `characterProfileInitialState`.
import type { Emplacement, Objet, Perso, Stat } from './types.ts';

const HOTE = 'https://worldofwarcraft.blizzard.com';
const CLE_PERSO = 'feral-forever:perso';

/** Chemin de la page d'un personnage Forever, ou null si le lien n'en est pas un. */
export function cheminArmurerie(lien: string): string | null {
  let u: URL;
  try { u = new URL(lien.trim()); } catch { return null; }
  if (u.hostname !== 'worldofwarcraft.blizzard.com') return null;
  const m = u.pathname.match(/^\/([a-z]{2}-[a-z]{2})\/forever\/(eu|us|kr|tw)\/armory\/character\/([^/]+)\/?$/i);
  if (!m) return null;
  return `/${m[1]!.toLowerCase()}/forever/${m[2]!.toLowerCase()}/armory/character/${m[3]}/`;
}

/** Extrait l'objet JSON qui suit `var characterProfileInitialState = ` (parcours des accolades). */
function extraireEtat(html: string): unknown {
  const marque = 'var characterProfileInitialState = ';
  const debut = html.indexOf(marque);
  if (debut < 0) throw new Error('Personnage introuvable sur cette page d’armurerie.');
  let i = debut + marque.length;
  const d = i;
  let profondeur = 0;
  let chaine = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (chaine) { if (c === '\\') i++; else if (c === '"') chaine = false; continue; }
    if (c === '"') chaine = true;
    else if (c === '{') profondeur++;
    else if (c === '}' && --profondeur === 0) { i++; break; }
  }
  return JSON.parse(html.slice(d, i));
}

// Forme (partielle) des données de l'armurerie
interface Ref { type?: string; name?: string; id?: number; enum?: string }
interface ObjetArmurerie {
  id: number;
  name: string;
  slot?: Ref;
  quality?: Ref;
  inventory_type?: Ref;
  item_subclass?: Ref;
  binding?: Ref;
  unique_equipped?: string;
  armor?: { value: number };
  stats?: { type: Ref; value: number }[];
  weapon?: { damage?: { min_value: number; max_value: number }; attack_speed?: { value: number }; dps?: { value: number } };
  spells?: { description?: string }[];
  requirements?: { level?: { value: number } };
  level?: { value: number };
  media?: { content?: { assets?: { key: string; value: string }[] } };
}
interface EtatArmurerie {
  character: {
    name: string; surname?: string; level: number; region?: string;
    class?: Ref; faction?: Ref; specs?: { active?: boolean; name?: string }[];
    professions?: { primaries?: { name?: string }[] };
    lastUpdatedTimestamp?: { iso8601?: string };
    gear?: Record<string, ObjetArmurerie>;
  };
}

const STATS: Record<string, Stat> = {
  AGILITY: 'agi', STRENGTH: 'for', STAMINA: 'end', INTELLECT: 'int', SPIRIT: 'esp', ATTACK_POWER: 'pa',
  CRIT_RATING: 'crit', HIT_RATING: 'tou', HASTE_RATING: 'hate', EXPERTISE_RATING: 'exp', DEFENSE_SKILL_RATING: 'def',
  DODGE_RATING: 'esq', PARRY_RATING: 'par', EXTRA_ARMOR: 'armure', BLOCK_VALUE: 'blocage', SPELL_POWER: 'pds',
  BONUS_STAT_ATTACK_POWER_VS_BEAST: 'pa_bete', BONUS_STAT_ATTACK_POWER_VS_UNDEAD: 'pa_mv',
  BONUS_STAT_ATTACK_POWER_VS_HUMANOID: 'pa_hum', BONUS_STAT_ATTACK_POWER_VS_DEMON: 'pa_dem',
  FIRE_RESISTANCE: 'rfeu', FROST_RESISTANCE: 'rgivre', SHADOW_RESISTANCE: 'rombre', NATURE_RESISTANCE: 'rnature', ARCANE_RESISTANCE: 'rarcane',
};
const QUALITES: Record<string, Objet['q']> = { POOR: 0, COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5 };
const INVENTAIRE: Record<string, number> = {
  HEAD: 1, NECK: 2, SHOULDER: 3, CHEST: 5, ROBE: 20, WAIST: 6, LEGS: 7, FEET: 8, WRIST: 9, HAND: 10, FINGER: 11,
  TRINKET: 12, CLOAK: 16, WEAPON: 13, WEAPONMAINHAND: 21, TWOHWEAPON: 17, RELIC: 28,
};
/** Emplacement de l'armurerie → case de notre fiche. */
const CASES: Record<string, [string, Emplacement]> = {
  head: ['tete', 'tete'], neck: ['cou', 'cou'], shoulder: ['epaules', 'epaules'], back: ['dos', 'dos'],
  chest: ['torse', 'torse'], wrist: ['poignets', 'poignets'], hand: ['mains', 'mains'], waist: ['taille', 'taille'],
  leg: ['jambes', 'jambes'], foot: ['pieds', 'pieds'], leftFinger: ['doigt1', 'doigt'], rightFinger: ['doigt2', 'doigt'],
  leftTrinket: ['bijou1', 'bijou'], rightTrinket: ['bijou2', 'bijou'], weapon: ['arme', 'arme2m'], ranged: ['relique', 'relique'],
  offHand: ['maing', 'maing'], offhand: ['maing', 'maing'],
};

function versObjet(a: ObjetArmurerie, emplacement: Emplacement): Objet {
  const stats: Objet['stats'] = {};
  for (const s of a.stats ?? []) {
    const cle = STATS[(s.type.type ?? '').replace(/,$/, '')];
    if (cle) stats[cle] = (stats[cle] ?? 0) + s.value;
  }
  const inv = INVENTAIRE[a.inventory_type?.type ?? ''] ?? 0;
  const w = a.weapon;
  const arme = w?.damage && w.attack_speed
    ? { min: w.damage.min_value, max: w.damage.max_value, vitesse: w.attack_speed.value / 1000, dps: Math.round((w.dps?.value ?? 0) * 10) / 10, sous: a.item_subclass?.id ?? 0 }
    : undefined;
  return {
    id: a.id,
    nom: a.name,
    q: QUALITES[a.quality?.type ?? ''] ?? 1,
    ilvl: a.level?.value ?? 0,
    niveau: a.requirements?.level?.value ?? 1,
    liaison: a.binding?.type === 'ON_ACQUIRE' ? 1 : 2,
    unique: a.unique_equipped ? 2 : undefined,
    emplacement: inv === 13 || inv === 21 ? 'arme1m' : emplacement,
    inv,
    stats,
    armure: a.armor?.value ?? 0,
    arme,
    effets: (a.spells ?? []).flatMap((s) => {
      const t = s.description ?? '';
      const m = t.match(/^(Utiliser|Équipé|Equipé|Chances quand vous touchez) : (.*)$/s);
      if (!m) return t ? [{ type: 1 as const, texte: t }] : [];
      return [{ type: m[1] === 'Utiliser' ? 0 as const : m[1]!.startsWith('Chances') ? 2 as const : 1 as const, texte: m[2]!.trim() }];
    }),
    icone: a.media?.content?.assets?.find((x) => x.key === 'icon')?.value,
    sources: [{ type: 'autre', lieu: 'Porté par ton personnage' }],
  };
}

export async function importerPerso(lien: string): Promise<Perso> {
  const chemin = cheminArmurerie(lien);
  if (!chemin) throw new Error('Ce lien n’est pas une page de personnage de l’armurerie WoW Forever.');
  const r = await fetch(`./armurerie${chemin}`, { cache: 'no-cache' });
  if (r.status === 404) throw new Error('Personnage introuvable : vérifie le nom dans le lien.');
  if (!r.ok) throw new Error(`L’armurerie ne répond pas (HTTP ${r.status}).`);
  const html = await r.text();
  if (!html.includes('characterProfileInitialState')) {
    throw new Error('La page reçue n’est pas l’armurerie : le relais /armurerie ne fonctionne qu’avec le serveur du site (npm run dev).');
  }
  const etat = extraireEtat(html) as EtatArmurerie;
  const c = etat.character;
  const equipement: Record<string, Objet> = {};
  for (const [cle, a] of Object.entries(c.gear ?? {})) {
    const k = CASES[cle];
    if (k && a?.id) equipement[k[0]] = versObjet(a, k[1]);
  }
  const metiers = (c.professions?.primaries ?? []).map((p) => p.name ?? '');
  const faction = c.faction?.enum === 'HORDE' ? 'Horde' : c.faction?.enum === 'ALLIANCE' ? 'Alliance' : undefined;
  return {
    lien: `${HOTE}${chemin}`,
    nom: c.surname ? `${c.name} ${c.surname}` : c.name,
    niveau: c.level,
    classe: c.class?.name ?? '?',
    classeEnum: c.class?.enum,
    estDruide: c.class?.enum === 'DRUID',
    faction,
    specialisation: c.specs?.find((s) => s.active)?.name,
    maroquinier: metiers.some((m) => /leatherworking|travail du cuir/i.test(m)),
    majArmurerie: c.lastUpdatedTimestamp?.iso8601,
    importeLe: new Date().toISOString(),
    equipement,
  };
}

export function lirePerso(): Perso | null {
  try { return JSON.parse(localStorage.getItem(CLE_PERSO) ?? 'null') as Perso | null; } catch { return null; }
}

export function ecrirePerso(p: Perso | null): void {
  try {
    if (p) localStorage.setItem(CLE_PERSO, JSON.stringify(p)); else localStorage.removeItem(CLE_PERSO);
  } catch { /* stockage indisponible */ }
}
