import type { Etat } from '../etat.ts';
import { DEFAUT } from '../etat.ts';
import { COURT, EMPLACEMENTS, ORDRE_EMPLACEMENTS, ORDRE_SOURCES, QUALITES, SOURCES, STATS_FILTRE } from '../libelles.ts';
import type { Emplacement, Stat, TypeSource } from '../types.ts';

interface Props {
  etat: Etat;
  maj: (p: Partial<Etat>) => void;
  lieux: string[];
  comptes: Partial<Record<TypeSource, number>>;
}

function basculer<T>(liste: T[], v: T): T[] {
  return liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v];
}

export function Filtres({ etat, maj, lieux, comptes }: Props) {
  const liste = etat.vue === 'objets';
  return (
    <div className="filtres">
      <fieldset className="bloc-niveau">
        <legend>Ton niveau</legend>
        <div className="niveau">
          <button type="button" aria-label="Niveau précédent" onClick={() => maj({ niveau: Math.max(1, etat.niveau - 1) })}>−</button>
          <input id="niveau-nb" type="number" min={1} max={60} value={etat.niveau}
            onChange={(e) => maj({ niveau: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })} aria-label="Niveau" />
          <button type="button" aria-label="Niveau suivant" onClick={() => maj({ niveau: Math.min(60, etat.niveau + 1) })}>+</button>
        </div>
        <input id="niveau-curseur" type="range" min={1} max={60} value={etat.niveau}
          onChange={(e) => maj({ niveau: Number(e.target.value) })} aria-label="Niveau (curseur)" />
        <div className="reperes" aria-hidden="true"><span>1</span><span>20</span><span>40</span><span>60</span></div>
      </fieldset>

      <fieldset>
        <legend>Rôle</legend>
        <div className="seg">
          <button type="button" aria-pressed={etat.role === 'chat'} onClick={() => maj({ role: 'chat' })}>Félin (dégâts)</button>
          <button type="button" aria-pressed={etat.role === 'ours'} onClick={() => maj({ role: 'ours' })}>Ours (tank)</button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Faction</legend>
        <div className="seg">
          {(['toutes', 'Alliance', 'Horde'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={etat.faction === f} onClick={() => maj({ faction: f })}>
              {f === 'toutes' ? 'Les deux' : f}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Provenance</legend>
        <div className="puces">
          {ORDRE_SOURCES.filter((s) => comptes[s]).map((s) => (
            <label key={s} className={`puce src-${s}`}>
              <input type="checkbox" checked={etat.sources.includes(s)} onChange={() => maj({ sources: basculer(etat.sources, s) })} />
              {SOURCES[s]} <small>{comptes[s]}</small>
            </label>
          ))}
        </div>
        <label className="coche">
          <input id="cb-maroquinier" type="checkbox" checked={etat.maroquinier} onChange={(e) => maj({ maroquinier: e.target.checked })} />
          Je suis travailleur du cuir <small>(pièces liées quand ramassées)</small>
        </label>
        <label className="coche">
          <input id="cb-hv" type="checkbox" checked={etat.hvSeulement} onChange={(e) => maj({ hvSeulement: e.target.checked })} />
          Seulement ce qui s’achète à l’hôtel des ventes
        </label>
      </fieldset>

      <fieldset>
        <legend>Qualité</legend>
        <div className="puces">
          {[2, 3, 4, 5].map((q) => (
            <label key={q} className={`puce q${q}`}>
              <input type="checkbox" checked={etat.qualites.includes(q)} onChange={() => maj({ qualites: basculer(etat.qualites, q) })} />
              {QUALITES[q]}
            </label>
          ))}
        </div>
      </fieldset>

      {liste && (
        <>
          <fieldset>
            <legend>Recherche</legend>
            <input id="recherche" type="search" placeholder="Nom de l’objet (français ou anglais)" value={etat.recherche}
              onChange={(e) => maj({ recherche: e.target.value })} />
          </fieldset>

          <fieldset className="grille-2">
            <legend>Affinage</legend>
            <label>Emplacement
              <select id="sel-emplacement" value={etat.emplacement} onChange={(e) => maj({ emplacement: e.target.value as Emplacement | 'tous' })}>
                <option value="tous">Tous</option>
                {ORDRE_EMPLACEMENTS.map((e) => <option key={e} value={e}>{EMPLACEMENTS[e]}</option>)}
              </select>
            </label>
            <label>Donjon, raid ou zone
              <select id="sel-lieu" value={etat.lieu} onChange={(e) => maj({ lieu: e.target.value })}>
                <option value="">Partout</option>
                {lieux.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label>Objets plus bas
              <select id="sel-ecart" value={etat.ecart} onChange={(e) => maj({ ecart: Number(e.target.value) })}>
                <option value={0}>Tous</option>
                {[3, 5, 10, 15].map((n) => <option key={n} value={n}>Jusqu’à {n} niveaux sous le mien</option>)}
              </select>
            </label>
            <label>À venir
              <select id="sel-avance" value={etat.avance} onChange={(e) => maj({ avance: Number(e.target.value) })}>
                <option value={0}>Rien au-dessus de mon niveau</option>
                {[2, 5, 10].map((n) => <option key={n} value={n}>Les {n} niveaux suivants</option>)}
              </select>
            </label>
            <label>Trier par
              <select id="sel-tri" value={etat.tri} onChange={(e) => maj({ tri: e.target.value as Etat['tri'] })}>
                <option value="valeur">Valeur pour le rôle</option>
                <option value="niveau">Niveau requis</option>
                <option value="ilvl">Niveau d’objet</option>
                <option value="nom">Nom</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Doit avoir</legend>
            <div className="puces">
              {STATS_FILTRE.map((s: Stat) => (
                <label key={s} className="puce">
                  <input type="checkbox" checked={etat.stats.includes(s)} onChange={() => maj({ stats: basculer(etat.stats, s) })} />
                  {COURT[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button type="button" className="lien" onClick={() => maj({ ...DEFAUT, vue: etat.vue, niveau: etat.niveau })}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}
