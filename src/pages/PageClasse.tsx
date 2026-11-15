import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, NavLink, useNavigate, useParams, useSearchParams } from 'react-router';
import { usePerso } from '../App.tsx';
import { cheminPublic } from '../chemins.ts';
import { classeParEnum, classeParId, specDe } from '../classes/index.ts';
import type { Classe, Specialisation } from '../classes/types.ts';
import { ContexteClasse } from '../composants/contexteClasse.tsx';
import { Ensemble } from '../composants/Ensemble.tsx';
import { Filtres } from '../composants/Filtres.tsx';
import { FournisseurInfobulle } from '../composants/Infobulle.tsx';
import { ListeObjets } from '../composants/ListeObjets.tsx';
import { PersoPanneau } from '../composants/PersoPanneau.tsx';
import { ecrireEtat, lireEtat, type Etat, type Vue } from '../etat.ts';
import type { Donnees, Emplacement, Objet, Perso, TypeSource } from '../types.ts';
import { objetsPortes } from '../valeur.ts';
import { Introuvable } from './Introuvable.tsx';

export function PageClasse({ vue }: { vue: Vue }) {
  const { classe: id } = useParams();
  const classe = classeParId(id);
  if (!classe) return <Introuvable />;
  if (!classe.actif || !classe.specs.length) return <Bientot classe={classe} />;
  // Une clé par classe : changer de classe repart de ses propres réglages.
  return <ContenuClasse key={classe.id} classe={classe} vue={vue} />;
}

/** Spécialisation à retenir d'après celle de l'armurerie (la courante si elle convient encore). */
function specDepuisArmurerie(classe: Classe, nom: string | undefined, actuelle: string): string {
  const possibles = classe.specs.filter((s) => nom && s.armurerie?.test(nom));
  if (!possibles.length || possibles.some((s) => s.id === actuelle)) return actuelle;
  return possibles[0]!.id;
}

function ContenuClasse({ classe, vue }: { classe: Classe; vue: Vue }) {
  const [params, setParams] = useSearchParams();
  const [etat, setEtat] = useState<Etat>(() => lireEtat(classe, params));
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const { perso, definir } = usePerso();
  const naviguer = useNavigate();

  useEffect(() => {
    fetch(cheminPublic(`data/${classe.id}.json`), { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<Donnees>; })
      .then(setDonnees)
      .catch((e: unknown) => setErreur(String(e)));
  }, [classe.id]);
  useEffect(() => { setParams(ecrireEtat(etat, classe), { replace: true }); }, [etat, classe, setParams]);
  const maj = useCallback((p: Partial<Etat>) => setEtat((e) => ({ ...e, ...p })), []);
  const spe: Specialisation = specDe(classe, etat.role);

  const surImport = useCallback((p: Perso) => {
    definir(p);
    const sa = classeParEnum(p.classeEnum);
    if (sa && sa.id !== classe.id && sa.actif) { naviguer(`/${sa.id}`); return; }
    // Les réglages suivent le personnage : niveau, faction, travail du cuir, spécialisation active.
    setEtat((e) => ({
      ...e,
      niveau: Math.min(60, Math.max(1, p.niveau)),
      faction: p.faction ?? e.faction,
      maroquinier: p.maroquinier,
      role: specDepuisArmurerie(classe, p.specialisation, e.role),
    }));
  }, [classe, definir, naviguer]);

  // On ne compare qu'avec un personnage de la classe de la page.
  const persoIci = perso && (!perso.classeEnum || perso.classeEnum === classe.enumArmurerie) ? perso : null;
  const parId = useMemo(() => new Map<number, Objet>((donnees?.objets ?? []).map((o) => [o.id, o])), [donnees]);
  const portes = useMemo(() => objetsPortes(persoIci, parId), [persoIci, parId]);

  const { lieux, comptes, emplacements } = useMemo(() => {
    const lieux = new Set<string>();
    const comptes: Partial<Record<TypeSource, number>> = {};
    const emplacements = new Set<Emplacement>();
    for (const o of donnees?.objets ?? []) {
      emplacements.add(o.emplacement);
      for (const t of new Set(o.sources.map((s) => s.type))) comptes[t] = (comptes[t] ?? 0) + 1;
      for (const s of o.sources) if (s.lieu && ['donjon', 'raid', 'quete'].includes(s.type)) lieux.add(s.lieu);
    }
    return { lieux: [...lieux].sort((a, b) => a.localeCompare(b, 'fr')), comptes, emplacements: [...emplacements] };
  }, [donnees]);

  const recherche = params.toString() ? `?${params.toString()}` : '';
  return (
    <ContexteClasse.Provider value={{ classe, spe }}>
      <FournisseurInfobulle etat={etat} portes={portes}>
        {/* Toute la page prend la couleur de la classe comme accent (voir .theme-classe). */}
        <div className="theme-classe" style={{ '--classe': classe.couleur } as CSSProperties}>
        <div className="bandeau-classe">
          <div className="bandeau-int">
            <div className="bandeau-titre">
              <img src={cheminPublic(`icons/classes/${classe.icone}.jpg`)} alt="" width={40} height={40} />
              <div>
                <span className="sur-titre">{classe.specs.map((s) => s.nom).join(' · ')}</span>
                <h1>{classe.nom}</h1>
              </div>
            </div>
            <nav className="onglets" aria-label="Vues">
              <NavLink to={{ pathname: `/${classe.id}`, search: recherche }} end>Ensemble conseillé</NavLink>
              <NavLink to={{ pathname: `/${classe.id}/objets`, search: recherche }}>Base d’objets</NavLink>
            </nav>
          </div>
        </div>

        <div className="page">
          <aside className="cote">
            <PersoPanneau key={perso?.importeLe ?? 'aucun'} perso={perso} classe={classe} surImport={surImport} surOubli={() => definir(null)} />
            <details className="tiroir" open>
              <summary>Réglages et filtres</summary>
              <Filtres classe={classe} vue={vue} etat={etat} maj={maj} lieux={lieux} comptes={comptes} emplacements={emplacements} avecPerso={!!persoIci} />
            </details>
          </aside>
          <main className="contenu">
            {erreur && <p className="erreur">Impossible de charger les objets ({erreur}).</p>}
            {!donnees && !erreur && <p className="chargement">Chargement des objets…</p>}
            {donnees && vue === 'ensemble' && <Ensemble objets={donnees.objets} etat={etat} perso={persoIci} portes={portes} />}
            {donnees && vue === 'objets' && <ListeObjets key={JSON.stringify(etat)} objets={donnees.objets} etat={etat} portes={portes} />}
            {donnees && (
              <p className="infos-donnees">
                {donnees.objets.length.toLocaleString('fr-FR')} objets · build du jeu {donnees.build} · données du{' '}
                {new Date(donnees.genere).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}
          </main>
        </div>
        </div>
      </FournisseurInfobulle>
    </ContexteClasse.Provider>
  );
}

/** Classe prévue mais pas encore faite. */
function Bientot({ classe }: { classe: Classe }) {
  return (
    <main className="page-texte" style={{ '--classe': classe.couleur } as CSSProperties}>
      <img src={cheminPublic(`icons/classes/${classe.icone}.jpg`)} alt="" width={56} height={56} className="icone-classe" />
      <h1 className="titre-classe">{classe.nom}</h1>
      <p>Le {classe.nom.toLowerCase()} arrive bientôt : il faut encore décrire ses spécialisations et générer ses objets.</p>
      <p><Link to="/">Retour aux classes</Link></p>
    </main>
  );
}
