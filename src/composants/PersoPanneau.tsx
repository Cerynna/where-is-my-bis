import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router';
import { importerPerso } from '../armurerie.ts';
import { classeParEnum } from '../classes/index.ts';
import { ARMURERIE_DISPONIBLE } from '../env.ts';
import type { Classe } from '../classes/types.ts';
import type { Perso } from '../types.ts';

interface Props {
  perso: Perso | null;
  /** Classe de la page (absente sur l'accueil). */
  classe?: Classe;
  surImport: (p: Perso) => void;
  surOubli: () => void;
}

function depuis(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `le ${new Date(iso).toLocaleDateString('fr-FR')}`;
}

export function PersoPanneau({ perso, classe, surImport, surOubli }: Props) {
  const saClasse = classeParEnum(perso?.classeEnum);
  const autreClasse = !!(classe && perso?.classeEnum && perso.classeEnum !== classe.enumArmurerie);
  const [lien, setLien] = useState(perso?.lien ?? '');
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function importer(l: string) {
    setCharge(true);
    setErreur(null);
    try {
      surImport(await importerPerso(l));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setCharge(false);
    }
  }
  const envoyer = (e: FormEvent) => { e.preventDefault(); void importer(lien); };

  return (
    <section className="perso" aria-labelledby="h-perso">
      <h2 id="h-perso">Ton personnage</h2>
      {perso ? (
        <>
          <p className="perso-nom" style={saClasse ? ({ '--perso': saClasse.couleur } as CSSProperties) : undefined}>{perso.nom}</p>
          <p className="perso-infos">
            Niveau {perso.niveau} · {perso.classe}{perso.specialisation ? ` (${perso.specialisation})` : ''}
            {perso.faction ? ` · ${perso.faction}` : ''}{perso.maroquinier ? ' · travail du cuir' : ''}
          </p>
          {autreClasse && (
            <p className="perso-alerte">
              Ce personnage est {perso.classe.toLowerCase()} : il n’est pas comparé à l’équipement de cette page.
              {saClasse?.actif ? <> <Link to={`/${saClasse.id}`}>Voir la page {saClasse.nom}</Link>.</> : ' Sa classe arrive bientôt.'}
            </p>
          )}
          {!classe && saClasse && !saClasse.actif && <p className="perso-alerte">La classe {saClasse.nom.toLowerCase()} arrive bientôt sur le site.</p>}
          {!classe && saClasse?.actif && <p><Link to={`/${saClasse.id}`}>Ouvrir la page {saClasse.nom}</Link></p>}
          <p className="perso-date">
            Importé {depuis(perso.importeLe)}
            {perso.majArmurerie ? ` · armurerie mise à jour ${depuis(perso.majArmurerie)}` : ''}
          </p>
          <div className="perso-actions">
            {ARMURERIE_DISPONIBLE && (
              <button type="button" className="bouton" onClick={() => void importer(perso.lien)} disabled={charge}>{charge ? 'Actualisation…' : 'Actualiser'}</button>
            )}
            <button type="button" className="lien" onClick={surOubli}>Oublier ce personnage</button>
          </div>
        </>
      ) : !ARMURERIE_DISPONIBLE ? (
        // Site en ligne : pas encore de relais vers l'armurerie (voir env.ts).
        <p className="perso-indispo">
          Bientôt sur le site en ligne : colle le lien de ton personnage sur l’armurerie pour voir ce qui améliorerait ton équipement.
        </p>
      ) : (
        <form onSubmit={envoyer}>
          <label htmlFor="lien-armurerie">Colle le lien de ton personnage sur l’armurerie WoW Forever pour comparer avec ce que tu portes.</label>
          <input id="lien-armurerie" type="url" inputMode="url" placeholder="https://worldofwarcraft.blizzard.com/fr-fr/forever/eu/armory/character/…"
            value={lien} onChange={(e) => setLien(e.target.value)} required />
          <button type="submit" className="bouton" disabled={charge || !lien.trim()}>{charge ? 'Import…' : 'Importer'}</button>
        </form>
      )}
      {erreur && <p className="perso-erreur" role="alert">{erreur}</p>}
    </section>
  );
}
