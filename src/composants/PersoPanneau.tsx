import { useState, type FormEvent } from 'react';
import { importerPerso } from '../armurerie.ts';
import type { Perso } from '../types.ts';

interface Props {
  perso: Perso | null;
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

export function PersoPanneau({ perso, surImport, surOubli }: Props) {
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
          <p className="perso-nom">{perso.nom}</p>
          <p className="perso-infos">
            Niveau {perso.niveau} · {perso.classe}{perso.specialisation ? ` (${perso.specialisation})` : ''}
            {perso.faction ? ` · ${perso.faction}` : ''}{perso.maroquinier ? ' · travail du cuir' : ''}
          </p>
          {!perso.estDruide && <p className="perso-alerte">Ce personnage n’est pas druide : les conseils restent ceux d’un druide farouche.</p>}
          <p className="perso-date">
            Importé {depuis(perso.importeLe)}
            {perso.majArmurerie ? ` · armurerie mise à jour ${depuis(perso.majArmurerie)}` : ''}
          </p>
          <div className="perso-actions">
            <button type="button" onClick={() => void importer(perso.lien)} disabled={charge}>{charge ? 'Actualisation…' : 'Actualiser'}</button>
            <button type="button" className="lien" onClick={surOubli}>Oublier ce personnage</button>
          </div>
        </>
      ) : (
        <form onSubmit={envoyer}>
          <label htmlFor="lien-armurerie">Colle le lien de ton personnage sur l’armurerie WoW Forever pour comparer avec ce que tu portes.</label>
          <input id="lien-armurerie" type="url" inputMode="url" placeholder="https://worldofwarcraft.blizzard.com/fr-fr/forever/eu/armory/character/…"
            value={lien} onChange={(e) => setLien(e.target.value)} required />
          <button type="submit" disabled={charge || !lien.trim()}>{charge ? 'Import…' : 'Importer'}</button>
        </form>
      )}
      {erreur && <p className="perso-erreur" role="alert">{erreur}</p>}
    </section>
  );
}
