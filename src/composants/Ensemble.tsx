import { useMemo } from 'react';
import type { Etat } from '../etat.ts';
import { COURT, EMPLACEMENTS, nombre } from '../libelles.ts';
import type { Emplacement, Objet, Perso, Stat } from '../types.ts';
import {
  comparer, meilleurEnsemble, passeCommun, sourcesVisibles, valeur, valeurPortee,
  type Case, type Ensemble as TEnsemble, type Statut,
} from '../valeur.ts';
import { useClasse } from './contexteClasse.tsx';
import { Icone } from './Icone.tsx';
import { NomObjet, Survol } from './Infobulle.tsx';
import { texteSource } from './sources.ts';

const DROITE: [Case, string][] = [['mains', 'Mains'], ['taille', 'Taille'], ['jambes', 'Jambes'], ['pieds', 'Pieds'], ['doigt1', 'Doigt'], ['doigt2', 'Doigt'], ['bijou1', 'Bijou'], ['bijou2', 'Bijou']];

/** Colonne de gauche de la fiche ; la relique n'y figure que si la classe en a une. */
function gauche(nomRelique?: string): [Case, string][] {
  const c: [Case, string][] = [['tete', 'Tête'], ['cou', 'Cou'], ['epaules', 'Épaules'], ['dos', 'Dos'], ['torse', 'Torse'], ['poignets', 'Poignets']];
  return nomRelique ? [...c, ['relique', nomRelique]] : c;
}

/** Blocs « emplacement par emplacement ». */
function details(nomRelique?: string): [Emplacement[], string, Case[]][] {
  const d: [Emplacement[], string, Case[]][] = [
    [['tete'], 'Tête', ['tete']], [['cou'], 'Cou', ['cou']], [['epaules'], 'Épaules', ['epaules']], [['dos'], 'Dos', ['dos']],
    [['torse'], 'Torse', ['torse']], [['poignets'], 'Poignets', ['poignets']], [['mains'], 'Mains', ['mains']],
    [['taille'], 'Taille', ['taille']], [['jambes'], 'Jambes', ['jambes']], [['pieds'], 'Pieds', ['pieds']],
    [['doigt'], 'Doigts', ['doigt1', 'doigt2']], [['bijou'], 'Bijoux', ['bijou1', 'bijou2']],
    [['arme2m', 'arme1m'], 'Arme', ['arme']], [['maing', 'bouclier'], 'Main gauche', ['maing']],
  ];
  return nomRelique ? [...d, [['relique'], nomRelique, ['relique']]] : d;
}

export function resume(o: Objet): string {
  const p: string[] = [];
  if (o.arme) p.push(`${nombre(o.arme.dps, 1)} DPS`);
  for (const [k, n] of Object.entries(o.stats) as [Stat, number][]) if (COURT[k]) p.push(`${n} ${COURT[k]}`);
  if (!p.length && o.effets.length) p.push('effet spécial');
  return p.join(' · ');
}

export function provenanceCourte(o: Objet, etat: Etat): string {
  const s = sourcesVisibles(o, etat)[0];
  if (!s) return '';
  const t = texteSource(s);
  return `${t.lieu}${t.detail && s.type !== 'monde' && s.type !== 'inconnue' ? ` · ${t.detail}` : ''}${o.sources.length > 1 ? ` (+${o.sources.length - 1})` : ''}`;
}

/**
 * Provenance affichée sous le nom. Quand wowf.io ne l'a pas encore révélée, on renvoie vers la fiche
 * Wowhead, qui la donne souvent (elle n'est lisible qu'en ouvrant la page dans un navigateur).
 */
export function Provenance({ o, etat, className }: { o: Objet; etat: Etat; className: string }) {
  const s = sourcesVisibles(o, etat)[0];
  if (s?.type === 'inconnue') {
    return (
      <span className={className}>
        <a className="lien-provenance" href={`https://www.wowhead.com/forever/fr/item=${o.id}`} target="_blank" rel="noopener noreferrer">
          Provenance sur Wowhead ↗
        </a>
      </span>
    );
  }
  return <span className={className}>{provenanceCourte(o, etat)}</span>;
}

function TexteStatut({ s }: { s: Statut | undefined }) {
  if (!s || s.type === 'aucun') return null;
  if (s.type === 'porte') return <div className="statut porte">✓ Tu le portes</div>;
  return (
    <div className="statut mieux">
      ▲ {!s.remplace ? 'Emplacement vide chez toi'
        : Number.isFinite(s.gain) ? `+${nombre(Math.max(0, s.gain) * 100)} % sur ${s.remplace.nom}`
        : `Remplace ${s.remplace.nom}`}
    </div>
  );
}

function Carte({ libelle, objet, droite, etat, statut }: { libelle: string; objet: Objet | null; droite?: boolean; etat: Etat; statut?: Statut }) {
  if (!objet) {
    return (
      <div className={`case vide${droite ? ' droite' : ''}`}>
        <span className="icone" aria-hidden="true" />
        <div><div className="case-lib">{libelle}</div><div className="case-nom">Rien à ce niveau</div></div>
      </div>
    );
  }
  return (
    <Survol objet={objet} className={`case${droite ? ' droite' : ''}${statut?.type === 'mieux' ? ' a-changer' : ''}`}>
      <Icone objet={objet} />
      <div>
        <div className="case-lib">{libelle}</div>
        <div className="case-nom"><NomObjet objet={objet} /></div>
        <div><Provenance o={objet} etat={etat} className="case-src" /></div>
        <TexteStatut s={statut} />
      </div>
    </Survol>
  );
}

function totaux(objets: (Objet | null | undefined)[]) {
  const t: Partial<Record<Stat, number>> = {};
  let armure = 0;
  for (const o of objets) {
    if (!o) continue;
    armure += o.armure;
    for (const [k, n] of Object.entries(o.stats) as [Stat, number][]) t[k] = (t[k] ?? 0) + n;
  }
  return { t, armure };
}

function Bilan({ ens, portes }: { ens: TEnsemble; portes: Objet[] }) {
  const { spe } = useClasse();
  const { t, armure } = totaux(Object.values(ens));
  const avant = portes.length ? totaux(portes) : null;
  const lignes = spe.bilan;
  const physique = spe.physique;
  const armePortee = portes.find((o) => o.arme);
  const vAvant = portes.reduce((s, o) => s + valeur(o, spe), 0);
  const vApres = Object.values(ens).reduce((s, o) => s + (o ? valeur(o, spe) : 0), 0);
  const pa = (t.for ?? 0) * 2 + (t.pa ?? 0) + (ens.arme?.arme ? Math.round(ens.arme.arme.dps * 14) : 0);
  const cellule = (a: number | undefined, b: number | undefined, dec = 0) => (
    <dd>
      {avant && <span className="avant">{nombre(a ?? 0, dec)} → </span>}
      {avant ? '' : '+'}{nombre(b ?? 0, dec)}
    </dd>
  );
  return (
    <div className="bilan">
      <h3>{avant ? 'Ton équipement → l’ensemble conseillé' : 'Total de l’ensemble'}</h3>
      <dl>
        {lignes.filter(([k]) => t[k] || avant?.t[k]).map(([k, l]) => (<div key={k}><dt>{l}</dt>{cellule(avant?.t[k], t[k])}</div>))}
        <div><dt>Armure des pièces</dt>{cellule(avant ? avant.armure + (avant.t.armure ?? 0) : undefined, armure + (t.armure ?? 0))}</div>
        {physique && ens.arme?.arme && <div><dt>DPS de l’arme</dt>{cellule(armePortee?.arme?.dps, ens.arme.arme.dps, 1)}</div>}
      </dl>
      <p className="note">
        {avant && vAvant > 0 ? `Valeur estimée en ${spe.nom.toLowerCase()} : +${nombre(Math.max(0, (vApres - vAvant) / vAvant) * 100)} % en suivant l’ensemble conseillé. ` : ''}
        {spe.id === 'chat' ? `En félin, la Force et l’arme valent environ ${nombre(pa)} PA, sans compter l’Agilité.` : spe.note}
      </p>
    </div>
  );
}

export function Ensemble({ objets, etat, perso, portes }: { objets: Objet[]; etat: Etat; perso: Perso | null; portes: Objet[] }) {
  const { classe, spe } = useClasse();
  const ens = useMemo(() => meilleurEnsemble(objets, etat, spe, portes), [objets, etat, spe, portes]);
  const statuts = useMemo(() => comparer(ens, perso, portes, spe), [ens, perso, portes, spe]);
  const choisis = new Set(Object.values(ens).filter(Boolean).map((o) => o!.id));
  const nbChangements = Object.values(statuts).filter((s) => s?.type === 'mieux').length;

  return (
    <>
      <section aria-labelledby="h-ens">
        <h2 id="h-ens">Ensemble conseillé au niveau {etat.niveau}</h2>
        <p className="sous-titre">
          {perso
            ? `Comparé à ce que porte ${perso.nom} : ${nbChangements ? `${nbChangements} pièce${nbChangements > 1 ? 's' : ''} à changer` : 'rien de mieux à trouver pour l’instant'}. `
            : 'Le meilleur objet de chaque emplacement'}
          {perso ? '' : ` pour un ${classe.nom.toLowerCase()} ${spe.libelle}${etat.faction !== 'toutes' ? `, ${etat.faction}` : ''}. `}
          Survole un objet pour voir son infobulle ; son nom ouvre sa fiche Wowhead.
        </p>
        <div className="fiche">
          <div className="colonne">{gauche(classe.relique?.nom).map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} etat={etat} statut={statuts[c]} />)}</div>
          <div className="centre">
            <Bilan ens={ens} portes={portes} />
            <Carte libelle={ens.maing ? 'Arme à une main' : 'Arme'} objet={ens.arme} etat={etat} statut={statuts.arme} />
            {ens.maing && <Carte libelle="Main gauche" objet={ens.maing} etat={etat} statut={statuts.maing} />}
          </div>
          <div className="colonne">{DROITE.map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} droite etat={etat} statut={statuts[c]} />)}</div>
        </div>
      </section>

      <section aria-labelledby="h-detail">
        <h2 id="h-detail">Emplacement par emplacement</h2>
        <p className="sous-titre">Les meilleurs choix à ton niveau, puis la prochaine amélioration dans les dix niveaux qui viennent.</p>
        <div className="blocs">
          {details(classe.relique?.nom).map(([emps, titre, cases]) => (
            <BlocEmplacement key={titre} titre={titre} emps={emps} objets={objets} etat={etat} choisis={choisis} portes={portes}
              actuel={Math.min(...cases.map((c) => (ens[c] ? valeur(ens[c]!, spe) : 0)))} />
          ))}
        </div>
      </section>
    </>
  );
}

function BlocEmplacement({ titre, emps, objets, etat, choisis, actuel, portes }: {
  titre: string; emps: Emplacement[]; objets: Objet[]; etat: Etat; choisis: Set<number>; actuel: number; portes: Objet[];
}) {
  const { spe } = useClasse();
  const { maintenant, ensuite } = useMemo(() => {
    const ici = objets.filter((o) => emps.includes(o.emplacement) && passeCommun(o, etat));
    const tri = (a: Objet, b: Objet) => valeur(b, spe) - valeur(a, spe);
    const maintenant = ici.filter((o) => o.niveau <= etat.niveau).sort(tri).slice(0, 5);
    const ensuite = ici
      .filter((o) => o.niveau > etat.niveau && o.niveau <= etat.niveau + 10 && valeur(o, spe) > actuel)
      .sort((a, b) => a.niveau - b.niveau || tri(a, b))[0];
    return { maintenant, ensuite };
  }, [objets, emps, etat, spe, actuel]);
  const portesIci = portes.filter((o) => emps.includes(o.emplacement));
  if (!maintenant.length && !ensuite && !portesIci.length) return null;
  return (
    <div className="bloc">
      <header><h3>{titre}</h3><span>{emps.length > 1 ? 'deux mains ou une main' : ''}</span></header>
      <ul>
        {portesIci.filter((p) => !maintenant.some((o) => o.id === p.id)).map((p) => (
          <Ligne key={`p${p.id}`} o={p} choisi={choisis.has(p.id)} etat={etat} portes={portes} />
        ))}
        {maintenant.map((o) => <Ligne key={o.id} o={o} choisi={choisis.has(o.id)} etat={etat} portes={portes} />)}
        {ensuite && (<>
          <li className="a-venir-titre">Prochaine amélioration</li>
          <Ligne o={ensuite} choisi={false} etat={etat} portes={portes} />
        </>)}
      </ul>
    </div>
  );
}

export function Ligne({ o, choisi, etat, portes, avecEmplacement }: { o: Objet; choisi: boolean; etat: Etat; portes: Objet[]; avecEmplacement?: boolean }) {
  const { classe, spe } = useClasse();
  const trop = o.niveau > etat.niveau;
  const premiere = sourcesVisibles(o, etat)[0];
  const porte = portes.some((p) => p.id === o.id);
  const ref = valeurPortee(portes, o.emplacement, spe);
  const mieux = !porte && ref !== null && valeur(o, spe) > ref;
  return (
    <li className={`ligne${choisi ? ' choisi' : ''}${trop ? ' trop' : ''}${porte ? ' porte' : ''}`}>
      <Survol objet={o} className="ligne-objet">
        <Icone objet={o} petite />
        <span className="ligne-milieu">
          <NomObjet objet={o} className="ligne-nom" />
          <span className="ligne-stats">{resume(o)}</span>
          <Provenance o={o} etat={etat} className="ligne-src" />
        </span>
      </Survol>
      <span className="ligne-droite">
        {porte && <span className="badge porte">Porté</span>}
        {!porte && choisi && <span className="badge">Choisi</span>}
        {mieux && !trop && <span className="badge mieux">▲ Mieux que le tien</span>}
        {avecEmplacement && <span className="ligne-emp">{libelleCourt(o.emplacement, classe.relique?.nom)} · iLvl {o.ilvl}</span>}
        <span className="ligne-niv">niv. {o.niveau}{trop ? ' requis' : ''}</span>
        <span className={`pastille src-${premiere?.type ?? 'autre'}`}>
          {o.maroquinier ? 'Maroquinier' : porte && premiere?.type === 'autre' ? 'Porté' : labelSource(premiere?.type)}
        </span>
      </span>
    </li>
  );
}

function libelleCourt(e: Emplacement, nomRelique?: string): string {
  if (e === 'arme2m') return 'Deux mains';
  if (e === 'arme1m') return 'Une main';
  if (e === 'relique') return nomRelique ?? EMPLACEMENTS[e];
  return EMPLACEMENTS[e];
}

function labelSource(type: Objet['sources'][number]['type'] | undefined): string {
  const t = type ?? 'autre';
  return { donjon: 'Donjon', raid: 'Raid', quete: 'Quête', metier: 'Métier', rep: 'Réputation', jcj: 'JcJ', vendeur: 'Marchand', monstre: 'Monstre', monde: 'Monde', inconnue: 'Inconnue', autre: 'Autre' }[t];
}
