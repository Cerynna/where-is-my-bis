import { useCallback, useEffect, useMemo, useState } from 'react';
import { ecrirePerso, lirePerso } from './armurerie.ts';
import { Ensemble } from './composants/Ensemble.tsx';
import { Filtres } from './composants/Filtres.tsx';
import { FournisseurInfobulle } from './composants/Infobulle.tsx';
import { ListeObjets } from './composants/ListeObjets.tsx';
import { PersoPanneau } from './composants/PersoPanneau.tsx';
import { ecrireEtat, lireEtat, type Etat } from './etat.ts';
import { nombre } from './libelles.ts';
import type { Donnees, Objet, Perso, TypeSource } from './types.ts';
import { objetsPortes } from './valeur.ts';

export function App() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<Etat>(lireEtat);
  const [perso, setPerso] = useState<Perso | null>(lirePerso);

  useEffect(() => {
    fetch('./data/objets.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<Donnees>; })
      .then(setDonnees)
      .catch((e: unknown) => setErreur(String(e)));
  }, []);
  useEffect(() => { ecrireEtat(etat); }, [etat]);
  const maj = useCallback((p: Partial<Etat>) => setEtat((e) => ({ ...e, ...p })), []);

  const surImport = useCallback((p: Perso) => {
    setPerso(p);
    ecrirePerso(p);
    // Les réglages suivent le personnage : niveau, faction, travail du cuir, spécialisation active.
    const spe = p.specialisation ?? '';
    setEtat((e) => ({
      ...e,
      niveau: Math.min(60, Math.max(1, p.niveau)),
      faction: p.faction ?? e.faction,
      maroquinier: p.maroquinier,
      role: /équilibre/i.test(spe) ? 'equilibre'
        : /restauration/i.test(spe) ? 'resto'
        : /farouche/i.test(spe) && (e.role === 'equilibre' || e.role === 'resto') ? 'chat'
        : e.role,
    }));
  }, []);
  const surOubli = useCallback(() => { setPerso(null); ecrirePerso(null); }, []);

  const parId = useMemo(() => new Map<number, Objet>((donnees?.objets ?? []).map((o) => [o.id, o])), [donnees]);
  const portes = useMemo(() => objetsPortes(perso, parId), [perso, parId]);

  const { lieux, comptes } = useMemo(() => {
    const lieux = new Set<string>();
    const comptes: Partial<Record<TypeSource, number>> = {};
    for (const o of donnees?.objets ?? []) {
      for (const t of new Set(o.sources.map((s) => s.type))) comptes[t] = (comptes[t] ?? 0) + 1;
      for (const s of o.sources) if (s.lieu && ['donjon', 'raid', 'quete'].includes(s.type)) lieux.add(s.lieu);
    }
    return { lieux: [...lieux].sort((a, b) => a.localeCompare(b, 'fr')), comptes };
  }, [donnees]);

  return (
    <FournisseurInfobulle etat={etat} portes={portes}>
      <header className="entete">
        <div className="entete-int">
          <div className="marque">
            <span className="sur-titre">Félin · Ours · Équilibre · Restauration · WoW Forever</span>
            <h1>Druide Forever</h1>
          </div>
          <nav className="onglets" aria-label="Vues">
            <button type="button" aria-pressed={etat.vue === 'ensemble'} onClick={() => maj({ vue: 'ensemble' })}>Ensemble conseillé</button>
            <button type="button" aria-pressed={etat.vue === 'objets'} onClick={() => maj({ vue: 'objets' })}>Base d’objets</button>
          </nav>
        </div>
      </header>

      <div className="page">
        <aside className="cote">
          <PersoPanneau key={perso?.importeLe ?? 'aucun'} perso={perso} surImport={surImport} surOubli={surOubli} />
          <details className="tiroir" open>
            <summary>Réglages et filtres</summary>
            <Filtres etat={etat} maj={maj} lieux={lieux} comptes={comptes} avecPerso={!!perso} />
          </details>
        </aside>
        <main className="contenu">
          {erreur && <p className="erreur">Impossible de charger les objets ({erreur}).</p>}
          {!donnees && !erreur && <p className="chargement">Chargement des objets…</p>}
          {donnees && etat.vue === 'ensemble' && <Ensemble objets={donnees.objets} etat={etat} perso={perso} portes={portes} />}
          {donnees && etat.vue === 'objets' && <ListeObjets key={JSON.stringify(etat)} objets={donnees.objets} etat={etat} portes={portes} />}
        </main>
      </div>

      <footer className="pied">
        <p>
          {donnees ? `${nombre(donnees.objets.length)} objets · build du jeu ${donnees.build} · données du ${new Date(donnees.genere).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}. ` : ''}
          Stats lues dans les fichiers du jeu et le cache des objets révélés ; provenance d’après <a href="https://wowf.io" target="_blank" rel="noopener">wowf.io</a> et l’addon AzerothCompendium de D4KiR (taux de butin, raids, quêtes, réputations) ; fiches et icônes de <a href="https://www.wowhead.com/forever" target="_blank" rel="noopener">Wowhead</a>.
          Les butins du monde bleus et violets ne sont pas listés : trop rares pour compter dessus.
        </p>
        <p>Site de fan, non affilié à Blizzard Entertainment.</p>
      </footer>
    </FournisseurInfobulle>
  );
}
