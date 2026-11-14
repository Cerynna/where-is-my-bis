import { useMemo, useState } from 'react';
import type { Etat } from '../etat.ts';
import { nombre } from '../libelles.ts';
import type { Objet } from '../types.ts';
import { meilleurEnsemble, passeListe, valeur } from '../valeur.ts';
import { Ligne } from './Ensemble.tsx';

const PAGE = 80;

export function ListeObjets({ objets, etat }: { objets: Objet[]; etat: Etat }) {
  const [max, setMax] = useState(PAGE);
  const resultats = useMemo(() => {
    const l = objets.filter((o) => passeListe(o, etat));
    const tri: Record<Etat['tri'], (a: Objet, b: Objet) => number> = {
      valeur: (a, b) => valeur(b, etat.role) - valeur(a, etat.role),
      niveau: (a, b) => b.niveau - a.niveau || valeur(b, etat.role) - valeur(a, etat.role),
      ilvl: (a, b) => b.ilvl - a.ilvl || b.niveau - a.niveau,
      nom: (a, b) => a.nom.localeCompare(b.nom, 'fr'),
    };
    return l.sort(tri[etat.tri]);
  }, [objets, etat]);
  const choisis = useMemo(() => {
    const ens = meilleurEnsemble(objets, etat);
    return new Set(Object.values(ens).filter(Boolean).map((o) => o!.id));
  }, [objets, etat]);

  return (
    <section aria-labelledby="h-liste">
      <h2 id="h-liste">Base d’objets</h2>
      <p className="sous-titre" aria-live="polite">
        {nombre(resultats.length)} objet{resultats.length > 1 ? 's' : ''} correspondent aux filtres
        {etat.avance ? `, dont ceux des ${etat.avance} niveaux suivants (grisés)` : ''}.
      </p>
      {resultats.length === 0 ? (
        <p className="vide-liste">Aucun objet ne correspond. Élargis la provenance, la qualité ou l’emplacement.</p>
      ) : (
        <ul className="liste">
          {resultats.slice(0, max).map((o) => (
            <Ligne key={o.id} o={o} choisi={choisis.has(o.id)} etat={etat} avecEmplacement />
          ))}
        </ul>
      )}
      {resultats.length > max && (
        <button type="button" className="plus" onClick={() => setMax(max + PAGE)}>
          Afficher {Math.min(PAGE, resultats.length - max)} objets de plus
        </button>
      )}
    </section>
  );
}
