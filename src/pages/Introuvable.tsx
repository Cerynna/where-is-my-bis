import { Link } from 'react-router';

export function Introuvable() {
  return (
    <main className="page-texte">
      <h1>Page introuvable</h1>
      <p>Cette adresse ne correspond à aucune page du site.</p>
      <p><Link to="/">Retour aux classes</Link></p>
    </main>
  );
}
