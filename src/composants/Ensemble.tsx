import { useMemo } from 'react';
import type { Etat } from '../etat.ts';
import { COURT, EMPLACEMENTS, nombre } from '../libelles.ts';
import type { Emplacement, Objet, Stat } from '../types.ts';
import { meilleurEnsemble, passeCommun, sourcesVisibles, valeur, type Case, type Ensemble as TEnsemble } from '../valeur.ts';
import { Icone } from './Icone.tsx';
import { Survol } from './Infobulle.tsx';
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

function Carte({ libelle, objet, droite, etat }: { libelle: string; objet: Objet | null; droite?: boolean; etat: Etat }) {
  if (!objet) {
    return (
      <div className={`case vide${droite ? ' droite' : ''}`}>
        <span className="icone" aria-hidden="true" />
        <div><div className="case-lib">{libelle}</div><div className="case-nom">Rien à ce niveau</div></div>
      </div>
    );
  }
  return (
    <Survol objet={objet} className={`case${droite ? ' droite' : ''}`}>
      <Icone objet={objet} />
      <div>
        <div className="case-lib">{libelle}</div>
        <div className={`case-nom q${objet.q}`}>{objet.nom}</div>
        <div className="case-src">{provenanceCourte(objet, etat)}</div>
      </div>
    </Survol>
  );
}

function Totaux({ ens, etat }: { ens: TEnsemble; etat: Etat }) {
  const t: Partial<Record<Stat, number>> = {};
  let armure = 0;
  for (const o of Object.values(ens)) {
    if (!o) continue;
    armure += o.armure;
    for (const [k, n] of Object.entries(o.stats) as [Stat, number][]) t[k] = (t[k] ?? 0) + n;
  }
  const lignes: [Stat, string][] = [['agi', 'Agilité'], ['for', 'Force'], ['end', 'Endurance'], ['pa', 'Puissance d’attaque'],
    ['crit', 'Score de critique'], ['tou', 'Score de toucher'], ['exp', 'Expertise'], ['hate', 'Score de hâte'], ['def', 'Défense'], ['esq', 'Score d’esquive']];
  const pa = (t.for ?? 0) * 2 + (t.pa ?? 0) + (ens.arme?.arme ? Math.round(ens.arme.arme.dps * 14) : 0);
  return (
    <div className="bilan">
      <h3>Total de l’ensemble</h3>
      <dl>
        {lignes.filter(([k]) => t[k]).map(([k, l]) => (<div key={k}><dt>{l}</dt><dd>+{nombre(t[k] ?? 0)}</dd></div>))}
        <div><dt>Armure des pièces</dt><dd>{nombre(armure + (t.armure ?? 0))}</dd></div>
        {ens.arme?.arme && <div><dt>DPS de l’arme</dt><dd>{nombre(ens.arme.arme.dps, 1)}</dd></div>}
      </dl>
      <p className="note">
        {etat.role === 'chat'
          ? `En félin, la Force et l’arme valent environ ${nombre(pa)} PA, sans compter l’Agilité.`
          : 'En ours, la forme multiplie l’armure : vise l’Endurance et l’armure.'}
      </p>
    </div>
  );
}

export function Ensemble({ objets, etat }: { objets: Objet[]; etat: Etat }) {
  const ens = useMemo(() => meilleurEnsemble(objets, etat), [objets, etat]);
  const choisis = new Set(Object.values(ens).filter(Boolean).map((o) => o!.id));

  return (
    <>
      <section aria-labelledby="h-ens">
        <h2 id="h-ens">Ensemble conseillé au niveau {etat.niveau}</h2>
        <p className="sous-titre">
          Le meilleur objet de chaque emplacement pour un druide {etat.role === 'chat' ? 'félin (dégâts)' : 'ours (tank)'}
          {etat.faction !== 'toutes' ? `, ${etat.faction}` : ''}. Survole un objet pour voir son infobulle.
        </p>
        <div className="fiche">
          <div className="colonne">{GAUCHE.map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} etat={etat} />)}</div>
          <div className="centre">
            <Totaux ens={ens} etat={etat} />
            <Carte libelle="Arme" objet={ens.arme} etat={etat} />
          </div>
          <div className="colonne">{DROITE.map(([c, l]) => <Carte key={c} libelle={l} objet={ens[c]} droite etat={etat} />)}</div>
        </div>
      </section>

      <section aria-labelledby="h-detail">
        <h2 id="h-detail">Emplacement par emplacement</h2>
        <p className="sous-titre">Les meilleurs choix à ton niveau, puis la prochaine amélioration dans les dix niveaux qui viennent.</p>
        <div className="blocs">
          {DETAIL.map(([emps, titre, cases]) => (
            <BlocEmplacement key={titre} titre={titre} emps={emps} objets={objets} etat={etat} choisis={choisis}
              actuel={Math.min(...cases.map((c) => (ens[c] ? valeur(ens[c]!, etat.role) : 0)))} />
          ))}
        </div>
      </section>
    </>
  );
}

function BlocEmplacement({ titre, emps, objets, etat, choisis, actuel }: {
  titre: string; emps: Emplacement[]; objets: Objet[]; etat: Etat; choisis: Set<number>; actuel: number;
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
  if (!maintenant.length && !ensuite) return null;
  return (
    <div className="bloc">
      <header><h3>{titre}</h3><span>{emps.map((e) => EMPLACEMENTS[e]).length > 1 ? 'deux mains ou une main' : ''}</span></header>
      <ul>
        {maintenant.map((o) => <Ligne key={o.id} o={o} choisi={choisis.has(o.id)} etat={etat} />)}
        {ensuite && (<>
          <li className="a-venir-titre">Prochaine amélioration</li>
          <Ligne o={ensuite} choisi={false} etat={etat} />
        </>)}
      </ul>
    </div>
  );
}

export function Ligne({ o, choisi, etat, avecEmplacement }: { o: Objet; choisi: boolean; etat: Etat; avecEmplacement?: boolean }) {
  const trop = o.niveau > etat.niveau;
  const premiere = sourcesVisibles(o, etat)[0];
  return (
    <li className={`ligne${choisi ? ' choisi' : ''}${trop ? ' trop' : ''}`}>
      <Survol objet={o} className="ligne-objet">
        <Icone objet={o} petite />
        <span className="ligne-milieu">
          <span className={`ligne-nom q${o.q}`}>{o.nom}</span>
          <span className="ligne-stats">{resume(o)}</span>
          <span className="ligne-src">{provenanceCourte(o, etat)}</span>
        </span>
      </Survol>
      <span className="ligne-droite">
        {choisi && <span className="badge">Choisi</span>}
        {avecEmplacement && <span className="ligne-emp">{EMPLACEMENTS[o.emplacement]} · iLvl {o.ilvl}</span>}
        <span className="ligne-niv">niv. {o.niveau}{trop ? ' requis' : ''}</span>
        <span className={`pastille src-${premiere?.type ?? 'autre'}`}>{o.maroquinier ? 'Maroquinier' : labelSource(premiere?.type)}</span>
      </span>
    </li>
  );
}

function labelSource(type: Objet['sources'][number]['type'] | undefined): string {
  const t = type ?? 'autre';
  return { donjon: 'Donjon', raid: 'Raid', quete: 'Quête', metier: 'Métier', rep: 'Réputation', jcj: 'JcJ', vendeur: 'Marchand', monde: 'Monde', inconnue: 'Inconnue', autre: 'Autre' }[t];
}
