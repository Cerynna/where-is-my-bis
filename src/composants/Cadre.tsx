import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { cheminPublic } from '../chemins.ts';

/** En-tête, contenu de la page et pied de page, communs à tout le site. */
export function Cadre() {
  const { pathname } = useLocation();
  // Nouvelle page : on repart du haut.
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <header className="entete">
        <div className="entete-int">
          <Link to="/" className="marque">
            <img className="logo" src={cheminPublic('favicon.svg')} alt="" width={44} height={44} />
            <span>
              <span className="sur-titre">WIMB · WoW Forever · niveaux 1 à 60</span>
              <span className="titre-site">Where Is My <span className="bis">BIS</span></span>
            </span>
          </Link>
          <nav className="nav-site" aria-label="Site">
            <NavLink to="/" end>Classes</NavLink>
            <NavLink to="/a-propos">À propos</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="pied">
        <p>
          Stats lues dans les fichiers du jeu et le cache des objets révélés ; provenance d’après{' '}
          <a href="https://wowf.io" target="_blank" rel="noopener">wowf.io</a> et l’addon AzerothCompendium de D4KiR ;
          fiches et icônes de <a href="https://www.wowhead.com/forever" target="_blank" rel="noopener">Wowhead</a>.
        </p>
        <p>Site de fan, non affilié à Blizzard Entertainment.</p>
      </footer>
    </>
  );
}
