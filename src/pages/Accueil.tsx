import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePerso } from '../App.tsx';
import { cheminPublic } from '../chemins.ts';
import { CLASSES, classeParEnum } from '../classes/index.ts';
import { PersoPanneau } from '../composants/PersoPanneau.tsx';
import type { Perso } from '../types.ts';

export function Accueil() {
  const { perso, definir } = usePerso();
  const naviguer = useNavigate();
  const surImport = (p: Perso) => {
    definir(p);
    const c = classeParEnum(p.classeEnum);
    if (c?.actif) naviguer(`/${c.id}`);
  };

  return (
    <main className="accueil">
      <section className="accueil-tete">
        <h1>Le meilleur équipement, niveau par niveau</h1>
        <p>
          Pour chaque classe de WoW Forever et chaque spécialisation, l’ensemble conseillé à ton niveau, du 1 au 60, avec la provenance de chaque
          pièce : donjon et boss, quête, métier, réputation. Colle le lien de ton personnage sur l’armurerie pour voir ce qui améliorerait ton
          équipement.
        </p>
      </section>

      <section aria-labelledby="h-classes">
        <h2 id="h-classes">Choisis ta classe</h2>
        <ul className="grille-classes">
          {/* Les classes déjà faites d'abord (tri stable : l'ordre du jeu est gardé dans chaque groupe) */}
          {[...CLASSES].sort((a, b) => Number(b.actif) - Number(a.actif)).map((c) => {
            const contenu = (
              <>
                <img src={cheminPublic(`icons/classes/${c.icone}.jpg`)} alt="" width={48} height={48} />
                <span className="carte-classe-nom">{c.nom}</span>
                <span className="carte-classe-specs">{c.actif ? c.specs.map((s) => s.nom).join(' · ') : 'Bientôt'}</span>
              </>
            );
            return (
              <li key={c.id} style={{ '--classe': c.couleur } as CSSProperties}>
                {c.actif
                  ? <Link className="carte-classe" to={`/${c.id}`}>{contenu}</Link>
                  : <div className="carte-classe inactive" aria-disabled="true">{contenu}</div>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="accueil-perso">
        <PersoPanneau key={perso?.importeLe ?? 'aucun'} perso={perso} surImport={surImport} surOubli={() => definir(null)} />
      </section>
    </main>
  );
}
