import { useMemo } from 'react';
import type { Etat } from '../etat.ts';
import { COURT, nombre } from '../libelles.ts';
import type { Emplacement, Objet, Perso, Stat } from '../types.ts';
import {
  comparer, meilleurEnsemble, passeCommun, sourcesVisibles, valeur, valeurPortee,
  type Case, type Ensemble as TEnsemble, type Statut,
} from '../valeur.ts';
import { Icone } from './Icone.tsx';
import { NomObjet, Survol } from './Infobulle.tsx';
import { texteSource } from './sources.ts';

const GAUCHE: [Case, string][] = [['tete', 'Tête'], ['cou', 'Cou'], ['epaules', 'Épaules'], ['dos', 'Dos'], ['torse', 'Torse'], ['poignets', 'Poignets'], ['relique', 'Idole']];
const DROITE: [Case, string][] = [['mains', 'Mains'], ['taille', 'Taille'], ['jambes', 'Jambes'], ['pieds', 'Pieds'], ['doigt1', 'Doigt'], ['doigt2', 'Doigt'], ['bijou1', 'Bijou'], ['bijou2', 'Bijou']];
const DETAIL: [Emplacement[], string, Case[]][] = [
  [['tete'], 'Tête', ['tete']], [['cou'], 'Cou', ['cou']], [['epaules'], 'Épaules', ['epaules']], [['dos'], 'Dos', ['dos']],
  [['torse'], 'Torse', ['torse']], [['poignets'], 'Poignets', ['poignets']], [['mains'], 'Mains', ['mains']],
  [['taille'], 'Taille', ['taille']], [['jambes'], 'Jambes', ['jambes']], [['pieds'], 'Pieds', ['pieds']],
  [['doigt'], 'Doigts', ['doigt1', 'doigt2']], [['bijou'], 'Bijoux', ['bijou1', 'bijou2']],
  [['arme2m', 'arme1m'], 'Arme', ['arme']], [['relique'], 'Idole', ['relique']],
];

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
        <div className="case-src">{provenanceCourte(objet, etat)}</div>
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

function Bilan({ ens, etat, portes }: { ens: TEnsemble; etat: Etat; portes: Objet[] }) {
  const { t, armure } = totaux(Object.values(ens));
  const avant = portes.length ? totaux(portes) : null;
  const lignes: [Stat, string][] = [['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'],
    ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte'], ['def', 'Défense'], ['esq', 'Score d’esquive']];
  const armePortee = portes.find((o) => o.arme);
  const vAvant = portes.reduce((s, o) => s + valeur(o, etat.role), 0);
  const vApres = Object.values(ens).reduce((s, o) => s + (o ? valeur(o, etat.role) : 0), 0);
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
        {ens.arme?.arme && <div><dt>DPS de l’arme</dt>{cellule(armePortee?.arme?.dps, ens.arme.arme.dps, 1)}</div>}
      </dl>
      <p className="note">
        {avant && vAvant > 0 ? `Valeur estimée pour ${etat.role === 'chat' ? 'le félin' : 'l’ours'} : +${nombre(Math.max(0, (vApres - vAvant) / vAvant) * 100)} % en suivant l’ensemble conseillé. ` : ''}
        {etat.role === 'chat'
          ? `En félin, la Force et l’arme valent environ ${nombre(pa)} PA, sans compter l’Agilité.`
          : 'En ours, la forme multiplie l’armure : vise l’Endurance et l’armure.'}
      </p>
    </div>
  );
}

export function Ensemble({ objets, etat, perso, portes }: { objets: Objet[]; etat: Etat; perso: Perso | null; portes: Objet[] }) {
  const ens = useMemo(() => meilleurEnsemble(objets, etat, portes), [objets, etat, portes]);
  const statuts = useMemo(() => comparer(ens, perso, portes, etat.role), [ens, perso, portes, etat.role]);
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
          {perso ? '' : ` pour un druide ${etat.role === 'chat' ? 'félin (dégâts)' : 'ours (tank)'}${etat.faction !== 'toutes' ? `, ${etat.faction}` : ''}. `}
          Survole un objet pour voir son infobulle ; son nom ouvre sa fiche Wowhead.
        </p>
        <div className="fiche">
          <div className="colonne">{GAUCHE.map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} etat={etat} statut={statuts[c]} />)}</div>
          <div className="centre">
            <Bilan ens={ens} etat={etat} portes={portes} />
            <Carte libelle="Arme" objet={ens.arme} etat={etat} statut={statuts.arme} />
          </div>
          <div className="colonne">{DROITE.map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} droite etat={etat} statut={statuts[c]} />)}</div>
        </div>
      </section>

      <section aria-labelledby="h-detail">
        <h2 id="h-detail">Emplacement par emplacement</h2>
        <p className="sous-titre">Les meilleurs choix à ton niveau, puis la prochaine amélioration dans les dix niveaux qui viennent.</p>
        <div className="blocs">
          {DETAIL.map(([emps, titre, cases]) => (
            <BlocEmplacement key={titre} titre={titre} emps={emps} objets={objets} etat={etat} choisis={choisis} portes={portes}
              actuel={Math.min(...cases.map((c) => (ens[c] ? valeur(ens[c]!, etat.role) : 0)))} />
          ))}
        </div>
      </section>
    </>
  );
}

function BlocEmplacement({ titre, emps, objets, etat, choisis, actuel, portes }: {
  titre: string; emps: Emplacement[]; objets: Objet[]; etat: Etat; choisis: Set<number>; actuel: number; portes: Objet[];
}) {
  const { maintenant, ensuite } = useMemo(() => {
    const ici = objets.filter((o) => emps.includes(o.emplacement) && passeCommun(o, etat));
    const tri = (a: Objet, b: Objet) => valeur(b, etat.role) - valeur(a, etat.role);
    const maintenant = ici.filter((o) => o.niveau <= etat.niveau).sort(tri).slice(0, 5);
    const ensuite = ici
      .filter((o) => o.niveau > etat.niveau && o.niveau <= etat.niveau + 10 && valeur(o, etat.role) > actuel)
      .sort((a, b) => a.niveau - b.niveau || tri(a, b))[0];
    return { maintenant, ensuite };
  }, [objets, emps, etat, actuel]);
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
  const trop = o.niveau > etat.niveau;
  const premiere = sourcesVisibles(o, etat)[0];
  const porte = portes.some((p) => p.id === o.id);
  const ref = valeurPortee(portes, o.emplacement, etat.role);
  const mieux = !porte && ref !== null && valeur(o, etat.role) > ref;
  return (
    <li className={`ligne${choisi ? ' choisi' : ''}${trop ? ' trop' : ''}${porte ? ' porte' : ''}`}>
      <Survol objet={o} className="ligne-objet">
        <Icone objet={o} petite />
        <span className="ligne-milieu">
          <NomObjet objet={o} className="ligne-nom" />
          <span className="ligne-stats">{resume(o)}</span>
          <span className="ligne-src">{provenanceCourte(o, etat)}</span>
        </span>
      </Survol>
      <span className="ligne-droite">
        {porte && <span className="badge porte">Porté</span>}
        {!porte && choisi && <span className="badge">Choisi</span>}
        {mieux && !trop && <span className="badge mieux">▲ Mieux que le tien</span>}
        {avecEmplacement && <span className="ligne-emp">{o.emplacement === 'arme2m' ? 'Deux mains' : o.emplacement === 'arme1m' ? 'Une main' : libelleCourt(o.emplacement)} · iLvl {o.ilvl}</span>}
        <span className="ligne-niv">niv. {o.niveau}{trop ? ' requis' : ''}</span>
        <span className={`pastille src-${premiere?.type ?? 'autre'}`}>
          {o.maroquinier ? 'Maroquinier' : porte && premiere?.type === 'autre' ? 'Porté' : labelSource(premiere?.type)}
        </span>
      </span>
    </li>
  );
}

function libelleCourt(e: Emplacement): string {
  return { tete: 'Tête', cou: 'Cou', epaules: 'Épaules', dos: 'Dos', torse: 'Torse', poignets: 'Poignets', mains: 'Mains', taille: 'Taille', jambes: 'Jambes', pieds: 'Pieds', doigt: 'Doigt', bijou: 'Bijou', arme2m: 'Deux mains', arme1m: 'Une main', relique: 'Idole' }[e];
}

function labelSource(type: Objet['sources'][number]['type'] | undefined): string {
  const t = type ?? 'autre';
  return { donjon: 'Donjon', raid: 'Raid', quete: 'Quête', metier: 'Métier', rep: 'Réputation', jcj: 'JcJ', vendeur: 'Marchand', monde: 'Monde', inconnue: 'Inconnue', autre: 'Autre' }[t];
}
