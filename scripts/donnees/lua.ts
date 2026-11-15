// Lecture des constructeurs de tables Lua des fichiers de données d'addons (sans exécuter de Lua).
// Gère : chaînes "…" et '…', nombres, true/false/nil, { … } avec [clé] = valeur, nom = valeur
// et valeurs positionnelles, commentaires -- et --[[ ]].

export type ValeurLua = string | number | boolean | null | TableLua;
export interface TableLua { tableau: ValeurLua[]; champs: Record<string, ValeurLua> }

class Lecteur {
  i = 0;
  private t: string;
  constructor(t: string) { this.t = t; }

  private blancs(): void {
    for (;;) {
      while (this.i < this.t.length && /\s/.test(this.t[this.i]!)) this.i++;
      if (this.t.startsWith('--[[', this.i)) { const f = this.t.indexOf(']]', this.i); this.i = f < 0 ? this.t.length : f + 2; continue; }
      if (this.t.startsWith('--', this.i)) { const f = this.t.indexOf('\n', this.i); this.i = f < 0 ? this.t.length : f + 1; continue; }
      return;
    }
  }

  valeur(): ValeurLua {
    this.blancs();
    const c = this.t[this.i];
    if (c === '{') return this.table();
    if (c === '"' || c === "'") return this.chaine();
    const m = /^-?(0x[0-9a-fA-F]+|\d+(\.\d+)?([eE][-+]?\d+)?)/.exec(this.t.slice(this.i, this.i + 40));
    if (m) { this.i += m[0].length; return Number(m[0]); }
    for (const [mot, v] of [['true', true], ['false', false], ['nil', null]] as const) {
      if (this.t.startsWith(mot, this.i)) { this.i += mot.length; return v; }
    }
    throw new Error(`Valeur Lua inattendue à ${this.i} : ${this.t.slice(this.i, this.i + 30)}`);
  }

  private chaine(): string {
    const q = this.t[this.i++];
    let s = '';
    while (this.i < this.t.length && this.t[this.i] !== q) {
      const c = this.t[this.i++]!;
      if (c === '\\') {
        const e = this.t[this.i++]!;
        s += e === 'n' ? '\n' : e === 't' ? '\t' : e;
      } else s += c;
    }
    this.i++;
    return s;
  }

  private table(): TableLua {
    this.i++; // {
    const res: TableLua = { tableau: [], champs: {} };
    for (;;) {
      this.blancs();
      if (this.t[this.i] === '}') { this.i++; return res; }
      if (this.t[this.i] === '[') {
        this.i++;
        const k = this.valeur();
        this.blancs(); this.i++; // ]
        this.blancs(); this.i++; // =
        res.champs[String(k)] = this.valeur();
      } else {
        const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)/.exec(this.t.slice(this.i, this.i + 80));
        if (m) { this.i += m[0].length; res.champs[m[1]!] = this.valeur(); }
        else res.tableau.push(this.valeur());
      }
      this.blancs();
      if (this.t[this.i] === ',' || this.t[this.i] === ';') this.i++;
    }
  }
}

/** Lit la table affectée juste après `marque` (par exemple « AzerothCompendium.INSTANCES = »). */
export function lireTable(source: string, marque: string): TableLua | null {
  const d = source.indexOf(marque);
  if (d < 0) return null;
  const l = new Lecteur(source);
  l.i = source.indexOf('{', d + marque.length);
  const v = l.valeur();
  return v && typeof v === 'object' ? v : null;
}

/** Valeur d'un champ (clé nommée ou indice 1, 2… pour la partie tableau). */
export function champ(t: ValeurLua | undefined, cle: string | number): ValeurLua | undefined {
  if (!t || typeof t !== 'object') return undefined;
  if (typeof cle === 'number') return t.tableau[cle - 1] ?? t.champs[String(cle)];
  return t.champs[cle];
}

/** Éléments d'une table utilisée comme liste. */
export function liste(t: ValeurLua | undefined): ValeurLua[] {
  return t && typeof t === 'object' ? t.tableau : [];
}
