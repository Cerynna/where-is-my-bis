import { caseDistance } from '../classes/equipement.ts';
import { CLASSES } from '../classes/index.ts';
import { COURT, nombre } from '../libelles.ts';
import type { Stat } from '../types.ts';

export function APropos() {
  const actives = CLASSES.filter((c) => c.actif);
  return (
    <main className="page-texte">
      <h1>À propos</h1>

      <section>
        <h2>D’où viennent les objets</h2>
        <ul>
          <li><strong>Stats :</strong> lues dans les tables du jeu (publiées par wago.tools) et dans le cache des objets révélés par le serveur. Sur Forever, les stats suivent un budget par niveau d’objet ; armure et dégâts sont recalculés de la même façon et vérifiés sur wowf.io.</li>
          <li><strong>Provenance :</strong> fiches et pages de donjon de wowf.io (en français), complétées par l’addon AzerothCompendium : taux de butin des boss et des monstres, raids, récompenses de quête, réputations, rangs d’honneur.</li>
          <li><strong>Objets écartés :</strong> jamais vus en jeu, sans stat utile, butins du monde bleus et violets (trop rares). Les butins plus rares que le seuil choisi (1 % par défaut) sont ignorés.</li>
          <li><strong>Provenance inconnue :</strong> certains objets ne sont pas encore révélés sur wowf.io ; leur lien ouvre la fiche Wowhead, qui la donne souvent.</li>
        </ul>
      </section>

      <section>
        <h2>Comment les objets sont classés</h2>
        <p>
          Chaque spécialisation donne un poids à chaque stat ; la valeur d’un objet est la somme de ses stats pondérées. L’ensemble conseillé
          prend, pour chaque emplacement, l’objet de plus grande valeur accessible à ton niveau (niveau requis, niveau de la quête ou entrée du
          donjon), y compris les pièces que tu portes déjà.
        </p>
        {actives.map((c) => (
          <div key={c.id} className="poids-classe">
            <h3 style={{ color: c.couleur }}>{c.nom}</h3>
            <dl>
              {c.specs.map((s) => {
                const tops = (Object.entries(s.poids) as [Stat | 'dps' | 'dpsDistance' | 'armureBase', number][])
                  .filter(([k, v]) => v >= 0.5 && k !== 'armureBase')
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => {
                    const nom = k === 'dps' ? 'DPS d’arme' : k === 'dpsDistance' ? `DPS ${caseDistance(c)?.nom === 'Baguette' ? 'de baguette' : 'à distance'}` : COURT[k as Stat] ?? k;
                    return `${nom} ${nombre(v, v % 1 ? 1 : 0)}`;
                  });
                return (
                  <div key={s.id}>
                    <dt>{s.nom}</dt>
                    <dd>{tops.join(' · ')}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </section>

      <section>
        <h2>Comparer avec ton personnage</h2>
        <p>
          Colle le lien de ton personnage sur l’armurerie WoW Forever : le site reprend ton niveau, ta faction, ta spécialisation et ton
          équipement, marque chaque pièce (portée, amélioration, emplacement vide) et affiche ta pièce à côté de l’objet survolé.
        </p>
      </section>

      <p className="note-bas">Site de fan, non affilié à Blizzard Entertainment.</p>
    </main>
  );
}
