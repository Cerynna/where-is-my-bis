import { useMemo, useState } from 'react';
import type { Etat } from '../etat.ts';
import { nombre } from '../libelles.ts';
import type { Objet } from '../types.ts';
import { meilleurEnsemble, passeListe, valeur, valeurPortee } from '../valeur.ts';
import { useClasse } from './contexteClasse.tsx';
import { Ligne } from './Ensemble.tsx';

const PAGE = 80;

export function ListeObjets({ objets, etat, portes }: { objets: Objet[]; etat: Etat; portes: Objet[] }) {
  const { spe } = useClasse();
  const [max, setMax] = useState(PAGE);
  const resultats = useMemo(() => {
    let l = objets.filter((o) => passeListe(o, etat));
    if (etat.ameliorations && portes.length) {
      const ids = new Set(portes.map((p) => p.id));
      l = l.filter((o) => !ids.has(o.id) && valeur(o, spe) > (valeurPortee(portes, o.emplacement, spe) ?? 0));
    }
    const tri: Record<Etat['tri'], (a: Objet, b: Objet) => number> = {
      valeur: (a, b) => valeur(b, spe) - valeur(a, spe),
      niveau: (a, b) => b.niveau - a.niveau || valeur(b, spe) - valeur(a, spe),
      ilvl: (a, b) => b.ilvl - a.ilvl || b.niveau - a.niveau,
      nom: (a, b) => a.nom.localeCompare(b.nom, 'fr'),
    };
    return l.sort(tri[etat.tri]);
  }, [objets, etat, spe, portes]);
  const choisis = useMemo(() => {
    const ens = meilleurEnsemble(objets, etat, spe, portes);
    return new Set(Object.values(ens).filter(Boolean).map((o) => o!.id));
  }, [objets, etat, spe, portes]);

  return (
    <section aria-labelledby="h-liste">
      <h2 id="h-liste">Base d’objets</h2>
      <p className="sous-titre" aria-live="polite">
        {nombre(resultats.length)} objet{resultats.length > 1 ? 's' : ''} correspondent aux filtres
        {etat.ameliorations && portes.length ? ', tous meilleurs que ce que tu portes' : ''}
        {etat.avance ? `, dont ceux des ${etat.avance} niveaux suivants (grisés)` : ''}.
      </p>
      {resultats.length === 0 ? (
        <p className="vide-liste">Aucun objet ne correspond. Élargis la provenance, la qualité ou l’emplacement.</p>
      ) : (
        <ul className="liste">
          {resultats.slice(0, max).map((o) => (
            <Ligne key={o.id} o={o} choisi={choisis.has(o.id)} etat={etat} portes={portes} avecEmplacement />
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
