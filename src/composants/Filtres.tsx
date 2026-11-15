import type { Classe } from '../classes/types.ts';
import { NOMS_MATIERES, type Matiere } from '../classes/equipement.ts';
import { specDe } from '../classes/index.ts';
import type { Etat, Vue } from '../etat.ts';
import { IconeSpe } from './IconeSpe.tsx';
import { defaut } from '../etat.ts';
import { COURT, libelleEmplacement, ORDRE_EMPLACEMENTS, ORDRE_SOURCES, QUALITES, SOURCES } from '../libelles.ts';
import type { Emplacement, Stat, TypeSource } from '../types.ts';

interface Props {
  classe: Classe;
  vue: Vue;
  etat: Etat;
  maj: (p: Partial<Etat>) => void;
  lieux: string[];
  comptes: Partial<Record<TypeSource, number>>;
  /** Emplacements présents dans les données de la classe. */
  emplacements: Emplacement[];
  avecPerso: boolean;
}

function basculer<T>(liste: T[], v: T): T[] {
  return liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v];
}

export function Filtres({ classe, vue, etat, maj, lieux, comptes, emplacements, avecPerso }: Props) {
  const liste = vue === 'objets';
  const spe = specDe(classe, etat.role);
  // Les pièces du travail du cuir liées quand ramassées sont toutes en cuir : inutile pour une classe en tissu.
  const porteCuir = classe.armures.some((a) => a.matiere === 'cuir');
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

      {classe.specs.length > 1 && (
        <fieldset>
          <legend>Spécialisation</legend>
          <div className={`seg${classe.specs.length > 2 ? ' seg-specs' : ''}`}>
            {classe.specs.map((s) => (
              // Icône seule ; le nom au survol (title) et pour les lecteurs d'écran (aria-label).
              <button key={s.id} type="button" aria-pressed={etat.role === s.id} onClick={() => maj({ role: s.id, stats: [] })}
                title={s.nom} aria-label={s.nom}>
                <IconeSpe spe={s} taille={34} />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {classe.armures.length > 1 && (
        <fieldset>
          <legend>Armure</legend>
          <div className="puces">
            {classe.armures.map(({ matiere: m }) => (
              <label key={m} className="puce">
                <input type="checkbox" checked={etat.matieres.includes(m)} onChange={() => maj({ matieres: basculer<Matiere>(etat.matieres, m) })} />
                {NOMS_MATIERES[m]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

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
        <label className="champ-taux" htmlFor="sel-taux">
          Taux de butin minimum
          <select id="sel-taux" value={etat.tauxMin} onChange={(e) => maj({ tauxMin: Number(e.target.value) })}>
            <option value={0}>Tous les butins</option>
            <option value={1}>1 %</option>
            <option value={5}>5 %</option>
            <option value={10}>10 %</option>
          </select>
        </label>
        {porteCuir && (
          <label className="coche">
            <input id="cb-maroquinier" type="checkbox" checked={etat.maroquinier} onChange={(e) => maj({ maroquinier: e.target.checked })} />
            Je suis travailleur du cuir <small>(pièces liées quand ramassées)</small>
          </label>
        )}
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
            {avecPerso && (
              <label className="coche">
                <input id="cb-ameliorations" type="checkbox" checked={etat.ameliorations} onChange={(e) => maj({ ameliorations: e.target.checked })} />
                Seulement les améliorations de mon équipement
              </label>
            )}
          </fieldset>

          <fieldset className="grille-2">
            <legend>Affinage</legend>
            <label>Emplacement
              <select id="sel-emplacement" value={etat.emplacement} onChange={(e) => maj({ emplacement: e.target.value as Emplacement | 'tous' })}>
                <option value="tous">Tous</option>
                {ORDRE_EMPLACEMENTS.filter((e) => emplacements.includes(e)).map((e) => <option key={e} value={e}>{libelleEmplacement(e, classe)}</option>)}
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
                <option value="valeur">Valeur pour la spécialisation</option>
                <option value="niveau">Niveau requis</option>
                <option value="ilvl">Niveau d’objet</option>
                <option value="nom">Nom</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Doit avoir</legend>
            <div className="puces">
              {spe.filtre.map((s: Stat) => (
                <label key={s} className="puce">
                  <input type="checkbox" checked={etat.stats.includes(s)} onChange={() => maj({ stats: basculer(etat.stats, s) })} />
                  {COURT[s]}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button type="button" className="lien" onClick={() => maj({ ...defaut(classe), niveau: etat.niveau, role: etat.role })}>
        Réinitialiser les filtres
      </button>
    </div>
  );
}
